function notifiermod() {

var notifierMod = new TB.Module('Notifier');

notifierMod.settings["enabled"]["default"] = true;
notifierMod.config["betamode"] = false;
notifierMod.config["needs_mod_subs"] = true;


// First show the options for filtering of subreddits.
notifierMod.register_setting("modsubreddits", {
    "type": "text",
    "default": 'mod',
    "title": "Multireddit of subs you want displayed in the modqueue counter"
});

notifierMod.register_setting("unmoderatedsubreddits", {
    "type": "text",
    "default": "mod",
    "title": "Multireddit of subs you want displayed in the unmoderated counter"
});


notifierMod.register_setting("modmailsubreddits", {
    "type": "text",
    "default": 'mod',
    "hidden": notifierMod.setting('modmailsubredditsfrompro'),
    "title": "Multireddit of subs you want displayed in the modmail counter"
});

notifierMod.register_setting("modmailsubredditsfrompro", {
    "type": "boolean",
    "default": false,
    "title": "Use filtered subreddits from ModMail Pro"
});


// Do we want to show an icon for unmoderated?

notifierMod.register_setting("unmoderatedon", {
    "type": "boolean",
    "default": true,
    "title": "Show icon for unmoderated"
});

// Do we want notifications and where do they link to?

notifierMod.register_setting("messagenotifications", {
    "type": "boolean",
    "default": true,
    "title": "Get notifications for new messages"
});

notifierMod.register_setting("messageunreadlink", {
    "type": "boolean",
    "default": false,
    "title": "Link to /message/unread/ if unread messages are present"
});

notifierMod.register_setting("modmailnotifications", {
    "type": "boolean",
    "default": true,
    "title": "Get modmail notifications"
});
notifierMod.register_setting("modmailunreadlink", {
    "type": "boolean",
    "default": false,
    "title": "Link to /message/moderator/unread/ if unread modmail is present"
});

notifierMod.register_setting("straightToInbox", {
    "type": "boolean",
    "default": false,
    "title": "When clicking a comment notification go to the inbox"
});

notifierMod.register_setting("consolidatedmessages", {
    "type": "boolean",
    "default": false,
    "title": "Consolidate notifications (x new messages) instead of individual notifications"
});

// Do we want queue notifications?

notifierMod.register_setting("modnotifications", {
    "type": "boolean",
    "default": true,
    "title": "Get modqueue notifications"
});

notifierMod.register_setting("unmoderatednotifications", {
    "type": "boolean",
    "default": false,
    "title": "Get unmoderated queue notifications"
});

notifierMod.init = function notifierMod_init() {
    var $body = $('body');

    //
    // preload some generic variables
    //
    var modNotifications = TB.storage.getSetting('Notifier', 'modnotifications', true),  // these need to be converted to booleans.
        messageNotifications = TB.storage.getSetting('Notifier', 'messagenotifications', true), // these need to be converted to booleans.
        modmailNotifications = TB.storage.getSetting('Notifier', 'modmailnotifications', true),
        unmoderatedNotifications = TB.storage.getSetting('Notifier', 'unmoderatednotifications', false),
        consolidatedMessages = TB.storage.getSetting('Notifier', 'consolidatedmessages', true),
        straightToInbox = TB.storage.getSetting('Notifier', 'straightToInbox', false),
        modSubreddits = notifierMod.setting('modsubreddits'),
        unmoderatedSubreddits = notifierMod.setting('unmoderatedsubreddits'),
        modmailSubreddits = notifierMod.setting('modmailsubreddits'),

        modmailSubredditsFromPro = TB.storage.getSetting('Notifier', 'modmailsubredditsfrompro', false),

        modmailFilteredSubreddits = modmailSubreddits,  //wat?
        notifierEnabled = TB.storage.getSetting('Notifier', 'enabled', true),
        //shortcuts = TB.storage.getSetting('Notifier', 'shortcuts', '-'),
        //shortcuts2 = TB.storage.getSetting('Notifier', 'shortcuts2', {}),
        unmoderatedOn = TB.storage.getSetting('Notifier', 'unmoderatedon', true), //why? RE: because people sometimes don't use unmoderated and we included this a long time per request.
        //footer = $('.footer-parent'),

        //lockscroll = TB.storage.getSetting('Notifier', 'lockscroll', false),

        messageunreadlink = TB.storage.getSetting('Notifier', 'messageunreadlink', false),
        modmailunreadlink = TB.storage.getSetting('Notifier', 'modmailunreadlink', false);

    // private
    var checkInterval = TB.storage.getSetting('Notifier', 'checkinterval', 1 * 60 * 1000), //default to check every minute for new stuff.
        newLoad = true,
        now = new Date().getTime(),
        unreadMessageCount = TB.storage.getSetting('Notifier', 'unreadmessagecount', 0),
        modqueueCount = TB.storage.getSetting('Notifier', 'modqueuecount', 0),
        unmoderatedCount = TB.storage.getSetting('Notifier', 'unmoderatedcount', 0),
        modmailCount = TB.storage.getSetting('Notifier', 'modmailcount', 0);

    // use filter subs from MMP, if appropriate
    if (modmailSubredditsFromPro) {
        modmailFilteredSubreddits = 'mod';
        if (TB.storage.getSetting('ModMailPro', 'filteredsubs', []).length > 0) {
            modmailFilteredSubreddits += '-' + TB.storage.getSetting('ModMailPro', 'filteredsubs', []).join('-');
        }
    }

    // convert some settings values
    // TODO: add a fixer in the first run function for next release and drop this section
    if (modNotifications == 'on') {
        TB.storage.setSetting('Notifier', 'modnotifications', true);
        modNotifications = true;
    } else if (modNotifications == 'off') {
        TB.storage.setSetting('Notifier', 'modnotifications', false);
        modNotifications = false;
    }

    if (messageNotifications == 'on') {
        TB.storage.setSetting('Notifier', 'messagenotifications', true);
        messageNotifications = true;
    } else if (messageNotifications == 'off') {
        TB.storage.setSetting('Notifier', 'messagenotifications', true);
        messageNotifications = false;
    }

    if (messageunreadlink) {
        messageunreadurl = '/message/unread/';
    } else {
        messageunreadurl = '/message/inbox/';
    }

    // this is a placeholder from issue #217
    // TODO: provide an option for this once we fix modmailpro filtering
    modmailunreadurl = '/message/moderator/';
    if (modmailunreadlink) {
        // modmailunreadurl = '/r/' + modmailFilteredSubreddits + '/message/moderator/unread';
        modmailunreadurl += 'unread/';
    } else {
        // modmailunreadurl = '/r/' + modmailFilteredSubreddits + '/message/moderator/';
    }

    // cache settings.
    var shortLength = TB.storage.getCache('Notifier', 'shortlength', 15),
        longLength = TB.storage.getCache('Notifier', 'longlength', 45);


    //
    // UI elements

    // if mod counters are off we remove them. It used to be other way around but modbay.js sometimes isn't on page yet when this is fired.

    if (!unmoderatedOn) {
        $('#tb-toolbarcounters').find('#tb-unmoderated, #tb-unmoderatedcount').remove();
    }


    //
    // Counters and notifications
    //

    // Mark all modmail messages read when visiting a modmail related page. This is done outside the function since it only has to run on page load when the page is modmail related.
    // If it was part of the function it would fail to show notifications when the user multiple tabs open and the script runs in a modmail tab.
    if (TBUtils.isModmailUnread || TBUtils.isModmail) {
        $.log('clearing all unread stuff');

        // We have nothing unread if we're on the mod mail page.
        TB.storage.setSetting('Notifier', 'lastseenmodmail', now);
        modmailCount = TB.storage.setSetting('Notifier', 'modmailcount', 0);

        $.getJSON('/r/' + modmailFilteredSubreddits + '/message/moderator/unread.json').done(function (json) {
            $.each(json.data.children, function (i, value) {

                var unreadmessageid = value.data.name;

                TBUtils.markMessageRead(unreadmessageid, function() {
                    //Insert useful error handling here
                });
            });
        });
    }


    function getmessages() {
        // get some of the variables again, since we need to determine if there are new messages to display and counters to update.
        var lastchecked = TB.storage.getSetting('Notifier', 'lastchecked', -1),
            author = '',
            body_html = '';

        // Update now.
        now = new Date().getTime();


        // Update counters.
        unreadMessageCount = TB.storage.getSetting('Notifier', 'unreadmessagecount', 0);
        modqueueCount = TB.storage.getSetting('Notifier', 'modqueuecount', 0);
        unmoderatedCount = TB.storage.getSetting('Notifier', 'unmoderatedcount', 0);
        modmailCount = TB.storage.getSetting('Notifier', 'modmailcount', 0);

        //
        // Update methods
        //

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
                $mail.attr('href', '/message/inbox/');
                $mailcount.attr('href', messageunreadurl);
                $tb_mail.attr('class', 'nohavemail');
                $tb_mail.attr('title', 'no new mail!');
                $tb_mail.attr('href', '/message/inbox/');
                $('#tb-mailCount').attr('href', '/message/inbox/');
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
            $tb_mailCount.text('[' + count + ']');

            if (count > 0) {
                $('#mailCount').text('[' + count + ']');
            }
        }

        function updateModqueueCount(count) {
            $('#tb-queueCount').text('[' + count + ']');
        }

        function updateUnmodCount(count) {
            $('#tb-unmoderatedcount').text('[' + count + ']');
        }

        function updateModMailCount(count) {
            var $modmail = $('#modmail'),
                $tb_modmail = $('#tb-modmail');
            if (count < 1) {
                $tb_modmail.attr('class', 'nohavemail');
                $tb_modmail.attr('title', 'no new mail!');
                // $tb_modmail.attr('href', '/r/' + modmailFilteredSubreddits + '/message/moderator');
                $tb_modmail.attr('href', '/message/moderator');
            } else {
                $modmail.attr('class', 'havemail');
                $modmail.attr('title', 'new mail!');
                $modmail.attr('href', modmailunreadurl);
                $tb_modmail.attr('class', 'havemail');
                $tb_modmail.attr('title', 'new mail!');
                $tb_modmail.attr('href', modmailunreadurl);
            }
            $('#tb-modmailcount').text('[' + count + ']');
            // $tb_modmail.attr('href', '/message/moderator/');
        }

        if (!newLoad && (now - lastchecked) < checkInterval) {
            updateMessagesCount(unreadMessageCount);
            updateModqueueCount(modqueueCount);
            updateUnmodCount(unmoderatedCount);
            updateModMailCount(modmailCount);
            return;
        }

        newLoad = false;

        //$.log('updating totals');
        // We're checking now.
        TB.storage.setSetting('Notifier', 'lastchecked', now);

        //
        // Messages
        //
        // The reddit api is silly sometimes, we want the title or reported comments and there is no easy way to get it, so here it goes:
        // a silly function to get the title anyway. The $.getJSON is wrapped in a function to prevent if from running async outside the loop.

        function getcommentitle(unreadsubreddit, unreadcontexturl, unreadcontext, unreadauthor, unreadbody_html) {
            $.getJSON(unreadcontexturl).done(function (jsondata) {
                var commenttitle = jsondata[0].data.children[0].data.title;
                if (straightToInbox && messageunreadlink) {
                    TBUtils.notification('Reply from: ' + unreadauthor + ' in:  ' + unreadsubreddit + ': ' + commenttitle.substr(0, 20) + '\u2026', $(unreadbody_html).text(), '/message/unread/');
                } else if (straightToInbox) {
                    TBUtils.notification('Reply from: ' + unreadauthor + ' in:  ' + unreadsubreddit + ': ' + commenttitle.substr(0, 20) + '\u2026', $(unreadbody_html).text(), '/message/inbox/');
                } else {
                    TBUtils.notification('Reply from: ' + unreadauthor + ' in:  ' + unreadsubreddit + ': ' + commenttitle.substr(0, 20) + '\u2026', $(unreadbody_html).text(), unreadcontext);
                }
            });
        }

        // getting unread messages
        $.getJSON('/message/unread.json').done(function (json) {
            var count = json.data.children.length || 0;
            TB.storage.setSetting('Notifier', 'unreadmessagecount', count);
            updateMessagesCount(count);
            if (count === 0) return;
            // Are we allowed to show a popup?
            if (messageNotifications && count > unreadMessageCount) {


                // set up an array in which we will load the last 100 messages that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                var pushedunread = TB.storage.getSetting('Notifier', 'unreadpushed', []);
                //$.log(consolidatedMessages);
                if (consolidatedMessages) {
                    var notificationbody, messagecount = 0;
                    $.each(json.data.children, function (i, value) {


                        if ($.inArray(value.data.name, pushedunread) == -1 && value.kind == 't1') {
                            var subreddit = value.data.subreddit,
                                author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = 'reply from: ' + author + '. in:' + subreddit + '\n';
                            } else {
                                notificationbody = notificationbody + 'reply from: ' + author + '. in:' + subreddit + '\n';
                            }
                            messagecount++;
                            pushedunread.push(value.data.name);
                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block
                        } else if ($.inArray(value.data.name, pushedunread) == -1) {
                            var subject = value.data.subject,
                                author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = 'pm from: ' + author + ' - ' + subject + '\n';
                            } else {
                                notificationbody = notificationbody + 'pm from: ' + author + ' - ' + subject + '\n';
                            }
                            messagecount++;
                            pushedunread.push(value.data.name);
                        }
                    });


                    //$.log(messagecount);
                    //$.log(notificationbody);
                    if (messagecount === 1) {
                        TBUtils.notification('One new message!', notificationbody, messageunreadurl);

                    } else if (messagecount > 1) {
                        TBUtils.notification(messagecount.toString() + ' new messages!', notificationbody, messageunreadurl);
                    }


                } else {
                    $.each(json.data.children, function (i, value) {

                        if ($.inArray(value.data.name, pushedunread) == -1 && value.kind == 't1') {

                            var context = value.data.context,
                                body_html = TBUtils.htmlDecode(value.data.body_html),
                                author = value.data.author,
                                subreddit = value.data.subreddit,
                                contexturl = context.slice(0, -10) + '.json';

                            getcommentitle(subreddit, contexturl, context, author, body_html);
                            pushedunread.push(value.data.name);

                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block
                        } else if ($.inArray(value.data.name, pushedunread) == -1) {
                            var author = value.data.author,
                                body_html = TBUtils.htmlDecode(value.data.body_html),
                                subject = value.data.subject,
                                id = value.data.id;

                            TBUtils.notification('New message:' + subject, $(body_html).text() + '\u2026 \n \n from:' + author, '/message/messages/' + id);
                            pushedunread.push(value.data.name);
                        }
                    });
                }
                if (pushedunread.length > 100) {
                    pushedunread.splice(0, 100 - pushedunread.length);
                }
                TB.storage.setSetting('Notifier', 'unreadpushed', pushedunread);


            }
        });

        //
        // Modqueue
        //
        // wrapper around $.getJSON so it can be part of a loop
        function procesmqcomments(mqlinkid, mqreportauthor, mqidname) {
            $.getJSON(mqlinkid).done(function (jsondata) {
                var infopermalink = jsondata.data.children[0].data.permalink,
                    infotitle = jsondata.data.children[0].data.title,
                    infosubreddit = jsondata.data.children[0].data.subreddit;
                infopermalink = infopermalink + mqidname.substring(3);
                TBUtils.notification('Modqueue - /r/' + infosubreddit + ' - comment:', mqreportauthor + '\'s comment in ' + infotitle, infopermalink + '?context=3');
            });
        }

        // getting modqueue
        $.getJSON('/r/' + modSubreddits + '/about/modqueue.json?limit=100').done(function (json) {
            var count = json.data.children.length || 0;
            updateModqueueCount(count);
            //$.log(modNotifications);
            if (modNotifications && count > modqueueCount) {
                // Ok let's have a look and see if there are actually new items to display
                //$.log('test');
                // set up an array in which we will load the last 100 items that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                var pusheditems = TB.storage.setSetting('Notifier', 'modqueuepushed', []);
                //$.log(consolidatedMessages);
                if (consolidatedMessages) {
                    //$.log('here we go!');
                    var notificationbody, queuecount = 0, xmoreModqueue = 0;
                    $.each(json.data.children, function (i, value) {


                        if ($.inArray(value.data.name, pusheditems) == -1 && value.kind == 't3') {
                            var subreddit = value.data.subreddit,
                                author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = 'post from: ' + author + ', in: ' + subreddit + '\n';
                            } else if (queuecount <= 6) {
                                notificationbody += 'post from: ' + author + ', in: ' + subreddit + '\n';
                            } else if (queuecount > 6) {
                                xmoreModqueue++;
                            }

                            queuecount++;
                            pusheditems.push(value.data.name);
                        } else if ($.inArray(value.data.name, pusheditems) == -1) {
                            var subreddit = value.data.subreddit,
                                author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = 'comment from: ' + author + ', in ' + subreddit + '\n';
                            } else if (queuecount <= 6) {
                                notificationbody = notificationbody + 'comment from: ' + author + ',  in' + subreddit + '\n';
                            } else if (queuecount > 6) {
                                xmoreModqueue++;
                            }
                            queuecount++;
                            pusheditems.push(value.data.name);
                        }
                    });

                    if (xmoreModqueue > 0) {
                        notificationbody = notificationbody + '\n and: ' + xmoreModqueue.toString() + ' more items \n';
                    }
                    //$.log(queuecount);
                    //$.log(notificationbody);
                    if (queuecount === 1) {
                        TBUtils.notification('One new modqueue item!', notificationbody, '/r/' + modSubreddits + '/about/modqueue');

                    } else {
                        TBUtils.notification(queuecount.toString() + ' new modqueue items!', notificationbody, '/r/' + modSubreddits + '/about/modqueue');
                    }

                } else {

                    $.each(json.data.children, function (i, value) {
                        if ($.inArray(value.data.name, pusheditems) == -1 && value.kind == 't3') {

                            var mqpermalink = value.data.permalink,
                                mqtitle = value.data.title,
                                mqauthor = value.data.author,
                                mqsubreddit = value.data.subreddit;

                            TBUtils.notification('Modqueue: /r/' + mqsubreddit + ' - post', mqtitle + ' By: ' + mqauthor, mqpermalink);
                            pusheditems.push(value.data.name);
                        } else if ($.inArray(value.data.name, pusheditems) == -1) {
                            var reportauthor = value.data.author,
                                idname = value.data.name,
                                linkid = '/api/info.json?id=' + value.data.link_id;

                            //since we want to add some adition details to this we call the previous declared function
                            procesmqcomments(linkid, reportauthor, idname);
                            pusheditems.push(value.data.name);
                        }
                    });

                }
                if (pusheditems.length > 100) {
                    pusheditems.splice(0, 100 - pusheditems.length);
                }
                TB.storage.setSetting('Notifier', 'modqueuepushed', pusheditems);


            }
            TB.storage.setSetting('Notifier', 'modqueuecount', count);
        });

        //
        // Unmoderated
        //
        // getting unmoderated queue
        if (unmoderatedOn || unmoderatedNotifications) {
            $.getJSON('/r/' + unmoderatedSubreddits + '/about/unmoderated.json?limit=100').done(function (json) {
                var count = json.data.children.length || 0;


                if (unmoderatedNotifications && count > unmoderatedCount) {
                    var lastSeen = TB.storage.getSetting('Notifier', 'lastseenunmoderated', -1);

                    if (consolidatedMessages) {
                        var notificationbody, queuecount = 0, xmoreUnmod = 0;

                        $.each(json.data.children, function (i, value) {
                            if (!lastSeen || value.data.created_utc * 1000 > lastSeen) {
                                var subreddit = value.data.subreddit
                                    , author = value.data.author;


                                if (!notificationbody) {
                                    notificationbody = 'post from: ' + author + ', in: ' + subreddit + '\n';
                                } else if (queuecount <= 6) {
                                    notificationbody += 'post from: ' + author + ', in: ' + subreddit + '\n';
                                } else if (queuecount > 6) {
                                    xmoreUnmod++;
                                }

                                queuecount++;

                            }
                        });

                        if (xmoreUnmod > 0) {
                            notificationbody = notificationbody + '\n and: ' + xmoreUnmod.toString() + ' more items\n';
                        }

                        if (queuecount === 1) {
                            TBUtils.notification('One new unmoderated item!', notificationbody, '/r/' + unmoderatedSubreddits + '/about/unmoderated');
                        } else {
                            TBUtils.notification(queuecount.toString() + ' new unmoderated items!', notificationbody, '/r/' + unmoderatedSubreddits + '/about/unmoderated');
                        }
                    } else {
                        $.each(json.data.children, function (i, value) {
                            if (!lastSeen || value.data.created_utc * 1000 > lastSeen) {
                                var uqpermalink = value.data.permalink,
                                    uqtitle = value.data.title,
                                    uqauthor = value.data.author,
                                    uqsubreddit = value.data.subreddit;

                                TBUtils.notification('Unmoderated: /r/' + uqsubreddit + ' - post', uqtitle + ' By: ' + uqauthor, uqpermalink);
                            }
                        });
                    }

                    TB.storage.setSetting('Notifier', 'lastseenunmoderated', now);
                }

                TB.storage.setSetting('Notifier', 'unmoderatedcount', count);

                if (unmoderatedOn) {
                    updateUnmodCount(count);
                }
            });
        }

        //
        // Modmail
        //
        // getting unread modmail, will not show replies because... well the api sucks in that regard.
        $.getJSON('/r/' + modmailFilteredSubreddits + '/message/moderator.json').done(function (json) {

            var count = json.data.children.length || 0;
            if (count === 0) {
                TB.storage.setSetting('Notifier', 'modmailcount', count);
                updateModMailCount(count);
                return;
            }

            var lastSeen = TB.storage.getSetting('Notifier', 'lastseenmodmail', -1),
                newIdx = '',
                title = '',
                text = '',
                newCount = 0;

            for (var i = 0; i < json.data.children.length; i++) {
                var messageTime = json.data.children[i].data.created_utc * 1000,
                    messageAuthor = json.data.children[i].data.author;

                var isInviteSpam = false;
                if (TB.storage.getSetting('ModMailPro', 'hideinvitespam', false) && (json.data.children[i].data.subject == 'moderator invited' || json.data.children[i].data.subject == 'moderator added')) {
                    isInviteSpam = true;
                }

                if ((!lastSeen || messageTime > lastSeen) && messageAuthor !== TBUtils.logged && !isInviteSpam) {
                    newCount++;
                    if (!newIdx) {
                        newIdx = i;
                    }
                }
            }

            //$.log('New messages: ', newCount);

            if (modmailNotifications && newCount > 0 && newCount !== modmailCount) {  // Don't show the message twice.
                var notificationbody, messagecount = 0, xmoreModMail = 0;

                if (consolidatedMessages || newCount > 5) {

                    $.each(json.data.children, function (i, value) {

                        var isInviteSpam = false;
                        if (TB.storage.getSetting('ModMailPro', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
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
                                notificationbody = 'from: ' + author + ', in:' + subreddit + '\n';
                            } else if (messagecount <= 6) {
                                notificationbody = notificationbody + 'from: ' + author + ', in:' + subreddit + '\n';
                            } else if (messagecount > 6) {
                                xmoreModMail++;
                            }
                        }
                    });

                    if (newCount === 1) {
                        TBUtils.notification('One new modmail!', notificationbody, modmailunreadurl);

                    } else if (newCount > 1) {
                        if (xmoreModMail > 0) {
                            notificationbody = notificationbody + '\n and: ' + xmoreModMail.toString() + ' more \n';
                        }
                        TBUtils.notification(newCount.toString() + ' new modmail!', notificationbody, modmailunreadurl);
                    }
                } else {
                    $.each(json.data.children, function (i, value) {

                        var isInviteSpam = false;
                        if (TB.storage.getSetting('ModMailPro', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
                            isInviteSpam = true;
                        }

                        var author = value.data.author;

                        if (author !== TBUtils.logged && !isInviteSpam) {
                            // Sending 100 messages, since this loops through all messages, again.
                            // In all honesty, all of this needs to be rewriten...
                            messagecount++;
                            if (messagecount > newCount) return false;

                            var modmailbody = value.data.body;
                            modmailsubject = value.data.subject;
                            modmailsubreddit = value.data.subreddit;
                            modmailpermalink = value.data.id;

                            TBUtils.notification('Modmail: /r/' + modmailsubreddit + ' : ' + modmailsubject, modmailbody, '/message/messages/' + modmailpermalink);
                        }
                    });

                }
            }

            TB.storage.setSetting('Notifier', 'modmailcount', newCount);
            updateModMailCount(newCount);

        });
    }

    // How often we check for new messages, this will later be adjustable in the settings.
    if (notifierEnabled) {
        setInterval(getmessages, checkInterval);
        getmessages();
    } else { // todo: this is a temp hack until 2.2
        TB.storage.setSetting('Notifier', 'unreadmessagecount', 0);
        TB.storage.setSetting('Notifier', 'modqueuecount', 0);
        TB.storage.setSetting('Notifier', 'unmoderatedcount', 0);
        TB.storage.setSetting('Notifier', 'modmailcount', 0);
    }

};

TB.register_module(notifierMod);
} // notifier() wrapper

(function () {
    window.addEventListener("TBObjectLoaded", function () {
        notifiermod();
    });
})();
