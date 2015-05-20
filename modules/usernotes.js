function usernotes() {
var self = new TB.Module('User Notes');
self.shortname = 'UserNotes';

////Default settings
self.settings['enabled']['default'] = true;

self.register_setting('unManagerLink', {
    'type': 'boolean',
    'default': true,
    'title': 'Show usernotes manager in modbox'
});
self.register_setting('showDate', {
    'type': 'boolean',
    'default': false,
    'title': 'Show date in note preview'
});
self.register_setting('showOnModPages', {
    'type': 'boolean',
    'default': false,
    'title': 'Show current usernote on ban/contrib/mod pages'
});
self.register_setting('maxChars', {
    'type': 'number',
    'default': 20,
    'title': 'Max characters to display in current note tag (excluding date)'
});

self.init = function () {
    self.usernotesManager();
    self.usernotes();
};

self.usernotes = function usernotes() {
    var subs = [],
        $body = $('body'),
        maxChars = self.setting('maxChars'),
        showDate = self.setting('showDate'),
        showOnModPages = self.setting('showOnModPages');

    TBUtils.getModSubs(function () {
        run();
    });

    function getUser(users, name) {
        if (users.hasOwnProperty(name)) {
            return users[name];
        }
        return undefined;
    }

    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();
    });

    function processThing(thing) {
        var $thing = $(thing);

        if ($thing.hasClass('ut-processed')) {
            return;
        }
        $thing.addClass('ut-processed');

        var subreddit = TBUtils.getThingInfo(thing, true).subreddit;

        if (!subreddit) return;

        var tag = '<span class="usernote-span-' +
            subreddit + '" style="color:#888888; font-size:x-small;">&nbsp;[<a class="add-user-tag-' +
            subreddit + '" id="add-user-tag" "href="javascript:;">N</a>]</span>';

        $thing.attr('subreddit', subreddit);

        // More mod mail hackery... all this to see your own tags in mod mail.  It's likely not worth it.
        var userattrs = $thing.find('.userattrs');
        if ($(userattrs).length > 0) {
            if (TBUtils.isModmail && $(userattrs).length > 1) {
                $(userattrs).eq(0).after(tag);
            } else {
                $(userattrs).after(tag);
            }
        } else {
            // moar mod mail fuckery.  Cocksucking motherfucking hell.
            // don't show your own tag after 'load full conversation'
            var $head = $thing.find('.head');
            if ($head.find('recipient') > 0) {
                $head.append(tag);
            }
        }

        if ($.inArray(subreddit, subs) == -1) {
            subs.push(subreddit);
        }
    }

    function processSub(currsub) {
        self.getUserNotes(currsub, setNotes);
    }

    function setNotes(status, notes, subreddit) {
        if (!status) return;

        self.log('/r/' + subreddit + ' is using usernote schema v' + notes.ver);
        // Check if the version of loaded notes is within the supported versions
        if (notes.ver < TBUtils.notesMinSchema || notes.ver > TBUtils.notesMaxSchema) {
            self.log("Failed usernotes version check:");
            self.log("\tnotes.ver: " + notes.ver);
            self.log("\tTBUtils.notesSchema: " + TBUtils.notesSchema);
            self.log("\tTBUtils.notesMinSchema: " + TBUtils.notesMinSchema);
            self.log("\tTBUtils.notesMaxSchema: " + TBUtils.notesMaxSchema);

            // Remove the option to add notes
            $('.usernote-span-' + subreddit).remove();

            // Alert the user
            var msg = notes.ver > TBUtils.notesMaxSchema ?
            "You are using a version of toolbox that cannot read a newer usernote data format in: /r/" + subreddit + ". Please update your extension." :
            "You are using a version of toolbox that cannot read an old usernote data format in: /r/" + subreddit + ", schema v" + notes.ver + ". Message /r/toolbox for assistance.";

            TBUtils.alert(msg, function (clicked) {
                if (clicked) {
                    window.open(notes.ver > TBUtils.notesMaxSchema ? "/r/toolbox/wiki/get" :
                    "/message/compose?to=%2Fr%2Ftoolbox&subject=Outdated%20usernotes&message=%2Fr%2F" + subreddit + "%20is%20using%20usernotes%20schema%20v" + notes.ver);
                }
            });
            return;
        }

        //usernotes.log('running');

        var things = $('div.thing .entry[subreddit=' + subreddit + ']');
        if (showOnModPages && TB.utils.isEditUserPage) {
            var $userSpan = $('span.user:not(:first)'),
                tag = '<span class="usernote-span-' +
                    subreddit + '" style="color:#888888; font-size:x-small;">&nbsp;[<label class="add-user-tag-' +
                    subreddit + '" id="add-user-tag" "href="javascript:;">N</label>]</span>';

            self.log('running on ban page');
            things = $userSpan.find('a:first');
            $userSpan.append(tag);
        }

        TBUtils.forEachChunked(things, 20, 300, function (thing) {
            var user = TBUtils.getThingInfo(thing).user,
                u = getUser(notes.users, user),
                $usertag = $(thing).find('.add-user-tag-' + subreddit);

            if (TB.utils.isEditUserPage) {
                $usertag = $(thing).parent().find('.add-user-tag-' + subreddit);
            }

            // Only happens if you delete the last note.
            if (u === undefined || u.notes.length < 1) {
                $usertag.css('color', '');
                $usertag.text('N');
                return;
            }

            var noteData = u.notes[0],
                note = noteData.note,
                date = new Date(noteData.time);

            // Add title before note concat.
            $usertag.attr('title', note + ' (' + date.toLocaleString() + ')');

            if (note.length > maxChars) {
                note = note.substring(0, (maxChars + 3)) + "...";
            }

            if (showDate) {
                note = note + ' (' + date.toLocaleDateString({
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                    }) + ')';
            }

            $usertag.html('<b>' + TBUtils.htmlEncode(note) + '</b>' + ((u.notes.length > 1) ? '  (+' + (u.notes.length - 1) + ')' : ''));


            var type = u.notes[0].type;
            if (!type) type = 'none';

            $usertag.css('color', TBUtils.getTypeInfo(type).color);

        });
    }

    function run() {
        var things = $('div.thing .entry:not(.ut-processed)');

        TBUtils.forEachChunked(things, 20, 650, processThing, function () {
            TBUtils.forEachChunked(subs, 10, 650, processSub);
        });
    }

    $body.on('click', '#add-user-tag', function (e) {
        var thing = $(e.target).closest('.thing .entry'),
            info = TBUtils.getThingInfo(thing),
            subreddit = info.subreddit,
            user = info.user,
            link = info.permalink;

        var popup = TB.ui.popup(
            'User Notes - <a href="//reddit.com/u/' + user + '" id="utagger-user-link">/u/' + user + '</a>',
            [
                {
                    content: '\
            <table class="utagger-notes"><tbody><tr>\
                <td class="utagger-notes-td1">Author</td>\
                <td class="utagger-notes-td2">Note</td>\
                <td class="utagger-notes-td3"></td>\
            </tr></tbody></table>\
            <table class="utagger-type"><tbody><tr>\
                <td><input type="radio" name="type-group" class="utagger-type-input" id="utagger-type-none" value="none" checked/><label for="utagger-type-none" style="color: #369;">None</label></td>\
            </tr></tbody></table>\
            <span>\
                <input type="text" placeholder="something about the user..." class="utagger-user-note" id="utagger-user-note-input" data-link="' + link + '" data-subreddit="' + subreddit + '" data-user="' + user + '">\
                <br><label><input type="checkbox" class="utagger-include-link" checked /> include link</label>\
            </span>',
                    footer: '\
            <span class="tb-popup-error" style="display:none"/>\
            <input type="button" class="utagger-save-user" id="utagger-save-user" value="save for /r/' + subreddit + '" />'
                }
            ],
            '', // meta to inject in popup header; just a placeholder
            'utagger-popup' // class
        )
            .appendTo('body')
            .css({
                left: e.pageX - 50,
                top: e.pageY - 10,
                display: 'block'
            });

        var $table = popup.find('.utagger-type tr:first');
        $(TBUtils.warningType).each(function () {
            var info = TBUtils.getTypeInfo(this);
            $table.append('<td><input type="radio" name="type-group" class="utagger-type-input" id="utagger-type-' + this + '" value="' + this + '"><label for="utagger-type-' + this + '" style="color: ' + info.color + ';">' + info.text + '</label></td>');
        });

        self.getUserNotes(subreddit, function (status, notes) {
            if (!status) return;

            var u = getUser(notes.users, user);
            // User has notes
            if (u !== undefined) {
                popup.find('#utagger-type-' + u.notes[0].type).prop('checked', true);

                var i = 0;
                $(u.notes).each(function () {
                    if (!this.type) {
                        this.type = 'none';
                    }

                    var info = TBUtils.getTypeInfo(this.type);
                    var typeSpan = '';

                    if (info.name) {
                        typeSpan = '<span style="color: ' + info.color + ';">[' + TBUtils.htmlEncode(info.name) + ']</span> ';
                    }

                    popup.find('table.utagger-notes').append('<tr><td class="utagger-notes-td1">' + this.mod + ' <br> <span class="utagger-date" id="utagger-date-' + i + '">' +
                        new Date(this.time).toLocaleString() + '</span></td><td lass="utagger-notes-td2">' + typeSpan + TBUtils.htmlEncode(this.note) +
                        '</td><td class="utagger-notes-td3"><img class="utagger-remove-note" noteid="' + this.time + '" src="data:image/png;base64,' + TBui.iconDelete + '" /></td></tr>');
                    if (this.link) {
                        popup.find('#utagger-date-' + i).wrap('<a href="' + this.link + '">');
                    }
                    i++;
                });
            }
            // No notes on user
            else {
                popup.find("#utagger-user-note-input").focus();
            }
        });
    });

    // Cancel button clicked
    $body.on('click', '.utagger-popup .close', function () {
        $(this).parents('.utagger-popup').remove();
    });

    // Save or delete button clicked
    $body.on('click', '.utagger-save-user, .utagger-remove-note', function (e) {
        var $popup = $(this).closest('.utagger-popup'),
            $unote = $popup.find('.utagger-user-note'),
            subreddit = $unote.attr('data-subreddit'),
            user = $unote.attr('data-user'),
            noteid = $(e.target).attr('noteid'),
            noteText = $unote.val(),
            deleteNote = (e.target.className == 'utagger-remove-note'),
            type = $popup.find('.utagger-type-input:checked').val(),
            link = '',
            note = TBUtils.note,
            notes = TBUtils.usernotes;

        if ($popup.find('.utagger-include-link').is(':checked')) {
            link = $unote.attr('data-link');
        }

        //Check new note data states
        if (!deleteNote) {
            if (!noteText) {
                //User forgot note text!
                $unote.css({
                    "border": "1px solid red"
                });

                var $error = $popup.find('.tb-popup-error');
                $error.text("Note text is required");
                $error.show();

                return;
            }
            else if ((!user || !subreddit)) {
                //We seem to have an problem beyond the control of the user
                return;
            }
        }

        //Create new note
        note = {
            note: noteText,
            time: new Date().getTime(),
            mod: TBUtils.logged,
            link: link,
            type: type
        };

        var userNotes = {
            notes: []
        };

        userNotes.notes.push(note);

        $popup.remove();

        var noteSkel = {
            "ver": TBUtils.notesSchema,
            "constants": {},
            "users": {}
        };

        TBui.textFeedback((deleteNote ? "Removing" : "Adding") + " user note...", TBui.FEEDBACK_NEUTRAL);

        self.getUserNotes(subreddit, function (success, notes, pageError) {
            // Only page errors git different treatment.
            if (!success && pageError) {
                self.log("  Page error");
                switch (pageError) {
                    case TBUtils.WIKI_PAGE_UNKNOWN:
                        break;
                    case TBUtils.NO_WIKI_PAGE:
                        notes = noteSkel;
                        notes.users[user] = userNotes;
                        self.saveUserNotes(subreddit, notes, 'create usernotes config', function (succ) {
                            if (succ) run();
                        });
                        break;

                }
                return;
            }

            if (notes) {
                if (notes.corrupted) {
                    TBUtils.alert('toolbox found an issue with your usernotes while they were being saved. One or more of your notes appear to be written in the wrong format; to prevent further issues these have been deleted. All is well now.');
                }

                var u = getUser(notes.users, user);
                if (u !== undefined) {
                    // Delete.
                    if (deleteNote) {
                        $(u.notes).each(function (idx) {
                            if (this.time == noteid) {
                                u.notes.splice(idx, 1);
                            }
                        });

                        if (u.notes.length < 1) {
                            delete notes.users[user];
                        }

                        self.saveUserNotes(subreddit, notes, 'delete note ' + noteid + ' on user ' + user, function (succ) {
                            if (succ) run();
                        });
                        // Add.
                    }
                    else {
                        u.notes.unshift(note);
                        self.saveUserNotes(subreddit, notes, 'create new note on user ' + user, function (succ) {
                            if (succ) run();
                        });
                    }

                    // Adding a note for previously unknown user
                }
                else if (u === undefined && !deleteNote) {
                    notes.users[user] = userNotes;
                    self.saveUserNotes(subreddit, notes, 'create new note on new user ' + user, function (succ) {
                        if (succ) run();
                    });
                }
            }
            else {
                self.log("  Creating new notes");
                // create new notes object
                notes = noteSkel;
                notes.users[user] = userNotes;
                self.saveUserNotes(subreddit, notes, 'create new notes object, add new note on user ' + user, function (succ) {
                    if (succ) run();
                });
            }
        }, true);
    });

    // Enter key pressed when adding new note
    $body.on('keyup', '.utagger-user-note', function (event) {
        if (event.keyCode == 13) {
            var popup = $(this).closest('.utagger-popup');
            popup.find('.utagger-save-user').click();
        }
    });
};

self.usernotesManager = function () {
    var $body = $('body'),
        showLink = self.setting('unManagerLink');

    if (showLink && TBUtils.post_site && TBUtils.isMod) {
        var $toolbox = $('#moderation_tools').find('.content .icon-menu'),
            managerLink = '<li><img src="data:image/png;base64,' + TB.ui.iconUsernotes + '" class="tb-moderation-tools-icons"/><span class="separator"></span>\
        <a href="/r/' + TBUtils.post_site + '/about/usernotes" class="tb-un-manager" title="edit usernotes for this subreddit">usernotes</a></li>';
        $toolbox.append(managerLink);

    } else if (showLink && TBUtils.isModpage) {

        $body.find('.subscription-box ul li').each(function () {
            var $this = $(this),
                itemSubreddit = $this.find('a.title').text();

            $this.find('a.title').after('<a href="/r/' + itemSubreddit + '/about/usernotes" target="_blank" title="edit usernotes /r/' + itemSubreddit + '"><img src="data:image/png;base64,' + TB.ui.iconUsernotes + '"/></a>');
        });
    }

    // End it here if we're not on /about/usernotes
    if (window.location.href.indexOf('/about/usernotes') < 0) return;

    //userNotes.log(TBUtils.post_site);  // that should work?
    var sub = $('.pagename a:first').html(),
        $contentClear = $('.content'),
        subUsenotes;

    $contentClear.html('<div id="tb-un-note-content-wrap"></div>');

    var $siteTable = $contentClear.find('#tb-un-note-content-wrap'),
        $pageName = $('.pagename');

    $pageName.html($pageName.html().replace(': page not found', ''));//(': page not found', '<ul class="tabmenu"></ul>'));
    $(document).prop('title', 'usernotes - /r/' + sub);


    function showSubNotes(status, notes) {
        if (!status || !notes) {
            var error = '\
            <div class="tb-un-info">\
                <span class="tb-info" style="color:red">No user notes were found for this subreddit.</span>\
            </div>';

            self.log('un status: ' + status + '\nnotes: ' + notes);

            $siteTable.prepend(error);
            TB.ui.longLoadSpinner(false, "No notes found", TB.ui.FEEDBACK_NEGATIVE);
            return;
        }
        subUsenotes = notes;
        self.log('showing notes');

        var userCount = Object.keys(notes.users).length,
            noteCount = 0;

        var userHTML = '\
    <div class="tb-un-user" data-user="{{user}}">\
        <div class="tb-un-user-header">\
        <a href="javascript:;" class="tb-un-refresh" data-user="{{user}}"><img src="data:image/png;base64,' + TB.ui.iconRefresh + '" /></a>&nbsp;\
        <a href="javascript:;" class="tb-un-delete" data-user="{{user}}"><img src="data:image/png;base64,' + TB.ui.iconDelete + '" /></a>\
        <span class="user"><a href="https://www.reddit.com/user/{{user}}">/u/{{user}}</a></span>\
        </div>\
        <div class="tb-usernotes">\
        </div>\
    </div>';

        var noteHTML = '\
    <div class="tb-un-note-details">\
        <a href="javascript:;" class="tb-un-notedelete" data-user="{{user}}" data-note="{{key}}"><img src="data:image/png;base64,' + TB.ui.iconDelete + '" /></a>&nbsp;\
        <span class="note"><a href="{{link}}">{{note}}</a></span>&nbsp;-&nbsp;\
        <span class="mod">by /u/{{mod}}</span>&nbsp;-&nbsp;<span class="date"> <time title="{{timeUTC}}" datetime="{{timeISO}}" class="live-timestamp timeago">{{timeISO}}</time></span>&nbsp;\
    </div>';

        TBUtils.forEachChunked(Object.keys(notes.users), 10, 100, function (user, counter) {
                var usercontent = TB.utils.template(userHTML, {
                    'user': user
                });

                $siteTable.append(usercontent);

                TB.ui.textFeedback("Loading user " + counter + " of " + userCount, TB.ui.FEEDBACK_POSITIVE);

                $.each(notes.users[user].notes, function (key, val) {
                    noteCount++;

                    var timeUTC = Math.round(val.time / 1000),
                        timeISO = TBUtils.timeConverterISO(timeUTC),
                        timeHuman = TBUtils.timeConverterRead(timeUTC);

                    var notecontent = TB.utils.template(noteHTML, {
                        'user': user,
                        'key': key,
                        'note': val.note,
                        'link': val.link,
                        'mod': val.mod,
                        'timeUTC': timeHuman,
                        'timeISO': timeISO
                    });

                    $siteTable.find('div[data-user="' + user + '"] .tb-usernotes').append(notecontent);
                });
            },

            function () {
                TB.ui.longLoadSpinner(false, "Usernotes loaded", TB.ui.FEEDBACK_POSITIVE);

                var infoHTML = '\
            <div class="tb-un-info">\
                <span class="tb-info">There are {{usercount}} users with {{notecount}} notes.</span>\
                <br> <input id="tb-unote-user-search" type="text" placeholder="search for user">\
                <br><br>\
                <a id="tb-un-prune-sb" href="javascript:;">Prune user profiles.</a>\
            </div></br></br>';

                var infocontent = TB.utils.template(infoHTML, {
                    'usercount': userCount,
                    'notecount': noteCount
                });

                $siteTable.prepend(infocontent);

                // Set events after all items are loaded.
                noteManagerRun();
            });
    }

    function noteManagerRun() {
        $("time.timeago").timeago();  //what dies this do?

        // Live search
        $body.find('#tb-unote-user-search').keyup(function () {
            var userSearchValue = new RegExp($(this).val().toUpperCase());

            $body.find('.tb-un-user').each(function (key, thing) {
                userSearchValue.test($(thing).attr('data-user').toUpperCase()) ? $(this).show() : $(this).hide();
            });
        });


        // Get the account status for all users.
        $body.find('#tb-un-prune-sb').on('click', function () {
            var emptyProfiles = [];

            TB.ui.longLoadSpinner(true, "Pruning usernotes", TB.ui.FEEDBACK_NEUTRAL);
            var usersPrune = Object.keys(subUsenotes.users);
            var userCountPrune = usersPrune.length;


            TBUtils.forEachChunkedRateLimit(usersPrune, 20, function (user, counter) {

                    TB.ui.textFeedback("Pruning user " + counter + " of " + userCountPrune, TB.ui.FEEDBACK_POSITIVE);


                    TB.utils.aboutUser(user, function (succ) {

                        if (!succ) {
                            $body.find('#tb-un-note-content-wrap div[data-user="' + user + '"]').css('text-decoration', 'line-through');
                            emptyProfiles.push(user);
                        }
                    });
                },

                function () {

                    // The previous calls have been async, let's wait a little while before we continue. A better fix might be needed but this might be enough.
                    setTimeout(function(){
                        self.log(emptyProfiles);
                        if (emptyProfiles.length > 0) {
                            var deleteEmptyProfile = confirm(emptyProfiles.length + ' deleted or shadowbanned users. Delete all notes for these users?');
                            if (deleteEmptyProfile == true) {
                                self.log('You pressed OK!');

                                emptyProfiles.forEach(function (emptyProfile) {
                                    delete subUsenotes.users[emptyProfile];
                                    $body.find('#tb-un-note-content-wrap div[data-user="' + emptyProfile + '"]').css('background-color', 'rgb(244, 179, 179)');
                                });

                                TB.utils.noteCache[sub] = subUsenotes;
                                self.saveUserNotes(sub, subUsenotes, "pruned all deleted/shadowbanned users.");

                                TB.ui.longLoadSpinner(false, 'Profiles checked, notes for ' + emptyProfiles.length + ' missing users deleted', TB.ui.FEEDBACK_POSITIVE);
                            } else {
                                self.log('You pressed Cancel!');

                                TB.ui.longLoadSpinner(false, 'Profiles checked, no notes deleted.', TB.ui.FEEDBACK_POSITIVE);
                            }
                        } else {
                            TB.ui.longLoadSpinner(false, 'Profiles checked, everyone is still here!', TB.ui.FEEDBACK_POSITIVE);
                        }
                    }, 2000);

                });
        });


        // Update user status.
        $body.find('.tb-un-refresh').on('click', function () {
            var $this = $(this),
                user = $this.attr('data-user'),
                $userSpan = $this.parent().find('.user');
            if (!$this.hasClass('tb-un-refreshed')) {
                $this.addClass('tb-un-refreshed');
                self.log('refreshing user: ' + user);
                TB.utils.aboutUser(user, function (succ) {

                    var $status = TB.utils.template('&nbsp;<span class="mod">[this user account is: {{status}}]</span>', {
                        'status': succ ? 'active' : 'deleted'
                    });

                    $userSpan.after($status);
                });
            }
        });

        // Delete all notes for user.
        $body.find('.tb-un-delete').on('click', function () {
            var $this = $(this),
                user = $this.attr('data-user'),
                $userSpan = $this.parent();

            var r = confirm('This will delete all notes for /u/' + user + '.  Would you like to proceed?');
            if (r == true) {
                self.log("deleting notes for " + user);
                delete subUsenotes.users[user];
                TB.utils.noteCache[sub] = subUsenotes;
                self.saveUserNotes(sub, subUsenotes, "deleted all notes for /u/" + user);
                $userSpan.parent().remove();
                TB.ui.textFeedback('Deleted all notes for /u/' + user, TB.ui.FEEDBACK_POSITIVE);
            }
        });

        // Delete individual notes for user.
        $body.find('.tb-un-notedelete').on('click', function () {
            var $this = $(this),
                user = $this.attr('data-user'),
                note = $this.attr('data-note'),
                $noteSpan = $this.parent();

            self.log("deleting note for " + user);
            subUsenotes.users[user].notes.splice(note, 1);
            TB.utils.noteCache[sub] = subUsenotes;
            self.saveUserNotes(sub, subUsenotes, "deleted a note for /u/" + user);
            $noteSpan.remove();
            TB.ui.textFeedback('Deleted note for /u/' + user, TB.ui.FEEDBACK_POSITIVE);
        });
    }

    TB.ui.longLoadSpinner(true, "Loading usernotes", TB.ui.FEEDBACK_NEUTRAL);
    setTimeout(function () {
        self.log(sub);
        self.getUserNotes(sub, showSubNotes);
        self.log('done?');
        //getSubNotes(sub); // wait a sec to make sure spinner is loaded.
    }, 50);

};

// Get usernotes from wiki
self.getUserNotes = function (subreddit, callback, forceSkipCache) {
    self.log("Getting usernotes (sub=" + subreddit + ")");

    if (!callback) return;
    if (!subreddit) return returnFalse();

    // Check cache (if not skipped)
    if (!forceSkipCache) {
        if (TBUtils.noteCache[subreddit] !== undefined) {
            self.log('notes found in cache');
            if (callback) callback(true, TBUtils.noteCache[subreddit], subreddit);
            return;
        }

        if (TBUtils.noNotes.indexOf(subreddit) != -1) {
            self.log('found in NoNotes cache');
            returnFalse();
            return;
        }
    }

    // Read notes from wiki page
    TBUtils.readFromWiki(subreddit, 'usernotes', true, function (resp) {
        // Errors when reading notes
        //// These errors are bad
        if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN) {
            self.log('Usernotes read error: WIKI_PAGE_UNKNOWN');
            returnFalse(TBUtils.WIKI_PAGE_UNKNOWN);
            return;
        }
        if (resp === TBUtils.NO_WIKI_PAGE) {
            TBUtils.noNotes.push(subreddit);
            self.log('Usernotes read error: NO_WIKI_PAGE');
            returnFalse(TBUtils.NO_WIKI_PAGE);
            return;
        }
        //// No notes exist in wiki page
        if (resp.length < 1) {
            TBUtils.noNotes.push(subreddit);
            self.log('Usernotes read error: wiki empty');
            returnFalse();
            return;
        }

        // Success
        self.log("We have notes!");
        var notes = convertNotes(resp, subreddit);

        // We have notes, cache them and return them.
        TBUtils.noteCache[subreddit] = notes;
        if (callback) callback(true, notes, subreddit);
    });

    function returnFalse(pageError) {
        if (callback) callback(false, null, pageError);
    }

    // Inflate notes from the database, converting between versions if necessary.
    function convertNotes(notes, sub) {
        var orgVer = notes.ver;

        if (notes.ver >= TBUtils.notesMinSchema) {
            if (notes.ver <= 2) {
                var newUsers = [];
                var corruptedNotes = false;
                //TODO: v2 support drops next version
                notes.users.forEach(function (user) {
                    if (!user.hasOwnProperty('name') || !user.hasOwnProperty('notes')) {
                        corruptedNotes = true;
                    } else {
                        user.notes.forEach(function (note) {
                            if (note.link && note.link.trim()) {
                                note.link = self._squashPermalink(note.link);
                            }
                        });
                        newUsers.push(user);
                    }
                });
                notes.users = newUsers;
                notes.ver = TBUtils.notesSchema;
                notes.corrupted = corruptedNotes;
                notes = keyOnUsername(decodeNoteText(notes));
            }
            else if (notes.ver == 3) {
                notes = keyOnUsername(decodeNoteText(inflateNotesV3(notes, sub)));
                notes.ver = TBUtils.notesSchema;
            }
            else if (notes.ver <= 5) {
                notes = inflateNotes(notes, sub);
            }
            else if (notes.ver <= 6) {
                notes = decompressBlob(notes);
                notes = inflateNotes(notes, sub);
            }
        }

        // This doesn't belong here and shouldn't be here.  Like at all.
        // This is the only place this check can go without re-writting 50% of usernotes.
        if (orgVer === TB.utils.notesDeprecatedSchema) {
            self.log('Found deprecated notes in ' + subreddit + ': S' + orgVer);

            // Remove the option to add notes
            $('.usernote-span-' + subreddit).remove();

            // upgrade notes
            TBUtils.alert('The usernotes in /r/' + subreddit + ', are stored using schema v' + orgVer + '. This data version id deprecated.  Please click here to updated to v' + TBUtils.notesSchema,
                function (clicked) {
                    if (clicked) {
                        self.saveUserNotes(subreddit, notes, 'updated notes to schema v' + TBUtils.notesSchema, function (succ) {
                            if (succ) {
                                TB.ui.textFeedback('Notes saved!', TB.ui.FEEDBACK_POSITIVE);
                                TB.utils.clearCache();
                                window.location.reload();
                            }
                        });
                    }
                });
            returnFalse();
        } else {
            return notes;
        }

        // Utilities
        function decompressBlob(notes) {
            var decompressed = TBUtils.zlibInflate(notes.blob);

            // Update notes with actual notes
            delete notes.blob;
            notes.users = JSON.parse(decompressed);
            return notes;
        }

        // Utilities for old versions
        function decodeNoteText(notes) {
            // We stopped using encode()d notes in v4
            notes.users.forEach(function (user) {
                user.notes.forEach(function (note) {
                    note.note = unescape(note.note);
                });
            });
            return notes;
        }

        function keyOnUsername(notes) {
            // we have to rebuild .users to be an object keyed on .name
            var users = {};
            notes.users.forEach(function (user) {
                users[user.name] = {
                    "notes": user.notes
                }
            });
            notes.users = users;
            return notes;
        }
    }

    // Decompress notes from the database into a more useful format
    function inflateNotes(deflated, sub) {
        var inflated = {
            ver: deflated.ver,
            users: {}
        };

        var mgr = new self._constManager(deflated.constants);

        self.log("Inflating all usernotes");
        $.each(deflated.users, function (name, user) {
            inflated.users[name] = {
                "name": name,
                "notes": user.ns.map(function (note) {
                    return inflateNote(deflated.ver, mgr, note, sub);
                })
            };
        });

        return inflated;
    }

    // Decompress notes from the database into a more useful format (MIGRATION ONLY)
    function inflateNotesV3(deflated, sub) {
        var notes = {
            ver: 3,
            users: []
        };

        var mgr = new self._constManager(deflated.constants);

        notes.users = deflated.users.map(function (user) {
            return {
                "name": mgr.get("users", user.u),
                "notes": user.ns.map(function (note) {
                    note = inflateNote(deflated.ver, mgr, note, sub);
                    if (note.link) {
                        note.link = "l," + note.link;
                    }
                    return note;
                })
            };
        });

        return notes;
    }

    // Inflates a single note
    function inflateNote(version, mgr, note, sub) {
        return {
            "note": TBUtils.htmlDecode(note.n),
            "time": inflateTime(version, note.t),
            "mod": mgr.get("users", note.m),
            "link": self._unsquashPermalink(sub, note.l),
            "type": mgr.get("warnings", note.w)
        };
    }

    //Date/time utilities
    function inflateTime(version, time) {
        if (version >= 5 && time.toString().length <= 10) {
            time *= 1000;
        }
        return time;
    }

};

// Save usernotes to wiki
self.saveUserNotes = function (sub, notes, reason, callback) {
    TBui.textFeedback("Saving user notes...", TBui.FEEDBACK_NEUTRAL);

    // Upgrade usernotes if only upgrading
    if (notes.ver < TBUtils.notesSchema) {
        notes.ver = TBUtils.notesSchema;
    }

    // Update cache
    TBUtils.noteCache[sub] = notes;
    // Deconvert notes to wiki format
    notes = deconvertNotes(notes);

    // Write to wiki page
    self.log("Saving usernotes to wiki...");
    TBUtils.postToWiki('usernotes', sub, notes, reason, true, false, function postToWiki(succ, err) {
        if (succ) {
            self.log("Success!");
            TBui.textFeedback("Save complete!", TBui.FEEDBACK_POSITIVE, 2000);
            if (callback) callback(true);
        }
        else {
            self.log("Failure: " + err);
            TBui.textFeedback("Save failed: " + err, TBui.FEEDBACK_NEGATIVE, 5000);
            if (callback) callback(false);
        }
    });

    // Decovert notes to wiki format based on version (note: deconversion is actually conversion in the opposite direction)
    function deconvertNotes(notes) {
        if (notes.ver <= 5) {
            self.log("  Is v5");
            return deflateNotes(notes);
        }
        else if (notes.ver <= 6) {
            self.log("  Is v6");
            notes = deflateNotes(notes);
            return compressBlob(notes);
        }
        return notes;

        // Utilities
        function compressBlob(notes) {
            // Make way for the blob!
            var users = JSON.stringify(notes.users);
            delete notes.users;

            notes.blob = TBUtils.zlibDeflate(users);
            return notes;
        }
    }

    // Compress notes so they'll store well in the database.
    function deflateNotes(notes) {
        var deflated = {
            ver: TBUtils.notesSchema > notes.ver ? TBUtils.notesSchema : notes.ver, // Prevents downgrading usernotes version like a butt
            users: {},
            constants: {
                users: [],
                warnings: []
            }
        };

        var mgr = new self._constManager(deflated.constants);

        $.each(notes.users, function (name, user) {
            //self.log("    Before deflation");
            deflated.users[name] = {
                "ns": user.notes.map(function (note) {
                    return deflateNote(notes.ver, note, mgr);
                })
            };
            //self.log("    After deflation");
        });

        return deflated;
    }

    // Compresses a single note
    function deflateNote(version, note, mgr) {
        return {
            "n": note.note,
            "t": deflateTime(version, note.time),
            "m": mgr.create("users", note.mod),
            "l": self._squashPermalink(note.link),
            "w": mgr.create("warnings", note.type)
        };
    }

    // Compression utilities
    function deflateTime(version, time) {
        if (time === undefined) {
            // Yeah, you time deleters get no time!
            return 0;
        }
        if (version >= 5 && time.toString().length > 10) {
            time = Math.trunc(time / 1000);
        }
        return time;
    }
};

self._constManager = function _constManager(init_pools) {
    return {
        _pools: init_pools,
        create: function (poolName, constant) {
            var pool = this._pools[poolName];
            var id = pool.indexOf(constant);
            if (id !== -1)
                return id;
            pool.push(constant);
            return pool.length - 1;
        },
        get: function (poolName, id) {
            return this._pools[poolName][id];
        }
    };
};

self._squashPermalink = function (permalink) {
    if (!permalink)
        return "";

    // Compatibility with Sweden
    var COMMENTS_LINK_RE = /\/comments\/(\w+)\/(?:[^\/]+\/(?:(\w+))?)?/,
        MODMAIL_LINK_RE = /\/messages\/(\w+)/,

        linkMatches = permalink.match(COMMENTS_LINK_RE),
        modMailMatches = permalink.match(MODMAIL_LINK_RE);

    if (linkMatches) {
        var squashed = "l," + linkMatches[1];
        if (linkMatches[2] !== undefined) {
            squashed += "," + linkMatches[2];
        }
        return squashed;
    }
    else if (modMailMatches) {
        return "m," + modMailMatches[1];
    }
    else {
        return "";
    }
};

self._unsquashPermalink = function (subreddit, permalink) {
    if (!permalink)
        return '';

    var linkParams = permalink.split(/,/g);
    var link = "/r/" + subreddit + "/";

    if (linkParams[0] == "l") {
        link += "comments/" + linkParams[1] + "/";
        if (linkParams.length > 2)
            link += "-/" + linkParams[2] + "/";
    }
    else if (linkParams[0] == "m") {
        link += "message/messages/" + linkParams [1];
    }
    else {
        return "";
    }

    return link;
};

TB.register_module(self);
} // usernotes() wrapper

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        usernotes();
    });
})();

