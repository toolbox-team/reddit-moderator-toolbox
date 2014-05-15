// ==UserScript==
// @name        Mod Button
// @namespace   http://www.reddit.com/r/toolbox
// @author      agentlame, creesch, LowSociety
// @description Universal moderator action button.
// @include     http://www.reddit.com/*
// @include     http://reddit.com/*
// @include     http://*.reddit.com/*
// @downloadURL http://userscripts.org/scripts/source/167236.user.js
// @version     1.13
// ==/UserScript==
 
(function modbutton() {
    if (!TBUtils.logged || !TBUtils.getSetting('ModButton', 'enabled', true)) return;
    $.log('Loading Mod Button Module');
 
    var buttonName = 'mod',
        saveButton = 'Save',
        cancelButton = 'Close';
 
    /////// Don't edit beyond this line. ///////
    var OTHER = 'other-sub',
        BANREASON = "(ban reason)",
        savedSubs = TBUtils.getSetting('ModButton', 'sublist', []);
 
    TBUtils.getModSubs(function () {
        savedSubs = TBUtils.saneSort(savedSubs);
        run();
    });
 
    function run() {
        // do it differently on the about mod page.
        if (TBUtils.isEditUserPage) {
 
            $('span.user').each(function () {
                $(this).find('a:first').after('<span> - <a href="javascript:;" class="global-mod-button">' + buttonName + '</a></span>');
            });
 
            return;
        }
 
        // Not a mod, don't bother.
        if (TBUtils.mySubs.length < 1) {
            return;
        }
 
        var $things = $('div.thing .entry:not(.mod-button)');
        TBUtils.forEachChunked($things, 15, 500, processThing);
    }
 
    // Add mod button to all users
    function processThing(thing) {
        if (!$(thing).hasClass('mod-button')) {
            // Add the class so we don't add buttons twice.
            $(thing).addClass('mod-button');
 
            // Defer info gathering until button is clicked.
            $(thing).find('.buttons li:last').before('<li><a href="javascript:;" class="global-mod-button">' + buttonName + '</a></li>');
        }
    }

    // Popup HTML generator
    function toolboxPopup(title, tabs, meta) {
        meta = (meta !== undefined) ? meta : null;

        // tabs = [{id:"", title:"", tooltip:"", help_text:"", help_url:"", content:"", footer:""}];
        var $popup = $('\
<div class="mod-popup">' + (meta ? '<div class="meta" style="display:none">' + meta + '</div>' : '') + '\
    <div class="mod-popup-header">\
        <div class="mod-popup-title">' + title + '</div>\
        <div class="buttons"><a class="close" href="javascript:;">✕</a></div>\
    </div>\
<div>');
        if (tabs.length == 1) {
            $popup.append($('<div class="mod-popup-content">' + tabs[0].content + '</div>'));
            $popup.append($('<div class="mod-popup-footer">' + tabs[0].footer + '</div>'));
        } else if (tabs.length > 1) {
            $popup.append($('<div class="mod-popup-tabs"></div>'));

            for (var i=0; i<tabs.length; i++) {
                var tab = tabs[i];
                if (tab.id === "undefined" || !tab.id) { tab.id = tab.title.trim().toLowerCase().replace(' ', '_'); }
                
                var $button = $('<a'+(tab.tooltip ? ' title="'+tab.tooltip+'"' : '')+' class="'+tab.id+'">'+tab.title+'</a>');
                $button.click({tab: tab}, function (e) {
                    var tab = e.data.tab;

                    // hide others
                    $popup.find('.mod-popup-tabs a').removeClass('active');
                    $popup.find('.mod-popup-tab').hide();

                    // show current
                    $popup.find('.mod-popup-tab.'+tab.id).show();
                    $(this).addClass('active');

                    e.preventDefault();
                });

                // default first tab is active tab
                if (i==0) { $button.addClass('active'); }

                $button.appendTo($popup.find('.mod-popup-tabs'));


                var $tab = $('<div class="mod-popup-tab '+tab.id+'"></div>');
                $tab.append($('<div class="mod-popup-content">'+tab.content+'</div>'));
                $tab.append($('<div class="mod-popup-footer">'+tab.footer+'</div>'));

                // default first tab is visible; hide others
                if (i==0) { $tab.show(); } else { $tab.hide(); }

                $tab.appendTo($popup);
            }
        }

        return $popup;
    }


    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();
    });


    // Mod button clicked
    $('body').delegate('.global-mod-button', 'click', function (event) {
        var benbutton = event.target; //huehuehue
        $(benbutton).text('loading...');
 
        var display = (savedSubs.length < 1) ? 'none' : '',
            showglobal = TBUtils.getSetting('ModButton', 'globalbutton', false),
            info = TBUtils.getThingInfo(this, true),
            subreddit = info.subreddit,
            user = info.user,
            thing_id = info.id;

        //$.log('modbutton ' + subreddit, true);
 
        if (!user) {
            $(benbutton).text('error');
            $(benbutton).css('color', 'red');
            return;
        }
 
        // generate the .mod-popup jQuery object
        $popup = toolboxPopup(
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
                        <div class="other-sub">\
                            <input type="checkbox" class="action-sub ' + OTHER + '-checkbox name="action-sub" value="' + OTHER + '">\
                            <select class="' + OTHER + '" for="action-' + OTHER + '"><option value="' + OTHER + '">(select subreddit)</option></select>\
                        </div>\
                        <div class="ban-note-container"><input id="ban-note" class="ban-note" type="text" value="' + BANREASON + '"></input></div>',
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
                        <button class="save">' + saveButton + '</button>\
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
                    title: "Settings",
                    tooltip: "Edit Mod Button Settings.",
                    content: '\
                        <div class="edit-subreddits">\
                            <select class="remove-dropdown left"></select><button class="remove-save right">remove</button>\
                            <select class="add-dropdown left"></select><button class="add-save right">add</button>\
                            <p style="clear:both">\
                                <label class="global-label" for="the-nuclear-option">\
                                    <input class="the-nuclear-option" type="checkbox" id="the-nuclear-option" name="the-nuclear-option" ' + (showglobal ? 'checked' : '' ) + '>\
                                    &nbsp;enable Global Action button.\
                                </label>\
                            </p>\
                        </div>',
                    footer: '\
                        <span class="status error left"></span>\
                        <button class="setting-save">Save Settings</button>'
                }
            ],
            '<label class="user">' + user + '</label><label class="subreddit">' + subreddit + '</label><label class="thing_id">' + thing_id + '</label>'
        ).appendTo('body')
        .css({
            left: event.pageX - 50,
            top: event.pageY - 10,
            display: 'block'
        });

 
        // Remove options that only apply to subs we mod
        if (!subreddit) {
            // Hide the flair tab
            // TODO: add a "disabled" state, with tooltip, and use that instead
            // We can only edit flair in the current sub.
            $popup.find('.mod-popup-tabs .user_flair').remove();

            // We can oly nuke comments in subs we mod.
            $popup.find('.mod-popup-tabs .nuke_comment_chain').remove();
        }
 
        if (TBUtils.isModmail || TBUtils.isModpage) {
            // Nothing to nuke in mod mail or on mod pages.
            $popup.find('.nuke_comment_chain').remove();
        }

        // only works if we're a mod of the sub in question
        if (subreddit) {
            // Show if current user is banned, and why. - thanks /u/LowSociety
            $.get("http://www.reddit.com/r/" + subreddit + "/about/banned/.json", { user : user }, function (data) {
                var banned = data.data.children;
                for (var i = 0; i < banned.length; i++) {
                    if (banned[i].name.toLowerCase() == user.toLowerCase()) {
                        $popup.find("select.mod-action option[data-api=unfriend][data-action=banned]").attr("selected", "selected");
                        $popup.find(".ban-note").val(banned[i].note);
                        $popup.find('.mod-popup-title').css('color', 'red');
                        break;
                    }
                }
                return;
            });
        }

        // if we're on the mod page, it's likely we want to mod them to another sub.
        // unselect current, change action to 'mod'.
        if (location.pathname.match(/\/about\/(?:moderator)\/?/)) {
            $popup.find("select.mod-action option[data-api=friend][data-action=moderator]").attr("selected", "selected");
            $popup.find('.ban-note').hide();
            $popup.find('.action-sub:checkbox:checked').removeAttr('checked');
        } else if (location.pathname.match(/\/about\/(?:contributors)\/?/)) {
            $popup.find("select.mod-action option[data-api=friend][data-action=contributor]").attr("selected", "selected");
            $popup.find('.ban-note').hide();
            $popup.find('.action-sub:checkbox:checked').removeAttr('checked');
        }
 
        // render the saved subs lists
        updateSavedSubs();
  
        // custom sub changed.
        $popup.find('select.' + OTHER).change(function () {
            $popup.find('.' + OTHER + '-checkbox').prop('checked', ($(this).val() !== OTHER));
        });
 
        // show/hide ban reason text feild.
        $popup.find('.mod-action').change(function () {
            var $banNote = $popup.find('.ban-note');
            if ($(this).val() == 'ban') {
                $banNote.show();
            } else {
                $banNote.hide();
            }
            $banNote.val(BANREASON);
        });
 
        // removal reason focus.
        // TODO: use a proper placeholder property with CSS
        $popup.find('.ban-note').focus(function () {
            if ($(this).val() == BANREASON) {
                $(this).val('');
            }
        });
        $popup.find('.ban-note').focusout(function () {
            if ($(this).val() === '') {
                $(this).val(BANREASON);
            }
        });
 
        // reset button name.
        $(benbutton).text(buttonName);
 
        return false;
    });
 
    // 'save' button clicked...  THIS IS WHERE WE BAN PEOPLE, PEOPLE!
    $('body').delegate('.mod-popup .save, .global-button', 'click', function () {
 
        var $button = $(this),
            $popup = $button.parents('.mod-popup'),
            $selected = $popup.find('.mod-action :selected'),
            api = $selected.attr('data-api'),
            action = $selected.attr('data-action'),
            actionName = $selected.val(),
            $status = $popup.find('.status'),
            banReason = $popup.find('.ban-note').val(),
            subreddits = [],
            user = $popup.find('.user').text();
 
        if (!$(this).hasClass('global-button')) {
 
            // Get dem ban subs.
            $popup.find('.action-sub:checkbox:checked').each(function () {
                if ($(this).val() !== OTHER) {
                    subreddits.push($(this).val());
                } else {
                    var subname = $('.' + OTHER + ' option:selected').val();
                    if (subname !== OTHER) {
                        subreddits.push(subname);
                        
                    }
                }
            });

            // Ban
            massAction(subreddits);
 
        } else {
            var confirmban = confirm("This will " + actionName + " /u/" + user + " from every subreddit you moderate.   Are you sure?");
            if (confirmban) {
                massAction(TBUtils.mySubs);
            } else {
                return;
            }
        }
 
        // Check dem values.
        if (subreddits.length < 1) return $status.text('error, no subreddits selected');
        if (!api) return $status.text('error, no action selected');


        var $timer;
        function completeCheck(failedSubs) {
            $timer.stop();
            TBUtils.pageOverlay(null, false);
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
            TBUtils.pageOverlay("API ratelimit sleeping for: " + seconds + " seconds");
            setTimeout(function () {
                $.log('resuming');
                $timer.play();
            }, delay);
        }

        function massAction(subs) {
            $('.mod-popup').hide();
            var failedSubs = [];
            var actionCount = 0;

            // Ban dem trolls.
            TBUtils.pageOverlay("", true);
            $timer = $.timer(function () {
                var sub = $(subs).get(actionCount);

                $status.text(actionName + 'ning /u/' + user + ' from /r/' + sub);
                TBUtils.pageOverlay(actionName + 'ning /u/' + user + ' from /r/' + sub, undefined);

                $.log('banning from: ' + sub);
                $.post('/api/' + api, {
                    uh: TBUtils.modhash,
                    type: action,
                    name: user,
                    r: sub,
                    note: (banReason == BANREASON) ? '' : banReason,
                    api_type: 'json'
                })
                .success(function (resp) {
                    if (resp.json.errors !== undefined && resp.json.errors[0][0] === 'RATELIMIT') {
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
    $('body').delegate('.mod-popup .close', 'click', function () {
        $(this).parents('.mod-popup').remove();
    });

    $('body').delegate('.nuke-comment-chain', 'click', function () {
        var $popup = $(this).parents('.mod-popup'),
            thing_id = $popup.find('.thing_id').text();

        $.log(thing_id);
    });
 
    $('body').delegate('.mod-popup-tabs .user_flair', 'click', function () {
        var $popup = $(this).parents('.mod-popup'),
            $status = $popup.find('.status'),
            user = $popup.find('.user').text(),
            subreddit = $popup.find('.subreddit').text(),
            $textinput = $popup.find('.flair-text'),
            $classinput = $popup.find('.flair-class');

        if (!user || !subreddit) return; 

        $.getJSON('http://www.reddit.com/r/' + subreddit + '/api/flairlist.json?name=' + user, function (resp) {
            if (!resp || !resp.users || resp.users.length < 1) return;
 
            $textinput.val(resp.users[0].flair_text);
            $classinput.val(resp.users[0].flair_css_class);
        });
    });
 

    // Edit save button clicked.
    $('body').delegate('.flair-save', 'click', function () {
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
                uh: TBUtils.modhash
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
            uh: TBUtils.modhash
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


    // // settings button clicked
    // $('body').delegate('.user-role', 'click', function () {
    //     var $popup = $(this).parents('.mod-popup');
    //     // TODO: replace this with a real tab view controller so we don't have to duplicate these lines all the time
    //     $popup.find('.edit-user-flair').removeClass('active');
    //     $(this).addClass('active');
    //     $popup.find('.edit-modbutton-settings').removeClass('active');

    //     $popup.find('.mod-popup-tab-settings').hide();
    //     $popup.find('.mod-popup-tab-flair').hide();
    //     $popup.find('.mod-popup-tab-role').show();
    // });

    // // settings button clicked
    // $('body').delegate('.edit-modbutton-settings', 'click', function () {
    //     var $popup = $(this).parents('.mod-popup');
    //     // TODO: replace this with a real tab view controller so we don't have to duplicate these lines all the time
    //     $popup.find('.edit-user-flair').removeClass('active');
    //     $popup.find('.user-role').removeClass('active');
    //     $(this).addClass('active');

    //     $popup.find('.mod-popup-tab-settings').show();
    //     $popup.find('.mod-popup-tab-flair').hide();
    //     $popup.find('.mod-popup-tab-role').hide();
    // });
    
    /**
     *  updates the current savedsubs' listings in the mod button
     */
    function updateSavedSubs() {
        //
        // Refresh the settings tab and role tab sub dropdowns and saved subs tabls
        //
        var $popups = $('body').find('.mod-popup'),
            $savedSubsLists = $popups.find('.saved-subs');

        // clear out the current stuff
        $popups.find('.add-dropdown').find('option').remove();
        $popups.find('.remove-dropdown').find('option').remove();
        $savedSubsLists.html('');

        // add our saved subs to the "remove saved subs" dropdown on the setting tab
        // and to the saved subs savedSubsList on the role tab
        $popups.each(function () {
            var $popup = $(this),
                $savedSubsList = $popup.find('.saved-subs'),
                currentSub = $popup.find('.subreddit').text();

            $.each(savedSubs, function (i, subreddit) {
                // only subs we moderate
                // and not the current sub
                if ($.inArray(subreddit, TBUtils.mySubs) != -1
                    && subreddit != currentSub
                ) {
                    $savedSubsList.append('<div><input type="checkbox" class="action-sub" name="action-sub" value="' + this +
                        '" id="action-' + this + '"><label for="action-' + this + '">&nbsp;&nbsp;/r/' + this + '</label></div>');
                }
                $('.remove-dropdown')
                    .append($('<option>', {
                            value: this
                        })
                        .text('/r/' + this));
            });
        });
        
        // repopulate the "add sub" and "other-sub" dropdowns with all the subs we mod
        $.each(TBUtils.mySubs, function (i, subreddit) {
            $popups.find('.add-dropdown')
                .append($('<option>', {
                        value: subreddit
                    })
                    .text('/r/' + subreddit));
            $popups.find('.' + OTHER)
                .append($('<option>', {
                        value: subreddit
                    })
                    .text('/r/' + subreddit));
        });
    }
    
    $('body').delegate('.remove-save', 'click', function () {
        var subname = $('.remove-dropdown option:selected').val();
        
        savedSubs.splice(savedSubs.indexOf(subname), 1);
        $('.remove-dropdown').find('option[value="'+subname+'"]').remove();
    });
    
    $('body').delegate('.add-save', 'click', function () {
        var subname = $('.add-dropdown option:selected').val();
        
        // Don't add the sub twice.
        if ($.inArray(subname, savedSubs) === -1) {
            savedSubs.push(subname);
            $('.remove-dropdown').append($('<option>', { value: subname }).text('/r/' + subname));
        }
    });
 
    // Edit save button clicked.
    $('body').delegate('.setting-save', 'click', function () {
        var $popup = $(this).parents('.mod-popup'),
            $savedSubsList = $popup.find('.saved-subs'),
            $status = $popup.find('.status');

        $status.text('saving settings...');

        // Enable/disable global ban button.
        TBUtils.setSetting('ModButton', 'globalbutton', $('.the-nuclear-option').is(':checked'));

        // show the global-button in the footer, if enabled
        if (TBUtils.getSetting('ModButton', 'globalbutton', false)) {
            $('.mod-popup .global-button').show();
        } else {
            // disabled? Make sure it's not shown
            $('.mod-popup .global-button').hide();
        }

        savedSubs = TBUtils.saneSort(savedSubs);
        savedSubs = TBUtils.setSetting('ModButton', 'sublist', savedSubs);

        // re-render the lists
        updateSavedSubs();

        $status.text('settings saved');

        // // TODO: replace this with a real tab view controller so we don't have to duplicate these lines all the time
        // $popup.find('.edit-user-flair').removeClass('active');
        // $popup.find('.user-role').addClass('active');
        // $popup.find('.edit-modbutton-settings').removeClass('active');

        // $popup.find('.mod-popup-tab-settings').hide();
        // $popup.find('.mod-popup-tab-flair').hide();
        // $popup.find('.mod-popup-tab-role').show();
    });
})();