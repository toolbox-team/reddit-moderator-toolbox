/* global messageHandlers */
'use strict';
//
// Cache handling.
//

let TBsettingsObject = {};
const cachedata = {
    timeouts: {},
    currentDurations: {
        long: 0,
        short: 0,
    },
};

/**
 * emptyshort or long cache if it expires
 * @param timeoutDuration Timeout value in minutes
 * @param cacheType The type of cache, either `short` or `long`
 */
async function emptyCacheTimeout (timeoutDuration, cacheType) {
    // Make sure we always clear any running timeouts so we don't get things running multiple times.
    clearTimeout(cachedata.timeouts[cacheType]);

    // Users fill in the value in minutes, we need milliseconds of course.
    const timeoutMS = timeoutDuration * 60 * 1000;

    console.log('clearing cache:', cacheType, timeoutMS);
    if (cacheType === 'short') {
        localStorage['TBCache.Utils.noteCache'] = '{}';
        localStorage['TBCache.Utils.noConfig'] = '[]';
        localStorage['TBCache.Utils.noNotes'] = '[]';
    }

    if (cacheType === 'long') {
        localStorage['TBCache.Utils.configCache'] = '{}';
        localStorage['TBCache.Utils.rulesCache'] = '{}';
        localStorage['TBCache.Utils.noRules'] = '[]';
        localStorage['TBCache.Utils.moderatedSubs'] = '[]';
        localStorage['TBCache.Utils.moderatedSubsData'] = '[]';
    }

    // Let's make sure all our open tabs know that cache has been cleared for these types.
    const tabs = await browser.tabs.query({});
    for (let i = 0; i < tabs.length; ++i) {
        if (tabs[i].url.includes('reddit.com')) {
            browser.tabs.sendMessage(tabs[i].id, {
                action: 'tb-cache-timeout',
                payload: cacheType,
            });
        }
    }

    // Done, go for another round.
    cachedata.timeouts[cacheType] = setTimeout(() => {
        emptyCacheTimeout(timeoutDuration, cacheType);
    }, timeoutMS);
}

/**
 * Initiates cache timeouts based on toolbox settings.
 * @param {Boolean} forceRefresh when true will clear both caches and start fresh.
 */
function initCacheTimeout (forceRefresh) {
    console.log(TBsettingsObject);
    console.log('Caching timeout initiated');
    const storageShortLengthKey = 'Toolbox.Utils.shortLength';
    const storageLongLengthKey = 'Toolbox.Utils.longLength';
    let storageShortLength;
    let storageLongLength;

    // Get current shortLength value from storage.
    if (TBsettingsObject.tbsettings[storageShortLengthKey] === undefined) {
        storageShortLength = 15;
    } else {
        storageShortLength = TBsettingsObject.tbsettings[storageShortLengthKey];

        if (typeof storageShortLength !== 'number') {
            storageShortLength = parseInt(storageShortLength);
        }
    }

    // Compare the current timeout value to the one in storage. Reinit timeout when needed.
    if (storageShortLength !== cachedata.currentDurations.short || forceRefresh) {
        console.log('Short timeout', storageShortLength);
        cachedata.currentDurations.short = storageShortLength;
        emptyCacheTimeout(storageShortLength, 'short');
    }

    // Get current longLength value from storage.
    if (TBsettingsObject.tbsettings[storageLongLengthKey] === undefined) {
        storageLongLength = 45;
    } else {
        storageLongLength = TBsettingsObject.tbsettings[storageLongLengthKey];
        if (typeof storageLongLength !== 'number') {
            storageLongLength = parseInt(storageLongLength);
        }
    }

    // Compare the current timeout value to the one in storage. Reinit timeout when needed.
    if (storageLongLength !== cachedata.currentDurations.long || forceRefresh) {
        console.log('Long timeout', storageLongLength);
        cachedata.currentDurations.short = storageShortLength;
        emptyCacheTimeout(storageLongLength, 'long');
    }
}

// Read data from storage on init
browser.storage.local.get('tbsettings').then(sObject => {
    console.log('first cache init');
    TBsettingsObject = sObject;
    initCacheTimeout(true);
});

// Handle getting/setting/clearing vavhe values
messageHandlers.set('tb-cache', request => {
    const {method, storageKey, inputValue} = request;

    if (method === 'get') {
        const result = {};
        if (localStorage[storageKey] === undefined) {
            result.value = inputValue;
        } else {
            const storageString = localStorage[storageKey];
            try {
                result.value = JSON.parse(storageString);
            } catch (error) { // if everything gets strignified, it's always JSON.  If this happens, the storage val is corrupted.
                result.errorThrown = error.toString();
                result.value = inputValue;
            }

            // send back the default if, somehow, someone stored `null`
            // NOTE: never, EVER store `null`!
            if (result.value === null && inputValue !== null) {
                result.value = inputValue;
            }
        }

        return Promise.resolve(result);
    }

    if (method === 'set') {
        localStorage[storageKey] = JSON.stringify(inputValue);
        return;
    }

    if (method === 'clear') {
        localStorage.clear();
        return;
    }
});

// Handle forcing cache timeouts
messageHandlers.set('tb-cache-force-timeout', () => {
    initCacheTimeout(true);
});
