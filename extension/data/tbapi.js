/**
 * Generic helpers for making requests against the Reddit API.
 */

import TBLog from './tblog.js';
import * as TBStorage from './tbstorage.js';

const logger = TBLog('TBApi');

// Error codes used in lots of places
export const NO_WIKI_PAGE = 'NO_WIKI_PAGE';
export const WIKI_PAGE_UNKNOWN = 'WIKI_PAGE_UNKNOWN';

/**
 * Sends a generic HTTP request through the background page.
 * @function
 * @param {object} options The options for the AJAX request
 * @param {string} options.endpoint The endpoint to request
 * @param {string} [options.method] The HTTP method to use for the request
 * @param {object} [options.query] Query parameters as an object
 * @param {string} [options.body] Body to send with a POST request, serialized
 * as JSON if not a string
 * @param {boolean?} [options.oauth] If true, the request will be sent on
 * oauth.reddit.com, and the `Authorization` header will be set with the
 * OAuth access token for the logged-in user
 * @param {boolean?} [options.okOnly] If true, non-2xx responses will result
 * in an error being rejected. The error will have a `response` property
 * containing the full `Response` object.
 * @param {boolean?} [options.bypassRatelimit=true] If true, the request
 * will be sent immediately, even if the current ratelimit bucket is empty.
 * @returns {Promise} Resolves to a `Response` object or rejects an `Error`.
 */
// HACK: bypassRatelimit currently defaults to true, but in the future we should
//       only use it sparingly. The issue is that because we share ratelimits
//       with the user's own Reddit actions and other extensions, it's very easy
//       for us to hit the limits, which causes Toolbox to not load or load very
//       slowly. We may not be able to resolve this without abandoning our
//       method of pulling authentication from the page, in which case it may
//       not be worth it to do anything about it since Reddit generally still
//       accepts requests over the limit.
export const sendRequest = async ({
    method,
    endpoint,
    query,
    body,
    oauth,
    okOnly,
    bypassRatelimit = true,
}) => {
    // Make the request
    const messageReply = await browser.runtime.sendMessage({
        action: 'tb-request',
        method,
        endpoint,
        query,
        body,
        oauth,
        okOnly,
        bypassRatelimit,
    });

    // The reply from that message will always be an object. It can have these keys:
    // - `error` (true if the request failed, otherwise not present)
    // - `message` (present only with `error`, a string error message)
    // - `response` (response data as an array of arguments to `Response()`)

    if (messageReply.error) {
        // If we get an error, we want to throw an `Error` object.
        const error = new Error(messageReply.message);
        // If we get a response as well, we attach it to the error.
        if (messageReply.response) {
            error.response = new Response(...messageReply.response);
        }
        throw error;
    } else {
        // If we didn't get an error, then we return a `Response`.
        return new Response(...messageReply.response);
    }
};

/**
 * Performs a GET request and promises the body of the response, or the
 * full response object on error.
 * @function
 * @param {string} endpoint The endpoint to request
 * @param {object} data Query parameters as an object
 * @param {object} options Additional options passed to sendRequest()
 */
export const getJSON = (endpoint, query = {}, options = {}) => sendRequest({
    okOnly: true,
    method: 'GET',
    endpoint,
    query,
    ...options,
}).then(response => response.json());

/**
 * Performs a POST request and promises the body of the response, or the
 * full response object on error. Maintains an API similar to `$.post`.
 * @function
 * @param {string} endpoint The endpoint to request
 * @param {object} body The body parameters of the request
 * @param {object} [options] Additional options to TBApi.sendRequest
 * @returns {Promise} Resolves to response data or rejects an error
 */
export const post = (endpoint, body, options = {}) => sendRequest({
    okOnly: true,
    method: 'POST',
    endpoint,
    body,
    ...options,
}).then(response => response.json());

/**
 * Sends an authenticated POST request against the OAuth API.
 * @function
 * @param {string} endpoint The endpoint to request
 * @param {object} body Body parameters as an object
 * @param {object} [options] Additional options to TBApi.sendRequest
 */
export const apiOauthPOST = (endpoint, body, options = {}) => sendRequest({
    method: 'POST',
    oauth: true,
    endpoint,
    body,
    okOnly: true,
    ...options,
});

/**
 * Sends an authenticated GET request against the OAuth API.
 * @function
 * @param {string} endpoint The endpoint to request
 * @param {object} data Query parameters as an object
 */
export const apiOauthGET = (endpoint, query) => sendRequest({
    method: 'GET',
    oauth: true,
    endpoint,
    query,
    okOnly: true,
});

/**
 * A promise that will fulfill with details about the current user, or reject if
 * user details can't be fetched. May return a cached details object if multiple
 * timeouts are encountered.
 * @type {Promise<object | undefined>} JSON response from `/api/me.json`
 */
const userDetailsPromise = (async function fetchUserDetails (tries = 3) {
    try {
        const data = await getJSON('/api/me.json');
        TBStorage.purifyObject(data);
        return data;
    } catch (error) {
        // 504 Gateway Timeout errors can be retried
        if (error.response && error.response.status === 504 && tries > 1) {
            return fetchUserDetails(tries - 1);
        }

        // Throw all other errors without retrying
        throw error;
    }
})()
    // If getting details from API fails, fall back to the cached value (if any)
    .catch(() => TBStorage.getCache('Utils', 'userDetails'));

/**
 * Gets details about the current user.
 * @returns {Promise<object>}
 */
export const getUserDetails = () => userDetailsPromise;

/**
 * Gets the modhash of the currently signed-in user.
 * @returns {Promise<string>}
 */
export const getModhash = () => userDetailsPromise.then(details => details.data.modhash);

/**
 * Gets the username of the currently signed-in user.
 * @returns {Promise<string>}
 */
export const getCurrentUser = () => userDetailsPromise.then(details => details.data.name);

//
// Reddit 'legacy' API stuff. Still very much in use.
//

/**
 * Gets ratelimit information from the API.
 * @function
 * @returns {Promise<rateLimitDescriptor>}
 */
export const getRatelimit = () => sendRequest({
    method: 'HEAD',
    endpoint: '/r/toolbox/wiki/ratelimit.json',
}).then(response => {
    const ratelimitRemaining = response.headers.get('x-ratelimit-remaining'),
          ratelimitReset = response.headers.get('x-ratelimit-reset');

    logger.log(`ratelimitRemaining: ${ratelimitRemaining} ratelimitReset: ${ratelimitReset / 60}`);

    /**
     * An object describing the current rate limit.
     * @typedef rateLimitDescriptor
     * @property {string} rateLimitRemaining The number of API calls left
     * during this ratelimit period
     * @property {string} rateLimitReset The number of seconds until this
     * ratelimit period ends
     */
    return {
        ratelimitRemaining,
        ratelimitReset,
    };
});

/**
 * Updates the content of a wiki page.
 * @function
 * @param {string} page The name of the wiki page
 * @param {string} subreddit The name of the subreddit the page is in
 * @param {string | object} data The new content of the page
 * @param {string} reason A note for the revision history of the page
 * @param {boolean} isJSON If true, `data` is stringified as JSON first
 * @param {boolean} updateAM If true, all tabs are replaced with 4 spaces
 * @returns {Promise} Resolves with no value or rejects with the jqXHR object
 */
export async function postToWiki (page, subreddit, data, reason, isJSON, updateAM) {
    if (reason) {
        reason = `"${reason}" via toolbox`;
    } else {
        reason = 'updated via toolbox';
    }

    if (isJSON) {
        // Not indenting saves precious bytes.
        data = JSON.stringify(data);
    }

    logger.log(`Posting /r/${subreddit}/api/wiki/edit/${page}`);

    // If we update automoderator we want to replace any tabs with four spaces.
    if (updateAM) {
        data = data.replace(/\t/g, '    ');
    }

    try {
        await post(`/r/${subreddit}/api/wiki/edit`, {
            content: data,
            page,
            reason,
            uh: await getModhash(),
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }

    setTimeout(async () => {
        // Set page access to 'mod only'.
        // HACK: Using sendRequest() rather than post() because this "endpoint"
        //       isn't really part of the API, and doesn't return JSON, but .post()
        //       assumes all endpoints will return JSON
        // TODO: do we really need to do this every time?
        sendRequest({
            okOnly: true,
            method: 'POST',
            endpoint: `/r/${subreddit}/wiki/settings/`,
            query: {
                page,
                listed: true, // hrm, may need to make this a config setting.
                permlevel: 2,
                uh: await getModhash(),
            },
        })

        // Super extra double-secret secure, just to be safe.
            .catch(() => {
                alert('error setting wiki page to mod only access');
                window.location = `https://www.reddit.com/r/${subreddit}/wiki/settings/${page}`;
            });
    }, 500);

    await new Promise(resolve => setTimeout(resolve, 750));
}

/**
 * Reads data from a wiki page
 * @function
 * @param {string} subreddit The name of the subreddit the page is in
 * @param {string} page The name of the page
 * @param {boolean} isJSON If true, data is parsed as JSON before being returned
 * @returns {Promise} Promises the data of the wiki page. If there is an
 * error reading from the page, one of the following error values may be
 * returned:
 * - TBApi.WIKI_PAGE_UNKNOWN
 * - TBApi.NO_WIKI_PAGE
 * If the isJSON `param` was true, then this will be an object. Otherwise,
 * it will be the raw contents of the wiki as a string.
 */
export const readFromWiki = (subreddit, page, isJSON) => new Promise(resolve => {
    // We need to demangle the JSON ourselves, so we have to go about it this way :(
    getJSON(`/r/${subreddit}/wiki/${page}.json`).then(data => {
        const wikiData = data.data.content_md;
        if (!wikiData) {
            resolve(NO_WIKI_PAGE);
            return;
        }
        if (isJSON) {
            let parsedWikiData;
            try {
                parsedWikiData = JSON.parse(wikiData);
            } catch (err) {
                // we should really have a INVAILD_DATA error for this.
                logger.log(err);
                resolve(NO_WIKI_PAGE);
            }
            // Moved out of the try so random exceptions don't erase the entire wiki page
            if (parsedWikiData) {
                resolve(parsedWikiData);
            } else {
                resolve(NO_WIKI_PAGE);
            }
            return;
        }
        // We have valid data, but it's not JSON.
        resolve(wikiData);
    }).catch(async error => {
        logger.error(`Wiki error (${subreddit}/${page}):`, error);
        if (!error.response) {
            resolve(WIKI_PAGE_UNKNOWN);
            return;
        }
        let reason;
        try {
            reason = (await error.response.json()).reason || '';
        } catch (_) {
            reason = 'WIKI_PAGE_UNKNOWN';
        }

        if (reason === 'PAGE_NOT_CREATED' || reason === 'WIKI_DISABLED') {
            resolve(NO_WIKI_PAGE);
        } else {
            // we don't know why it failed, we should not try to write to it.
            resolve(WIKI_PAGE_UNKNOWN);
        }
    });
});

/**
 * Gets the ban state of a user.
 * @function
 * @param {string} subreddit The name of the subreddit to check in
 * @param {string} user The name of the user to check
 * @returns {Promise<?banState>} An object describing the ban, or null
 * if the user is not banned
 */
export const getBanState = async (subreddit, user) => {
    // Fetch ban info for just this one user
    const data = await getJSON(`/r/${subreddit}/about/banned/.json`, {user});
    TBStorage.purifyObject(data);
    // This API sometimes returns weird things if the user isn't banned, so we use .find()
    // to ensure `null` is returned if we don't get information about the right user
    return data.data.children.find(ban => ban.name.toLowerCase() === user.toLowerCase());
};

/**
 * Describes a subreddit ban.
 * @typedef banState
 * @property {string} name The banned user's name
 * @property {string} id The banned user's ID fullname
 * @property {string} note The mod-visible ban note
 * @property {string} date The date the ban was issued
 * @property {?number} days_left If the ban is temporary, the number of days
 * until it expires, otherwise null
 */

/**
 * Sets a flair on a post.
 * @function
 * @param {string} postLink The post's fullname
 * @param {string} subreddit The name of the subreddit the post is in
 * @param {string} text The flair's text
 * @param {string} cssClass The flair's CSS class
 * @returns {Promise}
 */
export const flairPost = async (postLink, subreddit, text, cssClass, templateID) => post('/api/selectflair', {
    api_type: 'json',
    link: postLink,
    text,
    css_class: cssClass,
    flair_template_id: templateID,
    r: subreddit,
    uh: await getModhash(),
});

/**
 * Sets a flair on a user in a subreddit.
 * @function
 * @param {string} user The name of the user
 * @param {string} subreddit The name of the subreddit
 * @param {string} text The flair's text
 * @param {string} cssClass The flair's CSS class
 * @returns {Promise}
 */
export const flairUser = async (user, subreddit, text, cssClass, templateID) => post('/api/selectflair', {
    api_type: 'json',
    name: user,
    r: subreddit,
    text,
    css_class: cssClass,
    flair_template_id: templateID,
    uh: await getModhash(),
});

/**
 * Creates a relationship between a user and a subreddit. This is used for:
 * - Banning users
 * - Wikibanning users
 * - Muting users
 * - Adding moderators
 * - Adding wiki contributors
 * - Accepting moderator invitations
 * Note: This API route is weird and will always return 200 OK with a body
 * looking something like this:
 *     {"json": {"errors": []}}
 * As a result, this method will resolve even if the relationship is not
 * established. Check the contents of the errors array to confirm that the
 * call actually worked. This method may still reject if the network request
 * can't be completed or if Reddit's API returns a different response code
 * (e.g. 401 Unauthorized).
 * @function
 * @param {object} options
 * @param {string} options.user The user to apply the relationship to
 * @param {string} options.action The string for the desired action (see
 * {@link https://www.reddit.com/dev/api#POST_api_friend} for a list)
 * @param {string} options.subreddit The sub to apply the relationship in
 * @param {string} [options.banReason] If banning, the private mod note
 * @param {string} [options.banMessage] If banning, the note sent to the user
 * @param {number} [options.banDuration] If banning, the length of the ban (0
 * or undefined for a permanent ban)
 * @param {string} [options.banContext] If banning, a fullname pointing to the
 * link or comment the user is being banned for
 * @param {boolean} [bypassRatelimit=true] Passed to TBApi.sendRequest
 * @returns {Promise} Resolves to the JSON response body or rejects with a
 * jqXHR object
 */
export async function friendUser ({
    user,
    action,
    subreddit,
    banReason,
    banMessage,
    banDuration,
    banContext,
}, bypassRatelimit = true) {
    let trimmedBanMessage,
        trimmedBanReason;
    if (action === 'banned') {
        trimmedBanMessage = banMessage.substring(0, 999);
        trimmedBanReason = banReason.substring(0, 300);
        if (banDuration) {
            if (banDuration > 999) {
                banDuration = 999;
            }
            if (banDuration < 0) {
                banDuration = 0;
            }
        }
    }

    return post('/api/friend', {
        api_type: 'json',
        uh: await getModhash(),
        type: action,
        name: user,
        r: subreddit,
        note: trimmedBanReason,
        ban_message: trimmedBanMessage,
        duration: banDuration,
        ban_context: banContext,
    }, {
        bypassRatelimit,
    });
}

/**
 * Removes a relationship between a user and a subreddit. Note that
 * this API method seems to always return 200 OK with a blank object
 * (`{}`) in response, so there's no meaningful error handling
 * possible here other than network errors.
 * @param {string} user The name of the user
 * @param {string} action The type of relationship to remove (see
 * {@link https://www.reddit.com/dev/api#POST_api_friend} for a list)
 * @param {string} subreddit The name of the subreddit
 * @returns {Promise} Resolves to the JSON response body or rejects
 * an error.
 */
export const unfriendUser = async (user, action, subreddit, bypassRatelimit = true) => post('/api/unfriend', {
    api_type: 'json',
    uh: await getModhash(),
    type: action,
    name: user,
    r: subreddit,
}, {
    bypassRatelimit,
});

/**
 * Mod-distinguishes a post or comment.
 * @function
 * @param {string} id The fullname of the post or comment
 * @param {boolean} sticky If distinguishing a top-level comment, whether to
 * also sticky the comment
 * @returns {Promise}
 */
export const distinguishThing = async (id, sticky) => post('/api/distinguish/yes', {
    id,
    sticky,
    uh: await getModhash(),
});

/**
 * Approves a post or comment.
 * @function
 * @param {string} id Fullname of the post or comment
 * @returns {Promise}
 */
export const approveThing = async id => post('/api/approve', {
    id,
    uh: await getModhash(),
});

/**
 * Removes a post or comment.
 * @function
 * @param {string} id Fullname of the post or comment
 * @param {boolean?} spam If true, removes as spam
 * @param {boolean} [bypassRatelimit=true] Passed to TBApi.sendRequest
 * @returns {Promise}
 */
export const removeThing = async (id, spam = false, bypassRatelimit = true) => post('/api/remove', {
    uh: await getModhash(),
    id,
    spam,
}, {
    bypassRatelimit,
});

/**
 * Marks a post as NSFW.
 * @function
 * @param {string} id Fullname of the post
 * @returns {Promise}
 */
export const markOver18 = async id => post('/api/marknsfw', {
    id,
    uh: await getModhash(),
});

/**
 * Un-marks a post NSFW.
 * @function
 * @param {string} id Fullname of the post
 * @returns {Promise}
 */
export const unMarkOver18 = async id => post('/api/unmarknsfw', {
    uh: await getModhash(),
    id,
});

/**
 * Locks a post or comment.
 * @param {string} id The fullname of the submission or comment
 * @param {boolean} [bypassRatelimit=true] Passed to TBApi.sendRequest
 * @returns {Promise} Resolves to response data or rejects with a jqXHR
 */
export const lock = async (id, bypassRatelimit = true) => apiOauthPOST('/api/lock', {
    id,
    uh: await getModhash(),
}, {
    bypassRatelimit,
});

/**
 * Unlocks a post or comment.
 * @param {string} id The fullname of the submission or comment
 * @returns {Promise} Resolves to response data or rejects with a jqXHR
 */
export const unlock = async id => post('/api/unlock', {
    uh: await getModhash(),
    id,
});

/**
 * Stickies a submission in a subreddit.
 * @param {string} id The fullname of the submission to sticky
 * @param {number} [num] The desired position of the sticky, either 1 or 2
 * @param {boolean} [state=true] Set to false to unsticky the thread (for
 * internal use only; use {@link unstickyThread} instead)
 * @returns {Promise} Resolves with response data or rejects a jqXHR
 */
export const stickyThread = async (id, num, state = true) => post('/api/set_subreddit_sticky', {
    id,
    num,
    state,
    uh: await getModhash(),
});

/**
 * Unstickies a submission.
 * @param {string} id The fullname of the submission to sticky
 * @returns {Promise} Resolves with response data or rejects a jqXHR
 */
export const unstickyThread = id => stickyThread(id, undefined, false);

/**
 * Posts a comment.
 * @function
 * @param {string} parent The fullname of the parent submission or comment
 * @param {string} text The text of the comment to post
 * @returns {Promise} Resolves to a response or rejects with an error or array of errors
 */
export const postComment = async (parent, text) => {
    try {
        const response = await post('/api/comment', {
            parent,
            uh: await getModhash(),
            text,
            api_type: 'json',
        });
        if (Object.prototype.hasOwnProperty.call(response.json, 'errors') && response.json.errors.length > 0) {
            logger.log(`Failed to post comment to on ${parent}`);
            logger.log(response.json.fails);
            throw response.json.errors;
        }
        logger.log(`Successfully posted comment on ${parent}`);
        return response;
    } catch (error) {
        logger.log(`Failed to post link to on ${parent}`);
        logger.log(error);
        throw error;
    }
};

/**
 * Posts a link submission in a subreddit.
 * @function
 * @param {string} link The URL to submit
 * @param {string} title The title of the submission
 * @param {string} subreddit The subreddit to submit to
 * @returns {Promise} Resolves to a response or rejects with an error or array of errors
 */
export const postLink = async (link, title, subreddit) => {
    try {
        const response = await post('/api/submit', {
            kind: 'link',
            resubmit: 'true',
            url: link,
            uh: await getModhash(),
            title,
            sr: subreddit,
            sendreplies: 'true', // this is the default on reddit.com, so it should be our default.
            api_type: 'json',
        });
        if (Object.prototype.hasOwnProperty.call(response.json, 'errors') && response.json.errors.length > 0) {
            logger.log(`Failed to post link to /r/${subreddit}`);
            logger.log(response.json.errors);
            throw response.json.errors;
        }
        logger.log(`Successfully posted link to /r/${subreddit}`);
        return response;
    } catch (error) {
        logger.log(`Failed to post link to /r/${subreddit}`);
        logger.log(error);
        throw error;
    }
};

/**
 * Sends a private message to a user.
 * @function
 * @param {string} user The name of the user to send the message to
 * @param {string} subject The message's subject
 * @param {string} message The message's content
 * @param {?string} [subreddit] If provided, sends the message as a modmail
 * from the specified subreddit
 * @returns {Promise} Resolves to a response or rejects with an error or array of errors
 */
export const sendMessage = async (user, subject, message, subreddit) => {
    try {
        const response = await post('/api/compose', {
            from_sr: subreddit,
            subject: subject.substr(0, 99),
            text: message.substr(0, 10000),
            to: user,
            uh: await getModhash(),
            api_type: 'json',
        });
        if (Object.prototype.hasOwnProperty.call(response.json, 'errors') && response.json.errors.length > 0) {
            logger.log(`Failed to send link to /u/${user}`);
            logger.log(response.json.errors);
            throw response.json.errors;
        }
        logger.log(`Successfully send link to /u/${user}`);
        return response;
    } catch (error) {
        logger.log(`Failed to send link to /u/${user}`);
        logger.log(error);
        throw error;
    }
};

/**
 * Marks a message as read.
 * @param {string} id The fullname of the thing to mark as read
 * @returns {Promise}
 */
export const markMessageRead = async id => post('/api/read_message', {
    api_type: 'json',
    id,
    uh: await getModhash(),
});

/**
 * Gets information about a user.
 * @param {string} user The name of the user
 * @returns {Promise} Resolves to JSON user info or rejects with error text
 */
export const aboutUser = async user => getJSON(`/user/${user}/about.json`, {
    uh: await getModhash(),
}).then(response => {
    TBStorage.purifyObject(response);
    return response;
});

/**
 * Gets the timestamp of the last public activity on the user's profile.
 * @param {string} user The user to look for
 * @returns {Promise} Resolves to a number or rejects an error string
 */
export const getLastActive = async user => getJSON(`/user/${user}.json?limit=1&sort=new`, {
    uh: await getModhash(),
}).then(response => {
    TBStorage.purifyObject(response);
    return response.data.children[0].data.created_utc;
}).catch(error => {
    throw error.responseText;
});

/**
 * Gets the rules for a subreddit
 * @param {string} subreddit The name of the subreddit
 * @returns {Promise} Resolves to the rules as JSON or rejects with an error string
 */
export const getRules = async sub => getJSON(`/r/${sub}/about/rules.json`, {
    uh: await getModhash(),
}).then(response => {
    TBStorage.purifyObject(response);
    return response;
});

/**
 * Gets the report reasons for a post by its URL
 * @param {string} postURL The absolute URL of a post
 * @returns {Promise} Resolves to an object containing the reports or throws an error string
 */
export const getReportReasons = async postURL => getJSON(`${postURL}.json?limit=1`, {
    uh: await getModhash(),
}).then(response => {
    TBStorage.purifyObject(response);
    if (typeof callback !== 'undefined') {
        const data = response[0].data.children[0].data;

        if (!data) {
            throw 'No reports returned';
        }

        return {
            user_reports: data.user_reports,
            mod_reports: data.mod_reports,
        };
    }
});
