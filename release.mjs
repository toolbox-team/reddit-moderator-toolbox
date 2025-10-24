/* eslint-env node */
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import input from '@inquirer/input';
import select from '@inquirer/select';

function runCommand (command) {
    console.log(`\x1b[1m$ ${command}\x1b[0m`);
    execSync(command, {stdio: 'inherit'});
    console.log();
}

// check that working directory is clean - release commits should not contain
// any other changes
if (execSync('git status --porcelain', {encoding: 'utf8'})) {
    console.error('found uncommitted changes; ensure that you are on the master branch and `git status` is clean');
    process.exit(1);
}

const versionNameRegex = /^[\d.]+?: "(.+?)"/;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chromeManifestLocation = path.resolve(__dirname, 'extension/chrome_manifest.json');
const firefoxManifestLocation = path.resolve(__dirname, 'extension/firefox_manifest.json');

const manifestContentChrome = JSON.parse(fs.readFileSync(chromeManifestLocation).toString());
const manifestContentFirefox = JSON.parse(fs.readFileSync(firefoxManifestLocation).toString());

const currentVersion = manifestContentChrome.version;
const currentVersionName = manifestContentChrome.version_name.match(versionNameRegex)[1];

(async () => {
    const newVersion = await input({
        message: 'New version',
        default: currentVersion,
    });
    const newVersionName = await input({
        message: 'New version name',
        default: currentVersionName,
    });
    const releaseType = await select({
        message: 'Release type',
        type: 'list',
        choices: ['beta', 'stable'],
    });

    if (newVersion === currentVersion && newVersionName === currentVersionName) {
        console.log('Nothing to change');
        process.exit(0);
    }

    console.log('Writing update version information to manifest');
    manifestContentFirefox.version = newVersion;
    manifestContentChrome.version = newVersion;

    const versionParts = newVersion.match(/(?<display>\d\d?\.\d\d?\.\d\d?)\.(?<build>\d+)$/).groups;
    manifestContentFirefox.version_name = `${versionParts.display}: "${newVersionName}"`;
    manifestContentChrome.version_name = `${versionParts.display}: "${newVersionName}"`;

    fs.writeFileSync(
        chromeManifestLocation,
        // include trailing newline
        `${JSON.stringify(manifestContentChrome, null, 4)}\n`,
        'utf8',
        err => {
            if (err) {
                throw err;
            }
        },
    );
    fs.writeFileSync(
        firefoxManifestLocation,
        // include trailing newline
        `${JSON.stringify(manifestContentFirefox, null, 4)}\n`,
        'utf8',
        err => {
            if (err) {
                throw err;
            }
        },
    );

    // tag the release
    const tagName = `v${versionParts.display}${releaseType === 'beta' ? `-beta.${versionParts.build}` : ''}`;
    console.log('Creating release commit and tag:', tagName);
    console.log();
    runCommand(`git commit -am "${tagName}"`);
    runCommand(`git tag "${tagName}"`);

    console.log('Commit and tag created! Verify everything looks good, then push new commit and tag');
})();
