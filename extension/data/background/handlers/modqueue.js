'use strict';

const MODQUEUE_CACHE_TTL = 30;

// Object containing the queue cached data per subreddit
const queueCache = new Map();

/**
 * Returns if a given thing is contained in the cache for the given subreddit.
 * @param thingName reddit `thing` name.
 * @param subreddit subreddit
 * @returns {boolean}
 */
function thingFound (thingName, subreddit) {
    const subredditQueueCache = queueCache.get(subreddit);
    if (!subredditQueueCache) {
        return false;
    }
    return subredditQueueCache.things.includes(thingName);
}

messageHandlers.set('tb-modqueue', request => new Promise(resolve => {
    const {subreddit, thingName, thingTimestamp} = request;
    // Check if we need to fetch data.
    let lastRefresh = 0;
    let refreshActive = false;
    const subredditQueueCache = queueCache.get(subreddit);
    if (subredditQueueCache) {
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
        if (subredditQueueCache) {
            subredditQueueCache.refreshActive = true;
        } else {
            queueCache.set(subreddit, {
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
                queueCache.set(subreddit, {
                    lastRefresh: nowRefresh,
                    things: updatedQueue.data.children.map(thing => thing.data.name),
                    refreshActive: false,
                });
                window.dispatchEvent(new CustomEvent(`freshCache-${subreddit}`));
                resolve(thingFound(thingName, subreddit));
            }).catch(error => {
                console.error('getting modqeueue error: ', error);
                // Probably reddit errors, could build in a retry method but that seems overkill for now.
                // Resolving with whatever is in cache.
                resolve(thingFound(thingName, subreddit));
            });
    } else {
        resolve(thingFound(thingName, subreddit));
    }
}));
