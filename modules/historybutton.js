function historybutton() {
var self = new TB.Module('History Button');
self.shortname = 'HButton';

// This should be a setting, methinks.
self.SPAM_REPORT_SUB = 'spam';

self.settings['enabled']['default'] = true;

self.register_setting('rtsComment', {
    'type': 'boolean',
    'default': true,
    'title': 'Post user summary when submitting spam reports'
});

self.init = function () {
    var $body = $('body'),
        rtsComment = self.setting('rtsComment');

    // Add context & history stuff
    $body.append('<div class="pretty-button inline-content" style="z-index:9999;display:none;position:absolute;border:0;line-height:12px;min-width:100px"/>');

    function run() {
        var UserButtonHTML = '<span style="color:#888888; font-size:x-small">&nbsp;[<a href="javascript:;" class="user-history-button" title="view user history" target="_blank">H</a>]</span>';

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
    }

    run();

    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();
    });

    // Open inline context
    $('.inline-content').click(function (e) {
        //  e.stopPropagation();
    });
    $body.on('click', 'a.context', function (e) {
        $body.on('click', '.user-history-close', function () {
            if (populateRunning.length > 0) {
                $.each(populateRunning, function () {
                    TB.ui.longLoadSpinner(false);
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
            if (populateRunning.length > 0) {
                $.each(populateRunning, function () {
                    TB.ui.longLoadSpinner(false);
                });
            }

            $('.inline-content').hide();
            gettingUserdata = false;
        });
        gettingUserdata = true;

        var author = TBUtils.getThingInfo($(this).closest('.entry')).user,
            commentbody = '',
            $contentBox = $('.inline-content').show().offset($(this).offset()).html('\
<div class="tb-popup user-history">\
<div class="tb-popup-header">\
    <div class="tb-popup-title">User history for ' + author + '</div>\
    <div class="buttons"><a class="user-history-close close" href="javascript:;">✕</a></div>\
</div>\
<div class=" tb-popup-content">\
<<<<<<< HEAD
<a href="/user/' + author + '" target="_blank">' + author + '</a> <span class="karma" /> <a class="comment-report" href="javascript:;">get comment history</a> <a class="markdown-report" style="display:none" href="javascript:;">view report in markdown</a> <a class="rts-report" style="display:none" href="javascript:;" data-commentbody="">Report Spammer</a>\
=======
<a href="/user/' + author + '" target="_blank">' + author + '</a> <span class="karma" /> <a class="markdown-report" style="display:none" href="javascript:;">view report in markdown</a> <a class="rts-report" style="display:none" href="javascript:;" data-commentbody="">Report Spammer</a>\
<br /><span class="redditorTime"></span>\
>>>>>>> Issue #449
<div><br /><b>Submission history:</b> <label class="submission-count"></label></div>\
<div class="table domain-table">\
<table><thead>\
<tr><th class="url-td">domain submitted from</th><th class="url-count">count</th><th class="url-percentage">%</th></tr></thead>\
<tbody><tr><td colspan="6" class="error">loading...</td></tr></tbody>\
</table>\
</div><div class="table subreddit-table">\
<table><thead><tr><th class="url-td">subreddit submitted to</th><th class="url-count">count</th><th class="url-percentage">%</th></tr></thead><tbody><tr><td colspan="6" class="error">loading...</td></tr></tbody></table>\
</div>\
<div class="table comment-table" style="display: none">\
	<table>\
		<thead>\
			<tr>\
				<th class="url-td">subreddit submitted to</th>\
				<th class="url-count">count</th>\
				<th class="url-percentage">%</th>\
			</tr>\
		</thead>\
		<tbody>\
			<tr><td colspan="6" class="error">loading...</td></tr>\
		</tbody>\
	</table>\
</div>\
    <div class="tb-popup-footer">\
    </div>\
</div>\
'),

        domains = {},
        domainslist = [],
        $domaintable = $contentBox.find('.domain-table tbody'),
        subreddits = { submissions: { }, comments: { }},
        subredditlist = [],
        $subreddittable = $contentBox.find('.subreddit-table tbody'),
	    $commentTable = $contentBox.find('.comment-table tbody');

        $('.rts-report').attr('data-author', author);

        // Show user's karma
        $.get('/user/' + author + '/about.json').success(function (d) {
	        var joinedDate = new Date(d.data.created_utc * 1000);
	        var redditorTime = TBUtils.niceDateDiff(joinedDate);
            $contentBox.find('.karma').text('(' + d.data.link_karma + ' | ' + d.data.comment_karma + ')');
			$contentBox.find('.redditorTime').text('redditor for ' + redditorTime);
        });

        // Get user's domain & subreddit submission history
        var populateRunning = [],
            submissionCount = 0,
            $submissionCount = $contentBox.find('.submission-count'),
            commentCount = 0,
            commentSubredditList = [ ]
	        ;

        (function populateHistory(after) {
            if (typeof after === 'undefined') {
                TB.ui.longLoadSpinner(true);
                populateRunning.push('load');
            }
	        $commentTable.empty();
            $.get('/user/' + author + '/submitted.json?limit=100&after=' + (after || '')).error(function () {
                $contentBox.find('.subreddit-table .error, .domain-table .error').html('unable to load userdata</br>shadowbanned?');
                TB.ui.longLoadSpinner(false);
                populateRunning.pop();
            }).done(function (d) {
                //This is another exit point of the script. Hits this code after loading 1000 submissions for a user
                if ($.isEmptyObject(d.data.children)) {

                    if (submissionCount > 0) {
                        $submissionCount.html(submissionCount + "+");
                    }
                    else {
                        $submissionCount.html(submissionCount);
                    }

                    TB.ui.longLoadSpinner(false);
                    populateRunning.pop();

                    $contentBox.find('.rts-report').show();
                    if ($contentBox.find('.subreddit-table .error, .domain-table .error').length > 0) { // If .error is present it means there are no results. So we show that.
                        $contentBox.find('.subreddit-table .error, .domain-table .error').html('no submissions');
                    } else { // If it is not present we have results and we can show the links for reporting and markdown reports.
                        $contentBox.find('.markdown-report').show();
                    }
                    gettingUserdata = false;
                }
                if (!gettingUserdata) return;

                var after = d.data.after,
                    commentbody = 'Recent Submission history for ' + author + ':\n\ndomain submitted from|count|%\n:-|-:|-:';

                $.each(d.data.children, function (index, value) {
                    var data = value.data;

                    if (!domains[data.domain]) {
                        domains[data.domain] = {
                            count: 0
                        };
                        domainslist.push(data.domain);
                    }

                    domains[data.domain].count++;

                    if (!subreddits.submissions[data.subreddit]) {
	                    subreddits.submissions[data.subreddit] = {
                            count: 0
                        };
                        subredditlist.push(data.subreddit);
                    }
                    subreddits.submissions[data.subreddit].count++;
                    submissionCount++;
                });

                domainslist.sort(function (a, b) {
                    return domains[b].count - domains[a].count;
                });
                $domaintable.empty();

                var moredomains;
                $.each(domainslist, function (index, value) {
                    var dom = value,
                        n = domains[dom].count,
                        url = '/search?q=%28and+site%3A%27' + dom + '%27+author%3A%27' + author + '%27+is_self%3A0+%29&restrict_sr=off&sort=new',
                        match = dom.match(/^self.(\w+)$/);

                    var subTotal = 0;
                    for (x in domains) {
                        subTotal = subTotal + domains[x].count;
                    }

                    var percentage = Math.round(n / subTotal * 100);
                    if (match) url = '/r/' + match[1] + '/search?q=%28and+author%3A%27' + author + '%27+is_self%3A1+%29&restrict_sr=on&sort=new';
                    $domaintable.append('<tr><td class="url-td"><a target="_blank" href="' + url + '" title="view links ' + author + ' recently submitted from \'' + dom + '\'">' + dom + '</a></td><td class="count-td">' + n + '</td><td class="percentage-td">' + percentage + '%</td></tr>');

                    if (index < 20) commentbody += '\n[' + dom + '](' + url + ')|' + n + '|' + percentage + '%';
                    moredomains = index;
                });

                if (moredomains >= 20) commentbody += '\n\n_^...and ^' + (domainslist.length - 20) + ' ^more_';

                commentbody += '\n\nsubreddit submitted to|count|%\n:-|-:|-:';

                subredditlist.sort(function (a, b) {
                    return subreddits.submissions[b].count - subreddits.submissions[a].count;
                });
                $subreddittable.empty();

                var moresubreddit;
                $.each(subredditlist, function (index, value) {
                    var sr = value,
                        n = subreddits.submissions[sr].count,
                        url = '/r/' + sr + '/search?q=author%3A%27' + author + '%27&restrict_sr=on&sort=new';

                    var subTotal = 0;
                    for (x in subreddits.submissions) {
                        subTotal = subTotal + subreddits.submissions[x].count;
                    }

                    var percentage = Math.round(n / subTotal * 100);
                    $subreddittable.append('<tr><td class="url-td"><a target="_blank" href="' + url + '" title="view links ' + author + ' recently submitted to /r/' + sr + '/">' + sr + '</a></td><td class="count-td">' + n + '</td><td class="percentage-td">' + percentage + '%</td></tr>');

                    if (index < 20) commentbody += '\n[' + sr + '](' + url + ')|' + n + '|' + percentage + '%';
                    moresubreddit = index;
                });
                if (moresubreddit >= 20) commentbody += '\n\n_^...and ^' + (subredditlist.length - 20) + ' ^more_';

                $('.rts-report').attr('data-commentbody', commentbody);

                if (after) {
                    //There's still more subsmissions to load, so we're going to run again
                    $submissionCount.html("Loading... (" + submissionCount + ")");
                    populateHistory(after);
                } else {
                    //All of the submissions have been loaded at this point
                    $submissionCount.html(submissionCount);

                    TB.ui.longLoadSpinner(false);
                    $contentBox.find('.rts-report').show();
                    if ($contentBox.find('.subreddit-table .error, .domain-table .error').length > 0) {  // This check is likely not need, but better safe than sorry.
                        $contentBox.find('.subreddit-table .error, .domain-table .error').html('no submissions');
                    } else {
                        $contentBox.find('.markdown-report').show();
                    }
                    gettingUserdata = false;
                }
            });

        })();

	    $('.inline-content').on('click', '.comment-report', function() {
		    (function populateCommentHistory(after)
		    {
			    $contentBox.width(1000);
			    $contentBox.find('.comment-table').show();
			    $commentTable.empty();
			    $commentTable.append('<tr><td colspan="6" class="error">loading...</td></tr>');

			    $.get('/user/' + author + '/comments.json?limit=100&after=' + (after || '')).done(function (d) {

				    var after = d.data.after;
				    if ($.isEmptyObject(d.data.children)) {
				        after = false;
				    }

				    if(after)
				    {
					    $.each(d.data.children, function (index, value) {
						    var data = value.data;
						    if(!subreddits.comments[data.subreddit])
						    {
							    subreddits.comments[data.subreddit] = { count: 0 };
							    commentSubredditList.push(data.subreddit);
						    }

						    subreddits.comments[data.subreddit].count++;
						    commentCount++;
					    });

					    populateCommentHistory(after);
				    }
				    else
				    {
					    commentSubredditList.sort(function(a, b)
					    {
						    return subreddits.comments[b].count - subreddits.comments[a].count;
					    });

					    $commentTable.empty();

					    $.each(commentSubredditList, function(index, value)
					    {
						    var count = subreddits.comments[value].count;
						    var percentage = Math.round(count / commentCount * 100);
						    var url = '/r/' + value + '/search?q=author%3A%27' + author + '%27&restrict_sr=on&sort=new';
							$commentTable.append('<tr>' +
								'<td class="url-td"><a target="_blank" href="' +  url + '">' + value + '</a></td><td>' + count + '</td><td>' + percentage + '</td></tr>');
					    });
				    }
			    });
		    })();
	    });

        return false;
    });



    // Markdown button pressed
    $('.inline-content').on('click', '.markdown-report', function () {
        var markdownReport = $body.find('.rts-report').attr('data-commentbody');
        if ($('body').find('.submission-markdown').length > 0) {
            $('body').find('.submission-markdown').toggle();
        } else {
            $body.find('.table.domain-table').before('<div class="submission-markdown"><textarea id="submission-markdown-text">' + markdownReport + '</textarea></div>');
        }
    });
    // RTS button pressed
    $('.inline-content').on('click', '.rts-report', function () {
        var rtsLink = this,
            $rtsLink = $(this),
            author = rtsLink.getAttribute('data-author'),
            commentbody = rtsLink.getAttribute('data-commentbody');

        rtsLink.textContent = 'submitting...';
        rtsLink.className = '.rts-report-clicked';

        //Submit to RTS
        var link = 'https://www.reddit.com/user/' + author,
            title = 'Overview for ' + author;

        TBUtils.postLink(link, title, self.SPAM_REPORT_SUB, function (successful, submission) {
            if (!successful) {
                $rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">an error occurred: ' + submission[0][1] + '</span>');
                $rtsLink.hide();
            } else {
                if (submission.json.errors.length) {
                    $rtsLink.after('<span class="error" style="font-size:x-small">' + submission.json.errors[0][1] + '</error>');
                    $rtsLink.hide();
                    if (submission.json.errors[0][0] == 'ALREADY_SUB') {
                        rtsLink.href = '/r/' + self.SPAM_REPORT_SUB + '/search?q=http%3A%2F%2Fwww.reddit.com%2Fuser%2F' + author + '&restrict_sr=on';
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
                        $rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">an error occurred. ' + comment[0][1] + '</span>');
                        $rtsLink.hide();
                    } else {
                        if (comment.json.errors.length) {
                            $rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">' + comment.json.errors[1] + '</error>');
                            $rtsLink.hide();
                            return
                        }
                        rtsLink.textContent = 'reported';
                        rtsLink.href = submission.json.data.url;
                        rtsLink.className = '';
                    }
                });
            }
        });
    });
};

TB.register_module(self);
}

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        historybutton();
    });
})();
