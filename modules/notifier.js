function notifiermod() {

var notifierMod = new TB.Module('Notifier');

notifierMod.settings["enabled"]["default"] = true;
notifierMod.config["betamode"] = false;
notifierMod.config["needs_mod_subs"] = true;

// notifierMod.register_setting("hideactioneditems", {
//     "type": "boolean",
//     "default": false,
//     "betamode": false,
//     "hidden": false,
//     "title": "Hide items after mod action"
// });

/*
 notifierMod.register_setting("modsubreddits", {
 "type": "text",
 "default": "mod",
 "betamode": false,
 "hidden": false,
 "title": "Multireddit of subs you want displayed in the modqueue counter"
 });
 notifierMod.register_setting("unmoderatedsubreddits", {
 "type": "text",
 "default": "mod",
 "betamode": false,
 "hidden": false,
 "title": "Multireddit of subs you want displayed in the unmoderated counter"
 });
 notifierMod.register_setting("modmailsubreddits", {
 "type": "text",
 "default": "mod",
 "betamode": false,
 "hidden": false,
 "title": "Multireddit of subs you want displayed in the modmail counter"
 });
 */


notifierMod.init = function notifierMod_init() {
    var $body = $('body');

    //
    // preload some generic variables
    //
    var checkInterval = TBUtils.getSetting('Notifier', 'checkinterval', 1 * 60 * 1000), //default to check every minute for new stuff.
    // modNotifications = localStorage['Toolbox.Notifier.modnotifications'] || 'on',  // these need to be converted to booleans.
        modNotifications = TBUtils.getSetting('Notifier', 'modnotifications', true),  // these need to be converted to booleans.
    // messageNotifications = localStorage['Toolbox.Notifier.messagenotifications'] || 'on', // these need to be converted to booleans.
        messageNotifications = TBUtils.getSetting('Notifier', 'messagenotifications', true), // these need to be converted to booleans.
        modmailNotifications = TBUtils.getSetting('Notifier', 'modmailnotifications', true),
        unmoderatedNotifications = TBUtils.getSetting('Notifier', 'unmoderatednotifications', false),

        modSubreddits = notifierMod.setting('modsubreddits'),
        unmoderatedSubreddits = notifierMod.setting('unmoderatedsubreddits'),
        modmailSubreddits = notifierMod.setting('modmailsubreddits'),

        modmailSubredditsFromPro = TBUtils.getSetting('Notifier', 'modmailsubredditsfrompro', false),

        modmailFilteredSubreddits = modmailSubreddits,
        notifierEnabled = TBUtils.getSetting('Notifier', 'enabled', true),
        shortcuts = TBUtils.getSetting('Notifier', 'shortcuts', '-'),
        shortcuts2 = TBUtils.getSetting('Notifier', 'shortcuts2', {}),
        modbarHidden = TBUtils.getSetting('Notifier', 'modbarhidden', false),
        compactHide = TBUtils.getSetting('Notifier', 'compacthide', false),
        unmoderatedOn = TBUtils.getSetting('Notifier', 'unmoderatedon', true),
        consolidatedMessages = TBUtils.getSetting('Notifier', 'consolidatedmessages', true),
        footer = $('.footer-parent'),
        unreadMessageCount = TBUtils.getSetting('Notifier', 'unreadmessagecount', 0),
        modqueueCount = TBUtils.getSetting('Notifier', 'modqueuecount', 0),
        unmoderatedCount = TBUtils.getSetting('Notifier', 'unmoderatedcount', 0),
        modmailCount = TBUtils.getSetting('Notifier', 'modmailcount', 0),
        straightToInbox = TBUtils.getSetting('Notifier', 'straightToInbox', false),
        debugMode = TBUtils.debugMode,
        betaMode = TBUtils.betaMode,
        consoleShowing = TBUtils.getSetting('Notifier', 'consoleshowing', false),
        lockscroll = TBUtils.getSetting('Notifier', 'lockscroll', false),
        newLoad = true,
        now = new Date().getTime(),
        messageunreadlink = TBUtils.getSetting('Notifier', 'messageunreadlink', false),
        modmailunreadlink = TBUtils.getSetting('Notifier', 'modmailunreadlink', false),
        settingSub = TBUtils.getSetting('Utils', 'settingsub', '');


    // use filter subs from MMP, if appropriate
    if (modmailSubredditsFromPro) {
        modmailFilteredSubreddits = 'mod';
        if (TBUtils.getSetting('ModMailPro', 'filteredsubs', []).length > 0) {
            modmailFilteredSubreddits += '-' + TBUtils.getSetting('ModMailPro', 'filteredsubs', []).join('-');
        }
    }

    // convert some settings values
    // TODO: add a fixer in the first run function for next release and drop this section
    if (modNotifications == 'on') {
        TBUtils.setSetting('Notifier', 'modnotifications', true);
        modNotifications = true;
    } else if (modNotifications == 'off') {
        TBUtils.setSetting('Notifier', 'modnotifications', false);
        modNotifications = false;
    }

    if (messageNotifications == 'on') {
        TBUtils.setSetting('Notifier', 'messagenotifications', true);
        messageNotifications = true;
    } else if (messageNotifications == 'off') {
        TBUtils.setSetting('Notifier', 'messagenotifications', true);
        messageNotifications = false;
    }

    if (messageunreadlink) {
        messageunreadurl = '/message/unread/';
    } else {
        messageunreadurl = '/message/inbox/';
    }

    // this is a placeholder from issue #217
    // TODO: provide an option for this once we fix modmailpro filtering
    modmailunreadurl = '/message/moderator/'
    if (modmailunreadlink) {
        // modmailunreadurl = '/r/' + modmailFilteredSubreddits + '/message/moderator/unread';
        modmailunreadurl += 'unread/';
    } else {
        // modmailunreadurl = '/r/' + modmailFilteredSubreddits + '/message/moderator/';
    }

    // cache settings.
    var shortLength = TBUtils.getSetting('cache', 'shortlength', 15),
        longLength = TBUtils.getSetting('cache', 'longlength', 45);


    //
    // UI elements

    // if mod counters are on we append them to the rest of the counters here.
    if (unmoderatedOn) {
        $('#tb-bottombar').find('#tb-toolbarcounters').append('\
        <a title="unmoderated" href="/r/' + unmoderatedSubreddits + '/about/unmoderated" id="tb-unmoderated"></a>\
        <a href="/r/' + unmoderatedSubreddits + '/about/unmoderated" class="tb-toolbar" id="tb-unmoderatedcount"></a>\
        ');
    }


    //
    // Counters and notifications
    //

    // Mark all modmail messages read when visiting a modmail related page. This is done outside the function since it only has to run on page load when the page is modmail related.
    // If it was part of the function it would fail to show notifications when the user multiple tabs open and the script runs in a modmail tab.
    if (TBUtils.isModmailUnread || TBUtils.isModmail) {
        $.log('clearing all unread stuff');

        // We have nothing unread if we're on the mod mail page.
        TBUtils.setSetting('Notifier', 'lastseenmodmail', now);
        modmailCount = TBUtils.setSetting('Notifier', 'modmailcount', 0);

        $.getJSON('/r/' + modmailFilteredSubreddits + '/message/moderator/unread.json').done(function (json) {
            $.each(json.data.children, function (i, value) {

                var unreadmessageid = value.data.name;

                $.post('/api/read_message', {
                    id: unreadmessageid,
                    uh: TBUtils.modhash,
                    api_type: 'json'
                });
            });
        });
    }


    function getmessages() {
        // get some of the variables again, since we need to determine if there are new messages to display and counters to update.
        var lastchecked = TBUtils.getSetting('Notifier', 'lastchecked', -1),
            author = '',
            body_html = '';

        // Update now.
        now = new Date().getTime();


        // Update counters.
        unreadMessageCount = TBUtils.getSetting('Notifier', 'unreadmessagecount', 0);
        modqueueCount = TBUtils.getSetting('Notifier', 'modqueuecount', 0);
        unmoderatedCount = TBUtils.getSetting('Notifier', 'unmoderatedcount', 0);
        modmailCount = TBUtils.getSetting('Notifier', 'modmailcount', 0);

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
        TBUtils.setSetting('Notifier', 'lastchecked', now);

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
            TBUtils.setSetting('Notifier', 'unreadmessagecount', count);
            updateMessagesCount(count);
            if (count === 0) return;
            // Are we allowed to show a popup?
            if (messageNotifications && count > unreadMessageCount) {


                // set up an array in which we will load the last 100 messages that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                var pushedunread = TBUtils.getSetting('Notifier', 'unreadpushed', []);
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
                TBUtils.setSetting('Notifier', 'unreadpushed', pushedunread);


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
                var pusheditems = TBUtils.setSetting('Notifier', 'modqueuepushed', []);
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
                TBUtils.setSetting('Notifier', 'modqueuepushed', pusheditems);


            }
            TBUtils.setSetting('Notifier', 'modqueuecount', count);
        });

        //
        // Unmoderated
        //
        // getting unmoderated queue
        if (unmoderatedOn || unmoderatedNotifications) {
            $.getJSON('/r/' + unmoderatedSubreddits + '/about/unmoderated.json?limit=100').done(function (json) {
                var count = json.data.children.length || 0;


                if (unmoderatedNotifications && count > unmoderatedCount) {
                    var lastSeen = TBUtils.getSetting('Notifier', 'lastseenunmoderated', -1);

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

                    TBUtils.setSetting('Notifier', 'lastseenunmoderated', now);
                }

                TBUtils.setSetting('Notifier', 'unmoderatedcount', count);

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
                TBUtils.setSetting('Notifier', 'modmailcount', count);
                updateModMailCount(count);
                return;
            }

            var lastSeen = TBUtils.getSetting('Notifier', 'lastseenmodmail', -1),
                newIdx = '',
                title = '',
                text = '',
                newCount = 0;

            for (var i = 0; i < json.data.children.length; i++) {
                var messageTime = json.data.children[i].data.created_utc * 1000,
                    messageAuthor = json.data.children[i].data.author;

                var isInviteSpam = false;
                if (TBUtils.getSetting('ModMailPro', 'hideinvitespam', false) && (json.data.children[i].data.subject == 'moderator invited' || json.data.children[i].data.subject == 'moderator added')) {
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
                        if (TBUtils.getSetting('ModMailPro', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
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
                        if (TBUtils.getSetting('ModMailPro', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
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

            TBUtils.setSetting('Notifier', 'modmailcount', newCount);
            updateModMailCount(newCount);

        });
    }

    // How often we check for new messages, this will later be adjustable in the settings.
    if (notifierEnabled) {
        setInterval(getmessages, checkInterval);
        getmessages();
    } else { // todo: this is a temp hack until 2.2
        TBUtils.setSetting('Notifier', 'unreadmessagecount', 0);
        TBUtils.setSetting('Notifier', 'modqueuecount', 0);
        TBUtils.setSetting('Notifier', 'unmoderatedcount', 0);
        TBUtils.setSetting('Notifier', 'modmailcount', 0);
    }

};

TB.register_module(notifierMod);
} // notifier() wrapper

(function () {
    window.addEventListener("TBObjectLoaded", function () {
        notifiermod();
    });
})();
