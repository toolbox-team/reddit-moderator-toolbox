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
        id = Math.floor(Math.random() * 9999),
        newlogin = (cachename != reddit.logged),
        getnewlong = (((now - lastgetlong) / (60 * 1000) > longlength) || newlogin),
        getnewshort = (((now - lastgetshort) / (60 * 1000) > shortlength) || newlogin);

    // Public variables
    TBUtils.version = 1;
    TBUtils.NO_WIKI_PAGE = 'NO_WIKI_PAGE';
    TBUtils.WIKI_PAGE_UNKNOWN = 'WIKI_PAGE_UNKNOWN';
    TBUtils.isModmail = location.pathname.match(/\/message\/(?:moderator)\/?/);
    TBUtils.isModpage = location.pathname.match(/\/about\/(?:reports|modqueue|spam|unmoderated|trials)\/?/);
    TBUtils.isEditUserPage = location.pathname.match(/\/about\/(?:contributors|moderator|banned)\/?/);
    TBUtils.isExtension = (typeof chrome !== "undefined" && chrome.extension);
    
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
        ver: 1,
        users: [] //typeof userNotes
    };

    TBUtils.note = {
        note: '',
        time: '',
        mod: '',
        link: ''
    };

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
        var storageKey = 'Toolbox.'+ module +'.'+ setting;
        
        if (value !== undefined) {
            localStorage[storageKey] = JSON.stringify(value);
        }
        
        var keyval = localStorage[storageKey];
        
        if (keyval === undefined) return defaultVal;
        
        return JSON.parse(keyval);
    };
    
    TBUtils.notification = function (title, body, url) {

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
                'autoclose': 15000 // integer or false
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
                            setTimeout(notification.close(), 15000);
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
                    setTimeout(function () {
                        event.currentTarget.cancel();
                    }, 10000);
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
                $('<div id="tb-notification-permission">An toolbox script would like to use native desktop notifications. Click here to allow or deny this, when denied the it will use build in notifications <br>Note: notifications can be disabled in preferences.</div>').appendTo('body').click(function () {
                    window.webkitNotifications.requestPermission();
                    // We could build in a function to show the notifcation that prompted this whole function, but since it is likely a one time occurence I thought it would be a bit over the top.
                    $(this).remove();
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

    TBUtils.getThingInfo = function (thing, modCheck) {

        var user = $(thing).find('.author:first').text(),
            subreddit = reddit.post_site || $('.titlebox h1.redditname a').text(),
            permalink = $(thing).closest('.entry').find('a.bylink').attr('href'),
            domain = $(thing).find('span.domain:first').text().replace('(', '').replace(')', '');

        if (TBUtils.isEditUserPage && !user) {
            user = $(thing).closest('.user').find('a:first').text();
        }

        // Try again.
        if (!user) {
            user = $(thing).closest('.entry').find('.author:first').text();
        }

        // Might be a submission.
        if (!permalink) {
            permalink = $(thing).closest('.entry').find('a.comments').attr('href');
        }
        
        if (!permalink) {
            permalink = $(thing).find('.buttons:first .first a').attr('href');
        }

        if (!subreddit) {
            subreddit = $(thing).closest('.entry').find('.subreddit').text();
        }

        if (!subreddit) {
            subreddit = $(thing).closest('.thing').find('.subreddit').text();
        }
        
        if (!subreddit) {
            subreddit = $(thing).children('.thing').find('.subreddit').text();
        }

        // If we still don't have a sub, we're in mod mail
        if (!subreddit) {
            subreddit = $(thing).find('.head a:last').text().replace('/r/', '').replace('/', '').trim();

            //user: there is still a chance that this is mod mail, but we're us.
            //This is a weird palce to go about this, and the conditions are strange,
            //but if we're going to assume we're us, we better make damned well sure that is likely the case.
            if (!user && $(thing).find('.remove-button').text() === '') {
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
        if (array == null) return;
        if (chunkSize == null || chunkSize < 1) return;
        if (delay == null || delay < 0) return;
        if (call == null) return;
        var counter = 0;
        var length = array.length;

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

    TBUtils.compressHTML = function (src) {
        return src.replace(/(\n+|\s+)?&lt;/g, '<').replace(/&gt;(\n+|\s+)?/g, '>').replace(/&amp;/g, '&').replace(/\n/g, '').replace(/child" >  False/, 'child">');
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

}(TBUtils = window.TBUtils || {}));


}

(function () {
    var m = document.createElement('script');
    m.textContent = "(" + main.toString() + ')();';
    document.head.appendChild(m);
})();