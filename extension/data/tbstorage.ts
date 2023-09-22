import DOMPurify from 'dompurify';
import $ from 'jquery';
import browser from 'webextension-polyfill';

import TBLog from './tblog.js';

const logger = TBLog('TBStorage');

/** The current subdomain (NOT full domain). */
export const domain = window.location.hostname.split('.')[0];
logger.debug(`Domain: ${domain}`);

/** A list of all currently loaded settings keys. */
export const settings: string[] = [];

/** An object mapping setting keys to their currently loaded values. */
let TBsettingsObject: Record<string, any>;

/**
 * A promise which will fulfill once the current settings are fetched from
 * extension storage. Once this promise fulfills, it's safe to assume
 * `TBsettingsObject` contains our settings. Settings reads are delayed until
 * then - either by awaiting this promise, or by waiting for the
 * `TBStorageLoaded` window event, which is emitted at the same time.
 */
const initialLoadPromise = browser.storage.local.get('tbsettings').then(sObject => {
    if (sObject.tbsettings) {
        TBsettingsObject = sObject.tbsettings;

        // Paranoid, malicious settings might be stored.
        purifyObject(TBsettingsObject);
    } else {
        TBsettingsObject = {};
    }

    // Once that's all done, this promise will fulfill and pending storage calls
    // will be unblocked.
});

// Don't handle background page messages until we've got our initial settings.
initialLoadPromise.then(() => {
    // Listen for updated settings and update the settings object.
    browser.runtime.onMessage.addListener(message => {
        // A complete settings object. Likely because settings have been saved or imported. Make sure to notify the user if they have settings open in this tab.
        if (message.action === 'tb-settings-update') {
            TBsettingsObject = message.payload.tbsettings;
            const $body = $('body');
            $body.find('.tb-window-footer').addClass('tb-footer-save-warning');
            $('body').find('.tb-personal-settings .tb-save').before(
                '<div class="tb-save-warning">Settings have been saved in a different browser tab! Saving from this window will overwrite those settings.</div>',
            );
        }

        // Single setting. Usually reserved for background operations as such we'll simply update it in the backround.
        if (message.action === 'tb-single-setting-update') {
            TBsettingsObject[message.payload.key] = message.payload.value;
            const keySplit = message.payload.key.split('.');
            const detailObject = {
                module: keySplit[1],
                setting: keySplit[2],
                value: message.payload.value,
            };

            window.dispatchEvent(
                new CustomEvent('tbSingleSettingUpdate', {
                    detail: detailObject,
                }),
            );
        }
    });
});

/**
 * Generates an anonymized version of the settings object, with some sensitive
 * settings omitted and other settings represented differently.
 * @returns {Promise<object>}
 */
export async function getAnonymizedSettings () {
    const sObject = await getSettings();

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

    function undefindedOrLength (setting: any[] | undefined) {
        return setting === undefined ? 0 : setting.length;
    }

    function undefindedOrTrue (setting: any[] | undefined) {
        if (!setting) {
            return false;
        }
        if (setting.length > 0) {
            return true;
        }
    }
}

/** Clears all cache keys. */
export async function clearCache () {
    await browser.runtime.sendMessage({
        action: 'tb-cache',
        method: 'clear',
    });
}

// The below block of code will keep watch for events that require clearing the cache like account switching and people accepting mod invites.
$('body').on(
    'click',
    '#RESAccountSwitcherDropdown .accountName, #header-bottom-right .logout, .toggle.moderator .option',
    () => {
        clearCache();
    },
);

/**
 * Saves current settings, then verifies that they've been saved accurately. If
 * the save was successful, tells the background page to update the settings
 * state of other tabs. Calls back with whether or not the save was successful.
 */
export function verifiedSettingsSave (callback: (success: boolean) => void) {
    getSettings().then(sObject => {
        const settingsObject = sObject;

        // save settings
        browser.storage.local.set({
            tbsettings: sObject,
        }).then(() => {
            // now verify them
            browser.storage.local.get('tbsettings').then(returnObject => {
                if (returnObject.tbsettings && isEquivalent(returnObject.tbsettings, settingsObject)) {
                    // Succes, tell other browser tabs with toolbox that there are new settings.
                    browser.runtime.sendMessage({
                        action: 'tb-global',
                        globalEvent: 'tb-settings-update',
                        payload: returnObject,
                        excludeBackground: true,
                    });
                    callback(true);
                } else {
                    logger.debug('Settings could not be verified');
                    callback(false);
                }
            });
        });
    });
}

/** Uses DOMPurify to sanitize untrusted HTML strings. */
export function purify (input: string) {
    return DOMPurify.sanitize(input);
}

// TODO: to be honest I'm not sure what this one does
function registerSetting (module?: string, setting?: string) {
    // First parse out any of the ones we never want to save.
    if (module === undefined || module === 'cache') {
        return;
    }

    const keyName = `${module}.${setting}`;

    if (!settings.includes(keyName)) {
        settings.push(keyName);
    }
}

/**
 * Recursively sanitize an object's string values as untrusted HTML. String
 * values that can be interpreted as JSON objects are parsed, sanitized, and
 * re-stringified.
 */
export function purifyObject (input: any) {
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
function purifyThing (input: any) {
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
 * Promises a copy of the current settings object, containing all setting keys
 * and their values.
 * @returns {Promise<object>}
 */
export async function getSettings () {
    await initialLoadPromise;

    // We make a deep clone of the settings object so it can safely be used and manipulated for things like anonymized exports.
    const settingsObject: Record<string, any> = JSON.parse(JSON.stringify(TBsettingsObject));

    // We are paranoid, so we are going to purify the object first.s
    purifyObject(settingsObject);

    return settingsObject;
}

/** Commits the current settings to extension storage. */
async function saveSettingsToBrowser () {
    browser.storage.local.set({
        tbsettings: await getSettings(),
    });
}

/**
 * Returns the value of a setting.
 * @deprecated Use {@linkcode getSettingAsync} instead
 * @param module The ID of the module the setting belongs to
 * @param setting The name of the setting
 * @param defaultVal The value returned if the setting is not set
 */
export function getSetting (module: string, setting: string, defaultVal: any = null) {
    const storageKey = `Toolbox.${module}.${setting}`;
    registerSetting(module, setting);

    defaultVal = defaultVal !== undefined ? defaultVal : null;
    let result;

    if (TBsettingsObject[storageKey] === undefined) {
        return defaultVal;
    } else {
        result = TBsettingsObject[storageKey];

        // send back the default if, somehow, someone stored `null`
        // NOTE: never, EVER store `null`!
        if (
            result === null
            && defaultVal !== null
        ) {
            result = defaultVal;
        }

        // Again, being extra paranoid here but let's sanitize.
        const sanitzedResult = purifyThing(result);
        return sanitzedResult;
    }
}

/**
 * Returns the value of a setting.
 * @param module The ID of the module the setting belongs to
 * @param setting The name of the setting
 * @param defaultVal The value returned if the setting is not set
 */
export async function getSettingAsync (module: string, setting: string, defaultVal: any = null) {
    await initialLoadPromise;
    return getSetting(module, setting, defaultVal);
}

/**
 * Sets a setting to a new value.
 * @deprecated Use {@linkcode setSettingAsync} instead
 * @param module The ID of the module the setting belongs to
 * @param setting The name of the setting
 * @param value The new value of the setting
 * @param syncSettings If `false`, settings will not be committed to storage
 * after performing this action
 * @returns The new value of the setting
 */
export function setSetting (module: string, setting: string, value: any, syncSettings = true) {
    const storageKey = `Toolbox.${module}.${setting}`;
    registerSetting(module, setting);

    // Sanitize the setting
    const sanitzedValue = purifyThing(value);

    TBsettingsObject[storageKey] = sanitzedValue;
    // try to save our settings.
    if (syncSettings) {
        saveSettingsToBrowser();

        // Communicate the new setting to other open tabs.
        browser.runtime.sendMessage({
            action: 'tb-global',
            globalEvent: 'tb-single-setting-update',
            excludeBackground: true,
            payload: {
                key: storageKey,
                value: sanitzedValue,
            },
        });
    }

    return getSetting(module, setting);
}

/**
 * Sets a setting to a new value.
 * @param module The ID of the module the setting belongs to
 * @param setting The name of the setting
 * @param value The new value of the setting
 * @param syncSettings If `false`, settings will not be committed to storage
 * after performing this action
 * @returns The new value of the setting
 */
export async function setSettingAsync (module: string, setting: string, value: any, syncSettings = true) {
    await initialLoadPromise;
    return setSetting(module, setting, value, syncSettings);
}

/**
 * Gets a value in the cache.
 * @param module The module that owns the cache key
 * @param setting The name of the cache key
 * @param defaultVal The value returned if there is no cached value
 */
export function getCache (module: string, setting: string, defaultVal: any = null) {
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
 * @param module The ID of the module that owns the cache key
 * @param setting The name of the cache key
 * @param inputValue The new value of the cache key
 * @returns Promises the new value of the cache key
 */
export function setCache (module: string, setting: string, inputValue: any) {
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

/**
 * Checks whether two objects are deeply equivalent by recursively comparing
 * their property values. Does not check reference equality.
 */
// based on: http://designpepper.com/blog/drips/object-equality-in-javascript.html
// added recursive object checks - al
function isEquivalent (a: object, b: object): boolean {
    // Create arrays of property names
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length !== bProps.length) {
        logger.debug(`length :${aProps.length} ${bProps.length}`);
        return false;
    }

    for (let i = 0; i < aProps.length; i++) {
        const propName = aProps[i] as keyof typeof a & keyof typeof b;
        const propA = a[propName];
        const propB = b[propName];

        // If values of same property are not equal,
        // objects are not equivalent
        if (propA !== propB) {
            if (typeof propA === 'object' && typeof propB === 'object') {
                if (!isEquivalent(propA, propB)) {
                    logger.debug(`prop :${propA} ${propB}`);
                    return false;
                }
            } else {
                logger.debug(`prop :${propA} ${propB}`);
                return false;
            }
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}
