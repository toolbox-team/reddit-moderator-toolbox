/* eslint-env node */

import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';

// TODO: Use multiple configs to generate builds for all target platforms and do
//       manifest transforms for Firefox in here
// TODO: Pull entry point info and copied files from manifest itself
export default {
    input: 'extension/data/init.js',
    output: {
        file: 'build/data/init.js',
        // Sourcemaps without extra `web_accessible_resources` entries
        sourcemap: 'inline',
    },
    plugins: [
        nodeResolve(),
        // Copy files not processed by Rollup over to the build directory
        copy({
            targets: [
                // The manifest
                {src: 'extension/manifest.json', dest: 'build'},
                // Vendor scripts that gets carried over unchanged
                {src: 'extension/data/libs/**/*', dest: 'build/data/libs'},
                // Background scripts which are not yet module-based
                {src: 'extension/data/background/**/*', dest: 'build/data/background'},
                // Non-script assets
                {src: 'extension/data/images/**/*', dest: 'build/data/images'},
                {src: 'extension/data/styles/**/*', dest: 'build/data/styles'},
                // tbmigrate is weird
                {src: 'extension/data/tbmigrate.js', dest: 'build/data'},
            ],
        }),
    ],
    onwarn (warning, warn) {
        // Suppress warnings from dependencies (Rollup complains about
        // webextension-polyfill using top-level `this` even though it's fine)
        if (warning.code === 'THIS_IS_UNDEFINED') {
            return;
        }
        // log other warnings to console
        warn(warning);
    },
};
