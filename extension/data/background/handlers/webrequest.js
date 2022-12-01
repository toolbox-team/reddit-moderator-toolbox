import browser from 'webextension-polyfill';

import {messageHandlers} from '../messageHandling';

/**
 * On platforms where the `"incognito": "split"` manifest key is unsupported, we
 * have to rewrite the `Cookie` header to ensure that requests are sent with the
 * cookies of the tab that initiated the request. This variable controls whether
 * that rewriting is done.
 */
// NOTE: The only platform we care about that doesn't support this is Firefox.
//       We don't use `webRequest` for anything else, so that permission is only
//       included in the Firefox manifest, not the Chrome one. That means that
//       we can use the presence of the `webRequest` API to determine whether to
//       do manual cookie overwriting.
const shouldRewriteRequestCookies = !!browser.webRequest;

/** Name of the temporary header used to pass around cookie store IDs. */
const COOKIE_STORE_ID_HEADER = 'X-Toolbox-Temp-CookieStoreId';

/**
 * Retrieves the user's OAuth tokens from cookies.
 * @param {string} cookieStoreId Sets what cookies to use for the request
 * @param {number} [tries=1] Number of tries to get the token (recursive)
 * @returns {Promise<Object>} An object with properties `accessToken`,
 * `refreshToken`, `scope`, and some others
 */
async function getOAuthTokens (cookieStoreId, tries = 1) {
    // This function will fetch the cookie and if there is no cookie attempt to create one by visiting modmail.
    // http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent

    // Grab the current token cookie
    const cookieInfo = {
        url: 'https://mod.reddit.com',
        name: 'token',
        storeId: cookieStoreId,
    };
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
    let validCookie = false;
    if (rawCookie) {
        const cookieExpiration = rawCookie.expirationDate * 1000;
        const timeNow = Date.now();
        // The cookie is valid if it's younger than its expiration date
        validCookie = timeNow < cookieExpiration;
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
        await makeRequest({
            endpoint: 'https://mod.reddit.com/mail/all',
            absolute: true,
        }, cookieStoreId);
        return getOAuthTokens(cookieStoreId, tries + 1);
    } else {
        // If we tried that 3 times and still no dice, the user probably isn't logged
        // into modmail, which means this trick won't work. Prompt the user to log
        // into modmail so we can get their token.
        throw new Error('user not logged into new modmail');
    }
}

/**
 * Serializes a fetch `Response` to a JSON value that can be constructed into a
 * new `Response` later.
 * @param {Response} response
 * @returns {Promise<array | undefined>} An array of arguments to the `Response`
 * constructor, serializable to plain JSON, which can be used to replicate the
 * given response.
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
 * @function
 * @param {object} parameters An object of parameters
 * @returns {string}
 */
function queryString (parameters) {
    if (!parameters) {
        return '';
    }
    const kvStrings = [];
    for (const [k, v] of Object.entries(parameters)) {
        if (v !== undefined && v !== null) {
            kvStrings.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        }
    }
    if (!kvStrings.length) {
        return '';
    }
    return `?${kvStrings.join('&')}`;
}

/**
 * Creates a `FormData` object from the given set of key-value pairs.
 * @param {object} obj
 * @returns {FormData}
 */
function makeFormData (obj) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(obj)) {
        if (value != null) {
            formData.append(key, value);
        }
    }
    return formData;
}

/**
 * Sends a generic HTTP request.
 * @function
 * @param {object} options The options for the AJAX request
 * @param {string} [options.method] The HTTP method to use for the request
 * @param {string} options.endpoint The endpoint to request
 * @param {object} [options.query] Query parameters as an object
 * @param {string} [options.body] Body to send with a POST request, serialized
 * as JSON if not a string
 * @param {boolean?} [options.oauth] If true, the request will be sent on
 * oauth.reddit.com, and the `Authorization` header will be set with the
 * OAuth access token for the logged-in user
 * @param {boolean?} [options.okOnly] If true, non-2xx responses will result
 * in an error being rejected. The error will have a `response` property
 * containing the full `Response` object.
 * @param {boolean?} [options.absolute] If true, the request endpoint will be
 * treated as a full URL; if false, the endpoint will be treated as a path on
 * `https://old.reddit.com` (or `https://oauth.reddit.com` for oauth requests)
 * @param {string} cookieStoreId Sets what cookie store to pull from
 * @returns {Promise} Resolves to a Response object, or rejects an Error
 */
export async function makeRequest ({
    method,
    endpoint,
    query,
    body,
    oauth,
    okOnly,
    absolute,
}, cookieStoreId) {
    // Construct the request URL
    query = queryString(query);
    // If we have a query object and additional parameters in the endpoint, we
    // just stick the object parameters on the end with `&` instead of `?`, and
    // duplicate keys in the final URL are fine (consistent with jQuery)
    if (endpoint.includes('?')) {
        query = query.replace('?', '&');
    }
    const url = absolute ? endpoint : `https://${oauth ? 'oauth' : 'old'}.reddit.com${endpoint}${query}`;

    // Construct the options object passed to fetch()
    const fetchOptions = {
        credentials: 'include', // required for cookies to be sent
        redirect: 'error', // prevents strange reddit API shenanigans
        method,
        cache: 'no-store',
        headers: {},
    };

    // Attach request body if one is provided
    if (body) {
        if (typeof body === 'object') {
            // If the body is passed as an object, convert it to FormData (this
            // is needed for POST requests)
            fetchOptions.body = makeFormData(body);
        } else {
            // Otherwise, we assume the body is a string and use it as-is
            fetchOptions.body = body;
        }
    }

    // If requested, fetch OAuth tokens and add `Authorization` header
    if (oauth) {
        try {
            const tokens = await getOAuthTokens(cookieStoreId);
            fetchOptions.headers['Authorization'] = `bearer ${tokens.accessToken}`;
        } catch (error) {
            console.error('getOAuthTokens: ', error);
            throw error;
        }
    }

    // If we need to rewrite the `Cookie` header, pass a temporary header
    // containing the cookie store ID. This will be intercepted and replaced
    // with a new `Cookie` header by the `onBeforeSendHeaders` listener below.
    if (shouldRewriteRequestCookies) {
        fetchOptions.headers[COOKIE_STORE_ID_HEADER] = cookieStoreId;
    }

    // Perform the request
    let response;
    try {
        response = await fetch(url, fetchOptions);
    } catch (error) {
        console.error('Fetch request failed:', error);
        throw error;
    }

    // `okOnly` means we should throw if the response has a non-2xx status
    if (okOnly && !response.ok) {
        const error = new Error('Response returned non-2xx status code');
        error.response = response;
        throw error;
    }

    // Otherwise return the raw response
    return response;
}

// Makes a request and sends a reply with response and error properties
messageHandlers.set('tb-request', (requestOptions, sender) => makeRequest(requestOptions, sender.tab.cookieStoreId).then(
    // For succeeded requests, we send only the raw `response`
    async response => ({
        response: await serializeResponse(response),
    }),
    // For failed requests, we send:
    // - `error: true` to indicate the failure
    // - `message` containing information about the error
    // - `response` containing the raw response data (if applicable)
    async error => ({
        error: true,
        message: error.message,
        response: error.response ? await serializeResponse(error.response) : undefined,
    }),
));

// Intercept our own requests and rewrite their cookies, if needed
if (shouldRewriteRequestCookies) {
    browser.webRequest.onBeforeSendHeaders.addListener(async ({requestHeaders, url}) => {
        const storeId = requestHeaders.find(header => header.name === COOKIE_STORE_ID_HEADER)?.value;
        // If we didn't set the temporary header,
        if (!storeId) {
            return {};
        }

        // Retrieve cookies for this URL from the specified cookie store
        const cookies = await browser.cookies.getAll({storeId, url});
        console.log('a', url, storeId, '\nheaders:', requestHeaders, '\ncookies:', cookies);

        // Rewrite the response with modified headers
        requestHeaders = requestHeaders
            // Remove temporary header and old `Cookie` header
            .filter(header => !['Cookie'/* , COOKIE_STORE_ID_HEADER */].includes(header.name))
            // Add a new `Cookie` header with the cookies we retrieved
            .concat({
                name: 'Cookie',
                value: cookies.map(c => `${c.name}=${c.value}`).join(';'),
            });

        console.log(requestHeaders);
        return {
            requestHeaders,
        };
    }, {
        urls: [
            'https://*.reddit.com/*',
        ],
    }, [
        'blocking',
        'requestHeaders',
    ]);
}
