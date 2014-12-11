function usernotes() {
//Setup
var usernotes = new TB.Module('User Notes');
usernotes.shortname = "UserNotes";

////Default settings
usernotes.settings['enabled']['default'] = true;

usernotes.init = function () {
    var subs = [];

    if (window.location.href.indexOf('/about/usernotes/') > -1) {

        //userNotes.log(TBUtils.post_site);  // that should work?
        var sub = $('.pagename a:first').html();
        var $siteTable = $('.content');
        $siteTable.html('');

        function getSubNotes(currsub) {
            usernotes.log('getting notes: ' + currsub);
            if (TBUtils.noteCache[currsub] !== undefined) {
                showSubNotes(TBUtils.noteCache[currsub], currsub);
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

                resp = convertNotes(resp);

                TBUtils.noteCache[currsub] = resp;
                showSubNotes(resp, currsub);
            });
        }

        function showSubNotes(notes) {

            $.each(notes.users, function (key, val) {

                var user = val.name;

                var userHTML = '\
                <div class="tb-un-user un-{{user}}">\
                    <span class="user"><a href="https://www.reddit.com/user/{{user}}">{{user}}</a></span>\
                    <div class="tb-usernotes">\
                    </div>\
                </div></br></br>';

                var usercontent = TBUtils.template(userHTML, {
                    'user': user
                });

                $siteTable.append(usercontent);

                $.each(val.notes, function (key, val) {
                    usernotes.log(key);
                    usernotes.log(val);

                    var noteHTML = '&nbsp;-&nbsp;<span class="note"><a href="{{link}}">{{note}}</a></span></br>';

                    var notecontent = TBUtils.template(noteHTML, {
                        'note': val.note,
                        'link': unsquashPermalink(sub, val.link)
                    });

                    $siteTable.find('.un-' + user).append(notecontent);
                });


                //

            });

        }

        getSubNotes(sub);
    }

    TBUtils.getModSubs(function () {
        run();
    });

    // Compatibility with Sweden
    var COMMENTS_LINK_RE = /\/comments\/(\w+)\/[^\/]+(\/(\w+))?\/?(\?.*)?$/;
    var MODMAIL_LINK_RE = /\/messages\/(\w+)\/?(\?.*)?$/;

    var ConstManager = function (init_pools) {
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

    function getUser(users, name) {
        if (users.hasOwnProperty(name)) {
            return users[name];
        }
        return undefined;
    }

    function squashPermalink(permalink) {
        var linkMatches = permalink.match(COMMENTS_LINK_RE);
        var modMailMatches = permalink.match(MODMAIL_LINK_RE);
        if (linkMatches) {
            var squashed = "l," + linkMatches[1];
            if (linkMatches[3] !== undefined)
                squashed += "," + linkMatches[3];
            return squashed
        } else if (modMailMatches) {
            return "m," + modMailMatches[1];
        } else {
            return "";
        }
    }

    function unsquashPermalink(subreddit, permalink) {
        var linkParams = permalink.split(/,/g);
        var link = "/r/" + subreddit + "/";

        if (linkParams[0] == "l") {
            link += "comments/" + linkParams[1] + "/";
            if (linkParams.length > 2)
                link += "a/" + linkParams[2] + "/";
        } else if (linkParams[0] == "m") {
            link += "message/messages/" + linkParams [1];
        } else {
            return "";
        }
        return link;
    }

    function postToWiki(sub, json, reason) {
        TBUtils.noteCache[sub] = json;
        json = deflateNotes(json);

        usernotes.log("Saving usernotes to wiki...");
        TBUtils.postToWiki('usernotes', sub, json, reason, true, false, function postToWiki(succ, err) {
            if (succ) {
                usernotes.log("Success!");
                run();
            } else {
                usernotes.log("Failure: " + err);
            }
        });
    }

    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();
    });

    function processThing(thing) {

        if ($(thing).hasClass('ut-processed')) {
            return;
        }
        $(thing).addClass('ut-processed');

        var subreddit = TBUtils.getThingInfo(thing, true).subreddit;

        if (!subreddit) return;

        var tag = '<span class="usernote-span-' +
            subreddit + '" style="color:#888888; font-size:x-small;">&nbsp;[<a class="add-user-tag-' +
            subreddit + '" id="add-user-tag" "href="javascript:;">N</a>]</span>';

        $(thing).attr('subreddit', subreddit);

        // More mod mail hackery... all this to see your own tags in mod mail.  It's likely not worth it.
        var userattrs = $(thing).find('.userattrs');
        if ($(userattrs).length > 0) {
            $(userattrs).after(tag);
        } else {
            $(thing).find('.head').append(tag);
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

            resp = convertNotes(resp);

            TBUtils.noteCache[currsub] = resp;
            setNotes(resp, currsub);
        });
    }

    // Inflate notes from the database, converting between versions if necessary.
    function convertNotes(notes) {
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
                            note.link = squashPermalink(note.link);
                        }
                    });
                    newUsers.push(user);
                }
            });
            notes.users = newUsers;
            notes.ver = TBUtils.notesSchema;
            notes.corrupted = corruptedNotes;
            return keyOnUsername(decodeNoteText(notes));
        } else if (notes.ver == 3) {
            notes = keyOnUsername(decodeNoteText(inflateNotesV3(notes)));
            notes.ver = TBUtils.notesSchema;
            return notes;
        } else if (notes.ver == 4) {
            return inflateNotes(notes);
        }

        //TODO: throw an error if unrecognized version?
    }

    // Compress notes so they'll store well in the database.
    function deflateNotes(notes) {
        var deflated = {
            ver: TBUtils.notesSchema,
            users: {},
            constants: {
                users: [],
                warnings: []
            }
        };

        var mgr = new ConstManager(deflated.constants);

        $.each(notes.users, function (name, user) {
            deflated.users[name] = {
                "ns": user.notes.map(function (note) {
                    return {
                        "n": note.note,
                        "t": deflateTime(note.time),
                        "m": mgr.create("users", note.mod),
                        "l": note.link,
                        "w": mgr.create("warnings", note.type),
                    };
                })
            };
        });

        return deflated;
    }

    // Decompress notes from the database into a more useful format
    function inflateNotes(deflated) {
        var notes = {
            ver: TBUtils.notesSchema,
            users: {}
        };

        var mgr = new ConstManager(deflated.constants);

        $.each(deflated.users, function (name, user) {
            notes.users[name] = {
                "name": name,
                "notes": user.ns.map(function (note) {
                    return inflateNote(mgr, note);
                })
            };
        });

        return notes;
    }

    // Decompress notes from the database into a more useful format (MIGRATION ONLY)
    function inflateNotesV3(deflated) {
        var notes = {
            ver: 3,
            users: []
        };

        var mgr = new ConstManager(deflated.constants);

        notes.users = deflated.users.map(function (user) {
            return {
                "name": mgr.get("users", user.u),
                "notes": user.ns.map(function (note) {
                    var note = inflateNote(mgr, note);
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
    function inflateNote(mgr, note) {
        return {
            "note": TBUtils.htmlDecode(note.n),
            "time": inflateTime(note.t),
            "mod": mgr.get("users", note.m),
            "link": note.l,
            "type": mgr.get("warnings", note.w),
        };
    }

    //Date/time utilities
    function inflateTime(time) {
        if (TBUtils.notesSchema >= 5 && time.toString().length <= 10) {
            time *= 1000;
        }
        return time;
    }

    function deflateTime(time) {
        if (TBUtils.notesSchema >= 5 && time.toString().length > 10) {
            time = Math.trunc(time/1000);
        }
        return time;
    }

    function setNotes(notes, subreddit) {
        //$.log("notes = " + notes);
        //$.log("notes.ver = " + notes.ver);

        // schema check.
        if (notes.ver > TBUtils.notesSchema) {

            // Remove the option to add notes.
            $('.usernote-span-' + subreddit).remove();

            TBUtils.alert("You are using a version of toolbox that cannot read a newer usernote data format.  Please update your extension.", function (clicked) {
                if (clicked) window.open("/r/toolbox/wiki/download");
            });
            return;
        }

        var things = $('div.thing .entry[subreddit=' + subreddit + ']');
        TBUtils.forEachChunked(things, 25, 250, function (thing) {
            var user = TBUtils.getThingInfo(thing).user;

            var u = getUser(notes.users, user);
            var usertag = $(thing).find('.add-user-tag-' + subreddit);

            // Only happens if you delete the last note.
            if (u === undefined || u.notes.length < 1) {
                $(usertag).css('color', '');
                $(usertag).text('N');
                return;
            }

            note = u.notes[0].note;
            if (note.length > 53)
                note = note.substring(0, 50) + "...";
            $(usertag).html('<b>' + TBUtils.htmlEncode(note) + '</b>' + ((u.notes.length > 1) ? '  (+' + (u.notes.length - 1) + ')' : ''));

            var type = u.notes[0].type;
            if (!type) type = 'none';

            $(usertag).css('color', TBUtils.getTypeInfo(type).color);

        });
    }

    function run() {
        var things = $('div.thing .entry:not(.ut-processed)');

        TBUtils.forEachChunked(things, 25, 500, processThing, function () {
            TBUtils.forEachChunked(subs, 10, 500, processSub);
        });
    }

    var $body = $('body');

    $body.on('click', '#add-user-tag', function (e) {
        var thing = $(e.target).closest('.thing .entry'),
            info = TBUtils.getThingInfo(thing),
            subreddit = info.subreddit,
            user = info.user,
            link = squashPermalink(info.permalink);

        // Make box & add subreddit radio buttons
        // var popup = $(
        //     '<div class="utagger-popup">\
        //         <div class="utagger-popup-header">\
        //             User Notes - <a href="http://reddit.com/u/' + user + '" id="utagger-user-link">/u/' + user + '</a>\
        //             <span class="close right"><a href="javascript:;">✕</a></span>\
        //         </div>\
        //         <div class="utagger-popup-content">\
        //             <table class="utagger-notes"><tbody><tr>\
        //                 <td class="utagger-notes-td1">Author</td>\
        //                 <td class="utagger-notes-td2">Note</td>\
        //                 <td class="utagger-notes-td3"></td>\
        //             </tr></tbody></table>\
        //             <table class="utagger-type"><tbody>\
        //             <tr>\
        //             <td><input type="radio" name="type-group" class="utagger-type-input" id="utagger-type-none" value="none" checked/><label for="utagger-type-none" style="color: #369;">None</label></td>\
        //             </tr>\
        //             </tbody></table>\
        //             <span>\
        //                 <input type="text" placeholder="something about the user..." class="utagger-user-note" id="utagger-user-note-input" data-link="' + link + '" data-subreddit="' + subreddit + '" data-user="' + user + '">\
        //                 <br><label><input type="checkbox" class="utagger-include-link" checked /> include link</label>\
        //             </span>\
        //         </div>\
        //         <div class="utagger-popup-footer">\
        //                 <input type="button" class="utagger-save-user" id="utagger-save-user" value="save for /r/' + subreddit + '">\
        //         </div>\
        //         </div>'
        // )
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

        TBUtils.readFromWiki(subreddit, 'usernotes', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || resp.length < 1) {
                TBUtils.noNotes.push(subreddit);
                return;
            }

            resp = convertNotes(resp);

            TBUtils.noteCache[subreddit] = resp;

            var u = getUser(resp.users, user);
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
                    '</td><td class="utagger-notes-td3"><img class="utagger-remove-note" noteid="' + this.time + '" src="data:image/png;base64,' + TBui.iconClose + '" /></td></tr>');
                    if (this.link) {
                        popup.find('#utagger-date-' + i).wrap('<a href="' + unsquashPermalink(subreddit, this.link) + '">');
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

    // 'cancel' button clicked
    $body.on('click', '.utagger-popup .close', function () {
        $(this).parents('.utagger-popup').remove();
    });

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

        TBUtils.readFromWiki(subreddit, 'usernotes', true, function (resp) {
            if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                return;
            }

            if (resp === TBUtils.NO_WIKI_PAGE) {
                notes = noteSkel;
                notes.users[user] = userNotes;
                postToWiki(subreddit, notes, 'create usernotes config');
                return;
            }

            // if we got this far, we have valid JSON

            notes = resp = convertNotes(resp);

            if (notes.corrupted) {
                TBUtils.alert('Toolbox found an issue with your usernotes while they were being saved. One or more of your notes appear to be written in the wrong format; to prevent further issues these have been deleted. All is well now.');
            }

            if (notes) {
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

                        postToWiki(subreddit, notes, 'delete note ' + noteid + ' on user ' + user);
                        // Add.
                    } else {
                        u.notes.unshift(note);
                        postToWiki(subreddit, notes, 'create new note on user ' + user);
                    }

                    // Adding a note for previously unknown user
                } else if (u === undefined && !deleteNote) {
                    notes.users[user] = userNotes;
                    postToWiki(subreddit, notes, 'create new note on new user ' + user);
                }
            } else {
                // create new notes object
                notes = noteSkel;
                notes.users[user] = userNotes;
                postToWiki(subreddit, notes, 'create new notes object, add new note on user ' + user);
            }
        });
    });

    $body.on('click', '.utagger-cancel-user', function () {
        var popup = $(this).closest('.utagger-popup');
        $(popup).remove();
    });

    $body.on('keyup', '.utagger-user-note', function (event) {
        if (event.keyCode == 13) {
            usernotes.log("Enter pressed!");
            var popup = $(this).closest('.utagger-popup');
            popup.find('.utagger-save-user').click();
        }
    });
}; // userNotes.init()

TB.register_module(usernotes);

} // usernotes() wrapper

(function () {
    // wait for storage
    window.addEventListener("TBUtilsLoaded", function () {
        usernotes();
    });
})();

