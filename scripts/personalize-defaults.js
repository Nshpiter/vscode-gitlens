/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '12.2.0';

// Official v18-style activation: one main gate after startup
pkg.activationEvents = [
	'onStartupFinished',
	'onFileSystem:gitlens',
	'onCustomEditor:gitlens.rebase',
	'onView:gitlens.views.commits',
	'onView:gitlens.views.fileHistory',
	'onView:gitlens.views.home',
	'onWebviewPanel:gitlens.settings',
	'onWebviewPanel:gitlens.welcome',
	'onWebviewPanel:gitlens.timeline',
	'onCommand:gitlens.showCommitDetailsPage',
];

function setDefault(id, value) {
	for (const section of pkg.contributes.configuration || []) {
		const p = section.properties && section.properties[id];
		if (p) {
			p.default = value;
			return true;
		}
	}
	return false;
}

function ensureAdvancedProp(id, prop) {
	for (const section of pkg.contributes.configuration || []) {
		if (section.properties && section.properties['gitlens.advanced.caching.enabled']) {
			section.properties[id] = prop;
			return;
		}
	}
	const last = pkg.contributes.configuration[pkg.contributes.configuration.length - 1];
	last.properties = last.properties || {};
	last.properties[id] = prop;
}

// Official 17.1+ — default ON for personal large-repo comfort
ensureAdvancedProp('gitlens.advanced.commits.delayLoadingFileDetails', {
	type: 'boolean',
	default: true,
	markdownDescription:
		'**(Personal / official 17.1+)** Delay loading per-commit file details until needed. Faster commit lists on large histories; files load when you expand a commit or open details.',
	scope: 'window',
	order: 120,
});

setDefault('gitlens.statusBar.reduceFlicker', true);
setDefault('gitlens.currentLine.pullRequests.enabled', false);
setDefault('gitlens.statusBar.pullRequests.enabled', false);
setDefault('gitlens.hovers.pullRequests.enabled', false);
setDefault('gitlens.hovers.autolinks.enhanced', false);
setDefault('gitlens.advanced.maxListItems', 200);
setDefault('gitlens.advanced.caching.enabled', true);
setDefault('gitlens.codeLens.scopes', ['document']);
setDefault('gitlens.keymap', 'none');
setDefault('gitlens.virtualRepositories.enabled', false);
setDefault('gitlens.showWelcomeOnInstall', false);
setDefault('gitlens.showWhatsNewAfterUpgrades', false);
setDefault('gitlens.views.commits.pullRequests.enabled', false);
setDefault('gitlens.views.branches.pullRequests.enabled', false);
setDefault('gitlens.views.remotes.pullRequests.enabled', false);
setDefault('gitlens.views.defaultItemLimit', 40);
setDefault('gitlens.views.pageItemLimit', 60);
setDefault('gitlens.currentLine.format', '${author, }${agoOrDate}${ • message|40?}');
setDefault('gitlens.currentLine.scrollable', false);
setDefault('gitlens.statusBar.format', '${author}, ${agoOrDate}');
// File stats often empty when delayLoadingFileDetails is on
setDefault('gitlens.views.formats.commits.description', '${author, }${agoOrDate}');
setDefault('gitlens.views.commits.showBranchComparison', false);
setDefault('gitlens.views.repositories.autoRefresh', false);
setDefault('gitlens.plusFeatures.enabled', true);
setDefault('gitlens.outputLevel', 'errors');
setDefault('gitlens.defaultDateStyle', 'relative');
setDefault('gitlens.defaultGravatarsStyle', 'identicon');
setDefault('gitlens.menus', {
	editor: { blame: true, clipboard: true, compare: true, history: true, remote: false },
	editorGroup: { blame: true, compare: true },
	editorTab: { clipboard: true, compare: true, history: true, remote: false },
	explorer: { clipboard: true, compare: true, history: true, remote: false },
	scm: { authors: true },
	scmGroupInline: { stash: true },
	scmGroup: { compare: true, openClose: true, stash: true },
	scmItem: { clipboard: true, compare: true, history: true, remote: false, stash: true },
});
setDefault('gitlens.advanced.messages', {
	suppressCommitHasNoPreviousCommitWarning: true,
	suppressCommitNotFoundWarning: true,
	suppressCreatePullRequestPrompt: true,
	suppressDebugLoggingWarning: true,
	suppressFileNotUnderSourceControlWarning: true,
	suppressGitDisabledWarning: false,
	suppressGitMissingWarning: false,
	suppressGitVersionWarning: true,
	suppressLineUncommittedWarning: true,
	suppressNoRepositoryWarning: true,
	suppressRebaseSwitchToTextWarning: true,
});

for (const views of Object.values(pkg.contributes.views || {})) {
	for (const v of views) {
		switch (v.id) {
			case 'gitlens.views.commits':
			case 'gitlens.views.fileHistory':
				v.visibility = 'visible';
				break;
			case 'gitlens.views.branches':
			case 'gitlens.views.contributors':
			case 'gitlens.views.timeline':
			case 'gitlens.views.home':
				v.visibility = 'collapsed';
				break;
			default:
				v.visibility = 'hidden';
				break;
		}
	}
}

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);
console.log('personalized', pkg.version, 'activationEvents', pkg.activationEvents.length);
