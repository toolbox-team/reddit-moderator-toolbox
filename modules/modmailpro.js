function modmailpro() {
//Setup
var modMailPro = new TB.Module('Mod Mail Pro');

////Default settings
modMailPro.settings["enabled"]["default"] = true;
modMailPro.config["betamode"] = false;
modMailPro.config["needs_mod_subs"] = true;

modMailPro.register_setting('inboxstyle', {
    'type': 'selector',
    'values': ['All', 'Priority', 'Filtered', 'Replied', 'Unread', 'Unanswered'],
    'default': 'priority',
    'title': 'Default inbox view'
});

modMailPro.register_setting('defaultcollapse', {
    'type': 'boolean',
    'default': false,
    'title': 'Collapse all mod mail threads by default.'
});

modMailPro.register_setting('noredmodmail', {
    'type': 'boolean',
    'default': true,
    'title': 'Show removed threads with red titles.'
});

modMailPro.register_setting('highlightnew', {
    'type': 'boolean',
    'default': true,
    'title': 'Highlight new threads and replies.'
});

modMailPro.register_setting('expandreplies', {
    'type': 'boolean',
    'default': false,
    'title': 'Expand all replies when expanding threads.'
});

modMailPro.register_setting('hideinvitespam', {
    'type': 'boolean',
    'default': false,
    'title': 'Filter mod invited and added threads.'
});

modMailPro.register_setting('autoload', {
    'type': 'boolean',
    'default': false,
    'hidden': !TB.storage.getSetting('Notifier', 'enabled', true),
    'title': 'Automatically load new mod mail when received.'
});

modMailPro.register_setting('autothread', {
    'type': 'boolean',
    'default': false,
    'title': 'Automatically thread replies when expanding. (Note: slows expanding time)'
});

modMailPro.register_setting('subredditcolor', {
    'type': 'boolean',
    'default': false,
    'title': 'Add a left border to modmail conversations with a color unique to the subreddit name.'
});

modMailPro.init = function () {
    if (!TBUtils.isModmail) return;

    this.modmailpro();
    this.realtimemail();
    this.compose();
    this.modmailSwitch();
};

modMailPro.modmailpro = function () {
    var $body = $('body');

    var ALL = 'all', PRIORITY = 'priority', FILTERED = 'filtered', REPLIED = 'replied', UNREAD = 'unread', UNANSWERED = 'unanswered';

    var INVITE = "moderator invited",
        ADDED = "moderator added",
        inbox = TB.storage.getSetting('ModMailPro', 'inboxstyle', PRIORITY),
        now = new Date().getTime(),
        buffer = 5 * 60000, // 5mins
        lastVisited = TB.storage.getSetting('ModMailPro', 'lastvisited', now),
        visitedBuffer = TB.storage.getSetting('ModMailPro', 'visitedbuffer', -1), // I think this may be broken.
        newCount = 0,
        collapsed = TB.storage.getSetting('ModMailPro', 'defaultcollapse', false),
        expandReplies = TB.storage.getSetting('ModMailPro', 'expandreplies', false),
        noRedModmail = TB.storage.getSetting('ModMailPro', 'noredmodmail', true),
        hideInviteSpam = TB.storage.getSetting('ModMailPro', 'hideinvitespam', false),
        highlightNew = TB.storage.getSetting('ModMailPro', 'highlightnew', true),
        unreadPage = location.pathname.match(/\/moderator\/(?:unread)\/?/), //TBUtils.isUnreadPage doesn't wok for this.  Needs or for moderator/messages.
        moreCommentThreads = [],
        unreadThreads = [],
        unansweredThreads = [],
    //newLoadedMessages = 0, //Because flowwit is a doesn't respect your reddit prefs. (TODO: make use of flowwit's callback.)
        unprocessedThreads = $('.message-parent:not(.mmp-processed)'),
        threadAlways = TB.storage.getSetting('ModMailPro', 'autothread', false);

    var separator = '<span class="separator">|</span>',
        spacer = '<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>',
        allLink = $('<li><a class="alllink" href="javascript:;" view="' + ALL + '">all</a></li>'),
        priorityLink = $('<li><a class="prioritylink" href="javascript:;" view="' + PRIORITY + '">priority</a></li>'),
        filteredLink = $('<li><a class="filteredlink" href="javascript:;" view="' + FILTERED + '">filtered</a></li>'),
        repliedLink = $('<li><a class="repliedlink" href="javascript:;" view="' + REPLIED + '">replied</a></li>'),
        unreadLink = $('<li><a class="unreadlink" href="javascript:;" view="' + UNREAD + '">unread</a></li>'),
        unansweredlink = $('<li><a class="unansweredlink" href="javascript:;" view="' + UNANSWERED + '">unanswered</a></li>'),
        collapseLink = $('<li><a class="collapse-all-link" href="javascript:;">collapse all</a></li>'),
        unreadCount = $('<li><span class="unread-count"><b>0</b> - new messages</span></li>'),
        mmpMenu = $('<ul class="flat-list hover mmp-menu"></ul>');

    // TODO: promote to TBUtils.
    var selectedCSS = {
        "color": "orangered",
        "font-weight": "bold"
    };
    var unselectedCSS = {
        "color": "#369",
        "font-weight": "normal"
    };

    // Find and clear menu list.
    var menuList = $('.menuarea ul.flat-list').html('');

    // Add menu items.
    menuList.append(allLink);
    menuList.append($(priorityLink).prepend(separator));
    menuList.append($(filteredLink).prepend(separator));
    menuList.append($(repliedLink).prepend(separator));
    menuList.append($(unreadLink).prepend(separator));
    menuList.append($(unansweredlink).prepend(separator));
    menuList.append($(collapseLink).prepend(spacer));

    mmpMenu.append($(unreadCount).prepend(spacer));

    menuList.after(mmpMenu);

    $body.on('click', '.save', function (e) {
        var parent = $(e.target).closest('.message-parent'),
            id = $(parent).attr('data-fullname'),
            replied = getRepliedThreads();

        // Add sub to filtered subs.
        if ($.inArray(id, replied) === -1 && id !== null) {
            replied.push(id);
        }

        TB.storage.setSetting('ModMailPro', 'replied', replied);

        setReplied();
    });

    function setView() {
        var a = [], //hacky-hack for 'all' view.
            filteredSubs = getFilteredSubs();

        // Neither a switch nor === will work correctly.
        if (inbox == ALL) {
            $(allLink).closest('li').addClass('selected');
            hideThreads(a); // basically hideThreads(none);
            return;

        } else if (inbox == PRIORITY) {
            $(priorityLink).closest('li').addClass('selected');
            hideThreads(filteredSubs);

        } else if (inbox == FILTERED) {
            $(filteredLink).closest('li').addClass('selected');
            showThreads(filteredSubs);

        } else if (inbox == REPLIED) {
            $(repliedLink).closest('li').addClass('selected');
            showThreads(getRepliedThreads(), true);

        } else if (inbox == UNREAD) {
            $(unreadLink).closest('li').addClass('selected');
            showThreads(unreadThreads, true);

        } else if (inbox == UNANSWERED) {
            $(unansweredlink).closest('li').addClass('selected');
            showThreads(unansweredThreads, true);
        }

        // Hide invite spam.
        if (hideInviteSpam && inbox != UNREAD) {
            $('.invitespam').each(function () {
                var $this = $(this);
                if ($this.hasClass('new')) {
                    $this.find('.entry').click();
                }

                $this.hide();
            });
        }
    }

    $body.on('click', '.prioritylink, .alllink, .filteredlink, .repliedlink, .unreadlink, .unansweredlink', function (e) {
        // Just unselect all, then select the caller.
        $(menuList).find('li').removeClass('selected');

        inbox = $(e.target).attr('view');

        setView();
    });

    $body.on('click', '.collapse-all-link', function () {
        if (collapsed) {
            expandall();
        } else {
            collapseall();
        }
    });

    $body.on('click', '.collapse-link', function () {
        var $this = $(this),
            parent = $this.closest('.message-parent');
        if ($this.text() === '[-]') {
            parent.find('.entry').hide();
            parent.find('.expand-btn').hide();
            $this.text('[+]');
        } else {
            parent.find('.entry').show();
            parent.find('.expand-btn').show();
            $this.text('[-]');

            //Show all comments
            if (expandReplies) {
                parent.find('.expand-btn:first')[0].click();
            }

            if (threadAlways){
                parent.find('.tb-thread-view')[0].click();
            }
        }
    });

    initialize();

    // NER support.
    window.addEventListener("TBNewThings", function () {
        initialize();
    });


    // RES NER support.
    $('div.content').on('DOMNodeInserted', function (e) {
        var $sender = $(e.target);
        var event = new CustomEvent("TBNewThings");

        if (!$sender.hasClass('message-parent')) {
            return; //not RES, not flowwit, not load more comments, not realtime.
        }

        if ($sender.hasClass('realtime-new')) { //new thread
            var attrib = $sender.attr('data-fullname');
            if (attrib) {
                setTimeout(function () {
                    $.log('realtime go');
                    var thread = $(".message-parent[data-fullname='" + attrib + "']");
                    if (thread.length > 1) {
                        $sender.remove();
                        return
                    } else {
                        processThread(thread);
                        //window.dispatchEvent(event);
                    }
                }, 500);
            }
            return;
        } else if ($.inArray($sender.attr('data-fullname'), moreCommentThreads) !== -1) { //check for 'load mor comments'
            setTimeout(function () {
                $.log('LMC go');
                processThread($sender);
                window.dispatchEvent(event);
            }, 500);
            return;
        }
    });     

    function initialize() {
        $.log('MMP init');

        unprocessedThreads = $('.message-parent:not(.mmp-processed)');
        $.log(unprocessedThreads.length);

        // Add filter link to each title, if it doesn't already have one.
        TBUtils.forEachChunked(unprocessedThreads, 25, 350, function (thread) {
            //$.log('running batch');
            processThread(thread);
        }, function complete() {

            // Update time stamps, but only if it has been more than five minutes since the last update.
            //console.log(now > visitedBuffer);
            if (now > visitedBuffer) {
                TB.storage.setSetting('ModMailPro', 'lastvisited', now);
                TB.storage.setSetting('ModMailPro', 'visitedbuffer', now + buffer);
            }

            // If set collapse all threads on load.
            if (collapsed) {
                collapseall(unprocessedThreads);
            }

            // If we're on the unread page, don't filter anything.
            if (unreadPage) {
                var entries = $('.entry');
                var newCount = entries.length;
                inbox = ALL;
                menuList.html('<a href="/message/moderator/">go to full mod mail</a>');
                $('.unread-count').html('<b>' + newCount + '</b> - new mod mail thread' + (newCount == 1 ? '' : 's'));
                $(entries).click();
            }

            // Set views.
            setFilterLinks(unprocessedThreads);
            setReplied(unprocessedThreads);
            setView();
        });
        // Add borders if enabled. 
        if (TB.storage.getSetting('ModMailPro', 'subredditcolor', true)) {
            colorBorderMail();
        }
    }
    
    // Adds a colored border to modmail conversations where the color is unique to the subreddit. Basically similar to IRC colored names giving a visual indication what subreddit the conversation is for. 
    function colorBorderMail() {    
        $('body').find('.thing.message-parent').each(function() {
        var $this = $(this);
            if (!$this.hasClass('tb-subreddit-color')) {
                var subredditName = $this.find('.correspondent a[href*="moderator/inbox"]').text(), 
                    subredditColor = TBUtils.stringToColor(subredditName);
                $this.css('border-left', 'solid 3px ' + subredditColor);
                $this.addClass('tb-subreddit-color');
            }    
        });
    }     
    
    function processThread(thread) {
        var $thread = $(thread);
        if ($thread.hasClass('mmp-processed')) {
            return;
        }

        // Set-up MMP info area.
        $thread.addClass('mmp-processed');

        var threadID = $thread.attr('data-fullname'),
            entries = $thread.find('.entry'),
            count = (entries.length - 1),
            subreddit = getSubname(thread),
            newThread = $thread.hasClass('realtime-new'),
            subject = $thread.find(".subject");

        $('<span class="info-area correspondent"></span>').insertAfter($thread.find('.correspondent:first'));

        // add threading options
        var flatTrigger = $("<a></a>").addClass("expand-btn tb-flat-view").text("flat view").attr("href", "#").appendTo(subject).hide();
        var threadTrigger = $("<a></a>").addClass("expand-btn tb-thread-view").text("threaded view").attr("href", "#").appendTo(subject);

        flatTrigger.click(function () {
            flatModmail(threadID);
            $(this).hide();
            threadTrigger.show();
            return false;
        });
        threadTrigger.click(function () {
            threadModmail(threadID);
            $(this).hide();
            flatTrigger.show();
            return false;
        });

        // Only one feature needs thread, so disable it because it's costly.
        if (hideInviteSpam) {
            $thread.find('.subject:first').contents().filter(function () {
                return this.nodeType === 3;
            }).wrap('<span class="message-title">');
        }

        var infoArea = $thread.find('.info-area');
        var spacer = '<span> </span>';

        $('</span><a style="color:orangered" href="javascript:;" class="filter-sub-link" title="Filter/unfilter thread subreddit."></a> <span>').appendTo(infoArea);

        if (count > 0) {
            if ($thread.hasClass('moremessages')) {
                count = count + '+';
                moreCommentThreads.push(threadID);
            }
            $('<span class="message-count">' + count + ' </span>' + spacer).appendTo(infoArea);
        } else {
            unansweredThreads.push(threadID);

            // Only hide invite spam with no replies.
            if (hideInviteSpam) {
                var title = $thread.find('.message-title').text().trim();
                if (title === INVITE || title === ADDED) {
                    $thread.addClass('invitespam');
                }
            }
        }

        $('<span class="replied-tag"></span>' + spacer).appendTo(infoArea);

        $thread.find('.correspondent.reddit.rounded a').parent().prepend(
            '<a href="javascript:;" class="collapse-link">[-]</a> ');

        if (noRedModmail) {
            if ($thread.hasClass('spam')) {
                $thread.css('background-color', 'transparent');
                $thread.find('.subject').css('color', 'red');
            }
        }

        // Don't parse all entries if we don't need to.
        if (noRedModmail || highlightNew) {
            TBUtils.forEachChunked(entries, 25, 250, function (entry) {
                if (noRedModmail) {
                    var message = $(entry).parent();

                    if (message.hasClass('spam')) {
                        $(message).css('background-color', 'transparent');
                        $(message).find('.entry:first .head').css('color', 'red');
                    }
                }

                if (highlightNew && !newThread) {
                    var timestamp = new Date($(entry).find('.head time').attr('datetime')).getTime();

                    if (timestamp > lastVisited) {
                        if ($.inArray(threadID, unreadThreads == -1)) {
                            unreadThreads.push(threadID);
                        }

                        $(entry).find('.head').prepend('<span style="background-color:lightgreen; color:black">[NEW]</span><span>&nbsp;</span>');

                        // Expand thread / highlight new
                        if (message.hasClass('collapsed')) {
                            $(entry).find('.expand:first').click();
                        }
                        $(infoArea).css('background-color', 'lightgreen');

                        newCount++;
                        $('.unread-count').html('<b>' + newCount + '</b> - new message' + (newCount == 1 ? '' : 's'));
                    }
                }
            });
        }

        // Deal with realtime threads.
        if (newThread) {
            $thread.removeClass('realtime-new');
            $(infoArea).css('background-color', 'yellow');
            setView($thread);
            setFilterLinks($thread);

            if (collapsed) {
                $thread.find('.entry').hide();
                $thread.find('.expand-btn').hide();
                $thread.find('.collapse-link').text('[+]');
            }
            $thread.fadeIn("slow");
        }
    }

    function collapse() {
        $(this).parents(".thing:first").find("> .child").hide();
    }
    function noncollapse() {
        $(this).parents(".thing:first").find("> .child").show();
    }

    function threadModmail(fullname) {
        var firstMessage = $("div.thing.id-" + fullname).addClass("threaded-modmail");

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
            var subname = getSubname(this);
            var linktext = 'F';

            if ($.inArray(subname, getFilteredSubs()) !== -1) {
                linktext = 'U';
            }

            $(this).find('.filter-sub-link').text(linktext);
        });
    }

    function setReplied(threads) {
        if (threads === undefined) {
            threads = $('.message-parent');
        }

        threads.each(function () {
            var $this = $(this),
                id = $this.attr('data-fullname');

            if ($.inArray(id, getRepliedThreads()) !== -1) {
                $this.find('.replied-tag').text('R');
                $this.removeClass('invitespam'); //it's not spam if we replied.
            }
        });
    }

    $body.on('click', '.filter-sub-link', function (e) {
        var subname = getSubname($(e.target).closest('.message-parent'));
        var filtersubs = getFilteredSubs();

        // Add sub to filtered subs.
        if ($.inArray(subname, filtersubs) === -1) {
            filtersubs.push(subname);
        } else {
            filtersubs.splice(filtersubs.indexOf(subname), 1);
        }

        // Save new filter list.
        TB.storage.setSetting('ModMailPro', 'filteredsubs', filtersubs);

        // Refilter if in filter mode.
        setView();

        // Relabel links
        setFilterLinks();

        // Update filter count in settings.
        $('.filter-count').text(filtersubs.length);
        $('.filter-count').attr('title', filtersubs.join(', '));
    });

    function getSubname(sub) {
        return $(sub).find('.correspondent.reddit.rounded a').text().replace('/r/', '').replace('[-]', '')
            .replace('[+]', '').trim().toLowerCase();
    }

    function getFilteredSubs() {
        return TB.storage.getSetting('ModMailPro', 'filteredsubs', []);
    }

    function getRepliedThreads() {
        return TB.storage.getSetting('ModMailPro', 'replied', []);
    }

    function showThreads(items, byID) {
        $('.message-parent').each(function () {
            var $this = $(this);
            $this.hide();

            if (!byID) {
                var subname = getSubname(this);

                if ($.inArray(subname, items) !== -1) {
                    $this.show();
                }

            } else {
                var id = $this.attr('data-fullname');

                if ($.inArray(id, items) !== -1) {
                    $this.show();
                }
            }
        });
    }

    function hideThreads(subs) {
        $('.message-parent').each(function () {
            var subname = getSubname(this);
            var $this = $(this);
            $this.show();

            if ($.inArray(subname, subs) !== -1) {
                $this.hide();
            }
        });
    }

    function collapseall(threads) {
        $.log('collapsing all');
        collapsed = true;
        var link = ('.collapse-all-link');

        // make look selected.
        $(link).css(selectedCSS);

        // Hide threads.
        if (threads === undefined) {
            threads = $('.message-parent');
        }

        TBUtils.forEachChunked(threads, 35, 250, function (thread) {
            $(thread).find('.entry').hide();
            $(thread).find('.expand-btn').hide();
        });

        $(link).text('expand all');
        $('.collapse-link').text('[+]');
    }

    function expandall() {
        collapsed = false;
        var link = ('.collapse-all-link');

        // make look unselected.
        $(link).css(unselectedCSS);

        // Show threads.
        var threads = $('.message-parent');

        TBUtils.forEachChunked(threads, 35, 250, function (thread) {
            $(thread).find('.entry').show();
            $(thread).find('.expand-btn').show();

            if (expandReplies) {
                $(thread).find('.expand-btn:first')[0].click();
            }

            if (threadAlways){
                $(thread).find('.tb-thread-view')[0].click();
            }
        });

        $(link).text('collapse all');
        $('.collapse-link').text('[-]');
    }
};


modMailPro.realtimemail = function () {
    // Don't run if the page we're viewing is paginated, or if we're in the unread page.
    if (location.search.match(/before|after/) || location.pathname.match(/\/moderator\/(?:unread)\/?/) ||
        location.pathname.match(/\/r\/?/) || !TB.storage.getSetting('ModMailPro', 'autoload', false)) return;

    var delay = 30000, // Default .5 min delay between requests.
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

    // Add refresh buttion.
    $(refreshLink).click(function () {
        $(refreshLink).css(selectedCSS);
        getNewThings(refreshLimit);

    });
    menulist.append($(refreshLink).prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));

    // Run RTMM.
    if (TB.storage.getSetting('ModMailPro', 'autoload', false) && TB.storage.getSetting('Notifier', 'enabled', true)) {
        setInterval(function () {
            var count = TB.storage.getSetting('Notifier', 'modmailcount', 0);
            if (count > 0) {
                $(refreshLink).css(selectedCSS);
                getNewThings(count);
            }
        }, delay);
    }

    // Add new things
    function getNewThings(limit) {
        TB.storage.setSetting('Notifier', 'lastseenmodmail', new Date().getTime());
        TB.storage.setSetting('Notifier', 'modmailcount', 0);

        $.log('real time a gogo: ' + limit);
        TBUtils.addToSiteTaable(updateURL + String(limit), function (resp) {
            if (!resp) return;
            var $things = $(resp).find('.message-parent').addClass('realtime-new').hide();
            var $siteTable = $('#siteTable');

            $siteTable.prepend($things);
            $(refreshLink).css(unselectedCSS);
        });
    }
};


modMailPro.compose = function () {
    var COMPOSE = "compose-message",
    //mySubs = [],
        composeSelect = $('<li><select class="compose-mail" style="background:transparent;"><option value=' + COMPOSE + '>compose mod mail</option></select></li>'),
        composeURL = '/message/compose?to=%2Fr%2F';

    TBUtils.getModSubs(function () {
        populateCompose();
    });

    function populateCompose() {
        $('.mmp-menu').append($(composeSelect).prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));

        $(TBUtils.mySubs).each(function () {
            $('.compose-mail')
                .append($('<option>', {
                    value: this
                })
                    .text('/r/' + this));
        });

        $('.compose-mail').change(function () {
            var $this = $(this);
            var sub = $this.val();
            if (sub !== COMPOSE) {
                window.open(composeURL + $this.val());
                $(composeSelect).val(COMPOSE);
            }
        });
    }
};


modMailPro.modmailSwitch = function () {
    switchSelect = $('<li><select class="switch-mail" style="background:transparent;"><option value="modmailswitch">switch mod mail</option></select></li>');

    TBUtils.getModSubs(function () {
        populateSwitch();
    });

    function populateSwitch() {
        $('.mmp-menu').append($(switchSelect).prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));

        $(TBUtils.mySubs).each(function () {
            $('.switch-mail')
                .append($('<option>', {
                    value: this
                })
                    .text('/r/' + this));
        });
        $('.switch-mail').change(function () {
            var sub = $(this).val();
            if (sub !== 'modmailswitch') {
                window.open('/r/' + sub + '/message/moderator/inbox');
                $(switchSelect).val('modmailswtich');
            }
        });
    }
};

TB.register_module(modMailPro);
} // modmailpro() wrapper

(function () {
    window.addEventListener("TBObjectLoaded", function () {
        modmailpro();
    });
})();
