import $ from 'jquery';

import {Module} from '../tbmodule.js';
import * as TBCore from '../tbcore.js';

const self = new Module({
    name: 'Old Reddit',
    id: 'oldreddit',
    alwaysEnabled: true,
}, () => {
    // Looks like we are on old reddit. Activate!
    if (TBCore.isOldReddit) {
        setTimeout(() => {
            thingCrawler();

            window.addEventListener('TBNewThings', () => {
                thingCrawler();
            });
        }, 500);
    }

    if (TBCore.isNewModmail) {
        const $body = $('body');

        $body.on('click', '.icon-user', () => {
            setTimeout(() => {
                newModmailSidebar();
            }, 500);
        });

        $body.on('click', '.Thread__grouped', () => {
            setTimeout(() => {
                newModmailConversationAuthors();
            }, 500);
        });

        window.addEventListener('TBNewPage', event => {
            if (event.detail.pageType === 'modmailConversation') {
                setTimeout(() => {
                    newModmailSidebar();
                    newModmailConversationAuthors();
                }, 500);
            }
        });
    }
});
export default self;

function dispatchApiEvent (element, object) {
    const apiEvent = new CustomEvent('tbReddit', {detail: object});
    try {
        element.dispatchEvent(apiEvent);
    } catch (error) {
        self.log('Could not dispatch event', object);
    }
}

/**
 * Handles `thing` items as they become visible in the viewport.
 * @function
 * @param {IntersectionObserverEntry[]} entries
 * @param {IntersectionObserver} observer
 */
function handleThing (entries, observer) {
    entries.forEach(async entry => {
        // The observer fires for everything on page load.
        // This makes sure that we really only act on those items that are visible.
        if (!entry.isIntersecting) {
            return;
        }

        // Element is visible, we only want to handle it once. Stop observing.
        observer.unobserve(entry.target);
        const $thing = $(entry.target);

        // If the element's parent is updated, sometimes it gets emitted again anyway.
        // Check for existing containers and avoid adding duplicates.
        if ($thing.find('> .entry > .tb-jsapi-container').length) {
            return;
        }

        const info = await TBCore.getThingInfo($thing);

        requestAnimationFrame(() => {
            const $jsApiThingPlaceholder = $('<div class="tb-jsapi-container"></div>').appendTo($thing.find('.entry:first'));
            $jsApiThingPlaceholder.append('<span data-name="toolbox">');
            const jsApiThingPlaceholder = $jsApiThingPlaceholder[0];
            $thing.find('.entry:first .author:first, .entry:first .tagline:first > span:contains("[deleted]")').after('<span class="tb-jsapi-author-container"></span>');
            const $jsApiPlaceholderAuthor = $thing.find('.tb-jsapi-author-container');
            $jsApiPlaceholderAuthor.append('<span data-name="toolbox">');
            const jsApiPlaceholderAuthor = $jsApiPlaceholderAuthor[0];

            if (!$jsApiThingPlaceholder.length) {
                return;
            }

            if (info.kind === 'submission') {
                if (!$jsApiThingPlaceholder.hasClass('tb-frontend-container')) {
                    const detailObject = {
                        type: 'TBpost',
                        data: {
                            author: info.author || '[deleted]',
                            id: info.id,
                            isRemoved: info.ham || info.spam,
                            permalink: `https://www.reddit.com/${info.postlink.replace(/https?:\/\/...?\.reddit\.com\/?/, '').replace(/^\//, '')}`,
                            subreddit: {
                                name: info.subreddit,
                                type: info.subredditType,
                            },
                        },
                    };

                    dispatchApiEvent(jsApiThingPlaceholder, detailObject);
                }
                // We don't want to send events for things already handled.
                if (!$jsApiPlaceholderAuthor.hasClass('tb-frontend-container')) {
                    const detailObject = {
                        type: 'TBpostAuthor',
                        data: {
                            author: info.author || '[deleted]',
                            post: {
                                id: info.id,
                            },
                            subreddit: {
                                name: info.subreddit,
                                type: info.subredditType,
                            },
                        },
                    };
                    dispatchApiEvent(jsApiPlaceholderAuthor, detailObject);
                }
            }

            if (info.kind === 'comment') {
                // Comment
                if (!$jsApiThingPlaceholder.hasClass('tb-frontend-container')) {
                    const detailObject = {
                        type: 'TBcommentOldReddit',
                        data: {
                            author: info.author || '[deleted]',
                            post: {
                                id: info.postID,
                            },
                            isRemoved: info.ham || info.spam,
                            id: info.id,
                            subreddit: {
                                name: info.subreddit,
                                type: info.subredditType,
                            },
                        },
                    };

                    dispatchApiEvent(jsApiThingPlaceholder, detailObject);
                }
                // Author
                // We don't want to send events for things already handled.
                if (!$jsApiPlaceholderAuthor.hasClass('tb-frontend-container')) {
                    const detailObject = {
                        type: 'TBcommentAuthor',
                        data: {
                            author: info.author || '[deleted]',
                            post: {
                                id: info.postID,
                            },
                            comment: {
                                id: info.id,
                            },
                            subreddit: {
                                name: info.subreddit,
                                type: info.subredditType,
                            },
                        },
                    };
                    dispatchApiEvent(jsApiPlaceholderAuthor, detailObject);
                }
            }
        });
    });
}

const viewportObserver = new IntersectionObserver(handleThing, {
    rootMargin: '200px',
});

function thingCrawler () {
    const $things = $('div.content .thing:not(.tb-seen) .entry').closest('.thing');
    $things.each(function () {
        requestAnimationFrame(() => {
            $(this).addClass('tb-seen');
            viewportObserver.observe(this);
        });
    });
}

function newModmailConversationAuthors () {
    const $body = $('body');
    const subreddit = $body.find('.ThreadTitle__community').text();
    $body.find('.Thread__message:not(.tb-seen)').each(function () {
        const $this = $(this);
        $this.addClass('tb-seen');
        const $jsApiThingPlaceholder = $(`
                <span class="tb-jsapi-container">
                    <span data-name="toolbox"></span>
                </span>
            `).insertAfter($this.find('.Message__divider').eq(0));
        const jsApiThingPlaceholder = $jsApiThingPlaceholder[0];

        const authorHref = $this.find('.Message__header .Message__author').attr('href');
        const author = authorHref === undefined ? '[deleted]' : authorHref.replace(/.*\/user\/([^/]+).*/, '$1');
        const idDetails = $this.find('.m-link').attr('href').match(/\/mail\/.*?\/(.*?)\/(.*?)$/i);

        const detailObject = {
            type: 'TBmodmailCommentAuthor',
            data: {
                author,
                post: {
                    id: idDetails[1],
                },
                comment: {
                    id: idDetails[2],
                },
                subreddit: {
                    name: subreddit,
                },
            },
        };

        dispatchApiEvent(jsApiThingPlaceholder, detailObject);
    });
}

/**
 * Makes sure to fire a jsAPI `TBuserHovercard` event for new modmail sidebar instances.
 * @function
 */
function newModmailSidebar () {
    setTimeout(() => {
        const $body = $('body');
        if ($body.find('.ThreadViewer').length) {
            const $modmailSidebar = $body.find('.ThreadViewer__infobar:not(.tb-seen), .ThreadViewerHeader__infobar:not(.tb-seen), .InfoBar__idCard:not(.tb-seen)');
            const jsApiPlaceHolder = `
                <div class="tb-jsapi-container tb-modmail-sidebar-container">
                    <div class="InfoBar__recentsTitle">Toolbox functions:</div>
                    <span data-name="toolbox"></span>
                </div>
            `;
            $modmailSidebar.each(async function () {
                const $infobar = $(this);
                $infobar.addClass('tb-seen');
                const info = await TBCore.getThingInfo(this, true);
                const $jsApiThingPlaceholder = $(jsApiPlaceHolder).appendTo($infobar);

                const jsApiThingPlaceholder = $jsApiThingPlaceholder[0];

                const detailObject = {
                    type: 'TBuserHovercard',
                    data: {
                        user: {
                            username: info.user || '[deleted]',
                        },
                        contextID: info.id,
                        subreddit: {
                            name: info.subreddit,
                        },
                    },
                };

                dispatchApiEvent(jsApiThingPlaceholder, detailObject);
            });
        }
    }, 500);
}
