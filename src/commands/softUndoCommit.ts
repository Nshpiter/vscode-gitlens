import { TextEditor, Uri, window } from 'vscode';
import { Commands } from '../constants';
import type { Container } from '../container';
import { Logger } from '../logger';
import { Messages } from '../messages';
import { command } from '../system/command';
import {
	ActiveEditorCommand,
	CommandContext,
	isCommandContextViewNodeHasCommit,
} from './base';

/**
 * Personal port inspired by official Graph "Undo Commit" adornment.
 * Soft-resets HEAD~1 so the last commit is undone but changes stay staged.
 */
@command()
export class SoftUndoCommitCommand extends ActiveEditorCommand {
	constructor(private readonly container: Container) {
		super(Commands.SoftUndoLastCommit);
	}

	protected override preExecute(context: CommandContext) {
		if (isCommandContextViewNodeHasCommit(context)) {
			const commit = context.node.commit;
			// Only allow when this is likely HEAD tip — still confirm
			return this.execute(context.editor, context.node.uri, commit.repoPath, commit.shortSha);
		}
		return this.execute(context.editor, context.uri);
	}

	async execute(_editor?: TextEditor, _uri?: Uri, repoPath?: string, shortSha?: string) {
		try {
			const repo = repoPath
				? this.container.git.getRepository(repoPath)
				: this.container.git.getBestRepository(_editor);
			if (repo == null) {
				void window.showWarningMessage('未找到 Git 仓库。');
				return;
			}

			const log = await this.container.git.getLog(repo.path, { limit: 1 });
			const head = log?.commits != null ? [...log.commits.values()][0] : undefined;
			if (head == null) {
				void window.showWarningMessage('没有可撤销的提交。');
				return;
			}

			const label = shortSha ?? head.shortSha;
			const confirm = await window.showWarningMessage(
				`软撤销最近一次提交 ${label}？\n\n提交会被取消，改动会保留在暂存区（git reset --soft HEAD~1）。`,
				{ modal: true },
				'撤销提交',
				'取消',
			);
			if (confirm !== '撤销提交') return;

			const ok = await this.container.git.softResetHead(repo.path);
			if (!ok) {
				void window.showErrorMessage('当前 Git 提供程序不支持软撤销。');
				return;
			}

			void window.showInformationMessage(`已软撤销提交 ${head.shortSha}，改动仍在暂存区。`);
		} catch (ex) {
			Logger.error(ex, 'SoftUndoCommitCommand');
			void Messages.showGenericErrorMessage('无法撤销提交');
		}
	}
}
