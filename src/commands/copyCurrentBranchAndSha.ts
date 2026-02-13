import { env, TextEditor, Uri, window } from 'vscode';
import { Commands } from '../constants';
import type { Container } from '../container';
import { GitUri } from '../git/gitUri';
import { GitRevision } from '../git/models/reference';
import { Logger } from '../logger';
import { RepositoryPicker } from '../quickpicks/repositoryPicker';
import { command } from '../system/command';
import { first } from '../system/iterable';
import { ActiveEditorCommand, getCommandUri } from './base';

@command()
export class CopyCurrentBranchAndShaCommand extends ActiveEditorCommand {
	constructor(private readonly container: Container) {
		super(Commands.CopyCurrentBranchAndSha);
	}

	async execute(editor?: TextEditor, uri?: Uri) {
		uri = getCommandUri(uri, editor);

		const gitUri = uri != null ? await GitUri.fromUri(uri) : undefined;
		const repository = await RepositoryPicker.getBestRepositoryOrShow(
			gitUri,
			editor,
			'Copy Current Branch and Commit SHA',
		);
		if (repository == null) return;

		try {
			const branch = await repository.getBranch();
			if (branch?.name == null) return;

			let shortSha = branch.sha ? GitRevision.shorten(branch.sha) : undefined;
			if (shortSha == null) {
				const log = await this.container.git.getLog(repository.path, { limit: 1 });
				const head = log != null ? first(log.commits.values()) : undefined;
				shortSha = head?.shortSha ?? head?.sha?.substring(0, 8);
			}

			await env.clipboard.writeText(shortSha ? `${branch.name}@${shortSha}` : branch.name);
		} catch (ex) {
			Logger.error(ex, 'CopyCurrentBranchAndShaCommand');
			void window.showErrorMessage('Unable to copy current branch and commit SHA. See output channel for more details');
		}
	}
}
