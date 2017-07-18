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
        'advanced': true,
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

        var TYPE_THING = 'thing',
            TYPE_MODMAIL = 'modmail',
            TYPE_NEW_MODMAIL = 'newmodmail',
            TYPE_USER = 'user';

        TBUtils.getModSubs(function () {
            self.log('Got mod subs');
            self.log(TBUtils.mySubs);
            // In new modmail we only run on threads.


            if (TBUtils.isNewModmail) {
                setTimeout(function () {
                    if($body.find('.ThreadViewer').length > 0) {
                        run();
                    }
                }, 750);
            } else {
                run();
            }

        });

        function getUser(users, name) {
            if (users.hasOwnProperty(name)) {
                return users[name];
            }
            return undefined;
        }

        // NER support.
        let newThingRunning = false;
        window.addEventListener('TBNewThings', function () {
            // It is entirely possible that TBNewThings is fired multiple times.
            // That is why we use a timeout here to prevent run() from being triggered multiple times.
            if(!newThingRunning) {
                newThingRunning = true;
                setTimeout(function(){
                    newThingRunning = false;
                    run();
                }, 500);
            }

        });

        function run() {

            // This can be done better, but this is for the new modmail user sidebar thing.
            if ($body.find('.ThreadViewer').length > 0) {
                var subreddit = $body.find('.ThreadTitle__community').text(),
                    author = $body.find('.InfoBar__username').text();


                var $thing = $body.find('.ThreadViewer__infobar');
                $thing.addClass('ut-thing');
                $thing.attr('data-author', author);
                $thing.attr('data-subreddit', subreddit);

                if ($thing.find('.tb-attr-note').length === 0) {
                    $thing.find('.tb-recents').append('<span class="tb-attr-note InfoBar__recent"></span>');
                }

                var $tbAttrs = $thing.find('.tb-attr-note');
                attachNoteTag($tbAttrs, subreddit, false);

                foundSubreddit(subreddit);
                processSub(subreddit);
            }

            self.log('Running usernotes');
            var things = findThings();

            var done = false;
            TBUtils.forEachChunked(things, 30, 100, processThing, function () {
                self.log('Done processing things');
                TBUtils.forEachChunked(subs, 10, 200, processSub, function () {
                    if(done)
                        self.printProfiles();
                });
            },
            function () {
                self.log('Done processing things');
                done = true;
            });
        }

        function findThings() {
            self.startProfile('find-things');

            // Find things based on page type
            var $things;
            if (showOnModPages && TBUtils.isEditUserPage) {
                self.log('Finding things on mod user page');
                $things = $('.content span.user:not(.ut-thing)');
                $things.attr('data-ut-type', TYPE_USER);
            }
            else if (TBUtils.isModmail) {
                $things = $('div.thing.message:not(.ut-thing)');
                $things.attr('data-ut-type', TYPE_MODMAIL);
            }
            else if (TBUtils.domain === 'mod' && $body.find('.ThreadViewer').length > 0) {
                $things = $('.Thread__message:not(.ut-thing)');
                $things.attr('data-ut-type', TYPE_NEW_MODMAIL);
            }
            else {
                $things = $('#siteTable div.thing:not(.ut-thing), .commentarea div.thing:not(.ut-thing)');
                $things.attr('data-ut-type', TYPE_THING);
            }

            $things.addClass('ut-thing');

            self.endProfile('find-things');
            return $things;
        }

        function processThing(thing) {
            self.startProfile('process-thing');
            var subreddit,
                user,
                author,
                $userattrs;

            var $thing = $(thing),
                thingType = $thing.attr('data-ut-type');
            //self.log("Processing thing: " + thingType);

            // Link and comments
            if (thingType === TYPE_THING) {
                var thingInfo = TBUtils.getThingInfo($thing);

                subreddit = thingInfo.subreddit,
                user = thingInfo.user;

                $userattrs = $thing.find(':not(.parent) .userattrs').first();

                if(TBUtils.modsSub(subreddit)) {
                    attachNoteTag($userattrs, subreddit, true);
                    foundSubreddit(subreddit);
                }

            }
            // Modmail (ugh)
            else if (thingType === TYPE_MODMAIL) {
            //TODO: add tag on recipient; may have to reconsider how ut-thing is applied to modmail
                subreddit = $thing.attr('data-subreddit');
                var $sender = $thing.find('.sender').first();

                var $author = $sender.find('.author');
                author = $author.text();

                $thing.attr('data-author', author);

                $userattrs = $sender.find('.userattrs');
                attachNoteTag($userattrs, subreddit, true);
                /*else {
                // moar mod mail fuckery.  Cocksucking motherfucking hell.
                // don't show your own tag after 'load full conversation'
                var $head = $thing.find('.head');
                if ($head.find('recipient') > 0) {
                    attachNoteTag($head, subreddit);
                }
            }*/

                foundSubreddit(subreddit);
            }
            // NEW Modmail! (yay)
            else if (thingType === TYPE_NEW_MODMAIL) {
                subreddit = $thing.closest('.Thread').find('.ThreadTitle__community').text(),
                author = $thing.find('.Message__author').text().substring(2);

                $thing.attr('data-author', author);
                $thing.attr('data-subreddit', subreddit);

                if ($thing.find('.tb-attr').length === 0) {
                    $thing.find('.Message__divider').eq(0).after('<span class="tb-attr"></span>');
                }

                var $tbAttrs = $thing.find('.tb-attr');
                attachNoteTag($tbAttrs, subreddit, false);

                foundSubreddit(subreddit);
            }
            // Users on mod pages
            else if (thingType === TYPE_USER) {
                subreddit = TBUtils.post_site;
                $thing.attr('data-subreddit', subreddit);

                var $user = $thing.find('a:first');
                user = $user.text();
                if (user) {
                    $thing.attr('data-author', user);
                }

                if($.inArray(subreddit, TBUtils.mySubs) > -1) {
                    attachNoteTag($user, subreddit, true);
                    foundSubreddit(subreddit);
                }

            }
            else {
                self.log(`Unknown thing type ${thingType} (THIS IS BAD)`);
            }

            self.endProfile('process-thing');
        }

        function attachNoteTag($element, subreddit, attachAfter) {
            var $tag = $('<span>').attr('title', `View and add notes about this user for /r/${subreddit}`).addClass(`usernote-button usernote-span-${subreddit}`).append(
                $('<a>').addClass(`tb-bracket-button add-user-tag-${subreddit}`).attr('id', 'add-user-tag').attr('href', 'javascript:;').text('N'));
            // Full text if in sidebar
            if ($element.closest('.ThreadViewer__infobarContainer').length) {
                $tag.find('a').text('User Notes');
            }

            if (attachAfter) {
                if ($element.nextAll('.usernote-button').length === 0) {
                    $element.after($tag);
                }
            }
            else {
                if ($element.find('.usernote-button').length === 0) {
                    $element.append($tag);
                }
            }
        }

        function foundSubreddit(subreddit) {
            if ($.inArray(subreddit, subs) == -1) {
                subs.push(subreddit);
            }
        }

        function processSub(subreddit) {
            if (!subreddit) {
                return;
            }

            self.log(`Processing sub: ${subreddit}`);
            self.getUserNotes(subreddit, function (status, notes) {
                self.log(`Usernotes retrieved for ${subreddit}: status=${status}`);
                if (!status) {
                    return;
                }
                if (!isNotesValidVersion(notes)) {
                // Remove the option to add notes
                    $(`.usernote-span-${subreddit}`).remove();

                    // Alert the user
                    var msg = notes.ver > TBUtils.notesMaxSchema ?
                        `You are using a version of toolbox that cannot read a newer usernote data format in: /r/${subreddit}. Please update your extension.` :
                        `You are using a version of toolbox that cannot read an old usernote data format in: /r/${subreddit}, schema v${notes.ver}. Message /r/toolbox for assistance.`;

                    TBUtils.alert(msg, function (clicked) {
                        if (clicked) {
                            window.open(notes.ver > TBUtils.notesMaxSchema ? '/r/toolbox/wiki/get' :
                                `/message/compose?to=%2Fr%2Ftoolbox&subject=Outdated%20usernotes&message=%2Fr%2F${subreddit}%20is%20using%20usernotes%20schema%20v${notes.ver}`);
                        }
                    });
                }

                self.getSubredditColors(subreddit, function (colors) {
                    setNotes(notes, subreddit, colors);
                });
            });
        }

        function isNotesValidVersion(notes) {
            if (notes.ver < TBUtils.notesMinSchema || notes.ver > TBUtils.notesMaxSchema) {
                self.log('Failed usernotes version check:');
                self.log(`\tnotes.ver: ${notes.ver}`);
                self.log(`\tTBUtils.notesSchema: ${TBUtils.notesSchema}`);
                self.log(`\tTBUtils.notesMinSchema: ${TBUtils.notesMinSchema}`);
                self.log(`\tTBUtils.notesMaxSchema: ${TBUtils.notesMaxSchema}`);
                return false;
            }

            return true;
        }

        function setNotes(notes, subreddit, colors) {
            self.log(`Setting notes for ${subreddit}`);
            self.startProfile('set-notes');

            self.startProfile('set-notes-find');
            var things = $(`.ut-thing[data-subreddit=${subreddit}]`);
            self.endProfile('set-notes-find');

            TBUtils.forEachChunked(things, 20, 100, function (thing) {
                self.startProfile('set-notes-process');

                // Get all tags related to the current subreddit
                var $thing = $(thing),
                    user = $thing.attr('data-author'),
                    u = getUser(notes.users, user);

                var $usertag;
                if (TBUtils.isEditUserPage) {
                    $usertag = $thing.parent().find(`.add-user-tag-${subreddit}`);
                }
                else {
                    $usertag = $thing.find(`.add-user-tag-${subreddit}`);
                }
                var isInNewModmailSidebar = $usertag.closest('.ThreadViewer__infobarContainer').length > 0;

                // Only happens if you delete the last note.
                if (u === undefined || u.notes.length < 1) {
                    $usertag.css('color', '');
                    $usertag.empty();
                    // Since there's more room in the sidebar, display a more descriptive label
                    if (isInNewModmailSidebar) {
                        $usertag.text('User Notes');
                    } else {
                        $usertag.text('N');
                    }
                    self.endProfile('set-notes-process');
                    return;
                }

                var noteData = u.notes[0],
                    note = noteData.note,
                    date = new Date(noteData.time);

                // Add title before note concat.
                $usertag.attr('title', `${note} (${date.toLocaleString()})`);

                if (note.length > maxChars) {
                    note = `${note.substring(0, maxChars)}...`;
                }

                if (showDate) {
                    note = `${note} (${date.toLocaleDateString({
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                    })})`;
                }

                $usertag.empty();
                $usertag.append($('<b>').text(note)).append($('<span>').text((u.notes.length > 1) ? `  (+${u.notes.length - 1})` : ''));


                var type = u.notes[0].type;
                if (!type) type = 'none';

                var color = self._findSubredditColor(colors, type);
                if (color) {
                    $usertag.css('color', color.color);
                }
                else {
                    $usertag.css('color', '');
                }

                self.endProfile('set-notes-process');
            }, function () {
                self.endProfile('set-notes');
            });
        }

        // Click to open dialog
        $body.on('click', '#add-user-tag', function (e) {
            var $target = $(e.target),
                $thing = $target.closest('.ut-thing');

            var subreddit = $thing.attr('data-subreddit'),
                user = $thing.attr('data-author'),
                link = TBUtils.getThingInfo($thing).permalink,
                disableLink = TBUtils.isEditUserPage;           //FIXME: change to thing type

            // So Instead of butchering getThingInfo even more we do this as fallback in new modmail.

            var $typeList = $('<tr>').addClass('utagger-type-list'),
                $noteList = $('<tbody>').append(
                    $('<tr>').append(
                        $('<td>').addClass('utagger-notes-td1').text('Author')
                    ).append(
                        $('<td>').addClass('utagger-notes-td2').text('Note')
                    ).append(
                        $('<td>').addClass('utagger-notes-td3')
                    )
                ),
                $popup = TB.ui.popup(
                    $('<div>').addClass('utagger-title').append($('<span>').text('User Notes - ')).append($('<a>').attr('href', `//reddit.com/u/${user}`).attr('id', 'utagger-user-link').text(`/u/${user}`)),
                    [{
                        content: $('<div>').addClass('utagger-content').append(
                            $('<table>').addClass('utagger-notes').append($noteList)
                        ).append(
                            $('<table>').addClass('utagger-types').append(
                                $('<tbody>').append($typeList)
                            )
                        ).append(
                            $('<div>').addClass('utagger-input-wrapper').append(
                                $('<input>').attr('type', 'text').addClass('utagger-user-note').attr('id', 'utagger-user-note-input')
                                    .attr('placeholder', 'something about the user...')
                                    .attr('data-link', link).attr('data-subreddit', subreddit).attr('data-user', user)
                            ).append(
                                $('<label>').addClass('utagger-include-link').append(
                                    $('<input>').attr('type', 'checkbox').prop('checked', !disableLink).prop('disabled', disableLink)
                                ).append(
                                    $('<span>').text('Include link')
                                )
                            )
                        ),

                        footer: $('<div>').addClass('utagger-footer').append(
                            $('<span>').addClass('tb-popup-error').css('display', 'none')
                        ).append(
                            $('<input>').attr('type', 'button').addClass('utagger-save-user tb-action-button').attr('id', 'utagger-save-user').attr('value', `Save for /r/${subreddit}`)
                        )
                    }],
                    '', // meta to inject in popup header; just a placeholder
                    'utagger-popup' // class
                );
            // We want to make sure windows fit on the screen.
            var positions = TBui.drawPosition(e);

            $popup.css({
                left: positions.leftPosition,
                top: positions.topPosition
            });
            $body.append($popup);

            // Generate dynamic parts of dialog and show
            self.getSubredditColors(subreddit, function (colors) {
                self.log('Adding colors to dialog');

                // Create type/color selections
                var group = (`${Math.random().toString(36)}00000000000000000`).slice(2, 7);

                colors.forEach(function (info) {
                    self.log(`  ${info.key}`);
                    self.log(`    ${info.text}`);
                    self.log(`    ${info.color}`);
                    $typeList.append($('<td>').append(
                        $('<label>').addClass(`utagger-type type-${info.key}`).append(
                            $('<input>').attr('type', 'checkbox').attr('name', `type-group-${group}`).attr('value', info.key).addClass(`type-input type-input-${info.key}`)
                        ).append(
                            $('<span>').text(info.text).css('color', info.color)
                        ))
                    );
                });

                // Radio buttons 2.0, now with deselection
                $popup.find('.utagger-type').click(function(){
                    var $thisInput = $(this).find('input');
                    // Are we already checked?
                    if ($thisInput.prop('checked')) {
                    // just uncheck this thing so everything is blank
                        $thisInput.prop('checked', false);
                    } else {
                    // Uncheck all the things, then check this thing
                        $(this).closest('.utagger-types').find('input').prop('checked', false);
                        $thisInput.prop('checked', true);
                    }
                });

                $popup.show();

                // Add notes
                self.log('Adding notes to dialog');
                self.getUserNotes(subreddit, function (status, notes) {
                    if (!status) return;

                    var u = getUser(notes.users, user);
                    // User has notes
                    if (u !== undefined && u.notes.length > 0) {
                    //FIXME: not selecting previous type
                        $popup.find(`.utagger-type .type-input-${u.notes[0].type}`).prop('checked', true);

                        u.notes.forEach(function (note, i) {
                        //if (!note.type) {
                        //    note.type = 'none';
                        //}

                            self.log(`  Type: ${note.type}`);
                            var info = self._findSubredditColor(colors, note.type);
                            self.log(info);

                            // TODO: probably shouldn't rely on time truncated to seconds as a note ID; inaccurate.
                            // The ID of a note is set to its time when the dialog is generated. As of schema v5,
                            // times are truncated to second accuracy. This means newly-added notes that have yet
                            // to be saved — and therefore still retain millisecond accuracy — may not be considered
                            // equal to saved versions if compared. This caused problems when deleting new notes,
                            // which searches a saved version based on ID.
                            var noteId = Math.trunc(note.time/1000)*1000,
                                noteString = TBUtils.htmlEncode(note.note),
                                timeString = new Date(note.time).toLocaleString();

                            // Construct some elements separately
                            var $timeDiv = $('<div>');

                            if (note.link) {
                                if (TBUtils.isNewModmail && !note.link.startsWith('https://mod.reddit.com')) {
                                    note.link = `https://www.reddit.com${note.link}`;
                                }
                                $timeDiv.append($(`<a>${timeString}</a>`).attr('href', note.link));
                            }
                            else {
                                $timeDiv.text(timeString);
                            }

                            var typeSpan = '';
                            if (info && info.text) {
                                typeSpan = $('<span>').addClass('note-type').css('color', info.color).text(`[${TBUtils.htmlEncode(info.text)}]`);
                            }

                            // Add note to list
                            $noteList.append(
                                $('<tr>').addClass('utagger-note').append(
                                    $('<td>').addClass('utagger-notes-td1').append(
                                        $('<div>').addClass('utagger-mod').text(note.mod)
                                    ).append(
                                        $timeDiv.addClass('utagger-date').attr('id', `utagger-date-${i}`)
                                    )
                                ).append(
                                    $('<td>').addClass('utagger-notes-td2').append(typeSpan).append($('<span>').addClass('note-text').text(noteString))
                                ).append(
                                    $('<td>').addClass('utagger-notes-td3').append(
                                        $('<img>').addClass('utagger-remove-note').attr('data-note-id', noteId).attr('src', `data:image/png;base64,${TBui.iconDelete}`)
                                    )
                                )
                            );
                        });
                    }
                    // No notes on user
                    else {
                        $popup.find('#utagger-user-note-input').focus();
                    }
                });
            });
        });

        // Cancel button clicked
        $body.on('click', '.utagger-popup .close', function () {
            $(this).parents('.utagger-popup').remove();
        });

        // Save or delete button clicked
        $body.on('click', '.utagger-save-user, .utagger-remove-note', function (e) {
            self.log('Save or delete pressed');
            var $popup = $(this).closest('.utagger-popup'),
                $unote = $popup.find('.utagger-user-note'),
                subreddit = $unote.attr('data-subreddit'),
                user = $unote.attr('data-user'),
                noteId = $(e.target).attr('data-note-id'),
                noteText = $unote.val(),
                deleteNote = (e.target.className == 'utagger-remove-note'),
                type = $popup.find('.utagger-type input:checked').val(),
                link = '';

            if ($popup.find('.utagger-include-link input').is(':checked')) {
                link = $unote.attr('data-link');
            }

            //Check new note data states
            if (!deleteNote) {
                if (!noteText) {
                //User forgot note text!
                    $unote.addClass('error');

                    var $error = $popup.find('.tb-popup-error');
                    $error.text('Note text is required');
                    $error.show();

                    return;
                }
                else if ((!user || !subreddit)) {
                //We seem to have an problem beyond the control of the user
                    return;
                }
            }

            //Create new note
            var note = {
                note: noteText.trim(),
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
                ver: TBUtils.notesSchema,
                constants: {},
                users: {}
            };

            TBui.textFeedback(`${deleteNote ? 'Removing' : 'Adding'} user note...`, TBui.FEEDBACK_NEUTRAL);

            self.getUserNotes(subreddit, function (success, notes, pageError) {
            // Only page errors git different treatment.
                if (!success && pageError) {
                    self.log('  Page error');
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

                var saveMsg;
                if (notes) {
                    if (notes.corrupted) {
                        TBUtils.alert('toolbox found an issue with your usernotes while they were being saved. One or more of your notes appear to be written in the wrong format; to prevent further issues these have been deleted. All is well now.');
                    }

                    var u = getUser(notes.users, user);
                    // User already has notes
                    if (u !== undefined) {
                        self.log('User exists');

                        // Delete note
                        if (deleteNote) {
                            self.log('Deleting note');
                            self.log(`  ${noteId}`);

                            self.log('Removing note from:');
                            self.log(u.notes);
                            for(var n = 0; n < u.notes.length; n++) {
                                note = u.notes[n];
                                self.log(`  ${note.time}`);
                                if (note.time == noteId) {
                                    self.log(`  Note found: ${noteId}`);
                                    u.notes.splice(n, 1);
                                    self.log(u.notes);
                                    break;
                                }
                            }

                            if (u.notes.length < 1) {
                                self.log('Removing user (is empty)');
                                delete notes.users[user];
                            }

                            saveMsg = `delete note ${noteId} on user ${user}`;
                        }
                        // Add note
                        else {
                            self.log('Adding note');

                            u.notes.unshift(note);
                            saveMsg = `create new note on user ${user}`;
                        }
                    }
                    // New user
                    else if (u === undefined && !deleteNote) {
                        notes.users[user] = userNotes;
                        saveMsg = `create new note on new user ${user}`;
                    }
                }
                else {
                    self.log('  Creating new user');

                    // create new notes object
                    notes = noteSkel;
                    notes.users[user] = userNotes;
                    saveMsg = `create new notes object, add new note on user ${user}`;
                }

                // Save notes if a message was set (the only case it isn't is if notes are corrupt)
                if (saveMsg) {
                    self.log('Saving notes');
                    self.saveUserNotes(subreddit, notes, saveMsg, function (succ) {
                        if (succ) {
                            run();
                        }
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
                managerLink = `<li><span class="separator"></span>
                                <a href="/r/${TBUtils.post_site}/about/usernotes" class="tb-un-manager" title="edit usernotes for this subreddit"><img src="data:image/png;base64,${TB.ui.iconUsernotes}" class="tb-moderation-tools-icons"/>usernotes</a>
                                </li>`;
            $toolbox.append(managerLink);

        } else if (showLink && TBUtils.isModpage) {

            $body.find('.subscription-box ul li').each(function () {
                var $this = $(this),
                    itemSubreddit = $this.find('a.title').text();

                $this.find('a.title').after(`<a href="/r/${itemSubreddit}/about/usernotes" target="_blank" title="edit usernotes /r/${itemSubreddit}"><img src="data:image/png;base64,${TB.ui.iconUsernotes}"/></a>`);
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
        $(document).prop('title', `usernotes - /r/${sub}`);


        function showSubNotes(status, notes) {
            if (!status || !notes) {
                var error = `
            <div class="tb-un-info">
                <span class="tb-info" style="color:red">No user notes were found for this subreddit.</span>
            </div>`;

                self.log(`un status: ${status}\nnotes: ${notes}`);

                $siteTable.prepend(error);
                TB.ui.longLoadSpinner(false, 'No notes found', TB.ui.FEEDBACK_NEGATIVE);
                return;
            }
            subUsenotes = notes;
            self.log('showing notes');

            var userCount = Object.keys(notes.users).length,
                noteCount = 0;

            var $userContentTemplate = $('<div>').addClass('tb-un-user').attr('data-user', 'NONE').append(
                $('<div>').addClass('tb-un-user-header').append(
                    $('<a>').attr('href', 'javascript:;').addClass('tb-un-refresh').attr('data-user', 'NONE').append(
                        $('<img>').attr('src', `data:image/png;base64,${TB.ui.iconRefresh}`)
                    )
                ).append(
                    $('<a>').attr('href', 'javascript:;').addClass('tb-un-delete').attr('data-user', 'NONE').append(
                        $('<img>').attr('src', `data:image/png;base64,${TB.ui.iconDelete}`)
                    )
                ).append(
                    $('<span>').addClass('user').append(
                        $('<a>').attr('href', '/u/NONE').text('/u/NONE')
                    )
                )
            );//.append(
            //    $('<div>').addClass('tb-usernotes')
            //);

            self.getSubredditColors(sub, function (colors) {
                self.startProfile('manager-render');
                TBUtils.forEachChunked(Object.keys(notes.users), 50, 50,
                // Process a user
                    function (user, counter) {
                        self.startProfile('manager-render-user');
                        var $userContent = $userContentTemplate.clone();
                        $userContent.attr('data-user', user);
                        $userContent.find('.tb-un-refresh, .tb-un-delete').attr('data-user', user);
                        $userContent.find('.user a').attr('href', `/u/${user}`).text(`/u/${user}`);
                        var $userNotes = $('<div>').addClass('tb-usernotes');//$userContent.find(".tb-usernotes");
                        $userContent.append($userNotes);
                        self.endProfile('manager-render-user');

                        TB.ui.textFeedback(`Loading user ${counter} of ${userCount}`, TB.ui.FEEDBACK_POSITIVE);

                        self.startProfile('manager-render-notes');
                        //var notes = [];
                        $.each(notes.users[user].notes, function (key, val) {
                            noteCount++;

                            var color = self._findSubredditColor(colors, val.type);

                            var timeUTC = Math.round(val.time / 1000),
                                timeISO = TBUtils.timeConverterISO(timeUTC),
                                timeHuman = TBUtils.timeConverterRead(timeUTC);


                            var $note = $('<div>').addClass('tb-un-note-details').append(
                                $('<a>').addClass('tb-un-notedelete').attr('href', 'javascript:;').attr('data-user', user).attr('data-note', key).append(
                                    $('<img>').attr('src', `data:image/png;base64,${TB.ui.iconDelete}`)
                                )
                            ).append(
                                $('<span>').addClass('note').append(
                                    $('<span>').addClass('note-type').css('color', color.color).text(`[${color.text}]`)
                                ).append(
                                    $('<a>').addClass('note-content').attr('href', val.link).text(val.note)
                                )
                            ).append(
                                $('<span>').text(' - ')
                            ).append(
                                $('<span>').addClass('mod').text(`by /u/${val.mod}`)
                            ).append(
                                $('<span>').text(' - ')
                            ).append(
                                $('<time>').attr('title', timeHuman).attr('datetime', timeISO).addClass('live-timestamp timeago').text(timeISO)
                            );

                            //notes.append($note);
                            if (color.key === 'none') {
                                $note.find('.note-type').hide();
                            }
                            $userNotes.append($note);
                        //});


                        });
                        //$userNotes.append(notes);
                        self.endProfile('manager-render-notes');

                        $siteTable.append($userContent);
                    },
                    // Process done
                    function () {
                        self.endProfile('manager-render');

                        TB.ui.longLoadSpinner(false, 'Usernotes loaded', TB.ui.FEEDBACK_POSITIVE);

                        var infoHTML = `
            <div class="tb-un-info">
                <span class="tb-info">There are {{usercount}} users with {{notecount}} notes.</span>
                <br> <input id="tb-unote-user-search" type="text" placeholder="search for user"> <input id="tb-unote-contents-search" type="text" placeholder="search for note contents">
                <br><br>
                <a id="tb-un-prune-sb" class="tb-general-button" href="javascript:;">Prune deleted/suspended profiles</a>
                <label><input type="checkbox" class="tb-prune-old"/> Also prune notes from accounts that have been inactive for more than </label>
                <select class="tb-prune-length">
                    <option value="180">six-months</option>
                    <option value="365">one-year</option>
                    <option value="730">two-years</option>
                    <option value="1095">three-years</option>
                    <option value="1460">four-years</option>
                    <option value="1825">five-years</option>
                    <option value="2190">six-years</option>
                </select>
            </div></br></br>`;

                        var infocontent = TB.utils.template(infoHTML, {
                            'usercount': userCount,
                            'notecount': noteCount
                        });

                        $siteTable.prepend(infocontent);

                        // Set events after all items are loaded.
                        noteManagerRun();

                        self.printProfiles();
                    }
                );
            });
        }

        function noteManagerRun() {
            self.startProfile('manager-run');

            $('time.timeago').timeago();  //what does this do?

            // Live search - users
            $body.find('#tb-unote-user-search').keyup(function () {
                var userSearchValue = new RegExp($(this).val().toUpperCase());

                $body.find('.tb-un-user').each(function (key, thing) {
                    userSearchValue.test($(thing).attr('data-user').toUpperCase()) ? $(this).show() : $(this).hide();
                });
            });

            // Live search - contents
            $body.find('#tb-unote-contents-search').keyup(function () {
                var contentsSearchValue = new RegExp($(this).val().toUpperCase());

                $body.find('.note').each(function (key, thing) {
                    var wrapper = $(this).closest('.tb-un-note-details').show();
                    if (contentsSearchValue.test($(thing).html().toUpperCase())) {
                        wrapper.show();
                        wrapper.closest('.tb-un-user').show();
                    } else {
                        wrapper.hide();
                        wrapper.closest('.tb-un-user').hide();
                    }
                });
            });


            // Get the account status for all users.
            $body.find('#tb-un-prune-sb').on('click', function () {
                var emptyProfiles = [],
                    pruneOld = $('.tb-prune-old').prop('checked'),
                    pruneLength = $('.tb-prune-length').val(),
                    now = TBUtils.getTime(),
                    usersPrune = Object.keys(subUsenotes.users),
                    userCountPrune = usersPrune.length;

                TB.ui.longLoadSpinner(true, 'Pruning usernotes', TB.ui.FEEDBACK_NEUTRAL);

                TBUtils.forEachChunkedRateLimit(usersPrune, 20, function (user, counter) {

                    TB.ui.textFeedback(`Pruning user ${counter} of ${userCountPrune}`, TB.ui.FEEDBACK_POSITIVE);

                    TBUtils.getLastActive(user, function (succ, date) {

                        if (!succ) {
                            self.log(`${user} is deleted, suspended or shadowbanned.`);
                            $body.find(`#tb-un-note-content-wrap div[data-user="${user}"]`).css('text-decoration', 'line-through');
                            emptyProfiles.push(user);
                        } else if (pruneOld) {
                            var timeSince = now - (date * 1000),
                                daysSince = TBUtils.millisecondsToDays(timeSince);

                            if (daysSince > pruneLength){
                                self.log(`${user} has not been active in: ${daysSince.toFixed()} days.`);
                                $body.find(`#tb-un-note-content-wrap div[data-user="${user}"]`).css('text-decoration', 'line-through');
                                emptyProfiles.push(user);
                            }
                        }
                    });
                },

                function () {

                    // The previous calls have been async, let's wait a little while before we continue. A better fix might be needed but this might be enough.
                    setTimeout(function(){
                        self.log(emptyProfiles);
                        if (emptyProfiles.length > 0) {
                            var deleteEmptyProfile = confirm(`${emptyProfiles.length} deleted or shadowbanned users. Delete all notes for these users?`);
                            if (deleteEmptyProfile == true) {
                                self.log('You pressed OK!');

                                emptyProfiles.forEach(function (emptyProfile) {
                                    delete subUsenotes.users[emptyProfile];
                                    $body.find(`#tb-un-note-content-wrap div[data-user="${emptyProfile}"]`).css('background-color', 'rgb(244, 179, 179)');
                                });

                                TB.utils.noteCache[sub] = subUsenotes;
                                self.saveUserNotes(sub, subUsenotes, 'pruned all deleted/shadowbanned users.');

                                TB.ui.longLoadSpinner(false, `Profiles checked, notes for ${emptyProfiles.length} missing users deleted`, TB.ui.FEEDBACK_POSITIVE);
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
                    self.log(`refreshing user: ${user}`);
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

                var r = confirm(`This will delete all notes for /u/${user}.  Would you like to proceed?`);
                if (r == true) {
                    self.log(`deleting notes for ${user}`);
                    delete subUsenotes.users[user];
                    TB.utils.noteCache[sub] = subUsenotes;
                    self.saveUserNotes(sub, subUsenotes, `deleted all notes for /u/${user}`);
                    $userSpan.parent().remove();
                    TB.ui.textFeedback(`Deleted all notes for /u/${user}`, TB.ui.FEEDBACK_POSITIVE);
                }
            });

            // Delete individual notes for user.
            $body.find('.tb-un-notedelete').on('click', function () {
                var $this = $(this),
                    user = $this.attr('data-user'),
                    note = $this.attr('data-note'),
                    $noteSpan = $this.parent();

                self.log(`deleting note for ${user}`);
                subUsenotes.users[user].notes.splice(note, 1);
                TB.utils.noteCache[sub] = subUsenotes;
                self.saveUserNotes(sub, subUsenotes, `deleted a note for /u/${user}`);
                $noteSpan.remove();
                TB.ui.textFeedback(`Deleted note for /u/${user}`, TB.ui.FEEDBACK_POSITIVE);
            });

            self.endProfile('manager-run');
        }

        TB.ui.longLoadSpinner(true, 'Loading usernotes', TB.ui.FEEDBACK_NEUTRAL);
        setTimeout(function () {
            self.log(sub);
            self.getUserNotes(sub, showSubNotes);
            self.log('done?'); // is that a question or a statement?
        }, 50);

    };

    // Get usernotes from wiki
    self.getUserNotes = function (subreddit, callback, forceSkipCache) {
        self.log(`Getting usernotes (sub=${subreddit})`);

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
            self.log('We have notes!');
            var notes = convertNotes(resp, subreddit);

            // We have notes, cache them and return them.
            TBUtils.noteCache[subreddit] = notes;
            if (callback) {
                callback(true, notes, subreddit);
            }
        });

        function returnFalse(pageError) {
            if (callback) {
                callback(false, null, pageError);
            }
        }

        // Inflate notes from the database, converting between versions if necessary.
        function convertNotes(notes, sub) {
            self.log(`Notes ver: ${notes.ver}`);

            if (notes.ver >= TBUtils.notesMinSchema) {
                if (notes.ver <= 5) {
                    notes = inflateNotes(notes, sub);
                }
                else if (notes.ver <= 6) {
                    notes = decompressBlob(notes);
                    notes = inflateNotes(notes, sub);
                }

                if (notes.ver <= TB.utils.notesDeprecatedSchema) {
                    self.log(`Found deprecated notes in ${subreddit}: S${notes.ver}`);

                    TBUtils.alert(`The usernotes in /r/${subreddit} are stored using schema v${notes.ver}, which is deprecated. Please click here to updated to v${TBUtils.notesSchema}.`,
                        function (clicked) {
                            if (clicked) {
                            // Upgrade notes
                                self.saveUserNotes(subreddit, notes, `Updated notes to schema v${TBUtils.notesSchema}`, function (succ) {
                                    if (succ) {
                                        TB.ui.textFeedback('Notes saved!', TB.ui.FEEDBACK_POSITIVE);
                                        TB.utils.clearCache();
                                        window.location.reload();
                                    }
                                });
                            }
                        });
                }

                return notes;
            }
            else {
                returnFalse();
            }

            // Utilities
            function decompressBlob(notes) {
                var decompressed = TBUtils.zlibInflate(notes.blob);

                // Update notes with actual notes
                delete notes.blob;
                notes.users = JSON.parse(decompressed);
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

            self.log('Inflating all usernotes');
            $.each(deflated.users, function (name, user) {
                inflated.users[name] = {
                    'name': name,
                    'notes': user.ns.map(function (note) {
                        return inflateNote(deflated.ver, mgr, note, sub);
                    })
                };
            });

            return inflated;
        }

        // Inflates a single note
        function inflateNote(version, mgr, note, sub) {
            return {
                'note': TBUtils.htmlDecode(note.n),
                'time': inflateTime(version, note.t),
                'mod': mgr.get('users', note.m),
                'link': self._unsquashPermalink(sub, note.l),
                'type': mgr.get('warnings', note.w)
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
        TBui.textFeedback('Saving user notes...', TBui.FEEDBACK_NEUTRAL);

        // Upgrade usernotes if only upgrading
        if (notes.ver < TBUtils.notesSchema) {
            notes.ver = TBUtils.notesSchema;
        }

        // Update cache
        TBUtils.noteCache[sub] = notes;
        // Deconvert notes to wiki format
        notes = deconvertNotes(notes);

        // Write to wiki page
        self.log('Saving usernotes to wiki...');
        TBUtils.postToWiki('usernotes', sub, notes, reason, true, false, function postToWiki(succ, jqXHR) {
            if (succ) {
                self.log('Success!');
                TBui.textFeedback('Save complete!', TBui.FEEDBACK_POSITIVE, 2000);
                if (callback) callback(true);
            }
            else {
                self.log(`Failure: ${jqXHR.status}`);
                var reason;
                if (jqXHR.status === 413) {
                    reason = 'usernotes full';
                }
                else {
                    reason = jqXHR.responseText;
                }
                self.log(`  ${reason}`);

                TBui.textFeedback(`Save failed: ${reason}`, TBui.FEEDBACK_NEGATIVE, 5000);
                if (callback) callback(false);
            }
        });

        // Deconvert notes to wiki format based on version (note: deconversion is actually conversion in the opposite direction)
        function deconvertNotes(notes) {
            if (notes.ver <= 5) {
                self.log('  Is v5');
                return deflateNotes(notes);
            }
            else if (notes.ver <= 6) {
                self.log('  Is v6');
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
                deflated.users[name] = {
                    'ns': user.notes.filter(function(note) {
                        if(note === undefined) {
                            self.log('WARNING: undefined note removed');
                        }
                        return note !== undefined;
                    }).map(function (note) {
                        return deflateNote(notes.ver, note, mgr);
                    })
                };
            });

            return deflated;
        }

        // Compresses a single note
        function deflateNote(version, note, mgr) {
            self.log(note);
            return {
                'n': note.note,
                't': deflateTime(version, note.time),
                'm': mgr.create('users', note.mod),
                'l': self._squashPermalink(note.link),
                'w': mgr.create('warnings', note.type)
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

    // Save/load util
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
            return '';

        // Compatibility with Sweden
        var COMMENTS_LINK_RE = /\/comments\/(\w+)\/(?:[^\/]+\/(?:(\w+))?)?/,
            MODMAIL_LINK_RE = /\/messages\/(\w+)/;


        var linkMatches = permalink.match(COMMENTS_LINK_RE),
            modMailMatches = permalink.match(MODMAIL_LINK_RE),
            newModMailMatches = permalink.startsWith('https://mod.reddit.com');

        if (linkMatches) {
            var squashed = `l,${linkMatches[1]}`;
            if (linkMatches[2] !== undefined) {
                squashed += `,${linkMatches[2]}`;
            }
            return squashed;
        }
        else if (modMailMatches) {
            return `m,${modMailMatches[1]}`;
        } else if (newModMailMatches) {
            return permalink;
        }
        else {
            return '';
        }
    };

    self._unsquashPermalink = function (subreddit, permalink) {
        if (!permalink)
            return '';

        if (permalink.startsWith('https://mod.reddit.com')) {
            return permalink;
        } else {

            var linkParams = permalink.split(/,/g);
            var link = `/r/${subreddit}/`;

            if (linkParams[0] == 'l') {
                link += `comments/${linkParams[1]}/`;
                if (linkParams.length > 2)
                    link += `-/${linkParams[2]}/`;
            }
            else if (linkParams[0] == 'm') {
                link += `message/messages/${linkParams [1]}`;
            }
            else {
                return '';
            }

            return link;
        }
    };

    // Per-subreddit coloring
    self.getSubredditColors = function (subreddit, callback) {
        self.log(`Getting subreddit colors for /r/${subreddit}`);
        TBUtils.getConfig(subreddit, function (config) {
            self.log(`  Config retrieved for /r/${subreddit}`);
            if (config && config.usernoteColors && config.usernoteColors.length > 0) {
                callback(config.usernoteColors);
            }
            else {
                self.log(`  Config not retrieved for ${subreddit}, using default colors`);

                // Use default colors
                callback(TBUtils.defaultUsernoteTypes);
            }
        });
    };

    self._findSubredditColor = function (colors, key) {
    //TODO: make more efficient for repeated operations, like using an object
        for (var i = 0; i < colors.length; i++) {
            if (colors[i].key === key) {
                return colors[i];
            }
        }
        return {key: 'none', color: '', text: ''};
    };

    TB.register_module(self);
} // usernotes() wrapper

(function() {
    window.addEventListener('TBModuleLoaded', function () {
        usernotes();
    });
})();
