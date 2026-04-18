import { commands, env, Uri } from 'vscode';
import { Commands } from '../../constants';
import type { Container } from '../../container';
import { GitCommit } from '../../git/models';
import { executeCommand } from '../../system/command';
import { DiffWithPreviousCommandArgs } from '../../commands/diffWithPrevious';
import { WebviewBase } from '../webviewBase';
import type { IpcMessage } from '../protocol';
import { onIpc } from '../protocol';
import type { CommitFileChange, State } from './protocol';
import { CopyHashCommandType, NavigateCommandType, OpenFileDiffCommandType, RefreshCommandType } from './protocol';

export class CommitDetailsWebview extends WebviewBase<State> {
	private _pendingCommit: GitCommit | undefined;

	constructor(container: Container) {
		super(
			container,
			'gitlens.commitDetails',
			'commitDetails.html',
			'images/gitlens-icon.png',
			'Commit Details',
			Commands.ShowCommitDetailsPage,
		);
	}

	protected override onShowCommand(arg?: GitCommit | { commit?: GitCommit }): void {
		let commit: GitCommit | undefined;
		if (arg != null) {
			if ((arg as any).commit instanceof GitCommit) {
				commit = (arg as any).commit;
			} else if (arg instanceof GitCommit) {
				commit = arg;
			} else if ((arg as any).sha != null && (arg as any).author != null) {
				commit = arg as GitCommit;
			}
		}
		if (commit != null) {
			this._pendingCommit = commit;
			this.title = `提交 · ${commit.shortSha}`;
		}
		void this.show();
	}

	protected override async includeBootstrap(): Promise<State> {
		try {
			return await this.buildState();
		} catch (ex) {
			console.error('CommitDetails includeBootstrap failed', ex);
			return this.emptyState();
		}
	}

	private emptyState(): State {
		return {
			sha: '',
			shortSha: '',
			repoPath: '',
			message: '',
			summary: '',
			body: '',
			author: '',
			email: '',
			avatarUrl: '',
			dateAgo: '',
			dateText: '',
			files: [],
			empty: true,
		};
	}

	private async buildState(): Promise<State> {
		const commit = this._pendingCommit;
		if (commit == null) {
			return this.emptyState();
		}

		if (commit.message == null || commit.files == null) {
			await commit.ensureFullDetails();
		}

		let avatarUri: Uri | undefined;
		try {
			const uri = await commit.getAvatarUri({
				defaultStyle: this.container.config.defaultGravatarsStyle,
				size: 64,
			});
			avatarUri = uri;
		} catch {
			avatarUri = undefined;
		}

		const files: CommitFileChange[] = (commit.files ?? []).map(f => ({
			path: f.path,
			originalPath: f.originalPath,
			status: f.status,
			additions: f.stats?.additions ?? 0,
			deletions: f.stats?.deletions ?? 0,
			repoPath: f.repoPath,
			sha: commit.sha,
		}));

		const stats = commit.stats;
		const message = commit.message ?? commit.summary ?? '';
		const newlineIdx = message.indexOf('\n');
		const summary = newlineIdx > 0 ? message.substring(0, newlineIdx) : message;
		const body = newlineIdx > 0 ? message.substring(newlineIdx + 1).trim() : '';

		let remoteUrl: string | undefined;
		try {
			const remotes = await this.container.git.getRemotesWithProviders(commit.repoPath);
			const defaultRemote = remotes.find(r => r.default) ?? remotes[0];
			if (defaultRemote?.provider?.url != null) {
				remoteUrl = defaultRemote.provider.url({ type: 'commit' as any, sha: commit.sha } as any);
			}
		} catch {
			remoteUrl = undefined;
		}

		return {
			sha: commit.sha,
			shortSha: commit.shortSha,
			repoPath: commit.repoPath,
			message: message,
			summary: summary,
			body: body,
			author: commit.author.name,
			email: commit.author.email ?? '',
			avatarUrl: avatarUri?.toString() ?? '',
			dateAgo: commit.author.fromNow(),
			dateText: commit.author.formatDate(this.container.config.defaultDateFormat),
			stats:
				stats != null
					? {
							additions: stats.additions ?? 0,
							deletions: stats.deletions ?? 0,
							changedFiles:
								typeof stats.changedFiles === 'number'
									? stats.changedFiles
									: (stats.changedFiles?.added ?? 0) +
									  (stats.changedFiles?.changed ?? 0) +
									  (stats.changedFiles?.deleted ?? 0),
					  }
					: undefined,
			files: files,
			remoteUrl: remoteUrl,
		};
	}

	protected override onMessageReceived(e: IpcMessage): void {
		switch (e.method) {
			case OpenFileDiffCommandType.method:
				onIpc(OpenFileDiffCommandType, e, params => {
					void this.openFileDiff(params.sha, params.repoPath, params.path, params.originalPath);
				});
				break;
			case CopyHashCommandType.method:
				onIpc(CopyHashCommandType, e, params => {
					void env.clipboard.writeText(params.sha);
				});
				break;
			case NavigateCommandType.method:
				onIpc(NavigateCommandType, e, params => {
					void this.navigate(params.sha, params.repoPath, params.direction);
				});
				break;
			case RefreshCommandType.method:
				onIpc(RefreshCommandType, e, params => {
					void this.refreshCommit(params.sha, params.repoPath);
				});
				break;
		}
	}

	private async navigate(sha: string, repoPath: string, direction: 'prev' | 'next'): Promise<void> {
		try {
			const log = await this.container.git.getLog(repoPath, { limit: 200 });
			if (log?.commits == null) return;
			const shas = Array.from(log.commits.keys());
			const idx = shas.indexOf(sha);
			if (idx < 0) return;
			const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
			if (targetIdx < 0 || targetIdx >= shas.length) return;
			const target = log.commits.get(shas[targetIdx]);
			if (target == null) return;
			this._pendingCommit = target;
			this.title = `提交 · ${target.shortSha}`;
			await this.refresh();
		} catch (ex) {
			console.error('navigate failed', ex);
		}
	}

	private async refreshCommit(sha: string, repoPath: string): Promise<void> {
		try {
			const commit = await this.container.git.getCommit(repoPath, sha);
			if (commit == null) return;
			this._pendingCommit = commit;
			await this.refresh();
		} catch (ex) {
			console.error('refreshCommit failed', ex);
		}
	}

	private async openFileDiff(sha: string, repoPath: string, path: string, originalPath?: string): Promise<void> {
		try {
			const commit = await this.container.git.getCommit(repoPath, sha);
			if (commit == null) return;

			const args: DiffWithPreviousCommandArgs = {
				commit: commit,
				uri: Uri.file(`${repoPath}/${originalPath ?? path}`),
				line: 0,
				showOptions: { preserveFocus: false, preview: true },
			};
			await executeCommand(Commands.DiffWithPrevious, undefined, args);
		} catch (ex) {
			console.error('openFileDiff failed', ex);
		}
	}
}
