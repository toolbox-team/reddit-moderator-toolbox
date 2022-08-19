/* eslint-env node */
import path from 'path';
import archiver from 'archiver';
import fs from 'fs';

function createZip (src, platform, dest, toolboxVersion) {
    return new Promise((resolve, reject) => {
        // Then pull up the toolbox version.

        // Determine what the output filename will be.
        const outputName = `toolbox_v${toolboxVersion}_${platform}.zip`;
        const outputPath = path.resolve(dest, outputName);

        // Check if the build directory is a thing and if it isn't make it
        try {
            fs.statSync(dest);
        } catch (e) {
            fs.mkdirSync(dest);
        }

        // Check for and delete excisting zip with the same name.
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        // Start zipping
        console.log(`Creating zip file for toolbox ${toolboxVersion} and browser ${platform}.`);
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
        archive.directory(src, false);

        archive.finalize();
    });
}

export default function (options) {
    const {src, platform, dest} = options;
    return {
        name: 'package-zip',
        async writeBundle () {
            const manifestString = fs.readFileSync(`${src}/manifest.json`).toString();
            const manifestContent = JSON.parse(manifestString);
            const toolboxVersion = manifestContent.version;
            await createZip(src, platform, dest, toolboxVersion);
        },
    };
}
