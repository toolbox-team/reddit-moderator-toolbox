function historybutton() {
var self = new TB.Module('History Button');

self.shortname = 'HButton';

// This should be a setting, methinks.
self.SPAM_REPORT_SUB = 'spam';

self.settings['enabled']['default'] = true;

self.fetched = {};//fetched histories

self.register_setting('rtsComment', {
    'type': 'boolean',
    'default': true,
    'title': 'Post user summary when submitting spam reports'
});

self.register_setting('alwaysComments', {
    'type': 'boolean',
    'default': false,
    'advanced': true,
    'title': 'Load comment history immediately'
});

/**
 * Attach an [H] button to all users
 */
self.run = function () {
    var UserButtonHTML = '<span style="color:#888888; font-size:x-small">&nbsp;<a href="javascript:;" class="user-history-button tb-bracket-button" title="view & analyze user\'s submission and comment history">H</a></span>';

    if (TBUtils.isModmail) {
        $('.entry .userattrs').not('.tb-history').each(function () {
            $(this).addClass('tb-history')
                .find('.userattrs')
                .after(UserButtonHTML);
        });
    } else {
        $('.entry .userattrs').not('.tb-history').each(function () {
            $(this).addClass('tb-history')
                .after(UserButtonHTML);
        });
    }
};

/**
 * Initiate the module
 */
self.init = function () {

    self.run();

    // NER support.
    window.addEventListener("TBNewThings", function () {
        self.run();
    });

    $('body').on('click', '.user-history-button', function (event) {
        var author = TBUtils.getThingInfo($(this).closest('.entry')).user;

        //If we've already got this before, just move it to the mouse
        if(typeof self.fetched[author] != 'undefined'){
            self.fetched[author].popup.css({
                left: event.pageX - 50,
                top: event.pageY - 10,
                display: 'block'
            });
            return;
        }

        var subreddits = {submissions: {}, comments: {}},
            counters = {submissions: 0, comments: 0},
            accounts = {},
            subredditList = [],
            domainList = [],
            commentSubredditList = [],

            gettingUserData = true,
            domains = [],
            domainslist = [],

            popupContent = 
            `<div>
                <a href="/user/${author}" target="_blank">${author}</a>
                <span class="karma" />
                <a class="comment-report tb-general-button" href="javascript:;">comment history</a> 
                <a class="account-report tb-general-button" href="javascript:;">website account history</a> 
                <a class="markdown-report tb-general-button" href="javascript:;">view report in markdown</a> 
                <a class="rts-report tb-general-button" href="javascript:;" data-commentbody="">report spammer</a>
                <br/>
                <span class="redditorTime"></span>
                <br/>
                <b>Submission history:</b> <label class="submission-count"></label></div>
                <div class="table domain-table">
                    <table>
                        <thead>
                            <tr>
                                <th class="url-td">domain submitted from</th>
                                <th class="url-count">count</th><th class="url-percentage">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6" class="error">loading...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="table subreddit-table">
                    <table>
                        <thead>
                            <tr>
                                <th class="url-td">subreddit submitted to</th>
                                <th class="url-count">count</th>
                                <th class="url-percentage">%</th>
                                <th class="url-karma">karma</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="6" class="error">loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="table comment-table" style="display: none">
                    <table>
                        <thead>
                            <tr>
                                <th class="url-td">subreddit commented in</th>
                                <th class="url-count">count</th>
                                <th class="url-percentage">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6" class="error">loading...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="table account-table" style="display: none">
                    <table>
                        <thead>
                            <tr>
                                <th class="url-td">account submitted from</th>
                                <th class="url-count">count</th>
                                <th class="url-percentage">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6" class="error">loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>`;

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

        self.fetched[author] = {
            popup: $popup,
            subreddits : subreddits,
            counters : counters,
            accounts : accounts,
            subredditList : subredditList,
            domainList : domainList,
            commentSubredditList: commentSubredditList,
            author : author,
            gettingUserData : gettingUserData,
            domains : domains,
            domainslist : domainslist,
        }

        var $comments = $popup.find('.comment-table'),
            $accounts = $popup.find('.account-table');

        $popup.on('click', '.close', function () {
            $popup.hide();
        });

        self.showAuthorInformation(author);
        self.populateSubmissionHistory('', author);

        $popup.on('click', '.markdown-report', self.showMarkdownReport.bind(self, author));
        $popup.on('click', '.rts-report', self.reportAuthorToSpam.bind(self, author));
        $popup.on('click.comment-report', '.comment-report', function(){
            $popup.off('click.comment-report');
            self.populateCommentHistory('', author);
        });
        $popup.on('click.account-report', '.account-report', function(){
            $accounts.toggle();
        });

        if(self.setting('alwaysComments'))
            $popup.find('.comment-report').click();
    });
    
};

/**
 * Show author information (Karma, How long they've been a redditor for)
 */
self.showAuthorInformation = function (author) {
    var $contentBox = self.fetched[author].popup;

    $.get(`/user/${author}/about.json`).success(function (d) {
        var joinedDate = new Date(d.data.created_utc * 1000),
            redditorTime = TBUtils.niceDateDiff(joinedDate);

        $contentBox.find('.karma').text(`(${d.data.link_karma} | ${d.data.comment_karma})`);
        $contentBox.find('.redditorTime').text(`redditor for ${redditorTime}`);
    });
};

/**
 * Show the markdown report
 */
self.showMarkdownReport = function (author) {
    var $contentBox = self.fetched[author].popup,
        markdownReport = $contentBox.find('.rts-report').attr('data-commentbody'),
        $markdown = $contentBox.find('.submission-markdown');

    if ($markdown.length > 0) {
        $markdown.toggle();
    } else {
        $contentBox.find('.table.domain-table').before(
            `<div class="submission-markdown">
                <textarea id="submission-markdown-text">${markdownReport}</textarea>
            </div>`);
    }
};

/**
 * Populate the submission history for a user
 *
 * @param after A token given by reddit for paginated results, allowing us to get the next page of results
 */
self.populateSubmissionHistory = function (after, author) {

    var user = self.fetched[author],
        $contentBox = user.popup,
        $submissionCount = $contentBox.find('.submission-count'),
        $domainTable = $contentBox.find('.domain-table tbody'),
        $subredditTable = $contentBox.find('.subreddit-table tbody'),
        $error = $contentBox.find('.subreddit-table .error, .domain-table .error, .account-table-table .error'),
        $accountTable = $contentBox.find('.account-table tbody'),
        TYPE = {
            PATH: 1,        // e.g. example.org/path/user
            SUBDOMAIN: 2    // e.g. user.example.org
        },
        domainSpecs = {
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

    TB.ui.longLoadNonPersistent(true);

    $.get(`/user/${author}/submitted.json?limit=100&after=${after}`).error(function () {
        self.log('Shadowbanned?');
        $error.html('unable to load userdata</br>shadowbanned?');
        TB.ui.longLoadNonPersistent(false);
    }).done(function (d) {
        //This is another exit point of the script. Hits this code after loading 1000 submissions for a user
        if ($.isEmptyObject(d.data.children)) {

            if (user.counters.submissions > 0) {
                $submissionCount.html(user.counters.submissions + "+");
            }
            else {
                $submissionCount.html(user.counters.submissions);
            }

            //If the error elements can be seen it is because there are no submissions
            $error.html('no submissions');

            user.gettingUserData = false;

            TB.ui.longLoadNonPersistent(false);
            return;
        }

        var after = d.data.after,
            commentBody = `Recent Submission history for ${author}:\n\ndomain submitted from|count|%\n:-|-:|-:`;

        user.counters.submissions += d.data.children.length;
        //There's still more subsmissions to load, so we're going to run again
        if (after) {
            $submissionCount.html(`Loading... (${user.counters.submissions})`);
            self.populateSubmissionHistory(after, author);
        }
        //All of the submissions have been loaded at this point
        else {
            user.gettingUserData = false;
            $submissionCount.html(user.counters.submissions);
        }

        TB.ui.longLoadNonPersistent(false);
        //For every submission, incremenet the count for the subreddit and domain by one.
        $.each(d.data.children, function (index, value) {
            var data = value.data;

            if (!user.domains[data.domain]) {
                user.domains[data.domain] = {
                    count: 0
                };
                user.domainList.push(data.domain);
            }
            user.domains[data.domain].count++;


            if (!user.subreddits.submissions[data.subreddit]) {
                user.subreddits.submissions[data.subreddit] = {
                    count: 0,
                    karma: 0
                };
                user.subredditList.push(data.subreddit);
            }
            user.subreddits.submissions[data.subreddit].count++;
            user.subreddits.submissions[data.subreddit].karma += data.score;

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

        //Sort the domains by submission count
        user.domainList.sort(function (a, b) {
            return user.domains[b].count - user.domains[a].count;
        });

        //Empty the domain table
        $domainTable.empty();

        //Get the total account od domain submissions
        var totalDomainCount = 0,
            totalDomainKarma = 0;
        for (var domain in user.domains) {
            totalDomainCount += user.domains[domain].count;
            totalDomainKarma += user.domains[domain].karma;
        }

        //Are there more domains than are shown?
        var moreDomains = 0;

        //Append all domains to the table and to the report comment
        $.each(user.domainList, function (index, value) {
            var domain = value,
                domainCount = user.domains[domain].count,
                url = `/search?q=%28and+site%3A%27${domain}%27+author%3A%27${author}%27+is_self%3A0+%29&restrict_sr=off&sort=new&feature=legacy_search`,
                match = domain.match(/^self.(\w+)$/),
                percentage = Math.round(domainCount / totalDomainCount * 100),
                bgcolor = '#fff';

            if (percentage >= 10  && domainCount > 4){
                bgcolor = (percentage >= 20) ? TB.ui.standardColors.softred : TB.ui.standardColors.softyellow;
            }

            //If the domain is a self post, change the URL
            if (match) url = `/r/${match[1]}/search?q=%28and+author%3A%27${author}%27+is_self%3A1+%29&restrict_sr=on&sort=new&feature=legacy_search`;

            //Append domain to the table
            $domainTable.append(
                `<tr style="background-color:${bgcolor}">
                    <td class="url-td"><a target="_blank" href="${url}" title="view links ${author} recently submitted from '${domain}'">${domain}</a></td>
                    <td class="count-td">${domainCount}</td>
                    <td class="percentage-td">${percentage}%</td>
                </tr>`);

            //Append the first 20 domains to the report comment
            if (index < 20) commentBody += `\n[${domain}](${url})|${domainCount}|${percentage}%`;
            moreDomains = index;
        });

        //If there were 20 or more domains, append to the report comment that we only displayed 20
        if (moreDomains >= 20) commentBody += `\n\n_^...and ^${user.domainList.length - 20} ^more_`;

        commentBody += '\n\nsubreddit submitted to|count|%\n:-|-:|-:';

        //Sort subreddit list by count
        user.subredditList.sort(function (a, b) {
            return user.subreddits.submissions[b].count - user.subreddits.submissions[a].count;
        });

        //Empty the subreddit table
        $subredditTable.empty();

        //Get the total count of subreddit submissions
        var totalSubredditCount = 0;
        for (var subreddit in user.subreddits.submissions) {
            totalSubredditCount += user.subreddits.submissions[subreddit].count;
        }

        var moreSubreddits = 0;
        //Append a list of subreddits submitted to the subreddit table and to the comment body for reports
        $.each(user.subredditList, function (index, value) {
            var subreddit = value,
                subredditCount = user.subreddits.submissions[subreddit].count,
                subredditKarma = user.subreddits.submissions[subreddit].karma,
                url = `/r/${subreddit}/search?q=author%3A%27${author}%27&restrict_sr=on&sort=new&feature=legacy_search`
                percentage = Math.round(subredditCount / totalSubredditCount * 100);

            $subredditTable.append(
                `<tr>
                    <td class="url-td"><a target="_blank" href="${url}" title="view links ${author} recently submitted to /r/${subreddit}/">${subreddit}</a></td>
                    <td class="count-td">${subredditCount}</td>
                    <td class="percentage-td">${percentage}%</td>
                    <td class="karma-td">${subredditKarma}</td>
                </tr>`);

            if (index < 20) commentBody += `\n[${subreddit}](${url})|${subredditCount}|${percentage}%`;
            moreSubreddits = index;
        });

        //If there were more than 20 subreddits, we only put the first 20 in the report, and say that there are more
        if (moreDomains >= 20) commentBody += `\n\n_^...and ^${user.subredditList.length - 20} ^more_`;

        $('.rts-report').attr('data-commentbody', commentBody);

        tableify();
    });//END DONE

    function tableify() {
        //Get the total account of account submissions
        $accountTable.empty();

        var totalAccountCount = 0,
            accountList = [];

        for (var account in user.accounts) {
            totalAccountCount += user.accounts[account].count;
            accountList.push(account);
        }

        //Sort the domains by submission count
        accountList.sort(function (a, b) {
            return user.accounts[b].count - user.accounts[a].count;
        });


        $.each(accountList, function(index, account) {
            account = user.accounts[account];

            var percentage = Math.round(account.count / totalAccountCount * 100),
                bgcolor = 'fff';

            if (percentage >= 10 && account.count > 4){
                bgcolor = (percentage >= 20) ? TB.ui.standardColors.softred : TB.ui.standardColors.softyellow;
            }

            $accountTable.append(
                `<tr style="background-color:${bgcolor}">
                    <td class="url-td">
                        <a href="${account.url}" target="_blank">${account.name}</a> - <a href="${account.provider_url}" target="_blank">${account.provider}</a>
                    </td>
                    <td class="count-td">${account.count}</td>
                    <td class="percentage-td">${percentage}%</td>
                </tr>`);
        });
    }
    /**
     * Take an object and add it to `self.accounts`.
     *
     * @param details {Object}
     */
    function addAccount(details) {
        details.url = details.url.replace('https://', 'http://');
        if (!user.accounts[details.url]) {
            user.accounts[details.url] = details;
            user.accounts[details.url].count = 0;
        }
        user.accounts[details.url].count++;
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


self.populateCommentHistory = function (after, author) {
    TB.ui.longLoadNonPersistent(true);

    var user = self.fetched[author],
        $contentBox = user.popup,
        $commentTable = $contentBox.find('.comment-table tbody');

    $contentBox.width(1000);
    $commentTable.empty();

    $contentBox.find('.comment-table').show();
    $commentTable.append(`<tr><td colspan="6" class="error">Loading... (${user.counters.comments})</td></tr>`);

    $.get(`/user/${author}/comments.json?limit=100&after=${after}`).error(function () {
        $commentTable.find('.error').html('unable to load userdata <br /> shadowbanned?');
        TB.ui.longLoadNonPersistent(false);
    }).done(function (d) {
        $.each(d.data.children, function (index, value) {
            var data = value.data;
            if (!user.subreddits.comments[data.subreddit]) {
                user.subreddits.comments[data.subreddit] = {count: 0};
                user.commentSubredditList.push(data.subreddit);
            }

            user.subreddits.comments[data.subreddit].count++;
            user.counters.comments++;
        });

        var after = d.data.after;
        if (after) {
            self.populateCommentHistory(after, author);
        }
        TB.ui.longLoadNonPersistent(false);

        if ($.isEmptyObject(d.data.children) || !after) {
            user.commentSubredditList.sort(function (a, b) {
                return user.subreddits.comments[b].count - user.subreddits.comments[a].count;
            });

            $commentTable.empty();

            TB.ui.longLoadNonPersistent(false);
            $.each(user.commentSubredditList, function (index, value) {
                var count = user.subreddits.comments[value].count,
                    percentage = Math.round(count / user.counters.comments * 100);

                $commentTable.append(
                    `<tr>
                        <td>${value}</td><td>${count}</td><td>${percentage}</td>
                    </tr>`);
            });
        }
    });
};

/**
 * Report the use to /r/spam
 */
self.reportAuthorToSpam = function (author) {
    var user = self.fetched[author],
        $contentBox = user.popup,
        rtsComment = self.setting('rtsComment'),
        $rtsLink = $contentBox.find('.rts-report'),
        rtsNativeLink = $rtsLink.get(0),
        commentBody = rtsNativeLink.getAttribute('data-commentbody');

    rtsNativeLink.textContent = 'Submitting...';
    rtsNativeLink.className = '.rts-report-clicked';

    //Submit to RTS
    var link = 'https://www.reddit.com/user/' + author,
        title = 'Overview for ' + author;

    TBUtils.postLink(link, title, self.SPAM_REPORT_SUB, function (successful, submission) {
        if (!successful) {
            $rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">an error occurred: ' + submission[0][1] + '</span>');
            //$rtsLink.hide();
        } else {
            if (submission.json.errors.length) {
                $rtsLink.after('<span class="error" style="font-size:x-small">' + submission.json.errors[0][1] + '</error>');
                //$rtsLink.hide();
                if (submission.json.errors[0][0] == 'ALREADY_SUB') {
                    rtsNativeLink.href = '/r/' + self.SPAM_REPORT_SUB + '/search?q=http%3A%2F%2Fwww.reddit.com%2Fuser%2F' + author + '&restrict_sr=on&feature=legacy_search';
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

TB.register_module(self);
}

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        historybutton();
    });
})();
