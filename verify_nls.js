const fs = require('fs');
const path = require('path');

const projectDir = 'd:/Cyber-Space/github projects/vscode-gitlens';
const nlsEnPath = path.join(projectDir, 'package.nls.json');
const nlsZhPath = path.join(projectDir, 'package.nls.zh-cn.json');
const packageJsonPath = path.join(projectDir, 'package.json');

const nlsEn = JSON.parse(fs.readFileSync(nlsEnPath, 'utf8'));
const nlsZh = JSON.parse(fs.readFileSync(nlsZhPath, 'utf8'));
const packageJson = fs.readFileSync(packageJsonPath, 'utf8');

console.log('--- NLS Keys Consistency Check ---');

// 1. Check if all keys in En exist in Zh
const enKeys = Object.keys(nlsEn);
const zhKeys = Object.keys(nlsZh);

const missingInZh = enKeys.filter(k => !zhKeys.includes(k));
const missingInEn = zhKeys.filter(k => !enKeys.includes(k));

if (missingInZh.length > 0) {
    console.log(`[WARNING] Missing in Chinese (${missingInZh.length}):`);
    // missingInZh.forEach(k => console.log(` - ${k}`));
} else {
    console.log('[OK] All English keys have Chinese translations.');
}

if (missingInEn.length > 0) {
    console.log(`[INFO] Extra keys in Chinese (not in English) (${missingInEn.length}):`);
    // missingInEn.forEach(k => console.log(` - ${k}`));
}

// 2. Check keys used in package.json
// Refined regex to match %...% but skip things that look like URL encoded chars like %22
const nlsKeyRegex = /%(?![\da-fA-F]{2})([\w\.-]+)%/g;
let match;
const usedKeys = new Set();
while ((match = nlsKeyRegex.exec(packageJson)) !== null) {
    usedKeys.add(match[1]);
}

const missingFromUsed = Array.from(usedKeys).filter(k => !nlsEn[k]);
if (missingFromUsed.length > 0) {
    console.log(`[ERROR] Keys used in package.json but missing in NLS files (${missingFromUsed.length}):`);
    missingFromUsed.forEach(k => console.log(` - ${k}`));
} else {
    console.log('[OK] All keys used in package.json are defined.');
}

// 3. Check HTML files for placeholders
const walkDir = (dir, callback) => {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
};

console.log('\n--- HTML Placeholder Check ---');
let htmlMissingKeys = new Set();
walkDir(path.join(projectDir, 'src/webviews/apps/settings/partials'), (filePath) => {
    if (filePath.endsWith('.html')) {
        const content = fs.readFileSync(filePath, 'utf8');
        while ((match = nlsKeyRegex.exec(content)) !== null) {
            if (!nlsEn[match[1]] && !nlsZh[match[1]]) {
                htmlMissingKeys.add(`${match[1]} (in ${path.basename(filePath)})`);
            }
        }
    }
});

if (htmlMissingKeys.size > 0) {
    console.log(`[WARNING] Keys used in HTML but missing in NLS files (${htmlMissingKeys.size}):`);
    htmlMissingKeys.forEach(k => console.log(` - ${k}`));
} else {
    console.log('[OK] All keys used in Settings HTML files are defined.');
}
