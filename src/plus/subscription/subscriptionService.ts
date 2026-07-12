import { commands, Disposable, Event, EventEmitter } from 'vscode';
import { configuration } from '../../configuration';
import { Commands, ContextKeys } from '../../constants';
import type { Container } from '../../container';
import { setContext } from '../../context';
import {
	getSubscriptionPlan,
	Subscription,
	SubscriptionPlanId,
	SubscriptionState,
} from '../../subscription';
import { log } from '../../system/decorators/log';
import { once } from '../../system/event';

export interface SubscriptionChangeEvent {
	readonly current: Subscription;
	readonly previous: Subscription;
	readonly etag: number;
}

/**
 * Personal build: all Plus features are always unlocked.
 * No network auth, no trial UI, no GitKraken account integration.
 */
export class SubscriptionService implements Disposable {
	private _onDidChange = new EventEmitter<SubscriptionChangeEvent>();
	get onDidChange(): Event<SubscriptionChangeEvent> {
		return this._onDidChange.event;
	}

	private _disposable: Disposable;
	private _subscription: Subscription;
	private _etag: number = Date.now();

	constructor(private readonly container: Container) {
		this._subscription = createUnlockedSubscription();
		this._disposable = Disposable.from(once(container.onReady)(this.onReady, this));
		void this.updateContext();
	}

	dispose(): void {
		this._disposable.dispose();
	}

	get etag(): number {
		return this._etag;
	}

	private onReady() {
		this._disposable = Disposable.from(this._disposable, ...this.registerCommands());
		void this.updateContext();
	}

	private registerCommands(): Disposable[] {
		// Keep command ids so package.json / menus don't throw "command not found".
		return [
			commands.registerCommand(Commands.PlusLearn, () => undefined),
			commands.registerCommand(Commands.PlusLoginOrSignUp, () => this.loginOrSignUp()),
			commands.registerCommand(Commands.PlusLogout, () => this.logout()),
			commands.registerCommand(Commands.PlusStartPreviewTrial, () => this.startPreviewTrial()),
			commands.registerCommand(Commands.PlusManage, () => this.manage()),
			commands.registerCommand(Commands.PlusPurchase, () => this.purchase()),
			commands.registerCommand(Commands.PlusResendVerification, () => this.resendVerification()),
			commands.registerCommand(Commands.PlusValidate, () => this.validate()),
			commands.registerCommand(Commands.PlusShowPlans, () => undefined),
			commands.registerCommand(Commands.PlusHide, () =>
				configuration.updateEffective('plusFeatures.enabled', false),
			),
			commands.registerCommand(Commands.PlusRestore, () =>
				configuration.updateEffective('plusFeatures.enabled', true),
			),
			commands.registerCommand('gitlens.plus.reset', () => this.logout()),
		];
	}

	getSubscription(): Promise<Subscription> {
		return Promise.resolve(this._subscription);
	}

	@log()
	loginOrSignUp(): Promise<boolean> {
		return Promise.resolve(true);
	}

	@log()
	logout(_reset: boolean = false): void {
		// Personal build stays unlocked; no-op.
	}

	@log()
	manage(): void {
		// no-op
	}

	@log()
	purchase(): Promise<void> {
		return Promise.resolve();
	}

	@log()
	resendVerification(): Promise<void> {
		return Promise.resolve();
	}

	@log()
	startPreviewTrial(): Promise<void> {
		return Promise.resolve();
	}

	@log()
	validate(): Promise<void> {
		return Promise.resolve();
	}

	@log()
	showHomeView(_silent: boolean = false): Promise<void> {
		// Intentionally empty — home opens only when user requests it.
		return Promise.resolve();
	}

	private updateContext(): Promise<void> {
		void setContext(ContextKeys.PlusAllowed, true);
		void setContext(ContextKeys.PlusRequired, false);
		void setContext(ContextKeys.Plus, SubscriptionPlanId.Enterprise);
		void setContext(ContextKeys.PlusState, SubscriptionState.Paid);
		return Promise.resolve();
	}
}

function createUnlockedSubscription(): Subscription {
	return {
		plan: {
			actual: getSubscriptionPlan(SubscriptionPlanId.Enterprise),
			effective: getSubscriptionPlan(SubscriptionPlanId.Enterprise),
		},
		account: {
			id: 'personal',
			name: 'Personal',
			email: undefined,
			verified: true,
		},
		state: SubscriptionState.Paid,
	};
}
