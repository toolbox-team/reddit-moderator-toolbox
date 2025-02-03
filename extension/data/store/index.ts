import {combineReducers, configureStore, type ThunkAction, type UnknownAction} from '@reduxjs/toolkit';
import settingsReducer, {loadSettings} from './settingsSlice';
import textFeedbackReducer from './textFeedbackSlice';

const rootReducer = combineReducers({
    textFeedback: textFeedbackReducer,
    settings: settingsReducer,
});

const store = configureStore({
    reducer: rootReducer,
});
export default store;

// Attempt to load settings from storage immediately
store.dispatch(loadSettings());

// TS concerns - see https://redux.js.org/usage/usage-with-typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    UnknownAction
>;
