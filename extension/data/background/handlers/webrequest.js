'use strict';

/**
 * Retrieves the user's OAuth tokens from cookies.
 * @param {number} [tries=1] Number of tries to get the token (recursive)
 * @returns {Promise<Object>} An object with properties `accessToken`,
 * `refreshToken`, `scope`, and some others
 */
async function getOAuthTokens (tries = 1) {
    // This function will fetch the cookie and if there is no cookie attempt to create one by visiting modmail.
    // http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent

    // Grab the current token cookie
    const cookieInfo = {url: 'https://mod.reddit.com', name: 'token'};
    let rawCookie;
    try {
        rawCookie = await browser.cookies.get(cookieInfo);
    } catch (error) {
        // If first-party isolation is enabled in Firefox, `cookies.get`
        // throws when not provided a `firstPartyDomain`, so we try again
        // passing the first-party domain for the cookie we're looking for.
        cookieInfo.firstPartyDomain = 'reddit.com';
        rawCookie = await browser.cookies.get(cookieInfo);
    }

    // Make sure the cookie is still valid
    let validCookie = true;
    if (rawCookie) {
        const cookieExpiration = rawCookie.expirationDate * 1000;
        const timeNow = Date.now();
        // The cookie is valid if it's younger than its expiration date
        validCookie = timeNow < cookieExpiration;
    } else {
        // If we didn't get a cookie at all, we need a new one
        validCookie = false;
    }

    // If we have a valid cookie, get the tokens from it and return those
    if (validCookie) {
        // The cookie we grab has a base64 encoded string with data. Sometimes is invalid data at the end.
        // This RegExp should take care of that.
        const base64Cookie = rawCookie.value.replace(/[^A-Za-z0-9+/].*?$/, '');
        const tokenData = atob(base64Cookie);
        return JSON.parse(tokenData);
    }

    // If we don't have a valid cookie, we need to generate a new one. If the user
    // is logged in, we can do this by sending a request to the modmail page, and
    // it'll send back a new cookie that the browser will write for us. We'll then
    // be able to read the new cookie and all is well, without having to deal with
    // the Reddit OAuth flow ourselves.
    if (tries < 3) {
        await makeRequest('https://mod.reddit.com/mail/all');
        return getOAuthTokens(tries + 1);
    } else {
        // If we tried that 3 times and still no dice, the user probably isn't logged
        // into modmail, which means this trick won't work. Prompt the user to log
        // into modmail so we can get their token.
        throw new Error('user not logged into new modmail');
    }
}

/**
 * Serializes a fetch Response to a JSON value that can be constructed into a
 * new Response later.
 * @param {Response} response
 * @returns a JSONable thing
 */
async function serializeResponse (response) {
    const headers = {};
    for (const [header, value] of response.headers) {
        headers[header] = value;
    }
    return [await response.text(), {
        status: response.status,
        statusText: response.statusText,
        headers,
    }];
}

/**
 * Creates a URL query string from the given parameters.
 * @param {object} parameters An object of parameters
 * @returns {string}
 */
function queryString (parameters) {
    if (!parameters) {
        return '';
    }
    const kvStrings = [];
    for (const [k, v] of Object.entries(parameters)) {
        kvStrings.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
    if (!kvStrings.length) {
        return '';
    }
    return `?${kvStrings.join('&')}`;
}

/**
 * Makes a web request. Currently this passes directly through to `fetch`, but
 * in the future it will be responsible for handling ratelimits and queueing
 * requests as necessary.
 * @param options The options for the request
 * @returns {Promise}
 * @todo Ratelimit handling
 */
function makeRequest (url, options) {
    return fetch(url, options);
}

messageHandlers.set('tb-request', async request => {
    const {method, endpoint, query, body, oauth} = request;
    if (!endpoint.startsWith('/')) {
        // Old code used to send a full URL to these methods, so this check
        // is to identify old uses of the code
        return {error: `Request endpoint '${endpoint}' does not start with a slash`};
    }

    const url = `https://${oauth ? 'oauth' : 'old'}.reddit.com${endpoint}${queryString(query)}`;
    const options = {
        method,
        body,
    };

    // If requested, fetch OAuth tokens and add `Authorization` header
    if (oauth) {
        try {
            const tokens = await getOAuthTokens();
            options.headers = {Authorization: `bearer ${tokens.accessToken}`};
        } catch (error) {
            // If we can't get a token, return the error as-is
            return {error: error.message};
        }
    }

    // TODO: Handle throws (network errors)
    return makeRequest(url, options).then(serializeResponse);
});
