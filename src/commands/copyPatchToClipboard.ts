import { env, TextEditor, Uri, window } from 'vscode';
import { Commands } from '../constants';
import type { Container } from '../container';
import { GitUri } from '../git/gitUri';
import { Logger } from '../logger';
import { Messages } from '../messages';
import { command } from '../system/command';
import {
	ActiveEditorCommand,
	CommandContext,
	getCommandUri,
	isCommandContextViewNodeHasCommit,
} from './base';

export interface CopyPatchToClipboardCommandArgs {
	repoPath?: string;
	sha?: string;
	/** When true, copy working-tree patch instead of a commit */
	workingTree?: boolean;
	staged?: boolean | 'all';
}

/**
 * Ported from official GitLens "Copy Changes (Patch)" (v18.x).
 * Copies a full commit patch or working-tree diff to the clipboard.
 */
@command()
export class CopyPatchToClipboardCommand extends ActiveEditorCommand {
	constructor(private readonly container: Container) {
		super([Commands.CopyPatchToClipboard, Commands.CopyWorkingTreePatchToClipboard]);
	}

	protected override preExecute(context: CommandContext, args?: CopyPatchToClipboardCommandArgs) {
		if (context.command === Commands.CopyWorkingTreePatchToClipboard) {
			return this.execute(context.editor, context.uri, { ...args, workingTree: true });
		}

		if (isCommandContextViewNodeHasCommit(context)) {
			return this.execute(context.editor, context.node.uri, {
				...args,
				repoPath: context.node.commit.repoPath,
				sha: context.node.commit.sha,
			});
		}

		return this.execute(context.editor, context.uri, args);
	}

	async execute(editor?: TextEditor, uri?: Uri, args?: CopyPatchToClipboardCommandArgs) {
		uri = getCommandUri(uri, editor);
		args = { ...args };

		try {
			let patch: string | undefined;

			if (args.workingTree) {
				const repoPath =
					args.repoPath ??
					this.container.git.getBestRepository(editor)?.path ??
					(uri != null ? (await GitUri.fromUri(uri)).repoPath : undefined);
				if (repoPath == null) {
					void window.showWarningMessage('未找到 Git 仓库。');
					return;
				}

				patch = await this.container.git.getWorkingTreePatch(repoPath, {
					staged: args.staged ?? 'all',
				});
				if (patch == null || patch.trim().length === 0) {
					void window.showInformationMessage('工作区没有可复制的变更。');
					return;
				}
			} else {
				let { repoPath, sha } = args;
				if (sha == null || repoPath == null) {
					if (uri == null) {
						const repo = this.container.git.getBestRepository(editor);
						repoPath = repo?.path;
						if (repoPath == null) return;
						const log = await this.container.git.getLog(repoPath, { limit: 1 });
						sha = log?.commits != null ? [...log.commits.values()][0]?.sha : undefined;
					} else {
						const gitUri = await GitUri.fromUri(uri);
						repoPath = gitUri.repoPath;
						if (sha == null && editor != null) {
							const blame = await this.container.git.getBlameForLine(
								gitUri,
								editor.selection.active.line,
								editor.document,
							);
							sha = blame?.commit.sha;
						}
						sha = sha ?? gitUri.sha;
					}
				}

				if (repoPath == null || sha == null) {
					void window.showWarningMessage('无法确定要复制的提交。');
					return;
				}

				patch = await this.container.git.getCommitPatch(repoPath, sha);
				if (patch == null || patch.trim().length === 0) {
					void window.showWarningMessage('该提交没有可复制的补丁内容。');
					return;
				}
			}

			await env.clipboard.writeText(patch);
			void window.showInformationMessage(
				args.workingTree ? '已复制工作区变更补丁到剪贴板。' : '已复制提交补丁到剪贴板。',
			);
		} catch (ex) {
			Logger.error(ex, 'CopyPatchToClipboardCommand');
			void Messages.showGenericErrorMessage('无法复制补丁');
		}
	}
}
