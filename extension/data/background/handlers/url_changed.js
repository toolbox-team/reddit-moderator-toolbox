'use strict';

// Notifies tabs when their URL changes.
// This is triggered in the background as there's no native event which is emitted when `history#pushState` modifies the URL.
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        browser.tabs.sendMessage(tab.id, {action: 'tb-url-changed'});
    }
});
