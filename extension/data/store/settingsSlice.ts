import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppThunk} from './index.js';

// NOMERGE: we can do better than this
export interface SettingsState {
    [key: string]: any;
}

export const settingsSlice = createSlice({
    name: 'settings',
    initialState: {} as SettingsState,
    reducers: {
        // NOMERGE actions and reducers are WIP
        set (state, action: PayloadAction<{key: string; value: any}>) {
            state[action.payload.key] = action.payload.value;
        },
        setAll (state, action: PayloadAction<{values: {[key: string]: any}}>) {
            for (const [key, value] of Object.entries(action.payload.values)) {
                state[key] = value;
            }
        },
    },
});
export default settingsSlice.reducer;
const {set, setAll} = settingsSlice.actions;

export const setSetting = (key: string, value: any): AppThunk => dispatch => {
    // what was the idea here again...?
};
