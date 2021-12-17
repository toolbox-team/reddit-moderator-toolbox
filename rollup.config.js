/* eslint-env node */

// import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

// TODO: Pull entry point info and copied files from manifest itself
export default ['chrome', 'firefox'].map(platform => ({
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
                // Background scripts which are not yet module-based
                {src: 'extension/data/background', dest: `build/${platform}/data`},
                // Non-script assets
                {src: 'extension/data/images', dest: `build/${platform}/data`},
                {src: 'extension/data/styles', dest: `build/${platform}/data`},
                // tbmigrate is weird
                {src: 'extension/data/tbmigrate.js', dest: `build/${platform}/data`},
            ],
        }),
    ],
    // onwarn (warning, warn) {
    //     // Suppress warnings from dependencies (Rollup complains about
    //     // webextension-polyfill using top-level `this` even though it's fine)
    //     if (warning.code === 'THIS_IS_UNDEFINED') {
    //         return;
    //     }
    //     // log other warnings to console
    //     warn(warning);
    // },
}));
