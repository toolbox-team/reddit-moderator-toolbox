import $ from 'jquery';
import SnuOwnd from 'snuownd';

import * as TBApi from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import * as TBHelpers from '../tbhelpers.js';
import TBListener from '../tblistener.js';
import {Module} from '../tbmodule.jsx';
import * as TBui from '../tbui.js';
import {getCache, setCache} from '../util/cache.ts';
import {icons} from '../util/icons.ts';
import createLogger from '../util/logging.ts';

const log = createLogger('RReasons');

// Error messages
const STATUS_DEFAULT_TEXT = 'saving...';
const APPROVE_ERROR = 'error, failed to approve post';
const FLAIR_ERROR = 'error, failed to flair post';
const NO_REASON_ERROR = 'error, no reason selected';
const NO_REPLY_TYPE_ERROR = 'error, no reply type selected';
const REPLY_ERROR = 'error, failed to post reply';
const REPLY_ERROR_SUBREDDIT = 'error, failed to post reply as ModTeam account';
const PM_ERROR = 'error, failed to send PM';
const MODMAIL_ERROR = 'error, failed to send Modmail';
const MODMAIL_ARCHIVE_ERROR = 'error, failed to archive sent Modmail';
const DISTINGUISH_ERROR = 'error, failed to distinguish reply';
const LOCK_POST_ERROR = 'error, failed to lock post';
const LOCK_COMMENT_ERROR = 'error, failed to lock reply';
const LOG_REASON_MISSING_ERROR = 'error, public log reason missing';
const LOG_POST_ERROR = 'error, failed to create log post';

// Default texts
const DEFAULT_SUBJECT = 'Your {kind} was removed from /r/{subreddit}';
const DEFAULT_LOG_TITLE = 'Removed: {kind} by /u/{author} to /r/{subreddit}';
const DEFAULT_BAN_TITLE = '/u/{author} has been banned from /r/{subreddit} for {reason}';

export default new Module({
    name: 'Removal Reasons',
    id: 'RReasons',
    enabledByDefault: true,
    settings: [
        {
            id: 'commentReasons',
            type: 'boolean',
            default: false,
            description: 'Enable removal reasons for comments.',
        },
        {
            id: 'alwaysShow',
            type: 'boolean',
            default: false,
            description: 'Show an empty removal reason box for subreddits that don\'t have removal reasons.',
        },
        // Storage settings.
        {
            id: 'reasonType',
            type: 'selector',
            values: [
                'Reply with a comment to the item that is removed',
                'Send as PM (personal message)',
                'Send as both PM and reply',
                'None (This only works when a logsub has been set)',
            ],
            default: 'reply',
            description: 'Method of sending removal reasons.',
        },
        {
            id: 'reasonAsSub',
            type: 'boolean',
            default: false,
            advanced: false,
            description:
                'Send removal reasons as a subreddit. <b>Note:</b> these will appear in modmail and potentially clutter it up.',
        },
        {
            id: 'reasonAutoArchive',
            type: 'boolean',
            default: false,
            advanced: false,
            description: 'Auto-archive sent modmail pm. <b>Note:</b> Only works on new modmail.',
        },
        {
            id: 'reasonSticky',
            type: 'boolean',
            default: false,
            description: 'Leave removal reasons as a sticky comment.',
        },
        {
            id: 'reasonCommentAsSubreddit',
            type: 'boolean',
            default: false,
            description: 'Leave removal reason comments with /u/subreddit-ModTeam.',
        },
        {
            id: 'actionLock',
            type: 'boolean',
            default: false,
            description: 'Lock threads after leaving a removal reason.',
        },
        {
            id: 'actionLockComment',
            type: 'boolean',
            default: false,
            description: 'Lock removal reasons when replying as a comment.',
        },
        // Default is escape()'d: <textarea id="customTextarea" placeholder="Enter Custom reason"></textarea>
        // May make this a user setting, one day.
        {
            id: 'customRemovalReason',
            type: 'string',
            default:
                '%3Ctextarea%20id%3D%22customTextarea%22%20%20class%3D%22tb-input%22%20placeholder%3D%22Enter%20Custom%20reason%22%3E%3C/textarea%3E',
            hidden: true,
        },
    ],
}, ({
    alwaysShow,
    commentReasons,
    customRemovalReason,
    reasonType: reasonTypeSetting,
    reasonAsSub: reasonAsSubSetting,
    reasonAutoArchive: reasonAutoArchiveSetting,
    reasonSticky: reasonStickySetting,
    reasonCommentAsSubreddit: reasonCommentAsSubredditSetting,
    actionLock: actionLockSetting,
    actionLockComment: actionLockCommentSetting,
}) => {
    // Check if removal reasons are runnable
    if (TBCore.isModmail) {
        log.debug('Disabled because modmail');
        return;
    }

    const $body = $('body');

    // Cached data
    const notEnabled = [];

    // Remote stuff retrieval
    async function getRemovalReasons (subreddit) {
        // Get config for this sub and try to pull removal reasons from there
        const config = await TBCore.getConfig(subreddit);
        if (!config || !config.removalReasons) {
            return false;
        }

        // If we need to get them from another sub, recurse.
        if (config.removalReasons.getfrom && config.removalReasons.getFrom !== subreddit) {
            return getRemovalReasons(config.removalReasons.getfrom);
        }

        return config.removalReasons;
    }

    // UI components
    // UI event handling
    TBListener.on('post', e => {
        if (e.detail.data.isRemoved && TBCore.pageDetails.pageType !== 'queueListing') {
            const $target = $(e.target);
            $target.append(
                `<span class="tb-bracket-button tb-add-removal-reason" data-id="${e.detail.data.id}" data-subreddit="${e.detail.data.subreddit.name}">Add removal reason</span>`,
            );
        }
    });
    if (commentReasons) {
        TBListener.on('comment', e => {
            if (e.detail.data.isRemoved && TBCore.pageDetails.pageType !== 'queueListing') {
                const $target = $(e.target);
                $target.append(
                    `<span class="tb-bracket-button tb-add-removal-reason" data-id="${e.detail.data.id}" data-subreddit="${e.detail.data.subreddit.name}">Add removal reason</span>`,
                );
            }
        });
    }

    // Open reason drop-down when we remove something as ham.
    $('body').on(
        'click',
        'button:contains("remove"), button:contains("Remove"), button:contains("Confirm removal"), .tb-add-removal-reason, .big-mod-buttons > span > .pretty-button.neutral, .remove-button, .tb-submission-button-remove, .tb-comment-button-remove',
        async function (event) {
            console.error('trigger');
            const $button = $(this);
            let thingID;
            let thingSubreddit;
            let isComment = false; // default to false for new Reddit

            // For now, removals on Toolbox-generated posts/comments work the same way as on old Reddit (without jsAPI)
            if (TBCore.isOldReddit || $button.is('.tb-submission-button-remove, .tb-comment-button-remove')) {
                const $yes = $button.find('.yes')[0];
                const $thing = $button.closest('.thing, .tb-thing');
                isComment = $thing.hasClass('comment') || $thing.hasClass('was-comment')
                    || $thing.hasClass('tb-comment');

                if ($yes) {
                    $yes.click();
                }

                thingID = $thing.attr('data-fullname');
                thingSubreddit = $thing.attr('data-subreddit');
            } else {
                if ($button.hasClass('tb-add-removal-reason')) {
                    thingID = $button.attr('data-id');
                    thingSubreddit = $button.attr('data-subreddit');
                    isComment = $button.closest('.tb-frontend-container').data('tb-type') === 'comment';
                } else {
                    const $parent = $button.closest('.Post');
                    const postDetails = $parent.find('.tb-frontend-container[data-tb-type="post"]').data('tb-details');
                    thingID = postDetails.data.id;
                    thingSubreddit = postDetails.data.subreddit.name;
                }
            }

            // If the shift key was pressed, remove without a removal reason,
            // unless this is the explicit "Add removal reason" button.
            if (event.shiftKey && !$button.hasClass('tb-add-removal-reason')) {
                return;
            }

            const info = await TBCore.getApiThingInfo(thingID, thingSubreddit, false);
            // Get link/comment attributes
            const data = {
                subreddit: info.subreddit,
                fullname: info.id,
                author: info.user,
                title: info.title,
                kind: info.kind,
                mod: info.mod,
                url: info.permalink,
                link: info.postlink,
                domain: info.domain,
                body: info.body,
                raw_body: info.raw_body,
                uri_body: info.uri_body || encodeURIComponent(info.body),
                uri_title: info.uri_title || encodeURIComponent(info.title),
                reasons: [],
                get reasons_posts () {
                    return this.reasons.filter(r => r.removePosts || r.removePosts === undefined);
                },
                get reasons_comments () {
                    return this.reasons.filter(r => r.removeComments || r.removeComments === undefined);
                },
            };

            // TODO: Dis ain't finished
            // TBApi.getRules(data.subreddit).then(rules => {
            //    log.debug('getting rules');
            //    log.debug(rules);
            // });

            // Set attributes and open reason box if one already exists for this subreddit
            log.debug('Opening popup');
            const $overlay = $(`#reason-popup-${data.subreddit}`);
            // If the overlay already exists, open it
            if ($overlay.length) {
                // Click yes on the removal
                openOverlay();
            } else {
                // Otherwise create the overlay and open it
                // Get removal reasons.
                let response = await getRemovalReasons(data.subreddit);

                // Removal reasons not enabled
                if (!response || response.reasons.length < 1) {
                    notEnabled.push(data.subreddit);

                    // we're done, unless the user has always show set.
                    if (!alwaysShow) {
                        return;
                    }

                    // Otherwise, setup a completely empty reason.
                    log.debug('Using custom reason');

                    const customReasons = {
                        pmsubject: '',
                        logreason: '',
                        header: '',
                        footer: '',
                        logsub: '',
                        logtitle: '',
                        bantitle: '',
                        getfrom: '',
                        reasons: [],
                    };
                    const reason = {
                        text: customRemovalReason,
                        flairText: '',
                        flairCSS: '',
                        title: '',
                    };
                    customReasons.reasons.push(reason);

                    // Set response to our empty reason.
                    response = customReasons;
                }

                // Get PM subject line
                data.subject = TBHelpers.htmlEncode(response.pmsubject) || DEFAULT_SUBJECT;

                // Add additional data that is found in the wiki JSON.
                // Any HTML needs to me unescaped, because we store it escaped in the wiki.
                data.logReason = TBHelpers.htmlEncode(response.logreason) || '';
                data.header = response.header ? TBHelpers.htmlEncode(unescape(response.header)) : '';
                data.footer = response.footer ? TBHelpers.htmlEncode(unescape(response.footer)) : '';
                data.logSub = TBHelpers.htmlEncode(response.logsub) || '';
                data.logTitle = TBHelpers.htmlEncode(response.logtitle) || DEFAULT_LOG_TITLE;
                data.banTitle = TBHelpers.htmlEncode(response.bantitle) || DEFAULT_BAN_TITLE;
                data.removalOption = response.removalOption;
                data.typeReply = response.typeReply;
                data.typeStickied = response.typeStickied;
                data.typeCommentAsSubreddit = response.typeCommentAsSubreddit;
                data.typeLockComment = response.typeLockComment;
                data.typeAsSub = response.typeAsSub;
                data.autoArchive = response.autoArchive;
                data.typeLockThread = response.typeLockThread;

                // Loop through the reasons... unescaping each.
                data.reasons = [];
                $(response.reasons).each(function () {
                    data.reasons.push({
                        text: unescape(this.text),
                        title: TBHelpers.htmlEncode(this.title),
                        // If it's undefined, it's an old RR - show for both comments and posts
                        removePosts: this.removePosts === undefined ? undefined : !!this.removePosts,
                        removeComments: this.removeComments === undefined ? undefined : !!this.removeComments,
                        flairText: TBHelpers.htmlEncode(this.flairText),
                        flairCSS: TBHelpers.htmlEncode(this.flairCSS),
                        flairTemplateID: this.flairTemplateID === undefined ? '' : this.flairTemplateID,
                    });
                });

                // Only show overlay if there's removal reasons
                let removalReasonLength = 0;
                if (isComment) {
                    // get all RR for comments that's True and undefined
                    let commentRemovalReasons = data.reasons_comments;
                    if (!commentReasons) {
                        // user has disabled RR for comments (allow only True)
                        commentRemovalReasons = commentRemovalReasons.filter(r => r.removeComments);
                    }
                    removalReasonLength = commentRemovalReasons.length;
                } else {
                    removalReasonLength = data.reasons_posts.length;
                }

                if (!removalReasonLength) {
                    return;
                }

                // Open overlay
                createOverlay();
                openOverlay();
            }

            function createOverlay () {
                log.debug('Creating removal reason overlay');

                // Options
                const selectNoneDisplay = data.logSub ? '' : 'none'; // if there is no {reason} in the title but we still want to only log we'll need that "none" radio button.
                const logDisplay = data.logSub && data.logTitle.indexOf('{reason}') >= 0 ? '' : 'none'; // if {reason}  is present we want to fill it.
                const headerDisplay = data.header ? '' : 'none';
                const footerDisplay = data.footer ? '' : 'none';
                const removalOption = data.removalOption;
                const typeReply = data.typeReply;
                const typeStickied = data.typeStickied;
                const typeCommentAsSubreddit = data.typeCommentAsSubreddit;
                const typeLockComment = data.typeLockComment;
                const typeAsSub = data.typeAsSub;
                const autoArchive = data.autoArchive;
                const typeLockThread = data.typeLockThread;
                const leaveUpToMods = removalOption === undefined || removalOption === 'leave';
                const forced = removalOption === 'force';

                let reasonType = typeReply;
                if (leaveUpToMods) {
                    switch (reasonTypeSetting) {
                        case 'reply_with_a_comment_to_the_item_that_is_removed':
                            reasonType = 'reply';
                            break;
                        case 'send_as_pm_(personal_message)':
                            reasonType = 'pm';
                            break;
                        case 'send_as_both_pm_and_reply':
                            reasonType = 'both';
                            break;
                        case 'none_(this_only_works_when_a_logsub_has_been_set)':
                            reasonType = 'none';
                            break;
                        default:
                            reasonType = 'reply';
                            break;
                    }
                }

                const reasonAsSub = leaveUpToMods ? reasonAsSubSetting : typeAsSub;
                const reasonAutoArchive = leaveUpToMods ? reasonAutoArchiveSetting : autoArchive;
                const reasonSticky = leaveUpToMods ? reasonStickySetting : typeStickied;
                const reasonCommentAsSubreddit = leaveUpToMods
                    ? reasonCommentAsSubredditSetting
                    : typeCommentAsSubreddit;
                const actionLockThread = leaveUpToMods ? actionLockSetting : typeLockThread;
                const actionLockComment = leaveUpToMods ? actionLockCommentSetting : typeLockComment;

                // Set up markdown renderer
                SnuOwnd.DEFAULT_HTML_ELEMENT_WHITELIST.push('select', 'option', 'textarea', 'input');
                SnuOwnd.DEFAULT_HTML_ATTR_WHITELIST.push('id', 'placeholder', 'label', 'value');
                const parser = SnuOwnd.getParser(
                    SnuOwnd.getRedditRenderer(SnuOwnd.DEFAULT_BODY_FLAGS | SnuOwnd.HTML_ALLOW_ELEMENT_WHITELIST),
                );

                // Render header and footer
                const headerText = data.header ? parser.render(data.header) : '';
                const footerText = data.footer ? parser.render(data.footer) : '';

                // Make box & add reason radio buttons
                const $overlay = TBui.overlay({
                    title: `Removal reasons for /r/${data.subreddit}`,
                    tabs: [
                        {
                            title: 'toolbox reasons',
                            tooltip: 'Use a removal reason defined in your subreddit\'s Toolbox configuration',
                            content: `
                                <p>
                                    Removing:
                                    <a class="mte-thread-link" href="${data.url}" target="_blank">
                                        ${TBHelpers.htmlEncode(data.title)}
                                    </a>
                                </p>
                                <div class="styled-reason" id="header-reason" style="display:${headerDisplay}">
                                    <p>
                                        <label><input type="checkbox" id="include-header" checked> Include header.</label><br />
                                        <label id="reason-header">${headerText}</label>
                                    </p>
                                </div>
                                <table id="removal-reasons-table">
                                    <thead><tr>
                                        <th class="removal-toggle"></th>
                                        <th class="reason">reason</th>
                                        <th class="flair-text">flair text</th>
                                        <th class="flair-css">flair css</th>
                                        <th class="sort">sort</th>
                                    </tr></thead>
                                    <tbody id="reason-table" />
                                </table>
                                <div class="styled-reason" id="footer-reason" style="display:${footerDisplay}">
                                    <p>
                                        <label><input type="checkbox" id="include-footer" checked> Include footer.</label><br />
                                        <label id="reason-footer">${footerText}</label>
                                    </p>
                                </div>
                                <div id="buttons">
                                    <ul>
                                        <li>
                                            <input
                                                ${forced ? 'disabled' : ''}
                                                class="reason-type"
                                                type="radio"
                                                id="type-reply-${data.subreddit}"
                                                value="reply"
                                                name="type-${data.subreddit}"
                                                ${reasonType === 'reply' ? ' checked' : ''}
                                            />
                                            <label for="type-reply-${data.subreddit}">
                                                Reply with a comment to the item that is removed.
                                            </label>
                                            <ul>
                                                <li>
                                                    <input
                                                        ${forced || data.kind !== 'submission' ? 'disabled' : ''}
                                                        class="reason-sticky"
                                                        type="checkbox"
                                                        id="type-stickied"
                                                        ${reasonSticky && data.kind === 'submission' ? 'checked' : ''}
                                                    />
                                                    <label for="type-stickied">Sticky the removal comment.</label>
                                                </li>
                                                <li>
                                                    <input
                                                        ${forced ? 'disabled' : ''}
                                                        class="action-lock-comment"
                                                        id="type-action-lock-comment"
                                                        type="checkbox"
                                                        ${actionLockComment ? 'checked' : ''}
                                                    />
                                                    <label for="type-action-lock-comment">
                                                        Lock the removal comment.
                                                    </label>
                                                </li>
                                                <li>
                                                    <input
                                                        ${forced ? 'disabled' : ''}
                                                        class="reason-comment-as-subreddit"
                                                        id="type-reason-commnet-as-sub"
                                                        type="checkbox"
                                                        ${reasonCommentAsSubreddit ? 'checked' : ''}
                                                    />
                                                    <label for="type-reason-commnet-as-sub">
                                                        Send as /u/${data.subreddit}-ModTeam.
                                                    </label>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <input
                                                ${forced ? 'disabled' : ''}
                                                class="reason-type"
                                                type="radio"
                                                id="type-PM-${data.subreddit}"
                                                value="pm"
                                                name="type-${data.subreddit}"
                                                ${reasonType === 'pm' ? ' checked' : ''}
                                            />
                                            <label for="type-PM-${data.subreddit}">
                                                Send as PM (personal message)
                                            </label>
                                            <ul>
                                                <li>
                                                    <input
                                                        ${forced ? 'disabled' : ''}
                                                        class="reason-as-sub"
                                                        type="checkbox"
                                                        id="type-as-sub"
                                                        ${reasonAsSub ? 'checked ' : ''}
                                                    />
                                                    <label for="type-as-sub">
                                                        Send pm via modmail as /r/${data.subreddit}
                                                        <b>Note:</b> This will clutter up modmail.
                                                    </label>
                                                </li>
                                                <li>
                                                    <input
                                                        ${forced ? 'disabled' : ''}
                                                        class="reason-auto-archive"
                                                        type="checkbox"
                                                        id="type-auto-archive"
                                                        ${reasonAutoArchive ? 'checked ' : ''}
                                                    />
                                                    <label for="type-auto-archive">
                                                        Auto-archive sent modmail pm
                                                        <b>Note:</b> Only works on new modmail.
                                                    </label>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <input
                                                ${forced ? 'disabled' : ''}
                                                class="reason-type"
                                                type="radio"
                                                id="type-both-${data.subreddit}"
                                                value="both"
                                                name="type-${data.subreddit}"
                                                ${reasonType === 'both' ? ' checked' : ''}
                                            />
                                            <label for="type-both-${data.subreddit}">
                                                Send as both PM and reply.
                                            </label>
                                        </li>
                                        <li style="display:${selectNoneDisplay}"> /
                                            <input
                                                ${forced ? 'disabled' : ''}
                                                class="reason-type"
                                                type="radio"
                                                id="type-none-${data.subreddit}"
                                                value="none"
                                                name="type-${data.subreddit}"
                                                ${reasonType === 'none' ? ' checked' : ''}
                                            />
                                            <label for="type-none-${data.subreddit}">
                                                none, will only log the removal.
                                            </label>
                                        </li>
                                        <li>
                                            <input
                                                ${forced || data.kind !== 'submission' ? 'disabled' : ''}
                                                class="action-lock-thread"
                                                id="type-action-lock-thread"
                                                type="checkbox"
                                                ${actionLockThread && data.kind === 'submission' ? 'checked' : ''}
                                            />
                                            <label for="type-action-lock-thread">Lock the removed thread.</label>
                                        </li>
                                    </ul>
                                </div>
                                <div id="log-reason" style="display:${logDisplay}">
                                    <p>Log Reason(s):
                                        <input id="log-reason-input" type="text" class="tb-input" name="logReason" value="${data.logReason}" />
                                    </p>
                                    <p>
                                        (Used for posting a log to /r/${data.logSub}. Will only be used when "send" is clicked.) </label>
                                    </p>
                                </div>
                            `,
                            // TODO: once we have native reasons we'll have a second
                            // tab and this will go in the top-level overlay footer,
                            // but passing a footer there when there's only one tab
                            // results in the footer being duplicated. that's an
                            // issue with TBui.overlay() but i don't feel like
                            // fixing it so here we are
                            footer: `
                                <span class="tb-reason-popup-status error" style="display:none">This is an easter egg.</span>
                                ${TBui.actionButton('send', 'save')}
                                ${TBui.actionButton('no reason', 'no-reason')}
                                ${TBui.actionButton('cancel and approve', 'cancel')}
                            `,
                        },
                    ],
                    details: data,
                    tabOrientation: 'horizontal',
                });

                $overlay.addClass('reason-popup');
                $overlay.attr('id', `reason-popup-${data.subreddit}`);

                // RRs don't have a close button
                // TODO: is this desired? also if so, refactor this into an option
                //       in TBui.overlay()
                $overlay.find('.buttons .close').remove();

                $overlay.appendTo('body');

                let reasons = [];
                if (isComment) {
                    if (commentReasons) {
                        // show reasons with 'true' and 'undefined' for comments
                        reasons = data.reasons_comments;
                    } else {
                        // show reasons with only 'true' for comments
                        reasons = data.reasons_comments.filter(r => r.removeComments === true);
                    }
                } else {
                    reasons = data.reasons_posts;
                }

                // Render reasons and add to window
                $(reasons).each(function (index) {
                    const reasonMarkdown = `${this.text}\n\n`;
                    const reasonHtml = parser.render(reasonMarkdown);

                    const tr = $(`
                        <tr class="selectable-reason">
                            <td class="removal-toggle">
                                <input
                                    type="checkbox"
                                    class="reason-check"
                                    name="reason-${data.subreddit}"
                                    id="reason-${data.subreddit}-${index}"
                                />
                                <div class="reason-num">${index + 1}</div>
                            </td>
                            <td class="reason">
                                <div class="removal-reason-title">
                                    ${this.title || ''}
                                </div>
                                <div class="styled-reason reason-content ${data.subreddit}-${index}">
                                    ${reasonHtml}
                                    <br />
                                </div>
                           </td>
                            <td class="flair-text">
                                <span class="flair-text-span">
                                    ${this.flairText || ''}
                                </span>
                            </td>
                            <td class="flair-css">
                                <span class="flair-css-span">
                                    ${this.flairCSS || ''}
                                </span>
                            </td>
                            <td class="removal-reasons-sort-buttons">
                                <a href="javascript:;" class="tb-live-sort-up tb-icons">${icons.sortUp}</a>
                                <a href="javascript:;" class="tb-live-sort-down tb-icons">${icons.sortDown}</a>
                            </td>
                        </tr>
                    `);

                    tr.data({
                        reasonId: index,
                        reasonMarkdown,
                        title: this.title,
                        flairText: this.flairText,
                        flairCSS: this.flairCSS,
                        flairTemplateID: this.flairTemplateID,
                    });

                    if (this.title) {
                        tr.find('.styled-reason.reason-content').hide();
                        tr.find('.flair-text-span').hide();
                        tr.find('.flair-css-span').hide();
                    } else {
                        tr.find('.removal-reason-title').remove();
                    }

                    $overlay.find('#reason-table').append(tr);
                });

                // Pre-fill reason input elements which have IDs.
                $overlay.find('.reason-content input[id], .reason-content textarea[id]').each(async function () {
                    this.id = `reason-input-${data.subreddit}-${this.id}`;
                    this.value = await getCache('RReasons', this.id, this.value);
                });
            }

            function openOverlay () {
                // Reset state
                Object.entries(data).forEach(([key, value]) => {
                    $overlay.attr(`data-${key}`, value);
                });
                $overlay.find('.selectable-reason input[type=checkbox]:checked').prop('checked', false);
                $overlay.find('.selectable-reason.reason-selected').removeClass('reason-selected');
                $overlay.find('.tb-reason-popup-status').hide(); // css('display: none;');
                $overlay.find('.error-highlight').removeClass('error-highlight');
                $overlay.find('.mte-thread-link').attr('href', data.url).text(data.title);

                // Open popup
                $overlay.show();
                $body.css('overflow', 'hidden');
            }
        },
    );

    // Popup events
    function removeOverlay ($overlay) {
        $overlay.remove();
        $body.css('overflow', 'auto');
    }

    $body.on('click', '.reason-popup', e => {
        e.stopPropagation();
    });

    // Selection/deselection of removal reasons
    $body.on('click', '.selectable-reason', function (e) {
        if ($(e.target).is('.tb-live-sort-up')) {
            return;
        }
        const $this = $(this);
        const checkBox = $this.find('.reason-check');
        const isChecked = checkBox.is(':checked');
        const targetIsCheckBox = $(e.target).is('.reason-check');
        const hasTitle = $this.find('.removal-reason-title').length;

        if (!isChecked && !targetIsCheckBox) {
            $this.addClass('reason-selected');
            checkBox.prop('checked', true);
            if (hasTitle > 0) {
                $this.find('.reason-content').show();
                $this.find('.flair-text-span').show();
                $this.find('.flair-css-span').show();
            }
        } else if (isChecked && targetIsCheckBox) {
            $this.addClass('reason-selected');
            if (hasTitle > 0) {
                $this.find('.reason-content').show();
                $this.find('.flair-text-span').show();
                $this.find('.flair-css-span').show();
            }
        } else if (!isChecked && targetIsCheckBox) {
            $this.removeClass('reason-selected');
            if (hasTitle > 0) {
                $this.find('.reason-content').hide();
                $this.find('.flair-text-span').hide();
                $this.find('.flar-css-span').hide();
            }
        }
    });

    // live sorting of removal reasons
    $body.on('click', '.reason-popup .tb-live-sort-up', function () {
        const $row = $(this).closest('tr');
        const $prev = $row.prev();

        if ($prev && $prev.length > 0) {
            $row.fadeOut(100, () => {
                $row.detach();
                $row.insertBefore($prev);
                $row.fadeIn(300);
            });
        }
    });

    $body.on('click', '.reason-popup  .tb-live-sort-down ', function () {
        const $row = $(this).closest('tr');
        const $next = $row.next();

        if ($next && $next.length > 0) {
            $row.fadeOut(100, () => {
                $row.detach();
                $row.insertAfter($next);
                $row.fadeIn(300);
            });
        }
    });

    // 'no reason' button clicked
    $body.on('click', '.reason-popup .no-reason', function () {
        const $overlay = $(this).parents('.reason-popup');
        removeOverlay($overlay);
    });

    // 'cancel' button clicked
    $body.on('click', '.reason-popup .cancel', function () {
        const $overlay = $(this).parents('.reason-popup');
        const status = $overlay.find('.tb-reason-popup-status');

        TBApi.approveThing($overlay.attr('data-fullname')).then(() => {
            removeOverlay($overlay);
        }).catch(() => {
            status.text(APPROVE_ERROR);
        });
    });

    // 'save' button clicked
    $body.on('click', '.reason-popup .save', function () {
        const $overlay = $(this).parents('.reason-popup');
        const notifyBy = $overlay.find('.reason-type:checked').val();
        const notifyAsSub = $overlay.find('.reason-as-sub').prop('checked');
        const autoArchive = $overlay.find('.reason-auto-archive').prop('checked');
        const notifySticky = $overlay.find('.reason-sticky').prop('checked');
        const actionLockThread = $overlay.find('.action-lock-thread').prop('checked');
        const actionLockComment = $overlay.find('.action-lock-comment').prop('checked');
        const reasonCommentAsSubreddit = $overlay.find('.reason-comment-as-subreddit').prop('checked');
        const checked = $overlay.find('.reason-check:checked');
        const status = $overlay.find('.tb-reason-popup-status');
        const header = TBHelpers.htmlDecode($overlay.attr('data-header'));
        const footer = TBHelpers.htmlDecode($overlay.attr('data-footer'));
        const logReason = $overlay.find('#log-reason-input').val();
        const data = {
            subreddit: '',
            fullname: '',
            author: '',
            title: '',
            kind: '',
            mod: '',
            url: '',
            link: '',
            domain: '',
            logSub: '',
            body: '',
            raw_body: '',
            uri_body: '',
            uri_title: '',
        };
        let subject = $overlay.attr('data-subject');
        let logTitle = $overlay.attr('data-logTitle');

        // Update status
        status.text(STATUS_DEFAULT_TEXT);
        status.show();
        $overlay.find('.error-highlight').removeClass('error-highlight');

        // Check if reason checked
        const noneSelected = $('body').find('.reason-type:checked').val();
        if (!checked.length && noneSelected !== 'none') {
            $overlay.find('#reason-table').addClass('error-highlight');
            return status.text(NO_REASON_ERROR);
        }

        // Get custom reason input
        const markdownReasons = [];
        const customInput = [];
        let flairText = '';
        let flairCSS = '';
        let flairTemplateID = '';

        checked.closest('.selectable-reason').each(function () {
            const $this = $(this);
            // Get markdown-formatted reason
            const markdownReason = $this.data('reasonMarkdown');
            markdownReasons.push(markdownReason);

            // Get input from HTML-formatted reason
            const htmlReason = $this.find('.reason-content');
            htmlReason.find('select, input, textarea').each(function () {
                customInput.push(this.value || '');
            });

            // Get flair data
            if ($this.data('flairText')) {
                flairText += ` ${$this.data('flairText')}`;
            }
            if ($this.data('flairCSS')) {
                flairCSS += ` ${$this.data('flairCSS')}`;
            }
            if ($this.data('flairTemplateID')) {
                flairTemplateID = $this.data('flairTemplateID');
            }
        });

        // Generate reason text
        let reason = '';

        // // Add response body
        let customIndex = 0;
        markdownReasons.forEach(markdownReason => {
            $(`<div>${markdownReason}</div>`).contents().each(function () {
                // If an element, check for conversions
                if (this.nodeType === Node.ELEMENT_NODE) {
                    switch (this.tagName.toLowerCase()) {
                        // Convert breaks to lots of newlines
                        case 'br':
                            reason += '\n\n';
                            break;

                            // Convert input elements to custom input (stored in order)
                        case 'select':
                        case 'input':
                        case 'textarea':
                            reason += customInput[customIndex++];
                            break;
                    }
                } else if (this.nodeType === Node.TEXT_NODE) {
                    // If a text node, get content
                    reason += this.textContent;
                }
            });
        });

        // See if any of the reasons actually have text.
        const reasonlength = reason.trim().length;

        // // Add header if selected
        if ($overlay.find('#include-header').is(':checked')) {
            reason = `${header}\n\n${reason}`;
        }

        // // Add footer if selected
        if ($overlay.find('#include-footer').is(':checked')) {
            reason += `\n\n${footer}`;
        }

        // // Convert attribs back to data.
        for (const i of Object.keys(data)) {
            data[i] = $overlay.attr(`data-${i}`);
        }

        reason = TBHelpers.replaceTokens(data, reason);
        subject = TBHelpers.replaceTokens(data, subject);
        logTitle = TBHelpers.replaceTokens(data, logTitle);

        TBCore.getApiThingInfo(data.fullname, data.subreddit, false).then(({ham}) => {
            if (!ham) {
                TBApi.removeThing(data.fullname);
            }
        });

        // // Clean up reason
        reason = reason.trim();

        // Flair post if required
        flairText = flairText.trim();
        flairCSS = flairCSS.trim();
        if ((flairText !== '' || flairCSS !== '') && data.kind !== 'comment') {
            TBApi.flairPost(data.fullname, data.subreddit, flairText, flairCSS, flairTemplateID).catch(() => {
                status.text(FLAIR_ERROR);
            });
        }

        // If logSub is not empty, log the removal and send a PM/comment
        if (data.logSub) {
            // Finalize log reasons
            if (logTitle.indexOf('{reason}') >= 0) {
                // Check if a log reason is selected
                if (!logReason) {
                    $overlay.find('#log-reason-input').addClass('error-highlight');
                    return status.text(LOG_REASON_MISSING_ERROR);
                }

                // Set log reason to entered reason
                logTitle = logTitle.replace('{reason}', logReason);
            }

            // Submit log post
            TBApi.postLink(data.url || data.link, TBHelpers.removeQuotes(logTitle), data.logSub).then(response => {
                const logThingId = response.json.data.name;
                const loglinkToken = response.json.data.url;
                TBApi.approveThing(logThingId);

                if (noneSelected === 'none') {
                    removeOverlay($overlay);
                } else {
                    sendRemovalMessage(loglinkToken);
                }
            }).catch(() => {
                status.text(LOG_POST_ERROR);
            });
        } else {
            // Otherwise only send PM and/or comment
            sendRemovalMessage(null);
        }

        // Function to send PM and comment
        async function sendRemovalMessage (logLink) {
            const mySubsData = await TBCore.getModSubs(true);
            // If there is no message to send, don't send one.
            if (reasonlength < 1) {
                if ((flairText !== '' || flairCSS !== '') && data.kind !== 'comment') {
                    // We'll flair only flair, we are done here.
                    return removeOverlay($overlay);
                } else {
                    return status.text(NO_REASON_ERROR);
                }
            }

            // Check if a valid notification type is selected
            if (!notifyBy && !notifyAsSub || logLink == null && notifyBy === 'none') {
                $overlay.find('#buttons').addClass('error-highlight');
                return status.text(NO_REPLY_TYPE_ERROR);
            }

            // Finalize the reason with optional log post link
            if (typeof logLink !== 'undefined') {
                reason = reason.replace('{loglink}', logLink);
            }

            // Lock thread if requested
            if (actionLockThread) {
                log.debug(`Fullname of this link: ${data.fullname}`);
                try {
                    await TBApi.lock(data.fullname);
                } catch (error) {
                    log.error(`error locking ${data.fullname}:`, error);
                    return status.text(LOCK_POST_ERROR);
                }
            }

            const subredditData = mySubsData.find(s => s.subreddit === data.subreddit);
            const notifyByPM = notifyBy === 'pm' || notifyBy === 'both';
            const notifyByReply = notifyBy === 'reply' || notifyBy === 'both';
            const notifyByNewModmail = notifyByPM && notifyAsSub && autoArchive && subredditData
                && subredditData.is_enrolled_in_new_modmail;

            // Reply to submission/comment
            if (notifyByReply) {
                log.debug('Sending removal message by comment reply.');
                if (reasonCommentAsSubreddit) {
                    log.debug('Commenting as subreddit.');
                    let modactionsEndpoint;
                    if (data.fullname.startsWith('t1')) {
                        modactionsEndpoint = '/api/v1/modactions/removal_comment_message';
                    } else {
                        modactionsEndpoint = '/api/v1/modactions/removal_link_message';
                    }

                    TBApi.apiOauthPOST(
                        modactionsEndpoint,
                        JSON.stringify({
                            item_id: [
                                data.fullname,
                            ],
                            message: reason,
                            title: 'removal reason through toolbox',
                            type: 'public_as_subreddit',
                            lock_comment: actionLockComment,
                        }),
                    ).then(() => {
                        if (notifyByNewModmail) {
                            sendNewModmail();
                        } else if (notifyByPM) {
                            sendPM();
                        } else {
                            removeOverlay($overlay);
                        }
                    }).catch(() => {
                        status.text(REPLY_ERROR_SUBREDDIT);
                    });
                } else {
                    TBApi.postComment(data.fullname, reason).then(response => {
                        if (response.json.errors.length > 0) {
                            status.text(`${REPLY_ERROR}: ${response.json.errors[0][1]}`);
                        } else {
                            // Distinguish the new reply, stickying if necessary
                            TBApi.distinguishThing(response.json.data.things[0].data.id, notifySticky).then(() => {
                                if (notifyByNewModmail) {
                                    sendNewModmail();
                                } else if (notifyByPM) {
                                    sendPM();
                                } else {
                                    removeOverlay($overlay);
                                }
                            }).catch(() => {
                                status.text(DISTINGUISH_ERROR);
                            });
                            // Lock reply if requested
                            if (actionLockComment) {
                                const commentId = response.json.data.things[0].data.id;
                                log.debug(`Fullname of reply: ${commentId}`);
                                TBApi.lock(commentId).then(() => {
                                    removeOverlay($overlay);
                                }).catch(() => {
                                    status.text(LOCK_COMMENT_ERROR);
                                });
                            }
                        }
                    }).catch(() => {
                        status.text(REPLY_ERROR);
                    });
                }
            } else if (notifyByNewModmail) {
                sendNewModmail();
            } else if (notifyByPM) {
                sendPM();
            }

            // Send PM the user
            function sendPM () {
                const text = `${reason}\n\n---\n[[Link to your ${data.kind}](${data.url})]`;

                log.debug('Sending removal message by PM');
                TBApi.sendMessage(data.author, subject, text, notifyAsSub ? data.subreddit : undefined).then(() => {
                    removeOverlay($overlay);
                }).catch(() => {
                    status.text(PM_ERROR);
                });
            }

            function sendNewModmail () {
                const body = `${reason}\n\n---\n[[Link to your ${data.kind}](${data.url})]`;

                log.debug('Sending removal message by New Modmail');
                TBApi.apiOauthPOST('/api/mod/conversations', {
                    to: data.author,
                    isAuthorHidden: true,
                    subject,
                    body,
                    srName: data.subreddit,
                }).then(res => {
                    res.json().then(data => {
                        const id = data.conversation.id;
                        // isInternal means mod conversation - can't archive that
                        const isInternal = data.conversation.isInternal;
                        if (autoArchive && !isInternal) {
                            TBApi.apiOauthPOST(`/api/mod/conversations/${id}/archive`).then(() => {
                                removeOverlay($overlay);
                            });
                        } else {
                            removeOverlay($overlay);
                        }
                    }).catch(() => {
                        status.text(MODMAIL_ARCHIVE_ERROR);
                        // Disable Send button as we already sent modmail successfully - avoids multiple modmails
                        $('.save.tb-action-button').prop('disabled', true);
                    });
                }).catch(() => {
                    status.text(MODMAIL_ERROR);
                });
            }
        }
    });

    // Reason textarea/input/select changed
    $body.on(
        'change',
        '.reason-popup td input[id],.reason-popup td textarea[id],.reason-popup td select[id]',
        function () {
            setCache('RReasons', this.id, this.selectedIndex || this.value);
        },
    );
});
