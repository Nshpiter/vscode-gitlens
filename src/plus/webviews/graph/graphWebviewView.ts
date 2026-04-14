'use strict';
import { commands, Disposable, TextEditor, Uri, window } from 'vscode';
import type { ShowQuickCommitCommandArgs } from '../../../commands';
import { Commands } from '../../../constants';
import { Container } from '../../../container';
import type { RepositoriesChangeEvent } from '../../../git/gitProviderService';
import { RepositoryChange, RepositoryChangeComparisonMode, RepositoryChangeEvent } from '../../../git/models';
import { debug } from '../../../system/decorators/log';
import { debounce, Deferrable } from '../../../system/function';
import { IpcMessage, onIpc } from '../../../webviews/protocol';
import { WebviewViewBase } from '../../../webviews/webviewViewBase';
import {
	buildGraphState,
	getRepositoryEtag,
	resolveRepositoryPathFromEditor,
	resolveRepositoryPathFromUri,
} from './graphData';
import {
	DidChangeStateNotificationType,
	GraphMode,
	OpenCommitCommandType,
	State,
	UpdateBranchFilterCommandType,
	UpdateModeCommandType,
} from './protocol';

interface Context {
	repoPath: string | undefined;
	etagRepositories: number | undefined;
	etagRepository: number | undefined;
	mode: GraphMode;
	branchFilter: string | undefined;
}

export class GraphWebviewView extends WebviewViewBase<State> {
	private _bootstraping = true;
	/** The context the webview has */
	private _context: Context;
	/** The context the webview should have */
	private _pendingContext: Partial<Context> | undefined;

	constructor(container: Container) {
		super(container, 'gitlens.views.graph', 'graph.html', 'Commit Graph');

		this._context = {
			repoPath: undefined,
			etagRepositories: 0,
			etagRepository: 0,
			mode: 'all',
			branchFilter: undefined,
		};
	}

	override show(options?: { preserveFocus?: boolean | undefined }): Promise<void> {
		return super.show(options);
	}

	protected override onInitializing(): Disposable[] | undefined {
		this._context = {
			repoPath: undefined,
			etagRepositories: this.container.git.etag,
			etagRepository: 0,
			mode: this._context.mode ?? 'all',
			branchFilter: this._context.branchFilter,
		};

		this.updatePendingEditor(window.activeTextEditor);
		this._context = { ...this._context, ...this._pendingContext };
		this._pendingContext = undefined;

		return [
			window.onDidChangeActiveTextEditor(this.onActiveEditorChanged, this),
			this.container.git.onDidChangeRepositories(this.onRepositoriesChanged, this),
			this.container.git.onDidChangeRepository(this.onRepositoryChanged, this),
		];
	}

	protected override async includeBootstrap(): Promise<State> {
		this._bootstraping = true;

		this._context = { ...this._context, ...this._pendingContext };
		this._pendingContext = undefined;

		return this.getState(this._context);
	}

	protected override registerCommands(): Disposable[] {
		return [
			commands.registerCommand(`${this.id}.refresh`, () => this.refresh(), this),
			commands.registerCommand(`${this.id}.openInTab`, () => this.openInTab(), this),
		];
	}

	protected override onVisibilityChanged(visible: boolean) {
		if (!visible) return;

		if (this._bootstraping) {
			this._bootstraping = false;

			if (this._pendingContext == null || !('repoPath' in this._pendingContext)) {
				return;
			}
		}

		this.updateState();
	}

	protected override onMessageReceived(e: IpcMessage) {
		switch (e.method) {
			case OpenCommitCommandType.method:
				onIpc(OpenCommitCommandType, e, params => {
					const repoPath = this._context.repoPath;
					if (repoPath == null || params.sha == null) return;

					const commandArgs: ShowQuickCommitCommandArgs = {
						repoPath: repoPath,
						sha: params.sha,
					};

					void commands.executeCommand(Commands.ShowQuickCommit, commandArgs);
				});

				break;
			case UpdateModeCommandType.method:
				onIpc(UpdateModeCommandType, e, params => {
					if (this.updatePendingContext({ mode: params.mode, branchFilter: undefined })) {
						this.updateState(true);
					}
				});
				break;
			case UpdateBranchFilterCommandType.method:
				onIpc(UpdateBranchFilterCommandType, e, params => {
					if (this.updatePendingContext({ branchFilter: params.branch })) {
						this.updateState(true);
					}
				});
				break;
		}
	}

	@debug({ args: false })
	private onActiveEditorChanged(editor: TextEditor | undefined) {
		if (!this.updatePendingEditor(editor)) return;

		this.updateState();
	}

	@debug({ args: false })
	private onRepositoriesChanged(e: RepositoriesChangeEvent) {
		const changed = this.updatePendingEditor(window.activeTextEditor);

		if (this.updatePendingContext({ etagRepositories: e.etag }) || changed) {
			this.updateState();
		}
	}

	@debug({ args: false })
	private onRepositoryChanged(e: RepositoryChangeEvent) {
		if (!e.changed(RepositoryChange.Heads, RepositoryChange.Index, RepositoryChangeComparisonMode.Any)) {
			return;
		}

		if (this._context.repoPath !== e.repository.path && this._pendingContext?.repoPath !== e.repository.path) {
			return;
		}

		if (this.updatePendingContext({ etagRepository: e.repository.etag })) {
			this.updateState();
		}
	}

	@debug({ args: false })
	private async getState(current: Context): Promise<State> {
		const state = await buildGraphState(this.container, current.repoPath, current.mode, current.branchFilter);
		this.description = state.repoPath == null ? undefined : state.title;
		return state;
	}

	private openInTab() {
		if (this._context.repoPath == null) return;

		void commands.executeCommand(Commands.ShowGraphPage, this._context.repoPath);
	}

	private updatePendingContext(context: Partial<Context>): boolean {
		let changed = false;
		for (const [key, value] of Object.entries(context)) {
			const current = (this._context as unknown as Record<string, unknown>)[key];
			const currentValue = current as any;
			const nextValue = value as any;
			if (
				current === value ||
				((currentValue instanceof Uri || nextValue instanceof Uri) && currentValue?.toString() === nextValue?.toString())
			) {
				continue;
			}

			if (this._pendingContext == null) {
				this._pendingContext = {};
			}

			(this._pendingContext as Record<string, unknown>)[key] = value;
			changed = true;
		}

		return changed;
	}

	private updatePendingEditor(editor: TextEditor | undefined): boolean {
		const repoPath = resolveRepositoryPathFromEditor(this.container, editor);
		return this.updatePendingContext({
			repoPath: repoPath,
			etagRepository: getRepositoryEtag(this.container, repoPath),
		});
	}

	private updatePendingUri(uri: Uri | undefined): boolean {
		const repoPath = resolveRepositoryPathFromUri(this.container, uri);
		return this.updatePendingContext({
			repoPath: repoPath,
			etagRepository: getRepositoryEtag(this.container, repoPath),
		});
	}

	private _notifyDidChangeStateDebounced: Deferrable<() => void> | undefined = undefined;

	@debug()
	private updateState(immediate: boolean = false) {
		if (!this.isReady || !this.visible) return;

		this.updatePendingEditor(window.activeTextEditor);

		if (immediate) {
			void this.notifyDidChangeState();
			return;
		}

		if (this._notifyDidChangeStateDebounced == null) {
			this._notifyDidChangeStateDebounced = debounce(this.notifyDidChangeState.bind(this), 500);
		}

		this._notifyDidChangeStateDebounced();
	}

	@debug()
	private async notifyDidChangeState() {
		if (!this.isReady || !this.visible) return false;

		this._notifyDidChangeStateDebounced?.cancel();
		if (this._pendingContext == null) return false;

		const context = { ...this._context, ...this._pendingContext };

		return window.withProgress({ location: { viewId: this.id } }, async () => {
			const success = await this.notify(DidChangeStateNotificationType, {
				state: await this.getState(context),
			});
			if (success) {
				this._context = context;
				this._pendingContext = undefined;
			}
		});
	}
}
