import $ from 'jquery';
import browser from 'webextension-polyfill';

import createLogger from './logging';

const log = createLogger('util:cache');

/**
 * Clears all cache keys.
 * @returns {Promise<void>}
 */
export const clearCache = () =>
    browser.runtime.sendMessage({
        action: 'tb-cache',
        method: 'clear',
    });

/**
 * Gets a value in the cache.
 * @param {string} moduleID The module that owns the cache key
 * @param {string} key The name of the cache key
 * @param {any} [defaultVal] The value returned if there is no cached value
 * @returns {Promise<any>}
 */
export function getCache (moduleID: string, key: string, defaultVal: any = undefined) {
    return new Promise(resolve => {
        const storageKey = `${moduleID}.${key}`;
        const inputValue = defaultVal !== undefined ? defaultVal : null;
        browser.runtime.sendMessage({
            action: 'tb-cache',
            method: 'get',
            storageKey,
            inputValue,
        }).then((response: /* TODO */ any) => {
            if (response.errorThrown !== undefined) {
                log.debug(`${storageKey} is corrupted.  Sending default.`);
                resolve(defaultVal);
            } else {
                resolve(response.value);
            }
        });
    });
}

/**
 * Sets a value in the cache.
 * @param {string} moduleID The ID of the module that owns the cache key
 * @param {string} key The name of the cache key
 * @param {any} inputValue The new value of the cache key
 * @returns {Promise<any>} Promises the new value of the cache key
 */
export function setCache (moduleID: string, key: string, inputValue: any) {
    const storageKey = `${moduleID}.${key}`;
    return new Promise(resolve => {
        browser.runtime.sendMessage({
            action: 'tb-cache',
            method: 'set',
            storageKey,
            inputValue,
        }).then(async () => {
            const value = await getCache(moduleID, key);
            resolve(value);
        });
    });
}

// The below block of code will keep watch for events that require clearing the
// cache like account switching and people accepting mod invites.
// TODO: should this be moved to the oldreddit platform observer or something?
$('body').on(
    'click',
    '#RESAccountSwitcherDropdown .accountName, #header-bottom-right .logout, .toggle.moderator .option',
    () => {
        clearCache();
    },
);
