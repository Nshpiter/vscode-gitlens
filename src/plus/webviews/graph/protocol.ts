import { IpcCommandType, IpcNotificationType } from '../../../webviews/protocol';

export type GraphMode = 'all' | 'current';

export interface GraphRef {
	name: string;
	type: 'branch' | 'tag';
	current?: boolean;
}

export interface GraphCommitNode {
	sha: string;
	shortSha: string;
	message: string;
	author: string;
	date: string;
	formattedDate: string;
	parents: string[];
	lane: number;
	refs: GraphRef[];
}

export interface State {
	title: string;
	description: string;
	repoPath?: string;
	currentBranch?: string;
	branchFilter?: string;
	rows: GraphCommitNode[];
	maxLane: number;
	mode: GraphMode;
}

export interface DidChangeStateParams {
	state: State;
}
export const DidChangeStateNotificationType = new IpcNotificationType<DidChangeStateParams>('graph/data/didChange');

export interface OpenCommitParams {
	sha: string;
}
export const OpenCommitCommandType = new IpcCommandType<OpenCommitParams>('graph/commit/open');

export interface UpdateModeParams {
	mode: GraphMode;
}
export const UpdateModeCommandType = new IpcCommandType<UpdateModeParams>('graph/mode/update');

export interface UpdateBranchFilterParams {
	branch?: string;
}
export const UpdateBranchFilterCommandType = new IpcCommandType<UpdateBranchFilterParams>('graph/branchFilter/update');
