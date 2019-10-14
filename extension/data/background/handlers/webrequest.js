/* global messageHandlers */
'use strict';

/**
 * Retrieves the user's OAuth tokens from cookies.
 * @param {number?} [tries=1] Number of tries to get the token (recursive)
 * @returns {Promise<Object>} An object with properties `accessToken`,
 * `refreshToken`, `scope`, and some others
 */
function getOAuthTokens (tries = 1) {
    return new Promise(async (resolve, reject) => {
        // This function will fetch the cookie and if there is no cookie attempt to create one by visiting modmail.
        // http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
        const rawCookie = await browser.cookies.get({url: 'https://mod.reddit.com', name: 'token'});
        // If we do get a rawcookie we first want to make sure it is still valid.
        let expired = false;
        if (rawCookie) {
            const cookieExpiration = new Date(rawCookie.expirationDate * 1000).valueOf();
            const timeNow = new Date().valueOf();
            expired = timeNow > cookieExpiration ? true : false;
            console.log('Found cookie expired:', expired);
        }
        // If no cookie is returned it is probably expired and we will need to generate a new one.
        // Instead of trying to do the oauth refresh thing ourselves we just do a GET request for modmail.
        // We try this three times, if we don't have a cookie after that the user clearly isn't logged in.
        if ((!rawCookie || expired) && tries < 3) {
            $.get('https://mod.reddit.com/mail/all').done(data => {
                console.log('data:', data);
                // Ok we have the data, let's give this a second attempt.
                getOAuthTokens(tries + 1).then(resolve);
            });
        } else if ((!rawCookie || expired) && tries > 2) {
            reject(new Error('user not logged into new modmail'));
        } else {
            // The cookie we grab has a base64 encoded string with data. Sometimes is invalid data at the end.
            // This RegExp should take care of that.
            const invalidChar = new RegExp('[^A-Za-z0-9+/].*?$');
            const base64Cookie = rawCookie.value.replace(invalidChar, '');
            const tokenData = atob(base64Cookie);
            resolve(JSON.parse(tokenData));
        }
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
function makeRequest (options) {
    return new Promise(resolve => {
        $.ajax(options).then((data, textStatus, jqXHR) => {
            jqXHR.allResponseHeaders = makeHeaderObject(jqXHR.getAllResponseHeaders());
            resolve({data, textStatus, jqXHR});
        }, (jqXHR, textStatus, errorThrown) => {
            jqXHR.allResponseHeaders = makeHeaderObject(jqXHR.getAllResponseHeaders());
            resolve({jqXHR, textStatus, errorThrown});
        });
    });
}

messageHandlers.set('tb-request', async request => {
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
        return {errorThrown: `Request endpoint '${endpoint}' does not start with a slash`};
    }

    const host = `https://${oauth ? 'oauth' : 'old'}.reddit.com`;
    const options = {
        method,
        url: host + endpoint,
        data,
    };

    if (oauth) {
        // We have to get the OAuth token before we can send it
        try {
            const tokens = await getOAuthTokens();
            // Set beforeSend to add the header
            options.beforeSend = jqXHR => jqXHR.setRequestHeader('Authorization', `bearer ${tokens.accessToken}`);
            // And make the request
            return await makeRequest(options);
        } catch (error) {
            // If we can't get a token, return the error as-is
            return {errorThrown: error.toString()};
        }
    } else {
        // We don't need to do anything extra, just make the request
        return makeRequest(options);
    }
});
