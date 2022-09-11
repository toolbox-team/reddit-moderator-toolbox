//
// Cache handling.
//

import browser from 'webextension-polyfill';

import {messageHandlers} from '../messageHandling';

const TB_CACHE_PREFIX = browser.extension.inIncognitoContext ? 'TBCache.incognito' : 'TBcache.public';

const storageShortLengthKey = 'Toolbox.Utils.shortLength';
const storageLongLengthKey = 'Toolbox.Utils.longLength';

const longCacheList = [
    'Utils.configCache',
    'Utils.rulesCache',
    'Utils.noRules',
    'Utils.moderatedSubs',
    'Utils.moderatedSubsData',
];

const shortCacheList = [
    'Utils.noteCache',
    'Utils.noConfig',
    'Utils.noNotes',
];

async function clearCache () {
    const storage = await browser.storage.local.get();
    const cacheKeys = Object.keys(storage).filter(storageKey => storageKey.startsWith(TB_CACHE_PREFIX));
    await browser.storage.local.remove(cacheKeys);
}

// Handle getting/setting/clearing vavhe values
messageHandlers.set('tb-cache', async request => {
    const {method, storageKey, inputValue} = request;

    if (method === 'get') {
        const result = {};

        const cacheKey = `${TB_CACHE_PREFIX}.${storageKey}`;
        const storedValue = await browser.storage.local.get(cacheKey);

        // Cache value was stored before
        if (Object.prototype.hasOwnProperty.call(storedValue, cacheKey)) {
            // Handle cache that can expire
            if (longCacheList.includes(storageKey) || shortCacheList.includes(storageKey)) {
                // Get settings object to determine timeout values.
                const TBsettingsObject = await browser.storage.local.get('tbsettings');
                let cacheTTL;
                if (longCacheList.includes(storageKey)) {
                    cacheTTL = TBsettingsObject.tbsettings[storageLongLengthKey] ? TBsettingsObject.tbsettings[storageLongLengthKey] : 45;
                } else {
                    cacheTTL = TBsettingsObject.tbsettings[storageShortLengthKey] ? TBsettingsObject.tbsettings[storageShortLengthKey] : 15;
                }

                // TODO: find out if this is actually still needed.
                if (typeof cacheTTL !== 'number') {
                    cacheTTL = parseInt(cacheTTL);
                }
                cacheTTL = cacheTTL * 60 * 1000;

                // If cache has expired delete the entry and set inputValue.
                if (Date.now() - storedValue[cacheKey].timeStamp > cacheTTL) {
                    await browser.storage.local.remove(cacheKey);
                    result.value = inputValue;
                }
            }
            result.value = storedValue[cacheKey].value;
        } else {
            result.value = inputValue;
        }
        return result;
    }

    if (method === 'set') {
        const cacheKey = `${TB_CACHE_PREFIX}.${storageKey}`;
        await browser.storage.local.set({
            [cacheKey]: {
                value: inputValue,
                timeStamp: Date.now(),
            },
        });
        return;
    }

    if (method === 'clear') {
        await clearCache();
        return;
    }
});

// Handle forcing cache timeouts
messageHandlers.set('tb-cache-force-timeout', async () => {
    const storage = await browser.storage.local.get();
    const cacheKeys = Object.keys(storage).filter(storageKey => {
        if (storageKey.startsWith(TB_CACHE_PREFIX)) {
            const shortKey = storageKey.replace(TB_CACHE_PREFIX);
            if (longCacheList.includes(shortKey) || shortCacheList.includes(shortKey)) {
                return true;
            }
        }
        return false;
    });
    await browser.storage.local.remove(cacheKeys);

    return;
});
