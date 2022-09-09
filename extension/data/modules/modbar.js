import $ from 'jquery';

import TBModule, {Module} from '../tbmodule.js';
import * as TBStorage from '../tbstorage.js';
import * as TBui from '../tbui.js';
import * as TBHelpers from '../tbhelpers.js';
import * as TBCore from '../tbcore.js';
import * as TBApi from '../tbapi.js';

// Hold onto the modbarExists resolver so we can call it when the time is right
let resolveModbarExists = null;

/**
 * A promise which resolves when the modbar is added to the page.
 * @constant {Promise<void>}
 */
export const modbarExists = new Promise(resolve => {
    resolveModbarExists = resolve;
});

export default new Module({
    name: 'Modbar',
    id: 'Modbar',
    alwaysEnabled: true,
    settings: [
        {
            id: 'compactHide',
            description: 'Use compact mode for modbar',
            type: 'boolean',
            default: false,
            advanced: true,
        },
        {
            id: 'unmoderatedOn',
            description: 'Show icon for unmoderated',
            type: 'boolean',
            default: true,
        },
        {
            id: 'enableModSubs',
            description: 'Show Moderated Subreddits in the modbar',
            type: 'boolean',
            default: true,
        },
        {
            id: 'enableOldNewToggle',
            description: 'Include a button in the modbar to swap between old and new Reddit',
            type: 'boolean',
            default: true,
        },
        {
            id: 'shortcuts',
            description: 'Shortcuts',
            type: 'map',
            default: {},
            labels: ['name', 'url'],
            hidden: false,
        },
        {
            id: 'modbarHidden',
            type: 'boolean',
            default: false,
            hidden: true,
        },
        {
            id: 'consoleShowing',
            type: 'boolean',
            default: false,
            hidden: true,
        },
        {
            id: 'lockScroll',
            type: 'boolean',
            default: false,
            hidden: true,
        },
        {
            id: 'customCSS',
            type: 'code',
            default: '',
            hidden: true,
        },
        {
            id: 'lastExport',
            type: 'number',
            default: 0,
            hidden: true,
        },
        {
            id: 'showExportReminder',
            type: 'boolean',
            default: true,
            hidden: true,
        },
        {
            id: 'subredditColorSalt',
            type: 'text',
            default: 'PJSalt',
            hidden: true,
        },
    ],
}, async function init ({
    shortcuts,
    compactHide,
    unmoderatedOn,
    enableModSubs,
    enableOldNewToggle,
    customCSS,
    consoleShowing,
    modbarHidden,
    subredditColorSalt,
}) {
    const $body = $('body');

    // Footer element below the page so toolbox never should be in the way.
    // Doing it like this because it means we don't have to mess with reddit css
    const $footerblock = $('<div id="tb-footer-block">').appendTo($body);

    // Don't add the mod bar to embedded pages or if not logged in
    if (TBCore.isEmbedded || !await TBApi.getCurrentUser()) {
        return;
    }

    // This prevents some weird scrollbar behavior on new reddit iframe embeds.
    window.addEventListener('TBNewPage', event => {
        const pageType = event.detail.pageType;
        if (pageType === 'oldModmail' || pageType === 'message') {
            $footerblock.hide();
        } else {
            $footerblock.show();
            const {url} = getDirectingTo();
            $('#tb-old-new-reddit-toggle').attr('href', url);
        }
    });

    //
    // preload some generic variables
    //

    const debugMode = await TBStorage.getSettingAsync('Utils', 'debugMode', false),

          modSubreddits = await TBStorage.getSettingAsync('Notifier', 'modSubreddits', 'mod'),
          unmoderatedSubreddits = await TBStorage.getSettingAsync('Notifier', 'unmoderatedSubreddits', 'mod'),
          unreadMessageCount = await TBStorage.getSettingAsync('Notifier', 'unreadMessageCount', 0),
          modqueueCount = await TBStorage.getSettingAsync('Notifier', 'modqueueCount', 0),
          unmoderatedCount = await TBStorage.getSettingAsync('Notifier', 'unmoderatedCount', 0),
          modmailCount = await TBStorage.getSettingAsync('Notifier', 'modmailCount', 0),
          newModmailCount = await TBStorage.getSettingAsync('Notifier', 'newModmailCount', 0),
          notifierEnabled = await TBStorage.getSettingAsync('Notifier', 'enabled', true),
          modmailCustomLimit = await TBStorage.getSettingAsync('ModMail', 'customLimit', 0),

          modSubredditsFMod = await TBStorage.getSettingAsync('Notifier', 'modSubredditsFMod', false),
          unmoderatedSubredditsFMod = await TBStorage.getSettingAsync('Notifier', 'unmoderatedSubredditsFMod', false);

    // Ready some details for new modmail linking
    const modmailLink = await TBStorage.getSettingAsync('NewModMail', 'modmaillink', 'all_modmail'),
          openMailTab = await TBStorage.getSettingAsync('NewModMail', 'openmailtab', false) && !TBCore.isNewModmail,
          newModmailBaseUrl = 'https://mod.reddit.com/mail/';
    let newModmailUrl;

    switch (modmailLink) {
    case 'all_modmail':
        newModmailUrl = `${newModmailBaseUrl}all`;

        break;
    case 'inbox':
        newModmailUrl = `${newModmailBaseUrl}inbox`;

        break;
    case 'new':
        newModmailUrl = `${newModmailBaseUrl}new`;

        break;
    case 'in_progress':
        newModmailUrl = `${newModmailBaseUrl}inprogress`;

        break;
    case 'archived':
        newModmailUrl = `${newModmailBaseUrl}archived`;

        break;
    case 'highlighted':
        newModmailUrl = `${newModmailBaseUrl}highlighted`;

        break;
    case 'mod_discussions':
        newModmailUrl = `${newModmailBaseUrl}mod`;

        break;
    case 'notifications':
        newModmailUrl = `${newModmailBaseUrl}notifications`;
    }

    // Custom CSS for debug mode/testing
    if (customCSS) {
        $('head').append(`<style type="text/css">${customCSS}</style>`);
    }

    //
    // UI elements
    //
    // style="display: none;"
    // toolbar, this will display all counters, quick links and other settings for the toolbox

    // This is here in case notifier is disabled which is where this normally is set.
    // Atleast, I think.... - creesch
    let modMailUrl = $('#modmail').attr('href') || TBCore.link('/message/moderator/');
    if (parseInt(modmailCustomLimit) > 0) {
        modMailUrl += `?limit=${modmailCustomLimit}`;
        $('#modmail').attr('href', modMailUrl);
        $('#tb-modmail').attr('href', modMailUrl);
        $('#tb-modmailcount').attr('href', modMailUrl);
    }

    const modQueueUrl = TBCore.link(modSubredditsFMod ? '/me/f/mod/about/modqueue/' : `/r/${modSubreddits}/about/modqueue`);
    const $modBar = $(`
<div id="tb-bottombar">
    <a class="tb-bottombar-hide tb-icons" href="javascript:void(0)">${TBui.icons.arrowLeft}</a>
    <a class="tb-toolbar-new-settings tb-icons" href="javascript:void(0)" title="toolbox settings">${TBui.icons.settings}</a>
    <label class="tb-first-run">&#060;-- Click for settings</label>
    <span id="tb-bottombar-contentleft">
        <span id="tb-toolbarshortcuts"></span>
    </span>
    <span id="tb-bottombar-contentright">
        <span id="tb-toolbarcounters">
            <a title="no mail" href="${TBCore.link('/message/inbox/')}" class="nohavemail tb-icons" id="tb-mail">${TBui.icons.userInbox}</a>
            <a href="${TBCore.link('/message/inbox/')}" id="tb-mailCount"></a>
            <a title="modmail" href="${modMailUrl}" id="tb-modmail" class="nohavemail tb-icons">${TBui.icons.oldModmail}</a>
            <a href="${modMailUrl}" id="tb-modmailcount"></a>
            <a href="${newModmailUrl}" class="nohavemail access-required tb-icons" id="tb-new_modmail" ${openMailTab ? 'target="_blank"' : ''}>${TBui.icons.newModmail}</a>
            <a href="${newModmailUrl}" id="tb-new-modmailcount" ${openMailTab ? 'target="_blank"' : ''}></a>
            <a title="modqueue" href="${modQueueUrl}" id="tb-modqueue" class="tb-icons">${TBui.icons.modqueue}</a>
            <a href="${modQueueUrl}" id="tb-queueCount"></a>
        </span>
    </span>
    <div id="tb-new-modmail-tooltip">
        <table>
            <tr id="tb-new-modmail-new">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/new" id="tb-new-modmailcount" ${openMailTab ? 'target="_blank"' : ''}>New</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-inprogress">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/inprogress" id="tb-new-modmailcount" ${openMailTab ? 'target="_blank"' : ''}>In Progress</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-banappeals">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/appeals" id="tb-new-modmailcount" ${openMailTab ? 'target="_blank"' : ''}>Ban Appeals</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-joinrequests">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/join_requests" id="tb-new-modmailcount" ${openMailTab ? 'target="_blank"' : ''}>Join Requests</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-highlighted">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/highlighted" id="tb-new-modmailcount" ${openMailTab ? 'target="_blank"' : ''}>Highlighted</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-mod">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/mod" id="tb-new-modmailcount" ${openMailTab ? 'target="_blank"' : ''}>Mod Discussions</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-notifications">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/notifications" id="tb-new-modmailcount" ${openMailTab ? 'target="_blank"' : ''}>Notifications</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
    </div>
</div>
`);
    let hoverTimeout;
    $modBar.find('#tb-new_modmail, #tb-new-modmailcount, #tb-new-modmail-tooltip').hover(() => {
        clearTimeout(hoverTimeout);
        $modBar.find('#tb-new-modmail-tooltip').show();
    }, () => {
        hoverTimeout = setTimeout(() => {
            $modBar.find('#tb-new-modmail-tooltip').hide(100);
        }, 1000);
    });

    // Add unmoderated icon if it is enabled.

    if (unmoderatedOn) {
        const unModQueueUrl = TBCore.link(unmoderatedSubredditsFMod ? '/me/f/mod/about/unmoderated/' : `/r/${unmoderatedSubreddits}/about/unmoderated`);
        $modBar.find('#tb-toolbarcounters').append(`
<a title="unmoderated" href="${unModQueueUrl}" class="tb-icons" id="tb-unmoderated">${TBui.icons.unmoderated}</a>
<a href="${unModQueueUrl}" id="tb-unmoderatedCount"></a>
`);
    }

    const $modbarhid = $(`
<div id="tb-bottombar-hidden" class="${compactHide ? 'tb-bottombar-compact' : ''}">
    <a class="tb-bottombar-unhide tb-icons" href="javascript:void(0)">${compactHide ? TBui.icons.dotMenu : TBui.icons.arrowRight}</a>
</div>
`);

    $body.append($modBar);
    $body.append($modbarhid);

    const toggleMenuBar = hidden => {
        if (hidden) {
            $modBar.hide();
            $modbarhid.show();
            $body.find('.tb-debug-window').hide(); // hide the console, but don't change consoleShowing.
            $body.toggleClass('tb-modbar-shown', false); // New modmail uses this style to add space to the bottom of the page
        } else {
            $modBar.show();
            $modbarhid.hide();
            if (consoleShowing && debugMode) {
                $body.find('.tb-debug-window').show();
            }
            $body.toggleClass('tb-modbar-shown', true);
        }
        this.set('modbarHidden', hidden);
    };

    // Always default to hidden in compact mode
    if (compactHide) {
        modbarHidden = true;
    }

    toggleMenuBar(modbarHidden);

    // modbar was added to the DOM, let everyone know so they can add buttons and stuff
    resolveModbarExists();

    // moderated subreddits button.
    if (enableModSubs) {
        TBCore.getModSubs().then(async () => {
            $body.find('#tb-bottombar-contentleft').prepend('<a href="javascript:void(0)" class="tb-modbar-button" id="tb-toolbar-mysubs" style="display: none">Moderated Subreddits</a> ');

            let subList = '';

            const configEnabled = await TBStorage.getSettingAsync('TBConfig', 'enabled', false),
                  usernotesEnabled = await TBStorage.getSettingAsync('UserNotes', 'enabled', false);
            this.log('got mod subs');
            this.log(window._TBCore.mySubs.length);
            this.log(window._TBCore.mySubsData.length);
            $(window._TBCore.mySubsData).each(function () {
                const subColor = TBHelpers.stringToColor(this.subreddit + subredditColorSalt);
                subList += `
                    <tr style="border-left: solid 3px ${subColor} !important;" data-subreddit="${this.subreddit}">
                        <td class="tb-my-subreddits-name"><a title="/r/${this.subreddit}" href="${TBCore.link(`/r/${this.subreddit}`)}" target="_blank">/r/${this.subreddit}</a></td>
                        <td class="tb-my-subreddits-subreddit">
                            <a title="/r/${this.subreddit} modmail!" target="_blank" href="${TBCore.link(`/r/${this.subreddit}/message/moderator`)}" data-type="modmail" data-subreddit="${this.subreddit}" class="tb-icons">${TBui.icons.oldModmail}</a>
                            <a title="/r/${this.subreddit} modqueue" target="_blank" href="${TBCore.link(`/r/${this.subreddit}/about/modqueue`)}" data-type="modqueue" data-subreddit="${this.subreddit}" class="tb-icons">${TBui.icons.modqueue}</a>
                            <a title="/r/${this.subreddit} unmoderated" target="_blank" href="${TBCore.link(`/r/${this.subreddit}/about/unmoderated`)}" data-type="unmoderated" data-subreddit="${this.subreddit}" class="tb-icons">${TBui.icons.unmoderated}</a>
                            <a title="/r/${this.subreddit} moderation log" target="_blank" href="${TBCore.link(`/r/${this.subreddit}/about/log`)}" data-type="modlog" data-subreddit="${this.subreddit}" class="tb-icons">${TBui.icons.modlog}</a>
                            <a title="/r/${this.subreddit} traffic stats" target="_blank" href="${TBCore.link(`/r/${this.subreddit}/about/traffic`)}" data-type="traffic" data-subreddit="${this.subreddit}" class="tb-icons">${TBui.icons.subTraffic}</a>
                            ${usernotesEnabled ? `<a title="/r/${this.subreddit} usernotes" href="javascript:;" class="tb-un-config-link tb-icons" data-subreddit="${this.subreddit}">${TBui.icons.usernote}</a>` : ''}
                            ${configEnabled ? `<a title="/r/${this.subreddit} config" href="javascript:;" class="tb-config-link tb-icons" data-subreddit="${this.subreddit}">${TBui.icons.tbSubConfig}</a>` : ''}
                        </td>
                    </tr>
                `;
            });

            const modSubsPopupContent = `
                <div id="tb-my-subreddits">
                    <input id="tb-livefilter-input" type="text" class="tb-input" placeholder="live search" value="">
                <span class="tb-livefilter-count">${window._TBCore.mySubs.length}</span>
                    <br>
                    <table id="tb-my-subreddit-list">${subList}</table>
                </div>
            `;

            $body.on('click', '#tb-toolbar-mysubs', () => {
                const $existingPopup = $body.find('.subreddits-you-mod-popup');
                if (!$existingPopup.length) {
                    TBui.popup({
                        title: 'Subreddits you moderate',
                        tabs: [
                            {
                                title: 'Subreddits you moderate',
                                id: 'sub-you-mod', // reddit has things with class .role, so it's easier to do this than target CSS
                                tooltip: 'Subreddits you moderate',
                                content: modSubsPopupContent,
                                footer: '',
                            },
                        ],
                        cssClass: 'subreddits-you-mod-popup',
                    }).appendTo('body').css({
                        position: 'fixed',
                        bottom: '41px',
                        left: '20px',
                    });
                    // Focus the filter bar for convenience
                    $('#tb-livefilter-input').focus();
                } else {
                    $existingPopup.remove();
                }

                $body.find('#tb-livefilter-input').keyup(function () {
                    const LiveSearchValue = $(this).val();
                    $body.find('#tb-my-subreddits table tr').each(function () {
                        const $this = $(this),
                              subredditName = $this.attr('data-subreddit');

                        if (subredditName.toUpperCase().indexOf(LiveSearchValue.toUpperCase()) < 0) {
                            $this.hide();
                        } else {
                            $this.show();
                        }
                        $('.tb-livefilter-count').text($('#tb-my-subreddits table tr:visible').length);
                    });
                });
            });

            // only show the button once it's populated.
            $('#tb-toolbar-mysubs').show();
        });
    }

    // Swap old/new reddit button
    if (enableOldNewToggle && !TBCore.isNewModmail) {
        const {url, directingTo} = getDirectingTo();
        // Append the link
        $('#tb-bottombar-contentleft').append(`
                <a href="${url}" id="tb-old-new-reddit-toggle" class="tb-modbar-button" title="View this page in ${directingTo}">Open in ${directingTo}</a>
            `);
    }

    TBCore.getLastVersion().then(lastVersion => {
        if (lastVersion < TBCore.shortVersion) {
            $('.tb-first-run').show().css('display', 'inline-block');
        }
    });

    if (debugMode) {
        // Reload button
        $('#tb-bottombar').find('#tb-toolbarcounters').before(`<a href="javascript:;" id="tb-reload-link" class="tb-icons" title="reload toolbox">${TBui.icons.tbReload}</a>`);

        $body.on('click', '#tb-reload-link', () => {
            this.log('reloading chrome');
            TBui.reloadToolbox();
        });
    }

    // Append shortcuts
    Object.entries(shortcuts).forEach(([index, value]) => {
        // TODO: Separators here should probably use CSS rather than having nested elements and stuff
        const $shortcut = $(`<a class="tb-no-gustavobc" href="${TBHelpers.htmlEncode(unescape(value))}">${TBHelpers.htmlEncode(unescape(index))}</a>`);
        $shortcut.appendTo('#tb-toolbarshortcuts');
    });

    // Show/hide menubar
    $body.on('click', '.tb-bottombar-unhide, .tb-bottombar-hide', function () {
        toggleMenuBar($(this).hasClass('tb-bottombar-hide'));
    });

    // Show counts on hover
    let $modBarHidTooltip = $body.find('#tb-modbar-hide-tooltip');
    $modbarhid.mouseenter(() => {
        if (!notifierEnabled || compactHide) {
            return;
        }

        const hoverContent = `
                <table>
                    <tr>
                        <td>New Messages</td>
                        <td>${unreadMessageCount}</td>
                    </tr>
                    <tr >
                        <td>Mod Queue</td>
                        <td>${modqueueCount}</td>
                    </tr>
                    <tr >
                        <td>Unmoderated Queue</td>
                        <td>${unmoderatedCount}</td>
                    </tr>
                    <tr>
                        <td>Mod Mail</td>
                        <td >${modmailCount}</td>
                    </tr>
                    <tr>
                        <td>New Mod Mail</td>
                        <td >${newModmailCount}</td>
                    </tr>
                </table>
            `;

        if (!$modBarHidTooltip.length) {
            $modBarHidTooltip = $('<div id="tb-modbar-hide-tooltip"></div>').appendTo($body);
        }
        $modBarHidTooltip.html(TBStorage.purify(hoverContent));
        $modBarHidTooltip.fadeIn(200);
    }).mouseleave(() => {
        $modBarHidTooltip.fadeOut(200);
    });

    // Open the settings
    $body.on('click', '.tb-toolbar-new-settings', async () => {
        if ($('.tb-settings').length) {
            return;
        } // Don't show the window twice
        await TBCore.getModSubs();
        TBModule.showSettings();
    });

    // check for passed settings.
    function switchTab (module) {
        const $this = $body.find(`[data-module="${module}"]`),
              $tb_help_mains = $('.tb-help-main');

        // achievement support
        if (module === 'about') {
            TBCore.sendEvent(TBCore.events.TB_ABOUT_PAGE);
        }
        if (module === 'syntax') {
            TBCore.sendEvent(TBCore.events.TB_SYNTAX_SETTINGS);
        }

        $('.tb-window-tabs a').removeClass('active');
        $this.addClass('active');

        $tb_help_mains.attr('currentpage', module);
        // if we have module name, give that to the help button
        if ($this.data('module')) {
            $tb_help_mains.data('module', $this.data('module'));
        }
        $('.tb-personal-settings .tb-window .tb-window-tab').hide();
        $(`.tb-personal-settings .tb-window .tb-window-tab.${module}`).show();
    }

    window.addEventListener('TBHashParams', event => {
        let module = event.detail.tbsettings;
        if (module) {
            let setting = event.detail.setting;
            this.log(setting);
            module = module.toLowerCase();

            if (setting) {
                setting = setting.toLowerCase();
                const id = `#tb-${module}-${setting}`;
                let highlightedCSS = `${id} p {background-color: ${TBui.standardColors.softyellow}; display: block !important;}`;

                // this next line is to deal with legacy settings
                highlightedCSS += `${id}{background-color: ${TBui.standardColors.softyellow}; display: block !important;}`;
                highlightedCSS += `.tb-setting-link-${setting} {display: inline !important;}`;

                $('head').append(`<style type="text/css">${highlightedCSS}</style>`);
            }

            // Wait a sec for stuff to load.
            setTimeout(() => {
                // prevent tbsetting URL hash from persisting on reload.
                history.pushState('', document.title, window.location.pathname);
                TBModule.showSettings();
                switchTab(module);
            }, 500);
        }
    });

    // change tabs
    $body.on('click', '.tb-window-tabs a:not(.active)', function () {
        const tab = $(this).attr('data-module');
        switchTab(tab);
    });
});

function getDirectingTo () {
    let url = window.location.href.replace(/^http:/, 'https:'),
        directingTo;
    if (url.startsWith('https://old.')) {
        url = url.replace('old.', 'www.');
        directingTo = 'new Reddit';
    } else if (url.startsWith('https://new.')) {
        url = url.replace('new.', 'www.');
        directingTo = 'old Reddit';
    } else {
        // Redirect to old Reddit on the redesign, new Reddit otherwise
        url = url.replace(/https:\/\/.*?\.reddit/, TBCore.isOldReddit ? 'https://new.reddit' : 'https://old.reddit');
        directingTo = TBCore.isOldReddit ? 'new Reddit' : 'old Reddit';
    }
    return {url, directingTo};
}
