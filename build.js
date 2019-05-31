/* eslint-env node */
const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const archiver = require('archiver');

//
// Input arguments
//
const makeDocs = argv.docs;
// `new_version` because `version` does not work.
const version = argv.new_version;
const versionName = argv.version_name;

//
// Documentation constants
//
const docInput = ['./extension/data/modules/*.js', './extension/data/*.js'];
const docOutput = path.resolve(__dirname, 'code_jsdocs.md');
const jsdocConfig = path.resolve(__dirname, 'jsdoc.json');

//
// Building constants
//
const extensionDir = path.resolve(__dirname, 'extension');
const manifestFile = path.resolve(extensionDir, 'manifest.json');
const buildOutputDir = path.resolve(__dirname, 'build');

//
// Build functions.
//

// Update the code documentation. For now just to a simple markdown file.
function updateDocs () {
    console.log('Rendering docs.');
    jsdoc2md.render({
        files: docInput,
        configure: jsdocConfig,
    }).then(output => {
        fs.writeFileSync(docOutput, output, 'utf8', err => {
            if (err) {
                throw err;
            }
        });
        console.log('Docs have been updated.\n');
    });
}

// Update the manifest with new versions and versionnames.
function updateManifest ({version, versionName}) {
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

    fs.writeFileSync(manifestFile, manifestContent, 'utf8', err => {
        if (err) {
            throw err;
        }
    });
    console.log('Manifest has been updated with new version information.\n');
}

function createZip () {
    // Update the manifest first if needed.
    if (version || versionName) {
        updateManifest({
            version,
            versionName,
        });
    }

    // Then pull up the toolbox version.
    const manifestContent = fs.readFileSync(manifestFile).toString();
    const toolboxVersion = manifestContent.match(/"version": "(\d\d?\.\d\d?\.\d\d?)"/)[1];

    // Determine what the output filename will be.
    const outputName = `toolbox_v${toolboxVersion}.zip`;
    const outputPath = path.resolve(buildOutputDir, outputName);

    // Check for and delete excisting zip with the same name.
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    // Start zipping
    console.log(`Creating zip file for toolbox ${toolboxVersion}.`);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip');

    output.on('close', () => {
        console.log(`Zip created: ${archive.pointer()} total bytes`);
        console.log('Build done.');
    });

    archive.on('error', err => {
        throw err;
    });

    archive.pipe(output);
    archive.directory(extensionDir, false);

    archive.finalize();
}

if (makeDocs) {
    updateDocs();
}

createZip();

