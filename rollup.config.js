/* eslint-env node */

// import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

// TODO: Pull entry point info and copied files from manifest itself
export default ['chrome', 'firefox'].flatMap(platform => [
    {
        input: 'extension/data/init.js',
        output: {
            file: `build/${platform}/data/init.js`,
            // Sourcemaps without extra `web_accessible_resources` entries
            sourcemap: 'inline',
        },
        plugins: [
            // nodeResolve(),
            // Copy files not processed by Rollup over to the build directory
            copy({
                targets: [
                // The manifest
                    {
                        src: 'extension/manifest.json',
                        dest: `build/${platform}`,
                        transform: contents => {
                            const manifest = JSON.parse(contents);

                            // Firefox doesn't support "incognito": "split"
                            if (platform === 'firefox') {
                                manifest.incognito = undefined;
                            }

                            return JSON.stringify(manifest, null, 4);
                        },
                    },
                    // Vendor scripts that gets carried over unchanged
                    {src: 'extension/data/libs', dest: `build/${platform}/data`},
                    // Non-script assets
                    {src: 'extension/data/images', dest: `build/${platform}/data`},
                    {src: 'extension/data/styles', dest: `build/${platform}/data`},
                    // tbmigrate is weird
                    {src: 'extension/data/tbmigrate.js', dest: `build/${platform}/data`},
                ],
            }),
        ],
    },
    {
        input: 'extension/data/background/index.js',
        output: {
            file: `build/${platform}/data/background/index.js`,
            sourcemap: 'inline',
        },
        plugins: [
            // nodeResolve(),
        ],
    },
]);
