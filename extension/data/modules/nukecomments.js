import $ from 'jquery';

import {createElement} from 'react';
import {renderInSlots} from '../frontends/index.tsx';
import {useFetched} from '../hooks.ts';
import * as TBApi from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import * as TBHelpers from '../tbhelpers.js';
import {Module} from '../tbmodule.jsx';
import * as TBStorage from '../tbstorage.js';
import * as TBui from '../tbui.js';
import {JQueryRenderer} from '../util/ui_interop.tsx';

export default new Module({
    name: 'Comment Nuke',
    id: 'CommentNuke',
    enabledByDefault: false,
    settings: [
        {
            id: 'ignoreDistinguished',
            description: 'Ignore distinguished comments from mods and admins when nuking a chain.',
            type: 'boolean',
            default: true,
        },
        {
            id: 'executionType',
            description: 'Default nuke type selected when nuking',
            type: 'selector',
            values: ['remove', 'lock'],
            default: 'remove',
            advanced: true,
        },
        // Settings for old reddit only
        {
            id: 'showNextToUser',
            description: 'Show nuke button next to the username instead of under the comment.',
            oldReddit: true,
            type: 'boolean',
            default: true,
            advanced: true,
        },
    ],
}, function init ({ignoreDistinguished, showNextToUser, executionType}) {
    // This will contain a flat listing of all comments to be removed.
    let removalChain = [];
    // Distinguished chain
    let distinguishedComments = [];
    // If we do get api errors we put the comment id in here so we can retry removing them.
    let missedComments = [];
    let retryExecutionType = '';
    let removalRunning = false;
    let nukeOpen = false;
    const $body = $('body');

    const self = this;

    // Nuke button clicked
    $body.on('click', '.tb-nuke-button', function (event) {
        self.log('nuke button clicked.');
        if (nukeOpen) {
            TBui.textFeedback('Nuke popup is already open.', TBui.FEEDBACK_NEGATIVE);
            return;
        }
        TBui.longLoadSpinner(true);

        nukeOpen = true;
        removalChain = [];
        missedComments = [];
        retryExecutionType = '';
        distinguishedComments = [];

        const $this = $(this);
        const commentID = $this.attr('data-comment-id');
        const postID = $this.attr('data-post-id');
        const subreddit = $this.attr('data-subreddit');
        const positions = TBui.drawPosition(event);

        const fetchURL = `/r/${subreddit}/comments/${postID}/slug/${commentID}.json?limit=1500`;

        const $popupContents = $(`<div class="tb-nuke-popup-content">
                <div class="tb-nuke-feedback">Fetching all comments belonging to chain.</div>
                <div class="tb-nuke-details"></div>
            </div>`);

        // Pop-up
        const $popup = TBui.popup({
            title: 'Nuke comment chain',
            tabs: [
                {
                    title: 'Nuke tab',
                    tooltip: '',
                    content: $popupContents,
                    footer: `
                        ${TBui.actionButton('Execute', 'tb-execute-nuke')}
                        ${TBui.actionButton('Retry', 'tb-retry-nuke')}
                    `,
                },
            ],
            cssClass: 'nuke-button-popup',
            draggable: true,
            // We don't let the user close this popup while items are being processed, so we use a custom handler
            closable: false,
        }).appendTo($body)
            .css({
                left: positions.leftPosition,
                top: positions.topPosition,
                display: 'block',
            });

        TBApi.getJSON(fetchURL, {raw_json: 1}).then(data => {
            TBStorage.purifyObject(data);
            parseComments(data[1].data.children[0], postID, subreddit).then(() => {
                TBui.longLoadSpinner(false);
                $popup.find('.tb-nuke-feedback').text('Finished analyzing comments.');

                const removalChainLength = removalChain.length;
                // Distinguished chain
                const distinguishedCommentsLength = distinguishedComments.length;
                $popup.find('.tb-nuke-details').html(TBStorage.purify(`
                    <p>${
                    removalChainLength + distinguishedCommentsLength
                } comments found (Already removed comments not included).</p>
                    <p>${distinguishedCommentsLength} distinguished comments found.</p>
                    <p><label><input type="checkbox" class="tb-ignore-distinguished-checkbox" ${
                    ignoreDistinguished ? ' checked="checked"' : ''
                }>Ignore distinguished comments from mods and admins</label></p>
                    <p>
                        <label><input type="radio" value="remove" name="tb-execution-type-radio" class="tb-execution-type-radio" ${
                    executionType === 'remove' ? ' checked="checked"' : ''
                }>Remove comments</label>
                        <label><input type="radio" value="lock" name="tb-execution-type-radio" class="tb-execution-type-radio" ${
                    executionType === 'lock' ? ' checked="checked"' : ''
                }>Lock comments</label>
                    </p>
                    `));
                $popup.find('.tb-execute-nuke').show();
            });
        });

        $popup.on('click', '.tb-execute-nuke, .tb-retry-nuke', function () {
            removalRunning = true;
            TBui.longLoadSpinner(true);
            const $this = $(this);
            $this.hide();
            let commentArray;
            const $nukeFeedback = $popup.find('.tb-nuke-feedback');
            const $nukeDetails = $popup.find('.tb-nuke-details');
            const temptIgnoreDistinguished = $popup.find('.tb-ignore-distinguished-checkbox').prop('checked');
            let executionType = '';
            if ($this.hasClass('tb-retry-nuke')) {
                executionType = retryExecutionType;
                commentArray = missedComments;
                missedComments = [];
            } else {
                executionType = $popup.find('.tb-execution-type-radio:checked').val();
                if (temptIgnoreDistinguished) {
                    commentArray = removalChain;
                } else {
                    commentArray = removalChain.concat(distinguishedComments);
                }
            }

            $nukeFeedback.text(`${executionType === 'remove' ? 'Removing' : 'Locking'} comments.`);
            $nukeDetails.html('');

            // Oldest comments first.
            commentArray = TBHelpers.saneSort(commentArray);
            const removalArrayLength = commentArray.length;
            let removalCount = 0;
            Promise.all(commentArray.map(async comment => {
                removalCount++;
                TBui.textFeedback(
                    `${
                        executionType === 'remove'
                            ? 'Removing'
                            : 'Locking'
                    } comment ${removalCount}/${removalArrayLength}`,
                    TBui.FEEDBACK_NEUTRAL,
                );
                if (executionType === 'remove') {
                    await TBApi.removeThing(`t1_${comment}`, false, false).catch(() => {
                        missedComments.push(comment);
                    });
                } else {
                    await TBApi.lock(`t1_${comment}`, false).catch(() => {
                        missedComments.push(comment);
                    });
                }
            })).then(() => {
                removalRunning = false;
                TBui.longLoadSpinner(false);
                $nukeFeedback.text(`Done ${executionType === 'remove' ? 'removing' : 'locking'} comments.`);
                const missedLength = missedComments.length;
                if (missedLength) {
                    retryExecutionType = executionType;
                    $nukeDetails.text(
                        `${missedLength}: not ${
                            executionType === 'remove' ? 'removed' : 'locked'
                        } because of API errors. Hit retry to attempt removing them again.`,
                    );
                    $popup.find('.tb-retry-nuke').show();
                } else {
                    setTimeout(() => {
                        $popup.find('.close').click();
                    }, 1500);
                }
            });
        });

        // Handle popup close button, with custom logic to prevent the close if currently running
        $popup.on('click', '.close', event => {
            event.stopPropagation();
            if (removalRunning) {
                TBui.textFeedback('Comment chain nuke in progress, cannot close popup.', TBui.FEEDBACK_NEGATIVE);
            } else {
                $popup.remove();
                nukeOpen = false;
            }
        });
    });

    /**
     * Will given a reddit API comment object go through the chain and put all comments
     * @function parseComments
     * @param {object} object Comment chain object
     * @param {string} postID Post id the comments belong to
     * @param {string} subreddit Subreddit the comment chain belongs to.
     * @returns {Promise}
     */

    async function parseComments (object, postID, subreddit) {
        switch (object.kind) {
            case 'Listing': {
                for (let i = 0; i < object.data.children.length; i++) {
                    await parseComments(object.data.children[i], postID, subreddit);
                }
                break;
            }

            case 't1': {
                const distinguishedType = object.data.distinguished;
                if (
                    (distinguishedType === 'admin' || distinguishedType === 'moderator')
                    && !distinguishedComments.includes(object.data.id)
                ) {
                    distinguishedComments.push(object.data.id);
                    // Ignore already removed stuff to lower the amount of calls we need to make.
                } else if (!removalChain.includes(object.data.id) && !object.data.removed && !object.data.spam) {
                    removalChain.push(object.data.id);
                }

                if (
                    Object.prototype.hasOwnProperty.call(object.data, 'replies') && object.data.replies
                    && typeof object.data.replies === 'object'
                ) {
                    await parseComments(object.data.replies, postID, subreddit); // we need to go deeper.
                }
                break;
            }

            case 'more':
                {
                    self.log('"load more" encountered, going even deeper');
                    let commentIDs = object.data.children;
                    if (!commentIDs.length) {
                        // "continue this thread" links generated when a thread gets
                        // too deep return empty `children` lists, thanks Reddit
                        commentIDs = [object.data.parent_id.substring(3)];
                    }

                    for (const id of commentIDs) {
                        const fetchUrl = `/r/${subreddit}/comments/${postID}/slug/${id}.json?limit=1500`;
                        // Lets get the comments.
                        const data = await TBApi.getJSON(fetchUrl, {raw_json: 1});
                        TBStorage.purifyObject(data);
                        await parseComments(data[1].data.children[0], postID, subreddit);
                    }
                }
                break;
            default: {
                self.log('default, this should not happen...');
                // This shouldn't actually happen...
            }
        }
    }

    // Add nuke buttons where needed
    // XXX 3: this also needs to be able to appear in hovercards apparently?? what
    // the fuck is going on with all the special casing in this goddamn module
    renderInSlots(['commentAuthor'], ({details, location}) => {
        const subreddit = details.subreddit.name;
        const commentID = details.comment.fullname.substring(3);
        const submissionID = details.submission?.fullname.substring(3);

        const isMod = useFetched(TBCore.isModSub(subreddit));
        if (!commentID || !submissionID || !isMod) {
            return null;
        }

        // XXX: implement the old check that makes this only show up in comments
        // trees and context pages and context popups. i don't know how this
        // will be done but we do not want this button showing up on single
        // comments in flat listings because thats just not reasonable and we
        // dont want to encourage people to act on a whole tree in a vacuum

        const NukeButtonHTML =
            `<span class="tb-nuke-button tb-bracket-button" data-comment-id="${commentID}" data-post-id="${submissionID}" data-subreddit="${subreddit}" title="Remove comment chain starting with this comment">${
                location === 'userHovercard' ? 'Nuke' : 'R'
            }</span>`;

        // XXX 2: implement showNextToUser setting. for now we always show next
        // to the author name because we don't have any other slots implemented
        // on comments but when this changes we should revisit this. old logic:
        //     if (showNextToUser && TBCore.isOldReddit) {
        //         const $userContainter = $target.closest('.entry, .tb-comment-entry').find(
        //             '.tb-jsapi-author-container .tb-frontend-container',
        //         );
        //         $userContainter.append(NukeButtonHTML);
        //     } else {
        //         $target.append(NukeButtonHTML);
        //     }

        return createElement(JQueryRenderer, {content: $(NukeButtonHTML)});
    });
});
