function modmailpro() {
var self = new TB.Module('Mod Mail Pro');
self.shortname = 'ModMail';

////Default settings
self.settings['enabled']['default'] = true;
self.config['betamode'] = false;

self.register_setting('inboxStyle', {
    'type': 'selector',
    'values': ['All', 'Priority', 'Filtered', 'Replied', 'Unread', 'Unanswered'],
    'default': 'priority',
    'title': 'Default inbox view'
});

self.register_setting('filteredSubs', {
    'type': 'sublist',
    'default': [],
    'title': 'Subreddits to filter from priority view.'
});

self.register_setting('defaultCollapse', {
    'type': 'boolean',
    'default': false,
    'title': 'Collapse all mod mail threads by default.'
});

self.register_setting('noRedModmail', {
    'type': 'boolean',
    'default': true,
    'title': 'Show removed threads with red titles.'
});

self.register_setting('highlightNew', {
    'type': 'boolean',
    'default': true,
    'title': 'Highlight new threads and replies.'
});

self.register_setting('expandReplies', {
    'type': 'boolean',
    'default': false,
    'title': 'Expand all replies when expanding threads.'
});

self.register_setting('hideInviteSpam', {
    'type': 'boolean',
    'default': false,
    'title': 'Filter mod invited and added threads.'
});

self.register_setting('autoLoad', {
    'type': 'boolean',
    'default': true,
    'hidden': !TB.storage.getSetting('Notifier', 'enabled', true),
    'title': 'Automatically load new mod mail when received.'
});

self.register_setting('autoThread', {
    'type': 'boolean',
    'default': false,
    'title': 'Automatically thread replies when expanding. (Note: slows expanding time)'
});

self.register_setting('autoThreadOnLoad', {
    'type': 'boolean',
    'default': false,
    'title': 'Automatically thread replies on page load. (Note: slows page load time)'
});

self.register_setting('fadeRecipient', {
    'type': 'boolean',
    'default': true,
    'title': 'Fade the recipient of a modmail so it is much more clear who sent it.'
});

self.register_setting('subredditColor', {
    'type': 'boolean',
    'default': false,
    'title': 'Add a left border to modmail conversations with a color unique to the subreddit name.'
});

self.register_setting('subredditColorSalt', {
    'type': 'text',
    'default': "PJSalt",
    'title': 'Text to randomly change the subreddit color',
    'hidden': !self.setting('subredditColor')
});

self.register_setting('customLimit', {
    'type': 'number',
    'default': 0, // 0 = ueser's default.
    'title': 'Set the amount of modmail conversations loaded by default. Selecting 0 will use your reddit settings'
});

self.register_setting('filterBots', {
    'type': 'boolean',
    'default': false,
    'title': 'Filter bots from priority view'
});

self.register_setting('botsToFilter', {
    'type': 'list',
    'default': ['AutoModerator'],
    'title': 'Bots to filter from priority view. Bot names should entered separated by a comma without spaces',
    'hidden': !self.setting('filterBots')
});

/// Private setting storage
self.register_setting('lastVisited', {
    'type': 'number',
    'default': new Date().getTime(),
    'hidden': true
});
self.register_setting('replied', {
    'type': 'array',
    'default': [],
    'hidden': true
});
self.register_setting('threadProcessRate', {
    'type': 'number',
    'default': 100,
    'hidden': true
});
self.register_setting('entryProcessRate', {
    'type': 'number',
    'default': 50,
    'hidden': true
});
self.register_setting('chunkProcessSize', {
    'type': 'number',
    'default': 2,
    'hidden': true
});
self.register_setting('twoPhaseProcessing', {
    'type': 'boolean',
    'default': true,
    'hidden': true
});

// Allow default bot view IF user has filterBots enabled.
if (self.setting('filterBots')) {
    self.settings['inboxStyle']['values'] = ['All', 'Priority', 'Filtered', 'Replied', 'Unread', 'Unanswered', 'Bots'];
}

self.init = function() {
    if (!TBUtils.isModmail) return;

    this.modmailpro();
    this.autoLoad();
    this.mailDropDowns();
};

self.modmailpro = function() {
    var start = performance.now();

    var $body = $('body');

    var ALL = 'all', PRIORITY = 'priority', FILTERED = 'filtered', REPLIED = 'replied', UNREAD = 'unread', UNANSWERED = 'unanswered', BOTS = 'bots';

    self.startProfile('settings-access');
    var INVITE = "moderator invited",
        ADDED = "moderator added",
        inbox = self.setting('inboxStyle'),
        now = new Date().getTime(),
        lastVisited = self.setting('lastVisited'),
        newCount = 0,
        collapsed = self.setting('defaultCollapse'),
        expandReplies = self.setting('expandReplies'),
        noRedModmail = self.setting('noRedModmail'),
        hideInviteSpam = self.setting('hideInviteSpam'),
        highlightNew = self.setting('highlightNew'),
        fadeRecipient = self.setting('fadeRecipient'),
        subredditColor = self.setting('subredditColor'),
        subredditColorSalt = self.setting('subredditColorSalt'),
        threadProcessRate = self.setting('threadProcessRate'),
        entryProcessRate = self.setting('entryProcessRate'),
        chunkProcessSize = self.setting('chunkProcessSize'),
        twoPhaseProcessing = self.setting('twoPhaseProcessing'),
        filterBots = self.setting('filterBots'),
        botsToFilter = self.setting('botsToFilter'),
        unreadPage = location.pathname.match(/\/moderator\/(?:unread)\/?/), //TBUtils.isUnreadPage doesn't wok for this.  Needs or for moderator/messages.
        moreCommentThreads = [],
        unreadThreads = [],
        unansweredThreads = [],
        threadAlways = self.setting('autoThreadOnLoad'),
        threadOnExpand = threadAlways || self.setting('autoThread'),
        sentFromMMP = false,
        newThreadSupport = false;
    self.endProfile('settings-access');

    self.startProfile('common-element-gen');
    var separator = '<span class="separator">|</span>',
        spacer = '<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>',
        $allLink = $('<li><a class="alllink" href="javascript:;" data-view="' + ALL + '">all</a></li>'),
        $priorityLink = $('<li><a class="prioritylink" href="javascript:;" data-view="' + PRIORITY + '">priority</a></li>'),
        $filteredLink = $('<li><a class="filteredlink" href="javascript:;" data-view="' + FILTERED + '">filtered</a></li>'),
        $repliedLink = $('<li><a class="repliedlink" href="javascript:;" data-view="' + REPLIED + '">replied</a></li>'),
        $unreadLink = $('<li><a class="unreadlink" href="javascript:;" data-view="' + UNREAD + '">unread</a></li>'),
        $unansweredLink = $('<li><a class="unansweredlink" href="javascript:;" data-view="' + UNANSWERED + '">unanswered</a></li>'),
        $botsLink = $('<li><a class="botslink" href="javascript:;" data-view="' + BOTS + '">bots</a></li>'),
        $collapseLink = $('<li><a class="collapse-all-link" href="javascript:;">collapse all</a></li>'),
        $unreadCount = $('<li><span class="unread-count"><b>0</b> - new messages</span></li>'),
        $mmpMenu = $('<ul class="flat-list hover mmp-menu"></ul>'),
        $subFilter = $('<a href="javascript:;" class="filter-sub-link" title="Filter/unfilter thread subreddit."></a>');

    var infoArea =
        '<span class="info-area correspondent">\
            <span class="tb-message-count" title="Number of replies to the message."></span>\
            <span class="tb-replied-tag"></span>\
        </span>';

    var collapseLink = '<a href="javascript:;" class="tb-collapse-link">−</a>';

    //TODO: move to CSS
    var selectedCSS = {
        "color": "orangered",
        "font-weight": "bold"
    };
    var unselectedCSS = {
        "color": "#369",
        "font-weight": "normal"
    };

    self.endProfile('common-element-gen');

    // Find and clear menu list.
    self.startProfile('menu-gen');
    var $menuList = $('.menuarea ul.flat-list').html('');

    // Add menu items.
    $menuList.append($allLink);
    $menuList.append($priorityLink.prepend(separator));
    $menuList.append($filteredLink.prepend(separator));
    $menuList.append($repliedLink.prepend(separator));
    $menuList.append($unreadLink.prepend(separator));
    $menuList.append($unansweredLink.prepend(separator));
    if (filterBots) {
        $menuList.append($botsLink.prepend(separator));
    }

    $menuList.append($collapseLink.prepend(spacer));
    $mmpMenu.append($unreadCount.prepend(spacer));

    $menuList.after($mmpMenu);
    self.endProfile('menu-gen');


    initialize();

    // Processing functions

    function initialize() {
        self.startProfile('initialize');
        self.log('MMP init');

        TB.ui.longLoadNonPersistent(true);

        // Add support for detecting NER, realtime and LMC threads.
        addNewThreadSupport();

        // Collapse everything if enabled
        if (collapsed) {
            $body.find('.entry').css('display', 'none');
            $body.find('.expand-btn').css('display', 'none');
        }

        // Process threads
        var $unprocessedThreads = $('.message-parent:not(.mmp-processed)'),
            $processSlowly = $unprocessedThreads.slice(0, 5),
            $processFastly = $unprocessedThreads.slice(5);
        self.log('Unprocessed Threads = ' + $unprocessedThreads.length);
        self.log('\tProcessing slow = ' + $processSlowly.length);
        self.log('\tProcessing fast = ' + $processFastly.length);

        addThreadUI($unprocessedThreads);

        // Enable as much CSS can be done at this point
        enablePreProcessFeatures();

        // Start process
        if (twoPhaseProcessing) {
            processThreads($processSlowly, 1, threadProcessRate, slowComplete, "slow");
        }
        else {
            processThreads($unprocessedThreads, chunkProcessSize, threadProcessRate, fastComplete, "full");
        }

        function processThreads(threads, chunkSize, processRate, completeAction, profileKey) {
            TBUtils.forEachChunked(threads, chunkSize, processRate,
                function (thread, count, array) {
                    self.log('Running thread batch: ' + (count + 1) + ' of ' + array.length);
                    //self.log('\tUser = ' + TB.utils.getThingInfo(thread).user);
                    processThread(thread);
                },
                function complete() {
                    self.endProfile('batch-process-' + profileKey);
                    self.log('Batch ' + profileKey + ' complete');

                    completeAction();
                },
                function start() {
                    self.startProfile('batch-process-' + profileKey);
                });
        }

        function slowComplete() {
            processThreads($processFastly, chunkProcessSize, threadProcessRate / 2, fastComplete, "fast");
        }

        function fastComplete() {
            self.setting('lastVisited', now);

            if (highlightNew) {
                highlightNewThreads($unprocessedThreads);
            }

            // If set expand link.
            if (collapsed) {
                var $link = $('.collapse-all-link');
                $link.css(selectedCSS);
                $link.text('expand all');
            }

            // If we're on the unread page, don't filter anything.
            if (unreadPage) {
                var entries = $('.entry'),
                    newCount = entries.length;
                inbox = ALL;
                $menuList.html('<a href="/message/moderator/">go to full mod mail</a>');
                $('.unread-count').html('<b>' + newCount + '</b> - new mod mail thread' + (newCount == 1 ? '' : 's'));
                $(entries).click();
            }

            // Set views.
            setFilterLinks($unprocessedThreads);
            setReplied($unprocessedThreads);
            setView();


            TB.ui.longLoadNonPersistent(false);

            // I can't actually imagine this happening.
            if ($('.message-parent:not(.mmp-processed)').length > 0) {
                initialize();
            }
            // Mod mail done loading
            else {
                finalize();
            }
        }
    }

    function enablePreProcessFeatures() {
        $body.addClass('tb-collapse');
        if (noRedModmail) {
            $body.addClass('tb-no-red-modmail');
        }
    }

    function enablePostProcessFeatures() {
        $body.addClass('tb-modmail-pro');
        if (fadeRecipient) {
            $body.addClass('tb-fade-recipient');
        }
    }

    function processThread(thread) {
        self.startProfile("thread");
        self.startProfile("thread-info");
        self.startProfile("thread-jquery");

        var $thread = $(thread),
            newThread = $thread.hasClass('realtime-new'),
            lmcThread = $thread.hasClass('lmc-thread');

        $thread.addClass('mmp-processed');

        // Add back UI for new threads *before* any $thread.find()'s
        if (newThread || lmcThread) {
            addThreadUI($thread);
        }

        var $infoArea = $thread.find('.info-area'),
            $entries = $thread.find('.entry'),
            $messageCount = $infoArea.find('.tb-message-count'),
            $collapseLink = $thread.find(".tb-collapse-link"),
            $subredditArea = $thread.find('.correspondent:first'),
            $subject = $thread.find(".subject"),
            $threadTrigger = $('<a>').attr('href', 'javascript:;').addClass('expand-btn tb-thread-view').text("threaded view"),
            $flatTrigger = $('<a>').attr('href', 'javascript:;').addClass('expand-btn tb-flat-view').text("flat view"),

            threadInfo = TB.utils.getThingInfo($thread),
            threadID = threadInfo.id,
            subreddit = threadInfo.subreddit,
            title = threadInfo.title,
            sender = threadInfo.author,
            replyCount = ($entries.length - 1);

        // Set subreddit name.
        $thread.data('subreddit', subreddit);

        self.endProfile("thread-jquery");

        self.log('Processing thread: ' + title + ' in: /r/' + subreddit);
        self.log("\tNum entries = " + $entries.length);
        self.log("\tNum replies = " + replyCount);

        // LMC threads are never collapsed.
        if (collapsed && !lmcThread) {
            $collapseLink.text('+');
            $thread.addClass('mmp-collapsed');
            $flatTrigger[0].style.display = 'none';
            $threadTrigger[0].style.display = 'none';
        }

        self.endProfile("thread-info");

        // Add MMP UI
        $subject.append($threadTrigger);
        $subject.append($flatTrigger);

        if (replyCount > 0) {
            if ($thread.hasClass('moremessages')) {
                replyCount = replyCount.toString() + '+';
                moreCommentThreads.push(threadID);
            }

            $messageCount.text(replyCount);

            //Thread the message if required
            if (threadAlways) {
                threadModmail(threadID);
            }

        }
        else {
            unansweredThreads.push(threadID);

            $messageCount.text('No replies');

            // Only hide invite spam with no replies.
            if (hideInviteSpam) {
                if (title === INVITE || title === ADDED) {
                    $thread.addClass('invitespam');
                }
            }
        }

        if (filterBots) {
            if ($.inArray(sender, botsToFilter) != -1) {
                $thread.addClass('botspam');
            }
        }

        // Adds a colored border to modmail conversations where the color is unique to the subreddit. Basically similar to IRC colored names giving a visual indication what
        // subreddit the conversation is for.
        if (subredditColor) {
            self.startProfile("thread-sr-color");

            var subredditName = $thread.find('.correspondent a[href*="moderator/inbox"]').text(),
                colorForSub = TBUtils.stringToColor(subredditName + subredditColorSalt);

            $thread.attr('style', 'border-left: solid 3px ' + colorForSub + ' !important');
            $thread.addClass('tb-subreddit-color');

            self.endProfile("thread-sr-color");
        }

        // Don't parse all entries if we don't need to.
        if (fadeRecipient) {
            TBUtils.forEachChunked($entries, 5, entryProcessRate,
                function (entry, idx, array) {
                    self.startProfile('fade-recipient-internal');

                    // Fade the recipient of a modmail so it is much more clear WHO send it.
                    var $entry = $(entry),
                        $fadedRecipient = $entry.find('.recipient a.author');

                    // Ok this might be a tad complicated but it makes sure to fade out the recipient and also remove all reddit and RES clutter added to usernames.

                    // If there are two usernames we'll fade out the first one.
                    if ($fadedRecipient) {
                        var $head = $fadedRecipient.closest('.head');
                        $head.find('.userattrs').css('display', 'none');

                        $fadedRecipient.addClass('tb-recipient');
                    }

                    self.endProfile('fade-recipient-internal');
                },
                function complete() {
                    self.endProfile('fade-recipient');
                },
                function starting() {
                    self.startProfile('fade-recipient');
                }
            );
        }

        // Deal with realtime threads.
        if (newThread) {
            self.log('New thread!');
            $thread.removeClass('realtime-new');
            $infoArea.css('background-color', 'yellow');
            $subredditArea.css('background-color', 'yellow');

            setView($thread);
            setFilterLinks($thread);

            if (collapsed) {
                $thread.find('.entry').css('display', 'none');
                $thread.find('.expand-btn').css('display', 'none');
            }

            $thread.fadeIn("slow");
        }

        // Deal with LMC threads
        if (lmcThread) {
            self.log("LMC Thread!");
            if (threadOnExpand) {
                threadModmail(threadID);
            }

            if (expandReplies) {
                $thread.find('.expand-btn:first')[0].click();
            }

            // recolor new threads.
            if ($.inArray(threadID, unreadThreads) !== -1) {
                $infoArea.addClass('new-highlight');
                $subredditArea.addClass('new-highlight');
                $thread.addClass('new-messages');
            }

            setFilterLinks($thread);
            setReplied($thread);
        }

        self.endProfile("thread");
    }

    function addThreadUI($threads) {
        var $subArea = $threads.find('.correspondent:first');
        $subArea.find('> a[href^="/r/"]').addClass('subreddit-name');
        $subArea.prepend(collapseLink);
        $subArea.append($subFilter);
        $subArea.after(infoArea);
    }

    function addNewThreadSupport() {
        if (newThreadSupport) return;
        newThreadSupport = true;

        var event = new CustomEvent("TBNewThings");

        // realtime support
        $body.find('div.content').on('DOMNodeInserted', '.realtime-new', function (e) {
            self.log('realtime! realtime!');
            var $sender = $(e.target);
            if (!$sender.hasClass('message-parent')) {
                return;
            }

            start = performance.now();

            var attrib = $sender.data('fullname');

            setTimeout(function () {
                self.log('realtime go');
                var thread = $(".message-parent[data-fullname='" + attrib + "']");
                if (thread.length > 1) {
                    $sender.remove();
                } else {
                    processThread($sender);
                    sentFromMMP = true;
                    window.dispatchEvent(event);
                }
            }, 500);

        });

        // LMC support
        $body.on('click', '[id^=more_]', function () {
            self.log('LMC! LMC!');
            $body.find('div.content').on('DOMNodeInserted', '.message-parent', function (e) {
                var $sender = $(e.target);
                if ($.inArray($sender.data('fullname'), moreCommentThreads) === -1) {
                    return;
                }

                start = performance.now();

                setTimeout(function () {
                    self.log('LMC go');
                    $sender.addClass('lmc-thread');
                    processThread($sender);
                    sentFromMMP = true;
                    window.dispatchEvent(event);
                    $body.find('div.content').off('DOMNodeInserted', '.message-parent');
                }, 500);

            });
        });

        // NER support.
        window.addEventListener("TBNewThings", function () {
            if (sentFromMMP) {
                sentFromMMP = false;
                return;
            }
            self.log('NER! NER!');
            initialize();
        });
    }

    function highlightNewThreads($threads) {
        self.startProfile('highlight-new-jquery');

        $threads.find('.entry:last').each(function (key, entry) {
            var $entry = $(entry),
                timestamp = new Date($entry.find('.head time').attr('datetime')).getTime();

            if (timestamp > lastVisited) {
                var $newThread = $entry.closest('.message-parent');

                $newThread.find('.info-area').addClass('new-highlight');
                $newThread.find('.correspondent:first').addClass('new-highlight');
                $newThread.addClass('new-messages');

                unreadThreads.push($newThread.data('fullname'));
            }
        });

        self.endProfile('highlight-new-jquery');

        TBUtils.forEachChunked($('.new-messages').find('.entry'), 10, entryProcessRate, function (entry) {
            self.startProfile('highlight-new-internal');

            var $entry = $(entry),
                timestamp = new Date($entry.find('.head time').attr('datetime')).getTime();

            if (timestamp > lastVisited) {
                $entry.find('.head').prepend($('<span>').addClass('new-label new-highlight').text('[NEW]'));

                // Expand thread / highlight new
                if ($entry.parent().hasClass('collapsed')) {
                    $entry.find('.expand:first').click();
                }

                newCount++;
            }

            self.endProfile('highlight-new-internal');
        }, function complete() {
            $('.unread-count').html('<b>' + newCount + '</b> - new message' + (newCount == 1 ? '' : 's'));

            self.endProfile('highlight-new');
        }, function start() {
            self.startProfile('highlight-new');
        });
    }

    function finalize() {
        enablePostProcessFeatures();

        // Tell the user how quick and awesome we are.
        var nowTime = performance.now(),
            secs = (nowTime - start) / 1000;

        // Round time
        secs = Math.round(secs * 100) / 100;

        TB.ui.textFeedback('Mod mail loaded in: ' + secs + ' seconds', TB.ui.FEEDBACK_POSITIVE, 2000, TB.ui.DISPLAY_BOTTOM);

        // Profiling results
        self.endProfile('initialize');

        self.log("Profiling results: modmail");
        self.log("--------------------------");
        self.getProfiles().forEach(function (profile, key) {
            self.log(key + ":");
            self.log("\tTime  = " + profile.time.toFixed(4));
            self.log("\tCalls = " + profile.calls);
        });
        self.log("--------------------------");
    }

    function setView() {
        var a = [], //hacky-hack for 'all' view.
            filteredSubs = getFilteredSubs();

        // Neither a switch nor === will work correctly.
        if (inbox == ALL) {
            $allLink.closest('li').addClass('selected');
            hideThreads(a); // basically hideThreads(none);
            return;

        } else if (inbox == PRIORITY) {
            $priorityLink.closest('li').addClass('selected');
            hideThreads(filteredSubs);

        } else if (inbox == FILTERED) {
            $filteredLink.closest('li').addClass('selected');
            showThreads(filteredSubs);

        } else if (inbox == REPLIED) {
            $repliedLink.closest('li').addClass('selected');
            showThreads(getRepliedThreads(), true);

        } else if (inbox == UNREAD) {
            $unreadLink.closest('li').addClass('selected');
            showThreads(unreadThreads, true);

        } else if (inbox == UNANSWERED) {
            $unansweredLink.closest('li').addClass('selected');
            showThreads(unansweredThreads, true);
        }

        else if (inbox == BOTS) {
            $botsLink.closest('li').addClass('selected');
            self.log(getBotThreads());
            showThreads(getBotThreads(), true);
        }

        // Hide invite spam.
        if (hideInviteSpam && inbox != UNREAD) {
            $('.invitespam').each(function () {
                var $this = $(this);
                if ($this.hasClass('new')) {
                    $this.find('.entry').click();
                }

                $this.css('display', 'none');
            });
        }

        // Hide invite spam.
        if (filterBots && inbox == PRIORITY) {
            $('.botspam').each(function () {
                var $this = $(this);
                if ($this.hasClass('new')) {
                    $this.find('.entry').click();
                }

                $this.css('display', 'none');
            });
        }
    }

    function collapse() {
        $(this).parents(".thing:first").find("> .child").hide();
    }

    function noncollapse() {
        $(this).parents(".thing:first").find("> .child").show();
    }

    function threadModmail(fullname) {
        self.startProfile("threading");

        var $firstMessage = $("div.thing.id-" + fullname).addClass("threaded-modmail");

        if ($firstMessage.hasClass("has-replies")) {
            $firstMessage.find(".thing").each(function () {
                var parent = $("div.thing.id-" + $(this).data("parent"));
                $(this).appendTo(parent.find("> .child"));
            });
        }
        else {
            var id = fullname.substring(3);

            $.getJSON("//www.reddit.com/message/messages/" + id + ".json", null, function (data) {
                var messages = data.data.children[0].data.replies.data.children;

                for (var i = 0; i < messages.length; i++) {
                    var item = messages[i].data;

                    var $message = $("div.thing.id-" + item.name);
                    var $dummy = $("<div></div>").addClass("modmail-dummy-" + item.name);
                    var $parent = $("div.thing.id-" + item.parent_id);

                    $message.data("parent", item.parent_id);

                    $dummy.insertAfter($message);
                    $message.appendTo($parent.find("> .child"));

                    $message.find("> .entry .noncollapsed .expand").bind("click", collapse);
                    $message.find("> .entry .collapsed .expand").bind("click", noncollapse);

                    $firstMessage.addClass("has-replies");
                }
            });
        }

        self.endProfile("threading");
    }

    function flatModmail(fullname) {
        var firstMessage = $("div.thing.id-" + fullname).removeClass("threaded-modmail");

        firstMessage.find(".thing").each(function () {
            $(this).insertBefore(firstMessage.find(".modmail-dummy-" + $(this).data("fullname")));
        });
    }

    function setFilterLinks(threads) {
        if (threads === undefined) {
            threads = $('.message-parent');
        }

        // I think I could do this by just locating .filter-sub-link.
        threads.each(function () {
            var $this = $(this),
                subname = $this.data('subreddit'),
                linktext = 'F';

            if ($.inArray(subname, getFilteredSubs()) !== -1) {
                linktext = 'U';
            }

            $this.find('.filter-sub-link').text(linktext);
        });
    }

    function setReplied(threads) {
        if (threads === undefined) {
            threads = $('.message-parent');
        }

        threads.each(function () {
            var $this = $(this),
                id = $this.data('fullname');

            if ($.inArray(id, getRepliedThreads()) !== -1) {
                $this.find('.tb-replied-tag').html(' Replied');
                $this.removeClass('invitespam'); //it's not spam if we replied.
            }
        });
    }

    function getFilteredSubs() {
        return self.setting('filteredSubs');
    }

    function getRepliedThreads() {
        return self.setting('replied');
    }

    function getBotThreads() {
        var bots = [];
        $('.botspam').each(function () {
            bots.push($(this).data('fullname'));
        });
        return bots;
    }

    function showThreads(items, byID) {
        $('.message-parent').each(function () {
            var $this = $(this);
            $this.css('display', 'none');

            if (!byID) {
                var subname = $this.data('subreddit');

                if ($.inArray(subname, items) !== -1) {
                    $this.css('display', '');
                }

            } else {
                var id = $this.data('fullname');

                if ($.inArray(id, items) !== -1) {
                    $this.css('display', '');
                }
            }
        });
    }

    function hideThreads(subs) {
        $('.message-parent').each(function () {
            var $this = $(this),
                subname = $this.data('subreddit');

            $this.css('display', '');

            if ($.inArray(subname, subs) !== -1) {
                $this.css('display', 'none');
            }
        });
    }

    function collapseall(threads) {
        self.log('collapsing all');
        collapsed = true;
        var $link = $('.collapse-all-link');

        // make look selected.
        $link.css(selectedCSS);

        // Hide threads.
        if (threads === undefined) {
            threads = $('.message-parent');
        }

        TBUtils.forEachChunked(threads, 25, 250, function () {
            $this = $(this);
            $this.find('.entry').css('display', 'none');
            $this.find('.expand-btn').css('display', 'none');
        });

        $link.text('expand all');
        $('.tb-collapse-link').text('+');
    }

    function expandall() {
        collapsed = false;
        var $link = $('.collapse-all-link');

        // make look unselected.
        $link.css(unselectedCSS);

        // Show threads.
        var threads = $('.message-parent');

        TBUtils.forEachChunked(threads, 35, 250, function (thread) {
            $this = $(this);
            $this.find('.entry').css('display', '');
            $this.find('.expand-btn').css('display', '');

            if (expandReplies) {
                $this.find('.expand-btn:first')[0].click();
            }

            if (threadOnExpand) {
                $this.find('.tb-thread-view')[0].click();
            }
        });

        $link.text('collapse all');
        $('.tb-collapse-link').text('−');
    }

    /// EVENTS ///
    $body.on('click', '.save', function (e) {
        var $parent = $(e.target).closest('.message-parent'),
            id = $parent.data('fullname'),
            replied = getRepliedThreads();

        // Add sub to filtered subs.
        if ($.inArray(id, replied) === -1 && id !== null) {
            replied.push(id);
        }

        self.setting('replied', replied);

        // Update UI
        $parent.addClass('has-replies');

        var $infoArea = $parent.find('.info-area'),
            numReplies = $parent.find('.entry').length - 1;
        $infoArea.text(numReplies);

        setReplied();
    });

    $body.on('click', '.prioritylink, .alllink, .filteredlink, .repliedlink, .unreadlink, .unansweredlink, .botslink', function (e) {
        // Just unselect all, then select the caller.
        $($menuList).find('li').removeClass('selected');

        inbox = $(e.target).data('view');

        setView();
    });

    $body.on('click', '.collapse-all-link', function () {
        if (collapsed) {
            expandall();
        } else {
            collapseall();
        }
    });

    $body.on('click', '.tb-collapse-link', function () {
        var $this = $(this),
            $parent = $this.closest('.message-parent');
        if (!$parent.hasClass('mmp-collapsed')) {
            $parent.find('.entry').hide();
            $parent.find('.expand-btn').hide();
            $this.text('+');
            $parent.addClass('mmp-collapsed');
        } else {
            $parent.find('.entry').show();
            $parent.find('.expand-btn').show();
            $this.text('−');
            $parent.removeClass('mmp-collapsed');

            //Show all comments
            if (expandReplies) {
                $parent.find('.expand-btn:first')[0].click();
            }

            if (threadOnExpand) {
                $parent.find('.tb-thread-view')[0].click();
            }
        }
    });

    // Threading methods.
    $body.on('click', '.tb-flat-view', function () {
        flatModmail($(this).closest('.message-parent').data('fullname'));
    });

    $body.on('click', '.tb-thread-view', function () {
        threadModmail($(this).closest('.message-parent').data('fullname'));
    });

    $body.on('click', '.filter-sub-link', function (e) {
        var subname = $(e.target).closest('.message-parent').data('subreddit'),
            filtersubs = getFilteredSubs();

        // Add sub to filtered subs.
        if ($.inArray(subname, filtersubs) === -1) {
            filtersubs.push(subname);
        } else {
            filtersubs.splice(filtersubs.indexOf(subname), 1);
        }

        // Save new filter list.
        self.setting('filteredSubs', filtersubs);

        // Refilter if in filter mode.
        setView();

        // Relabel links
        setFilterLinks();
    });
};


self.autoLoad = function() {
    // Don't run if the page we're viewing is paginated, or if we're in the unread page.
    if (location.search.match(/before|after/) || location.pathname.match(/\/moderator\/(?:unread)\/?/) || location.pathname.match(/\/r\/?/)) return;

    // autoload depends on notifier
    if (!TB.storage.getSetting('Notifier', 'enabled', true)) return;

    var delay = 5000, // Default 5 sec delay between checking for new modmail.
        refreshLimit = 15, // Default five items per request.
        refreshLink = $('<li><a class="refresh-link" href="javascript:;" title="NOTE: this will only show new threads, not replies.">refresh</a></li>'),
        updateURL = '/message/moderator?limit=',
        menulist = $('.menuarea ul.flat-list:first');

    var selectedCSS = {
        "color": "orangered",
        "font-weight": "bold"
    };
    var unselectedCSS = {
        "color": "#369",
        "font-weight": "normal"
    };

    // Add refresh button.
    $(refreshLink).click(function () {
        getNewThings(refreshLimit);

    });
    menulist.append($(refreshLink).prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));

    // Run RTMM.
    if (self.setting('autoLoad') && TB.storage.getSetting('Notifier', 'enabled', true)) {
        setInterval(function () {
            var count = TB.storage.getSetting('Notifier', 'modmailCount', 0);
            if (count > 0) {
                getNewThings((count + 2));
            }
        }, delay);
    }

    // Add new things
    function getNewThings(limit) {
        $(refreshLink).css(selectedCSS);
        TB.storage.setSetting('Notifier', 'lastSeenModmail', new Date().getTime());
        TB.storage.setSetting('Notifier', 'modmailCount', 0);

        self.log('real time a gogo: ' + limit);
        TBUtils.addToSiteTable(updateURL + String(limit), function (resp) {
            if (!resp) return;
            var $things = $(resp).find('.message-parent').hide().addClass('realtime-new');
            var $siteTable = $('#siteTable');

            $siteTable.prepend($things);
            $(refreshLink).css(unselectedCSS);
        });
    }
};


self.mailDropDowns = function() {
    var COMPOSE = 'compose-message',
        SWITCH = 'switch-modmail',
        composeURL = '/message/compose?to=%2Fr%2F',
        $composeSelect = $('<li><select class="compose-mail"><option value="' + COMPOSE + '">compose mod mail</option></select></li>'),
        $switchSelect = $('<li><select class="switch-mail"><option value="' + SWITCH + '">switch mod mail</option></select></li>'),
        $mmpMenu = $('.mmp-menu');

    TBUtils.getModSubs(function () {
        populateDropDowns();
    });

    function populateDropDowns() {
        $mmpMenu.append($composeSelect.prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));
        $mmpMenu.append($switchSelect.prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));

        $(TBUtils.mySubs).each(function () {
            $('.compose-mail').append($('<option>', {
                value: this
            }).text(this));

            $('.switch-mail').append($('<option>', {
                value: this
            }).text(this));
        });

        $('.compose-mail').change(function () {
            var $this = $(this);
            var sub = $this.val();
            if (sub !== COMPOSE) {
                window.open(composeURL + $this.val());
                $(this).val(COMPOSE);
            }
        });

        $('.switch-mail').change(function () {
            var sub = $(this).val();
            if (sub !== SWITCH) {
                window.open('/r/' + sub + '/message/moderator/inbox');
                $(this).val(SWITCH);
            }
        });
    }
};

TB.register_module(self);
} // modmailpro() wrapper

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        modmailpro();
    });
})();
