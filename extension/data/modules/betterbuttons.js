import $ from 'jquery';

import * as TBApi from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import {Module} from '../tbmodule.jsx';
import {actionButton} from '../tbui.js';
import createLogger from '../util/logging.ts';
import {getSettingAsync} from '../util/settings.ts';

const log = createLogger('BButtons');

export default new Module({
    name: 'Better Buttons',
    id: 'BButtons',
    enabledByDefault: true,
    oldReddit: true,
    settings: [
        {
            id: 'enableModSave',
            description: 'Enable mod-save button, will save and distinguish comments.',
            type: 'boolean',
            default: false,
        },
        {
            id: 'enableDistinguishToggle',
            description: 'Enable distinguish and sticky toggling.',
            type: 'boolean',
            default: false,
        },
        {
            id: 'removeRemoveConfirmation',
            description: 'Remove remove/approve confirmation when removing items.',
            type: 'boolean',
            default: false,
            advanced: true,
        },
        {
            id: 'approveOnIgnore',
            description: 'Auto-approve items when ignoring reports.',
            type: 'boolean',
            default: false,
        },
        {
            id: 'ignoreOnApprove',
            description: 'Auto-ignore reports when approving items.',
            type: 'boolean',
            default: false,
        },
        {
            id: 'spamRemoved',
            description: 'Show spam button on submissions removed as ham.',
            type: 'boolean',
            default: false,
        },
        {
            id: 'hamSpammed',
            description: 'Show remove (not spam) button on submissions removed as spam.',
            type: 'boolean',
            default: false,
        },
        {
            id: 'addStickyButton',
            description: 'Add sticky/unsticky buttons to post listings.',
            type: 'boolean',
            default: false,
            advanced: false,
        },
        {
            id: 'addCommentLockbutton',
            description: 'Add comment lock button to comments.',
            type: 'boolean',
            default: true,
            advanced: false,
        },
    ],
}, ({
    enableModSave,
    enableDistinguishToggle,
    removeRemoveConfirmation,
    approveOnIgnore,
    ignoreOnApprove,
    spamRemoved,
    hamSpammed,
    addStickyButton,
    addCommentLockbutton,
}) => {
    if (enableModSave) {
        initModSave();
    }
    if (enableDistinguishToggle) {
        initDistinguishToggle();
    }
    if (removeRemoveConfirmation) {
        initRemoveConfirmation();
    }
    if (approveOnIgnore) {
        initAutoApprove();
    }
    if (ignoreOnApprove) {
        initAutoIgnoreReports();
    }
    if (spamRemoved || hamSpammed) {
        initRemoveButtons({spamRemoved, hamSpammed});
    }
    if (addStickyButton) {
        initStickyButtons();
    }
    if (addCommentLockbutton) {
        initCommentLock();
    }
});

// Bread and buttons
const $body = $('body');
let newThingRunning = false;

function initModSave () {
    if (TBCore.isModmail) {
        return;
    }
    log.debug('Adding mod save buttons');

    // Watches for changes in the DOM
    let shouldSticky = false;
    const commentObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                for (let i = 0; i < mutation.addedNodes.length; ++i) {
                    const $item = $(mutation.addedNodes[i]);
                    // Check if the added element is a comment
                    if ($item.is('div.comment')) {
                        log.debug('Clicking distinguish button');
                        // Distinguish the comment, stickying if we need to
                        const things = $item.find('form[action="/post/distinguish"] > .option > a');
                        if (shouldSticky) {
                            things.eq(1)[0].click();
                            shouldSticky = false;
                        } else {
                            things.first()[0].click();
                        }

                        // Stop watching for changes
                        commentObserver.disconnect();
                        return;
                    }
                }
            }
        });
    });

    // Add the mod save buttons next to each comment save button
    const $usertextButtons = $('.moderator').find('.usertext-edit .usertext-buttons');

    const $saveButton = $usertextButtons.find('.save');
    const $tbUsertextButtons = $saveButton.parent().find('.tb-usertext-buttons');
    const modSaveButton = actionButton('mod save', 'save-mod');
    const stickySaveButton = actionButton('mod save + sticky', 'save-sticky');
    if ($tbUsertextButtons.length) {
        $tbUsertextButtons.prepend(modSaveButton, stickySaveButton);
    } else {
        $saveButton.parent().find('.status').before(
            $('<div>').addClass('tb-usertext-buttons').append(modSaveButton, stickySaveButton),
        );
    }

    // Add actions to the mod save buttons
    $('body').on('click', 'button.save-mod', function () {
        log.debug('Mod save clicked!');
        commentObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });
        $(this).closest('.usertext-buttons').find('button.save').click();
    });
    $('body').on('click', 'button.save-sticky', function () {
        log.debug('Mod save + sticky clicked!');
        commentObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false,
        });
        shouldSticky = true;
        $(this).closest('.usertext-buttons').find('button.save').click();
    });
}

function initDistinguishToggle () {
    // Check for top level comments so we can add & sticky to the mix
    const stickyHtml =
        '<li class="toggle tb-sticky-toggle"><a class="tb-sticky-comment" href="javascript:void(0)">sticky</a></li>';

    function addSticky () {
        $('.sitetable.nestedlisting>.comment>.entry .buttons .toggle').has('form[action="/post/distinguish"]').each(
            function () {
                const $this = $(this);
                const $parentPost = $this.closest('.thing');
                const distinguished = getDistinguishState($parentPost);

                if (!$this.closest('.comment').hasClass('tb-sticky-processed') && !distinguished) {
                    $this.after(stickyHtml);
                    $this.closest('.comment').addClass('tb-sticky-processed');
                }
            },
        );
    }

    // Add back the sticky button after distinguishing and other DOM events.
    window.addEventListener('TBNewThings', () => {
        addSticky();
    });

    addSticky();

    // Get a comment's distinguish state
    function getDistinguishState (post) {
        const author = $(post).find('a.author').first();
        return author.hasClass('moderator');
    }

    // Toggle the distinguished state
    function distinguishClicked (e) {
        const $this = $(this);
        const $parentPost = $this.closest('.thing');
        const distinguished = getDistinguishState($parentPost);

        // Lets ready the buttons we want to click later on.
        const firstDistinguishButton = $this.find('.option > a')[0];
        const secondDistinguishButton = $this.find('.option > a')[1];

        // User initiated click, this is the distinguish toggle on a top level comment

        if (Object.prototype.hasOwnProperty.call(e, 'originalEvent')) {
            log.debug('Top level comment distinguish has been clicked and it is the real deal!');

            // Comment is already distinguished or stickied. So we'll simply undistinguish
            if (distinguished) {
                // Click things first
                if (firstDistinguishButton) {
                    firstDistinguishButton.click();
                }

                // Put back sticky button later.
                $this.find('.tb-sticky-toggle').show();

                // Not distinguished and we simply want to distinguish.
            } else if (!distinguished) {
                // Click first.
                if (firstDistinguishButton) {
                    firstDistinguishButton.click();
                }
                // Remove sticky button, this follows the reddit flow. Also makes it easier to deal with this shit.
                $this.find('.tb-sticky-toggle.').hide();
                // All that is left is neutral state, simply distinguish
            }
            // Otherwise the event is missing the origionalEvent property, meaning it was a code induced click.
            // In this case we want to sticky (or unsticky)
        } else {
            log.debug('Top level comment distinguish has been clicked by a robot!');
            // Really simple, only possible when nothing is distinguished or stickied.
            if (secondDistinguishButton) {
                secondDistinguishButton.click();
            }
            $this.find('.tb-sticky-toggle.').hide();
        }

        // Fire TBNewThings so sticky gets added back.
        // It is entirely possible that TBNewThings is fired multiple times.
        // That is why we only set a new timeout if there isn't one set already.
        if (!newThingRunning) {
            newThingRunning = true;
            // Wait a sec for stuff to load.
            setTimeout(() => {
                newThingRunning = false;
                const event = new CustomEvent('TBNewThings');
                window.dispatchEvent(event);
            }, 1000);
        }
    }

    // Toggle the sticky state
    function stickyClicked () {
        const $siblingDistinguish = $(this).closest('li').prev();

        // DO NOT TRY TO "FIX" THIS CLICK. It needs the jquery clicky stuff for us to tell that this was a code triggered click.
        $siblingDistinguish.find('form[action="/post/distinguish"]').click();
    }

    log.debug('Adding distinguish toggle events');

    // Add distinguish button listeners
    $body.on('click', 'form[action="/post/distinguish"]', distinguishClicked);

    $body.on('click', '.tb-sticky-comment', stickyClicked);

    // Watches for changes in DOM to add distinguish button listeners if needed
    const commentObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                for (let i = 0; i < mutation.addedNodes.length; ++i) {
                    const item = mutation.addedNodes[i];
                    // Check if the added element is a comment
                    if ($(item).is('div.comment')) {
                        $(item).find('form[action="/post/distinguish"]').first().on('click', distinguishClicked);
                        return;
                    }
                }
            }
        });
    });
    commentObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
    });
}

function initRemoveConfirmation () {
    log.debug('Adding one-click remove events');

    // Approve
    $body.on('click', '.flat-list .approve-button .togglebutton', function () {
        const yes = $(this).closest('.approve-button').find('.yes')[0];
        if (yes) {
            yes.click();
        }
        // setTimeout(function () {
        //     yes.click();
        // }, 100);
    });
    // Remove and spam
    $body.on('click', '.flat-list .remove-button .togglebutton', async function () {
        const $button = $(this).closest('.remove-button');
        const yes = $button.find('.yes')[0];

        // Don't remove if removal reasons are enabled and the button isn't for spam
        if (
            !$body.hasClass('tb-removal-reasons')
            || $body.hasClass('tb-removal-reasons') && !await getSettingAsync('RReasons', 'commentReasons')
            || $button.children().first().attr('value') === 'spammed'
        ) {
            if (yes) {
                yes.click();
            }
        }
    });
}

function initAutoApprove () {
    log.debug('Adding ignore reports toggle events');

    $body.on('click', '.big-mod-buttons > .pretty-button.neutral', function () {
        log.debug('Ignore reports pressed');
        const $button = $(this).parent().find('> span > .positive');
        const button = $button[0];
        if (!$button.hasClass('pressed')) {
            if (button) {
                button.click();
            }
        }
    });
}

function initAutoIgnoreReports () {
    log.debug('Adding approve toggle events');

    $body.on('click', '.big-mod-buttons > span > .pretty-button.positive', function () {
        const $button = $(this).closest('.big-mod-buttons').find('> .neutral');
        const button = $button[0];
        if (!$button.hasClass('pressed')) {
            if (button) {
                button.click();
            }
        }
    });
}

function initRemoveButtons ({spamRemoved, hamSpammed}) {
    // only need to iterate if at least one of the options is enabled
    const $things = $('.thing.link:not(.tb-removebuttons-checked)');
    TBCore.forEachChunkedDynamic($things, async item => {
        const $thing = $(item);
        $thing.addClass('tb-removebuttons-checked');

        const thing = await TBCore.getThingInfo(item, true);

        if (spamRemoved) {
            // only for subreddits we mod
            // and for comments that have been removed as ham ("remove not spam")
            if (thing.subreddit && thing.ham) {
                // and only if there isn't already one
                if ($thing.children('.entry').find('.big-mod-buttons .negative').length === 0) {
                    if ($thing.children('.entry').find('.big-mod-buttons .negative').length === 0) {
                        $(`<li class="tb-replacement"><a class="tb-comment-button tb-big-button tb-thing-button-spam" data-fullname="${thing.id}" href="javascript:void(0)">spam</a></li>`)
                            .insertBefore($thing.children('.entry').find('.big-mod-buttons'));
                    }
                }
            }
        }

        if (hamSpammed) {
            // only for subreddits we mod
            // and for comments that have been removed as spam ("spam" or "confirm spam")
            if (thing.subreddit && thing.spam) {
                // and only if there isn't already one
                if ($thing.children('.entry').find('.big-mod-buttons .neutral').length === 0) {
                    $(`<li class="tb-replacement"><a class="tb-comment-button tb-big-button tb-thing-button-remove" data-fullname="${thing.id}" href="javascript:void(0)">remove</a></li>`)
                        .insertBefore($thing.children('.entry').find('.big-mod-buttons'));
                }
            }
        }
    });
}

function initStickyButtons () {
    if (!TBCore.isMod) {
        return;
    }
    const $things = $('.listing-page .content .thing.link');
    $things.each(function () {
        const $thing = $(this);
        const $buttons = $thing.find('.flat-list');
        const unsticky = $thing.hasClass('stickied');

        // Make sure this is a post in a sub we mod by checking for the remove button.
        $buttons.append(`
                <li class="sticky-button">
                    <a class="tb-sticky-choice tb-bracket-button" href="javascript:;" ${
            unsticky ? 'data-tb-stickied' : ''
        }>${unsticky ? 'unsticky' : 'sticky'}</a>
                    ${
            !unsticky
                ? `
                    <span class="tb-sticky-position" style="display: none;">
                        <span class="error close" style="">sticky?</span>
                        <a class="tb-bracket-button tb-sticky-post" data-sticky-spot="1" href="javascript:;">top</a>
                        <span class="error" style="">/</span>
                        <a class="tb-bracket-button tb-sticky-post" data-sticky-spot="2" href="javascript:;">bottom</a>
                    </span>
                    `
                : ''
        }
                    <span class="success" style="display: none;">${unsticky ? 'unstickied' : 'stickied'}</span>
                    <span class="error" style="display: none;">failed to ${unsticky ? 'unsticky' : 'sticky'}</span>
                </li>
            `);
    });

    $('.thing .sticky-button .tb-sticky-choice').click(function () {
        const $button = $(this);
        const $positionButton = $button.siblings('.tb-sticky-position');
        const attr = $button.attr('data-tb-stickied');
        if (typeof attr !== typeof undefined && attr !== false) {
            const id = $button.parents('.thing').attr('data-fullname');
            TBApi.unstickyThread(id).then(() => {
                $button.siblings('.success').show();
            }).catch(() => {
                $button.siblings('.error').show();
            }).finally(() => {
                $button.hide();
            });
        } else {
            $positionButton.show();
            $button.hide();
        }
    });

    $('.thing .sticky-button .tb-sticky-post').click(function () {
        const $button = $(this);
        const $thing = $button.parents('.thing');
        const id = $thing.attr('data-fullname');
        const position = $button.attr('data-sticky-spot');
        TBApi.stickyThread(id, position).then(() => {
            $button.parent().siblings('.success').show();
        }).catch(() => {
            $button.parent().siblings('.error').show();
        }).finally(() => {
            $button.parent().hide();
        });
    });
}

function initCommentLock () {
    if (TBCore.isModmail) {
        return;
    }
    if (!TBCore.isMod) {
        return;
    }

    function commentLockRun () {
        const $comments = $('div.comment:not(.tb-lock-button)');
        TBCore.forEachChunkedDynamic($comments, processComment);
    }

    function processComment (comment) {
        const $comment = $(comment);
        if (!$comment.hasClass('tb-lock-button')) {
            // Add the class so we don't add buttons twice.
            $comment.addClass('tb-lock-button');
            let action = 'lock';
            if ($comment.find('.locked-tagline').length > 0) {
                action = 'unlock';
            }

            $comment.find('> .entry ul.buttons a[data-event-action="remove"]').closest('li')
                .after(
                    `<li><a href="javascript:;" tb-action="${action}" class="tb-comment-lock-button">${action}</a></li>`,
                );
        }
    }

    $('body').on('click', '.tb-comment-lock-button', async function (event) {
        const $lockButton = $(event.target);

        const action = $lockButton.attr('tb-action');
        const info = await TBCore.getThingInfo(this, true);
        const data = {
            id: info.id,
        };

        try {
            await TBApi.apiOauthPOST(`/api/${action}`, data);
            let newAction;
            if (action === 'lock') {
                newAction = 'unlock';
                const lockedTaglineHTML =
                    '<span class="locked-tagline" title="locked by this subreddit\'s moderators">locked comment</span>';
                $lockButton.closest('.entry').find('.tagline').append(lockedTaglineHTML);
            } else {
                newAction = 'lock';
                $lockButton.closest('.entry').find('.locked-tagline').remove();
            }

            $lockButton.attr('tb-action', newAction);
            $lockButton.text(newAction);
        } catch (error) {
            log.error('Error toggling lock on comment:\n', error);
        }
    });

    // NER support.
    window.addEventListener('TBNewThings', () => {
        commentLockRun();
    });

    commentLockRun();
}
