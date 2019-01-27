function commentsOld() {
    const self = new TB.Module('Comments Old');
    self.shortname = 'CommentsOld'; // historical precedent for settings
    self.oldReddit = true;

    self.settings['enabled']['default'] = true;

    self.register_setting('hideRemoved', {
        'type': 'boolean',
        'default': false,
        'advanced': true,
        'title': 'Hide removed comments by default.'
    });
    self.register_setting('approveComments', {
        'type': 'boolean',
        'default': false,
        'title': 'Show approve button on all comments.'
    });
    self.register_setting('spamRemoved', {
        'type': 'boolean',
        'default': false,
        'title': 'Show spam button on comments removed as ham.'
    });
    self.register_setting('hamSpammed', {
        'type': 'boolean',
        'default': false,
        'title': 'Show remove (not spam) button on comments removed as spam.'
    });
    self.register_setting('showHideOld', {
        'type': 'boolean',
        'default': true,
        'advanced': false,
        'title': 'Show button to hide old comments.'
    });

    self.init = function () {
        const $body = $('body');
        //
        // preload some generic variables
        //
        self.hideRemoved = self.setting('hideRemoved'),
        self.approveComments = self.setting('approveComments'),
        self.spamRemoved = self.setting('spamRemoved'),
        self.hamSpammed = self.setting('hamSpammed');

        function run() {
            //
            //  Do stuff with removed comments
            //
            // Show a removed comments counter when visiting a comment page on a sub where you are moderator. When hiding of removed comments is enabled this doubles as a toggle for that.
            let removedCounter = 0;

            $('.comments-page .thing.comment.spam > .entry').each(function () {
                $(this).addClass('tb-comment-spam');
                removedCounter = removedCounter + 1;
            });

            self.log(removedCounter);

            if ($('#tb-bottombar').find('#tb-toggle-removed').length) {
                const $tbToggle = $('#tb-bottombar').find('#tb-toggle-removed');
                if (removedCounter == 1) {
                    $tbToggle.html(`<img src="data:image/png;base64,${TBui.iconCommentsRemove}" />[1]`);
                } else if (removedCounter > 1) {
                    $tbToggle.html(`<img src="data:image/png;base64,${TBui.iconCommentsRemove}" />[${removedCounter.toString()}]`);
                }
            } else if (removedCounter == 1) {
                $('#tb-bottombar').find('#tb-toolbarcounters').prepend(`<a id="tb-toggle-removed" title="Toggle hide/view removed comments" href="javascript:void(0)"><span class="tb-icons tb-icons-align-middle">chat</span>[1]</a>`);
            } else if (removedCounter > 1) {
                $('#tb-bottombar').find('#tb-toolbarcounters').prepend(`<a id="tb-toggle-removed" title="Toggle hide/view removed comments" href="javascript:void(0)"><span class="tb-icons tb-icons-align-middle">chat</span>[${removedCounter.toString()}]</a>`);
            }

            if (self.hideRemoved) {
                $('.tb-comment-spam').hide();
                $('.action-reason').hide();
            }

            if (self.approveComments || self.spamRemoved || self.hamSpammed) {
            // only need to iterate if at least one of the options is enabled
                const $things = $('.thing.comment:not(.tb-comments-checked)');
                TBUtils.forEachChunkedDynamic($things, function(item) {
                    const $thing = $(item);
                    $thing.addClass('tb-comments-checked');

                    const thing = TBUtils.getThingInfo($thing, true);

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
        if (TBUtils.isMod && !TBUtils.isModmail) {

            $body.on('click', '#tb-toggle-removed', function () {
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
            $body.on('click', '.expando-button.selftext', function () {
                setTimeout(run, 1000);
            });

            // NER support.
            window.addEventListener('TBNewThings', function () {
                run();
            });

            run();
        }

        let hidden = false;
        function addHideModButton() {

        // hide mod comments option.
            if (TB.utils.isUserPage) {
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
        window.addEventListener('TBNewThings', function () {
            addHideModButton();
            if (hidden) {
                self.log('hiding mod actions');
                $('.moderator, [data-subreddit="spam"]').closest('.thing').hide();
            }
        });

        // hide old comments
        if (self.setting('showHideOld')) {
            const NO_HIGHLIGHTING = 'no highlighting',
                $commentvisits = $('#comment-visits');

            $('.comment-visits-box').css('max-width', 650).find('.title').append('&nbsp;&nbsp;<a href="javascript:;" class="tb-hide-old tb-general-button">hide old</a>');

            $body.on('click', '.tb-hide-old', function () {
                self.log('hiding old comments');
                $('.entry').show(); //reset before hiding.
                $('.old-expand').removeClass('old-expand'); // new old expands

                // this likely isn't language safe.
                if ($commentvisits.find('option:selected' ).text() === NO_HIGHLIGHTING) return;

                $('.thing:not(.new-comment,.link)').each(function() {
                    const $this = $(this);
                    $this.toggleClass('old-expand');

                    $this.find('.entry:first').hide();
                });
            });

            $body.on('click', '.old-expand', function () {
                $(this).removeClass('old-expand').children().show();
            });

            $body.on( 'change', '#comment-visits', function () {
                const $hideOld = $('.tb-hide-old');
                $hideOld.text('hide old');
                if ($commentvisits.find('option:selected' ).text() === NO_HIGHLIGHTING) {
                    $hideOld.text('show all');
                }
            });
        }
    };

    TB.register_module(self);
}

window.addEventListener('TBModuleLoaded2', function () {
    commentsOld();
});

