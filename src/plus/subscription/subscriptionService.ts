import {
	AuthenticationProviderAuthenticationSessionsChangeEvent,
	AuthenticationSession,
	commands,
	Disposable,
	env,
	Event,
	EventEmitter,
	MessageItem,
	StatusBarItem,
	Uri,
	window,
} from 'vscode';
import { Commands, ContextKeys } from '../../constants';
import type { Container } from '../../container';
import { setContext } from '../../context';
import { RepositoriesChangeEvent } from '../../git/gitProviderService';
import {
	getSubscriptionPlan,
	Subscription,
	SubscriptionPlanId,
	SubscriptionState,
} from '../../subscription';
import { configuration } from '../../configuration';
import { executeCommand } from '../../system/command';
import { createFromDateDelta } from '../../system/date';
import { gate } from '../../system/decorators/gate';
import { debug, log } from '../../system/decorators/log';
import { memoize } from '../../system/decorators/memoize';
import { once } from '../../system/function';
import { openWalkthrough } from '../../system/utils';
import { ensurePlusFeaturesEnabled } from './utils';

export interface SubscriptionChangeEvent {
	readonly current: Subscription;
	readonly previous: Subscription;
	readonly etag: number;
}

export class SubscriptionService implements Disposable {
	private static authenticationProviderId = 'gitlens+';
	private static authenticationScopes = ['gitlens'];

	private _onDidChange = new EventEmitter<SubscriptionChangeEvent>();
	get onDidChange(): Event<SubscriptionChangeEvent> {
		return this._onDidChange.event;
	}

	private _disposable: Disposable;
	private _subscription!: Subscription;
	private _statusBarSubscription: StatusBarItem | undefined;

	constructor(private readonly container: Container) {
		this._disposable = Disposable.from(
			once(container.onReady)(this.onReady, this),
			this.container.subscriptionAuthentication.onDidChangeSessions(
				(e: AuthenticationProviderAuthenticationSessionsChangeEvent) => setTimeout(() => this.onAuthenticationChanged(e), 0),
				this,
			),
		);

		this.changeSubscription(this.getStoredSubscription(), true);
		setTimeout(() => void this.ensureSession(false), 10000);
	}

	dispose(): void {
		this._statusBarSubscription?.dispose();

		this._disposable.dispose();
	}

	private async onAuthenticationChanged(e: AuthenticationProviderAuthenticationSessionsChangeEvent) {
		let session = this._session;
		if (session == null && this._sessionPromise != null) {
			session = await this._sessionPromise;
		}

		if (session != null && e.removed?.some((s: AuthenticationSession) => s.id === session!.id)) {
			this._session = undefined;
			this._sessionPromise = undefined;
			void this.logout();
			return;
		}

		const updated = e.added?.[0] ?? e.changed?.[0];
		if (updated == null) return;

		if (updated.id === session?.id && updated.accessToken === session?.accessToken) {
			return;
		}

		this._session = session;
		void this.validate();
	}

	@memoize()
	private get baseAccountUri(): Uri {
		const { env } = this.container;
		if (env === 'staging') {
			return Uri.parse('https://stagingaccount.gitkraken.com');
		}

		if (env === 'dev') {
			return Uri.parse('https://devaccount.gitkraken.com');
		}

		return Uri.parse('https://account.gitkraken.com');
	}

	@memoize()
	private get baseSiteUri(): Uri {
		const { env } = this.container;
		if (env === 'staging') {
			return Uri.parse('https://staging.gitkraken.com');
		}

		if (env === 'dev') {
			return Uri.parse('https://dev.gitkraken.com');
		}

		return Uri.parse('https://gitkraken.com');
	}

	private _etag: number = 0;
	get etag(): number {
		return this._etag;
	}

	private onReady() {
		this._disposable = Disposable.from(
			this._disposable,
			this.container.git.onDidChangeRepositories(this.onRepositoriesChanged, this),
			...this.registerCommands(),
		);
		this.updateContext();
	}

	private onRepositoriesChanged(_e: RepositoriesChangeEvent): void {
		this.updateContext();
	}

	private registerCommands(): Disposable[] {
		void this.container.viewCommands;

		return [
			commands.registerCommand(Commands.PlusLearn, (openToSide: boolean) => this.learn(openToSide)),
			commands.registerCommand(Commands.PlusLoginOrSignUp, () => this.loginOrSignUp()),
			commands.registerCommand(Commands.PlusLogout, () => this.logout()),

			commands.registerCommand(Commands.PlusStartPreviewTrial, () => this.startPreviewTrial()),
			commands.registerCommand(Commands.PlusManage, () => this.manage()),
			commands.registerCommand(Commands.PlusPurchase, () => this.purchase()),

			commands.registerCommand(Commands.PlusResendVerification, () => this.resendVerification()),
			commands.registerCommand(Commands.PlusValidate, () => this.validate()),

			commands.registerCommand(Commands.PlusShowPlans, () => this.showPlans()),

			commands.registerCommand(Commands.PlusHide, () =>
				configuration.updateEffective('plusFeatures.enabled', false),
			),
			commands.registerCommand(Commands.PlusRestore, () =>
				configuration.updateEffective('plusFeatures.enabled', true),
			),

			commands.registerCommand('gitlens.plus.reset', () => this.logout(true)),
		];
	}

	async getSubscription(): Promise<Subscription> {
		void (await this.ensureSession(false));
		return this._subscription;
	}

	@debug()
	learn(openToSide: boolean = true): void {
		void openWalkthrough(this.container.context.extension.id, 'gitlens.plus', undefined, openToSide);
	}

	@gate()
	@log()
	async loginOrSignUp(): Promise<boolean> {
		await Promise.resolve();
		return true;
	}

	@gate()
	@log()
	logout(reset: boolean = false): void {
		this._sessionPromise = undefined;
		if (this._session != null) {
			void this.container.subscriptionAuthentication.removeSession(this._session.id);
			this._session = undefined;
		}

		if (reset && this.container.debugging) {
			this.changeSubscription(undefined);

			return;
		}

		this.changeSubscription({
			...this._subscription,
			plan: {
				actual: getSubscriptionPlan(SubscriptionPlanId.Free),
				effective: getSubscriptionPlan(SubscriptionPlanId.Free),
			},
			account: undefined,
		});
	}

	@log()
	manage(): void {
		void env.openExternal(this.baseAccountUri);
	}

	@log()
	async purchase(): Promise<void> {
		if (!(await ensurePlusFeaturesEnabled())) return;

		if (this._subscription.account == null) {
			void this.showPlans();
		} else {
			void env.openExternal(
				Uri.joinPath(this.baseAccountUri, 'create-organization').with({ query: 'product=gitlens' }),
			);
		}
		await this.showHomeView();
	}

	@gate()
	@log()
	async resendVerification(): Promise<void> {
		// Do nothing
	}

	@log()
	async showHomeView(silent: boolean = false): Promise<void> {
		if (silent && !configuration.get('plusFeatures.enabled', undefined, true)) return;

		if (!this.container.homeView.visible) {
			await executeCommand(Commands.ShowHomeView);
		}
	}

	private showPlans(): void {
		void env.openExternal(Uri.joinPath(this.baseSiteUri, 'gitlens/pricing'));
	}

	@gate()
	@log()
	async startPreviewTrial(): Promise<void> {
		if (!(await ensurePlusFeaturesEnabled())) return;

		let { plan, previewTrial } = this._subscription;
		if (previewTrial != null || plan.effective.id !== SubscriptionPlanId.Free) {
			void this.showHomeView();

			if (plan.effective.id === SubscriptionPlanId.Free) {
				const confirm: MessageItem = { title: 'Sign in to GitLens+', isCloseAffordance: true };
				const cancel: MessageItem = { title: 'Cancel' };
				const result = await window.showInformationMessage(
					'Your GitLens+ features trial has ended.\nPlease sign in to use GitLens+ features on public repos and get a free 7-day trial for both public and private repos.',
					{ modal: true },
					confirm,
					cancel,
				);

				if (result === confirm) {
					void this.loginOrSignUp();
				}
			}
			return;
		}

		const startedOn = new Date();

		let days;
		let expiresOn = new Date(startedOn);
		if (!this.container.debugging) {
			// Normalize the date to just before midnight on the same day
			expiresOn.setHours(23, 59, 59, 999);
			expiresOn = createFromDateDelta(expiresOn, { days: 3 });
			days = 3;
		} else {
			expiresOn = createFromDateDelta(expiresOn, { minutes: 1 });
			days = 0;
		}

		previewTrial = {
			startedOn: startedOn.toISOString(),
			expiresOn: expiresOn.toISOString(),
		};

		this.changeSubscription({
			...this._subscription,
			plan: {
				...this._subscription.plan,
				effective: getSubscriptionPlan(SubscriptionPlanId.Pro, startedOn, expiresOn),
			},
			previewTrial: previewTrial,
		});

		const confirm: MessageItem = { title: 'OK', isCloseAffordance: true };
		const learn: MessageItem = { title: 'Learn More' };
		const result = await window.showInformationMessage(
			`You have started a ${days} day trial of GitLens+ features for both public and private repos.`,
			{ modal: true },
			confirm,
			learn,
		);

		if (result === learn) {
			void this.learn();
		}
	}

	@gate()
	@log()
	async validate(): Promise<void> {
		await Promise.resolve();
		this.changeSubscription(this._subscription);
	}

	private _sessionPromise: Promise<AuthenticationSession | null> | undefined;
	private _session: AuthenticationSession | null | undefined;

	@gate()
	@debug()
	private async ensureSession(_createIfNeeded: boolean, _force?: boolean): Promise<AuthenticationSession | undefined> {
		await Promise.resolve();
		return {
			id: 'unlocked-session',
			accessToken: 'unlocked-token',
			account: {
				id: 'unlocked',
				label: 'GitLens Unlocked',
			},
			scopes: ['gitlens'],
		};
	}

	@debug()
	private changeSubscription(
		_subscription: Optional<Subscription, 'state'> | undefined,
		silent: boolean = false,
	): void {
		const subscription: Subscription = {
			plan: {
				actual: getSubscriptionPlan(SubscriptionPlanId.Enterprise),
				effective: getSubscriptionPlan(SubscriptionPlanId.Enterprise),
			},
			account: {
				id: 'unlocked',
				name: 'GitLens Unlocked',
				email: 'unlocked@example.com',
				verified: true,
			},
			state: SubscriptionState.Paid,
		};

		const previous = this._subscription;
		this._subscription = subscription;

		this._etag = Date.now();
		this.updateContext();

		if (!silent && previous != null) {
			this._onDidChange.fire({ current: subscription, previous: previous, etag: this._etag });
		}
	}

	private getStoredSubscription(): Subscription | undefined {
		return {
			plan: {
				actual: getSubscriptionPlan(SubscriptionPlanId.Enterprise),
				effective: getSubscriptionPlan(SubscriptionPlanId.Enterprise),
			},
			account: {
				id: 'unlocked',
				name: 'GitLens Unlocked',
				email: 'unlocked@example.com',
				verified: true,
			},
			state: SubscriptionState.Paid,
		};
	}

	private updateContext(): void {
		void this.updateStatusBar();

		void setContext(ContextKeys.PlusAllowed, true);
		void setContext(ContextKeys.PlusRequired, false);

		void setContext(ContextKeys.Plus, SubscriptionPlanId.Enterprise);
		void setContext(ContextKeys.PlusState, SubscriptionState.Paid);
	}

	private updateStatusBar(): void {
		this._statusBarSubscription?.dispose();
		this._statusBarSubscription = undefined;
	}
}
