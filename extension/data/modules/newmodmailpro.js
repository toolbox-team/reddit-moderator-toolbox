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

    self.register_setting('clickableReason', {
        type: 'boolean',
        default: true,
        title: 'Make links in ban and mute reasons clickable.',
    });

    self.register_setting('checkForNewMessages', {
        type: 'boolean',
        default: true,
        title: 'Check for any new messages in a thread before sending a new message.'
    })

    const $body = $('body');

    function switchAwayFromReplyAsSelf () {
        const current = $('.ThreadViewerReplyForm__replyOptions .FancySelect__valueText').text();
        if (current === 'Reply as myself') {
            $body.find('.FancySelect__value').click();
            $body.find('.FancySelect__option:contains("Reply as the subreddit")').click();
        }
    }

    /**
     * Searches for ban reason elements on page and makes included links clickable.
     * @function
     */
    function reasonClickable () {
        const $reasons = $body.find('.InfoBar__banText:not(.tb-reason-seen), .InfoBar__muteText:not(.tb-reason-seen)');
        if ($reasons.length) {
            $reasons.each(function () {
                const $reason = $(this);
                $reason.addClass('tb-reason-seen');

                let reasonText = $reason.text();
                // Three regex passes to avoid silly logic about whole urls, urls starting with a slash and those without it.
                reasonText = reasonText.replace(/(\s|'|^)(https:\/\/.+?)(\s|'|$)/gi, '$1<a href="$2" target="_blank">$2</a>$3');
                reasonText = reasonText.replace(/(\s|'|^)(\/u\/.+?|\/user\/.+?|\/r\/.+?)(\s|'|$)/gi, '$1<a href="https://www.reddit.com$2" target="_blank">$2</a>$3');
                reasonText = reasonText.replace(/(\s|'|^)(u\/.+?|user\/.+?|r\/.+?)(\s|'|$)/gi, '$1<a href="https://www.reddit.com/$2" target="_blank">$2</a>$3');

                $reason.html(reasonText);
            });
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
              showModmailPreview = self.setting('showModmailPreview'),
              clickableReason = self.setting('clickableReason'),
              checkForNewMessages = self.setting('checkForNewMessages');

        /**
         * Handles a click on the modmail thread submit button. Depending on settings, will
         * check if the reply type is different and if new comments have been made in the
         * meantime.
         * @function
         */
        async function handleSubmitButtonClick (event) {
            // Cancel always. If allowed, we will manually submit the form.
            event.preventDefault();

            // First, check if the reply type is different.
            if (lastReplyTypeCheck) {
                // Get all mod replies and see if they are something we need to warn the user about.
                const $lastModReply = $body.find('.Thread__messages .Thread__message:has(.m-mod)').last();
                const replyTypeMyself = $body.find('.FancySelect__valueText').text() === 'Reply as myself';

                // if it finds this the last mod that replied did so with "as subreddit".
                if ($lastModReply.find('.icon-profile-slash').length && replyTypeMyself) {
                    if (confirm('The last mod that replied did so as the subreddit, are you sure you want to reply as yourself?')) {
                        // Ok, do nothing and let the message be posted.
                    } else {
                        // Not ok, do nothing.
                        return;
                    }
                }

                // If it finds this class it means the last reply was a private mod note.
                if ($lastModReply.find('.Thread__messageIsMod').length && replyTypeMyself) {
                    if (confirm('The last mod that replied did so with a private mod note, are you sure you want to reply as yourself?')) {
                        // Ok, do nothing and let the message be posted.
                    } else {
                        // Not ok, do nothing.
                        return;
                    }
                }
            }

            // Next, check if any messages have been posted in the meantime.
            const $lastReply = $body.find('.Thread__messages .Thread__message').last();
            if (lastReplyTypeCheck && $lastReply) {
                // Find the ID of the modmail and of the message.
                const [, modmailId, lastMessageId] = $lastReply.find('.m-link').attr('href').match(/\/mail\/.*?\/(.*?)\/(.*?)$/i);

                // Show a spinner while we load stuff.
                TB.ui.longLoadSpinner(true);

                // Find out the last comment as of right now.
                const { conversation } = await TBApi.apiOauthGET('/api/mod/conversations/' + modmailId)
                    .then(response => response.json());

                // Evaluate reddit response.
                TB.ui.longLoadSpinner(false);

                // Find new actions that we didn't have local.
                const localLastMessageIndex = conversation.objIds.findIndex(obj => obj.id === lastMessageId);
                const newMessagesAndActions = conversation.objIds.slice(localLastMessageIndex + 1);

                // If there are any, prompt.
                if (newMessagesAndActions.length > 0) {
                    const newMessages = newMessagesAndActions.filter(obj => obj.key === 'messages');
                    const newActions = newMessagesAndActions.filter(obj => obj.key === 'modActions');

                    let message = 'There have been ';

                    if (newMessages.length > 0) {
                        message += newMessages.length + ' message(s) sent';
                    }

                    if (newMessages.length > 0 && newActions.length > 0) {
                        message += ' and ';
                    }

                    if (newActions.length > 0) {
                        message += newActions.length + ' mod action(s)';
                    }

                    message += ' on this modmail thread since you loaded the page. Are you sure you want to send this reply?';

                    if (confirm(message)) {
                        // We're okay, continue.
                    } else {
                        // Abort.
                        return;
                    }
                }
            }

            // Everything checks out, submit the form.
            // Note: we can't use .submit here().
            const formElement = $body.find('.ThreadViewerReplyForm')[0];
            formElement.dispatchEvent(new CustomEvent('submit'));
        }

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
                    // Use existing preview.
                    $previewArea = $('#tb-modmail-preview');
                } else {
                    // Create a new one.
                    const $form = $('form.ThreadViewerReplyForm, form.NewThread__form');
                    $previewArea = $('<div id="tb-modmail-preview" class="StyledHtml"></div>');
                    $form.after($previewArea);
                    $form.one('submit', () => {
                        $previewArea.remove();
                    });
                }
                const renderedHTML = parser.render(TBStorage.purify(e.target.value));
                $previewArea.html(`
                <h3 class="tb-preview-heading">Preview</h3>
                <div class="md">
                    ${renderedHTML}
                </div>
                `);
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

        // If we have any settings that interfere with the message 'submission', register the listener.
        if (TBCore.isNewMMThread && (lastReplyTypeCheck || checkForNewMessages)) {
            $body.on('click', '.ThreadViewerReplyForm__replyButton', handleSubmitButtonClick);
        }

        if (modMailNightmode) {
            // Let's make sure RES nightmode doesn't mess things up.
            $('html, body').removeClass('res-nightmode');

            // Now enable toolbox nightmode.
            $('html').addClass('tb-nightmode');
        }

        if (clickableReason) {
            $body.on('click', '.icon-user', () => {
                setTimeout(() => {
                    reasonClickable();
                }, 500);
            });

            window.addEventListener('TBNewPage', event => {
                if (event.detail.pageType === 'modmailConversation') {
                    reasonClickable();
                }
            });
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
