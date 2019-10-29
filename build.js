'use strict';

/* eslint-env node */
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const archiver = require('archiver');

//
// Input arguments
//
// `new_version` because `version` does not work.
const version = argv.new_version;
const versionName = argv.version_name;

//
// Building constants
//
const extensionDir = path.resolve(__dirname, 'extension');
const manifestFile = path.resolve(extensionDir, 'manifest.json');
const buildOutputDir = path.resolve(__dirname, 'build');

//
// Build functions.
//

// Update the manifest with new versions and versionnames.
function updateManifest ({version, versionName, browser}) {
    console.log('Updating manifest:');

    let manifestContent = fs.readFileSync(manifestFile).toString();

    if (version) {
        console.log(` - Version: ${version}`);
        manifestContent = manifestContent.replace(/("version.*?": ")\d\d?\.\d\d?\.\d\d?(:|")/g, `$1${version}$2`);
    }

    if (versionName) {
        console.log(` - Version name: ${versionName}`);
        manifestContent = manifestContent.replace(/("version_name": "\d\d?\.\d\d?\.\d\d?: \\")New Narwhal(\\"",)/, `$1${versionName}$2`);
    }

    if (versionName) {
        console.log(` - Version name: ${versionName}`);
        manifestContent = manifestContent.replace(/("version_name": "\d\d?\.\d\d?\.\d\d?: \\")New Narwhal(\\"",)/, `$1${versionName}$2`);
    }

    if (browser === 'chrome') {
        console.log('Make sure chrome manifest is complete');
        if (!manifestContent.includes('"incognito":')) {
            manifestContent = manifestContent.replace(/(\s*?"applications":)/, '\n    "incognito": "split",$1');
        }
    }

    if (browser === 'firefox') {
        console.log('Make sure firefox manifest is complete');
        manifestContent = manifestContent.replace(/\s*"incognito":.*?\n/, '\n');
    }

    fs.writeFileSync(manifestFile, manifestContent, 'utf8', err => {
        if (err) {
            throw err;
        }
    });
    console.log('Manifest has been updated with new information.\n');
}

function createZip (browser) {
    return new Promise((resolve, reject) => {
        // Update the manifest first if needed.
        updateManifest({
            version,
            versionName,
            browser,
        });

        // Then pull up the toolbox version.
        const manifestContent = fs.readFileSync(manifestFile).toString();
        const toolboxVersion = manifestContent.match(/"version": "(\d\d?\.\d\d?\.\d\d?)"/)[1];

        // Determine what the output filename will be.
        const outputName = `toolbox_v${toolboxVersion}_${browser}.zip`;
        const outputPath = path.resolve(buildOutputDir, outputName);

        // Check if the build directory is a thing and if it isn't make it
        try {
            fs.statSync(buildOutputDir);
        } catch (e) {
            fs.mkdirSync(buildOutputDir);
        }

        // Check for and delete excisting zip with the same name.
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        // Start zipping
        console.log(`Creating zip file for toolbox ${toolboxVersion} and browser ${browser}.`);
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip');

        output.on('close', () => {
            setTimeout(() => {
                console.log(`Zip created: ${archive.pointer()} total bytes`);
                console.log('Build done.', new Date().toISOString());
                resolve();
            }, 200);
        });

        archive.on('error', err => {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(extensionDir, false);

        archive.finalize();
    });
}

async function doZips () {
    await createZip('firefox');
    await createZip('chrome');
}

doZips();
