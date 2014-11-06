
function modbutton(){
// @copyright 2014 Toolbox Devs, dakta

var modButton = new TB.Module('Mod Button');

modButton.settings["enabled"]["default"] = true;
modButton.config["betamode"] = false;
modButton.config["needs_mod_subs"] = true;

modButton.register_setting(
    "sublist", {
        "type": "sublist",
        "default": [],
        "betamode": false,
        "hidden": false,
        "title": "Saved subs (for quick access)"
    });
// can't call this inside because it doesn't know the default value yet
// can't call it plain because it uses TB.utils.mySubs
TB.utils.getModSubs(function init() {
    modButton.settings['sublist']["args"] = [TB.utils.mySubs, modButton.setting('sublist')];
});

modButton.register_setting(
    "rememberlastaction", {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Remember last action"
    });
modButton.register_setting(
    "lastaction", {
        "type": "text",
        "default": "ban",
        "betamode": false,
        "hidden": true,
    });
modButton.register_setting(
    "globalbutton", {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Enable Global Action button"
    });

var $body = $('body');

// Add mod button to all users
modButton.processThing = function processThing(thing) {
    if (!$(thing).hasClass('mod-button')) {
        // Add the class so we don't add buttons twice.
        $(thing).addClass('mod-button');

        // Defer info gathering until button is clicked.
        $(thing).find('.buttons > li:last').before('<li><a href="javascript:;" class="global-mod-button">' + modButton.buttonName + '</a></li>');
    }
};

// need this for RES NER support
modButton.run = function run() {
    // do it differently on the about mod page.
    if (TB.utils.isEditUserPage) {

        $('span.user').each(function () {
            $(this).find('a:first').after('<span> - <a href="javascript:;" class="global-mod-button">' + modButton.buttonName + '</a></span>');
        });

        return;
    }

    // Not a mod, don't bother.
    if (TB.utils.mySubs.length < 1) {
        return;
    }

    var $things = $('div.thing .entry:not(.mod-button)');
    TB.utils.forEachChunked($things, 15, 500, modButton.processThing);

    // WIP selector for adding modbutton for #207
    // lifted from RES, with modifications. thanks /u/honestbleeps
    // $('div.md a[href^="/u/"]:not([href*="/m/"]), div.md a[href*="reddit.com/u/"]:not([href*="/m/"]), div.wiki-page-content .author');
};

/**
 *  updates the current savedsubs' listings in the mod button
 */
modButton.updateSavedSubs = function updateSavedSubs() {
    //
    // Refresh the settings tab and role tab sub dropdowns and saved subs tabls
    //
    var $popups = $body.find('.mod-popup'),
        $savedSubsLists = $popups.find('.saved-subs');

    // clear out the current stuff
    $savedSubsLists.html('');

    // add our saved subs to the "remove saved subs" dropdown on the setting tab
    // and to the saved subs savedSubsList on the role tab
    $popups.each(function () {
        var $popup = $(this),
            $savedSubsList = $popup.find('.saved-subs'),
            currentSub = $popup.find('.subreddit').text();

        // repopulate the saved sub dropdowns with all the subs we mod
        $popup.find('.edit-subreddits .savedSubs').remove();
        $popup.find('.edit-subreddits').prepend(TB.ui.selectMultiple(TB.utils.mySubs, modButton.savedSubs).addClass('savedSubs'));

        $.each(modButton.savedSubs, function (i, subreddit) {
            // only subs we moderate
            // and not the current sub
            if ($.inArray(subreddit, TB.utils.mySubs) != -1
                && subreddit != currentSub
            ) {
                $savedSubsList.append('<div><input type="checkbox" class="action-sub" name="action-sub" value="' + this +
                    '" id="action-' + this + '"><label for="action-' + this + '">&nbsp;&nbsp;/r/' + this + '</label></div>');
            }
        });
    });

    $.each(TB.utils.mySubs, function (i, subreddit) {
        $popups.find('select.' + modButton.OTHER)
            .append($('<option>', {
                    value: subreddit
                })
                .text('/r/' + subreddit));
    });
};

modButton.init = function init() {
    modButton.buttonName = 'mod';
    modButton.saveButton = 'Save';
    modButton.OTHER = 'other-sub';

    modButton.savedSubs = modButton.setting('sublist');

    var rememberLastAction = modButton.setting('rememberlastaction'),
        showglobal = modButton.setting('globalbutton');

    modButton.savedSubs = TB.utils.saneSort(modButton.savedSubs);

    // it's Go Time™!
    modButton.run();

    // NER support.
    window.addEventListener("TBNewThings", function () {
        modButton.run();
    });

    // Mod button clicked
    $body.on('click', '.global-mod-button', function (event) {
        var benbutton = event.target; //huehuehue
        $(benbutton).text('loading...');

        var display = (modButton.savedSubs.length < 1) ? 'none' : '',
            lastaction = modButton.setting('lastaction'),
            info = TB.utils.getThingInfo(this, true),
            subreddit = info.subreddit,
            user = info.user,
            thing_id = info.id;

        //$.log('modbutton ' + subreddit, true);

        // no user?
        if (!user) {
            $(benbutton).text('error');
            $(benbutton).css('color', 'red');
            // abort
            return;
        }

        // generate the .mod-popup jQuery object
        $popup = TB.ui.popup(
            'Mod Actions  - /u/' + user,
            [
                {
                    title: "Role",
                    id: 'user-role', // reddit has things with class .role, so it's easier to do this than target CSS
                    tooltip: 'Add or remove user from subreddit ban, contributor, and moderator lists.',
                    content:
                        (subreddit
                            ? '\
                        <div class="current-sub">\
                            <input type="checkbox" class="action-sub" name="action-sub" value="' + subreddit + '" id="action-' + subreddit + '" checked>\
                            <label for="action-' + subreddit + '">&nbsp;&nbsp;/r/' + subreddit + ' (current)</label>\
                        </div>'
                            : ''
                        ) + '\
                        <div class="saved-subs">\
                        </div>\
                        <div class="other-subs">\
                            <input type="checkbox" class="action-sub ' + modButton.OTHER + '-checkbox name="action-sub" value="' + modButton.OTHER + '">\
                            <select class="' + modButton.OTHER + '" for="action-' + modButton.OTHER + '"><option value="' + modButton.OTHER + '">(select subreddit)</option></select>\
                        </div>\
                        <div class="ban-note-container"><input id="ban-note" class="ban-note" type="text" placeholder="(ban note)" maxlength="300"></input><br>\
                        <textarea name="ban-message" class="ban-message" placeholder="(ban message to user)" ></textarea><br>\
                        <input type="number" min="1" max="999" name="ban-duration"  class="ban-duration" placeholder="time (days)"> <label class="ban-span-include-time"><input type="checkbox" name="ban-include-time" class="ban-include-time" value="ban-include-time"> Include in message </label>\
                        </div>',
                    footer: '\
                        <span class="status error left"></span>\
                        <select class="mod-action">\
                            <option class="mod-action-negative" data-action="banned" data-api="friend">ban</option> \
                            <option class="mod-action-positive" data-action="banned" data-api="unfriend">unban</option> \
                            <option class="mod-action-positive" data-action="contributor" data-api="friend">approve</option> \
                            <option class="mod-action-negative" data-action="contributor" data-api="unfriend" >unapprove</option> \
                            <option class="mod-action-positive" data-action="moderator" data-api="friend">mod</option> \
                            <option class="mod-action-negative" data-action="moderator" data-api="unfriend" >demod</option> \
                        </select>\
                        <button class="save">' + modButton.saveButton + '</button>\
                        <button title="Global Action (perform action on all subs)" class="global-button"' + (showglobal ? '' : 'style="display:none;"') + ';">Global Action</button>'
                },
                {
                    title: "User Flair",
                    tooltip: "Edit User Flair.",
                    content: '\
                            <p style="clear:both;" class="mod-popup-flair-input"><label for="flair-text" class="mod-popup-flair-label">Text:</label><input id="flair-text" class="flair-text" type="text"></input></p>\
                            <p style="clear:both;" class="mod-popup-flair-input"><label for="flair-class" class="mod-popup-flair-label">Class:</label><input id="flair-class" class="flair-class" type="text"></input></p>',
                    footer: '\
                        <span class="status error left"></span>\
                        <button class="flair-save">Save Flair</button>'
                },
                {
                    title: "Send Message",
                    tooltip: "Send a message from the subreddit.",
                    content: '\
                            <input id="subreddit-message-subject" class="subreddit-message-subject" type="text" placeholder="(subject)" maxlength="100"></input><br>\
                            <textarea name="subreddit-message" class="subreddit-message" placeholder="(message to user)" ></textarea><br>\
                            <span id="subreddit-message-callback"></span>\
                            ',
                    footer: '\
                        <span class="status error left"></span>\
                        <button class="message-send">Send Message</button>'
                },
                {
                    title: "Settings",
                    tooltip: "Edit Mod Button Settings.",
                    content: '\
                        <div class="edit-subreddits">\
                            <p style="clear:both">\
                                <label class="global-label" for="the-nuclear-option">\
                                    <input class="the-nuclear-option" type="checkbox" id="the-nuclear-option" name="the-nuclear-option" ' + (showglobal ? 'checked' : '' ) + '>\
                                    &nbsp;enable Global Action button.\
                                </label><br />\
                                <label class="last-action-label" for="remember-last-action">\
                                    <input class="remember-last-action" type="checkbox" id="remember-last-action" name="remember-last-action" ' + (rememberLastAction ? 'checked' : '') + '>\
                                    &nbsp;remember last Mod Button action.\
                                </label>\
                            </p>\
                        </div>',
                    footer: '\
                        <span class="status error left"></span>\
                        <button class="setting-save">Save Settings</button>'
                }
            ],
            '<label class="user">' + user + '</label><label class="subreddit">' + subreddit + '</label><label class="thing_id">' + thing_id + '</label>',
            'mod-popup' // class
        ).appendTo('body')
        .css({
            left: event.pageX - 50,
            top: event.pageY - 10,
            display: 'block'
        });


        // // wtf even happened to this originally?
        // $.each(TB.utils.mySubs, function (i, v) {
        //     $popup.find('select.'+modButton.OTHER).append($('<option></option>').text(this).attr('value', this));
        // });

        if (rememberLastAction) {
            $popup.find('select.mod-action').val(lastaction);
        }

        // Remove options that only apply to subs we mod
        if (!subreddit) {
            // Hide the flair tab and message tab
            // TODO: add a "disabled" state, with tooltip, and use that instead
            // We can only edit flair in the current sub.
            $popup.find('.tb-popup-tabs .user_flair').remove();
            $popup.find('.tb-popup-tabs .send_message').remove();
            // We can oly nuke comments in subs we mod.
            $popup.find('.tb-popup-tabs .nuke_comment_chain').remove();
        }

        if (TB.utils.isModmail || TB.utils.isModpage) {
            // Nothing to nuke in mod mail or on mod pages.
            $popup.find('.nuke_comment_chain').remove();
        }

        // only works if we're a mod of the sub in question
        if (subreddit) {
            var user_fullname = ''; // type t2_xxx

            // Show if current user is banned, and why. - thanks /u/LowSociety
            // TODO: Display *when* they were banned, along with ban note. #194
            $.get("/r/" + subreddit + "/about/banned/.json", { user : user }, function (data) {
                var banned = data.data.children;
                for (var i = 0; i < banned.length; i++) {
                    if (banned[i].name.toLowerCase() == user.toLowerCase()) {
                        user_fullname = banned[i].id; // we need this to extract data from the modlog

                        var timestamp = new Date(banned[i].date * 1000); // seconds to milliseconds

                        $popup.find(".current-sub").append($('<div class="already-banned">banned by <a href="#"></a> </div>'));
                        $popup.find(".current-sub .already-banned").append($('<time>').attr('datetime', timestamp.toISOString()).timeago());

                        $popup.find("select.mod-action option[data-api=unfriend][data-action=banned]").attr("selected", "selected");
                        $popup.find(".ban-note").val(banned[i].note);
                        $popup.find('.tb-popup-title').css('color', 'red');

                        // get the mod who banned them (need to pull request to get this in the banlist data to avoid this kind of stupid request)
                        $.get("/r/" + subreddit + "/about/log/.json", { type: 'banuser', limit: '1000' }, function (data) {
                            var logged = data.data.children;
                            for (var i = 0; i < logged.length; i++) {
                                if (logged[i].data.target_fullname == user_fullname) {
                                    $popup.find(".current-sub .already-banned a").attr('href', '/u/'+logged[i].data.mod).text(logged[i].data.mod);
                                    break;
                                }
                            }
                        });

                        break;
                    }
                }
                return;
            });
        }

        // if we're on the mod page, it's likely we want to mod them to another sub.
        // unselect current, change action to 'mod'.
        if (location.pathname.match(/\/about\/(?:moderator)\/?/)) {
            $popup.find('select.mod-action option[data-api=friend][data-action=moderator]').attr('selected', 'selected');
            $popup.find('.ban-note').hide();
            $popup.find('.action-sub:checkbox:checked').removeAttr('checked');

            $popup.find('textarea.ban-message').hide();
            $popup.find('.ban-duration').hide();
            $popup.find('.ban-span-include-time').hide();
        } else if (location.pathname.match(/\/about\/(?:contributors)\/?/)) {
            $popup.find('select.mod-action option[data-api=friend][data-action=contributor]').attr('selected', 'selected');
            $popup.find('.ban-note').hide();
            $popup.find('.action-sub:checkbox:checked').removeAttr('checked');

            $popup.find('textarea.ban-message').hide();
            $popup.find('.ban-duration').hide();
            $popup.find('.ban-span-include-time').hide();
        }

        // render the saved subs lists
        modButton.updateSavedSubs();

        // custom sub changed.
        $popup.find('select.' + modButton.OTHER).change(function () {
            $popup.find('.' + modButton.OTHER + '-checkbox').prop('checked', ($(this).val() !== modButton.OTHER));
        });

        // show/hide ban reason text feild.
        $popup.find('.mod-action').change(function () {
            var $banNote = $popup.find('.ban-note'),
                $banMessage = $popup.find('textarea.ban-message'),
                $banDuration = $popup.find('.ban-duration'),
                $banIncludeTime = $popup.find('.ban-span-include-time');
            if ($(this).val() == 'ban') {
                $banNote.show();
                $banMessage.show();
                $banDuration.show();
                $banIncludeTime.show();
            } else {
                $banNote.hide();
                $banMessage.hide();
                $banDuration.hide();
                $banIncludeTime.hide();
            }
        });

        // reset button name.
        $(benbutton).text(modButton.buttonName);

        return false;
    });

    // 'save' button clicked...  THIS IS WHERE WE BAN PEOPLE, PEOPLE!
    $body.on('click', '.mod-popup .save, .global-button', function () {

        var $button = $(this),
            $popup = $button.parents('.mod-popup'),
            $selected = $popup.find('.mod-action :selected'),
            api = $selected.attr('data-api'),
            action = $selected.attr('data-action'),
            actionName = $selected.val(),
            $status = $popup.find('.status'),
            banReason = $popup.find('.ban-note').val(),
            banMessage = $popup.find('textarea.ban-message').val(),
            banDuration = $popup.find('.ban-duration').val(),
            subreddits = [],
            user = $popup.find('.user').text();

            if (isNaN(banDuration)) {
                banDuration = '';
            } else if($popup.find('.ban-include-time').is(':checked') && banDuration > 0) {
                $.log('Including time in ban message', true);
                banMessage = banMessage + '  \n \n\
*You are banned for: '+ TBUtils.humaniseDays(banDuration) +'*';
            }

        modButton.setting('lastaction', actionName);

        // Check dem values.
        if (!api) return $status.text('error, no action selected');

        if (!$(this).hasClass('global-button')) {

            // Get dem ban subs.
            $popup.find('.action-sub:checkbox:checked').each(function () {
                if ($(this).val() !== modButton.OTHER) {
                    subreddits.push($(this).val());
                } else {
                    var subname = $('.' + modButton.OTHER + ' option:selected').val();
                    if (subname !== modButton.OTHER) {
                        subreddits.push(subname);

                    }
                }
            });

            // Check dem values.
            if (subreddits.length < 1) return $status.text('error, no subreddits selected');

            // do it.
            massAction(subreddits);
        } else {
            if (actionName === 'ban' || actionName === 'unban') {
                var confirmban = confirm("This will " + actionName + " /u/" + user + " from every subreddit you moderate.   \nAre you sure?");
            } else {
                var confirmban = confirm("This will " + actionName + " /u/" + user + " on every subreddit you moderate.   \nAre you sure?");
            }
            
            if (confirmban) {
                massAction(TB.utils.mySubs);
            } else {
                return;
            }
        }

        var $timer;
        function completeCheck(failedSubs) {
            $timer.stop();
            TB.utils.pageOverlay(null, false);
            if (failedSubs.length > 0) {
                var retry = confirm(failedSubs.length + " failed.  Would you like to retry them?");
                if (retry) {
                    $.log('retrying');
                    massAction(failedSubs);
                } else {
                    $.log('not retrying');
                    $('.mod-popup').remove();
                    return;
                }
            } else {
                $.log('complete');
                $('.mod-popup').remove();
            }
        }

        function rateLimit(seconds) {
            var delay = seconds * 1000;
            $status.text("API ratelimit sleeping for: " + seconds + " seconds");
            TB.utils.pageOverlay("API ratelimit sleeping for: " + seconds + " seconds");
            setTimeout(function () {
                $.log('resuming');
                $timer.play();
            }, delay);
        }

        function massAction(subs) {
            //$('.mod-popup').hide();
            var failedSubs = [];
            var actionCount = 0;

            // Ban dem trolls.
            TB.utils.pageOverlay("", true);
            $timer = $.timer(function () {
                var sub = $(subs).get(actionCount);

                TB.utils.pageOverlay(actionName + 'ning /u/' + user + ' from /r/' + sub, undefined);

                $.log('banning from: ' + sub);
                $.post('/api/' + api, {
                    uh: TB.utils.modhash,
                    type: action,
                    name: user,
                    r: sub,
                    note: banReason,
                    ban_message: banMessage,
                    duration: banDuration,
                    api_type: 'json'
                })
                .success(function (resp) {

                    if (!$.isEmptyObject(resp) && !$.isEmptyObject(resp.json.errors) && resp.json.errors[0][0] === 'RATELIMIT') {
                       $timer.pause();
                       $.log('ratelimited');
                       rateLimit(resp.json.ratelimit);
                    }
                })
                .error(function (error, more) {
                    $.log('missed one');
                    failedSubs.push(sub);
                });

                actionCount++;

                if (actionCount === subs.length) {
                    $.log('completed ban round');
                    completeCheck(failedSubs);
                }

            }, 250, true); //ban tax.
        }
    });

    // 'cancel' button clicked
    $body.on('click', '.mod-popup .close', function () {
        $(this).parents('.mod-popup').remove();
    });

    $body.on('click', '.nuke-comment-chain', function () {
        var $popup = $(this).parents('.mod-popup'),
            thing_id = $popup.find('.thing_id').text();

        $.log(thing_id);
    });

    // send a message to the user.
    $body.on('click', '.mod-popup .message-send', function () {

        TBUtils.longLoadSpinner(true);
        var $popup = $(this).parents('.mod-popup'),
            user = $popup.find('.user').text(),
            subreddit = $popup.find('.subreddit').text(),
            $callbackSpan = $popup.find('.send_message #subreddit-message-callback'),
            $subredditMessageSubject = $popup.find('.send_message .subreddit-message-subject'),
            $subredditMessage = $popup.find('.send_message .subreddit-message');

        if(!$subredditMessageSubject.val() ||  !$subredditMessage.val()) {
            $callbackSpan.text('You forgot a subject or message');
            $callbackSpan.css('color', 'red');
            TBUtils.longLoadSpinner(false);
            return;
        } else {
            var subject  = $subredditMessageSubject.val(),
                message = $subredditMessage.val();
        }

        TBUtils.sendMessage(user, subject, message, subreddit, function(successful, response) {
            if (!successful) {
                $callbackSpan.text('an error occurred: ' + response[0][1]);
                TBUtils.longLoadSpinner(false);
            } else {
                if (response.json.errors.length) {
                    $callbackSpan.text(response.json.errors[1]);
                    TBUtils.longLoadSpinner(false);
                    return
                } else {
                    $callbackSpan.text('message send');
                    $callbackSpan.css('color', 'green');
                    TBUtils.longLoadSpinner(false);
                }

            };
        });

    });

    // Flair ALL THE THINGS
    $body.on('click', '.tb-popup-tabs .user_flair', function () {
        var $popup = $(this).parents('.mod-popup'),
            $status = $popup.find('.status'),
            user = $popup.find('.user').text(),
            subreddit = $popup.find('.subreddit').text(),
            $textinput = $popup.find('.flair-text'),
            $classinput = $popup.find('.flair-class');

        if (!user || !subreddit) return;

        $.getJSON('/r/' + subreddit + '/api/flairlist.json?name=' + user, function (resp) {
            if (!resp || !resp.users || resp.users.length < 1) return;

            $textinput.val(resp.users[0].flair_text);
            $classinput.val(resp.users[0].flair_css_class);
        });
    });


    // Edit save button clicked.
    $body.on('click', '.flair-save', function () {
        var $popup = $(this).parents('.mod-popup'),
            $status = $popup.find('.status'),
            user = $popup.find('.user').text(),
            subreddit = $popup.find('.subreddit').text(),
            text = $popup.find('.flair-text').val(),
            css_class = $popup.find('.flair-class').val();

        $status.text("saving user flair...");

        /*
        if (!text && !css_class) {
            $.post('/api/deleteflair', {
                api_type: 'json',
                name: user,
                r: subreddit,
                uh: TB.utils.modhash
            })

            .error(function (err) {
                console.log(err.responseText);
                $popup.remove();
                return;
            })

            .success(function () {
                $popup.remove();
                return;
            });

            return;
        }
        */

        $.post('/api/flair', {
            api_type: 'json',
            name: user,
            text: text,
            css_class: css_class,
            r: subreddit,
            uh: TB.utils.modhash
        })
        .done(function () {
            $status.text("saved user flair");
            // $popup.remove();
        })
        .fail(function (err) {
            $.log(err.responseText, true);
            $status.text(err.responseText);
            // $popup.remove();
        });

    });


    // Edit save button clicked.
    $body.on('click', '.setting-save', function () {
        var $popup = $(this).parents('.mod-popup'),
            $savedSubsList = $popup.find('.saved-subs'),
            $status = $popup.find('.status');

        $status.text('saving settings...');

        // Enable/disable global ban button.
        showglobal = modButton.setting('globalbutton', $('.the-nuclear-option').is(':checked'));

        // Enable/disable remember last action
        rememberLastAction = modButton.setting('rememberlastaction', $('.remember-last-action').is(':checked'));

        // show the global-button in the footer, if enabled
        if (modButton.setting('globalbutton')) {
            $('.mod-popup .global-button').show();
        } else {
            // disabled? Make sure it's not shown
            $('.mod-popup .global-button').hide();
        }

        // clean up
        modButton.savedSubs = [];
        // repopulate
        $.each($popup.find('.savedSubs .selected-list option'), function() {
            modButton.savedSubs.push($(this).val());
        });
        // sort alphabetical
        modButton.savedSubs = TB.utils.saneSort(modButton.savedSubs);
        // save
        modButton.setting('sublist', modButton.savedSubs);

        // re-render the lists
        modButton.updateSavedSubs();

        $status.text('settings saved');
    });
};

TB.register_module(modButton);

}

(function () {
    window.addEventListener("TBObjectLoaded", function () {
        $.log("got tbobject");
        modbutton();
    });
})();
