import $ from 'jquery';

import * as TBApi from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import * as TBHelpers from '../tbhelpers.js';
import TBListener from '../tblistener.js';
import {Module} from '../tbmodule.jsx';
import * as TBStorage from '../tbstorage.js';
import * as TBui from '../tbui.js';

const self = new Module({
    name: 'Queue Tools',
    id: 'QueueTools',
    enabledByDefault: true,
    settings: [
        {
            id: 'showActionReason',
            type: 'boolean',
            default: true,
            description:
                'Show previously taken actions next to submissions. Based on the last 500 actions in the subreddit modlog',
        },
        {
            id: 'expandActionReasonQueue',
            type: 'boolean',
            default: true,
            description: 'Automatically expand the mod action table in queues',
        },
        {
            id: 'expandReports',
            type: 'boolean',
            default: false,
            description: 'Automatically expand reports on mod pages.',
        },
        {
            id: 'queueCreature',
            type: 'selector',
            values: ['kitteh', 'puppy', '/r/babyelephantgifs', '/r/spiderbros', 'piggy', 'i have no soul'],
            default: 'kitteh',
            description: 'Queue Creature',
        },
        {
            id: 'subredditColor',
            type: 'boolean',
            default: false,
            description: 'Add a border to items in the queue with color unique to the subreddit name.',
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
            id: 'showReportReasons',
            type: 'boolean',
            default: false,
            beta: false,
            description: 'Add button to show reports on posts with ignored reports.',
        },
        //
        // Old reddit specific settings go below.
        //
        {
            id: 'autoActivate',
            type: 'boolean',
            default: true,
            description: 'Automatically activate mass queuetools on queue pages.',
            oldReddit: true,
        },
        {
            id: 'highlightNegativePosts',
            type: 'boolean',
            default: false,
            description: 'Highlight posts with a score of 0.',
            oldReddit: true,
        },
        {
            id: 'hideActionedItems',
            type: 'boolean',
            default: false,
            description: 'Hide items after mod action.',
            oldReddit: true,
        },
        {
            id: 'showAutomodActionReason',
            type: 'boolean',
            default: true,
            description: 'Show the action reason from automoderator below submissions and comments.',
            oldReddit: true,
        },
        {
            id: 'linkToQueues',
            type: 'boolean',
            default: false,
            description: 'Link to subreddit queue on mod pages.',
            oldReddit: true,
        },
        {
            id: 'reportsOrder',
            type: 'selector',
            advanced: true,
            values: ['age', 'edited', 'removed', 'score', 'reports'],
            default: 'age',
            description:
                'Sort by. Note that "edited" and "removed" includes the post time if there is no edit or removal time.',
            oldReddit: true,
        },
        {
            id: 'reportsThreshold',
            type: 'number',
            advanced: true,
            min: 0,
            max: null,
            step: 1,
            default: 0,
            description: 'Reports threshold.',
            oldReddit: true,
        },
        {
            id: 'reportsAscending',
            type: 'boolean',
            advanced: true,
            default: false,
            description: 'Sort ascending.',
            oldReddit: true,
        },
        {
            id: 'botCheckmark',
            type: 'list',
            default: ['AutoModerator'],
            description:
                `Make bot approved checkmarks have a different look <img src="data:image/png;base64,${TBui.iconBot}">. Bot names should be entered separated by a comma without spaces and are case sensitive.`,
            oldReddit: true,
        },
        {
            id: 'highlightAutomodMatches',
            type: 'boolean',
            default: true,
            beta: false,
            description:
                'Highlight words in Automoderator report and action reasons which are enclosed in []. Can be used to highlight automod regex matches.',
            oldReddit: true,
        },
        {
            id: 'groupCommentsOnModPage',
            type: 'boolean',
            default: false,
            advanced: true,
            description: 'Group comments by their parent submission when viewing mod listings.',
            oldReddit: true,
        },
    ],
}, init);

self.queuetoolsOld = function ({
    autoActivate,
    highlightNegativePosts,
    hideActionedItems,
    showAutomodActionReason,
    linkToQueues,
    subredditColor,
    subredditColorSalt,
    queueCreature,
    highlightAutomodMatches,
    groupCommentsOnModPage,
    botCheckmark,
    reportsOrder,
    reportsAscending,
    reportsThreshold,
    expandReports,
}) {
    const $body = $('body');

    // var SPAM_REPORT_SUB = 'spam', QUEUE_URL = '';
    let QUEUE_URL = '';

    if (linkToQueues) {
        if (TBCore.isModQueuePage) {
            QUEUE_URL = 'about/modqueue/';
        } else if (TBCore.isUnmoderatedPage) {
            QUEUE_URL = 'about/unmoderated/';
        }
    }

    const $noResults = $body.find('p#noresults');
    if (TBCore.isModpage && queueCreature !== 'i_have_no_soul' && $noResults.length > 0) {
        self.log(queueCreature);
        if (queueCreature === 'puppy') {
            $noResults.addClass('tb-puppy-old');
        } else if (queueCreature === 'kitteh') {
            $noResults.addClass('tb-kitteh-old');
        } else if (queueCreature === '/r/babyelephantgifs') {
            $noResults.addClass('tb-begifs-old');
        } else if (queueCreature === '/r/spiderbros') {
            $noResults.addClass('tb-spiders-old');
        } else if (queueCreature === 'piggy') {
            // https://www.flickr.com/photos/michaelcr/5797087585
            $noResults.addClass('tb-piggy-old');
        }
    }

    async function colorSubreddits () {
        const $this = $(this);
        const subredditName = TBHelpers.cleanSubredditName($this.find('a.subreddit').text());

        $this.addClass('color-processed');

        const isMod = await TBCore.isModSub(subredditName);
        if (!isMod) {
            return;
        }

        const colorForSub = TBHelpers.stringToColor(subredditName + subredditColorSalt);
        $this.attr('style', `border-left: solid 3px ${colorForSub} !important`);
        $this.addClass('tb-subreddit-color');
    }

    if (subredditColor) {
        self.log('adding sub colors');
        $('.thing').each(colorSubreddits);
    }

    // Negative post highlighting
    function highlightBadPosts () {
        const $this = $(this);
        $this.addClass('highlight-processed');
        let score = $this.find('.likes .score.likes, .unvoted .score.unvoted, .dislikes .score.dislikes').text();
        score = /\d+/.test(score) ? parseInt(score) : 1; // If the score is still hidden, we'll assume it's fine
        if (score > 0) {
            return;
        }
        $this.addClass('tb-zero-highlight');
    }
    if (highlightNegativePosts && TBCore.isModpage) {
        $('.thing').not('.highlight-processed').each(highlightBadPosts);
    }

    // NER for these things.
    window.addEventListener('TBNewThings', () => {
        if (subredditColor) {
            self.log('adding sub colors (ner)');
            $('.thing').not('.color-processed').each(colorSubreddits);
        }
        if (highlightNegativePosts && TBCore.isModpage) {
            self.log('adding zero-score highlights');
            $('.thing').not('.highlight-processed').each(highlightBadPosts);
        }
        if (TBCore.isModpage && highlightAutomodMatches) {
            highlightedMatches();
        }
    });

    // Add modtools buttons to page.
    function addModtools () {
        let listingOrder = reportsOrder;
        let allSelected = false;
        let sortAscending = reportsAscending;

        const numberRX = /-?\d+/;
        const viewingspam = !!location.pathname.match(/\/about\/(spam|trials)/);
        const viewingreports = !!location.pathname.match(/\/about\/reports/);
        const EXPAND_TITLE = 'expand reports';
        const COLLAPSE_TITLE = 'collapse reports';

        if (viewingspam && listingOrder === 'reports') {
            listingOrder = 'removed';
        }

        // Get rid of promoted links & thing rankings
        $('#siteTable_promoted,#siteTable_organic,.rank').remove();

        // remove stuff we can't moderate (in non-mod queues only)
        function removeUnmoddable () {
            if (!TBCore.isModpage && !TBCore.isSubCommentsPage) {
                $('.thing').each(async function () {
                    const $thing = $(this);
                    const $sub = $thing.find('.subreddit');

                    // Remove if the sub isn't moderated
                    if ($sub.length > 0) {
                        const sub = TBHelpers.cleanSubredditName($sub.text());
                        const isMod = await TBCore.isModSub(sub);
                        if (!isMod) {
                            $thing.remove();
                        }
                    } else if ($thing.find('.parent').text().endsWith('[promoted post]')) {
                        // Always remove things like sponsored links (can't mod those)
                        $thing.remove();
                    }
                });
            }
        }

        removeUnmoddable();

        $body.find('.modtools-on').parent().remove();

        // Make visible any collapsed things (stuff below /prefs/ threshold)
        $('.entry .collapsed:visible a.expand:contains("[+]")').click();

        // Add checkboxes, tabs, menu, etc
        $('#siteTable').before(`
    <div class="modtools-duplicate" style="display: none; visibility: hidden;"></div>
    <div class="menuarea modtools" style="padding: 5px 0;margin: 5px 0;top: 0px">
        <input style="margin:5px;float:left" title="Select all/none" type="checkbox" id="select-all" title="select all/none"/>
        <span>
            <a href="javascript:;" class="tb-general-button invert inoffensive" accesskey="I" title="invert selection">invert</a>
            <a href="javascript:;" class="tb-general-button open-expandos inoffensive" title="toggle all expando boxes">[+]</a>
            <a href="javascript:;" class="tb-general-button inoffensive select"> [select...]</a>
            &nbsp;
            <a href="javascript:;" class="tb-general-button inoffensive unhide-selected" accesskey="U">unhide&nbsp;all</a>
            <a href="javascript:;" class="tb-general-button inoffensive hide-selected"   accesskey="H">hide&nbsp;selected</a>
            <a href="javascript:;" class="tb-general-button inoffensive toggle-reports"  >${EXPAND_TITLE}</a>
            <a href="javascript:;" class="pretty-button action negative" accesskey="S" type="negative" tabindex="3">spam&nbsp;selected</a>
            <a href="javascript:;" class="pretty-button action neutral"  accesskey="R" type="neutral"  tabindex="4">remove&nbsp;selected</a>
            <a href="javascript:;" class="pretty-button action positive" accesskey="A" type="positive" tabindex="5">approve&nbsp;selected</a>
            <a href="javascript:;" class="pretty-button action ignore" accesskey="G" type="ignore" tabindex="6">ignore&nbsp;reports&nbsp;on&nbsp;selected</a>
        </span>
        ${
            viewingspam
                ? ''
                : `<span><a><label for="modtab-threshold">Report threshold: </label><input id="modtab-threshold" type="number" min="0" value="${reportsThreshold}" /></a></span>`
        }
        <span class="dropdown-title lightdrop" style="float:right"> sort:
            <div class="tb-dropdown lightdrop">
                <span class="selected sortorder">${listingOrder}</span>
            </div>
            <div class="tb-drop-choices lightdrop sortorder-options">
                    <a class="choice" href="javascript:;">age</a>
                    <a class="choice" href="javascript:;">edited</a>
                    <a class="choice" href="javascript:;">removed</a>
                    ${viewingspam ? '' : '<a class="choice" href="javascript:;">reports</a>'}
                    <a class="choice" href="javascript:;">score</a>
            </div>
        </span>
    </div>`);

        const $closePopup = () => {};

        $body.on('click', '.tb-general-button.select', function (event) {
            // close popup if it exists
            $closePopup();
            const $this = $(this);
            const $overlay = $this.closest('.tb-page-overlay');
            const positions = TBui.drawPosition(event);
            let $appendTo;
            if ($overlay.length) {
                $appendTo = $overlay;
            } else {
                $appendTo = $('body');
            }
            const popupSelectContent = `
                <div class="lightdrop select-options">
                    <h2>Types</h2>
                    ${
                viewingreports
                    ? ''
                    : `<p><label><input type="checkbox" class="choice inoffensive" name="banned" /> shadow-banned</label></p>
                    <p><label><input type="checkbox" class="choice inoffensive" name="filtered"/> spam-filtered</label></p>
                    ${
                        viewingspam
                            ? ''
                            : '<p><label><input type="checkbox" class="choice inoffensive" name="reported"/> reported</label></p>'
                    }`
            }
                    <p><label><input type="checkbox" class="choice" name="comments" /> comments</label></p>
                    <p><label><input type="checkbox" class="choice" name="links" /> submissions</label></p>
                    <p><label><input type="checkbox" class="choice" name="self" /> text posts</label></p>
                    <p><label><input type="checkbox" class="choice" name="flair" /> posts with flair</label></p>

                    <p class="divider"><input type="text" class="choice tb-input" name="domain" placeholder="domain..." /></p>
                    <p><input type="text" class="choice tb-input" name="user" placeholder="user..." /></p>
                    <p><input type="text" class="choice tb-input" name="title" placeholder="title..." /></p>
                    <p><input type="text" class="choice tb-input" name="subreddit" placeholder="subreddit..." /></p>

                    <h2 class="divider">Conditional</h2>
                    <p><input type="text" class="choice tb-input" name="pointsgt" placeholder="points >..." /></p>
                    <p><input type="text" class="choice tb-input" name="pointslt" placeholder="points <..." /></p>

                    <h2 class="divider">Acted on</h2>
                    <p><label><input type="checkbox" class="choice dashed" name="spammed"/> [ spammed ]</label></p>
                    <p><label><input type="checkbox" class="choice" name="removed" /> [ removed ]</label></p>
                    <p><label><input type="checkbox" class="choice" name="approved" /> [ approved ]</label></p>
                    <p><label><input type="checkbox" class="choice" name="ignored" /> [ reports ignored ]</label></p>
                    <p><label><input type="checkbox" class="choice" name="actioned" /> [ actioned ]</label></p>
                </div>`;

            TBui.popup({
                title: 'Select items',
                tabs: [
                    {
                        title: 'Tab1',
                        tooltip: 'NA',
                        content: popupSelectContent,
                        footer: TBui.actionButton('Select items', 'select-queue-tools'),
                    },
                ],
                cssClass: 'queuetools-select-popup',
                draggable: true,
            }).appendTo($appendTo)
                .css({
                    left: positions.leftPosition,
                    top: positions.topPosition,
                    display: 'block',
                });
        });

        $body.on('click', '.tb-dropdown:not(.active)', e => {
            e.stopPropagation();
            const $element = $(e.currentTarget);
            $element.addClass('active');
            $element.siblings('.tb-drop-choices').not('.inuse').css('top', `${e.offsetHeight}px`).each(function () {
                $(this).css('left', `${$element.position().left}px`).css(
                    'top',
                    `${$element.height() + $element.position().top}px`,
                );
            }).addClass('inuse');
        });

        $body.on('click', () => {
            $body.find('.tb-dropdown.active').removeClass('active');
            $body.find('.tb-drop-choices.inuse').removeClass('inuse');
        });
        // Check if the tab menu exists and create it if it doesn't
        $('.thing.link, .thing.comment').prepend(
            '<input type="checkbox" tabindex="1" style="margin:5px;float:left;" />',
        );
        $('.buttons .pretty-button').attr('tabindex', '2');

        // add class to processed threads.
        const $things = $('.thing');
        $things.addClass('mte-processed');

        if (expandReports) {
            const $toggleReports = $('.toggle-reports');
            $toggleReports.addClass('expanded');
            $toggleReports.text(COLLAPSE_TITLE);

            $('.reported-stamp').siblings('.report-reasons').show();
        }

        // Add context & history stuff TODO: Figure out what the hell this did. History has been moved to historybutton though.

        // $body.append('<div class="pretty-button inline-content" style="z-index:9999;display:none;position:absolute;line-height:12px;min-width:100px"/>');
        // $('#siteTable .comment .flat-list.buttons:has( a:contains("parent"))').each(function () {
        //   $(this).prepend('<li><a class="context" href="' + $(this).find('.first .bylink').attr('href') + '?context=2">context</a></li>');
        // });

        // Fix the position of the modtools. We do it like this so we can support custom css
        const $modtoolsMenu = $body.find('.menuarea.modtools');
        const $modtoolsMenuDuplicate = $body.find('.modtools-duplicate');
        const offset = $modtoolsMenu.offset();
        const offsetTop = offset.top;
        const offsetSticky = offset.left;
        const rightPosition = $('.side').outerWidth() + 10;

        $modtoolsMenu.css({
            'margin-right': `${rightPosition}px`,
            'margin-left': '5px',
            'left': '0',
            'margin-top': '0',
            'position': 'relative',
            'padding-top': '9px',
        });

        let frame = null;
        window.addEventListener('scroll', () => {
            let position = 'relative';
            const modtoolsHeight = $modtoolsMenu.outerHeight(true);
            if (frame) {
                cancelAnimationFrame(frame);
            }
            if (window.scrollY + offsetSticky > offsetTop) {
                position = 'fixed';
            } else {
                position = 'relative';
            }
            frame = requestAnimationFrame(() => {
                $modtoolsMenu.css({
                    left: position === 'fixed' ? offsetSticky : 0,
                    right: position === 'fixed' ? offsetSticky : 0,
                    top: position === 'fixed' ? offsetSticky : 0,
                    position,
                });
                $modtoolsMenuDuplicate.css({
                    display: position === 'fixed' ? 'block' : 'none',
                    height: modtoolsHeight,
                });
            });
        });

        // // Button actions ////
        // Select thing when clicked
        const noAction = ['A', 'INPUT', 'TEXTAREA', 'BUTTON', 'IMG'];
        $body.on('click', '.thing .entry', function (e) {
            if (noAction.indexOf(e.target.nodeName) + 1) {
                return;
            }

            self.log('thing selected.');
            $(this).parent('.thing').find('input[type=checkbox]:first').click();
        });

        // NB: the reason both the above method and the next one use .click() instead of .prop() is so they act as a toggle
        // when the report button is pressed. See https://github.com/toolbox-team/reddit-moderator-toolbox/issues/421
        // This way, if it was already checked by the user, the following call will re-check it.  If it wasn't
        // the following call will uncheck it.

        $body.on('click', '.reported-stamp', function () {
            self.log('reports selected.');
            $(this).closest('.thing').find('input[type=checkbox]:first').click();
        });

        // Change sort order
        $('.sortorder-options a').click(function () {
            const $sortOrder = $('.sortorder');
            const order = $(this).text();
            const toggleAsc = order === $sortOrder.text();

            if (toggleAsc) {
                sortAscending = !sortAscending;
            }

            self.set('reportsAscending', sortAscending);
            self.set('reportsOrder', order);

            $sortOrder.text(order);
            sortThings(order, sortAscending);
        });

        // Invert all the things.
        $('.invert').click(() => {
            $('.thing:visible input[type=checkbox]').click();
        });

        // Select / deselect all the things
        $('#select-all').click(function () {
            $('.thing:visible input[type=checkbox]').prop('checked', allSelected = this.checked);
        });

        $body.on('click', '.thing input[type=checkbox]', () => {
            const checks = $('.thing:visible input[type=checkbox]');
            const selected = checks.filter(':checked').length;
            allSelected = !checks.not(':checked').length;
            $('#select-all').prop({
                indeterminate: !!selected && !allSelected,
                checked: allSelected,
            });
        });

        // Select/deselect certain things
        $body.on('click', '.select-queue-tools', () => {
            // reset
            const $things = $('.thing:visible');
            const $selectOptions = $('.select-options input').filter((_, el) =>
                el.type === 'checkbox' && el.checked || el.type === 'text' && el.value.length
            );
            $things.find('input[type=checkbox]').prop('checked', false);
            function selectThings () {
                const $this = $(this);
                let shouldSelect = null;
                $selectOptions.each((_, el) => {
                    let selector = '';
                    let min;
                    let max;
                    switch (el.name) {
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
                            selector =
                                '.spammed,:has(.pretty-button.negative.pressed),:has(.remove-button:contains(spammed))';
                            break;
                        case 'removed':
                            selector =
                                '.removed,:has(.pretty-button.neutral.pressed),:has(.remove-button:contains(removed))';
                            break;
                        case 'approved':
                            selector =
                                '.approved,:has(.approval-checkmark,.pretty-button.positive.pressed),:has(.approve-button:contains(approved))';
                            break;
                        case 'ignored':
                            selector = ':has(.pretty-button.pressed[data-event-action*="ignorereports"])'; // could be "ignorereports" or "unignorereports", hence the *=
                            break;
                        case 'actioned':
                            selector =
                                `.flaired,.approved,.removed,.spammed,:has(.approval-checkmark,.pretty-button.pressed),
                                    :has(.remove-button:contains(spammed)),:has(.remove-button:contains(removed)),:has(.approve-button:contains(approved))`;
                            break;
                        case 'domain':
                            selector = `:has(.domain:contains(${el.value.toLowerCase()}))`;
                            break;
                        case 'user':
                            selector = `:has(.author:contains(${el.value}))`;
                            break;
                        case 'title':
                            selector = `:has(a.title:contains(${el.value}))`;
                            break;
                        case 'subreddit':
                            selector = `:has(a.subreddit:contains(${el.value}))`;
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
                        case 'pointsgt':
                            min = parseInt(el.value);
                            selector = (_, el) => $(el).find('.score.unvoted').attr('title') > min;
                            break;
                        case 'pointslt':
                            max = parseInt(el.value);
                            selector = (_, el) => $(el).find('.score.unvoted').attr('title') < max;
                            break;
                    }
                    shouldSelect = $this.is(selector);
                    return shouldSelect !== false;
                });
                return shouldSelect;
            }
            $things.filter(selectThings).find('input[type=checkbox]').prop('checked', true);
            $closePopup();
        });

        $('.hide-selected').click(() => {
            $('.thing:visible:has(input:checked)').hide();
            $('.thing input[type=checkbox]').prop('checked', false);
        });

        $('.unhide-selected').click(() => {
            $('.thing').show();
        });

        // Expand reports on click.
        $('.toggle-reports').click(function () {
            const $this = $(this);

            if ($this.hasClass('expanded')) {
                $this.removeClass('expanded');
                $this.text(EXPAND_TITLE);
                $('.reported-stamp').siblings('.report-reasons').hide();
            } else {
                $this.addClass('expanded');
                $this.text(COLLAPSE_TITLE);
                $('.reported-stamp').siblings('.report-reasons').show();
            }
        });

        // Mass spam/remove/approve/ignore
        $('.pretty-button.action').click(function () {
            const approve = this.type === 'positive';
            const spam = !approve && this.type === 'negative';
            const ignore = this.type === 'ignore';

            // Apply action
            const $actioned = $('.thing:visible > input:checked').parent().each(function () {
                const id = $(this).attr('data-fullname');

                if (approve) {
                    TBApi.approveThing(id).then(() => {
                        TBCore.sendEvent(TBCore.events.TB_APPROVE_THING);
                    });
                } else if (ignore) {
                    TBApi.ignoreReports(id);
                } else {
                    TBApi.removeThing(id, spam);
                }
            });
            $actioned.css('opacity', '1');
            $actioned.removeClass('flaired spammed removed approved');
            $actioned.addClass(approve ? 'approved' : spam ? 'spammed' : 'removed');

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
            const $this = $(this);
            const $thing = $this.closest('.thing');

            $thing.find('input[type=checkbox]').prop('checked', false);
            if (hideActionedItems) {
                self.log('hiding item');
                $thing.hide();
            } else if ($this.hasClass('negative')) {
                $thing.removeClass('removed approved');
                $thing.addClass('spammed');
            } else if ($this.hasClass('neutral')) {
                $thing.removeClass('spammed approved');
                $thing.addClass('removed');
            } else if ($this.hasClass('positive')) {
                $thing.removeClass('removed spammed');
                $thing.addClass('approved');
            }
        });

        // Set reports threshold (hide reports with less than X reports)
        $('#modtab-threshold').on('input', function (e) {
            e.preventDefault();

            const threshold = +$(this).val();
            if (isNaN(threshold)) {
                return;
            }

            $(this).val(threshold);
            self.set('reportsThreshold', threshold);

            const $allThings = $('.thing');
            setThreshold($allThings);
        });

        function setThreshold (things) {
            const threshold = reportsThreshold;
            things.show().find('.reported-stamp').text(function (_, str) {
                if (str.match(/\d+/) < threshold) {
                    $(this).closest('.thing').hide();
                }
            });
            // treat modqueue entries without .reported-stamp as 0 reports
            if (threshold > 0) {
                things.not(':has(.reported-stamp)').hide();
            }
        }

        if (!viewingspam) {
            setThreshold($things);
        }

        function replaceSubLinks () {
            const $this = $(this).find('a.subreddit');
            const href = $this.attr('href') + QUEUE_URL;
            $this.attr('href', href);
        }

        if (linkToQueues && QUEUE_URL) {
            $things.each(replaceSubLinks);
        }

        // NER support.
        window.addEventListener('TBNewThings', () => {
            self.log('proc new things');
            const things = $('.thing').not('.mte-processed');

            processNewThings(things);
        });

        // Toggle all expando boxes
        let expandosOpen = false;
        $('.open-expandos').on('click', () => {
            if (!expandosOpen) {
                self.log('expanding all expandos.');

                $('.open-expandos').text('[-]');
                $('.expando-button.collapsed').each(function (index) {
                    const $button = $(this);
                    const $checkBox = $button.closest('.thing').find('input[type=checkbox]');

                    setTimeout(() => {
                        $button.click();
                        $checkBox.prop('checked', false);
                    }, index * 1000);
                });
                expandosOpen = true;
            } else {
                self.log('collapsing all expandos.');

                $('.open-expandos').text('[+]');
                $('.expando-button.expanded').each(function () {
                    const $button = $(this);
                    const $checkBox = $button.closest('.thing').find('input[type=checkbox]');

                    $button.click();
                    $checkBox.prop('checked', false);
                });
                expandosOpen = false;
            }
        });

        // Process new things loaded by RES or flowwit.
        function processNewThings (things) {
            // Expand reports on the new page, we leave the ones the user might already has collapsed alone.
            if (expandReports) {
                $(things).find('.reported-stamp').siblings('.report-reasons').show();
            }
            // add class to processed threads.
            $(things).addClass('mte-processed');

            $(things).prepend(
                `<input type="checkbox" tabindex="2" style="margin:5px;float:left;"${allSelected ? ' checked' : ''} />`,
            ).find('.collapsed:visible a.expand:contains("[+]")').click().end().find('.userattrs').end().find(
                '.userattrs',
            ).filter('.comment').find('.flat-list.buttons:has( a:contains("parent"))').each(function () {
                $(this).prepend(
                    `<li><a class="context" href="${
                        $(this).find('.first .bylink').attr('href')
                    }?context=2">context</a></li>`,
                );
            });
            if (expandosOpen) {
                $(things).find('.expando-button.collapsed').click();
            }
            if (!viewingspam) {
                setThreshold(things);
            }
            if (linkToQueues && QUEUE_URL) {
                $(things).each(replaceSubLinks);
            }

            removeUnmoddable();
        }

        // Remove rate limit for expandos,removing,approving
        const rate_limit = window.rate_limit;
        window.rate_limit = function (action) {
            if (action === 'expando' || action === 'remove' || action === 'approve') {
                return !1;
            }
            return rate_limit(action);
        };

        // sort sidebars
        if (TBCore.isModFakereddit) {
            $('.sidecontentbox:has(.subscription-box) > .title').append(
                '&nbsp;<a href="javascript:;" class="tb-sort-subs">sort by items</a>',
            );
        }

        $body.on('click', '.tb-sort-subs', () => {
            let prefix = '';
            let page = '';
            if (TBCore.isUnmoderatedPage) {
                self.log('sorting unmod');
                prefix = 'umq-';
                page = 'unmoderated';
            } else if (TBCore.isModQueuePage) {
                self.log('sorting mod queue');
                prefix = 'mq-';
                page = 'modqueue';
            } else {
                return;
            }

            self.log('sorting queue sidebar');

            $('.tb-subreddit-item-count').remove();

            const $sortButton = $('.tb-sort-subs');
            $sortButton.html('sorting...');
            $sortButton.css({'padding-left': '17px', 'padding-right': '16px'});

            const now = TBHelpers.getTime();
            // delay = 0,
            const modSubs = [];

            TBui.longLoadNonPersistent(true, 'Getting subreddit items...', TBui.FEEDBACK_NEUTRAL);

            TBCore.forEachChunked(
                $('.subscription-box a.title'),
                20,
                100,
                elem => {
                    const $elem = $(elem);
                    const sr = $elem.text();

                    TBStorage.getCache('QueueTools', `${prefix + TBApi.getCurrentUser()}-${sr}`, '[0,0]').then(
                        cacheData => {
                            const data = JSON.parse(cacheData);

                            modSubs.push(sr);
                            TBui.textFeedback(
                                `Getting items for: ${sr}`,
                                TBui.FEEDBACK_POSITIVE,
                                null,
                                TBui.DISPLAY_BOTTOM,
                            );

                            // Update count and re-cache data if more than an hour old.
                            $elem.parent().append(
                                `<a href="${TBCore.link(`/r/${sr}/about/${page}`)}" count="${
                                    data[0]
                                }" class="tb-subreddit-item-count">${data[0]}</a>`,
                            );
                            if (now > data[1]) {
                                updateModqueueCount(sr);
                            }

                            function updateModqueueCount (sr) {
                                TBApi.getJSON(`/r/${sr}/about/${page}.json?limit=100`).then(d => {
                                    TBStorage.purifyObject(d);
                                    const items = d.data.children.length;
                                    self.log(`  subreddit: ${sr} items: ${items}`);
                                    TBStorage.setCache(
                                        'QueueTools',
                                        `${prefix + TBApi.getCurrentUser()}-${sr}`,
                                        `[${items},${new Date().valueOf()}]`,
                                    );
                                    $(`.subscription-box a[href$="/r/${sr}/about/${page}"]`).text(
                                        d.data.children.length,
                                    ).attr('count', d.data.children.length);
                                });
                            }
                        },
                    );
                },
                () => {
                    window.setTimeout(sortSubreddits, 2000); // wait for final callbacks
                    TBui.longLoadNonPersistent(false, 'Sorting sidebar...', TBui.FEEDBACK_NEUTRAL);
                    $sortButton.html('sort by items');
                    $sortButton.css({'padding-left': '', 'padding-right': ''});
                },
            );

            function sortSubreddits () {
                const subs = $('.subscription-box li').sort((a, b) =>
                    b.lastChild.textContent - a.lastChild.textContent
                    || +(a.firstChild.nextSibling.textContent.toLowerCase()
                        > b.firstChild.nextSibling.textContent.toLowerCase())
                    || -1
                );
                $('.subscription-box').empty().append(subs);
            }
        });

        // This method is evil and breaks shit if it's called too early.
        function sortThings (order, asc) {
            const $sitetable = $('#siteTable');
            const things = $('#siteTable .thing').sort((a, b) => {
                let A;
                let B;
                if (asc) {
                    A = a;
                    B = b;
                } else {
                    A = b;
                    B = a;
                }

                // Note: for default timestamps `live-timestamp` would be the proper class but this can't always be relied on.
                const defaultTimestampSelector = '.tagline time:not(.edited-timestamp):first';
                const editedTimestampSelector = 'time.edited-timestamp:first';

                const $A = $(A);
                const $B = $(B);
                switch (order) {
                    case 'age':
                    default: // just in case
                    {
                        const timeA = new Date($A.find(defaultTimestampSelector).attr('datetime')).getTime();
                        const timeB = new Date($B.find(defaultTimestampSelector).attr('datetime')).getTime();
                        return timeA - timeB;
                    }
                    case 'edited': {
                        const $aEditElement = $A.find(editedTimestampSelector).length
                            ? $A.find(editedTimestampSelector)
                            : $A.find(defaultTimestampSelector);
                        const $bEditElement = $B.find(editedTimestampSelector).length
                            ? $B.find(editedTimestampSelector)
                            : $B.find(defaultTimestampSelector);
                        const timeEditA = new Date($aEditElement.attr('datetime')).getTime();
                        const timeEditB = new Date($bEditElement.attr('datetime')).getTime();
                        return timeEditA - timeEditB;
                    }
                    case 'removed': {
                        const $aRemoveElement = $A.find('li[title^="removed at"]').length
                            ? $A.find('li[title^="removed at"]')
                            : $A.find(defaultTimestampSelector);
                        const $bRemoveElement = $B.find('li[title^="removed at"]').length
                            ? $B.find('li[title^="removed at"]')
                            : $B.find(defaultTimestampSelector);

                        let timeRemoveA;
                        let timeRemoveB;

                        if ($aRemoveElement.is('time')) {
                            timeRemoveA = $aRemoveElement.attr('datetime');
                        } else {
                            timeRemoveA = $aRemoveElement.attr('title');
                            timeRemoveA = timeRemoveA.replace('removed at ', '');
                        }

                        if ($bRemoveElement.is('time')) {
                            timeRemoveB = $bRemoveElement.attr('datetime');
                        } else {
                            timeRemoveB = $bRemoveElement.attr('title');
                            timeRemoveB = timeRemoveB.replace('removed at ', '');
                        }

                        const timeStampRemoveA = new Date(timeRemoveA).getTime();
                        const timeStampRemoveB = new Date(timeRemoveB).getTime();

                        return timeStampRemoveA - timeStampRemoveB;
                    }
                    case 'score': {
                        const scoreA = $A.find('.score:visible').attr('title');
                        const scoreB = $B.find('.score:visible').attr('title');
                        // implicit conversion string to number
                        return scoreA - scoreB;
                    }
                    case 'reports': {
                        const reportsA = $A.find('.reported-stamp').text().match(numberRX);
                        const reportsB = $B.find('.reported-stamp').text().match(numberRX);
                        return reportsA - reportsB;
                    }
                }
            });
            $sitetable.find('.thing').remove();
            $sitetable.prepend(things);

            // Re-group things every time the page is re-sorted
            if (TBCore.isModpage && groupCommentsOnModPage) {
                groupThings();
            }
        }

        sortThings(listingOrder, sortAscending);

        // After things are sorted in the proper order, we can group them by
        // thread. this function is a bit of a mess
        // TODO: fix that
        function groupThings () {
            const threadGroups = {};
            const threadIDs = []; // because who needs Object.keys() anyway

            // Sorting leaves behind the extra wrappers, so clean them up
            $('.sitetable .tb-comment-group').remove();

            // Save a copy of each link/comment and record its parent thread ID
            $('.sitetable .thing').each(function () {
                const $thing = $(this);
                let threadID;
                if ($thing.hasClass('comment')) {
                    // Find ID of the parent submission from title URL
                    threadID =
                        $thing.find('.flat-list.buttons .first a').attr('href').match(/\/comments\/([a-z0-9]+)\//)[1];
                } else {
                    // I am the parent submission, so get my own ID
                    // TBCore.getThingInfo() is overkill here
                    threadID = $thing.attr('data-fullname').replace('t3_', '');
                }
                // Only record thread IDs once each
                if (threadIDs.indexOf(threadID) < 0) {
                    threadIDs.push(threadID);
                }
                // Store the element itself so we can move it around later
                if (!threadGroups[threadID]) {
                    threadGroups[threadID] = [];
                }
                threadGroups[threadID].push($thing);
            });

            // Create wrapper elements for each thread ID. Each wrapper will
            // contain all the comments on a link, and maybe the link itself.
            // TODO: Using wrappers is probably a bad call unless we want to
            //       give groups custom CSS
            threadIDs.forEach(id => {
                // Each wrapper will contain all the things associated with
                // a single submission, including the submission itself
                const $wrapper = $('<div>').addClass('tb-comment-group').attr('data-id', id);
                $('#siteTable').append($wrapper);
                // Loop through each thing associated with the submission
                threadGroups[id].forEach(item => {
                    // Add the thing to this wrapper
                    item.appendTo($wrapper);
                });
                // Visual separation
                $wrapper.append($('<hr />'));
            });
        }
    }

    if (
        $body.hasClass('listing-page') || $body.hasClass('comments-page') || $body.hasClass('search-page')
        || TBCore.isModpage && (!TBCore.post_site || TBCore.isMod)
    ) {
        $('.tabmenu').first().append(
            $('<li class="tb-queuetools-tab"><a href="javascript:;" accesskey="M" class="modtools-on">queue tools</a></li>')
                .click(addModtools),
        );
    }

    // Add mod tools or mod tools toggle button if applicable
    if (TBCore.isModpage && autoActivate) {
        addModtools();
    }

    // Show automod action reasons
    // Highlight trigger words, do the same for reports

    // Regex is used in multiple functions
    const regexMatchFinder = /\[(.*?)\]/g;
    const highlightEnabled = TBStorage.getSetting('Comments', 'highlighted', []);
    function getAutomodActionReason (sub) {
        self.log(sub);
        TBApi.getJSON(`/r/${sub}/about/log/.json?limit=500&mod=AutoModerator`).then(json => {
            TBStorage.purifyObject(json);
            json.data.children.forEach(value => {
                const actionReasonText = value.data.details;
                const targetFullName = value.data.target_fullname;

                $body.find(`.thing[data-fullname="${targetFullName}"]>.entry`).after(`<div class="action-reason">
<b>Automod action:</b> ${actionReasonText}
<br><a href="https://www.reddit.com/message/compose?to=/r/${sub}&subject=Automoderator second opinion&message=I would like a second opinion about something automod filtered
%0A%0A
Url: ${value.data.target_permalink} %0A %0A
Action reason: ${value.data.details}
" target="_blank">ask for a second opinion in modmail</a> </div>`);

                if (highlightAutomodMatches) {
                    let matches;
                    const matchesArray = [];
                    while ((matches = regexMatchFinder.exec(actionReasonText))) {
                        matchesArray.push(matches[1]);
                    }

                    // We want the two highlight methods to play nice.
                    // If the general one is enabled we switch it of for a second to first apply the match and then the general one again

                    if (highlightEnabled.length > 0) {
                        $body.find(`.thing[data-fullname="${targetFullName}"] .md`).removeHighlight();
                        $body.find(`.thing[data-fullname="${targetFullName}"] .md`).highlight(matchesArray, '', true);
                        $body.find(`.thing[data-fullname="${targetFullName}"] .md`).highlight(highlightEnabled);
                    } else {
                        $body.find(`.thing[data-fullname="${targetFullName}"] .md`).highlight(matchesArray, '', true);
                    }
                }
            });
        });
    }

    if (TBCore.isMod && TBCore.isCommentsPage && showAutomodActionReason && $('.thing.spam').length) {
        const currentSubreddit = $('.side .titlebox h1.redditname a').text();

        getAutomodActionReason(currentSubreddit);
    }

    function highlightedMatches () {
        $('.report-reasons .mod-report').each(function () {
            const $this = $(this);
            if (!$this.hasClass('hl-processed')) {
                $this.addClass('hl-processed');
                const reportText = $this.text();
                if (reportText.indexOf('AutoModerator:') >= 0) {
                    let matches;
                    const matchesArray = [];
                    while ((matches = regexMatchFinder.exec(reportText))) {
                        matchesArray.push(matches[1]);
                    }

                    if (highlightEnabled.length > 0) {
                        $this.closest('.thing').find('a.title').removeHighlight();
                        $this.closest('.thing').find('a.title').highlight(matchesArray, '', true);
                        $this.closest('.thing').find('a.title').highlight(highlightEnabled);

                        $this.closest('.thing').find('.md').removeHighlight();
                        $this.closest('.thing').find('.md').highlight(matchesArray, '', true);
                        $this.closest('.thing').find('.md').highlight(highlightEnabled);
                    } else {
                        $this.closest('.thing').find('a.title').highlight(matchesArray, '', true);
                        $this.closest('.thing').find('.md').highlight(matchesArray, '', true);
                    }
                }
            }
        });
    }

    if (TBCore.isModpage && highlightAutomodMatches) {
        highlightedMatches();
        // highlight matches if text posts expand
        document.addEventListener('tbNewExpando', e => {
            const $target = $(e.target);
            $target.parent().find('.hl-processed').removeClass('hl-processed');
            highlightedMatches();
        }, true);
    }

    if (TBCore.isModpage && showAutomodActionReason) {
        const queueSubs = [];

        self.log('getting automod action reasons');

        $('#siteTable .thing').each(function () {
            const $this = $(this);
            const subreddit = TBHelpers.cleanSubredditName($this.find('a.subreddit').text());
            const removedBy = $this.find('.flat-list li[title]').text();

            self.log(`  subreddit: ${subreddit}`);
            self.log(`  removedby: ${removedBy}`);

            if (!queueSubs.includes(subreddit) && removedBy === '[ removed by AutoModerator (remove not spam) ]') {
                queueSubs.push(subreddit);
            }
        });

        self.log('queuesubs:');
        self.log(queueSubs);

        for (let i = 0; i < queueSubs.length; i++) {
            const sub = queueSubs[i];

            getAutomodActionReason(sub);
        }
    }

    // Let's make bot approved posts stand out!
    const selectors = botCheckmark.map(bot => `img.approval-checkmark[title*="approved by ${bot}"]`);
    if (selectors.length && TBCore.isMod) {
        $('head').append(`
                <style>
                    ${selectors.join(',')} {
                        display: inline-block;
                        padding-left: 16px;
                        padding-top: 5px;
                        background-image: url("data:image/png;base64,${TBui.iconBot}");
                        background-repeat: no-repeat;
                    }
                </style>
            `);
    }
};

function init (options) {
    if (TBCore.isOldReddit) {
        self.queuetoolsOld(options);
    }
    const $body = $('body');
    const modlogCache = {};

    // Cached data
    const {
        showActionReason,
        expandActionReasonQueue,
        showReportReasons,
        queueCreature,
        // expandReports,
    } = options;

    // If the queue creature element is on page it will fade it out first and then remove the element.
    function createCreature () {
        // Creature time for real!
        const $redditQueueCreature = $body.find('div:contains("The queue is clean!")');
        const gotQueueCreature = $redditQueueCreature.length;
        if (gotQueueCreature) {
            const $creatureParent = $redditQueueCreature.parents().eq(0);
            const $queueCreature = $('<div id="queueCreature"></div>');
            self.log(queueCreature);
            if (queueCreature === 'puppy') {
                $queueCreature.addClass('tb-puppy');
            } else if (queueCreature === 'kitteh') {
                $queueCreature.addClass('tb-kitteh');
            } else if (queueCreature === '/r/babyelephantgifs') {
                $queueCreature.addClass('tb-begifs');
            } else if (queueCreature === '/r/spiderbros') {
                $queueCreature.addClass('tb-spiders');
            } else if (queueCreature === 'piggy') {
                // https://www.flickr.com/photos/michaelcr/5797087585
                $queueCreature.addClass('tb-piggy');
            }

            $creatureParent.html($queueCreature);
            // $queueCreature.siblings().hide();
        }
    }

    // Activate on queue pages.
    window.addEventListener('TBNewPage', event => {
        if (expandActionReasonQueue && event.detail.pageType === 'queueListing') {
            $body.addClass('tb-show-actions');
        } else {
            $body.removeClass('tb-show-actions');
        }

        // Queue creature
        // TODO: host the images somewhere else as at some point we probably cannot use images stored for old css
        if (event.detail.pageType === 'queueListing' && queueCreature !== 'i_have_no_soul') {
            // Let's try to replace the imposter creature with our own.
            createCreature();
            // To be sure let's wait a little bit and try again.
            setTimeout(() => {
                createCreature();
            }, 500);
        }
    });

    /**
     * Callback for further handling the modlog.
     *
     * @callback getModlogCallback
     */

    /**
         * Fetches the modlog for a subreddit and updates modlogCache.
         * @function getModlog

         * @param {string} subreddit - the subreddit for which the modlog needs to be fetched
         * @param {getModlogCallback} callback - callback that handles further modlog interactions
         */
    function getModlog (subreddit, callback) {
        TBApi.getJSON(`/r/${subreddit}/about/log/.json`, {limit: 500}).then(json => {
            TBStorage.purifyObject(json);
            json.data.children.forEach(value => {
                const fullName = value.data.target_fullname;
                const actionID = value.data.id;
                if (!fullName) {
                    return;
                }
                if (!Object.prototype.hasOwnProperty.call(modlogCache[subreddit].actions, fullName)) {
                    modlogCache[subreddit].actions[fullName] = {};
                }
                modlogCache[subreddit].actions[fullName][actionID] = value.data;
            });
            modlogCache[subreddit].activeFetch = false;
            callback();
        });
    }

    /**
         * Checks modLogCache for actions on the given fullName and subreddit.
         * @function checkForActions

         * @param {string} subreddit The subreddit the fullName thing belongs to.
         * @param {string} fullName Thing (post/comment) fullName
         * @returns {(false|object)} Either false or an object with actions
         */
    function checkForActions (subreddit, fullName) {
        if (Object.prototype.hasOwnProperty.call(modlogCache[subreddit].actions, fullName)) {
            return modlogCache[subreddit].actions[fullName];
        } else {
            return false;
        }
    }

    /**
         * Callback for further handling the modlog.
         * @callback getActionsCallback

         * @param {(Boolean|Object)} result Either false or an object with actions
         */

    /**
         * Checks for mod actions on the given fullName thing and subreddit through a caching mechanism.
         * @function getActions

         * @param {string} subreddit - the subreddit for which the modlog needs to be fetched
         * @param {string} fullName - thing (post/comment) fullName
         * @param {getActionsCallback} callback - callback that handles further modlog interactions
         */
    function getActions (subreddit, fullName, callback) {
        self.log(subreddit);
        const dateNow = Date.now();

        // check if we even have data
        if (!Object.prototype.hasOwnProperty.call(modlogCache, subreddit)) {
            modlogCache[subreddit] = {
                actions: {},
                activeFetch: true,
                lastFetch: dateNow,
            };

            getModlog(subreddit, () => {
                callback(checkForActions(subreddit, fullName));
            });

            // If we do have data but it is being refreshed we wait and try again.
        } else if (Object.prototype.hasOwnProperty.call(modlogCache, subreddit) && modlogCache[subreddit].activeFetch) {
            setTimeout(() => {
                getActions(subreddit, fullName, callback);
            }, 100);
        } else if (dateNow - modlogCache[subreddit].lastFetch > 300000) {
            getModlog(subreddit, () => {
                callback(checkForActions(subreddit, fullName));
            });
        } else {
            callback(checkForActions(subreddit, fullName));
        }
    }

    async function makeActionTable ($target, subreddit, id) {
        const isMod = await TBCore.isModSub(subreddit);
        if (isMod) {
            getActions(subreddit, id, actions => {
                if (actions) {
                    const show = $('body').hasClass('tb-show-actions');
                    const $actionTable = $(`
                        <div class="tb-action-details">
                            <span class="tb-bracket-button tb-show-action-table">${
                        show ? 'hide' : 'show'
                    } recent actions</span>
                            <table class="tb-action-table">
                                <tr>
                                    <th>mod</th>
                                    <th>action</th>
                                    <th>details</th>
                                    <th>time</th>
                                </tr>
                            </table>
                        </div>
                    `);

                    Object.values(actions).forEach(value => {
                        const mod = value.mod;
                        const action = value.action;
                        const details = value.details;
                        const description = value.description ? ` : ${value.description}` : '';
                        const createdAt = new Date(value.created_utc * 1000);

                        const $actionRow = $(`
                            <tr>
                                <td>${mod}</td>
                                <td>${action}</td>
                                <td>${details}${description}</td>
                                <td></td>
                            </tr>
                        `);

                        const $actionTime = TBui.relativeTime(createdAt);
                        $actionTime.addClass('live-timestamp');
                        $actionRow.find('td:last-child').append($actionTime);

                        $actionTable.find('.tb-action-table').append($actionRow);
                    });

                    requestAnimationFrame(() => {
                        $target.append($actionTable);
                    });
                }
            });
        }
    }
    // Show history of actions near posts.
    if (showActionReason) {
        TBListener.on('post', e => {
            const $target = $(e.target);
            const subreddit = e.detail.data.subreddit.name;
            const id = e.detail.data.id;
            makeActionTable($target, subreddit, id);

            if (e.detail.type === 'TBpost') {
                const $actionTable = $target.find('.tb-action-table');
                $actionTable.show();
                $target.find('.tb-show-action-table').hide();
            }
        });

        TBListener.on('comment', e => {
            const $target = $(e.target);
            const subreddit = e.detail.data.subreddit.name;
            const id = e.detail.data.id;

            // For now only try this on toolbox generated comments due to target placement.
            if (e.detail.type === 'TBcomment' || e.detail.type === 'TBcommentOldReddit') {
                makeActionTable($target, subreddit, id);
                const $actionTable = $target.find('.tb-action-table');
                $actionTable.show();
                $target.find('.tb-show-action-table').hide();
            }
        });

        $body.on('click', '.tb-show-action-table', function () {
            const $this = $(this);
            const $actionTable = $this.closest('.tb-action-details').find('.tb-action-table');
            if ($actionTable.is(':visible')) {
                $actionTable.hide();
                $this.text('show recent actions');
            } else {
                $actionTable.show();
                $this.text('hide recent actions');
            }
        });
    }

    // Show button for previous ignored reports
    if (showReportReasons) {
        // One function handles both posts and comments
        const addShowReportsButton = async redditEvent => {
            // Toolbox-generated things already display ignored reports
            if (['TBpost', 'TBcomment'].includes(redditEvent.detail.type)) {
                return;
            }

            // If we don't mod this subreddit, do nothing
            const subreddit = redditEvent.detail.data.subreddit.name;
            const isMod = await TBCore.isModSub(subreddit);
            if (!isMod) {
                return;
            }

            // Fetch reports; if reports aren't ignored, do nothing
            const {id, author} = redditEvent.detail.data;
            const {reportsIgnored, userReports, modReports} = await new Promise(resolve =>
                TBCore.getApiThingInfo(id, subreddit, false, resolve)
            );
            if (!reportsIgnored) {
                return;
            }

            // Create the button and add its event listener
            const $button = document.createElement('a');
            $button.classList.add('tb-bracket-button');
            $button.textContent = 'show reports';
            $button.addEventListener('click', clickEvent => {
                // Construct the list of reports
                const reportList = document.createElement('div');
                if (modReports.length) {
                    const modReportList = document.createElement('ul');
                    for (const [text, count] of modReports) {
                        const li = document.createElement('li');
                        li.textContent = `${count}: ${text}`;
                        modReportList.append(li);
                    }
                    const title = document.createElement('b');
                    title.append('mod reports:');
                    reportList.append(title, modReportList);
                }
                if (userReports.length) {
                    const userReportList = document.createElement('ul');
                    for (const [text, author] of userReports) {
                        const li = document.createElement('li');
                        li.textContent = `${author}: ${text}`;
                        userReportList.append(li);
                    }
                    const title = document.createElement('b');
                    title.append('user reports:');
                    reportList.append(title, userReportList);
                }

                // Display reports in a popup
                const {topPosition, leftPosition} = TBui.drawPosition(clickEvent);
                const $popup = TBui.popup({
                    title: `Old reports on ${author}'s ${
                        redditEvent.detail.type.includes('comment') ? 'comment' : 'post'
                    }`,
                    tabs: [{
                        content: reportList,
                    }],
                    draggable: true,
                }).css({
                    top: topPosition,
                    left: leftPosition,
                }).appendTo(document.querySelector('.tb-page-overlay') || 'body');
                $popup.on('click', '.close', () => {
                    $popup.remove();
                });
            });

            redditEvent.target.appendChild($button);
        };
        TBListener.on('post', addShowReportsButton);
        TBListener.on('comment', addShowReportsButton);
    }
} // queueTools.init()

export default self;
