import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import TBLog from '../tblog.js';
import {getSettings, setSettingAsync} from '../tbstorage.js';
import {AppThunk} from './index.js';

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
export const loadSettings = (): AppThunk => dispatch =>
    getSettings().then(
        settings => dispatch(settingsLoaded({values: settings})),
        error => {
            // it should be impossible for this initial load to fail - should
            // either load correctly or just never resolve. but i'm adding an
            // error handler for it anyway, because toolbox has a strange knack
            // for failing in ways that developers think should be impossible
            const log = TBLog('store:settings');
            log.error('Failed to load initial settinsg?? wtf', error);
            dispatch(settingsLoadFailed());
        },
    );
