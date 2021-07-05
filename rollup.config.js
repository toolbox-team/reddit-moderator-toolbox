/* eslint-env node */

// import nodeResolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

const targetPlatform = process.env.TARGET_PLATFORM;
export default {
    input: 'extension/data/init.js',
    output: {
        file: `build/${targetPlatform}/data/init.js`,
        sourcemap: true,
    },
    plugins: [
        copy({
            targets: [
                // The manifest
                {src: 'extension/{manifest.json,content_script.js}', dest: `build/${targetPlatform}`},
                // Vendor scripts that gets carried over unchanged
                {src: 'extension/data/libs/**/*', dest: `build/${targetPlatform}/data/libs`},
                // Background scripts which are not yet module-based
                {src: 'extension/data/background/**/*', dest: `build/${targetPlatform}/data/background`},
                // Non-script assets
                {src: 'extension/data/images/**/*', dest: `build/${targetPlatform}/data/images`},
                {src: 'extension/data/styles/**/*', dest: `build/${targetPlatform}/data/styles`},
                // tbmigrate is weird
                {src: 'extension/data/tbmigrate.js', dest: `build/${targetPlatform}/data`},
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
};
