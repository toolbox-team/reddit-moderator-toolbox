function queuetools() {

var queueTools = new TB.Module('Queue Tools');

queueTools.settings["enabled"]["default"] = true;
queueTools.config["betamode"] = false;
queueTools.config["needs_mod_subs"] = true;

queueTools.register_setting(
    "hideactioneditems", {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Hide items after mod action"
    });
queueTools.register_setting(
    "ignoreonapprove", {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Ignore reports on approved items"
    });
queueTools.register_setting(
    "linktoqueues", {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Link to subreddit queue on mod pages"
    });
queueTools.register_setting(
    "sortmodqueue", {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Sort Modqueue in /r/mod sidebar according to queue count (warning: slows page loading drastically)"
    });
queueTools.register_setting(
    "sortunmoderated", {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Sort Unmoderated in /r/mod sidebar according to unmoderated count (warning: slows page loading drastically)"
    });
queueTools.register_setting('reports-order', {
    'type': 'selector',
    'values': ["age", "score", "reports"],
    'default': "age",
    'betamode': false,
    'hidden': false,
    'title': "Tag location"
});
queueTools.register_setting('reports-threshold', {
    'type': 'number',
    'min': 0,
    'max': null,
    'step': 1,
    'default': 1,
    'betamode': false,
    'hidden': false,
    'title': "Reports threshold"
});
queueTools.register_setting('reports-ascending', {
    'type': 'boolean',
    'default': false,
    'betamode': false,
    'hidden': false,
    'title': "Sort ascending."
});


queueTools.init = function () {
    var $body = $('body');

    // Cached data
    var notEnabled = [],
        hideActionedItems = queueTools.setting('hideactioneditems'),
        ignoreOnApprove = queueTools.setting('ignoreonapprove'),
        sortModQueue = queueTools.setting('sortmodqueue'),
        sortUnmoderated = queueTools.setting('sortunmoderated'),
        linkToQueues = queueTools.setting('linktoqueues');

    // var SPAM_REPORT_SUB = 'spam', QUEUE_URL = '';
    var QUEUE_URL = '';

    if (linkToQueues) {
        if (TBUtils.isModQueuePage) {
            QUEUE_URL = 'about/modqueue/';
        } else if (TBUtils.isUnmoderatedPage) {
            QUEUE_URL = 'about/unmoderated/';
        }
    }

    // Ideally, this should be moved somewhere else to be common with the removal reasons module
    // Retreival of log subreddit information could also be separated
    function getRemovalReasons(subreddit, callback) {
        $.log('getting config: ' + subreddit);
        var reasons = '';

        // See if we have the reasons in the cache.
        if (TBUtils.configCache[subreddit] !== undefined) {
            reasons = TBUtils.configCache[subreddit].removalReasons;

            // If we need to get them from another sub, recurse.
            if (reasons && reasons.getfrom) {
                getRemovalReasons(reasons.getfrom, callback); //this may not work.
                return;
            }
        }

        // If we have removal reasons, send them back.
        if (reasons) {
            $.log('returning: cache');
            callback(reasons);
            return;
        }

        // OK, they are not cached.  Try the wiki.
        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || !resp.removalReasons) {
                $.log('failed: wiki config');
                callback(false);
                return;
            }

            // We have a valid config, cache it.
            TBUtils.configCache[subreddit] = resp;
            reasons = resp.removalReasons;

            // Again, check if there is a fallback sub, and recurse.
            if (reasons && reasons.getfrom) {
                $.log('trying: get from, no cache');
                getRemovalReasons(reasons.getfrom, callback); //this may not work.
                return;
            }

            // Last try, or return false.
            if (reasons) {
                $.log('returning: no cache');
                callback(reasons);
                return;
            }

            $.log('falied: all');
            callback(false);
        });
    }

    // Add modtools buttons to page.
    function addModtools() {
        var numberRX = /-?\d+/,
            reportsThreshold = queueTools.setting('reports-threshold'),
            listingOrder = queueTools.setting('reports-order'),
            sortAscending = queueTools.setting('reports-ascending'),
            viewingspam = !!location.pathname.match(/\/about\/(spam|trials)/),
            viewingreports = !!location.pathname.match(/\/about\/reports/),
            allSelected = false;

        if (viewingspam && listingOrder == 'reports') {
            listingOrder = 'age';
        }

        // Get rid of promoted links & thing rankings
        $('#siteTable_promoted,#siteTable_organic,.rank').remove();

        // remove stuff we can't moderate (in non-mod queues only)
        function removeUnmoddable() {
            if (!TBUtils.isModpage) {
                TBUtils.getModSubs(function () {
                    $('.thing .subreddit').each(function () {
                        // Just to be safe.
                        var sub = $(this).text().replace('/r/', '').replace('/', '');
                        if ($.inArray(sub, TBUtils.mySubs) === -1) {
                            $(this).parents('.thing').remove();
                        }
                    });
                });
            }
        }

        removeUnmoddable();

        $('.modtools-on').parent().remove();

        // Make visible any collapsed things (stuff below /prefs/ threshold)
        $('.entry .collapsed:visible a.expand:contains("[+]")').click();

        // Add checkboxes, tabs, menu, etc
        $('#siteTable').before('\
        <div class="menuarea modtools" style="padding: 5px 0;margin: 5px 0;"> \
            <input style="margin:5px;float:left" title="Select all/none" type="checkbox" id="select-all" title="select all/none"/> \
            <span>\
                <a href="javascript:;" class="pretty-button invert inoffensive" accesskey="I" title="invert selection">&lt;/&gt;</a> \
                <a href="javascript:;" class="pretty-button open-expandos inoffensive" title="toggle all expando boxes">[+]</a> \
                <div onmouseover="hover_open_menu(this)" onclick="open_menu(this)" class="dropdown lightdrop "> \
                    <a href="javascript:;" class="pretty-button inoffensive select"> [select...]</a> \
                </div>\
                <div class="drop-choices lightdrop select-options"> \
                    ' + (viewingreports ? '' : '<a class="choice inoffensive" href="javascript:;" type="banned">shadow-banned</a>\
                    <a class="choice inoffensive" href="javascript:;" type="filtered">spam-filtered</a>\
                    ' + (viewingspam ? '' : '<a class="choice inoffensive" href="javascript:;" type="reported">has-reports</a>')) + '\
                    <a class="choice dashed" href="javascript:;" type="spammed">[ spammed ]</a> \
                    <a class="choice" href="javascript:;" type="removed">[ removed ]</a> \
                    <a class="choice" href="javascript:;" type="approved">[ approved ]</a>\
                    ' + (TBUtils.post_site && false ? '<a class="choice" href="javascript:;" type="flaired">[ flaired ]</a>' : '') + '\
                    <a class="choice" href="javascript:;" type="actioned">[ actioned ]</a>\
                    <a class="choice dashed" href="javascript:;" type="domain">domain...</a> \
                    <a class="choice" href="javascript:;" type="user">user...</a> \
                    <a class="choice" href="javascript:;" type="title">title...</a> \
                    <a class="choice dashed" href="javascript:;" type="comments">all comments</a> \
                    <a class="choice" href="javascript:;" type="links">all submissions</a> \
                    <a class="choice dashed" href="javascript:;" type="self">self posts</a> \
                    <a class="choice" href="javascript:;" type="flair">posts with flair</a> \
                </div>\
                &nbsp; \
                <a href="javascript:;" class="pretty-button inoffensive unhide-selected" accesskey="U">unhide&nbsp;all</a> \
                <a href="javascript:;" class="pretty-button inoffensive hide-selected"   accesskey="H">hide&nbsp;selected</a> \
                <a href="javascript:;" class="pretty-button action negative" accesskey="S" type="negative" tabindex="3">spam&nbsp;selected</a> \
                <a href="javascript:;" class="pretty-button action neutral"  accesskey="R" type="neutral"  tabindex="4">remove&nbsp;selected</a> \
                <a href="javascript:;" class="pretty-button action positive" accesskey="A" type="positive" tabindex="5">approve&nbsp;selected</a> \
                ' + (TBUtils.post_site && false ? '<a href="javascript:;" class="pretty-button flair-selected inoffensive" accesskey="F" tabindex="6">flair&nbsp;selected</a>' : '') + ' \
            </span> \
            <span class="dropdown-title lightdrop" style="float:right"> sort: \
                <div onmouseover="hover_open_menu(this)" onclick="open_menu(this)" class="dropdown lightdrop "> \
                    <span class="selected sortorder">' + listingOrder + '</span> \
                </div> \
                <div class="drop-choices lightdrop sortorder-options"> \
                        <a class="choice" href="javascript:;">age</a> \
                        ' + (viewingspam ? '' : '<a class="choice" href="javascript:;">reports</a>') + ' \
                        <a class="choice" href="javascript:;">score</a> \
                </div> \
            </span> \
        </div>');

        //Check if the tab menu exists and create it if it doesn't
        var tabmenu = $('#header-bottom-left .tabmenu');
        if (tabmenu.length == 0)
            tabmenu = $('#header-bottom-left').append('<ul class="tabmenu"></ul>');
        $('.tabmenu').append(viewingspam ? '' : '<li><a><label for="modtab-threshold">threshold: </label><input id="modtab-threshold" value="' + reportsThreshold + '" style="width:10px;height:14px;border:none;background-color:#EFF7FF"/></a></li>');

        $('.thing.link, .thing.comment').prepend('<input type="checkbox" tabindex="1" style="margin:5px;float:left;" />');
        $('.buttons .pretty-button').attr('tabindex', '2');

        //add class to processed threads.
        var $things = $('.thing');
        $things.addClass('mte-processed');

        // Add context & history stuff
        $body.append('<div class="pretty-button inline-content" style="z-index:9999;display:none;position:absolute;line-height:12px;min-width:100px"/>');
        $('#siteTable .comment .flat-list.buttons:has( a:contains("parent"))').each(function () {
            $(this).prepend('<li><a class="context" href="' + $(this).find('.first .bylink').attr('href') + '?context=2">context</a></li>');
        });

        //// Button actions ////
        // Select thing when clicked
        var noAction = ['A', 'INPUT', 'TEXTAREA', 'BUTTON'];
        $body.on('click', '.thing .entry', function (e) {
            if (noAction.indexOf(e.target.nodeName) + 1) return;
            $(this).parent('.thing').find('input[type=checkbox]:first').click();
        });

        // Change sort order
        $('.sortorder-options a').click(function () {
            var $sortOrder = $('.sortorder'),
                order = $(this).text(),
                toggleAsc = (order == $sortOrder.text());

            if (toggleAsc) sortAscending = !sortAscending;

            queueTools.setting('reports-ascending', sortAscending);
            queueTools.setting('reports-order', order);

            $sortOrder.text(order);
            sortThings(order, sortAscending);
        });

        // Invert all the things.
        $('.invert').click(function () {
            $('.thing:visible input[type=checkbox]').click();
        });

        // Select / deselect all the things
        $('#select-all').click(function () {
            $('.thing:visible input[type=checkbox]').prop('checked', allSelected = this.checked);
        });
        $body.on('click', '.thing input[type=checkbox]', function () {
            $('#select-all').prop('checked', allSelected = !$('.thing:visible input[type=checkbox]').not(':checked').length);
        });

        // Select/deselect certain things
        $('.select-options a').click(function () {
            var things = $('.thing:visible'),
                selector;

            switch (this.type) {
                case 'banned':
                    selector = '.banned-user';
                    break;
                case 'filtered':
                    selector = '.spam:not(.banned-user)';
                    break;
                case 'reported':
                    selector = ':has(.reported-stamp)';
                    break;
                case 'spammed':
                    selector = '.spammed,:has(.pretty-button.negative.pressed),:has(.remove-button:contains(spammed))';
                    break;
                case 'removed':
                    selector = '.removed,:has(.pretty-button.neutral.pressed),:has(.remove-button:contains(removed))';
                    break;
                case 'approved':
                    selector = '.approved,:has(.approval-checkmark,.pretty-button.positive.pressed),:has(.approve-button:contains(approved))';
                    break;
                case 'flaired':
                    selector = '.flaired';
                    break;
                case 'actioned':
                    selector = '.flaired,.approved,.removed,.spammed,:has(.approval-checkmark,.pretty-button.pressed),\
                                :has(.remove-button:contains(spammed)),:has(.remove-button:contains(removed)),:has(.approve-button:contains(approved))';
                    break;
                case 'domain':
                    selector = ':has(.domain:contains(' + prompt('domain contains:', '').toLowerCase() + '))';
                    break;
                case 'user':
                    selector = ':has(.author:contains(' + prompt('username contains:\n(case sensitive)', '') + '))';
                    break;
                case 'title':
                    selector = ':has(a.title:contains(' + prompt('title contains:\n(case sensitive)', '') + '))';
                    break;
                case 'comments':
                    selector = '.comment';
                    break;
                case 'links':
                    selector = '.link';
                    break;
                case 'self':
                    selector = '.self';
                    break;
                case 'flair':
                    selector = ':has(.linkflair)';
                    break;
            }
            things.filter(selector).find('input[type=checkbox]').prop('checked', true);
        });
        $('.hide-selected').click(function () {
            $('.thing:visible:has(input:checked)').hide();
            $('.thing input[type=checkbox]').prop('checked', false);
        });
        $('.unhide-selected').click(function () {
            $things.show();
        });

        // Mass spam/remove/approve
        $('.pretty-button.action').click(function () {
            var spam = (this.type == 'negative'),
                type = (this.type == 'positive' ? 'approve' : 'remove');

            // Apply action
            $('.thing:visible>input:checked').parent().each(function () {
                $.post('/api/' + type, {
                    uh: TBUtils.modhash,
                    spam: spam,
                    id: $(this).attr('data-fullname') //getThingInfo seems like overkill.
                });
            }).css('opacity', '1').removeClass('flaired spammed removed approved').addClass((spam ? 'spamme' : type) + 'd');
        });

        // menuarea pretty-button feedback.
        $('.menuarea.modtools .pretty-button').click(function () {
            $(this).clearQueue().addClass('pressed').delay(200).queue(function () {
                $(this).removeClass('pressed');
            });
        });

        var ignoreOnApproveset;
        // Uncheck anything we've taken an action, if it's checked.
        $body.on('click', '.pretty-button', function (e) {
            var thing = $(this).closest('.thing');
            $(thing).find('input[type=checkbox]').prop('checked', false);
            if (hideActionedItems) {
                $(thing).hide();
            } else if (ignoreOnApproveset) {
                ignoreOnApproveset = false;
            } else if ($(this).hasClass('negative')) {
                $(thing).removeClass('removed');
                $(thing).removeClass('approved');
                $(thing).addClass('spammed');
            } else if ($(this).hasClass('neutral')) {
                $(thing).removeClass('spammed');
                $(thing).removeClass('approved');
                $(thing).addClass('removed');
            } else if ($(this).hasClass('positive')) {
                $(thing).removeClass('removed');
                $(thing).removeClass('spammed');
                $(thing).addClass('approved');
            }
        });

        // Open reason dropdown when we remove something as ham.
        $body.on('click', '.big-mod-buttons > span > .pretty-button.positive', function () {
            if (!ignoreOnApprove) return;
            var thing = $(this).closest('.thing');
            $(thing).removeClass('removed');
            $(thing).removeClass('spammed');
            $(thing).addClass('approved');
            ignoreOnApproveset = true;

            if ($(thing).find('.reported-stamp').length) {
                var ignore = $(thing).find('a:contains("ignore reports")')
                if (ignore) ignore[0].click();
            }
        });

        // Set reports threshold (hide reports with less than X reports)
        $('#modtab-threshold').keypress(function (e) {
            e.preventDefault();

            var threshold = +String.fromCharCode(e.which);
            if (isNaN(threshold)) return;

            $(this).val(threshold);
            queueTools.setting('reports-threshold', threshold);
            setThreshold($things);
        });

        function setThreshold(things) {
            var threshold = queueTools.setting('reports-threshold');
            things.show().find('.reported-stamp').text(function (_, str) {
                if (str.match(/\d+/) < threshold)
                    $(this).closest('.thing').hide();
            });
        }

        setThreshold($things);

        function replaceSubLinks() {
            $this = $(this).find('a.subreddit');
            var href = $this.attr('href') + QUEUE_URL;
            $this.attr('href', href);
        }

        if (linkToQueues && QUEUE_URL) {
            $things.each(replaceSubLinks);
        }

        // NER support.
        window.addEventListener("TBNewThings", function () {
            $.log("proc new things");
            var things = $(".thing").not(".mte-processed");
            processNewThings(things);
        });


        // Toggle all expando boxes
        var expandosOpen = false;
        $('.open-expandos').on('click', function () {

            if (!expandosOpen) {
                $('.open-expandos').text('[-]');
                $('.expando-button.collapsed').each(function (index) {
                    var button = this;
                    setTimeout(function () {
                        $(button).click();
                    }, index * 1000);
                });
                expandosOpen = true;
            } else {
                $('.open-expandos').text('[+]');
                $('.expando-button.expanded').each(function () {
                    $(this).click();
                });
                expandosOpen = false;
            }
        });

        // Open inline context
        $('.inline-content').click(function (e) {
            e.stopPropagation();
        });
        $body.on('click', 'a.context', function (e) {
            $('html').one('click', function () {
                $('.inline-content').hide();
            });
            $('.inline-content').show().offset($(this).offset()).text('loading...').load(this.href + '&limit=5 .sitetable.nestedlisting');
            return false;
        });

        // Call History Button module init if it's not already enabled
        if (!TB.modules.HistoryButton.setting('enabled')) {
            TB.modules.HistoryButton.init();
        }

        //Process new things loaded by RES or flowwit.
        function processNewThings(things) {
            //add class to processed threads.
            $(things).addClass('mte-processed');

            $(things).prepend('<input type="checkbox" tabindex="2" style="margin:5px;float:left;"' + (allSelected ? ' checked' : '') + ' />').find('.collapsed:visible a.expand:contains("[+]")').click().end().find('.userattrs').end().find('.userattrs').filter('.comment').find('.flat-list.buttons:has( a:contains("parent"))').each(function () {
                $(this).prepend('<li><a class="context" href="' + $(this).find('.first .bylink').attr('href') + '?context=2">context</a></li>');
            });
            if (expandosOpen)
                $(things).find('.expando-button.collapsed').click();
            if (!viewingspam)
                setThreshold(things);

            removeUnmoddable();
        }

        // Remove rate limit for expandos,removing,approving
        var rate_limit = window.rate_limit;
        window.rate_limit = function (action) {
            if (action == 'expando' || action == 'remove' || action == 'approve') return !1;
            return rate_limit(action);
        };


        if ((sortModQueue || sortUnmoderated) && TBUtils.isModFakereddit) {
            var prefix = '', page = '', type = '';
            if (TBUtils.isUnmoderatedPage && sortUnmoderated) {
                $.log('sorting unmod');
                prefix = 'umq-';
                page = 'unmoderated';
                //type = 'unmod-';
            } else if (TBUtils.isModQueuePage && sortModQueue) {
                $.log('sorting mod queue');
                prefix = 'mq-';
                page = 'modqueue';
                //type = 'mod-';
            } else {
                return;
            }

            var now = new Date().valueOf(),
                subs = {},
                delay = 0;

            // Update modqueue items count
            var modSubs = [];
            $('.subscription-box a.title').each(function () {
                var elem = $(this),
                    sr = elem.text(),
                    data = JSON.parse(TBUtils.getSetting('cache', prefix + TBUtils.logged + '-' + sr, '[0,0]'));
                modSubs.push(sr);

                // Update count and re-cache data if more than an hour old.
                elem.parent().append('<a href="/r/' + sr + '/about/' + page + '" count="' + data[0] + '">' + data[0] + '</a>');
                if (now > data[1] + 3600000)
                    setTimeout(updateModqueueCount.bind(null, sr), delay += 500);
            });
            //TBUtils.setSetting('QueueTools', type + TBUtils.logged, modSubs); //this, uh... doesn't do anything?

            function sortSubreddits() {
                var subs = $('.subscription-box li').sort(function (a, b) {
                    return b.lastChild.textContent - a.lastChild.textContent || (+(a.firstChild.nextSibling.textContent.toLowerCase() > b.firstChild.nextSibling.textContent.toLowerCase())) || -1;
                });
                $('.subscription-box').empty().append(subs);
            }

            sortSubreddits();

            function updateModqueueCount(sr) {
                $.get('/r/' + sr + '/about/' + page + '.json?limit=100').success(function (d) {
                    TBUtils.setSetting('cache', prefix + TBUtils.logged + '-' + sr, '[' + d.data.children.length + ',' + new Date().valueOf() + ']');
                    $('.subscription-box a[href$="/r/' + sr + '/about/' + page + '"]').text(d.data.children.length).attr('count', d.data.children.length);
                    sortSubreddits();
                });
            }
        }

        // This method is evil and breaks shit if it's called too early.
        function sortThings(order, asc) {
            var $sitetable = $('#siteTable');
            var things = $('#siteTable .thing').sort(function (a, b) {
                (asc) ? (A = a, B = b) : (A = b, B = a);

                switch (order) {
                    case 'age':
                        var timeA = new Date($(A).find('time:first').attr('datetime')).getTime(),
                            timeB = new Date($(B).find('time:first').attr('datetime')).getTime();
                        return timeA - timeB;
                    case 'score':
                        var scoreA = $(A).find('.score:visible').text().match(numberRX),
                            scoreB = $(B).find('.score:visible').text().match(numberRX);
                        return scoreA - scoreB;
                    case 'reports':
                        var reportsA = $(A).find('.reported-stamp').text().match(numberRX),
                            reportsB = $(B).find('.reported-stamp').text().match(numberRX);
                        return reportsA - reportsB;
                }
            });
            $sitetable.find('.thing').remove();
            $sitetable.prepend(things);
        }

        sortThings(listingOrder, sortAscending);
    }

    // Add mod tools or mod tools toggle button if applicable
    if (TBUtils.isModpage) {
        addModtools();
    }

    if (($body.hasClass('listing-page') || $body.hasClass('comments-page')) || $body.hasClass('search-page') && (!TBUtils.post_site || $('body.moderator').length)) {
        $('.tabmenu').first().append($('<li><a href="javascript:;" accesskey="M" class="modtools-on">queue tools</a></li>').click(addModtools));
    }
}; // queueTools.init()

TB.register_module(queueTools);
}// queuetools() wrapper

(function () {
    // wait for storage
    window.addEventListener("TBUtilsLoaded", function () {
        queuetools();
    });
})();

