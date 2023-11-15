import {useEffect, useState} from 'react';
import {getSettingAsync} from './tbstorage';

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
    });

    return value;
};

/** Hook to get a Toolbox setting. */
export const useSetting = (moduleName: string, settingName: string, defaultValue: any) => {
    return useFetched(getSettingAsync(moduleName, settingName, defaultValue));
};
