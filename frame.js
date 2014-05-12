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

    var $html, limit = 10;

    // Hijack modbar.
    $('#tb-bottombar').find('#tb-toolbarcounters').append('\
            <span>&nbsp;&nbsp;&nbsp;<a href="javascript:;" id="tb-launch-fame">[F]</a></span>\
            ');

    $('body').delegate('#tb-launch-fame', 'click', function () {
        var unreadMessageCount = TBUtils.getSetting('Notifier', 'unreadmessagecount', 0),
            modqueueCount = TBUtils.getSetting('Notifier', 'modqueuecount', 0),
            unmoderatedCount = TBUtils.getSetting('Notifier', 'unmoderatedcount', 0),
            modmailCount = TBUtils.getSetting('Notifier', 'modmailcount', 0);

        // Need to fix centering, etc.
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
                        <a href="javascript:;" title="View Mod Mail" class="tb-frame-modmail">Mod Mail ('+ modmailCount +')</a>\
                        <a href="javascript:;" title="View Messages" class="tb-frame-messages">Messages ('+ unreadMessageCount +')</a>\
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

        /*
        $html = $('\
            <div class="mod-popup tb-page-overlay tb-settings">\
                <div class="mod-popup-header">\
                    Tool Box Frame\
                    <span class="close right">\
                        <a href="javascript:;">[x]</a>\
                    </span>\
                </div>\
                <div class="mod-popup-tabs">\
                    <a href="javascript:;" title="View Mod Mail" class="tb-frame-modmail">Mod Mail</a>\
                    <a href="javascript:;" title="View Messages" class="tb-frame-messages">Messages</a>\
                    <a href="javascript:;" title="View Mod Queue" class="tb-frame-modqueue">Mod Queue</a>\
                    <a href="javascript:;" title="View Unmoderated" class="tb-frame-unmoderated">Unmoderated</a>\
                </div>\
                <div class="mod-popup-content">\
                Select a tab\
                </div>\
                <div class="mod-popup-footer">\
                    <span class="footer-button-one">\
                    </span>\
                </div>\
            </div>\
        ').appendTo('body').show();
        */
    });

    $('body').delegate('.tb-frame-modmail', 'click', function () {
        update('http://www.reddit.com/message/moderator/?limit=' + limit);
    });

    $('body').delegate('.tb-frame-messages', 'click', function () {
        update('http://www.reddit.com/message/inbox/?limit=' + limit);
    });

    $('body').delegate('.tb-frame-modqueue', 'click', function () {
        update('http://www.reddit.com/r/mod/about/modqueue/?limit=' + limit);
    });

    $('body').delegate('.tb-frame-unmoderated', 'click', function () {
        update('http://www.reddit.com/r/mod/about/unmoderated/?limit=' + limit);
    });

    $('body').delegate('.tb-frame-close', 'click', function () {
        $html.remove();
    });

    function update(URL) {
        $html.find('.tb-window-content').html('Loading...');
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
