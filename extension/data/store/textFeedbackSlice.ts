import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import {type AppThunk} from '.';

// TODO: remove `TBui.FEEDBACK_*` constants in favor of this enum
export enum TextFeedbackKind {
    NEUTRAL = 'neutral',
    POSITIVE = 'positive',
    NEGATIVE = 'negative',
}

// TODO: remove `TBui.DISPLAY_*` constants in favor of this enum
export enum TextFeedbackLocation {
    CENTER = 'center',
    BOTTOM = 'bottom',
}

/** A text feedback message to be displayed. */
export interface TextFeedback {
    message: string;
    kind: TextFeedbackKind;
    location: TextFeedbackLocation;
}

// alright time for redux shit

interface TextFeedbackState {
    current: TextFeedback | null;
}
export const textFeedbackSlice = createSlice({
    name: 'textFeedback',
    initialState: {
        current: null,
    } as TextFeedbackState,
    reducers: {
        set (state, action: PayloadAction<TextFeedback>) {
            state.current = action.payload;
        },
        clear (state) {
            state.current = null;
        },
    },
});
export default textFeedbackSlice.reducer;
export const {set, clear} = textFeedbackSlice.actions;

let removeTextFeedbackTimeout: number | null = null;
export const showTextFeedback = (message: TextFeedback, duration = 3000): AppThunk => dispatch => {
    // cancel any pending removal from previous messages
    if (removeTextFeedbackTimeout) {
        clearTimeout(removeTextFeedbackTimeout);
    }

    // display the message
    dispatch(set(message));

    // queue the message to be removed after the duration
    removeTextFeedbackTimeout = window.setTimeout(() => {
        dispatch(clear());
        removeTextFeedbackTimeout = null;
    }, duration);
};
