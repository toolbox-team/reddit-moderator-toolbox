'use strict';

const MODQUEUE_CACHE_TTL = 30;
const MODQUEUE_CACHE_NAME = 'tb-modqueue-cache';

/**
 * Sets the modqueue cache for a given subreddit.
 * @param subreddit string subreddit
 * @param cacheObject object containing the cache
 */
function setQueueCache (subreddit, cacheObject) {
    return new Promise(resolve => {
        browser.storage.local.get({[MODQUEUE_CACHE_NAME]: {}}).then(result => {
            result[subreddit] = cacheObject;
            browser.storage.local.set({
                [`${MODQUEUE_CACHE_NAME}`]: result,
            }).then(resolve);
        });
    });
}

/**
 * Returns the modqueue cache for a given subreddit.
 * @param subreddit subreddit
 * @returns {promise<object>}
 */
function getQueueCache (subreddit) {
    return new Promise(resolve => {
        browser.storage.local.get({[MODQUEUE_CACHE_NAME]: {}}).then(result => {
            if (Object.prototype.hasOwnProperty.call(result[MODQUEUE_CACHE_NAME], subreddit)) {
                resolve(result[MODQUEUE_CACHE_NAME][subreddit]);
            } else {
                resolve({});
            }
        });
    });
}

/**
 * Returns if a given thing is contained in the cache for the given subreddit.
 * @param thingName reddit `thing` name.
 * @param subreddit subreddit
 * @returns {boolean}
 */
function thingFound (thingName, subreddit) {
    return new Promise(resolve => {
        getQueueCache(subreddit).then(subredditQueueCache => {
            if (!Object.keys(subredditQueueCache).length) {
                resolve(false);
            } else {
                resolve(subredditQueueCache.things.includes(thingName));
            }
        });
    });
}

messageHandlers.set('tb-modqueue', request => new Promise(resolve => {
    const {subreddit, thingName, thingTimestamp} = request;
    // Check if we need to fetch data.
    let lastRefresh = 0;
    let refreshActive = false;
    getQueueCache(subreddit).then(subredditQueueCache => {
        if (Object.keys(subredditQueueCache).length) {
            lastRefresh = subredditQueueCache.lastRefresh;
            refreshActive = subredditQueueCache.refreshActive;
        }

        // To reduce api calls we don't do a new one if one is already running for this subreddit.
        // Instead we wait for the finished event and then reference the cache object.

        if (refreshActive) {
            window.addEventListener(`freshCache-${subreddit}`, () => {
                resolve(thingFound(thingName, subreddit));
            }, {
                once: true,
            });

        // The thing timestamp is bigger than the last refresh or cache isn't fresh anymore.
        } else if (thingTimestamp * 1000 > lastRefresh || Date.now() - lastRefresh > 1000 * MODQUEUE_CACHE_TTL) {
            if (Object.keys(subredditQueueCache).length) {
                subredditQueueCache.refreshActive = true;
            } else {
                setQueueCache(subreddit, {
                    refreshActive: true,
                    lastRefresh: 0,
                    things: [],
                });
            }
            makeRequest({
                method: 'GET',
                endpoint: `/r/${subreddit}/about/modqueue.json`,
                query: {
                    limit: 100,
                },
                okOnly: true,
            })
                .then(response => response.json())
                .then(updatedQueue => {
                    const nowRefresh = Date.now();
                    const newCacheObject = {
                        lastRefresh: nowRefresh,
                        things: updatedQueue.data.children.map(thing => thing.data.name),
                        refreshActive: false,
                    };
                    setQueueCache(subreddit, newCacheObject).then(() => {
                        window.dispatchEvent(new CustomEvent(`freshCache-${subreddit}`));
                        resolve(thingFound(thingName, subreddit));
                    });
                }).catch(error => {
                    console.error('getting modqeueue error: ', error);
                    // Probably reddit errors, could build in a retry method but that seems overkill for now.
                    // Resolving with whatever is in cache.
                    resolve(thingFound(thingName, subreddit));
                });
        } else {
            resolve(thingFound(thingName, subreddit));
        }
    });
}));
