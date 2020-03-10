'use strict';
function newmodmailpro () {
    const self = new TB.Module('New Mod Mail Pro');
    self.shortname = 'NewModMail';

    // //Default settings
    self.settings['enabled']['default'] = true;
    self.config['betamode'] = false;

    self.register_setting('modmaillink', {
        type: 'selector',
        values: ['All modmail', 'New', 'In Progress', 'Archived', 'Highlighted', 'Mod Discussions', 'Notifications'],
        default: 'all_modmail',
        title: 'Change the modmail link to open a different modmail view by default.',
    });

    self.register_setting('openmailtab', {
        type: 'boolean',
        default: true,
        title: 'Open modmail in a new tab.',
    });

    self.register_setting('lastreplytypecheck', {
        type: 'boolean',
        default: true,
        title: 'Warns you if you reply as yourself but the last reply type is a private mod note or a "as subreddit" reply. ',
    });

    self.register_setting('modmailnightmode', {
        type: 'boolean',
        default: false,
        title: 'Open modmail in nightmode',
    });

    self.register_setting('searchhelp', {
        type: 'boolean',
        default: true,
        title: 'Add button next to search that opens a help popup explaining all search options.',
    });

    self.register_setting('noReplyAsSelf', {
        type: 'boolean',
        default: false,
        advanced: true,
        title: 'Automatically switch "reply as" selection away from "Reply as myself" to "Reply as subreddit".',
    });

    self.register_setting('showModmailPreview', {
        type: 'boolean',
        default: true,
        title: 'Show a preview of modmail messages while typing.',
    });

    const $body = $('body');

    function switchAwayFromReplyAsSelf () {
        const current = $('.ThreadViewerReplyForm__replyOptions .FancySelect__valueText').text();
        if (current === 'Reply as myself') {
            $body.find('.FancySelect__value').click();
            $body.find('.FancySelect__option:contains("Reply as the subreddit")').click();
        }
    }
    // All stuff we want to do when we are on new modmail
    if (TBCore.isNewModmail) {
        // Add a class to body
        $body.addClass('tb-new-modmail');
        const parser = SnuOwnd.getParser(SnuOwnd.getRedditRenderer());

        // ready some variables.
        const modMailNightmode = self.setting('modmailnightmode'),
              lastReplyTypeCheck = self.setting('lastreplytypecheck'),
              searchhelp = self.setting('searchhelp'),
              noReplyAsSelf = self.setting('noReplyAsSelf'),
              showModmailPreview = self.setting('showModmailPreview');

        if (noReplyAsSelf) {
            window.addEventListener('TBNewPage', event => {
                if (event.detail.pageType === 'modmailConversation') {
                    setTimeout(() => {
                        switchAwayFromReplyAsSelf();
                    }, 1000);
                }
            });
        }

        if (showModmailPreview) {
            $body.on('input', '.ThreadViewerReplyForm__replyText, .NewThread__message', TBHelpers.debounce(e => {
                let $previewArea;
                if ($('#tb-modmail-preview').length) {
                    $previewArea = $('#tb-modmail-preview');
                } else {
                    $previewArea = $('<div id="tb-modmail-preview" class="StyledHtml"></div>');
                    $('form.ThreadViewerReplyForm, form.NewThread__form').after($previewArea);
                }
                const renderedHTML = parser.render(TBStorage.purify(e.target.value));
                $previewArea.html(`
                <h3 class="tb-preview-heading">Preview</h3>
                <div class="md">
                    ${renderedHTML}
                </div>
                `);
                $body.one('click', '.ThreadViewerReplyForm__replyButton, .NewThread__submitButton', () => {
                    $previewArea.remove();
                });
            }, 100));
        }

        if (searchhelp) {
            const $header = $body.find('.Header');
            const $helpButton = $('<a href="javascript:;" class="tb-search-help tb-bracket-button" title="Open help popup" style="">?</a>').appendTo($header);
            const $searchButton = $body.find('.Search__button');

            let helpButtonLeft = $searchButton.offset().left - 28;

            $helpButton.css({
                left: `${helpButtonLeft}px`,
            });

            $(window).on('resize', () => {
                helpButtonLeft = $searchButton.offset().left - 28;

                $helpButton.css({
                    left: `${helpButtonLeft}px`,
                });
            });

            $helpButton.on('click', e => {
                e.preventDefault();
                window.open('https://mods.reddithelp.com/hc/en-us/articles/360018564511', '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');
            });
        }

        if (lastReplyTypeCheck && TBCore.isNewMMThread) {
            $body.on('click', '.ThreadViewerReplyForm__replyButton', event => {
                // Get all mod replies and see if they are something we need to warn the user about.
                const $lastReply = $body.find('.Thread__messages .Thread__message:has(.m-mod)').last();
                const replyTypeMyself = $body.find('.FancySelect__valueText').text() === 'Reply as myself';

                // if it finds this the last mod that replied did so with "as subreddit".
                if ($lastReply.find('.icon-profile-slash').length && replyTypeMyself) {
                    if (confirm('The last mod that replied did so as the subreddit, are you sure you want to reply as yourself?')) {
                        // Ok, do nothing and let the message be posted.
                    } else {
                        // Not ok, prevent the button from being clicked.
                        event.preventDefault();
                    }
                }

                // If it finds this class it means the last reply was a private mod note.
                if ($lastReply.find('.Thread__messageIsMod').length && replyTypeMyself) {
                    if (confirm('The last mod that replied did so with a private mod note, are you sure you want to reply as yourself?')) {
                        // Ok, do nothing and let the message be posted.
                    } else {
                        // Not ok, prevent the button from being clicked.
                        event.preventDefault();
                    }
                }
            });
        }

        if (modMailNightmode) {
            // Let's make sure RES nightmode doesn't mess things up.
            $('html, body').removeClass('res-nightmode');

            // Now enable toolbox nightmode.
            $('html').addClass('tb-nightmode');
        }
    }

    // Below all stuff we do when we are NOT on new modmail.
    if (!TBCore.isNewModmail) {
        // ready some variables.
        const modmailLink = self.setting('modmaillink'),
              openMailTab = self.setting('openmailtab');

        // Let's mess around with the link to modmail.
        const $newModmailLinkElement = $('#new_modmail'),
              newModmailBaseUrl = 'https://mod.reddit.com/mail/';

        // Open modmail in a new tab if the option is selected
        if (openMailTab) {
            $newModmailLinkElement.attr('target', '_blank');
        }

        // let's replace urls.
        switch (modmailLink) {
        case 'all_modmail':
            $newModmailLinkElement.attr('href', `${newModmailBaseUrl}all`);

            break;
        case 'new':
            $newModmailLinkElement.attr('href', `${newModmailBaseUrl}new`);

            break;
        case 'in_progress':
            $newModmailLinkElement.attr('href', `${newModmailBaseUrl}inprogress`);

            break;
        case 'archived':
            $newModmailLinkElement.attr('href', `${newModmailBaseUrl}archived`);

            break;
        case 'highlighted':
            $newModmailLinkElement.attr('href', `${newModmailBaseUrl}highlighted`);

            break;
        case 'mod_discussions':
            $newModmailLinkElement.attr('href', `${newModmailBaseUrl}mod`);

            break;
        case 'notifications':
            $newModmailLinkElement.attr('href', `${newModmailBaseUrl}notifications`);
        }
    }

    TB.register_module(self);
}

window.addEventListener('TBModuleLoaded', () => {
    newmodmailpro();
});
