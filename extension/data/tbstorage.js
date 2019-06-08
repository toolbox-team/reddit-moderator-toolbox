// This is here because we load even before TBUtils.
const domain = window.location.hostname.split('.')[0];

// Reset toolbox settings support
// load storage if we're not on the reset page.
if (window.location.href.indexOf('/r/tb_reset/comments/26jwfh/click_here_to_reset_all_your_toolbox_settings/') < 0) {
    storagewrapper();
} else {
    startReset();
}

// Clear all toolbox related localstorage items.
// After that direct users to a page confirming settings have been reset.
function clearLocal () {
    // Cache.
    chrome.runtime.sendMessage({
        action: 'tb-cache',
        method: 'clear',
    }, () => {
        // Wait a sec for stuff to clear.
        setTimeout(() => {
            window.location.href = `//${domain}.reddit.com/r/tb_reset/comments/26jwpl/your_toolbox_settings_have_been_reset/`;
        }, 1000);
    });
}

function startReset () {
    const r = confirm('This will reset all your toolbox settings.  Would you like to proceed?');
    if (r === true) {
        // Chrome, Edge en firefox webextensions.
        if (typeof chrome !== 'undefined') {
            chrome.storage.local.remove('tbsettings', () => {
                // Wait a sec for stuff to clear.
                setTimeout(() => {
                    clearLocal();
                }, 1000);
            });

        // Shouldn't happen as they don't have storage if this happens. But... you never know..
        } else {
            setTimeout(() => {
                clearLocal();
            }, 1000);
        }
    }
}

function storagewrapper () {
    (function (TBStorage) {
        profileResults('storageStart', performance.now());

        const SHORTNAME = 'TBStorage';

        TBStorage.settings = JSON.parse(localStorage['Toolboxv4.Storage.settings'] || '[]'); // always use local storage.

        let TBsettingsObject;
        TBStorage.domain = window.location.hostname.split('.')[0];

        $.log(`Domain: ${TBStorage.domain}`, false, SHORTNAME);

        TBStorage.isLoaded = false;

        chrome.storage.local.get('tbsettings', sObject => {
            if (sObject.tbsettings && sObject.tbsettings !== undefined) {
                TBsettingsObject = sObject.tbsettings;

                // Paranoid, malicious settings might be stored.
                purifyObject(TBsettingsObject);

                SendInit();
            } else {
                TBsettingsObject = {};
                SendInit();
            }

            // Listen for updated settings and update the settings object.
            chrome.runtime.onMessage.addListener(message => {
                // A complete settings object. Likely because settings have been saved or imported. Make sure to notify the user if they have settings open in this tab.
                if (message.action === 'tb-settings-update') {
                    TBsettingsObject = message.payload.tbsettings;
                    const $body = $('body');
                    $body.find('.tb-window-footer').addClass('tb-footer-save-warning');
                    $('body').find('.tb-personal-settings .tb-save').before('<div class="tb-save-warning">Settings have been saved in a different browser tab! Saving from this window will overwrite those settings.</div>');
                }

                // Single setting. Usually reserved for background operations as such we'll simply update it in the backround.
                if (message.action === 'tb-single-setting-update') {
                    TBsettingsObject[message.payload.key] = message.payload.value;
                }
            });
        });

        // methods.

        // SyncSetting is responsible for saving the setting from the local object to extension storage.
        // As such it should ALMOST ALWAYS be left default. You only use false if you are 100% sure all settings will be stored later.
        TBStorage.setSetting = function (module, setting, value, syncSetting = true) {
            return setSetting(module, setting, value, syncSetting);
        };

        TBStorage.getSetting = function (module, setting, defaultVal) {
            return getSetting(module, setting, defaultVal);
        };

        // methods.
        TBStorage.setCache = async function (module, setting, value) {
            return await setCache(module, setting, value, true);
        };

        TBStorage.getCache = async function (module, setting, defaultVal) {
            const cacheValue = await getCache(module, setting, defaultVal);
            return cacheValue;
        };

        TBStorage.unloading = function () {
            saveSettingsToBrowser();
        };

        TBStorage.purify = function (input) {
            return purify(input);
        };

        TBStorage.purifyObject = function (input) {
            purifyObject(input);
        };

        TBStorage.setSetting = function (module, setting, value, syncSetting = true) {
            return setSetting(module, setting, value, syncSetting);
        };

        TBStorage.getAnonymizedSettingsObject = function (callback) {
            if (!callback) {
                return;
            }
            settingsToObject(sObject => {
                // settings we delete
                delete sObject['Toolboxv4.Achievements.lastSeen'];
                delete sObject['Toolboxv4.Achievements.last_seen'];
                delete sObject['Toolboxv4.Bagels.bagelType'];
                delete sObject['Toolboxv4.Bagels.enabled'];
                delete sObject['Toolboxv4.Modbar.customCSS'];
                delete sObject['Toolboxv4.ModMail.lastVisited'];
                delete sObject['Toolboxv4.ModMail.replied'];
                delete sObject['Toolboxv4.ModMail.subredditColorSalt'];
                delete sObject['Toolboxv4.Notifier.lastChecked'];
                delete sObject['Toolboxv4.Notifier.lastSeenModmail'];
                delete sObject['Toolboxv4.Notifier.lastSeenUnmoderated'];
                delete sObject['Toolboxv4.Notifier.modmailCount'];
                delete sObject['Toolboxv4.Notifier.modqueueCount'];
                delete sObject['Toolboxv4.Notifier.modqueuePushed'];
                delete sObject['Toolboxv4.Notifier.unmoderatedCount'];
                delete sObject['Toolboxv4.Notifier.unreadMessageCount'];
                delete sObject['Toolboxv4.Notifier.unreadPushed'];
                delete sObject['Toolboxv4.QueueTools.kitteh'];
                delete sObject['Toolboxv4.RReasons.customRemovalReason'];
                delete sObject['Toolboxv4.Snoo.enabled'];
                delete sObject['Toolboxv4.Storage.settings'];
                delete sObject['Toolboxv4.Utils.echoTest'];
                delete sObject['Toolboxv4.Utils.tbDevs'];

                // these settings we want the length of the val.
                sObject['Toolboxv4.Comments.highlighted'] = undefindedOrLength(sObject['Toolboxv4.Comments.highlighted']);
                sObject['Toolboxv4.ModButton.savedSubs'] = undefindedOrLength(sObject['Toolboxv4.ModButton.savedSubs']);
                sObject['Toolboxv4.ModMail.botsToFilter'] = undefindedOrLength(sObject['Toolboxv4.ModMail.botsToFilter']);
                sObject['Toolboxv4.ModMail.filteredSubs'] = undefindedOrLength(sObject['Toolboxv4.ModMail.filteredSubs']);
                sObject['Toolboxv4.Modbar.shortcuts'] = undefindedOrLength(sObject['Toolboxv4.Modbar.shortcuts']);
                sObject['Toolboxv4.QueueTools.botCheckmark'] = undefindedOrLength(sObject['Toolboxv4.QueueTools.botCheckmark']);
                sObject['Toolboxv4.Utils.seenNotes'] = undefindedOrLength(sObject['Toolboxv4.Utils.seenNotes']);

                // these settings we just want to know if they are populated at all
                sObject['Toolboxv4.Achievements.save'] = undefindedOrTrue(sObject['Toolboxv4.Achievements.save']);
                sObject['Toolboxv4.ModButton.lastAction'] = undefindedOrTrue(sObject['Toolboxv4.ModButton.lastAction']);
                sObject['Toolboxv4.Modbar.lastExport'] = undefindedOrTrue(sObject['Toolboxv4.Modbar.lastExport']);
                sObject['Toolboxv4.Notifier.modSubreddits'] = undefindedOrTrue(sObject['Toolboxv4.Notifier.modSubreddits']);
                sObject['Toolboxv4.Notifier.modmailSubreddits'] = undefindedOrTrue(sObject['Toolboxv4.Notifier.modmailSubreddits']);
                sObject['Toolboxv4.Notifier.unmoderatedSubreddits'] = undefindedOrTrue(sObject['Toolboxv4.Notifier.unmoderatedSubreddits']);
                sObject['Toolboxv4.PNotes.noteWiki'] = undefindedOrTrue(sObject['Toolboxv4.PNotes.noteWiki']);
                sObject['Toolboxv4.QueueTools.queueCreature'] = undefindedOrTrue(sObject['Toolboxv4.QueueTools.queueCreature']);
                sObject['Toolboxv4.QueueTools.subredditColorSalt'] = undefindedOrTrue(sObject['Toolboxv4.QueueTools.subredditColorSalt']);
                sObject['Toolboxv4.Utils.settingSub'] = undefindedOrTrue(sObject['Toolboxv4.Utils.settingSub']);

                callback(sObject);

                function undefindedOrLength (setting) {
                    return setting === undefined ? 0 : setting.length;
                }

                function undefindedOrTrue (setting) {
                    if (!setting || setting === undefined) {
                        return false;
                    }
                    if (setting.length > 0) {
                        return true;
                    }
                }
            });
        };

        TBStorage.clearCache = async function () {
            await clearCache();

            await setCache('Utils', 'configCache', {});
            await setCache('Utils', 'noteCache', {});
            await setCache('Utils', 'rulesCache', {});
            await setCache('Utils', 'noConfig', []);
            await setCache('Utils', 'noNotes', []);
            await setCache('Utils', 'noRules', []);
            await setCache('Utils', 'moderatedSubs', []);
            await setCache('Utils', 'moderatedSubsData', []);
        };

        // The below block of code will keep watch for events that require clearing the cache like account switching and people accepting mod invites.
        $('body').on('click', '#RESAccountSwitcherDropdown .accountName, #header-bottom-right .logout, .toggle.moderator .option', () => {
            TBStorage.clearCache();
        });

        TBStorage.verifiedSettingsSave = function (callback) {
            settingsToObject(sObject => {
                const settingsObject = sObject;

                // save settings
                chrome.storage.local.set({
                    tbsettings: sObject,
                }, () => {
                    // now verify them
                    chrome.storage.local.get('tbsettings', returnObject => {
                        if (returnObject.tbsettings && returnObject.tbsettings !== undefined
                        && isEquivalent(returnObject.tbsettings, settingsObject)) {
                            // Succes, tell other browser tabs with toolbox that there are new settings.
                            chrome.runtime.sendMessage({
                                action: 'tb-global',
                                globalEvent: 'tb-settings-update',
                                payload: returnObject,
                            });
                            callback(true);
                        } else {
                            $.log('Settings could not be verified', false, SHORTNAME);
                            callback(false);
                        }
                    });
                });
            });
        };

        function SendInit () {
            // Check if we are logged in and if we want to activate on old reddit as well.
            let loggedinRedesign = false,
                loggedinOld = false;

            const $body = $('body');

            // Check for redesign
            if ($body.find('#USER_DROPDOWN_ID').text() || $body.find('.BlueBar__account a.BlueBar__username').text() || $body.find('.Header__profile').length) {
                loggedinRedesign = true;
            }

            // Check for old reddit
            if ($body.find('form.logout input[name=uh]').val() || $body.find('.Header__profile').length || $body.hasClass('loggedin')) {
                loggedinOld = true;
            }

            // Check if the oldreddit module is enabled and we also need to activate on old reddit.
            const oldRedditActive = getSetting('oldreddit', 'enabled', false);

            if (loggedinOld && oldRedditActive || loggedinRedesign) {
                $body.addClass('mod-toolbox-rd');
                setTimeout(() => {
                    profileResults('storageLoaded', performance.now());
                    const event = new CustomEvent('TBStorageLoaded2');
                    window.dispatchEvent(event);
                }, 10);
            }
        }

        function purify (input) {
            return DOMPurify.sanitize(input, {SAFE_FOR_JQUERY: true});
        }

        function registerSetting (module, setting) {
        // First parse out any of the ones we never want to save.
            if (module === undefined || module === 'cache') {
                return;
            }

            const keyName = `${module}.${setting}`;

            if ($.inArray(keyName, TBStorage.settings) === -1) {
                TBStorage.settings.push(keyName);
            }
        }

        function purifyObject (input) {
            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    const itemType = typeof input[key];
                    switch (itemType) {
                    case 'object':
                        purifyObject(input[key]);
                        break;
                    case 'string':
                        // Let's see if we are dealing with json.
                        // We want to handle json properly otherwise the purify process will mess up things.
                        try {
                            const jsonObject = JSON.parse(input[key]);
                            purifyObject(jsonObject);
                            input[key] = JSON.stringify(jsonObject);
                        } catch (e) {
                            // Not json, simply purify
                            input[key] = TBStorage.purify(input[key]);
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

        function purifyThing (input) {
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

        function settingsToObject (callback) {
            // We make a deep clone of the settings object so it can safely be used and manipulated for things like anonymized exports.
            const settingsObject = JSON.parse(JSON.stringify(TBsettingsObject));

            // We are paranoid, so we are going to purify the object first.s
            purifyObject(settingsObject);

            callback(settingsObject);
        }

        function saveSettingsToBrowser () {
            settingsToObject(sObject => {
                chrome.storage.local.set({
                    tbsettings: sObject,
                });
            });
        }

        function getSetting (module, setting, defaultVal) {
            const storageKey = `Toolboxv4.${module}.${setting}`;
            registerSetting(module, setting);

            defaultVal = defaultVal !== undefined ? defaultVal : null;
            let result;

            if (TBsettingsObject[storageKey] === undefined) {
                return defaultVal;
            } else {
                result = TBsettingsObject[storageKey];

                // send back the default if, somehow, someone stored `null`
                // NOTE: never, EVER store `null`!
                if (result === null
                && defaultVal !== null
                ) {
                    result = defaultVal;
                }

                // Again, being extra paranoid here but let's sanitize.
                const sanitzedResult = purifyThing(result);
                return sanitzedResult;
            }
        }

        // SyncSetting is responsible for saving the setting from the local object to extension storage.
        // As such it should ALMOST ALWAYS be left default. You only use false if you are 100% sure all settings will be stored later.
        function setSetting (module, setting, value, syncSettings = true) {
            const storageKey = `Toolboxv4.${module}.${setting}`;
            registerSetting(module, setting);

            // Sanitize the setting
            const sanitzedValue = purifyThing(value);

            TBsettingsObject[storageKey] = sanitzedValue;
            // try to save our settings.
            if (syncSettings) {
                saveSettingsToBrowser();

                // Communicate the new setting to other open tabs.
                chrome.runtime.sendMessage({
                    action: 'tb-global',
                    globalEvent: 'tb-single-setting-update',
                    payload: {
                        key: storageKey,
                        value: sanitzedValue,
                    },
                });
            }

            return getSetting(module, setting);
        }

        function getCache (module, setting, defaultVal) {
            return new Promise(resolve => {
                const storageKey = `TBCachev4.${module}.${setting}`;
                const inputValue = defaultVal !== undefined ? defaultVal : null;
                chrome.runtime.sendMessage({
                    action: 'tb-cache',
                    method: 'get',
                    storageKey,
                    inputValue,
                }, response => {
                    if (response.errorThrown !== undefined) {
                        $.log(`${storageKey} is corrupted.  Sending default.`, false, SHORTNAME);
                        resolve(defaultVal);
                    } else {
                        resolve(response.value);
                    }
                });
            });
        }

        function setCache (module, setting, inputValue) {
            const storageKey = `TBCachev4.${module}.${setting}`;
            return new Promise(resolve => {
                chrome.runtime.sendMessage({
                    action: 'tb-cache',
                    method: 'set',
                    storageKey,
                    inputValue,
                }, async () => {
                    const value = await getCache(module, setting);
                    resolve(value);
                });
            });
        }

        function clearCache () {
            return new Promise(resolve => {
                chrome.runtime.sendMessage({
                    action: 'tb-cache',
                    method: 'clear',
                }, () => {
                    resolve();
                });
            });
        }

        // based on: http://designpepper.com/blog/drips/object-equality-in-javascript.html
        // added recursive object checks - al
        function isEquivalent (a, b) {
        // Create arrays of property names
            const aProps = Object.getOwnPropertyNames(a),
                  bProps = Object.getOwnPropertyNames(b);

            // If number of properties is different,
            // objects are not equivalent
            if (aProps.length !== bProps.length) {
                $.log(`length :${aProps.length} ${bProps.length}`);
                return false;
            }

            for (let i = 0; i < aProps.length; i++) {
                const propName = aProps[i];
                const propA = a[propName],
                      propB = b[propName];

                // If values of same property are not equal,
                // objects are not equivalent
                if (propA !== propB) {
                    if (typeof propA === 'object' && typeof propB === 'object') {
                        if (!isEquivalent(propA, propB)) {
                            $.log(`prop :${propA} ${propB}`);
                            return false;
                        }
                    } else {
                        $.log(`prop :${propA} ${propB}`);
                        return false;
                    }
                }
            }

            // If we made it this far, objects
            // are considered equivalent
            return true;
        }
    })(TBStorage = window.TBStorage || {});
}
