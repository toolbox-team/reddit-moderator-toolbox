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
        'default': true,
        'advanced': true,
        'title': 'Load comment history immediately'
    });

    self.register_setting('commentCount', {
        'type': 'selector',
        'values': ['100','200','300','400','500','600','700','800','900','1000'],
        'default': '1000',
        'advanced': true,
        'title': 'Number of comments to retrieve per user history'
    });

    /**
 * Attach an [H] button to all users
 */
    self.run = function () {
        var UserButtonHTML = '<span class="history-button">&nbsp;<a href="javascript:;" class="user-history-button tb-bracket-button" title="view & analyze user\'s submission and comment history">H</a></span>';


        var $body = $('body');
        if ($body.find('.ThreadViewer').length > 0) {

            $body.find('.Thread__message').not('.tb-history').each(function () {
                var $this = $(this);
                if ($this.find('.tb-attr').length === 0) {
                    $this.addClass('tb-history').find('.Message__divider').eq(0).after('<span class="tb-attr"></span>');
                }
                var $tbAttrs = $this.find('.tb-attr');
                $tbAttrs.append(UserButtonHTML);
            });

            var userButtonHTMLside = '<span class="tb-attr-history InfoBar__recent"><span class="history-button"><a href="javascript:;" class="user-history-button tb-bracket-button modmail-sidebar" title="view & analyze user\'s submission and comment history">User History</a></span></span>';

            var $sidebar = $body.find('.ThreadViewer__infobar');

            $sidebar.find('.tb-recents').not('.tb-history').addClass('tb-history').append(userButtonHTMLside);



        } else {
            $('.entry').not('.tb-history').each(function () {
                $(this).addClass('tb-history').find('.userattrs').eq(0).after(UserButtonHTML);
            });
        }

    };

    /**
 * Initiate the module
 */
    self.init = function () {
        var $body = $('body');
        TBUtils.modSubCheck(function(modSubCheck){
            if(TBUtils.modCheck && modSubCheck){



                if (TBUtils.isNewModmail) {
                    setTimeout(function () {
                        self.run();
                    }, 750);
                } else {
                    self.run();
                }


                // NER support.
                window.addEventListener('TBNewThings', function () {
                    self.run();
                });

                $body.on('click', '.user-history-button', function (event) {
                    var $this = $(this);
                    var author;
                    if($body.find('.ThreadViewer').length > 0) {

                        if ($this.hasClass('modmail-sidebar')) {
                            author = $('.InfoBar__username').text();
                        } else {
                            author = $(this).closest('.Message__header').find('.Message__author').text().substring(2);
                        }

                    } else {
                        author = TBUtils.getThingInfo($(this).closest('.entry')).user;
                    }

                    var positions = TBui.drawPosition(event);
                    //If we've already got this before, just move it to the mouse
                    if(typeof self.fetched[author] != 'undefined'){
                        self.fetched[author].popup.css({
                            left: positions.leftPosition,
                            top: positions.topPosition,
                            display: 'block'
                        });
                        return;
                    }

                    var subreddits = {submissions: {}, comments: {}},
                        counters = {submissions: 0, comments: 0, commentsOP: 0},
                        accounts = {},
                        subredditList = [],
                        domainList = [],
                        commentSubredditList = [],

                        gettingUserData = true,
                        domains = [],
                        domainslist = [],

                        popupContent = `
        <div>
            <a href="${TBUtils.baseDomain}/user/${author}" target="_blank">${author}</a>
            <span class="karma" />
            <a class="comment-report tb-general-button" href="javascript:;">comment history</a>
            <a class="markdown-report tb-general-button" href="javascript:;">view report in markdown</a>
            <a class="rts-report tb-general-button" style="display: none" href="javascript:;" data-commentbody="">report spammer</a>
            <br/>
            <span class="redditorTime"></span>
            <br/>
            <p class="tb-history-disclaimer">
            <strong>Disclaimer: </strong> The information shown below is an <i>indication</i> not a complete picture, it lacks the context you would get from having a look at a person's profile.

            </p>
            <b>Available history:</b> <br>
            <label class="submission-count"></label> submissions
            <br>
            <span class="tb-history-comment-stats" style="display:none">
            <label class="comment-count"></label> comments of those <label class="comment-count-OP"></label> are in their own posts (commented as OP).
            </span>
            </div>
            <div class="history-table-wrapper">
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
            </div>
            <div class="history-table-wrapper">
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
            <div class="table account-table">
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
            </div>
        </div>
    `;

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
                            left: positions.leftPosition,
                            top: positions.topPosition,
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
                    };

                    $popup.on('click', '.close', function () {
                        $popup.hide();
                    });

                    self.showAuthorInformation(author);
                    self.populateSubmissionHistory('', author);

                    $popup.on('click', '.markdown-report', self.showMarkdownReport.bind(self, author));
                    $popup.on('click', '.rts-report', self.reportAuthorToSpam.bind(self, author));
                    $popup.on('click.comment-report', '.comment-report', function(){
                        $(this).hide();
                        $popup.off('click.comment-report');
                        self.populateCommentHistory('', author);
                    });

                    if(self.setting('alwaysComments')) {
                        $popup.find('.comment-report').click();
                    }

                });
            }
        });
    };

    /**
 * Show author information (Karma, How long they've been a redditor for)
 */
    self.showAuthorInformation = function (author) {
        var $contentBox = self.fetched[author].popup;

        $.get(`${TBUtils.baseDomain}/user/${author}/about.json`).done(function (d) {
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
            $markdown = $contentBox.find('.submission-markdown-text');

        if ($markdown.length > 0) {
            $markdown.html(markdownReport).toggle();
        } else {
            $contentBox.find('.table.domain-table').before(
                `<div class="submission-markdown">
                <textarea class="submission-markdown-text">${markdownReport}</textarea>
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
            $rtsLink = $contentBox.find('.rts-report'),
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
                },
                'twitter.com': {
                    provider: 'Twitter',
                    type: TYPE.PATH
                }
            };

        TB.ui.longLoadNonPersistent(true);

        $.get(`${TBUtils.baseDomain}/user/${author}/submitted.json?limit=100&after=${after}`).fail(function () {
            self.log('Shadowbanned?');
            $error.html('unable to load userdata</br>shadowbanned?');
            TB.ui.longLoadNonPersistent(false);
        }).done(function (d) {
        //This is another exit point of the script. Hits this code after loading 1000 submissions for a user
            if ($.isEmptyObject(d.data.children)) {

                if (user.counters.submissions > 0) {
                    $submissionCount.html(`${user.counters.submissions}+`);
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
                commentBody = `Available submission history for /u/${author}:\n\ndomain submitted from|count|%\n:-|-:|-:`;

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
            var totalDomainCount = 0;

            for (var domain in user.domains) {
                if (user.domains.hasOwnProperty(domain)) {
                    totalDomainCount += user.domains[domain].count;
                }
            }

            //Are there more domains than are shown?
            var moreDomains = 0;

            //Append all domains to the table and to the report comment
            $.each(user.domainList, function (index, value) {
                var domain = value,
                    domainCount = user.domains[domain].count,
                    url = `/search?q=%28and+site%3A%27${domain}%27+author%3A%27${author}%27+is_self%3A0+%29&restrict_sr=off&sort=new&syntax=cloudsearch&feature=legacy_search`,
                    match = domain.match(/^self.(\w+)$/),
                    percentage = Math.round(domainCount / totalDomainCount * 100),
                    bgcolor = '#fff';


                if (percentage >= 10  && domainCount > 4){
                    bgcolor = (percentage >= 20) ? TB.ui.standardColors.softred : TB.ui.standardColors.softyellow;
                }

                //If the domain is a self post, change the URL
                if (match) url = `/r/${match[1]}/search?q=%28and+author%3A%27${author}%27+is_self%3A1+%29&restrict_sr=on&sort=new&syntax=cloudsearch&feature=legacy_search`;

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


            //Append a list of subreddits submitted to the subreddit table and to the comment body for reports
            $.each(user.subredditList, function (index, value) {
                var subreddit = value,
                    subredditCount = user.subreddits.submissions[subreddit].count,
                    subredditKarma = user.subreddits.submissions[subreddit].karma,
                    url = `/r/${subreddit}/search?q=author%3A%27${author}%27&restrict_sr=on&sort=new&feature=legacy_search`;
                var percentage = Math.round(subredditCount / totalSubredditCount * 100);

                $subredditTable.append(
                    `<tr>
                    <td class="url-td"><a target="_blank" href="${url}" title="view links ${author} recently submitted to /r/${subreddit}/">${subreddit}</a></td>
                    <td class="count-td">${subredditCount}</td>
                    <td class="percentage-td">${percentage}%</td>
                    <td class="karma-td">${subredditKarma}</td>
                </tr>`);

                if (index < 20) commentBody += `\n[${subreddit}](${url})|${subredditCount}|${percentage}%`;

            });

            //If there were more than 20 subreddits, we only put the first 20 in the report, and say that there are more
            if (moreDomains >= 20) commentBody += `\n\n_^...and ^${user.subredditList.length - 20} ^more_`;

            $rtsLink.attr('data-commentbody', commentBody);

            tableify();
        });//END DONE

        function tableify() {
        //Get the total account of account submissions
            $accountTable.empty();

            var accountList = [];

            for (var account in user.accounts) {

                accountList.push(account);
            }

            //Sort the domains by submission count
            accountList.sort(function (a, b) {
                return user.accounts[b].count - user.accounts[a].count;
            });


            $.each(accountList, function(index, account) {
                account = user.accounts[account];

                var percentage = Math.round(account.count / user.counters.submissions * 100),
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
                    spec.rx = new RegExp(`${spec.domain}/${spec.path || ''}([\\w-@]+)`);
                } else if (spec.type === TYPE.SUBDOMAIN) {
                    spec.rx = new RegExp(`:\/\/([\\w-]+)\.${spec.domain}`);
                }
            }

            var match = url.match(spec.rx),
                author = match && match[1],
                scheme, author_url, provider_url;

            if (author) {
                scheme = `${url.split('://')[0]}://`;
                provider_url = `${scheme + spec.domain}/`;

                if (spec.type === TYPE.PATH) {
                    author_url = provider_url + (spec.path || '') + author;
                } else if (spec.type === TYPE.SUBDOMAIN) {
                    author_url = `${scheme + author}.${spec.domain}`;
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
            $commentCount = $contentBox.find('.comment-count'),
            $commentCountOp = $contentBox.find('.comment-count-OP'),
            $commentTable = $contentBox.find('.comment-table tbody');

        $commentTable.empty();

        $contentBox.find('.comment-table').show();
        $contentBox.find('.tb-history-comment-stats').show();
        $commentTable.append(`<tr><td colspan="6" class="error">Loading... (${user.counters.comments})</td></tr>`);

        $.get(`${TBUtils.baseDomain}/user/${author}/comments.json?limit=100&after=${after}`).fail(function () {
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

                if (data.link_author === data.author) {
                    user.counters.commentsOP++;
                }
            });

            var after = d.data.after;

            if (after && user.counters.comments < Number(self.setting('commentCount'))) {
                self.populateCommentHistory(after, author);
            }

            user.commentSubredditList.sort(function (a, b) {
                return user.subreddits.comments[b].count - user.subreddits.comments[a].count;
            });

            $commentTable.empty();

            $.each(user.commentSubredditList, function (index, value) {
                var count = user.subreddits.comments[value].count,
                    percentage = Math.round(count / user.counters.comments * 100);

                $commentTable.append(
                    `<tr>
                    <td>${value}</td><td>${count}</td><td>${percentage}</td>
                </tr>`);
            });
            var percentageOP = Math.round(user.counters.commentsOP / user.counters.comments * 100);

            $commentCount.html(user.counters.comments);
            $commentCountOp.html(`${user.counters.commentsOP} (${percentageOP}%)`);

            TB.ui.longLoadNonPersistent(false);
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
        var link = `https://www.reddit.com/user/${author}`,
            title = `Overview for ${author}`;

        TBUtils.postLink(link, title, self.SPAM_REPORT_SUB, function (successful, submission) {
            if (!successful) {
                $rtsLink.after(`<span class="error" style="font-size:x-small; cursor: default;">an error occurred: ${submission[0][1]}</span>`);
            //$rtsLink.hide();
            } else {
                if (submission.json.errors.length) {
                    $rtsLink.after(`<span class="error" style="font-size:x-small">${submission.json.errors[0][1]}</error>`);
                    //$rtsLink.hide();
                    if (submission.json.errors[0][0] == 'ALREADY_SUB') {
                        rtsNativeLink.href = `/r/${self.SPAM_REPORT_SUB}/search?q=http%3A%2F%2Fwww.reddit.com%2Fuser%2F${author}&restrict_sr=on&feature=legacy_search`;
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
                        $rtsLink.after(`<span class="error" style="font-size:x-small; cursor: default;">an error occurred. ${comment[0][1]}</span>`);
                    //$rtsLink.hide();
                    } else {
                        if (comment.json.errors.length) {
                            $rtsLink.after(`<span class="error" style="font-size:x-small; cursor: default;">${comment.json.errors[1]}</error>`);
                            //$rtsLink.hide();
                            return;
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
    window.addEventListener('TBModuleLoaded', function () {
        historybutton();

    });
})();
