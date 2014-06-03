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
            window.location.href = "http://www.reddit.com/r/tb_reset/comments/26jwpl/your_toolbox_settings_have_been_reset/"
        }
    }
})();

(function (TBStorage) {
    TBStorage.userBrowserStorage = getSetting('Utils', 'usebrowserstorage', false);

    var CHROME = 'chrome', FIREFOX = 'firefox', OPERA = 'opera', SAFARI = 'safari', UNKOWN_BROWSER = 'unknown';
    TBStorage.browser = UNKOWN_BROWSER;

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
        console.log('using browser storage')
        TBStorage.isLoaded = false;

        chrome.storage.local.get('tbsettings', function (sObject) {
            if (sObject.tbsettings && sObject.tbsettings !== undefined) {
                objectToSettings(sObject.tbsettings, function () {
                    TBStorage.isLoaded = true;
                });
            }
        });
    } else {
        TBStorage.isLoaded = true;
    }


    // methods.
    TBStorage.setSetting = function (module, setting, value) {
        return setSetting(module, setting, value);
    };

    TBStorage.getSetting = function (module, setting, defaultVal) {
        return getSetting(module, setting, defaultVal);
    };


    // Import export methods
    TBStorage.exportSettings = function (subreddit, callback) {
        var settingsObject = {};
        $(settings).each(function () {
            var key = this.split(".");
            var setting = getSetting(key[0], key[1], null);
            if (setting && setting !== undefined) {
                settingsObject[this] = setting;
            }

        });
        /*
        TBUtils.postToWiki('tbsettings', subreddit, settingsObject, true, false, function () {
            callback();
        });
        */
    };

    TBStorage.importSettings = function (subreddit, callback) {
        /*
        TBUtils.readFromWiki(subreddit, 'tbsettings', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                return;
            }

            $.each(resp, function (fullKey, value) {
                var key = fullKey.split(".");
                setSetting(key[0], key[1], value);
            });

            callback();
        });
        */
    };

    function settingsToObject(callback) {
        var settingsObject = {};
        Object.keys(localStorage)
        .forEach(function (fullKey) {
            if (/^(Toolbox.)/.test(fullKey)) {
                var key = fullKey.split(".");
                setting = getSetting(key[1], key[2], null);
                console.log(fullKey);
                if (setting && setting !== undefined) {
                    settingsObject[fullKey] = setting;
                }
            }
        });
        callback(settingsObject);
    };

    function saveSettingsToChrome() {
        settingsToObject(function (sObject) {
            chrome.storage.local.set({
                'tbsettings': sObject
            });
        });
    }
    //saveSettingsToChrome();

    function objectToSettings(object, callback) {
        console.log(object);
        $.each(object, function (fullKey, value) {
            var key = fullKey.split(".");
            //$.log(key[1] + '.' + key[2] + ': ' + value, true);
            setSetting(key[1], key[2], value);
        });

        callback();
    };

    function getSetting(module, setting, defaultVal) {
        var storageKey = 'Toolbox.' + module + '.' + setting;
        //registerSetting(module, setting); why reg settings that have never changed?

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
            return result;
        }
    }

    function setSetting(module, setting, value) {
        var storageKey = 'Toolbox.' + module + '.' + setting;
        //registerSetting(module, setting);

        localStorage[storageKey] = JSON.stringify(value);
        return getSetting(module, setting);
    }

}(TBStorage = window.TBStorage || {}));
