// ==UserScript==
// @name        Mod Button
// @namespace   http://www.reddit.com/r/toolbox
// @author      agentlame, creesch, LowSociety
// @description Universal moderator action button.
// @include     http://www.reddit.com/*
// @include     http://reddit.com/*
// @include     http://*.reddit.com/*
// @downloadURL http://userscripts.org/scripts/source/167236.user.js
// @version     1.11
// ==/UserScript==

function modbutton() {
    if (!reddit.logged || !TBUtils.setting('ModButton', 'enabled', true)) return;

    var buttonName = 'mod',
        saveButton = 'Save',
        cancelButton = 'Cancel';

    /////// Don't edit beyond this line. ///////
    var OTHER = 'other-sub',
        BANREASON = "(ban reason)",
        savedSubs = [];

    if (localStorage['Toolbox.ModButton.sublist']) {
        savedSubs = JSON.parse(localStorage['Toolbox.ModButton.sublist']);
    }

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

        var things = $('div.thing .entry:not(.mod-button)');
        TBUtils.forEachChunked(things, 15, 500, processThing);
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

    // Mod button clicked
    $('body').delegate('.global-mod-button', 'click', function (event) {
        var benbutton = event.target; //huehuehue
        $(benbutton).text('loading...');

        var display = (savedSubs.length < 1) ? 'none' : '',
            showglobal = (JSON.parse(localStorage["Toolbox.ModButton.globalbutton"] || "false")) ? '' : 'none',
            info = TBUtils.getThingInfo(this),
            currentsub = info.subreddit,
            user = info.user;

        if (!user) {
            $(benbutton).text('error');
            $(benbutton).css('color', 'red');
            return;
        }

        // Make box & add subreddit radio buttons
        var popup = $('\
                <div class="mod-popup">\
                    <div><h2><label class="action-title">/u/' + user + '</label>\
                      <a href="javascript:;" style="display:' + display + '" title="Remove subreddits" class="remove-sub-link right">[-]</a>\
                      <a href="javascript:;" title="Add subreddits" class="add-sub-link right">[+]</a>\
                      <span>&nbsp;</span><a href="javascript:;" style="display:' + showglobal + '" title="Global Action (perform action on all subs)" class="global-button right">[A]</a>\
                    </h2></div><span>\
                    <label id="user" style="display:none">' + user + '</label> \
                    <table><tbody class="subs-body" />\
                    </table>\
                    <p style="clear:both;"><input id="ban-note" class="ban-note" type="text" value="' + BANREASON + '"></input></p>\
                    <div class="buttons">\
                        <select class="mod-action">\
                        <option action="banned" api="friend">ban</option> \
                        <option action="banned" api="unfriend">unban</option> \
                        <option action="contributor" api="friend">approve</option> \
                        <option action="contributor" api="unfriend" >unapprove</option> \
                        <option action="moderator" api="friend">mod</option> \
                        <option action="moderator" api="unfriend" >demod</option> \
                        </select>\
                        <span class="right">\
                            <button class="save">' + saveButton + '</button>\
                            <button class="cancel">' + cancelButton + '</button>\
                        </span>\
                        <div class="edit-subreddits buttons" style="display:none"><br>\
                        <select class="edit-dropdown left"></select><button class="edit-save right"></button>\
                        <p style="clear:both"><label class="global-label" for="the-nuclear-option">\
                        <input class="the-nuclear-option" type="checkbox" id="the-nuclear-option" name="the-nuclear-option">&nbsp;enable Global Action button.</label></p></div>\
                        <div><span class="status error left"><br>saving...</span></div>\
                    <div>\
                <div>')
            .appendTo('body')
            .css({
                left: event.pageX - 50,
                top: event.pageY - 10,
                display: 'block'
            });

        // We're a mod of the current sub, add it.
        if (currentsub) {
            popup.find('tbody').append('<tr><th><input type="checkbox" class="action-sub" name="action-sub" value="' + currentsub +
                '" id="action-' + currentsub + '" checked><label for="action-' + currentsub + '">&nbsp;&nbsp;/r/' + currentsub +
                ' (current)</label></th></tr>');
        }

        // Show if current user is banned, and why. - thanks /u/LowSociety
        $.get("http://www.reddit.com/r/" + currentsub + "/about/banned/.json", null, function (data) {
            var banned = data.data.children;
            for (var i = 0; i < banned.length; i++) {
                if (banned[i].name.toLowerCase() == user.toLowerCase()) {
                    popup.find("select.mod-action option[api=unfriend][action=banned]").attr("selected", "selected");
                    $("#ban-note").val(banned[i].note);
                    $('.action-title').css('color', 'red');
                    break;
                }
            }
            return;
        });

        // if we're on the mod page, it's likely we want to mod them to another sub.
        // unselect current, change action to 'mod'.
        if (location.pathname.match(/\/about\/(?:moderator)\/?/)) {
            popup.find("select.mod-action option[api=friend][action=moderator]").attr("selected", "selected");
            $('.ban-note').hide();
            $('.action-sub:checkbox:checked').removeAttr('checked');
        } else if (location.pathname.match(/\/about\/(?:contributors)\/?/)) {
            popup.find("select.mod-action option[api=friend][action=contributor]").attr("selected", "selected");
            $('.ban-note').hide();
            $('.action-sub:checkbox:checked').removeAttr('checked');
        }

        $(savedSubs).each(function () {
            if (this != currentsub) {
                popup.find('tbody').append('<tr><th><input type="checkbox" class="action-sub" name="action-sub" value="' + this +
                    '" id="action-' + this + '"><label for="action-' + this + '">&nbsp;&nbsp;/r/' + this + '</label></th></tr>');
            }
        });

        // add all our subs.
        popup.find('tbody').append('<tr><th><input type="checkbox" class="action-sub" name="action-sub" id="' + OTHER + '-checkbox" value="' + OTHER + '">\
                                   <select class="' + OTHER + '" for="action-' + OTHER + '"><option value="' + OTHER + '">(select subreddit)</option></select></th></tr>');

        $(TBUtils.mySubs).each(function () {
            $('.' + OTHER)
                .append($('<option>', {
                        value: this
                    })
                    .text('/r/' + this));
        });

        // custom sub changed.
        $('.' + OTHER).change(function () {
            $('#' + OTHER + '-checkbox').prop('checked', ($(this).val() !== OTHER));
        });

        // show/hide ban reason text feild.
        $('.mod-action').change(function () {
            var banNote = $('.ban-note');
            if ($(this).val() == 'ban') {
                $(banNote).show();
            } else {
                $(banNote).hide();
            }
            $(banNote).val(BANREASON);
        });

        // removal reason focus.
        $('.ban-note').focus(function () {
            if ($(this).val() == BANREASON) {
                $(this).val('');
            }
        });

        $('.ban-note').focusout(function () {
            if ($(this).val() == '') {
                $(this).val(BANREASON);
            }
        });

        // reset button name.
        $(benbutton).text(buttonName);

        return false;
    });

    // 'save' button clicked...  THIS IS WHERE WE BAN PEOPLE, PEOPLE!
    $('body').delegate('.mod-popup .save, .global-button', 'click', function () {

        var button = $(this),
            popup = button.parents('.mod-popup'),
            selected = popup.find('.mod-action :selected'),
            api = selected.attr('api'),
            action = selected.attr('action'),
            actionName = selected.val(),
            status = popup.find('.status').show(),
            banReason = popup.find('.ban-note').val(),
            subreddits = [],
            user = popup.find('#user').text(),
            actionCount = 0;

        if (!$(this).hasClass('global-button')) {

            // Get dem ban subs.
            popup.find('.action-sub:checkbox:checked').each(function () {
                if ($(this).val() !== OTHER) {
                    subreddits.push($(this).val());
                } else {
                    var subname = $('.' + OTHER + ' option:selected').val();
                    if (subname !== OTHER) {
                        subreddits.push(subname);
                    }
                }
            });

        } else {
            var confirmban = confirm("This will " + actionName + " /u/" + user + " from every subreddit you moderate.   Are you sure?");
            if (confirmban) {
                subreddits = TBUtils.mySubs;
            } else {
                return;
            }
        }

        // Check dem values.
        if (subreddits.length < 1) return status.text('error, no subreddits selected');
        if (!api) return status.text('error, no action selected');

        // Ban dem trolls.
        var id = setInterval(function () {
            var sub = $(subreddits).get(actionCount);

            status.text(actionName + 'ning /u/' + user + ' from /r/' + sub);

            $.post('/api/' + api, {
                uh: reddit.modhash,
                type: action,
                name: user,
                r: sub,
                note: (banReason == BANREASON) ? '' : banReason,
                api_type: 'json'
            });

            actionCount++;

            if (actionCount === subreddits.length) {
                clearInterval(id);
                $('.mod-popup').remove();
            }

        }, 500); //ban tax.
    });

    // 'cancel' button clicked
    $('body').delegate('.mod-popup .cancel', 'click', function () {
        $(this).parents('.mod-popup').remove();
    });

    function loadEditArea() {
        $('.edit-dropdown').find('option').remove();

        $('.the-nuclear-option').prop('checked', (JSON.parse(localStorage["Toolbox.ModButton.globalbutton"] || "false")));

        $('.save').hide();
        $('.mod-action').hide();
        $('.subs-body').hide();
        $('.ban-note').hide();
        $('.global-button').hide();
        $('.edit-subreddits').show();
    }

    // 'edit add' button clicked
    $('body').delegate('.add-sub-link', 'click', function () {
        loadEditArea();
        $('.action-title').text('add sub');

        $(TBUtils.mySubs).each(function () {
            $('.edit-dropdown')
                .append($('<option>', {
                        value: this
                    })
                    .text('/r/' + this));
        });

        $('.edit-save').text('Add');
        $('.edit-save').addClass('add-sub');
    });

    // 'edit remove' button clicked
    $('body').delegate('.remove-sub-link', 'click', function () {
        loadEditArea();
        $('.action-title').text('remove sub');

        $(savedSubs).each(function () {
            $('.edit-dropdown')
                .append($('<option>', {
                        value: this
                    })
                    .text('/r/' + this));
        });

        $('.edit-save').text('Remove');
    });

    // Edit save button clicked.
    $('body').delegate('.edit-save', 'click', function () {
        var subname = $('.edit-dropdown option:selected').val();

        // If it's in the subs, remove it; if it's not, add it.
        if ($(this).hasClass('add-sub')) {
            $(this).removeClass('add-sub');

            // Don't add the sub twice.
            if ($.inArray(subname, savedSubs) === -1) {
                savedSubs.push(subname);
            }
        } else {
            savedSubs.splice(subname.indexOf(subname), 1);
        }

        savedSubs = TBUtils.saneSort(savedSubs);
        localStorage['Toolbox.ModButton.sublist'] = JSON.stringify(savedSubs);

        // Enable/diable global ban button.
        localStorage['Toolbox.ModButton.globalbutton'] = JSON.stringify($('.the-nuclear-option').is(':checked'));

        $(this).parents('.mod-popup').remove();
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
        s.textContent = "(" + modbutton.toString() + ')();';
        document.head.appendChild(s);
    }
})();