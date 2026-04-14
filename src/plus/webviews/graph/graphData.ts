import { Uri } from 'vscode';
import type { Container } from '../../../container';
import type { GitBranch, GitCommit, GitTag } from '../../../git/models';
import { LRUCache } from '../../../system/cache';
import { isTextEditor } from '../../../system/utils';
import type { GraphCommitNode, GraphMode, GraphRef, State } from './protocol';

const defaultGraphLimit = 400;

/** Cache keyed by `${repoPath}:${mode}:${branchFilter}` — avoids re-querying git log on tab focus changes */
const stateCache = new LRUCache<State>(8, 30 * 1000); // 8 entries, 30s TTL

function buildCacheKey(repoPath: string, mode: GraphMode, branchFilter?: string): string {
	return `${repoPath}:${mode}:${branchFilter ?? ''}`;
}

export function resolveRepositoryPathFromUri(container: Container, uri: Uri | undefined): string | undefined {
	if (uri != null) {
		const repository = container.git.getRepository(uri);
		if (repository != null) return repository.path;
	}

	return container.git.openRepositories[0]?.path;
}

export function resolveRepositoryPathFromEditor(
	container: Container,
	editor: { document: { uri: Uri } } | undefined,
): string | undefined {
	if (editor != null && !isTextEditor(editor as any)) {
		return container.git.getBestRepository()?.path;
	}

	return container.git.getBestRepository(editor as any)?.path ?? resolveRepositoryPathFromUri(container, editor?.document.uri);
}

export function getRepositoryEtag(container: Container, repoPath: string | undefined): number {
	if (repoPath == null) return 0;

	const repository = container.git.getRepository(repoPath);
	return repository?.etag ?? 0;
}

export function invalidateGraphCache(repoPath?: string): void {
	if (repoPath == null) {
		stateCache.clear();
	}
	// Targeted invalidation not needed — the 30s TTL handles staleness
}

export async function buildGraphState(
	container: Container,
	repoPath: string | undefined,
	mode: GraphMode = 'all',
	branchFilter?: string,
): Promise<State> {
	if (repoPath == null) {
		return {
			title: 'No repository available',
			description: 'Open a Git repository to visualize commit history.',
			rows: [],
			maxLane: 0,
			branchFilter: branchFilter,
			mode: mode,
		};
	}

	// Check cache first
	const cacheKey = buildCacheKey(repoPath, mode, branchFilter);
	const cached = stateCache.get(cacheKey);
	if (cached != null) return cached;

	const repository = container.git.getRepository(repoPath) ?? container.git.openRepositories[0];
	if (repository == null) {
		return {
			title: 'No repository available',
			description: 'Open a Git repository to visualize commit history.',
			rows: [],
			maxLane: 0,
			branchFilter: branchFilter,
			mode: mode,
		};
	}

	const [{ values: branches }, { values: tags }, currentBranch] = await Promise.all([
		container.git.getBranches(repository.path),
		container.git.getTags(repository.path),
		repository.getBranch(),
	]);

	const selectedBranch = branchFilter ? findBranchByName(branches, branchFilter) : undefined;
	const log = await container.git.getLog(repository.path, {
		all: selectedBranch == null && (mode !== 'current' || currentBranch == null),
		limit: defaultGraphLimit,
		ordering: 'topo',
		ref: selectedBranch?.ref ?? (mode === 'current' ? currentBranch?.ref : undefined),
	});

	if (log == null || log.commits.size === 0) {
		const emptyState: State = {
			title: repository.formattedName,
			description: 'No commits found.',
			repoPath: repository.path,
			currentBranch: currentBranch?.getNameWithoutRemote(),
			branchFilter: selectedBranch?.getNameWithoutRemote(),
			rows: [],
			maxLane: 0,
			mode: mode,
		};
		stateCache.set(cacheKey, emptyState);
		return emptyState;
	}

	const refsBySha = buildRefsBySha(branches, tags, currentBranch?.getNameWithoutRemote());
	const rows = buildGraphRows([...log.commits.values()], refsBySha);
	const maxLane = rows.reduce((max, row) => (row.lane > max ? row.lane : max), 0);
	const scopeLabel =
		selectedBranch != null
			? `Showing latest ${rows.length} commits on ${selectedBranch.getNameWithoutRemote()}`
			: mode === 'current' && currentBranch != null
			? `Showing latest ${rows.length} commits on ${currentBranch.getNameWithoutRemote()}`
			: `Showing latest ${rows.length} commits across all visible branches`;

	const state: State = {
		title: repository.formattedName,
		description: scopeLabel,
		repoPath: repository.path,
		currentBranch: currentBranch?.getNameWithoutRemote(),
		branchFilter: selectedBranch?.getNameWithoutRemote(),
		rows: rows,
		maxLane: maxLane,
		mode: mode,
	};

	stateCache.set(cacheKey, state);
	return state;
}

function buildGraphRows(commits: GitCommit[], refsBySha: Map<string, GraphRef[]>): GraphCommitNode[] {
	const rows: GraphCommitNode[] = [];
	const pendingLaneBySha = new Map<string, number>();
	const visibleShas = new Set(commits.map(commit => commit.sha));

	for (const commit of commits) {
		const lane = pendingLaneBySha.get(commit.sha) ?? findNextFreeLane(new Set(pendingLaneBySha.values()));

		pendingLaneBySha.delete(commit.sha);

		const parents = commit.parents.filter(parent => visibleShas.has(parent));
		if (parents.length !== 0) {
			const [firstParent, ...otherParents] = parents;
			if (firstParent != null && !pendingLaneBySha.has(firstParent)) {
				pendingLaneBySha.set(firstParent, lane);
			}

			const occupiedLanes = new Set(pendingLaneBySha.values());
			for (const parent of otherParents) {
				if (pendingLaneBySha.has(parent)) continue;

				const parentLane = findNextFreeLane(occupiedLanes);
				pendingLaneBySha.set(parent, parentLane);
				occupiedLanes.add(parentLane);
			}
		}

		rows.push({
			sha: commit.sha,
			shortSha: commit.shortSha,
			message: commit.summary,
			author: commit.author.name,
			date: commit.date.toISOString(),
			formattedDate: commit.formattedDate,
			parents: parents,
			lane: lane,
			refs: refsBySha.get(commit.sha) ?? [],
		});
	}

	return rows;
}

function buildRefsBySha(branches: GitBranch[], tags: GitTag[], currentBranchName: string | undefined): Map<string, GraphRef[]> {
	const refsBySha = new Map<string, GraphRef[]>();

	for (const branch of branches) {
		if (branch.sha == null || branch.remote) continue;

		const refs = refsBySha.get(branch.sha) ?? [];
		refs.push({
			name: branch.getNameWithoutRemote(),
			type: 'branch',
			current: branch.current || branch.getNameWithoutRemote() === currentBranchName,
		});
		refsBySha.set(branch.sha, refs);
	}

	for (const tag of tags) {
		const refs = refsBySha.get(tag.sha) ?? [];
		refs.push({
			name: tag.name,
			type: 'tag',
		});
		refsBySha.set(tag.sha, refs);
	}

	for (const refs of refsBySha.values()) {
		refs.sort((a, b) => {
			return (a.current ? -1 : 1) - (b.current ? -1 : 1) || (a.type === 'branch' ? -1 : 1) - (b.type === 'branch' ? -1 : 1) || a.name.localeCompare(b.name);
		});
	}

	return refsBySha;
}

function findBranchByName(branches: GitBranch[], branchName: string): GitBranch | undefined {
	for (const branch of branches) {
		if (branch.remote) continue;
		if (branch.getNameWithoutRemote() === branchName) return branch;
	}

	return undefined;
}

function findNextFreeLane(occupied: Set<number>): number {
	let lane = 0;
	while (occupied.has(lane)) {
		lane++;
	}

	return lane;
}
