function oldReddit() {
    const self = new TB.Module('Old reddit');
    self.shortname = 'oldreddit';

    ////Default settings
    self.settings['enabled']['default'] = false;

    self.config['betamode'] = true;

    TB.register_module(self);

    function dispatchApiEvent(element, object) {
        const apiEvent = new CustomEvent('tbReddit', {detail: object});
        try {
            element.dispatchEvent(apiEvent);
        } catch(error) {
            self.log('Could not dispatch event', object);
        }
    }

    function handleThing($thing, info) {
        const $jsApiThingPlaceholder = $('<div class="tb-jsapi-container"></div>').appendTo($thing.find('.entry:first'));
        $jsApiThingPlaceholder.append('<span data-name="toolbox">');
        const jsApiThingPlaceholder = $jsApiThingPlaceholder[0];
        $thing.find('.entry:first .author:first').after('<span class="tb-jsapi-author-container"></span>');
        const $jsApiPlaceholderAuthor = $thing.find('.tb-jsapi-author-container');
        $jsApiPlaceholderAuthor.append('<span data-name="toolbox">');
        const jsApiPlaceholderAuthor = $jsApiPlaceholderAuthor[0];

        if(!$jsApiThingPlaceholder.length || !$jsApiPlaceholderAuthor.length) {
            console.log('empty', $thing);
            return;
        }

        if(info.kind === 'submission') {
            if(!$jsApiThingPlaceholder.hasClass('.tb-frontend-container')) {

                const detailObject = {
                    'type': 'TBpost',
                    'data': {
                        'author': info.author,
                        'id': info.id,
                        'subreddit': {
                            'name': info.subreddit,
                            'type': info.subredditType
                        }
                    }
                };

                dispatchApiEvent(jsApiThingPlaceholder, detailObject);
            }
            // We don't want to send events for things already handled.
            if(!$jsApiPlaceholderAuthor.hasClass('.tb-frontend-container')) {

                const detailObject = {
                    'type': 'postAuthor',
                    'data': {
                        'author': info.author,
                        'post': {
                            'id': info.id
                        },
                        'subreddit': {
                            'name': info.subreddit,
                            'type': info.subredditType
                        }
                    }
                };

                dispatchApiEvent(jsApiPlaceholderAuthor, detailObject);
            }
        }

        if(info.kind === 'comment') {
            // Comment
            if(!$jsApiThingPlaceholder.hasClass('.tb-frontend-container')) {
                const detailObject = {
                    'type': 'TBcommentOldReddit',
                    'data': {
                        'author': info.author,
                        'post': {
                            'id': info.postID
                        },
                        'id': info.id,
                        'subreddit': {
                            'name': info.subreddit,
                            'type': info.subredditType
                        }
                    }
                };

                dispatchApiEvent(jsApiThingPlaceholder, detailObject);
            }
            // Author
            // We don't want to send events for things already handled.
            if(!$jsApiPlaceholderAuthor.hasClass('.tb-frontend-container')) {

                const detailObject = {
                    'type': 'TBcommentAuthor',
                    'data': {
                        'author': info.author,
                        'post': {
                            'id': info.postID
                        },
                        'comment': {
                            'id': info.id
                        },
                        'subreddit': {
                            'name': info.subreddit,
                            'type': info.subredditType
                        }
                    }
                };
                dispatchApiEvent(jsApiPlaceholderAuthor, detailObject);
            }
        }
    }

    function thingCrawler() {
        const $things = $('div.content .thing:not(.tb-seen) .entry').closest('.thing');
        requestAnimationFrame(() => {
            $things.viewportChecker({
                classToAdd: 'tb-seen',
                callbackFunction: function(thing) {

                    const $thing = $(thing);
                    const info = TBUtils.getThingInfo($thing);
                    if(info.kind === 'submission' || info.kind === 'comment') {
                        requestAnimationFrame(() => {
                            handleThing($thing, info);
                        });
                    }
                }
            });
        });
    }

    self.init = function () {
        // Looks like we are on old reddit. Activate!
        if(TBUtils.isOldReddit) {
            requestAnimationFrame(() => {
                thingCrawler();

                window.addEventListener('TBNewThings', function () {
                    thingCrawler();
                });
            });
        }
    };

}

window.addEventListener('TBModuleLoaded2', function () {
    oldReddit();
});
