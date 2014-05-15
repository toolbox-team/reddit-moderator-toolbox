// ==UserScript==
// @name        Mod Mail Pro
// @namespace   http://www.reddit.com/r/toolbox
// @author      agentlame, creesch, DEADB33F, gavin19
// @description Filter subs from mod mail.
// @match       *://*.reddit.com/message/moderator/*
// @match       *://*.reddit.com/r/*/message/moderator/*
// @include     *://*.reddit.com/message/moderator/*
// @include     *://*.reddit.com/r/*/message/moderator/*
// @downloadURL http://userscripts.org/scripts/source/167234.user.js
// @version     3.2
// ==/UserScript==

(function modmailpro() {
    if (!TBUtils.isModmail || !TBUtils.logged || !TBUtils.getSetting('ModMailPro', 'enabled', true)) return;
    $.log('Loading MMP Module');

    var ALL = 0, PRIORITY = 1, FILTERED = 2, REPLIED = 3, UNREAD = 4; //make a JSON object.

    var INVITE = "moderator invited",
        ADDED = "moderator added",
        inbox = TBUtils.getSetting('ModMailPro', 'inboxstyle', PRIORITY),
        now = new Date().getTime(),
        buffer = 5 * 60000, // 5mins
        lastVisited = TBUtils.getSetting('ModMailPro', 'lastvisited', now),
        visitedBuffer = TBUtils.getSetting('ModMailPro', 'visitedbuffer', -1), // I think this may be broken.
        newCount = 0,
        collapsed = TBUtils.getSetting('ModMailPro', 'defaultcollapse', false), 
        expandReplies = TBUtils.getSetting('ModMailPro', 'expandreplies', false),
        noRedModmail = TBUtils.getSetting('ModMailPro', 'noredmodmail', true),
        hideInviteSpam = TBUtils.getSetting('ModMailPro', 'hideinvitespam', false),
        highlightNew = TBUtils.getSetting('ModMailPro', 'highlightnew', true),
        unreadPage = location.pathname.match(/\/moderator\/(?:unread)\/?/), //TBUtils.isUnreadPage doesn't wok for this.  Needs or for moderator/messages.
        moreCommentThreads = [],
        unreadThreads = [],
        //newLoadedMessages = 0, //Because flowwit is a doesn't respect your reddit prefs. (TODO: make use of flowwit's callback.)
        unprocessedThreads = $('.message-parent:not(.mmp-processed)');

    var separator = '<span class="separator">|</span>',
        spacer = '<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>',
        allLink = $('<li><a class="alllink" href="javascript:;" view="' + ALL + '">all</a></li>'),
        priorityLink = $('<li><a class="prioritylink" href="javascript:;" view="' + PRIORITY + '">priority</a></li>'),
        filteredLink = $('<li><a class="filteredlink" href="javascript:;" view="' + FILTERED + '">filtered</a></li>'),
        repliedLink = $('<li><a class="repliedlink" href="javascript:;" view="' + REPLIED + '">replied</a></li>'),
        unreadLink = $('<li><a class="unreadlink" href="javascript:;" view="' + UNREAD + '">unread</a></li>'),
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
    menuList.append($(collapseLink).prepend(spacer));

    mmpMenu.append($(unreadCount).prepend(spacer));

    menuList.after(mmpMenu);

    $('body').delegate('.save', 'click', function (e) {
        var parent = $(e.target).closest('.message-parent'),
            id = $(parent).attr('data-fullname'),
            replied = getRepliedThreads();

        // Add sub to filtered subs.
        if ($.inArray(id, replied) === -1) {
            replied.push(id);
        }

        TBUtils.setSetting('ModMailPro', 'replied', replied);

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
        }

        // Hide invite spam.
        if (hideInviteSpam && inbox != UNREAD) {
            $('.invitespam').each(function () {
                if ($(this).hasClass('new')) { 
                $(this).find('.entry').click();
                }
            
                $(this).hide();
            });
        }
    }

    $('body').delegate('.prioritylink, .alllink, .filteredlink, .repliedlink, .unreadlink', 'click', function (e) {
        // Just unselect all, then select the caller.
        $(menuList).find('li').removeClass('selected');

        inbox = $(e.target).attr('view');

        setView();
    });

    $('body').delegate('.collapse-all-link', 'click', function () {
        if (collapsed) {
            expandall();
        } else {
            collapseall();
        }
    });

    $('body').delegate('.collapse-link', 'click', function () {
        var parent = $(this).closest('.message-parent');
        if ($(this).text() === '[-]') {
            parent.find('.entry').hide();
            parent.find('.expand-btn').hide();
            $(this).text('[+]');
        } else {
            parent.find('.entry').show();
            parent.find('.expand-btn').show();
            $(this).text('[-]');

            //Show all comments
            if (expandReplies) {
                parent.find('.expand-btn:first')[0].click();
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
                TBUtils.setSetting('ModMailPro', 'lastvisited', now);
                TBUtils.setSetting('ModMailPro', 'visitedbuffer', now + buffer);
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
                menuList.html('<a href="http://www.reddit.com/message/moderator/">go to full mod mail</a>');
                $('.unread-count').html('<b>' + newCount + '</b> - new mod mail thread' + (newCount == 1 ? '' : 's'));
                $(entries).click();
            }

            // Set views.
            setFilterLinks(unprocessedThreads);
            setReplied(unprocessedThreads);
            setView();
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
            newThread = $thread.hasClass('realtime-new');

        $('<span class="info-area correspondent"></span>').insertAfter($thread.find('.correspondent:first'));

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

            // Only hide invite spam with no replies.    
        } else if (hideInviteSpam) {
            var title = $thread.find('.message-title').text().trim();
            if (title === INVITE || title === ADDED) {
                $thread.addClass('invitespam');
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
                        $(entry).find('.expand:first').click();
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
            var id = $(this).attr('data-fullname');

            if ($.inArray(id, getRepliedThreads()) !== -1) {
                $(this).find('.replied-tag').text('R');
                $(this).removeClass('invitespam'); //it's not spam if we replied.
            }
        });
    }

    $('body').delegate('.filter-sub-link', 'click', function (e) {
        var subname = getSubname($(e.target).closest('.message-parent'));
        var filtersubs = getFilteredSubs();

        // Add sub to filtered subs.
        if ($.inArray(subname, filtersubs) === -1) {
            filtersubs.push(subname);
        } else {
            filtersubs.splice(filtersubs.indexOf(subname), 1);
        }

        // Save new filter list.
        TBUtils.setSetting('ModMailPro', 'filteredsubs', filtersubs);

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
        return TBUtils.getSetting('ModMailPro', 'filteredsubs', []);
    }

    function getRepliedThreads() {
        return TBUtils.getSetting('ModMailPro', 'replied', []);
    }

    function showThreads(items, byID) {
        $('.message-parent').each(function () {
            $(this).hide();

            if (!byID) {
                var subname = getSubname(this);

                if ($.inArray(subname, items) !== -1) {
                    $(this).show();
                }

            } else {
                var id = $(this).attr('data-fullname');

                if ($.inArray(id, items) !== -1) {
                    $(this).show();
                }
            }
        });
    }

    function hideThreads(subs) {
        $('.message-parent').each(function () {
            var subname = getSubname(this);

            $(this).show();

            if ($.inArray(subname, subs) !== -1) {
                $(this).hide();
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
        });

        $(link).text('collapse all');
        $('.collapse-link').text('[-]');
    }
})();

(function realtimemail() {
    if (!TBUtils.isModmail || !TBUtils.logged || !TBUtils.getSetting('ModMailPro', 'enabled', true)) return;

    // Don't run if the page we're viewing is paginated, or if we're in the unread page.
    if (location.search.match(/before|after/) || location.pathname.match(/\/moderator\/(?:unread)\/?/)) return;

    var delay = 30000, // Default .5 min delay between requests.
        refreshLimit = 15, // Default five items per request.
        refreshLink = $('<li><a class="refresh-link" href="javascript:;" title="NOTE: this will only show new threads, not replies.">refresh</a></li>'),
        updateURL = 'http://www.reddit.com/message/moderator?limit=',
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
    if (TBUtils.getSetting('ModMailPro', 'autoload', false)) {
        setInterval(function () {
            var count = TBUtils.getSetting('Notifier', 'modmailcount', 0);
            if (count > 0) {
                $(refreshLink).css(selectedCSS);
                getNewThings(count);
            }
        }, delay);
    }

    // Add new things
    function getNewThings(limit) {
        TBUtils.setSetting('Notifier', 'lastseenmodmail', new Date().getTime());
        TBUtils.setSetting('Notifier', 'modmailcount', 0);

        $.log('real time a gogo: ' + limit);
        TBUtils.addToSiteTaable(updateURL + String(limit), function (resp) {
            if (!resp) return;
            var $things = $(resp).find('.message-parent').addClass('realtime-new').hide();
            var $siteTable = $('#siteTable');

            $siteTable.prepend($things);
            $(refreshLink).css(unselectedCSS);
        });
    }
})();

(function compose() {
    if (!TBUtils.isModmail || !TBUtils.logged || !TBUtils.getSetting('ModMailPro', 'enabled', true)) return;
    var COMPOSE = "compose-message",
        //mySubs = [],
        composeSelect = $('<li><select class="compose-mail" style="background:transparent;"><option value=' + COMPOSE + '>compose mod mail</option></select></li>'),
        composeURL = 'http://www.reddit.com/message/compose?to=%2Fr%2F';

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
            var sub = $(this).val();
            if (sub !== COMPOSE) {
                window.open(composeURL + $(this).val());
                $(composeSelect).val(COMPOSE);
            }
        });
    }
})();



(function modmailSwitch() {
    if (!TBUtils.isModmail || !TBUtils.logged || !TBUtils.getSetting('ModMailPro', 'enabled', true)) return;

        switchSelect = $('<li><select class="switch-mail" style="background:transparent;"><option value="modmailswitch">switch mod mail</option></select></li>'),
        

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
                window.open('http://www.reddit.com/r/' + $(this).val() + '/message/moderator/inbox');
                $(switchSelect).val('modmailswtich');
            }
        });
    }
})();

(function settings() {
    if (!TBUtils.isModmail || !TBUtils.logged || !TBUtils.getSetting('ModMailPro', 'enabled', true)) return;
    var ALL = 0, PRIORITY = 1, FILTERED = 2, REPLIED = 3, UNREAD = 4; //make a JSON object.

    var VERSION = '3.2',
        filteredsubs = TBUtils.getSetting('ModMailPro', 'filteredsubs', []),
        showing = false,
        inbox = TBUtils.getSetting('ModMailPro', 'inboxstyle', PRIORITY),
        firstrun = TBUtils.getSetting('ModMailPro', 'firstrun', true),
        menulist = $('.menuarea ul.flat-list:first');

    // Create setting elements 
    var settingsDiv = $('<div class="mmp-settings">'),
        separator = '<span style="color:gray"> | </span>',
        settingsToggle = $('<li><a style="color:gray" href="javascript:;" class="settings-link">' + String.fromCharCode(9660) + '</a><label class="first-run" style="display: none;">\
                           &#060;-- Click for settings &nbsp;&nbsp;&nbsp;</label><span>  </span></li>'),
        about = $('<span class="mmp-info" style="float:right; display:none"><b><a href="https://github.com/agentlame/modmailpro">Mod Mail Pro</a> v' + VERSION + '</b></span>'),
        info = $('<span  style="float:right;">all changes require reload</span>');

    var autocollapse = $('<a class="autocollapse" href="javascript:;">auto collapse</a>'),
        redmodmail = $('<a class="redmodmail" href="javascript:;">no red mod mail</a>'),
        highlight = $('<a class="highlight" href="javascript:;">highlight new</a>'),
        autoexpand = $('<a class="autoexpand" href="javascript:;">auto expand replies</a>'),
        hideinvitespam = $('<a class="hideinvitespam" href="javascript:;" title="WARNING: slows loading">hide invite spam</a>'),
        autoload = $('<a class="autoload" href="javascript:;" title="Automatically load new mod mail">autoload mail</a>');

    var resetfilter = $('<label class="filter-count" style="font-weight:bold"></label><span> - subreddits filtered\
                       (</span><a href="javascript:;" class="reset-filter-link" title="WARNING: will reload page.">reset</a><span>)</span>');

    var inboxstyle = $('<label>inbox: </label><select class="inboxstyle" style="background:transparent;">\
                        <option value=' + ALL + '>all</option><option value=' + PRIORITY + '>priority</option>\
                        <option value=' + FILTERED + '>filtered</option><option value=' + REPLIED + '>replied</option>\
                        <option value=' + UNREAD + '>unread</option></select>');

    var selectedCSS = {
        "color": "orangered",
        "font-weight": "bold"
    };
    var unselectedCSS = {
        "color": "#369",
        "font-weight": "normal"
    };

    $(settingsDiv).css({
        'display': 'none',
        'height': '20px',
        'padding-bottom': '5px',
        'padding-left': '25px',
        'padding-right': '10px',
        'padding-top': '0px',
        'border-bottom': '1px dotted gray',
        'margin': '5px',
        'overflow': 'hidden',
        'font-size': 'larger',
        'width': 'auto'
    });

    // Get settings/Set UI.
    $(inboxstyle).val(inbox);

    if (TBUtils.getSetting('ModMailPro', 'defaultcollapse', false)) {
        $(autocollapse).addClass('true');
        $(autocollapse).css(selectedCSS);
    }

    if (TBUtils.getSetting('ModMailPro', 'noredmodmail', true)) {
        $(redmodmail).addClass('true');
        $(redmodmail).css(selectedCSS);
    }

    if (TBUtils.getSetting('ModMailPro', 'highlightnew', true)) {
        $(highlight).addClass('true');
        $(highlight).css(selectedCSS);
    }

    if (TBUtils.getSetting('ModMailPro', 'expandreplies', false)) {
        $(autoexpand).addClass('true');
        $(autoexpand).css(selectedCSS);
    }

    if (TBUtils.getSetting('ModMailPro', 'hideinvitespam', false)) {
        $(hideinvitespam).addClass('true');
        $(hideinvitespam).css(selectedCSS);
    }

    if (TBUtils.getSetting('ModMailPro', 'autoload', false)) {
        $(autoload).addClass('true');
        $(autoload).css(selectedCSS);
    }

    // add settings button
    $(settingsToggle).prependTo(menulist);

    // Add settings items
    $(settingsDiv).insertAfter('.menuarea');

    settingsDiv.append(inboxstyle);
    settingsDiv.append($(autocollapse).prepend(separator));
    settingsDiv.append($(redmodmail).prepend(separator));
    settingsDiv.append($(highlight).prepend(separator));
    settingsDiv.append($(autoexpand).prepend(separator));
    settingsDiv.append($(hideinvitespam).prepend(separator));
    settingsDiv.append($(autoload).prepend(separator));

    $('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>').appendTo(settingsDiv);
    $(resetfilter).appendTo(settingsDiv);
    $(info).appendTo(settingsDiv);
    $(about).appendTo('.mmp-menu');

    // Get filtered subs.
    if (filteredsubs) {
        $('.filter-count').attr('title', filteredsubs.join(', '));
    }

    if (firstrun) {
        $('.first-run').show().css('color', 'red');
        $('.settings-link').css('color', 'red');
    }

    // Set filtered sub count.
    $('.filter-count').text(filteredsubs.length);

    $('body').delegate('.settings-link', 'click', function (e) {
        if (firstrun) {
            $('.first-run').hide();
            $('.settings-link').css('color', '');
            TBUtils.setSetting('ModMailPro', 'firstrun', false);
        }

        if (!showing) {
            $('.mmp-settings').show();
            $('.mmp-info').show();
            showing = true;

            $('.menuarea').css({
                'border-bottom': 'none',
                'padding-bottom': '0px'
            });
        } else {
            $('.mmp-settings').hide();
            $('.mmp-info').hide();
            showing = false;

            $('.menuarea').css({
                'border-bottom': '1px dotted gray',
                'padding-bottom': '5px'
            });
        }
    });

    // Reset filter, reload page.
    $('body').delegate('.reset-filter-link', 'click', function (e) {
        TBUtils.setSetting('ModMailPro', 'filteredsubs', []);
        window.location.reload();
    });

    // Save default inbox.
    $(inboxstyle).change(function () {
        TBUtils.setSetting('ModMailPro', 'inboxstyle', $(this).val());
    });

    // Settings have been changed.
    $('body').delegate('.autocollapse, .redmodmail, .highlight, .autoexpand, .hideinvitespam, .autoload', 'click', function (e) {
        var sender = e.target;

        // Change link style.
        if (!$(sender).hasClass('true')) {
            $(sender).addClass('true');
            $(sender).css(selectedCSS);
        } else {
            $(sender).removeClass('true');
            $(sender).css(unselectedCSS);
        }

        // Save settings.
        TBUtils.setSetting('ModMailPro', 'defaultcollapse', $(autocollapse).hasClass('true'));
        TBUtils.setSetting('ModMailPro', 'noredmodmail', $(redmodmail).hasClass('true'));
        TBUtils.setSetting('ModMailPro', 'highlightnew', $(highlight).hasClass('true'));
        TBUtils.setSetting('ModMailPro', 'expandreplies', $(autoexpand).hasClass('true'));
        TBUtils.setSetting('ModMailPro', 'hideinvitespam', $(hideinvitespam).hasClass('true'));
        TBUtils.setSetting('ModMailPro', 'autoload', $(autoload).hasClass('true'));
    });
})();
