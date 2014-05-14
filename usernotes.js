// ==UserScript==
// @name        Mod User Notes
// @namespace   http://www.reddit.com/r/toolbox
// @author      agentlame, creesch
// @description Create and display user notes for mods.
// @include     *://www.reddit.com/*
// @include     *://reddit.com/*
// @include     *://*.reddit.com/*
// @downloadURL http://userscripts.org/scripts/source/170091.user.js
// @version     1.5.0
// ==/UserScript==

(function usernotes() {
    if (!TBUtils.logged || !TBUtils.getSetting('UserNotes', 'enabled', true)) return;
    $.log('Loading User Notes Module');

    var subs = [];

    TBUtils.getModSubs(function () {
        run();
    });
    
    // Compatibility with Sweden
    var COMMENTS_LINK_RE = /\/comments\/(\w+)\/[^\/]+(\/(\w+))?\/?(\?.*)?$/;
    var MODMAIL_LINK_RE = /\/messages\/(\w+)\/?(\?.*)?$/;
    
    var ConstManager = function(init_pools) {
        return {
            _pools: init_pools,
            create: function(poolName, constant) {
                var pool = this._pools[poolName];
                var id = pool.indexOf(constant);
                if(id !== -1)
                    return id;
                pool.push(constant);
                return pool.length - 1;
            },
            get: function(poolName, id) {
                return this._pools[poolName][id];
            }
        };
    }
    
    function getUser(users, name) {
        if(users.hasOwnProperty(name)) {
            return users[name];
        }
        return undefined;
    }
    
    function squashPermalink(permalink) {
        var linkMatches = permalink.match(COMMENTS_LINK_RE);
        var modMailMatches = permalink.match(MODMAIL_LINK_RE);
        if(linkMatches) {
            var squashed = "l," + linkMatches[1];
            if(linkMatches[3] !== undefined)
                squashed += "," + linkMatches[3];
            return squashed
        } else if(modMailMatches) {
            return "m," + modMailMatches[1];
        } else {
            return "";
        }
    }
    
    function unsquashPermalink(subreddit, permalink) {
        var linkParams = permalink.split(/,/g);
        var link = "http://www.reddit.com/r/" + subreddit + "/";
        
        if(linkParams[0] == "l") {
            link += "comments/" + linkParams[1] + "/";
            if(linkParams.length > 2)
                link += "a/" + linkParams[2] + "/";
        } else if(linkParams[0] == "m") {
            link += "message/messages/" + linkParams [1];
        } else {
            return "";
        }
        return link;
    }

    function postToWiki(sub, json) {
        TBUtils.noteCache[sub] = json;
        json = deflateNotes(json);

        TBUtils.postToWiki('usernotes', sub, json, true, false, function done(succ, err) {
            if (succ) {
                run();
            } else {
                $.log(err.responseText, true);
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
            notes.users.forEach(function(user) {
                user.notes.forEach(function(note) {
                    note.note = unescape(note.note);
                });
            });
            return notes;
        }
        
        function keyOnUsername(notes) {
            // we have to rebuild .users to be an object keyed on .name
            var users = {};
            notes.users.forEach(function(user){
                users[user.name] = {
                    "notes": user.notes
                }
            });
            notes.users = users;
            return notes;
        }
        
        if(notes.ver <= 2) {
        var newUsers = [];
        var corruptedNotes = false;
            //TODO: v2 support drops next version
            notes.users.forEach(function(user) {
                if(!user.hasOwnProperty('name') || !user.hasOwnProperty('notes')) { 
                    corruptedNotes = true;
                } else {
                user.notes.forEach(function(note) {
                   if(note.link && note.link.trim()) {
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
        } else if(notes.ver == 3) {
            notes = keyOnUsername(decodeNoteText(inflateNotesV3(notes)));
            notes.ver = TBUtils.notesSchema;
            return notes;
        } else if(notes.ver == 4) {
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
        
        $.each(notes.users, function(name, user) {
            deflated.users[name] = {
                "ns": user.notes.map(function(note) {
                    return {
                        "n": note.note,
                        "t": note.time,
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
        
        $.each(deflated.users, function(name, user) {
            notes.users[name] = {
                "name": name,
                "notes": user.ns.map(function(note) {
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
        
        notes.users = deflated.users.map(function(user) {
            return {
                "name": mgr.get("users", user.u),
                "notes": user.ns.map(function(note) {
                    var note = inflateNote(mgr, note);
                    if(note.link) note.link = "l," + note.link;
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
            "time": note.t,
            "mod": mgr.get("users", note.m),
            "link": note.l,
            "type": mgr.get("warnings", note.w),
        };
    }
    
    function setNotes(notes, subreddit) {
        //$.log("notes = " + notes);
        //$.log("notes.ver = " + notes.ver);
        
        // schema check.
        if (notes.ver > TBUtils.notesSchema) {
          
          // Remove the option to add notes.
          $('.usernote-span-' + subreddit).remove();
          
            TBUtils.alert("You are using a version of toolbox that cannot read a newer usernote data format.  Please update your extension.", function(clicked) {
                if (clicked) window.open("http://www.reddit.com/r/toolbox/wiki/download");
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
                note = note.substring(0, 50)+"...";
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

    $('body').delegate('#add-user-tag', 'click', function (e) {
        var thing = $(e.target).closest('.thing .entry'),
            info = TBUtils.getThingInfo(thing),
            subreddit = info.subreddit,
            user = info.user,
            link = squashPermalink(info.permalink);

        // Make box & add subreddit radio buttons
        var popup = $(
            '<div class="utagger-popup">\
                <div class="utagger-popup-header">\
                    User Notes - <a href="http://reddit.com/u/' + user + '" id="utagger-user-link">/u/' + user + '</a>\
                    <span class="close right"><a href="javascript:;">✕</a></span>\
                </div>\
                <div class="utagger-popup-content">\
                    <table class="utagger-notes"><tbody><tr>\
                        <td class="utagger-notes-td1">Author</td>\
                        <td class="utagger-notes-td2">Note</td>\
                        <td class="utagger-notes-td3"></td>\
                    </tr></tbody></table>\
                    <table class="utagger-type"><tbody>\
                    <tr>\
                    <td><input type="radio" name="type-group" class="utagger-type-input" id="utagger-type-none" value="none" checked/><label for="utagger-type-none" style="color: #369;">None</label></td>\
                    </tr>\
                    </tbody></table>\
                    <span>\
                        <input type="text" placeholder="something about the user..." class="utagger-user-note" id="utagger-user-note-input" data-link="' + link + '" data-subreddit="' + subreddit + '" data-user="' + user + '">\
                        <br><label><input type="checkbox" class="utagger-include-link" checked /> include link</label>\
                    </span>\
                </div>\
                <div class="utagger-popup-footer">\
                        <input type="button" class="utagger-save-user" id="utagger-save-user" value="save for /r/' + subreddit + '">\
                </div>\
                </div>'
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
            if(u !== undefined) {
                popup.find('#utagger-type-' + u.notes[0].type).prop('checked',true);
                
                var i = 0;
                $(u.notes).each(function () {
                    if (!this.type) this.type = 'none';

                    var info = TBUtils.getTypeInfo(this.type);
                    var typeSpan = '';

                    if (info.name) {
                        typeSpan = '<span style="color: ' + info.color + ';">[' + TBUtils.htmlEncode(info.name) + ']</span> ';
                    }
                    
                    popup.find('table.utagger-notes').append('<tr><td class="utagger-notes-td1">' + this.mod + ' <br> <span class="utagger-date" id="utagger-date-' + i + '">' + new Date(this.time).toLocaleString() + '</span></td><td lass="utagger-notes-td2">' + typeSpan + this.note + '</td><td class="utagger-notes-td3"><img class="utagger-remove-note" noteid="' + this.time + '" src="data:image/png;base64,' + TBUtils.iconclose + '" /></td></tr>');
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
    $('body').delegate('.utagger-popup .close', 'click', function () {
        $(this).parents('.utagger-popup').remove();
    });

    $('body').delegate('.utagger-save-user, .utagger-remove-note', 'click', function (e) {
        var popup = $(this).closest('.utagger-popup'),
            unote = popup.find('.utagger-user-note'),
            subreddit = unote.attr('data-subreddit'),
            user = unote.attr('data-user'),
            noteid = $(e.target).attr('noteid'),
            noteText = unote.val(),
            deleteNote = (e.target.className == 'utagger-remove-note'),
            type = popup.find('.utagger-type-input:checked').val(),
            link = '',
            note = TBUtils.note,
            notes = TBUtils.usernotes;

        if (popup.find('.utagger-include-link').is(':checked')) {
            link = unote.attr('data-link');
        }

        if ((!user || !subreddit || !noteText) && !deleteNote) return;

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

        $(popup).remove();
        
        var noteSkel = {
            "ver": TBUtils.notesSchema,
            "constants": {},
            "users":{}
        };

        TBUtils.readFromWiki(subreddit, 'usernotes', true, function (resp) {
            if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                return;
            }

            if (resp === TBUtils.NO_WIKI_PAGE) {
                notes = noteSkel;
                notes.users[user] = userNotes;
                postToWiki(subreddit, notes);
                return;
            }

            // if we got this far, we have valid JSON
            
            notes = resp = convertNotes(resp);

            if (notes.corrupted) {
                TBUtils.alert('Toolbox found an issue with your usernotes while they were being saved. One or more of your notes appear to be written in the wrong format; to prevent further issues these have been deleted. All is well now.');
            }
            
            if (notes) {
                var u = getUser(notes.users, user);
                if(u !== undefined) {
                    // Delete. 
                    if (deleteNote) {
                        $(u.notes).each(function (idx) {

                            if (this.time == noteid) {
                                u.notes.splice(idx, 1);
                            }
                        });
                        
                        if(u.notes.length < 1) {
                            delete notes.users[user];
                        }

                        postToWiki(subreddit, notes);
                    // Add.
                    } else {
                        u.notes.unshift(note);
                        postToWiki(subreddit, notes);
                    }
                
                // Adding a note for previously unknown user
                } else if (u === undefined && !deleteNote) {
                    notes.users[user] = userNotes;
                    postToWiki(subreddit, notes);
                }
            } else {
                notes = noteSkel;
                notes.users[user] = userNotes;
                postToWiki(subreddit, notes);
            }
        });
    });

    $('body').delegate('.utagger-cancel-user', 'click', function () {
        var popup = $(this).closest('.utagger-popup');
        $(popup).remove();
    });
    
    $('body').delegate('.utagger-user-note', 'keyup', function (event) {
        if(event.keyCode == 13) {
            $.log("Enter pressed!", true);
            var popup = $(this).closest('.utagger-popup');
            popup.find('.utagger-save-user').click();
        }
    });

})();
