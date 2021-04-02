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

(async () => {
	// Handle settings reset and return early if we're doing that
	if (await checkReset()) {
		return;
	}

	// HACK: Exposes the contents of the helper function objects on the global
	//       object to minimize the amount of work necessary to get existing modules
	//       working with the new system. This should be removed once all modules
	//       are converted to ES6 syntax and they can `import` the helpers
	//       themselves. Note that these values are only guaranteed to be available
	//       after the document receives the `esCompatReady` event.
	const [
		{default: TBLog},
		TBApi,
		TBui,
		TBHelpers,
		{TBListener},
	] = await Promise.all([
		import(browser.runtime.getURL('data/tblog.js')),
		import(browser.runtime.getURL('data/tbapi.js')),
		import(browser.runtime.getURL('data/tbui.js')),
		import(browser.runtime.getURL('data/tbhelpers.js')),
		import(browser.runtime.getURL('data/tblistener.js')),
	]);

	window.TBLog = TBLog;
	window.TBApi = TBApi;
	window.TBui = TBui;
	window.TBHelpers = TBHelpers;
	window.TBListener = new TBListener();

	window.document.dispatchEvent(new CustomEvent('esCompatReady'));
})();
