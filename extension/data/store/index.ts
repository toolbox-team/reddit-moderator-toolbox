import {combineReducers, configureStore, ThunkAction, UnknownAction} from '@reduxjs/toolkit';
import textFeedbackReducer from './textFeedbackSlice';

const rootReducer = combineReducers({
    textFeedback: textFeedbackReducer,
});

const store = configureStore({
    reducer: rootReducer,
});
export default store;

// TS concerns - see https://redux.js.org/usage/usage-with-typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    UnknownAction
>;
