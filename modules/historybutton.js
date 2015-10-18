function historybutton() {
var self = new TB.Module('History Button');

self.subreddits = {submissions: {}, comments: {}};
self.accounts = {};
self.counters = {submissions: 0, comments: 0};
self.subredditList = [];
self.domainList = [];
self.commentSubredditList = [];

self.gettingUserData = false;
self.author = null;
self.domains = [];

self.shortname = 'HButton';

// This should be a setting, methinks.
self.SPAM_REPORT_SUB = 'spam';

self.settings['enabled']['default'] = true;

self.register_setting('rtsComment', {
    'type': 'boolean',
    'default': true,
    'title': 'Post user summary when submitting spam reports'
});

/**
 * Attach an [H] button to all users
 */
self.run = function () {
    var UserButtonHTML = '<span style="color:#888888; font-size:x-small">&nbsp;<a href="javascript:;" class="user-history-button tb-bracket-button" title="view & analyze user\'s submission and comment history">H</a></span>';

    if (TBUtils.isModmail) {
        $('.thing .entry .head:not(.tb-history)').each(function () {
            var $this = $(this),
                $userattrs = $this.find('.userattrs');

            $this.addClass('tb-history');

            if ($userattrs.length > 1) {
                $userattrs.eq(0).after(UserButtonHTML);
            } else {
                $userattrs.after(UserButtonHTML);
            }

        });
    } else {
        $('.thing .entry .userattrs:not(.tb-history)').each(function () {
            var $this = $(this);
            $this.addClass('tb-history');
            $this.after(UserButtonHTML);
        });
    }
};

/**
 * Initiate the module
 */
self.init = function () {
    var $body = $('body');

    // Add context & history stuff
    $body.append('<div class="pretty-button inline-content" style="z-index:9999;display:none;position:absolute;border:0;line-height:12px;min-width:100px"/>');

    self.run();

    // NER support.
    window.addEventListener("TBNewThings", function () {
        self.run();
    });

    //Close the popup on click
    $body.on('click', 'a.context', function (e) {
        $body.on('click', '.user-history-close', function () {
            if (populateRunning.length > 0) {
                $.each(populateRunning, function () {
                    TB.ui.longLoadNonPersistent(false);
                });
            }

            $('.inline-content').hide();
        });
        $('.inline-content').show().offset($(this).offset()).text('loading...').load(this.href + '&limit=5 .sitetable.nestedlisting');
        return false;
    });

    $body.on('click', '.user-history-button', function (event) {
        self.subreddits = {submissions: {}, comments: {}};
        self.counters = {submissions: 0, comments: 0};
        self.accounts = {};
        self.subredditList = [];
        self.domainList = [];
        self.commentSubredditList = [];

        self.author = TBUtils.getThingInfo($(this).closest('.entry')).user;
        self.gettingUserData = true;
        self.domains = [];
        self.domainslist = [];

        var popupContent = '<div>\
            <a href="/user/' + self.author + '" target="_blank">' + self.author + '</a>\
            <span class="karma" />\
            <a class="comment-report tb-general-button" href="javascript:;">comment history</a> \
            <a class="account-report tb-general-button" href="javascript:;">website account history</a> \
            <a class="markdown-report tb-general-button" href="javascript:;">view report in markdown</a> \
            <a class="rts-report tb-general-button" href="javascript:;" data-commentbody="">report spammer</a><br />\
            <span class="redditorTime"></span>\
            <br /><b>Submission history:</b> <label class="submission-count"></label></div>\
            <div class="table domain-table">\
                <table>\
                    <thead>\
                        <tr>\
                            <th class="url-td">domain submitted from</th>\
                            <th class="url-count">count</th><th class="url-percentage">%</th>\
                        </tr>\
                    </thead>\
                    <tbody>\
                        <tr><td colspan="6" class="error">loading...</td></tr>\
                    </tbody>\
                </table>\
            </div>\
            <div class="table subreddit-table">\
                <table>\
                    <thead>\
                        <tr>\
                            <th class="url-td">subreddit submitted to</th>\
                            <th class="url-count">count</th>\
                            <th class="url-percentage">%</th>\
                        </tr>\
                    </thead>\
                    <tbody>\
                        <tr>\
                            <td colspan="6" class="error">loading...</td>\
                        </tr>\
                    </tbody>\
                </table>\
            </div>\
            <div class="table comment-table" style="display: none">\
                <table>\
                    <thead>\
                        <tr>\
                            <th class="url-td">subreddit commented in</th>\
                            <th class="url-count">count</th>\
                            <th class="url-percentage">%</th>\
                        </tr>\
                    </thead>\
                    <tbody>\
                        <tr><td colspan="6" class="error">loading...</td></tr>\
                    </tbody>\
                </table>\
            </div>\
            <div class="table account-table" style="display: none">\
                <table>\
                    <thead>\
                        <tr>\
                            <th class="url-td">account submitted from</th>\
                            <th class="url-count">count</th>\
                            <th class="url-percentage">%</th>\
                        </tr>\
                    </thead>\
                    <tbody>\
                        <tr><td colspan="6" class="error">loading...</td></tr>\
                    </tbody>\
                </table>\
            </div>'
            ;

        var $popup = TB.ui.popup(
            'History Button',
            [
                {
                    title: 'Tab1',
                    tooltip: 'Tooltip shown when hovering tab.',
                    content: popupContent,
                    footer: ''
                }
            ],
            '',
            'history-button-popup',
	        {
		        draggable: true
	        }
        ).appendTo('body')
            .css({
                left: event.pageX - 50,
                top: event.pageY - 10,
                display: 'block'
            });

        $popup.on('click', '.close', function () {
            self.subreddits = {submissions: {}, comments: {}};
            self.counters = {submissions: 0, comments: 0};
            self.subredditList = [];
            self.domainList = [];
            self.commentSubredditList = [];

            self.gettingUserData = false;
            self.domains = [];
            self.domainslist = [];

            $popup.remove();

            TB.ui.longLoadNonPersistent(false);
        });

        self.gettingUserData = true;
        self.showAuthorInformation();
        self.populateSubmissionHistory();

        var $histButtonPopup = $('.history-button-popup');

        $histButtonPopup.on('click', '.markdown-report', self.showMarkdownReport);
        $histButtonPopup.on('click', '.rts-report', self.reportAuthorToSpam);
        $histButtonPopup.on('click', '.comment-report', self.populateCommentHistory);
        $histButtonPopup.on('click', '.account-report', self.populateAccountHistory);
    });
};

/**
 * Show author information (Karma, How long they've been a redditor for)
 */
self.showAuthorInformation = function () {
    var $contentBox = $('.history-button-popup');

    $.get('/user/' + self.author + '/about.json').success(function (d) {
        var joinedDate = new Date(d.data.created_utc * 1000),
            redditorTime = TBUtils.niceDateDiff(joinedDate);

        $contentBox.find('.karma').text('(' + d.data.link_karma + ' | ' + d.data.comment_karma + ')');
        $contentBox.find('.redditorTime').text('redditor for ' + redditorTime);
    });
};

/**
 * Show the markdown report
 */
self.showMarkdownReport = function () {
    var $body = $('body'),
        $contentBox = $('.history-button-popup'),
        markdownReport = $contentBox.find('.rts-report').attr('data-commentbody');

    if ($body.find('.submission-markdown').length > 0) {
        $body.find('.submission-markdown').toggle();
    } else {
        $contentBox.find('.table.domain-table').before('<div class="submission-markdown"><textarea id="submission-markdown-text">' + markdownReport + '</textarea></div>');
    }
};

/**
 * Populate the submission history for a user
 *
 * @param after A token given by reddit for paginated results, allowing us to get the next page of results
 */
self.populateSubmissionHistory = function (after) {
    var $contentBox = $('.history-button-popup');
    var $submissionCount = $('.history-button-popup .submission-count');
    var $domainTable = $contentBox.find('.domain-table tbody');
    var $subredditTable = $contentBox.find('.subreddit-table tbody');

    if (typeof after === 'undefined') {
        TB.ui.longLoadNonPersistent(true);
//			populateRunning.push('load');
    }

    $.get('/user/' + self.author + '/submitted.json?limit=100&after=' + (after || '')).error(function () {
        self.log('Shadowbanned?');
        $contentBox.find('.subreddit-table .error, .domain-table .error').html('unable to load userdata</br>shadowbanned?');
        TB.ui.longLoadNonPersistent(false);
//			populateRunning.pop();
    }).done(function (d) {

        //This is another exit point of the script. Hits this code after loading 1000 submissions for a user
        if ($.isEmptyObject(d.data.children)) {

            if (self.counters.submissions > 0) {
                $submissionCount.html(self.counters.submissions + "+");
            }
            else {
                $submissionCount.html(self.counters.submissions);
            }

            TB.ui.longLoadNonPersistent(false);
            $contentBox.find('.rts-report').show();

            // If .error is present it means there are no results. So we show that.
            if ($contentBox.find('.subreddit-table .error, .domain-table .error').length > 0) {
                $contentBox.find('.subreddit-table .error, .domain-table .error').html('no submissions');
            }
            // If it is not present we have results and we can show the links for reporting and markdown reports.
            else {
                $contentBox.find('.markdown-report').show();
            }
            self.gettingUserData = false;
        }

        if (!self.gettingUserData) return;

        var after = d.data.after,
            commentBody = 'Recent Submission history for ' + self.author + ':\n\ndomain submitted from|count|%\n:-|-:|-:';

        //For every submission, incremenet the count for the subreddit and domain by one.
        $.each(d.data.children, function (index, value) {
            var data = value.data;

            if (!self.domains[data.domain]) {
                self.domains[data.domain] = {
                    count: 0
                };
                self.domainList.push(data.domain);
            }

            self.domains[data.domain].count++;

            if (!self.subreddits.submissions[data.subreddit]) {
                self.subreddits.submissions[data.subreddit] = {
                    count: 0
                };
                self.subredditList.push(data.subreddit);
            }
            self.subreddits.submissions[data.subreddit].count++;
            self.counters.submissions++;
        });

        //Sort the domains by submission count
        self.domainList.sort(function (a, b) {
            return self.domains[b].count - self.domains[a].count;
        });

        //Empty the domain table
        $domainTable.empty();

        //Get the total account od domain submissions
        var totalDomainCount = 0;
        for (var domain in self.domains) {
            totalDomainCount = totalDomainCount + self.domains[domain].count;
        }

        //Are there more domains than are shown?
        var moreDomains = 0;

        //Append all domains to the table and to the report comment
        $.each(self.domainList, function (index, value) {
            var domain = value,
                domainCount = self.domains[domain].count,
                url = '/search?q=%28and+site%3A%27' + domain + '%27+author%3A%27' + self.author + '%27+is_self%3A0+%29&restrict_sr=off&sort=new&feature=legacy_search',
                match = domain.match(/^self.(\w+)$/),
                percentage = Math.round(domainCount / totalDomainCount * 100),
                bgcolor = '#fff';

            if (percentage >= 10  && domainCount > 4){
                bgcolor = (percentage >= 20) ? TB.ui.standardColors.softred : TB.ui.standardColors.softyellow;
            }

            //If the domain is a self post, change the URL
            if (match) url = '/r/' + match[1] + '/search?q=%28and+author%3A%27' + self.author + '%27+is_self%3A1+%29&restrict_sr=on&sort=new&feature=legacy_search';

            //Append domain to the table
            $domainTable.append('<tr style="background-color: '+ bgcolor +'"><td class="url-td"><a target="_blank" href="' + url + '" title="view links ' + self.author + ' recently submitted from \'' + domain + '\'">' + domain + '</a></td><td class="count-td">' + domainCount + '</td><td class="percentage-td">' + percentage + '%</td></tr>');

            //Append the first 20 domains to the report comment
            if (index < 20) commentBody += '\n[' + domain + '](' + url + ')|' + domainCount + '|' + percentage + '%';
            moreDomains = index;
        });

        //If there were 20 or more domains, append to the report comment that we only displayed 20
        if (moreDomains >= 20) commentBody += '\n\n_^...and ^' + (self.domainList.length - 20) + ' ^more_';

        commentBody += '\n\nsubreddit submitted to|count|%\n:-|-:|-:';

        //Sort subreddit list by count
        self.subredditList.sort(function (a, b) {
            return self.subreddits.submissions[b].count - self.subreddits.submissions[a].count;
        });

        //Empty the subreddit table
        $subredditTable.empty();

        //Get the total count of subreddit submissions
        var totalSubredditCount = 0;
        for (var subreddit in self.subreddits.submissions) {
            totalSubredditCount += self.subreddits.submissions[subreddit].count;
        }

        var moreSubreddits = 0;
        //Append a list of subreddits submitted to the subreddit table and to the comment body for reports
        $.each(self.subredditList, function (index, value) {
            var subreddit = value,
                subredditCount = self.subreddits.submissions[subreddit].count,
                url = '/r/' + subreddit + '/search?q=author%3A%27' + self.author + '%27&restrict_sr=on&sort=new&feature=legacy_search';

            var percentage = Math.round(subredditCount / totalSubredditCount * 100);
            $subredditTable.append('<tr><td class="url-td"><a target="_blank" href="' + url + '" title="view links ' + self.author + ' recently submitted to /r/' + subreddit + '/">' + subreddit + '</a></td><td class="count-td">' + subredditCount + '</td><td class="percentage-td">' + percentage + '%</td></tr>');

            if (index < 20) commentBody += '\n[' + subreddit + '](' + url + ')|' + subredditCount + '|' + percentage + '%';
            moreSubreddits = index;
        });

        //If there were more than 20 subreddits, we only put the first 20 in the report, and say that there are more
        if (moreSubreddits >= 20) commentBody += '\n\n_^...and ^' + (self.subredditList.length - 20) + ' ^more_';

        $('.rts-report').attr('data-commentbody', commentBody);

        //There's still more subsmissions to load, so we're going to run again
        if (after) {
            $submissionCount.html("Loading... (" + self.counters.submissions + ")");
            self.populateSubmissionHistory(after);
        }
        //All of the submissions have been loaded at this point
        else {
            $submissionCount.html(self.counters.submissions);

            TB.ui.longLoadNonPersistent(false);
            $contentBox.find('.rts-report').show();
            if ($contentBox.find('.subreddit-table .error, .domain-table .error').length > 0) {  // This check is likely not need, but better safe than sorry.
                $contentBox.find('.subreddit-table .error, .domain-table .error').html('no submissions');
            } else {
                $contentBox.find('.markdown-report').show();
            }
            self.gettingUserdata = false;
        }
    });
};

/**
 * Populate the submission account history for a user
 */
self.populateAccountHistory = function () {

    var TYPE = {
        PATH: 1,		// e.g. example.org/path/user
        SUBDOMAIN: 2	// e.g. user.example.org
    };

    var domainSpecs = {
        // keys are the supported sites, and determine if we have a match
        'flickr.com': {
            path: 'photos/',
            provider: 'flickr',
            type: TYPE.PATH
        },
        'medium.com': {
            path: '@',
            provider: 'Medium',
            type: TYPE.PATH
        },
        'speakerdeck.com': {
            provider: 'Speaker Deck',
            type: TYPE.PATH
        },
        'blogspot.com': {
            provider: 'Blogspot',
            type: TYPE.SUBDOMAIN
        },
        'tumblr.com': {
            provider: 'Tumblr',
            type: TYPE.SUBDOMAIN
        },
        'deviantart.com': {
            provider: 'deviantart',
            type: TYPE.SUBDOMAIN
        },
        'artstation.com': {
            path: 'artwork/',
            provider: 'artstation',
            type: TYPE.PATH
        }
    };

    var $contentBox = $('.history-button-popup'),
        $accountTable = $contentBox.find('.account-table tbody');

    $contentBox.width(1000);
    $accountTable.empty();

    $contentBox.find('.account-table').show();
    $accountTable.append('<tr><td colspan="6" class="error">Loading... (0 submissions)</td></tr>');

    grabListing('/user/' + self.author + '/submitted.json?limit=100', updateSubmissions)
        .then(function(listing) {
            if (listing === null) {
                $accountTable.find('.error').html('unable to load userdata<br />shadowbanned?');

                return false;
            }

            $.each(listing, function (index, value) {
                var data = value.data;

                if (data.media && data.media.oembed && data.media.oembed.author_url) {
                    var oembed = data.media.oembed;

                    addAccount({
                        name: oembed.author_name,
                        provider: oembed.provider_name,
                        provider_url: oembed.provider_url,
                        url: oembed.author_url
                    });
                } else {
                    var spec = domainSpecs[data.domain],
                        details, domain;

                    if (!spec) {
                        // "sub.dom.ain.domain.com" -> "domain.com" (NOTE: does not support "domain.co.uk")
                        domain = data.domain.split('.').slice(-2).join('.');
                        spec = domainSpecs[domain];
                    }

                    if (spec) {
                        spec.domain = domain || data.domain;
                        details = getDomainDetails(spec, data.url);
                        if (details) {
                            addAccount(details);
                        }
                    }
                }
            });

            tableify();
        });

    function updateSubmissions(amount) {
        $accountTable.find('.error').text('Loading... (' + amount + ' submissions)');
    }

    function tableify() {
        //Get the total account of account submissions
        var totalAccountCount = 0,
            accountList = [];

        for (var account in self.accounts) {
            totalAccountCount = totalAccountCount + self.accounts[account].count;

            accountList.push(account);
        }

        //Sort the domains by submission count
        accountList.sort(function (a, b) {
            return self.accounts[b].count - self.accounts[a].count;
        });

        $accountTable.empty();

        $.each(accountList, function(index, account) {
            account = self.accounts[account];

            var percentage = Math.round(account.count / totalAccountCount * 100),
                bgcolor = 'fff';

            if (percentage >= 10 && account.count > 4){
                bgcolor = (percentage >= 20) ? TB.ui.standardColors.softred : TB.ui.standardColors.softyellow;
            }

            $accountTable.append(
                '<tr style="background-color: '+ bgcolor +'">\
                    <td class="url-td">\
                        <a href="' + account.url + '" target="_blank">' +
                            account.name +
                        '</a> - \
                        <a href="' + account.provider_url + '" target="_blank">' +
                            account.provider +
                        '</a>\
                    </td>\
                    <td class="count-td">' +
                        account.count +
                    '</td>\
                    <td class="percentage-td">' +
                        percentage +'%\
                    </td>\
                </tr>'
            );
        });
    }

    /**
     * Take an object and add it to `self.accounts`.
     *
     * @param details {Object}
     */
    function addAccount(details) {
        if (!self.accounts[details.url]) {
            self.accounts[details.url] = details;
            self.accounts[details.url].count = 0;
        }
        self.accounts[details.url].count++;
    }

    /**
     * Generate a `details` object that mimics the oembed object to be passed to `addAccount()`.
     *
     * @param spec {Object} from domainSpecs
     * @param url {String}
     * @returns {Object|undefined}
     */
    function getDomainDetails(spec, url) {
        // cache the dynamic rx's
        if (!spec.rx) {
            if (spec.type === TYPE.PATH) {
                spec.rx = new RegExp(spec.domain + '/' + (spec.path || '') + '([\\w-@]+)');
            } else if (spec.type === TYPE.SUBDOMAIN) {
                spec.rx = /:\/\/([\w-]+)/;
            }
        }

        var match = url.match(spec.rx),
            author = match && match[1],
            scheme, author_url, provider_url;

        if (author) {
            scheme = url.split('://')[0] + '://';
            provider_url = scheme + spec.domain + '/';

            if (spec.type === TYPE.PATH) {
                author_url = provider_url + (spec.path || '') + author;
            } else if (spec.type === TYPE.SUBDOMAIN) {
                author_url = scheme + author + '.' + spec.domain;
            }

            return {
                name: author,
                provider: spec.provider,
                provider_url: provider_url,
                url: author_url
            };
        }
    }
};

self.populateCommentHistory = function (after) {
    // fuck it; it's their ratelimit.
    //if (self.gettingUserData) return;

    var $contentBox = $('.history-button-popup'),
        $commentTable = $contentBox.find('.comment-table tbody');

    $contentBox.width(1000);
    $commentTable.empty();

    $contentBox.find('.comment-table').show();
    $commentTable.append('<tr><td colspan="6" class="error">Loading... (' + self.counters.comments + ')</td></tr>');

    $.get('/user/' + self.author + '/comments.json?limit=100&after=' + (after || '')).error(function () {
        $commentTable.find('.error').html('unable to load userdata <br /> shadowbanned?');
    }).done(function (d) {


        $.each(d.data.children, function (index, value) {
            var data = value.data;
            if (!self.subreddits.comments[data.subreddit]) {
                self.subreddits.comments[data.subreddit] = {count: 0};
                self.commentSubredditList.push(data.subreddit);
            }

            self.subreddits.comments[data.subreddit].count++;
            self.counters.comments++;
        });

        var after = d.data.after;
        if (after) {
            self.populateCommentHistory(after);
        }

        if ($.isEmptyObject(d.data.children) || !after) {
            self.commentSubredditList.sort(function (a, b) {
                return self.subreddits.comments[b].count - self.subreddits.comments[a].count;
            });

            $commentTable.empty();

            $.each(self.commentSubredditList, function (index, value) {
                var count = self.subreddits.comments[value].count;
                var percentage = Math.round(count / self.counters.comments * 100);
                $commentTable.append('<tr>' +
                    '<td>' + value + '</td><td>' + count + '</td><td>' + percentage + '</td></tr>');
            });
        }
    });
};

/**
 * Report the use to /r/spam
 */
self.reportAuthorToSpam = function () {
    var rtsComment = self.setting('rtsComment'),
        $contentBox = $('.history-button-popup'),
        $rtsLink = $contentBox.find('.rts-report'),
        rtsNativeLink = $rtsLink.get(0),
        commentBody = rtsNativeLink.getAttribute('data-commentbody');

    rtsNativeLink.textContent = 'Submitting...';
    rtsNativeLink.className = '.rts-report-clicked';

    //Submit to RTS
    var link = 'https://www.reddit.com/user/' + self.author,
        title = 'Overview for ' + self.author;

    TBUtils.postLink(link, title, self.SPAM_REPORT_SUB, function (successful, submission) {
        if (!successful) {
            $rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">an error occurred: ' + submission[0][1] + '</span>');
            //$rtsLink.hide();
        } else {
            if (submission.json.errors.length) {
                $rtsLink.after('<span class="error" style="font-size:x-small">' + submission.json.errors[0][1] + '</error>');
                //$rtsLink.hide();
                if (submission.json.errors[0][0] == 'ALREADY_SUB') {
                    rtsNativeLink.href = '/r/' + self.SPAM_REPORT_SUB + '/search?q=http%3A%2F%2Fwww.reddit.com%2Fuser%2F' + self.author + '&restrict_sr=on&feature=legacy_search';
                }
                return;
            }

            // Post stats as a comment.
            if (!commentBody.length || !rtsComment) {
                rtsNativeLink.textContent = 'reported';
                rtsNativeLink.href = submission.json.data.url;
                rtsNativeLink.className = 'tb-general-button';
                return;
            }


            TBUtils.postComment(submission.json.data.name, commentBody, function (successful, comment) {
                if (!successful) {
                    $rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">an error occurred. ' + comment[0][1] + '</span>');
                    //$rtsLink.hide();
                } else {
                    if (comment.json.errors.length) {
                        $rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">' + comment.json.errors[1] + '</error>');
                        //$rtsLink.hide();
                        return
                    }
                    rtsNativeLink.textContent = 'reported';
                    rtsNativeLink.href = submission.json.data.url;
                    rtsNativeLink.className = 'tb-general-button';
                }
            });
        }
    });
};


/**
 * Automatically get all entries of a listing.
 * Returns a Promise
 *
 * {string} a url pointing to a reddit listing
 * {function} a function that will be called whenever the length of the listing array grows
 */
function grabListing(url, update) {
    return new Promise(function (resolve) {
        var listing = [];

        if (update) {
            update(listing.length);
        }

        function listingRequest(after) {
            if (typeof after === 'string') {
                var reqUrl = url + (url.indexOf('?') !== -1 ? '&after=' : '?after=') + after;
            } else {
                var reqUrl = url;
            }

            rateLimit().then(function() {
                $.get(reqUrl)
                    .error(function() {
                        resolve(null);
                    })
                    .done(function(response) {
                        if (response.data.children && response.data.children.length) {
                            listing = listing.concat(response.data.children);
                        }

                        if (update) {
                            update(listing.length);
                        }

                        if (response.data.after) {
                            listingRequest(response.data.after);
                        } else {
                            resolve(listing);
                        }
                    });
            });
        }

        listingRequest();
    });
}

var lastRequest = 0;

/**
 * Very basic ratelimiter
 * Will apply all passed arguments to the resolve function, in case it's used in a promise chain
 */
function rateLimit() {
    return new Promise(function (resolve) {
        var curTime = Date.now(),
            args = arguments;

        if (curTime - lastRequest > 2000) {
            resolve.apply(null, args);

            lastRequest = curTime;
        } else {
            setTimeout(function(){
                resolve.apply(null, args);

                lastRequest = Date.now();
            }, curTime - lastRequest);
        }
    });
}

TB.register_module(self);
}

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        historybutton();
    });
})();
