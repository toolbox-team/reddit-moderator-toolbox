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
// @version     3.1
// ==/UserScript==

function modmailpro() {
    if (!TBUtils.isModmail || !reddit.logged || !TBUtils.setting('ModMailPro', 'enabled', true)) return; 
    var ALL = 0, PRIORITY = 1, FILTERED = 2, REPLIED = 3, UNREAD = 4; //make a JSON object.

    var INVITE = "moderator invited",
        ADDED = "moderator added",
        inbox = localStorage["Toolbox.ModMailPro.inboxstyle"] || PRIORITY,
        now = new Date().getTime(),
        buffer = 5 * 60000, // 5mins
        lastVisited = JSON.parse(localStorage['Toolbox.ModMailPro.lastvisited'] || now),
        visitedBuffer = JSON.parse(localStorage['Toolbox.ModMailPro.visitedbuffer'] || -1),
        newCount = 0,
        collapsed = JSON.parse(localStorage["Toolbox.ModMailPro.defaultcollapse"] || "false"), //wrapped?,
        expandreplies = JSON.parse(localStorage["Toolbox.ModMailPro.expandreplies"] || "false"),
        noredmodmail = JSON.parse(localStorage["Toolbox.ModMailPro.noredmodmail"] || "true"),
        hideinvitespam = JSON.parse(localStorage["Toolbox.ModMailPro.hideinvitespam"] || "false"),
        highlightnew = JSON.parse(localStorage["Toolbox.ModMailPro.highlightnew"] || "true");

    var moreCommentThreads = [],
        unreadThreads = [];

    //Because flowwit is a doesn't respect your reddit prefs.
    var newLoadedMessages = 0;

    var separator = '<span class="separator">|</span>',
        spacer = '<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>',
        alllink = $('<li><a class="alllink" href="javascript:;" view="' + ALL + '">all</a></li>'),
        prioritylink = $('<li><a class="prioritylink" href="javascript:;" view="' + PRIORITY + '">priority</a></li>'),
        filteredlink = $('<li><a class="filteredlink" href="javascript:;" view="' + FILTERED + '">filtered</a></li>'),
        repliedlink = $('<li><a class="repliedlink" href="javascript:;" view="' + REPLIED + '">replied</a></li>'),
        unreadlink = $('<li><a class="unreadlink" href="javascript:;" view="' + UNREAD + '">unread</a></li>'),
        collapselink = $('<li><a class="collapse-all-link" href="javascript:;">collapse all</a></li>'),
        unreadcount = $('<li><span class="unread-count"><b>0</b> - new messages</span></li>'),
        mmpMenu = $('<ul class="flat-list hover mmp-menu"></ul>');

    var selectedCSS = {
        "color": "orangered",
        "font-weight": "bold"
    };
    var unselectedCSS = {
        "color": "#369",
        "font-weight": "normal"
    };

    // Find and clear menu list.
    var menulist = $('.menuarea ul.flat-list').html('');

    // Add menu items.
    menulist.append(alllink);
    menulist.append($(prioritylink).prepend(separator));
    menulist.append($(filteredlink).prepend(separator));
    menulist.append($(repliedlink).prepend(separator));
    menulist.append($(unreadlink).prepend(separator));
    menulist.append($(collapselink).prepend(spacer));

    mmpMenu.append($(unreadcount).prepend(spacer));

    menulist.after(mmpMenu);

    $('body').delegate('.save', 'click', function (e) {
        var parent = $(e.target).closest('.message-parent');
        var id = $(parent).attr('data-fullname');

        var replied = getRepliedThreads();

        // Add sub to filtered subs.
        if ($.inArray(id, replied) === -1) {
            replied.push(id);
        }

        localStorage['Toolbox.ModMailPro.replied'] = JSON.stringify(replied);

        setReplied();
    });

    function setView() {
        var a = []; //hacky-hack for 'all' view.

        // Neither a switch nor === will work correctly.
        if (inbox == ALL) {
            $(alllink).closest('li').addClass('selected');
            hideThreads(a); // basically hideThreads(none);
            return;

        } else if (inbox == PRIORITY) {
            $(prioritylink).closest('li').addClass('selected');
            hideThreads(getFilteredSubs());

        } else if (inbox == FILTERED) {
            $(filteredlink).closest('li').addClass('selected');
            showThreads(getFilteredSubs());

        } else if (inbox == REPLIED) {
            $(repliedlink).closest('li').addClass('selected');
            showThreads(getRepliedThreads(), true);

        } else if (inbox == UNREAD) {
            $(unreadlink).closest('li').addClass('selected');
            showThreads(unreadThreads, true);
        }

        // Hide invite spam.
        if (hideinvitespam && inbox != UNREAD) {
            $('.invitespam').each(function () {
                $(this).hide();
            });
        }
    }

    $('body').delegate('.prioritylink, .alllink, .filteredlink, .repliedlink, .unreadlink', 'click', function (e) {
        // Just unselect all, then select the caller.
        $(menulist).find('li').removeClass('selected');

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
            if (expandreplies) {
                parent.find('.expand-btn:first').click();
            }
        }
    });

    initialize();

    // RES NER support.
    $('div.content').on('DOMNodeInserted', function (e) {
        var sender = e.target;
        var name = sender.className;

        if (name !== 'NERPageMarker' && !$(sender).hasClass('message-parent') && !$(sender).hasClass('realtime-new')) {
            return; //not RES, not flowwit, not load more comments, not realtime.
        }

        if ($(sender).hasClass('realtime-new')) { //new thread
            var attrib = $(sender).attr('data-fullname');
            if (attrib) {
                setTimeout(function () {
                    console.log('realtime go');
                    processThread($('[data-fullname="' + attrib + '"]'));
                }, 500);
            }
            return;
        } else if ($.inArray($(sender).attr('data-fullname'), moreCommentThreads) !== -1) { //check for 'load mor comments'
            setTimeout(function () {
                console.log('LMC go');
                processThread(sender);
            }, 500);
            return;

        } else if ($(sender).hasClass('message-parent')) { //likely flowitt
            newLoadedMessages++;

            // flowwit is hard-coded to load 25 entries at a time, so we need to count them.
            if (newLoadedMessages === 25) {
                newLoadedMessages = 0;
                setTimeout(function () {
                    console.log('flowitt go');
                    initialize();
                }, 500);
            }
            return;

        } else if (name === 'NERPageMarker') { //is res.
            setTimeout(function () {
                console.log('RES NER go');
                initialize();
            }, 500);
            return;
        }
    });

    function initialize() {
        console.log('MMP init');

        var threads = $('.message-parent');

        // Add filter link to each title, if it doesn't already have one.
        TBUtils.forEachChunked(threads, 35, 250, function (thread) {
            processThread(thread);
        }, function complete() {

            // Update time stamps, but only if it has been more than five minutes since the last update.
            //console.log(now > visitedBuffer);
            if (now > visitedBuffer) {
                localStorage['Toolbox.ModMailPro.lastvisited'] = now;
                localStorage['Toolbox.ModMailPro.visitedbuffer'] = now + buffer;
            }

            // If set collapse all threads on load.
            if (collapsed) {
                collapseall();
            }

            // Set views.
            setFilterLinks();
            setReplied();
            setView();
        });
    }

    function processThread(thread) {
        if ($(thread).hasClass('mmp-processed')) {
            return;
        }

        // Set-up MMP info area.
        $(thread).addClass('mmp-processed');

        var threadID = $(thread).attr('data-fullname'),
            entries = $(thread).find('.entry'),
            count = (entries.length - 1),
            subreddit = getSubname(thread),
            newThread = $(thread).hasClass('realtime-new');

        $('<span class="info-area correspondent"></span>').insertAfter($(thread).find('.correspondent:first'));

        // Only one feature needs thread, so disable it because it's costly.
        if (hideinvitespam) {
            $(thread).find('.subject:first').contents().filter(function () {
                return this.nodeType === 3;
            }).wrap('<span class="message-title">');
        }

        var infoArea = $(thread).find('.info-area');
        var spacer = '<span> </span>';

        $('</span><a style="color:orangered" href="javascript:;" class="filter-sub-link" title="Filter/unfilter thread subreddit."></a> <span>').appendTo(infoArea);

        if (count > 0) {
            if ($(thread).hasClass('moremessages')) {
                count = count + '+';
                moreCommentThreads.push(threadID);
            }
            $('<span class="message-count">' + count + ' </span>' + spacer).appendTo(infoArea);

            // Only hide invite spam with no replies.    
        } else if (hideinvitespam) {
            var title = $(thread).find('.message-title').text().trim();
            if (title === INVITE || title === ADDED) {
                $(thread).addClass('invitespam');
            }
        }

        $('<span class="replied-tag"></span>' + spacer).appendTo(infoArea);

        $(thread).find('.correspondent.reddit.rounded a').parent().prepend(
            '<a href="javascript:;" class="collapse-link">[-]</a> ');

        if (noredmodmail) {
            if ($(thread).hasClass('spam')) {
                $(thread).css('background-color', 'transparent');
                $(thread).find('.subject').css('color', 'red');
            }
        }

        // Don't parse all entries if we don't need to.
        if (noredmodmail || highlightnew) {
            TBUtils.forEachChunked(entries, 25, 250, function (entry) {
                if (noredmodmail) {
                    var message = $(entry).parent();

                    if (message.hasClass('spam')) {
                        $(message).css('background-color', 'transparent');
                        $(message).find('.entry:first .head').css('color', 'red');
                    }
                }

                if (highlightnew && !newThread) {
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
            $(thread).removeClass('realtime-new');
            $(thread).find('.correspondent:first').css('background-color', 'yellow');
            setView();
            setFilterLinks();

            if (collapsed) {
                $(thread).find('.entry').hide();
                $(thread).find('.expand-btn').hide();
                $(thread).find('.collapse-link').text('[+]');
            }
        }
    }

    function setFilterLinks() {

        // I think I could do this by just locating .filter-sub-link.
        $('.message-parent').each(function () {
            var subname = getSubname(this);
            var linktext = 'F';

            if ($.inArray(subname, getFilteredSubs()) !== -1) {
                linktext = 'U';
            }

            $(this).find('.filter-sub-link').text(linktext);
        });
    }

    function setReplied() {
        $('.message-parent').each(function () {
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
        localStorage['Toolbox.ModMailPro.filteredsubs'] = JSON.stringify(filtersubs);

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
        var retval = [];
        if (localStorage['Toolbox.ModMailPro.filteredsubs']) {
            retval = JSON.parse(localStorage['Toolbox.ModMailPro.filteredsubs']);
        }
        return retval;
    }

    function getRepliedThreads() {
        var retval = [];
        if (localStorage['Toolbox.ModMailPro.replied']) {
            retval = JSON.parse(localStorage['Toolbox.ModMailPro.replied']);
        }
        return retval;
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

    function collapseall() {
        collapsed = true;
        var link = ('.collapse-all-link');

        // make look selected.
        $(link).css(selectedCSS);

        // Hide threads.
        var threads = $('.message-parent');

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

            if (expandreplies) {
                $(thread).find('.expand-btn:first').click();
            }
        });

        $(link).text('collapse all');
        $('.collapse-link').text('[-]');
    }
}

function realtimemail() {
    if (!TBUtils.isModmail || !reddit.logged || !TBUtils.setting('ModMailPro', 'enabled', true)) return;  
    // Don't run if the page we're viewing is paginated.
    if (location.search.match(/before|after/)) return;

    var realtime = localStorage.getItem('realtime'),
        delay = 1 * 60000, // Default 1 min delay between requests.
        refreshLimit = 10, // Default ten items per request.
        sitetable = $('#siteTable').css('top', 0),
        sitePos = sitetable.css('position'),
        refreshLink = $('<li><a class="refresh-link" href="javascript:;" title="NOTE: this will only show new threads, not replies.">refresh</a></li>'),
        updateURL = 'http://www.reddit.com/message/moderator.json-html',
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
        getNewThings(false);
    });
    menulist.append($(refreshLink).prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));

    // Run RTMM.
    if (JSON.parse(localStorage["Toolbox.ModMailPro.realtime"] || "false")) {
        setInterval(function () {
            getNewThings(true);
        }, delay);
    }

    // Add new things

    function getNewThings(auto) {
        var url = updateURL,
            html = [];

        $(refreshLink).css(selectedCSS);

        // If it's just an auto update, it's unlikely we'd get 100 new threads in three minutes.
        if (auto) {
            url = updateURL + '?limit=' + refreshLimit;
        }

        // Seems rather unlikely you'd get more than
        $.get(url).success(function (response) {
            console.log('checking for new mod mail: ' + url);

            // Get list of thing ids of elements already on the page
            var ids = [];

            $('#siteTable div.thing').each(function () {
                ids.push(this.getAttribute('data-fullname'));
            });

            // Get any things whos ids aren't already listed and compress their HTML
            for (i in response.data) {
                try {
                    if (ids.indexOf(response.data[i].data.id) == -1) {
                        html.push(TBUtils.compressHTML(response.data[i].data.content));
                    }
                }
                // We don't need this catch, we just don't want the script to bomb on null ids.
                catch (err) {}
            }
            $(refreshLink).css(unselectedCSS);
            if (!html.length) return;

            //Prepend to siteTable
            insertHTML(html);
        });
    }

    // Insert new things into sitetable.
    function insertHTML(html) {
        var height = sitetable.css('top').slice(0, -2),
            things = $(html.join(''))
                .each(function () {
                    $(this).addClass('realtime-new');
                });

        things.prependTo(sitetable)
            .each(function () {
                height -= this.offsetHeight;
            });

        // Scroll new items into view.
        sitetable.stop().css('top', height).animate({
            top: 0
        }, 5000);

        things.css({
            opacity: 0.2
        }).animate({
            opacity: 1
        }, 2000, 'linear');

        // Trim items
        $('#siteTable>div.thing:gt(99),#siteTable>.clearleft:gt(99),#siteTable tr.modactions:gt(200)').remove();

        // Run flowwit callbacks on new things.
        if (window.flowwit)
            for (i in window.flowwit) window.flowwit[i](things.filter('.thing'));
    }
}

function compose() {
    if (!TBUtils.isModmail || !reddit.logged || !TBUtils.setting('ModMailPro', 'enabled', true)) return; 
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
}

function settings() {
    if (!TBUtils.isModmail || !reddit.logged || !TBUtils.setting('ModMailPro', 'enabled', true)) return; 
    var ALL = 0, PRIORITY = 1, FILTERED = 2, REPLIED = 3, UNREAD = 4; //make a JSON object.

    var VERSION = '3.1',
        filteredsubs = [],
        showing = false,
        inbox = localStorage["Toolbox.ModMailPro.inboxstyle"] || PRIORITY,
        firstrun = JSON.parse(localStorage["Toolbox.ModMailPro.firstrun"] || true),
        menulist = $('.menuarea ul.flat-list:first');

    // Create setting elements 
    var settingsDiv = $('<div class="mmp-settings">'),
        separator = '<span style="color:gray"> | </span>',
        settingsToggle = $('<li><a style="color:gray" href="javascript:;" class="settings-link">?</a><label class="first-run" style="display: none;">\
                           &#060;-- Click for settings &nbsp;&nbsp;&nbsp;</label><span>  </span></li>'),
        about = $('<span class="mmp-info" style="float:right; display:none"><b><a href="https://github.com/agentlame/modmailpro">Mod Mail Pro</a> v' + VERSION + '</b></span>'),
        info = $('<span  style="float:right;">all changes require reload</span>');

    var autocollapse = $('<a class="autocollapse" href="javascript:;">auto collapse</a>'),
        redmodmail = $('<a class="redmodmail" href="javascript:;">no red mod mail</a>'),
        highlight = $('<a class="highlight" href="javascript:;">highlight new</a>'),
        autoexpand = $('<a class="autoexpand" href="javascript:;">auto expand replies</a>'),
        hideinvitespam = $('<a class="hideinvitespam" href="javascript:;" title="WARNING: slows loading">hide invite spam</a>'),
        realtime = $('<a class="realtime" href="javascript:;" title="Loads new threads every two minutes.  Not replies, only threads.">realtime mail</a>');

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

    if (JSON.parse(localStorage["Toolbox.ModMailPro.defaultcollapse"] || "false")) {
        $(autocollapse).addClass('true');
        $(autocollapse).css(selectedCSS);
    }

    if (JSON.parse(localStorage["Toolbox.ModMailPro.noredmodmail"] || "true")) {
        $(redmodmail).addClass('true');
        $(redmodmail).css(selectedCSS);
    }

    if (JSON.parse(localStorage["Toolbox.ModMailPro.highlightnew"] || "true")) {
        $(highlight).addClass('true');
        $(highlight).css(selectedCSS);
    }

    if (JSON.parse(localStorage["Toolbox.ModMailPro.expandreplies"] || "false")) {
        $(autoexpand).addClass('true');
        $(autoexpand).css(selectedCSS);
    }

    if (JSON.parse(localStorage["Toolbox.ModMailPro.hideinvitespam"] || "false")) {
        $(hideinvitespam).addClass('true');
        $(hideinvitespam).css(selectedCSS);
    }

    if (JSON.parse(localStorage["Toolbox.ModMailPro.realtime"] || "false")) {
        $(realtime).addClass('true');
        $(realtime).css(selectedCSS);
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
    settingsDiv.append($(realtime).prepend(separator));

    $('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>').appendTo(settingsDiv);
    $(resetfilter).appendTo(settingsDiv);
    $(info).appendTo(settingsDiv);
    $(about).appendTo('.mmp-menu');

    // Get filtered subs.
    if (localStorage['Toolbox.ModMailPro.filteredsubs']) {
        filteredsubs = JSON.parse(localStorage['Toolbox.ModMailPro.filteredsubs']);
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
            localStorage["Toolbox.ModMailPro.firstrun"] = JSON.stringify(false);
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
        localStorage.removeItem('Toolbox.ModMailPro.filteredsubs');
        window.location.reload();
    });

    // Save default inbox.
    $(inboxstyle).change(function () {
        localStorage['Toolbox.ModMailPro.inboxstyle'] = $(this).val();
    });

    // Settings have been changed.
    $('body').delegate('.autocollapse, .redmodmail, .highlight, .autoexpand, .hideinvitespam, .realtime', 'click', function (e) {
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
        localStorage['Toolbox.ModMailPro.defaultcollapse'] = JSON.stringify($(autocollapse).hasClass('true'));
        localStorage['Toolbox.ModMailPro.noredmodmail'] = JSON.stringify($(redmodmail).hasClass('true'));
        localStorage['Toolbox.ModMailPro.highlightnew'] = JSON.stringify($(highlight).hasClass('true'));
        localStorage['Toolbox.ModMailPro.expandreplies'] = JSON.stringify($(autoexpand).hasClass('true'));
        localStorage['Toolbox.ModMailPro.hideinvitespam'] = JSON.stringify($(hideinvitespam).hasClass('true'));
        localStorage['Toolbox.ModMailPro.realtime'] = JSON.stringify($(realtime).hasClass('true'));
    });
}

// Add script to page
(function () {
    
    // Check if we are running as an extension
    if (typeof chrome !== "undefined" && chrome.extension) {
        init();
        return;
    } 
    
    // Check if TBUtils has been added.
    if (!window.TBUadded) {
        window.TBUadded = true;
        
        var utilsURL = 'http://agentlame.github.io/toolbox/tbutils.js';
        var cssURL = 'http://agentlame.github.io/toolbox/tb.css';
        $('head').prepend('<script type="text/javascript" src=' + utilsURL + '></script>');
        $('head').prepend('<link rel="stylesheet" type="text/css" href="'+ cssURL +'"></link>');
    }
    
    // Do not add script to page until TBUtils is added.
    (function loadLoop() {
        setTimeout(function () {
            if (typeof TBUtils !== "undefined") {
                init();
            } else {
                loadLoop();
            }
        }, 100);
    })();
    
    function init() {
        // Add mmp.
        addScriptToPage(modmailpro, 'modmailpro');
        
        // Add realtime mod mail.
        addScriptToPage(realtimemail, 'realtimemail');
        
        // Add compose mod mail.
        addScriptToPage(compose, 'compose');
        
        // Add settings area
        addScriptToPage(settings, 'settings');
        
        function addScriptToPage(script, name) {
            var s = document.createElement('script');
            s.textContent = "(" + script.toString() + ')();';
            document.head.appendChild(s);
        }
    }
})();