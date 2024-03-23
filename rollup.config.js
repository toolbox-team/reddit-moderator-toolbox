/* eslint-env node */

import path from 'node:path';

import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import postcss from 'rollup-plugin-postcss';

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
            replace({
                preventAssignment: true,
                values: {
                    // the jsx runtime wants this to be defined
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                },
            }),
            postcss({
                extract: path.resolve(`build/${platform}/data/bundled.css`),
            }),
            nodeResolve(),
            commonjs(),
            // HACK: see https://github.com/rollup/plugins/issues/1629
            typescript({
                include: 'extension/**/*.(ts|tsx|js|jsx)',
            }),
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
