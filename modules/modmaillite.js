function mml() {
var modmaillite = new TB.Module('Mod Mail Lite');
modmaillite.shortname = 'ModMailLite';

modmaillite.settings['enabled']['default'] = false;
modmaillite.config['betamode'] = true;

modmaillite.init = function mmlInit() {
    if (!TB.utils.isModmail) return;

    // Never allow if MMP is on.
    if (TB.storage.getSetting('ModMail', 'enabled', true)) {
        TB.ui.textFeedback("Mod Mail Lite disabled", TB.ui.FEEDBACK_NEGATIVE);
        modmaillite.setting('enabled', false);
        return;
    }

    var $body = $('body'),
        $threads = $('.message-parent:not(.mml-processed)'),
        subs = [];

    $threads.hide();
    $threads.addClass('mml-processed');

    $threads.each(function () {
        var $this = $(this),
            sub = $this.find('.correspondent.reddit.rounded a').text();

        sub = TB.utils.cleanSubredditName(sub);
        if ($.inArray(sub, subs) === -1) {
            subs.push(sub);
        }

        $this.attr('data-subreddit', sub);
    });

    var subsDiv = '\
         <div class="tb-mml-subreddit" data-subreddit="{{subreddit}}">\
            <span>\
                <a href="javascript:;" class="tb-mml-sublink" data-subreddit="{{subreddit}}">[+]</a>\
                <label class="tb-mml-name">- /r/{{subreddit}}</label>\
            </span>\
            <div class="tb-mml-messages" data-subreddit="{{subreddit}}"></div>\
        </div>';

    $(subs).each(function () {

        var subredditContainer = TB.utils.template(subsDiv, {
            'subreddit': this
        });

        $('.nav-buttons').before(subredditContainer);
    });

    function run() {
        $(subs).each(function () {
            var $messages = $threads.filter('[data-subreddit="' + this + '"]'),
                $subDiv = $('.tb-mml-subreddit[data-subreddit="' + this + '"]');

            $subDiv.find('.tb-mml-messages').append($messages);
            $subDiv.find('.tb-mml-name').after('&nbsp;<label>[' + $messages.length + ']</label>')
        });

        $('.tb-mml-sublink').on('click', function () {
            var $this = $(this),
                sub = $this.attr('data-subreddit'),
                expanded = $this.hasClass('expanded'),
                $messages = $threads.filter('[data-subreddit="' + sub + '"]');

            $this.toggleClass('expanded');
            $this.text(expanded ? '[+]' : '[-]');
            expanded ? $messages.hide() : $messages.show();
        });
    }
    run();
};

TB.register_module(modmaillite);
}

(function() {
    // wait for storage
    window.addEventListener("TBUtilsLoaded", function () {
        mml();
    });
})();