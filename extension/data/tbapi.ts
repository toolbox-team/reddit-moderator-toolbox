/**
 * Generic helpers for making requests against the Reddit API.
 */

import browser from 'webextension-polyfill';

import TBLog from './tblog.js';
import * as TBStorage from './tbstorage.js';
import {createDeferredProcessQueue} from './tbhelpers.js';

const logger = TBLog('TBApi');

// Error codes used in lots of places
export const NO_WIKI_PAGE = 'NO_WIKI_PAGE';
export const WIKI_PAGE_UNKNOWN = 'WIKI_PAGE_UNKNOWN';

/**
 * An error that is the result of a web request. May contain a response object
 * if the error is related to a non-OK response status code.
 */
interface RequestError extends Error {
    /** The request object. */
    response?: Response;
}

/**
 * An object of query parameters to add to a request URL. Items with a value of
 * `undefined` are excluded.
 */
type QueryParams = Record<string, string | undefined>;

/**
 * A request body. If an object is provided, it is converted to a form data
 * body, where items with a value of `undefined` are excluded. JSON bodies
 * should be passed through `JSON.stringify()` manually and passed as strings.
 */
type RequestBody = string | Record<string, string | undefined>;

/** Options for making a web request */
// TODO member docs
interface RequestOptions {
    /** The endpoint to request */
    endpoint: string;
    /** The HTTP method to use for the request */
    method?: string;
    /** Body to send with a POST request, serialized */
    body?: RequestBody;
    /** Query parameters as an object */
    query?: QueryParams;
    /**
     * If true, the request will be sent on oauth.reddit.com, and the
     * `Authorization` header will be set with the OAuth access token for the
     * logged-in user
     */
    oauth?: boolean;
    /**
     * If true, non-2xx responses will result in an error being rejected. The
     * error will have a `response` property containing the full `Response`
     * object.
     */
    okOnly?: boolean;
}

/**
 * Sends a generic HTTP request through the background page.
 * @param options The options for the request
 * @returns Resolves to a `Response` object or rejects an `Error`.
 */
export const sendRequest = async ({
    endpoint,
    method,
    body,
    query,
    oauth,
    okOnly,
}: RequestOptions) => {
    // Make the request
    const messageReply = await browser.runtime.sendMessage({
        action: 'tb-request',
        method,
        endpoint,
        query,
        body,
        oauth,
        okOnly,
    });

    // The reply from that message will always be an object. It can have these keys:
    // - `error` (true if the request failed, otherwise not present)
    // - `message` (present only with `error`, a string error message)
    // - `response` (response data as an array of arguments to `Response()`)

    if (messageReply.error) {
        // If we get an error, we want to throw an `Error` object.
        const error: RequestError = new Error(messageReply.message);
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
 * @param endpoint The endpoint to request
 * @param data Query parameters as an object
 * @param options Additional options passed to sendRequest()
 */
export const getJSON = (
    endpoint: string,
    query?: QueryParams,
    options: Partial<RequestOptions> = {}
) => sendRequest({
    okOnly: true,
    method: 'GET',
    endpoint,
    query,
    ...options,
}).then(response => response.json());

/**
 * Performs a POST request and promises the body of the response, or the
 * full response object on error. Maintains an API similar to `$.post`.
 * @param endpoint The endpoint to request
 * @param body The body parameters of the request
 * @param options Additional options to TBApi.sendRequest
 * @returns Resolves to response data or rejects an error
 */
export const post = (endpoint: string, body?: RequestBody, options = {}) => sendRequest({
    okOnly: true,
    method: 'POST',
    endpoint,
    body,
    ...options,
}).then(response => response.json());

/**
 * Sends an authenticated POST request against the OAuth API.
 * @param endpoint The endpoint to request
 * @param body Body parameters as an object
 * @param options Additional options to TBApi.sendRequest
 */
export const apiOauthPOST = (endpoint: string, body?: RequestBody, options = {}) => sendRequest({
    method: 'POST',
    oauth: true,
    endpoint,
    body,
    okOnly: true,
    ...options,
});

/**
 * Sends an authenticated GET request against the OAuth API.
 * @param endpoint The endpoint to request
 * @param data Query parameters as an object
 */
export const apiOauthGET = (endpoint: string, query: QueryParams) => sendRequest({
    method: 'GET',
    oauth: true,
    endpoint,
    query,
    okOnly: true,
});

/**
 * Sends an authenticated DELETE request against the OAuth API.
 * @param endpoint The endpoint to request
 * @param query Query parameters as an object
 */
export const apiOauthDELETE = (endpoint: string, query: QueryParams) => sendRequest({
    method: 'DELETE',
    oauth: true,
    endpoint,
    query,
    okOnly: true,
});

/**
 * A promise that will fulfill with details about the current user from
 * `/api/me.json`, or reject if user details can't be fetched. May return a
 * cached details object if multiple timeouts are encountered.
 */
const userDetailsPromise = (async function fetchUserDetails (tries = 3) {
    try {
        const data = await getJSON('/api/me.json');
        TBStorage.purifyObject(data);
        TBStorage.setCache('Utils', 'userDetails', data);
        return data;
    } catch (error) {
        // 504 Gateway Timeout errors can be retried
        if (error instanceof Error && (error as RequestError).response?.status === 504 && tries > 1) {
            return fetchUserDetails(tries - 1);
        }

        // Throw all other errors without retrying
        throw error;
    }
})()
    // If getting details from API fails, fall back to the cached value (if any)
    .catch(() => TBStorage.getCache('Utils', 'userDetails'));

/** Gets details about the current user from `/api/me.json`. */
export const getUserDetails = () => userDetailsPromise;

/** Gets the modhash of the currently signed-in user. */
export const getModhash = async () => {
    const userDetails = await getUserDetails();
    return userDetails.data.modhash as string;
};

/** Gets the username of the currently signed-in user. */
export const getCurrentUser = async () => {
    const userDetails = await getUserDetails();
    return userDetails.data.name as string;
};

//
// Reddit 'legacy' API stuff. Still very much in use.
//

/** An object describing the current rate limit. */
export interface RatelimitDescriptor {
    /** The number of API calls left during this ratelimit period */
    ratelimitReset: string;
    /** The number of seconds until this ratelimit period ends */
    ratelimitRemaining: string;
}

/** Gets ratelimit information from the API. */
// TODO: what the fuck are you
export const getRatelimit = () => sendRequest({
    method: 'HEAD',
    endpoint: '/r/toolbox/wiki/ratelimit.json',
}).then(response => {
    // TODO: these headers may not exist and that isn't handled
    const ratelimitRemaining = response.headers.get('x-ratelimit-remaining')!;
    const ratelimitReset = response.headers.get('x-ratelimit-reset')!;

    logger.log(`ratelimitRemaining: ${ratelimitRemaining} ratelimitReset (seconds): ${ratelimitReset}`);

    return {
        ratelimitRemaining,
        ratelimitReset,
    } as RatelimitDescriptor;
});

/**
 * Updates the content of a wiki page. `data` is a string which is written to
 * the page directly.
 */
export async function postToWiki (
    page: string,
    subreddit: string,
    data: string,
    reason: string,
    isJSON: false,
    updateAM: boolean
): Promise<void>;
/**
 * Updates the content of a wiki page. `data` is passed through
 * `JSON.stringify()` before being written to the page.
 */
export async function postToWiki (
    page: string,
    subreddit: string,
    data: any,
    reason: string,
    isJSON: true,
    updateAM: boolean
): Promise<void>;
/**
 * Updates the content of a wiki page.
 * @param page The name of the wiki page
 * @param subreddit The name of the subreddit the page is in
 * @param data The new content of the page
 * @param reason A note for the revision history of the page
 * @param isJSON If true, `data` is stringified as JSON first
 * @param updateAM If true, all tabs are replaced with 4 spaces
 * @returns Resolves with no value or rejects with the jqXHR object
 */
export async function postToWiki (
    page: string,
    subreddit: string,
    data: string | any,
    reason: string,
    isJSON: boolean,
    updateAM: boolean
): Promise<void> {
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
        // TODO logger types are fucked
        // @ts-expect-error
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
                listed: 'true', // hrm, may need to make this a config setting.
                permlevel: '2',
                uh: await getModhash(),
            },
        })

        // Super extra double-secret secure, just to be safe.
            .catch(() => {
                alert('error setting wiki page to mod only access');
                window.location.href = `https://www.reddit.com/r/${subreddit}/wiki/settings/${page}`;
            });
    }, 500);

    await new Promise(resolve => setTimeout(resolve, 750));
}

/**
 * Reads data from a wiki page
 * @param subreddit The name of the subreddit the page is in
 * @param page The name of the page
 * @param isJSON If true, data is parsed as JSON before being returned
 * @returns Promises the data of the wiki page. If there is an error reading
 * from the page, one of the following error values may be returned:
 * - TBApi.WIKI_PAGE_UNKNOWN
 * - TBApi.NO_WIKI_PAGE If the isJSON `param` was true, then this will be an
 *   object. Otherwise, it will be the raw contents of the wiki as a string.
 */
export const readFromWiki = (
    subreddit: string,
    page: string,
    isJSON: boolean = false
) => new Promise(resolve => {
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
        // TODO logger types are fucked
        // @ts-expect-error
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

/** Describes a subreddit ban. */
export interface BanState {
    /** The banned user's name */
    name: string;
    /** The banned user's ID fullname */
    id: string;
    /** The mod-visible ban note */
    note: string;
    /** The date the ban was issued */
    date: string;
    /**
     * If the ban is temporary, the number of days until it expires, otherwise
     * `null`
     */
    days_left: number | null;
}

/**
 * Gets the ban state of a user.
 * @param subreddit The name of the subreddit to check in
 * @param user The name of the user to check
 * @returns Resolves to an object describing the ban, or `undefined` if the user
 * is not banned
 */
export const getBanState = async (subreddit: string, user: string) => {
    // Fetch ban info for just this one user
    const data = await getJSON(`/r/${subreddit}/about/banned/.json`, {user});
    TBStorage.purifyObject(data);
    // This API sometimes returns weird things if the user isn't banned, so we
    // use .find() to ensure `undefined` is returned if we don't get information
    // about the right user
    // TODO: what the fuck do we do about API types
    return (data.data.children as BanState[]).find(ban => ban.name.toLowerCase() === user.toLowerCase());
};

/**
 * Sets a flair on a post.
 * @param postLink The post's fullname
 * @param subreddit The name of the subreddit the post is in
 * @param text The flair's text
 * @param cssClass The flair's CSS class
 * @param templateID The flair's template ID
 */
export const flairPost = async (
    postLink: string,
    subreddit: string,
    text: string,
    cssClass: string,
    templateID: string
) => post('/api/selectflair', {
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
 * @param user The name of the user
 * @param subreddit The name of the subreddit
 * @param text The flair's text
 * @param cssClass The flair's CSS class
 * @param templateID The flair's template ID
 */
export const flairUser = async (
    user: string,
    subreddit: string,
    text: string,
    cssClass: string,
    templateID: string
) => post('/api/selectflair', {
    api_type: 'json',
    name: user,
    r: subreddit,
    text,
    css_class: cssClass,
    flair_template_id: templateID,
    uh: await getModhash(),
});

/** Creates a relationship between a user and a subreddit. */
export async function friendUser (options: {
    user: string,
    action: string,
    subreddit: string,
}): Promise<any>
/** Bans a user from a subreddit. */
export async function friendUser (options: {
    user: string,
    action: 'banned',
    subreddit: string,
    banReason: string,
    banMessage: string,
    banDuration: number,
    banContext: string,
}): Promise<any>
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
 * @param options
 * @param options.user The user to apply the relationship to
 * @param options.action The string for the desired action (see
 * {@link https://www.reddit.com/dev/api#POST_api_friend} for a list)
 * @param options.subreddit The sub to apply the relationship in
 * @param [options.banReason] If banning, the private mod note
 * @param [options.banMessage] If banning, the note sent to the user
 * @param [options.banDuration] If banning, the length of the ban (0
 * or undefined for a permanent ban)
 * @param [options.banContext] If banning, a fullname pointing to the
 * link or comment the user is being banned for
 * @returns Resolves to the JSON response body or rejects with a
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
}: {
    user: string,
    action: string,
    subreddit: string,
    banReason?: string,
    banMessage?: string,
    banDuration?: number,
    banContext?: string,
}) {
    let trimmedBanMessage,
        trimmedBanReason;
    if (action === 'banned') {
        trimmedBanMessage = banMessage!.substring(0, 999);
        trimmedBanReason = banReason!.substring(0, 300);
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
        duration: ''+banDuration,
        ban_context: banContext,
    });
}

/**
 * Removes a relationship between a user and a subreddit. Note that
 * this API method seems to always return 200 OK with a blank object
 * (`{}`) in response, so there's no meaningful error handling
 * possible here other than network errors.
 * @param user The name of the user
 * @param action The type of relationship to remove (see
 * {@link https://www.reddit.com/dev/api#POST_api_friend} for a list)
 * @param subreddit The name of the subreddit
 * @returns Resolves to the JSON response body or rejects
 * an error.
 */
export const unfriendUser = async (user: string, action: string, subreddit: string) => post('/api/unfriend', {
    api_type: 'json',
    uh: await getModhash(),
    type: action,
    name: user,
    r: subreddit,
});

/**
 * Mod-distinguishes a post or comment.
 * @param id The fullname of the post or comment
 * @param sticky If distinguishing a top-level comment, whether to
 * also sticky the comment
 */
export const distinguishThing = async (id: string, sticky: boolean) => post('/api/distinguish/yes', {
    id,
    sticky: ''+sticky,
    uh: await getModhash(),
});

/**
 * Approves a post or comment.
 * @param id Fullname of the post or comment
 */
export const approveThing = async (id: string) => post('/api/approve', {
    id,
    uh: await getModhash(),
});

/**
 * Removes a post or comment.
 * @param id Fullname of the post or comment
 * @param spam If true, removes as spam
 */
export const removeThing = async (id: string, spam = false) => post('/api/remove', {
    uh: await getModhash(),
    id,
    spam: ''+spam,
});

/**
 * Ignores reports on a post or comment
 * @param id Fullname of the post or comment
 */
export const ignoreReports = async (id: string) => post('/api/ignore_reports', {
    id,
    uh: await getModhash(),
});

/**
 * Marks a post as NSFW.
 * @param id Fullname of the post
 */
export const markOver18 = async (id: string) => post('/api/marknsfw', {
    id,
    uh: await getModhash(),
});

/**
 * Un-marks a post NSFW.
 * @param id Fullname of the post
 */
export const unMarkOver18 = async (id: string) => post('/api/unmarknsfw', {
    uh: await getModhash(),
    id,
});

/**
 * Locks a post or comment.
 * @param id The fullname of the submission or comment
 */
export const lock = async (id: string) => apiOauthPOST('/api/lock', {
    id,
    uh: await getModhash(),
});

/**
 * Unlocks a post or comment.
 * @param id The fullname of the submission or comment
 */
export const unlock = async (id: string) => post('/api/unlock', {
    uh: await getModhash(),
    id,
});

/**
 * Stickies a submission in a subreddit.
 * @param id The fullname of the submission to sticky
 * @param num The desired position of the sticky, either 1 or 2
 * @param state Set to false to unsticky the thread (for
 * internal use only; use {@link unstickyThread} instead)
 */
export const stickyThread = async (id: string, num: number | undefined, state = true) => post('/api/set_subreddit_sticky', {
    id,
    num: num ? ''+num : undefined,
    state: ''+state,
    uh: await getModhash(),
});

/**
 * Unstickies a submission.
 * @param id The fullname of the submission to sticky
 */
export const unstickyThread = (id: string) => stickyThread(id, undefined, false);

/**
 * Posts a comment.
 * @param parent The fullname of the parent submission or comment
 * @param text The text of the comment to post
 * @returns Resolves to a response or rejects with an error or array of errors
 */
export const postComment = async (parent: string, text: string) => {
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
 * @param link The URL to submit
 * @param title The title of the submission
 * @param subreddit The subreddit to submit to
 * @returns Resolves to a response or rejects with an error or array of errors
 */
export const postLink = async (link: string, title: string, subreddit: string) => {
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
 * @param user The name of the user to send the message to
 * @param subject The message's subject
 * @param message The message's content
 * @param subreddit If provided, sends the message as a modmail from the
 * specified subreddit
 * @returns Resolves to a response or rejects with an error or array of errors
 */
export const sendMessage = async (user: string, subject: string, message: string, subreddit?: string) => {
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
 * @param id The fullname of the thing to mark as read
 */
export const markMessageRead = async (id: string) => post('/api/read_message', {
    api_type: 'json',
    id,
    uh: await getModhash(),
});

/**
 * Gets information about a user.
 * @param user The name of the user
 * @returns Resolves to JSON user info or rejects with error text
 */
export const aboutUser = async (user: string) => getJSON(`/user/${user}/about.json`, {
    uh: await getModhash(),
}).then(response => {
    TBStorage.purifyObject(response);
    return response;
});

/**
 * Gets the timestamp of the last public activity on the user's profile.
 * @param user The user to look for
 * @returns Resolves to a number or rejects an error string
 */
export const getLastActive = async (user: string) => getJSON(`/user/${user}.json?limit=1&sort=new`, {
    uh: await getModhash(),
}).then(response => {
    TBStorage.purifyObject(response);
    return response.data.children[0].data.created_utc;
}).catch(error => {
    throw error.responseText;
});

/**
 * Gets the rules for a subreddit
 * @param subreddit The name of the subreddit
 * @returns Resolves to the rules as JSON or rejects with an error string
 */
export const getRules = async (sub: string) => getJSON(`/r/${sub}/about/rules.json`, {
    uh: await getModhash(),
}).then(response => {
    TBStorage.purifyObject(response);
    return response;
});

/**
 * Fetches a page of mod notes for the given user in the given subreddit.
 * @param subreddit The name of the subreddit
 * @param user The name of a user
 * @param filter Filter to apply (useful values are `NOTE` and `MOD_ACTION`)
 * @param before End cursor returned by a previous call; used to fetch modnotes
 * further back than the first page
 * @returns Resolves to an array of note objects or rejects an error
 */
export const getModNotes = ({subreddit, user, filter, before}: {
    subreddit: string,
    user: string,
    filter?: string,
    before?: string,
}) => apiOauthGET('/api/mod/notes', {
    subreddit,
    user,
    filter,
    before,
    limit: '100',
}).then(response => response.json()).then(response => {
    TBStorage.purifyObject(response);
    return {
        notes: response.mod_notes,
        startCursor: response.start_cursor,
        endCursor: response.end_cursor,
        hasNextPage: response.has_next_page,
    };
});

/**
 * For each given (user, subreddit) pair, fetches the most recent mod note for
 * that user in that subreddit.
 * @param subreddits List of subreddit names
 * @param users List of user names
 * @returns Resolves to an array of note objects, where each corresponds to the
 * user and subreddit at the same index; if a given user has no notes in the
 * given subreddit, the corresponding item will be `null`
 */
export const getRecentModNotes = (subreddits: string[], users: string[]) => apiOauthGET('/api/mod/notes/recent', {
    subreddits: subreddits.join(','),
    users: users.join(','),
}).then(response => response.json()).then(response => {
    TBStorage.purifyObject(response);
    return response.mod_notes;
});

/**
 * Creates a mod note on the given user in the given subreddit.
 * @param data
 * @param data.subreddit The name of the subreddit
 * @param data.user The name of the user
 * @param data.note The text of the note to add
 * @param data.label One of Reddit's supported note labels
 * @param data.redditID Fullname of an associated post or comment
 */
export const createModNote = ({
    subreddit,
    user,
    note,
    label,
    redditID,
}: {
    subreddit: string;
    user: string;
    note: string;
    label?: string;
    redditID?: string;
}) => apiOauthPOST('/api/mod/notes', {
    subreddit,
    user,
    note,
    label,
    reddit_id: redditID,
});

/**
 * Deletes a mod note on the given user in the given subreddit.
 * @param data
 * @param subreddit The name of the subreddit
 * @param user The name of the user
 * @param id The ID of the note
 */
export const deleteModNote = ({subreddit, user, id}: {
    subreddit: string;
    user: string;
    id: string;
}) => apiOauthDELETE('/api/mod/notes', {
    subreddit,
    user,
    note_id: id,
});

/**
 * Fetches information in bulk about API items.
 * @param fullnames Fullnames of items to fetch info for
 * @returns API items (`$.data.children` from the raw `/api/info` response)
 */
export const getInfoBulk = (fullnames: string[]) => getJSON('/api/info.json', {
    raw_json: '1',
    id: fullnames.join(','),
}).then(result => result.data.children as any);

/**
 * Fetches information about an API item. This uses the bulk API and is
 * debounced to collect multiple calls to send at once.
 * @param fullname Fullname of the item to fetch info for
 * @returns API item (a `$.data.children[]` from the raw `/api/info` response)
 */
export const getInfo = createDeferredProcessQueue((fullnames: string[]) => getInfoBulk(fullnames));
