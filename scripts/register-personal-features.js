/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '12.2.0';

const newCmds = [
	{
		command: 'gitlens.copyPatchToClipboard',
		title: '复制提交补丁',
		category: 'GitLens',
		icon: '$(copy)',
	},
	{
		command: 'gitlens.copyWorkingTreePatchToClipboard',
		title: '复制工作区变更补丁',
		category: 'GitLens',
		icon: '$(copy)',
	},
	{
		command: 'gitlens.softUndoLastCommit',
		title: '软撤销最近提交',
		category: 'GitLens',
		icon: '$(discard)',
	},
];

const existing = new Set((pkg.contributes.commands || []).map(c => c.command));
for (const c of newCmds) {
	if (!existing.has(c.command)) {
		pkg.contributes.commands.push(c);
	} else {
		const found = pkg.contributes.commands.find(x => x.command === c.command);
		if (found) Object.assign(found, c);
	}
}

const menus = pkg.contributes.menus || {};
function addMenu(key, item) {
	if (!menus[key]) menus[key] = [];
	const has = menus[key].some(m => m.command === item.command && (m.group || '') === (item.group || ''));
	if (!has) menus[key].push(item);
}

addMenu('view/item/context', {
	command: 'gitlens.copyPatchToClipboard',
	when: "viewItem =~ /gitlens:commit/ && !gitlens:readonly",
	group: '1_gitlens_copy@3',
});
addMenu('view/item/context', {
	command: 'gitlens.softUndoLastCommit',
	when: "viewItem =~ /gitlens:commit/",
	group: '3_gitlens_modify@99',
});
addMenu('scm/title', {
	command: 'gitlens.copyWorkingTreePatchToClipboard',
	when: 'scmProvider == git',
	group: 'navigation@99',
});
addMenu('commandPalette', {
	command: 'gitlens.copyPatchToClipboard',
	when: 'gitlens:enabled',
});
addMenu('commandPalette', {
	command: 'gitlens.copyWorkingTreePatchToClipboard',
	when: 'gitlens:enabled',
});
addMenu('commandPalette', {
	command: 'gitlens.softUndoLastCommit',
	when: 'gitlens:enabled',
});

pkg.contributes.menus = menus;

const acts = new Set(pkg.activationEvents || []);
acts.add('onCommand:gitlens.copyPatchToClipboard');
acts.add('onCommand:gitlens.copyWorkingTreePatchToClipboard');
acts.add('onCommand:gitlens.softUndoLastCommit');
pkg.activationEvents = [...acts];

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);
console.log('registered personal features for', pkg.version);
