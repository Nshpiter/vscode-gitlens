import {
	CancellationToken,
	Disposable,
	env,
	Uri,
	Webview,
	WebviewView,
	WebviewViewProvider,
	WebviewViewResolveContext,
	window,
	WindowState,
	workspace,
} from 'vscode';
import { getNonce } from '@env/crypto';
import { Commands } from '../constants';
import type { Container } from '../container';
import { Logger } from '../logger';
import { executeCommand } from '../system/command';
import { log } from '../system/decorators/log';
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

export abstract class WebviewViewBase<State> implements WebviewViewProvider, Disposable {
	protected readonly disposables: Disposable[] = [];
	protected isReady: boolean = false;
	private _disposableView: Disposable | undefined;
	private _view: WebviewView | undefined;

	constructor(
		protected readonly container: Container,
		public readonly id: `gitlens.views.${string}`,
		protected readonly fileName: string,
		title: string,
	) {
		this._title = title;
		this.disposables.push(window.registerWebviewViewProvider(id, this));
	}

	dispose() {
		this.disposables.forEach(d => d.dispose());
		this._disposableView?.dispose();
	}

	get description(): string | undefined {
		return this._view?.description;
	}
	set description(description: string | undefined) {
		if (this._view == null) return;

		this._view.description = description;
	}

	private _title: string;
	get title(): string {
		return this._view?.title ?? this._title;
	}
	set title(title: string) {
		this._title = title;
		if (this._view == null) return;

		this._view.title = title;
	}

	get visible() {
		return this._view?.visible ?? false;
	}

	@log()
	async show(options?: { preserveFocus?: boolean }) {
		const cc = Logger.getCorrelationContext();

		try {
			void (await executeCommand(`${this.id}.focus`, options));
		} catch (ex) {
			Logger.error(ex, cc);
		}
	}

	protected onInitializing?(): Disposable[] | undefined;
	protected onReady?(): void;
	protected onMessageReceived?(e: IpcMessage): void;
	protected onVisibilityChanged?(visible: boolean): void;
	protected onWindowFocusChanged?(focused: boolean): void;

	protected registerCommands?(): Disposable[];

	protected includeBootstrap?(): State | Promise<State>;
	protected includeHead?(): string | Promise<string>;
	protected includeBody?(): string | Promise<string>;
	protected includeEndOfBody?(): string | Promise<string>;

	async resolveWebviewView(
		webviewView: WebviewView,
		_context: WebviewViewResolveContext,
		_token: CancellationToken,
	): Promise<void> {
		this._view = webviewView;

		webviewView.webview.options = {
			enableCommandUris: true,
			enableScripts: true,
		};

		webviewView.title = this._title;

		this._disposableView = Disposable.from(
			this._view.onDidDispose(this.onViewDisposed, this),
			this._view.onDidChangeVisibility(this.onViewVisibilityChanged, this),
			this._view.webview.onDidReceiveMessage(this.onMessageReceivedCore, this),
			window.onDidChangeWindowState(this.onWindowStateChanged, this),
			...(this.onInitializing?.() ?? []),
			...(this.registerCommands?.() ?? []),
		);

		webviewView.webview.html = await this.getHtml(webviewView.webview);

		this.onViewVisibilityChanged();
	}

	protected async refresh(): Promise<void> {
		if (this._view == null) return;

		this._view.webview.html = await this.getHtml(this._view.webview);
	}

	private onViewDisposed() {
		this._disposableView?.dispose();
		this._disposableView = undefined;
		this._view = undefined;
	}

	private onViewVisibilityChanged() {
		const visible = this.visible;
		Logger.debug(`WebviewView(${this.id}).onViewVisibilityChanged`, `visible=${visible}`);
		this.onVisibilityChanged?.(visible);
	}

	private onWindowStateChanged(e: WindowState) {
		this.onWindowFocusChanged?.(e.focused);
	}

	private onMessageReceivedCore(e: IpcMessage) {
		if (e == null) return;

		Logger.debug(`WebviewView(${this.id}).onMessageReceived: method=${e.method}`);

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

		const [bootstrap, head, body, endOfBody] = await Promise.all([
			this.includeBootstrap?.(),
			this.includeHead?.(),
			this.includeBody?.(),
			this.includeEndOfBody?.(),
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

		const nls = await this.getLocalization();
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
			const defaultNlsContent = await (workspace as any).fs.readFile(defaultNlsUri);
			Object.assign(nls, JSON.parse(new TextDecoder('utf8').decode(defaultNlsContent)));

			const lang = env.language;
			if (lang !== 'en') {
				const localizedNlsUri = Uri.joinPath(rootUri, `package.nls.${lang}.json`);
				try {
					const localizedNlsContent = await (workspace as any).fs.readFile(localizedNlsUri);
					Object.assign(nls, JSON.parse(new TextDecoder('utf8').decode(localizedNlsContent)));
				} catch {
					// Localized NLS not found, fallback to default
				}
			}
		} catch (ex) {
			Logger.error(ex, 'WebviewViewBase.getLocalization');
		}

		this._nls = nls;
		return nls;
	}

	protected notify<T extends IpcNotificationType<any>>(type: T, params: IpcMessageParams<T>): Promise<boolean> {
		return Promise.resolve(this.postMessage({ id: nextIpcId(), method: type.method, params: params }));
	}

	private postMessage(message: IpcMessage) {
		if (this._view == null) return Promise.resolve(false);

		return this._view.webview.postMessage(message);
	}
}
