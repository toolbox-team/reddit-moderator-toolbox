'use strict';
/** @namespace  TBApi */
(function (TBApi) {
    const logger = TBLog('TBApi');
    // Generic helpers for making API and other requests

    /**
     * Sends a generic HTTP request through the background page.
     * @param {object} options The options for the AJAX request
     * @param {string} options.method The HTTP method to use for the request
     * @param {string} options.endpoint The endpoint to request
     * @param {object} options.data Query parameters as an object
     * @param {boolean?} options.oauth If true, the request will be sent on
     * oauth.reddit.com, and the `Authorization` header will be set with the
     * OAuth access token for the logged-in user
     */
    TBApi.sendRequest = ({method, endpoint, data, oauth}) => new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'tb-request',
            method,
            endpoint,
            data,
            oauth,
        }, response => {
            if (response.errorThrown !== undefined) {
                reject(response);
            } else {
                resolve(response);
            }
        });
    });

    /**
     * Performs a GET request and promises the body of the response, or the
     * full response object on error. Maintains an API similar to
     * `$.getJSON()` because that's what all these calls used before Chrome
     * forced us to make all requests in the background.
     * @param {string} endpoint The endpoint to request
     * @param {object} data Query parameters as an object
     */
    TBApi.getJSON = (endpoint, data) => TBApi.sendRequest({method: 'GET', endpoint, data})
        .then(response => response.data)
        .catch(response => {
            throw response.jqXHR;
        });

    /**
     * Performs a POST request and promises the body of the response, or the
     * full response object on error. Maintains an API similar to `$.post`.
     * @param {string} endpoint The endpoint to request
     * @param {object} data The body of the request.
     */
    TBApi.post = (endpoint, data) => TBApi.sendRequest({
        method: 'POST',
        endpoint,
        data,
    }).then(response => response.data).catch(response => {
        throw response.jqXHR;
    });

    /**
     * Perform a HEAD request.
     * @param {string} endpoint The endpoint to request
     * @param {callback} doneCallback
     * @returns {callback}
     * @TODO Implement with promises (consumers need to be updated)
     * @TODO "get head" is a confusing name
     */
    TBApi.getHead = (endpoint, doneCallback) => {
        TBApi.sendRequest({
            method: 'HEAD',
            endpoint,
        }).then(response => {
            // data isn't needed; just the tip
            doneCallback(response.status, response.jqXHR);
        });
    };

    /**
     * Sends an authenticated request against the OAuth API from the
     * background page.
     * @param {string} method An HTTP verb
     * @param {string} endpoint The endpoint to request
     * @param {object} data Query parameters as an object
     */
    TBApi.apiOauthRequest = (method, endpoint, data) => TBApi.sendRequest({
        endpoint,
        method,
        data,
        oauth: true,
    });

    /**
     * Sends an authenticated POST request against the OAuth API.
     * @param {string} endpoint The endpoint to request
     * @param {object} data Query parameters as an object
     */
    TBApi.apiOauthPOST = TBApi.apiOauthRequest.bind(null, 'POST');

    /**
     * Sends an authenticated GET request against the OAuth API.
     * @param {string} endpoint The endpoint to request
     * @param {object} data Query parameters as an object
     */
    TBApi.apiOauthGET = TBApi.apiOauthRequest.bind(null, 'GET');

    //
    // Reddit 'legacy' API stuff. Still very much in use.
    //

    /**
     * Gets ratelimit information from the API.
     * @param {TBApi~getRateLimitCallback} callback Executed with ratelimit info
     */
    TBApi.getRatelimit = function getRatelimit (callback) {
        TBApi.getHead(
            '/r/toolbox/wiki/ratelimit.json',
            (status, jqxhr) => {
                const ratelimitRemaining = jqxhr.allResponseHeaders['x-ratelimit-remaining'],
                      ratelimitReset = jqxhr.allResponseHeaders['x-ratelimit-reset'];
                logger.log(`ratelimitRemaining: ${ratelimitRemaining} ratelimitReset: ${ratelimitReset / 60}`);

                if (typeof callback !== 'undefined') {
                    callback({
                        ratelimitRemaining,
                        ratelimitReset,
                    });
                }
            }
        );
    };

    /**
     * @callback TBApi~getRateLimitCallback
     * @param {object} rateLimits An object containing the rate limit info
     * @param {number} rateLimits.rateLimitRemaining
     * @param {number} rateLimits.rateLimitReset
     */

    /**
      * Updates the content of a wiki page.
      * @param {string} page The name of the wiki page
      * @param {string} subreddit The name of the subreddit the page is in
      * @param {string | object} data The new content of the page
      * @param {string} reason A note for the revision history of the page
      * @param {boolean} isJSON If true, `data` is stringified as JSON first
      * @param {boolean} updateAM If true, all tabs are replaced with 4 spaces
      * @param {TBApi~postToWikiCallback} callback Executed on completion
      */
    TBApi.postToWiki = function postToWiki (page, subreddit, data, reason, isJSON, updateAM, callback) {
        if (reason) {
            reason = `"${reason}" via toolbox`;
        } else {
            reason = 'updated via toolbox';
        }

        if (isJSON) {
        // Not indenting saves precious bytes.
        // data = JSON.stringify(data, undefined, TBCore.debugMode ? 2 : undefined);
            data = JSON.stringify(data);
        }

        logger.log(`Posting /r/${subreddit}/api/wiki/edit/${page}`);

        // If we update automoderator we want to replace any tabs with four spaces.
        if (updateAM) {
            data = data.replace(/\t/g, '    ');
        }

        TBApi.post(`/r/${subreddit}/api/wiki/edit`, {
            content: data,
            page,
            reason,
            uh: TBCore.modhash,
        }).then(() => {
            setTimeout(() => {
            // Callback regardless of what happens next.  We wrote to the page.
            // In order to make sure the callback followup doesn't mess with the mod only call we let it wait a bit longer.

                callback(true);
            }, 750);

            setTimeout(() => {
                // Set page access to 'mod only'.
                TBApi.post(`/r/${subreddit}/wiki/settings/`, {
                    page,
                    listed: true, // hrm, may need to make this a config setting.
                    permlevel: 2,
                    uh: TBCore.modhash,
                })

                // Super extra double-secret secure, just to be safe.
                    .catch(() => {
                        alert('error setting wiki page to mod only access');
                        window.location = `https://www.reddit.com/r/${subreddit}/wiki/settings/${page}`;
                    });
            }, 500);
        }).catch(jqXHR => {
            logger.log(jqXHR.responseText);
            callback(false, jqXHR);
        });
    };

    /**
     * @callback TBApi~postToWikiCallback
     * @param {boolean} success Whether or not the update was successful
     * @param {jqXHR} error AjqXHR object with error info if the request failed
     */

    /**
     * Reads data from a wiki page
     * @param {string} subreddit The name of the subreddit the page is in
     * @param {string} page The name of the page
     * @param {boolean} isJSON If true, data is parsed as JSON before being passed to the callback
     * @param {TBApi~readFromWikiCallback} callback Executed with the page data
     */
    TBApi.readFromWiki = function (subreddit, page, isJSON, callback) {
        // We need to demangle the JSON ourselves, so we have to go about it this way :(
        TBApi.sendRequest({
            endpoint: `/r/${subreddit}/wiki/${page}.json`,
        }).then(({data}) => {
            const wikiData = data.data.content_md;
            if (!wikiData) {
                callback(TBCore.NO_WIKI_PAGE);
                return;
            }
            if (isJSON) {
                let parsedWikiData;
                try {
                    parsedWikiData = JSON.parse(wikiData);
                } catch (err) {
                // we should really have a INVAILD_DATA error for this.
                    logger.log(err);
                    callback(TBCore.NO_WIKI_PAGE);
                }
                // Moved out of the try so random exceptions don't erase the entire wiki page
                if (parsedWikiData) {
                    callback(parsedWikiData);
                } else {
                    callback(TBCore.NO_WIKI_PAGE);
                }
                return;
            }
            // We have valid data, but it's not JSON.
            callback(wikiData);
        }).catch(({jqXHR, errorThrown}) => {
            logger.log(`Wiki error (${subreddit}/${page}): ${errorThrown}`);
            if (jqXHR.responseText === undefined) {
                callback(TBCore.WIKI_PAGE_UNKNOWN);
                return;
            }
            let reason;
            if (jqXHR.responseText.startsWith('<!doctype html>')) {
                reason = 'WIKI_PAGE_UNKNOWN';
            } else {
                reason = JSON.parse(jqXHR.responseText).reason || '';
            }

            if (reason === 'PAGE_NOT_CREATED' || reason === 'WIKI_DISABLED') {
                callback(TBCore.NO_WIKI_PAGE);
            } else {
            // we don't know why it failed, we should not try to write to it.
                callback(TBCore.WIKI_PAGE_UNKNOWN);
            }
        });
    };

    /**
     * @callback TBApi~readFromWikiCallback
     * @param {string | object} data The data of the wiki page. If there is an
     * error reading from the page, one of the following error values may be
     * returned:
     * - TBCore.WIKI_PAGE_UNKNOWN
     * - TBCore.NO_WIKI_PAGE
     * If the isJSON `param` was true, then this will be an object. Otherwise,
     * it will be the raw contents of the wiki as a string.
     */

    /**
     * Gets the ban state of a user.
     * @param {string} subreddit The name of the subreddit to check in
     * @param {string} user The name of the user to check
     * @param {TBApi~getBanStateCallback} callback Executed with the ban state
    */
    TBApi.getBanState = function (subreddit, user, callback) {
        TBApi.getJSON(`/r/${subreddit}/about/banned/.json`, {user}).then(data => {
            TBStorage.purifyObject(data);
            const banned = data.data.children;

            // If it's over or under exactly one item they are not banned or that is not their full name.
            if (banned.length !== 1) {
                return callback(false);
            }

            callback(true, banned[0].note, banned[0].date, banned[0].name);
        });
    };

    /**
     * @callback TBApi~getBanStateCallback
     * @param {boolean} banned Whether or not the user is banned
     * @param {string} note The ban note, if any
     * @param {string} number The date the ban was issued, if any
     * @param {string} name The ban name, if any
     */

    TBApi.flairPost = function (postLink, subreddit, text, cssClass, callback) {
        TBApi.post('/api/flair', {
            api_type: 'json',
            link: postLink,
            text,
            css_class: cssClass,
            r: subreddit,
            uh: TBCore.modhash,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.flairUser = function (user, subreddit, text, cssClass, callback) {
        TBApi.post('/api/flair', {
            api_type: 'json',
            name: user,
            r: subreddit,
            text,
            css_class: cssClass,
            uh: TBCore.modhash,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.friendUser = function (user, action, subreddit, banReason, banMessage, banDuration, callback) {
        const trimmedBanMessage = banMessage.length > 999 ? banMessage.substring(0, 999) : banMessage;
        const trimmedBanReason = banReason.length > 99 ? banReason.substring(0, 99) : banReason;
        if (banDuration) {
            if (banDuration > 999) {
                banDuration = 999;
            }
            if (banDuration < 0) {
                banDuration = 0;
            }
        }

        TBApi.post('/api/friend', {
            api_type: 'json',
            uh: TBCore.modhash,
            type: action,
            name: user,
            r: subreddit,
            note: trimmedBanReason,
            ban_message: trimmedBanMessage,
            duration: banDuration,
        })
            .then(response => {
                if (typeof callback !== 'undefined') {
                    callback(true, response);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.unfriendUser = function (user, action, subreddit, callback) {
        TBApi.post('/api/unfriend', {
            api_type: 'json',
            uh: TBCore.modhash,
            type: action,
            name: user,
            r: subreddit,
        })
            .then(response => {
                if (typeof callback !== 'undefined') {
                    callback(true, response);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.distinguishThing = function (id, sticky, callback) {
        TBApi.post('/api/distinguish/yes', {
            id,
            sticky,
            uh: TBCore.modhash,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.approveThing = function (id, callback) {
        TBApi.post('/api/approve', {
            id,
            uh: TBCore.modhash,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.removeThing = function (id, spam, callback) {
        TBApi.post('/api/remove', {
            uh: TBCore.modhash,
            id,
            spam,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.markOver18 = function (id, callback) {
        TBApi.post('/api/marknsfw', {
            id,
            uh: TBCore.modhash,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.unMarkOver18 = function (id, callback) {
        TBApi.post('/api/unmarknsfw', {
            uh: TBCore.modhash,
            id,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.lock = function (id, callback) {
        TBApi.post('/api/lock', {
            id,
            uh: TBCore.modhash,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.unlock = function (id, callback) {
        TBApi.post('/api/unlock', {
            uh: TBCore.modhash,
            id,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.stickyThread = (id, state = true, num = undefined) => TBApi.post('/api/set_subreddit_sticky', {
        id,
        state,
        num,
        uh: TBCore.modhash,
    });

    TBApi.unstickyThread = id => TBApi.stickyThread(id, false);

    TBApi.postComment = function (parent, text, callback) {
        TBApi.post('/api/comment', {
            parent,
            uh: TBCore.modhash,
            text,
            api_type: 'json',
        })
            .then(response => {
                if (Object.prototype.hasOwnProperty.call(response.json, 'errors') && response.json.errors.length > 0) {
                    logger.log(`Failed to post comment to on ${parent}`);
                    logger.log(response.json.fails);
                    if (typeof callback !== 'undefined') {
                        callback(false, response.json.errors);
                    }
                    return;
                }

                logger.log(`Successfully posted comment on ${parent}`);
                if (typeof callback !== 'undefined') {
                    callback(true, response);
                }
            })
            .catch(error => {
                logger.log(`Failed to post link to on${parent}`);
                logger.log(error);
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.postLink = function (link, title, subreddit, callback) {
        TBApi.post('/api/submit', {
            kind: 'link',
            resubmit: 'true',
            url: link,
            uh: TBCore.modhash,
            title,
            sr: subreddit,
            sendreplies: 'true', // this is the default on reddit.com, so it should be our default.
            api_type: 'json',
        })
            .then(response => {
                if (Object.prototype.hasOwnProperty.call(response.json, 'errors') && response.json.errors.length > 0) {
                    logger.log(`Failed to post link to /r/${subreddit}`);
                    logger.log(response.json.errors);
                    if (typeof callback !== 'undefined') {
                        callback(false, response.json.errors);
                    }
                    return;
                }

                logger.log(`Successfully posted link to /r/${subreddit}`);
                if (typeof callback !== 'undefined') {
                    callback(true, response);
                }
            })
            .catch(error => {
                logger.log(`Failed to post link to /r/${subreddit}`);
                logger.log(error);
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.sendMessage = function (user, subject, message, subreddit, callback) {
        TBApi.post('/api/compose', {
            from_sr: subreddit,
            subject: subject.substr(0, 99),
            text: message,
            to: user,
            uh: TBCore.modhash,
            api_type: 'json',
        })
            .then(response => {
                if (Object.prototype.hasOwnProperty.call(response.json, 'errors') && response.json.errors.length > 0) {
                    logger.log(`Failed to send link to /u/${user}`);
                    logger.log(response.json.errors);
                    if (typeof callback !== 'undefined') {
                        callback(false, response.json.errors);
                    }
                    return;
                }

                logger.log(`Successfully send link to /u/${user}`);
                if (typeof callback !== 'undefined') {
                    callback(true, response);
                }
            })
            .catch(error => {
                logger.log(`Failed to send link to /u/${user}`);
                logger.log(error);
                if (typeof callback !== 'undefined') {
                    callback(false, error);
                }
            });
    };

    TBApi.sendPM = function (to, subject, message, callback) {
        TBApi.post('/api/compose', {
            to,
            uh: TBCore.modhash,
            subject,
            text: message,
        })
            .then(() => {
                if (typeof callback !== 'undefined') {
                    callback(true);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error.responseText);
                }
            });
    };

    TBApi.markMessageRead = function (id, callback) {
        TBApi.post('/api/read_message', {
            api_type: 'json',
            id,
            uh: TBCore.modhash,
        }).then(() => {
            if (typeof callback !== 'undefined') {
                callback(true);
            }
        });
    };

    TBApi.aboutUser = function (user, callback) {
        TBApi.getJSON(`/user/${user}/about.json`, {
            uh: TBCore.modhash,
        })
            .then(response => {
                TBStorage.purifyObject(response);
                if (typeof callback !== 'undefined') {
                    callback(true, response);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error.responseText);
                }
            });
    };

    TBApi.getLastActive = function (user, callback) {
        TBApi.getJSON(`/user/${user}.json?limit=1&sort=new`, {
            uh: TBCore.modhash,
        })
            .then(response => {
                TBStorage.purifyObject(response);
                if (typeof callback !== 'undefined') {
                    callback(true, response.data.children[0].data.created_utc);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error.responseText);
                }
            });
    };

    TBApi.getRules = function (sub, callback) {
        TBApi.getJSON(`/r/${sub}/about/rules.json`, {
            uh: TBCore.modhash,
        })
            .then(response => {
                TBStorage.purifyObject(response);
                if (typeof callback !== 'undefined') {
                    callback(true, response);
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error.responseText);
                }
            });
    };

    TBApi.getReportReasons = function (postURL, callback) {
        logger.log('getting reports');
        TBApi.getJSON(`${postURL}.json?limit=1`, {
            uh: TBCore.modhash,
        })
            .then(response => {
                TBStorage.purifyObject(response);
                if (typeof callback !== 'undefined') {
                    const data = response[0].data.children[0].data;

                    if (!data) {
                        return callback(false);
                    }

                    callback(true, {
                        user_reports: data.user_reports,
                        mod_reports: data.mod_reports,
                    });
                }
            })
            .catch(error => {
                if (typeof callback !== 'undefined') {
                    callback(false, error.responseText);
                }
            });
    };
})(window.TBApi = window.TBApi || {});
