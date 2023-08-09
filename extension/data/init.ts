import browser from 'webextension-polyfill';
import $ from 'jquery';

// We load all our CodeMirror addons and modes here and they'll be available
// anywhere else we `import CodeMirror from 'codemirror';`
import 'codemirror';
import 'codemirror/addon/dialog/dialog.js';
import 'codemirror/addon/display/fullscreen.js';
import 'codemirror/addon/display/panel.js';
import 'codemirror/addon/display/rulers.js';
import 'codemirror/addon/edit/closebrackets.js';
import 'codemirror/addon/hint/css-hint.js';
import 'codemirror/addon/hint/show-hint.js';
import 'codemirror/addon/scroll/annotatescrollbar.js';
import 'codemirror/addon/search/jump-to-line.js';
import 'codemirror/addon/search/match-highlighter.js';
import 'codemirror/addon/search/matchesonscrollbar.js';
import 'codemirror/addon/search/search.js';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/markdown/markdown.js';
import 'codemirror/mode/yaml/yaml.js';

import './tbplugins.js';

import TBLog from './tblog';
import * as TBStorage from './tbstorage.js';
import {delay} from './tbhelpers.js';
import TBModule from './tbmodule.js';
import * as TBCore from './tbcore.js';
import * as TBApi from './tbapi';
import TBListener from './tblistener.js';

import Devtools from './modules/devtools.js';
import Support from './modules/support.js';
import Modbar from './modules/modbar.js';
import Config from './modules/config.js';
import BetterButtons from './modules/betterbuttons.js';
import DomainTagger from './modules/domaintagger.js';
import ModMatrix from './modules/modmatrix.js';
import ModNotes from './modules/modnotes.js';
import Syntax from './modules/syntax.js';
import ModButton from './modules/modbutton.js';
import General from './modules/general.js';
import Notifier from './modules/notifier.js';
import Usernotes from './modules/usernotes.js';
import Comment from './modules/comment.js';
import NewModmailPro from './modules/newmodmailpro.js';
import ModmailPro from './modules/modmailpro.js';
import Macros from './modules/macros.js';
import PersonalNotes from './modules/personalnotes.js';
import HistoryButton from './modules/historybutton.js';
import RemovalReasons from './modules/removalreasons.js';
import NukeComments from './modules/nukecomments.js';
import Troubleshooter from './modules/trouble.js';
import Profile from './modules/profile.js';
import QueueOverlay from './modules/queue_overlay.js';
import FlyingSnoo from './modules/flyingsnoo.js';
import QueueTools from './modules/queuetools.js';
import Achievements from './modules/achievements.js';
import OldReddit from './modules/oldreddit.js';

/**
 * Checks for reset conditions. Promises `true` if settings are being reset and
 * the rest of toolbox's init process should be cancelled.
 * @returns {Promise<boolean>}
 */
async function checkReset () {
    // Toolbox resets your settings if you open this one specific post
    if (!window.location.href.includes('/r/tb_reset/comments/26jwfh')) {
        return false;
    }

    // Confirm with the user before proceeding
    if (!confirm('This will reset all your toolbox settings. Would you like to proceed?')) {
        return false;
    }

    // Clear local extension storage if we have access to extension storage
    await browser.storage.local.remove('tbsettings');

    // Clear background page localStorage (stores cache information)
    await browser.runtime.sendMessage({
        action: 'tb-cache',
        method: 'clear',
    });

    // Delay for one second to be extra sure everything has been processed
    await delay(1000);

    // Send the user to the confirmation page
    const domain = window.location.hostname.split('.')[0];
    window.location.href = `//${domain}.reddit.com/r/tb_reset/comments/26jwpl/your_toolbox_settings_have_been_reset/`;

    // This should theoretically never be reached, but in case it is, cancel all
    // other init behaviors
    return true;
}

/**
 * Checks whether or not there's a user logged in, retrying a handful of times
 * in case new Reddit hasn't fully loaded yet. Also checks if we've already
 * loaded in this window, and whether we're in a Firefox incognito window. If
 * this function ultimately returns `false`, the init process should end early.
 * @param {number} [tries=3] Number of times to try getting a logged-in user
 * @returns {Promise<void>}
 */
async function checkLoadConditions (tries = 3) {
    let loggedinRedesign = false,
        loggedinOld = false;

    const $body = $('body');

    // Check for redesign
    if ($body.find('#USER_DROPDOWN_ID').text() || $body.find('.BlueBar__account a.BlueBar__username').text() || $body.find('.Header__profile').length) {
        loggedinRedesign = true;
    }

    // Check for old reddit
    if ($body.find('form.logout input[name=uh]').val() || $body.find('.Header__profile').length || $body.hasClass('loggedin')) {
        loggedinOld = true;
    }

    if (!loggedinOld && !loggedinRedesign) {
        if (tries < 1) {
            // We've tried a bunch of times and still don't have anything, so
            // assume there's no logged-in user
            throw new Error('Did not detect a logged in user, Toolbox will not start');
        } else {
            // Give it another go
            await new Promise(resolve => setTimeout(resolve, 500));
            return checkLoadConditions(tries - 1);
        }
    }

    // When firefox updates extension they get reloaded including all content scripts. Old elements remain on the page though.
    // Toolbox doesn't like this very much.
    // We are using this class because of the migration mess with v4.
    if ($body.hasClass('mod-toolbox')) {
        $body.attr('toolbox-warning', 'This page must be reloaded for toolbox to function correctly.');
        throw new Error('Toolbox has already been loaded in this window');
    }

    // https://bugzilla.mozilla.org/show_bug.cgi?id=1380812#c7
    // https://github.com/toolbox-team/reddit-moderator-toolbox/issues/98
    // @ts-expect-error InstallTrigger is not standard
    if ((typeof InstallTrigger !== 'undefined' || 'MozBoxSizing' in document.body.style) && browser.extension.inIncognitoContext) {
        throw new Error('Firefox is in Incognito mode, Toolbox will not work');
    }

    // Check that we have details about the current user
    const userDetails = await TBApi.getUserDetails();
    if (!userDetails || userDetails.constructor !== Object || !Object.keys(userDetails).length) {
        throw new Error('Failed to fetch user details');
    }

    // Write a setting and read back its value, if this fails something is wrong
    if (await TBStorage.setSettingAsync('Utils', 'echoTest', 'echo') !== 'echo') {
        throw new Error('Settings cannot be read/written');
    }
}

/**
 * Handles settings updates that need to happen the first time a new version of
 * Toolbox is run, and ensures that the "cacheName" cache matches the currently
 * logged-in user.
 * @returns {Promise<void>}
 */
async function doSettingsUpdates () {
    const SETTINGS_NAME = 'Utils';

    const currentUser = await TBApi.getCurrentUser();
    let lastVersion = await TBCore.getLastVersion();

    const cacheName = await TBStorage.getCache('Utils', 'cacheName', '');

    // Update cache if we're logged in as someone else
    if (cacheName !== currentUser) {
        await TBStorage.setCache(SETTINGS_NAME, 'cacheName', currentUser);

        // Force refresh of timed cache
        browser.runtime.sendMessage({
            action: 'tb-cache-force-timeout',
        });
    }

    // Extra checks on old faults
    if (typeof lastVersion !== 'number') {
        lastVersion = parseInt(lastVersion);
        await TBStorage.setSettingAsync(SETTINGS_NAME, 'lastVersion', lastVersion);
    }

    let shortLength = await TBStorage.getSettingAsync(SETTINGS_NAME, 'shortLength', 15),
        longLength = await TBStorage.getSettingAsync(SETTINGS_NAME, 'longLength', 45);

    if (typeof shortLength !== 'number') {
        shortLength = parseInt(shortLength);
        await TBStorage.setSettingAsync(SETTINGS_NAME, 'shortLength', shortLength);
    }

    if (typeof longLength !== 'number') {
        longLength = parseInt(longLength);
        await TBStorage.setSettingAsync(SETTINGS_NAME, 'longLength', longLength);
    }

    // First run changes for all releases.
    if (TBCore.shortVersion > lastVersion) {
        // These need to happen for every version change
        await TBStorage.setSettingAsync(SETTINGS_NAME, 'lastVersion', TBCore.shortVersion); // set last version to this version.
        TBCore.getToolboxDevs(); // always repopulate tb devs for each version change

        //* * This should be a per-release section of stuff we want to change in each update.  Like setting/converting data/etc.  It should always be removed before the next release. **//

        // Start: version changes.
        // reportsThreshold should be 0 by default
        if (lastVersion < 50101) {
            await TBStorage.setSettingAsync('QueueTools', 'reportsThreshold', 0);
        }

        // Some new modmail settings were removed in 5.7.0
        if (lastVersion < 50700) {
            await TBStorage.setSettingAsync('NewModMail', 'searchhelp', undefined);
            await TBStorage.setSettingAsync('NewModMail', 'checkForNewMessages', undefined);
        }

        // End: version changes.

        // This is a super extra check to make sure the wiki page for settings export really is private.
        const settingSubEnabled = await TBStorage.getSettingAsync('Utils', 'settingSub', '');
        if (settingSubEnabled) {
            TBCore.setWikiPrivate('tbsettings', settingSubEnabled, false);
        }

        // These two should be left for every new release. If there is a new beta feature people want, it should be opt-in, not left to old settings.
        // TBStorage.setSetting('Notifier', 'lastSeenModmail', now); // don't spam 100 new mod mails on first install.
        // TBStorage.setSetting('Notifier', 'modmailCount', 0);
        await TBStorage.setSettingAsync(SETTINGS_NAME, 'debugMode', false);
    }

    // First run changes for major and minor releases only
    // https://semver.org
    const shortVersionMinor = Math.floor(TBCore.shortVersion / 100);
    const lastVersionMinor = Math.floor(lastVersion / 100);

    if (shortVersionMinor > lastVersionMinor) {
        await TBStorage.setSettingAsync(SETTINGS_NAME, 'betaMode', false);
    }
}

(async () => {
    // Handle settings reset and return early if we're doing that
    if (await checkReset()) {
        return;
    }

    // Create a logger
    const logger = TBLog('Init');

    // Ensure that other conditions are met, and return early if not
    try {
        await checkLoadConditions();
    } catch (error) {
        logger.error('Load condition not met:', (error as Error).message);
        return;
    }

    // Add relevant CSS classes to the page

    const $body = $('body');
    $body.addClass('mod-toolbox');

    if (window.location.hostname === 'mod.reddit.com') {
        $body.addClass('mod-toolbox-new-modmail');
    }

    // new profiles have some weird css going on. This remedies the weirdness...
    // TODO: make proper event types instead of using `any`
    window.addEventListener('TBNewPage', (event: any) => {
        if (event.detail.pageType === 'userProfile') {
            $body.addClass('mod-toolbox-profile');
        } else {
            $body.removeClass('mod-toolbox-profile');
        }
    });

    $('html').addClass('mod-toolbox-rd');
    $body.addClass('mod-toolbox-rd');
    // Bit hacky maybe but allows us more flexibility in specificity.
    // TODO: Remove this and replace uses of it in CSS with duplicate classes
    //       (e.g. `.mod-toolbox-rd.mod-toolbox-rd` as a selector)
    $body.addClass('mod-toolbox-extra');

    // Add icon font
    $('head').append(`
        <style>
            @font-face {
                font-family: 'Material Icons';
                font-style: normal;
                font-weight: 400;
                src: url(MaterialIcons-Regular.eot); /* For IE6-8 */
                src: local('Material Icons'),
                    local('MaterialIcons-Regular'),
                    url(${browser.runtime.getURL('data/styles/font/MaterialIcons-Regular.woff2')}) format('woff2'),
                    url(${browser.runtime.getURL('data/styles/font/MaterialIcons-Regular.woff')}) format('woff'),
                    url(${browser.runtime.getURL('data/styles/font/MaterialIcons-Regular.ttf')}) format('truetype');
            }
        </style>
    `);

    // Display news
    TBCore.displayNotes();

    // Do version-specific setting updates and cache the current logged-in user
    await doSettingsUpdates();

    // Load feature modules and register them
    for (const m of [
        Devtools,
        Support,
        Modbar,
        Config,
        BetterButtons,
        DomainTagger,
        ModMatrix,
        ModNotes,
        Syntax,
        ModButton,
        General,
        Notifier,
        Usernotes,
        Comment,
        NewModmailPro,
        ModmailPro,
        Macros,
        PersonalNotes,
        HistoryButton,
        RemovalReasons,
        NukeComments,
        Troubleshooter,
        Profile,
        QueueOverlay,
        FlyingSnoo,
        QueueTools,
        Achievements,
        OldReddit,
    ]) {
        logger.debug('Registering module', m);
        TBModule.register_module(m);
    }

    // Once all modules are registered, call TB.init() to run them
    await TBModule.init();

    // Once all modules are initialized and have had a chance to register event
    // listeners, start emitting jsAPI events and page URL change events
    TBListener.start();
    TBCore.watchForURLChanges();
})();
