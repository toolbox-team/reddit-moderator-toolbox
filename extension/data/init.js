const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

    $body.addClass('mod-toolbox');
}

/**
 * Gets a list of all subreddits the current user moderates from the API.
 * @param {string} [after] Pagination parameter used for recursion
 * @returns {Promise<string[]>}
 */
async function getModSubs (after) {
    let json;
    try {
        json = await TBApi.getJSON('/subreddits/mine/moderator.json', {
            after,
            limit: 100,
        });
        TBStorage.purifyObject(json);
    } catch (error) {
        if (error.response && error.response.status === 504) {
            // Always retry 504s
            return getModSubs(after);
        } else {
            throw error;
        }
    }

    // If there are more subs left, fetch them and return everything
    if (json.data.after) {
        return [...json.data.children, ...await getModSubs(json.data.after)];
    } else {
        return json.data.children;
    }
}

/**
 * Gets information about the current user from the API.
 * @param {number} [tries=3] Number of times to retry because of 504s
 * @returns {Promise<object>}
 */
async function getUserDetails (tries = 3) {
    try {
        const data = await TBApi.getJSON('/api/me.json');
        TBStorage.purifyObject(data);
        return data;
    } catch (error) {
        if (error.response && error.response.status === 504 && tries > 1) {
            // Always retry 504s
            return getUserDetails(tries - 1);
        } else {
            throw error;
        }
    }
}

(async () => {
    // Import the logger early since we need to log things
    const {default: TBLog} = await import(browser.runtime.getURL('data/tblog.js'));
    const logger = TBLog('Init');

    // Handle settings reset and return early if we're doing that
    if (await checkReset()) {
        return;
    }

    // Ensure that other conditions are met, and return early if not
    try {
        await checkLoadConditions();
    } catch (error) {
        logger.error('Load condition not met:', error.message);
        return;
    }

    // HACK: Exposes the contents of the helper function objects on the global
    //       object to minimize the amount of work necessary to get existing modules
    //       working with the new system. This should be removed once all modules
    //       are converted to ES6 syntax and they can `import` the helpers
    //       themselves. Note that these values are only guaranteed to be available
    //       after the document receives the `esCompatReady` event.
    const [
        TBStorage,
        TBApi,
        TBui,
        TBHelpers,
        {TBListener},
    ] = await Promise.all([
        import(browser.runtime.getURL('data/tbstorage.js')),
        import(browser.runtime.getURL('data/tbapi.js')),
        import(browser.runtime.getURL('data/tbui.js')),
        import(browser.runtime.getURL('data/tbhelpers.js')),
        import(browser.runtime.getURL('data/tblistener.js')),
    ]);
    window.TBStorage = TBStorage;
    window.TBApi = TBApi;
    window.TBui = TBui;
    window.TBHelpers = TBHelpers;
    window.TBListener = new TBListener();
    // We imported TBLog earlier, but still need to make it global
    window.TBLog = TBLog;

    // Get the current state of a bunch of cache values
    const cacheDetails = {
        cacheName: await TBStorage.getCache('Utils', 'cacheName', ''),
        moderatedSubs: await TBStorage.getCache('Utils', 'moderatedSubs', []),
        moderatedSubsData: await TBStorage.getCache('Utils', 'moderatedSubsData', []),
        configCache: await TBStorage.getCache('Utils', 'configCache', {}),
        rulesCache: await TBStorage.getCache('Utils', 'rulesCache', {}),
        noConfig: await TBStorage.getCache('Utils', 'noConfig', []),
        noRules: await TBStorage.getCache('Utils', 'noRules', []),
    };

    // Get user details from the API, falling back to cache if necessary
    let userDetails;
    try {
        userDetails = await getUserDetails();
        if (!userDetails) {
            throw new Error('User details are empty');
        }
        if (userDetails && userDetails.constructor === Object && Object.keys(userDetails).length > 0) {
            TBStorage.setCache('Utils', 'userDetails', userDetails);
        }
    } catch (error) {
        logger.warn('Failed to get user details from API, getting from cache instead.', error);
        userDetails = TBStorage.getCache('Utils', 'userDetails');
    }
    if (!userDetails || userDetails.constructor !== Object || !Object.keys(userDetails).length) {
        logger.error('Toolbox does not have user details and cannot start.');
        return;
    }

    // Get moderated subreddits from the API if cache is empty
    let newModSubs;
    if (cacheDetails.moderatedSubs.length === 0) {
        try {
            logger.debug('No modsubs in cache, fetching them');
            newModSubs = await getModSubs();
        } catch (error) {
            logger.warn('Failed to get moderated subreddits, and none are cached. Continuing with none.', error);
        }
    }

    // Initialize TBCore on the global object
    window.TBCoreInitWrapper({
        userDetails,
        cacheDetails,
        newModSubs,
    });

    // Load feature modules and register them
    const moduleLoads = [
        import(browser.runtime.getURL('data/modules/devtools.js')),
        import(browser.runtime.getURL('data/modules/support.js')),
        import(browser.runtime.getURL('data/modules/modbar.js')),
        import(browser.runtime.getURL('data/modules/config.js')),
        import(browser.runtime.getURL('data/modules/betterbuttons.js')),
        import(browser.runtime.getURL('data/modules/domaintagger.js')),
        import(browser.runtime.getURL('data/modules/modmatrix.js')),
        import(browser.runtime.getURL('data/modules/syntax.js')),
        import(browser.runtime.getURL('data/modules/modbutton.js')),
        import(browser.runtime.getURL('data/modules/general.js')),
        import(browser.runtime.getURL('data/modules/notifier.js')),
        import(browser.runtime.getURL('data/modules/usernotes.js')),
        import(browser.runtime.getURL('data/modules/comment.js')),
        import(browser.runtime.getURL('data/modules/newmodmailpro.js')),
        import(browser.runtime.getURL('data/modules/modmailpro.js')),
        import(browser.runtime.getURL('data/modules/macros.js')),
        import(browser.runtime.getURL('data/modules/personalnotes.js')),
        import(browser.runtime.getURL('data/modules/historybutton.js')),
        import(browser.runtime.getURL('data/modules/removalreasons.js')),
        import(browser.runtime.getURL('data/modules/nukecomments.js')),
        import(browser.runtime.getURL('data/modules/trouble.js')),
        import(browser.runtime.getURL('data/modules/profile.js')),
        import(browser.runtime.getURL('data/modules/queue_overlay.js')),
        import(browser.runtime.getURL('data/modules/flyingsnoo.js')),
        import(browser.runtime.getURL('data/modules/queuetools.js')),
        import(browser.runtime.getURL('data/modules/achievements.js')),
        import(browser.runtime.getURL('data/modules/oldreddit.js')),
    ].map(moduleLoad => moduleLoad.then(({default: m}) => {
        logger.debug('Initializing module', m);
        window.TB.register_module(m);
    }));

    // Once all modules are loaded, call TB.init()
    await Promise.all(moduleLoads);
    window.TB.init();
})();
