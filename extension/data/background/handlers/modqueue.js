import browser from 'webextension-polyfill';

import {messageHandlers} from '../messageHandling';
import {makeRequest} from './webrequest';

const MODQUEUE_CACHE_TTL = 30;
const MODQUEUE_CACHE_NAME = 'tb-modqueue-cache';

/**
 * Sets the modqueue cache for a given subreddit.
 * @param subreddit string subreddit
 * @param cacheObject object containing the cache
 */
async function setQueueCache (subreddit, cacheObject) {
    const result = await browser.storage.local.get({[MODQUEUE_CACHE_NAME]: {}});
    result[MODQUEUE_CACHE_NAME][subreddit] = cacheObject;
    await browser.storage.local.set({
        [MODQUEUE_CACHE_NAME]: result[MODQUEUE_CACHE_NAME],
    });
    return;
}

/**
 * Returns the modqueue cache for a given subreddit.
 * @param subreddit subreddit
 * @returns {promise<object>}
 */
async function getQueueCache (subreddit) {
    const result = await browser.storage.local.get({[MODQUEUE_CACHE_NAME]: {}});
    if (Object.prototype.hasOwnProperty.call(result[MODQUEUE_CACHE_NAME], subreddit)) {
        return result[MODQUEUE_CACHE_NAME][subreddit];
    }
    return null;
}

/**
 * Returns if a given thing is contained in the cache for the given subreddit.
 * @param thingName reddit `thing` name.
 * @param subreddit subreddit
 * @returns {Promise<boolean>}
 */
async function thingFound (thingName, subreddit) {
    const subredditQueueCache = await getQueueCache(subreddit);
    if (subredditQueueCache) {
        return subredditQueueCache.things.includes(thingName);
    }
    return false;
}

function waitForCacheRefresh (subreddit) {
    return new Promise(resolve => {
        window.addEventListener(`freshCache-${subreddit}`, () => {
            console.debug('Fresh cache event', subreddit);
            resolve();
        }, {
            once: true,
        });
    });
}

messageHandlers.set('tb-modqueue', async (request, sender) => {
    const {subreddit, thingName, thingTimestamp} = request;
    // Check if we need to fetch data.
    let lastRefresh = 0;
    let refreshActive = false;
    let subredditQueueCache = await getQueueCache(subreddit);
    console.debug('subredditQueueCache', subreddit, subredditQueueCache);
    if (subredditQueueCache) {
        lastRefresh = subredditQueueCache.lastRefresh;

        // If the browser is closed during a refresh it is possible for a cache to always be flagged as refreshing.
        // To prevent that we assume that if the cache has had this state for longer than the MODQUEUE_CACHE_TTL it is false.\r\toolbox\comments\x8uzoh\removal_reasons_not_working_after_latest_update\
        if (Date.now() - refreshActive < 1000 * MODQUEUE_CACHE_TTL) {
            refreshActive = subredditQueueCache.refreshActive;
        }
    }
    // To reduce api calls we don't do a new one if one is already running for this subreddit.
    // Instead we wait for the finished event and then reference the cache object.
    if (refreshActive) {
        console.debug('Cache being refreshed, wait for it to be finished');
        await waitForCacheRefresh(subreddit);
    // The thing timestamp is bigger than the last refresh or cache isn't fresh anymore.
    } else if (thingTimestamp * 1000 > lastRefresh || Date.now() - lastRefresh > 1000 * MODQUEUE_CACHE_TTL) {
        console.debug('Cache needs a refresh');
        if (subredditQueueCache) {
            subredditQueueCache.refreshActive = Date.now();
        } else {
            subredditQueueCache = {
                refreshActive: Date.now(),
                lastRefresh: 0,
                things: [],
            };
        }
        await setQueueCache(subreddit, subredditQueueCache);
        try {
            const response = await makeRequest({
                method: 'GET',
                endpoint: `/r/${subreddit}/about/modqueue.json`,
                query: {
                    limit: 100,
                },
                okOnly: true,
            }, sender.tab.cookieStoreId);
            const updatedQueue = await response.json();
            const nowRefresh = Date.now();
            const newCacheObject = {
                lastRefresh: nowRefresh,
                things: updatedQueue.data.children.map(thing => thing.data.name),
                refreshActive: false,
            };
            console.debug('Received fresh cache', newCacheObject);
            await setQueueCache(subreddit, newCacheObject);
        } catch (error) {
            // Probably reddit errors, could build in a retry method but that seems overkill for now.
            console.error('getting modqeueue error: ', error);
        }
        // Let other waiting cache calls know cache should be fresh.
        console.debug('dispatching fresch cache event', subreddit);
        window.dispatchEvent(new CustomEvent(`freshCache-${subreddit}`));
    }

    // The cache is as fresh as it can be. See if it contains the request thing.
    return thingFound(thingName, subreddit);
});
