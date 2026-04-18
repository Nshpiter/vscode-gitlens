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
