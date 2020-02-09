'use strict';

function usernotes () {
    const self = new TB.Module('User Notes');
    self.shortname = 'UserNotes';

    // //Default settings
    self.settings['enabled']['default'] = true;

    self.register_setting('unManagerLink', {
        type: 'boolean',
        default: true,
        title: 'Show usernotes manager in modbox',
    });
    self.register_setting('showDate', {
        type: 'boolean',
        default: false,
        title: 'Show date in note preview',
    });
    self.register_setting('showOnModPages', {
        type: 'boolean',
        default: false,
        title: 'Show current usernote on ban/contrib/mod pages',
    });
    self.register_setting('maxChars', {
        type: 'number',
        default: 20,
        advanced: true,
        title: 'Max characters to display in current note tag (excluding date)',
    });

    self.register_setting('onlyshowInhover', {
        type: 'boolean',
        default: TB.storage.getSetting('GenSettings', 'onlyshowInhover', true),
        hidden: true,
    });
    self.init = function () {
        self.usernotesManager();
        self.usernotes();
    };

    self.usernotes = function usernotes () {
        const subs = [],
              $body = $('body'),
              maxChars = self.setting('maxChars'),
              showDate = self.setting('showDate');
        let firstRun = true;

        const TYPE_NEW_MODMAIL = 'newmodmail';

        TBCore.getModSubs(() => {
            self.log('Got mod subs');
            self.log(TBCore.mySubs);
            // In new modmail we only run on threads.

            if (TBCore.isNewModmail) {
                setTimeout(() => {
                    if ($body.find('.ThreadViewer').length > 0) {
                        run();
                    }
                }, 750);
            } else {
                run();
            }
        });

        function getUser (users, name) {
            if (Object.prototype.hasOwnProperty.call(users, name)) {
                return users[name];
            }
            return undefined;
        }

        // NER support.
        let newThingRunning = false;
        window.addEventListener('TBNewThings', () => {
            // It is entirely possible that TBNewThings is fired multiple times.
            // That is why we use a timeout here to prevent run() from being triggered multiple times.
            if (!newThingRunning) {
                newThingRunning = true;
                setTimeout(() => {
                    newThingRunning = false;
                    run();
                }, 500);
            }
        });

        // Queue the processing of usernotes.
        let listnerSubs = {};
        let queueTimeout;

        function queueProcessSub (subreddit, $target) {
            clearTimeout(queueTimeout);
            if (Object.prototype.hasOwnProperty.call(listnerSubs, subreddit)) {
                listnerSubs[subreddit] = listnerSubs[subreddit].add($target);
            } else {
                listnerSubs[subreddit] = $target;
            }
            queueTimeout = setTimeout(() => {
                for (const sub in listnerSubs) {
                    if (Object.prototype.hasOwnProperty.call(listnerSubs, sub)) {
                        processSub(sub, listnerSubs[sub]);
                    }
                }
                listnerSubs = {};
            }, 100);
        }

        function addTBListener () {
            const onlyshowInhover = self.setting('onlyshowInhover');

            // event based handling of author elements.
            TB.listener.on('author', e => {
                const $target = $(e.target);
                if ($target.closest('.tb-thing').length || !onlyshowInhover || TBCore.isOldReddit) {
                    const subreddit = e.detail.data.subreddit.name;
                    const author = e.detail.data.author;
                    $target.addClass('ut-thing');
                    $target.attr('data-subreddit', subreddit);
                    $target.attr('data-author', author);

                    TBCore.getModSubs(() => {
                        if (TBCore.modsSub(subreddit)) {
                            attachNoteTag($target, subreddit, author);
                            foundSubreddit(subreddit);
                            queueProcessSub(subreddit, $target);
                        }
                    });
                }
            });

            // event based handling of author elements.
            TB.listener.on('userHovercard', e => {
                const $target = $(e.target);
                const subreddit = e.detail.data.subreddit.name;
                const author = e.detail.data.user.username;
                $target.addClass('ut-thing');
                $target.attr('data-subreddit', subreddit);
                $target.attr('data-author', author);

                TBCore.getModSubs(() => {
                    if (TBCore.modsSub(subreddit)) {
                        attachNoteTag($target, subreddit, author, {
                            customText: 'Usernotes',
                        });
                        foundSubreddit(subreddit);
                        queueProcessSub(subreddit, $target);
                    }
                });
            });
        }

        function run () {
            // This can be done better, but this is for the new modmail user sidebar thing.
            if ($body.find('.ThreadViewer').length > 0) {
                const subreddit = $body.find('.ThreadTitle__community').text(),
                      author = $body.find('.InfoBar__username').text();

                const $thing = $body.find('.ThreadViewer__infobar');
                $thing.addClass('ut-thing');
                $thing.attr('data-author', author);
                $thing.attr('data-subreddit', subreddit);

                if ($thing.find('.tb-attr-note').length === 0) {
                    $thing.find('.tb-recents').append('<span class="tb-attr-note InfoBar__recent"></span>');
                }

                const $tbAttrs = $thing.find('.tb-attr-note');
                attachNoteTag($tbAttrs, subreddit, author, {
                    customText: 'Usernotes',
                });

                foundSubreddit(subreddit);
                processSub(subreddit);
            }

            self.log('Running usernotes');

            // This is only used in newmodmail until that also gets the event based api.
            if (TBCore.domain === 'mod' && $body.find('.ThreadViewer').length > 0) {
                const things = findThings();
                let done = false;
                TBCore.forEachChunked(
                    things, 30, 100, processThing, () => {
                        self.log('Done processing things');
                        TBCore.forEachChunked(subs, 10, 200, processSub, () => {
                            if (done) {
                                self.printProfiles();
                            }
                        });
                    },
                    () => {
                        self.log('Done processing things');
                        done = true;
                    }
                );
            }

            // We only need to add the listener on pageload.
            if (firstRun && !TBCore.isNewModmail) {
                addTBListener();
                firstRun = false;

            //
            } else if (!TBCore.isNewModmail) {
                TBCore.forEachChunked(subs, 10, 200, processSub);
            }
        }

        function findThings () {
            let $things;
            if (TBCore.domain === 'mod' && $body.find('.ThreadViewer').length > 0) {
                $things = $('.Thread__message:not(.ut-thing)');
                $things.attr('data-ut-type', TYPE_NEW_MODMAIL);
                $things.addClass('ut-thing');
            }
            return $things;
        }

        function processThing (thing) {
            self.startProfile('process-thing');
            let subreddit,
                author;

            const $thing = $(thing),
                  thingType = $thing.attr('data-ut-type');
            // self.log("Processing thing: " + thingType);

            if (thingType === TYPE_NEW_MODMAIL) {
                subreddit = $thing.closest('.Thread').find('.ThreadTitle__community').text();
                author = $thing.find('.Message__author').text().substring(2);

                $thing.attr('data-author', author);
                $thing.attr('data-subreddit', subreddit);

                if ($thing.find('.tb-attr').length === 0) {
                    $thing.find('.Message__divider').eq(0).after('<span class="tb-attr"></span>');
                }

                const $tbAttrs = $thing.find('.tb-attr');
                attachNoteTag($tbAttrs, subreddit, author);

                foundSubreddit(subreddit);
            } else {
                self.log(`Unknown thing type ${thingType} (THIS IS BAD)`);
            }

            self.endProfile('process-thing');
        }

        function attachNoteTag ($element, subreddit, author, options = {}) {
            if ($element.find('.tb-usernote-button').length > 0) {
                return;
            }

            const usernoteDefaultText = options.customText ? options.customText : 'N';
            const $tag = $(`
                <a href="javascript:;" id="add-user-tag" class="tb-bracket-button tb-usernote-button add-usernote-${subreddit}" data-author="${author}" data-subreddit="${subreddit}" data-default-text="${usernoteDefaultText}">${usernoteDefaultText}</a>
            `);

            $element.append($tag);
        }

        function foundSubreddit (subreddit) {
            if ($.inArray(subreddit, subs) === -1) {
                subs.push(subreddit);
            }
        }

        function processSub (subreddit, customThings) {
            if (!subreddit) {
                return;
            }

            self.log(`Processing sub: ${subreddit}`);
            self.getUserNotes(subreddit, (status, notes) => {
                self.log(`Usernotes retrieved for ${subreddit}: status=${status}`);
                if (!status) {
                    return;
                }
                if (!isNotesValidVersion(notes)) {
                // Remove the option to add notes
                    $(`.add-usernote-${subreddit}`).remove();

                    // Alert the user
                    const msg = notes.ver > TBCore.notesMaxSchema ?
                        `You are using a version of toolbox that cannot read a newer usernote data format in: /r/${subreddit}. Please update your extension.` :
                        `You are using a version of toolbox that cannot read an old usernote data format in: /r/${subreddit}, schema v${notes.ver}. Message /r/toolbox for assistance.`;

                    TBCore.alert(msg, clicked => {
                        if (clicked) {
                            window.open(notes.ver > TBCore.notesMaxSchema ? '/r/toolbox/wiki/get' :
                                `/message/compose?to=%2Fr%2Ftoolbox&subject=Outdated%20usernotes&message=%2Fr%2F${subreddit}%20is%20using%20usernotes%20schema%20v${notes.ver}`);
                        }
                    });
                }

                self.getSubredditColors(subreddit, colors => {
                    setNotes(notes, subreddit, colors, customThings);
                });
            });
        }

        function isNotesValidVersion (notes) {
            if (notes.ver < TBCore.notesMinSchema || notes.ver > TBCore.notesMaxSchema) {
                self.log('Failed usernotes version check:');
                self.log(`\tnotes.ver: ${notes.ver}`);
                self.log(`\tTBCore.notesSchema: ${TBCore.notesSchema}`);
                self.log(`\tTBCore.notesMinSchema: ${TBCore.notesMinSchema}`);
                self.log(`\tTBCore.notesMaxSchema: ${TBCore.notesMaxSchema}`);
                return false;
            }

            return true;
        }

        function setNotes (notes, subreddit, colors, customThings) {
            self.log(`Setting notes for ${subreddit}`);
            self.startProfile('set-notes');

            self.startProfile('set-notes-find');
            let things;
            if (customThings) {
                things = customThings;
            } else {
                things = $(`.ut-thing[data-subreddit=${subreddit}]`);
            }

            self.endProfile('set-notes-find');

            TBCore.forEachChunked(things, 20, 100, thing => {
                self.startProfile('set-notes-process');

                // Get all tags related to the current subreddit
                const $thing = $(thing),
                      user = $thing.attr('data-author'),
                      u = getUser(notes.users, user);

                let $usertag;
                if (TBCore.isEditUserPage) {
                    $usertag = $thing.parent().find(`.add-usernote-${subreddit}`);
                } else {
                    $usertag = $thing.find(`.add-usernote-${subreddit}`);
                }

                // Only happens if you delete the last note.
                const defaultButtonText = $usertag.attr('data-default-text'),
                      currentText = $usertag.text();
                if ((u === undefined || u.notes.length < 1) && currentText !== defaultButtonText) {
                    $usertag.css('color', '');
                    $usertag.empty();
                    $usertag.text(defaultButtonText);

                    self.endProfile('set-notes-process');
                    return;
                } else if (u === undefined || u.notes.length < 1) {
                    self.endProfile('set-notes-process');
                    return;
                }

                const noteData = u.notes[0],
                      date = new Date(noteData.time);
                let note = noteData.note;

                // Add title before note concat.
                $usertag.attr('title', `${note} (${date.toLocaleString()})`);

                if (note.length > maxChars) {
                    note = `${note.substring(0, maxChars)}...`;
                }

                if (showDate) {
                    note = `${note} (${date.toLocaleDateString({
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                    })})`;
                }

                $usertag.empty();
                $usertag.append($('<b>').text(note)).append($('<span>').text(u.notes.length > 1 ? `  (+${u.notes.length - 1})` : ''));

                let type = u.notes[0].type;
                if (!type) {
                    type = 'none';
                }

                const color = self._findSubredditColor(colors, type);
                if (color) {
                    $usertag.css('color', color.color);
                } else {
                    $usertag.css('color', '');
                }

                self.endProfile('set-notes-process');
            }, () => {
                self.endProfile('set-notes');
            });
        }

        function createUserPopup (subreddit, user, link, disableLink, e) {
            const $overlay = $(e.target).closest('.tb-page-overlay');
            let $appendTo;
            if ($overlay.length) {
                $appendTo = $overlay;
            } else {
                $appendTo = $('body');
            }
            const $popup = TB.ui.popup({
                title: `<div class="utagger-title">
                    <span>User Notes - <a href="${TBCore.link(`/user/${user}`)}" id="utagger-user-link">/u/${user}</a></span>
                </div>`,
                tabs: [{
                    content: `
                        <div class="utagger-content">
                            <table class="utagger-notes">
                                <tbody>
                                    <tr>
                                        <td class="utagger-notes-td1">Author</td>
                                        <td class="utagger-notes-td2">Note</td>
                                        <td class="utagger-notes-td3"></td></tr>
                                </tbody>
                            </table>
                            <table class="utagger-types">
                                <tbody>
                                    <tr class="utagger-type-list"></tr>
                                </tbody>
                            </table>
                            <div class="utagger-input-wrapper">
                                <input type="text" class="utagger-user-note tb-input" id="utagger-user-note-input" placeholder="something about the user..." data-link="${link}" data-subreddit="${subreddit}" data-user="${user}">
                                <label class="utagger-include-link">
                                    <input type="checkbox" ${!disableLink ? 'checked' : ''}${disableLink ? 'disabled' : ''}>
                                    <span>Include link</span>
                                </label>
                            </div>
                        </div>
                    `,

                    footer: `
                        <div class="utagger-footer">
                            <span class="tb-popup-error" style="display: none;"></span>
                            <input type="button" class="utagger-save-user tb-action-button" id="utagger-save-user" value="Save for /r/${subreddit}">
                        </div>
                    `,
                }],
                cssClass: 'utagger-popup',
            });

            // defined so we can easily add things to these specific areas after loading the notes.
            const $noteList = $popup.find('.utagger-content .utagger-notes tbody'),
                  $typeList = $popup.find('.utagger-types tbody .utagger-type-list');

            // We want to make sure windows fit on the screen.
            const positions = TBui.drawPosition(e);

            $popup.css({
                left: positions.leftPosition,
                top: positions.topPosition,
            });
            $appendTo.append($popup);

            // Generate dynamic parts of dialog and show
            self.getSubredditColors(subreddit, colors => {
                self.log('Adding colors to dialog');

                // Create type/color selections
                const group = `${Math.random().toString(36)}00000000000000000`.slice(2, 7);

                colors.forEach(info => {
                    self.log(`  ${info.key}`);
                    self.log(`    ${info.text}`);
                    self.log(`    ${info.color}`);
                    $typeList.append(`
                    <td>
                        <label class="utagger-type type-${info.key}">
                            <input type="checkbox" name="type-group-${group}" value="${info.key}" class="type-input type-input-${info.key}">
                            <span style="color: ${info.color}">${info.text}</span>
                        </label>
                    </td>
                    `);
                });

                // Radio buttons 2.0, now with deselection
                $popup.find('.utagger-type').click(function () {
                    const $thisInput = $(this).find('input');
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
                self.getUserNotes(subreddit, (status, notes) => {
                    if (!status) {
                        return;
                    }

                    const u = getUser(notes.users, user);
                    // User has notes
                    if (u !== undefined && u.notes.length > 0) {
                    // FIXME: not selecting previous type
                        $popup.find(`.utagger-type .type-input-${u.notes[0].type}`).prop('checked', true);

                        u.notes.forEach((note, i) => {
                        // if (!note.type) {
                        //    note.type = 'none';
                        // }

                            self.log(`  Type: ${note.type}`);
                            const info = self._findSubredditColor(colors, note.type);
                            self.log(info);

                            // TODO: probably shouldn't rely on time truncated to seconds as a note ID; inaccurate.
                            // The ID of a note is set to its time when the dialog is generated. As of schema v5,
                            // times are truncated to second accuracy. This means newly-added notes that have yet
                            // to be saved — and therefore still retain millisecond accuracy — may not be considered
                            // equal to saved versions if compared. This caused problems when deleting new notes,
                            // which searches a saved version based on ID.
                            const noteId = Math.trunc(note.time / 1000) * 1000,
                                  noteString = TBHelpers.htmlEncode(note.note),
                                  timeString = new Date(note.time).toLocaleString();

                            // Construct some elements separately
                            let timeDiv;

                            if (note.link) {
                                if (TBCore.isNewModmail && !note.link.startsWith('https://mod.reddit.com')) {
                                    note.link = `https://www.reddit.com${note.link}`;
                                }
                                timeDiv = `<div class="utagger-date" id="utagger-date-${i}"><a href="${note.link}">${timeString}</a></div>`;
                            } else {
                                timeDiv = `<div class="utagger-date" id="utagger-date-${i}">${timeString}</div>`;
                            }

                            let typeSpan = '';
                            if (info && info.text) {
                                typeSpan = `<span class="note-type" style="color: ${info.color}">[${TBHelpers.htmlEncode(info.text)}]</span>`;
                            }

                            // Add note to list
                            $noteList.append(`
                            <tr class="utagger-note">
                                <td class="utagger-notes-td1">
                                    <div class="utagger-mod">${note.mod}</div>
                                    ${timeDiv}
                                </td>
                                <td class="utagger-notes-td2">
                                    ${typeSpan}
                                    <span class="note-text">${noteString}</span>
                                </td>
                                <td class="utagger-notes-td3"><i class="utagger-remove-note tb-icons tb-icons-negative" data-note-id="${noteId}">${TBui.icons.delete}</i></td>
                            </tr>
                            `);
                        });
                    } else {
                        // No notes on user
                        $popup.find('#utagger-user-note-input').focus();
                    }
                });
            });
        }

        // Click to open dialog
        $body.on('click', '#add-user-tag', e => {
            const $target = $(e.target);
            const $thing = $target.closest('.ut-thing');
            const $button = $thing.find('#add-user-tag');

            const subreddit = $button.attr('data-subreddit'),
                  user = $button.attr('data-author'),
                  disableLink = false; // FIXME: change to thing type
            let link;

            if (TBCore.isNewModmail) {
                link = TBCore.getThingInfo($thing).permalink;
                createUserPopup(subreddit, user, link, disableLink, e);
            } else {
                let thingID;
                let thingDetails;

                if ($thing.data('tb-type') === 'TBcommentAuthor' || $thing.data('tb-type') === 'commentAuthor') {
                    thingDetails = $thing.data('tb-details');
                    thingID = thingDetails.data.comment.id;
                } else if ($thing.data('tb-type') === 'userHovercard') {
                    thingDetails = $thing.data('tb-details');
                    thingID = thingDetails.data.contextId;
                } else {
                    thingDetails = $thing.data('tb-details');
                    thingID = thingDetails.data.post.id;
                }

                TBCore.getApiThingInfo(thingID, subreddit, true, info => {
                    link = info.permalink;
                    createUserPopup(subreddit, user, link, disableLink, e);
                });
            }
        });

        // Cancel button clicked
        $body.on('click', '.utagger-popup .close', function () {
            $(this).parents('.utagger-popup').remove();
        });

        // Save or delete button clicked
        $body.on('click', '.utagger-save-user, .utagger-remove-note', function (e) {
            self.log('Save or delete pressed');
            const $popup = $(this).closest('.utagger-popup'),
                  $unote = $popup.find('.utagger-user-note'),
                  subreddit = $unote.attr('data-subreddit'),
                  user = $unote.attr('data-user'),
                  noteId = $(e.target).attr('data-note-id'),
                  noteText = $unote.val(),
                  deleteNote = $(e.target).hasClass('utagger-remove-note'),
                  type = $popup.find('.utagger-type input:checked').val();
            let link = '';

            if ($popup.find('.utagger-include-link input').is(':checked')) {
                link = $unote.attr('data-link');
            }

            self.log('deleteNote', deleteNote);
            // Check new note data states
            if (!deleteNote) {
                if (!noteText) {
                // User forgot note text!
                    $unote.addClass('error');

                    const $error = $popup.find('.tb-popup-error');
                    $error.text('Note text is required');
                    $error.show();

                    return;
                } else if (!user || !subreddit) {
                // We seem to have an problem beyond the control of the user
                    return;
                }
            }

            // Create new note
            let note = {
                note: noteText.trim(),
                time: new Date().getTime(),
                mod: TBCore.logged,
                link,
                type,
            };

            const userNotes = {
                notes: [],
            };

            userNotes.notes.push(note);

            $popup.remove();

            const noteSkel = {
                ver: TBCore.notesSchema,
                constants: {},
                users: {},
            };

            TBui.textFeedback(`${deleteNote ? 'Removing' : 'Adding'} user note...`, TBui.FEEDBACK_NEUTRAL);

            self.getUserNotes(subreddit, (success, notes, pageError) => {
            // Only page errors git different treatment.
                if (!success && pageError) {
                    self.log('  Page error');
                    switch (pageError) {
                    case TBCore.WIKI_PAGE_UNKNOWN:
                        break;
                    case TBCore.NO_WIKI_PAGE:
                        notes = noteSkel;
                        notes.users[user] = userNotes;
                        self.saveUserNotes(subreddit, notes, 'create usernotes config', succ => {
                            if (succ) {
                                run();
                            }
                        });
                        break;
                    }
                    return;
                }

                let saveMsg;
                if (notes) {
                    if (notes.corrupted) {
                        TBCore.alert('toolbox found an issue with your usernotes while they were being saved. One or more of your notes appear to be written in the wrong format; to prevent further issues these have been deleted. All is well now.');
                    }

                    const u = getUser(notes.users, user);

                    // User already has notes
                    if (u !== undefined) {
                        self.log('User exists');

                        // Delete note
                        if (deleteNote) {
                            self.log('Deleting note');
                            self.log(`  ${noteId}`);

                            self.log('Removing note from:');
                            self.log(u.notes);
                            for (let n = 0; n < u.notes.length; n++) {
                                note = u.notes[n];
                                self.log(`  ${note.time}`);

                                if (note.time.toString() === noteId) {
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
                        } else {
                            // Add note
                            self.log('Adding note');

                            u.notes.unshift(note);
                            saveMsg = `create new note on user ${user}`;
                        }
                    } else if (u === undefined && !deleteNote) {
                        // New user
                        notes.users[user] = userNotes;
                        saveMsg = `create new note on new user ${user}`;
                    }
                } else {
                    self.log('  Creating new user');

                    // create new notes object
                    notes = noteSkel;
                    notes.users[user] = userNotes;
                    saveMsg = `create new notes object, add new note on user ${user}`;
                }

                // Save notes if a message was set (the only case it isn't is if notes are corrupt)
                if (saveMsg) {
                    self.log('Saving notes');
                    self.saveUserNotes(subreddit, notes, saveMsg, succ => {
                        if (succ) {
                            run();
                        }
                    });
                }
            }, true);
        });

        // Enter key pressed when adding new note
        $body.on('keyup', '.utagger-user-note', function (event) {
            if (event.keyCode === 13) {
                const popup = $(this).closest('.utagger-popup');
                popup.find('.utagger-save-user').click();
            }
        });
    };

    self.usernotesManager = function () {
        const $body = $('body'),
              showLink = self.setting('unManagerLink');
        let subUsenotes,
            fetchActive = false;

        if (showLink) {
            window.addEventListener('TBNewPage', event => {
                if (event.detail.pageDetails.subreddit) {
                    const subreddit = event.detail.pageDetails.subreddit;

                    TBCore.getModSubs(() => {
                        if (TBCore.modsSub(subreddit)) {
                            TBui.contextTrigger('tb-un-config-link', {
                                addTrigger: true,
                                triggerText: 'edit usernotes',
                                triggerIcon: TBui.icons.usernote,
                                title: `edit usernotes for /r/${subreddit}`,
                                dataAttributes: {
                                    subreddit,
                                },
                            });
                        } else {
                            TBui.contextTrigger('tb-un-config-link', {addTrigger: false});
                        }
                    });
                } else {
                    TBui.contextTrigger('tb-un-config-link', {addTrigger: false});
                }
            });
        }

        function showSubNotes (status, notes) {
            const $siteTable = $body.find('#tb-un-note-content-wrap');
            const sub = $siteTable.attr('data-subreddit');

            if (!status || !notes) {
                const error = `
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

            const userCount = Object.keys(notes.users).length;
            let noteCount = 0;

            const $userContentTemplate = $(`<div class="tb-un-user" data-user="NONE">
                <div class="tb-un-user-header">
                    <a class="tb-un-refresh tb-icons" data-user="NONE" href="javascript:;">${TBui.icons.refresh}</a>
                    <a class="tb-un-delete tb-icons tb-icons-negative" data-user="NONE" href="javascript:;">${TBui.icons.delete}</a>
                    <span class="user">
                        <a href="${TBCore.link('/u/NONE')}">/u/NONE</a>
                    </span>
                </div>
            </div>`);

            // .append(
            //    $('<div>').addClass('tb-usernotes')
            // );

            self.getSubredditColors(sub, colors => {
                self.startProfile('manager-render');
                TBCore.forEachChunked(
                    Object.keys(notes.users), 50, 50,
                    // Process a user
                    (user, counter) => {
                        if (!fetchActive) {
                            return;
                        }
                        self.startProfile('manager-render-user');
                        const $userContent = $userContentTemplate.clone();
                        $userContent.attr('data-user', user);
                        $userContent.find('.tb-un-refresh, .tb-un-delete').attr('data-user', user);
                        $userContent.find('.user a').attr('href', `/u/${user}`).text(`/u/${user}`);
                        const $userNotes = $('<div>').addClass('tb-usernotes');// $userContent.find(".tb-usernotes");
                        $userContent.append($userNotes);
                        self.endProfile('manager-render-user');

                        TB.ui.textFeedback(`Loading user ${counter} of ${userCount}`, TB.ui.FEEDBACK_POSITIVE);

                        self.startProfile('manager-render-notes');
                        // var notes = [];
                        $.each(notes.users[user].notes, (key, val) => {
                            noteCount++;

                            const color = self._findSubredditColor(colors, val.type);

                            const timeUTC = Math.round(val.time / 1000),
                                  timeISO = TBHelpers.timeConverterISO(timeUTC),
                                  timeHuman = TBHelpers.timeConverterRead(timeUTC);

                            const $note = $(`<div class="tb-un-note-details">
                                <a class="tb-un-notedelete tb-icons tb-icons-negative" data-note="${key}" data-user="${user}" href="javascript:;">${TBui.icons.delete}</a>
                                <span class="note">
                                    <span class="note-type">[${color.text}]</span>
                                    <a class="note-content" href="${val.link}">${val.note}</a>
                                </span>
                                <span>-</span>
                                <span class="mod">by /u/${val.mod}</span>
                                <span>-</span>
                                <time class="live-timestamp timeago" datetime="${timeISO}" title="${timeHuman}">${timeISO}</time>
                            </div>`);

                            // notes.append($note);
                            if (color.key === 'none') {
                                $note.find('.note-type').hide();
                            }
                            $userNotes.append($note);
                            // });
                        });
                        // $userNotes.append(notes);
                        self.endProfile('manager-render-notes');

                        $siteTable.append($userContent);
                    },
                    // Process done
                    () => {
                        self.endProfile('manager-render');
                        fetchActive = false;
                        TB.ui.longLoadSpinner(false, 'Usernotes loaded', TB.ui.FEEDBACK_POSITIVE);

                        const infoHTML = `
            <div class="tb-un-info">
                <span class="tb-info">There are {{usercount}} users with {{notecount}} notes.</span>
                <br> <input id="tb-unote-user-search" type="text" class="tb-input" placeholder="search for user"> <input id="tb-unote-contents-search" type="text" class="tb-input" placeholder="search for note contents">
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

                        const infocontent = TBHelpers.template(infoHTML, {
                            usercount: userCount,
                            notecount: noteCount,
                        });

                        $siteTable.prepend(infocontent);

                        // Set events after all items are loaded.
                        noteManagerRun();

                        self.printProfiles();
                    }
                );
            });
        }

        function noteManagerRun () {
            self.startProfile('manager-run');
            const sub = $body.find('#tb-un-note-content-wrap').attr('data-subreddit');

            $('time.timeago').timeago(); // what does this do?

            // Live search - users
            $body.find('#tb-unote-user-search').keyup(function () {
                const userSearchValue = new RegExp($(this).val().toUpperCase());

                $body.find('.tb-un-user').each(function (key, thing) {
                    userSearchValue.test($(thing).attr('data-user').toUpperCase()) ? $(this).show() : $(this).hide();
                });
            });

            // Live search - contents
            $body.find('#tb-unote-contents-search').keyup(function () {
                const contentsSearchValue = new RegExp($(this).val().toUpperCase());

                $body.find('.note').each(function (key, thing) {
                    const wrapper = $(this).closest('.tb-un-note-details').show();
                    if (contentsSearchValue.test($(thing).text().toUpperCase())) {
                        wrapper.show();
                        wrapper.closest('.tb-un-user').show();
                    } else {
                        wrapper.hide();
                        wrapper.closest('.tb-un-user').hide();
                    }
                });
            });

            // Get the account status for all users.
            $body.find('#tb-un-prune-sb').on('click', () => {
                const emptyProfiles = [],
                      pruneOld = $('.tb-prune-old').prop('checked'),
                      pruneLength = $('.tb-prune-length').val(),
                      now = TBHelpers.getTime(),
                      usersPrune = Object.keys(subUsenotes.users),
                      userCountPrune = usersPrune.length;

                TB.ui.longLoadSpinner(true, 'Pruning usernotes', TB.ui.FEEDBACK_NEUTRAL);

                TBCore.forEachChunkedRateLimit(
                    usersPrune, 20, (user, counter) => {
                        TB.ui.textFeedback(`Pruning user ${counter} of ${userCountPrune}`, TB.ui.FEEDBACK_POSITIVE);

                        TBApi.getLastActive(user, (succ, date) => {
                            if (!succ) {
                                self.log(`${user} is deleted, suspended or shadowbanned.`);
                                $body.find(`#tb-un-note-content-wrap div[data-user="${user}"]`).css('text-decoration', 'line-through');
                                emptyProfiles.push(user);
                            } else if (pruneOld) {
                                const timeSince = now - date * 1000,
                                      daysSince = TBHelpers.millisecondsToDays(timeSince);

                                if (daysSince > pruneLength) {
                                    self.log(`${user} has not been active in: ${daysSince.toFixed()} days.`);
                                    $body.find(`#tb-un-note-content-wrap div[data-user="${user}"]`).css('text-decoration', 'line-through');
                                    emptyProfiles.push(user);
                                }
                            }
                        });
                    },

                    () => {
                    // The previous calls have been async, let's wait a little while before we continue. A better fix might be needed but this might be enough.
                        setTimeout(() => {
                            self.log(emptyProfiles);
                            if (emptyProfiles.length > 0) {
                                const deleteEmptyProfile = confirm(`${emptyProfiles.length} deleted or shadowbanned users. Delete all notes for these users?`);
                                if (deleteEmptyProfile === true) {
                                    self.log('You pressed OK!');

                                    emptyProfiles.forEach(emptyProfile => {
                                        delete subUsenotes.users[emptyProfile];
                                        $body.find(`#tb-un-note-content-wrap div[data-user="${emptyProfile}"]`).css('background-color', 'rgb(244, 179, 179)');
                                    });

                                    TBCore.updateCache('noteCache', subUsenotes, sub);
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
                    }
                );
            });

            // Update user status.
            $body.find('.tb-un-refresh').on('click', function () {
                const $this = $(this),
                      user = $this.attr('data-user'),
                      $userSpan = $this.parent().find('.user');
                if (!$this.hasClass('tb-un-refreshed')) {
                    $this.addClass('tb-un-refreshed');
                    self.log(`refreshing user: ${user}`);
                    TBApi.aboutUser(user, succ => {
                        const $status = TBHelpers.template('&nbsp;<span class="mod">[this user account is: {{status}}]</span>', {
                            status: succ ? 'active' : 'deleted',
                        });

                        $userSpan.after($status);
                    });
                }
            });

            // Delete all notes for user.
            $body.find('.tb-un-delete').on('click', function () {
                const $this = $(this),
                      user = $this.attr('data-user'),
                      $userSpan = $this.parent();

                const r = confirm(`This will delete all notes for /u/${user}.  Would you like to proceed?`);
                if (r === true) {
                    self.log(`deleting notes for ${user}`);
                    delete subUsenotes.users[user];
                    TBCore.updateCache('noteCache', subUsenotes, sub);
                    self.saveUserNotes(sub, subUsenotes, `deleted all notes for /u/${user}`);
                    $userSpan.parent().remove();
                    TB.ui.textFeedback(`Deleted all notes for /u/${user}`, TB.ui.FEEDBACK_POSITIVE);
                }
            });

            // Delete individual notes for user.
            $body.find('.tb-un-notedelete').on('click', function () {
                const $this = $(this),
                      user = $this.attr('data-user'),
                      note = $this.attr('data-note'),
                      $noteSpan = $this.parent();

                self.log(`deleting note for ${user}`);
                subUsenotes.users[user].notes.splice(note, 1);
                TBCore.updateCache('noteCache', subUsenotes, sub);
                self.saveUserNotes(sub, subUsenotes, `deleted a note for /u/${user}`);
                $noteSpan.remove();
                TB.ui.textFeedback(`Deleted note for /u/${user}`, TB.ui.FEEDBACK_POSITIVE);
            });

            self.endProfile('manager-run');
        }

        $body.on('click', '#tb-un-config-link', function () {
            TB.ui.longLoadSpinner(true, 'Loading usernotes', TB.ui.FEEDBACK_NEUTRAL);
            const sub = $(this).attr('data-subreddit');

            TB.ui.overlay(
                `usernotes - /r/${sub}`,
                [
                    {
                        title: `usernotes - /r/${sub}`,
                        tooltip: `edit usernotes for /r/${sub}`,
                        content: `<div id="tb-un-note-content-wrap" data-subreddit="${sub}"></div>`,
                        footer: '',
                    },
                ],
                [], // extra header buttons
                'tb-un-editor', // class
                false // single overriding footer
            ).appendTo('body');
            $body.css('overflow', 'hidden');
            fetchActive = true;

            self.getUserNotes(sub, showSubNotes);
        });

        $body.on('click', '.tb-un-editor .close', () => {
            fetchActive = false;
            $('.tb-un-editor').remove();
            $body.css('overflow', 'auto');
        });
    };

    // Get usernotes from wiki
    self.getUserNotes = function (subreddit, callback, forceSkipCache) {
        self.log(`Getting usernotes (sub=${subreddit})`);

        if (!callback) {
            return;
        }
        if (!subreddit) {
            return returnFalse();
        }

        // Check cache (if not skipped)
        if (!forceSkipCache) {
            if (TBCore.noteCache[subreddit] !== undefined) {
                self.log('notes found in cache');
                callback(true, TBCore.noteCache[subreddit], subreddit);
                return;
            }

            if (TBCore.noNotes.indexOf(subreddit) !== -1) {
                self.log('found in NoNotes cache');
                returnFalse();
                return;
            }
        }

        // Read notes from wiki page
        TBApi.readFromWiki(subreddit, 'usernotes', true, resp => {
        // Errors when reading notes
        // // These errors are bad
            if (!resp || resp === TBCore.WIKI_PAGE_UNKNOWN) {
                self.log('Usernotes read error: WIKI_PAGE_UNKNOWN');
                returnFalse(TBCore.WIKI_PAGE_UNKNOWN);
                return;
            }
            if (resp === TBCore.NO_WIKI_PAGE) {
                TBCore.updateCache('noNotes', subreddit, false);
                self.log('Usernotes read error: NO_WIKI_PAGE');
                returnFalse(TBCore.NO_WIKI_PAGE);
                return;
            }
            // // No notes exist in wiki page
            if (resp.length < 1) {
                TBCore.updateCache('noNotes', subreddit, false);
                self.log('Usernotes read error: wiki empty');
                returnFalse();
                return;
            }

            TBStorage.purifyObject(resp);
            // Success
            self.log('We have notes!');
            const notes = convertNotes(resp, subreddit);

            // We have notes, cache them and return them.
            TBCore.updateCache('noteCache', notes, subreddit);
            if (callback) {
                callback(true, notes, subreddit);
            }
        });

        function returnFalse (pageError) {
            callback(false, null, pageError);
        }

        // Inflate notes from the database, converting between versions if necessary.
        function convertNotes (notes, sub) {
            self.log(`Notes ver: ${notes.ver}`);

            if (notes.ver >= TBCore.notesMinSchema) {
                if (notes.ver <= 5) {
                    notes = inflateNotes(notes, sub);
                } else if (notes.ver <= 6) {
                    notes = decompressBlob(notes);
                    notes = inflateNotes(notes, sub);
                }

                if (notes.ver <= TBCore.notesDeprecatedSchema) {
                    self.log(`Found deprecated notes in ${subreddit}: S${notes.ver}`);

                    TBCore.alert(
                        `The usernotes in /r/${subreddit} are stored using schema v${notes.ver}, which is deprecated. Please click here to updated to v${TBCore.notesSchema}.`,
                        clicked => {
                            if (clicked) {
                            // Upgrade notes
                                self.saveUserNotes(subreddit, notes, `Updated notes to schema v${TBCore.notesSchema}`, succ => {
                                    if (succ) {
                                        TB.ui.textFeedback('Notes saved!', TB.ui.FEEDBACK_POSITIVE);
                                        TBCore.clearCache();
                                        window.location.reload();
                                    }
                                });
                            }
                        }
                    );
                }

                return notes;
            } else {
                returnFalse();
            }

            // Utilities
            function decompressBlob (notes) {
                const decompressed = TBHelpers.zlibInflate(notes.blob);

                // Update notes with actual notes
                delete notes.blob;
                notes.users = JSON.parse(decompressed);
                return notes;
            }
        }

        // Decompress notes from the database into a more useful format
        function inflateNotes (deflated, sub) {
            const inflated = {
                ver: deflated.ver,
                users: {},
            };

            const mgr = new self._constManager(deflated.constants);

            self.log('Inflating all usernotes');
            $.each(deflated.users, (name, user) => {
                inflated.users[name] = {
                    name,
                    notes: user.ns.map(note => inflateNote(deflated.ver, mgr, note, sub)),
                };
            });

            return inflated;
        }

        // Inflates a single note
        function inflateNote (version, mgr, note, sub) {
            return {
                note: TBHelpers.htmlDecode(note.n),
                time: inflateTime(version, note.t),
                mod: mgr.get('users', note.m),
                link: self._unsquashPermalink(sub, note.l),
                type: mgr.get('warnings', note.w),
            };
        }

        // Date/time utilities
        function inflateTime (version, time) {
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
        if (notes.ver < TBCore.notesSchema) {
            notes.ver = TBCore.notesSchema;
        }

        // Update cache
        TBCore.updateCache('noteCache', notes, sub);

        // Deconvert notes to wiki format
        notes = deconvertNotes(notes);

        // Write to wiki page
        self.log('Saving usernotes to wiki...');
        TBApi.postToWiki('usernotes', sub, notes, reason, true, false, (succ, jqXHR) => {
            if (succ) {
                self.log('Success!');
                TBui.textFeedback('Save complete!', TBui.FEEDBACK_POSITIVE, 2000);
                if (callback) {
                    callback(true);
                }
            } else {
                self.log(`Failure: ${jqXHR.status}`);
                let reason;
                if (jqXHR.status === 413) {
                    reason = 'usernotes full';
                } else {
                    reason = jqXHR.responseText;
                }
                self.log(`  ${reason}`);

                TBui.textFeedback(`Save failed: ${reason}`, TBui.FEEDBACK_NEGATIVE, 5000);
                if (callback) {
                    callback(false);
                }
            }
        });

        // Deconvert notes to wiki format based on version (note: deconversion is actually conversion in the opposite direction)
        function deconvertNotes (notes) {
            if (notes.ver <= 5) {
                self.log('  Is v5');
                return deflateNotes(notes);
            } else if (notes.ver <= 6) {
                self.log('  Is v6');
                notes = deflateNotes(notes);
                return compressBlob(notes);
            }
            return notes;

            // Utilities
            function compressBlob (notes) {
            // Make way for the blob!
                const users = JSON.stringify(notes.users);
                delete notes.users;

                notes.blob = TBHelpers.zlibDeflate(users);
                return notes;
            }
        }

        // Compress notes so they'll store well in the database.
        function deflateNotes (notes) {
            const deflated = {
                ver: TBCore.notesSchema > notes.ver ? TBCore.notesSchema : notes.ver, // Prevents downgrading usernotes version like a butt
                users: {},
                constants: {
                    users: [],
                    warnings: [],
                },
            };

            const mgr = new self._constManager(deflated.constants);

            $.each(notes.users, (name, user) => {
                deflated.users[name] = {
                    ns: user.notes.filter(note => {
                        if (note === undefined) {
                            self.log('WARNING: undefined note removed');
                        }
                        return note !== undefined;
                    }).map(note => deflateNote(notes.ver, note, mgr)),
                };
            });

            return deflated;
        }

        // Compresses a single note
        function deflateNote (version, note, mgr) {
            self.log(note);
            return {
                n: note.note,
                t: deflateTime(version, note.time),
                m: mgr.create('users', note.mod),
                l: self._squashPermalink(note.link),
                w: mgr.create('warnings', note.type),
            };
        }

        // Compression utilities
        function deflateTime (version, time) {
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
    self._constManager = function _constManager (init_pools) {
        return {
            _pools: init_pools,
            create (poolName, constant) {
                const pool = this._pools[poolName];
                const id = pool.indexOf(constant);
                if (id !== -1) {
                    return id;
                }
                pool.push(constant);
                return pool.length - 1;
            },
            get (poolName, id) {
                return this._pools[poolName][id];
            },
        };
    };

    self._squashPermalink = function (permalink) {
        if (!permalink) {
            return '';
        }

        // Compatibility with Sweden
        const COMMENTS_LINK_RE = /\/comments\/(\w+)\/(?:[^/]+\/(?:(\w+))?)?/,
              MODMAIL_LINK_RE = /\/messages\/(\w+)/;

        const linkMatches = permalink.match(COMMENTS_LINK_RE),
              modMailMatches = permalink.match(MODMAIL_LINK_RE),
              newModMailMatches = permalink.startsWith('https://mod.reddit.com');

        if (linkMatches) {
            let squashed = `l,${linkMatches[1]}`;
            if (linkMatches[2] !== undefined) {
                squashed += `,${linkMatches[2]}`;
            }
            return squashed;
        } else if (modMailMatches) {
            return `m,${modMailMatches[1]}`;
        } else if (newModMailMatches) {
            return permalink;
        } else {
            return '';
        }
    };

    self._unsquashPermalink = function (subreddit, permalink) {
        if (!permalink) {
            return '';
        }

        if (permalink.startsWith('https://mod.reddit.com')) {
            return permalink;
        } else {
            const linkParams = permalink.split(/,/g);
            let link = `/r/${subreddit}/`;

            if (linkParams[0] === 'l') {
                link += `comments/${linkParams[1]}/`;
                if (linkParams.length > 2) {
                    link += `-/${linkParams[2]}/`;
                }
            } else if (linkParams[0] === 'm') {
                link += `message/messages/${linkParams[1]}`;
            } else {
                return '';
            }

            return link;
        }
    };

    // Per-subreddit coloring
    self.getSubredditColors = function (subreddit, callback) {
        self.log(`Getting subreddit colors for /r/${subreddit}`);
        TBCore.getConfig(subreddit, config => {
            self.log(`  Config retrieved for /r/${subreddit}`);
            if (config && config.usernoteColors && config.usernoteColors.length > 0) {
                callback(config.usernoteColors);
            } else {
                self.log(`  Config not retrieved for ${subreddit}, using default colors`);

                // Use default colors
                callback(TBCore.defaultUsernoteTypes);
            }
        });
    };

    self._findSubredditColor = function (colors, key) {
    // TODO: make more efficient for repeated operations, like using an object
        for (let i = 0; i < colors.length; i++) {
            if (colors[i].key === key) {
                return colors[i];
            }
        }
        return {key: 'none', color: '', text: ''};
    };

    TB.register_module(self);
} // usernotes() wrapper

window.addEventListener('TBModuleLoaded', () => {
    usernotes();
});
