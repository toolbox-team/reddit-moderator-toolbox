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

    // Also send to the background page
    handleMessage(request, sender);
});
