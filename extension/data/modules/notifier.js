function notifiermod() {
    var self = new TB.Module('Notifier');
    self.shortname = 'Notifier';

    self.settings['enabled']['default'] = true;

    // First show the options for filtering of subreddits.
    self.register_setting('modSubreddits', {
        'type': 'text',
        'default': 'mod',
        'advanced': false,
        'title': 'Multireddit of subs you want displayed in the modqueue counter'
    });

    self.register_setting('modSubredditsFMod', {
        'type': 'boolean',
        'default': false,
        'advanced': false,
        'title': 'Use /f/mod/about/modqueue/ instead.'
    });

    self.register_setting('unmoderatedSubreddits', {
        'type': 'text',
        'default': 'mod',
        'advanced': false,
        'title': 'Multireddit of subs you want displayed in the unmoderated counter'
    });

    self.register_setting('unmoderatedSubredditsFMod', {
        'type': 'boolean',
        'default': false,
        'advanced': false,
        'title': 'Use /f/mod/about/unmoderated/ instead.'
    });

    self.register_setting('modmailSubreddits', {
        'type': 'text',
        'default': 'mod',
        'advanced': false,
        'hidden': self.setting('modmailSubredditsFromPro'),
        'title': 'Multireddit of subs you want displayed in the modmail counter'
    });

    self.register_setting('modmailSubredditsFromPro', {
        'type': 'boolean',
        'default': false,
        'advanced': true,
        'title': 'Use filtered subreddits from ModMail Pro'
    });

    self.register_setting('messageNotifications', {
        'type': 'boolean',
        'default': true,
        'title': 'Get notifications for new messages'
    });

    self.register_setting('messageNotificationSound', {
        'type': 'boolean',
        'default': false,
        'title': "You've got mail."
    });

    self.register_setting('sampleSound', {
        'type': 'action',
        'title': 'sample sound',
        'class': 'tb-sample-sound',
        'event': TB.utils.events.TB_SAMPLE_SOUND
    });

    self.register_setting('messageUnreadLink', {
        'type': 'boolean',
        'default': false,
        'title': 'Link to /message/unread/ if unread messages are present'
    });

    self.register_setting('modmailNotifications', {
        'type': 'boolean',
        'default': true,
        'title': 'Get modmail notifications'
    });
    self.register_setting('modmailUnreadLink', {
        'type': 'boolean',
        'default': false,
        'title': 'Link to /message/moderator/unread/ if unread modmail is present'
    });

    self.register_setting('straightToInbox', {
        'type': 'boolean',
        'default': false,
        'advanced': true,
        'title': 'When clicking a comment notification go to the inbox'
    });

    self.register_setting('consolidatedMessages', {
        'type': 'boolean',
        'default': true,
        'advanced': true,
        'title': 'Consolidate notifications (x new messages) instead of individual notifications'
    });

    // Do we want queue notifications?

    self.register_setting('modNotifications', {
        'type': 'boolean',
        'default': true,
        'title': 'Get modqueue notifications'
    });

    self.register_setting('unmoderatedNotifications', {
        'type': 'boolean',
        'default': false,
        'title': 'Get unmoderated queue notifications'
    });

    self.register_setting('checkInterval', {
        'type': 'number',
        'default': 1, // 60 secs.
        'advanced': true,
        'title': 'Interval to check for new items (time in minutes).'
    });

    self.register_setting('wwwNotifications', {
        'type': 'boolean',
        'default': true,
        'title': 'Only check for notifications on www.reddit.com (prevents duplicate notifications)'
    });

    self.register_setting('customModmailIcon', {
        'type': 'boolean',
        'default': false,
        'title': 'Use custom modmail icon'
    });

    /// Private storage settings.
    self.register_setting('unreadMessageCount', {
        'type': 'number',
        'default': 0,
        'hidden': true
    });
    self.register_setting('modqueueCount', {
        'type': 'number',
        'default': 0,
        'hidden': true
    });
    self.register_setting('unmoderatedCount', {
        'type': 'number',
        'default': 0,
        'hidden': true
    });
    self.register_setting('modmailCount', {
        'type': 'number',
        'default': 0,
        'hidden': true
    });
    self.register_setting('newModmailCount', {
        'type': 'number',
        'default': 0,
        'hidden': true
    });

    self.register_setting('newModmailCategoryCount', {
        'type': 'JSON',
        'default': {highlighted: 0, notifications: 0, archived: 0, new: 0, inprogress: 0, mod: 0},
        'hidden': true
    });

    self.register_setting('lastChecked', {
        'type': 'number',
        'default': -1,
        'hidden': true
    });
    self.register_setting('lastSeenUnmoderated', {
        'type': 'number',
        'default': -1,
        'hidden': true
    });
    self.register_setting('lastSeenModmail', {
        'type': 'number',
        'default': -1,
        'hidden': true
    });
    self.register_setting('unreadPushed', {
        'type': 'array',
        'default': [],
        'hidden': true
    });
    self.register_setting('modqueuePushed', {
        'type': 'array',
        'default': [],
        'hidden': true
    });


    self.init = function () {

        var NOTIFICATION_SOUND = 'https://raw.githubusercontent.com/creesch/reddit-moderator-toolbox/gh-pages/audio/mail.mp3',

            wwwNotifications = self.setting('wwwNotifications'),
            modNotifications = self.setting('modNotifications'),
            messageNotifications = self.setting('messageNotifications'),
            messageNotificationSound = self.setting('messageNotificationSound'),
            modmailNotifications = self.setting('modmailNotifications'),
            unmoderatedNotifications = self.setting('unmoderatedNotifications'),
            consolidatedMessages = self.setting('consolidatedMessages'),
            straightToInbox = self.setting('straightToInbox'),
            modSubreddits = self.setting('modSubreddits'),
            modSubredditsFMod = self.setting('modSubredditsFMod'),
            unmoderatedSubreddits = self.setting('unmoderatedSubreddits'),
            unmoderatedSubredditsFMod = self.setting('unmoderatedSubredditsFMod'),
            modmailSubreddits = self.setting('modmailSubreddits'),
            customModmailIcon = self.setting('customModmailIcon'),

            modmailSubredditsFromPro = self.setting('modmailSubredditsFromPro'),

            modmailFilteredSubreddits = modmailSubreddits,  //wat?
            unmoderatedOn = TB.storage.getSetting('Modbar', 'unmoderatedon', true), //why? RE: because people sometimes don't use unmoderated and we included this a long time per request.

            messageunreadlink = self.setting('messageUnreadLink'),
            modmailunreadlink = self.setting('modmailUnreadLink'),
            modmailCustomLimit = TB.storage.getSetting('ModMail', 'customLimit', 0),

            checkInterval = TB.utils.minutesToMilliseconds(self.setting('checkInterval')),//setting is in seconds, convert to milliseconds.
            newLoad = true,
            now = new Date().getTime(),
            unreadMessageCount = self.setting('unreadMessageCount'),
            modqueueCount = self.setting('modqueueCount'),
            unmoderatedCount = self.setting('unmoderatedCount'),
            modmailCount = self.setting('modmailCount'),
            newModmailCount = self.setting('newModmailCount'),
            newModmailCategoryCount = self.setting('newModmailCategoryCount'),

            messageunreadurl = `${TBUtils.baseDomain}/message/inbox/`,
            modmailunreadurl = `${TBUtils.baseDomain}/message/moderator/`,
            $body = $('body'),
            activeNewMMcheck = false;

        // Use custom modmail icons if applicable
        if(customModmailIcon) {
            var $modmail = $('#modmail'),
                $tb_modmail = $('#tb-modmail');

            $modmail.addClass('custom');
            $tb_modmail.addClass('custom');
        }


        // use filter subs from MMP, if appropriate
        if (modmailSubredditsFromPro) {
            modmailFilteredSubreddits = 'mod';
            if (TB.storage.getSetting('ModMail', 'filteredsubs', []).length > 0) {
                modmailFilteredSubreddits += `-${TB.storage.getSetting('ModMail', 'filteredsubs', []).join('-')}`;
            }
        }

        if (messageunreadlink) {
            messageunreadurl = '/message/unread/';
        }

        // this is a placeholder from issue #217
        // TODO: provide an option for this once we fix modmailpro filtering
        if (modmailunreadlink) {
        // modmailunreadurl = '/r/' + modmailFilteredSubreddits + '/message/moderator/unread';
            modmailunreadurl += 'unread/';
        }

        if (modmailCustomLimit > 0) {
            modmailunreadurl += `?limit=${modmailCustomLimit}`;
        }

        //
        // Counters and notifications
        //

        // Mark all modmail messages read when visiting a modmail related page. This is done outside the function since it only has to run on page load when the page is modmail related.
        // If it was part of the function it would fail to show notifications when the user multiple tabs open and the script runs in a modmail tab.
        if (TBUtils.isModmailUnread || TBUtils.isModmail) {
            self.log('clearing all unread stuff');

            // We have nothing unread if we're on the mod mail page.
            self.setting('lastSeenModmail', now);
            self.setting('modmailCount', 0);

            $.getJSON(`${TBUtils.baseDomain}/r/${modmailFilteredSubreddits}/message/moderator/unread.json`).done(function (json) {
                $.each(json.data.children, function (i, value) {

                    var unreadmessageid = value.data.name;

                    TBUtils.markMessageRead(unreadmessageid, function () {
                    //Insert useful error handling here
                    });
                });
            });
        }


        TB.utils.catchEvent(TB.utils.events.TB_SAMPLE_SOUND, function () {
            self.log('playing sound');

            var audio = new Audio(NOTIFICATION_SOUND);
            audio.play();
        });

        function updateMessagesCount(count) {
            var $mail = $('#mail'),
                $mailCount = $('#mailCount'),
                $mailcount = $('#mailcount'),
                $tb_mail = $('#tb-mail'),
                $tb_mailCount = $('#tb-mailCount');
            if (count < 1) {
                $mailCount.empty();
                $mail.attr('class', 'nohavemail');
                $mail.attr('title', 'no new mail!');
                $mail.attr('href', `${TBUtils.baseDomain}/message/inbox/`);
                $mailcount.attr('href', messageunreadurl);
                $tb_mail.attr('class', 'nohavemail');
                $tb_mail.attr('title', 'no new mail!');
                $tb_mail.attr('href', `${TBUtils.baseDomain}/message/inbox/`);
                $('#tb-mailCount').attr('href', `${TBUtils.baseDomain}/message/inbox/`);
            } else {
                $mail.attr('class', 'havemail');
                $mail.attr('title', 'new mail!');
                $mail.attr('href', messageunreadurl);
                $mailcount.attr('href', messageunreadurl);
                $tb_mail.attr('class', 'havemail');
                $tb_mail.attr('title', 'new mail!');
                $tb_mail.attr('href', messageunreadurl);
                $tb_mailCount.attr('href', messageunreadurl);
            }
            $tb_mailCount.text(`[${count}]`);

            if (count > 0) {
                $('#mailCount').text(`[${count}]`);
            }
        }

        function updateModqueueCount(count) {
            $('#tb-queueCount').text(`[${count}]`);
        }

        function updateUnmodCount(count) {
            $('#tb-unmoderatedcount').text(`[${count}]`);
        }

        // Ok this mess needs more commenting because otherwise we'll keep mixing things up.
        function updateModMailCount(count) {
        // $modmail is native to reddit $tb_modmail in the modbar.
            var $modmail = $('#modmail'),
                $tb_modmail = $('#tb-modmail'),
                $tbModmailCount = $('#tb-modmailcount');

            // Determine if we need to point to a filtered inbox.
            if (modmailFilteredSubreddits !== 'mod') {
                var modmailHrefAttr = `/r/${modmailFilteredSubreddits}/message/moderator/`;
                if (modmailCustomLimit > 0) {
                    modmailHrefAttr = `${modmailHrefAttr}?limit=${modmailCustomLimit}`;
                }

                $tb_modmail.attr('href', modmailHrefAttr);
                $modmail.attr('href', modmailHrefAttr);
                $tbModmailCount.attr('href', modmailHrefAttr);
            }

            if (count < 1) {

            // We are doing it like this to preserve other classes
                $tb_modmail.removeClass('havemail');
                $tb_modmail.addClass('nohavemail');
                $tb_modmail.attr('title', 'no new mail!');
            } else {
            // We are doing it like this to preserve other classes
                $modmail.removeClass('nohavemail');
                $modmail.addClass('havemail');

                $modmail.attr('title', 'new mail!');
                $modmail.attr('href', modmailunreadurl);

                // We are doing it like this to preserve other classes
                $tb_modmail.removeClass('nohavemail');
                $tb_modmail.addClass('havemail');
                $tb_modmail.attr('title', 'new mail!');

            }
            $('#tb-modmailcount').text(`[${count}]`);
        }

        function updateNewModmailSidebar($sidebarItem, count) {
            if(count > 0) {
                $sidebarItem.append(`<div class="SidebarNav__count">${count}</div>`);
            } else {
                $sidebarItem.find('.SidebarNav__count').remove();
            }
        }
        // Here we update the count for new modmail. Is somewhat simpler than old modmail.
        function updateNewModMailCount(count, data) {

            // $modmail is native to reddit $tb_modmail in the modbar.
            let $newmodmail = $('#new_modmail'),
                $tbNewModmail = $('#tb-new_modmail'),
                $tbNewModmailCount = $('#tb-new-modmailcount'),
                $tbNewModmailTooltip = $('#tb-new-modmail-tooltip');

            if (count < 1) {

            // We are doing it like this to preserve other classes
                $newmodmail.removeClass('havemail');
                $tbNewModmail.removeClass('havemail');
                $newmodmail.addClass('nohavemail');
                $tbNewModmail.addClass('nohavemail');

                $newmodmail.attr('title', 'no new mod mail!');

            } else {
            // We are doing it like this to preserve other classes
                $newmodmail.removeClass('nohavemail');
                $newmodmail.addClass('havemail');
                $newmodmail.attr('title', 'new mod mail!');

                // We are doing it like this to preserve other classes
                $tbNewModmail.removeClass('nohavemail');
                $tbNewModmail.addClass('havemail');


            }
            $tbNewModmailTooltip.find('#tb-new-modmail-new .tb-new-mm-count').text(data.new);
            $tbNewModmailTooltip.find('#tb-new-modmail-inprogress .tb-new-mm-count').text(data.inprogress);
            $tbNewModmailTooltip.find('#tb-new-modmail-highlighted .tb-new-mm-count').text(data.highlighted);
            $tbNewModmailTooltip.find('#tb-new-modmail-mod .tb-new-mm-count').text(data.mod);
            $tbNewModmailTooltip.find('#tb-new-modmail-notifications .tb-new-mm-count').text(data.notifications);

            $tbNewModmailCount.text(`[${count}]`);
        }



        function updateAllTabs() {
            self.log('updating all counters accross tabs');
            chrome.runtime.sendMessage({
                action: 'tb-global',
                globalEvent: TBUtils.TB_UPDATE_COUNTERS,
                payload: {
                    unreadMessageCount : self.setting('unreadMessageCount'),
                    modqueueCount : self.setting('modqueueCount'),
                    unmoderatedCount : self.setting('unmoderatedCount'),
                    modmailCount : self.setting('modmailCount'),
                    newModmailCount : self.setting('newModmailCount'),
                    newModmailCategoryCount : self.setting('newModmailCategoryCount')
                }
            });
        }

        function newModMailCheck() {
            if(!activeNewMMcheck) {
                activeNewMMcheck = true;
                setTimeout(function () {
                    TBUtils.apiOauthGET('api/mod/conversations/unread/count').then(function(response) {
                        let data = response.data;
                        let modmailFreshCount = data.highlighted + data.notifications + data.archived + data.new + data.inprogress + data.mod;
                        self.setting('newModmailCount', modmailFreshCount);
                        self.setting('newModmailCategoryCount', data);

                        updateNewModMailCount(modmailFreshCount, data);
                        updateAllTabs();
                        activeNewMMcheck = false;

                    }).catch(function(error) {
                        self.log(error.jqXHR.responseText);
                        activeNewMMcheck = false;
                    });
                }, 500);
            }
        }

        // New Modmail actions.
        // Whenever something is clicked that potentially changes the modmail count
        if(TBUtils.isNewModmail) {

            // Since this is a non ww domain counts will never be checked through the regular getMessages() function.
            // So we do a check here.
            newModMailCheck();

            $body.on('click', '.ThreadPreviewViewer__thread:not(.m-read), .ThreadPreviewViewerHeader__button, .ThreadPreview__headerLeft .ThreadPreview__control, .ThreadViewerHeader__right', function() {
                self.log('Checking modmail count based on click on specific element.');
                newModMailCheck();


            });
        }


        window.addEventListener(TBUtils.TB_UPDATE_COUNTERS, function(event){
            self.log('updating counters from background');
            updateMessagesCount(event.detail.unreadMessageCount);
            updateModqueueCount(event.detail.modqueueCount);
            updateUnmodCount(event.detail.unmoderatedCount);
            updateModMailCount(event.detail.modmailCount);
            updateNewModMailCount(event.detail.newModmailCount, event.detail.newModmailCategoryCount);
        });

        function getmessages() {
            self.log('getting messages');

            // get some of the variables again, since we need to determine if there are new messages to display and counters to update.
            var lastchecked = self.setting('lastChecked');

            // Update now.
            now = TB.utils.getTime();

            // Update counters.
            unreadMessageCount = self.setting('unreadMessageCount');
            modqueueCount = self.setting('modqueueCount');
            unmoderatedCount = self.setting('unmoderatedCount');
            modmailCount = self.setting('modmailCount');
            newModmailCount = self.setting('newModmailCount');
            newModmailCategoryCount = self.setting('newModmailCategoryCount');
            //
            // Update methods
            //



            if (!newLoad && (now - lastchecked) < checkInterval) {
                updateMessagesCount(unreadMessageCount);
                updateModqueueCount(modqueueCount);
                updateUnmodCount(unmoderatedCount);
                updateModMailCount(modmailCount);
                updateNewModMailCount(newModmailCount, newModmailCategoryCount);
                return;
            }


            // We still want counts updated, just no notifications shown.
            // That's why we do this here.
            if (wwwNotifications && TB.utils.domain !== 'www') {  //It's intentional that we don't also check for mod.reddit, here.  That would still cause dup messages.
                self.log("non-www domain; don't show notifications");
                updateMessagesCount(unreadMessageCount);
                updateModqueueCount(modqueueCount);
                updateUnmodCount(unmoderatedCount);
                updateModMailCount(modmailCount);
                updateNewModMailCount(newModmailCount, newModmailCategoryCount);
                return;
            }

            newLoad = false;

            // We'll use this to determine if we are done with all counters and want to send a message to the background page telling all other tabs to update.
            let updateCounters = unmoderatedOn ? 5 : 4;


            //$.log('updating totals');
            // We're checking now.
            self.setting('lastChecked', now);

            //
            // Messages
            //
            // The reddit api is silly sometimes, we want the title or reported comments and there is no easy way to get it, so here it goes:
            // a silly function to get the title anyway. The $.getJSON is wrapped in a function to prevent if from running async outside the loop.

            function getcommentitle(unreadsubreddit, unreadcontexturl, unreadcontext, unreadauthor, unreadbody_html, unreadcommentid) {
                $.getJSON(TBUtils.baseDomain + unreadcontexturl).done(function (jsondata) {
                    var commenttitle = jsondata[0].data.children[0].data.title;
                    if (straightToInbox && messageunreadlink) {
                        TBUtils.notification(`Reply from: ${unreadauthor} in:  ${unreadsubreddit}: ${commenttitle.substr(0, 20)}\u2026`, $(unreadbody_html).text(), '/message/unread/');
                    } else if (straightToInbox) {
                        TBUtils.notification(`Reply from: ${unreadauthor} in:  ${unreadsubreddit}: ${commenttitle.substr(0, 20)}\u2026`, $(unreadbody_html).text(), '/message/inbox/');
                    } else {
                        TBUtils.notification(`Reply from: ${unreadauthor} in:  ${unreadsubreddit}: ${commenttitle.substr(0, 20)}\u2026`, $(unreadbody_html).text(), unreadcontext, unreadcommentid);
                    }
                });
            }

            // getting unread messages
            $.getJSON(`${TBUtils.baseDomain}/message/unread.json`).done(function (json) {
                var count = json.data.children.length || 0;
                self.setting('unreadMessageCount', count);
                updateMessagesCount(count);

                // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
                updateCounters--;
                if (updateCounters === 0) {
                    updateAllTabs();
                }

                if (count === 0) return;
                // Are we allowed to show a popup?
                if (messageNotifications && count > unreadMessageCount) {

                // set up an array in which we will load the last 100 messages that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                    var pushedunread = self.setting('unreadPushed');
                    //$.log(consolidatedMessages);
                    if (consolidatedMessages) {
                        var notificationbody, messagecount = 0;
                        $.each(json.data.children, function (i, value) {
                            var subreddit,
                                subject,
                                author;
                            if ($.inArray(value.data.name, pushedunread) == -1 && value.kind == 't1') {
                                subreddit = value.data.subreddit,
                                author = value.data.author;

                                if (!notificationbody) {
                                    notificationbody = `reply from: ${author}. in: ${subreddit}\n`;
                                } else {
                                    notificationbody = `${notificationbody}reply from: ${author}. in: ${subreddit}\n`;
                                }
                                messagecount++;
                                pushedunread.push(value.data.name);
                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block
                            } else if ($.inArray(value.data.name, pushedunread) == -1) {
                                subject = value.data.subject,
                                author = value.data.author;

                                //When the JSON doesn't return an author, but has a subreddit instead, assume it's a PM
                                //from a subreddit
                                if(!author && value.data.subreddit != null) {
                                    author = value.data.subreddit;
                                }

                                if (!notificationbody) {
                                    notificationbody = `pm from: ${author} - ${subject}\n`;
                                } else {
                                    notificationbody = `${notificationbody}pm from: ${author} - ${subject}\n`;
                                }
                                messagecount++;
                                pushedunread.push(value.data.name);
                            }
                        });

                        function youveGotMail() {
                            if (messageNotificationSound) {
                                var audio = new Audio(NOTIFICATION_SOUND);
                                audio.play();
                            }
                        }

                        //$.log(messagecount);
                        //$.log(notificationbody);
                        if (messagecount === 1) {
                            TBUtils.notification('One new message!', notificationbody, messageunreadurl);
                            youveGotMail();

                        } else if (messagecount > 1) {
                            TBUtils.notification(`${messagecount.toString()} new messages!`, notificationbody, messageunreadurl);
                            youveGotMail();
                        }

                    } else {
                        $.each(json.data.children, function (i, value) {
                            var context,
                                body_html,
                                author,
                                subreddit,
                                commentid,
                                contexturl,
                                subject,
                                id;


                            if ($.inArray(value.data.name, pushedunread) == -1 && value.kind == 't1') {

                                context = value.data.context,
                                body_html = TBUtils.htmlDecode(value.data.body_html),
                                author = value.data.author,
                                subreddit = value.data.subreddit,
                                commentid = value.data.name,
                                contexturl = `${context.slice(0, -10)}.json`;

                                getcommentitle(subreddit, contexturl, context, author, body_html, commentid);
                                pushedunread.push(value.data.name);

                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block
                            } else if ($.inArray(value.data.name, pushedunread) == -1) {
                                author = value.data.author,
                                body_html = TBUtils.htmlDecode(value.data.body_html),
                                subject = value.data.subject,
                                id = value.data.id;

                                //When the JSON doesn't return an author, but has a subreddit instead, assume it's a PM
                                //from a subreddit
                                if(!author && value.data.subreddit != null) {
                                    author = value.data.subreddit;
                                }

                                TBUtils.notification(`New message: ${subject}`, `${$(body_html).text()}\u2026 \n \n from: ${author}`, `/message/messages/${id}`);
                                pushedunread.push(value.data.name);
                            }
                        });
                    }
                    if (pushedunread.length > 100) {
                        pushedunread.splice(0, 100 - pushedunread.length);
                    }
                    self.setting('unreadPushed', pushedunread);
                }
            });


            //
            // Modqueue
            //
            // wrapper around $.getJSON so it can be part of a loop
            function procesmqcomments(mqlinkid, mqreportauthor, mqidname) {
                $.getJSON(TBUtils.baseDomain + mqlinkid).done(function (jsondata) {
                    var infopermalink = jsondata.data.children[0].data.permalink,
                        infotitle = jsondata.data.children[0].data.title,
                        infosubreddit = jsondata.data.children[0].data.subreddit;
                    infopermalink = infopermalink + mqidname.substring(3);
                    TBUtils.notification(`Modqueue - /r/${infosubreddit} - comment: `, `${mqreportauthor}'s comment in: ${infotitle}`, `${infopermalink}?context=3`);
                });
            }

            // getting modqueue
            var modQueueURL;
            if (modSubredditsFMod) {
                modQueueURL = '/me/f/mod/about/modqueue';
            } else {
                modQueueURL = `/r/${modSubreddits}/about/modqueue`;
            }

            $.getJSON(`${TBUtils.baseDomain + modQueueURL}.json?limit=100`).done(function (json) {
                var count = json.data.children.length || 0;
                updateModqueueCount(count);

                // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
                updateCounters--;
                if (updateCounters === 0) {
                    updateAllTabs();
                }
                //$.log(modNotifications);
                if (modNotifications && count > modqueueCount) {
                // Ok let's have a look and see if there are actually new items to display
                //$.log('test');
                // set up an array in which we will load the last 100 items that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                    var pusheditems = self.setting('modqueuePushed');
                    //$.log(consolidatedMessages);
                    if (consolidatedMessages) {
                    //$.log('here we go!');
                        var notificationbody, queuecount = 0, xmoreModqueue = 0;
                        $.each(json.data.children, function (i, value) {
                            var subreddit,
                                author;

                            if ($.inArray(value.data.name, pusheditems) == -1 && value.kind == 't3') {
                                subreddit = value.data.subreddit,
                                author = value.data.author;

                                if (!notificationbody) {
                                    notificationbody = `post from: ${author}, in: ${subreddit}\n`;
                                } else if (queuecount <= 6) {
                                    notificationbody += `post from: ${author}, in: ${subreddit}\n`;
                                } else if (queuecount > 6) {
                                    xmoreModqueue++;
                                }

                                queuecount++;
                                pusheditems.push(value.data.name);
                            } else if ($.inArray(value.data.name, pusheditems) == -1) {
                                subreddit = value.data.subreddit,
                                author = value.data.author;

                                if (!notificationbody) {
                                    notificationbody = `comment from: ${author}, in: ${subreddit}\n`;
                                } else if (queuecount <= 6) {
                                    notificationbody = `${notificationbody}comment from: ${author}, in: ${subreddit}\n`;
                                } else if (queuecount > 6) {
                                    xmoreModqueue++;
                                }
                                queuecount++;
                                pusheditems.push(value.data.name);
                            }
                        });

                        if (xmoreModqueue > 0) {
                            notificationbody = `${notificationbody}\n and: ${xmoreModqueue.toString()} more items \n`;
                        }
                        //$.log(queuecount);
                        //$.log(notificationbody);
                        if (queuecount === 1) {
                            TBUtils.notification('One new modqueue item!', notificationbody, modQueueURL);

                        } else if (queuecount > 1) {
                            TBUtils.notification(`${queuecount.toString()} new modqueue items!`, notificationbody, modQueueURL);
                        }

                    } else {

                        $.each(json.data.children, function (i, value) {
                            if ($.inArray(value.data.name, pusheditems) == -1 && value.kind == 't3') {

                                var mqpermalink = value.data.permalink,
                                    mqtitle = value.data.title,
                                    mqauthor = value.data.author,
                                    mqsubreddit = value.data.subreddit;

                                TBUtils.notification(`Modqueue: /r/${mqsubreddit} - post`, `${mqtitle} By: ${mqauthor}`, mqpermalink);
                                pusheditems.push(value.data.name);
                            } else if ($.inArray(value.data.name, pusheditems) == -1) {
                                var reportauthor = value.data.author,
                                    idname = value.data.name,
                                    linkid = `/api/info.json?id=${value.data.link_id}`;

                                //since we want to add some adition details to this we call the previous declared function
                                procesmqcomments(linkid, reportauthor, idname);
                                pusheditems.push(value.data.name);
                            }
                        });

                    }
                    if (pusheditems.length > 100) {
                        pusheditems.splice(0, 100 - pusheditems.length);
                    }
                    self.setting('modqueuePushed', pusheditems);


                }
                self.setting('modqueueCount', count);
            });

            //
            // Unmoderated
            //
            // getting unmoderated queue
            if (unmoderatedOn || unmoderatedNotifications) {

                var unModeratedURL;
                if (unmoderatedSubredditsFMod) {
                    unModeratedURL = '/me/f/mod/about/unmoderated';
                } else {
                    unModeratedURL = `/r/${unmoderatedSubreddits}/about/unmoderated`;
                }

                $.getJSON(`${TBUtils.baseDomain + unModeratedURL}.json?limit=100`).done(function (json) {
                    var count = json.data.children.length || 0;


                    if (unmoderatedNotifications && count > unmoderatedCount) {
                        var lastSeen = self.setting('lastSeenUnmoderated');

                        if (consolidatedMessages) {
                            var notificationbody, queuecount = 0, xmoreUnmod = 0;

                            $.each(json.data.children, function (i, value) {
                                if (!lastSeen || value.data.created_utc * 1000 > lastSeen) {
                                    var subreddit = value.data.subreddit,
                                        author = value.data.author;

                                    if (!notificationbody) {
                                        notificationbody = `post from: ${author}, in: ${subreddit}\n`;
                                    } else if (queuecount <= 6) {
                                        notificationbody += `post from: ${author}, in: ${subreddit}\n`;
                                    } else if (queuecount > 6) {
                                        xmoreUnmod++;
                                    }

                                    queuecount++;
                                }
                            });

                            if (xmoreUnmod > 0) {
                                notificationbody = `${notificationbody}\n and: ${xmoreUnmod.toString()} more items\n`;
                            }

                            if (queuecount === 1) {
                                TBUtils.notification('One new unmoderated item!', notificationbody, unModeratedURL);
                            } else {
                                TBUtils.notification(`${queuecount.toString()} new unmoderated items!`, notificationbody, unModeratedURL);
                            }
                        } else {
                            $.each(json.data.children, function (i, value) {
                                if (!lastSeen || value.data.created_utc * 1000 > lastSeen) {
                                    var uqpermalink = value.data.permalink,
                                        uqtitle = value.data.title,
                                        uqauthor = value.data.author,
                                        uqsubreddit = value.data.subreddit;

                                    TBUtils.notification(`Unmoderated: /r/${uqsubreddit} - post`, `${uqtitle} By: ${uqauthor}`, uqpermalink);
                                }
                            });
                        }

                        self.setting('lastSeenUnmoderated', now);
                    }

                    self.setting('unmoderatedCount', count);

                    if (unmoderatedOn) {
                        updateUnmodCount(count);

                        // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
                        updateCounters--;
                        if (updateCounters === 0) {
                            updateAllTabs();
                        }
                    }
                });
            }

            //
            // Modmail
            //
            // getting unread modmail, will not show replies because... well the api sucks in that regard.
            $.getJSON(`${TBUtils.baseDomain}/r/${modmailFilteredSubreddits}/message/moderator.json`).done(function (json) {

                var count = json.data.children.length || 0;
                if (count === 0) {
                    self.setting('modmailCount', count);
                    updateModMailCount(count);

                    // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
                    updateCounters--;
                    if (updateCounters === 0) {
                        updateAllTabs();
                    }
                    return;
                }

                var lastSeen = self.setting('lastSeenModmail'),
                    newIdx = '',
                    newCount = 0;

                for (var i = 0; i < json.data.children.length; i++) {
                    var messageTime = json.data.children[i].data.created_utc * 1000,
                        messageAuthor = json.data.children[i].data.author;

                    var isInviteSpam = false;
                    if (TB.storage.getSetting('ModMail', 'hideinvitespam', false) && (json.data.children[i].data.subject == 'moderator invited' || json.data.children[i].data.subject == 'moderator added')) {
                        isInviteSpam = true;
                    }

                    if ((!lastSeen || messageTime > lastSeen) && messageAuthor !== TBUtils.logged && !isInviteSpam) {
                        newCount++;
                        if (!newIdx) {
                            newIdx = i;
                        }
                    }
                }

                if (modmailNotifications && newCount > 0 && newCount !== modmailCount) {  // Don't show the message twice.
                    var notificationbody, messagecount = 0, xmoreModMail = 0;

                    if (consolidatedMessages || newCount > 5) {

                        $.each(json.data.children, function (i, value) {

                            var isInviteSpam = false;
                            if (TB.storage.getSetting('ModMail', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
                                isInviteSpam = true;
                            }

                            var subreddit = value.data.subreddit,
                                author = value.data.author;

                            // Prevent changing the message body, since this loops through all messages, again.
                            // In all honesty, all of this needs to be rewriten...
                            if (author !== TBUtils.logged && !isInviteSpam) {
                                messagecount++;
                                if (messagecount > newCount) return false;

                                if (!notificationbody) {
                                    notificationbody = `from: ${author}, in: ${subreddit}\n`;
                                } else if (messagecount <= 6) {
                                    notificationbody = `${notificationbody}from: ${author}, in: ${subreddit}\n`;
                                } else if (messagecount > 6) {
                                    xmoreModMail++;
                                }
                            }
                        });

                        if (newCount === 1) {
                            TBUtils.notification('One new modmail!', notificationbody, modmailunreadurl);

                        } else if (newCount > 1) {
                            if (xmoreModMail > 0) {
                                notificationbody = `${notificationbody}\n and: ${xmoreModMail.toString()} more \n`;
                            }
                            TBUtils.notification(`${newCount.toString()} new modmail!`, notificationbody, modmailunreadurl);
                        }
                    } else {
                        $.each(json.data.children, function (i, value) {

                            var isInviteSpam = false;
                            if (TB.storage.getSetting('ModMail', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
                                isInviteSpam = true;
                            }

                            var author = value.data.author;

                            if (author !== TBUtils.logged && !isInviteSpam) {
                            // Sending 100 messages, since this loops through all messages, again.
                            // In all honesty, all of this needs to be rewriten...
                                messagecount++;
                                if (messagecount > newCount) return false;

                                var modmailbody = TBUtils.htmlDecode(value.data.body_html),
                                    modmailsubject = value.data.subject,
                                    modmailsubreddit = value.data.subreddit,
                                    modmailpermalink = value.data.id;

                                TBUtils.notification(`Modmail: /r/${modmailsubreddit} : ${modmailsubject}`, $(modmailbody).text(), `/message/messages/${modmailpermalink}`);
                            }
                        });

                    }
                }

                self.setting('modmailCount', newCount);
                updateModMailCount(newCount);

                // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
                updateCounters--;
                if (updateCounters === 0) {
                    updateAllTabs();
                }

            });

            //
            // New modmail
            //
            TBUtils.apiOauthGET('api/mod/conversations/unread/count').then(function(response) {
                let data = response.data;
                let modmailFreshCount = data.highlighted + data.notifications + data.archived + data.new + data.inprogress + data.mod;
                self.setting('newModmailCount', modmailFreshCount);
                self.setting('newModmailCategoryCount', data);
                updateNewModMailCount(modmailFreshCount, data);

                // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
                updateCounters--;
                if (updateCounters === 0) {
                    updateAllTabs();
                }
            }).catch(function(error) {
                self.log(error.jqXHR.responseText);
            });

        }

        setInterval(getmessages, checkInterval);

        getmessages();
    // Because firefox is "special" we wait a tiny bit and try again.



    };

    TB.register_module(self);
} // notifier() wrapper

(function () {
    window.addEventListener('TBModuleLoaded', function () {
        notifiermod();
    });
})();
