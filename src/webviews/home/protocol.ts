import { IpcNotificationType } from '../protocol';

export interface HomeOperationState {
	kind: 'merge' | 'rebase';
	repository: string;
	current: string;
	incoming: string;
	conflicts: number;
	step?: number;
	total?: number;
}

export interface State {
	welcomeVisible: boolean;
	operation?: HomeOperationState;
	stashCount: number;
}

export interface DidChangeStateParams {
	welcomeVisible: boolean;
	operation?: HomeOperationState;
	stashCount: number;
}
export const DidChangeStateNotificationType = new IpcNotificationType<DidChangeStateParams>(
	'home/didChangeState',
);
