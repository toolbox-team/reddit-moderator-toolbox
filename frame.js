// ==UserScript==
// @name         Toolbox Frame Module
// @namespace    http://www.reddit.com/r/toolbox
// @author       agentlame
// @description  notifications of messages
// @include      http://reddit.com/*
// @include      https://reddit.com/*
// @include      http://*.reddit.com/*
// @include      https://*.reddit.com/*
// @version 1.0
// ==/UserScript==


(function frame() {
    if (!TBUtils.logged || !TBUtils.getSetting('FrameMod', 'enabled', false)) return;
    if (!$('#tb-bottombar')) return setTimeout(frame);

    $.log('Loading Frame Module');

    var $html, limit = 10, jackModBarLinks = true,
        msgGet = limit, mmGet = limit, modGet = limit, umodGet = limit;

    // Hijack modbar.
    if (!jackModBarLinks) {
        $('#tb-bottombar').find('#tb-toolbarcounters').append('\
            <span>&nbsp;&nbsp;&nbsp;<a href="javascript:;" id="tb-launch-fame">[F]</a></span>\
            ');
    }
    else {
        // Hack-y hack.  To be removed.
        setInterval(function () {
            $('#tb-mailCount').attr("href", "#").addClass('tb-launch-fame');
            $('#tb-modmailcount').attr("href", "#").addClass('tb-launch-fame');
            $('#tb-queueCount').attr("href", "#").addClass('tb-launch-fame');
            $('#tb-unmoderatedcount').attr("href", "#").addClass('tb-launch-fame');
        }, 500);
    }

    $('body').delegate('#tb-launch-fame, .tb-launch-fame', 'click', function (e) {

        var unreadMessageCount = TBUtils.getSetting('Notifier', 'unreadmessagecount', 0),
            modqueueCount = TBUtils.getSetting('Notifier', 'modqueuecount', 0),
            unmoderatedCount = TBUtils.getSetting('Notifier', 'unmoderatedcount', 0),
            modmailCount = TBUtils.getSetting('Notifier', 'modmailcount', 0);

        
        msgGet = (unreadMessageCount <= limit && unreadMessageCount > 0) ? unreadMessageCount : limit;
        $.log(msgGet);
        mmGet = (modmailCount <= limit && modmailCount > 0) ? modmailCount : limit;
        $.log(mmGet);
        modGet = (modqueueCount <= limit && modqueueCount > 0) ? modqueueCount : limit;
        $.log(modGet);
        umodGet = (unmoderatedCount <= limit && unmoderatedCount > 0) ? unmoderatedCount : limit;
        $.log(umodGet);

        $html = $('\
            <div class="tb-page-overlay tb-frame-module">\
                <div class="tb-window-wrapper">\
                    <div class="tb-window-header">\
                        Toolbox Mod Frame\
                        <span class="tb-window-header-options">\
                            <a class="tb-close tb-frame-close" href="javascript:;" title="Close">✕</a>\
                        </span>\
                    </div>\
                    <div class="tb-window-tabs">\
                        <a href="javascript:;" title="View Messages" class="tb-frame-messages">Messages ('+ unreadMessageCount +')</a>\
                        <a href="javascript:;" title="View Mod Mail" class="tb-frame-modmail">Mod Mail ('+ modmailCount +')</a>\
                        <a href="javascript:;" title="View Mod Queue" class="tb-frame-modqueue">Mod Queue ('+ modqueueCount +')</a>\
                        <a href="javascript:;" title="View Unmoderated" class="tb-frame-unmoderated">Unmoderated ('+ unmoderatedCount +')</a>\
                    </div>\
                    <div class="tb-window-content">\
                    </div>\
                    <div class="tb-window-footer">\
                        <!--input class="tb-save" type="button" value="save"-->\
                    </div>\
                </div>\
            </div>\
        ').appendTo('body').show();
        $('body').css('overflow', 'hidden');
        
        switch (e.target.id) { 
            case 'tb-mailCount':
                update('http://www.reddit.com/message/inbox/?limit=' + msgGet);
                break;
            case 'tb-modmailcount':
                update('http://www.reddit.com/message/moderator/?limit=' + mmGet);
                break;
            case 'tb-queueCount':
                update('http://www.reddit.com/r/mod/about/modqueue/?limit=' + modGet, true);
                break;
            case 'tb-unmoderatedcount':
                update('http://www.reddit.com/r/mod/about/unmoderated/?limit=' + umodGet, true);
                break;
            default:
                break;
        }
    });

    $('body').delegate('.tb-frame-close', 'click', function () {
            $html.remove();
            $('body').css('overflow', 'auto');
    });

    $('body').delegate('.tb-frame-messages', 'click', function () {
        update('http://www.reddit.com/message/inbox/?limit=' + msgGet);
    });

    $('body').delegate('.tb-frame-modmail', 'click', function () {
        update('http://www.reddit.com/message/moderator/?limit=' + mmGet);
    });

    $('body').delegate('.tb-frame-modqueue', 'click', function () {
        update('http://www.reddit.com/r/mod/about/modqueue/?limit=' + modGet, true);
    });

    $('body').delegate('.tb-frame-unmoderated', 'click', function () {
        update('http://www.reddit.com/r/mod/about/unmoderated/?limit=' + umodGet, true);
    });

    function update(URL, modtools) {
        $html.find('.tb-window-content').html('Loading... ' + URL);
        $.get(URL, function (resp) {
            if (!resp) return;

            resp = resp.replace(/<script(.|\s)*?\/script>/g, '');
            var $sitetable = $(resp).find('#siteTable');
            $sitetable.find('.nextprev').hide();
            $sitetable.addClass('tb-frame-sitetable');
            if ($sitetable) {
                $html.find('.tb-window-content').html('').append($sitetable);

                // call modules to preocess new things.
                var event = new CustomEvent("TBNewThings");
                window.dispatchEvent(event);
            }

            if (modtools) addModtools();
        });
    }

    function addModtools() {
        $.log('adding moodtools');
        var numberRX = /-?\d+/,
            reportsThreshold = TBUtils.getSetting('QueueTools', 'reports-threshold', 1),
            listingOrder = TBUtils.getSetting('QueueTools', 'reports-order', 'age'),
            sortAscending = (TBUtils.getSetting('QueueTools', 'reports-ascending', 'false') == 'true'), //the fuck is going on here?
            allSelected = false,
            $frameSitetable = $('.tb-frame-sitetable'),
            hideActionedItems = TBUtils.getSetting('QueueTools', 'hideactioneditems', false),
            ignoreOnApprove = TBUtils.getSetting('QueueTools', 'ignoreonapprove', false),
            rtsComment = TBUtils.getSetting('QueueTools', 'rtscomment', true),
            spamReportSub = 'reportthespammers';

        // Make visible any collapsed things (stuff below /prefs/ threshold)
        $frameSitetable.find('.entry .collapsed:visible a.expand:contains("[+]")').click();

        // Add checkboxes, tabs, menu, etc
        $frameSitetable.before('\
            <div class="menuarea modtools" style="padding: 5px 0;margin: 5px 0;"> \
                <input style="margin:5px;float:left" title="Select all/none" type="checkbox" id="select-all" title="select all/none"/> \
                <span>\
                    <a href="javascript:;" class="pretty-button invert inoffensive" accesskey="I" title="invert selection">&lt;/&gt;</a> \
                    <a href="javascript:;" class="pretty-button open-expandos inoffensive" title="toggle all expando boxes">[+]</a> \
                    <div onmouseover="hover_open_menu(this)" onclick="open_menu(this)" class="dropdown lightdrop "> \
                        <a href="javascript:;" class="pretty-button inoffensive select"> [select...]</a> \
                    </div>\
                    <div class="drop-choices lightdrop select-options"> \
                        <a class="choice inoffensive" href="javascript:;" type="banned">shadow-banned</a>\
                        <a class="choice inoffensive" href="javascript:;" type="filtered">spam-filtered</a>\
                        <a class="choice inoffensive" href="javascript:;" type="reported">has-reports</a>\
                        <a class="choice dashed" href="javascript:;" type="spammed">[ spammed ]</a> \
                        <a class="choice" href="javascript:;" type="removed">[ removed ]</a> \
                        <a class="choice" href="javascript:;" type="approved">[ approved ]</a>\
                        <a class="choice" href="javascript:;" type="flaired">[ flaired ]</a>\
                        <a class="choice" href="javascript:;" type="actioned">[ actioned ]</a>\
                        <a class="choice dashed" href="javascript:;" type="domain">domain...</a> \
                        <a class="choice" href="javascript:;" type="user">user...</a> \
                        <a class="choice" href="javascript:;" type="title">title...</a> \
                        <a class="choice dashed" href="javascript:;" type="comments">all comments</a> \
                        <a class="choice" href="javascript:;" type="links">all submissions</a> \
                        <a class="choice dashed" href="javascript:;" type="self">self posts</a> \
                        <a class="choice" href="javascript:;" type="flair">posts with flair</a> \
                    </div>\
                    &nbsp; \
                    <a href="javascript:;" class="pretty-button inoffensive unhide-selected" accesskey="U">unhide&nbsp;all</a> \
                    <a href="javascript:;" class="pretty-button inoffensive hide-selected"   accesskey="H">hide&nbsp;selected</a> \
                    <a href="javascript:;" class="pretty-button action negative" accesskey="S" type="negative" tabindex="3">spam&nbsp;selected</a> \
                    <a href="javascript:;" class="pretty-button action neutral"  accesskey="R" type="neutral"  tabindex="4">remove&nbsp;selected</a> \
                    <a href="javascript:;" class="pretty-button action positive" accesskey="A" type="positive" tabindex="5">approve&nbsp;selected</a> \
                    <a href="javascript:;" class="pretty-button flair-selected inoffensive" accesskey="F" tabindex="6">flair&nbsp;selected</a>\
                </span> \
                <span class="dropdown-title lightdrop" style="float:right"> sort: \
                    <div onmouseover="hover_open_menu(this)" onclick="open_menu(this)" class="dropdown lightdrop "> \
                        <span class="selected sortorder">' + listingOrder + '</span> \
                    </div> \
                    <div class="drop-choices lightdrop sortorder-options"> \
                            <a class="choice" href="javascript:;">age</a> \
                            <a class="choice" href="javascript:;">reports</a>\
                            <a class="choice" href="javascript:;">score</a> \
                    </div> \
                </span> \
            </div>');

        $frameSitetable.find('.thing.link, .thing.comment').prepend('<input type="checkbox" tabindex="1" style="margin:5px;float:left;" />');
        $frameSitetable.find('.buttons .pretty-button').attr('tabindex', '2');

        //add class to processed threads.
        $frameSitetable.find('.thing').addClass('mte-processed');

        // Add context & history stuff
        //$('body').append('<div class="pretty-button inline-content" style="z-index:9999;display:none;position:absolute;line-height:12px;min-width:100px"/>');
        $frameSitetable.find('.comment .flat-list.buttons:has( a:contains("parent"))').each(function () {
            $(this).prepend('<li><a class="context" href="' + $(this).find('.first .bylink').attr('href') + '?context=2">context</a></li>');
        });

        //// Button actions ////
        // Select thing when clicked
        var noAction = ['A', 'INPUT', 'TEXTAREA', 'BUTTON'];
        $frameSitetable.find('.thing .entry').live('click', function (e) {
            if (noAction.indexOf(e.target.nodeName) + 1) return;
            $(this).parent('.thing').find('input[type=checkbox]:first').click();
        });

        // Change sort order
        $('.sortorder-options a').click(function () {
            var order = $(this).text(),
                toggleAsc = (order == $('.sortorder').text());

            if (toggleAsc) sortAscending = !sortAscending;

            TBUtils.setSetting('QueueTools', 'reports-ascending', sortAscending);
            TBUtils.setSetting('QueueTools', 'reports-order', order);

            $('.sortorder').text(order);
            sortThings(order, sortAscending);
        });

        // Invert all the things.
        $('.invert').click(function () {
            $frameSitetable.find('.thing:visible input[type=checkbox]').click();
        });

        // Select / deselect all the things
        $('#select-all').click(function () {
            $frameSitetable.find('.thing:visible input[type=checkbox]').attr('checked', allSelected = this.checked);
        });
        $frameSitetable.find('.thing input[type=checkbox]').live('click', function () {
            $('#select-all').attr('checked', allSelected = !$('.thing:visible input[type=checkbox]').not(':checked').length);
        });

        // Select/deselect certain things
        $('.select-options a').click(function () {
            var things = $frameSitetable.find('.thing:visible'),
                selector;

            switch (this.type) {
                case 'banned':
                    selector = '.banned-user';
                    break;
                case 'filtered':
                    selector = '.spam:not(.banned-user)';
                    break;
                case 'reported':
                    selector = ':has(.reported-stamp)';
                    break;
                case 'spammed':
                    selector = '.spammed,:has(.pretty-button.negative.pressed),:has(.remove-button:contains(spammed))';
                    break;
                case 'removed':
                    selector = '.removed,:has(.pretty-button.neutral.pressed),:has(.remove-button:contains(removed))';
                    break;
                case 'approved':
                    selector = '.approved,:has(.approval-checkmark,.pretty-button.positive.pressed),:has(.approve-button:contains(approved))';
                    break;
                case 'flaired':
                    selector = '.flaired';
                    break;
                case 'actioned':
                    selector = '.flaired,.approved,.removed,.spammed,:has(.approval-checkmark,.pretty-button.pressed),\
                                    :has(.remove-button:contains(spammed)),:has(.remove-button:contains(removed)),:has(.approve-button:contains(approved))';
                    break;
                case 'domain':
                    selector = ':has(.domain:contains(' + prompt('domain contains:', '').toLowerCase() + '))';
                    break;
                case 'user':
                    selector = ':has(.author:contains(' + prompt('username contains:\n(case sensitive)', '') + '))';
                    break;
                case 'title':
                    selector = ':has(a.title:contains(' + prompt('title contains:\n(case sensitive)', '') + '))';
                    break;
                case 'comments':
                    selector = '.comment';
                    break;
                case 'links':
                    selector = '.link';
                    break;
                case 'self':
                    selector = '.self';
                    break;
                case 'flair':
                    selector = ':has(.linkflair)';
                    break;
            }
            things.filter(selector).find('input[type=checkbox]').attr('checked', true);
        });
        $('.hide-selected').click(function () {
            $frameSitetable.find('.thing:visible:has(input:checked)').hide();
            $frameSitetable.find('.thing input[type=checkbox]').attr('checked', false);
        });
        $('.unhide-selected').click(function () {
            $frameSitetable.find('.thing').show();
        });

        // Mass spam/remove/approve
        $('.pretty-button.action').click(function () {
            var spam = (this.type == 'negative'),
                type = (this.type == 'positive' ? 'approve' : 'remove');

            // Apply action
            $frameSitetable.find('.thing:visible>input:checked').parent().each(function () {
                $.post('/api/' + type, {
                    uh: TBUtils.modhash,
                    spam: spam,
                    id: $(this).attr('data-fullname') //getThingInfo seems like overkill.
                });
            }).css('opacity', '1').removeClass('flaired spammed removed approved').addClass((spam ? 'spamme' : type) + 'd');
        });

        // menuarea pretty-button feedback.
        $('.menuarea.modtools .pretty-button').click(function () {
            $(this).clearQueue().addClass('pressed').delay(200).queue(function () {
                $(this).removeClass('pressed');
            });
        });

        var ignoreOnApproveset;
        // Uncheck anything we've taken an action, if it's checked.
        $('.pretty-button').live('click', function (e) {
            var thing = $(this).closest('.thing');
            $(thing).find('input[type=checkbox]').attr('checked', false);
            if (hideActionedItems) {
                $(thing).hide();
            } else if (ignoreOnApproveset) {
                ignoreOnApproveset = false;
            } else if ($(this).hasClass('negative')) {
                $(thing).removeClass('removed');
                $(thing).removeClass('approved');
                $(thing).addClass('spammed');
            } else if ($(this).hasClass('neutral')) {
                $(thing).removeClass('spammed');
                $(thing).removeClass('approved');
                $(thing).addClass('removed');
            } else if ($(this).hasClass('positive')) {
                $(thing).removeClass('removed');
                $(thing).removeClass('spammed');
                $(thing).addClass('approved');
            }
        });

        // Open reason dropdown when we remove something as ham.
        $('.big-mod-buttons>span>.pretty-button.positive').live('click', function () {
            if (!ignoreOnApprove) return;
            var thing = $(this).closest('.thing');
            $(thing).removeClass('removed');
            $(thing).removeClass('spammed');
            $(thing).addClass('approved');
            ignoreOnApproveset = true;

            if ($(thing).find('.reported-stamp').length) {
                var ignore = $(thing).find('a:contains("ignore reports")')
                if (ignore) ignore[0].click();
            }
        });

        /*  Will need to be put elsewhere
        // Set reports threshold (hide reports with less than X reports)
        $('#modtab-threshold').keypress(function (e) {
            e.preventDefault();

            var threshold = +String.fromCharCode(e.which);
            if (isNaN(threshold)) return;

            $(this).val(threshold);
            TBUtils.setSetting('QueueTools', 'reports-threshold', threshold);
            setThreshold($('.thing'));
        });

        function setThreshold(things) {
            var threshold = TBUtils.getSetting('QueueTools', 'reports-threshold', 1);
            things.show().find('.reported-stamp').text(function (_, str) {
                if (str.match(/\d+/) < threshold)
                    $(this).thing().hide();
            });
        }
        setThreshold($('.thing'));
        */
    }
})();
