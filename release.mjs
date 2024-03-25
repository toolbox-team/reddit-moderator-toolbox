/* eslint-env node */
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import {fileURLToPath} from 'url';

const versionNameRegex = /^[\d.]+?: "(.+?)"/;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chromeManifestLocation = path.resolve(__dirname, 'extension/chrome_manifest.json');
const firefoxManifestLocation = path.resolve(__dirname, 'extension/firefox_manifest.json');

const manifestContentChrome = JSON.parse(fs.readFileSync(chromeManifestLocation).toString());
const manifestContentFirefox = JSON.parse(fs.readFileSync(firefoxManifestLocation).toString());

const currentVersion = manifestContentChrome.version;
const currentVersionName = manifestContentChrome.version_name.match(versionNameRegex)[1];

console.log('\n--------');
console.log('Update version information');
console.log('--------\n');

inquirer
    .prompt([
        {
            name: 'newVersion',
            message: 'New version',
            default: currentVersion,
        },
        {
            name: 'newVersionName',
            message: 'New version name',
            default: currentVersionName,
        },
    ])
    .then(answers => {
        if (answers.newVersion !== currentVersion || answers.newVersionName !== currentVersionName) {
            console.log('Writing update version information to manifest');
            manifestContentFirefox.version = answers.newVersion;
            manifestContentChrome.version = answers.newVersion;

            const displayNewVersion = answers.newVersion.replace(/\.\d+$/, '');
            manifestContentFirefox.version_name = `${displayNewVersion}: "${answers.newVersionName}"`;
            manifestContentChrome.version_name = `${displayNewVersion}: "${answers.newVersionName}"`;

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
        }
    });
