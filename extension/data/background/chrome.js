// We store notification meta data here for later use.
let notificationData = {};

// Send notifications
function notification(title, body, baseDomain, url, modHash, markreadid) {
    // send the notification.
    chrome.notifications.create({
        'type' : 'basic',
        'iconUrl': chrome.runtime.getURL('data/images/icon48.png'),
        'title': title,
        'message': body
    }, function(notificationID) {

        // Store meta data
        notificationData[notificationID] = {
            'url': url,
            'modHash': modHash,
            'markreadid': markreadid,
            'baseDomain': baseDomain
        };
    });
}

// Handle clicking on notifications.
chrome.notifications.onClicked.addListener(function(notificationId) {

    // Mark as read if needed.
    if (notificationData[notificationId].markreadid) {
        $.post(`https://www.reddit.com/api/read_message`, {
            id: notificationData[notificationId].markreadid,
            uh: notificationData[notificationId].modHash,
            api_type: 'json'
        });
    }

    // Open up in new tab.
    chrome.tabs.create({
        url: notificationData[notificationId].baseDomain + notificationData[notificationId].url
    });
    // Notification no longer needed, clear it.
    chrome.notifications.clear(notificationId);
});

chrome.notifications.onClosed.addListener(function(notificationId) {
    // Meta data will not be used anymore. Clear.
    delete notificationData[notificationId];
});

function getCookie(tries, callback) {
    chrome.cookies.get({url: 'https://www.reddit.com', name: 'token'}, function(rawCookie) {

        // If no cookie is returned it is probably expired and we will need to generate a new one.
        // Instead of trying to do the oauth refresh thing ourselves we just do a GET request for modmail.
        // We trie this three times, if we don't have a cookie after that the user clearly isn't logged in.
        if (!rawCookie && tries < 3) {
            $.get('https://mod.reddit.com/mail/all').done(function(data) {
                console.log(data);
                // Ok we have the data, let's give this a second attempt.
                getCookie(tries++, callback);
            });

        } else if (!rawCookie && tries > 2) {
            callback('{"ERROR": "user not logged into new modmail."}');
        } else {

            console.log(rawCookie);
            // The cookie we grab has a base64 encoded string with data. Sometimes is invalid data at the end.
            // This RegExp should take care of that.
            const invalidChar = new RegExp('[^A-Za-z0-9+/].*?$');
            const base64Cookie = rawCookie.value.replace(invalidChar, '');
            const tokenData = atob(base64Cookie);
            console.log(tokenData);
            callback(tokenData);
        }

    });

}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request.action);
        console.log(request);

        // Request to reload the extension. Let's do so.
        if(request.action === 'tb-reload') {
            chrome.runtime.reload();
            console.log('reloaded');
            sendResponse();
        }

        // Request to fetch the oauthToken data.
        if(request.action === 'oauthToken') {
            // This function will fetch the cookie and if there is no cookie attempt to create one by visiting modmail.
            getCookie(1, function(tokenData) {
                console.log('sending response');
                console.log(tokenData);
                sendResponse({oauthToken: tokenData});
            });
            // http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
            return true;

        }
        if(request.action === 'tb-global' ) {
            const message = {
                action: request.globalEvent,
                payload: request.payload
            };

            chrome.tabs.query({}, function(tabs) {
                for (let i = 0; i < tabs.length; ++i) {
                    if(sender.tab.id !== tabs[i].id) {
                        chrome.tabs.sendMessage(tabs[i].id, message);
                    }

                }
            });
            return true;
        }

        if(request.action === 'tb-notification') {
            chrome.notifications.getPermissionLevel(function(permission) {
                if(permission === 'granted') {
                    notification(request.details.title, request.details.body, request.details.baseDomain, request.details.url, request.details.modHash, request.details.markreadid);
                }

                sendResponse({permission: permission});
            });
            return true;
        }
    });

