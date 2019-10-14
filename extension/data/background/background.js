'use strict';
/**
 * This refers to the webextension background page.
 *  @module BackgroundPage
 */

// Notification stuff

// We store notification meta data here for later use.
const notificationData = {};

/**
 * Generates a UUID. We use this instead of something simpler because Firefox
 * requires notification IDs to be UUIDs.
 * @returns {string}
 */

function uuidv4 () {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

/**
 * Sends a native Chrome notification.
 * @param {object} options The notification options
 */
function sendNativeNotification ({title, body, url, modHash, markreadid}) {
    return new Promise((resolve, reject) => {
        if (typeof chrome.notifications.getPermissionLevel === 'undefined') {
            send();
        } else {
            chrome.notifications.getPermissionLevel(permission => {
                if (permission === 'granted') {
                    send();
                } else {
                    reject();
                }
            });
        }

        function send () {
            chrome.notifications.create(uuidv4(), {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('data/images/icon48.png'),
                title,
                message: body,
            }, notificationID => {
                notificationData[notificationID] = {
                    type: 'native',
                    url,
                    modHash,
                    markreadid,
                };
                resolve(notificationID);
            });
        }
    });
}

/**
 * Sends an in-page notification on all open Reddit windows
 * @param {object} options The notification options
 */
function sendPageNotification ({title, body, url, modHash, markreadid}) {
    const notificationID = uuidv4();
    notificationData[notificationID] = {
        type: 'page',
        url,
        modHash,
        markreadid,
    };
    const message = {
        action: 'tb-show-page-notification',
        details: {
            id: notificationID,
            title,
            body,
        },
    };
    return new Promise(resolve => {
        chrome.tabs.query({url: 'https://*.reddit.com/*'}, tabs => {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, message);
            }
            resolve(notificationID);
        });
    });
}

/**
 * Clears a notification
 * @param {string} notificationID The ID of the notification
 */
function clearNotification (notificationID) {
    const metadata = notificationData[notificationID];
    if (!metadata) {
        // Notification has already been cleared
        return;
    }
    if (metadata.type === 'native') {
        // Clear a native notification
        chrome.notifications.clear(notificationID);
    } else {
        // Tell all tabs to clear the in-page notification
        const message = {
            action: 'tb-clear-page-notification',
            id: notificationID,
        };
        chrome.tabs.query({url: 'https://*.reddit.com/*'}, tabs => {
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, message);
            }
        });
        // We don't get a callback when the notifications are closed, so we just
        // clean up the data here
        delete notificationData[notificationID];
    }
}

/**
 * Handles a click on a notification
 * @param {string} notificationID The ID of the notification
 */
function onClickNotification (notificationID) {
    // Store the metadata so we can work with it after clearing the notification
    const metadata = notificationData[notificationID];
    console.log('notification clikcked: ', metadata);

    // Mark as read if needed.
    if (notificationData[notificationID].markreadid) {
        $.post('https://old.reddit.com/api/read_message', {
            id: metadata.markreadid,
            uh: metadata.modHash,
            api_type: 'json',
        });
    }

    // Open up in new tab.
    chrome.windows.getLastFocused(window => {
        chrome.tabs.create({
            url: metadata.url,
            windowId: window.id,
        });
    });

    // Notification no longer needed, clear it.
    clearNotification(notificationID);
}

// Handle events on native notifications
chrome.notifications.onClicked.addListener(onClickNotification);
chrome.notifications.onClosed.addListener(id => {
    // Now that the notification is closed, we're done with its metadata
    delete notificationData[id];
});

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

    if (request.action === 'tb-notification') {
        const notificationTimeout = 6000;
        const sendNotification = request.native ? sendNativeNotification : sendPageNotification;
        sendNotification(request.details).then(id => {
            setTimeout(() => {
                clearNotification(id);
            }, notificationTimeout);
        });
        return; // no response needed
    }

    if (request.action === 'tb-page-notification-click') {
        onClickNotification(request.id);
        return; // no response needed
    }

    if (request.action === 'tb-page-notification-close') {
        clearNotification(request.id);
        return; // no response needed
    }
});
