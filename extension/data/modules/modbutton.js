import $ from 'jquery';
import {createElement} from 'react';

import {renderInSlots} from '../frontends/index.tsx';
import * as TBApi from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import * as TBHelpers from '../tbhelpers.js';
import {Module} from '../tbmodule.jsx';
import * as TBui from '../tbui.js';
import createLogger from '../util/logging.ts';
import {purifyObject} from '../util/purify.js';
import {getSettingAsync} from '../util/settings.ts';
import {JQueryRenderer} from '../util/ui_interop.tsx';

const log = createLogger('ModButton');

const MAX_BAN_REASON_LENGTH = 300;
const MAX_BAN_MESSAGE_LENGTH = 5000;

const self = new Module({
    name: 'Mod Button',
    id: 'ModButton',
    enabledByDefault: true,
    settings: [
        {
            id: 'savedSubs',
            type: 'sublist',
            default: [],
            description: 'Saved subs (for quick access)',
        },
        {
            id: 'rememberLastAction',
            type: 'boolean',
            default: false,
            description: 'Remember last action',
        },
        {
            id: 'globalButton',
            type: 'boolean',
            default: false,
            advanced: true,
            description: 'Enable Global Action button',
        },
        {
            id: 'excludeGlobal',
            type: 'sublist',
            default: [],
            advanced: true,
            description: 'Exclude subs from Global Actions',
        },
        // private storage
        {
            id: 'onlyshowInhover',
            type: 'boolean',
            default: () => getSettingAsync('GenSettings', 'onlyshowInhover', true),
            hidden: true,
        },
        {
            id: 'lastAction',
            type: 'text',
            default: 'ban',
            hidden: true,
        },
    ],
}, init);
export default self;

const $body = $('body');

self.runRedesign = async function () {
    // Not a mod, don't bother.
    const mySubs = await TBCore.getModSubs(false);
    if (mySubs.length < 1) {
        return;
    }

    renderInSlots([
        'submissionAuthor',
        'commentAuthor',
        'userHovercard',
    ], ({details, slotType}) => {
        const contextFullname = details.contextFullname || details.comment?.fullname || details.submission?.fullname
            || 'unknown';
        const subreddit = details.subreddit.name;
        const user = !details.user.deleted && details.user.name;

        // End of state/hooks - render
        if (details.user.deleted) {
            return null;
        }

        // TODO: convert the whole popup thing to be React-oriented
        return createElement(JQueryRenderer, {
            content: $(`
                <a
                    href="javascript:;"
                    title="Perform various mod actions on this user"
                    data-subreddit="${subreddit}"
                    data-author="${user}"
                    data-parentID="${contextFullname}"
                    class="global-mod-button tb-bracket-button"
                >
                    ${slotType === 'userHovercard' ? 'Mod Button' : 'M'}
                </a>
            `),
        });
    });
};

/**
 *  updates the current savedsubs' listings in the mod button
 */
self.updateSavedSubs = async function () {
    const mySubs = await TBCore.getModSubs();
    //
    // Refresh the settings tab and role tab sub dropdowns and saved subs tabls
    //
    const $popups = $body.find('.mod-popup');
    const $savedSubsLists = $popups.find('.saved-subs');

    // clear out the current stuff
    $savedSubsLists.html('');

    // add our saved subs to the "remove saved subs" dropdown on the setting tab
    // and to the saved subs savedSubsList on the role tab
    $popups.each(function () {
        const $popup = $(this);
        const $savedSubsList = $popup.find('.saved-subs');
        const currentSub = $popup.find('.subreddit').text();

        // repopulate the saved sub dropdowns with all the subs we mod
        $popup.find('.edit-subreddits .savedSubs').remove();
        $popup.find('.edit-subreddits').prepend(TBui.selectMultiple(mySubs, self.savedSubs).addClass('savedSubs'));

        self.savedSubs.forEach(async subreddit => {
            // only subs we moderate
            // and not the current sub
            const isMod = await TBCore.isModSub(subreddit);
            if (isMod && subreddit !== currentSub) {
                $savedSubsList.append(
                    `<div><input type="checkbox" class="action-sub" name="action-sub" value="${subreddit}" id="action-${subreddit}"><label for="action-${subreddit}">&nbsp;&nbsp;/r/${subreddit}</label></div>`,
                );
            }
        });
    });

    mySubs.forEach(subreddit => {
        $popups.find(`select.${self.OTHER}`).append(`<option value="${subreddit}">${subreddit}</option>`);
    });
};

function init ({savedSubs, rememberLastAction, globalButton, excludeGlobal}) {
    self.saveButton = 'Save';
    self.OTHER = 'other-sub';

    self.savedSubs = savedSubs;

    let userFlairTemplates; // we need those in 2 functions and I don't think fetching twice is a good idea

    self.savedSubs = TBHelpers.saneSort(self.savedSubs);

    // it's Go Time™!
    self.runRedesign();

    async function openModPopup (event, info) {
        const benbutton = event.target; // huehuehue
        const $benbutton = $(benbutton);
        log.debug('displaying mod button popup');

        const lastaction = await self.get('lastAction');

        const subreddit = info.subreddit;
        const user = info.user;
        const thing_id = info.id;

        // no user?
        if (!user) {
            TBui.textFeedback('No user', TBui.FEEDBACK_NEGATIVE);
            // abort
            return;
        }

        // generate the .mod-popup jQuery object

        // We want to make sure windows fit on the screen.
        const positions = TBui.drawPosition(event);

        const $overlay = $benbutton.closest('.tb-page-overlay');
        let $appendTo;
        if ($overlay.length) {
            $appendTo = $overlay;
        } else {
            $appendTo = $('body');
        }

        const $popup = TBui.popup({
            title: `Mod Actions  - /u/${user}`,
            tabs: [
                {
                    title: 'Role',
                    id: 'user-role', // reddit has things with class .role, so it's easier to do this than target CSS
                    tooltip: 'Add or remove user from subreddit ban, contributor, and moderator lists.',
                    content: `${
                        subreddit
                            ? `
                <div class="current-sub">
                    <input type="checkbox" class="action-sub" name="action-sub" value="${subreddit}" id="action-${subreddit}" checked>
                    <label for="action-${subreddit}">&nbsp;&nbsp;/r/${subreddit} (current)</label>
                </div>`
                            : ''
                    }
                <div class="saved-subs">
                </div>
                <div class="other-subs">
                    <input type="checkbox" class="action-sub ${self.OTHER}-checkbox name="action-sub" value="${self.OTHER}">
                    <select class="${self.OTHER} tb-action-button inline-button" for="action-${self.OTHER}"><option value="${self.OTHER}">(select subreddit)</option></select>
                </div>
                <div class="ban-note-container"><input id="ban-note" class="ban-note tb-input" type="text" placeholder="(ban note)" maxlength="${MAX_BAN_REASON_LENGTH}"></input><br>
                <textarea name="ban-message" class="tb-input ban-message" placeholder="(ban message to user)" maxlength="${MAX_BAN_MESSAGE_LENGTH}"></textarea><br>
                <input type="number" min="1" max="999" name="ban-duration"  class="ban-duration tb-input" placeholder="time (days)">
                </div>`,
                    footer: `
                <span class="status error left"></span>
                <select class="mod-action tb-action-button">
                    <option class="mod-action-negative" data-action="banned" data-api="friend">ban</option>
                    <option class="mod-action-positive" data-action="banned" data-api="unfriend">unban</option>
                    <option class="mod-action-positive" data-action="contributor" data-api="friend">add submitter</option>
                    <option class="mod-action-negative" data-action="contributor" data-api="unfriend" >remove submitter</option>
                    <option class="mod-action-positive" data-action="moderator" data-api="friend">mod</option>
                    <option class="mod-action-negative" data-action="moderator" data-api="unfriend" >demod</option>
                </select>
                ${TBui.actionButton(self.saveButton, 'save')}
                <button title="Global Action (perform action on all subs)" class="tb-action-button global-button inline-button"${
                        globalButton ? '' : 'style="display:none!important;"'
                    }>Global Action</button>`,
                },
                {
                    title: 'User Flair',
                    tooltip: 'Edit User Flair.',
                    content: `
                    <p style="clear:both;" class="mod-popup-flair-input">
                        <label for="flair-template-id" class="mod-popup-flair-label">Template:</label>
                        <select style="text-overflow: ellipsis; width: 150px;" id="flair-template-id-select" class="tb-action-button">
                            <option value="">None</option>
                        </select>
                    </p>
                    <p style="clear:both;" class="mod-popup-flair-input">
                        <label for="flair-text" class="mod-popup-flair-label">Text:</label>
                        <input id="flair-text" class="flair-text tb-input" type="text"></input>
                        </p>
                    <p style="clear:both;" class="mod-popup-flair-input">
                        <label for="flair-class" class="mod-popup-flair-label">Class:</label>
                        <input id="flair-class" class="flair-class tb-input" type="text"></input>
                    </p>`,
                    footer: `
                        <span class="status error left"></span>
                        ${TBui.actionButton('Save Flair', 'flair-save')}
                    `,
                },
                {
                    title: 'Send Modmail',
                    tooltip: 'Send a modmail to the user.',
                    content: `
                    <input id="subreddit-message-subject" class="subreddit-message-subject tb-input" type="text" placeholder="(subject)" maxlength="100"></input><br>
                    <textarea name="subreddit-message" class="tb-input subreddit-message" placeholder="(message to user)" ></textarea><br>
                    <span id="subreddit-message-callback"></span>
                    `,
                    footer: `
                        <span class="status error left"></span>
                        ${TBui.actionButton(`Send as /r/${subreddit}`, 'message-send')}
                    `,
                },
            ],
            cssClass: 'mod-popup',
            meta:
                `<label class="user">${user}</label><label class="subreddit">${subreddit}</label><label class="thing_id">${thing_id}</label>`,
        }).appendTo($appendTo)
            .css({
                left: positions.leftPosition,
                top: positions.topPosition,
                display: 'block',
            });
        const $actionSelect = $popup.find('.mod-action');

        // Set the action before setting up the initial interface
        if (rememberLastAction) {
            $actionSelect.val(lastaction);
        }

        // If we're not banning someone, we don't need these
        if ($actionSelect.val() !== 'ban') {
            $popup.find('.ban-note').hide();
            $popup.find('textarea.ban-message').hide();
            $popup.find('.ban-duration').hide();
            $popup.find('.ban-span-include-time').hide();
        }

        // If we're doing global actions, add the button for that
        // (there's a display none in the style attribute if this is disabled)
        if (globalButton) {
            const $globalButton = $popup.find('.global-button');

            // unless we're doing a ban, because global bans are evil
            if ($actionSelect.val() === 'ban') {
                $globalButton.addClass('action-hidden');
            }
            $actionSelect.change(function () {
                if (this.value === 'ban') {
                    $globalButton.addClass('action-hidden');
                } else {
                    $globalButton.removeClass('action-hidden');
                }
            });
        }

        // Remove options that only apply to subs we mod
        if (!subreddit) {
            // Hide the flair tab and message tab
            // TODO: add a "disabled" state, with tooltip, and use that instead
            // We can only edit flair in the current sub.
            $popup.find('.tb-window-tabs .user_flair').remove();
            $popup.find('.tb-window-tabs .send_message').remove();
        }

        // get pre-definded ban message/note
        if (subreddit) {
            log.debug('getting ban macros');
            TBCore.getConfig(subreddit).then(config => {
                if (!config || !config.banMacros) {
                    return;
                }
                const macros = config.banMacros;
                if (macros.banNote) {
                    log.debug(macros.banNote);
                    $popup.find('.ban-note').val(TBHelpers.replaceTokens(info, macros.banNote));
                }
                if (macros.banMessage) {
                    log.debug(macros.banMessage);
                    $popup.find('.ban-message').val(TBHelpers.replaceTokens(info, macros.banMessage));
                }
            });
        }

        // only works if we're a mod of the sub in question
        if (subreddit) {
            // Show if current user is banned, and why. - thanks /u/LowSociety
            try {
                const banInfo = await TBApi.getBanState(subreddit, user);
                if (banInfo) {
                    const user_fullname = banInfo.id; // we need this to extract data from the modlog
                    const timestamp = new Date(banInfo.date * 1000); // seconds to milliseconds

                    $popup.find('.current-sub').append(
                        $('<div class="already-banned">banned by <a href="#"></a> </div>'),
                    );
                    $popup.find('.current-sub .already-banned').append(TBui.relativeTime(timestamp));

                    $popup.find('select.mod-action option[data-api=unfriend][data-action=banned]').attr(
                        'selected',
                        'selected',
                    );
                    $popup.find('.ban-note').val(banInfo.note);
                    $popup.find('.tb-window-title').css('color', 'red');

                    // get the mod who banned them (need to pull request to get this in the banlist data to avoid this kind of stupid request)
                    const logData = await TBApi.getJSON(`/r/${subreddit}/about/log/.json`, {
                        type: 'banuser',
                        limit: '1000',
                    });
                    purifyObject(logData);
                    const logged = logData.data.children;
                    for (let i = 0; i < logged.length; i++) {
                        if (logged[i].data.target_fullname === user_fullname) {
                            $popup.find('.current-sub .already-banned a').attr('href', `/u/${logged[i].data.mod}`).text(
                                logged[i].data.mod,
                            );
                            break;
                        }
                    }
                }
            } catch (error) {
                // We don't have permission to check the user's ban information
                log.warn(`Error looking up ban information for ${user}:`, error);
            }
        }

        // if we're on the mod page, it's likely we want to mod them to another sub.
        // unselect current, change action to 'mod'.
        if (location.pathname.match(/\/about\/(?:moderator)\/?/)) {
            $popup.find('select.mod-action option[data-api=friend][data-action=moderator]').attr(
                'selected',
                'selected',
            );
            $popup.find('.ban-note').hide();
            $popup.find('.action-sub:checkbox:checked').removeAttr('checked');

            $popup.find('textarea.ban-message').hide();
            $popup.find('.ban-duration').hide();
            $popup.find('.ban-span-include-time').hide();
        } else if (location.pathname.match(/\/about\/(?:contributors)\/?/)) {
            $popup.find('select.mod-action option[data-api=friend][data-action=contributor]').attr(
                'selected',
                'selected',
            );
            $popup.find('.ban-note').hide();
            $popup.find('.action-sub:checkbox:checked').removeAttr('checked');

            $popup.find('textarea.ban-message').hide();
            $popup.find('.ban-duration').hide();
            $popup.find('.ban-span-include-time').hide();
        }

        // render the saved subs lists
        self.updateSavedSubs();

        // custom sub changed.
        $popup.find(`select.${self.OTHER}`).change(function () {
            $popup.find(`.${self.OTHER}-checkbox`).prop('checked', $(this).val() !== self.OTHER);
        });

        // show/hide ban reason text feild.
        $actionSelect.change(function () {
            const $banNote = $popup.find('.ban-note');
            const $banMessage = $popup.find('textarea.ban-message');
            const $banDuration = $popup.find('.ban-duration');
            const $banIncludeTime = $popup.find('.ban-span-include-time');
            if ($(this).val() === 'ban') {
                $banNote.show();
                $banMessage.show();
                $banDuration.show();
                $banIncludeTime.show();
            } else {
                $banNote.hide();
                $banMessage.hide();
                $banDuration.hide();
                $banIncludeTime.hide();
            }
        });
    }

    // Mod button clicked
    $body.on('click', '.global-mod-button', async function (event) {
        const benbutton = event.target; // huehuehue
        const $benbutton = $(benbutton);

        if (TBCore.isNewModmail) {
            const info = await TBCore.getThingInfo(this, true);
            openModPopup(event, info);
        } else {
            const subreddit = $benbutton.attr('data-subreddit');
            const id = $benbutton.attr('data-parentID');
            const author = $benbutton.attr('data-author');

            if (id === 'unknown' || id === 'undefined') {
                const info = {
                    subreddit,
                    user: author,
                    author,
                    permalink: location.href,
                    url: location.href,
                    domain: '',
                    id,
                    body: '>',
                    raw_body: '',
                    uri_body: '',
                    approved_by: '',
                    title: '',
                    uri_title: '',
                    kind: 'comment',
                    postlink: '',
                    link: '',
                    banned_by: '',
                    spam: '',
                    ham: '',
                    rules: subreddit ? TBCore.link(`/r/${subreddit}/about/rules`) : '',
                    sidebar: subreddit ? TBCore.link(`/r/${subreddit}/about/sidebar`) : '',
                    wiki: subreddit ? TBCore.link(`/r/${subreddit}/wiki/index`) : '',
                    mod: await TBApi.getCurrentUser(),
                };
                openModPopup(event, info);
            } else {
                TBCore.getApiThingInfo(id, subreddit, true).then(info => {
                    // If the thing we're fetching info for is removed in a subreddit the current user doesn't mod,
                    // the API won't return information about it. However, we can still access such things if we're
                    // on the user's profile. In that context, we manually fill in the author since we know at least
                    // that much already.
                    if (!info.author) {
                        info.author = info.user = author;
                    }

                    openModPopup(event, info);
                });
            }
        }

        return false;
    });

    // 'save' button clicked...  THIS IS WHERE WE BAN PEOPLE, PEOPLE!
    $body.on('click', '.mod-popup .save, .global-button', async function () {
        const $button = $(this);
        const $popup = $button.parents('.mod-popup');
        const $selected = $popup.find('.mod-action :selected');
        const api = $selected.attr('data-api');
        const action = $selected.attr('data-action');
        const actionName = $selected.val();
        const settingState = api === 'friend';
        const $status = $popup.find('.status');
        const banReason = $popup.find('.ban-note').val();
        const banDuration = $popup.find('.ban-duration').val();
        const banContext = $popup.find('.thing_id').text();
        const subreddits = [];
        const user = $popup.find('.user').text();

        const banMessage = $popup.find('textarea.ban-message').val();

        self.set('lastAction', actionName);

        if (action === 'banned') {
            if (banReason.length > MAX_BAN_REASON_LENGTH) {
                return $status.text(
                    `error, ban note is ${banReason.length - MAX_BAN_REASON_LENGTH} characters over limit`,
                );
            }
            if (banMessage.length > MAX_BAN_MESSAGE_LENGTH) {
                return $status.text(
                    `error, ban message is ${banMessage.length - MAX_BAN_MESSAGE_LENGTH} characters over limit`,
                );
            }
        }

        // Check dem values.
        if (!api) {
            return $status.text('error, no action selected');
        }

        if (!$(this).hasClass('global-button')) {
            // Get dem ban subs.
            $popup.find('.action-sub:checkbox:checked').each(function () {
                let subname = $(this).val();
                if (subname !== self.OTHER) {
                    subreddits.push(subname);
                } else {
                    subname = $(`.${self.OTHER} option:selected`).val();
                    if (subname !== self.OTHER) {
                        subreddits.push(subname);
                    }
                }
            });

            // Check dem values.
            if (subreddits.length < 1) {
                return $status.text('error, no subreddits selected');
            }

            // do it.
            massAction(subreddits);
        } else {
            if (actionName === 'ban') {
                $status.text('Yeah...not happening');
            } else {
                let confirmban;
                if (actionName === 'unban') {
                    confirmban = confirm(
                        `This will ${actionName} /u/${user} from every subreddit you moderate.   \nAre you sure?`,
                    );
                } else {
                    confirmban = confirm(
                        `This will ${actionName} /u/${user} on every subreddit you moderate.   \nAre you sure?`,
                    );
                }

                if (confirmban) {
                    const subs = await TBCore.getModSubs(false);
                    excludeGlobal.forEach(val => {
                        subs.splice(subs.indexOf(val), 1);
                    });
                    massAction(subs);
                }
            }
        }

        function completeCheck (failedSubs) {
            const failed = failedSubs.length;
            log.debug(`${failed} subs failed`);
            if (failed > 0) {
                log.debug(`${failed} subs failed`);
                const retry = confirm(`Action complete, however ${failed} failed.  Would you like to retry these?`);
                if (retry) {
                    log.debug('retrying');
                    massAction(failedSubs);
                } else {
                    log.debug('not retrying');
                    $('.mod-popup').remove();
                }
            } else {
                log.debug('complete');
                $('.mod-popup').remove();
                // TBui.textFeedback('Mod actions complete' + subreddit, TBui.FEEDBACK_POSITIVE);
            }
        }

        function massAction (subs) {
            const failedSubs = [];

            TBui.longLoadSpinner(true, 'Performing mod action', TBui.FEEDBACK_NEUTRAL);

            Promise.all(subs.map(async subreddit => {
                TBui.textFeedback(`${actionName}ning /u/${user} from /r/${subreddit}`, TBui.FEEDBACK_POSITIVE);

                log.debug(`performing action in: ${subreddit}`);
                if (settingState) {
                    const params = {
                        user,
                        action,
                        subreddit,
                    };

                    // Only send ban-related fields if performing a ban action
                    if (action === 'banned') {
                        params.banReason = banReason;
                        params.banMessage = banMessage;
                        params.banDuration = banDuration;
                        params.banContext = banContext;
                    }
                    await TBApi.friendUser(params, false).then(response => {
                        if (response.json.errors.length) {
                            throw new Error('There were one or more errors banning the user');
                        }
                    }).catch(() => {
                        // catches the above `errors.length` condition as well as network errors
                        log.debug('missed one');
                        failedSubs.push(subreddit);
                    });
                } else {
                    await TBApi.unfriendUser(user, action, subreddit, false).catch(() => {
                        // only catches network errors because unfriend is weird
                        log.debug('missed one');
                        failedSubs.push(subreddit);
                    });
                }
            })).then(() => {
                TBui.longLoadSpinner(false);

                window.setTimeout(() => {
                    completeCheck(failedSubs);
                }, 2000);
            });
        }
    });

    // send a message to the user.
    $body.on('click', '.mod-popup .message-send', function () {
        let subject;
        let message;
        TBui.longLoadSpinner(true);
        const $popup = $(this).parents('.mod-popup');
        const user = $popup.find('.user').text();
        const subreddit = $popup.find('.subreddit').text();
        const $callbackSpan = $popup.find('#subreddit-message-callback');
        const $subredditMessageSubject = $popup.find('.subreddit-message-subject');
        const $subredditMessage = $popup.find('.subreddit-message');

        if (!$subredditMessageSubject.val() || !$subredditMessage.val()) {
            $callbackSpan.text('You forgot a subject or message');
            $callbackSpan.css('color', 'red');
            TBui.longLoadSpinner(false);
            return;
        } else {
            subject = $subredditMessageSubject.val();
            message = $subredditMessage.val();
        }

        TBApi.sendMessage(user, subject, message, subreddit).then(response => {
            if (response.json.errors.length) {
                $callbackSpan.text(response.json.errors[1]);
                TBui.textFeedback(response.json.errors[1], TBui.FEEDBACK_NEGATIVE);
                TBui.longLoadSpinner(false);
            } else {
                TBui.textFeedback('message sent.', TBui.FEEDBACK_POSITIVE, 1500);
                $callbackSpan.text('message sent');
                $callbackSpan.css('color', 'green');
                TBui.longLoadSpinner(false);
            }
        }).catch(error => {
            $callbackSpan.text(`an error occurred: ${error[0][1]}`);
            TBui.longLoadSpinner(false);
        });
    });

    // Flair ALL THE THINGS
    $body.on('click', '.tb-window-tabs .user_flair', async function () {
        const $popup = $(this).parents('.mod-popup');
        const user = $popup.find('.user').text();
        const subreddit = $popup.find('.subreddit').text();
        const $textinput = $popup.find('.flair-text');
        const $classinput = $popup.find('.flair-class');
        const $flairDropdown = $popup.find('#flair-template-id-select');

        if (!user || !subreddit) {
            return;
        }

        const userFlairInfo = await TBApi.apiOauthPOST(`/r/${subreddit}/api/flairselector`, {name: user}).then(r =>
            r.json()
        );
        userFlairTemplates = await TBApi.apiOauthGET(`/r/${subreddit}/api/user_flair_v2`).then(r => r.json());
        if (!userFlairInfo.current) {
            return;
        }

        purifyObject(userFlairInfo);
        $textinput.val(userFlairInfo.current.flair_text);
        $classinput.val(userFlairInfo.current.flair_css_class);

        if (userFlairInfo.current.flair_template_id) {
            $classinput
                .attr('disabled', '')
                .attr('title', 'Changing the class is disabled when using a flair template.');
        }

        if ($flairDropdown[0].options.length > 1) {
            return;
        }

        userFlairTemplates.forEach(flair =>
            $flairDropdown.append(`
                <option
                    value="${flair.id}"
                    ${userFlairInfo.current.flair_template_id === flair.id ? 'selected' : ''}
                    style="background-color: ${flair.background_color ? flair.background_color : 'initial'}; color: ${
                flair.text_color === 'dark' ? '#000' : '#fff'
            };"
                >
                    ${flair.text}
                </option>
            `)
        );

        $flairDropdown.change(e => {
            if (!e.target.value) {
                $textinput.val('');
                $classinput
                    .val('')
                    .removeAttr('title')
                    .removeAttr('disabled');
                return;
            }

            const selectedFlair = userFlairTemplates.find(el => el.id === e.target.value);
            $textinput.val(selectedFlair.text);
            $classinput
                .val(selectedFlair.css_class)
                .attr('disabled', '')
                .attr('title', 'Changing the class is disabled when using a flair template.');
        });
    });

    // Edit save button clicked.
    $body.on('click', '.flair-save', function () {
        const $popup = $(this).parents('.mod-popup');
        const $status = $popup.find('.status');
        const user = $popup.find('.user').text();
        const subreddit = $popup.find('.subreddit').text();
        const text = $popup.find('.flair-text').val();
        const css_class = $popup.find('.flair-class').val();
        const templateID = $popup.find('#flair-template-id-select').val();

        TBui.textFeedback('saving user flair...', TBui.FEEDBACK_NEUTRAL);

        TBApi.flairUser(user, subreddit, text, css_class, templateID).then(() => {
            TBui.textFeedback('saved user flair', TBui.FEEDBACK_POSITIVE);
        }).catch(error => {
            log.error('Error saving user flair:', error);
            TBui.textFeedback(`failed to save user flair: ${error.message}`, TBui.FEEDBACK_NEGATIVE);
            $status.text(`error: ${error.message}`);
        });
    });
}
