/*global document*/
import './commitDetails.scss';
import { App } from '../shared/appBase';
import type { CommitFileChange, State } from '../../commitDetails/protocol';
import { CopyHashCommandType, NavigateCommandType, OpenFileDiffCommandType, RefreshCommandType } from '../../commitDetails/protocol';

function statusLabel(s: string): string {
	switch (s) {
		case 'A':
		case '?':
			return '新增';
		case 'M':
			return '修改';
		case 'D':
			return '删除';
		case 'R':
			return '重命名';
		case 'C':
			return '复制';
		default:
			return s;
	}
}

function statusColor(s: string): string {
	switch (s) {
		case 'A':
		case '?':
			return 'var(--vscode-gitDecoration-addedResourceForeground, #587c0c)';
		case 'M':
			return 'var(--vscode-gitDecoration-modifiedResourceForeground, #d7b125)';
		case 'D':
			return 'var(--vscode-gitDecoration-deletedResourceForeground, #b03030)';
		default:
			return 'var(--vscode-foreground)';
	}
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export class CommitDetailsApp extends App<State> {
	constructor() {
		super('CommitDetailsApp');
	}

	protected override onInitialized(): void {
		const state = this.state;
		const empty = document.getElementById('empty')!;
		const header = document.getElementById('header')!;
		const filesSection = document.getElementById('files-section')!;
		const bodySection = document.getElementById('body')!;

		if (!state || state.empty || !state.sha) {
			empty.classList.remove('hidden');
			return;
		}

		header.classList.remove('hidden');
		filesSection.classList.remove('hidden');
		document.getElementById('toolbar')!.classList.remove('hidden');

		// Avatar
		const avatar = document.getElementById('avatar') as HTMLImageElement;
		if (state.avatarUrl) {
			avatar.src = state.avatarUrl;
		} else {
			avatar.style.display = 'none';
		}

		// Summary & meta
		(document.getElementById('summary') as HTMLElement).textContent = state.summary || '(无提交信息)';
		(document.getElementById('author') as HTMLElement).textContent = state.author;
		const dateEl = document.getElementById('date') as HTMLElement;
		dateEl.textContent = state.dateAgo;
		dateEl.title = state.dateText;

		const shaEl = document.getElementById('sha') as HTMLElement;
		shaEl.textContent = state.shortSha;
		shaEl.title = state.sha;

		// Body
		if (state.body && state.body.trim().length > 0) {
			bodySection.classList.remove('hidden');
			(document.getElementById('body-text') as HTMLElement).textContent = state.body;
		}

		// Remote link
		if (state.remoteUrl) {
			const link = document.getElementById('remote-link') as HTMLAnchorElement;
			link.href = state.remoteUrl;
			link.classList.remove('hidden');
		}

		// Stats
		const filesCount = state.files.length;
		(document.getElementById('files-count') as HTMLElement).textContent = `${filesCount} 个文件变更`;
		if (state.stats) {
			const statsEl = document.getElementById('stats') as HTMLElement;
			statsEl.innerHTML = `<span class="additions">+${state.stats.additions}</span> <span class="deletions">-${state.stats.deletions}</span>`;
		}

		// Files list
		const list = document.getElementById('files-list') as HTMLElement;
		list.innerHTML = state.files
			.map(
				(f: CommitFileChange, i) => `
			<li class="file-item" data-index="${i}">
				<span class="file-status" style="color:${statusColor(f.status)}" title="${escapeHtml(
					statusLabel(f.status),
				)}">${escapeHtml(statusLabel(f.status))}</span>
				<span class="file-path" title="${escapeHtml(f.path)}">${escapeHtml(f.path)}</span>
				<span class="file-stats"><span class="additions">+${f.additions}</span> <span class="deletions">-${f.deletions}</span></span>
			</li>
		`,
			)
			.join('');

		list.addEventListener('click', e => {
			const target = (e.target as HTMLElement).closest('.file-item') as HTMLElement;
			if (target == null) return;
			const idx = Number(target.dataset.index);
			const file = state.files[idx];
			if (file == null) return;
			this.sendCommand(OpenFileDiffCommandType, {
				sha: file.sha,
				repoPath: file.repoPath,
				path: file.path,
				originalPath: file.originalPath,
			});
		});

		const copyBtn = document.getElementById('copy-sha') as HTMLButtonElement;
		copyBtn.addEventListener('click', () => {
			this.sendCommand(CopyHashCommandType, { sha: state.sha });
			copyBtn.textContent = '已复制';
			setTimeout(() => (copyBtn.textContent = '复制'), 1200);
		});

		document.getElementById('nav-prev')!.addEventListener('click', () => {
			this.sendCommand(NavigateCommandType, {
				sha: state.sha,
				repoPath: state.repoPath,
				direction: 'prev',
			});
		});
		document.getElementById('nav-next')!.addEventListener('click', () => {
			this.sendCommand(NavigateCommandType, {
				sha: state.sha,
				repoPath: state.repoPath,
				direction: 'next',
			});
		});
		document.getElementById('refresh')!.addEventListener('click', () => {
			this.sendCommand(RefreshCommandType, {
				sha: state.sha,
				repoPath: state.repoPath,
			});
		});
	}
}

new CommitDetailsApp();
