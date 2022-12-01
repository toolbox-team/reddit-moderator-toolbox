// Notification stuff

import browser from 'webextension-polyfill';

import {messageHandlers} from '../messageHandling';
import {makeRequest} from './webrequest';

const NOTIFICATION_STORAGE_KEY = 'tb-notifications-storage';

/**
 * Sets the notification ID and meta data object for a given notification.
 * @param notificationID string notificationID
 * @param notificationObject object containing the meta data
 */
async function setNotificationMetaData (notificationID, notificationObject) {
    const result = await browser.storage.local.get({[NOTIFICATION_STORAGE_KEY]: {}});
    result[NOTIFICATION_STORAGE_KEY][notificationID] = notificationObject;
    await browser.storage.local.set({
        [NOTIFICATION_STORAGE_KEY]: result[NOTIFICATION_STORAGE_KEY],
    });
    return;
}

/**
 * Returns the notification meta data object for a given notification id.
 * @param notificationID notificationID
 * @returns {promise<object>}
 */
async function getNotificationMetaData (notificationID) {
    const result = await browser.storage.local.get({[NOTIFICATION_STORAGE_KEY]: {}});
    if (Object.prototype.hasOwnProperty.call(result[NOTIFICATION_STORAGE_KEY], notificationID)) {
        return result[NOTIFICATION_STORAGE_KEY][notificationID];
    }
    return null;
}

/**
 * Deletes the notification meta data object for a given notification id.
 * @param notificationID subreddit
 * @returns {promise<object>}
 */
async function deleteNotificationMetaData (notificationID) {
    const result = await browser.storage.local.get({[NOTIFICATION_STORAGE_KEY]: {}});
    if (Object.prototype.hasOwnProperty.call(result[NOTIFICATION_STORAGE_KEY], notificationID)) {
        delete result[NOTIFICATION_STORAGE_KEY][notificationID];
        await browser.storage.local.set({
            [NOTIFICATION_STORAGE_KEY]: result[NOTIFICATION_STORAGE_KEY],
        });
    }
    return;
}

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
async function sendNativeNotification ({title, body, url, modHash, markreadid, cookieStoreId}) {
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

    await setNotificationMetaData(notificationID, {
        type: 'native',
        url,
        modHash,
        markreadid,
        cookieStoreId,
    });
    return notificationID;
}

/**
 * Sends an in-page notification on all open Reddit windows
 * @param {object} options The notification options
 */
async function sendPageNotification ({title, body, url, modHash, markreadid, cookieStoreId}) {
    const notificationID = uuidv4();
    await setNotificationMetaData(notificationID, {
        type: 'page',
        url,
        modHash,
        markreadid,
        cookieStoreId,
    });
    const message = {
        action: 'tb-show-page-notification',
        details: {
            id: notificationID,
            title,
            body,
        },
    };
    const tabs = await browser.tabs.query({
        url: 'https://*.reddit.com/*',
        cookieStoreId,
    });
    for (const tab of tabs) {
        browser.tabs.sendMessage(tab.id, message).catch(error => {
            // Receiving end errors are not really relevant to us and happen a lot for iframes and such where toolbox isn't active.
            if (error.message !== 'Could not establish connection. Receiving end does not exist.') {
                console.warn('tb-show-page-notification: ', error.message, error);
            }
        });
    }
    return notificationID;
}

// Handle notification clearing
browser.alarms.onAlarm.addListener(alarmInfo => {
    const name = alarmInfo.name;
    if (name.startsWith('tb-notification-')) {
        const notificationID = name.replace('tb-notification-', '');
        clearNotification(notificationID);
    }
});

// Handle notification creation
messageHandlers.set('tb-notification', async request => {
    const sendNotification = request.native ? sendNativeNotification : sendPageNotification;
    const notificationID = await sendNotification(request.details);
    // The Alarms API is baffling simplistic and limited.
    // Because of that the ID will be send back to the tab that requested the notification and a timeout used there to relay back to the background worker.
    // But because it is possible tabs get closed before the timeout we keep the alarm here as a backup.
    browser.alarms.create(`tb-notification-${notificationID}`, {
        delayInMinutes: 1,
    });
    return notificationID; // no response needed
});

/**
 * Clears a notification
 * @param {string} notificationID The ID of the notification
 */
async function clearNotification (notificationID) {
    const metadata = await getNotificationMetaData(notificationID);
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
        const tabs = await browser.tabs.query({
            url: 'https://*.reddit.com/*',
        }, metadata.cookieStoreId);
        for (const tab of tabs) {
            browser.tabs.sendMessage(tab.id, message).catch(error => {
                // Receiving end errors are not really relevant to us and happen a lot for iframes and such where toolbox isn't active.
                if (error.message !== 'Could not establish connection. Receiving end does not exist.') {
                    console.warn('tb-clear-page-notification: ', error.message, error);
                }
            });
        }
        // We don't get a callback when the notifications are closed, so we just
        // clean up the data here
        await deleteNotificationMetaData(notificationID);
    }
}

/**
 * Handles a click on a notification
 * @param {string} notificationID The ID of the notification
 */
async function onClickNotification (notificationID) {
    // Store the metadata so we can work with it after clearing the notification
    const metadata = await getNotificationMetaData(notificationID);
    console.log('notification clicked: ', metadata);

    // Mark as read if needed.
    if (metadata.markreadid) {
        makeRequest({
            method: 'POST',
            endpoint: '/api/read_message',
            body: {
                id: metadata.markreadid,
                uh: metadata.modHash,
                api_type: 'json',
            },
        }, metadata.cookieStoreId);
    }

    // Open up in new tab.
    const window = await browser.windows.getLastFocused();
    browser.tabs.create({
        url: metadata.url,
        windowId: window.id,
    }, metadata.cookieStoreId);

    // Notification no longer needed, clear it.
    clearNotification(notificationID);
}

// Handle click/clear events on in-page notifications
messageHandlers.set('tb-page-notification-click', request => {
    onClickNotification(request.id);
});

messageHandlers.set('tb-page-notification-clear', request => {
    clearNotification(request.id);
});

// Handle events on native notifications
browser.notifications.onClicked.addListener(onClickNotification);
browser.notifications.onClosed.addListener(id => {
    // Clearing native notifications is done for us, so we don't need to call
    // clearNotification, but we do still need to clean up metadata.
    deleteNotificationMetaData(id);
});
