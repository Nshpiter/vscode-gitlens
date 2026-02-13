const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const tscPath = path.join(__dirname, 'node_modules', '.bin', 'tsc.cmd');
console.log(`TSC Path: ${tscPath}`);

const configFile = path.join(__dirname, 'tsconfig.json');
console.log(`Config File: ${configFile}`);

const result = spawnSync(`"${tscPath}"`, ['-p', `"${configFile}"`, '--showConfig'], {
    cwd: __dirname,
    encoding: 'utf8',
    shell: true,
});


const output = `
--- STDOUT ---
${result.stdout}
--- STDERR ---
${result.stderr}
--- ERROR ---
${result.error}
--- STATUS ---
${result.status}
`;
fs.writeFileSync('debug_output.txt', output);

if (result.stdout) {
    try {
        const start = result.stdout.indexOf('{');
        const end = result.stdout.lastIndexOf('}') + 1;
        fs.appendFileSync('debug_output.txt', `Parsing substring: ${start} to ${end}\n`);
        const jsonStr = result.stdout.substring(start, end);
        const JSON5 = require('json5');
        JSON5.parse(jsonStr);
        fs.appendFileSync('debug_output.txt', "JSON5 Parse Success!\n");
    } catch (e) {
        fs.appendFileSync('debug_output.txt', "JSON5 Parse Failed!\n");
        fs.appendFileSync('debug_output.txt', e.toString());
    }
}

