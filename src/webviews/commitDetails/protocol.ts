import { IpcCommandType } from '../protocol';

export interface CommitFileChange {
	path: string;
	originalPath?: string;
	status: string;
	additions: number;
	deletions: number;
	repoPath: string;
	sha: string;
}

export interface State {
	sha: string;
	shortSha: string;
	repoPath: string;
	message: string;
	summary: string;
	body: string;
	author: string;
	email: string;
	avatarUrl: string;
	dateAgo: string;
	dateText: string;
	stats?: { additions: number; deletions: number; changedFiles: number };
	files: CommitFileChange[];
	remoteUrl?: string;
	empty?: boolean;
	/** Whether prev/next navigation has more items */
	hasPrev?: boolean;
	hasNext?: boolean;
}

export interface OpenFileDiffParams {
	sha: string;
	repoPath: string;
	path: string;
	originalPath?: string;
}

export const OpenFileDiffCommandType = new IpcCommandType<OpenFileDiffParams>('commitDetails/openFileDiff');

export interface CopyHashParams {
	sha: string;
}

export const CopyHashCommandType = new IpcCommandType<CopyHashParams>('commitDetails/copyHash');

export interface NavigateParams {
	sha: string;
	repoPath: string;
	direction: 'prev' | 'next';
}

export const NavigateCommandType = new IpcCommandType<NavigateParams>('commitDetails/navigate');

export interface RefreshParams {
	sha: string;
	repoPath: string;
}

export const RefreshCommandType = new IpcCommandType<RefreshParams>('commitDetails/refresh');

/** Official-inspired: copy full commit patch */
export interface CopyPatchParams {
	sha: string;
	repoPath: string;
}
export const CopyPatchCommandType = new IpcCommandType<CopyPatchParams>('commitDetails/copyPatch');

export interface CopyMessageParams {
	message: string;
}
export const CopyMessageCommandType = new IpcCommandType<CopyMessageParams>('commitDetails/copyMessage');

export interface OpenWorkingFileParams {
	repoPath: string;
	path: string;
}
export const OpenWorkingFileCommandType = new IpcCommandType<OpenWorkingFileParams>('commitDetails/openWorkingFile');

export interface RevealInExplorerParams {
	repoPath: string;
	path: string;
}
export const RevealInExplorerCommandType = new IpcCommandType<RevealInExplorerParams>(
	'commitDetails/revealInExplorer',
);
