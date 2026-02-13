import {
	commands,
	Disposable,
	env,
	Uri,
	ViewColumn,
	Webview,
	WebviewPanel,
	WebviewPanelOnDidChangeViewStateEvent,
	window,
	workspace,
} from 'vscode';
import { getNonce } from '@env/crypto';
import { Commands } from '../constants';
import type { Container } from '../container';
import { Logger } from '../logger';
import { executeCommand } from '../system/command';
import {
	ExecuteCommandType,
	IpcMessage,
	IpcMessageParams,
	IpcNotificationType,
	onIpc,
	WebviewReadyCommandType,
} from './protocol';

let ipcSequence = 0;
function nextIpcId() {
	if (ipcSequence === Number.MAX_SAFE_INTEGER) {
		ipcSequence = 1;
	} else {
		ipcSequence++;
	}

	return `host:${ipcSequence}`;
}

export abstract class WebviewBase<State> implements Disposable {
	protected readonly disposables: Disposable[] = [];
	protected isReady: boolean = false;
	private _disposablePanel: Disposable | undefined;
	private _panel: WebviewPanel | undefined;

	constructor(
		protected readonly container: Container,
		public readonly id: `gitlens.${string}`,
		private readonly fileName: string,
		private readonly iconPath: string,
		title: string,
		showCommand: Commands,
	) {
		this._title = title;
		this.disposables.push(commands.registerCommand(showCommand, this.onShowCommand, this));
	}

	dispose() {
		this.disposables.forEach(d => d.dispose());
		this._disposablePanel?.dispose();
	}

	private _title: string;
	get title(): string {
		return this._panel?.title ?? this._title;
	}
	set title(title: string) {
		this._title = title;
		if (this._panel == null) return;

		this._panel.title = title;
	}

	get visible() {
		return this._panel?.visible ?? false;
	}

	hide() {
		this._panel?.dispose();
	}

	async show(column: ViewColumn = ViewColumn.Beside): Promise<void> {
		if (this._panel == null) {
			this._panel = window.createWebviewPanel(
				this.id,
				this._title,
				{ viewColumn: column, preserveFocus: false },
				{
					retainContextWhenHidden: true,
					enableFindWidget: true,
					enableCommandUris: true,
					enableScripts: true,
				},
			);

			this._panel.iconPath = Uri.file(this.container.context.asAbsolutePath(this.iconPath));
			this._disposablePanel = Disposable.from(
				this._panel,
				this._panel.onDidDispose(this.onPanelDisposed, this),
				this._panel.onDidChangeViewState(this.onViewStateChanged, this),
				this._panel.webview.onDidReceiveMessage(this.onMessageReceivedCore, this),
				...(this.onInitializing?.() ?? []),
				...(this.registerCommands?.() ?? []),
			);

			this._panel.webview.html = await this.getHtml(this._panel.webview);
		} else {
			const html = await this.getHtml(this._panel.webview);

			// Reset the html to get the webview to reload
			this._panel.webview.html = '';
			this._panel.webview.html = html;

			this._panel.reveal(this._panel.viewColumn ?? ViewColumn.Active, false);
		}
	}

	protected onInitializing?(): Disposable[] | undefined;
	protected onReady?(): void;
	protected onMessageReceived?(e: IpcMessage): void;
	protected onFocusChanged?(focused: boolean): void;
	protected onVisibilityChanged?(visible: boolean): void;

	protected registerCommands?(): Disposable[];

	protected includeBootstrap?(): State | Promise<State>;
	protected includeHead?(): string | Promise<string>;
	protected includeBody?(): string | Promise<string>;
	protected includeEndOfBody?(): string | Promise<string>;

	protected async refresh(): Promise<void> {
		if (this._panel == null) return;

		this._panel.webview.html = await this.getHtml(this._panel.webview);
	}

	private onPanelDisposed() {
		this.onVisibilityChanged?.(false);
		this.onFocusChanged?.(false);

		this._disposablePanel?.dispose();
		this._disposablePanel = undefined;
		this._panel = undefined;
	}

	protected onShowCommand(): void {
		void this.show();
	}

	protected onViewStateChanged(e: WebviewPanelOnDidChangeViewStateEvent): void {
		Logger.debug(
			`Webview(${this.id}).onViewStateChanged`,
			`active=${e.webviewPanel.active}, visible=${e.webviewPanel.visible}`,
		);
		this.onVisibilityChanged?.(e.webviewPanel.visible);
		this.onFocusChanged?.(e.webviewPanel.active);
	}

	protected onMessageReceivedCore(e: IpcMessage) {
		if (e == null) return;

		Logger.debug(`Webview(${this.id}).onMessageReceived: method=${e.method}`);

		switch (e.method) {
			case WebviewReadyCommandType.method:
				onIpc(WebviewReadyCommandType, e, () => {
					this.isReady = true;
					this.onReady?.();
				});

				break;

			case ExecuteCommandType.method:
				onIpc(ExecuteCommandType, e, params => {
					if (params.args != null) {
						void executeCommand(params.command as Commands, ...params.args);
					} else {
						void executeCommand(params.command as Commands);
					}
				});
				break;

			default:
				this.onMessageReceived?.(e);
				break;
		}
	}

	private async getHtml(webview: Webview): Promise<string> {
		const webRootUri = Uri.joinPath(this.container.context.extensionUri, 'dist', 'webviews');
		const uri = Uri.joinPath(webRootUri, this.fileName);
		const content = new TextDecoder('utf8').decode(await (workspace as any).fs.readFile(uri));

		const [bootstrap, head, body, endOfBody, nls] = await Promise.all([
			this.includeBootstrap?.(),
			this.includeHead?.(),
			this.includeBody?.(),
			this.includeEndOfBody?.(),
			this.getLocalization(),
		]);

		const cspSource = webview.cspSource;
		const cspNonce = getNonce();

		const root = webview.asWebviewUri(this.container.context.extensionUri).toString();
		const webRoot = webview.asWebviewUri(webRootUri).toString();

		let html = content
			.replace(/#{(head|body|endOfBody)}/i, (_substring: string, token: string) => {
				switch (token) {
					case 'head':
						return head ?? '';
					case 'body':
						return body ?? '';
					case 'endOfBody':
						return bootstrap != null
							? `<script type="text/javascript" nonce="#{cspNonce}">window.bootstrap = ${JSON.stringify(
								bootstrap,
							)};</script>${endOfBody ?? ''}`
							: endOfBody ?? '';
					default:
						return '';
				}
			})
			.replace(/#{(cspSource|cspNonce|root|webroot)}/g, (_substring: string, token: string) => {
				switch (token) {
					case 'cspSource':
						return cspSource;
					case 'cspNonce':
						return cspNonce;
					case 'root':
						return root;
					case 'webroot':
						return webRoot;
					default:
						return '';
				}
			});
		html = this.applyLocalization(html, nls);

		return html;
	}

	private applyLocalization(html: string, nls: Record<string, string>): string {
		const regex = /%\{([^%|]+)(?:\|([^%]*))?\}%/g;
		let iteration = 0;
		let hasMatches = true;

		while (hasMatches && iteration < 5) {
			hasMatches = false;
			// eslint-disable-next-line no-loop-func
			html = html.replace(regex, (substring: string, key: string, defaultValue: string | undefined) => {
				let value = nls[key] ?? nls[`gitlens.${key}`] ?? defaultValue;
				if (value == null && key === 'plan') {
					value = 'GitLens+ Enterprise';
				}

				if (value != null && value !== substring) {
					hasMatches = true;
					return value;
				}
				return substring;
			});
			iteration++;
		}
		return html;
	}

	private _nls: Record<string, string> | undefined;
	protected async getLocalization(): Promise<Record<string, string>> {
		if (this._nls != null) return this._nls;

		const nls: Record<string, string> = {};
		try {
			const rootUri = this.container.context.extensionUri;
			const defaultNlsUri = Uri.joinPath(rootUri, 'package.nls.json');
			const defaultNlsContent = await workspace.fs.readFile(defaultNlsUri);
			Object.assign(nls, JSON.parse(new TextDecoder('utf8').decode(defaultNlsContent)));

			const lang = env.language;
			if (lang !== 'en') {
				const localizedNlsUri = Uri.joinPath(rootUri, `package.nls.${lang}.json`);
				try {
					const localizedNlsContent = await workspace.fs.readFile(localizedNlsUri);
					Object.assign(nls, JSON.parse(new TextDecoder('utf8').decode(localizedNlsContent)));
				} catch {
					// Localized NLS not found, fallback to default
				}
			}
		} catch (ex) {
			Logger.error(ex, 'WebviewBase.getLocalization');
		}

		this._nls = nls;
		return nls;
	}

	protected notify<T extends IpcNotificationType<any>>(type: T, params: IpcMessageParams<T>): Promise<boolean> {
		return Promise.resolve(this.postMessage({ id: nextIpcId(), method: type.method, params: params }));
	}

	private postMessage(message: IpcMessage) {
		if (this._panel == null) return Promise.resolve(false);

		Logger.debug(`Webview(${this.id}).postMessage: method=${message.method}`);
		return this._panel.webview.postMessage(message);
	}
}
