import DOMPurify from 'dompurify';
import $ from 'jquery';
import browser from 'webextension-polyfill';

import TBLog from './tblog.ts';

const logger = TBLog('TBStorage');

// Setting storage stuff

/** @typedef {import('./store/settingsSlice.ts').SettingsObject} SettingsObject */

/**
 * Retrieves the current settings object directly from extension storage.
 * @returns {Promise<SettingsObject>}
 */
export const getSettings = async () => (await browser.storage.local.get('tbsettings')).tbsettings;

/**
 * Writes the given settings object into extension storage.
 * @param {SettingsObject} newSettings A full settings object to write
 * @returns {Promise<void>}
 */
export const writeSettings = async newSettings => {
    await browser.runtime.sendMessage({
        action: 'tb-overwrite-all-settings',
        newSettings,
    });
};

/**
 * Updates the values of multiple settings.
 * @param {Partial<SettingsObject>} updatedSettings Object mapping setting keys
 * to their new values. Keys not present in this object will retain their stored
 * values. Keys of this object whose values are `undefined` will be removed from
 * storage. `null` is an invalid value for settings and will be ignored.
 */
export const updateSettings = async settings => {
    await browser.runtime.sendMessage({
        action: 'tb-update-settings',
        updatedSettings: Object.fromEntries(Object.entries(settings).filter(([_key, value]) => value != null)),
        deletedSettings: Object.keys(settings).filter(key => settings[key] === undefined),
    });
};

/**
 * Generates an anonymized version of the settings object, with some sensitive
 * settings omitted and other settings represented differently.
 * @returns {Promise<object>}
 */
export const getAnonymizedSettings = async () => {
    const sObject = await getSettings();

    // in creesch's words: "because we are paranoid"
    purifyObject(sObject);

    // settings we delete
    delete sObject['Toolbox.Achievements.lastSeen'];
    delete sObject['Toolbox.Achievements.last_seen'];
    delete sObject['Toolbox.Bagels.bagelType'];
    delete sObject['Toolbox.Bagels.enabled'];
    delete sObject['Toolbox.Modbar.customCSS'];
    delete sObject['Toolbox.ModMail.lastVisited'];
    delete sObject['Toolbox.ModMail.replied'];
    delete sObject['Toolbox.ModMail.subredditColorSalt'];
    delete sObject['Toolbox.Notifier.lastChecked'];
    delete sObject['Toolbox.Notifier.lastSeenModmail'];
    delete sObject['Toolbox.Notifier.lastSeenUnmoderated'];
    delete sObject['Toolbox.Notifier.modmailCount'];
    delete sObject['Toolbox.Notifier.modqueueCount'];
    delete sObject['Toolbox.Notifier.modqueuePushed'];
    delete sObject['Toolbox.Notifier.unmoderatedCount'];
    delete sObject['Toolbox.Notifier.unreadMessageCount'];
    delete sObject['Toolbox.Notifier.unreadPushed'];
    delete sObject['Toolbox.QueueTools.kitteh'];
    delete sObject['Toolbox.RReasons.customRemovalReason'];
    delete sObject['Toolbox.Snoo.enabled'];
    delete sObject['Toolbox.Storage.settings'];
    delete sObject['Toolbox.Utils.echoTest'];
    delete sObject['Toolbox.Utils.tbDevs'];

    // these settings we want the length of the val.
    sObject['Toolbox.Comments.highlighted'] = undefindedOrLength(sObject['Toolbox.Comments.highlighted']);
    sObject['Toolbox.ModButton.savedSubs'] = undefindedOrLength(sObject['Toolbox.ModButton.savedSubs']);
    sObject['Toolbox.ModMail.botsToFilter'] = undefindedOrLength(sObject['Toolbox.ModMail.botsToFilter']);
    sObject['Toolbox.ModMail.filteredSubs'] = undefindedOrLength(sObject['Toolbox.ModMail.filteredSubs']);
    sObject['Toolbox.Modbar.shortcuts'] = undefindedOrLength(sObject['Toolbox.Modbar.shortcuts']);
    sObject['Toolbox.QueueTools.botCheckmark'] = undefindedOrLength(sObject['Toolbox.QueueTools.botCheckmark']);
    sObject['Toolbox.Utils.seenNotes'] = undefindedOrLength(sObject['Toolbox.Utils.seenNotes']);

    // these settings we just want to know if they are populated at all
    sObject['Toolbox.Achievements.save'] = undefindedOrTrue(sObject['Toolbox.Achievements.save']);
    sObject['Toolbox.ModButton.lastAction'] = undefindedOrTrue(sObject['Toolbox.ModButton.lastAction']);
    sObject['Toolbox.Modbar.lastExport'] = undefindedOrTrue(sObject['Toolbox.Modbar.lastExport']);
    sObject['Toolbox.Notifier.modSubreddits'] = undefindedOrTrue(sObject['Toolbox.Notifier.modSubreddits']);
    sObject['Toolbox.Notifier.modmailSubreddits'] = undefindedOrTrue(
        sObject['Toolbox.Notifier.modmailSubreddits'],
    );
    sObject['Toolbox.Notifier.unmoderatedSubreddits'] = undefindedOrTrue(
        sObject['Toolbox.Notifier.unmoderatedSubreddits'],
    );
    sObject['Toolbox.PNotes.noteWiki'] = undefindedOrTrue(sObject['Toolbox.PNotes.noteWiki']);
    sObject['Toolbox.QueueTools.queueCreature'] = undefindedOrTrue(sObject['Toolbox.QueueTools.queueCreature']);
    sObject['Toolbox.QueueTools.subredditColorSalt'] = undefindedOrTrue(
        sObject['Toolbox.QueueTools.subredditColorSalt'],
    );
    sObject['Toolbox.Utils.settingSub'] = undefindedOrTrue(sObject['Toolbox.Utils.settingSub']);

    return sObject;

    function undefindedOrLength (setting) {
        return setting === undefined ? 0 : setting.length;
    }

    function undefindedOrTrue (setting) {
        if (!setting) {
            return false;
        }
        if (setting.length > 0) {
            return true;
        }
    }
};

/**
 * Clears all cache keys.
 * @returns {Promise<void>}
 */
export const clearCache = () =>
    browser.runtime.sendMessage({
        action: 'tb-cache',
        method: 'clear',
    });

// The below block of code will keep watch for events that require clearing the cache like account switching and people accepting mod invites.
$('body').on(
    'click',
    '#RESAccountSwitcherDropdown .accountName, #header-bottom-right .logout, .toggle.moderator .option',
    () => {
        clearCache();
    },
);

/**
 * Uses DOMPurify to sanitize untrusted HTML strings.
 * @param {string} input
 * @returns {string}
 */
export function purify (input) {
    return DOMPurify.sanitize(input, {SAFE_FOR_JQUERY: true});
}

/**
 * Recursively sanitize an object's string values as untrusted HTML. String
 * values that can be interpreted as JSON objects are parsed, sanitized, and
 * re-stringified.
 * @param {any} input
 */
export function purifyObject (input) {
    for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            const itemType = typeof input[key];
            switch (itemType) {
                case 'object':
                    purifyObject(input[key]);
                    break;
                case 'string':
                    // If the string we're handling is a JSON string, purifying it before it's parsed will mangle
                    // the JSON and make it unusable. We try to parse every value, and if parsing returns an object
                    // or an array, we run purifyObject on the result and re-stringify the value, rather than
                    // trying to purify the string itself. This ensures that when the string is parsed somewhere
                    // else, it's already purified.
                    // TODO: Identify if this behavior is actually used anywhere
                    try {
                        const jsonObject = JSON.parse(input[key]);
                        // We only want to purify the parsed value if it's an object or array, otherwise we throw
                        // back and purify the raw string instead (see #461)
                        if (typeof jsonObject !== 'object' || jsonObject == null) {
                            throw new Error('not using the parsed result of this string');
                        }
                        purifyObject(jsonObject);
                        input[key] = JSON.stringify(jsonObject);
                    } catch (e) {
                        // Not json, simply purify
                        input[key] = purify(input[key]);
                    }
                    break;
                case 'function':
                    // If we are dealing with an actual function something is really wrong and we'll overwrite it.
                    input[key] = 'function';
                    break;
                case 'number':
                case 'boolean':
                case 'undefined':
                    // Do nothing with these as they are supposed to be safe.
                    break;
                default:
                    // If we end here we are dealing with a type we don't expect to begin with. Begone!
                    input[key] = `unknown item type ${itemType}`;
            }
        }
    }
}

// TODO: this is another purify function used exclusively for settings, I'm not
//       sure how it works either.
export function purifyThing (input) {
    let output;
    const itemType = typeof input;
    switch (itemType) {
        case 'object':
            purifyObject(input);
            output = input;
            break;
        case 'string':
            // Let's see if we are dealing with json.
            // We want to handle json properly otherwise the purify process will mess up things.
            try {
                const jsonObject = JSON.parse(input);
                purifyObject(jsonObject);
                output = JSON.stringify(jsonObject);
            } catch (e) {
                // Not json, simply purify
                output = purify(input);
            }
            break;
        case 'function':
            // If we are dealing with an actual function something is really wrong and we'll overwrite it.
            output = 'function';
            break;
        case 'number':
        case 'boolean':
        case 'undefined':
            // Do nothing with these as they are supposed to be safe.
            output = input;
            break;
        default:
            // If we end here we are dealing with a type we don't expect to begin with. Begone!
            output = `unknown item type ${itemType}`;
    }

    return output;
}

/**
 * Returns the value of a setting, falling back to a given value if the setting
 * has not been set.
 * @param {string} module The ID of the module the setting belongs to
 * @param {string} setting The name of the setting
 * @param {any} defaultVal The value returned if the setting is not set
 * @returns {Promise<any>}
 */
export async function getSettingAsync (module, setting, defaultVal = undefined) {
    const settings = await getSettings();
    const value = settings[`Toolbox.${module}.${setting}`];

    if (value == null) {
        return defaultVal;
    }
    return value;
}

/**
 * Sets a setting to a new value.
 * @param {string} module The ID of the module the setting belongs to
 * @param {string} setting The name of the setting
 * @param {any} value The new value of the setting
 * @param {boolean} [syncSettings=true] If false, settings will not be committed
 * to storage after performing this action
 * @returns {Promise<void>}
 */
export const setSettingAsync = (module, setting, value) =>
    updateSettings({
        [`Toolbox.${module}.${setting}`]: value,
    });

/**
 * Gets a value in the cache.
 * @param {string} module The module that owns the cache key
 * @param {string} setting The name of the cache key
 * @param {any} [defaultVal] The value returned if there is no cached value
 * @returns {Promise<any>}
 */
export function getCache (module, setting, defaultVal) {
    return new Promise(resolve => {
        const storageKey = `${module}.${setting}`;
        const inputValue = defaultVal !== undefined ? defaultVal : null;
        browser.runtime.sendMessage({
            action: 'tb-cache',
            method: 'get',
            storageKey,
            inputValue,
        }).then(response => {
            if (response.errorThrown !== undefined) {
                logger.debug(`${storageKey} is corrupted.  Sending default.`);
                resolve(defaultVal);
            } else {
                resolve(response.value);
            }
        });
    });
}

/**
 * Sets a value in the cache.
 * @param {string} module The ID of the module that owns the cache key
 * @param {string} setting The name of the cache key
 * @param {any} inputValue The new value of the cache key
 * @returns {Promise<any>} Promises the new value of the cache key
 */
export function setCache (module, setting, inputValue) {
    const storageKey = `${module}.${setting}`;
    return new Promise(resolve => {
        browser.runtime.sendMessage({
            action: 'tb-cache',
            method: 'set',
            storageKey,
            inputValue,
        }).then(async () => {
            const value = await getCache(module, setting);
            resolve(value);
        });
    });
}
