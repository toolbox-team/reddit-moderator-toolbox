import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from './store';

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
    // is `undefined`) *or* if the setting's value is `null` (mirroring the
    // implementation of `getSetting` in `tbstorage.js`, which says that `null`
    // is never a valid value for any setting)
    if (savedValue == null) {
        return defaultValue;
    }

    return savedValue;
};
