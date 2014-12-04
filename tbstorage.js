// This is here because we load even before TBUtils.

//Reset toolbox settings support
(function () {
    if (window.location.href.indexOf('/r/tb_reset/comments/26jwfh/click_here_to_reset_all_your_toolbox_settings/') > -1) {
        var r = confirm("This will reset all your toolbox settings.  Would you like to proceed?");
        if (r == true) {
            //
            // TODO clear chrome storage here.
            //

            Object.keys(localStorage)
                .forEach(function (key) {
                    if (/^(Toolbox.)/.test(key)) {
                        localStorage.removeItem(key);
                    }
                });
            // Chrome
            if (typeof (chrome) !== "undefined") {
                chrome.storage.local.remove('tbsettings', function () {
                    window.location.href = "//www.reddit.com/r/tb_reset/comments/26jwpl/your_toolbox_settings_have_been_reset/"
                });

            // Firefox
            } else if ((typeof (InstallTrigger) !== "undefined" || 'MozBoxSizing' in document.body.style)) {
                self.port.emit('tb-clearsettings');
                self.port.on('tb-clearsettings-reply', function () {
                    window.location.href = "//www.reddit.com/r/tb_reset/comments/26jwpl/your_toolbox_settings_have_been_reset/"
                });

            // Donno, fuck it.
            } else {
                window.location.href = "//www.reddit.com/r/tb_reset/comments/26jwpl/your_toolbox_settings_have_been_reset/"
            }
        }
    }
})();

(function (TBStorage) {
    TBStorage.settings = JSON.parse(localStorage['Toolbox.Storage.settings'] || '[]');  //always use local storage.
    TBStorage.userBrowserStorage = getSetting('Storage', 'usebrowserstorage', true);

    var CHROME = 'chrome', FIREFOX = 'firefox', OPERA = 'opera', SAFARI = 'safari', UNKOWN_BROWSER = 'unknown';
    TBStorage.browser = UNKOWN_BROWSER;
    TBStorage.isLoaded = false;

    // Get our browser.  Hints: http://jsfiddle.net/9zxvE/383/
    if (typeof (InstallTrigger) !== "undefined" || 'MozBoxSizing' in document.body.style) {
        TBStorage.browser = FIREFOX;
    } else if (typeof (chrome) !== "undefined") {
        TBStorage.browser = CHROME;

        if (navigator.userAgent.indexOf(' OPR/') >= 0) { // always check after Chrome
            TBStorage.browser = OPERA;
        }
    } else if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
        TBStorage.browser = SAFARI;
    }

    if (TBStorage.userBrowserStorage && TBStorage.browser === CHROME) {
        //console.log('using browser storage');

        chrome.storage.local.get('tbsettings', function (sObject) {
            if (sObject.tbsettings && sObject.tbsettings !== undefined) {
                objectToSettings(sObject.tbsettings, function () {
                    //console.log('got settings: chrome');
                    SendInit();
                });
            } else {
                SendInit();
            }
        });
    } else if (TBStorage.userBrowserStorage && TBStorage.browser === FIREFOX) {
        // Ask for settings.
        self.port.emit('tb-getsettings');

        // wait for reply.
        self.port.on('tb-settings-reply', function (tbsettings) {
            if (tbsettings !== null) {
                objectToSettings(tbsettings, function () {
                    //console.log('got settings: firefox');
                    //console.log(tbsettings);
                    SendInit();
                });
            } else {
                SendInit();
            }
        });
    } else {
        SendInit();
        // uncomment to test wait loops.  
        /*
         TBStorage.isLoaded = false;
         setTimeout(function () {
         SendInit();
         }, 9000);
         */

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

    TBStorage.clearCache = function () {

        Object.keys(sessionStorage)
            .forEach(function (key) {
                sessionStorage.removeItem(key);
            });

        setCache('Utils', 'configcache',{});
        setCache('Utils', 'notecache', {});
        setCache('Utils', 'noconfig', []);
        setCache('Utils', 'nonotes', []);
        setCache('Utils', 'moderatedsubs', []);
        setCache('Utils', 'moderatedsubsdata', []);
    };

    function SendInit() {
        //TBLoadUtils
        var event = new CustomEvent("TBLoadUtils");
        window.dispatchEvent(event);
        setTimeout(function () {
            TBStorage.isLoaded = true;

            event = new CustomEvent("TBStorageLoaded");
            window.dispatchEvent(event);
        }, 10);

    }

    function registerSetting(module, setting) {
        // First parse out any of the ones we never want to save.
        if (module === undefined || module === 'cache') return;

        var keyName = module + '.' + setting;

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
                    var key = fullKey.split(".");
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
        if (!TBStorage.userBrowserStorage) return;

        if (TBStorage.browser === CHROME) {
            // chrome
            settingsToObject(function (sObject) {
                chrome.storage.local.set({
                    'tbsettings': sObject
                });
            });
        } else if (TBStorage.browser === FIREFOX) {
            // firefox
            settingsToObject(function (sObject) {
                self.port.emit('tb-setsettings', sObject)
            });
        }
    }

    function objectToSettings(object, callback) {
        //console.log(object);
        $.each(object, function (fullKey, value) {
            var key = fullKey.split(".");
            //console.log(key[1] + '.' + key[2] + ': ' + value, true);
            setSetting(key[1], key[2], value, false);
        });

        callback();
    }

    function getSetting(module, setting, defaultVal) {
        var storageKey = 'Toolbox.' + module + '.' + setting;
        registerSetting(module, setting);

        defaultVal = (defaultVal !== undefined) ? defaultVal : null;

        if (localStorage[storageKey] === undefined) {
            return defaultVal;
        } else {
            var storageString = localStorage[storageKey];
            try {
                result = JSON.parse(storageString);
            } catch (e) {
                result = storageString;
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
        var storageKey = 'Toolbox.' + module + '.' + setting;
        registerSetting(module, setting);

        localStorage[storageKey] = JSON.stringify(value);

        // try to save our settings.
        if (syncSettings) saveSettingsToBrowser();

        return getSetting(module, setting);
    }

    function getCache(module, setting, defaultVal) {
        var storageKey = 'Toolbox.' + module + '.' + setting;

        defaultVal = (defaultVal !== undefined) ? defaultVal : null;

        if (sessionStorage[storageKey] === undefined) {
            return defaultVal;
        } else {
            var storageString = sessionStorage[storageKey];
            try {
                result = JSON.parse(storageString);
            } catch (e) {
                result = storageString;
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
        var storageKey = 'Toolbox.' + module + '.' + setting;

        sessionStorage[storageKey] = JSON.stringify(value);

        return getSetting(module, setting);
    }

}(TBStorage = window.TBStorage || {}));
