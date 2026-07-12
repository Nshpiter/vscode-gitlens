/*global document*/
import './commitDetails.scss';
import type { CommitFileChange, State } from '../../commitDetails/protocol';
import {
	CopyHashCommandType,
	CopyMessageCommandType,
	CopyPatchCommandType,
	NavigateCommandType,
	OpenFileDiffCommandType,
	OpenWorkingFileCommandType,
	RefreshCommandType,
	RevealInExplorerCommandType,
} from '../../commitDetails/protocol';
import { App } from '../shared/appBase';

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

		if (state == null || state.empty === true || state.sha == null || state.sha.length === 0) {
			empty.classList.remove('hidden');
			return;
		}

		header.classList.remove('hidden');
		filesSection.classList.remove('hidden');
		document.getElementById('toolbar')!.classList.remove('hidden');

		const avatar = document.getElementById('avatar') as HTMLImageElement;
		if (state.avatarUrl) {
			avatar.src = state.avatarUrl;
		} else {
			avatar.style.display = 'none';
		}

		(document.getElementById('summary') as HTMLElement).textContent = state.summary || '(无提交信息)';
		(document.getElementById('author') as HTMLElement).textContent = state.author;
		const dateEl = document.getElementById('date') as HTMLElement;
		dateEl.textContent = state.dateAgo;
		dateEl.title = state.dateText;

		const shaEl = document.getElementById('sha') as HTMLElement;
		shaEl.textContent = state.shortSha;
		shaEl.title = state.sha;

		if (state.body && state.body.trim().length > 0) {
			bodySection.classList.remove('hidden');
			(document.getElementById('body-text') as HTMLElement).textContent = state.body;
		}

		if (state.remoteUrl) {
			const link = document.getElementById('remote-link') as HTMLAnchorElement;
			link.href = state.remoteUrl;
			link.classList.remove('hidden');
		}

		const filesCount = state.files.length;
		(document.getElementById('files-count') as HTMLElement).textContent = `${filesCount} 个文件变更`;
		if (state.stats != null) {
			const statsEl = document.getElementById('stats') as HTMLElement;
			statsEl.innerHTML = `<span class="additions">+${state.stats.additions}</span> <span class="deletions">-${state.stats.deletions}</span>`;
		}

		const prevBtn = document.getElementById('nav-prev') as HTMLButtonElement;
		const nextBtn = document.getElementById('nav-next') as HTMLButtonElement;
		if (state.hasPrev === false) prevBtn.disabled = true;
		if (state.hasNext === false) nextBtn.disabled = true;

		const list = document.getElementById('files-list') as HTMLElement;
		list.innerHTML = state.files
			.map(
				(f: CommitFileChange, i) => `
			<li class="file-item" data-index="${i}" title="单击打开 diff">
				<span class="file-status" style="color:${statusColor(f.status)}">${escapeHtml(statusLabel(f.status))}</span>
				<span class="file-path" title="${escapeHtml(f.path)}">${escapeHtml(f.path)}</span>
				<span class="file-stats"><span class="additions">+${f.additions}</span> <span class="deletions">-${
					f.deletions
				}</span></span>
				<span class="file-actions">
					<button type="button" class="file-action" data-act="open" title="打开工作区文件">打开</button>
					<button type="button" class="file-action" data-act="reveal" title="在资源管理器中显示">定位</button>
				</span>
			</li>
		`,
			)
			.join('');

		list.addEventListener('click', e => {
			const target = e.target as HTMLElement;
			const actionBtn = target.closest('.file-action');
			const row = target.closest('.file-item');
			if (!(row instanceof HTMLElement)) return;
			const idx = Number(row.dataset.index);
			const file = state.files[idx];
			if (file == null) return;

			if (actionBtn instanceof HTMLElement) {
				e.stopPropagation();
				const act = actionBtn.dataset.act;
				if (act === 'open') {
					this.sendCommand(OpenWorkingFileCommandType, { repoPath: file.repoPath, path: file.path });
				} else if (act === 'reveal') {
					this.sendCommand(RevealInExplorerCommandType, { repoPath: file.repoPath, path: file.path });
				}
				return;
			}

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
			setTimeout(() => (copyBtn.textContent = '复制 SHA'), 1200);
		});

		document.getElementById('copy-patch')!.addEventListener('click', () => {
			this.sendCommand(CopyPatchCommandType, { sha: state.sha, repoPath: state.repoPath });
		});
		document.getElementById('copy-message')!.addEventListener('click', () => {
			this.sendCommand(CopyMessageCommandType, { message: state.message });
		});

		prevBtn.addEventListener('click', () => {
			this.sendCommand(NavigateCommandType, {
				sha: state.sha,
				repoPath: state.repoPath,
				direction: 'prev',
			});
		});
		nextBtn.addEventListener('click', () => {
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
