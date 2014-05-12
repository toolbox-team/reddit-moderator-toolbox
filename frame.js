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
    if (!TBUtils.logged || !TBUtils.getSetting('FrameMod', 'enabled', true)) return;
    if (!$('#tb-bottombar')) return setTimeout(frame);

    $.log('Loading Frame Module');

    var $html, limit = 10, jackModBarLinks = false,
        msgGet = limit, mmGet = limit, modGet = limit, umodGet = limit;

    // Hijack modbar.
    if (!jackModBarLinks) {
        $('#tb-bottombar').find('#tb-toolbarcounters').append('\
            <span>&nbsp;&nbsp;&nbsp;<a href="javascript:;" id="tb-launch-fame">[F]</a></span>\
            ');
    }
    else {
        // Hack-y hack.  To be removed.
        setTimeout(function () {
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
                update('http://www.reddit.com/r/mod/about/modqueue/?limit=' + modGet);
                break;
            case 'tb-unmoderatedcount':
                update('http://www.reddit.com/r/mod/about/unmoderated/?limit=' + umodGet);
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
        update('http://www.reddit.com/r/mod/about/modqueue/?limit=' + modGet);
    });

    $('body').delegate('.tb-frame-unmoderated', 'click', function () {
        update('http://www.reddit.com/r/mod/about/unmoderated/?limit=' + umodGet);
    });

    function update(URL) {
        $html.find('.tb-window-content').html('Loading... ' + URL);
        $.get(URL, function (resp) {
            if (!resp) return;

            resp = resp.replace(/<script(.|\s)*?\/script>/g, '');
            var $sitetable = $(resp).find('#siteTable');
            $sitetable.find('.nextprev').remove();

            if ($sitetable) {
                $html.find('.tb-window-content').html('').append($sitetable);
            }
        });
    }
})();
