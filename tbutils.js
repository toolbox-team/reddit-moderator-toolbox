function main() {

(function (TBUtils) {
    //Private variables
    var modMineURL = 'http://www.reddit.com/subreddits/mine/moderator.json?count=100',
        now = new Date().getTime(),
        lastgetlong = JSON.parse(localStorage['Toolbox.cache.lastgetlong'] || -1),
        lastgetshort = JSON.parse(localStorage['Toolbox.cache.lastgetshort'] || -1),
        shortlength = JSON.parse(localStorage['Toolbox.cache.shortlength'] || 15),
        longlength = JSON.parse(localStorage['Toolbox.cache.longlength'] || 45),
        cachename = localStorage['Toolbox.cache.cachename'] || '',
        seennotes = JSON.parse(localStorage['Toolbox.Utils.seennotes'] || '[]'),
        //notelastshown = JSON.parse(localStorage['Toolbox.Utils.notelastshown'] || -1), //TODO: add
        id = Math.floor(Math.random() * 9999),
        newlogin = (cachename != reddit.logged),
        getnewlong = (((now - lastgetlong) / (60 * 1000) > longlength) || newlogin),
        getnewshort = (((now - lastgetshort) / (60 * 1000) > shortlength) || newlogin);

    // Public variables
    TBUtils.version = 1;
    TBUtils.NO_WIKI_PAGE = 'NO_WIKI_PAGE';
    TBUtils.WIKI_PAGE_UNKNOWN = 'WIKI_PAGE_UNKNOWN';
    TBUtils.isModmail = location.pathname.match(/\/message\/(?:moderator)\/?/);
    TBUtils.isModmailUnread = location.pathname.match(/\/message\/(?:moderator\/unread)\/?/);
    TBUtils.isModpage = location.pathname.match(/\/about\/(?:reports|modqueue|spam|unmoderated|trials)\/?/);
    TBUtils.isEditUserPage = location.pathname.match(/\/about\/(?:contributors|moderator|banned)\/?/);
    //TBUtils.isExtension = (typeof chrome !== "undefined" && chrome.extension), //TODO: fix
    TBUtils.log = '';

    // Cache vars.
    TBUtils.noteCache = (getnewshort) ? {} : JSON.parse(localStorage['Toolbox.cache.notecache'] || '{}');
    TBUtils.configCache = (getnewlong) ? {} : JSON.parse(localStorage['Toolbox.cache.configcache'] || '{}');
    TBUtils.noConfig = (getnewshort) ? [] : JSON.parse(localStorage['Toolbox.cache.noconfig'] || '[]');
    TBUtils.noNotes = (getnewshort) ? [] : JSON.parse(localStorage['Toolbox.cache.nonotes'] || '[]');
    TBUtils.mySubs = (getnewlong) ? [] : JSON.parse(localStorage['Toolbox.cache.moderatedsubs'] || '[]');

    // Update cache vars as needed.
    if (newlogin) {
        localStorage['Toolbox.cache.cachename'] = reddit.logged;
    }

    if (getnewlong) {
        localStorage['Toolbox.cache.lastgetlong'] = JSON.stringify(now);
    }

    if (getnewshort) {
        localStorage['Toolbox.cache.lastgetshort'] = JSON.stringify(now);
    }

    TBUtils.usernotes = {
        ver: 2,
        users: [] //typeof userNotes
    };

    TBUtils.note = {
        note: '',
        time: '',
        mod: '',
        link: '',
        type: ''
    };

    TBUtils.warningType = ['spamwatch', 'spamwarn', 'abusewarn', 'ban', 'permban', 'botban'];

    TBUtils.config = {
        ver: 1,
        domainTags: '',
        removalReasons: '',
        modMacros: '',
    };

    TBUtils.getID = function (callback) {
        callback(id);
    };

    TBUtils.setting = function (module, setting, defaultVal, value) {
        var storageKey = 'Toolbox.' + module + '.' + setting;

        if (value !== undefined) {
            localStorage[storageKey] = JSON.stringify(value);
        }

        var keyval = localStorage[storageKey];

        if (keyval === undefined) return defaultVal;

        return JSON.parse(keyval);
    };

    TBUtils.getTypeInfo = function (warningType) {
        var typeInfo = {
            name: '',
            color: '',
            text: ''
        };

        switch (String(warningType)) { //not sure why it gets passed as an array.
        case 'spamwatch':
            typeInfo = { color: 'fuchsia', name: 'Watching', text: 'Spam Watch' };
            break;
        case 'spamwarn':
            typeInfo = { color: 'purple', name: 'Warned', text: 'Spam Warning' };
            break;
        case 'abusewarn':
            typeInfo = { color: 'orange', name: 'Warned', text: 'Abuse Warning' };
            break;
        case 'ban':
            typeInfo = { color: 'red', name: 'Banned', text: 'Ban' };
            break;
        case 'permban':
            typeInfo = { color: 'darkred', name: 'Perma-banned', text: 'Permanent Ban' };
            break;
        case 'botban':
            typeInfo = { color: 'black', name: 'Bot Banned', text: 'Shadow Ban' };
            break;
        default:
            typeInfo = { color: '', name: '', text: 'none' };
        }

        return typeInfo;
    };

    TBUtils.alert = function (message, callback) {
        $('<div id="tb-notification-alert">' + message + '</div>').appendTo('body').click(function () {
            $(this).remove();
            callback();
        });
    };

    TBUtils.showNote = function (note) {
        if (!note.id || !note.text) return;

        if ($.inArray(note.id, seennotes) === -1) {
            TBUtils.setting('Utils', 'notelastshown', '', now);

            TBUtils.alert(TBUtils.htmlDecode(note.text), function () {
                seennotes.push(note.id);
                TBUtils.setting('Utils', 'seennotes', '', seennotes);
                if (note.link) window.open(note.link);
            });
        }
    };

    TBUtils.notification = function (title, body, url, timeout) {
        if (timeout === undefined) timeout = 15000;

        var toolboxnotificationenabled = true;
        // check if notifications are enabled. When they are not we simply abort the function. 
        if (toolboxnotificationenabled === false) {
            //console.log('notifications disabled, stopping function');
            return;
        }

        // fallback notifications if the browser does not support notifications or the users does not allow them. 
        // Adapted from Sticky v1.0 by Daniel Raftery
        // http://thrivingkings.com/sticky

        // Using it without an object
        $.sticky = function (note, options, callback) {
            return $.fn.sticky(note, options, callback);
        };

        $.fn.sticky = function (note, options, callback) {
            // Default settings
            var position = 'bottom-right'; // top-left, top-right, bottom-left, or bottom-right 

            var settings = {
                'speed': 'fast', // animations: fast, slow, or integer
                'duplicates': true, // true or false
                'autoclose': timeout // integer or false
            };

            // Passing in the object instead of specifying a note
            if (!note) {
                note = this.html();
            }

            if (options) {
                $.extend(settings, options);
            }

            // Variables
            var display = true;
            var duplicate = 'no';

            // Somewhat of a unique ID
            var uniqID = Math.floor(Math.random() * 99999);

            // Handling duplicate notes and IDs
            $('.sticky-note').each(function () {
                if ($(this).html() == note && $(this).is(':visible')) {
                    duplicate = 'yes';
                    if (!settings.duplicates) {
                        display = false;
                    }
                }
                if ($(this).attr('id') == uniqID) {
                    uniqID = Math.floor(Math.random() * 9999999);
                }
            });

            // Make sure the sticky queue exists
            if (!$('body').find('.sticky-queue').html()) {
                $('body').append('<div class="sticky-queue ' + position + '"></div>');
            }

            // Can it be displayed?
            if (display) {
                // Building and inserting sticky note
                $('.sticky-queue').prepend('<div class="sticky border-' + position + '" id="' + uniqID + '"></div>');
                $('#' + uniqID).append('<img src="http://creesch.github.io/reddit-declutter/close.png" class="sticky-close" rel="' + uniqID + '" title="Close" />');
                $('#' + uniqID).append('<div class="sticky-note" rel="' + uniqID + '">' + note + '</div>');

                // Smoother animation
                var height = $('#' + uniqID).height();
                $('#' + uniqID).css('height', height);

                $('#' + uniqID).slideDown(settings.speed);
                display = true;
            }

            // Listeners
            $('.sticky').ready(function () {
                // If 'autoclose' is enabled, set a timer to close the sticky
                if (settings.autoclose) {
                    $('#' + uniqID).delay(settings.autoclose).fadeOut(settings.speed);
                }
            });
            // Closing a sticky
            $('.sticky-close').click(function () {
                $('#' + $(this).attr('rel')).dequeue().fadeOut(settings.speed);
            });

            // Callback data
            var response = {
                'id': uniqID,
                'duplicate': duplicate,
                'displayed': display,
                'position': position
            };

            // Callback function?
            if (callback) {
                callback(response);
            } else {
                return (response);
            }

        };

        if (!window.Notification && !window.webkitNotifications) {
            // fallback on a javascript notification 
            //console.log('boring old rickety browser, falling back on jquery based notifications');
            $.sticky('<strong>' + title + '</strong><br><p><a href="' + url + '">' + body + '<a></p>');

        } else if (window.Notification && navigator.userAgent.indexOf("Firefox") !== -1) {
            // Do some stuff with window notification for firefox versions that support notifications
            //console.log('firefox and it supports notifications');

            // Let's check if the user has granted us permission and if not ask it. 
            window.Notification.requestPermission(function (perm) {
                if (perm == 'granted') {
                    // if everything checks out we can finally show the notification
                    //console.log('granted');
                    //console.log('firefox notification!');

                    // create the notification    
                    new window.Notification(title, {
                        dir: "auto",
                        body: body,
                        icon: "http://creesch.github.io/reddit-declutter/reddit-icon.png",
                        onshow: function () {
                            if (timeout) setTimeout(this.close(), timeout);
                        },
                        onclick: function () {
                            // Open the page
                            window.open(url);
                            // Remove notification
                            this.cancel();
                        }
                    });
                }
            });
        } else if (window.webkitNotifications) {
            // use the webkit variant for chrome based browsers
            //console.log('using webkit variant of notifications');

            if (window.webkitNotifications.checkPermission() === 0) {
                // if everything checks out we can finally show the notification
                //console.log('webkit notification!');

                // create the notification    
                var toolboxnotification = window.webkitNotifications.createNotification('http://creesch.github.io/reddit-declutter/reddit-icon.png', title, body);

                // Auto-hide after a while
                toolboxnotification.ondisplay = function (event) {
                    if (timeout) {
                        setTimeout(function () {
                            event.currentTarget.cancel();
                        }, timeout);
                    }
                };

                // Define what happens when the notification is clicked. 
                toolboxnotification.onclick = function () {
                    // Open the page
                    window.open(url);
                    // Remove notification
                    this.cancel();
                };
                // Remove notification
                toolboxnotification.show();

            } else if (window.webkitNotifications.checkPermission() == 2) {
                // fallback on a javascript notification if permission is not given. 
                //console.log('User will not let us use notifications, fall back on internal version');
                $.sticky('<strong>' + title + '</strong><br><p><a href="' + url + '">' + body + '<a></p>');

            } else {
                // Ask for permission. 
                var message = 'Toolbox would like to use native desktop notifications. Click here to allow or deny this, when denied the it will use build in notifications <br>Note: notifications can be disabled in preferences.';
                TBUtils.alert(message, function () {
                    window.webkitNotifications.requestPermission();
                    // We could build in a function to show the notifcation that prompted this whole function, but since it is likely a one time occurence I thought it would be a bit over the top.
                });
            }
        }

    };

    TBUtils.getModSubs = function (callback) {

        // If it has been more than ten minutes, refresh mod cache.
        if (TBUtils.mySubs.length < 1) {
            TBUtils.mySubs = []; //resent list.
            getSubs(modMineURL);
        } else {
            TBUtils.mySubs = TBUtils.saneSort(TBUtils.mySubs);

            // Go!
            callback();
        }

        function getSubs(URL) {
            $.getJSON(URL, function (json) {
                getSubsResult(json.data.children, json.data.after);
            });
        }

        // Callback because reddits/mod/mine is paginated.

        function getSubsResult(subs, after) {
            $(subs).each(function () {
                var sub = this.data.display_name.trim();
                if ($.inArray(sub, TBUtils.mySubs) === -1)
                    TBUtils.mySubs.push(sub);
            });

            if (after) {
                var URL = modMineURL + '&after=' + after;
                getSubs(URL);
            } else {
                TBUtils.mySubs = TBUtils.saneSort(TBUtils.mySubs);

                // Update the cache.
                localStorage['Toolbox.cache.moderatedsubs'] = JSON.stringify(TBUtils.mySubs);

                // Go!
                callback();
            }
        }
    };

    // Because normal .sort() is case sensitive.
    TBUtils.saneSort = function (arr) {
        return arr.sort(function (a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
        });
    };

    TBUtils.getThingInfo = function (sender, modCheck) {
        var entry = $(sender).closest('.entry') || sender;
        var thing = $(sender).closest('.thing') || sender;

        var user = $(entry).find('.author:first').text() || $(thing).find('.author:first').text(),
            subreddit = reddit.post_site || $(entry).find('.subreddit').text() || $(thing).find('.subreddit').text(),
            permalink = $(entry).find('a.bylink').attr('href') || $(entry).find('.buttons:first .first a').attr('href') || $(thing).find('a.bylink').attr('href') || $(thing).find('.buttons:first .first a').attr('href'),
            domain = ($(entry).find('span.domain:first').text() || $(thing).find('span.domain:first').text()).replace('(', '').replace(')', '');

        if (TBUtils.isEditUserPage && !user) {
            user = $(sender).closest('.user').find('a:first').text() || $(entry).closest('.user').find('a:first').text() || $(thing).closest('.user').find('a:first').text();
        }

        // If we still don't have a sub, we're in mod mail, or PMs.
        if (!subreddit) {
            subreddit = ($(entry).find('.head a:last').text() || $(thing).find('.head a:last').text()).replace('/r/', '').replace('/', '').trim();

            //user: there is still a chance that this is mod mail, but we're us.
            //This is a weird palce to go about this, and the conditions are strange,
            //but if we're going to assume we're us, we better make damned well sure that is likely the case.
            if (!user && ($(entry).find('.remove-button') || $(thing).find('.remove-button')).text() === '') {
                user = reddit.logged;

                if (!subreddit) {
                    // Find a better way, I double dog dare ya!
                    subreddit = $(thing).closest('.message-parent').find('.correspondent.reddit.rounded a').text()
                        .replace('/r/', '').replace('[-]', '').replace('[+]', '').trim();
                }
            }
        }

        // Not a mod, reset current sub.
        if (modCheck && $.inArray(subreddit, TBUtils.mySubs) === -1) {
            subreddit = '';
        }

        if (user == '[deleted]') {
            user = '';
        }

        return {
            subreddit: subreddit,
            user: user,
            permalink: permalink,
            domain: domain
        };
    };

    // Prevent page lock while parsing things.  (stolen from RES)
    TBUtils.forEachChunked = function (array, chunkSize, delay, call, complete) {
        if (array === null) return;
        if (chunkSize === null || chunkSize < 1) return;
        if (delay === null || delay < 0) return;
        if (call === null) return;
        var counter = 0;
        //var length = array.length;

        function doChunk() {
            for (var end = Math.min(array.length, counter + chunkSize); counter < end; counter++) {
                var ret = call(array[counter], counter, array);
                if (ret === false) return;
            }
            if (counter < array.length) {
                window.setTimeout(doChunk, delay);
            } else {
                if (complete) complete();
            }
        }
        window.setTimeout(doChunk, delay);
    };

    TBUtils.postToWiki = function (page, subreddit, data, isJSON, updateAM, callback) {

        if (isJSON) {
            data = JSON.stringify(data, undefined, 2);
        }

        $.post('/r/' + subreddit + '/api/wiki/edit', {
            content: data,
            page: page,
            reason: 'updated via toolbox config',
            uh: reddit.modhash
        })

        .error(function (err) {
            callback(false, err.responseText);
        })

        .success(function () {
            // Callback regardless of what happens next.  We wrote to the page.
            callback(true);

            if (updateAM) {
                $.post('/api/compose', {
                    to: 'automoderator',
                    uh: reddit.modhash,
                    subject: subreddit,
                    text: 'update'
                })
                    .success(function () {
                        alert('sucessfully sent update PM to automoderator');
                    })
                    .error(function () {
                        alert('error sending update PM to automoderator');
                        window.location = 'http://www.reddit.com/message/compose/?to=AutoModerator&subject=' + subreddit + '&message=update';
                    });
            }

            setTimeout(function () {

                // hide the page
                $.post('/r/' + subreddit + '/wiki/settings/' + page, {
                    permlevel: 2,
                    uh: reddit.modhash
                })

                // Super extra double-secret secure, just to be safe.
                .error(function (err) {
                    alert('error setting wiki page to mod only access');
                    window.location = 'http://www.reddit.com/r/' + subreddit + '/wiki/settings/' + page;
                });

            }, 500);
        });
    };

    TBUtils.readFromWiki = function (subreddit, page, isJSON, callback) {

        $.getJSON('http://www.reddit.com/r/' + subreddit + '/wiki/' + page + '.json', function (json) {
            var wikiData = json.data.content_md;

            if (!wikiData) {
                callback(TBUtils.NO_WIKI_PAGE);
                return;
            }

            if (isJSON) {
                wikiData = JSON.parse(wikiData);
                if (wikiData) {
                    callback(wikiData);
                } else {
                    callback(TBUtils.NO_WIKI_PAGE);
                }
                return;
            }

            // We have valid data, but it's not JSON.
            callback(wikiData);
            return;

        }).error(function (e) {
            if (!e.responseText) {
                callback(TBUtils.WIKI_PAGE_UNKNOWN);
                return;
            }

            var reason = JSON.parse(e.responseText).reason || '';
            if (reason == 'PAGE_NOT_CREATED' || reason == 'WIKI_DISABLED') {
                callback(TBUtils.NO_WIKI_PAGE);
            } else {
                // we don't know why it failed, we should not try to write to it.
                callback(TBUtils.WIKI_PAGE_UNKNOWN);
            }
        });
    };

    // Needs to be replaced. 
    TBUtils.compressHTML = function (src) {
        console.log('TBUtils.compressHTML() is deprcated.  Use TBUtils.htmlDecode()');
        return TBUtils.htmlDecode(src);
        //return src.replace(/(\n+|\s+)?&lt;/g, '<').replace(/&gt;(\n+|\s+)?/g, '>').replace(/&amp;/g, '&').replace(/\n/g, '').replace(/child" >  False/, 'child">');
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

    TBUtils.getReasosnFromCSS = function (sub, callback) {

        // If not, build a new one, getting the XML from the stylesheet
        $.get('http://www.reddit.com/r/' + sub + '/about/stylesheet.json').success(function (response) {
            if (!response.data) {
                callback(false);
                return;
            }

            // See if this subreddit is configured for leaving reasons using <removalreasons2>
            var match = response.data.stylesheet.replace(/\n+|\s+/g, ' ')
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
            var XML = $(match[0]);
            var reasons = [];

            XML.find('reason').each(function () {
                var reason = {
                    text: escape(this.innerHTML)
                };
                reasons.push(reason);
            });

            var oldReasons = {
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
        }).error(function () {
            callback(false);
        });
    };

    window.onbeforeunload = function () {

        // Cache data.
        localStorage['Toolbox.cache.configcache'] = JSON.stringify(TBUtils.configCache);
        localStorage['Toolbox.cache.notecache'] = JSON.stringify(TBUtils.noteCache);
        localStorage['Toolbox.cache.noconfig'] = JSON.stringify(TBUtils.noConfig);
        localStorage['Toolbox.cache.nonotes'] = JSON.stringify(TBUtils.noNotes);

    };

    (function ($) {
        $.fn.log = function (message, skip) {
            if (TBUtils.log !== undefined) {
                TBUtils.log += message + '\n';
            } else {
                console.log('TB: ' + message);
            }
        }
        $.log = function (message, skip) {
            if (!TBUtils.setting('Utils', 'debugMode', false)) return;

            if (skip) {
                console.log('TB [' + arguments.callee.caller.name + ']: ' + message);
                return;
            }
            if (typeof message === 'object') {
                if (message instanceof jQuery) {
                    message = 'jQuery object:\n' + $('<div>').append($(message).clone()).html();
                } else {
                    try {
                        message = 'Object:\n' + JSON.stringify(message);
                    } catch (e) {
                        console.log('TB Console could not convert: ');
                        console.log(message);
                        message = String(message) + ' (error converting object see broswer console)\nError Message: ' + e.message;
                    }
                }
            }

            var lines = String(TBUtils.log.split('\n').length);
            if (lines.length === 1) lines = '0' + lines;
            if (lines.length === 2) lines = '0' + lines;
            var msg = lines + ' [' + arguments.callee.caller.name + ']: ' + message;
            return $.fn.log(msg);
        };
    })(jQuery);

    // get toolbox news
    (function getNotes() {
        TBUtils.readFromWiki('toolbox', 'tbnotes', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || resp.length < 1) return;
            $(resp.notes).each(function () {
                TBUtils.showNote(this);
            });
        });
    })();

}(TBUtils = window.TBUtils || {}));

}

(function () {
    var m = document.createElement('script');
    m.textContent = "(" + main.toString() + ')();';
    document.head.appendChild(m);
})();