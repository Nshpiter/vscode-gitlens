// NOTE@eamodio This file is referenced in the webviews to we can't use anything vscode or other imports that aren't available in the webviews
import { getDateDifference } from './system/date';

export const enum SubscriptionPlanId {
	Free = 'free',
	FreePlus = 'free+',
	Pro = 'pro',
	Teams = 'teams',
	Enterprise = 'enterprise',
}

export type FreeSubscriptionPlans = Extract<SubscriptionPlanId, SubscriptionPlanId.Free | SubscriptionPlanId.FreePlus>;
export type PaidSubscriptionPlans = Exclude<SubscriptionPlanId, SubscriptionPlanId.Free | SubscriptionPlanId.FreePlus>;
export type RequiredSubscriptionPlans = Exclude<SubscriptionPlanId, SubscriptionPlanId.Free>;

export interface Subscription {
	readonly plan: {
		readonly actual: SubscriptionPlan;
		readonly effective: SubscriptionPlan;
	};
	account: SubscriptionAccount | undefined;
	previewTrial?: SubscriptionPreviewTrial;

	state: SubscriptionState;
}

export interface SubscriptionPlan {
	readonly id: SubscriptionPlanId;
	readonly name: string;
	readonly startedOn: string;
	readonly expiresOn?: string | undefined;
}

export interface SubscriptionAccount {
	readonly id: string;
	readonly name: string;
	readonly email: string | undefined;
	readonly verified: boolean;
}

export interface SubscriptionPreviewTrial {
	readonly startedOn: string;
	readonly expiresOn: string;
}

export const enum SubscriptionState {
	/** Indicates a user who hasn't verified their email address yet */
	VerificationRequired = -1,
	/** Indicates a Free user who hasn't yet started the preview trial */
	Free = 0,
	/** Indicates a Free user who is in preview trial */
	FreeInPreview,
	/** Indicates a Free user who's preview has expired trial */
	FreePreviewExpired,
	/** Indicates a Free+ user with a completed trial */
	FreePlusInTrial,
	/** Indicates a Free+ user who's trial has expired */
	FreePlusTrialExpired,
	/** Indicates a Paid user */
	Paid,
}

export function getSubscriptionPlan(id: SubscriptionPlanId, startedOn?: Date, expiresOn?: Date): SubscriptionPlan {
	let name: string;
	switch (id) {
		case SubscriptionPlanId.FreePlus:
			name = 'GitLens+';
			break;
		case SubscriptionPlanId.Pro:
			name = 'GitLens+ Pro';
			break;
		case SubscriptionPlanId.Teams:
			name = 'GitLens+ Teams';
			break;
		case SubscriptionPlanId.Enterprise:
			name = 'GitLens+ Enterprise';
			break;
		case SubscriptionPlanId.Free:
		default:
			name = 'GitLens';
			break;
	}

	return {
		id: id,
		name: name,
		startedOn: (startedOn ?? new Date()).toISOString(),
		expiresOn: expiresOn != null ? expiresOn.toISOString() : undefined,
	};
}

const plansPriority = new Map<SubscriptionPlanId | undefined, number>([
	[undefined, -1],
	[SubscriptionPlanId.Free, 0],
	[SubscriptionPlanId.FreePlus, 1],
	[SubscriptionPlanId.Pro, 2],
	[SubscriptionPlanId.Teams, 3],
	[SubscriptionPlanId.Enterprise, 4],
]);

export function getSubscriptionPlanPriority(id: SubscriptionPlanId | undefined): number {
	return plansPriority.get(id)!;
}

export function getTimeRemaining(
	expiresOn: string | undefined,
	unit?: 'days' | 'hours' | 'minutes' | 'seconds',
): number | undefined {
	return expiresOn != null ? getDateDifference(Date.now(), new Date(expiresOn), unit) : undefined;
}

export function isSubscriptionPaidPlan(id: SubscriptionPlanId): id is PaidSubscriptionPlans {
	return id !== SubscriptionPlanId.Free && id !== SubscriptionPlanId.FreePlus;
}

export function isSubscriptionPreviewTrialExpired(subscription: Optional<Subscription, 'state'>): boolean | undefined {
	const remaining = getTimeRemaining(subscription.previewTrial?.expiresOn);
	return remaining != null ? remaining <= 0 : undefined;
}
