/**
 * This refers to the webextension background page.
 * @module BackgroundPage
 */
'use strict';

/**
 * @var {Map<string, function>} messageHandlers  A map storing handlers for the
 * various toolbox-defined message types
 */
const messageHandlers = new Map();

browser.runtime.onMessage.addListener((request, sender) => {
    const handler = messageHandlers.get(request.action);
    if (handler) {
        return Promise.resolve(handler(request, sender));
    } else {
        console.warn('Unknown message type:', request, sender);
    }
});
