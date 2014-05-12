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

    var $html;

    // Hijack modbar.
    $('#tb-bottombar').find('#tb-toolbarcounters').append('\
            <span>&nbsp;&nbsp;&nbsp;<a href="javascript:;" id="tb-launch-fame">[F]</a></span>\
            ');

    $('body').delegate('#tb-launch-fame', 'click', function () {
        // Need to fix centering, etc.
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
    });

    $('body').delegate('.tb-frame-modmail', 'click', function () {
        update('http://www.reddit.com/message/moderator/?limit=20');
    });

    $('body').delegate('.tb-frame-messages', 'click', function () {
        update('http://www.reddit.com/message/inbox/?limit=20');
    });

    $('body').delegate('.tb-frame-modqueue', 'click', function () {
        update('http://www.reddit.com/r/mod/about/modqueue/?limit=20');
    });

    $('body').delegate('.tb-frame-unmoderated', 'click', function () {
        update('http://www.reddit.com/r/mod/about/unmoderated/?limit=20');
    });

    function update(URL) {
        $html.find('.mod-popup-content').html('Updating');
        $.get(URL, function (resp) {
            if (!resp) return;

            resp = resp.replace(/<script(.|\s)*?\/script>/g, '');
            var $sitetable = $(resp).find('#siteTable');

            if ($sitetable) {
                $html.find('.mod-popup-content').html('').append($sitetable);
            }
        });
    }
})();
