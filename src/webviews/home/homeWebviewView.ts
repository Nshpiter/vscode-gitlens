import { commands, Disposable, window } from 'vscode';
import type { Container } from '../../container';
import {
	GitReference,
	RepositoryChange,
	RepositoryChangeComparisonMode,
	RepositoryChangeEvent,
} from '../../git/models';
import { SyncedStorageKeys } from '../../storage';
import { WebviewViewBase } from '../webviewViewBase';
import { DidChangeStateNotificationType, HomeOperationState, State } from './protocol';

export class HomeWebviewView extends WebviewViewBase<State> {
	constructor(container: Container) {
		super(container, 'gitlens.views.home', 'home.html', 'Home');
	}

	protected override onInitializing(): Disposable[] {
		return [
			window.onDidChangeActiveTextEditor(() => void this.notifyDidChangeData()),
			this.container.git.onDidChangeRepositories(() => void this.notifyDidChangeData()),
			this.container.git.onDidChangeRepository(this.onRepositoryChanged, this),
		];
	}

	override show(options?: { preserveFocus?: boolean | undefined }): Promise<void> {
		return super.show(options);
	}

	protected override registerCommands(): Disposable[] {
		return [
			commands.registerCommand(`${this.id}.refresh`, () => this.refresh(), this),
			commands.registerCommand('gitlens.home.toggleWelcome', async () => {
				await this.container.storage.store(
					SyncedStorageKeys.HomeViewWelcomeVisible,
					!this.container.storage.get(SyncedStorageKeys.HomeViewWelcomeVisible, true),
				);

				void this.notifyDidChangeData();
			}),
		];
	}

	protected override includeBootstrap(): Promise<State> {
		return this.getState();
	}

	private onRepositoryChanged(e: RepositoryChangeEvent) {
		if (
			!e.changed(
				RepositoryChange.Status,
				RepositoryChange.Merge,
				RepositoryChange.Rebase,
				RepositoryChange.Heads,
				RepositoryChangeComparisonMode.Any,
			)
		) {
			return;
		}

		void this.notifyDidChangeData();
	}

	private async getState(): Promise<State> {
		return {
			// Personal build: skip marketing welcome panel by default
			welcomeVisible: this.container.storage.get(SyncedStorageKeys.HomeViewWelcomeVisible, false),
			operation: await this.getHomeOperationState(),
			stashCount: await this.getStashCount(),
		};
	}

	private async notifyDidChangeData() {
		if (!this.isReady) return false;

		return this.notify(DidChangeStateNotificationType, await this.getState());
	}

	private async getHomeOperationState(): Promise<HomeOperationState | undefined> {
		const repository = this.container.git.getBestRepository(window.activeTextEditor) ?? this.container.git.openRepositories[0];
		if (repository == null) return undefined;

		const [mergeStatus, rebaseStatus] = await Promise.all([repository.getMergeStatus(), repository.getRebaseStatus()]);
		if (mergeStatus == null && rebaseStatus == null) return undefined;

		const conflicts = (await repository.getStatus())?.conflicts.length ?? 0;

		if (mergeStatus != null) {
			return {
				kind: 'merge',
				repository: repository.formattedName,
				current: this.formatReferenceName(mergeStatus.current),
				incoming: mergeStatus.incoming != null ? this.formatReferenceName(mergeStatus.incoming) : 'MERGE_HEAD',
				conflicts: conflicts,
			};
		}

		if (rebaseStatus == null) return undefined;

		return {
			kind: 'rebase',
			repository: repository.formattedName,
			current: this.formatReferenceName(rebaseStatus.current ?? rebaseStatus.onto),
			incoming: this.formatReferenceName(rebaseStatus.incoming),
			conflicts: conflicts,
			step: rebaseStatus.steps.current.number || undefined,
			total: rebaseStatus.steps.total || undefined,
		};
	}

	private formatReferenceName(ref: Parameters<typeof GitReference.getNameWithoutRemote>[0]) {
		return GitReference.getNameWithoutRemote(ref);
	}

	private async getStashCount(): Promise<number> {
		const repository = this.container.git.getBestRepository(window.activeTextEditor) ?? this.container.git.openRepositories[0];
		if (repository == null) return 0;

		const stash = await repository.getStash();
		return stash?.commits.size ?? 0;
	}
}
