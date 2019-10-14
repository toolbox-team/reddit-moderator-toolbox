/* global messageHandlers */
'use strict';

messageHandlers.set('tb-global', async (request, sender) => {
    const message = {
        action: request.globalEvent,
        payload: request.payload,
    };

    // Send to all tabs
    const tabs = await browser.tabs.query({});
    for (let i = 0; i < tabs.length; ++i) {
        if (sender.tab.id !== tabs[i].id && tabs[i].url.includes('reddit.com')) {
            browser.tabs.sendMessage(tabs[i].id, message);
        }
    }

    // HACK: stuff here is defined in the cache file, ideally we shouldn't need
    //       to call these things across files but there seems to be no way to
    //       pass a message from the background page to itself (which would let
    //       us set up a listener for this event in the cache file instead).
    //       https://stackoverflow.com/q/24551614/1070107
    if (request.globalEvent === 'tb-settings-update') {
        // eslint-disable-next-line no-undef
        TBsettingsObject = request.payload;
        // eslint-disable-next-line no-undef
        initCacheTimeout();
    }
});
