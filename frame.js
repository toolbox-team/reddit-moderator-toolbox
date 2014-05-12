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


(function () {
    if (!TBUtils.logged || !TBUtils.getSetting('FrameMod', 'enabled', true)) return;
    $.log('Loading Frame Module');

    // Need to fix centering, etc.
    var $html = $('\
            <div class="mod-popup tb-page-overlay tb-settings">\
                <div class="mod-popup-header">\
                    MOD MAIL\
                    <span class="close right">\
                        <a href="javascript:;">[x]</a>\
                    </span>\
                </div>\
                <div class="mod-popup-tabs">\
                    <a href="javascript:;" title="What the fuck does this tab do." class="name that mofo">Tabname</a>\
                </div>\
                <div class="mod-popup-content">\
                </div>\
                <div class="mod-popup-footer">\
                    <span class="footer-button-one">\
                    </span>\
                </div>\
            </div>\
        ').appendTo('body').hide();

    $.get('http://www.reddit.com/message/moderator/?limit=15', function (resp) {
        if (!resp) return;

        resp = resp.replace(/<script(.|\s)*?\/script>/g, '');
        var $sitetable = $(resp).find('#siteTable');

        if ($sitetable) {
            $html.find('.mod-popup-content').append($sitetable);
            $html.show();
        }
    });
})();
