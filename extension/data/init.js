import TBLog from './tblog.js';
import * as TBStorage from './tbstorage.js';
import {delay} from './tbhelpers.js';
import TBModule from './tbmodule.js';
import * as TBCore from './tbcore.js';
import * as TBApi from './tbapi.js';

// import Devtools from './modules/devtools.js';
// import Support from './modules/support.js';
import Modbar from './modules/modbar.js';
// import Config from './modules/config.js';
import BetterButtons from './modules/betterbuttons.js';
// import DomainTagger from './modules/domaintagger.js';
// import ModMatrix from './modules/modmatrix.js';
// import Syntax from './modules/syntax.js';
// import ModButton from './modules/modbutton.js';
import General from './modules/general.js';
// import Notifier from './modules/notifier.js';
import Usernotes from './modules/usernotes.js';
// import Comment from './modules/comment.js';
// import NewModmailPro from './modules/newmodmailpro.js';
// import ModmailPro from './modules/modmailpro.js';
// import Macros from './modules/macros.js';
import PersonalNotes from './modules/personalnotes.js';
// import HistoryButton from './modules/historybutton.js';
// import RemovalReasons from './modules/removalreasons.js';
import NukeComments from './modules/nukecomments.js';
// import Troubleshooter from './modules/trouble.js';
// import Profile from './modules/profile.js';
// import QueueOverlay from './modules/queue_overlay.js';
// import FlyingSnoo from './modules/flyingsnoo.js';
// import QueueTools from './modules/queuetools.js';
// import Achievements from './modules/achievements.js';
import OldReddit from './modules/oldreddit.js';

/**
 * Checks for reset conditions. Promises `true` if settings are being reset and
 * the rest of toolbox's init process should be cancelled.
 * @returns {Promise<boolean>}
 */
async function checkReset () {
    if (window.location.href.includes('/r/tb_reset/comments/26jwfh')) {
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
        return true;
    }
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

/** A promise that will resolve once TBCore is ready. */
// TODO
const coreLoadedPromise = new Promise(resolve => {
    window.addEventListener('_coreLoaded', resolve, {once: true});
});

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
        logger.error('Load condition not met:', error.message);
        return;
    }

    // Add relevant CSS classes to the page

    const $body = $('body');
    $body.addClass('mod-toolbox');

    if (window.location.hostname === 'mod.reddit.com') {
        $body.addClass('mod-toolbox-new-modmail');
    }

    // new profiles have some weird css going on. This remedies the weirdness...
    window.addEventListener('TBNewPage', event => {
        if (event.detail.pageType === 'userProfile') {
            $body.addClass('mod-toolbox-profile');
        } else {
            $body.removeClass('mod-toolbox-profile');
        }
    });

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

    // Wait for TBCore to load all its legacy stuff into `window.TBCore`
    // TODO
    await coreLoadedPromise;

    // Display news
    TBCore.displayNotes();

    // Load feature modules and register them
    for (const m of [
        // Devtools,
        // Support,
        Modbar,
        // Config,
        BetterButtons,
        // DomainTagger,
        // ModMatrix,
        // Syntax,
        // ModButton,
        General,
        // Notifier,
        Usernotes,
        // Comment,
        // NewModmailPro,
        // ModmailPro,
        // Macros,
        PersonalNotes,
        // HistoryButton,
        // RemovalReasons,
        NukeComments,
        // Troubleshooter,
        // Profile,
        // QueueOverlay,
        // FlyingSnoo,
        // QueueTools,
        // Achievements,
        OldReddit,
    ]) {
        logger.debug('Registering module', m);
        TBModule.register_module(m);
    }

    // Once all modules are registered, call TB.init() to run them
    TBModule.init();
})();
