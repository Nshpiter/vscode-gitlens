import {
	ConfigurationChangeEvent,
	ConfigurationTarget,
	Uri,
	WebviewPanelOnDidChangeViewStateEvent,
	window,
	workspace,
} from 'vscode';
import { configuration } from '../configuration';
import { Commands } from '../constants';
import type { Container } from '../container';
import { CommitFormatter } from '../git/formatters';
import {
	GitCommit,
	GitCommitIdentity,
	GitFileChange,
	GitFileIndexStatus,
	PullRequest,
	PullRequestState,
} from '../git/models';
import { Logger } from '../logger';
import {
	ConfigurationScope,
	DidChangeConfigurationNotificationType,
	DidGenerateConfigurationPreviewNotificationType,
	DidOpenAnchorNotificationType,
	ExportConfigurationCommandType,
	GenerateConfigurationPreviewCommandType,
	ImportConfigurationCommandType,
	ImportConfigurationParams,
	IpcMessage,
	onIpc,
	UpdateConfigurationCommandType,
} from './protocol';
import { WebviewBase } from './webviewBase';

export abstract class WebviewWithConfigBase<State> extends WebviewBase<State> {
	private _pendingJumpToAnchor: string | undefined;

	constructor(
		container: Container,
		id: `gitlens.${string}`,
		fileName: string,
		iconPath: string,
		title: string,
		showCommand: Commands,
	) {
		super(container, id, fileName, iconPath, title, showCommand);
		this.disposables.push(
			configuration.onDidChange(this.onConfigurationChanged, this),
			configuration.onDidChangeAny(this.onAnyConfigurationChanged, this),
		);
	}

	private onAnyConfigurationChanged(e: ConfigurationChangeEvent) {
		let notify = false;
		for (const setting of this.customSettings.values()) {
			if (e.affectsConfiguration(setting.name)) {
				notify = true;
				break;
			}
		}

		if (!notify) return;

		void this.notifyDidChangeConfiguration();
	}

	private onConfigurationChanged(_e: ConfigurationChangeEvent) {
		void this.notifyDidChangeConfiguration();
	}

	protected override onReady() {
		if (this._pendingJumpToAnchor != null) {
			const anchor = this._pendingJumpToAnchor;
			this._pendingJumpToAnchor = undefined;

			void this.notify(DidOpenAnchorNotificationType, { anchor: anchor, scrollBehavior: 'auto' });
		}
	}

	protected override onShowCommand(anchor?: string) {
		if (anchor) {
			if (this.isReady && this.visible) {
				queueMicrotask(
					() => void this.notify(DidOpenAnchorNotificationType, { anchor: anchor, scrollBehavior: 'smooth' }),
				);
				return;
			}

			this._pendingJumpToAnchor = anchor;
		}
		super.onShowCommand();
	}

	protected override onViewStateChanged(e: WebviewPanelOnDidChangeViewStateEvent): void {
		super.onViewStateChanged(e);

		// Anytime the webview becomes active, make sure it has the most up-to-date config
		if (e.webviewPanel.active) {
			void this.notifyDidChangeConfiguration();
		}
	}

	protected override onMessageReceivedCore(e: IpcMessage): void {
		if (e == null) return;

		switch (e.method) {
			case UpdateConfigurationCommandType.method:
				Logger.debug(`Webview(${this.id}).onMessageReceived: method=${e.method}`);

				onIpc(UpdateConfigurationCommandType, e, async params => {
					const target =
						params.scope === 'workspace' ? ConfigurationTarget.Workspace : ConfigurationTarget.Global;

					for (const key in params.changes) {
						let value = params.changes[key];

						const customSetting = this.customSettings.get(key);
						if (customSetting != null) {
							await customSetting.update(value);

							continue;
						}

						const inspect = configuration.inspect(key as any)!;

						if (value != null) {
							if (params.scope === 'workspace') {
								if (value === inspect.workspaceValue) continue;
							} else {
								if (value === inspect.globalValue && value !== inspect.defaultValue) continue;

								if (value === inspect.defaultValue) {
									value = undefined;
								}
							}
						}

						void (await configuration.update(key as any, value, target));
					}

					for (const key of params.removes) {
						void (await configuration.update(key as any, undefined, target));
					}
				});
				break;

			case ExportConfigurationCommandType.method:
				Logger.debug(`Webview(${this.id}).onMessageReceived: method=${e.method}`);

				onIpc(ExportConfigurationCommandType, e, async params => {
					await this.exportConfiguration(params.scope ?? 'user');
				});
				break;

			case ImportConfigurationCommandType.method:
				Logger.debug(`Webview(${this.id}).onMessageReceived: method=${e.method}`);

				onIpc(ImportConfigurationCommandType, e, async params => {
					await this.importConfiguration(params);
				});
				break;

			case GenerateConfigurationPreviewCommandType.method:
				Logger.debug(`Webview(${this.id}).onMessageReceived: method=${e.method}`);

				onIpc(GenerateConfigurationPreviewCommandType, e, async params => {
					switch (params.type) {
						case 'commit': {
							const commit = new GitCommit(
								this.container,
								'~/code/eamodio/vscode-gitlens-demo',
								'fe26af408293cba5b4bfd77306e1ac9ff7ccaef8',
								new GitCommitIdentity('You', 'eamodio@gmail.com', new Date('2016-11-12T20:41:00.000Z')),
								new GitCommitIdentity('You', 'eamodio@gmail.com', new Date('2020-11-01T06:57:21.000Z')),
								'Supercharged',
								['3ac1d3f51d7cf5f438cc69f25f6740536ad80fef'],
								'Supercharged',
								new GitFileChange(
									'~/code/eamodio/vscode-gitlens-demo',
									'code.ts',
									GitFileIndexStatus.Modified,
								),
								undefined,
								[],
							);

							let includePullRequest = false;
							switch (params.key) {
								case configuration.name('currentLine.format'):
									includePullRequest = this.container.config.currentLine.pullRequests.enabled;
									break;
								case configuration.name('statusBar.format'):
									includePullRequest = this.container.config.statusBar.pullRequests.enabled;
									break;
							}

							let pr: PullRequest | undefined;
							if (includePullRequest) {
								pr = new PullRequest(
									{ id: 'github', name: 'GitHub', domain: 'github.com' },
									{
										name: 'Eric Amodio',
										avatarUrl: 'https://avatars1.githubusercontent.com/u/641685?s=32&v=4',
										url: 'https://github.com/eamodio',
									},
									'1',
									'Supercharged',
									'https://github.com/gitkraken/vscode-gitlens/pulls/1',
									PullRequestState.Merged,
									new Date('Sat, 12 Nov 2016 19:41:00 GMT'),
									undefined,
									new Date('Sat, 12 Nov 2016 20:41:00 GMT'),
								);
							}

							let preview;
							try {
								preview = CommitFormatter.fromTemplate(params.format, commit, {
									dateFormat: this.container.config.defaultDateFormat,
									pullRequestOrRemote: pr,
									messageTruncateAtNewLine: true,
								});
							} catch {
								preview = 'Invalid format';
							}

							await this.notify(DidGenerateConfigurationPreviewNotificationType, {
								completionId: e.id,
								preview: preview,
							});
						}
					}
				});
				break;

			default:
				super.onMessageReceivedCore(e);
		}
	}

	private _customSettings: Map<string, CustomSetting> | undefined;
	private get customSettings() {
		if (this._customSettings == null) {
			this._customSettings = new Map<string, CustomSetting>([
				[
					'rebaseEditor.enabled',
					{
						name: 'workbench.editorAssociations',
						enabled: () => this.container.rebaseEditor.enabled,
						update: this.container.rebaseEditor.setEnabled,
					},
				],
			]);
		}
		return this._customSettings;
	}

	protected getCustomSettings(): Record<string, boolean> {
		const customSettings = Object.create(null);
		for (const [key, setting] of this.customSettings) {
			customSettings[key] = setting.enabled();
		}
		return customSettings;
	}

	private async exportConfiguration(scope: ConfigurationScope) {
		try {
			const uri = await window.showSaveDialog({
				defaultUri: this.getDefaultConfigurationUri(scope),
				filters: {
					JSON: ['json'],
				},
				saveLabel: 'Export Settings',
				title: `Export GitLens ${scope === 'workspace' ? 'Workspace' : 'User'} Settings`,
			});
			if (uri == null) return;

			const customSettings = scope === 'workspace' ? undefined : this.getCustomSettings();
			const exportable: ExportableConfiguration = {
				version: 1,
				extension: 'gitlens',
				exportedAt: new Date().toISOString(),
				scope: scope,
				config: this.getScopedConfiguration(scope),
				customSettings:
					customSettings != null && Object.keys(customSettings).length !== 0 ? customSettings : undefined,
			};

			await workspace.fs.writeFile(uri, new TextEncoder().encode(`${JSON.stringify(exportable, null, '\t')}\n`));

			void window.showInformationMessage(`Exported GitLens ${scope} settings to '${uri.fsPath}'.`);
		} catch (ex) {
			Logger.error(ex, `Webview(${this.id}).exportConfiguration`);
			void window.showErrorMessage('Unable to export GitLens settings.');
		}
	}

	private getDefaultConfigurationUri(scope: ConfigurationScope): Uri | undefined {
		const folder = workspace.workspaceFolders?.[0]?.uri;
		return folder != null ? Uri.joinPath(folder, `gitlens-settings-${scope}.json`) : undefined;
	}

	private getScopedConfiguration(scope: ConfigurationScope): Record<string, any> {
		const inspection = configuration.inspectAny<Record<string, any>>('gitlens');
		return (scope === 'workspace' ? inspection?.workspaceValue : inspection?.globalValue) ?? {};
	}

	private async importConfiguration(params: ImportConfigurationParams) {
		const scope = params.scope ?? 'user';
		const target = scope === 'workspace' ? ConfigurationTarget.Workspace : ConfigurationTarget.Global;

		try {
			const imported = this.parseImportedConfiguration(params);
			await configuration.updateAny('gitlens', isEmptyObject(imported.config) ? undefined : imported.config, target);

			if (scope !== 'workspace' && imported.customSettings != null) {
				for (const [key, value] of Object.entries(imported.customSettings)) {
					const customSetting = this.customSettings.get(key);
					if (customSetting == null) continue;

					await customSetting.update(value);
				}
			}

			void window.showInformationMessage(
				`Imported GitLens ${scope} settings${params.fileName != null ? ` from '${params.fileName}'` : ''}.`,
			);
		} catch (ex) {
			Logger.error(ex, `Webview(${this.id}).importConfiguration`);
			void window.showErrorMessage(
				ex instanceof Error ? ex.message : 'Unable to import GitLens settings.',
			);
		}
	}

	private parseImportedConfiguration(params: ImportConfigurationParams): ImportedConfiguration {
		if (params.content != null) {
			const payload = asPlainObject(JSON.parse(params.content));
			if (payload == null) {
				throw new Error('The selected file does not contain a valid JSON object.');
			}

			if (payload.config != null || payload.customSettings != null || payload.extension != null) {
				// Validate version compatibility for GitLens export format
				if (payload.version != null && payload.version !== 1) {
					throw new Error(
						`Unsupported configuration version: ${payload.version}. This version of GitLens only supports version 1.`,
					);
				}

				if (payload.extension != null && payload.extension !== 'gitlens') {
					throw new Error(
						`This configuration was exported from '${payload.extension}', not GitLens.`,
					);
				}

				const config = asPlainObject(payload.config);
				if (config == null) {
					throw new Error('The selected file does not contain a valid GitLens configuration export.');
				}

				return {
					config: config,
					customSettings: filterCustomSettings(payload.customSettings),
				};
			}

			const gitlens = asPlainObject(payload.gitlens);
			if (gitlens != null) {
				return {
					config: gitlens,
					customSettings:
						filterCustomSettings(payload.customSettings) ?? getCustomSettingsFromSettingsJson(payload),
				};
			}

			const flattened = getGitLensConfigurationFromSettingsJson(payload);
			if (flattened != null) {
				return {
					config: flattened,
					customSettings:
						filterCustomSettings(payload.customSettings) ?? getCustomSettingsFromSettingsJson(payload),
				};
			}

			if (Object.keys(payload).some(key => key.includes('.'))) {
				throw new Error('The selected file does not contain any GitLens settings to import.');
			}

			return {
				config: payload,
				customSettings: filterCustomSettings(payload.customSettings),
			};
		}

		const config = asPlainObject(params.config);
		if (config == null) {
			throw new Error('The selected file does not contain a valid GitLens configuration.');
		}

		return {
			config: config,
			customSettings: filterCustomSettings(params.customSettings),
		};
	}

	private notifyDidChangeConfiguration() {
		// Make sure to get the raw config, not from the container which has the modes mixed in
		return this.notify(DidChangeConfigurationNotificationType, {
			config: configuration.get(),
			customSettings: this.getCustomSettings(),
		});
	}
}

interface CustomSetting {
	name: string;
	enabled: () => boolean;
	update: (enabled: boolean) => Promise<void>;
}

interface ExportableConfiguration {
	version: 1;
	extension: 'gitlens';
	exportedAt: string;
	scope: ConfigurationScope;
	config: Record<string, any>;
	customSettings?: Record<string, boolean>;
}

interface ImportedConfiguration {
	config: Record<string, any>;
	customSettings?: Record<string, boolean>;
}

function asPlainObject(value: unknown): Record<string, any> | undefined {
	return value != null && !Array.isArray(value) && typeof value === 'object'
		? (value as Record<string, any>)
		: undefined;
}

function filterCustomSettings(value: unknown): Record<string, boolean> | undefined {
	const customSettings = asPlainObject(value);
	if (customSettings == null) return undefined;

	const filtered = Object.entries(customSettings).reduce<Record<string, boolean>>((accumulator, [key, item]) => {
		if (typeof item === 'boolean') {
			accumulator[key] = item;
		}
		return accumulator;
	}, Object.create(null) as Record<string, boolean>);

	return Object.keys(filtered).length !== 0 ? filtered : undefined;
}

function getGitLensConfigurationFromSettingsJson(settings: Record<string, any>): Record<string, any> | undefined {
	const config = Object.entries(settings).reduce<Record<string, any>>((accumulator, [key, value]) => {
		if (!key.startsWith('gitlens.')) return accumulator;

		setObjectValue(accumulator, key.substring('gitlens.'.length), value);
		return accumulator;
	}, Object.create(null) as Record<string, any>);

	return Object.keys(config).length !== 0 ? config : undefined;
}

function getCustomSettingsFromSettingsJson(settings: Record<string, any>): Record<string, boolean> | undefined {
	const associations = settings['workbench.editorAssociations'];
	if (Array.isArray(associations)) {
		const association = associations.find(
			value =>
				value != null &&
				typeof value === 'object' &&
				(value as { filenamePattern?: string }).filenamePattern === 'git-rebase-todo',
		) as { viewType?: string } | undefined;

		if (association?.viewType != null) {
			return {
				'rebaseEditor.enabled': association.viewType === 'gitlens.rebase',
			};
		}
	}

	const mappedAssociations = asPlainObject(associations);
	if (mappedAssociations?.['git-rebase-todo'] != null) {
		return {
			'rebaseEditor.enabled': mappedAssociations['git-rebase-todo'] === 'gitlens.rebase',
		};
	}

	return undefined;
}

function isEmptyObject(value: Record<string, any>): boolean {
	return Object.keys(value).length === 0;
}

function setObjectValue(target: Record<string, any>, path: string, value: any): void {
	const segments = path.split('.');
	const last = segments.length - 1;

	let current = target;
	for (let i = 0; i <= last; i++) {
		const key = segments[i];
		if (i === last) {
			current[key] = value;
			return;
		}

		const existing = current[key];
		if (existing == null || Array.isArray(existing) || typeof existing !== 'object') {
			current[key] = {};
		}

		current = current[key];
	}
}
