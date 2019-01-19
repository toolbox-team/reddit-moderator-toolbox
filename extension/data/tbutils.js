function initwrapper(userDetails, newModSubs) {
    /** @namespace  TBUtils */
    (function (TBUtils) {

        // We need these before we can do anything.
        TBUtils.userDetails = userDetails;
        TBUtils.modhash = userDetails.data.modhash;

        TBUtils.logged = userDetails.data.name;

        TBUtils.post_site = $('.redditname:not(.pagename) a:first').html(); // This may need to be changed to regex, if this is unreliable.

        if(window.location.hostname === 'mod.reddit.com') {
            $('body').addClass('mod-toolbox-new-modmail');
        }

        // new profiles have some weird css going on. This remedies the weirdness...
        window.addEventListener('TBNewPage', function (event) {
            if(event.detail.pageType === 'userProfile') {
                $('body').addClass('mod-toolbox-profile');
            } else {
                $('body').removeClass('mod-toolbox-profile');
            }
        });

        // Let's get oauth information
        // We fetch the data on page load but we don't access the variable directly.

        /**
         * Fetches the new modmail token
         * @function oauthToken
         * @memberof TBUtils
         * @returns {Promise} Returns the token through a promise object
         */
        TBUtils.oauthToken = function oauthToken() {
            return new Promise(function (resolve) {
                chrome.runtime.sendMessage({action: 'oauthToken'}, resolve);
            }).then(function(response) {
                const responseObject = JSON.parse(response.oauthToken);
                if (!responseObject.ERROR) {

                    return responseObject.accessToken;
                } else {
                    $.log(`ERROR: ${responseObject.ERROR}`, false, SHORTNAME);
                    throw new Error(`ERROR:${responseObject.ERROR}`);
                }
            });
        };

        /**
         * If we are on new modmail we use www.reddit.com for all other instances we use whatever is the current domain. Used because some browsers do not like relative urls in extensions
         * @var {string} baseDomain
         * @memberof TBUtils
         * */
        TBUtils.baseDomain = ((window.location.hostname === 'mod.reddit.com' || window.location.hostname === 'new.reddit.com') ? 'https://www.reddit.com' : `https://${window.location.hostname}`);

        /**
         * Pretty much as the name suggests
         * @var {string} tempBaseDomain
         * @memberof TBUtils
         * @todo Once the redesign is no longer alpha/beta switch all instances that use this.
         * */
        TBUtils.tempBaseDomain = window.location.hostname === 'new.reddit.com' ? 'https://new.reddit.com' : 'https://www.reddit.com';

        const CHROME = 'chrome', FIREFOX = 'firefox', OPERA = 'opera', EDGE = 'edge', UNKOWN_BROWSER = 'unknown',
            ECHO = 'echo', SHORTNAME = 'TBUtils', SETTINGS_NAME = 'Utils';

        //Private variables
        let modMineURL = '/subreddits/mine/moderator.json?limit=100',
            now = new Date().getTime(),

            shortLength = TBStorage.getSetting(SETTINGS_NAME, 'shortLength', 15),
            longLength = TBStorage.getSetting(SETTINGS_NAME, 'longLength', 45),

            lastgetLong = TBStorage.getCache(SETTINGS_NAME, 'lastGetLong', -1),
            lastgetShort = TBStorage.getCache(SETTINGS_NAME, 'lastGetShort', -1),
            cacheName = TBStorage.getCache(SETTINGS_NAME, 'cacheName', ''),
            seenNotes = TBStorage.getSetting(SETTINGS_NAME, 'seenNotes', []),
            lastVersion = TBStorage.getSetting(SETTINGS_NAME, 'lastVersion', 0),
            toolboxDevs = TBStorage.getSetting(SETTINGS_NAME, 'tbDevs', []),
            newLogin = (cacheName !== TBUtils.logged),
            getnewLong = (((now - lastgetLong) / (60 * 1000) > longLength) || newLogin),
            getnewShort = (((now - lastgetShort) / (60 * 1000) > shortLength) || newLogin),
            betaRelease = true, /// DO NOT FORGET TO SET FALSE BEFORE FINAL RELEASE! ///
            gettingModSubs = false,
            getModSubsCallbacks = [],
            invalidPostSites = ['subreddits you moderate', 'mod (filtered)', 'all'],

            randomQuotes = ["Dude, in like 24 months, I see you Skyping someone to watch them search someone's comments on reddit.",
                "Simple solution, don't use nightmode....",
                'Nightmode users are a buncha nerds.',
                "Oh, so that's where that code went, I thought i had lost it somehow.",
                'Are all close buttons pretty now?!?!?',
                'As a Business Analyst myself...',
                "TOOLBOX ISN'T YOUR PERSONAL TOOL!",
                'You are now an approvened submitter',
                "Translate creesch's Klingon settings to English.",
                'Cuz Uncle Jessy was hot and knew the Beach Boys',
                "Don't worry too much. There's always extra pieces.",
                'Make the check actually check.',
                "I dunno what this 'Safari' thing is.",
                'eeeeew... why is there PHP code in this room?',
                'nah there is an actual difference between stuff',
                '...have you paid money *out of your own pocket* to anyone to vet this product?',
                'first I want to make sure my thing actually does work sort of',
                "Don't let \"perfect\" get in the way of \"good.\"",
                'damnit creesch, put a spoiler tag, now the ending of toolbox is ruined for me',
                "It's not even kinda bad... It's strangely awful.",
                'Like a good neighbor, /u/andytuba is there',
                'toolbox is build on beer',
                'aww, i thought this was about real tools',
                'my poop never smelled worse than when i lived off pizza bagel bites',
                'Little dot, little dot ♪ You are not so little anymore ♫',
                "How great will it be that trouble's wiki page will also include pizza ordering instructions?",
                'Luu',
                'I go two and hope for the best.',
                'oh dammit, I forgot to include url shit',
                'I think I just released a broken release',
                'BECAUSE I AM THE LAW!!!'],

            RandomFeedbackText = ['Please hold, your call is important to us.',
                'Remember, toolbox loves you.',
                'toolbox will be back later, gone fishing.',
                "toolbox is 'doing things', don't ask.",
                'Tuning probability drive parameters.',
                'Initiating data transfer: NSA_backdoor_package. ',
                'Please post puppy pictures, they are so fluffy!',
                'RES is visiting for a sleepover,  no time right now',
                'toolbox is on strike, we demand more karma!',
                'brb... kicking Gustavobc from #toolbox',
                'Requesting a new insurance quote from /u/andytuba',
                "/u/dakta ran out for a pack of smokes... BUT HE PROMISED HE'D BE RIGHT BACK"];

        // Public variables

        TBUtils.isOldReddit = $('#header').length;

        TBUtils.isEditUserPage = location.pathname.match(/\/about\/(?:contributors|moderator|banned)\/?/);
        TBUtils.isModmail = location.pathname.match(/(\/message\/(?:moderator)\/?)|(\/r\/.*?\/about\/message\/inbox\/?)/);

        TBUtils.isModpage = location.pathname.match(/\/about\/(?:reports|modqueue|spam|unmoderated|edited)\/?/);
        TBUtils.isModLogPage = location.pathname.match(/\/about\/(?:log)\/?/);
        TBUtils.isModQueuePage = location.pathname.match(/\/about\/(?:modqueue)\/?/);
        TBUtils.isUnmoderatedPage = location.pathname.match(/\/about\/(?:unmoderated)\/?/);

        TBUtils.isSubAllCommentsPage = location.pathname.match(/\/r\/.*?\/(?:comments)\/?$/);
        TBUtils.isUserPage = location.pathname.match(/\/(?:user)\/?/);
        TBUtils.isCommentsPage = location.pathname.match(/\?*\/(?:comments)\/?/);
        TBUtils.isSubCommentsPage = location.pathname.match(/\/r\/.*?\/(?:comments)\/?/);
        TBUtils.isSubAllCommentsPage = location.pathname.match(/\/r\/.*?\/(?:comments)\/?$/);

        TBUtils.isModFakereddit = location.pathname.match(/^\/r\/mod\b/) || location.pathname.match(/^\/me\/f\/mod\b/);
        TBUtils.isMod = $('body.moderator').length;

        if(newModSubs && newModSubs.length > 0) {
            TBUtils.mySubs = [];
            TBUtils.mySubsData = [];
            $(newModSubs).each(function () {
                const sub = this.data.display_name.trim();
                if ($.inArray(sub, TBUtils.mySubs) === -1) {
                    TBUtils.mySubs.push(sub);
                }

                let isinthere = false;
                $(TBUtils.mySubsData).each(function () {
                    if (this.subreddit === sub) {
                        isinthere = true;
                    }
                });

                if (!isinthere) {
                    const subredditData = {
                        'subreddit': sub,
                        'subscribers': this.data.subscribers,
                        'over18': this.data.over18,
                        'created_utc': this.data.created_utc,
                        'subreddit_type': this.data.subreddit_type,
                        'submission_type': this.data.submission_type
                    };

                    TBUtils.mySubsData.push(subredditData);
                }
            });

            TBUtils.mySubs = saneSort(TBUtils.mySubs);
            TBUtils.mySubsData = sortBy(TBUtils.mySubsData, 'subscribers');
            // Update the cache.
            TBStorage.setCache(SETTINGS_NAME, 'moderatedSubs', TBUtils.mySubs);
            TBStorage.setCache(SETTINGS_NAME, 'moderatedSubsData', TBUtils.mySubsData);

        } else {
            TBUtils.mySubs = (getnewLong) ? [] : TBStorage.getCache(SETTINGS_NAME, 'moderatedSubs', []);
            TBUtils.mySubsData = (getnewLong) ? [] : TBStorage.getCache(SETTINGS_NAME, 'moderatedSubsData', []);
        }

        const manifest = chrome.runtime.getManifest();
        const versionRegex = /(\d\d?)\.(\d\d?)\.(\d\d).*?"(.*?)"/;
        const matchVersion = manifest.version_name.match(versionRegex);
        const shortVersion = `${matchVersion[1]}${matchVersion[2].padStart(2,'0')}${matchVersion[3].padStart(2,'0')}`;

        TBUtils.toolboxVersion = `${manifest.version}${(betaRelease) ? ' (beta)' : ''}`;
        TBUtils.shortVersion = shortVersion;
        TBUtils.releaseName = 'New Narwhal';
        TBUtils.configSchema = 1;
        TBUtils.notesSchema = 6;
        TBUtils.notesMinSchema = 4;
        TBUtils.notesDeprecatedSchema = 4;
        TBUtils.notesMaxSchema = 6; // The non-default max version (to allow phase-in schema releases)
        TBUtils.NO_WIKI_PAGE = 'NO_WIKI_PAGE';
        TBUtils.WIKI_PAGE_UNKNOWN = 'WIKI_PAGE_UNKNOWN';
        TBUtils.isNewModmail = location.host === 'mod.reddit.com';
        TBUtils.isNewMMThread = $('body').find('.ThreadViewer').length > 0;
        TBUtils.pageDetails = {};
        TBUtils.isExtension = true;
        TBUtils.RandomQuote = randomQuotes[Math.floor(Math.random() * randomQuotes.length)];
        TBUtils.RandomFeedback = RandomFeedbackText[Math.floor(Math.random() * RandomFeedbackText.length)];
        TBUtils.log = [];
        TBUtils.logModules = [];
        TBUtils.debugMode = TBStorage.getSetting(SETTINGS_NAME, 'debugMode', false);
        TBUtils.devMode = TBStorage.getSetting(SETTINGS_NAME, 'devMode', false);
        TBUtils.betaMode = TBStorage.getSetting(SETTINGS_NAME, 'betaMode', false);
        TBUtils.advancedMode = TBStorage.getSetting(SETTINGS_NAME, 'advancedMode', false);
        TBUtils.ratelimit = TBStorage.getSetting(SETTINGS_NAME, 'ratelimit', {remaining: 300, reset: 600 * 1000});
        TBUtils.firstRun = false;
        TBUtils.tbDevs = toolboxDevs;
        TBUtils.betaRelease = betaRelease;

        TBUtils.browsers = {
            CHROME: CHROME,
            FIREFOX: FIREFOX,
            OPERA: OPERA,
            EDGE: EDGE,
            UNKOWN_BROWSER: UNKOWN_BROWSER
        };

        TBUtils.browser = UNKOWN_BROWSER;

        // Get our browser.  Hints: http://jsfiddle.net/9zxvE/383/
        if (typeof (InstallTrigger) !== 'undefined' || 'MozBoxSizing' in document.body.style) {
            TBUtils.browser = FIREFOX;
        } else if (typeof (window.browser) !== 'undefined') {
            TBUtils.browser = EDGE;
        } else if (typeof (chrome) !== 'undefined') {
            TBUtils.browser = CHROME;

            if (navigator.userAgent.indexOf(' OPR/') >= 0) { // always check after Chrome
                TBUtils.browser = OPERA;
            }
        }

        // Stuff from TBStorage
        TBUtils.domain = TBStorage.domain;

        // Check our post site.  We might want to do some sort or regex fall back here, if it's needed.
        if (TBUtils.isModFakereddit || TBUtils.post_site === undefined || !TBUtils.post_site || invalidPostSites.indexOf(TBUtils.post_site) !== -1) {
            TBUtils.post_site = '';
        }

        // Do settings echo before anything else.  If it fails, exit toolbox.
        const ret = TBStorage.setSetting(SETTINGS_NAME, 'echoTest', ECHO);
        if (ret !== ECHO) {
            alert('toolbox can not save settings to localstorage\n\ntoolbox will now exit');
            return;
        }

        $('body').addClass('mod-toolbox-rd');
        // Bit hacky maybe but allows us more flexibility in specificity.
        $('body').addClass('mod-toolbox-extra');

        // Add icon font
        // Edge seems to think cross origins rules apply for locally loaded fonds.
        if (TBUtils.browser === EDGE) {
            $('head').append('<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">');
        } else {
            $('head').append(`<style>
            @font-face {
                font-family: 'Material Icons';
                font-style: normal;
                font-weight: 400;
                src: url(MaterialIcons-Regular.eot); /* For IE6-8 */
                src: local('Material Icons'),
                    local('MaterialIcons-Regular'),
                    url(${chrome.runtime.getURL('data/styles/font/MaterialIcons-Regular.woff2')}) format('woff2'),
                    url(${chrome.runtime.getURL('data/styles/font/MaterialIcons-Regular.woff')}) format('woff'),
                    url(${chrome.runtime.getURL('data/styles/font/MaterialIcons-Regular.ttf')}) format('truetype');
            }
            </style>`);
        }
        // Get cached info.
        TBUtils.noteCache = (getnewShort) ? {} : TBStorage.getCache(SETTINGS_NAME, 'noteCache', {});
        TBUtils.configCache = (getnewLong) ? {} : TBStorage.getCache(SETTINGS_NAME, 'configCache', {});
        TBUtils.rulesCache = (getnewLong) ? {} : TBStorage.getCache(SETTINGS_NAME, 'rulesCache', {});
        TBUtils.noConfig = (getnewShort) ? [] : TBStorage.getCache(SETTINGS_NAME, 'noConfig', []);
        TBUtils.noNotes = (getnewShort) ? [] : TBStorage.getCache(SETTINGS_NAME, 'noNotes', []);
        TBUtils.noRules = (getnewLong) ? [] : TBStorage.getCache(SETTINGS_NAME, 'noRules', []);

        if (TBUtils.debugMode) {
            const consoleText = `toolbox version: ${TBUtils.toolboxVersion
            }, Browser: ${TBUtils.browser
            }, Extension: ${TBUtils.isExtension
            }, Beta features: ${TBUtils.betaMode
            }\n\n"${TBUtils.RandomQuote}"\n`;

            TBUtils.log.push(consoleText);
        }

        // Update cache vars as needed.
        if (newLogin) {
            $.log('Account changed', false, SHORTNAME);
            TBStorage.setCache(SETTINGS_NAME, 'cacheName', TBUtils.logged);
        }

        if (getnewLong) {
            $.log('Long cache expired', false, SHORTNAME);
            TBStorage.setCache(SETTINGS_NAME, 'lastGetLong', now);
        }

        if (getnewShort) {
            $.log('Short cache expired', false, SHORTNAME);
            TBStorage.setCache(SETTINGS_NAME, 'lastGetShort', now);
        }

        const pushedunread = TBStorage.getSetting('Notifier', 'unreadPushed', []);
        if (pushedunread.length > 250) {
            pushedunread.splice(150, (pushedunread.length - 150));
            TBStorage.setSetting('Notifier', 'unreadPushed', pushedunread);
        }

        const pusheditems = TBStorage.getSetting('Notifier', 'modqueuePushed', []);
        if (pusheditems.length > 250) {
            pusheditems.splice(150, (pusheditems.length - 150));
            TBStorage.setSetting('Notifier', 'modqueuePushed', pusheditems);
        }

        const repliedModmail = TBStorage.getSetting('ModMail', 'replied', []);
        if (repliedModmail.length > 250) {
            pusheditems.splice(150, (repliedModmail.length - 150));
            TBStorage.setSetting('ModMail', 'replied', repliedModmail);
        }

        if (seenNotes.length > 250) {
            $.log('clearing seen notes', false, SHORTNAME);
            seenNotes.splice(150, (seenNotes.length - 150));
            TBStorage.setSetting(SETTINGS_NAME, 'seenNotes', seenNotes);
        }

        if (!toolboxDevs || toolboxDevs.length < 1) {
            getToolboxDevs();
        }

        // First run changes.
        if (TBUtils.shortVersion > lastVersion) {

        // These need to happen for every version change
            TBUtils.firstRun = true; // for use by other modules.
            TBStorage.setSetting(SETTINGS_NAME, 'lastVersion', TBUtils.shortVersion); //set last version to this version.
            getToolboxDevs(); //always repopulate tb devs for each version change

            //** This should be a per-release section of stuff we want to change in each update.  Like setting/converting data/etc.  It should always be removed before the next release. **//

            // Start: version changes.
            /* TBUtils.[get/set]Setting IS NOT DEFINDED YET!!!  Use TBStorage.[get/set]settings */

            // 3.7 version changes

            // End: version changes.

            // This is a super extra check to make sure the wiki page for settings export really is private.
            const settingSubEnabled = TBStorage.getSetting('Utils', 'settingSub', '');
            if (settingSubEnabled) {
                setWikiPrivate('tbsettings', settingSubEnabled, false);
            }

            // These two should be left for every new release. If there is a new beta feature people want, it should be opt-in, not left to old settings.
            //TBStorage.setSetting('Notifier', 'lastSeenModmail', now); // don't spam 100 new mod mails on first install.
            //TBStorage.setSetting('Notifier', 'modmailCount', 0);
            TBStorage.setSetting(SETTINGS_NAME, 'debugMode', false);
            TBStorage.setSetting(SETTINGS_NAME, 'betaMode', false);
            TBUtils.debugMode = false;
            TBUtils.betaMode = false;
        }

        TBUtils.config = {
            ver: TBUtils.configSchema,
            domainTags: '',
            removalReasons: '',
            modMacros: '',
            usernoteColors: '',
            banMacros: ''
        };

        TBUtils.events = {
            TB_ABOUT_PAGE: 'TB_ABOUT_PAGE',
            TB_APPROVE_THING: 'TB_APPROVE_THING',
            TB_FLY_SNOO: 'TB_FLY_SNOO',
            TB_KILL_SNOO: 'TB_KILL_SNOO',
            TB_SAMPLE_SOUND: 'TB_SAMPLE_SOUND',
            TB_SYNTAX_SETTINGS: 'TB_SYNTAX_SETTINGS',
            TB_UPDATE_COUNTERS: 'TB_UPDATE_COUNTERS'
        };

        TBUtils.defaultUsernoteTypes = [
            {key: 'gooduser', color: 'green', text: 'Good Contributor'},
            {key: 'spamwatch', color: 'fuchsia', text: 'Spam Watch'},
            {key: 'spamwarn', color: 'purple', text: 'Spam Warning'},
            {key: 'abusewarn', color: 'orange', text: 'Abuse Warning'},
            {key: 'ban', color: 'red', text: 'Ban'},
            {key: 'permban', color: 'darkred', text: 'Permanent Ban'},
            {key: 'botban', color: 'black', text: 'Bot Ban'}
        ];

        // Methods and stuff

        if (!String.prototype.format) {
            String.prototype.format = function() {
                const args = arguments;
                return this.replace(/{(\d+)}/g, function(match, number) {
                    return typeof args[number] !== 'undefined' ? args[number] : match;
                });
            };
        }

        /**
         * @typedef {Object} debugObject
         * @memberof TBUtils
         * @property {string} toolboxVersion The toolbox version
         * @property {string} browser Browser used (Firefox, Chrome, etc)
         * @property {string} browserVersion The version of the browser
         * @property {string} platformInformation Other platform information
         * @property {boolean} betaMode toolbox beta mode enabled
         * @property {boolean} debugMode  toolbox debugMode enabled
         * @property {boolean} compactMode toolbox compactmode enabled
         * @property {boolean} advancedSettings toolbox advanced settings enabled
         * @property {boolean} cookiesEnabled Browser cookies enabled
         */

        /**
         * Puts important debug information in a object so we can easily include it in /r/toolbox posts and comments when people need support.
         * @function debugInformation
         * @memberof TBUtils
         * @returns {TBUtils.debugObject} Object with debug information
         */
        TBUtils.debugInformation = function debugInformation() {
        // Using console log so we are more likely to get this information if toolbox is failing.
            console.log('debug information for browser');
            let debugObject = {
                toolboxVersion : TBUtils.toolboxVersion,
                browser: '',
                browserVersion: '',
                platformInformation: '',
                betaMode: TBUtils.betaMode,
                debugMode: TBUtils.debugMode,
                compactMode: TBStorage.getSetting('Modbar', 'compactHide', false),
                advancedSettings: TBUtils.advancedMode,
                cookiesEnabled: navigator.cookieEnabled
            };

            const browserUserAgent = navigator.userAgent;
            let browserMatchedInfo = [];
            switch (TBUtils.browser) {
            case CHROME: {
                // Let's first make sure we are actually dealing with chrome and not some other chrome fork that also supports extension.
                // This way we can also cut some support requests short.
                const vivaldiRegex = new RegExp(/\((.*?)\).*Vivaldi\/([0-9.]*?)$/);
                const yandexRegex = new RegExp(/\((.*?)\).*YaBrowser\/([0-9.]*).*$/);
                const chromeRegex = new RegExp(/\((.*?)\).*Chrome\/([0-9.]*).*$/);
                if (navigator.userAgent.indexOf(' Vivaldi/') >= 0 && vivaldiRegex.test(browserUserAgent)) { // Vivaldi
                    browserMatchedInfo = browserUserAgent.match(vivaldiRegex);
                    debugObject.browser = 'Vivaldi';
                    debugObject.browserVersion = browserMatchedInfo[2];
                    debugObject.platformInformation = browserMatchedInfo[1];

                } else if (navigator.userAgent.indexOf(' YaBrowser/') >= 0 && yandexRegex.test(browserUserAgent)) { // Yandex
                    browserMatchedInfo = browserUserAgent.match(yandexRegex);
                    debugObject.browser = 'Yandex';
                    debugObject.browserVersion = browserMatchedInfo[2];
                    debugObject.platformInformation = browserMatchedInfo[1];

                } else if (chromeRegex.test(browserUserAgent)) {
                    browserMatchedInfo = browserUserAgent.match(chromeRegex);
                    debugObject.browser = 'Chrome';
                    debugObject.browserVersion = browserMatchedInfo[2];
                    debugObject.platformInformation = browserMatchedInfo[1];
                } else {
                    debugObject.browser = 'Chrome derivative';
                    debugObject.browserVersion = 'Unknown';
                    debugObject.platformInformation = browserUserAgent;
                }
                break;
            }
            case FIREFOX: {
                const firefoxRegex = new RegExp(/\((.*?)\).*Firefox\/([0-9.]*?)$/);
                const firefoxDerivativeRegex = new RegExp(/\((.*?)\).*(Firefox\/[0-9.].*?)$/);
                if(firefoxRegex.test(browserUserAgent)) {
                    browserMatchedInfo = browserUserAgent.match(firefoxRegex);
                    debugObject.browser = 'Firefox';
                    debugObject.browserVersion = browserMatchedInfo[2];
                    debugObject.platformInformation = browserMatchedInfo[1];
                } else if (firefoxDerivativeRegex.test(browserUserAgent)) {
                    browserMatchedInfo = browserUserAgent.match(firefoxDerivativeRegex);
                    debugObject.browser = 'Firefox derivative';
                    debugObject.browserVersion = browserMatchedInfo[2];
                    debugObject.platformInformation = browserMatchedInfo[1];
                } else {
                    debugObject.browser = 'Firefox derivative';
                    debugObject.browserVersion = 'Unknown';
                    debugObject.platformInformation = browserUserAgent;
                }
                break;
            }
            case OPERA: {
                browserMatchedInfo = browserUserAgent.match(/\((.*?)\).*OPR\/([0-9.]*?)$/);
                debugObject.browser = 'Opera';
                debugObject.browserVersion = browserMatchedInfo[2];
                debugObject.platformInformation = browserMatchedInfo[1];
                break;
            }
            case EDGE: {
                browserMatchedInfo = browserUserAgent.match(/\((.*?)\).*Edge\/([0-9.]*?)$/);
                debugObject.browser = 'Edge';
                debugObject.browserVersion = browserMatchedInfo[2];
                debugObject.platformInformation = browserMatchedInfo[1];
                break;
            }
            case UNKOWN_BROWSER: {
                debugObject.browser = 'Unknown';
                debugObject.browserVersion = 'Unknown';
                debugObject.platformInformation = browserUserAgent;
                break;
            }
            default: {
            // This should really never happen, but just in case I left it in.
                debugObject.browser = 'Error in browser detection';
                debugObject.browserVersion = 'Unknown';
                debugObject.platformInformation = browserUserAgent;
            }
            }

            console.log(debugObject);
            return debugObject;
        };

        /**
         * Fetches the toolbox dev from /r/toolbox or falls back to a predefined list.
         * @function getToolboxDevs
         * @memberof TBUtils
         * @returns {array} List of toolbox devs
         */
        TBUtils.getToolboxDevs = function getToolboxDevs() {
            getToolboxDevs();
        };

        TBUtils.sendEvent = function (tbuEvent) {
            $.log(`Sending event: ${tbuEvent}`, false, SHORTNAME);
            window.dispatchEvent( new CustomEvent(tbuEvent) );
        };

        TBUtils.catchEvent = function (tbuEvent, callback) {
            if (!callback) return;

            window.addEventListener(tbuEvent, callback);
        };

        /**
         * Moves an item in an array from one index to another
         * https://github.com/brownieboy/array.prototype.move/blob/master/src/array-prototype-move.js
         * @function moveArrayItem
         * @memberof TBUtils
         * @param {array} array input array
         * @param {integer} old_index
         * @param {integer} new_index
         * @returns {array} New array with moved items
         */
        TBUtils.moveArrayItem = function moveArrayItem(array, old_index, new_index) {
            if ( array.length === 0 ) {
                return array;
            }
            while (old_index < 0) {
                old_index += array.length;
            }
            while (new_index < 0) {
                new_index += array.length;
            }
            if (new_index >= array.length) {
                let k = new_index - array.length;
                while ((k--) + 1) {
                    array.push(undefined);
                }
            }
            array.splice(new_index, 0, array.splice(old_index, 1)[0]);
            return array;
        };

        /**
         * Escape html entities
         * @function escapeHTML
         * @memberof TBUtils
         * @param {string} html input html
         * @returns {string} HTML string with escaped entities
         */
        TBUtils.escapeHTML = function(html)
        {
            const entityMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '/': '&#x2F;'
            };

            return String(html).replace(/[&<>"'/]/g, function (s) {
                return entityMap[s];
            });
        };

        /**
         * Unescape html entities
         * @function unescapeHTML
         * @memberof TBUtils
         * @param {string} html input html
         * @returns {string} HTML string with unescaped entities
         */
        TBUtils.unescapeHTML = function(html)
        {
            const entityMap = {
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&quot;': '"',
                '&#39;': "'",
                '&#x2F;' : '/'
            };

            return String(html).replace(/[&<>"'/]/g, function (s) {
                return entityMap[s];
            });
        };

        /**
         * Give the nummeric value in milliseconds  of the current date and time.
         * @function getTime
         * @memberof TBUtils
         * @returns {integer} time value in milliseconds
         */
        TBUtils.getTime = function() {
            return new Date().getTime();
        };

        /**
         * Give a random number
         * @function getRandomNumber
         * @memberof TBUtils
         * @param {integer} maxInt Max integer
         * @returns {integer} random number
         */
        TBUtils.getRandomNumber = function(maxInt) {
            return Math.floor((Math.random() * maxInt) + 1);
        };

        /**
         * Convert minutes to milliseconds
         * @function minutesToMilliseconds
         * @memberof TBUtils
         * @param {integer} mins Minutes
         * @returns {integer} Milliseconds
         */
        TBUtils.minutesToMilliseconds = function (mins) {
            let oneMin = 60000,
                milliseconds = mins * 60 * 1000;

            // Never return less than one min.
            if (milliseconds < oneMin) {
                milliseconds = oneMin;
            }

            return milliseconds;
        };

        /**
         * Convert days to milliseconds
         * @function daysToMilliseconds
         * @memberof TBUtils
         * @param {integer} days days
         * @returns {integer} Milliseconds
         */
        TBUtils.daysToMilliseconds = function (days) {
            return days * 86400000;
        };

        /**
         * Convert milliseconds to days
         * @function millisecondsToDays
         * @memberof TBUtils
         * @param {integer} milliseconds milliseconds
         * @returns {integer} Days
         */
        TBUtils.millisecondsToDays = function (milliseconds) {
            return milliseconds / 86400000;
        };

        /**
         * convert unix epoch timestamps to ISO format
         * @function timeConverterISO
         * @memberof TBUtils
         * @param {integer} UNIX_timestamp Unix timestamp
         * @returns {string} ISO formatted time
         */
        TBUtils.timeConverterISO = function (UNIX_timestamp) {
            const a = new Date(UNIX_timestamp * 1000);
            const year = a.getFullYear();
            const month = (`0${a.getUTCMonth() + 1}`).slice(-2);
            const date = (`0${a.getUTCDate()}`).slice(-2);
            const hour = (`0${a.getUTCHours()}`).slice(-2);
            const min = (`0${a.getUTCMinutes()}`).slice(-2);
            const sec = (`0${a.getUTCSeconds()}`).slice(-2);
            return `${year}-${month}-${date}T${hour}:${min}:${sec}Z`;
        };

        /**
         * Returns the difference between days in nice format like "1 year"
         * @function niceDateDiff
         * @memberof TBUtils
         * @param {Date} origdate
         * @param {Date} newdate
         * @returns {string} Formatted date difference
         */
        TBUtils.niceDateDiff = function(origdate, newdate) {
            // Enter the month, day, and year below you want to use as
            // the starting point for the date calculation
            if (!newdate) {
                newdate = new Date();
            }

            const amonth = origdate.getUTCMonth() + 1;
            const aday = origdate.getUTCDate();
            const ayear = origdate.getUTCFullYear();

            const tyear = newdate.getUTCFullYear();
            const tmonth = newdate.getUTCMonth() + 1;
            const tday = newdate.getUTCDate();

            let y = 1;
            let mm = 1;
            let d = 1;
            let a2 = 0;
            let a1 = 0;
            let f = 28;

            if (((tyear % 4 === 0) && (tyear % 100 !== 0)) || (tyear % 400 === 0)) {
                f = 29;
            }

            const m = [31, f, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            let dyear = tyear - ayear;

            let dmonth = tmonth - amonth;
            if (dmonth < 0 && dyear > 0) {
                dmonth = dmonth + 12;
                dyear--;
            }

            let dday = tday - aday;
            if (dday < 0) {
                if (dmonth > 0) {
                    let ma = amonth + tmonth;

                    if (ma >= 12) {
                        ma = ma - 12;
                    }
                    if (ma < 0) {
                        ma = ma + 12;
                    }
                    dday = dday + m[ma];
                    dmonth--;
                    if (dmonth < 0) {
                        dyear--;
                        dmonth = dmonth + 12;
                    }
                } else {
                    dday = 0;
                }
            }

            let returnString = '';

            if (dyear === 0) {
                y = 0;
            }
            if (dmonth === 0) {
                mm = 0;
            }
            if (dday === 0) {
                d = 0;
            }
            if ((y === 1) && (mm === 1)) {
                a1 = 1;
            }
            if ((y === 1) && (d === 1)) {
                a1 = 1;
            }
            if ((mm === 1) && (d === 1)) {
                a2 = 1;
            }
            if (y === 1) {
                if (dyear === 1) {
                    returnString += `${dyear} year`;
                } else {
                    returnString += `${dyear} years`;
                }
            }
            if ((a1 === 1) && (a2 === 0)) {
                returnString += ' and ';
            }
            if ((a1 === 1) && (a2 === 1)) {
                returnString += ', ';
            }
            if (mm === 1) {
                if (dmonth === 1) {
                    returnString += `${dmonth} month`;
                } else {
                    returnString += `${dmonth} months`;
                }
            }
            if (a2 === 1) {
                returnString += ' and ';
            }
            if (d === 1) {
                if (dday === 1) {
                    returnString += `${dday} day`;
                } else {
                    returnString += `${dday} days`;
                }
            }
            if (returnString === '') {
                returnString = '0 days';
            }
            return returnString;
        };

        /**
         * convert unix epoch timestamps to readable format dd-mm-yyyy hh:mm:ss UTC
         * @function timeConverterRead
         * @memberof TBUtils
         * @param {integer} UNIX_timestamp
         * @returns {string} Formatted date in dd-mm-yyyy hh:mm:ss UTC
         */
        TBUtils.timeConverterRead = function (UNIX_timestamp) {
            const a = new Date(UNIX_timestamp * 1000);
            const year = a.getFullYear();
            const month = (`0${a.getUTCMonth() + 1}`).slice(-2);
            const date = (`0${a.getUTCDate()}`).slice(-2);
            const hour = (`0${a.getUTCHours()}`).slice(-2);
            const min = (`0${a.getUTCMinutes()}`).slice(-2);
            const sec = (`0${a.getUTCSeconds()}`).slice(-2);
            return `${date}-${month}-${year} ${hour}:${min}:${sec} UTC`;
        };

        /**
         * convert titles to a format usable in urls
         * from r2.lib.utils import title_to_url
         * @function title_to_url
         * @memberof TBUtils
         * @param {string} title
         * @returns {string} Formatted title
         */
        TBUtils.title_to_url = function (title) {
            const max_length = 50;

            title = title.replace(/\s+/g, '_'); //remove whitespace
            title = title.replace(/\W+/g, ''); //remove non-printables
            title = title.replace(/_+/g, '_'); //remove double underscores
            title = title.replace(/^_+|_+$/g, ''); //remove trailing underscores
            title = title.toLowerCase(); //lowercase the title

            if (title.length > max_length) {
                title = title.substr(0, max_length);
                title = title.replace(/_[^_]*$/g, '');
            }

            return title || '_';
        };

        // Easy way to use templates. Usage example:
        //    TBUtils.template('/r/{{subreddit}}/comments/{{link_id}}/{{title}}/', {
        //                'subreddit': 'toolbox',
        //                'title':  title_to_url('this is a title we pulled from a post),
        //                'link_id': '2kwx2o'
        //            });
        TBUtils.template = function (tpl, variables) {
            return tpl.replace(/{{([^}]+)}}/g, function (match, variable) {
                return variables[variable];
            });
        };

        /**
         * Opens the toolbox "nag" alert everyone loves so much.
         * USE SPARINGLY
         * @function alert
         * @memberof TBUtils
         * @param {string} message
         * @param {callback} callback callback function
         * @param {boolean} showClose If true the alert can be dismissed by a clost button otherwise it needs to be clicked.
         * @returns {callback} callback with true or false in parameter which will be called when the alert is closed.
         */
        TBUtils.alert = function (message, callback, showClose) {
            let $noteDiv = $(`<div id="tb-notification-alert"><span>${message}</span></div>`);
            if (showClose) {
                $noteDiv.append(`<i class="note-close tb-icons" title="Close">close</i>`);
            }
            $noteDiv.appendTo('body');

            $noteDiv.click(function (e) {
                $noteDiv.remove();
                if (e.target.className === 'note-close') {
                    callback(false);
                    return;
                }
                callback(true);
            });
        };

        TBUtils.showNote = function (note) {
            if (!note.id || !note.text) return;

            function show() {
                if ($.inArray(note.id, seenNotes) === -1) {
                //TBStorage.setSetting(SETTINGS_NAME, 'noteLastShown', now);

                    TBUtils.alert(note.text, function (resp) {
                        seenNotes.push(note.id);
                        TBStorage.setSetting(SETTINGS_NAME, 'seenNotes', seenNotes);
                        if (note.link && note.link.match(/^(https?:|\/)/i) && resp) window.open(note.link);
                    }, false);
                }
            }

            //platform check.
            switch (note.platform) {
            case 'firefox':
                if (TBUtils.browser === FIREFOX && TBUtils.isExtension) show();
                break;
            case 'chrome':
                if (TBUtils.browser === CHROME && TBUtils.isExtension) show();
                break;
            case 'opera':
                if (TBUtils.browser === OPERA && TBUtils.isExtension) show();
                break;
            case 'edge':
                if (TBUtils.browser === EDGE && TBUtils.isExtension) show();
                break;
            case 'script':
                if (!TBUtils.isExtension) show();
                break;
            case 'all':
                show();
                break;
            default:
                show();
            }
        };

        /**
         * Shows a notification, uses native browser notifications if the user allows it or falls back on html notifications.
         * @function notification
         * @memberof TBUtils
         * @param {string} title Notification title
         * @param {string} body Body text
         * @param {string} url Url to be opend when clicking the notification
         * @param {string} markreadid When given will call the reddit api to mark the thing as read.
         */
        TBUtils.notification = function (title, body, url, markreadid = false) {
            const timeout = 10000;

            const toolboxnotificationenabled = true;

            // check if notifications are enabled. When they are not we simply abort the function.
            if (toolboxnotificationenabled === false) {
            //console.log('notifications disabled, stopping function');
                return;
            }

            chrome.runtime.sendMessage({
                action: 'tb-notification',
                details: {
                    title: title,
                    body: body,
                    baseDomain: TBUtils.tempBaseDomain,
                    url: url,
                    modHash: TBUtils.modhash,
                    markreadid: markreadid ? markreadid : false
                }
            }, function(response) {
                if(response.permission === `denied`) {
                    // They have the option enabled, but won't grant permissions, so fall back.
                    body = body.replace(/(?:\r\n|\r|\n)/g, '<br />');
                    body = body.substring(0, 600);
                    $.sticky(`<p>${body}</p>`, title, url, {'autoclose': timeout, 'markreadid': markreadid});
                }
            });
        };

        /**
         * Converts a given amount of days in a "humanized version" of weeks, months and years.
         * @function humaniseDays
         * @memberof TBUtils
         * @param {integer} days
         * @returns {string} x year x months x weeks x day
         */
        TBUtils.humaniseDays = function (days) {
            let str = '';
            let values = {
                ' year': 365,
                ' month': 30,
                ' week': 7,
                ' day': 1
            };

            for (let x in values) {
                const amount = Math.floor(days / values[x]);

                if (amount >= 1) {
                    str += `${amount + x + (amount > 1 ? 's' : '')} `;
                    days -= amount * values[x];
                }
            }
            return str.slice(0, -1);
        };

        /** @todo properly describe what this does */
        TBUtils.stringFormat = function(format) {
            const args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        };

        /**
         * Sorts an array of objects by property value of specific properties.
         * @function sortBy
         * @memberof TBUtils
         * @param {array} arr input array
         * @param {string} prop property name
         */
        function sortBy(arr, prop) {
            return arr.sort(function (a, b) {
                if (a[prop] < b[prop]) return 1;
                if (a[prop] > b[prop]) return -1;
                return 0;
            });
        }
        TBUtils.sortBy = sortBy;

        /**
         * Do a Header only request
         * @function getHead
         * @memberof TBUtils
         * @param {string} url input array
         * @param {callback} doneCallback
         * @returns {callback}
         */
        TBUtils.getHead = function (url, doneCallback) {
            $.ajax({
                type: 'HEAD',
                url: TBUtils.baseDomain + url
            })
                .done(function (data, status, jqxhr) {
                // data isn't needed; just the tip
                    doneCallback(status, jqxhr);
                });
        };

        /**
         * Because normal .sort() is case sensitive.
         * @function saneSort
         * @memberof TBUtils
         * @param {array} arr input array
         */
        function saneSort(arr) {
            return arr.sort(function (a, b) {
                if (a.toLowerCase() < b.toLowerCase()) return -1;
                if (a.toLowerCase() > b.toLowerCase()) return 1;
                return 0;
            });
        }
        TBUtils.saneSort = saneSort;

        /**
         * Because normal .sort() is case sensitive and we also want to sort ascending from time to time.
         * @function saneSortAs
         * @memberof TBUtils
         * @param {array} arr input array
         */
        TBUtils.saneSortAs = function saneSortAs (arr) {
            return arr.sort(function (a, b) {
                if (a.toLowerCase() > b.toLowerCase()) return -1;
                if (a.toLowerCase() < b.toLowerCase()) return 1;
                return 0;
            });
        };

        /**
         * Replace all instances of a certaing thing for another thing.
         * @function replaceAll
         * @memberof TBUtils
         * @param {string} find what to find
         * @param {string} replace what to replace
         * @param {string} str where to do it all with
         * @returns {string} shiny new string with replaced stuff
         */
        TBUtils.replaceAll = function (find, replace, str) {
            find = find.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
            return str.replace(new RegExp(find, 'g'), replace);
        };

        /**
         * Will compare the input color to a list of known color names and return the HEX value
         * @function colorNameToHex
         * @memberof TBUtils
         * @param {string} color input color
         * @returns {string} if a match is found the HEX color, otherwise the input string.
         */
        TBUtils.colorNameToHex = function(color) {
            const colorUPPERCASE = color.toUpperCase();
            let returnValue;

            const htmlColors = {
                'ALICEBLUE' : '#F0F8FF',
                'ANTIQUEWHITE' : '#FAEBD7',
                'AQUA' : '#00FFFF',
                'AQUAMARINE' : '#7FFFD4',
                'AZURE' : '#F0FFFF',
                'BEIGE' : '#F5F5DC',
                'BISQUE' : '#FFE4C4',
                'BLACK' : '#000000',
                'BLANCHEDALMOND' : '#FFEBCD',
                'BLUE' : '#0000FF',
                'BLUEVIOLET' : '#8A2BE2',
                'BROWN' : '#A52A2A',
                'BURLYWOOD' : '#DEB887',
                'CADETBLUE' : '#5F9EA0',
                'CHARTREUSE' : '#7FFF00',
                'CHOCOLATE' : '#D2691E',
                'CORAL' : '#FF7F50',
                'CORNFLOWERBLUE' : '#6495ED',
                'CORNSILK' : '#FFF8DC',
                'CRIMSON' : '#DC143C',
                'CYAN' : '#00FFFF',
                'DARKBLUE' : '#00008B',
                'DARKCYAN' : '#008B8B',
                'DARKGOLDENROD' : '#B8860B',
                'DARKGRAY' : '#A9A9A9',
                'DARKGREY' : '#A9A9A9',
                'DARKGREEN' : '#006400',
                'DARKKHAKI' : '#BDB76B',
                'DARKMAGENTA' : '#8B008B',
                'DARKOLIVEGREEN' : '#556B2F',
                'DARKORANGE' : '#FF8C00',
                'DARKORCHID' : '#9932CC',
                'DARKRED' : '#8B0000',
                'DARKSALMON' : '#E9967A',
                'DARKSEAGREEN' : '#8FBC8F',
                'DARKSLATEBLUE' : '#483D8B',
                'DARKSLATEGRAY' : '#2F4F4F',
                'DARKSLATEGREY' : '#2F4F4F',
                'DARKTURQUOISE' : '#00CED1',
                'DARKVIOLET' : '#9400D3',
                'DEEPPINK' : '#FF1493',
                'DEEPSKYBLUE' : '#00BFFF',
                'DIMGRAY' : '#696969',
                'DIMGREY' : '#696969',
                'DODGERBLUE' : '#1E90FF',
                'FIREBRICK' : '#B22222',
                'FLORALWHITE' : '#FFFAF0',
                'FORESTGREEN' : '#228B22',
                'FUCHSIA' : '#FF00FF',
                'GAINSBORO' : '#DCDCDC',
                'GHOSTWHITE' : '#F8F8FF',
                'GOLD' : '#FFD700',
                'GOLDENROD' : '#DAA520',
                'GRAY' : '#808080',
                'GREY' : '#808080',
                'GREEN' : '#008000',
                'GREENYELLOW' : '#ADFF2F',
                'HONEYDEW' : '#F0FFF0',
                'HOTPINK' : '#FF69B4',
                'INDIANRED ' : '#CD5C5C',
                'INDIGO ' : '#4B0082',
                'IVORY' : '#FFFFF0',
                'KHAKI' : '#F0E68C',
                'LAVENDER' : '#E6E6FA',
                'LAVENDERBLUSH' : '#FFF0F5',
                'LAWNGREEN' : '#7CFC00',
                'LEMONCHIFFON' : '#FFFACD',
                'LIGHTBLUE' : '#ADD8E6',
                'LIGHTCORAL' : '#F08080',
                'LIGHTCYAN' : '#E0FFFF',
                'LIGHTGOLDENRODYELLOW' : '#FAFAD2',
                'LIGHTGRAY' : '#D3D3D3',
                'LIGHTGREY' : '#D3D3D3',
                'LIGHTGREEN' : '#90EE90',
                'LIGHTPINK' : '#FFB6C1',
                'LIGHTSALMON' : '#FFA07A',
                'LIGHTSEAGREEN' : '#20B2AA',
                'LIGHTSKYBLUE' : '#87CEFA',
                'LIGHTSLATEGRAY' : '#778899',
                'LIGHTSLATEGREY' : '#778899',
                'LIGHTSTEELBLUE' : '#B0C4DE',
                'LIGHTYELLOW' : '#FFFFE0',
                'LIME' : '#00FF00',
                'LIMEGREEN' : '#32CD32',
                'LINEN' : '#FAF0E6',
                'MAGENTA' : '#FF00FF',
                'MAROON' : '#800000',
                'MEDIUMAQUAMARINE' : '#66CDAA',
                'MEDIUMBLUE' : '#0000CD',
                'MEDIUMORCHID' : '#BA55D3',
                'MEDIUMPURPLE' : '#9370DB',
                'MEDIUMSEAGREEN' : '#3CB371',
                'MEDIUMSLATEBLUE' : '#7B68EE',
                'MEDIUMSPRINGGREEN' : '#00FA9A',
                'MEDIUMTURQUOISE' : '#48D1CC',
                'MEDIUMVIOLETRED' : '#C71585',
                'MIDNIGHTBLUE' : '#191970',
                'MINTCREAM' : '#F5FFFA',
                'MISTYROSE' : '#FFE4E1',
                'MOCCASIN' : '#FFE4B5',
                'NAVAJOWHITE' : '#FFDEAD',
                'NAVY' : '#000080',
                'OLDLACE' : '#FDF5E6',
                'OLIVE' : '#808000',
                'OLIVEDRAB' : '#6B8E23',
                'ORANGE' : '#FFA500',
                'ORANGERED' : '#FF4500',
                'ORCHID' : '#DA70D6',
                'PALEGOLDENROD' : '#EEE8AA',
                'PALEGREEN' : '#98FB98',
                'PALETURQUOISE' : '#AFEEEE',
                'PALEVIOLETRED' : '#DB7093',
                'PAPAYAWHIP' : '#FFEFD5',
                'PEACHPUFF' : '#FFDAB9',
                'PERU' : '#CD853F',
                'PINK' : '#FFC0CB',
                'PLUM' : '#DDA0DD',
                'POWDERBLUE' : '#B0E0E6',
                'PURPLE' : '#800080',
                'REBECCAPURPLE' : '#663399',
                'RED' : '#FF0000',
                'ROSYBROWN' : '#BC8F8F',
                'ROYALBLUE' : '#4169E1',
                'SADDLEBROWN' : '#8B4513',
                'SALMON' : '#FA8072',
                'SANDYBROWN' : '#F4A460',
                'SEAGREEN' : '#2E8B57',
                'SEASHELL' : '#FFF5EE',
                'SIENNA' : '#A0522D',
                'SILVER' : '#C0C0C0',
                'SKYBLUE' : '#87CEEB',
                'SLATEBLUE' : '#6A5ACD',
                'SLATEGRAY' : '#708090',
                'SLATEGREY' : '#708090',
                'SNOW' : '#FFFAFA',
                'SPRINGGREEN' : '#00FF7F',
                'STEELBLUE' : '#4682B4',
                'TAN' : '#D2B48C',
                'TEAL' : '#008080',
                'THISTLE' : '#D8BFD8',
                'TOMATO' : '#FF6347',
                'TURQUOISE' : '#40E0D0',
                'VIOLET' : '#EE82EE',
                'WHEAT' : '#F5DEB3',
                'WHITE' : '#FFFFFF',
                'WHITESMOKE' : '#F5F5F5',
                'YELLOW' : '#FFFF00',
                'YELLOWGREEN' : '#9ACD32'
            };

            if(htmlColors.hasOwnProperty(colorUPPERCASE)) {
                returnValue = htmlColors[colorUPPERCASE];
            } else {
                returnValue = color;
            }
            return returnValue;
        };

        /**
         * strips the last directory part of an url. Example:  /this/is/url/with/part/ becomes /this/is/url/with/
         * @function removeLastDirectoryPartOf
         * @memberof TBUtils
         * @param {string} url reddit API comment object.
         * @returns {string} url without the last directory part
         */
        TBUtils.removeLastDirectoryPartOf = function (url) {
            const urlNoSlash = url.replace(/\/$/, '');
            let array = urlNoSlash.split('/');
            array.pop();
            const returnValue = `${array.join('/')}/`;
            return returnValue;
        };

        /**
         * Will tell if a number is odd
         * @function isOdd
         * @memberof TBUtils
         * @param {integer} num reddit API comment object.
         * @returns {boolean} true if number is odd false if even.
         */

        TBUtils.isOdd = function (num) {
            return num % 2;
        };

        /**
         * Because there are a ton of ways how subreddits are written down and sometimes we just want the name.
         * @function cleanSubredditName
         * @memberof TBUtils
         * @param {string} dirtySub dirty dirty sub.
         * @returns {string} shiny sub!
         */
        TBUtils.cleanSubredditName = function (dirtySub) {
            dirtySub = dirtySub.replace('/r/', '').replace('r/', '').replace('/', '').replace('−', '').replace('+', '').trim();
            return dirtySub;
        };

        TBUtils.getModSubs = function (callback) {
            $.log('getting mod subs', false, SHORTNAME);
            // If it has been more than ten minutes, refresh mod cache.
            if (TBUtils.mySubs.length < 1 || TBUtils.mySubsData.length < 1) {
            // time to refresh
                if (gettingModSubs) {
                // we're already fetching a new list, so enqueue the callback
                    $.log('Enqueueing getModSubs callback', false, SHORTNAME);
                    getModSubsCallbacks.push(callback);
                } else {
                // start the process
                    $.log('getting new subs.', false, SHORTNAME);

                    gettingModSubs = true;
                    TBUtils.mySubs = []; // reset
                    TBUtils.mySubsData = [];
                    getSubs(modMineURL);
                }
            } else {
            // run callback on cached sublist
                TBUtils.mySubs = TBUtils.saneSort(TBUtils.mySubs);
                TBUtils.mySubsData = TBUtils.sortBy(TBUtils.mySubsData, 'subscribers');
                // Go!
                callback();
            }

            function getSubs(URL) {
                $.getJSON(TBUtils.baseDomain + URL, function (json) {
                    getSubsResult(json.data.children, json.data.after);
                });
            }

            // Callback because reddits/mod/mine is paginated.
            function getSubsResult(subs, after) {
                $(subs).each(function () {
                    const sub = this.data.display_name.trim();
                    if ($.inArray(sub, TBUtils.mySubs) === -1) {
                        TBUtils.mySubs.push(sub);
                    }

                    let isinthere = false;
                    $(TBUtils.mySubsData).each(function () {
                        if (this.subreddit === sub) {
                            isinthere = true;
                        }
                    });

                    if (!isinthere) {
                        const subredditData = {
                            'subreddit': sub,
                            'subscribers': this.data.subscribers,
                            'over18': this.data.over18,
                            'created_utc': this.data.created_utc,
                            'subreddit_type': this.data.subreddit_type,
                            'submission_type': this.data.submission_type
                        };

                        TBUtils.mySubsData.push(subredditData);
                    }
                });

                if (after) {
                    const URL = `${modMineURL}&after=${after}`;
                    getSubs(URL);
                } else {
                    TBUtils.mySubs = TBUtils.saneSort(TBUtils.mySubs);
                    TBUtils.mySubsData = TBUtils.sortBy(TBUtils.mySubsData, 'subscribers');
                    // Update the cache.
                    TBStorage.setCache(SETTINGS_NAME, 'moderatedSubs', TBUtils.mySubs);
                    TBStorage.setCache(SETTINGS_NAME, 'moderatedSubsData', TBUtils.mySubsData);

                    callback();
                    // no idea what the following shit is.
                    // Go!
                    while (getModSubsCallbacks.length > 0) {
                    // call them in the order they were added
                        $.log(`calling callback ${getModSubsCallbacks[0].name}`, false, SHORTNAME);
                        getModSubsCallbacks[0]();
                        getModSubsCallbacks.splice(0, 1); // pop first element
                    }
                    // done
                    gettingModSubs = false;
                }
            }
        };

        TBUtils.modSubCheck = function(callback) {
            TBUtils.getModSubs(function () {
                const subCount = TBUtils.mySubsData.length;
                let subscriberCount = 0;
                TBUtils.mySubsData.forEach(function(subreddit) {
                    subscriberCount += subreddit.subscribers;
                });
                subscriberCount -= subCount;
                if (subscriberCount > 25) {
                    return callback(true);
                } else {
                    return callback(false);
                }

            });
        };

        TBUtils.modsSub = function (subreddit) {
            return $.inArray(subreddit, TBUtils.mySubs) > -1;
        };

        TBUtils.getHashParameter = function(ParameterKey)
        {
            let hash = window.location.hash.substring(1);
            let params = hash.split('&');
            for (let i = 0; i < params.length; i++)
            {
                let keyval = params[i].split('='),
                    key = keyval[0].replace('?','');
                if (key === ParameterKey)
                {
                    return keyval[1];
                }
            }
        };

        TBUtils.getThingInfo = function (sender, modCheck) {
            // First we check if we are in new modmail thread and for now we take a very simple.
            // Everything we need info for is centered around threads.
            const permaCommentLinkRegex = /(\/r\/[^/]*?\/comments\/[^/]*?\/)([^/]*?)(\/[^/]*?\/?)$/;
            const permaLinkInfoRegex = /\/r\/([^/]*?)\/comments\/([^/]*?)\/([^/]*?)\/([^/]*?)\/?$/;

            // declare what we will need.
            let $sender = $(sender);
            let $body = $('body');

            let subreddit,
                permalink,
                domain,
                id,
                postID,
                body,
                title,
                kind,
                postlink,
                banned_by,
                spam,
                ham,
                user,
                approved_by,
                $textBody,
                subredditType;

            // If new modmail the method is slightly different.
            if (TBUtils.isNewModmail) {
                subredditType = '';
                // Lack of a better name, can be a thread_message or infobar.
                const $threadBase = $($sender.closest('.Thread__message')[0] || $sender.find('.InfoBar')[0] || $sender);
                const browserUrl = window.location.href;

                const idRegex = new RegExp('.*mod.reddit.com/mail/.*?/(.*?)$', 'i');

                subreddit = $body.find('.ThreadTitle__community').text();
                permalink = ($threadBase.find('.m-link').length ? `https://mod.reddit.com${$threadBase.find('.m-link').attr('href')}` : `https://mod.reddit.com/mail/perma/${browserUrl.match(idRegex)[1]}`);
                id = browserUrl.match(idRegex)[1];

                // Funny story, there is currently no functionality in new modmail that can make use of the body.
                // Macros look at the sidebar and other modules don't need the body.
                // Todo: Figure out what body to present when activated from modmacro.
                $textBody = $threadBase.find('.Message__body .md').clone();

                $textBody.find('.RESUserTag, .voteWeight, .keyNavAnnotation').remove();
                body = $textBody.text() || '';
                body = body.replace(/^\s+|\s+$/g, '');
                $textBody.remove();
                title = $body.find('.ThreadTitle__title').text();
                kind = $threadBase.hasClass('.Thread__message') ? 'modmailmessage' : 'modmailthread';
                spam = false;
                ham = false;
                user = $threadBase.find('.Message__author').text() || $body.find('.InfoBar__username').text();

            } else {
                const $entry = $($sender.closest('.entry')[0] || $sender.find('.entry')[0] || $sender);
                const $thing = $($sender.closest('.thing')[0] || $sender);

                subredditType = $thing.attr('data-subreddit-type');
                user = $entry.find('.author:first').text() || $thing.find('.author:first').text();
                subreddit = $thing.data('subreddit') || TBUtils.post_site || $entry.find('.subreddit:first').text() || $thing.find('.subreddit:first').text() || $entry.find('.tagline .head b > a[href^="/r/"]:not(.moderator)').text();
                permalink = $entry.find('a.bylink').attr('href') || $entry.find('.buttons:first .first a').attr('href') || $thing.find('a.bylink').attr('href') || $thing.find('.buttons:first .first a').attr('href');
                domain = ($entry.find('span.domain:first').text() || $thing.find('span.domain:first').text()).replace('(', '').replace(')', '');
                id = $entry.attr('data-fullname') || $thing.attr('data-fullname') || $sender.closest('.usertext').find('input[name=thing_id]').val();
                $textBody = $entry.find('.usertext-body:first').clone() || $thing.find('.usertext-body:first').clone();
                $textBody.find('.RESUserTag, .voteWeight, .keyNavAnnotation').remove();
                body = $textBody.text() || '';
                body = body.replace(/^\s+|\s+$/g, '');

                $textBody.remove();

                // These need some fall backs, but only removal reasons use them for now.
                title = $thing.find('a.title').length ? $thing.find('a.title').text() : '';
                kind = $thing.hasClass('link') ? 'submission' : 'comment';
                postlink = $thing.find('a.title').attr('href');

                // removed? spam or ham?
                const removal = ($entry.find('.flat-list.buttons li b:contains("removed by")').text() || '').match(/removed by (.+) \(((?:remove not |confirm )?spam)/) || [];

                banned_by = removal[1] || '';
                spam = removal[2] == 'spam' || removal[2] == 'confirm spam';
                ham = removal[2] == 'remove not spam';

                if (TBUtils.isEditUserPage && !user) {
                    user = $sender.closest('.user').find('a:first').text() || $entry.closest('.user').find('a:first').text() || $thing.closest('.user').find('a:first').text();
                }

                // If we still don't have a sub, we're in mod mail, or PMs.
                if (TBUtils.isModmail || $sender.closest('.message-parent')[0] !== undefined) {
                // Change it to use the parent's title.
                    title = $sender.find('.subject-text:first').text();
                    subreddit = (subreddit) ? subreddit : ($entry.find('.head a:last').text() || $thing.find('.head a:last').text());
                    //This is a weird palce to go about this, and the conditions are strange,
                    //but if we're going to assume we're us, we better make damned well sure that is likely the case.
                    // if ($entry.find('.remove-button').text() === '') {
                    // The previous check would mistakenly catch removed modmail messages as the user's messages.
                    // This check should be safe, since the only time we get no username in modmail is the user's own message. -dakta
                    // The '.message-parent' check fixes reddit.com/message/messages/, which contains mod mail and PMs.

                    // There are two users in the tagline, the first one is the user sending the message so we want to target that user.
                    user = $entry.find('.sender a.author').text();
                    // If there is only one use present and it says "to" it means that this is not the user sending the message.
                    if ($entry.find('.sender a.author').length < 1 && $entry.find('.recipient a.author').length > 0) {
                        user = TBUtils.logged;
                    }
                    if (user === '') {
                        user = TBUtils.logged;
                        if (!subreddit || subreddit.indexOf('/r/') < 1) {
                        // Find a better way, I double dog dare ya!
                            subreddit = $thing.closest('.message-parent').find('.correspondent.reddit.rounded a').text();
                        }
                    }
                }
                const approved_text = $entry.find('.approval-checkmark').attr('title') || $thing.find('.approval-checkmark').attr('title') || '';
                approved_by = approved_text.match(/by\s(.+?)\s/) || '';
            }

            // A recent reddit change makes subreddit names sometimes start with "/r/".
            // Mod mail subreddit names additionally end with "/".
            // reddit pls, need consistency
            subreddit = TBUtils.cleanSubredditName(subreddit);

            // Not a mod, reset current sub.
            if (modCheck && $.inArray(subreddit, TBUtils.mySubs) === -1) {
                subreddit = '';
            }

            if (user === '[deleted]') {
                user = '';
            }

            // If the permalink is relative, stick the current domain name in.
            // Only do so if a permalink is found.
            if (permalink && permalink.slice(0,1) === '/')
            {
                permalink = TBUtils.baseDomain + permalink;
            }

            if (permalink && permaCommentLinkRegex.test(permalink)) {
                const permalinkDetails = permalink.match(permaLinkInfoRegex);
                postID = `t3_${permalinkDetails[2]}`;
                permalink = permalink.replace(permaCommentLinkRegex, '$1-$3');
            }

            let info = {
                subreddit: subreddit,
                subredditType: subredditType,
                user: user,
                author: user,
                permalink: permalink,
                url: permalink,
                domain: domain,
                id: id,
                postID: postID || '',
                body: `> ${body.split('\n').join('\n> ')}`,
                raw_body: body,
                uri_body: encodeURIComponent(body).replace(/\)/g, '\\)'),
                approved_by: approved_by,
                title: title,
                uri_title: encodeURIComponent(title).replace(/\)/g, '\\)'),
                kind: kind,
                postlink: postlink,
                link: postlink,
                banned_by: banned_by,
                spam: spam,
                ham: ham,
                rules: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/about/rules` : '',
                sidebar: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/about/sidebar` : '',
                wiki: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/wiki/index` : '',
                mod: TBUtils.logged
            };

            return info;
        };

        function findMessage(object, searchID) {
            let found;
            switch (object.kind) {
            case 'Listing':
                for (let i = 0; i < object.data.children.length; i++) {
                    const childFound = findMessage(object.data.children[i], searchID);
                    if(childFound) {
                        found = childFound;
                    }
                }
                break;
            case 't4':
                console.log('t4:', object.data.id);
                if(object.data.id === searchID) {
                    found = object;
                }

                if (object.data.hasOwnProperty('replies') && object.data.replies && typeof object.data.replies === 'object') {
                    const childFound = findMessage(object.data.replies, searchID); // we need to go deeper.
                    if(childFound) {
                        found = childFound;
                    }
                }
                break;
            default:
                break;
            }
            return found;
        }

        TBUtils.getApiThingInfo = function (id, subreddit, modCheck, callback) {
            if(id.startsWith('t4_')) {
                const shortID = id.substr(3);
                $.get(`${TBUtils.baseDomain}/message/messages/${shortID}.json`, function (response) {
                    const message = findMessage(response, shortID);
                    const body = message.data.body,
                        user = message.data.author,
                        title = message.data.subject,
                        subreddit = message.data.subreddit || '',
                        permalink = `/message/messages/${shortID}`;

                    const info = {
                        subreddit: subreddit,
                        user: user,
                        author: user,
                        permalink: permalink,
                        url: permalink,
                        domain: '',
                        id: id,
                        body: `> ${body.split('\n').join('\n> ')}`,
                        raw_body: body,
                        uri_body: encodeURIComponent(body).replace(/\)/g, '\\)'),
                        approved_by: '',
                        title: title,
                        uri_title: encodeURIComponent(title).replace(/\)/g, '\\)'),
                        kind: 'comment',
                        postlink: '',
                        link: '',
                        banned_by: '',
                        spam: '',
                        ham: '',
                        rules: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/about/rules` : '',
                        sidebar: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/about/sidebar` : '',
                        wiki: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/wiki/index` : '',
                        mod: TBUtils.logged
                    };
                    callback(info);
                });
            } else {
                const permaCommentLinkRegex = /(\/r\/[^/]*?\/comments\/[^/]*?\/)([^/]*?)(\/[^/]*?\/?)$/;
                $.get(`${TBUtils.baseDomain}/r/${subreddit}/api/info.json`, {id: id}, function (response) {
                    const data = response.data;

                    let user = data.children[0].data.author;
                    let body = data.children[0].data.body || '';
                    let permalink = data.children[0].data.permalink;
                    let title = data.children[0].data.title || '';
                    let postlink = data.children[0].data.url || '';
                    // A recent reddit change makes subreddit names sometimes start with "/r/".
                    // Mod mail subreddit names additionally end with "/".
                    // reddit pls, need consistency
                    subreddit = TBUtils.cleanSubredditName(subreddit);

                    // Not a mod, reset current sub.
                    if (modCheck && $.inArray(subreddit, TBUtils.mySubs) === -1) {
                        subreddit = '';
                    }

                    if (user === '[deleted]') {
                        user = '';
                    }

                    // If the permalink is relative, stick the current domain name in.
                    // Only do so if a permalink is found.
                    if (permalink && permalink.slice(0,1) === '/')
                    {
                        permalink = TBUtils.baseDomain + permalink;
                    }

                    if (permalink && permaCommentLinkRegex.test(permalink)) {
                        permalink = permalink.replace(permaCommentLinkRegex, '$1-$3');
                    }

                    const info = {
                        subreddit: subreddit,
                        user: user,
                        author: user,
                        permalink: permalink,
                        url: permalink,
                        domain: data.children[0].data.domain || '',
                        id: id,
                        body: `> ${body.split('\n').join('\n> ')}`,
                        raw_body: body,
                        uri_body: encodeURIComponent(body).replace(/\)/g, '\\)'),
                        approved_by: data.children[0].data.approved_by,
                        title: title,
                        uri_title: encodeURIComponent(title).replace(/\)/g, '\\)'),
                        kind: data.children[0].kind === 't3' ? 'submission' : 'comment',
                        postlink: postlink,
                        link: postlink,
                        banned_by: data.children[0].data.banned_by,
                        spam: data.children[0].data.spam,
                        ham: data.children[0].data.removed,
                        rules: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/about/rules` : '',
                        sidebar: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/about/sidebar` : '',
                        wiki: subreddit ? `${TBUtils.baseDomain}/r/${subreddit}/wiki/index` : '',
                        mod: TBUtils.logged
                    };
                    callback(info);
                });
            }
        };

        TBUtils.replaceTokens = function (info, content) {
            $.log(info, false, SHORTNAME);
            for (let i in info) {
                const pattern = new RegExp(`{${i}}`, 'mig');
                content = content.replace(pattern, info[i]);
            }

            return content;
        };

        // Prevent page lock while parsing things.  (stolen from RES)
        TBUtils.forEachChunked = function (array, chunkSize, delay, call, complete, start) {
            if (array === null) finish();
            if (chunkSize === null || chunkSize < 1) finish();
            if (delay === null || delay < 0) finish();
            if (call === null) finish();
            let counter = 0;

            function doChunk() {
                if (counter === 0 && start) {
                    start();
                }

                for (let end = Math.min(array.length, counter + chunkSize); counter < end; counter++) {
                    const ret = call(array[counter], counter, array);
                    if (ret === false) return window.setTimeout(finish, delay);
                }
                if (counter < array.length) {
                    window.setTimeout(doChunk, delay);
                } else {
                    window.setTimeout(finish, delay);
                }
            }

            window.setTimeout(doChunk, delay);

            function finish() {
                return complete ? complete() : false;
            }
        };

        // Chunking abused for ratelimiting
        TBUtils.forEachChunkedRateLimit = function (array, chunkSize, call, complete, start) {
            if (array === null) finish();
            if (chunkSize === null || chunkSize < 1) finish();
            if (call === null) finish();

            let length = array.length,
                counter = 0,
                delay = 100,
                limit = (length > chunkSize) ? 20 : 0;

            if (length < chunkSize) {
                chunkSize = length;
            }

            function doChunk() {
                if (counter === 0 && start) {
                    start();
                }

                for (let end = Math.min(array.length, counter + chunkSize); counter < end; counter++) {
                    const ret = call(array[counter], counter, array);
                    if (ret === false) return window.setTimeout(finish, delay);
                }
                if (counter < array.length) {
                    window.setTimeout(getRatelimit, delay);
                } else {
                    window.setTimeout(finish, delay);
                }
            }

            function timer(count, $body, ratelimitRemaining) {
                count = count - 1;
                if (count <= 0) {
                    $body.find('#ratelimit-counter').empty();
                    $body.find('#ratelimit-counter').hide();
                    return count;
                }

                const minutes = Math.floor(count / 60);
                const seconds = count - minutes * 60;

                $body.find('#ratelimit-counter').html(`<b>Oh dear, it seems we have hit a limit, waiting for ${minutes} minutes and ${seconds} seconds before resuming operations.</b>
    <br><br>
    <span class="rate-limit-explain"><b>tl;dr</b> <br> Reddit's current ratelimit allows for <i>${ratelimitRemaining} requests</i>. We are currently trying to process <i>${parseInt(chunkSize)} items</i>. Together with toolbox requests in the background that is cutting it a little bit too close. Luckily for us reddit tells us when the ratelimit will be reset, that is the timer you see now.</span>
    `);

                return count;
            }

            function getRatelimit() {
            //return doChunk();
                TBUtils.getHead('/r/toolbox/wiki/ratelimit.json',
                    function (status, jqxhr) {
                        let $body = $('body'),
                            ratelimitRemaining = jqxhr.getResponseHeader('x-ratelimit-remaining'),
                            ratelimitReset = jqxhr.getResponseHeader('x-ratelimit-reset');
                        $.log(`ratelimitRemaining: ${ratelimitRemaining} ratelimitReset: ${ratelimitReset / 60}`, false, SHORTNAME);

                        if (!$body.find('#ratelimit-counter').length) {
                            $('div[role="main"].content').append('<span id="ratelimit-counter"></span>');
                        }

                        if (chunkSize + limit > parseInt(ratelimitRemaining)) {
                            $body.find('#ratelimit-counter').show();
                            let count = parseInt(ratelimitReset),
                                counter = 0;

                            counter = setInterval(function() {
                                count = timer(count, $body, ratelimitRemaining);
                                if (count <= 0) {
                                    clearInterval(counter);
                                    doChunk();
                                }
                            }, 1000);

                        } else {
                            doChunk();
                        }
                    });
            }

            getRatelimit();

            function finish() {
                return complete ? complete() : false;
            }
        };

        TBUtils.forEachChunkedDynamic = function(array, process, options) {
            if(typeof process !== 'function') return;
            let arr = Array.from(array),
                start,
                stop,
                fr,
                started = false,
                opt = Object.assign({
                    size: 25, //starting size
                    framerate: 30, //target framerate
                    nerf: 0.9, //Be careful with this one
                }, options),
                size = opt.size,
                nerf = opt.nerf,
                framerate = opt.framerate,

                now = function() { return window.performance.now(); },

                again = (typeof window.requestAnimationFrame === 'function') ?
                    function(callback) { window.requestAnimationFrame(callback); } :
                    function(callback) { setTimeout(callback, 1000 / opt.framerate); },

                optimize = function() {
                    stop = now();
                    fr = 1000 / (stop - start);
                    size = Math.ceil(size * (1 + (fr / framerate - 1) * nerf));
                    return (start = stop);
                };

            return new Promise(function(resolve) {
                let doChunk = function() {
                    if (started) {
                        optimize();
                    } else {
                        started = true;
                    }

                    arr.splice(0, size).forEach(process);

                    if (arr.length) return again( doChunk );
                    return resolve(array);
                };
                start = now();
                again( doChunk );
            });
        };

        TBUtils.reloadToolbox = function () {
            if (typeof chrome !== 'undefined') {
                TBui.textFeedback('toolbox is reloading', TBui.FEEDBACK_POSITIVE, 10000, TBui.DISPLAY_BOTTOM);
                chrome.runtime.sendMessage({action: 'tb-reload'}, function () {
                    window.location.reload();
                });
            }
        };

        //
        // Reddit Oauth api stuff
        //

        // Generic promise based POST request. Can be used to construct all api calls involving post.
        // Example usage:
        //
        // TBUtils.apiOauthPOST('api/mod/conversations', {
        //     body: 'sending this with the new api through toolbox',
        //     subject: 'api testing',
        //     srName: 'toolbox'
        // }).then(function(data) {
        //     console.log(data)
        // }).catch(function(error) {
        //     console.log(error)
        // });

        TBUtils.apiOauthPOST = function apiOauthPost(endpoint, data) {
            // let's fetch the token we need first.
            return TBUtils.oauthToken().then(function(token) {
                return $.ajax({
                    url: `https://oauth.reddit.com/${endpoint}`,
                    type: 'POST',
                    data: data,
                    beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', `bearer ${token}`);},
                }).then(function(data, textStatus, jqXHR) {
                    return {
                        data: data,
                        textStatus: textStatus,
                        jqXHR: jqXHR
                    };
                }, function(jqXHR, textStatus, errorThrown) {
                    throw {
                        jqXHR: jqXHR,
                        textStatus: textStatus,
                        errorThrown: errorThrown
                    };

                });
            });
        };

        // Generic promise based POST request. Can be used to construct all api calls involving post.
        TBUtils.apiOauthGET = function apiOauthGET(endpoint, data) {
            // let's fetch the token we need first.
            return TBUtils.oauthToken().then(function(token) {
                return $.ajax({
                    url: `https://oauth.reddit.com/${endpoint}`,
                    type: 'GET',
                    data: data,
                    beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', `bearer ${token}`);},
                }).then(function(data, textStatus, jqXHR) {
                    return {
                        data: data,
                        textStatus: textStatus,
                        jqXHR: jqXHR
                    };
                }, function(jqXHR, textStatus, errorThrown) {
                    throw {
                        jqXHR: jqXHR,
                        textStatus: textStatus,
                        errorThrown: errorThrown
                    };

                });
            });

        };

        //
        // Reddit 'legacy' API stuff. Still very much in use.
        //
        TBUtils.getRatelimit = function getRatelimit(callback) {
            TBUtils.getHead('/r/toolbox/wiki/ratelimit.json',
                function (status, jqxhr) {
                    const ratelimitRemaining = jqxhr.getResponseHeader('x-ratelimit-remaining'),
                        ratelimitReset = jqxhr.getResponseHeader('x-ratelimit-reset');
                    $.log(`ratelimitRemaining: ${ratelimitRemaining} ratelimitReset: ${ratelimitReset / 60}`, false, SHORTNAME);

                    if (typeof callback !== 'undefined') {
                        callback({
                            'ratelimitRemaining': ratelimitRemaining,
                            'ratelimitReset': ratelimitReset
                        });
                    }
                });
        };

        TBUtils.setWikiPrivate = function setWikiPrivate(page, subreddit, failAlert) {
            setWikiPrivate(subreddit, page, failAlert);
        };

        TBUtils.postToWiki = function postToWiki(page, subreddit, data, reason, isJSON, updateAM, callback) {
            if (reason) {
                reason = `"${reason}" via toolbox`;
            } else {
                reason = 'updated via toolbox';
            }

            if (isJSON) {
            // Not indenting saves precious bytes.
            //data = JSON.stringify(data, undefined, TBUtils.debugMode ? 2 : undefined);
                data = JSON.stringify(data);
            }

            $.log(`Posting /r/${subreddit}/api/wiki/edit/${page}`, false, SHORTNAME);

            // If we update automoderator we want to replace any tabs with four spaces.
            if (updateAM) {
                data = data.replace(/\t/g, '    ');
            }

            $.post(`${TBUtils.baseDomain}/r/${subreddit}/api/wiki/edit`, {
                content: data,
                page: page,
                reason: reason,
                uh: TBUtils.modhash
            })

                .fail(function postToWiki_error(jqXHR) {
                    $.log(jqXHR.responseText, false, SHORTNAME);
                    callback(false, jqXHR);
                })

                .done(function () {
                    setTimeout(function () {
                    // Callback regardless of what happens next.  We wrote to the page.
                    // In order to make sure the callback followup doesn't mess with the mod only call we let it wait a bit longer.

                        callback(true);

                    }, 750);

                    setTimeout(function () {

                    // Set page access to 'mod only'.
                        $.post(`${TBUtils.baseDomain}/r/${subreddit}/wiki/settings/`, {
                            page: page,
                            listed: true, //hrm, may need to make this a config setting.
                            permlevel: 2,
                            uh: TBUtils.modhash
                        })

                        // Super extra double-secret secure, just to be safe.
                            .fail(function () {
                                alert('error setting wiki page to mod only access');
                                window.location = `https://www.reddit.com/r/${subreddit}/wiki/settings/${page}`;
                            });

                    }, 500);
                });
        };

        // reddit HTML encodes all of their JSON responses, we need to HTMLdecode
        // them before parsing.
        TBUtils.unescapeJSON = function (val) {
            if (typeof(val) === 'string') {
                val = val.replace(/&quot;/g, '"')
                    .replace(/&gt;/g, '>').replace(/&lt;/g, '<')
                    .replace(/&amp;/g, '&');
            }
            return val;
        };

        TBUtils.readFromWiki = function (subreddit, page, isJSON, callback) {
        // We need to demangle the JSON ourselves, so we have to go about it this way :(
            $.ajax(`${TBUtils.baseDomain}/r/${subreddit}/wiki/${page}.json`, {
                dataType: 'json',
                dataFilter: function (data) {
                //TODO: right now a lot of functions implicitly rely on reddit
                //returning escaped JSON to operate safely. add this back in once
                //everything's been audited.

                //return TBUtils.unescapeJSON(data);
                    return data;
                }
            })
                .done(function (json) {
                    const wikiData = json.data.content_md;

                    if (!wikiData) {
                        callback(TBUtils.NO_WIKI_PAGE);
                        return;
                    }

                    if (isJSON) {
                        let parsedWikiData;
                        try {
                            parsedWikiData = JSON.parse(wikiData);
                        }
                        catch (err) {
                        // we should really have a INVAILD_DATA error for this.
                            $.log(err, false, SHORTNAME);
                            callback(TBUtils.NO_WIKI_PAGE);
                        }

                        // Moved out of the try so random exceptions don't erase the entire wiki page
                        if (parsedWikiData) {
                            callback(parsedWikiData);
                        } else {
                            callback(TBUtils.NO_WIKI_PAGE);
                        }

                        return;
                    }

                    // We have valid data, but it's not JSON.
                    callback(wikiData);

                })
                .fail(function (jqXHR, textStatus, e) {
                    $.log(`Wiki error (${subreddit}/${page}): ${e}`, false, SHORTNAME);
                    if (jqXHR.responseText === undefined) {
                        callback(TBUtils.WIKI_PAGE_UNKNOWN);
                        return;
                    }
                    let reason;
                    if (jqXHR.responseText.startsWith('<!doctype html>')) {
                        reason = 'WIKI_PAGE_UNKNOWN';
                    } else {
                        reason = JSON.parse(jqXHR.responseText).reason || '';
                    }

                    if (reason === 'PAGE_NOT_CREATED' || reason === 'WIKI_DISABLED') {
                        callback(TBUtils.NO_WIKI_PAGE);
                    } else {
                    // we don't know why it failed, we should not try to write to it.
                        callback(TBUtils.WIKI_PAGE_UNKNOWN);
                    }
                });
        };

        TBUtils.getBanState = function (subreddit, user, callback) {
            $.get(`${TBUtils.baseDomain}/r/${subreddit}/about/banned/.json`, {user: user}, function (data) {
                const banned = data.data.children;

                // If it's over or under exactly one item they are not banned or that is not their full name.
                if (banned.length !== 1) {
                    return callback(false);
                }

                callback(true, banned[0].note, banned[0].date, banned[0].name);
            });
        };

        TBUtils.flairPost = function (postLink, subreddit, text, cssClass, callback) {
            $.post(`${TBUtils.baseDomain}/api/flair`, {
                api_type: 'json',
                link: postLink,
                text: text,
                css_class: cssClass,
                r: subreddit,
                uh: TBUtils.modhash
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.flairUser = function (user, subreddit, text, cssClass, callback) {
            $.post(`${TBUtils.baseDomain}/api/flair`, {
                api_type: 'json',
                name: user,
                r: subreddit,
                text: text,
                css_class: cssClass,
                uh: TBUtils.modhash
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.friendUser = function (user, action, subreddit, banReason, banMessage, banDuration, callback) {
            const trimmedBanMessage = banMessage.length > 999 ? banMessage.substring(0, 999) : banMessage;
            const trimmedBanReason = banReason.length > 99 ? banReason.substring(0, 99) : banReason;
            if (banDuration) {
                if (banDuration > 999) {
                    banDuration = 999;
                }
                if (banDuration < 0) {
                    banDuration = 0;
                }
            }

            $.post(`${TBUtils.baseDomain}/api/friend`, {
                api_type: 'json',
                uh: TBUtils.modhash,
                type: action,
                name: user,
                r: subreddit,
                note: trimmedBanReason,
                ban_message: trimmedBanMessage,
                duration: banDuration
            })
                .done(function (response) {
                    if (typeof callback !== 'undefined')
                        callback(true, response);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.unfriendUser = function (user, action, subreddit, callback) {
            $.post(`${TBUtils.baseDomain}/api/unfriend`, {
                api_type: 'json',
                uh: TBUtils.modhash,
                type: action,
                name: user,
                r: subreddit
            })
                .done(function (response) {
                    if (typeof callback !== 'undefined')
                        callback(true, response);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.distinguishThing = function (id, sticky, callback) {
            $.post(`${TBUtils.baseDomain}/api/distinguish/yes`, {
                id: id,
                sticky: sticky,
                uh: TBUtils.modhash
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.approveThing = function (id, callback) {
            $.post(`${TBUtils.baseDomain}/api/approve`, {
                id: id,
                uh: TBUtils.modhash
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.removeThing = function (id, spam, callback) {
            $.post(`${TBUtils.baseDomain}/api/remove`, {
                uh: TBUtils.modhash,
                id: id,
                spam: spam
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.markOver18 = function (id, callback) {
            $.post(`${TBUtils.baseDomain}/api/marknsfw`, {
                id: id,
                uh: TBUtils.modhash
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.unMarkOver18 = function (id, callback) {
            $.post(`${TBUtils.baseDomain}/api/unmarknsfw`, {
                uh: TBUtils.modhash,
                id: id
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.lockThread = function (id, callback) {
            $.post(`${TBUtils.baseDomain}/api/lock`, {
                id: id,
                uh: TBUtils.modhash
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.unlockThread = function (id, callback) {
            $.post(`${TBUtils.baseDomain}/api/unlock`, {
                uh: TBUtils.modhash,
                id: id
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.stickyThread = function(id, callback, state) {
            if (state === undefined) {
                state = true;
            }

            $.post(`${TBUtils.baseDomain}/api/set_subreddit_sticky`, {
                id: id,
                state: state,
                uh: TBUtils.modhash
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.unstickyThread = function(id, callback) {
            TBUtils.stickyThread(id, callback, false);
        };

        TBUtils.postComment = function (parent, text, callback) {
            $.post(`${TBUtils.baseDomain}/api/comment`, {
                parent: parent,
                uh: TBUtils.modhash,
                text: text,
                api_type: 'json'
            })
                .done(function (response) {
                    if (response.json.hasOwnProperty('errors') && response.json.errors.length > 0) {
                        $.log(`Failed to post comment to on ${parent}`, false, SHORTNAME);
                        $.log(response.json.fails, false, SHORTNAME);
                        if (typeof callback !== 'undefined')
                            callback(false, response.json.errors);
                        return;
                    }

                    $.log(`Successfully posted comment on ${parent}`, false, SHORTNAME);
                    if (typeof callback !== 'undefined')
                        callback(true, response);
                })
                .fail(function (error) {
                    $.log(`Failed to post link to on${parent}`, false, SHORTNAME);
                    $.log(error, false, SHORTNAME);
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.postLink = function (link, title, subreddit, callback) {
            $.post(`${TBUtils.baseDomain}/api/submit`, {
                kind: 'link',
                resubmit: 'true',
                url: link,
                uh: TBUtils.modhash,
                title: title,
                sr: subreddit,
                sendreplies: 'true', //this is the default on reddit.com, so it should be our default.
                api_type: 'json'
            })
                .done(function (response) {
                    if (response.json.hasOwnProperty('errors') && response.json.errors.length > 0) {
                        $.log(`Failed to post link to /r/${subreddit}`, false, SHORTNAME);
                        $.log(response.json.errors, false, SHORTNAME);
                        if (typeof callback !== 'undefined')
                            callback(false, response.json.errors);
                        return;
                    }

                    $.log(`Successfully posted link to /r/${subreddit}`, false, SHORTNAME);
                    if (typeof callback !== 'undefined')
                        callback(true, response);
                })
                .fail(function (error) {
                    $.log(`Failed to post link to /r/${subreddit}`, false, SHORTNAME);
                    $.log(error, false, SHORTNAME);
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.sendMessage = function (user, subject, message, subreddit, callback) {
            $.post(`${TBUtils.baseDomain}/api/compose`, {
                from_sr: subreddit,
                subject: subject.substr(0, 99),
                text: message,
                to: user,
                uh: TBUtils.modhash,
                api_type: 'json'
            })
                .done(function (response) {
                    if (response.json.hasOwnProperty('errors') && response.json.errors.length > 0) {
                        $.log(`Failed to send link to /u/${user}`, false, SHORTNAME);
                        $.log(response.json.errors, false, SHORTNAME);
                        if (typeof callback !== 'undefined')
                            callback(false, response.json.errors);
                        return;
                    }

                    $.log(`Successfully send link to /u/${user}`, false, SHORTNAME);
                    if (typeof callback !== 'undefined')
                        callback(true, response);
                })
                .fail(function (error) {
                    $.log(`Failed to send link to /u/${user}`, false, SHORTNAME);
                    $.log(error, false, SHORTNAME);
                    if (typeof callback !== 'undefined')
                        callback(false, error);
                });
        };

        TBUtils.sendPM = function (to, subject, message, callback) {
            $.post(`${TBUtils.baseDomain}/api/compose`, {
                to: to,
                uh: TBUtils.modhash,
                subject: subject,
                text: message
            })
                .done(function () {
                    if (typeof callback !== 'undefined')
                        callback(true);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error.responseText);
                });
        };

        TBUtils.markMessageRead = function (id, callback) {
            $.post(`${TBUtils.baseDomain}/api/read_message`, {
                api_type: 'json',
                id: id,
                uh: TBUtils.modhash
            }).done(function () {
                if (typeof callback !== 'undefined')
                    callback(true);
            });
        };

        TBUtils.aboutUser = function (user, callback) {
            $.get(`${TBUtils.baseDomain}/user/${user}/about.json`, {
                uh: TBUtils.modhash
            })
                .done(function (response) {
                    if (typeof callback !== 'undefined')
                        callback(true, response);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error.responseText);
                });
        };

        TBUtils.getLastActive = function(user, callback) {
            $.get(`${TBUtils.baseDomain}/user/${user}.json?limit=1&sort=new`, {
                uh: TBUtils.modhash
            })
                .done(function (response) {
                    if (typeof callback !== 'undefined')
                        callback(true, response.data.children[0].data.created_utc);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error.responseText);
                });
        };

        TBUtils.getRules = function (sub, callback) {
            $.get(`${TBUtils.baseDomain}/r/${sub}/about/rules.json`, {
                uh: TBUtils.modhash
            })
                .done(function (response) {
                    if (typeof callback !== 'undefined')
                        callback(true, response);
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error.responseText);
                });
        };

        TBUtils.getReportReasons = function (postURL, callback) {
            $.log('getting reports', false, SHORTNAME);
            $.get(`${TBUtils.baseDomain + postURL}.json?limit=1`, {
                uh: TBUtils.modhash
            })
                .done(function (response) {
                    if (typeof callback !== 'undefined') {
                        const data = response[0].data.children[0].data;

                        if (!data) return callback(false);

                        callback(true, {
                            user_reports: data.user_reports,
                            mod_reports: data.mod_reports
                        });
                    }
                })
                .fail(function (error) {
                    if (typeof callback !== 'undefined')
                        callback(false, error.responseText);
                });
        };

        // Import export methods
        TBUtils.exportSettings = function (subreddit, callback) {
            let settingsObject = {};
            $(TBStorage.settings).each(function () {
                if (this === 'Storage.settings') return; // don't backup the setting registry.

                let key = this.split('.'),
                    setting = TBStorage.getSetting(key[0], key[1], null);

                if (setting !== null && setting !== undefined) { // DO NOT, EVER save null (or undefined, but we shouldn't ever get that)
                    settingsObject[this] = setting;
                }
            });

            TBUtils.postToWiki('tbsettings', subreddit, settingsObject, 'exportSettings', true, false, function () {
                callback();
            });
        };

        TBUtils.importSettings = function (subreddit, callback) {
            TBUtils.readFromWiki(subreddit, 'tbsettings', true, function (resp) {
                if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                    $.log('Error loading wiki page', false, SHORTNAME);
                    return;
                }

                if (TBUtils.domain !== 'new' && TBUtils.domain !== 'www') {
                    TB.ui.textFeedback(`Cannot import from ${TBUtils.domain}.reddit.com.`, TB.ui.FEEDBACK_NEGATIVE);
                    $.log(`Cannot import from ${TBUtils.domain}.reddit.com.`, false, SHORTNAME);
                    return;
                }

                if (resp['Utils.lastversion'] < 300) {
                    TBui.textFeedback('Cannot import from a toolbox version under 3.0');
                    $.log('Cannot import from a toolbox version under 3.0', false, SHORTNAME);
                    return;
                }

                $.each(resp, function (fullKey, value) {
                    let key = fullKey.split('.');

                    TBStorage.setSetting(key[0], key[1], value);
                });

                callback();
            });
        };

        // Utility methods
        TBUtils.removeQuotes = function (string) {
            return string.replace(/['"]/g, '');
        };

        TBUtils.stringToColor = function stringToColor(str) {
            // str to hash
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }

            // int/hash to hex
            let color = '#';
            for (let index = 0; index < 3; index++) {
                color += (`00${((hash >> index * 8) & 0xFF).toString(16)}`).slice(-2);
            }

            return color;
        };

        // Added back for MMP's live mod mail.
        TBUtils.compressHTML = function (src) {
            return src.replace(/(\n+|\s+)?&lt;/g, '<').replace(/&gt;(\n+|\s+)?/g, '>').replace(/&amp;/g, '&').replace(/\n/g, '').replace(/child" > {2}False/, 'child">');
        };

        TBUtils.addToSiteTable = function (URL, callback) {
            if (!URL || !callback) callback(null);

            $.get(URL, function (resp) {
                if (!resp) callback(null);

                resp = resp.replace(/<script(.|\s)*?\/script>/g, '');
                let $sitetable = $(resp).find('#siteTable');
                $sitetable.find('.nextprev').remove();

                if ($sitetable) {
                    callback($sitetable);
                } else {
                    callback(null);
                }

            });
        };

        // easy way to simulate the php html encode and decode functions
        TBUtils.htmlEncode = function (value) {
        //create a in-memory div, set it's inner text(which jQuery automatically encodes)
        //then grab the encoded contents back out.  The div never exists on the page.
            return $('<div/>').text(value).html();
        };

        TBUtils.htmlDecode = function (value) {
            return $('<div/>').html(value).text();
        };

        TBUtils.zlibInflate = function (stringThing) {
        // Expand base64
            stringThing = atob(stringThing);
            // zlib time!
            let inflate = new pako.Inflate({to:'string'});
            inflate.push(stringThing);
            return inflate.result;
        };

        TBUtils.zlibDeflate = function (objThing) {
        // zlib time!
            let deflate = new pako.Deflate({to:'string'});
            deflate.push(objThing, true);
            objThing = deflate.result;
            // Collapse to base64
            return btoa(objThing);
        };

        // Cache manipulation

        TBUtils.clearCache = function (calledFromBackground) {
            $.log('TBUtils.clearCache()', false, SHORTNAME);

            TBUtils.noteCache = {};
            TBUtils.configCache = {};
            TBUtils.rulesCache = {};
            TBUtils.noConfig = [];
            TBUtils.noNotes = [];
            TBUtils.noRules = [];
            TBUtils.mySubs = [];
            TBUtils.mySubsData = [];

            TBStorage.clearCache();

            if(!calledFromBackground) {
                chrome.runtime.sendMessage({
                    action: 'tb-global',
                    globalEvent: 'clearCache'
                });
            }

        };

        TBUtils.getReasonsFromCSS = function (sub, callback) {

        // If not, build a new one, getting the XML from the stylesheet
            $.get(`${TBUtils.baseDomain}/r/${sub}/about/stylesheet.json`).done(function (response) {
                if (!response.data) {
                    callback(false);
                    return;
                }

                // See if this subreddit is configured for leaving reasons using <removalreasons2>
                let match = response.data.stylesheet.replace(/\n+|\s+/g, ' ')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .match(/<removereasons2>.+<\/removereasons2>/i);

                // Try falling back to <removalreasons>
                if (!match) {
                    match = response.data.stylesheet.replace(/\n+|\s+/g, ' ')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .match(/<removereasons>.+<\/removereasons>/i);
                }

                // Neither can be found.
                if (!match) {
                    callback(false);
                    return;
                }

                // Create valid XML from parsed string and convert it to a JSON object.
                let XML = $(match[0]);
                let reasons = [];

                XML.find('reason').each(function () {
                    let reason = {
                        text: escape(this.innerHTML)
                    };
                    reasons.push(reason);
                });

                let oldReasons = {
                    pmsubject: XML.find('pmsubject').text() || '',
                    logreason: XML.find('logreason').text() || '',
                    header: escape(XML.find('header').text() || ''),
                    footer: escape(XML.find('footer').text() || ''),
                    logsub: XML.find('logsub').text() || '',
                    logtitle: XML.find('logtitle').text() || '',
                    bantitle: XML.find('bantitle').text() || '',
                    getfrom: XML.find('getfrom').text() || '',
                    reasons: reasons
                };

                callback(oldReasons);
            }).fail(function () {
                callback(false);
            });
        };

        TBUtils.hasNoConfig = function (sub) {
            return TBUtils.noConfig.indexOf(sub) !== -1;
        };

        TBUtils.hasConfig = function (sub) {
            return TBUtils.configCache[sub] !== undefined;
        };

        TBUtils.getConfig = function(sub, callback) {
            if (TBUtils.hasNoConfig(sub)) {
                callback(false, sub);
            }
            else if (TBUtils.hasConfig(sub)) {
                callback(TBUtils.configCache[sub], sub);
            }
            else {
                TBUtils.readFromWiki(sub, 'toolbox', true, function (resp) {
                // Complete and utter failure
                    if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                        callback(false, sub);
                    }
                    // Subreddit not configured yet
                    else if (resp === TBUtils.NO_WIKI_PAGE) {
                        TBUtils.noConfig.push(sub);
                        callback(false, sub);
                    }
                    // It works!
                    else {
                        TBUtils.configCache[sub] = resp;
                        callback(resp, sub);
                    }
                });
            }
        };

        // Listen to background page communication and act based on that.
        chrome.runtime.onMessage.addListener(function(message) {
            switch (message.action) {
            case 'clearCache': {
                TBUtils.clearCache(true);
                break;
            }
            default: {
                const event = new CustomEvent(message.action, {detail: message.payload });
                window.dispatchEvent(event);
            }

            }
        });

        // private functions
        function setWikiPrivate(subreddit, page, failAlert) {
            $.post(`${TBUtils.baseDomain}/r/${subreddit}/wiki/settings/`, {
                page: page,
                listed: true, //hrm, may need to make this a config setting.
                permlevel: 2,
                uh: TBUtils.modhash
            })
            // Super extra double-secret secure, just to be safe.
                .fail(function () {
                // used if it is important for the user to know that a wiki page has not been set to private.
                    if (failAlert) {
                        alert('error setting wiki page to mod only access');
                        window.location = `https://www.reddit.com/r/${subreddit}/wiki/settings/${page}`;
                    } else {
                        $.log('error setting wiki page to mod only access');
                    }
                });
        }

        function getToolboxDevs() {
            $.getJSON(`${TBUtils.baseDomain}/r/toolbox/about/moderators.json`).done(function (resp) {

                let children = resp.data.children,
                    devs = [];

                $.each(children, function (index, child) {
                    devs.push(child.name);
                });
                TBUtils.tbDevs = devs;
                TBStorage.setSetting(SETTINGS_NAME, 'tbDevs', devs);
            }).fail(function () {
                const devs = [
                    'agentlame',
                    'creesch',
                    'LowSociety ',
                    'TheEnigmaBlade',
                    'dakta',
                    'largenocream',
                    'psdtwk',
                    'amici_ursi',
                    'noeatnosleep',
                    'Garethp',
                    'WorseThanHipster',
                    'geo1088'
                ];
                TBUtils.tbDevs = devs;
                TBStorage.setSetting(SETTINGS_NAME, 'tbDevs', devs);
            });
        }

        // Prep new modmail for toolbox stuff.
        // We wait a short while because new modmail is sneaky sneaky loading things after the dom is ready.
        function addTbModmailSidebar() {
            setTimeout(function () {
                let $body = $('body');
                if (TBUtils.isNewModmail && $body.find('.ThreadViewer').length > 0 && $body.find('.tb-recents').length === 0) {
                    $body.find('.ThreadViewer__infobar').append('<div class="InfoBar__recents tb-recents"><div class="InfoBar__recentsTitle">Toolbox functions:</div></div>');
                }
            }, 500);
        }
        addTbModmailSidebar();

        // Watch for locationHref changes and sent an event with details
        let locationHref;

        // new modmail regex matches.
        const newMMlistingReg = /^\/mail\/(all|new|inprogress|archived|highlighted|mod|notifications)\/?$/;
        const newMMconversationReg = /^\/mail\/(all|new|inprogress|archived|highlighted|mod|notifications)\/?([^/]*)\/?$/;
        const newMMcreate = /^\/mail\/create\/?$/;

        // reddit regex matches.
        const redditFrontpageReg = /^\/?(hot|new|rising|controversial)?\/?$/;
        const subredditFrontpageReg = /^\/r\/([^/]*?)\/?(hot|new|rising|controversial)?\/?$/;
        const subredditCommentListingReg = /^\/r\/([^/]*?)\/comments\/?$/;
        const subredditCommentsPageReg = /^\/r\/([^/]*?)\/comments\/([^/]*?)\/([^/]*?)\/?$/;
        const subredditPermalinkCommentsPageReg = /^\/r\/([^/]*?)\/comments\/([^/]*?)\/([^/]*?)\/([^/]*?)\/?$/;
        const queuePageReg = /^\/r\/([^/]*?)\/about\/(modqueue|reports|edited|unmoderated|spam)\/?$/;
        const userProfile = /^\/user\/([^/]*?)\/?(overview|submitted|posts|comments|saved|upvoted|downvoted|hidden|gilded)?\/?$/;

        // This function after being first called will watch for pushstate changes.
        // Once a change is detected it will abstract all the context information from url, update TBUtils variables and emit all information in an event.
        // NOTE: this function is a work in progress, page types are added once needed. Currently supported pages where context are provided are:
        // NewModmail: listings, conversations, create
        // reddit frontpage: sorting
        // subreddits: listing including sorting, submissions, submissions with permalink
        function watchPushState() {
            const samePage = locationHref === location.href;
            if (!samePage) {
                const oldHref = locationHref;
                locationHref = location.href;

                let contextObject = {
                    'oldHref' : oldHref,
                    'locationHref' : locationHref,
                    'pageType' : '',
                    'pageDetails' : {}
                };

                // new modmail
                if(location.host === 'mod.reddit.com') {

                    if (newMMlistingReg.test(location.pathname)) {
                        const matchDetails = location.pathname.match(newMMlistingReg);
                        contextObject.pageType = 'modmailListing';
                        contextObject.pageDetails = {
                            'listingType': matchDetails[1]
                        };

                    } else if (newMMconversationReg.test(location.pathname)) {
                        const matchDetails = location.pathname.match(newMMconversationReg);
                        contextObject.pageType = 'modmailListing';
                        contextObject.pageDetails = {
                            'conversationType' : matchDetails[1],
                            'conversationID' : matchDetails[2]
                        };

                    } else if (newMMcreate.test(location.pathname)) {
                        contextObject.pageType = 'createModmail';

                    } else {
                        contextObject.pageType = 'unknown';
                    }
                // other parts of reddit.
                } else {
                    if (redditFrontpageReg.test(location.pathname)) {
                        const matchDetails = location.pathname.match(redditFrontpageReg);
                        contextObject.pageType = 'frontpage';
                        contextObject.pageDetails = {
                            'sortType': matchDetails[1] || 'hot'
                        };
                    } else if (subredditFrontpageReg.test(location.pathname)) {
                        const matchDetails = location.pathname.match(subredditFrontpageReg);
                        contextObject.pageType = 'subredditFrontpage';
                        contextObject.pageDetails = {
                            'subreddit': matchDetails[1],
                            'sortType': matchDetails[2] || 'hot'
                        };
                    } else if (subredditCommentListingReg.test(location.pathname)) {
                        const matchDetails = location.pathname.match(subredditCommentListingReg);
                        contextObject.pageType = 'subredditCommentListing';
                        contextObject.pageDetails = {
                            'subreddit': matchDetails[1]
                        };
                    } else if (subredditCommentsPageReg.test(location.pathname)) {
                        const matchDetails = location.pathname.match(subredditCommentsPageReg);
                        contextObject.pageType = 'subredditCommentsPage';
                        contextObject.pageDetails = {
                            'subreddit': matchDetails[1],
                            'submissionID': matchDetails[2],
                            'linkSafeTitle': matchDetails[3]
                        };
                    } else if (subredditPermalinkCommentsPageReg.test(location.pathname)) {
                        const matchDetails = location.pathname.match(subredditPermalinkCommentsPageReg);
                        contextObject.pageType = 'subredditCommentPermalink';
                        contextObject.pageDetails = {
                            'subreddit': matchDetails[1],
                            'submissionID': matchDetails[2],
                            'linkSafeTitle': matchDetails[3],
                            'commentID': matchDetails[4]
                        };

                    } else if (queuePageReg.test(location.pathname)) {
                        const matchDetails = location.pathname.match(queuePageReg);
                        contextObject.pageType = 'queueListing';
                        contextObject.pageDetails = {
                            'subreddit': matchDetails[1],
                            'queueType': matchDetails[2]
                        };
                    } else if (userProfile.test(location.pathname)) {
                        const matchDetails = location.pathname.match(userProfile);
                        let listing = matchDetails[2];

                        // silly new profile bussines.
                        if (listing === 'posts') {
                            listing = 'submitted';
                        }
                        if (!listing) {
                            listing = 'overview';
                        }
                        contextObject.pageType = 'userProfile';
                        contextObject.pageDetails = {
                            'user': matchDetails[1],
                            'listing': listing
                        };
                    // "Unknown" pageType.
                    } else {
                        contextObject.pageType = 'unknown';
                    }
                }

                TBUtils.pageDetails = contextObject;

                // The timeout is there because locationHref can change before react is done rendering.
                setTimeout(function() {
                    window.dispatchEvent(new CustomEvent('TBNewPage', { detail : contextObject }));
                }, 500);

            }
            requestAnimationFrame(watchPushState);
        }

        watchPushState();
        // Watch for new things and send out events based on that.
        if(TBUtils.isNewModmail) {

        // For new modmail we do things a bit different.
        // We only listen for dom changes after a user interaction.
        // Resulting in this event being fired less and less wasted requests.
            let newThingRunning = false;

            document.body.addEventListener('click', function() {
                let newMMtarget = document.querySelector('body');

                // create an observer instance
                let newMMobserver = new MutationObserver(function (mutations) {

                    let doAddTbModmailSidebar = false;
                    let doTBNewThings = false;

                    mutations.forEach(function (mutation) {
                        let $target = $(mutation.target);

                        if ($target.find('.ThreadViewer__infobar').length > 0) {
                            doAddTbModmailSidebar = true;

                        }
                        if ($target.is('.Thread__message, .ThreadViewer, .Thread__messages')) {
                            doTBNewThings = true;

                        }
                    });

                    if (doAddTbModmailSidebar) {
                        $.log('DOM: new modmail sidebar found.', false, SHORTNAME);
                        addTbModmailSidebar();
                    }

                    if (doTBNewThings) {

                        $.log('DOM: processable elements found.', false, SHORTNAME);

                        // It is entirely possible that TBNewThings is fired multiple times.
                        // That is why we only set a new timeout if there isn't one set already.
                        if(!newThingRunning) {
                            newThingRunning = true;
                            // Wait a sec for stuff to load.
                            setTimeout(function () {
                                newThingRunning = false;
                                const event = new CustomEvent('TBNewThings');
                                window.dispatchEvent(event);
                            }, 1000);
                        }
                    }
                });

                // configuration of the observer:
                // We specifically want all child elements but nothing else.
                const newMMconfig = {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: true
                };

                // pass in the target node, as well as the observer options
                newMMobserver.observe(newMMtarget, newMMconfig);

                // Wait a bit for dom changes to occur and then disconnect it again.
                setTimeout(function () {
                    newMMobserver.disconnect();

                }, 2000);
            });

        } else if ($('#header').length) {
            let newThingRunning = false;
            // NER, load more comments, and mod frame support.
            const target = document.querySelector('div.content');

            // create an observer instance
            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    const $target = $(mutation.target), $parentNode = $(mutation.target.parentNode);
                    if (!($target.hasClass('sitetable') && ($target.hasClass('nestedlisting') || $target.hasClass('listing') || $target.hasClass('linklisting') ||
                    $target.hasClass('modactionlisting'))) && !$parentNode.hasClass('morecomments') && !$target.hasClass('flowwit')) return;

                    $.log(`TBNewThings firing from: ${$target.attr('class')}`, false, SHORTNAME);
                    // It is entirely possible that TBNewThings is fired multiple times.
                    // That is why we only set a new timeout if there isn't one set already.
                    if(!newThingRunning) {
                        newThingRunning = true;
                        // Wait a sec for stuff to load.
                        setTimeout(function () {
                            newThingRunning = false;
                            const event = new CustomEvent('TBNewThings');
                            window.dispatchEvent(event);
                        }, 1000);
                    }
                });
            });

            // configuration of the observer:
            // We specifically want all child elements but nothing else.
            const config = {
                attributes: false,
                childList: true,
                characterData: false,
                subtree: true
            };

            // pass in the target node, as well as the observer options
            observer.observe(target, config);
        }

        // NER support. todo: finish this.
        //window.addEventListener("neverEndingLoad", function () {
        //    $.log('NER! NER! NER! NER!');
        //});

        window.onbeforeunload = function () {
        // TBUI now handles the long load array.
            if (TBui.longLoadArray.length > 0) {
                return 'toolbox is still busy!';
            }

            // Cache data.
            TBStorage.setCache(SETTINGS_NAME, 'configCache', TBUtils.configCache);
            TBStorage.setCache(SETTINGS_NAME, 'noteCache', TBUtils.noteCache);
            TBStorage.setCache(SETTINGS_NAME, 'noConfig', TBUtils.noConfig);
            TBStorage.setCache(SETTINGS_NAME, 'noNotes', TBUtils.noNotes);
            TBStorage.setCache(SETTINGS_NAME, 'moderatedSubs', TBUtils.mySubs);
            TBStorage.setCache(SETTINGS_NAME, 'moderatedSubsData', TBUtils.mySubsData);

        // Just in case.
        //TBStorage.unloading();
        };

        // get toolbox news
        (function getNotes() {
            TBUtils.readFromWiki('toolbox', 'tbnotes', true, function (resp) {
                if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || resp.length < 1) return;

                // Custom FF nag for updates.
                if (resp.ffVersion > TBUtils.shortVersion && TBUtils.browser === FIREFOX && TBUtils.isExtension) {
                    TBUtils.alert('There is a new version of toolbox for Firefox!  Click here to update.', function (clicked) {
                        if (clicked) window.open(`http://toolbox-team.github.io/reddit-moderator-toolbox/downloads/reddit_mod_tb_${resp.ffVersion}.xpi`);
                    });
                    return; //don't spam the user with notes until they have the current version.
                }

                if (TBUtils.debugMode && resp.devVersion > TBUtils.shortVersion && TBUtils.isExtension) {
                    TBUtils.alert('There is a new development version of toolbox!  Click here to update.', function (clicked) {
                        if (clicked) window.open('https://github.com/toolbox-team/reddit-moderator-toolbox');
                    });
                }

                $(resp.notes).each(function () {
                    TBUtils.showNote(this);
                });
            });

            if (betaRelease) {
                TBUtils.readFromWiki('tb_redesign', 'tbnotes', true, function (resp) {
                    if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || resp.length < 1) return;
                    $(resp.notes).each(function () {
                        TBUtils.showNote(this);
                    });
                });
            }

            //check dev sub, if debugMode
            if (TBUtils.debugMode) {
                TBUtils.readFromWiki('tb_dev', 'tbnotes', true, function (resp) {
                    if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || resp.length < 1) {
                        TBUtils.devMode = false;
                        TBUtils.devModeLock = true;
                        return;
                    }

                    $(resp.notes).each(function () {
                        TBUtils.showNote(this);
                    });
                });
            }
        })();

        // get rate limit
        if (TBUtils.debugMode) {
            (function getRateLimit() {
                TBUtils.getRatelimit();
            })();
        }

    }(TBUtils = window.TBUtils || {}));
}

(function () {
    // wait for storage
    function getModSubs(after, callback) {

        let modSubs = [];
        $.getJSON('https://www.reddit.com/subreddits/mine/moderator.json',{
            'after': after,
            'limit': 100
        }, function (json) {
            modSubs = modSubs.concat(json.data.children);

            if(json.data.after) {
                getModSubs(json.data.after, function(subs) {
                    return callback(modSubs.concat(subs));
                });
            } else {
                return callback(modSubs);
            }
        }).fail(function(jqxhr, textStatus, error) {
            console.log(`getModSubs failed (${jqxhr.status}), ${textStatus}: ${error}`);
            console.log(jqxhr);
            if (jqxhr.status === 504) {
                console.log('504 Timeout retrying request');
                getModSubs(after, function(subs) {
                    return callback(modSubs.concat(subs));
                });

            }
            else {
                modSubs = [];
                return callback(modSubs);
            }
        });
    }

    function getUserDetails(callback) {

        $.getJSON('https://www.reddit.com/api/me.json', function (json) {
            console.log(json);
            callback(json);
        }).fail(function(jqxhr, textStatus, error) {
            console.log(`getUserDetails failed (${jqxhr.status}), ${textStatus}: ${error}`);
            console.log(jqxhr);
            if (jqxhr.status === 504) {
                console.log('504 Timeout retrying request');
                getUserDetails(function(details) {
                    return callback(details);
                });

            }
            else {
                return callback({error : error});
            }
        });
    }
    window.addEventListener('TBStorageLoaded2', function () {
        getUserDetails(function(userDetails) {
            if(userDetails.error) {
                console.log('Error: ', userDetails.error);
                return;
            }
            let modSubs = TBStorage.getCache('Utils', 'moderatedSubs', []);
            if (modSubs.length === 0) {
                console.log('No modsubs in cache, getting mod subs before initalizing');
                getModSubs(null, function(subs) {
                    initwrapper(userDetails, subs);
                    const event = new CustomEvent('TBUtilsLoaded2');
                    window.dispatchEvent(event);
                });

            } else {
                initwrapper(userDetails);
                const event = new CustomEvent('TBUtilsLoaded2');
                window.dispatchEvent(event);
            }
        });
    });
})();
