import $ from 'jquery';

import * as TBCore from '../tbcore.js';
import * as TBHelpers from '../tbhelpers.js';
import {Module} from '../tbmodule.js';
import * as TBStorage from '../tbstorage.js';
import * as TBui from '../tbui.js';

const self = new Module({
    name: 'Mod Mail Pro',
    id: 'ModMail',
    oldReddit: true,
    enabledByDefault: true,
    settings: [
        {
            id: 'inboxStyle',
            type: 'selector',
            values: async () => {
                const values = [
                    'All',
                    'Priority',
                    'Filtered',
                    'Replied',
                    'Unread',
                    'Unanswered',
                ];
                // Allow default bot view IF user has filterBots enabled.
                if (await self.get('filterBots')) {
                    values.push('Bots');
                }
                return values;
            },
            default: 'Priority',
            description: 'Default inbox view',
        },
        {
            id: 'filteredSubs',
            type: 'sublist',
            default: [],
            description: 'Subreddits to filter from priority view.',
        },
        {
            id: 'defaultCollapse',
            type: 'boolean',
            default: false,
            description: 'Collapse all mod mail threads by default.',
        },
        {
            id: 'noRedModmail',
            type: 'boolean',
            default: true,
            description: 'Show removed threads with red titles.',
        },
        {
            id: 'highlightNew',
            type: 'boolean',
            default: true,
            description: 'Highlight new threads and replies.',
        },
        {
            id: 'expandReplies',
            type: 'boolean',
            default: false,
            description: 'Expand all replies when expanding threads.',
        },
        {
            id: 'hideInviteSpam',
            type: 'boolean',
            default: false,
            description: 'Filter mod invited and added threads.',
        },
        {
            id: 'autoLoad',
            type: 'boolean',
            default: true,
            hidden: async () => !await TBStorage.getSettingAsync('Notifier', 'enabled', true),
            description: 'Automatically load new mod mail when received.',
        },
        {
            id: 'fadeRecipient',
            type: 'boolean',
            default: true,
            description: 'Fade the recipient of a modmail so it is much more clear who sent it.',
        },
        {
            id: 'subredditColor',
            type: 'boolean',
            default: false,
            description: 'Add a left border to modmail conversations with a color unique to the subreddit name.',
        },
        {
            id: 'resThreadedModmail',
            type: 'boolean',
            default: false,
            description: 'Style threaded modmail in a similar style as RES does for comments.',
        },
        {
            id: 'subredditColorSalt',
            type: 'text',
            default: 'PJSalt',
            description: 'Text to randomly change the subreddit color',
            advanced: true,
            hidden: async () => !await self.get('subredditColor'),
        },
        {
            id: 'customLimit',
            type: 'number',
            default: 0, // 0 = ueser's default.
            advanced: true,
            description:
                'Set the amount of modmail conversations loaded by default. Selecting 0 will use your reddit settings',
        },
        {
            id: 'filterBots',
            type: 'boolean',
            default: false,
            advanced: true,
            description: 'Filter bots from priority view',
        },
        {
            id: 'botsToFilter',
            type: 'list',
            default: ['AutoModerator'],
            description:
                'Bots to filter from priority view. Bot names should entered separated by a comma without spaces',
            hidden: async () => !await self.get('filterBots'),
        },
        {
            id: 'newTabLinks',
            type: 'boolean',
            default: false,
            description: 'Open links in modmail comments in new tab',
        },

        // Private setting storage
        {
            id: 'lastVisited',
            type: 'number',
            default: new Date().getTime(),
            hidden: true,
        },
        {
            id: 'replied',
            type: 'array',
            default: [],
            hidden: true,
        },
        {
            id: 'threadProcessRate',
            type: 'number',
            default: 100,
            hidden: true,
        },
        {
            id: 'entryProcessRate',
            type: 'number',
            default: 50,
            hidden: true,
        },
        {
            id: 'chunkProcessSize',
            type: 'number',
            default: 2,
            hidden: true,
        },
        {
            id: 'twoPhaseProcessing',
            type: 'boolean',
            default: true,
            hidden: true,
        },
    ],
}, init);

function init (options) {
    if (!TBCore.isModmail) {
        return;
    }

    this.modmailpro(options);
    this.autoLoad(options);
    this.mailDropDowns(options);
}

self.modmailpro = function ({
    lastVisited,
    expandReplies,
    noRedModmail,
    hideInviteSpam,
    highlightNew,
    fadeRecipient,
    subredditColor,
    subredditColorSalt,
    resThreadedModmail,
    threadProcessRate,
    entryProcessRate,
    chunkProcessSize,
    twoPhaseProcessing,
    filterBots,
    botsToFilter,
    filteredSubs,
    newTabLinks,
    inboxStyle,
    defaultCollapse,
}) {
    const $body = $('body');

    const ALL = 'all';
    const PRIORITY = 'priority';
    const FILTERED = 'filtered';
    const REPLIED = 'replied';
    const UNREAD = 'unread';
    const UNANSWERED = 'unanswered';
    const BOTS = 'bots';

    self.startProfile('settings-access');
    const INVITE = 'moderator invited';
    const ADDED = 'moderator added';
    const now = new Date().getTime();
    const unreadPage = location.pathname.match(/\/moderator\/(?:unread)\/?/); // TBCore.isUnreadPage doesn't wok for this.  Needs or for moderator/messages.
    const moreCommentThreads = [];
    const unreadThreads = [];
    const unansweredThreads = [];
    let inbox = inboxStyle;
    let newCount = 0;
    let collapsed = defaultCollapse;
    let sentFromMMP = false;
    let newThreadSupport = false;
    self.endProfile('settings-access');

    self.startProfile('common-element-gen');
    const separator = '<span class="tb-separator"></span>';
    const spacer = '<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>';
    const $allLink = $(`<li><a class="alllink tb-general-button" href="javascript:;" data-view="${ALL}">all</a></li>`);
    const $priorityLink = $(
        `<li><a class="prioritylink tb-general-button" href="javascript:;" data-view="${PRIORITY}">priority</a></li>`,
    );
    const $filteredLink = $(
        `<li><a class="filteredlink tb-general-button" href="javascript:;" data-view="${FILTERED}">filtered</a></li>`,
    );
    const $repliedLink = $(
        `<li><a class="repliedlink tb-general-button" href="javascript:;" data-view="${REPLIED}">replied</a></li>`,
    );
    const $unreadLink = $(
        `<li><a class="unreadlink tb-general-button" href="javascript:;" data-view="${UNREAD}">unread</a></li>`,
    );
    const $unansweredLink = $(
        `<li><a class="unansweredlink tb-general-button" href="javascript:;" data-view="${UNANSWERED}">unanswered</a></li>`,
    );
    const $botsLink = $(
        `<li><a class="botslink tb-general-button" href="javascript:;" data-view="${BOTS}">bots</a></li>`,
    );
    const $collapseLink = $(
        '<li><a class="collapse-all-link tb-general-button" href="javascript:;">collapse all</a></li>',
    );
    const $unreadCount = $('<li><span class="unread-count"><b>0</b> - new messages</span></li>');
    const $mmpMenu = $('<ul class="flat-list hover mmp-menu"></ul>');

    const infoArea = `<span class="info-area correspondent">
            <span class="tb-message-count" title="Number of replies to the message."></span>
            <span class="tb-replied-tag"></span>
        </span>`;

    const collapseLink = '<a href="javascript:;" class="tb-collapse-link">−</a>';

    // TODO: move to CSS
    const selectedCSS = {
        'color': 'orangered',
        'font-weight': 'bold',
    };
    const unselectedCSS = {
        'color': '#369',
        'font-weight': 'normal',
    };

    self.endProfile('common-element-gen');

    // Find and clear menu list.
    self.startProfile('menu-gen');
    const $menuList = $('.menuarea ul.flat-list').html('');

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

    let profileStart = performance.now();
    initialize();

    // Processing functions

    function initialize () {
        self.startProfile('initialize');
        self.log('MMP init');

        if (newTabLinks) {
            $('.sitetable  .md a').attr('target', '_blank');
        }

        TBui.longLoadNonPersistent(true);

        // Add support for detecting NER, realtime and LMC threads.
        addNewThreadSupport();

        // Collapse everything if enabled
        if (collapsed) {
            $body.find('.entry').css('display', 'none');
            $body.find('.expand-btn').css('display', 'none');
        }

        // Process threads
        const $unprocessedThreads = $('.message-parent:not(.mmp-processed)');
        const $processSlowly = $unprocessedThreads.slice(0, 5);
        const $processFastly = $unprocessedThreads.slice(5);
        self.log(`Unprocessed Threads = ${$unprocessedThreads.length}`);
        self.log(`\tProcessing slow = ${$processSlowly.length}`);
        self.log(`\tProcessing fast = ${$processFastly.length}`);

        addThreadUI($unprocessedThreads);

        // Enable as much CSS can be done at this point
        enablePreProcessFeatures();

        // Start process
        if (twoPhaseProcessing) {
            processThreads($processSlowly, 1, threadProcessRate, slowComplete, 'slow');
        } else {
            processThreads($unprocessedThreads, chunkProcessSize, threadProcessRate, fastComplete, 'full');
        }

        function processThreads (threads, chunkSize, processRate, completeAction, profileKey) {
            TBCore.forEachChunked(
                threads,
                chunkSize,
                processRate,
                (thread, count, array) => {
                    self.log(`Running thread batch: ${count + 1} of ${array.length}`);
                    processThread(thread);
                },
                () => {
                    self.endProfile(`batch-process-${profileKey}`);
                    self.log(`Batch ${profileKey} complete`);

                    completeAction();
                },
                () => {
                    self.startProfile(`batch-process-${profileKey}`);
                },
            );
        }

        function slowComplete () {
            processThreads($processFastly, chunkProcessSize, threadProcessRate / 2, fastComplete, 'fast');
        }

        function fastComplete () {
            self.set('lastVisited', now);

            if (highlightNew) {
                highlightNewThreads($unprocessedThreads);
            }

            // If set expand link.
            if (collapsed) {
                $('.collapse-all-link')
                    .css(selectedCSS)
                    .text('expand all');
            }

            // If we're on the unread page, don't filter anything.
            if (unreadPage) {
                const $entries = $('.entry');
                const newCount = $entries.length;

                setView(ALL);
                $menuList.html(`<a href="${TBCore.link('/message/moderator/')}">go to full mod mail</a>`);
                $('.unread-count').html(
                    TBStorage.purify(`<b>${newCount}</b> - new mod mail thread${newCount === 1 ? '' : 's'}`),
                );
                $entries.click();
            } else {
                // Otherwise setup the view
                setReplied($unprocessedThreads);
                updateView();
            }

            TBui.longLoadNonPersistent(false);

            // I can't actually imagine this happening.
            if ($('.message-parent:not(.mmp-processed)').length > 0) {
                initialize();
            } else {
                // Mod mail done loading
                finalize();
            }
        }
    }

    function enablePreProcessFeatures () {
        $body.addClass('tb-collapse');
        if (noRedModmail) {
            $body.addClass('tb-no-red-modmail');
        }
    }

    function enablePostProcessFeatures () {
        $body.addClass('tb-modmail-pro');
        if (fadeRecipient) {
            $body.addClass('tb-fade-recipient');
        }
    }

    async function processThread (thread) {
        self.startProfile('thread');
        self.startProfile('thread-info');
        self.startProfile('thread-jquery');

        const $thread = $(thread);
        const newMessageThread = $thread.hasClass('realtime-new');
        const lmcThread = $thread.hasClass('lmc-thread');

        $thread.addClass('mmp-processed');

        // Add back UI for new threads *before* any $thread.find()'s
        if (newMessageThread || lmcThread) {
            addThreadUI($thread);
        }

        const $infoArea = $thread.find('.info-area');
        const $entries = $thread.find('.entry');
        const $messageCount = $infoArea.find('.tb-message-count');
        const $collapseLink = $thread.find('.tb-collapse-link');
        const $subredditArea = $thread.find('.correspondent:first');

        const threadInfo = await TBCore.getThingInfo($thread);
        const threadID = threadInfo.id;
        const subreddit = threadInfo.subreddit;
        const title = threadInfo.title;
        const sender = threadInfo.author.toLowerCase();
        let replyCount = $entries.length - 1;

        // Set subreddit name.
        $thread.attr('data-subreddit', subreddit);

        self.endProfile('thread-jquery');

        self.log(`Processing thread: ${title} in: /r/${subreddit}`);
        self.log(`\tNum entries = ${$entries.length}`);
        self.log(`\tNum replies = ${replyCount}`);

        // LMC threads are never collapsed.
        if (collapsed && !lmcThread) {
            $collapseLink.text('+');
            $thread.addClass('mmp-collapsed');
        }

        self.endProfile('thread-info');

        // Add MMP UI
        if (replyCount > 0) {
            if ($thread.hasClass('moremessages')) {
                replyCount = `${replyCount.toString()}+`;
                moreCommentThreads.push(threadID);
            }

            $thread.addClass('has-replies');
            $messageCount.text(replyCount);
        } else {
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
            botsToFilter.forEach(botName => {
                if (botName.toLowerCase() === sender) {
                    $thread.addClass('botspam');
                }
            });
        }

        //
        // Make threaded modmail look more like RES threaded comments.
        //

        if (resThreadedModmail) {
            $body.addClass('tb-mmp-thread');
        }

        // Adds a colored border to modmail conversations where the color is unique to the subreddit. Basically similar to IRC colored names giving a visual indication what
        // subreddit the conversation is for.
        if (subredditColor) {
            self.startProfile('thread-sr-color');

            const subredditName = $thread.find('.correspondent a[href*="moderator/inbox"]').text();
            const colorForSub = TBHelpers.stringToColor(subredditName + subredditColorSalt);

            $thread.attr('style', `border-left: solid 3px ${colorForSub} !important`);
            $thread.addClass('tb-subreddit-color');
            $thread.find('.marker-dot').css('background-color', colorForSub);

            self.endProfile('thread-sr-color');
        }

        // Don't parse all entries if we don't need to.
        if (fadeRecipient) {
            TBCore.forEachChunked(
                $entries,
                5,
                entryProcessRate,
                entry => {
                    self.startProfile('fade-recipient-internal');

                    // Fade the recipient of a modmail so it is much more clear WHO send it.
                    const $entry = $(entry);
                    const $fadedRecipient = $entry.find('.recipient a.author');

                    // Ok this might be a tad complicated but it makes sure to fade out the recipient and also remove all reddit and RES clutter added to usernames.

                    // If there are two usernames we'll fade out the first one.
                    if ($fadedRecipient) {
                        const $head = $fadedRecipient.closest('.head');
                        $head.find('.userattrs').css('display', 'none');

                        $fadedRecipient.addClass('tb-recipient');
                    }

                    self.endProfile('fade-recipient-internal');
                },
                () => {
                    self.endProfile('fade-recipient');
                },
                () => {
                    self.startProfile('fade-recipient');
                },
            );
        }

        // Deal with realtime threads.
        if (newMessageThread) {
            self.log('New thread!');
            $thread.removeClass('realtime-new');
            $infoArea.css('background-color', 'yellow');
            $subredditArea.css('background-color', 'yellow');

            updateView();

            if (collapsed) {
                $thread.find('.entry').css('display', 'none');
                $thread.find('.expand-btn').css('display', 'none');
            }

            if (newTabLinks) {
                $thread.find('.md a').attr('target', '_blank');
            }

            $thread.fadeIn('slow');
        }

        // Deal with LMC threads
        if (lmcThread) {
            self.log('LMC Thread!');

            if (expandReplies) {
                $thread.find('.expand-btn:first')[0].click();
            }

            // recolor new threads.
            if (unreadThreads.includes(threadID)) {
                $infoArea.addClass('new-highlight');
                $subredditArea.addClass('new-highlight');
                $thread.addClass('new-messages');
                $thread.addClass('process-new');
            }

            if (newTabLinks) {
                $thread.find('.md a').attr('target', '_blank');
            }

            setReplied($thread);
        }

        self.endProfile('thread');
    }

    function addThreadUI ($threads) {
        // We do a second check here.
        // Due to this being modmail and stuff being slow the previous check is applied only after the parent function is already called for a second time.
        // Doing a second check here for signs of processing makes sure we do not end up with a ton of clutter.
        $threads = $threads.not(':has(.tb-collapse-link)');
        const $subArea = $threads.find('.correspondent:first');
        $subArea.find('> a[href^="/r/"]').addClass('subreddit-name');
        $subArea.prepend(collapseLink);
        $subArea.after(infoArea);
    }

    function addNewThreadSupport () {
        if (newThreadSupport) {
            return;
        }
        newThreadSupport = true;

        const event = new CustomEvent('TBNewThings');

        // realtime support
        $body.find('div.content').on('DOMNodeInserted', '.realtime-new', e => {
            self.log('realtime! realtime!');
            const $sender = $(e.target);
            if (!$sender.hasClass('message-parent')) {
                return;
            }

            profileStart = performance.now();

            const attrib = $sender.data('fullname');

            setTimeout(async () => {
                self.log('realtime go');
                const thread = $(`.message-parent[data-fullname='${attrib}']`);
                if (thread.length > 1) {
                    $sender.remove();
                } else {
                    await processThread($sender);
                    sentFromMMP = true;
                    window.dispatchEvent(event);
                }
            }, 500);
        });

        // LMC support
        $body.on('click', '[id^=more_]', () => {
            self.log('LMC! LMC!');
            $body.find('div.content').on('DOMNodeInserted', '.message-parent', e => {
                const $sender = $(e.target);
                if (!moreCommentThreads.includes($sender.data('fullname'))) {
                    return;
                }

                profileStart = performance.now();

                setTimeout(() => {
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
        window.addEventListener('TBNewThings', () => {
            if (sentFromMMP) {
                sentFromMMP = false;
                return;
            }
            self.log('NER! NER!');
            initialize();
        });
    }

    function highlightNewThreads ($threads) {
        self.startProfile('highlight-new-jquery');

        $threads.find('.entry:last').each((key, entry) => {
            const $entry = $(entry);
            const timestamp = new Date($entry.find('.head time').attr('datetime')).getTime();

            if (timestamp > lastVisited) {
                const $newThread = $entry.closest('.message-parent');

                $newThread.find('.info-area').addClass('new-highlight');
                $newThread.find('.correspondent:first').addClass('new-highlight');
                $newThread.addClass('new-messages');
                $newThread.addClass('process-new');

                unreadThreads.push($newThread.data('fullname'));
            }
        });

        self.endProfile('highlight-new-jquery');

        TBCore.forEachChunked($('.process-new').find('.message'), 10, entryProcessRate, message => {
            self.startProfile('highlight-new-internal');

            const $message = $(message);
            const $entry = $message.find('.entry');
            const timestamp = new Date($entry.find('.head time').attr('datetime')).getTime();

            // Don't process new threads twice.
            $entry.closest('.process-new').removeClass('process-new');

            if (timestamp > lastVisited) {
                $message.addClass('new-message');

                // Expand thread / highlight new
                if ($message.hasClass('collapsed')) {
                    $entry.find('.expand:first').click();
                }

                newCount++;
            }

            self.endProfile('highlight-new-internal');
        }, () => {
            $('.unread-count').html(TBStorage.purify(`<b>${newCount}</b> - new message${newCount === 1 ? '' : 's'}`));

            self.endProfile('highlight-new');
        }, () => {
            self.startProfile('highlight-new');
        });
    }

    function finalize () {
        enablePostProcessFeatures();

        // Tell the user how quick and awesome we are.
        const nowTime = performance.now();
        let secs = (nowTime - profileStart) / 1000;

        // Round time
        secs = Math.round(secs * 100) / 100;

        TBui.textFeedback(`Mod mail loaded in: ${secs} seconds`, TBui.FEEDBACK_POSITIVE, 2000, TBui.DISPLAY_BOTTOM);

        // Profiling results
        self.endProfile('initialize');

        self.log('Profiling results: modmail');
        self.log('--------------------------');
        self.getProfiles().forEach((profile, key) => {
            self.log(`${key}:`);
            self.log(`\tTime  = ${profile.time.toFixed(4)}`);
            self.log(`\tCalls = ${profile.calls}`);
        });
        self.log('--------------------------');
    }

    function setView (newView) {
        self.log(`Setting view to ${newView} from ${inbox}`);
        inbox = newView;
        updateView();
    }

    async function updateView () {
        switch (inbox.toLowerCase()) {
            case PRIORITY:
                $priorityLink.closest('li').addClass('selected');
                hideThreads(filteredSubs);
                break;
            case FILTERED:
                $filteredLink.closest('li').addClass('selected');
                showThreads(filteredSubs);
                break;
            case REPLIED:
                $repliedLink.closest('li').addClass('selected');
                showThreads(await getRepliedThreads(), true);
                break;
            case UNREAD:
                $unreadLink.closest('li').addClass('selected');
                showThreads(unreadThreads, true);
                break;
            case UNANSWERED:
                $unansweredLink.closest('li').addClass('selected');
                showThreads(unansweredThreads, true);
                break;
            case BOTS:
                $botsLink.closest('li').addClass('selected');
                showThreads(getBotThreads(), true);
                break;
            default: // ALL
                $allLink.closest('li').addClass('selected');
                showAllThreads();
                return;
        }

        // Hide invite spam.
        if (hideInviteSpam && inbox !== UNREAD) {
            $('.invitespam').each(function () {
                const $this = $(this);
                if ($this.hasClass('new')) {
                    $this.find('.entry').click();
                }

                $this.css('display', 'none');
            });
        }

        // Hide invite spam.
        if (filterBots && inbox === PRIORITY) {
            $('.botspam').each(function () {
                const $this = $(this);
                if ($this.hasClass('new')) {
                    $this.find('.entry').click();
                }

                $this.css('display', 'none');
            });
        }
    }

    function setReplied (threads) {
        if (threads === undefined) {
            threads = $('.message-parent');
        }

        threads.each(async function () {
            const $this = $(this);
            const id = $this.data('fullname');

            if (await getRepliedThreads().includes(id)) {
                $this.find('.tb-replied-tag').html(' Replied');
                $this.removeClass('invitespam'); // it's not spam if we replied.
            }
        });
    }

    function getRepliedThreads () {
        return self.get('replied');
    }

    function getBotThreads () {
        const bots = [];
        $('.botspam').each(function () {
            bots.push($(this).data('fullname'));
        });
        return bots;
    }

    function showThreads (items, byID) {
        $('.message-parent').each(function () {
            const $this = $(this);
            $this.css('display', 'none');

            if (!byID) {
                const subname = $this.attr('data-subreddit');

                if (items.includes(subname)) {
                    $this.css('display', '');
                }
            } else {
                const id = $this.data('fullname');

                if (items.includes(id)) {
                    $this.css('display', '');
                }
            }
        });
    }

    function showAllThreads () {
        $('.message-parent').css('display', '');
    }

    function hideThreads (subs) {
        $('.message-parent').each(function () {
            const $this = $(this);
            const subname = $this.attr('data-subreddit');

            $this.css('display', '');

            if (subs.includes(subname, subs)) {
                $this.css('display', 'none');
            }
        });
    }

    function collapseall () {
        self.log('collapsing all');
        collapsed = true;
        const $link = $('.collapse-all-link');

        // make look selected.
        $link.css(selectedCSS);

        // Hide threads.
        $body.find('.entry').css('display', 'none');
        $body.find('.expand-btn').css('display', 'none');

        $link.text('expand all');
        $('.tb-collapse-link').text('+');
    }

    function expandall () {
        collapsed = false;
        const $link = $('.collapse-all-link');

        // make look unselected.
        $link.css(unselectedCSS);

        // Show threads.
        const threads = $('.message-parent');
        $body.find('.entry').css('display', '');
        $body.find('.expand-btn').css('display', '');

        TBCore.forEachChunked(threads, 10, 300, thread => {
            const $this = $(thread);

            if (expandReplies) {
                $this.find('.expand-btn:first')[0].click();
            }
        });

        $link.text('collapse all');
        $('.tb-collapse-link').text('−');
    }

    // / EVENTS ///
    $body.on('click', '.save', async e => {
        const $parent = $(e.target).closest('.message-parent');
        const id = $parent.data('fullname');
        const replied = await getRepliedThreads();

        // Add sub to filtered subs.
        if (!replied.includes(id) && id !== null) {
            replied.push(id);
        }

        self.set('replied', replied);

        // Update UI
        $parent.addClass('has-replies');

        const $infoArea = $parent.find('.info-area');
        const numReplies = $parent.find('.entry').length - 1;
        $infoArea.text(numReplies);

        setReplied();
    });

    $body.on(
        'click',
        '.prioritylink, .alllink, .filteredlink, .repliedlink, .unreadlink, .unansweredlink, .botslink',
        e => {
            // Just unselect all, then select the caller.
            $($menuList).find('li').removeClass('selected');

            const newView = $(e.target).data('view');
            setView(newView);
        },
    );

    $body.on('click', '.collapse-all-link', () => {
        if (collapsed) {
            expandall();
        } else {
            collapseall();
        }
    });

    $body.on('click', '.tb-collapse-link', function () {
        const $this = $(this);
        const $parent = $this.closest('.message-parent');
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

            // Show all comments
            if (expandReplies) {
                $parent.find('.expand-btn:first')[0].click();
            }
        }
    });
};

self.autoLoad = function ({autoLoad}) {
    // Don't run if the page we're viewing is paginated, or if we're in the unread page.
    if (
        location.search.match(/before|after/) || location.pathname.match(/\/moderator\/(?:unread)\/?/)
        || location.pathname.match(/\/r\/?/)
    ) {
        return;
    }

    // autoload depends on notifier
    if (!TBStorage.getSetting('Notifier', 'enabled', true)) {
        return;
    }

    const delay = 5000; // Default 5 sec delay between checking for new modmail.
    const refreshLimit = 15; // Default five items per request.
    const refreshLink = $(
        '<li><a class="refresh-link tb-general-button" href="javascript:;" title="NOTE: this will only show new threads, not replies.">refresh</a></li>',
    );
    const updateURL = '/message/moderator?limit=';
    const menulist = $('.menuarea ul.flat-list:first');

    const selectedCSS = {
        'color': 'orangered',
        'font-weight': 'bold',
    };
    const unselectedCSS = {
        'color': '#369',
        'font-weight': 'normal',
    };

    // Add refresh button.
    $(refreshLink).click(() => {
        getNewThings(refreshLimit);
    });
    menulist.append($(refreshLink).prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));

    // Run RTMM.
    if (autoLoad && TBStorage.getSetting('Notifier', 'enabled', true)) {
        setInterval(() => {
            const count = TBStorage.getSetting('Notifier', 'modmailCount', 0);
            if (count > 0) {
                getNewThings(count + 2);
            }
        }, delay);
    }

    // Add new things
    function getNewThings (limit) {
        $(refreshLink).css(selectedCSS);
        TBStorage.setSetting('Notifier', 'lastSeenModmail', new Date().getTime());
        TBStorage.setSetting('Notifier', 'modmailCount', 0);

        self.log(`real time a gogo: ${limit}`);
        TBCore.addToSiteTable(updateURL + String(limit)).then(resp => {
            if (!resp) {
                return;
            }
            const $things = $(resp).find('.message-parent').hide().addClass('realtime-new');
            const $siteTable = $('#siteTable');

            $siteTable.prepend($things);
            $(refreshLink).css(unselectedCSS);
        });
    }
};

self.mailDropDowns = function () {
    const COMPOSE = 'compose-message';
    const SWITCH = 'switch-modmail';
    const composeURL = '/message/compose?to=%2Fr%2F';
    const $composeSelect = $(
        `<li><select class="compose-mail tb-action-button inline-button"><option value="${COMPOSE}">compose mod mail</option></select></li>`,
    );
    const $switchSelect = $(
        `<li><select class="switch-mail tb-action-button inline-button"><option value="${SWITCH}">switch mod mail</option></select></li>`,
    );
    const $mmpMenu = $('.mmp-menu');

    populateDropDowns();

    async function populateDropDowns () {
        $mmpMenu.append($composeSelect.prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));
        $mmpMenu.append($switchSelect.prepend('<span>&nbsp;&nbsp;&nbsp;&nbsp;</span>'));

        const mySubs = await TBCore.getModSubs(false);
        $(mySubs).each(function () {
            $('.compose-mail').append(
                $('<option>', {
                    value: this,
                }).text(this),
            );

            $('.switch-mail').append(
                $('<option>', {
                    value: this,
                }).text(this),
            );
        });

        $('.compose-mail').change(function () {
            const $this = $(this);
            const sub = $this.val();
            if (sub !== COMPOSE) {
                window.open(composeURL + $this.val());
                $(this).val(COMPOSE);
            }
        });

        $('.switch-mail').change(function () {
            const sub = $(this).val();
            if (sub !== SWITCH) {
                window.open(`/r/${sub}/message/moderator/inbox`);
                $(this).val(SWITCH);
            }
        });
    }
};

export default self;
