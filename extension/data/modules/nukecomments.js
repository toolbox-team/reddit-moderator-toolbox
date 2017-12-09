/** @module CommentNuke */
function nukecomments() {


    let self = new TB.Module('Comment Nuke');
    self.shortname = 'CommentNuke';

    ////Default settings
    self.settings['enabled']['default'] = false;
    self.config['betamode'] = false;

    self.register_setting('ignoreDistinguished', {
        'type': 'boolean',
        'default': true,
        'title': 'Ignore distinguished comments from mods and admins when nuking a chain.'
    });


    self.init = function () {
        // This will contain a flat listing of all comments to be removed.
        let removalChain = [];
        // Distinguished chain
        let distinguishedComments = [];
        // If we do get api errors we put the comment id in here so we can retry removing them.
        let missedComments = [];
        let removalRunning = false;
        let nukeOpen = false;
        let $body = $('body');

        let ignoreDistinguished = self.setting('ignoreDistinguished');

        // Nuke button clicked
        $body.on('click', '.tb-nuke-button', function (event) {
            self.log('nuke button clicked.');
            if(nukeOpen) {
                TB.ui.textFeedback('Nuke popup is already open.', TBui.FEEDBACK_NEGATIVE);
                return;
            }
            TB.ui.longLoadSpinner(true);

            nukeOpen = true;
            removalChain = [];
            missedComments = [];
            distinguishedComments = [];

            const $this = $(this);
            const commentID = $this.attr('data-comment-id');
            const postID = $this.attr('data-post-id');
            const subreddit  = $this.attr('data-subreddit');
            const positions = TBui.drawPosition(event);

            const fetchURL = `${TBUtils.baseDomain}/r/${subreddit}/comments/${postID}/slug/${commentID}.json?limit=1500`;

            let $popupContents = $(`<div class="tb-nuke-popup-content">
                <div class="tb-nuke-feedback">Fetching all comments belonging to chain.</div>
                <div class="tb-nuke-details"></div>
            </div>`);

            // Pop-up
            let $popup = TB.ui.popup(
                'Nuke comment chain',
                [
                    {
                        title: 'Nuke tab',
                        tooltip: '',
                        content: $popupContents,
                        footer: '<button class="tb-execute-nuke tb-action-button">Execute</button> <button class="tb-retry-nuke tb-action-button">Retry</button>'
                    }
                ],
                '',
                'nuke-button-popup',
                {
                    draggable: true
                }
            ).appendTo($body)
                .css({
                    left: positions.leftPosition,
                    top: positions.topPosition,
                    display: 'block'
                });

            $.getJSON(fetchURL, {raw_json: 1}).done(function (data) {

                parseComments(data[1].data.children[0], postID, subreddit, function() {
                    TB.ui.longLoadSpinner(false);
                    $popup.find('.tb-nuke-feedback').text('Finished analyzing comments.');

                    const removalChainLength = removalChain.length;
                    // Distinguished chain
                    const distinguishedCommentsLength = distinguishedComments.length;

                    $popup.find('.tb-nuke-details').html(`
                    <p>${removalChainLength + distinguishedCommentsLength} comments found (Already removed comments not included).</p>
                    <p>${distinguishedCommentsLength} distinguished comments found.</p>
                    <p><label><input type="checkbox" class="tb-ignore-distinguished-checkbox" ${ignoreDistinguished ? ` checked="checked"` : ``}>Ignore distinguished comments from mods and admins</label></p>
                    `);
                    $popup.find('.tb-execute-nuke').show();

                });

            });

            $popup.on('click', '.tb-execute-nuke, .tb-retry-nuke', function() {
                removalRunning = true;
                TB.ui.longLoadSpinner(true);
                const $this = $(this);
                $this.hide();
                let removalArray;
                let $nukeFeedback = $popup.find('.tb-nuke-feedback');
                let $nukeDetails = $popup.find('.tb-nuke-details');
                const temptIgnoreDistinguished = $popup.find('.tb-ignore-distinguished-checkbox').prop('checked');
                if($this.hasClass('tb-retry-nuke')) {
                    removalArray = missedComments;
                    missedComments = [];
                } else {
                    if(temptIgnoreDistinguished) {
                        removalArray = removalChain;
                    } else {
                        removalArray = removalChain.concat(distinguishedComments);
                    }
                }

                $nukeFeedback.text('Removing comments.');
                $nukeDetails.html(``);

                // Oldest comments first.
                removalArray = TBUtils.saneSort(removalArray);
                const removalArrayLength = removalArray.length;
                let removalCount = 0;
                TBUtils.forEachChunkedRateLimit(removalArray, 20, function (comment) {
                    removalCount++;
                    TB.ui.textFeedback(`Removing comment ${removalCount}/${removalArrayLength}`, TB.ui.FEEDBACK_NEUTRAL);
                    TBUtils.removeThing(`t1_${comment}`, false, function(result) {
                        if(!result) {
                            missedComments.push(comment);
                        }
                    });
                }, function() {
                    setTimeout(function() {
                        removalRunning = false;
                        TB.ui.longLoadSpinner(false);
                        $nukeFeedback.text('Done removing comments.');
                        const missedLength = missedComments.length;
                        if(missedLength) {
                            $nukeDetails.text(`${missedLength}: not removed because of API errors. Hit retry to attempt removing them again.`);
                            $popup.find('.tb-retry-nuke').show;
                        }
                    }, 1000);
                });

            });

            $popup.on('click', '.close', function () {
                if(removalRunning) {
                    TB.ui.textFeedback('Comment chain nuke in progress, cannot close popup.', TBui.FEEDBACK_NEGATIVE);
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
         * @param {function} callback
         */

        function parseComments(object, postID, subreddit, callback) {
            switch (object.kind) {

            case 'Listing': {
                for (let i = 0; i < object.data.children.length; i++) {
                    parseComments(object.data.children[i], postID, subreddit, function() {
                        return callback();
                    });
                }
            }
                break;

            case 't1': {
                const distinguishedType = object.data.distinguished;
                if((distinguishedType === 'admin' || distinguishedType === 'moderator') && !distinguishedComments.includes(object.data.id)) {
                    distinguishedComments.push(object.data.id);
                // Ignore already removed stuff to lower the amount of calls we need to make.
                } else if(!removalChain.includes(object.data.id) && !object.data.removed && !object.data.spam) {
                    removalChain.push(object.data.id);
                }

                if (object.data.hasOwnProperty('replies') && object.data.replies && typeof object.data.replies === 'object') {
                    parseComments(object.data.replies, postID, subreddit, function() {
                        return callback();
                    }); // we need to go deeper.
                } else {
                    return callback();
                }
            }
                break;

            case 'more': {
                self.log('"load more" encountered, going even deeper');
                const commentIDs = object.data.children;
                const commentIDcount = commentIDs.length;
                let processCount = 0;


                commentIDs.forEach(function(id) {
                    const fetchUrl = `${TBUtils.baseDomain}/r/${subreddit}/comments/${postID}/slug/${id}.json?limit=1500`;
                    // Lets get the comments.
                    $.getJSON(fetchUrl, {raw_json: 1}).done(function (data) {
                        parseComments(data[1].data.children[0], postID, subreddit, function() {
                            processCount++;

                            if(processCount === commentIDcount) {
                                return callback();
                            }
                        });
                    });
                });
            }
                break;
            default: {
                self.log('default, this should not happen...');
                // This shouldn't actually happen...
                return callback();
            }

            }
        }

        // Add nuke buttons where needed
        TB.listener.on('comment', function(e) {
            const pageType = TBUtils.pageDetails.pageType;
            const $target = $(e.target);
            const subreddit = e.detail.data.subreddit.name;
            const commentID = e.detail.data.id.substring(3);
            const postID = e.detail.data.post.id.substring(3);

            TBUtils.getModSubs(function () {
                if(TBUtils.modsSub(subreddit) && (pageType=== 'subredditCommentsPage' || pageType === 'subredditCommentPermalink')) {
                    const NukeButtonHTML = `<span class="tb-nuke-button tb-bracket-button" data-comment-id="${commentID}" data-post-id="${postID}" data-subreddit="${subreddit}" title="Remove comment chain starting with this comment">R</span>`;

                    $target.append(NukeButtonHTML);

                }
            });
        });


    };




    TB.register_module(self);
} // nukecomments() wrapper

(function() {
    window.addEventListener('TBModuleLoaded2', function () {
        nukecomments();
    });
})();
