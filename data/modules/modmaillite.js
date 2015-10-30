function modmaillite() {
var self = new TB.Module('Mod Mail Lite');
self.shortname = 'ModMailLite';

self.settings['enabled']['default'] = false;
self.config['betamode'] = true;

self.init = function () {
    if (!TB.utils.isModmail) return;

    // Never allow if MMP is on.
    if (settingsShim('enabled')) {
        TB.ui.textFeedback("Mod Mail Lite disabled", TB.ui.FEEDBACK_NEGATIVE);
        self.setting('enabled', false);
        return;
    }

    var $body = $('body'),
        subreddits = [],
        now = new Date().getTime(),
        firstRun = true,

    // Steal MMP settings.
        lastViewed = settingsShim('lastVisited'),
        collapsed = settingsShim('defaultCollapse'),
        expandReplies = settingsShim('expandReplies'),
        noRedModmail = settingsShim('noRedModmail'),
        hideInviteSpam = settingsShim('hideInviteSpam'),
        highlightNew = settingsShim('highlightNew'),
        fadeRecipient = settingsShim('fadeRecipient'),
        threadAlways = settingsShim('autoThread'),
        subredditColor = settingsShim('subredditColor');

    settingsShim('lastVisited', now);
    $('.menuarea').html('');
    $('clearleft').remove();

    var subsDiv = '\
 <div class="tb-mml-subreddit" data-subreddit="{{subreddit}}">\
    <span class="tb-mml-info">\
        <a href="javascript:;" class="tb-mml-sublink" data-subreddit="{{subreddit}}">[+]</a>\
        <label class="tb-mml-name"> /r/{{subreddit}}</label>\
    </span>\
    <div class="tb-mml-messages" data-subreddit="{{subreddit}}"></div>\
</div>';

    var infoLabel = '&nbsp;<label>[{{messagecount}}] [{{newcount}}]</label>';

    function run() {
        var $threads = $('.message-parent:not(.mml-processed)'),
            newSubreddits = [];

        $threads.hide();
        $('#siteTable').show();
        $threads.addClass('mml-processed');


        var done = ($threads.length - 1);
        TB.utils.forEachChunked($threads, 25, 200, function (thread, i) {
            var $this = $(thread),
                sub = $this.find('.correspondent.reddit.rounded a').text();

            sub = TB.utils.cleanSubredditName(sub);
            if ($.inArray(sub, subreddits) === -1) {
                subreddits.push(sub);
                newSubreddits.push(sub);
            }

            $this.attr('data-subreddit', sub);

            if (i > done) return false;
            if (i === done) {

                var comp = (newSubreddits.length - 1);
                TB.utils.forEachChunked(newSubreddits, 25, 200, function (sub, j) {
                    var subredditContainer = TB.utils.template(subsDiv, {
                        'subreddit': sub
                    });

                    $('.nav-buttons').before(subredditContainer);

                    if (j > comp) return false;
                    if (j === comp) {
                        quickProcessSubs(newSubreddits, $threads);
                    }
                });

                return false;
            }
        });
    }

    run();


    function quickProcessSubs(newSubreddits, $newThreads) {
        $newThreads.css({'margin-left': 40});

        $(newSubreddits).each(function () {
            var $messages = $newThreads.filter('[data-subreddit="' + this + '"]'),
                $subDiv = $('.tb-mml-subreddit[data-subreddit="' + this + '"]'),
                $subName = $subDiv.find('.tb-mml-name'),
                newMessages = 0;

            $subDiv.find('.tb-mml-messages').append($messages);

            $messages.find('.entry:last').each(function (key, thing) {
                var $entry = $(thing);
                var timestamp = new Date($entry.find('.head time').attr('datetime')).getTime();

                if (timestamp > lastViewed) {
                    var $newThread = $entry.closest('.message-parent');
                    $entry.find('.head').css('color', 'green');
                    $newThread.addClass('mml-reply');
                    $newThread.css('color', 'green');
                    newMessages++;
                }
            });

            var info = TB.utils.template(infoLabel, {
                'messagecount': $messages.length,
                'newcount': newMessages
            });

            $subName.after(info);
            if (newMessages > 0) {
                $subName.parent().css('background-color', 'lightgreen');
            }
        });


        if (firstRun) {
            firstRun = false;
            processFirstTheard($newThreads[0]);
        }
    }

    function processFirstTheard(firstThread) {
        processCommentReplies(firstThread, function () {
            processTheard(firstThread, function () {
                var $replyThreads = $('.mml-reply');
                $replyThreads.removeClass('mml-reply');
                processCommentReplies($replyThreads, function () {
                    slowProcessThreads();
                });
            });
        });
    }

    function processCommentReplies(threads, callback) {
        var done = ($(threads).length - 1);
        TB.utils.forEachChunked($(threads).find('.entry'), 25, 200, function (entry, i) {
            var $entry = $(entry);

            var timestamp = new Date($entry.find('.head time').attr('datetime')).getTime();

            if (timestamp > lastViewed) {
                $entry.find('.head').css('color', 'green');
            }

            if (i > done) return false;
            if (i === done) {
                if (callback !== undefined) callback();
                return false;
            }
        });
    }

    function slowProcessThreads() {
        var $threads = $('.message-parent:not(.mml-complete)'),
            done = ($threads.length - 1);

        TB.utils.forEachChunked($threads, 15, 300, function (thread, i) {
            processTheard(thread);

            if (i > done) return false;
            if (i === done) {
                TB.ui.textFeedback("Mod mail has loaded!", TB.ui.FEEDBACK_POSITIVE);
                return false;
            }
        });
    }

    function processTheard(thread, callback) {

        var $thread = $(thread),
            $things = $thread.find('.thing'),
            $entries = $thread.find('.entry'),
            subreddit = $thread.attr('data-subreddit'),
            $mailLink = $thread.find('.correspondent a:first'),
            $subject = $thread.find('.subject:first');

        $thread.addClass('mml-complete');

        // collapse link
        $mailLink.text('[-]').attr('href', 'javascript:;').addClass('mml-toggle-collapse expanded');

        // add threading options
        $subject.append('<a href="javascript:;" class="expand-btn tb-thread-view flat">thread view</a>');

        // entry loops
        var counter = 0;
        if (noRedModmail || highlightNew || fadeRecipient) {

            var done = ($entries.length - 1);
            TBUtils.forEachChunked($entries, 20, 500, function (entry, i) {

                var $entry = $(entry);

                if (noRedModmail) {
                    var $message = $entry.parent();

                    if ($message.hasClass('spam')) {
                        $message.css('background-color', 'transparent');
                        $message.find('.entry:first .head').css('color', 'red');
                    }
                }

                // Fade the recipient of a modmail so it is much more clear WHO send it.
                if (fadeRecipient) {
                    var $head = $entry.find('.tagline .head');
                    if ($head.find('a.author').length > 1) {
                        $head.find('a.author').eq(0).css('opacity', '.6');
                    } else if (/^to /.test($head.text())) {
                        $head.find('a.author').css('opacity', '.6');
                    }
                }

                if (i > done) return false;
                if (i === done) {
                    return false;
                }
            });
        }

        // no red mod mail
        if (noRedModmail) {
            if ($thread.hasClass('spam')) {
                $thread.css('background-color', 'transparent');
                $thread.find('.subject').css('color', 'red');
            }
        }

        // subreddit colors
        if (subredditColor) {
            var colorForSub = TBUtils.stringToColor(subreddit);

            $thread.css('border-left', 'solid 10px ' + colorForSub);
            $thread.addClass('tb-subreddit-color');
        }

        // end processing thread.
        if (callback !== undefined) callback();
    }

    // NER support.
    window.addEventListener("TBNewThings", function () {
        firstRun = true;
        console.log('lms go');
        run();
    });

    //// events /////

    /// collapse message
    $body.on('click', '.tb-mml-sublink', function () {
        var $this = $(this),
            sub = $this.attr('data-subreddit'),
            collapsing = $this.hasClass('expanded'),
            $messages = $('.message-parent').filter('[data-subreddit="' + sub + '"]');

        $this.toggleClass('expanded');

        if (collapsing) {
            $this.text('[+]');
            $messages.hide();
        } else {
            $this.text('[-]');
            $messages.show();

            if (expandReplies) {
                quickChunk($messages.find('.expand-btn:first'), function (ret) {
                    ret.click();
                });
            }
        }

        if (threadAlways) {
            quickChunk($messages.find('.tb-thread-view'), function (ret) {
                ret.click();
            });
        }
    });


    function collapse() {
        $(this).parents(".thing:first").find("> .child").hide();
    }

    function noncollapse() {
        $(this).parents(".thing:first").find("> .child").show();
    }

    $body.on('click', '.tb-thread-view', function () {
        var $message = $(this),
            $parent = $message.closest('.message-parent'),
            threading = $message.hasClass('flat'),
            fullname = $parent.attr('data-fullname'),
            firstMessage = $("div.thing.id-" + fullname);

        $message.toggleClass('flat');

        if (threading) {
            $message.val('flat view');
            firstMessage.addClass("threaded-modmail");
            if (firstMessage.hasClass("hasThreads")) {
                firstMessage.find(".thing").each(function () {
                    var parent = $("div.thing.id-" + $(this).data("parent"));
                    $(this).appendTo(parent.find("> .child"));
                });

            } else {
                var id = fullname.substring(3);
                $.getJSON("//www.reddit.com/message/messages/" + id + ".json", null, function (data) {
                    var messages = data.data.children[0].data.replies.data.children;

                    for (var i = 0; i < messages.length; i++) {
                        var item = messages[i].data;

                        var message = $("div.thing.id-" + item.name);
                        var dummy = $("<div></div>").addClass("modmail-dummy-" + item.name);
                        var parent = $("div.thing.id-" + item.parent_id);

                        message.data("parent", item.parent_id);

                        dummy.insertAfter(message);
                        message.appendTo(parent.find("> .child"));

                        message.find("> .entry .noncollapsed .expand").bind("click", collapse);
                        message.find("> .entry .collapsed .expand").bind("click", noncollapse);

                        firstMessage.addClass("hasThreads");
                    }
                });
            }
        } else {
            $message.val('flat view');
            firstMessage.removeClass("threaded-modmail");
            firstMessage.find(".thing").each(function () {
                $(this).insertBefore(firstMessage.find(".modmail-dummy-" + $(this).data("fullname")));
            });
        }
    });


    $body.on('click', '.mml-toggle-collapse', function () {

        var $message = $(this),
            collapsing = $message.hasClass('expanded'),
            $parent = $message.closest('.message-parent'),
            $buttons = $parent.find('.expand-btn'),
            $entry = $parent.find('.entry').hide();

        $message.toggleClass('expanded');

        if (collapsing) {
            $message.text('[+]');
            $buttons.hide();
            $entry.hide();
        } else {
            $message.text('[-]');
            $buttons.show();
            $entry.show();
        }
    });


    // todo move to tbutils
    function quickChunk(things, callback, complete) {
        var done = (things.length - 1);
        TB.utils.forEachChunked(things, 1, 150, function (thing, i) {
            if (callback !== undefined) callback(thing);

            if (i > done) return false;
            if (i === done) {
                if (complete !== undefined) complete();
            }
        });
    }

    /// MMP compat
    function settingsShim(key, val) {
        if (val === undefined) {
            return TB.modules.ModMail.setting(key);
        } else {
            return TB.modules.ModMail.setting(key, val);
        }
    }
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        //modmaillite(); //disabled.
    });
})();