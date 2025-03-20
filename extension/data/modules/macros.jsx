import $ from 'jquery';

import {useFetched} from '../hooks.ts';
import * as TBApi from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import * as TBHelpers from '../tbhelpers.js';
import {Module} from '../tbmodule.jsx';
import * as TBui from '../tbui.js';
import createLogger from '../util/logging.ts';
import {purify} from '../util/purify.js';
import {getSettingAsync} from '../util/settings.ts';
import {reactRenderer} from '../util/ui_interop.tsx';

const log = createLogger('ModMacros');

const MACROS = 'TB-MACROS';

async function getConfig (sub, callback) {
    const config = await TBCore.getConfig(sub);

    if (!config || !config.modMacros || config.modMacros.length < 1) {
        callback(false);
        return;
    }

    callback(true, config.modMacros);
}

/**
 * @param {object} props
 * @param {string} props.subreddit
 * @param {'modmail' | 'post' | 'comment'} props.type
 * @param {boolean} [props.topLevel = false]
 * @param {string | undefined} [props.thingFullname]
 */
function MacroSelect ({subreddit, type, topLevel = false}) {
    const config = useFetched(
        new Promise(resolve => {
            getConfig(subreddit, (success, config) => {
                if (success && config.length > 0) {
                    resolve(config);
                } else {
                    resolve(undefined);
                }
            });
        }),
    );

    if (config == null) {
        return <></>;
    }

    let context = 'contextpost';
    switch (type) {
        case 'post':
            context = 'contextpost';
            break;
        case 'comment':
            context = 'contextcomment';
            break;
        case 'modmail':
            context = 'contextmodmail';
            break;
    }

    return (
        <select>
            <option value={MACROS}>macros</option>
            {Object.entries(config).map(([i, item]) => {
                if (item[context] !== undefined && !item[context]) {
                    return <></>;
                }
                return <option key={i} value={i}>{item.title}</option>;
            })}
        </select>
    );
}

// Add macro button in new modmail
async function addNewMMMacro () {
    const $body = $('body');
    const $thing = $body.find('.InfoBar');
    const info = await TBCore.getThingInfo($thing, true);

    // Don't add macro button twice.
    if ($body.find('.tb-usertext-buttons').length) {
        return;
    }

    // are we a mod?
    if (!info.subreddit) {
        return;
    }
    log.debug(info.subreddit);
    const macroButtonEl = reactRenderer(
        <MacroSelect subreddit={info.subreddit} type='modmail' />,
    );
    macroButtonEl.classList.add('tb-macro-select');
    $body.find(`
        :is(
            .ThreadViewerReplyForm__replyFooter,
            .ThreadViewerReplyForm__replyFooterGroup
        ) .selectWrapper
    `).before(
        $(`
            <div class="tb-usertext-buttons tb-macro-newmm"></div>
        `).append(macroButtonEl),
    );
}

/**
 * @param {JQuery<HTMLSelectElement>} dropdown
 * @param {unknown} info
 * @param {object} macro
 * @param {boolean} topLevel
 */
async function editMacro (dropdown, info, macro, topLevel) {
    const showMacroPreview = await getSettingAsync('ModMacros', 'showMacroPreview', true);

    const $body = $('body');
    // get some placement variables
    const {
        remove,
        approve,
        spam,
        ban,
        unban,
        mute,
        userflair,
        userflairtext,
        lockthread: lockitem, // saved as lockthread for legacy reasons
        lockreply,
        sticky,
        archivemodmail,
        highlightmodmail,
    } = macro;
    // Comments can only be stickied by being distinguished, so
    // always distinguish if sticky is also set. If distinguish is
    // not present, distinguish it to support legacy behavior.
    const distinguish = macro.sticky || macro.distinguish === undefined ? true : macro.distinguish;
    const kind = info.kind;

    let $usertext = dropdown.closest('.usertext-edit');
    let comment = unescape(macro.text);
    let actionList = 'The following actions will be performed:<br>- Your reply will be saved';

    if (!$usertext.length) {
        $usertext = dropdown.closest('.Comment');
    }

    if (!$usertext.length) {
        $usertext = dropdown.closest('div');
    }
    if (TBCore.isNewModmail) {
        $usertext = $body.find('.ThreadViewerReplyForm');
    }

    if (!TBCore.isModmail && !TBCore.isNewModmail) {
        if (remove) {
            actionList += `<br>- This ${kind} will be removed`;
        }

        if (spam) {
            actionList += `<br>- This ${kind} will be removed and marked as spam`;
        }

        if (approve) {
            actionList += `<br>- This ${kind} will be approved`;
        }

        if (distinguish) {
            actionList += '<br>- This reply will be distinguished';
        }

        if (lockitem) {
            actionList += `<br>- This ${kind} will be locked`;
        }

        if (lockreply) {
            actionList += '<br>- This reply will be locked';
        }

        if (sticky && topLevel) {
            actionList += '<br>- This reply will be stickied';
        }
    }

    if (ban) {
        actionList += '<br>- This user will be banned';
    }

    if (unban) {
        actionList += '<br>- This user will be unbanned';
    }

    if (userflair) {
        actionList += `<br>- This user will be flaired with [ ${userflairtext} ]`;
    }

    if (mute) {
        actionList += '<br>- This user will be muted';
    }

    if (TBCore.isNewModmail) {
        if (archivemodmail) {
            actionList += '<br>- This modmail thread will be archived.';
        }

        if (highlightmodmail) {
            actionList += '<br>- This modmail thread will be highlighted.';
        }
    }

    // replace token.
    comment = TBHelpers.replaceTokens(info, comment);

    const offset = $usertext.offset();
    const offsetLeft = offset.left;
    const offsetTop = offset.top;
    const minHeight = $usertext.outerHeight();
    const editMinWidth = $usertext.outerWidth();
    const editMinHeight = minHeight - 74;

    const title = dropdown.find('option:selected').text();
    log.debug(title);
    const $macroPopup = TBui.popup({
        title: `Mod Macro: ${title}`,
        tabs: [
            {
                title: 'Mod Macro:',
                id: `macro${info.id}`, // reddit has things with class .role, so it's easier to do this than target CSS
                tooltip: `Mod Macro:${title}`,
                content: `
                    <textarea class="tb-input macro-edit-area" data-response-id="${info.id}">${comment}</textarea>
                    <div class="tb-macro-action-list">${actionList}</div>
                `,
                footer: TBui.actionButton('Post Macro', `macro-send-${info.id}`),
            },
        ],
        cssClass: 'macro-popup',
    }).appendTo('body')
        .css({
            'left': `${offsetLeft}px`,
            'top': `${offsetTop}px`,
            'min-height': `${minHeight}px`,
            'display': 'block',
        });

    if (TBCore.isNewModmail) {
        $macroPopup.css('max-width', '100%');
    }
    $macroPopup.find('.macro-edit-area').css({
        'min-height': `${editMinHeight}px`,
        'min-width': `${editMinWidth}px`,
    });

    if (showMacroPreview) {
        $macroPopup.on(
            'input',
            '.macro-edit-area',
            TBHelpers.debounce(e => {
                let $previewArea;
                if ($macroPopup.find('.tb-macro-preview').length) {
                    // Use existing preview.
                    $previewArea = $('.tb-macro-preview');
                } else {
                    // Create a new one.
                    const $inputTextarea = $macroPopup.find('.macro-edit-area');
                    $previewArea = $('<div class="tb-macro-preview tb-comment"></div>');
                    $inputTextarea.after($previewArea);
                }

                // Render markdown and to be extra sure put it through purify to prevent possible issues with
                // people pasting malicious input on advice of shitty people.
                const renderedHTML = purify(TBHelpers.parser.render(e.target.value));
                $previewArea.html(`
                    <h3 class="tb-preview-heading">Preview</h3>
                    <div class="tb-comment-body">
                        <div class="md">
                            ${renderedHTML}
                        </div>
                    </div>
                `);
            }, 100),
        );

        $macroPopup.find('.macro-edit-area').trigger('input');
    }

    $macroPopup.on('click', `.macro-send-${info.id}`, function () {
        const $currentMacroPopup = $(this).closest('.macro-popup');
        const $selectElement = $body.find(`#macro-dropdown-${info.id}`);
        const editedcomment = $currentMacroPopup.find('.macro-edit-area').val();

        if ($selectElement.val() !== MACROS) {
            log.debug('Replying with:');
            log.debug(`  ${editedcomment}`);

            // We split of new modmail from the rest of reddit because... well easier.
            if (TBCore.isNewModmail) {
                // Since we are doing things on the page that need to finish we probably should make that clear.
                TBui.longLoadSpinner(true);

                if ($('.ThreadViewer  .icon-mute').closest('.InfoBar__control').hasClass('m-on')) {
                    TBui.textFeedback('Reply will not be posted because the user is muted.', TBui.FEEDBACK_NEUTRAL);
                } else {
                    $body.find('.Textarea.ThreadViewerReplyForm__replyText ').val(editedcomment);
                    $body.find('.ThreadViewerReplyForm__replyButton').click();
                }

                log.debug('Performing user actions');

                if (ban) {
                    TBApi.friendUser({
                        user: info.author,
                        action: 'banned',
                        subreddit: info.subreddit,
                        banReason: `Banned from: ${info.permalink}`,
                        banMessage: `For the following ${kind}: ${info.permalink}`,
                        banContext: info.id,
                    });
                }

                if (unban) {
                    TBApi.unfriendUser(info.id, info.author, 'banned', info.subreddit);
                }

                if (mute) {
                    // So we don't do an api call for this.
                    $body.find('.ThreadViewer .InfoBar__control:not(.m-on) .icon-mute').click();
                }

                if (userflair) {
                    TBApi.flairUser(info.author, info.subreddit, null, null, userflair).catch(() => {
                        TBui.textFeedback(`error, failed to flair user (${userflair})`, TBui.FEEDBACK_NEGATIVE);
                    });
                }

                if (highlightmodmail) {
                    $body.find('.ThreadViewer .ThreadViewerHeader__control:not(.m-selected) .icon-flair').click();
                }

                if (archivemodmail) {
                    // We wait a bit for the other actions to go through, then archive.
                    setTimeout(() => {
                        $body.find('.ThreadViewer .ThreadViewerHeader__control:not(.m-selected) .icon-archived')
                            .click();
                    }, 1000);
                }

                // All done! Wait a bit before removing all stuff.
                setTimeout(() => {
                    $currentMacroPopup.remove();
                    $selectElement.prop('disabled', false);
                    $selectElement.val(MACROS);
                    TBui.longLoadSpinner(false);
                }, 1500);
            } else {
                TBApi.postComment(info.id, editedcomment).then(response => {
                    TBui.textFeedback('Reply posted', TBui.FEEDBACK_POSITIVE);
                    $currentMacroPopup.remove();
                    $selectElement.prop('disabled', false);
                    if (topLevel) {
                        $selectElement.val(MACROS);
                    } else {
                        $selectElement.closest('.usertext-buttons').find('.cancel').trigger('click');
                    }

                    const commentId = response.json.data.things[0].data.id;

                    if (lockreply) {
                        TBApi.lock(commentId).catch(() => {
                            TBui.textFeedback('Failed to lock reply', TBui.FEEDBACK_NEGATIVE);
                        });
                    }
                    if (distinguish && !TBCore.isModmail) {
                        // Distinguish the new reply
                        TBApi.distinguishThing(commentId, sticky && topLevel).then(result => {
                            if (!result.success) {
                                TBui.textFeedback('Failed to distinguish reply', TBui.FEEDBACK_NEGATIVE);
                            }
                        }).catch(() => {
                            TBui.textFeedback('Failed to distinguish reply', TBui.FEEDBACK_NEGATIVE);
                        });
                    }
                }).catch(() => {
                    TBui.textFeedback('Failed to post reply', TBui.FEEDBACK_NEGATIVE);
                });

                if (!TBCore.isModmail && !TBCore.isNewModmail) {
                    log.debug('Performing non-modmail actions');

                    if (remove) {
                        TBApi.removeThing(info.id);
                    }

                    if (spam) {
                        TBApi.removeThing(info.id, true);
                    }

                    if (approve) {
                        TBApi.approveThing(info.id);
                    }

                    if (lockitem) {
                        TBApi.lock(info.id);
                    }
                }

                log.debug('Performing user actions');

                if (ban) {
                    TBApi.friendUser({
                        user: info.author,
                        action: 'banned',
                        subreddit: info.subreddit,
                        banReason: `Banned from: ${info.permalink}`,
                        banMessage: `For the following ${kind}: ${info.permalink}`,
                        banContext: info.id,
                    });
                }

                if (unban) {
                    TBApi.unfriendUser(info.author, 'banned', info.subreddit);
                }

                if (mute) {
                    log.debug(`  Muting "${info.author}" from /r/${info.subreddit} @ ${info.permalink}`);
                    TBApi.friendUser({
                        user: info.author,
                        action: 'muted',
                        subreddit: info.subreddit,
                        banReason: `Muted from: ${info.permalink}`,
                    });
                }

                if (userflair) {
                    TBApi.flairUser(info.author, info.subreddit, null, null, userflair).catch(() => {
                        TBui.textFeedback(`error, failed to flair user (${userflair})`, TBui.FEEDBACK_NEGATIVE);
                    });
                }
            }
        }
    });

    // The popup helper function registers a close handler for us to remove the window, but we still need to
    // reset the macro button to the initial state after the popup is removed, so we do that here.
    $macroPopup.on('click', '.close', () => {
        const $selectElement = $body.find(`#macro-dropdown-${info.id}`);
        $selectElement.val(MACROS);
        $selectElement.prop('disabled', false);
    });
}

export default new Module({
    name: 'Mod Macros',
    id: 'ModMacros',
    enabledByDefault: true,
    settings: [
        {
            id: 'showMacroPreview',
            description: 'Show a preview of macro messages while typing.',
            type: 'boolean',
            default: true,
        },
    ],
}, () => {
    const $body = $('body');

    if (TBCore.isOldReddit) {
        TBCore.getModSubs(false).then(mySubs => {
            if (TBCore.post_site && mySubs.includes(TBCore.post_site)) {
                log.debug('getting config');
                const macroButtonEl = reactRenderer(
                    <MacroSelect
                        subreddit={TBCore.post_site}
                        type='post'
                        topLevel
                    />,
                );
                macroButtonEl.classList.add('tb-top-macro-select');
                const $usertextButtons = $('.commentarea > .usertext .usertext-buttons');
                const $tbUsertextButtons = $usertextButtons.find('.tb-usertext-buttons');

                if ($tbUsertextButtons.length) {
                    $tbUsertextButtons.append(macroButtonEl);
                } else {
                    $usertextButtons.find('.status').before(
                        $(`
                            <div class="tb-usertext-buttons"></div>
                        `).append(macroButtonEl),
                    );
                }
            }
        });

        // add macro buttons after we click reply, if we're a mod.
        $body.on('click', 'ul.buttons a', async function () {
            const $this = $(this);
            if ($this.text() === 'reply') {
                const $thing = $this.closest('.thing');
                const info = await TBCore.getThingInfo($thing, true);

                // This is because reddit clones the top-level reply box for all reply boxes.
                // We need to remove it before adding the new one, because the new one works differently.
                // RES' @andytuba is a golden fucking god.
                $thing.find('.tb-top-macro-select').remove();

                // Don't add macro button twice.
                $thing.find('.tb-macro-select').remove();

                // are we a mod?
                if (!info.subreddit) {
                    return;
                }
                log.debug(info.subreddit);

                const macroButtonEl = reactRenderer(
                    <MacroSelect
                        subreddit={info.subreddit}
                        type={TBCore.isModmail ? 'modmail' : 'comment'}
                    />,
                );
                macroButtonEl.classList.add('tb-macro-select');
                const $tbUsertextButtons = $thing.find('> .child > .usertext .usertext-buttons .tb-usertext-buttons');
                if ($tbUsertextButtons.length) {
                    $tbUsertextButtons.append(macroButtonEl);
                } else {
                    $thing.find('> .child > .usertext .usertext-buttons .status').before(
                        $(`
                            <div class="tb-usertext-buttons"></div>
                        `).append(macroButtonEl),
                    );
                }
            }
        });
    }

    if (TBCore.isNewModmail) {
        window.addEventListener('TBNewPage', event => {
            if (event.detail.pageType === 'modmailConversation') {
                setTimeout(() => {
                    addNewMMMacro();
                }, 1000);
            }
        });
    }

    window.addEventListener('TBNewPage', async event => {
        if (event.detail.pageType === 'subredditCommentsPage') {
            const subreddit = event.detail.pageDetails.subreddit;

            const isMod = await TBCore.isModSub(subreddit);
            if (isMod) {
                const macroButtonEl = reactRenderer(
                    <MacroSelect
                        subreddit={subreddit}
                        type='post'
                        topLevel
                        thingFullname={`t3_${event.detail.pageDetails.submissionID}`}
                    />,
                );
                macroButtonEl.classList.add('tb-top-macro-select');
                $body.find('span:contains("Comment as")').closest('div').after(macroButtonEl);
            } else {
                // Remove all macros
                $body.find('.tb-macro-select').remove();
            }
        } else {
            // Remove all macros
            $body.find('.tb-macro-select').remove();
        }
    });

    // Detect when the user selects a macro from the dropdown
    $body.on('change', '.tb-top-macro-select, .tb-macro-select', async function () {
        const $this = $(this);
        const sub = $this.closest('select').attr('data-subreddit');
        const thingID = $this.closest('select').attr('data-thingID');
        const index = $this.val();
        const topLevel = $this.hasClass('tb-top-macro-select');
        let info;

        log.debug(`Macro selected: index=${index}`);
        log.debug(`  subreddit=${sub}`);

        // disable the select box to prevent a mess with creating multiple popup boxes.
        $this.prop('disabled', 'disabled');
        // If it's a top-level reply we need to find the post's info.
        if (topLevel) {
            log.debug('toplevel');
            info = await TBCore.getThingInfo($('#siteTable').find('.thing:first'));
        } else {
            info = await TBCore.getThingInfo($this.closest('.thing'));
        }

        log.debug(info);

        getConfig(sub, async (success, config) => {
            if (success && config.length > 0) {
                const macro = config[index];

                if (thingID) {
                    const thinginfo = await TBCore.getApiThingInfo(thingID, sub, false);
                    $this.attr('id', `macro-dropdown-${thinginfo.id}`);
                    await editMacro($this, thinginfo, macro, topLevel);
                } else {
                    // add unique id to the dropdown
                    $this.attr('id', `macro-dropdown-${info.id}`);
                    await editMacro($this, info, macro, topLevel);
                }
            }
        });
    });
});
