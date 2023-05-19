//
// Cache handling.
//

import browser from 'webextension-polyfill';

import {messageHandlers} from '../messageHandling';

const TB_CACHE_PREFIX = 'TBCache';
const userCacheExpireTime = 1000 * 60 * 60 * 24;

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

let staleCacheCleaningInProgress = false;
async function staleUserCacheCleanup (redditUserIdBase36) {
    // Cache gets called upon a lot.
    // To prevent conflicts processing of stale cache cleaning is locked
    // by the first cache call that gets to it.
    // There is a small risk of a scenario where this function is locked through on user
    // and the interaction time of a different user not being updated
    // But as the expiry time is long and people generally don't browser with two users
    // at the exact same time we willing to take this risk
    if (staleCacheCleaningInProgress) {
        return;
    }
    staleCacheCleaningInProgress = true;

    const result = await browser.storage.local.get({userCacheInteractionTimes: {}});

    // Set interaction time for current user.
    result.userCacheInteractionTimes[redditUserIdBase36] = Date.now();

    Object.entries(result.userCacheInteractionTimes).forEach(([key, value]) => {
        if (Date.now() - value > userCacheExpireTime) {
            console.log('User cache stale: ', key);
            clearCache(key);
            delete result.userCacheInteractionTimes[key];
        }
    });

    await browser.storage.local.set({
        userCacheInteractionTimes: result.userCacheInteractionTimes,
    });

    staleCacheCleaningInProgress = false;
}

/**
 * gets the reddit user ID based on the current `reddit_session` cookie data
 * @param sender browser.runtime.onMessage sender object containing tab data
 * @returns {promise<string>}
 */
async function getSessionUserID (sender) {
    let redditUserIdBase36;

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
        // If first-party isolation is enabled in Firefox, `cookies.get`
        // throws when not provided a `firstPartyDomain`, so we try again
        // passing the first-party domain for the cookie we're looking for.
        redditSessionCookieInfo.firstPartyDomain = 'reddit.com';
        redditSessionCookie = await browser.cookies.get(redditSessionCookieInfo);
    }

    if (redditSessionCookie) {
        // The session value contains comma seperated values. The first one is the the userid in base10.
        // As reddit uses base36 everywhere else we convert the ID to that so things are easier to debug.
        const redditUserIdBase10 = decodeURIComponent(redditSessionCookie.value).split(',')[0];
        redditUserIdBase36 = parseInt(redditUserIdBase10).toString(36);
    } else {
        redditUserIdBase36 = 'noSessionFallback';
    }

    staleUserCacheCleanup(redditUserIdBase36);

    return redditUserIdBase36;
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
