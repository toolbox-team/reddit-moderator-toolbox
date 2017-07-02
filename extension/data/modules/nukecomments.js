function nukecomments() {
// Adapted from:
// @name          Reddit Mod Nuke Userscript
// @author        djimbob (dr jimbob)

    var self = new TB.Module('Comment Nuke');
    self.shortname = 'Nuke';

    ////Default settings
    self.settings['enabled']['default'] = false;
    self.config['betamode'] = false;

    self.register_setting('hideAfterNuke', {
        'type': 'boolean',
        'default': false,
        'title': 'Hide nuked comments after they are removed'
    });

    self.register_setting('ignoreMods', {
        'type': 'boolean',
        'default': true,
        'title': 'Ignore moderators\' comments when removing'
    });

    self.register_setting('confirmNuke', {
        'type': 'boolean',
        'default': true,
        'title': 'Show a confirmation window before nuking a comment chain'
    });

    // self.register_setting('useImage', {
    //     'type': 'boolean',
    //     'default': true,
    //     'title': 'Use an image button instead of [R]'
    // });


    self.init = function () {
    // // Image or text?
    // if (self.setting('useImage')) {
    //     self.button = $('<img>')
    //             .attr('title', 'Nuke!')
    //             .attr('src', TB.ui.iconNuke)
    //             .prop('outerHTML');
    // } else {
    //     self.button = '[R]';
    // }

        self.button = 'R';

        // Mod button clicked
        $('body').on('click', '.nuke-button', function (event) {
            var $nukeButton = $(event.target);
            var $comment = $nukeButton.closest('.comment');

            var $continue_thread = $comment.find('span.morecomments>a');


            var confirmMessage = 'Are you sure you want to nuke the following ';
            var $delete_button = $comment.find('form.remove-button input[name="spam"][value="False"]~span.option.error a.yes,a[onclick^="return big_mod_action($(this), -1)"]');
            // form input[value="removed"]~span.option.error a.yes -- finds the yes for normal deleting comments.
            // a.pretty-button.neutral finds the 'remove' button for flagged comments
            confirmMessage += $delete_button.length;
            if ($continue_thread.length > 0) {
                confirmMessage += '+ comments (more after expanding collapsed threads; there will be a pause before the first deletion to retrieve more comments)?';
            } else {
                confirmMessage += ' comments?';
            }

            if (!self.setting('confirmNuke')
            || confirm(confirmMessage)
            ) {
                $continue_thread.each(function (idx, $continue_button) {
                // wait a bit before each ajax call
                    setTimeout(function () {
                        $continue_button.click();
                    }, 2000 * idx);
                });

                // wait a bit after last ajax call before deleting
                setTimeout(function () {
                    self.deleteThreadFromComment($comment);
                }, 2000 * ($continue_thread.length + ($continue_thread.length ? 1 : 0)));
            }


            return false; // necessary?
        });

        // https://github.com/reddit/reddit/blob/master/r2/r2/public/static/js/jquery.reddit.js#L531
        // $(document).on('new_thing', function(e, thing) {
        //     // This could be useful...
        // });

        // https://github.com/reddit/reddit/blob/master/r2/r2/public/static/js/jquery.reddit.js#L531
        // $(document).on('new_things_inserted', function(e, thing) {
        //     // eh?
        // });


        // NER support.
        window.addEventListener('TBNewThings', function () {
            self.run();
        });

        self.run();
    };

    self.deleteThreadFromComment = function ($thread_root) {
        var ignoreMods = self.setting('ignoreMods');

        var $removeButtons = $thread_root.find('form input[value="removed"]~span.option.error a.yes,a[onclick^="return big_mod_action($(this), -1)"]');
        TB.ui.longLoadSpinner(true, 'removing comments', 'neutral');
        self.log(`Nuking ${$removeButtons.length} comments`);

        // we need a delay between every single click of >1sec
        // this should be re-written to use the API
        TB.utils.forEachChunked($removeButtons, 1, 1500, function remove_comment(button, num) {
            var msg = `removing comment ${num + 1}/${$removeButtons.length}`;
            TB.ui.textFeedback(msg, 'neutral');

            if (ignoreMods) {
                var $entry = $(button).parents('.entry'),
                    $author = $entry.find('a.author');

                if ($author.hasClass('moderator')) {
                    self.log(`  ${num + 1}... ignored`);
                    return;
                }
            }

            self.log(`  ${num + 1}... removed`);
            button.click();
        }, function complete() {
            if (self.setting('hideAfterNuke')) {
                $thread_root.hide(750);
            }
            self.log('kill spinner');
            TB.ui.longLoadSpinner(false);
            TB.ui.textFeedback('all comments removed', 'positive');
        });
    };


    // Add nuke button to all comments
    self.processComment = function (comment) {
        var $comment = $(comment);
        if (!$comment.hasClass('nuke-processed')) {
        // Add the class so we don't add buttons twice.
            $comment.addClass('nuke-processed');

            // Defer info gathering until button is clicked.
            // the report button is always visible, so we don't have to do anything special for the big mod action buttons
            $comment.find('.tagline:first > .userattrs')
                .after(`&nbsp;<a href="javascript:;" title="Remove (nuke) comment chain." class="nuke-button tb-bracket-button">${self.button}</a>`);
        }
    };

    // need this for RES NER support
    self.run = function () {
    // Not a mod, don't bother.
        if (!TB.utils.isMod  || TB.utils.isModQueuePage) {
        //self.log('Not a mod of the sub, d\'oh!');
            return;
        }

        var $comments = $('div.comment:not(.nuke-processed)');
        TB.utils.forEachChunked($comments, 15, 650, self.processComment);
    };

    TB.register_module(self);
} // nukecomments() wrapper

(function() {
    window.addEventListener('TBModuleLoaded', function () {
        nukecomments();
    });
})();
