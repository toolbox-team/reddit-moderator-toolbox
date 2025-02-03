// HACK: everything in this file sucks ass. please kill it

import store from '../store';

/**
 * Returns the value of a setting.
 * @deprecated Use literally anything else instead - use Redux where possible,
 * {@linkcode getSettingAsync} where it's not
 * @param module The ID of the module the setting belongs to
 * @param setting The name of the setting
 * @param defaultVal The value returned if the setting is not set
 */
export function getSettingSync (module: string, setting: string, defaultVal?: any) {
    // synchronously read current settings state from the Redux store
    const currentSettings = store.getState().settings.values;
    const value = currentSettings[`Toolbox.${module}.${setting}`];

    if (value == null) {
        return defaultVal;
    }

    return value;
}
