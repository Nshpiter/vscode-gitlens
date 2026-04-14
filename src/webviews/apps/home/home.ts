/*global*/
import './home.scss';
import { provideVSCodeDesignSystem, vsCodeButton } from '@vscode/webview-ui-toolkit';
import { Disposable } from 'vscode';
import { DidChangeStateNotificationType, State } from '../../home/protocol';
import { ExecuteCommandType, IpcMessage, onIpc } from '../../protocol';
import { App } from '../shared/appBase';
import { DOM } from '../shared/dom';

export class HomeApp extends App<State> {
	private $slot0!: HTMLDivElement;
	private $slot1!: HTMLDivElement;
	private $slot2!: HTMLDivElement;

	constructor() {
		super('HomeApp');
	}

	protected override onInitialize() {
		provideVSCodeDesignSystem().register({
			register: function (container: any, context: any) {
				vsCodeButton().register(container, context);
			},
		});

		this.$slot0 = document.getElementById('slot0') as HTMLDivElement;
		this.$slot1 = document.getElementById('slot1') as HTMLDivElement;
		this.$slot2 = document.getElementById('slot2') as HTMLDivElement;

		this.updateState();
	}

	protected override onBind(): Disposable[] {
		const disposables = super.onBind?.() ?? [];

		disposables.push(DOM.on('[data-action]', 'click', (e, target: HTMLElement) => this.onActionClicked(e, target)));

		return disposables;
	}

	protected override onMessageReceived(e: MessageEvent) {
		const msg = e.data as IpcMessage;

		switch (msg.method) {
			case DidChangeStateNotificationType.method:
				this.log(`${this.appName}.onMessageReceived(${msg.id}): name=${msg.method}`);

				onIpc(DidChangeStateNotificationType, msg, params => {
					this.state = params;
					this.updateState();
				});
				break;

			default:
				super.onMessageReceived?.(e);
				break;
		}
	}

	private onActionClicked(e: MouseEvent, target: HTMLElement) {
		const action = target.dataset.action;
		if (action?.startsWith('command:')) {
			this.sendCommand(ExecuteCommandType, { command: action.slice(8) });
		}
	}

	private updateState() {
		const { operation, welcomeVisible, stashCount } = this.state;

		const $container = document.getElementById('container') as HTMLDivElement;
		$container.classList.toggle('welcome', welcomeVisible);
		this.$slot2.classList.toggle('divider', welcomeVisible);

		if (operation != null) {
			DOM.insertTemplate('operation-status', this.$slot0, {
				bindings: {
					conflicts: operation.conflicts,
					current: operation.current,
					incoming: operation.incoming,
					repository: operation.repository,
					step: operation.step,
					total: operation.total,
				},
				visible: {
					hasConflicts: operation.conflicts > 0,
					hasStep: operation.kind === 'rebase' && operation.step != null && operation.total != null,
					merge: operation.kind === 'merge',
					rebase: operation.kind === 'rebase',
				},
			});
		} else {
			this.$slot0.innerHTML = '';
		}

		if (welcomeVisible) {
			DOM.insertTemplate('welcome', this.$slot1);
			DOM.insertTemplate('links', this.$slot2);
		} else {
			DOM.insertTemplate('links', this.$slot1);
			this.$slot2.innerHTML = '';
		}

		// Stash indicator
		const $stash = document.getElementById('stash-indicator');
		if ($stash != null) {
			if (stashCount > 0) {
				$stash.textContent = `${stashCount}`;
				$stash.parentElement?.classList.remove('hidden');
			} else {
				$stash.parentElement?.classList.add('hidden');
			}
		}
	}
}

new HomeApp();
