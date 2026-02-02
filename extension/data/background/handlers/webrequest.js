import browser from 'webextension-polyfill';

import {messageHandlers} from '../messageHandling';

let cachedToken = null;

/**
 * Retrieves an OAuth token from /svc/shreddit/token
 * @param {number} [tries=1] Number of tries to get the token (recursive)
 * @returns {Promise<Object>} An object with properties `accessToken` and `expires`.
 */
async function getOAuthTokens (tries = 1) {
    if (!cachedToken) {
        cachedToken = await browser.storage.local.get('tb-accessToken') || {
            accessToken: null,
            expires: 0
        }
    }
    if (cachedToken.expires > Date.now()) {
        return cachedToken;
    }

    // Grab the csrf_token cookie
    const cookieInfo = {url: 'https://sh.reddit.com', name: 'csrf_token'};
    let csrf_token;
    try {
        csrf_token = await browser.cookies.get(cookieInfo);
    } catch (error) {
        // If first-party isolation is enabled in Firefox, `cookies.get`
        // throws when not provided a `firstPartyDomain`, so we try again
        // passing the first-party domain for the cookie we're looking for.
        cookieInfo.firstPartyDomain = 'reddit.com';
        csrf_token = await browser.cookies.get(cookieInfo);
    }

    // If we have a valid cookie, get a token using it and return those
    if (csrf_token) {
        const resp = await fetch("https://www.reddit.com/svc/shreddit/token", {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({ csrf_token: csrf_token.value }),
        });
        if (resp.ok && resp.headers.get("content-type").startsWith("application/json")) {
            const tokenData = await resp.json();
            cachedToken.accessToken = tokenData.token;
            cachedToken.expires = tokenData.expires;
            await browser.storage.local.set({ "tb-accessToken": cachedToken });
            return cachedToken;
        } else {
            throw new Error(`Error getting accessToken from /svc/shreddit/token. Response text: ${await resp.text()}`)
        }
    };

    // Generate a csrf_token by visiting the new site.
    // The regular shitreddit page is filled with crap no one wants and takes long to load.
    // The 404 page is the lightest page in shreddit so we're intentionally triggering a 404.
    if (tries < 3) {
        await makeRequest({
            endpoint: 'https://sh.reddit.com/not_found',
            absolute: true,
        });
        return getOAuthTokens(tries + 1);
    } else {
        throw new Error("error getting csrf_token");
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
}) {
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
    };
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
            const tokens = await getOAuthTokens();
            fetchOptions.headers = {Authorization: `bearer ${tokens.accessToken}`};
        } catch (error) {
            console.error('getOAuthTokens: ', error);
            throw error;
        }
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
messageHandlers.set('tb-request', requestOptions =>
    makeRequest(requestOptions).then(
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
