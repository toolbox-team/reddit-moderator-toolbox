'use strict';

// Notifies tabs when their URL changes.
// This is triggered in the background as there's no native event which is emitted when `history#pushState` modifies the URL.
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        browser.tabs.sendMessage(tab.id, {action: 'tb-url-changed'})
            .catch(error => {
                // Receiving end errors are not really relevant to us and happen a lot for iframes and such where toolbox isn't active.
                if (error.message !== 'Could not establish connection. Receiving end does not exist.') {
                    console.warn('tb-url-changed: ', error.message, error);
                }
            });
    }
});
