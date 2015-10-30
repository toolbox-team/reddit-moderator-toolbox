// Seriously, don't use this shit.  This is just a mockup of the concept for a reddit api lib not tied to TB.

(function (redditapi) {
    //console.log('reddit api');

    //Private variables
    var modhash = $("form.logout input[name=uh]").val(),
        callStack = {};

    // concept stack object.
    /*
    redditapi.stackObject;
    redditapi.stackObject.prototype = {
        _apiPage: '', //string
        _callJson: {}, // object
        _callback: '', // string
        _success: '', //bool
        _error: '', // string
        get apiPage() {
            return this._apiPage;
        },
        set apiPage(val) {
            this._apiPage = val;
        },
        get callJson() {
            return this._callJson;
        },
        set callJson(val) {
            this._callJson = val;
        },
        get callback() {
            return this._callback;
        },
        set callback(val) {
            this._callback = val;
        },
        get success() {
            return this._success;
        },
        set success(val) {
            this._success = val;
        },
        get error() {
            return this._error;
        },
        set error(val) {
            this._error = val;
        }
    };
    */

    // Public error types.
    redditapi.NO_WIKI_PAGE = 'NO_WIKI_PAGE';
    redditapi.WIKI_PAGE_UNKNOWN = 'WIKI_PAGE_UNKNOWN';

    // private functions
    function apiCaller(apiStackObject){
        // Every public api function should build the call, then call this.
        // here we can manage the stack, errors and API limits.
        // the call itself should be responsible for parsing the response for any errors and responding with a
        // a proper redditapi.API_CALL_ERROR similar to how the wiki calls work.
    }

    // we might need an init function to ensure we are logged in, etc.

    // Reddit API stuff
    redditapi.postToWiki = function postToWiki(page, subreddit, data, reason, isJSON, updateAM, callback) {
        if (reason) {
            reason = '"' + reason + '" via toolbox';
        } else {
            reason = 'updated via toolbox';
        }

        if (isJSON) {
            // Not indenting saves precious bytes.
            //data = JSON.stringify(data, undefined, redditapi.debugMode ? 2 : undefined);
            data = JSON.stringify(data);
        }

        $.post('/r/' + subreddit + '/api/wiki/edit', {
            content: data,
            page: page,
            // reason: 'updated via toolbox config',
            reason: reason,
            uh: modhash
        })

            .error(function postToWiki_error(err) {
                callback(false, err.responseText);
            })

            .success(function () {
                // Callback regardless of what happens next.  We wrote to the page.
                callback(true);

                if (updateAM) {
                    $.post('/api/compose', {
                        to: 'automoderator',
                        uh: modhash,
                        subject: subreddit,
                        text: 'update'
                    })
                        .success(function () {
                            alert('sucessfully sent update PM to automoderator');
                        })
                        .error(function () {
                            alert('error sending update PM to automoderator');
                            window.location = '/message/compose/?to=AutoModerator&subject=' + subreddit + '&message=update';
                        });
                }

                setTimeout(function () {

                    // Set page access to 'mod only'.
                    $.post('/r/' + subreddit + '/wiki/settings/', {
                        page: page,
                        listed: true, //hrm, may need to make this a config setting.
                        permlevel: 2,
                        uh: modhash
                    })

                        // Super extra double-secret secure, just to be safe.
                        .error(function (err) {
                            alert('error setting wiki page to mod only access');
                            window.location = '/r/' + subreddit + '/wiki/settings/' + page;
                        });

                }, 500);
            });
    };


    // reddit HTML encodes all of their JSON responses, we need to HTMLdecode
    // them before parsing.
    redditapi.unescapeJSON = function (val) {
        if (typeof(val) == "string") {
            val = val.replace(/&quot;/g, '"')
                .replace(/&gt;/g, ">").replace(/&lt;/g, "<")
                .replace(/&amp;/g, "&");
        }
        return val;
    };


    redditapi.readFromWiki = function (subreddit, page, isJSON, callback) {
        // We need to demangle the JSON ourselves, so we have to go about it this way :(
        $.ajax('/r/' + subreddit + '/wiki/' + page + '.json', {
            dataType: "json",
            dataFilter: function (data, type) {
                //TODO: right now a lot of functions implicitly rely on reddit
                //returning escaped JSON to operate safely. add this back in once
                //everything's been audited.

                //return redditapi.unescapeJSON(data);
                return data;
            }
        })
            .done(function (json) {
                var wikiData = json.data.content_md;

                if (!wikiData) {
                    callback(redditapi.NO_WIKI_PAGE);
                    return;
                }

                if (isJSON) {
                    wikiData = JSON.parse(wikiData);
                    if (wikiData) {
                        callback(wikiData);
                    } else {
                        callback(redditapi.NO_WIKI_PAGE);
                    }
                    return;
                }

                // We have valid data, but it's not JSON.
                callback(wikiData);

            })
            .fail(function (jqXHR, textStatus, e) {
                if (!jqXHR.responseText) {
                    callback(redditapi.WIKI_PAGE_UNKNOWN);
                    return;
                }

                var reason = JSON.parse(jqXHR.responseText).reason || '';
                if (reason == 'PAGE_NOT_CREATED' || reason == 'WIKI_DISABLED') {
                    callback(redditapi.NO_WIKI_PAGE);
                } else {
                    // we don't know why it failed, we should not try to write to it.
                    callback(redditapi.WIKI_PAGE_UNKNOWN);
                }
            });
    };


    redditapi.redditLogin = function (uname, pass, remeber, callback) {
        $.post('/api/login', {
            api_type: 'json',
            passwd: pass,
            user: uname,
            rem: remeber
        })
            .success(function () {
                if (typeof callback !== "undefined")
                    callback(true);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };


    redditapi.getBanState = function (subreddit, user, callback) {
        $.get("/r/" + subreddit + "/about/banned/.json", {user: user}, function (data) {
            var banned = data.data.children;

            // If it's over or under exactly one item they are not banned or that is not their full name.
            if (banned.length !== 1) {
                return callback(false);
            }

            callback(true, banned[0].note, banned[0].date, banned[0].name);
        });
    };


    redditapi.flairPost = function (postLink, subreddit, text, cssClass, callback) {
        $.post('/api/flair', {
            api_type: 'json',
            link: postLink,
            text: text,
            css_class: cssClass,
            r: subreddit,
            uh: modhash
        })
            .success(function () {
                if (typeof callback !== "undefined")
                    callback(true);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.flairUser = function (user, subreddit, text, cssClass, callback) {
        $.post('/api/flair', {
            api_type: 'json',
            user: user,
            r: subreddit,
            text: text,
            css_class: cssClass,
            uh: modhash
        })
            .success(function () {
                if (typeof callback !== "undefined")
                    callback(true);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.banUser = function (user, subreddit, banReason, banMessage, banDuration, callback) {
        $.post('/api/friend', {
            api_type: 'json',
            uh: modhash,
            type: 'banned',
            name: user,
            r: subreddit,
            note: banReason,
            ban_message: banMessage,
            duration: banDuration
        })
            .success(function (response) {
                if (typeof callback !== "undefined")
                    callback(true, response);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.unbanUser = function (user, subreddit, callback) {
        $.post('/api/unfriend', {
            api_type: 'json',
            uh: modhash,
            type: 'banned',
            name: user,
            r: subreddit
        })
            .success(function (response) {
                if (typeof callback !== "undefined")
                    callback(true, response);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.distinguishThing = function (id, callback) {
        $.post('/api/distinguish/yes', {
            id: id,
            uh: modhash
        })
            .success(function () {
                if (typeof callback !== "undefined")
                    callback(true);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };


    redditapi.approveThing = function (id, callback) {
        $.post('/api/approve', {
            id: id,
            uh: modhash
        })
            .success(function () {
                if (typeof callback !== "undefined")
                    callback(true);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.removeThing = function (id, spam, callback) {
        $.post('/api/remove', {
            uh: modhash,
            id: id,
            spam: spam
        })
            .success(function () {
                if (typeof callback !== "undefined")
                    callback(true);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.postComment = function (parent, text, callback) {
        $.post('/api/comment', {
            parent: parent,
            uh: modhash,
            text: text,
            api_type: 'json'
        })
            .success(function (response) {
                if (response.json.hasOwnProperty("errors") && response.json.errors.length > 0) {
                    if (typeof callback !== "undefined")
                        callback(false, response.json.errors);
                    return;
                }

                if (typeof callback !== "undefined")
                    callback(true, response);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.postLink = function (link, title, subreddit, callback) {
        $.post('/api/submit', {
            kind: 'link',
            resubmit: 'true',
            url: link,
            uh: modhash,
            title: title,
            sr: subreddit,
            api_type: 'json'
        })
            .success(function (response) {
                if (response.json.hasOwnProperty("errors") && response.json.errors.length > 0) {
                    if (typeof callback !== "undefined")
                        callback(false, response.json.errors);
                    return;
                }

                if (typeof callback !== "undefined")
                    callback(true, response);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.sendMessage = function (user, subject, message, subreddit, callback) {
        $.post('/api/compose', {
            from_sr: subreddit,
            subject: subject,
            text: message,
            to: user,
            uh: modhash,
            api_type: 'json'
        })
            .success(function (response) {
                if (response.json.hasOwnProperty("errors") && response.json.errors.length > 0) {
                    if (typeof callback !== "undefined")
                        callback(false, response.json.errors);
                    return;
                }

                if (typeof callback !== "undefined")
                    callback(true, response);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error);
            });
    };

    redditapi.sendPM = function (to, subject, message, callback) {
        $.post('/api/compose', {
            to: to,
            uh: modhash,
            subject: subject,
            text: message
        })
            .success(function () {
                if (typeof callback !== "undefined")
                    callback(true);
            })
            .error(function (error) {
                if (typeof callback !== "undefined")
                    callback(false, error.responseText);
            });
    };

    redditapi.markMessageRead = function (id, callback) {
        $.post('/api/read_message', {
            api_type: 'json',
            id: id,
            uh: modhash
        });
    };


    /* might be needed, but should be private functions.
    redditapi.htmlEncode = function (value) {
        //create a in-memory div, set it's inner text(which jQuery automatically encodes)
        //then grab the encoded contents back out.  The div never exists on the page.
        return $('<div/>').text(value).html();
    };

    redditapi.htmlDecode = function (value) {
        return $('<div/>').html(value).text();
    };
    */

}(redditapi = window.redditapi || {}));

