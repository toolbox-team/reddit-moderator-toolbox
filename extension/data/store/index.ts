import {combineReducers, configureStore, type ThunkAction, type UnknownAction} from '@reduxjs/toolkit';
import settingsReducer, {SettingsState} from './settingsSlice';
import textFeedbackReducer from './textFeedbackSlice';

const rootReducer = combineReducers({
    textFeedback: textFeedbackReducer,
    settings: settingsReducer,
});

// We want to initialize the store with the current values of all our settings.
// However, settings need to be fetched asynchronously, and `preloadedState`
// doesn't work correctly with promises - we don't want promises in our state,
// we want the store's construction to be deferred until the promises resolve.
// So instead of exporting a configured `store` as a default export, we export a
// function which can be used to create a store from a given initial state. In
// `AppRoot.tsx`, we fetch the initial setting values, and only once we have
// them do we call this function and provide the store context to the app.
export const storeFromInitialSettings = (settings: SettingsState) =>
    configureStore({
        reducer: rootReducer,
        preloadedState: {
            settings,
        },
    });

// TS concerns - see https://redux.js.org/usage/usage-with-typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof storeFromInitialSettings>['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    UnknownAction
>;
