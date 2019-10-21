'use strict';
// Notification stuff

// We store notification meta data here for later use.
const notificationData = {};

// TODO: I know we've had this conversation before but I'm 99% sure this isn't
// actually necessary anymore...
/**
 * Generates a UUID. We use this instead of something simpler because Firefox
 * requires notification IDs to be UUIDs.
 * @returns {string}
 */
function uuidv4 () {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

/**
 * Sends a native browser notification.
 * @param {object} options The notification options
 */
async function sendNativeNotification ({title, body, url, modHash, markreadid}) {
    // If we have the getPermissionLevel function, check if we have permission
    // to send notifications. This function doesn't currently exist on Firefox
    // for some reason. (https://bugzilla.mozilla.org/show_bug.cgi?id=1213455)
    if (typeof browser.notifications.getPermissionLevel !== 'undefined') {
        const permission = await browser.notifications.getPermissionLevel();
        if (permission !== 'granted') {
            throw new Error('No permission to send native notifications');
        }
    }
    const notificationID = await browser.notifications.create(uuidv4(), {
        type: 'basic',
        iconUrl: browser.runtime.getURL('data/images/icon48.png'),
        title,
        message: body,
    });
    notificationData[notificationID] = {
        type: 'native',
        url,
        modHash,
        markreadid,
    };
    return notificationID;
}

/**
 * Sends an in-page notification on all open Reddit windows
 * @param {object} options The notification options
 */
async function sendPageNotification ({title, body, url, modHash, markreadid}) {
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
    const tabs = await browser.tabs.query({url: 'https://*.reddit.com/*'});
    for (const tab of tabs) {
        browser.tabs.sendMessage(tab.id, message);
    }
    return notificationID;
}

// Handle notification creation
messageHandlers.set('tb-notification', request => {
    const notificationTimeout = 6000;
    const sendNotification = request.native ? sendNativeNotification : sendPageNotification;
    sendNotification(request.details).then(id => {
        setTimeout(() => {
            clearNotification(id);
        }, notificationTimeout);
    });
    return; // no response needed
});

/**
 * Clears a notification
 * @param {string} notificationID The ID of the notification
 */
async function clearNotification (notificationID) {
    const metadata = notificationData[notificationID];
    if (!metadata) {
        // Notification has already been cleared
        return;
    }
    if (metadata.type === 'native') {
        // Clear a native notification
        browser.notifications.clear(notificationID);
    } else {
        // Tell all tabs to clear the in-page notification
        const message = {
            action: 'tb-clear-page-notification',
            id: notificationID,
        };
        const tabs = await browser.tabs.query({url: 'https://*.reddit.com/*'});
        for (const tab of tabs) {
            browser.tabs.sendMessage(tab.id, message);
        }
        // We don't get a callback when the notifications are closed, so we just
        // clean up the data here
        delete notificationData[notificationID];
    }
}

/**
 * Handles a click on a notification
 * @param {string} notificationID The ID of the notification
 */
async function onClickNotification (notificationID) {
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
    const window = await browser.windows.getLastFocused();
    browser.tabs.create({
        url: metadata.url,
        windowId: window.id,
    });

    // Notification no longer needed, clear it.
    clearNotification(notificationID);
}

// Handle click/close events on in-page notifications
messageHandlers.set('tb-page-notification-click', request => {
    onClickNotification(request.id);
});

messageHandlers.set('tb-page-notification-close', request => {
    clearNotification(request.id);
});

// Handle events on native notifications
browser.notifications.onClicked.addListener(onClickNotification);
browser.notifications.onClosed.addListener(id => {
    // Clearing native notifications is done for us, so we don't need to call
    // clearNotification, but we do still need to clean up metadata.
    delete notificationData[id];
});
