'use strict';

function oldReddit () {
    const self = new TB.Module('Old reddit');
    self.shortname = 'oldreddit';

    // Default settings
    self.settings['enabled']['default'] = true;

    self.config['betamode'] = false;

    // How about you don't disable the general settings module?  No other module should ever do this. Well except for the support module and the old reddit module..
    // So yeah it depends... But seriously normal modules should not do this.
    self.settings['enabled']['hidden'] = true; // Don't disable it, either!

    TB.register_module(self);

    function dispatchApiEvent (element, object) {
        const apiEvent = new CustomEvent('tbReddit', {detail: object});
        try {
            element.dispatchEvent(apiEvent);
        } catch (error) {
            self.log('Could not dispatch event', object);
        }
    }

    function handleThing (entries, observer) {
        entries.forEach(entry => {
            // The observer fires for everything on page load.
            // This makes sure that we really only act on those items that are visible.
            if (!entry.isIntersecting) {
                return;
            }

            // Element is visible, we only want to handle it once. Stop observing.
            observer.unobserve(entry.target);
            const $thing = $(entry.target);
            const info = TBCore.getThingInfo($thing);

            requestAnimationFrame(() => {
                const $jsApiThingPlaceholder = $('<div class="tb-jsapi-container"></div>').appendTo($thing.find('.entry:first'));
                $jsApiThingPlaceholder.append('<span data-name="toolbox">');
                const jsApiThingPlaceholder = $jsApiThingPlaceholder[0];
                $thing.find('.entry:first .author:first').after('<span class="tb-jsapi-author-container"></span>');
                const $jsApiPlaceholderAuthor = $thing.find('.tb-jsapi-author-container');
                $jsApiPlaceholderAuthor.append('<span data-name="toolbox">');
                const jsApiPlaceholderAuthor = $jsApiPlaceholderAuthor[0];

                if (!$jsApiThingPlaceholder.length || !$jsApiPlaceholderAuthor.length) {
                    return;
                }

                if (info.kind === 'submission') {
                    if (!$jsApiThingPlaceholder.hasClass('tb-frontend-container')) {
                        const detailObject = {
                            type: 'TBpost',
                            data: {
                                author: info.author,
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
                                author: info.author,
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
                                author: info.author,
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
                                author: info.author,
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

    function newModmailSidebar () {
        setTimeout(() => {
            const $body = $('body');
            if ($body.find('.ThreadViewer').length) {
                $body.find('.ThreadViewer__infobar:not(.tb-seen), .ThreadViewerHeader__infobar:not(.tb-seen)').each(function () {
                    const $infobar = $(this);
                    $infobar.addClass('tb-seen');
                    const info = TBCore.getThingInfo(this, true);
                    const $jsApiThingPlaceholder = $(`
                        <div class="tb-jsapi-container InfoBar__recents">
                            <div class="InfoBar__recentsTitle">Toolbox functions:</div>
                        </div>
                    `).appendTo($infobar);
                    $jsApiThingPlaceholder.append('<span data-name="toolbox">');
                    const jsApiThingPlaceholder = $jsApiThingPlaceholder[0];

                    const detailObject = {
                        type: 'TBuserHovercard',
                        data: {
                            user: {
                                username: info.user,
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

    self.init = function () {
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
                newModmailSidebar();
            });

            window.addEventListener('TBNewPage', event => {
                if (event.detail.pageType === 'modmailConversation') {
                    newModmailSidebar();
                }
            });
        }
    };
}

window.addEventListener('TBModuleLoaded', () => {
    oldReddit();
});
