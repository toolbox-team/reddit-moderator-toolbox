var historyButton = new TB.Module('History Button');

// Add history button to all users.
historyButton.addUserHistoryLink = function() {
    $(this).append('[<a href="javascript:;" class="user-history-button" title="view user history" target="_blank">H</a>]');
};

// This should be a setting, methinks.
historyButton.SPAM_REPORT_SUB = 'spam';

historyButton.init = function() {
    var self = this;

    var rtsComment = TBUtils.getSetting('QueueTools', 'rtscomment', true);

    // Add context & history stuff
    $('body').append('<div class="pretty-button inline-content" style="z-index:9999;display:none;position:absolute;line-height:12px;min-width:100px"/>');

    $('.thing .entry .userattrs').each(self.addUserHistoryLink);

    // Open inline context
    $('.inline-content').click(function (e) {
        e.stopPropagation();
    });
    $('body').on('click', 'a.context', function (e) {
        $('html').one('click', function () {
            $('.inline-content').hide();
        });
        $('.inline-content').show().offset($(this).offset()).text('loading...').load(this.href + '&limit=5 .sitetable.nestedlisting');
        return false;
    });


    //User history button pressed
    var gettingUserdata = false;
    $('body').on('click', '.user-history-button', function () {
        $('html').one('click', function () {
            $('.inline-content').hide();
            gettingUserdata = false;
        });
        gettingUserdata = true;

        var author = TBUtils.getThingInfo($(this).closest('.entry')).user,
            commentbody = '',
            contentBox = $('.inline-content').show().offset($(this).offset()).html('<div class="user-history"><a href="/user/' + author + '" target="_blank">' + author + '</a> <span class="karma" /> <a class="rts-report" href="javascript:;" data-commentbody="">Report Spammer</a><div><br /><b>Submission history:</b></div><div class="table domain-table"><table><thead><tr><th>domain submitted from</th><th>count</th><th>ups</th><th>downs</th><th>score</th><th>%</th></tr></thead><tbody><tr><td colspan="6" class="error">loading...</td></tr></tbody></table></div><div class="table subreddit-table"><table><thead><tr><th>subreddit submitted to</th><th>count</th><th>ups</th><th>downs</th><th>score</th><th>%</th></tr></thead><tbody><tr><td colspan="6" class="error">loading...</td></tr></tbody></table></div></div>'),

            domains = {},
            domainslist = [],
            domaintable = contentBox.find('.domain-table tbody'),
            subreddits = {},
            subredditlist = [],
            subreddittable = contentBox.find('.subreddit-table tbody');

        $('.rts-report').attr('data-author', author);

        // Show user's karma
        $.get('/user/' + author + '/about.json').success(function (d) {
            contentBox.find('.karma').text('(' + d.data.link_karma + ' | ' + d.data.comment_karma + ')');
        });

        // Get user's domain & subreddit submission history
        (function populateHistory(after) {
            $.get('/user/' + author + '/submitted.json?limit=100&after=' + (after || '')).error(function () {
                contentBox.find('.error').html('unable to load userdata</br>shadowbanned?');
            }).success(function (d) {

                if (!gettingUserdata) return;
                if (!d.data.children.length) return contentBox.find('.error').html('no submissions');

                var after = d.data.after,
                    commentbody = 'Recent Submission history for ' + author + ':\n\ndomain submitted from|count|ups|downs|score|%\n:-|-:|-:|-:|-:|-:';

                for (i in d.data.children) {
                    var data = d.data.children[i].data;

                    if (!domains[data.domain]) {
                        domains[data.domain] = {
                            ups: 0,
                            downs: 0,
                            score: 0,
                            count: 0
                        };
                        domainslist.push(data.domain);
                    }

                    domains[data.domain].ups += data.ups;
                    domains[data.domain].downs += data.downs;
                    domains[data.domain].score += data.score;
                    domains[data.domain].count++;

                    if (!subreddits[data.subreddit]) {
                        subreddits[data.subreddit] = {
                            ups: 0,
                            downs: 0,
                            score: 0,
                            count: 0
                        };
                        subredditlist.push(data.subreddit);
                    }
                    subreddits[data.subreddit].ups += data.ups;
                    subreddits[data.subreddit].downs += data.downs;
                    subreddits[data.subreddit].score += data.score;
                    subreddits[data.subreddit].count++;
                }

                domainslist.sort(function (a, b) {
                    return domains[b].count - domains[a].count;
                });
                domaintable.empty();

                for (i in domainslist) {
                    var dom = domainslist[i],
                        n = domains[dom].count,
                        u = domains[dom].ups,
                        d = domains[dom].downs,
                        s = domains[dom].score,
                        url = '/search?q=%28and+site%3A%27' + dom + '%27+author%3A%27' + author + '%27+is_self%3A0+%29&restrict_sr=off&sort=new',
                        match = dom.match(/^self.(\w+)$/);

                    if (match) url = '/r/' + match[1] + '/search?q=%28and+author%3A%27' + author + '%27+is_self%3A1+%29&restrict_sr=on&sort=new';
                    domaintable.append('<tr><td><a target="_blank" href="' + url + '" title="view links ' + author + ' recently submitted from \'' + dom + '\'">' + dom + '</a></td><td>' + n + '</td><td>' + u + '</td><td>' + d + '</td><td>' + s + '</td><td>' + Math.round(u / (u + d) * 100) + '%</td></tr>');

                    if (i < 20) commentbody += '\n[' + dom + '](' + url + ')|' + n + '|' + u + '|' + d + '|' + s + '|' + Math.round(u / (u + d) * 100) + '%';
                }
                if (i >= 20) commentbody += '\n\n_^...and ^' + (domainslist.length - 20) + ' ^more_';

                commentbody += '\n\nsubreddit submitted to|count|ups|downs|score|%\n:-|-:|-:|-:|-:|-:';

                subredditlist.sort(function (a, b) {
                    return subreddits[b].count - subreddits[a].count;
                });
                subreddittable.empty();
                for (i in subredditlist) {
                    var sr = subredditlist[i],
                        n = subreddits[sr].count,
                        u = subreddits[sr].ups,
                        d = subreddits[sr].downs,
                        s = subreddits[sr].score,
                        url = '/r/' + sr + '/search?q=author%3A%27' + author + '%27&restrict_sr=on&sort=new';

                    subreddittable.append('<tr><td><a target="_blank" href="' + url + '" title="view links ' + author + ' recently submitted to /r/' + sr + '/">' + sr + '</a></td><td>' + n + '</td><td>' + u + '</td><td>' + d + '</td><td>' + s + '</td><td>' + Math.round(u / (u + d) * 100) + '%</td></tr>');

                    if (i < 20) commentbody += '\n[' + sr + '](' + url + ')|' + n + '|' + u + '|' + d + '|' + s + '|' + Math.round(u / (u + d) * 100) + '%';
                }
                if (i >= 20) commentbody += '\n\n_^...and ^' + (subredditlist.length - 20) + ' ^more_';

                $('.rts-report').attr('data-commentbody', commentbody);

                if (after) populateHistory(after);
                else gettingUserdata = false;
            });
        })();
        return false;
    });


    // RTS button pressed
    $('.inline-content').on('click', '.rts-report', function () {
        var rtsLink = this,
            author = rtsLink.getAttribute('data-author'),
            commentbody = rtsLink.getAttribute('data-commentbody');

        rtsLink.textContent = 'submitting...';
        rtsLink.className = '.rts-report-clicked';

        //Submit to RTS
        var link = 'http://www.reddit.com/user/' + author,
            title = 'Overview for ' + author;

        TBUtils.postLink(link, title, historyButton.SPAM_REPORT_SUB, function (successful, submission) {
            if (!successful) {
                rtsLink.innerHTML = '<span class="error" style="font-size:x-small">an error occured</span>';
            } else {
                if (submission.json.errors.length) {
                    rtsLink.innerHTML = '<span class="error" style="font-size:x-small">' + submission.json.errors[0][1] + '</error>';
                    if (submission.json.errors[0][0] == 'ALREADY_SUB') {
                        rtsLink.href = 'http://www.reddit.com/r/'+historyButton.SPAM_REPORT_SUB+'/search?q=http%3A%2F%2Fwww.reddit.com%2Fuser%2F' + author + '&restrict_sr=on';
                    }
                    return;
                }

                // Post stats as a comment.
                if (!commentbody.length || !rtsComment) {
                    rtsLink.textContent = 'reported';
                    rtsLink.href = submission.json.data.url;
                    rtsLink.className = '';
                    return;
                }


                TBUtils.postComment(submission.json.data.name, commentbody, function (successful, comment) {
                    if (!successful) {
                        rtsLink.innerHTML = '<span class="error" style="font-size:x-small">an error occured</span>';
                    }
                    else {
                        if (comment.json.errors.length)
                            return rtsLink.innerHTML = '<span class="error" style="font-size:x-small">' + comment.json.errors[1] + '</error>';
                        rtsLink.textContent = 'reported';
                        rtsLink.href = submission.json.data.url;
                        rtsLink.className = '';
                    };
                });
            }
        });
    });
};

TB.register_module(historyButton);
