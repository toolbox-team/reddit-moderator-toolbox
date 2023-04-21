//
// Cache handling.
//

import browser from 'webextension-polyfill';

import {messageHandlers} from '../messageHandling';

const TB_CACHE_PREFIX = 'TBCache';

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

async function clearCache (redditSessionUserId) {
    const storage = await browser.storage.local.get();
    const cacheKeys = Object.keys(storage).filter(storageKey => storageKey.startsWith(`${TB_CACHE_PREFIX}.${redditSessionUserId}`));
    await browser.storage.local.remove(cacheKeys);
}

async function getSessionUserID (sender) {
    // get specific user id for the cache key.
    const redditSessionCookieInfo = {
        storeId: sender.tab.cookieStoreId,
        name: 'reddit_session',
        url: sender.tab.url,
    };
    let redditSessionCookie;
    try {
        redditSessionCookie = await browser.cookies.get(redditSessionCookieInfo);
    } catch (error) {
        console.error(error);
        // If first-party isolation is enabled in Firefox, `cookies.get`
        // throws when not provided a `firstPartyDomain`, so we try again
        // passing the first-party domain for the cookie we're looking for.
        redditSessionCookieInfo.firstPartyDomain = 'reddit.com';
        redditSessionCookie = await browser.cookies.get(redditSessionCookieInfo);
    }

    // The session value contains comma seperated values. The first one is the the userid in base10.
    // We could do a base36 conversion to bring it in line with the user id as used in the api.
    // But that is not really needed so we leave it like this.
    return decodeURIComponent(redditSessionCookie.value).split(',')[0];
}

// Handle getting/setting/clearing cache values
messageHandlers.set('tb-cache', async (request, sender) => {
    const {method, storageKey, inputValue} = request;
    const redditSessionUserId = await getSessionUserID(sender);

    if (method === 'get') {
        const result = {};

        const cacheKey = `${TB_CACHE_PREFIX}.${redditSessionUserId}.${storageKey}`;
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
        const cacheKey = `${TB_CACHE_PREFIX}.${redditSessionUserId}.${storageKey}`;
        await browser.storage.local.set({
            [cacheKey]: {
                value: inputValue,
                timeStamp: Date.now(),
            },
        });
        return;
    }

    if (method === 'clear') {
        await clearCache(redditSessionUserId);
        return;
    }
});

// Handle forcing cache timeouts
messageHandlers.set('tb-cache-force-timeout', async (request, sender) => {
    const redditSessionUserId = await getSessionUserID(sender);
    const storage = await browser.storage.local.get();
    const cacheKeys = Object.keys(storage).filter(storageKey => {
        if (storageKey.startsWith(`${TB_CACHE_PREFIX}.${redditSessionUserId}.`)) {
            const shortKey = storageKey.replace(`${TB_CACHE_PREFIX}.${redditSessionUserId}.`, '');
            if (longCacheList.includes(shortKey) || shortCacheList.includes(shortKey)) {
                return true;
            }
        }
        return false;
    });
    await browser.storage.local.remove(cacheKeys);

    return;
});
