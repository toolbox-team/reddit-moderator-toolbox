function queuetools() {
var self = new TB.Module('Queue Tools');
self.shortname = 'QueueTools';

self.settings['enabled']['default'] = true;

self.register_setting('hideActionedItems', {
    'type': 'boolean',
    'default': false,
    'title': 'Hide items after mod action'
});

self.register_setting('showAutomodActionReason', {
    'type': 'boolean',
    'default': true,
    'title': 'Show the action reason from automoderator in the queue'
});

self.register_setting('linkToQueues', {
    'type': 'boolean',
    'default': false,
    'title': 'Link to subreddit queue on mod pages'
});

self.register_setting('reportsOrder', {
    'type': 'selector',
    'advanced': true,
    'values': ['age', 'score', 'reports'],
    'default': 'age',
    'title': 'Sort by'
});

self.register_setting('reportsThreshold', {
    'type': 'number',
    'advanced': true,
    'min': 0,
    'max': null,
    'step': 1,
    'default': 1,
    'title': 'Reports threshold'
});

self.register_setting('reportsAscending', {
    'type': 'boolean',
    'advanced': true,
    'default': false,
    'title': 'Sort ascending.'
});

self.register_setting('expandReports', {
    'type': 'boolean',
    'default': false,
    'title': 'Automatically expand reports on mod pages.'
});

self.register_setting('botCheckmark', {
    'type': 'list',
    'default': ['AutoModerator'],
    'title': 'Make bot approved checkmarks have a different look <img src="data:image/png;base64,' + TBui.iconBot + '">. Bot names should entered separated by a comma without spaces and are case sensitive'
});

self.register_setting('queueCreature', {
    'type': 'selector',
    'values': ['kitteh', 'puppy', '/r/babyelephantgifs','/r/spiderbros','i have no soul'],
    'default': 'kitteh',
    'title': 'Queue Creature'
});

self.register_setting('subredditColor', {
    'type': 'boolean',
    'default': false,
    'title': 'Add a left border to queue items with a color unique to the subreddit name.'
});

// A better way to use another module's settings.
self.register_setting('subredditColorSalt', {
    'type': 'text',
    'default': TB.storage.getSetting('ModMail', 'subredditColorSalt', 'PJSalt'),
    'hidden': true
});


self.init = function () {
    var $body = $('body');

    // Cached data
    var notEnabled = [],
        hideActionedItems = self.setting('hideActionedItems'),
        showAutomodActionReason = self.setting('showAutomodActionReason'),
        sortUnmoderated = self.setting('sortUnmoderated'),
        linkToQueues = self.setting('linkToQueues'),
        subredditColor = self.setting('subredditColor'),
        subredditColorSalt = self.setting('subredditColorSalt'),
        queueCreature = self.setting('queueCreature');

    // var SPAM_REPORT_SUB = 'spam', QUEUE_URL = '';
    var QUEUE_URL = '';

    if (linkToQueues) {
        if (TBUtils.isModQueuePage) {
            QUEUE_URL = 'about/modqueue/';
        } else if (TBUtils.isUnmoderatedPage) {
            QUEUE_URL = 'about/unmoderated/';
        }
    }

    var $noResults = $body.find('p#noresults');
    if (TBUtils.isModpage && queueCreature !== 'i_have_no_soul' && $noResults.length > 0) {
        self.log(queueCreature);
        if (queueCreature === 'puppy') {
            $noResults.addClass('tb-puppy')
        } else if (queueCreature === 'kitteh') {
            $noResults.addClass('tb-kitteh')
        } else if (queueCreature === '/r/babyelephantgifs') {
            $noResults.addClass('tb-begifs')
        } else if (queueCreature === '/r/spiderbros') {
            $noResults.addClass('tb-spiders')
        }
    }

    function colorSubreddits() {
        var $this = $(this),
            subredditName = TB.utils.cleanSubredditName($this.find('a.subreddit').text());

        $this.addClass('color-processed');

        if ($.inArray(subredditName, TB.utils.mySubs) < 0) return;

        var colorForSub = TBUtils.stringToColor(subredditName + subredditColorSalt);
        $this.attr('style', 'border-left: solid 3px ' + colorForSub + ' !important');
        $this.addClass('tb-subreddit-color');
    }

    TB.utils.getModSubs(function () {
        if (subredditColor) {
            self.log('adding sub colors');
            $('.thing').each(colorSubreddits);
        }
    });

    // NER for coloring subs.
    window.addEventListener("TBNewThings", function () {
        if (subredditColor) {
            self.log('adding sub colors (ner)');
            $(".thing").not(".color-processed").each(colorSubreddits);
        }
    });


    // Ideally, this should be moved somewhere else to be common with the removal reasons module
    // Retreival of log subreddit information could also be separated
    function getRemovalReasons(subreddit, callback) {
        self.log('getting config: ' + subreddit);
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
            self.log('returning: cache');
            callback(reasons);
            return;
        }

        // OK, they are not cached.  Try the wiki.
        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || !resp.removalReasons) {
                self.log('failed: wiki config');
                callback(false);
                return;
            }

            // We have a valid config, cache it.
            TBUtils.configCache[subreddit] = resp;
            reasons = resp.removalReasons;

            // Again, check if there is a fallback sub, and recurse.
            if (reasons && reasons.getfrom) {
                self.log('trying: get from, no cache');
                getRemovalReasons(reasons.getfrom, callback); //this may not work.
                return;
            }

            // Last try, or return false.
            if (reasons) {
                self.log('returning: no cache');
                callback(reasons);
                return;
            }

            self.log('falied: all');
            callback(false);
        });
    }

    // Add modtools buttons to page.
    function addModtools() {
        var numberRX = /-?\d+/,
            reportsThreshold = self.setting('reportsThreshold'),
            listingOrder = self.setting('reportsOrder'),
            sortAscending = self.setting('reportsAscending'),
            viewingspam = !!location.pathname.match(/\/about\/(spam|trials)/),
            viewingreports = !!location.pathname.match(/\/about\/reports/),
            allSelected = false,
            expandReports = self.setting('expandReports'),
            EXPAND_TITLE = 'expand reports',
            COLLAPSE_TITLE = 'collapse reports';

        if (viewingspam && listingOrder == 'reports') {
            listingOrder = 'age';
        }

        // Get rid of promoted links & thing rankings
        $('#siteTable_promoted,#siteTable_organic,.rank').remove();

        // remove stuff we can't moderate (in non-mod queues only)
        function removeUnmoddable() {
            if (!TBUtils.isModpage && !TBUtils.isSubCommentsPage) {
                TBUtils.getModSubs(function () {
                    $('.thing').each(function () {
                        var $thing = $(this),
                            $sub = $thing.find('.subreddit');

                        // Remove if the sub isn't moderated
                        if($sub.length > 0) {
                            var sub = TB.utils.cleanSubredditName($sub.text());
                            if ($.inArray(sub, TBUtils.mySubs) === -1) {
                                $thing.remove();
                            }
                        }
                        // Always remove things like sponsored links (can't mod those)
                        else if($thing.find('.parent a.author').text() === 'redditads') {
                            $thing.remove();
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
            <a href="javascript:;" class="tb-general-button invert inoffensive" accesskey="I" title="invert selection">invert</a> \
            <a href="javascript:;" class="tb-general-button open-expandos inoffensive" title="toggle all expando boxes">[+]</a> \
            <div onmouseover="hover_open_menu(this)" onclick="open_menu(this)" class="dropdown lightdrop "> \
                <a href="javascript:;" class="tb-general-button inoffensive select"> [select...]</a> \
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
                <a class="choice" href="javascript:;" type="subreddit">subreddit...</a> \
                <a class="choice dashed" href="javascript:;" type="comments">all comments</a> \
                <a class="choice" href="javascript:;" type="links">all submissions</a> \
                <a class="choice dashed" href="javascript:;" type="self">self posts</a> \
                <a class="choice" href="javascript:;" type="flair">posts with flair</a> \
            </div>\
            &nbsp; \
            <a href="javascript:;" class="tb-general-button inoffensive unhide-selected" accesskey="U">unhide&nbsp;all</a> \
            <a href="javascript:;" class="tb-general-button inoffensive hide-selected"   accesskey="H">hide&nbsp;selected</a> \
            <a href="javascript:;" class="tb-general-button inoffensive toggle-reports"  >'+ EXPAND_TITLE +'</a> \
            <a href="javascript:;" class="pretty-button action negative" accesskey="S" type="negative" tabindex="3">spam&nbsp;selected</a> \
            <a href="javascript:;" class="pretty-button action neutral"  accesskey="R" type="neutral"  tabindex="4">remove&nbsp;selected</a> \
            <a href="javascript:;" class="pretty-button action positive" accesskey="A" type="positive" tabindex="5">approve&nbsp;selected</a> \
            ' + (TBUtils.post_site && false ? '<a href="javascript:;" class="pretty-button flair-selected inoffensive" accesskey="F" tabindex="6">flair&nbsp;selected</a>' : '') + ' \
        </span> \
        <span><a><label for="modtab-threshold">Report threshold: </label><input id="modtab-threshold" value="' + reportsThreshold + '" /></a></span>\
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
        //var tabmenu = $('#header-bottom-left .tabmenu');
        //if (tabmenu.length == 0)
        //    tabmenu = $('#header-bottom-left').append('<ul class="tabmenu"></ul>');
        // $('.tabmenu').append(viewingspam ? '' : '<li></li>');

        $('.thing.link, .thing.comment').prepend('<input type="checkbox" tabindex="1" style="margin:5px;float:left;" />');
        $('.buttons .pretty-button').attr('tabindex', '2');

        //add class to processed threads.
        var $things = $('.thing');
        $things.addClass('mte-processed');


        if (expandReports) {
            var $toggleReports = $('.toggle-reports');
            $toggleReports.addClass('expanded');
            $toggleReports.text(COLLAPSE_TITLE);

            $('.reported-stamp').siblings('.report-reasons').show();
        }

        // Add context & history stuff TODO: Figure out what the hell this did. History has been moved to historybutton though.

        //$body.append('<div class="pretty-button inline-content" style="z-index:9999;display:none;position:absolute;line-height:12px;min-width:100px"/>');
        //$('#siteTable .comment .flat-list.buttons:has( a:contains("parent"))').each(function () {
        //   $(this).prepend('<li><a class="context" href="' + $(this).find('.first .bylink').attr('href') + '?context=2">context</a></li>');
        //});

        // Fix the position of the modtools. We do it like this so we can support custom css
        var $modtoolsMenu = $body.find('.menuarea.modtools'),
            offset = $modtoolsMenu.offset(),
            offsetTop = offset.top,
            rightPosition = $('.side').outerWidth() + 10;

        $modtoolsMenu.css({
            'margin-right': rightPosition + 'px',
            'margin-left': '5px',
            'left': '0',
            'margin-top': '0',
            'position': 'relative',
            'padding-top': '9px'
        });

        $(window).scroll(function () {
            if ($(window).scrollTop() > offsetTop && $body.hasClass('pinHeader-sub')) {
                $modtoolsMenu.css({
                    'top': ($(window).scrollTop()) - offsetTop + 20 + 'px'
                });
            } else if ($(window).scrollTop() > offsetTop && $body.hasClass('pinHeader-header')) {
                $modtoolsMenu.css({
                    'top': ($(window).scrollTop()) - offsetTop + 72 + 'px'
                });
            } else if ($(window).scrollTop() > offsetTop) {
                $modtoolsMenu.css({
                    'top': ($(window).scrollTop()) - offsetTop + 5 + 'px'
                });
            } else {
                $modtoolsMenu.css({
                    'top': 'inherit'
                });
            }
        });

        //// Button actions ////
        // Select thing when clicked
        var noAction = ['A', 'INPUT', 'TEXTAREA', 'BUTTON'];
        $body.on('click', '.thing .entry', function (e) {
            if (noAction.indexOf(e.target.nodeName) + 1) return;

            self.log('thing selected.');
            $(this).parent('.thing').find('input[type=checkbox]:first').click();
        });

        // NB: the reason both the above method and the next one use .click() instead of .prop() is so they act as a toggle
        // when the report button is pressed. See https://github.com/creesch/reddit-moderator-toolbox/issues/421
        // This way, if it was already checked by the user, the following call will re-check it.  If it wasn't
        // the following call will uncheck it.

        $body.on('click', '.reported-stamp', function () {
            self.log('reports selected.');
            $(this).closest('.thing').find('input[type=checkbox]:first').click();
        });

        // Change sort order
        $('.sortorder-options a').click(function () {
            var $sortOrder = $('.sortorder'),
                order = $(this).text(),
                toggleAsc = (order == $sortOrder.text());

            if (toggleAsc) sortAscending = !sortAscending;

            self.setting('reportsAscending', sortAscending);
            self.setting('reportsOrder', order);

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
                case 'subreddit':
                    selector = ':has(a.subreddit:contains(' + prompt('subreddit contains:\n(case sensitive)', '') + '))';
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
                    selector = ':has(.linkflairlabel)';
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

        // Expand reports on click.
        $('.toggle-reports').click(function () {
            var $this = $(this);

            if ($this.hasClass('expanded')){
                $this.removeClass('expanded');
                $this.text(EXPAND_TITLE);
                $('.reported-stamp').siblings('.report-reasons').hide();
            } else {
                $this.addClass('expanded');
                $this.text(COLLAPSE_TITLE);
                $('.reported-stamp').siblings('.report-reasons').show();
            }
        });

        // Mass spam/remove/approve
        $('.pretty-button.action').click(function () {
            var approve = this.type == 'positive',
                spam = !approve && (this.type == 'negative');

            // Apply action
            var $actioned = $('.thing:visible > input:checked').parent().each(function () {
                var id = $(this).attr('data-fullname');

                if (approve) {
                    TBUtils.approveThing(id, function (success) {
                        if (success){
                            TB.utils.sendEvent(TB.utils.events.TB_APPROVE_THING);
                        }
                    });
                }
                else {
                    TBUtils.removeThing(id, spam, function (success) {
                        //Insert useful error handling here (or not)
                    });
                }
            });
            $actioned.css('opacity', '1');
            $actioned.removeClass('flaired spammed removed approved');
            $actioned.addClass(approve ? 'approved' : (spam ? 'spammed' : 'removed'));

            if (hideActionedItems) {
                $actioned.hide();
            }
        });

        // menuarea pretty-button feedback.
        $('.menuarea.modtools .pretty-button').click(function () {
            $(this).clearQueue().addClass('pressed').delay(200).queue(function () {
                $(this).removeClass('pressed');
            });
        });

        // Uncheck anything we've taken an action, if it's checked.
        $body.on('click', '.pretty-button', function () {
            var $this = $(this),
                $thing = $this.closest('.thing');

            $thing.find('input[type=checkbox]').prop('checked', false);
            if (hideActionedItems) {
                self.log('hiding item');
                $thing.hide();
            }
            else if ($this.hasClass('negative')) {
                $thing.removeClass('removed approved');
                $thing.addClass('spammed');
            }
            else if ($this.hasClass('neutral')) {
                $thing.removeClass('spammed approved');
                $thing.addClass('removed');
            }
            else if ($this.hasClass('positive')) {
                $thing.removeClass('removed spammed');
                $thing.addClass('approved');
            }
        });

        // Set reports threshold (hide reports with less than X reports)
        $('#modtab-threshold').keypress(function (e) {
            e.preventDefault();

            var threshold = +String.fromCharCode(e.which);
            if (isNaN(threshold)) return;

            $(this).val(threshold);
            self.setting('reportsThreshold', threshold);
            setThreshold($things);
        });

        function setThreshold(things) {
            var threshold = self.setting('reportsThreshold');
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
            self.log("proc new things");
            var things = $(".thing").not(".mte-processed");

            processNewThings(things);

        });

        // Toggle all expando boxes
        var expandosOpen = false;
        $('.open-expandos').on('click', function () {

            if (!expandosOpen) {
                self.log('expanding all expandos.');

                $('.open-expandos').text('[-]');
                $('.expando-button.collapsed').each(function (index) {
                    var $button = $(this),
                        $checkBox = $button.closest('.thing').find('input[type=checkbox]');

                    setTimeout(function () {
                        $button.click();
                        $checkBox.prop('checked', false);
                    }, index * 1000);
                });
                expandosOpen = true;
            } else {
                self.log('collapsing all expandos.');

                $('.open-expandos').text('[+]');
                $('.expando-button.expanded').each(function () {
                    var $button = $(this),
                        $checkBox = $button.closest('.thing').find('input[type=checkbox]');

                    $button.click();
                    $checkBox.prop('checked', false);
                });
                expandosOpen = false;
            }
        });

        // Call History Button module init if it's not already enabled
        if (!TB.storage.setSetting('HButton', 'enabled', true)) {
            TB.modules.HButton.init();
        }

        //Process new things loaded by RES or flowwit.
        function processNewThings(things) {
            // Expand reports on the new page, we leave the ones the user might already has collapsed alone.
            if (expandReports) {
                $(things).find('.reported-stamp').siblings('.report-reasons').show();
            }
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

        // sort sidebars
        if (TBUtils.isModFakereddit) {
            $('.sidecontentbox').find('.title:contains(THESE SUBREDDITS)').append('&nbsp;<a href="javascript:;" class="tb-sort-subs"><img src="data:image/png;base64,' + TB.ui.iconSort + '" />sort by items</a>');
        }

        $body.on('click', '.tb-sort-subs', function () {
            var prefix = '', page = '';
            if (TBUtils.isUnmoderatedPage) {
                self.log('sorting unmod');
                prefix = 'umq-';
                page = 'unmoderated';
            } else if (TBUtils.isModQueuePage) {
                self.log('sorting mod queue');
                prefix = 'mq-';
                page = 'modqueue';
            } else {
                return;
            }

            self.log('sorting queue sidebar');
            $('.tb-sort-subs').remove(); // don't allow sorting twice.

            var now = TB.utils.getTime(),
                //delay = 0,
                modSubs = [];

            TBui.longLoadNonPersistent(true, "Getting subreddit items...", TB.ui.FEEDBACK_NEUTRAL);

            TB.utils.forEachChunked($('.subscription-box a.title'), 20, 100, function (elem) {
                    var $elem = $(elem),
                        sr = $elem.text(),
                        data = JSON.parse(TB.storage.getCache('QueueTools', prefix + TBUtils.logged + '-' + sr, '[0,0]'));

                    modSubs.push(sr);
                    TB.ui.textFeedback("Getting items for: " + sr, TB.ui.FEEDBACK_POSITIVE, null, TB.ui.DISPLAY_BOTTOM);

                    // Update count and re-cache data if more than an hour old.
                    $elem.parent().append('<a href="/r/' + sr + '/about/' + page + '" count="' + data[0] + '" class="tb-subreddit-item-count">' + data[0] + '</a>');
                    if (now > data[1]) {
                        updateModqueueCount(sr);
                    }

                    function updateModqueueCount(sr) {
                        $.get('/r/' + sr + '/about/' + page + '.json?limit=100').success(function (d) {
                            var items = d.data.children.length;
                            self.log('  subreddit: ' + sr + ' items: ' + items);
                            TB.storage.setCache('QueueTools', prefix + TBUtils.logged + '-' + sr, '[' + items + ',' + new Date().valueOf() + ']');
                            $('.subscription-box a[href$="/r/' + sr + '/about/' + page + '"]').text(d.data.children.length).attr('count', d.data.children.length);
                        });
                    }

                },

                function () {
                    window.setTimeout(sortSubreddits, 2000); // wait for final callbacks
                    TB.ui.longLoadNonPersistent(false, 'Sorting sidebar...', TB.ui.FEEDBACK_NEUTRAL);
                });

            function sortSubreddits() {
                var subs = $('.subscription-box li').sort(function (a, b) {
                    return b.lastChild.textContent - a.lastChild.textContent || (+(a.firstChild.nextSibling.textContent.toLowerCase() > b.firstChild.nextSibling.textContent.toLowerCase())) || -1;
                });
                $('.subscription-box').empty().append(subs);
            }
        });



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

    if (($body.hasClass('listing-page') || $body.hasClass('comments-page')) || $body.hasClass('search-page') && (!TBUtils.post_site || TBUtils.isMod)) {
        $('.tabmenu').first().append($('<li><a href="javascript:;" accesskey="M" class="modtools-on">queue tools</a></li>').click(addModtools));
    }


    // Show automod action reasons

    function getAutomodActionReason(sub) {
        self.log(sub);
        $.getJSON('/r/' + sub + '/about/log/.json?limit=100&mod=AutoModerator').done(function (json) {
            $.each(json.data.children, function (i, value) {
                $body.find('.thing[data-fullname="'+ value.data.target_fullname + '"]>.entry').after('<div class="action-reason">\
<b>Automod action:</b> ' + value.data.details + '\
<br><a href="https://www.reddit.com/message/compose?to=/r/' + sub + '&subject=Automoderator second opinion&message=I would like a second opinion about something automod filtered \
%0A%0A \
Url: ' + value.data.target_permalink + ' %0A %0A \
Action reason: ' + value.data.details + '\
" target="_blank">ask for a second opinion in modmail</a> </div>');

            });
        });
    }

    if(TBUtils.isMod && TBUtils.isCommentsPage && showAutomodActionReason && $('.thing.spam').length) {
        var currentSubreddit = $('.side .titlebox h1.redditname a').text();

        getAutomodActionReason(currentSubreddit);
    }

    if (TBUtils.isModpage && showAutomodActionReason) {
        var queueSubs = [];

        self.log('getting automod action reasons');

        $('#siteTable .thing').each(function() {
            $this = $(this);
            var subreddit = TB.utils.cleanSubredditName($this.find('a.subreddit').text());
            var removedBy = $this.find('.flat-list li[title^="removed at"]').text();

            self.log('  subreddit: ' + subreddit);
            self.log('  removedby: ' + removedBy);

            if($.inArray(subreddit, queueSubs) === -1 && removedBy === '[ removed by AutoModerator (remove not spam) ]') {
                queueSubs.push(subreddit);
            }

        });

        self.log('queuesubs:');
        self.log(queueSubs);

        for (var i = 0; i < queueSubs.length; i++) {
            var sub  = queueSubs[i];

            getAutomodActionReason(sub);
        }
    }


    // Let's make bot approved posts stand out!
    var checkmarkLength = self.setting('botCheckmark').length;
    if (TBUtils.isMod && checkmarkLength > 0) {


        var baseCss;
        checkmarkLength = checkmarkLength - 1;
        $.each(self.setting('botCheckmark'), function (i, val) {

            switch (i) {
                case 0:
                    baseCss = 'img.approval-checkmark[title*="approved by ' + val + '"], \n';
                    break;
                case checkmarkLength:
                    baseCss += 'img.approval-checkmark[title*="approved by ' + val + '"] \n';
                    break;
                default:
                    baseCss += 'img.approval-checkmark[title*="approved by ' + val + '"], \n'
            }
        });

        baseCss += '\
        { \n\
            display: inline-block; \n\
            padding-left: 16px; \n\
            padding-top: 5px; \n\
            background-image: url("data:image/png;base64,' + TBui.iconBot + '"); \n\
            background-repeat: no-repeat; \n\
        } \n';

        $('head').append('<style>' + baseCss + '</style>');

    }

}; // queueTools.init()

TB.register_module(self);
}// queuetools() wrapper

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        queuetools();
    });
})();
