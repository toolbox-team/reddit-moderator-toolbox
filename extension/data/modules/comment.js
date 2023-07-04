import $ from 'jquery';

import {Module} from '../tbmodule.js';
import * as TBStorage from '../tbstorage.js';
import * as TBApi from '../tbapi.js';
import * as TBui from '../tbui.js';
import * as TBHelpers from '../tbhelpers.js';
import * as TBCore from '../tbcore.js';
import TBListener from '../tblistener.js';

const self = new Module({
    name: 'Comments',
    id: 'Comments',
    enabledByDefault: true,
    settings: [
        {
            id: 'commentsAsFullPage',
            type: 'boolean',
            default: false,
            advanced: false,
            description: 'Always open comments as new page (instead of lightbox).',
        },
        {
            id: 'openContextInPopup',
            type: 'boolean',
            default: true,
            beta: false,
            description: 'Add a link to comments where appropiate to open the context in a popup on page.',
        },
        {
            id: 'highlighted',
            type: 'list',
            default: [],
            description: 'Highlight keywords. Keywords should entered separated by a comma without spaces.',
        },
        // Settings for old reddit only
        {
            id: 'hideRemoved',
            type: 'boolean',
            default: false,
            advanced: true,
            description: 'Hide removed comments by default.',
            oldReddit: true,
        },
        {
            id: 'approveComments',
            type: 'boolean',
            default: false,
            description: 'Show approve button on all comments.',
            oldReddit: true,
        },
        {
            id: 'spamRemoved',
            type: 'boolean',
            default: false,
            description: 'Show spam button on comments removed as ham.',
            oldReddit: true,
        },
        {
            id: 'hamSpammed',
            type: 'boolean',
            default: false,
            description: 'Show remove (not spam) button on comments removed as spam.',
            oldReddit: true,
        },
        {
            id: 'showHideOld',
            type: 'boolean',
            default: true,
            advanced: false,
            description: 'Show button to hide old comments.',
            oldReddit: true,
        },
    ],
}, init);

self.initOldReddit = async function ({hideRemoved, approveComments, spamRemoved, hamSpammed}) {
    const $body = $('body');
    //
    // preload some generic variables
    //
    self.hideRemoved = hideRemoved;
    self.approveComments = approveComments;
    self.spamRemoved = spamRemoved;
    self.hamSpammed = hamSpammed;

    function run () {
        //
        //  Do stuff with removed comments
        //
        // Show a removed comments counter when visiting a comment page on a sub where you are moderator. When hiding of removed comments is enabled this doubles as a toggle for that.
        let removedCounter = 0;

        $('.comments-page .thing.comment.spam > .entry').each(function () {
            $(this).addClass('tb-comment-spam');
            removedCounter += 1;
        });

        self.log(removedCounter);

        if ($('#tb-bottombar').find('#tb-toggle-removed').length) {
            const $tbToggle = $('#tb-bottombar').find('#tb-toggle-removed');
            if (removedCounter === 1) {
                $tbToggle.html(`<span class="tb-icons tb-icons-align-middle">${TBui.icons.comments}</span>[1]`);
            } else if (removedCounter > 1) {
                $tbToggle.html(`<span class="tb-icons tb-icons-align-middle">${TBui.icons.comments}</span>[${removedCounter.toString()}]`);
            }
        } else if (removedCounter === 1) {
            $('#tb-bottombar').find('#tb-toolbarcounters').prepend(`<a id="tb-toggle-removed" title="Toggle hide/view removed comments" href="javascript:void(0)"><span class="tb-icons tb-icons-align-middle">${TBui.icons.comments}</span>[1]</a>`);
        } else if (removedCounter > 1) {
            $('#tb-bottombar').find('#tb-toolbarcounters').prepend(`<a id="tb-toggle-removed" title="Toggle hide/view removed comments" href="javascript:void(0)"><span class="tb-icons tb-icons-align-middle">${TBui.icons.comments}</span>[${removedCounter.toString()}]</a>`);
        }

        if (self.hideRemoved) {
            $('.tb-comment-spam').hide();
            $('.action-reason').hide();
        }

        if (self.approveComments || self.spamRemoved || self.hamSpammed) {
            // only need to iterate if at least one of the options is enabled
            const $things = $('.thing.comment:not(.tb-comments-checked)');
            TBCore.forEachChunkedDynamic($things, async item => {
                const $thing = $(item);
                $thing.addClass('tb-comments-checked');

                const thing = await TBCore.getThingInfo($thing, true);

                if (self.approveComments) {
                    // only for subreddits we mod
                    // and for comments that haven't already been approved
                    if (thing.subreddit && !thing.approved_by) {
                        // and only if there isn't already one
                        if ($thing.children('.entry').find('.buttons .positive').length === 0) {
                            $(`<li class="tb-replacement"><a class="tb-comment-button tb-comment-button-approve" data-fullname="${thing.id}" href="javascript:void(0)">approve</a></li>`)
                                .insertAfter($thing.children('.entry').find('input[value="removed"]').closest('li'));
                        }
                    }
                }

                if (self.spamRemoved) {
                    // only for subreddits we mod
                    // and for comments that have been removed as ham ("remove not spam")
                    if (thing.subreddit && thing.ham) {
                        // and only if there isn't already one
                        if ($thing.children('.entry').find('.big-mod-buttons .negative').length === 0) {
                            $(`<li class="tb-replacement"><a class="tb-comment-button tb-big-button tb-comment-button-spam" data-fullname="${thing.id}" href="javascript:void(0)">spam</a></li>`)
                                .insertBefore($thing.children('.entry').find('.big-mod-buttons'));
                        }
                    }
                }

                if (self.hamSpammed) {
                    // only for subreddits we mod
                    // and for comments that have been removed as spam ("spam" or "confirm spam")
                    if (thing.subreddit && thing.spam) {
                        // and only if there isn't already one
                        if ($thing.children('.entry').find('.big-mod-buttons .neutral').length === 0) {
                            $(`<li class="tb-replacement"><a class="tb-comment-button tb-big-button tb-comment-button-remove" data-fullname="${thing.id}" href="javascript:void(0)">remove</a></li>`)
                                .insertBefore($thing.children('.entry').find('.big-mod-buttons'));
                        }
                    }
                }
            });
        }
    }

    // Perform comment actions on pages where you are mod and which are not modmail.
    if (TBCore.isMod && !TBCore.isModmail) {
        $body.on('click', '#tb-toggle-removed', () => {
            const $comment_spam = $('.tb-comment-spam');
            if ($comment_spam.is(':visible')) {
                $comment_spam.hide();
                $('.action-reason').hide();
            } else {
                $comment_spam.show();
                $('.action-reason').show();
            }
        });
        // Let's support selfpost expandos
        $body.on('click', '.expando-button.selftext', () => {
            setTimeout(run, 1000);
        });

        // NER support.
        window.addEventListener('TBNewThings', () => {
            run();
        });

        run();
    }

    let hidden = false;
    function addHideModButton () {
        // hide mod comments option.
        if (TBCore.isUserPage) {
            const $modActions = $('.moderator, [data-subreddit="spam"]');
            if ($modActions.length > 0) {
                self.log('found mod actions');

                if ($('.tb-hide-mod-comments').length < 1) {
                    $('.menuarea').append('&nbsp;&nbsp;<a href="javascript:;" name="hideModComments" class="tb-hide-mod-comments tb-general-button">hide mod actions</a>');

                    $body.on('click', '.tb-hide-mod-comments', function () {
                        self.log('hiding mod actions');
                        hidden = true;
                        $modActions.closest('.thing').hide();
                        $(this).hide();
                    });
                }
            }
        }
    }
    addHideModButton();

    // NER support.
    window.addEventListener('TBNewThings', () => {
        addHideModButton();
        if (hidden) {
            self.log('hiding mod actions');
            $('.moderator, [data-subreddit="spam"]').closest('.thing').hide();
        }
    });

    // hide old comments
    if (await self.get('showHideOld')) {
        const NO_HIGHLIGHTING = 'no highlighting',
              $commentvisits = $('#comment-visits');

        $('.comment-visits-box').css('max-width', 650).find('.title').append('&nbsp;&nbsp;<a href="javascript:;" class="tb-hide-old tb-general-button">hide old</a>');

        $body.on('click', '.tb-hide-old', () => {
            self.log('hiding old comments');
            $('.entry').show(); // reset before hiding.
            $('.old-expand').removeClass('old-expand'); // new old expands

            // this likely isn't language safe.
            if ($commentvisits.find('option:selected').text() === NO_HIGHLIGHTING) {
                return;
            }

            $('.thing:not(.new-comment,.link)').each(function () {
                const $this = $(this);
                $this.toggleClass('old-expand');

                $this.find('.entry:first').hide();
            });
        });

        $body.on('click', '.old-expand', function () {
            $(this).removeClass('old-expand').children().show();
        });

        $body.on('change', '#comment-visits', () => {
            const $hideOld = $('.tb-hide-old');
            $hideOld.text('hide old');
            if ($commentvisits.find('option:selected').text() === NO_HIGHLIGHTING) {
                $hideOld.text('show all');
            }
        });
    }
};

function init ({
    commentsAsFullPage,
    openContextInPopup,
    hideRemoved,
    approveComments,
    spamRemoved,
    hamSpammed,
    highlighted,
}) {
    const $body = $('body');

    if (TBCore.isOldReddit) {
        self.initOldReddit({hideRemoved, approveComments, spamRemoved, hamSpammed});
    }
    // Do not open lightbox but go to full comment page.
    if (commentsAsFullPage && !TBCore.isOldReddit && !TBCore.isNewModmail) {
        $body.on('click', 'a', function (event) {
            const subredditCommentsPageReg = /^\/r\/([^/]*?)\/comments\/([^/]*?)\/([^/]*?)\/?$/;
            const $this = $(this);
            const thisHref = $this.attr('href');
            if (subredditCommentsPageReg.test(thisHref)) {
                event.preventDefault();
                window.location.href = thisHref;
            }
        });
    }

    if (highlighted.length) {
        TBListener.on('comment', async e => {
            const $target = $(e.target);
            const subreddit = e.detail.data.subreddit.name;

            const isMod = await TBCore.isModSub(subreddit);
            if (isMod) {
                $target.closest('.tb-comment, .entry').find('.md').highlight(highlighted);
                $target.closest('.Comment').find('p').highlight(highlighted);
            }
        });

        $body.on('click', '.expando-button', async function () {
            const $this = $(this);
            const $thing = $this.closest('.thing');
            const thingInfo = await TBCore.getThingInfo($thing, true);
            if (thingInfo.subreddit) {
                setTimeout(() => {
                    $thing.find('.md').highlight(highlighted);
                }, 200);
            }
        });

        window.addEventListener('TBNewPage', async event => {
            const pageType = event.detail.pageType;

            if (pageType === 'subredditCommentPermalink' || pageType === 'subredditCommentsPage') {
                const subreddit = event.detail.subreddit;
                const isMod = await TBCore.isModSub(subreddit);
                if (isMod) {
                    $body.find('div[data-test-id="post-content"], .link .usertext-body').find('p').highlight(highlighted);
                }
            }
        });
    }

    // Add flat view link.
    window.addEventListener('TBNewPage', event => {
        if (event.detail.pageType === 'subredditCommentsPage') {
            TBui.contextTrigger('tb-flatview-link', {
                addTrigger: true,
                title: 'View comments for this thread in chronological flat view.',
                triggerText: 'comment flat view',
                triggerIcon: TBui.icons.list,
            });
        } else {
            TBui.contextTrigger('tb-flatview-link', {addTrigger: false});
        }
    });

    $body.on('click', '#tb-flatview-link', async () => {
        const flatListing = {}; // This will contain all comments later on.
        let idListing = []; // this will list all IDs in order from which we will rebuild the comment area.

        // deconstruct the json we got.

        function parseComments (object) {
            switch (object.kind) {
            case 'Listing':
                for (let i = 0; i < object.data.children.length; i++) {
                    parseComments(object.data.children[i]);
                }

                break;

            case 't1':
                flatListing[object.data.id] = JSON.parse(JSON.stringify(object)); // deep copy, we don't want references
                idListing.push(object.data.id);

                if (Object.prototype.hasOwnProperty.call(flatListing[object.data.id].data, 'replies') && flatListing[object.data.id].data.replies && typeof flatListing[object.data.id].data.replies === 'object') {
                    parseComments(object.data.replies); // we need to go deeper.
                }
                break;

            default:
                break;
            }
        }

        // Variables we need later on to be able to reconstruct comments.
        const $windowContent = $(`
            <div id="tb-flatview-search">
            Filter by name: <input type="text" id="tb-flatview-search-name" class="tb-flatview-search-input tb-input" placeholder="start typing...">
            Filter by content: <input type="text" id="tb-flatview-search-content" class="tb-flatview-search-input tb-input" placeholder="start typing...">
            <span id="tb-flatview-search-count">0</span>
            </div>
            <div id="tb-sitetable"></div>`);

        // add the new comment list to the page.
        const $flatViewOverlay = TBui.overlay(
            'Flatview',
            [
                {
                    title: 'Flatview',
                    tooltip: 'commentFlatview.',
                    content: $windowContent,
                    footer: '',
                },
            ],
            [], // extra header buttons
            'tb-flat-view', // class
            false, // single overriding footer
        ).appendTo('body');

        $flatViewOverlay.hide();

        $body.on('click', '.tb-flat-view .close', () => {
            $('.tb-flat-view').remove();
            $body.css('overflow', 'auto');
        });
        const $flatSearchCount = $body.find('#tb-flatview-search-count');
        const $htmlCommentView = $body.find('#tb-sitetable'); // This will contain the new html we will add to the page.

        $body.find('.tb-flatview-search-input').keyup(() => {
            self.log('typing');
            const FlatViewSearchName = $body.find('#tb-flatview-search-name').val();
            const FlatViewSearchContent = $body.find('#tb-flatview-search-content').val();

            self.log(FlatViewSearchName);
            self.log(FlatViewSearchContent);

            $htmlCommentView.find('.tb-comment').each(function () {
                const $this = $(this);

                const flatUserName = $this.find('.tb-tagline a.tb-comment-author').text();
                const flatContent = $this.find('.tb-comment-body .md').text();

                if (flatUserName.toUpperCase().indexOf(FlatViewSearchName.toUpperCase()) < 0 || flatContent.toUpperCase().indexOf(FlatViewSearchContent.toUpperCase()) < 0) {
                    $this.hide();
                } else {
                    $this.show();
                }
                $flatSearchCount.text($htmlCommentView.find('.tb-comment:visible').length);
            });
        });

        TBui.longLoadSpinner(true); // We are doing stuff, fire up the spinner that isn't a spinner!

        // construct the url from which we grab the comments json.
        const jsonurl = `${location.pathname}.json`;
        TBui.textFeedback('Fetching comment data.', TBui.FEEDBACK_NEUTRAL);
        // Lets get the comments.
        const data = await TBApi.getJSON(`${jsonurl}.json?limit=1500`, {raw_json: 1});
        TBStorage.purifyObject(data);
        // put the json through our deconstructor.
        data[1].isreply = false;
        parseComments(data[1]);
        // and get back a nice flat listing of ids
        idListing = TBHelpers.saneSortAs(idListing);
        const commentOptions = {
            parentLink: true,
            contextLink: true,
            fullCommentsLink: true,
            noOddEven: true,
            contextPopup: openContextInPopup,
        };
        let count = 0;
        // from each id in the idlisting we construct a new comment.
        TBCore.forEachChunkedDynamic(idListing, value => {
            count++;
            const msg = `Building comment ${count}/${idListing.length}`;
            TBui.textFeedback(msg, TBui.FEEDBACK_NEUTRAL);
            const $comment = TBui.makeSingleComment(flatListing[value], commentOptions);
            $htmlCommentView.append($comment);
        }).then(() => {
            $flatSearchCount.text(count);
            setTimeout(() => {
                TBui.tbRedditEvent($htmlCommentView);
                TBui.longLoadSpinner(false);
                $body.css('overflow', 'hidden');
                $flatViewOverlay.show();
            }, 1000);
        });
    });
    if (openContextInPopup) {
        // Add context button to the queue in old reddit
        if (TBCore.isOldReddit && (TBCore.isModpage || TBCore.isUserPage || TBCore.isSubCommentsPage)) {
            TBListener.on('comment', e => {
                const $target = $(e.target);
                const data = e.detail.data;
                const commentName = data.id;
                const postID = data.post.id.substring(3);
                const commentID = data.id.substring(3);
                const commentPermalink = `/r/${data.subreddit.name}/comments/${postID}/-/${commentID}/`;
                const $contextLink = $(`
                        <li>
                            <a class="tb-comment-button tb-comment-context-popup" href="javascript:;" data-comment-id="${commentName}" data-context-json-url="${commentPermalink}.json?context=3">context-popup</a>
                        </li>`);

                $target.closest('.entry').find('.flat-list.buttons a.bylink[data-event-action="context"]').closest('li').after($contextLink);
            });
        }

        self.log('openContextInPopup enabled.');

        $body.on('click', '.tb-comment-context-popup', function (event) {
            self.log('Context button clicked.');

            const $this = $(this);

            const $overlay = $this.closest('.tb-page-overlay');
            const positions = TBui.drawPosition(event);

            let $appendTo;
            if ($overlay.length) {
                $appendTo = $overlay;
            } else {
                $appendTo = $body;
            }
            const commentID = $this.attr('data-comment-id');
            // Grab the url.
            let contextUrl = $this.attr('data-context-json-url');
            if (contextUrl.indexOf('.reddit.com') >= 0) {
                contextUrl = contextUrl.replace(/https?:\/\/[^.]+\.reddit\.com/, '');
            }

            // Get the context
            TBApi.getJSON(contextUrl, {raw_json: 1}).then(data => {
                TBStorage.purifyObject(data);

                // data[1] is a listing containing comments
                // if there are no comments in the listing, the thing we're trying to get context for has been
                // removed/deleted and has no parents (if it had parents, the parents would still show up here)
                if (!data[1].data.children.length) {
                    TBui.textFeedback('Content inaccessible; removed or deleted?', TBui.FEEDBACK_NEGATIVE);
                    return;
                }

                const commentOptions = {
                    parentLink: true,
                    contextLink: true,
                    fullCommentsLink: true,
                };

                const $comments = TBui.makeCommentThread(data[1].data.children, commentOptions);
                const contextUser = data[1].data.children[0].data.author;
                const contextSubreddit = data[1].data.children[0].data.subreddit;

                // Title is probably also nice.
                const contextTitle = `Context for /u/${contextUser} in /r/${contextSubreddit}`;

                // Build the context popup and once that is done append it to the body.
                TBui.popup({
                    title: contextTitle,
                    tabs: [
                        {
                            title: 'Context tab',
                            tooltip: 'Tab with context for comment.',
                            content: $comments,
                            footer: '',
                        },
                    ],
                    cssClass: 'context-button-popup',
                    draggable: true,
                }).appendTo($appendTo)
                    .css({
                        left: positions.leftPosition,
                        top: positions.topPosition,
                        display: 'block',
                    });
                TBui.tbRedditEvent($comments);
                $comments.find(`.tb-thing[data-comment-id="${commentID}"] > .tb-comment-entry`).css('background-color', '#fff8d5');
            });
        });
    }
}

export default self;
