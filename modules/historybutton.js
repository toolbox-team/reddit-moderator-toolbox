function historybutton()
{
	var self = new TB.Module('History Button');

	self.subreddits = { submissions: { }, comments: { }};
	self.counters = { submissions: 0, comments: 0 };
	self.subredditList = [ ];
	self.domainList = [ ];
	self.commentSubredditList = [ ];

	self.gettingUserData = false;
	self.author = null;
	self.domains = [ ];

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
	self.run = function() {
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
						TB.ui.longLoadSpinner(false);
					});
				}

				$('.inline-content').hide();
			});
			$('.inline-content').show().offset($(this).offset()).text('loading...').load(this.href + '&limit=5 .sitetable.nestedlisting');
			return false;
		});

		$body.on('click', '.user-history-button', function (event) {
			self.subreddits = { submissions: { }, comments: { }},
			self.counters = { submissions: 0, comments: 0 };
			self.subredditList = [ ];
			self.domainList = [ ];
			self.commentSubredditList = [ ];

			self.author = TBUtils.getThingInfo($(this).closest('.entry')).user;
			self.gettingUserData = true;
			self.domains = [ ];
			self.domainslist = [ ];

			var popupContent = '<div>\
				<a href="/user/' + self.author + '" target="_blank">' + self.author + '</a>\
				<span class="karma" />\
				<a class="comment-report" href="javascript:;">get comment history</a> \
				<a class="markdown-report" style="display:none" href="javascript:;">view report in markdown</a> \
				<a class="rts-report" style="display:none" href="javascript:;" data-commentbody="">Report Spammer</a><br />\
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
				</div>'
				;

			var $popup = TB.ui.popup(
				'History Button',
				[
					{
						title: 'Tab1',
						tooltip: 'Tooltip shown when hovering tab.',
						content: popupContent
					}
				],
				'',
				'history-button-popup'
			).appendTo('body')
				.css({
					left: event.pageX - 50,
					top: event.pageY - 10,
					display: 'block'
				});
			;

			$popup.on('click', '.close', function()
			{
				self.subreddits = { submissions: { }, comments: { }},
				self.counters = { submissions: 0, comments: 0 };
				self.subredditList = [ ];
				self.domainList = [ ];
				self.commentSubredditList = [ ];

				self.gettingUserData = false;
				self.domains = [ ];
				self.domainslist = [ ];

				$popup.remove();
			});

			self.gettingUserData = true;
			self.showAuthorInformation();
			self.populateSubmissionHistory();

			$('.history-button-popup').on('click', '.markdown-report', self.showMarkdownReport);
			$('.history-button-popup').on('click', '.rts-report', self.reportAuthorToSpam);
			$('.history-button-popup').on('click', '.comment-report', self.populateCommentHistory);
		});



		return;
	};

	/**
	 * Show author information (Karma, How long they've been a redditor for)
	 */
	self.showAuthorInformation = function()
	{
		var $contentBox = $('.history-button-popup');

		$.get('/user/' + self.author + '/about.json').success(function (d) {
			var joinedDate = new Date(d.data.created_utc * 1000);
			var redditorTime = TBUtils.niceDateDiff(joinedDate);
			$contentBox.find('.karma').text('(' + d.data.link_karma + ' | ' + d.data.comment_karma + ')');
			$contentBox.find('.redditorTime').text('redditor for ' + redditorTime);
		});
	};

	/**
	 * Show the markdown report
	 */
	self.showMarkdownReport = function()
	{
		var $contentBox = $('.history-button-popup');
		var markdownReport = $contentBox.find('.rts-report').attr('data-commentbody');
		if ($('body').find('.submission-markdown').length > 0) {
			$('body').find('.submission-markdown').toggle();
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
		var $commentTable = $contentBox.find('.comment-table tbody');
		var $domainTable = $contentBox.find('.domain-table tbody');
		var $subredditTable = $contentBox.find('.subreddit-table tbody');

		if (typeof after === 'undefined') {
			TB.ui.longLoadSpinner(true);
//			populateRunning.push('load');
		}

		$.get('/user/' + self.author + '/submitted.json?limit=100&after=' + (after || '')).error(function () {
			console.log('Shadowbanned?');
			$contentBox.find('.subreddit-table .error, .domain-table .error').html('unable to load userdata</br>shadowbanned?');
			TB.ui.longLoadSpinner(false);
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

				TB.ui.longLoadSpinner(false);
//				populateRunning.pop();

//				$contentBox.find('.rts-report').show();

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
				    url = '/search?q=%28and+site%3A%27' + domain + '%27+author%3A%27' + self.author + '%27+is_self%3A0+%29&restrict_sr=off&sort=new',
				    match = domain.match(/^self.(\w+)$/);

				var percentage = Math.round(domainCount / totalDomainCount * 100);

				//If the domain is a self post, change the URL
				if (match) url = '/r/' + match[1] + '/search?q=%28and+author%3A%27' + self.author + '%27+is_self%3A1+%29&restrict_sr=on&sort=new';

				//Append domain to the table
				$domainTable.append('<tr><td class="url-td"><a target="_blank" href="' + url + '" title="view links ' + self.author + ' recently submitted from \'' + domain + '\'">' + domain + '</a></td><td class="count-td">' + domainCount + '</td><td class="percentage-td">' + percentage + '%</td></tr>');

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
				    url = '/r/' + subreddit + '/search?q=author%3A%27' + self.author + '%27&restrict_sr=on&sort=new';

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

				TB.ui.longLoadSpinner(false);
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

	self.populateCommentHistory = function(after) {
		var $contentBox = $('.history-button-popup');
		var $commentTable = $contentBox.find('.comment-table tbody');

		$contentBox.width(1000);
		$commentTable.empty();

		if(!self.gettingUserData) return;

		$contentBox.find('.comment-table').show();
		$commentTable.append('<tr><td colspan="6" class="error">Loading... (' + self.counters.comments + ')</td></tr>');

		$.get('/user/' + self.author + '/comments.json?limit=100&after=' + (after || '')).error(function()
		{
			$commentTable.find('.error').html('unable to load userdata <br /> shadowbanned?');
		}).done(function (d) {

			var after = d.data.after;
			if ($.isEmptyObject(d.data.children)) {
				after = false;
			}

			if(after)
			{
				$.each(d.data.children, function (index, value) {
					var data = value.data;
					if(!self.subreddits.comments[data.subreddit])
					{
						self.subreddits.comments[data.subreddit] = { count: 0 };
						self.commentSubredditList.push(data.subreddit);
					}

					self.subreddits.comments[data.subreddit].count++;
					self.counters.comments++;
				});

				self.populateCommentHistory(after);
			}
			else
			{
				self.commentSubredditList.sort(function(a, b)
				{
					return self.subreddits.comments[b].count - self.subreddits.comments[a].count;
				});

				$commentTable.empty();

				$.each(self.commentSubredditList, function(index, value)
				{
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
	self.reportAuthorToSpam = function() {
		var rtsComment = self.setting('rtsComment');
		var $contentBox = $('.history-button-popup');

		var $rtsLink = $contentBox.find('.rts-report');
		var rtsLink = $rtsLink.get(0);
		var commentBody = rtsLink.getAttribute('data-commentbody');

		rtsLink.textContent = 'Submitting...';
		rtsLink.className = '.rts-report-clicked';

		//Submit to RTS
		var link = 'https://www.reddit.com/user/' + self.author,
		    title = 'Overview for ' + self.author;

		TBUtils.postLink(link, title, self.SPAM_REPORT_SUB, function (successful, submission) {
			if (!successful) {
				$rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">an error occurred: ' + submission[0][1] + '</span>');
				$rtsLink.hide();
			} else {
				if (submission.json.errors.length) {
					$rtsLink.after('<span class="error" style="font-size:x-small">' + submission.json.errors[0][1] + '</error>');
					$rtsLink.hide();
					if (submission.json.errors[0][0] == 'ALREADY_SUB') {
						rtsLink.href = '/r/' + self.SPAM_REPORT_SUB + '/search?q=http%3A%2F%2Fwww.reddit.com%2Fuser%2F' + self.author + '&restrict_sr=on';
					}
					return;
				}

				// Post stats as a comment.
				if (!commentBody.length || !rtsComment) {
					rtsLink.textContent = 'Reported';
					rtsLink.href = submission.json.data.url;
					rtsLink.className = '';
					return;
				}


				TBUtils.postComment(submission.json.data.name, commentBody, function (successful, comment) {
					if (!successful) {
						$rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">an error occurred. ' + comment[0][1] + '</span>');
						$rtsLink.hide();
					} else {
						if (comment.json.errors.length) {
							$rtsLink.after('<span class="error" style="font-size:x-small; cursor: default;">' + comment.json.errors[1] + '</error>');
							$rtsLink.hide();
							return
						}
						rtsLink.textContent = 'Reported';
						rtsLink.href = submission.json.data.url;
						rtsLink.className = '';
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
