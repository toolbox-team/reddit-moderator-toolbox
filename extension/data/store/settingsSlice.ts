import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import browser from 'webextension-polyfill';

import TBLog from '../util/logger';
import {getSettings, SettingsObject} from '../util/settings';
import {type AppThunk} from './index.js';

export enum SettingsInitialLoadState {
    PENDING,
    LOADED,
    FAILED,
}

export interface SettingsState {
    initialLoadState: SettingsInitialLoadState;
    values: SettingsObject;
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
        settingsLoaded (state, action: PayloadAction<{values: SettingsObject}>) {
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
    },
});
export default settingsSlice.reducer;

const {
    settingsLoaded,
    settingsLoadFailed,
} = settingsSlice.actions;

/** Performs the initial load of settings values into the store. */
export const loadSettings = (): AppThunk => dispatch => {
    let settings: SettingsObject;
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

    // fill in the store with initial settings
    dispatch(settingsLoaded({values: settings}));

    // update the store in response to all future settings updates
    browser.storage.onChanged.addListener((changes, storageArea) => {
        // settings are stored locally, we don't care about anything else
        if (storageArea !== 'local') {
            return;
        }
        for (const [key, {newValue}] of Object.entries(changes)) {
            // we only care about the storage key where settings are stored
            if (key !== 'tbsettings') {
                continue;
            }

            // Dispatch an update to the store with the new settings values
            dispatch(settingsLoaded({values: newValue as SettingsObject}));
        }
    });
};
