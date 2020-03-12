'use strict';

// Object containing the queue cached data per subreddit
const queueCacheObject = {};

/**
 * Returns if a given thing is contained in the cache for the given subreddit.
 * @param thingName reddit `thing` name.
 * @param subreddit subreddit
 * @returns {boolean}
 */
function thingFound (thingName, subreddit) {
    let thingFound = false;
    if (Object.prototype.hasOwnProperty.call(queueCacheObject, subreddit) && queueCacheObject[subreddit].things.includes(thingName)) {
        thingFound = true;
    }
    return thingFound;
}

messageHandlers.set('tb-modqueue', request => {
    const {subreddit, thingName, thingTimestamp} = request;
    return new Promise(resolve => {
        // Check if we need to fetch data.
        let lastRefresh = 0;
        let refreshActive = false;
        if (Object.prototype.hasOwnProperty.call(queueCacheObject, subreddit)) {
            lastRefresh = queueCacheObject[subreddit].lastRefresh;
            refreshActive = queueCacheObject[subreddit].refreshActive;
        }

        // The thing timestamp is bigger than the last refresh or cache isn't fresh anymore.
        if (thingTimestamp * 1000 > lastRefresh || Date.now() - lastRefresh > 1000 * 30) {
            // To reduce api calls we don't do a new one if one is already running for this subreddit.
            // Instead we wait for the finished event and then reference the cache object.
            if (refreshActive) {
                window.addEventListener(`freshCache-${subreddit}`, () => {
                    resolve(thingFound(thingName, subreddit));
                }, {
                    once: true,
                });
            } else {
                if (Object.prototype.hasOwnProperty.call(queueCacheObject, subreddit)) {
                    queueCacheObject[subreddit].refreshActive = true;
                } else {
                    queueCacheObject[subreddit] = {
                        refreshActive: true,
                        lastRefresh: 0,
                        things: [],
                    };
                }

                $.getJSON(`https://old.reddit.com/r/${subreddit}/about/modqueue.json?limit=100`).done(updatedQueue => {
                    const nowRefresh = Date.now();
                    queueCacheObject[subreddit] = {
                        lastRefresh: nowRefresh,
                        things: updatedQueue.data.children.map(thing => thing.data.name),
                        refreshActive: false,
                    };
                    window.dispatchEvent(new CustomEvent(`freshCache-${subreddit}`));
                    resolve(thingFound(thingName, subreddit));
                });
            }
        } else {
            resolve(thingFound(thingName, subreddit));
        }
    });
});
