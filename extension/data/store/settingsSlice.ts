import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import browser from 'webextension-polyfill';

import TBLog from '../tblog.js';
import {getSettings, setSettingAsync} from '../tbstorage.js';
import {type AppThunk} from './index.js';

export enum SettingsInitialLoadState {
    PENDING,
    LOADED,
    FAILED,
}

export interface SettingsState {
    initialLoadState: SettingsInitialLoadState;
    values: {
        [key: string]: any;
    };
}

export const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        initialLoadState: SettingsInitialLoadState.PENDING,
        values: {},
    } satisfies SettingsState as SettingsState,
    reducers: {
        /**
         * The entire settings state is overwritten with a snapshot of the
         * actual saved state from extension storage
         */
        settingsLoaded (state, action: PayloadAction<{values: {[key: string]: any}}>) {
            // overwrite state completely
            return {
                initialLoadState: SettingsInitialLoadState.LOADED,
                values: action.payload.values,
            };
        },

        /** We failed to load settings somehow?? */
        settingsLoadFailed () {
            return {
                initialLoadState: SettingsInitialLoadState.FAILED,
                values: {},
            };
        },

        /** The value of a single setting has been updated */
        settingUpdated (state, action: PayloadAction<{key: string; value: any}>) {
            state.values[action.payload.key] = action.payload.value;
        },

        /**
         * A single setting has been reset to the default (it is removed from
         * the state entirely, so whenever it's read, the default value will be
         * used instead)
         */
        settingReset (state, action: PayloadAction<{key: string}>) {
            delete state.values[action.payload.key];
        },
    },
});
export default settingsSlice.reducer;

const {
    settingUpdated,
    settingReset,
    settingsLoaded,
    settingsLoadFailed,
} = settingsSlice.actions;
export {settingsLoaded};

/** Writes a change to a setting. */
export const setSetting = (moduleID: string, setting: string, value: any): AppThunk => async dispatch => {
    // It's possible for this call to save a different value than we pass into
    // it, because the value is run through `purifyThing` before being saved. We
    // look at the return value and make sure we update the setting in the store
    // to whatever value was actually saved.
    const savedValue = await setSettingAsync(moduleID, setting, value);

    const key = `Toolbox.${moduleID}.${setting}`;

    // It's not immediately clear to me whether passing `undefined` as the
    // `value` to `setSettingAsync` (which you would do to reset a setting to
    // its default) causes the call to return `undefined`, or the configured
    // default value for that setting. This is just another layer of spaghetti
    // on an already-extensive web of spaghetti storage code, so we play it
    // safe: if the value we *meant* to write was `undefined`...
    if (value === undefined) {
        // ...then we ignore whatever value came out of the storage call, and
        // explicitly remove the value of the setting from the store...
        dispatch(settingReset({key}));
    } else {
        // ...otherwise we just update the state with the value that was saved.
        dispatch(settingUpdated({
            key,
            value: savedValue,
        }));
    }
};

/** Resets a setting to its default value. */
export const resetSetting = (moduleID: string, setting: string) => setSetting(moduleID, setting, undefined);

/** Performs the initial load of settings values into the store. */
export const loadSettings = (): AppThunk => dispatch => {
    let settings: Promise<SettingsState['values']>;
    try {
        settings = getSettings();
    } catch (error) {
        // it should be impossible for this initial load to fail - should either
        // load correctly or just never resolve. but i'm adding an error handler
        // for it anyway, because toolbox has a strange knack for failing in
        // ways that developers think should be impossible
        const log = TBLog('store:settings');
        log.error('Failed to load initial settinsg?? wtf', error);
        dispatch(settingsLoadFailed());
        return;
    }

    dispatch(settingsLoaded({values: settings}));

    // begin handling incoming settings updates from other tabs
    // TODO: we can really rewrite all this "responding to setting updates"
    //       stuff to be in terms of `browser.storage.onChanged` instead of
    //       manually passing messages around, especially since there's no more
    //       distinction between how we handle single-key changes and entire
    //       state overwrites
    browser.runtime.onMessage.addListener(async (message: /* TODO */ any) => {
        if (['tb-settings-update', 'tb-single-setting-update'].includes(message.action)) {
            const settings = await browser.storage.local.get();
            // the full settings message does come with a copy of the new
            // settings, but we don't actually have to listen to that - it's
            // simpler to just fetch the entire settings object fresh and
            // overwrite the current state with it. This is fine to do in
            // response to single-setting updates as well - we use selectors to
            // read individual setting values, so nothing is re-rendered unless
            // the specific settings it needs on are among the changes.
            dispatch(settingsLoaded({
                // TODO: we read settings directly out of extension storage
                //       here, because the alternative is using `getSettings()`,
                //       which relies on the value of the `TBsettingsObject`
                //       having already been updated, which it might not have
                //       been if this message listener is being run before the
                //       other message listener that's responsible for updating
                //       that object. ideally we want nothing to rely on that
                //       object at all because it sucks, but because there are
                //       still some uses of the sync storage methods it shambles
                //       on for now. maybe we can replace it with synchronous
                //       state reads out of the redux store eventually, maybe
                //       that's what will make me not hate working on storage
                values: (await browser.storage.local.get('tbsettings')).tbsettings as {[key: string]: any},
            }));
        }
    });
};
