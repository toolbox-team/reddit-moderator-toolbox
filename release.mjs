/* eslint-env node */
import inquirer from 'inquirer';
import fs from 'fs';
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

            manifestContentFirefox.version_name = `${answers.newVersion}: "${answers.newVersionName}"`;
            manifestContentChrome.version_name = `${answers.newVersion}: "${answers.newVersionName}"`;

            fs.writeFileSync(chromeManifestLocation, JSON.stringify(manifestContentChrome, null, 4), 'utf8', err => {
                if (err) {
                    throw err;
                }
            });
            fs.writeFileSync(firefoxManifestLocation, JSON.stringify(manifestContentFirefox, null, 4), 'utf8', err => {
                if (err) {
                    throw err;
                }
            });
        }
    });
