/**
 * This refers to the webextension background page.
 * @module BackgroundPage
 */
'use strict';

/**
 * @var {Map<string, function>} messageHandlers A map storing handlers for the
 * various toolbox-defined message types
 */
const messageHandlers = new Map();

/**
 * Handles a message
 * @param {object} request The data sent to the background page
 * @param {runtime.MessageSender} sender The sender of the message
 * @returns {Promise<any> | void}
 */
function handleMessage (request, sender) {
    const handler = messageHandlers.get(request.action);
    if (handler) {
        return Promise.resolve(handler(request, sender));
    } else {
        console.warn('Unknown message type:', request, sender);
    }
}

// Listen for messages
browser.runtime.onMessage.addListener(handleMessage);
