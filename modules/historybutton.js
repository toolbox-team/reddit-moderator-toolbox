function historybutton() {
var historyButton = new TB.Module('History Button');

// Add history button to all users.
historyButton.addUserHistoryLink = function () {
    $(this).append('[<a href="javascript:;" class="user-history-button" title="view user history" target="_blank">H</a>]');
};

// This should be a setting, methinks.
historyButton.SPAM_REPORT_SUB = 'spam';

historyButton.settings["enabled"]["default"] = true;
historyButton.config["betamode"] = false;

var $body = $('body');
    

historyButton.init = function () {
    var self = this;

    var rtsComment = TBUtils.getSetting('QueueTools', 'rtscomment', true);

    // Add context & history stuff
    $body.append('<div class="pretty-button inline-content" style="z-index:9999;display:none;position:absolute;border:0;line-height:12px;min-width:100px"/>');

    $('.thing .entry .userattrs').each(self.addUserHistoryLink);

    // Open inline context
    $('.inline-content').click(function (e) {
        //  e.stopPropagation();
    });
    $body.on('click', 'a.context', function (e) {
        $body.on('click', '.user-history-close', function () {
            if(populateRunning.length > 0) {
                $.each(populateRunning, function() {
                    TBUtils.longLoadSpinner(false);
                });
            }

            $('.inline-content').hide();
        });
        $('.inline-content').show().offset($(this).offset()).text('loading...').load(this.href + '&limit=5 .sitetable.nestedlisting');
        return false;
    });


    //User history button pressed
    var gettingUserdata = false;
    $body.on('click', '.user-history-button', function () {
        $body.on('click', '.user-history-close', function () {
            if(populateRunning.length > 0) {
                $.each(populateRunning, function() {
                    TBUtils.longLoadSpinner(false);
                });
            }

            $('.inline-content').hide();
            gettingUserdata = false;
        });
        gettingUserdata = true;

        var author = TBUtils.getThingInfo($(this).closest('.entry')).user,
            commentbody = '',
            contentBox = $('.inline-content').show().offset($(this).offset()).html('\
            <div class="tb-popup user-history">\
            <div class="tb-popup-header">\
                <div class="tb-popup-title">User history for ' + author + '\</div>\
                <div class="buttons"><a class="user-history-close close" href="javascript:;">✕</a></div>\
            </div>\
            <div class=" tb-popup-content">\
            <a href="/user/' + author + '" target="_blank">' + author + '</a> <span class="karma" /> <a class="markdown-report" style="display:none" href="javascript:;">view report in markdown</a> <a class="rts-report" style="display:none" href="javascript:;" data-commentbody="">Report Spammer</a>\
            <div><br /><b>Submission history:</b></div>\
            <div class="table domain-table">\
            <table><thead>\
            <tr><th class="url-td">domain submitted from</th><th class="url-count">count</th><th class="url-percentage">%</th></tr></thead>\
            <tbody><tr><td colspan="6" class="error">loading...</td></tr></tbody>\
            </table>\
            </div><div class="table subreddit-table">\
            <table><thead><tr><th class="url-td">subreddit submitted to</th><th class="url-count">count</th><th class="url-percentage">%</th></tr></thead><tbody><tr><td colspan="6" class="error">loading...</td></tr></tbody></table>\
            </div></div>\
                <div class="tb-popup-footer">\
                </div>\
            </div>\
            '),

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
        var populateRunning = [];
        (function populateHistory(after) {
            if (typeof after === 'undefined') {
                TBUtils.longLoadSpinner(true);
                populateRunning.push('load');
            }
            $.get('/user/' + author + '/submitted.json?limit=100&after=' + (after || '')).error(function () {
                contentBox.find('.error').html('unable to load userdata</br>shadowbanned?');
                TBUtils.longLoadSpinner(false);
                populateRunning.pop();
            }).done(function (d) {
                if ($.isEmptyObject(d.data.children)) {
                    TBUtils.longLoadSpinner(false);
                    populateRunning.pop();
					
					if (contentBox.find('.error').length > 0) { // If .error is present it means there are no results. So we show that.
					contentBox.find('.error').html('no submissions');
					} else { // If it is not present we have results and we can show the links for reporting and markdown reports. 
                    contentBox.find('.rts-report').show();
					contentBox.find('.markdown-report').show();
					}
                    gettingUserdata = false;

                }
                if (!gettingUserdata) return;
                
                var after = '',
                after = d.data.after,
                commentbody = 'Recent Submission history for ' + author + ':\n\ndomain submitted from|count|%\n:-|-:|-:';

                for (i in d.data.children) {
                    var data = d.data.children[i].data;

                    if (!domains[data.domain]) {
                        domains[data.domain] = {
                            count: 0
                        };
                        domainslist.push(data.domain);
                    }

                    domains[data.domain].count++;

                    if (!subreddits[data.subreddit]) {
                        subreddits[data.subreddit] = {
                            count: 0
                        };
                        subredditlist.push(data.subreddit);
                    }
                    subreddits[data.subreddit].count++;
                }

                domainslist.sort(function (a, b) {
                    return domains[b].count - domains[a].count;
                });
                domaintable.empty();

                for (i in domainslist) {
                    var dom = domainslist[i],
                        n = domains[dom].count,
                        url = '/search?q=%28and+site%3A%27' + dom + '%27+author%3A%27' + author + '%27+is_self%3A0+%29&restrict_sr=off&sort=new',
                        match = dom.match(/^self.(\w+)$/);

                    var subTotal = 0;
                    for (x in domains) {
                        subTotal = subTotal + domains[x].count;
                    }

                    var percentage = Math.round(n / subTotal * 100);
                    if (match) url = '/r/' + match[1] + '/search?q=%28and+author%3A%27' + author + '%27+is_self%3A1+%29&restrict_sr=on&sort=new';
                    domaintable.append('<tr><td class="url-td"><a target="_blank" href="' + url + '" title="view links ' + author + ' recently submitted from \'' + dom + '\'">' + dom + '</a></td><td class="count-td">' + n + '</td><td class="percentage-td">' + percentage + '%</td></tr>');

                    if (i < 20) commentbody += '\n[' + dom + '](' + url + ')|' + n + '|' + percentage + '%';
                }
                if (i >= 20) commentbody += '\n\n_^...and ^' + (domainslist.length - 20) + ' ^more_';

                commentbody += '\n\nsubreddit submitted to|count|%\n:-|-:|-:';

                subredditlist.sort(function (a, b) {
                    return subreddits[b].count - subreddits[a].count;
                });
                subreddittable.empty();


                for (i in subredditlist) {
                    var sr = subredditlist[i],
                        n = subreddits[sr].count,
                        url = '/r/' + sr + '/search?q=author%3A%27' + author + '%27&restrict_sr=on&sort=new';

                    var subTotal = 0;
                    for (x in subreddits) {
                        subTotal = subTotal + subreddits[x].count;
                    }

                    var percentage = Math.round(n / subTotal * 100);
                    subreddittable.append('<tr><td class="url-td"><a target="_blank" href="' + url + '" title="view links ' + author + ' recently submitted to /r/' + sr + '/">' + sr + '</a></td><td class="count-td">' + n + '</td><td class="percentage-td">' + percentage + '%</td></tr>');

                    if (i < 20) commentbody += '\n[' + sr + '](' + url + ')|' + n + '|' + percentage + '%';
                }
                if (i >= 20) commentbody += '\n\n_^...and ^' + (subredditlist.length - 20) + ' ^more_';

                $('.rts-report').attr('data-commentbody', commentbody);

                if (after) {
                    populateHistory(after);
                } else {
                    TBUtils.longLoadSpinner(false);
					if (contentBox.find('.error').length > 0) {  // This check is likely not need, but better safe than sorry. 
					    contentBox.find('.error').html('no submissions');
					} else {
                        contentBox.find('.rts-report').show();
					    contentBox.find('.markdown-report').show();
					}
                    gettingUserdata = false;
                }


            });

        })();

        return false;
    });

    // Markdown button pressed
    $('.inline-content').on('click', '.markdown-report', function () {
    var markdownReport = $body.find('.rts-report').attr('data-commentbody');
        if($('body').find('.submission-markdown').length > 0)
        {
            $('body').find('.submission-markdown').toggle();
        } else {
            $body.find('.table.domain-table').before('<div class="submission-markdown"><textarea id="submission-markdown-text">' + markdownReport + '</textarea></div>');
        }
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
                rtsLink.innerHTML = '<span class="error" style="font-size:x-small; cursor: default;">an error occurred: ' + submission[0][1] + '</span>';
            } else {
                if (submission.json.errors.length) {
                    rtsLink.innerHTML = '<span class="error" style="font-size:x-small">' + submission.json.errors[0][1] + '</error>';
                    if (submission.json.errors[0][0] == 'ALREADY_SUB') {
                        rtsLink.href = '/r/' + historyButton.SPAM_REPORT_SUB + '/search?q=http%3A%2F%2Fwww.reddit.com%2Fuser%2F' + author + '&restrict_sr=on';
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
                        rtsLink.innerHTML = '<span class="error" style="font-size:x-small; cursor: default;">an error occurred. ' + comment[0][1] + '</span>';
                    } else {
                        if (comment.json.errors.length) return rtsLink.innerHTML = '<span class="error" style="font-size:x-small; cursor: default;">' + comment.json.errors[1] + '</error>';
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

}

(function () {
    window.addEventListener("TBObjectLoaded", function () {
        $.log("got tbobject");
        historybutton();
    });
})();
