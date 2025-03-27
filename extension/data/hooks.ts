import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {RootState} from './store';
import {drawPosition} from './tbui';

/** Hook to get the return value of a promise. */
export const useFetched = <T>(promise: Promise<T>) => {
    const [value, setValue] = useState<T | undefined>(undefined);

    useEffect(() => {
        let valid = true;
        promise.then(result => {
            if (valid) {
                setValue(result);
            }
        });

        return () => {
            valid = false;
        };
    }, []);

    return value;
};

/** Hook to get a Toolbox setting. */
export const useSetting = (moduleName: string, settingName: string, defaultValue: any) => {
    const savedValue = useSelector((state: RootState) => state.settings.values[`Toolbox.${moduleName}.${settingName}`]);

    // Return the given default value if the setting doesn't have a value (i.e.
    // is `undefined`) *or* if the setting's value is `null` (mirroring the old
    // implementation of `getSetting` from the old `tbstorage.js`, which says
    // that `null` is never a valid value for any setting)
    if (savedValue == null) {
        return defaultValue;
    }

    return savedValue;
};

/**
 * Helper hook for managing the visibility of "popups"/draggable windows which
 * are shown in response to pointer events.
 * Provides functions to show and hide the window in response to events, and
 * automatically computes an appropriate initial position for the window when
 * it's first shown based on the click event that triggered it.
 */
export function usePopupState<T extends HTMLElement> () {
    const [initialPosition, setInitialPosition] = useState<{top: number; left: number}>();

    return {
        /** The popup's initial position. */
        initialPosition,
        /** Whether the popup should currently be shown. */
        shown: !!initialPosition,
        /** Shows the window in response to a pointer event (like a click). */
        show: (event: React.MouseEvent<T>) => {
            // NOTE: i don't know the details of comparing between
            // React.MouseEvent and other mouse events but it's whatever for now
            const positions = drawPosition(event as unknown as PointerEvent);
            setInitialPosition({
                top: positions.topPosition,
                left: positions.leftPosition,
            });
        },
        /** Hides the window. */
        hide: () => setInitialPosition(undefined),
    };
}
