// We store notification meta data here for later use.
const notificationData = {};

function uuidv4 () {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

// Send notifications
function notification (title, body, baseDomain, url, modHash, markreadid) {
    const notificationTimeout = 6000;
    // send the notification.
    console.log('send notification');
    chrome.notifications.create(uuidv4(), {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('data/images/icon48.png'),
        title,
        message: body,
    }, notificationID => {
        console.log(notificationID);
        // Store meta data
        notificationData[notificationID] = {
            url,
            modHash,
            markreadid,
            baseDomain,
        };

        // Clearing is needed because they are otherwise retained by chrome.
        // Specifically in larger quanties they will reapear when a new notification comes in.
        setTimeout(() => {
            chrome.notifications.clear(notificationID);
        }, notificationTimeout);
    });
}

// Handle clicking on notifications.
chrome.notifications.onClicked.addListener(notificationID => {
    // Mark as read if needed.
    if (notificationData[notificationID].markreadid) {
        $.post(`https://www.reddit.com/api/read_message`, {
            id: notificationData[notificationID].markreadid,
            uh: notificationData[notificationID].modHash,
            api_type: 'json',
        });
    }

    // Open up in new tab.
    chrome.windows.getLastFocused(window => {
        chrome.tabs.create({
            url: notificationData[notificationID].baseDomain + notificationData[notificationID].url,
            windowId: window.id,
        });
    });
    // Notification no longer needed, clear it.
    chrome.notifications.clear(notificationID);
});

chrome.notifications.onClosed.addListener(notificationID => {
    // Meta data will not be used anymore. Clear.
    delete notificationData[notificationID];
});

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
    }), (jqXHR, textStatus, errorThrown) => {
        jqXHR.allResponseHeaders = makeHeaderObject(jqXHR.getAllResponseHeaders());
        sendResponse({jqXHR, textStatus, errorThrown});
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request.action);
    console.log(request);

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
                if (sender.tab.id !== tabs[i].id) {
                    chrome.tabs.sendMessage(tabs[i].id, message);
                }
            }
        });
        return true;
    }

    if (request.action === 'tb-notification') {
        if (typeof chrome.notifications.getPermissionLevel !== 'undefined') {
            chrome.notifications.getPermissionLevel(permission => {
                if (permission === 'granted') {
                    notification(request.details.title, request.details.body, request.details.baseDomain, request.details.url, request.details.modHash, request.details.markreadid);
                }
                sendResponse({permission});
            });
            // Firefox being the outlier doesn't support getting the permissionlevel. So we just act as if we do.
        } else {
            notification(request.details.title, request.details.body, request.details.baseDomain, request.details.url, request.details.modHash, request.details.markreadid);
            sendResponse({permission: true});
        }

        return true;
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
        const {method, url, data, sendOAuthToken} = request;
        const options = {method, url, data}; // The options for the AJAX call
        if (sendOAuthToken) {
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
});
