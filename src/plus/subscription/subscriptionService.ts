import {
	AuthenticationProviderAuthenticationSessionsChangeEvent,
	AuthenticationSession,
	commands,
	Disposable,
	env,
	Event,
	EventEmitter,
	MessageItem,
	StatusBarAlignment,
	StatusBarItem,
	ThemeColor,
	Uri,
	window,
} from 'vscode';
import { Commands, ContextKeys } from '../../constants';
import type { Container } from '../../container';
import { setContext } from '../../context';
import { RepositoriesChangeEvent } from '../../git/gitProviderService';
import {
	getSubscriptionPlan,
	getSubscriptionPlanPriority,
	getSubscriptionTimeRemaining,
	isSubscriptionPaidPlan,
	isSubscriptionTrial,
	Subscription,
	SubscriptionPlanId,
	SubscriptionState,
} from '../../subscription';
import { configuration } from '../../configuration';
import { StorageKeys } from '../../storage';
import { executeCommand } from '../../system/command';
import { createFromDateDelta } from '../../system/date';
import { gate } from '../../system/decorators/gate';
import { debug, log } from '../../system/decorators/log';
import { memoize } from '../../system/decorators/memoize';
import { once } from '../../system/function';
import { pluralize } from '../../system/string';
import { openWalkthrough } from '../../system/utils';
import { ensurePlusFeaturesEnabled } from './utils';

// TODO: What user-agent should we use?
const userAgent = 'Visual-Studio-Code-GitLens';

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
	private get baseApiUri(): Uri {
		const { env } = this.container;
		if (env === 'staging') {
			return Uri.parse('https://stagingapi.gitkraken.com');
		}

		if (env === 'dev') {
			return Uri.parse('https://devapi.gitkraken.com');
		}

		return Uri.parse('https://api.gitkraken.com');
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

	private _lastCheckInDate: Date | undefined;
	@debug<SubscriptionService['checkInAndValidate']>({ args: { 0: s => s?.account.label } })
	private async checkInAndValidate(_session: AuthenticationSession): Promise<void> {
		await Promise.resolve();
		this.startDailyCheckInTimer();
	}

	private _dailyCheckInTimer: ReturnType<typeof setInterval> | undefined;
	private startDailyCheckInTimer(): void {
		if (this._dailyCheckInTimer != null) {
			clearInterval(this._dailyCheckInTimer);
		}

		// Check twice a day to ensure we check in at least once a day
		this._dailyCheckInTimer = setInterval(() => {
			if (this._lastCheckInDate == null || this._lastCheckInDate.getDate() !== new Date().getDate()) {
				void this.ensureSession(false, true);
			}
		}, 1000 * 60 * 60 * 12);
	}

	@debug()
	private validateSubscription(data: GKLicenseInfo) {
		const account: Subscription['account'] = {
			id: data.user.id,
			name: data.user.name,
			email: data.user.email,
			verified: data.user.status === 'activated',
		};

		const effectiveLicenses = Object.entries(data.licenses.effectiveLicenses) as [GKLicenseType, GKLicense][];
		const paidLicenses = Object.entries(data.licenses.paidLicenses) as [GKLicenseType, GKLicense][];

		let actual: Subscription['plan']['actual'] | undefined;
		if (paidLicenses.length > 0) {
			paidLicenses.sort(
				(a, b) =>
					licenseStatusPriority(b[1].latestStatus) - licenseStatusPriority(a[1].latestStatus) ||
					getSubscriptionPlanPriority(convertLicenseTypeToPlanId(b[0])) -
					getSubscriptionPlanPriority(convertLicenseTypeToPlanId(a[0])),
			);

			const [licenseType, license] = paidLicenses[0];
			actual = getSubscriptionPlan(
				convertLicenseTypeToPlanId(licenseType),
				new Date(license.latestStartDate),
				new Date(license.latestEndDate),
			);
		}

		if (actual == null) {
			actual = getSubscriptionPlan(
				SubscriptionPlanId.FreePlus,
				data.user.firstGitLensCheckIn != null ? new Date(data.user.firstGitLensCheckIn) : undefined,
			);
		}

		let effective: Subscription['plan']['effective'] | undefined;
		if (effectiveLicenses.length > 0) {
			effectiveLicenses.sort(
				(a, b) =>
					licenseStatusPriority(b[1].latestStatus) - licenseStatusPriority(a[1].latestStatus) ||
					getSubscriptionPlanPriority(convertLicenseTypeToPlanId(b[0])) -
					getSubscriptionPlanPriority(convertLicenseTypeToPlanId(a[0])),
			);

			const [licenseType, license] = effectiveLicenses[0];
			effective = getSubscriptionPlan(
				convertLicenseTypeToPlanId(licenseType),
				new Date(license.latestStartDate),
				new Date(license.latestEndDate),
			);
		}

		if (effective == null) {
			effective = { ...actual };
		}

		this.changeSubscription({
			...this._subscription,
			plan: {
				actual: actual,
				effective: effective,
			},
			account: account,
		});
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
	private async getOrCreateSession(_createIfNeeded: boolean): Promise<AuthenticationSession | null> {
		return this.ensureSession(true) as Promise<AuthenticationSession>;
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

	private async storeSubscription(subscription: Subscription): Promise<void> {
		return this.container.storage.store<Stored<Subscription>>(StorageKeys.Subscription, {
			v: 1,
			data: subscription,
		});
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

function assertSubscriptionState(subscription: Optional<Subscription, 'state'>): asserts subscription is Subscription { }

interface GKLicenseInfo {
	user: GKUser;
	licenses: {
		paidLicenses: Record<GKLicenseType, GKLicense>;
		effectiveLicenses: Record<GKLicenseType, GKLicense>;
	};
}

type GKLicenseType =
	| 'gitlens-pro'
	| 'gitlens-hosted-enterprise'
	| 'gitlens-self-hosted-enterprise'
	| 'gitlens-standalone-enterprise'
	| 'bundle-pro'
	| 'bundle-hosted-enterprise'
	| 'bundle-self-hosted-enterprise'
	| 'bundle-standalone-enterprise';

function convertLicenseTypeToPlanId(licenseType: GKLicenseType): SubscriptionPlanId {
	switch (licenseType) {
		case 'gitlens-pro':
		case 'bundle-pro':
			return SubscriptionPlanId.Pro;
		case 'gitlens-hosted-enterprise':
		case 'gitlens-self-hosted-enterprise':
		case 'gitlens-standalone-enterprise':
		case 'bundle-hosted-enterprise':
		case 'bundle-self-hosted-enterprise':
		case 'bundle-standalone-enterprise':
			return SubscriptionPlanId.Enterprise;
		default:
			return SubscriptionPlanId.FreePlus;
	}
}

function licenseStatusPriority(status: GKLicense['latestStatus']): number {
	switch (status) {
		case 'active':
			return 100;
		case 'expired':
			return -100;
		case 'trial':
			return 1;
		case 'canceled':
			return 0;
	}
}

interface GKLicense {
	latestStatus: 'active' | 'canceled' | 'expired' | 'trial';
	latestStartDate: string;
	latestEndDate: string;
}

interface GKUser {
	id: string;
	name: string;
	email: string;
	status: 'activated' | 'pending';
	firstGitLensCheckIn?: string;
}

interface Stored<T, SchemaVersion extends number = 1> {
	v: SchemaVersion;
	data: T;
}
