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
        title: 'Check whether there has been new activity in a modmail thread before submitting replies.',
    });

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

        // Lifted from reddit source.
        const actionTypeMap = [
            'highlighted this conversation',
            'un-highlighted this conversation',
            'archived this conversation',
            'un-archived this conversation',
            'reported user to admins',
            'muted user',
            'un-muted user',
            'banned user',
            'unbanned user',
        ];

        /**
         * Submits the reply form, bypassing the submission button click. Should only be
         * called from the handleSubmitButtonClick handler or embedded functions.
         * @function
         */
        const submitReplyForm = () => {
            // Note: we can't use .submit() here since it will trigger
            // the native browser submission instead of the React event listener.
            const formElement = $body.find('.ThreadViewerReplyForm')[0];
            formElement.dispatchEvent(new CustomEvent('submit'));
        };

        /**
         * Handles a click on the modmail thread submit button. Depending on settings, will
         * check if the reply type is different and if new comments have been made in the
         * meantime.
         * @function
         */
        const handleSubmitButtonClick = async event => {
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
                const {conversation, messages, modActions} = await TBApi.apiOauthGET(`/api/mod/conversations/${modmailId}`)
                    .then(response => response.json());

                // Evaluate reddit response.
                TB.ui.longLoadSpinner(false);

                // Find new actions that we didn't have local.
                const localLastMessageIndex = conversation.objIds.findIndex(obj => obj.id === lastMessageId);

                // It could be that there were actions after the last message. We will need to check for those,
                // since they don't have an ID but we want to avoid showing them twice. We will count the number
                // of actions taken after the last message in the DOM, then add those to the index.
                const numberOfActionsAfterLastMessage = $lastReply.nextAll('.Thread__modAction').length;

                const newMessagesAndActions = conversation.objIds.slice(localLastMessageIndex + numberOfActionsAfterLastMessage + 1);

                // If there are any, prompt.
                if (newMessagesAndActions.length) {
                    // Construct a popup showing the new messages and asking for a confirm.
                    let content = `
                        <div class="header">
                            New replies to modmail thread since page load, continue posting your reply?
                        </div>

                        <div class="activity">
                    `;

                    // Add entries for new activity.
                    for (const activity of newMessagesAndActions) {
                        // Message
                        if (activity.key === 'messages') {
                            const message = messages[activity.id];

                            content += `
                                <div class='new-message'>
                                    <div class='meta'>
                                        <a href='https://reddit.com/u/${message.author.name}' class='${message.author.isMod ? 'mod' : ''}' target='_blank'>${message.author.name}</a>
                                        •
                                        <time class='timeago' datetime='${message.date}'></time>
                                        ${message.author.isHidden ? '<span class="internal">(sent as subreddit)</span>' : ''}
                                        ${message.isInternal ? '<span class="internal">(private moderator note)</span>' : ''}
                                    </div>

                                    <div class='content'>
                                        ${message.body}
                                    </div>
                                </div>
                            `;
                        }

                        // Mod action
                        if (activity.key === 'modActions') {
                            const action = modActions[activity.id];

                            content += `
                                <div class='new-action'>
                                    <a href='https://reddit.com/u/${action.author.name}' class='${action.author.isMod ? 'mod' : ''}' target='_blank'>${action.author.name}</a>
                                    <span class='action'> ${actionTypeMap[action.actionTypeId]}</span>
                                </div>
                            `;
                        }
                    }

                    content += '</div>';

                    const $contextPopup = TB.ui.popup({
                        title: 'New Activity',
                        tabs: [
                            {
                                title: 'New Activity',
                                tooltip: 'Tab with new modmail activity.',
                                content,
                                footer: `
                                    <input type="button" class="tb-action-button close" value="Cancel">
                                    <input type="button" class="tb-action-button submit" value="Post reply">
                                `,
                            },
                        ],
                        cssClass: 'new-modmail-activity-popup',
                        draggable: true,
                    }).appendTo($body)
                        // Position in the center-top of the page.
                        .css({
                            left: ($body.width() - 600) / 2,
                            top: 100,
                            display: 'block',
                        });

                    // Ensure that the time ago for new messages updates appropriately.
                    $('time.timeago').timeago();

                    // Handle popup closing.
                    $contextPopup.on('click', '.close', () => {
                        $contextPopup.remove();
                    });

                    // Handle popup submission.
                    $contextPopup.on('click', '.submit', () => {
                        $contextPopup.remove();
                        submitReplyForm();
                    });

                    // Handle popup removal if we navigate away.
                    window.addEventListener('TBNewPage', () => {
                        $contextPopup.remove();
                    });

                    // Don't submit now. We submit from the popup, or not at all.
                    return;
                }
            }

            // Everything checks out, submit the form.
            submitReplyForm();
        };

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

                // Render markdown and to be extra sure put it through purify to prevent possible issues with
                // people pasting malicious input on advice of shitty people.
                let renderedHTML = TBStorage.purify(parser.render(e.target.value));
                // Fix relative urls as new modmail uses a different subdomain.
                renderedHTML = renderedHTML.replace(/href="\//g, 'href="https://www.reddit.com/');

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
