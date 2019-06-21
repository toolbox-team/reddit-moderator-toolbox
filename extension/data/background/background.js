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

// Request stuff

/**
 * Retrieves the user's OAuth tokens from cookies.
 * @param {number?} [tries=1] Number of tries to get the token (recursive)
 * @returns {Promise<Object>} An object with properties `accessToken`,
 * `refreshToken`, `scope`, and some others
 */
function getOAuthTokens (tries = 1) {
    return new Promise((resolve, reject) => {
        // This function will fetch the cookie and if there is no cookie attempt to create one by visiting modmail.
        // http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
        chrome.cookies.get({url: 'https://www.reddit.com', name: 'token'}, rawCookie => {
            // If no cookie is returned it is probably expired and we will need to generate a new one.
            // Instead of trying to do the oauth refresh thing ourselves we just do a GET request for modmail.
            // We trie this three times, if we don't have a cookie after that the user clearly isn't logged in.
            if (!rawCookie && tries < 3) {
                $.get('https://mod.reddit.com/mail/all').done(data => {
                    console.log('data:', data);
                    // Ok we have the data, let's give this a second attempt.
                    getOAuthTokens(tries++).then(resolve);
                });
            } else if (!rawCookie && tries > 2) {
                reject(new Error('user not logged into new modmail'));
            } else {
                console.log('raw cookie:', rawCookie);
                // The cookie we grab has a base64 encoded string with data. Sometimes is invalid data at the end.
                // This RegExp should take care of that.
                const invalidChar = new RegExp('[^A-Za-z0-9+/].*?$');
                const base64Cookie = rawCookie.value.replace(invalidChar, '');
                const tokenData = atob(base64Cookie);
                resolve(JSON.parse(tokenData));
            }
        });
    });
}

/**
 * Convert the string from getAllResponseHeaders() to a nice object.
 * @param headerString The input string
 * @returns {headerObject} An object containing all header values.
 */
function makeHeaderObject (headerString) {
    const headerArray = headerString.split('\r\n');
    const headerObject = {};

    headerArray.forEach(item => {
        if (item) {
            const itemArray = item.split(': ');
            const itemName = itemArray[0];
            const itemValue = /^[0-9]+$/.test(itemArray[1]) ? parseInt(itemArray[1], 10) : itemArray[1];
            headerObject[itemName] = itemValue;
        }
    });

    return headerObject;
}

/**
 * Make an AJAX request, and then send a response with the result as an object.
 * @param options The options for the request
 * @param sendResponse The `sendResponse` callback that will be called
 */
function makeRequest (options, sendResponse) {
    $.ajax(options).then((data, textStatus, jqXHR) => {
        jqXHR.allResponseHeaders = makeHeaderObject(jqXHR.getAllResponseHeaders());
        sendResponse({data, textStatus, jqXHR});
    }, (jqXHR, textStatus, errorThrown) => {
        jqXHR.allResponseHeaders = makeHeaderObject(jqXHR.getAllResponseHeaders());
        sendResponse({jqXHR, textStatus, errorThrown});
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Request to reload the extension. Let's do so.
    if (request.action === 'tb-reload') {
        chrome.runtime.reload();
        console.log('reloaded');
        sendResponse();
    }

    if (request.action === 'tb-global') {
        const message = {
            action: request.globalEvent,
            payload: request.payload,
        };

        chrome.tabs.query({}, tabs => {
            for (let i = 0; i < tabs.length; ++i) {
                if (sender.tab.id !== tabs[i].id && tabs[i].url.includes('reddit.com')) {
                    chrome.tabs.sendMessage(tabs[i].id, message);
                }
            }
        });
        return true;
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

    if (request.action === 'tb-request') {
        // TODO: this is a misuse of JSDoc but at least it highlights in VS Code
        /**
         * For this action, `request` should have the following properties:
         * @param {string} method The HTTP method to use for the request
         * @param {string} url The full URL to request
         * @param {any} data Arbitrary data passed to the AJAX `data` option
         * @param {boolean?} sendOAuthToken If true, the `Authorization` header
         * will be set with the OAuth access token for the logged-in user
         */
        const {method, endpoint, data, oauth} = request;
        if (!endpoint.startsWith('/')) {
            // Old code used to send a full URL to these methods, so this check
            // is to identify old uses of the code
            return sendResponse({errorThrown: `Request endpoint '${endpoint}' does not start with a slash`});
        }

        const host = `https://${oauth ? 'oauth' : 'old'}.reddit.com`;
        const options = {
            method,
            url: host + endpoint,
            data,
        };

        if (oauth) {
            // We have to get the OAuth token before we can send it
            getOAuthTokens().then(tokens => {
                // Set beforeSend to add the header
                options.beforeSend = jqXHR => jqXHR.setRequestHeader('Authorization', `bearer ${tokens.accessToken}`);
                // And make the request
                makeRequest(options, sendResponse);
            }).catch(error => {
                // If we can't get a token, return the error as-is
                sendResponse({errorThrown: error.toString()});
            });
        } else {
            // We don't need to do anything extra, just make the request
            makeRequest(options, sendResponse);
        }
        return true;
    }

    if (request.action === 'tb-cache') {
        const {method, storageKey, inputValue} = request;

        if (method === 'get') {
            const result = {};
            if (localStorage[storageKey] === undefined) {
                result.value = inputValue;
            } else {
                const storageString = localStorage[storageKey];
                try {
                    result.value = JSON.parse(storageString);
                } catch (error) { // if everything gets strignified, it's always JSON.  If this happens, the storage val is corrupted.
                    result.errorThrown = error.toString();
                    result.value = inputValue;
                }

                // send back the default if, somehow, someone stored `null`
                // NOTE: never, EVER store `null`!
                if (result.value === null
                && inputValue !== null
                ) {
                    result.value = inputValue;
                }
            }

            sendResponse(result);
        }

        if (method === 'set') {
            localStorage[storageKey] = JSON.stringify(inputValue);
            sendResponse();
        }

        if (method === 'clear') {
            localStorage.clear();
            sendResponse();
        }
        return true;
    }
});
