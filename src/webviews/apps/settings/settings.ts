/*global document IntersectionObserver*/
import './settings.scss';
import { State } from '../../settings/protocol';
import { AppWithConfig } from '../shared/appWithConfigBase';
import { DOM } from '../shared/dom';
// import { Snow } from '../shared/snow';

const topOffset = 83;
const storageKeys = {
	filterQuery: 'gitlens:settings:filterQuery',
	collapsedSections: 'gitlens:settings:collapsedSections',
};

export class SettingsApp extends AppWithConfig<State> {
	private _scopes: HTMLSelectElement | null = null;
	private _filterInput: HTMLInputElement | null = null;
	private _filterClear: HTMLAnchorElement | null = null;
	private _filterCount: HTMLElement | null = null;
	private _filterEmpty: HTMLElement | null = null;
	private _observer: IntersectionObserver | undefined;

	private _activeSection: string | undefined = 'general';
	private _sections = new Map<string, boolean>();

	constructor() {
		super('SettingsApp');
	}

	protected override onInitialize() {
		const settingNameTemplate = document.body.dataset.settingNameTemplate ?? 'Setting name: "{name}"';

		// Add scopes if available
		const scopes = document.getElementById('scopes') as HTMLSelectElement;
		if (scopes != null && this.state.scopes.length > 1) {
			for (const [scope, text] of this.state.scopes) {
				const option = document.createElement('option');
				option.value = scope;
				option.innerHTML = text;
				if (this.state.scope === scope) {
					option.selected = true;
				}
				scopes.appendChild(option);
			}

			scopes.parentElement!.parentElement!.classList.remove('hidden');
			this._scopes = scopes;
		}

		this._filterInput = document.getElementById('settings-filter') as HTMLInputElement | null;
		this._filterClear = document.getElementById('settings-filter-clear') as HTMLAnchorElement | null;
		this._filterCount = document.getElementById('settings-filter-count');
		this._filterEmpty = document.getElementById('settings-filter-empty');

		let top = topOffset;
		const header = document.querySelector('.hero__area--sticky');
		if (header != null) {
			top = header.clientHeight;
		}

		this._observer = new IntersectionObserver(this.onObserver.bind(this), {
			rootMargin: `-${top}px 0px 0px 0px`,
		});

		for (const el of document.querySelectorAll('section[id]>.section__header')) {
			this._sections.set(el.parentElement!.id, false);

			this._observer.observe(el);
		}

		this.restoreUiState();
		this.updateBackToTopVisibility();

		for (const el of document.querySelectorAll<HTMLInputElement>('[data-setting]')) {
			if (!el.title && el.type === 'checkbox') {
				el.title = settingNameTemplate.replace('{name}', `gitlens.${el.name}`);
			}

			for (const label of document.querySelectorAll<HTMLLabelElement>(`label[for="${el.id}"]`)) {
				if (!label.title) {
					label.title = settingNameTemplate.replace('{name}', `gitlens.${el.name}`);
				}
			}
		}
	}

	protected override onBind() {
		const disposables = super.onBind?.() ?? [];

		disposables.push(
			DOM.on('.section--collapsible>.section__header', 'click', (e, target: HTMLInputElement) =>
				this.onSectionHeaderClicked(target, e),
			),
			DOM.on('.setting--expandable .setting__expander', 'click', (e, target: HTMLInputElement) =>
				this.onSettingExpanderCicked(target, e),
			),
			DOM.on('a[data-action="jump"]', 'mousedown', e => {
				e.stopPropagation();
				e.preventDefault();
			}),
			DOM.on('a[data-action="jump"]', 'click', (e, target: HTMLAnchorElement) =>
				this.onJumpToLinkClicked(target, e),
			),
			DOM.on('[data-action]', 'mousedown', e => {
				e.stopPropagation();
				e.preventDefault();
			}),
			DOM.on('[data-action]', 'click', (e, target: HTMLAnchorElement) => this.onActionLinkClicked(target, e)),
			DOM.on('#settings-filter', 'input', (_e, target: HTMLInputElement) => this.onFilterChanged(target)),
			DOM.on('#settings-filter', 'keydown', (e, target: HTMLInputElement) => this.onFilterKeydown(e, target)),
			DOM.on('#settings-filter-clear', 'click', e => this.onFilterClear(e)),
			DOM.on(document, 'keydown', e => this.onGlobalKeydown(e)),
			DOM.on(window, 'scroll', () => this.updateBackToTopVisibility()),
			DOM.on('#back-to-top', 'click', e => this.onBackToTop(e)),
		);

		return disposables;
	}

	protected override scrollToAnchor(anchor: string, behavior: ScrollBehavior): void {
		let offset = topOffset;
		const header = document.querySelector('.hero__area--sticky');
		if (header != null) {
			offset = header.clientHeight;
		}

		super.scrollToAnchor(anchor, behavior, offset);
	}

	private onObserver(entries: IntersectionObserverEntry[], _observer: IntersectionObserver) {
		for (const entry of entries) {
			this._sections.set(entry.target.parentElement!.id, entry.isIntersecting);
		}

		let nextActive: string | undefined;
		for (const [id, visible] of this._sections.entries()) {
			if (visible) {
				nextActive = id;

				break;
			}
		}

		if (nextActive === undefined) {
			if (entries.length !== 1) return;

			const entry = entries[0];
			if (entry.boundingClientRect == null || entry.rootBounds == null) return;

			nextActive = entry.target.parentElement!.id;
			if (entry.boundingClientRect.top >= entry.rootBounds.bottom) {
				const keys = [...this._sections.keys()];
				const index = keys.indexOf(nextActive);
				if (index <= 0) return;

				nextActive = keys[index - 1];
			}
		}

		if (this._activeSection === nextActive) return;

		if (this._activeSection !== undefined) {
			this.toggleJumpLink(this._activeSection, false);
		}

		this._activeSection = nextActive;
		this.toggleJumpLink(this._activeSection, true);
	}

	protected override getSettingsScope(): 'user' | 'workspace' {
		return this._scopes != null
			? (this._scopes.options[this._scopes.selectedIndex].value as 'user' | 'workspace')
			: 'user';
	}

	private onActionLinkClicked(element: HTMLElement, e: MouseEvent) {
		switch (element.dataset.action) {
			case 'collapse':
				for (const el of document.querySelectorAll('.section--collapsible')) {
					el.classList.add('collapsed');
				}

				document.querySelector('[data-action="collapse"]')!.classList.add('hidden');
				document.querySelector('[data-action="expand"]')!.classList.remove('hidden');
				this.persistCollapsedSections();
				break;

			case 'expand':
				for (const el of document.querySelectorAll('.section--collapsible')) {
					el.classList.remove('collapsed');
				}

				document.querySelector('[data-action="collapse"]')!.classList.remove('hidden');
				document.querySelector('[data-action="expand"]')!.classList.add('hidden');
				this.persistCollapsedSections();
				break;
		}

		e.preventDefault();
		e.stopPropagation();
	}

	private onFilterChanged(input: HTMLInputElement) {
		this.applyFilter(input.value);
	}

	private onFilterClear(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (this._filterInput == null) return;

		this._filterInput.value = '';
		this.applyFilter('');
		this._filterInput.focus();
	}

	private onFilterKeydown(e: KeyboardEvent, input: HTMLInputElement) {
		if (e.key === 'Escape') {
			if (input.value.length !== 0) {
				input.value = '';
				this.applyFilter('');
			}
			e.preventDefault();
			e.stopPropagation();
		}
	}

	private onGlobalKeydown(e: KeyboardEvent) {
		if (this._filterInput == null) return;

		const target = e.target as HTMLElement | null;
		if (
			target != null &&
			(target.matches('input, textarea, select') || target.isContentEditable)
		) {
			return;
		}

		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
			this._filterInput.focus();
			this._filterInput.select();
			e.preventDefault();
		}

		if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === '/') {
			this._filterInput.focus();
			this._filterInput.select();
			e.preventDefault();
		}
	}

	protected override onInputSelected(element: HTMLSelectElement) {
		if (element === this._scopes) return;

		super.onInputSelected(element);
	}

	protected onJumpToLinkClicked(element: HTMLAnchorElement, e: MouseEvent) {
		const href = element.getAttribute('href');
		if (href == null) return;

		const anchor = href.substr(1);
		this.scrollToAnchor(anchor, 'smooth');

		e.stopPropagation();
		e.preventDefault();
	}

	private onSectionHeaderClicked(element: HTMLElement, e: MouseEvent) {
		if ((e.target as HTMLElement).matches('a, input, label, i.icon__info')) {
			return;
		}

		element.parentElement!.classList.toggle('collapsed');
		this.persistCollapsedSections();
	}

	private onSettingExpanderCicked(element: HTMLElement, _e: MouseEvent) {
		element.parentElement!.parentElement!.classList.toggle('expanded');
	}

	private toggleJumpLink(anchor: string, active: boolean) {
		const el = document.querySelector(`a.sidebar__jump-link[href="#${anchor}"]`);
		if (el != null) {
			el.classList.toggle('active', active);
		}
	}

	private applyFilter(rawQuery: string) {
		const query = rawQuery.trim().toLowerCase();
		const hasQuery = query.length > 0;
		let visibleSections = 0;
		this.persistFilterQuery(rawQuery);

		if (this._filterClear != null) {
			this._filterClear.classList.toggle('hidden', !hasQuery);
		}

		for (const section of document.querySelectorAll<HTMLElement>('section.section--settings[id]')) {
			const text = (section.textContent ?? '').toLowerCase();
			const matches = !hasQuery || text.includes(query);
			section.classList.toggle('hidden-by-filter', !matches);
			if (matches) {
				visibleSections++;
			}
		}

		for (const link of document.querySelectorAll<HTMLAnchorElement>('a.sidebar__jump-link[href^="#"]')) {
			const targetId = link.getAttribute('href')?.slice(1);
			if (!targetId) continue;

			const section = document.getElementById(targetId);
			const hidden = section?.classList.contains('hidden-by-filter') ?? false;
			link.parentElement?.classList.toggle('hidden-by-filter', hidden);
		}

		if (this._filterCount != null) {
			const template = document.body.dataset.filterResultsTemplate ?? '{count} sections';
			this._filterCount.textContent = template.replace('{count}', String(visibleSections));
			this._filterCount.classList.toggle('hidden', !hasQuery);
		}

		if (this._filterEmpty != null) {
			this._filterEmpty.classList.toggle('hidden', !hasQuery || visibleSections !== 0);
		}
	}

	private onBackToTop(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	private updateBackToTopVisibility() {
		const button = document.getElementById('back-to-top');
		if (button == null) return;

		button.classList.toggle('visible', window.scrollY > 420);
	}

	private persistFilterQuery(query: string) {
		try {
			window.localStorage.setItem(storageKeys.filterQuery, query);
		} catch {}
	}

	private persistCollapsedSections() {
		try {
			const collapsed = [...document.querySelectorAll<HTMLElement>('.section--collapsible.collapsed')]
				.map(el => el.id)
				.filter(Boolean);
			window.localStorage.setItem(storageKeys.collapsedSections, JSON.stringify(collapsed));
		} catch {}
	}

	private restoreUiState() {
		try {
			const rawCollapsed = window.localStorage.getItem(storageKeys.collapsedSections);
			if (rawCollapsed != null) {
				const collapsed = JSON.parse(rawCollapsed) as string[];
				for (const id of collapsed) {
					const section = document.getElementById(id);
					section?.classList.add('collapsed');
				}
			}
		} catch {}

		try {
			const rawFilter = window.localStorage.getItem(storageKeys.filterQuery);
			if (rawFilter != null && this._filterInput != null) {
				this._filterInput.value = rawFilter;
				this.applyFilter(rawFilter);
			}
		} catch {}
	}
}

new SettingsApp();
// requestAnimationFrame(() => new Snow());
