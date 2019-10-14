'use strict';
/**
 * This refers to the webextension background page.
 *  @module BackgroundPage
 */

//
// Webextension messaging handling.
//
const messageHandlers = new Map();
browser.runtime.onMessage.addListener((request, sender) => {
    const handler = messageHandlers.get(request.action);
    if (handler) {
        return Promise.resolve(handler(request, sender));
    // } else {
    //     console.log('Unknown message type:', request, sender);
    }
});
