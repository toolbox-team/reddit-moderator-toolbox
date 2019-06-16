function queueOverlay () {
    const self = new TB.Module('Queue Overlay');
    self.shortname = 'queueOverlay';

    // //Default settings
    self.settings['enabled']['default'] = true;

    self.config['betamode'] = false;

    TB.register_module(self);

    self.init = function () {
        const $body = $('body');

        const modSubredditsFMod = TB.storage.getSetting('Notifier', 'modSubredditsFMod', false),
              modSubreddits = TB.storage.getSetting('Notifier', 'modSubreddits', 'mod'),
              unmoderatedSubredditsFMod = TB.storage.getSetting('Notifier', 'unmoderatedSubredditsFMod', false),
              unmoderatedSubreddits = TB.storage.getSetting('Notifier', 'unmoderatedSubreddits', 'mod');

        // For reports, spam and edited we don't have any settings in toolbox.
        // We simply assume people want to see the same as modqueue as that is most used.
        const baseUrls = {
            modqueue: `${modSubredditsFMod ? '/me/f/mod/about/modqueue/' : `/r/${modSubreddits}/about/modqueue`}`,
            unmoderated: `${unmoderatedSubredditsFMod ? '/me/f/mod/about/unmoderated/' : `/r/${unmoderatedSubreddits}/about/unmoderated`}`,
            reports: `${modSubredditsFMod ? '/me/f/mod/about/reports/' : `/r/${modSubreddits}/about/reports`}`,
            spam: `${modSubredditsFMod ? '/me/f/mod/about/spam/' : `/r/${modSubreddits}/about/spam`}`,
            edited: `${modSubredditsFMod ? '/me/f/mod/about/edited/' : `/r/${modSubreddits}/about/edited`}`,
        };

        if (TBUtils.isModpage && TBUtils.isEmbedded) {
            $body.addClass('tb-embedded-queues');
        }

        function makeQueueOverlay (type, subreddit) {
            let $overlay = $body.find('.tb-queue-overlay');

            if (!$overlay.length) {
                $overlay = TB.ui.overlay(
                    'Toolbox queues',
                    [
                        {
                            title: 'modqueue',
                            tooltip: 'Moderation queue.',
                            content: `
                                <div class="tb-queue-options">
                                    <input type="text" class="tb-input tb-queue-url">
                                    <span class="tb-icons">${TBui.icons.refresh}</span>
                                </div>
                            `,
                            footer: '',
                        },
                        {
                            title: 'unmoderated',
                            tooltip: 'Unmoderated posts.',
                            content: `
                                <div class="tb-queue-options">
                                    <input type="text" class="tb-input tb-queue-url">
                                    <span class="tb-icons">${TBui.icons.refresh}</span>
                                </div>
                            `,
                            footer: '',
                        },
                        {
                            title: 'reports',
                            tooltip: 'reports.',
                            content: `
                                <div class="tb-queue-options">
                                    <input type="text" class="tb-input tb-queue-url">
                                    <span class="tb-icons">${TBui.icons.refresh}</span>
                                </div>
                            `,
                            footer: '',
                        },
                        {
                            title: 'spam',
                            tooltip: 'spam.',
                            content: `
                                <div class="tb-queue-options">
                                    <input type="text" class="tb-input tb-queue-url">
                                    <span class="tb-icons">${TBui.icons.refresh}</span>
                                </div>
                            `,
                            footer: '',
                        },
                        {
                            title: 'edited',
                            tooltip: 'edited.',
                            content: `
                                <div class="tb-queue-options">
                                    <input type="text" class="tb-input tb-queue-url">
                                    <span class="tb-icons">${TBui.icons.refresh}</span>
                                </div>
                            `,
                            footer: '',
                        },
                    ],
                    [], // extra header buttons
                    'tb-queue-overlay tb-overlay-horizontal-tabs', // class
                    false, // single overriding footer
                ).appendTo('body');

                $body.css('overflow', 'hidden');

                $body.on('click', '.tb-queue-overlay .tb-window-header .close', () => {
                    $('.tb-queue-overlay').remove();
                    $body.css('overflow', 'auto');
                });
            }

            // See if we already have a queue open, if we don't create the iframe and load it.
            if (!$overlay.find(`.tb-window-tab.${type} iframe.tb-queue-iframe`).length) {
                TB.ui.longLoadSpinner(true);
                const $tabContent = $overlay.find(`.tb-window-tab.${type} .tb-window-content`);
                let listUrl;
                if (subreddit) {
                    listUrl = `/r/${subreddit}/about/${type}`;
                } else {
                    listUrl = baseUrls[type];
                }

                $tabContent.find('.tb-queue-url').val(listUrl);
                const $iframe = $(`<iframe src="${TBUtils.link(listUrl)}?embedded=true" class="tb-queue-iframe"></iframe>`).appendTo($tabContent);

                $iframe.on('load', () => {
                    TBui.longLoadSpinner(false);
                });
            }

            // Switch to tab
            TBui.switchOverlayTab('tb-queue-overlay', type);
        }

        $body.on('click', '.tb-queue-overlay .tb-window-tabs a', function () {
            const $this = $(this);
            const type = $this.attr('data-module');
            makeQueueOverlay(type);
        });

        $body.on('click', '#tb-modqueue, #tb-queueCount', event => {
            event.preventDefault();
            makeQueueOverlay('modqueue');
        });

        $body.on('click', '#tb-unmoderated, #tb-unmoderatedCount', event => {
            event.preventDefault();
            makeQueueOverlay('unmoderated');
        });
    };
}

window.addEventListener('TBModuleLoaded', () => {
    queueOverlay();
});
