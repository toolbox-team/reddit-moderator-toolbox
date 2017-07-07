// This is here because we load even before TBUtils.

//Reset toolbox settings support
(function () {

    // load storage if we're not on the reset page.
    if (window.location.href.indexOf('/r/tb_reset/comments/26jwfh/click_here_to_reset_all_your_toolbox_settings/') < 0) {
        storagewrapper();
        return;
    }

    var domain = window.location.hostname.split('.')[0],
        r = confirm('This will reset all your toolbox settings.  Would you like to proceed?');
    if (r == true) {
        function clearLocal() {

            // Settings.
            Object.keys(localStorage)
                .forEach(function (key) {
                    if (/^(Toolbox.)/.test(key)) {
                        localStorage.removeItem(key);
                    }
                });

            // Cache.
            Object.keys(localStorage)
                .forEach(function (key) {
                    if (/^(TBCache.)/.test(key)) {
                        localStorage.removeItem(key);
                    }
                });


            // Wait a sec for stuff to clear.
            setTimeout(function () {
                window.location.href = `//${domain}.reddit.com/r/tb_reset/comments/26jwpl/your_toolbox_settings_have_been_reset/`;
            }, 1000);
        }

        // Chrome
        if (typeof (chrome) !== 'undefined') {
            chrome.storage.local.remove('tbsettings', function () {
                // Wait a sec for stuff to clear.
                setTimeout(function () {
                    clearLocal();
                }, 1000);
            });

            // Safari
        } else if (typeof (safari) !== 'undefined') {
            safari.self.addEventListener('message', function (event) {
                if (event.name == 'tb-clearsettings') {
                    // Wait a sec for stuff to clear.
                    setTimeout(function () {
                        clearLocal();
                    }, 1000);
                }
            }, false);

            safari.self.tab.dispatchMessage('tb-clearsettings', null);
            // Firefox
        } else if ((typeof (InstallTrigger) !== 'undefined' || 'MozBoxSizing' in document.body.style)) {
            self.port.on('tb-clearsettings-reply', function () {
                // Wait a sec for stuff to clear.
                setTimeout(function () {
                    clearLocal();
                }, 1000);
            });

            self.port.emit('tb-clearsettings');
            // Donno, fuck it.
        } else {
            // Wait a sec for stuff to clear.
            setTimeout(function () {
                clearLocal();
            }, 1000);
        }
    }
})();

function storagewrapper() {
    (function (TBStorage) {
        if ((!$('form.logout input[name=uh]').val() && $('.Header__profile').length === 0) || $('.mod-toolbox').length) return; // not logged in or toolbox is already loaded.


        var SHORTNAME = 'TBStorage';

        // Type safe keys.
        TBStorage.SAFE_STORE_KEY = 'Toolbox.Storage.safeToStore';

        TBStorage.settings = JSON.parse(localStorage['Toolbox.Storage.settings'] || '[]');  //always use local storage.
        TBStorage.domain = window.location.hostname.split('.')[0];

        $.log(`Domain: ${TBStorage.domain}`, false, SHORTNAME);

        localStorage[TBStorage.SAFE_STORE_KEY] = (TBStorage.domain === 'www' || TBStorage.domain === 'mod');


        var CHROME = 'chrome', FIREFOX = 'firefox', OPERA = 'opera', SAFARI = 'safari', EDGE = 'edge', UNKOWN_BROWSER = 'unknown';
        TBStorage.browsers = {
            CHROME: CHROME,
            FIREFOX: FIREFOX,
            OPERA: OPERA,
            SAFARI: SAFARI,
            EDGE: EDGE,
            UNKOWN_BROWSER: UNKOWN_BROWSER
        };

        TBStorage.browser = UNKOWN_BROWSER;
        TBStorage.isLoaded = false;

        // Get our browser.  Hints: http://jsfiddle.net/9zxvE/383/
        if (typeof (InstallTrigger) !== 'undefined' || 'MozBoxSizing' in document.body.style) {
            TBStorage.browser = FIREFOX;
        } else if (typeof (window.browser) !== 'undefined'){
            TBStorage.browser = EDGE;
            chrome = window.browser;
        } else if (typeof (chrome) !== 'undefined') {
            TBStorage.browser = CHROME;

            if (navigator.userAgent.indexOf(' OPR/') >= 0) { // always check after Chrome
                TBStorage.browser = OPERA;
            }
        } else if (typeof (safari) !== 'undefined') {
            TBStorage.browser = SAFARI;
        }


        if (TBStorage.browser === CHROME || TBStorage.browser === EDGE || TBStorage.browser === FIREFOX) {
            chrome.storage.local.get('tbsettings', function (sObject) {
                if (sObject.tbsettings && sObject.tbsettings !== undefined) {
                    objectToSettings(sObject.tbsettings, function () {
                        SendInit();
                    });
                } else {
                    SendInit();
                }
            });
        } else if (TBStorage.browser === SAFARI) {
        // wait for reply.
            safari.self.addEventListener('message', function (event) {
                var tbsettings = event.message;
                if (event.name === 'tb-getsettings' && tbsettings !== undefined) {
                    objectToSettings(tbsettings, function () {
                        SendInit();
                    });
                }
                else {
                    SendInit();
                }
            }, false);

            // Ask for settings.
            safari.self.tab.dispatchMessage('tb-getsettings', null);
        } else {
            SendInit();
        }


        // methods.
        TBStorage.setSetting = function (module, setting, value) {
            return setSetting(module, setting, value, true);
        };


        TBStorage.getSetting = function (module, setting, defaultVal) {
            return getSetting(module, setting, defaultVal);
        };


        // methods.
        TBStorage.setCache = function (module, setting, value) {
            return setCache(module, setting, value, true);
        };


        TBStorage.getCache = function (module, setting, defaultVal) {
            return getCache(module, setting, defaultVal);
        };


        TBStorage.unloading = function () {
            saveSettingsToBrowser();
        };

        TBStorage.getSettingsObject = function(callback){
            if (!callback) return;
            settingsToObject(function (sObject) {
                callback(sObject);
            });
        };

        TBStorage.getAnonymizedSettingsObject = function(callback){
            if (!callback) return;
            settingsToObject(function (sObject) {

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
                sObject['Toolbox.Notifier.modmailSubreddits'] = undefindedOrTrue(sObject['Toolbox.Notifier.modmailSubreddits']);
                sObject['Toolbox.Notifier.unmoderatedSubreddits'] = undefindedOrTrue(sObject['Toolbox.Notifier.unmoderatedSubreddits']);
                sObject['Toolbox.PNotes.noteWiki'] = undefindedOrTrue(sObject['Toolbox.PNotes.noteWiki']);
                sObject['Toolbox.QueueTools.queueCreature'] = undefindedOrTrue(sObject['Toolbox.QueueTools.queueCreature']);
                sObject['Toolbox.QueueTools.subredditColorSalt'] = undefindedOrTrue(sObject['Toolbox.QueueTools.subredditColorSalt']);
                sObject['Toolbox.Utils.settingSub'] = undefindedOrTrue(sObject['Toolbox.Utils.settingSub']);


                callback(sObject);

                function undefindedOrLength(setting){
                    return (setting === undefined) ?  0 : setting.length;
                }

                function undefindedOrTrue(setting){
                    if (!setting || setting === undefined) return false;
                    if (setting.length > 0) return true;
                }
            });
        };



        TBStorage.clearCache = function () {

            Object.keys(localStorage)
                .forEach(function (key) {
                    if (/^(TBCache.)/.test(key)) {
                        localStorage.removeItem(key);
                    }
                });

            setCache('Utils', 'configCache', {});
            setCache('Utils', 'noteCache', {});
            setCache('Utils', 'rulesCache', {});
            setCache('Utils', 'noConfig', []);
            setCache('Utils', 'noNotes', []);
            setCache('Utils', 'noRules', []);
            setCache('Utils', 'moderatedSubs', []);
            setCache('Utils', 'moderatedSubsData', []);
        };

        // The below block of code will keep watch for events that require clearing the cache like account switching and people accepting mod invites.
        $('body').on('click', '#RESAccountSwitcherDropdown .accountName, #header-bottom-right .logout, .toggle.moderator .option', function() {
            TBStorage.clearCache();
        });


        TBStorage.verifiedSettingsSave = function (callback) {
        // Don't re-store the settings after a save on the the refresh that follows.
            localStorage.removeItem(TBStorage.SAFE_STORE_KEY);

            if (TBStorage.browser === CHROME || TBStorage.browser === EDGE || TBStorage.browser === FIREFOX) {
                settingsToObject(function (sObject) {
                    var settingsObject = sObject;

                    // save settings
                    chrome.storage.local.set({
                        'tbsettings': sObject
                    }, function () {

                    // now verify them
                        chrome.storage.local.get('tbsettings', function (returnObject) {
                            if (returnObject.tbsettings && returnObject.tbsettings !== undefined
                            && isEquivalent(returnObject.tbsettings, settingsObject)) {
                                callback(true);
                            } else {
                                $.log('Settings could not be verified', false, SHORTNAME);
                                callback(false);
                            }
                        });
                    });

                });

            } else if (TBStorage.browser === SAFARI) {
                settingsToObject(function (sObject) {
                    var settingsObject = sObject;

                    // save settings
                    safari.self.tab.dispatchMessage('tb-setsettings', sObject);

                    // verify settings
                    safari.self.addEventListener('message', function (event) {
                        var tbsettings = event.message;
                        if (event.name === 'tb-getsettings' && tbsettings !== undefined
                        && isEquivalent(tbsettings, settingsObject)) {
                            callback(true);
                        } else {
                            $.log('Settings could not be verified', false, SHORTNAME);
                            callback(false);
                        }
                    }, false);

                    // Ask for settings.
                    safari.self.tab.dispatchMessage('tb-getsettings', null);
                });

            }
        };


        function SendInit() {
            setTimeout(function () {
                var event = new CustomEvent('TBStorageLoaded');
                window.dispatchEvent(event);
            }, 10);
        }


        function registerSetting(module, setting) {
        // First parse out any of the ones we never want to save.
            if (module === undefined || module === 'cache') return;

            var keyName = `${module}.${setting}`;

            if ($.inArray(keyName, TBStorage.settings) === -1) {
                TBStorage.settings.push(keyName);

                // Always save to localStorage.
                localStorage['Toolbox.Storage.settings'] = JSON.stringify(TBStorage.settings.sort());
            }
        }


        function settingsToObject(callback) {
            var settingsObject = {};
            Object.keys(localStorage)
                .forEach(function (fullKey) {
                    if (/^(Toolbox.)/.test(fullKey)) {
                        if (fullKey === TBStorage.SAFE_STORE_KEY) return;
                        var key = fullKey.split('.'),
                            setting = getSetting(key[1], key[2], null);
                        //console.log(fullKey);
                        if (setting !== undefined) {
                            settingsObject[fullKey] = setting;
                        }
                    }
                });
            callback(settingsObject);
        }


        function saveSettingsToBrowser() {
        // Never write back from subdomains.  This can cause a bit of syncing issue, but resolves reset issues.
            if (!JSON.parse((localStorage[TBStorage.SAFE_STORE_KEY]) || 'false')) return;

            if (TBStorage.browser === CHROME || TBStorage.browser === EDGE || TBStorage.browser === FIREFOX) {
            // chrome
                settingsToObject(function (sObject) {
                    chrome.storage.local.set({
                        'tbsettings': sObject
                    });
                });
            } else if (TBStorage.browser === SAFARI) {
                settingsToObject(function (sObject) {
                    safari.self.tab.dispatchMessage('tb-setsettings', sObject);
                });
            }
        }


        function objectToSettings(object, callback) {
        //console.log(object);
            $.each(object, function (fullKey, value) {
                var key = fullKey.split('.');
                //console.log(key[1] + '.' + key[2] + ': ' + value, true);
                setSetting(key[1], key[2], value, false);
            });

            callback();
        }


        function getSetting(module, setting, defaultVal) {
            var storageKey = `Toolbox.${module}.${setting}`;
            registerSetting(module, setting);

            defaultVal = (defaultVal !== undefined) ? defaultVal : null;
            var result;
            if (localStorage[storageKey] === undefined) {
                return defaultVal;
            } else {
                var storageString = localStorage[storageKey];
                try {
                    result = JSON.parse(storageString);
                } catch (e) {
                    $.log(`${storageKey} is corrupted.  Sending default.`, false, SHORTNAME);
                    result = defaultVal; // if everything gets strignified, it's always JSON.  If this happens, the storage val is corrupted.
                }

                // send back the default if, somehow, someone stored `null`
                // NOTE: never, EVER store `null`!
                if (result === null
                && defaultVal !== null
                ) {
                    result = defaultVal;
                }
                return result;
            }
        }


        function setSetting(module, setting, value, syncSettings) {
            var storageKey = `Toolbox.${module}.${setting}`;
            registerSetting(module, setting);

            localStorage[storageKey] = JSON.stringify(value);

            // try to save our settings.
            if (syncSettings) saveSettingsToBrowser();

            return getSetting(module, setting);
        }


        function getCache(module, setting, defaultVal) {
            var storageKey = `TBCache.${module}.${setting}`;

            defaultVal = (defaultVal !== undefined) ? defaultVal : null;
            var result;
            if (localStorage[storageKey] === undefined) {
                return defaultVal;
            } else {
                var storageString = localStorage[storageKey];
                try {
                    result = JSON.parse(storageString);
                } catch (e) {
                    $.log(`${storageKey} is corrupted.  Sending default.`, false, SHORTNAME);
                    result = defaultVal; // if everything gets strignified, it's always JSON.  If this happens, the storage val is corrupted.
                }

                // send back the default if, somehow, someone stored `null`
                // NOTE: never, EVER store `null`!
                if (result === null
                && defaultVal !== null
                ) {
                    result = defaultVal;
                }
                return result;
            }
        }


        function setCache(module, setting, value) {
            var storageKey = `TBCache.${module}.${setting}`;

            localStorage[storageKey] = JSON.stringify(value);

            return getSetting(module, setting);
        }


        // based on: http://designpepper.com/blog/drips/object-equality-in-javascript.html
        // added recursive object checks - al
        function isEquivalent(a, b) {
        // Create arrays of property names
            var aProps = Object.getOwnPropertyNames(a),
                bProps = Object.getOwnPropertyNames(b);

            // If number of properties is different,
            // objects are not equivalent
            if (aProps.length != bProps.length) {
                $.log(`length :${aProps.length} ${bProps.length}`);
                return false;
            }

            for (var i = 0; i < aProps.length; i++) {
                var propName = aProps[i],
                    propA = a[propName],
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

    }(TBStorage = window.TBStorage || {}));
}
