import { QuickPickItem } from 'vscode';
import type { Subscription } from '../../subscription';

export enum Directive {
	Back,
	Cancel,
	LoadMore,
	Noop,
	RequiresVerification,

	RequiresFreeSubscription,
	RequiresPaidSubscription,
	StartPreviewTrial,
}

export namespace Directive {
	export function is<T>(value: Directive | T): value is Directive {
		return typeof value === 'number' && Directive[value] != null;
	}
}

export interface DirectiveQuickPickItem extends QuickPickItem {
	directive: Directive;
}

export namespace DirectiveQuickPickItem {
	export function create(
		directive: Directive,
		picked?: boolean,
		options?: { label?: string; description?: string; detail?: string; subscription?: Subscription },
	) {
		let label = options?.label;
		let detail = options?.detail;
		if (label == null) {
			switch (directive) {
				case Directive.Back:
					label = '返回';
					break;
				case Directive.Cancel:
					label = '取消';
					break;
				case Directive.LoadMore:
					label = '加载更多';
					break;
				case Directive.Noop:
					label = '重试';
					break;
				case Directive.StartPreviewTrial:
					label = '立即体验 GitLens+ 功能';
					detail = '无需账户，免费体验 GitLens+ 功能 3 天';
					break;
				case Directive.RequiresVerification:
					label = '重新发送验证邮件';
					detail = '您必须先验证账户邮箱地址才能继续';
					break;
				case Directive.RequiresFreeSubscription:
					label = '登录 GitLens+';
					detail =
						'在公共仓库上使用 GitLens+ 功能，并获得 7 天免费试用（含公共和私有仓库）';
					break;
				case Directive.RequiresPaidSubscription:
					label = '升级您的账户';
					detail = '在公共和私有仓库上使用 GitLens+ 功能';
					break;
			}
		}

		const item: DirectiveQuickPickItem = {
			label: label,
			description: options?.description,
			detail: detail,
			alwaysShow: true,
			picked: picked,
			directive: directive,
		};

		return item;
	}

	export function is(item: QuickPickItem): item is DirectiveQuickPickItem {
		return item != null && 'directive' in item;
	}
}
