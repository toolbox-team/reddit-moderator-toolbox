/* eslint-env node */
'use strict';
const fs = require('fs');
const path = require('path');
const extensionManifest = require('./extension/manifest.json');
const archiver = require('archiver');

function createFirefoxProfile () {
    return new Promise((resolve, reject) => {
        const buildLocation = path.resolve(__dirname, 'build');
        const firefoxBuildLocation = path.resolve(buildLocation, `toolbox_v${extensionManifest.version}_firefox.zip`);
        const firefoxProfileLocaction = path.resolve(buildLocation, `toolbox_v${extensionManifest.version}_firefox_profile.zip`);

        const output = fs.createWriteStream(firefoxProfileLocaction);
        const archive = archiver('zip');

        output.on('close', () => {
            setTimeout(() => {
                resolve();
            }, 200);
        });

        archive.on('error', err => {
            reject(err);
        });

        archive.pipe(output);
        archive.append(fs.createReadStream(firefoxBuildLocation), {
            name: `extensions/${extensionManifest.applications.gecko.id}.xpi`,
        });

        archive.append('user_pref("xpinstall.signatures.required", false);', {
            name: 'prefs.js',
        });

        archive.finalize();
    });
}

createFirefoxProfile().then(() => {
    console.log('firefox profile written.');
});
