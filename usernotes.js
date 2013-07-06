// ==UserScript==
// @name        Mod User Notes
// @namespace   http://www.reddit.com/r/toolbox
// @author      agentlame, creesch
// @description Create and display user notes for mods.
// @include     *://www.reddit.com/*
// @include     *://reddit.com/*
// @include     *://*.reddit.com/*
// @downloadURL http://userscripts.org/scripts/source/170091.user.js
// @version     1.3
// ==/UserScript==

function usernotes() {
    if (!reddit.logged || !TBUtils.setting('UserNotes', 'enabled', true)) return;

    var subs = [];

    TBUtils.getModSubs(function () {
        run();
    });

    function postToWiki(sub, json) {
        TBUtils.noteCache[sub] = json;

        TBUtils.postToWiki('usernotes', sub, json, true, false, function done(succ, err) {
            if (succ) {
                run();
            } else {
                console.log(err.responseText);
            }
        });
    }

    // RES NER support.
    $('div.content').on('DOMNodeInserted', function (e) {
        if (e.target.parentNode.id && e.target.parentNode.id === 'siteTable' && e.target.className.match(/sitetable/)) {
            run();
        }

        // Fixes expanding bug in mod mail.
        if ($(e.target).hasClass('clearleft')) {
            setTimeout(function () {
                run();
            }, 1000);
        }
    });

    function processThing(thing) {

        if ($(thing).hasClass('ut-processed')) {
            return;
        }
        $(thing).addClass('ut-processed');

        var subreddit = TBUtils.getThingInfo(thing, true).subreddit;

        if (!subreddit) return;

        var tag = '<span style="color:#888888; font-size:x-small;">&nbsp;[<a class="add-user-tag-' +
            subreddit + '" id="add-user-tag" "href="javascript:;">N</a>]</span>';

        $(thing).attr('subreddit', subreddit);

        // More mod mail hackery... all this to see your own tags in mod mail.  It's likely not worth it.
        var userattrs = $(thing).find('.userattrs');
        if ($(userattrs).html() != null) {
            $(userattrs).after(tag);
        } else {
            $(thing).find('.head').after(tag);
        }

        if ($.inArray(subreddit, subs) == -1) {
            subs.push(subreddit);
        }
    }

    function processSub(currsub) {
        if (TBUtils.noteCache[currsub] !== undefined) {
            setNotes(TBUtils.noteCache[currsub], currsub);
            return;
        }

        if (!currsub || TBUtils.noNotes.indexOf(currsub) != -1) return;

        TBUtils.readFromWiki(currsub, 'usernotes', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                return;
            }

            if (resp === TBUtils.NO_WIKI_PAGE) {
                TBUtils.noNotes.push(currsub);
                return;
            }

            if (!resp || resp.length < 1) {
                TBUtils.noNotes.push(currsub);
                return;
            }

            TBUtils.noteCache[currsub] = resp;
            setNotes(resp, currsub);
        });
    }

    function setNotes(notes, subreddit) {

        var things = $('div.thing .entry[subreddit=' + subreddit + ']');
        TBUtils.forEachChunked(things, 25, 250, function (thing) {
            var user = TBUtils.getThingInfo(thing).user;

            $.grep(notes.users, function (u) {

                if (u.name == user) {
                    var usertag = $(thing).find('.add-user-tag-' + subreddit);

                    // Only happens if you delete the last note.
                    if (u.notes.length < 1) {
                        $(usertag).css('color', '');
                        $(usertag).text('N');
                        return;
                    }

                    $(usertag).css('color', 'red');

                    if (u.notes.length == 1 && u.notes[0].note.length < 60) {
                        $(usertag).text(unescape(u.notes[0].note));
                    } else {
                        $(usertag).text('N:' + u.notes.length);
                    }
                }
            });
        });
    }

    function run() {
        var things = $('div.thing .entry:not(.ut-processed)');

        TBUtils.forEachChunked(things, 25, 500, processThing, function () {
            TBUtils.forEachChunked(subs, 10, 500, processSub);
        });
    }

    $('body').delegate('#add-user-tag', 'click', function (e) {
        var thing = $(e.target).closest('.thing .entry'),
            info = TBUtils.getThingInfo(thing),
            subreddit = info.subreddit,
            user = info.user,
            link = info.permalink;

        // Make box & add subreddit radio buttons
        var popup = $('\
                    <div class="utagger-popup">\
                    <span>/u/' + user + ': <span><input type="text" class="user-note" user="' + user + '" subreddit="' + subreddit + '" link= "' + link + '"/>\
                    <input class="save-user" type="button" value="save for /r/' + subreddit + '"/>\
                    <input class="cancel-user" type="button" value="cancel"/>\
                    <label><input class="include-link" type="checkbox" checked/>include link</label<br><br>\
                    <table class="utagger-notes"><tr><td class="utagger-notes-td1">Author</td><td class="utagger-notes-td2">Note</td><td class="utagger-notes-td3"></td></tr></table>\
                    <div>')
            .appendTo('body')
            .css({
                left: e.pageX - 50,
                top: e.pageY - 10,
                display: 'block'
            });

        TBUtils.readFromWiki(subreddit, 'usernotes', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || resp.length < 1) {
                notEnabled.push(currsub);
                return;
            }

            TBUtils.noteCache[subreddit] = resp;

            $.grep(resp.users, function (u) {
                if (u.name == user) {

                    var i = 0;
                    $(u.notes).each(function () {
                        popup.find('table.utagger-notes').append('<tr><td class="utagger-notes-td1">' + this.mod + ' <br> <span class="utagger-date" id="utagger-date-' + i + '">' + new Date(this.time).toLocaleString() + '</span></td><td lass="utagger-notes-td2">' + unescape(this.note) + '</td><td class="utagger-notes-td3"><a class="utagger-remove-note" noteid="' + this.time + '" href="javascript:;">X</a></td></tr>');
                        if (this.link) {
                            popup.find('#utagger-date-' + i).wrap('<a href="' + this.link + '">');
                        }
                        i++;
                    });
                }
            });
        });
    });

    $('body').delegate('.save-user, .utagger-remove-note', 'click', function (e) {
        var popup = $(this).closest('.utagger-popup'),
            subreddit = popup.find('.user-note').attr('subreddit'),
            user = popup.find('.user-note').attr('user'),
            noteid = $(e.target).attr('noteid'),
            noteText = popup.find('.user-note').val(),
            deleteNote = (e.target.className == 'utagger-remove-note'),
            link = '',
            note = TBUtils.note,
            notes = TBUtils.usernotes;

        if (popup.find('.include-link').is(':checked')) {
            link = popup.find('.user-note').attr('link');
        }

        if ((!user || !subreddit || !noteText) && !deleteNote) return;

        note = {
            note: escape(noteText),
            time: new Date().getTime(),
            mod: reddit.logged,
            link: link
        };

        var userNotes = {
            name: user,
            notes: []
        };

        userNotes.notes.push(note);

        $(popup).remove();

        TBUtils.readFromWiki(subreddit, 'usernotes', true, function (resp) {
            if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                return;
            }

            if (resp === TBUtils.NO_WIKI_PAGE) {
                notes.users.push(userNotes);
                postToWiki(subreddit, notes);
                return;
            }

            // if we got this far, we have valid JSON
            notes = resp;

            if (notes) {
                var results = $.grep(notes.users, function (u) {
                    if (u.name == user) {

                        // Delete. 
                        if (deleteNote) {
                            $(u.notes).each(function (idx) {

                                if (this.time == noteid) {
                                    u.notes.splice(idx, 1);
                                }
                            });

                            postToWiki(subreddit, notes);
                            return true;

                            // Add.
                        } else {
                            u.notes.unshift(note);
                            postToWiki(subreddit, notes);
                            return u;
                        }
                    }
                });

                if ((!results || results.length < 1) && !deleteNote) {
                    notes.users.push(userNotes);
                    postToWiki(subreddit, notes);
                }
            } else {
                notes.users.push(userNotes);
                postToWiki(subreddit, notes);
            }
        });
    });

    $('body').delegate('.cancel-user', 'click', function () {
        var popup = $(this).closest('.utagger-popup');
        $(popup).remove();
    });
}

// Add script to page
(function () {
    
    // Check if we are running as an extension
    if (typeof chrome !== "undefined" && chrome.extension) {
        init();
        return;
    } 
    
    // Check if TBUtils has been added.
    if (!window.TBUadded) {
        window.TBUadded = true;
        
        var utilsURL = 'http://agentlame.github.io/toolbox/tbutils.js';
        var cssURL = 'http://agentlame.github.io/toolbox/tb.css';
        $('head').prepend('<script type="text/javascript" src=' + utilsURL + '></script>');
        $('head').prepend('<link rel="stylesheet" type="text/css" href="'+ cssURL +'"></link>');
    }
    
    // Do not add script to page until TBUtils is added.
    (function loadLoop() {
        setTimeout(function () {
            if (typeof TBUtils !== "undefined") {
                init();
            } else {
                loadLoop();
            }
        }, 100);
    })();
    
    function init() {
        var s = document.createElement('script');
        s.textContent = "(" + usernotes.toString() + ')();';
        document.head.appendChild(s);
    }
})();