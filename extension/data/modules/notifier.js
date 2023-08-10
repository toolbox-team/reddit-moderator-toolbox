import browser from 'webextension-polyfill';
import $ from 'jquery';

import {Module} from '../tbmodule.js';
import * as TBStorage from '../tbstorage.js';
import * as TBApi from '../tbapi.ts';
import * as TBHelpers from '../tbhelpers.js';
import * as TBCore from '../tbcore.js';

export default new Module({
    name: 'Notifier',
    id: 'Notifier',
    enabledByDefault: true,
    settings: [
        {
            id: 'modSubreddits',
            type: 'text',
            default: 'mod',
            advanced: false,
            description: 'Multireddit of subs you want displayed in the modqueue counter',
        },
        {
            id: 'modSubredditsFMod',
            type: 'boolean',
            default: false,
            advanced: false,
            description: 'Use /f/mod/about/modqueue/ instead.',
        },
        {
            id: 'unmoderatedSubreddits',
            type: 'text',
            default: 'mod',
            advanced: false,
            description: 'Multireddit of subs you want displayed in the unmoderated counter',
        },
        {
            id: 'unmoderatedSubredditsFMod',
            type: 'boolean',
            default: false,
            advanced: false,
            description: 'Use /f/mod/about/unmoderated/ instead.',
        },
        {
            id: 'messageNotifications',
            type: 'boolean',
            default: true,
            description: 'Get notifications for new messages',
        },
        {
            id: 'messageNotificationSound',
            type: 'boolean',
            default: false,
            description: "You've got mail.",
        },
        {
            id: 'sampleSound',
            type: 'action',
            description: 'sample sound',
            class: 'tb-sample-sound',
            event: TBCore.events.TB_SAMPLE_SOUND,
        },
        {
            id: 'messageUnreadLink',
            type: 'boolean',
            default: false,
            description: 'Link to /message/unread/ if unread messages are present',
        },
        {
            id: 'straightToInbox',
            type: 'boolean',
            default: false,
            advanced: true,
            description: 'When clicking a comment notification go to the inbox',
        },
        {
            id: 'consolidatedMessages',
            type: 'boolean',
            default: true,
            advanced: true,
            description: 'Consolidate notifications (x new messages) instead of individual notifications',
        },
        {
            id: 'modNotifications',
            type: 'boolean',
            default: true,
            description: 'Get modqueue notifications',
        },
        {
            id: 'unmoderatedNotifications',
            type: 'boolean',
            default: false,
            description: 'Get unmoderated queue notifications',
        },
        {
            id: 'checkInterval',
            type: 'number',
            default: 1, // 60 secs.
            advanced: true,
            description: 'Interval to check for new items (time in minutes).',
        },

        // Private storage settings.
        {
            id: 'unreadMessageCount',
            type: 'number',
            default: 0,
            hidden: true,
        },
        {
            id: 'modqueueCount',
            type: 'number',
            default: 0,
            hidden: true,
        },
        {
            id: 'unmoderatedCount',
            type: 'number',
            default: 0,
            hidden: true,
        },
        {
            id: 'modmailCount',
            type: 'number',
            default: 0,
            hidden: true,
        },
        {
            id: 'newModmailCount',
            type: 'number',
            default: 0,
            hidden: true,
        },

        {
            id: 'newModmailCategoryCount',
            type: 'JSON',
            default: {highlighted: 0, notifications: 0, archived: 0, new: 0, inprogress: 0, mod: 0},
            hidden: true,
        },

        {
            id: 'lastChecked',
            type: 'number',
            default: -1,
            hidden: true,
        },
        {
            id: 'lastSeenUnmoderated',
            type: 'number',
            default: -1,
            hidden: true,
        },
        {
            id: 'lastSeenModmail',
            type: 'number',
            default: -1,
            hidden: true,
        },
        {
            id: 'unreadPushed',
            type: 'array',
            default: [],
            hidden: true,
        },
        {
            id: 'modqueuePushed',
            type: 'array',
            default: [],
            hidden: true,
        },
    ],
}, async function init ({
    modNotifications,
    messageNotifications,
    messageNotificationSound,
    unmoderatedNotifications,
    consolidatedMessages,
    straightToInbox,
    modSubreddits,
    modSubredditsFMod,
    unmoderatedSubreddits,
    unmoderatedSubredditsFMod,
    modmailSubreddits,
    modmailSubredditsFromPro,
    messageUnreadLink,
    checkInterval,
    unreadMessageCount,
    modqueueCount,
    unmoderatedCount,
    newModmailCount,
    newModmailCategoryCount,
}) {
    if (TBCore.isEmbedded) {
        return;
    }

    const NOTIFICATION_SOUND = 'https://raw.githubusercontent.com/creesch/reddit-moderator-toolbox/gh-pages/audio/mail.mp3',
          unmoderatedOn = await TBStorage.getSettingAsync('Modbar', 'unmoderatedon', true), // why? RE: because people sometimes don't use unmoderated and we included this a long time per request.
          checkIntervalMillis = TBHelpers.minutesToMilliseconds(checkInterval), // setting is in seconds, convert to milliseconds.
          $body = $('body');
    let modmailFilteredSubreddits = modmailSubreddits, // wat?
        newLoad = true,
        now = new Date().getTime(),

        messageunreadurl = '/message/inbox/',
        activeNewMMcheck = false;

    // use filter subs from MMP, if appropriate
    if (modmailSubredditsFromPro) {
        modmailFilteredSubreddits = 'mod';
        if ((await TBStorage.getSettingAsync('ModMail', 'filteredsubs', [])).length > 0) {
            modmailFilteredSubreddits += `-${await TBStorage.getSettingAsync('ModMail', 'filteredsubs', []).join('-')}`;
        }
    }

    if (messageUnreadLink) {
        messageunreadurl = '/message/unread/';
    }

    //
    // Counters and notifications
    //

    // Mark all modmail messages read when visiting a modmail related page. This is done outside the function since it only has to run on page load when the page is modmail related.
    // If it was part of the function it would fail to show notifications when the user multiple tabs open and the script runs in a modmail tab.
    if (TBCore.isModmail) {
        this.log('clearing all unread stuff');

        // We have nothing unread if we're on the mod mail page.
        this.set('lastSeenModmail', now);
        this.set('modmailCount', 0);

        TBApi.getJSON(`/r/${modmailFilteredSubreddits}/message/moderator/unread.json`).then(json => {
            TBStorage.purifyObject(json);
            json.data.children.forEach(value => {
                const unreadmessageid = value.data.name;

                // TODO: catch errors
                TBApi.markMessageRead(unreadmessageid);
            });
        });
    }

    TBCore.catchEvent(TBCore.events.TB_SAMPLE_SOUND, () => {
        this.log('playing sound');

        const audio = new Audio(NOTIFICATION_SOUND);
        audio.play();
    });

    function youveGotMail () {
        if (messageNotificationSound) {
            const audio = new Audio(NOTIFICATION_SOUND);
            audio.play();
        }
    }
    function updateMessagesCount (count) {
        const $mail = $('#mail'),
              $mailCount = $('#mailCount'),
              $mailcount = $('#mailcount'),
              $tb_mail = $('#tb-mail'),
              $tb_mailCount = $('#tb-mailCount');
        // TODO: only call TBCore.link once per string literal in this section
        if (count < 1) {
            $mailCount.empty();
            $mail.attr('class', 'nohavemail');
            $mail.attr('title', 'no new mail!');
            $mail.attr('href', TBCore.link('/message/inbox/'));
            $mailcount.attr('href', TBCore.link(messageunreadurl));
            $tb_mail.toggleClass('nohavemail', true).toggleClass('havemail', false);
            $tb_mail.attr('title', 'no new mail!');
            $tb_mail.attr('href', TBCore.link('/message/inbox/'));
            $('#tb-mailCount').attr('href', TBCore.link('/message/inbox/'));
        } else {
            $mail.attr('class', 'havemail');
            $mail.attr('title', 'new mail!');
            $mail.attr('href', TBCore.link(messageunreadurl));
            $mailcount.attr('href', TBCore.link(messageunreadurl));
            $tb_mail.toggleClass('havemail', true).toggleClass('nohavemail', false);
            $tb_mail.attr('title', 'new mail!');
            $tb_mail.attr('href', TBCore.link(messageunreadurl));
            $tb_mailCount.attr('href', TBCore.link(messageunreadurl));
        }
        $tb_mailCount.text(`[${count}]`);

        if (count > 0) {
            $('#mailCount').text(`[${count}]`);
        }
    }

    function updateModqueueCount (count) {
        $('#tb-queueCount').text(`[${count}]`);
    }

    function updateUnmodCount (count) {
        $('#tb-unmoderatedCount').text(`[${count}]`);
    }

    function calculateModmailCount (countData) {
        // Modmail directors not included in total count. For example highlighted as that will cause duplicates.
        const excludedDirs = ['highlighted'];
        let modmailFreshCount = 0;
        for (const [key, count] of Object.entries(countData)) {
            if (!excludedDirs.includes(key)) {
                modmailFreshCount += count;
            }
        }
        return modmailFreshCount;
    }

    // Here we update the count for new modmail. Is somewhat simpler than old modmail.
    function updateNewModMailCount (count, data) {
        // $modmail is native to reddit $tb_modmail in the modbar.
        const $newmodmail = $('#new_modmail'),
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
        $tbNewModmailTooltip.find('#tb-new-modmail-banappeals .tb-new-mm-count').text(data.appeals);
        $tbNewModmailTooltip.find('#tb-new-modmail-joinrequests .tb-new-mm-count').text(data.join_requests);
        $tbNewModmailTooltip.find('#tb-new-modmail-highlighted .tb-new-mm-count').text(data.highlighted);
        $tbNewModmailTooltip.find('#tb-new-modmail-mod .tb-new-mm-count').text(data.mod);
        $tbNewModmailTooltip.find('#tb-new-modmail-notifications .tb-new-mm-count').text(data.notifications);

        $tbNewModmailCount.text(`[${count}]`);
    }

    const updateAllTabs = async () => {
        this.log('updating all counters accross tabs');
        await browser.runtime.sendMessage({
            action: 'tb-global',
            globalEvent: TBCore.events.TB_UPDATE_COUNTERS,
            excludeBackground: true,
            payload: {
                unreadMessageCount: await this.get('unreadMessageCount'),
                modqueueCount: await this.get('modqueueCount'),
                unmoderatedCount: await this.get('unmoderatedCount'),
                modmailCount: await this.get('modmailCount'),
                newModmailCount: await this.get('newModmailCount'),
                newModmailCategoryCount: await this.get('newModmailCategoryCount'),
            },
        });
    };

    const newModMailCheck = () => {
        if (!activeNewMMcheck) {
            activeNewMMcheck = true;
            setTimeout(() => {
                TBApi.apiOauthGET('/api/mod/conversations/unread/count').then(async response => {
                    const data = await response.json();
                    const modmailFreshCount = calculateModmailCount(data);
                    this.set('newModmailCount', modmailFreshCount);
                    this.set('newModmailCategoryCount', data);

                    updateNewModMailCount(modmailFreshCount, data);
                    updateAllTabs();
                    activeNewMMcheck = false;
                }).catch(error => {
                    this.log(error);
                    activeNewMMcheck = false;
                });
            }, 500);
        }
    };

    // New Modmail actions.
    // Whenever something is clicked that potentially changes the modmail count
    if (TBCore.isNewModmail) {
        // Since this is a non ww domain counts will never be checked through the regular getMessages() function.
        // So we do a check here.
        newModMailCheck();

        $body.on('click', `
                .ThreadPreviewViewer__thread:not(.m-read),
                .ThreadPreviewViewerHeader__button,
                .ThreadPreview__headerLeft .ThreadPreview__control,
                .ThreadViewerHeader__right
            `, () => {
            this.log('Checking modmail count based on click on specific element.');
            newModMailCheck();
        });
    }

    window.addEventListener(TBCore.events.TB_UPDATE_COUNTERS, event => {
        this.log('updating counters from background');
        updateMessagesCount(event.detail.unreadMessageCount);
        updateModqueueCount(event.detail.modqueueCount);
        updateUnmodCount(event.detail.unmoderatedCount);
        // updateModMailCount(event.detail.modmailCount);
        updateNewModMailCount(event.detail.newModmailCount, event.detail.newModmailCategoryCount);
    });

    const getmessages = async () => {
        this.log('getting messages');

        // get some of the variables again, since we need to determine if there are new messages to display and counters to update.
        const lastchecked = await this.get('lastChecked');

        // Update now.
        now = TBHelpers.getTime();

        // Update counters.
        unreadMessageCount = await this.get('unreadMessageCount');
        modqueueCount = await this.get('modqueueCount');
        unmoderatedCount = await this.get('unmoderatedCount');
        newModmailCount = await this.get('newModmailCount');
        newModmailCategoryCount = await this.get('newModmailCategoryCount');
        //
        // Update methods
        //

        if (!newLoad && now - lastchecked < checkIntervalMillis) {
            updateMessagesCount(unreadMessageCount);
            updateModqueueCount(modqueueCount);
            updateUnmodCount(unmoderatedCount);
            // updateModMailCount(modmailCount);
            updateNewModMailCount(newModmailCount, newModmailCategoryCount);
            return;
        }

        newLoad = false;

        // We'll use this to determine if we are done with all counters and want to send a message to the background page telling all other tabs to update.
        let updateCounters = unmoderatedOn ? 4 : 3;

        // We're checking now.
        this.set('lastChecked', now);

        //
        // Messages
        //
        // The reddit api is silly sometimes, we want the title or reported comments and there is no easy way to get it, so here it goes:
        // a silly function to get the title anyway. The getJSON is wrapped in a function to prevent if from running async outside the loop.

        function getcommentitle (unreadsubreddit, unreadcontexturl, unreadcontext, unreadauthor, unreadbody_html, unreadcommentid) {
            TBApi.getJSON(unreadcontexturl).then(jsondata => {
                TBStorage.purifyObject(jsondata);
                const commenttitle = jsondata[0].data.children[0].data.title;
                if (straightToInbox && messageUnreadLink) {
                    TBCore.notification(`Reply from: ${unreadauthor} in:  ${unreadsubreddit}: ${commenttitle.substr(0, 20)}\u2026`, $(unreadbody_html).text(), '/message/unread/');
                } else if (straightToInbox) {
                    TBCore.notification(`Reply from: ${unreadauthor} in:  ${unreadsubreddit}: ${commenttitle.substr(0, 20)}\u2026`, $(unreadbody_html).text(), '/message/inbox/');
                } else {
                    TBCore.notification(`Reply from: ${unreadauthor} in:  ${unreadsubreddit}: ${commenttitle.substr(0, 20)}\u2026`, $(unreadbody_html).text(), unreadcontext, unreadcommentid);
                }
            });
        }

        // getting unread messages
        TBApi.getJSON('/message/unread.json').then(async json => {
            TBStorage.purifyObject(json);
            const count = json.data.children.length || 0; // TODO: what does `|| 0` do in this case? if children is an array, length will alwaus be a number, so `|| 0` does nothing
            this.set('unreadMessageCount', count);
            updateMessagesCount(count);

            // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
            updateCounters--;
            if (updateCounters === 0) {
                updateAllTabs();
            }

            if (count === 0) {
                return;
            }
            // Are we allowed to show a popup?
            if (messageNotifications && count > unreadMessageCount) {
                // set up an array in which we will load the last 100 messages that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                const pushedunread = await this.get('unreadPushed');
                if (consolidatedMessages && json.data.children.length > 1) {
                    let notificationbody,
                        messagecount = 0;
                    json.data.children.forEach(value => {
                        let subreddit,
                            subject,
                            author;
                        if (!pushedunread.includes(value.data.name) && value.kind === 't1') {
                            subreddit = value.data.subreddit;
                            author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = `reply from: ${author}. in: ${subreddit}\n`;
                            } else {
                                notificationbody = `${notificationbody}reply from: ${author}. in: ${subreddit}\n`;
                            }
                            messagecount++;
                            pushedunread.push(value.data.name);
                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block
                        } else if (!pushedunread.includes(value.data.name)) {
                            subject = value.data.subject;
                            author = value.data.author;

                            // When the JSON doesn't return an author, but has a subreddit instead, assume it's a PM
                            // from a subreddit
                            if (!author && value.data.subreddit != null) {
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
                    TBCore.notification(`${messagecount.toString()} new messages!`, notificationbody, messageunreadurl);
                    youveGotMail();
                } else {
                    json.data.children.forEach(value => {
                        let context,
                            body_html,
                            author,
                            subreddit,
                            commentid,
                            contexturl,
                            subject,
                            id;

                        if (!pushedunread.includes(value.data.name) && value.kind === 't1') {
                            context = value.data.context;
                            body_html = TBHelpers.htmlDecode(value.data.body_html);
                            author = value.data.author;
                            subreddit = value.data.subreddit;
                            commentid = value.data.name;
                            contexturl = `${context.slice(0, -10)}.json`;

                            getcommentitle(subreddit, contexturl, context, author, body_html, commentid);
                            pushedunread.push(value.data.name);

                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block
                        } else if (!pushedunread.includes(value.data.name)) {
                            author = value.data.author;
                            body_html = TBHelpers.htmlDecode(value.data.body_html);
                            subject = value.data.subject;
                            id = value.data.id;

                            // When the JSON doesn't return an author, but has a subreddit instead, assume it's a PM
                            // from a subreddit
                            if (!author && value.data.subreddit != null) {
                                author = value.data.subreddit;
                            }

                            TBCore.notification(`New message: ${subject}`, `${$(body_html).text()}\u2026 \n \n from: ${author}`, `/message/messages/${id}`);
                            pushedunread.push(value.data.name);
                        }
                    });
                }
                if (pushedunread.length > 100) {
                    pushedunread.splice(0, 100 - pushedunread.length);
                }
                this.set('unreadPushed', pushedunread);
            }
        }).catch(error => this.error(error));

        //
        // Modqueue
        //
        // wrapper around getJSON so it can be part of a loop
        function procesmqcomments (mqlinkid, mqreportauthor, mqidname) {
            TBApi.getJSON(mqlinkid).then(jsondata => {
                TBStorage.purifyObject(jsondata);
                let infopermalink = jsondata.data.children[0].data.permalink;
                const infotitle = jsondata.data.children[0].data.title,
                      infosubreddit = jsondata.data.children[0].data.subreddit;
                infopermalink += mqidname.substring(3);
                TBCore.notification(`Modqueue - /r/${infosubreddit} - comment: `, `${mqreportauthor}'s comment in: ${infotitle}`, `${infopermalink}?context=3`);
            });
        }

        // getting modqueue
        let modQueueURL;
        if (modSubredditsFMod) {
            modQueueURL = '/me/f/mod/about/modqueue';
        } else {
            modQueueURL = `/r/${modSubreddits}/about/modqueue`;
        }

        TBApi.getJSON(`${modQueueURL}.json?limit=100`).then(async json => {
            TBStorage.purifyObject(json);
            const count = json.data.children.length || 0;
            updateModqueueCount(count);

            // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
            updateCounters--;
            if (updateCounters === 0) {
                updateAllTabs();
            }
            if (modNotifications && count > modqueueCount) {
                // Ok let's have a look and see if there are actually new items to display
                // set up an array in which we will load the last 100 items that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                const pusheditems = await this.get('modqueuePushed');
                if (consolidatedMessages) {
                    let notificationbody,
                        queuecount = 0,
                        xmoreModqueue = 0;
                    json.data.children.forEach(value => {
                        let subreddit,
                            author;

                        if (!pusheditems.includes(value.data.name) && value.kind === 't3') {
                            subreddit = value.data.subreddit;
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
                        } else if (!pusheditems.includes(value.data.name)) {
                            subreddit = value.data.subreddit;
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
                    if (queuecount === 1) {
                        TBCore.notification('One new modqueue item!', notificationbody, modQueueURL);
                    } else if (queuecount > 1) {
                        TBCore.notification(`${queuecount.toString()} new modqueue items!`, notificationbody, modQueueURL);
                    }
                } else {
                    json.data.children.forEach(value => {
                        if (!pusheditems.includes(value.data.name) && value.kind === 't3') {
                            const mqpermalink = value.data.permalink,
                                  mqtitle = value.data.title,
                                  mqauthor = value.data.author,
                                  mqsubreddit = value.data.subreddit;

                            TBCore.notification(`Modqueue: /r/${mqsubreddit} - post`, `${mqtitle} By: ${mqauthor}`, mqpermalink);
                            pusheditems.push(value.data.name);
                        } else if (!pusheditems.includes(value.data.name)) {
                            const reportauthor = value.data.author,
                                  idname = value.data.name,
                                  linkid = `/api/info.json?id=${value.data.link_id}`;

                            // since we want to add some adition details to this we call the previous declared function
                            procesmqcomments(linkid, reportauthor, idname);
                            pusheditems.push(value.data.name);
                        }
                    });
                }
                if (pusheditems.length > 100) {
                    pusheditems.splice(0, 100 - pusheditems.length);
                }
                this.set('modqueuePushed', pusheditems);
            }
            this.set('modqueueCount', count);
        });

        //
        // Unmoderated
        //
        // getting unmoderated queue
        if (unmoderatedOn || unmoderatedNotifications) {
            let unModeratedURL;
            if (unmoderatedSubredditsFMod) {
                unModeratedURL = '/me/f/mod/about/unmoderated';
            } else {
                unModeratedURL = `/r/${unmoderatedSubreddits}/about/unmoderated`;
            }

            TBApi.getJSON(`${unModeratedURL}.json?limit=100`).then(async json => {
                TBStorage.purifyObject(json);
                const count = json.data.children.length || 0;

                if (unmoderatedNotifications && count > unmoderatedCount) {
                    const lastSeen = await this.set('lastSeenUnmoderated');

                    if (consolidatedMessages) {
                        let notificationbody,
                            queuecount = 0,
                            xmoreUnmod = 0;

                        json.data.children.forEach(value => {
                            if (!lastSeen || value.data.created_utc * 1000 > lastSeen) {
                                const subreddit = value.data.subreddit,
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
                            TBCore.notification('One new unmoderated item!', notificationbody, unModeratedURL);
                        } else {
                            TBCore.notification(`${queuecount.toString()} new unmoderated items!`, notificationbody, unModeratedURL);
                        }
                    } else {
                        json.data.children.forEach(value => {
                            if (!lastSeen || value.data.created_utc * 1000 > lastSeen) {
                                const uqpermalink = value.data.permalink,
                                      uqtitle = value.data.title,
                                      uqauthor = value.data.author,
                                      uqsubreddit = value.data.subreddit;

                                TBCore.notification(`Unmoderated: /r/${uqsubreddit} - post`, `${uqtitle} By: ${uqauthor}`, uqpermalink);
                            }
                        });
                    }

                    this.set('lastSeenUnmoderated', now);
                }

                this.set('unmoderatedCount', count);

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

        //
        // New modmail
        //
        TBApi.apiOauthGET('/api/mod/conversations/unread/count').then(async response => {
            const data = await response.json();
            const modmailFreshCount = calculateModmailCount(data);
            this.set('newModmailCount', modmailFreshCount);
            this.set('newModmailCategoryCount', data);
            updateNewModMailCount(modmailFreshCount, data);

            // Decrease the updateCounters variable by one. Then check if it is zero, if that is the case we are done and can update all tabs.
            updateCounters--;
            if (updateCounters === 0) {
                updateAllTabs();
            }
        }).catch(error => {
            this.log(error);
        });
    };

    setInterval(getmessages, checkIntervalMillis);

    getmessages();
    // Because firefox is "special" we wait a tiny bit and try again.
});
