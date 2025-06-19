// Build-time variables defined via `@rollup/plugin-replace` in rollup.config.js

/** Indicates whether this is a stable or beta release or a dev build. */
// @ts-expect-error BUILD_TYPE defined by @rollup/plugin-replace
export const buildType = BUILD_TYPE as 'stable' | 'beta' | 'dev';

/**
 * The commit hash this release was built from, if this is a stable or beta
 * release; typically `null` in dev builds.
 */
// @ts-expect-error BUILD_SHA defined by @rollup/plugin-replace
export const buildSha = BUILD_SHA as string | null;
