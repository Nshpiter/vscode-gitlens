'use strict';
import './graph.scss';
import {
	DidChangeStateNotificationType,
	GraphCommitNode,
	GraphMode,
	GraphRef,
	OpenCommitCommandType,
	State,
	UpdateBranchFilterCommandType,
	UpdateModeCommandType,
} from '../../../../plus/webviews/graph/protocol';
import { IpcMessage, onIpc } from '../../../protocol';
import { App } from '../../shared/appBase';

const svgNs = 'http://www.w3.org/2000/svg';
type LayoutMode = 'full' | 'compact' | 'dense';

interface LayoutMetrics {
	rowHeight: number;
	laneWidth: number;
	lanePadding: number;
	nodeRadius: number;
}

interface ViewFilters {
	hideTags: boolean;
	dimMerges: boolean;
}

const lanePalette = [
	'var(--vscode-charts-blue)',
	'var(--vscode-charts-green)',
	'var(--vscode-charts-orange)',
	'var(--vscode-charts-purple)',
	'var(--vscode-charts-yellow)',
	'var(--vscode-charts-red)',
	'var(--vscode-charts-foreground)',
	'var(--vscode-charts-lines)',
];

/** Visible-region rendering buffer (rows above/below viewport) */
const overscan = 10;
/** Search input debounce in ms */
const searchDebounceMs = 200;

export class GraphApp extends App<State> {
	private controlsBound = false;
	private layoutMode: LayoutMode = 'full';
	private layoutObserver: ResizeObserver | undefined;
	private searchQuery = '';
	private searchTimer: ReturnType<typeof setTimeout> | undefined;
	private readonly viewFilters: ViewFilters = {
		hideTags: false,
		dimMerges: false,
	};

	/** Cached filtered rows for the current state + search */
	private currentRows: GraphCommitNode[] = [];
	/** Currently rendered row index range */
	private renderedRange: { start: number; end: number } = { start: 0, end: 0 };
	/** Scroll container reference */
	private $scrollContainer: HTMLElement | null = null;
	/** AbortController for scroll listener lifecycle management */
	private scrollAbortController: AbortController | undefined;

	constructor() {
		super('GraphApp');
	}

	protected override onInitialize() {
		this.bindControls();
		this.bindLayout();
		this.updateState();
	}

	protected override onMessageReceived(e: MessageEvent) {
		const msg = e.data as IpcMessage;

		switch (msg.method) {
			case DidChangeStateNotificationType.method:
				this.log(`${this.appName}.onMessageReceived(${msg.id}): name=${msg.method}`);

				onIpc(DidChangeStateNotificationType, msg, params => {
					this.state = params.state;
					this.updateState();
				});

				break;

			default:
				super.onMessageReceived?.(e);
				break;
		}
	}

	private updateState(): void {
		const rows = this.state?.rows ?? [];
		const displayRows = this.getDisplayRows(rows);
		const filteredRows = filterRows(displayRows, this.searchQuery);

		this.currentRows = filteredRows;

		setTextBinding('summary', getSummaryText(filteredRows.length, rows.length, this.searchQuery, this.layoutMode));
		this.updateToolbar();

		const $empty = document.getElementById('empty') as HTMLDivElement;
		const $graph = document.getElementById('graph') as HTMLDivElement;

		if (rows.length === 0) {
			setTextBinding('empty', resolveI18n('graph.noCommits'));
			$empty.classList.remove('hidden');
			$graph.classList.add('hidden');
			clearElement(document.getElementById('graph-svg'));
			clearElement(document.getElementById('graph-list'));
			return;
		}

		if (filteredRows.length === 0) {
			setTextBinding('empty', `${resolveI18n('graph.noMatch')}`);
			$empty.classList.remove('hidden');
			$graph.classList.add('hidden');
			clearElement(document.getElementById('graph-svg'));
			clearElement(document.getElementById('graph-list'));
			return;
		}

		$empty.classList.add('hidden');
		$graph.classList.remove('hidden');

		this.renderGraphVirtualized(
			filteredRows,
			filteredRows.reduce((max, row) => (row.lane > max ? row.lane : max), 0),
		);
	}

	/**
	 * Renders the SVG graph in full (lightweight vector nodes) and
	 * only materializes DOM rows inside/near the visible viewport.
	 */
	private renderGraphVirtualized(rows: GraphCommitNode[], maxLane: number): void {
		const metrics = getLayoutMetrics(this.layoutMode);
		const $svgContainer = document.getElementById('graph-svg') as HTMLDivElement;
		const $listContainer = document.getElementById('graph-list') as HTMLDivElement;

		clearElement($svgContainer);
		clearElement($listContainer);

		const graphWidth = Math.max(44, metrics.lanePadding * 2 + (maxLane + 1) * metrics.laneWidth);
		const graphHeight = rows.length * metrics.rowHeight;

		// -- SVG: render all edges + nodes (SVG is efficient for thousands of simple shapes) --
		const $svg = document.createElementNS(svgNs, 'svg');
		$svg.setAttribute('width', String(graphWidth));
		$svg.setAttribute('height', String(graphHeight));
		$svg.setAttribute('viewBox', `0 0 ${graphWidth} ${graphHeight}`);

		const rowBySha = new Map<string, { row: GraphCommitNode; index: number }>();
		for (let i = 0; i < rows.length; i++) {
			rowBySha.set(rows[i].sha, { row: rows[i], index: i });
		}

		// Edges
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const x1 = metrics.lanePadding + row.lane * metrics.laneWidth;
			const y1 = i * metrics.rowHeight + metrics.rowHeight / 2;

			for (const parentSha of row.parents) {
				const parent = rowBySha.get(parentSha);
				if (parent == null) continue;

				const x2 = metrics.lanePadding + parent.row.lane * metrics.laneWidth;
				const y2 = parent.index * metrics.rowHeight + metrics.rowHeight / 2;

				if (x1 === x2) {
					const $line = document.createElementNS(svgNs, 'line');
					$line.setAttribute('x1', String(x1));
					$line.setAttribute('y1', String(y1));
					$line.setAttribute('x2', String(x2));
					$line.setAttribute('y2', String(y2));
					$line.setAttribute('class', 'graph-edge');
					$line.style.setProperty('--graph-accent', getLaneColor(row.lane));
					$svg.appendChild($line);
					continue;
				}

				const curve = Math.max(10, Math.min(20, Math.abs(y2 - y1) / 3));
				const $path = document.createElementNS(svgNs, 'path');
				$path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${y1 + curve}, ${x2} ${y2 - curve}, ${x2} ${y2}`);
				$path.setAttribute(
					'class',
					`graph-edge${row.parents.length > 1 ? ' graph-edge--merge' : ''}${
						this.viewFilters.dimMerges && row.parents.length > 1 ? ' graph-edge--dim' : ''
					}`,
				);
				$path.style.setProperty('--graph-accent', getLaneColor(row.lane));
				$svg.appendChild($path);
			}
		}

		// Nodes (use data-sha for event delegation instead of per-node listeners)
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const x = metrics.lanePadding + row.lane * metrics.laneWidth;
			const y = i * metrics.rowHeight + metrics.rowHeight / 2;

			const $node = document.createElementNS(svgNs, 'circle');
			$node.setAttribute('cx', String(x));
			$node.setAttribute('cy', String(y));
			$node.setAttribute('r', String(metrics.nodeRadius));
			$node.setAttribute(
				'class',
				`graph-node${row.parents.length > 1 ? ' graph-node--merge' : ''}${
					this.viewFilters.dimMerges && row.parents.length > 1 ? ' graph-node--dim' : ''
				}`,
			);
			$node.style.setProperty('--graph-accent', getLaneColor(row.lane));
			$node.dataset.sha = row.sha;

			const $title = document.createElementNS(svgNs, 'title');
			$title.textContent = `${row.shortSha} ${row.message}`;
			$node.appendChild($title);

			$svg.appendChild($node);
		}

		// Single delegated click listener on SVG (created fresh each render, so no leak)
		$svg.addEventListener('click', e => {
			const target = e.target as SVGElement;
			const sha = target?.dataset?.sha;
			if (sha) this.openCommit(sha);
		});

		$svgContainer.style.minWidth = `${graphWidth}px`;
		$svgContainer.appendChild($svg);

		// -- List: virtual scroll via a sentinel spacer + visible-range rendering --
		const totalListHeight = rows.length * metrics.rowHeight;
		$listContainer.style.height = `${totalListHeight}px`;
		$listContainer.style.position = 'relative';

		// NOTE: $listContainer click listener is bound in bindControls() to avoid
		// accumulating duplicate listeners on every re-render (clearElement only
		// removes children, not listeners on the container itself).

		this.renderedRange = { start: 0, end: 0 };
		this.$scrollContainer = document.getElementById('graph');

		// Initial render of visible rows
		this.renderVisibleRows(rows, metrics);

		// Attach scroll listener for virtual scrolling (abort previous listener to prevent leaks)
		this.scrollAbortController?.abort();
		this.scrollAbortController = new AbortController();
		if (this.$scrollContainer != null) {
			this.$scrollContainer.addEventListener('scroll', () => {
				this.renderVisibleRows(rows, metrics);
			}, { passive: true, signal: this.scrollAbortController.signal });
		}
	}

	private renderVisibleRows(rows: GraphCommitNode[], metrics: LayoutMetrics): void {
		const $listContainer = document.getElementById('graph-list');
		if ($listContainer == null || this.$scrollContainer == null) return;

		const scrollTop = this.$scrollContainer.scrollTop;
		const viewHeight = this.$scrollContainer.clientHeight;

		const startIdx = Math.max(0, Math.floor(scrollTop / metrics.rowHeight) - overscan);
		const endIdx = Math.min(rows.length, Math.ceil((scrollTop + viewHeight) / metrics.rowHeight) + overscan);

		// Skip re-render if range hasn't changed
		if (startIdx === this.renderedRange.start && endIdx === this.renderedRange.end) return;

		this.renderedRange = { start: startIdx, end: endIdx };

		// Clear and re-render only visible rows
		clearElement($listContainer);

		// Top spacer
		if (startIdx > 0) {
			const spacerTop = document.createElement('div');
			spacerTop.style.height = `${startIdx * metrics.rowHeight}px`;
			$listContainer.appendChild(spacerTop);
		}

		for (let i = startIdx; i < endIdx; i++) {
			const row = rows[i];
			const $row = document.createElement('button');
			$row.className = `graph-row${this.viewFilters.dimMerges && row.parents.length > 1 ? ' graph-row--merge-dim' : ''}`;
			$row.type = 'button';
			$row.title = `${row.shortSha} ${row.message}`;
			$row.dataset.sha = row.sha;
			$row.style.setProperty('--graph-accent', getLaneColor(row.lane));

			const $sha = document.createElement('span');
			$sha.className = 'graph-row__sha';
			$sha.textContent = row.shortSha;

			const $message = document.createElement('span');
			$message.className = 'graph-row__message';
			$message.textContent = row.message;

			$row.appendChild($sha);
			$row.appendChild($message);

			if (row.refs.length !== 0) {
				const $refs = document.createElement('span');
				$refs.className = 'graph-row__refs';
				appendRefs($refs, row.refs.slice(0, 2), ref => this.onRefClicked(ref));
				$row.appendChild($refs);
			}

			const $meta = document.createElement('span');
			$meta.className = 'graph-row__meta';
			$meta.textContent = `${row.author} · ${row.formattedDate}`;

			$row.appendChild($meta);
			$listContainer.appendChild($row);
		}

		// Bottom spacer
		const remaining = rows.length - endIdx;
		if (remaining > 0) {
			const spacerBottom = document.createElement('div');
			spacerBottom.style.height = `${remaining * metrics.rowHeight}px`;
			$listContainer.appendChild(spacerBottom);
		}
	}

	private openCommit(sha: string) {
		if (!sha) return;
		this.sendCommand(OpenCommitCommandType, { sha: sha });
	}

	private getDisplayRows(rows: GraphCommitNode[]): GraphCommitNode[] {
		if (!this.viewFilters.hideTags) return rows;

		return rows.map(row => ({
			...row,
			refs: row.refs.filter(ref => ref.type !== 'tag'),
		}));
	}

	private onRefClicked(ref: GraphRef): void {
		if (ref.type === 'branch') {
			const branch = this.state?.branchFilter === ref.name ? undefined : ref.name;
			this.sendCommand(UpdateBranchFilterCommandType, { branch: branch });
			this.closeFilterPanel();
			return;
		}

		this.searchQuery = this.searchQuery === ref.name ? '' : ref.name;
		this.closeFilterPanel();
		this.updateState();
	}

	private bindControls(): void {
		if (this.controlsBound) return;
		this.controlsBound = true;

		const $search = document.getElementById('search') as HTMLInputElement | null;
		$search?.addEventListener('input', () => {
			// Debounced search to avoid full re-render on every keystroke
			if (this.searchTimer != null) {
				clearTimeout(this.searchTimer);
			}
			this.searchTimer = setTimeout(() => {
				this.searchQuery = $search.value.trim();
				this.updateState();
			}, searchDebounceMs);
		});

		const $filterToggle = document.getElementById('filter-toggle') as HTMLButtonElement | null;
		$filterToggle?.addEventListener('click', e => {
			e.stopPropagation();
			this.toggleFilterPanel();
		});

		this.bindScopeOption('all');
		this.bindScopeOption('current');

		const $hideTags = document.getElementById('hide-tags') as HTMLInputElement | null;
		$hideTags?.addEventListener('change', () => {
			this.viewFilters.hideTags = $hideTags.checked;
			this.updateToolbar();
			this.updateState();
		});

		const $dimMerges = document.getElementById('dim-merges') as HTMLInputElement | null;
		$dimMerges?.addEventListener('change', () => {
			this.viewFilters.dimMerges = $dimMerges.checked;
			this.updateToolbar();
			this.updateState();
		});

		const $clearBranchFilter = document.getElementById('branch-filter-clear') as HTMLButtonElement | null;
		$clearBranchFilter?.addEventListener('click', e => {
			e.stopPropagation();
			this.sendCommand(UpdateBranchFilterCommandType, { branch: undefined });
			this.closeFilterPanel();
		});

		document.addEventListener('click', e => {
			const target = e.target as Node | null;
			const $panel = document.getElementById('filter-panel');
			const $toggle = document.getElementById('filter-toggle');
			if ($panel == null || $toggle == null || $panel.classList.contains('hidden')) return;
			if ($panel.contains(target) || $toggle.contains(target)) return;

			this.closeFilterPanel();
		});

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') {
				this.closeFilterPanel();
			}
		});

		// Delegated click listener on list container — bound once here (not in renderGraphVirtualized)
		// to avoid accumulating duplicate listeners on every re-render.
		const $listContainer = document.getElementById('graph-list');
		$listContainer?.addEventListener('click', e => {
			const target = (e.target as HTMLElement).closest('.graph-row') as HTMLElement;
			if (target == null) return;
			const sha = target.dataset.sha;
			if (sha) this.openCommit(sha);
		});
	}

	private bindLayout(): void {
		if (this.layoutObserver != null) return;

		const container = document.querySelector<HTMLElement>('.container');
		if (container == null) return;

		this.layoutObserver = new ResizeObserver(entries => {
			const entry = entries[0];
			const borderBoxSize = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : undefined;
			const width =
				borderBoxSize != null
					? Math.floor(borderBoxSize.inlineSize)
					: Math.floor(container.getBoundingClientRect().width);

			const nextLayout = getLayoutMode(width);
			if (nextLayout === this.layoutMode) return;

			this.layoutMode = nextLayout;
			document.body.classList.toggle('is-compact', nextLayout !== 'full');
			document.body.classList.toggle('is-dense', nextLayout === 'dense');
			this.updateState();
		});

		this.layoutObserver.observe(container);

		const initialLayout = getLayoutMode(Math.floor(container.getBoundingClientRect().width));
		this.layoutMode = initialLayout;
		document.body.classList.toggle('is-compact', initialLayout !== 'full');
		document.body.classList.toggle('is-dense', initialLayout === 'dense');
	}

	private bindScopeOption(mode: GraphMode): void {
		const $input = document.getElementById(`scope-${mode}`) as HTMLInputElement | null;
		$input?.addEventListener('change', () => {
			if (!$input.checked) return;
			if (this.state?.mode === mode) return;
			this.sendCommand(UpdateModeCommandType, { mode: mode });
			this.closeFilterPanel();
		});
	}

	private updateToolbar(): void {
		const state = this.state;
		const currentBranch = state?.currentBranch;
		const branchFilter = state?.branchFilter;
		const $search = document.getElementById('search') as HTMLInputElement | null;
		if ($search != null) {
			if ($search.value !== this.searchQuery) {
				$search.value = this.searchQuery;
			}

			$search.disabled = (state?.rows.length ?? 0) === 0;
		}

		const $currentBranch = document.getElementById('current-branch') as HTMLSpanElement | null;
		if ($currentBranch != null) {
			const label = branchFilter ?? currentBranch;
			if (label == null || label.length === 0) {
				$currentBranch.classList.add('hidden');
			} else {
				$currentBranch.textContent =
					branchFilter != null
						? this.layoutMode === 'full'
							? `${resolveI18n('graph.branchPrefix', branchFilter)}`
							: branchFilter
						: this.layoutMode === 'full'
							? `${resolveI18n('graph.currentPrefix', currentBranch ?? '')}`
							: currentBranch ?? '';
				$currentBranch.classList.remove('hidden');
			}
		}

		$search?.setAttribute(
			'placeholder',
			this.layoutMode === 'full'
				? resolveI18n('graph.searchPlaceholder')
				: resolveI18n('graph.searchPlaceholderCompact'),
		);

		this.updateScopeOption('all', state?.mode === 'all', false);
		this.updateScopeOption('current', state?.mode === 'current', currentBranch == null);
		this.updateFilterPanel();
	}

	private updateScopeOption(mode: GraphMode, active: boolean, disabled: boolean): void {
		const $input = document.getElementById(`scope-${mode}`) as HTMLInputElement | null;
		if ($input == null) return;

		$input.checked = active;
		$input.disabled = disabled;
	}

	private updateFilterPanel(): void {
		const state = this.state;
		const branchFilter = state?.branchFilter;
		const $hideTags = document.getElementById('hide-tags') as HTMLInputElement | null;
		const $dimMerges = document.getElementById('dim-merges') as HTMLInputElement | null;
		const $filterToggle = document.getElementById('filter-toggle') as HTMLButtonElement | null;
		const $branchFilter = document.getElementById('branch-filter') as HTMLDivElement | null;
		const $branchFilterName = document.getElementById('branch-filter-name') as HTMLSpanElement | null;

		if ($hideTags != null) {
			$hideTags.checked = this.viewFilters.hideTags;
		}

		if ($dimMerges != null) {
			$dimMerges.checked = this.viewFilters.dimMerges;
		}

		if ($branchFilter != null && $branchFilterName != null) {
			$branchFilter.classList.toggle('hidden', branchFilter == null);
			$branchFilterName.textContent = branchFilter ?? '';
		}

		if ($filterToggle != null) {
			const active =
				state?.mode === 'current' || branchFilter != null || this.viewFilters.hideTags || this.viewFilters.dimMerges;
			$filterToggle.classList.toggle('graph-filters__toggle--active', active);
		}
	}

	private toggleFilterPanel(): void {
		const $panel = document.getElementById('filter-panel') as HTMLDivElement | null;
		const $toggle = document.getElementById('filter-toggle') as HTMLButtonElement | null;
		if ($panel == null || $toggle == null) return;

		const open = $panel.classList.contains('hidden');
		$panel.classList.toggle('hidden', !open);
		$toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
	}

	private closeFilterPanel(): void {
		const $panel = document.getElementById('filter-panel') as HTMLDivElement | null;
		const $toggle = document.getElementById('filter-toggle') as HTMLButtonElement | null;
		if ($panel == null || $toggle == null) return;

		$panel.classList.add('hidden');
		$toggle.setAttribute('aria-expanded', 'false');
	}
}

function clearElement(element: Element | null) {
	if (element == null) return;
	element.innerHTML = '';
}

function setTextBinding(key: string, value: string) {
	const $el = document.querySelector(`[data-bind="${key}"]`);
	if ($el == null) return;
	$el.textContent = value;
}

function appendRefs(container: HTMLElement, refs: GraphRef[], onRefClick: (ref: GraphRef) => void) {
	for (const ref of refs) {
		const $ref = document.createElement('button');
		$ref.className = `graph-ref graph-ref--${ref.type}${ref.current ? ' graph-ref--current' : ''}`;
		$ref.type = 'button';
		$ref.textContent = ref.name;
		$ref.addEventListener('click', e => {
			e.stopPropagation();
			onRefClick(ref);
		});
		container.appendChild($ref);
	}
}

function getLayoutMode(width: number): LayoutMode {
	if (width <= 560) return 'dense';
	if (width <= 860) return 'compact';
	return 'full';
}

function getLayoutMetrics(layout: LayoutMode): LayoutMetrics {
	switch (layout) {
		case 'dense':
			return { rowHeight: 26, laneWidth: 10, lanePadding: 8, nodeRadius: 3 };
		case 'compact':
			return { rowHeight: 28, laneWidth: 12, lanePadding: 10, nodeRadius: 3.5 };
		default:
			return { rowHeight: 30, laneWidth: 14, lanePadding: 12, nodeRadius: 4 };
	}
}

function filterRows(rows: GraphCommitNode[], query: string): GraphCommitNode[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) return rows;

	return rows.filter(row =>
		[
			row.sha,
			row.shortSha,
			row.message,
			row.author,
			row.formattedDate,
			...row.refs.map(ref => ref.name),
		].some(value => value.toLowerCase().includes(normalized)),
	);
}

function getLaneColor(lane: number): string {
	return lanePalette[lane % lanePalette.length];
}

function getSummaryText(filteredCount: number, totalCount: number, query: string, layout: LayoutMode): string {
	if (totalCount === 0) return '';

	if (layout !== 'full') {
		if (query.length === 0) return `${totalCount} commits`;
		return `${filteredCount}/${totalCount}`;
	}

	if (query.length === 0) return resolveI18n('graph.commitsLoaded', String(totalCount));
	return resolveI18n('graph.matchResult', String(filteredCount), String(totalCount), query);
}

/**
 * Resolve i18n placeholder from nls-injected HTML attributes.
 * Falls back to `key` itself if no translation found.
 * Supports positional args: {0}, {1}, ...
 */
function resolveI18n(key: string, ...args: string[]): string {
	const $el = document.querySelector(`[data-i18n="${key}"]`);
	let template = $el?.textContent ?? getFallbackI18n(key);

	for (let i = 0; i < args.length; i++) {
		template = template.replace(`{${i}}`, args[i]);
	}
	return template;
}

/** Hardcoded fallbacks for JS-only i18n keys (not present in HTML) */
const i18nFallbacks: Record<string, string> = {
	'graph.noCommits': 'No commits found.',
	'graph.noMatch': 'No commits match the query.',
	'graph.commitsLoaded': '{0} commits loaded',
	'graph.matchResult': '{0} of {1} commits match "{2}"',
	'graph.branchPrefix': 'Branch: {0}',
	'graph.currentPrefix': 'Current: {0}',
	'graph.searchPlaceholder': 'Filter commits, authors, refs',
	'graph.searchPlaceholderCompact': 'Filter commits',
};

function getFallbackI18n(key: string): string {
	return i18nFallbacks[key] ?? key;
}

new GraphApp();
