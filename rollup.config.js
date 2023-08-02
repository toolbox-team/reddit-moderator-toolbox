/* eslint-env node */

// import nodeResolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

// TODO: Pull entry point info and copied files from manifest itself
export default ['chrome', 'firefox'].flatMap(platform => [
    {
        input: 'extension/data/init.ts',
        output: {
            file: `build/${platform}/data/init.js`,
            // Sourcemaps without extra `web_accessible_resources` entries
            sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline',
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            typescript(),
            // Copy files not processed by Rollup over to the build directory
            copy({
                targets: [
                // The manifest
                    {
                        src: `extension/${platform}_manifest.json`,
                        dest: `build/${platform}`,
                        rename: 'manifest.json',
                    },
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
        input: 'extension/data/background/index.ts',
        output: {
            file: `build/${platform}/data/background/index.js`,
            sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline',
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            typescript(),
        ],
    },
]);
