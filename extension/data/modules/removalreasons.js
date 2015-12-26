function removalreasons() {
var self = new TB.Module('Removal Reasons');
self.shortname = 'RReasons';

self.settings['enabled']['default'] = true;

self.register_setting('commentReasons', {
    'type': 'boolean',
    'default': false,
    'title': 'Enable removal reasons for comments.'
});
self.register_setting('alwaysShow', {
    'type': 'boolean',
    'default': false,
    'title': 'Show an empty removal reason box for subreddits that don\'t have removal reasons.'
});

// Storage settings.
self.register_setting('reasonType', {
    'type': 'string',
    'default': '',
    'hidden': true
});
self.register_setting('reasonAsSub', {
    'type': 'boolean',
    'default': false,
    'hidden': true
});
// Default is escape()'d: <textarea id="customTextarea" placeholder="Enter Custom reason"></textarea>
// May make this a user setting, one day.
self.register_setting('customRemovalReason', {
    'type': 'string',
    'default': '%3Ctextarea%20id%3D%22customTextarea%22%20placeholder%3D%22Enter%20Custom%20reason%22%3E%3C/textarea%3E',
    'hidden': true
});

self.init = function() {
    var $body = $('body');
    //Add a class to the body announcing removal reasons enabled
    $body.addClass('tb-removal-reasons');

    // Error texts
    var STATUS_DEFAULT_TEXT = "saving...",
        APPROVE_ERROR = "error, failed to approve post",
        FLAIR_ERROR = "error, failed to flair post",
        NO_REASON_ERROR = "error, no reason selected",
        NO_REPLY_TYPE_ERROR = "error, no reply type selected",
        REPLY_ERROR = "error, failed to post reply",
        PM_ERROR = "error, failed to send PM",
        DISTINGUISH_ERROR = "error, failed to distinguish reply",
        LOG_REASON_MISSING_ERROR = "error, public log reason missing",
        LOG_POST_ERROR = "error, failed to create log post";

    // Default texts
    var DEFAULT_LOG_TITLE = "Removed: {kind} by /u/{author} to /r/{subreddit}",
        DEFAULT_BAN_TITLE = "/u/{author} has been banned from /r/{subreddit} for {reason}";

    // Cached data
    var notEnabled = [];

    // Settings.
    var alwaysShow = self.setting('alwaysShow'),
        commentReasons = self.setting('commentReasons');

    function getRemovalReasons(subreddit, callback) {


        // Nothing to do if no toolbox config
        if (TBUtils.noConfig.indexOf(subreddit) != -1) {
            callback(false);
            return;
        }

        self.log('getting config: ' + subreddit);
        var reasons = '';

        // See if we have the reasons in the cache.
        if (TBUtils.configCache[subreddit] !== undefined) {
            reasons = TBUtils.configCache[subreddit].removalReasons;

            // If we need to get them from another sub, recurse.
            if (reasons && reasons.getfrom) {
                if(reasons.getfrom == subreddit) {
                    self.log("Warning: 'get from' subreddit same as current subreddit. Don't do that!");
                }
                else {
                    getRemovalReasons(reasons.getfrom, callback);
                    return;
                }
            }
        }

        // If we have removal reasons, send them back.
        if (reasons) {
            self.log('returning: cache');
            callback(reasons);
            return;
        }

        // OK, they are not cached.  Try the wiki.
        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || !resp.removalReasons) {
                self.log('failed: wiki config');
                callback(false);
                return;
            }

            // We have a valid config, cache it.
            TBUtils.configCache[subreddit] = resp;
            reasons = resp.removalReasons;

            // Again, check if there is a fallback sub, and recurse.
            if (reasons && reasons.getfrom) {
                self.log('trying: get from, no cache');
                getRemovalReasons(reasons.getfrom, callback); //this may not work.
                return;
            }

            // Last try, or return false.
            if (reasons) {
                self.log('returning: no cache');
                callback(reasons);
                return;
            }

            self.log('failed: all');
            callback(false);
        });
    }

    if (!TB.utils.isModmail) {
        self.log('adding "add removal reasons" button');
        $body.find('.linklisting .thing.spam .flat-list.buttons').each(function() {
            var $this = $(this);
            var prettyButtonCount = $this.find('.pretty-button').length;
            if (prettyButtonCount === 1) {
                $this.append('<li class="remove-button"><a href="javascript:;" class="tb-general-button">add removal reason</a></li>');
            }
        });
    }
    // Open reason drop-down when we remove something as ham.
    $body.on('click', '.big-mod-buttons > span > .pretty-button.neutral, .remove-button', function () {
        var $button = $(this),
            $thing = $button.closest('.thing');

        //Don't show removal reasons for spam button.
        if ($button.text() === 'spammed')
            return;

        // Ignore if a comment and comment reasons disabled
        if (!commentReasons && ($thing.hasClass('comment') || $thing.hasClass('was-comment')))
            return;

        // Get link/comment attributes
        var yes = $button.find('.yes')[0],
            info = TBUtils.getThingInfo($button),
            data = {
                subreddit: info.subreddit,
                fullname: info.id,
                author: info.user,
                title: info.title,
                kind: info.kind,
                mod: info.mod,
                url: info.permalink,
                link: info.postlink,
                domain: info.domain
            };

        // Stop if it's modmail or the subreddit doesn't have removal reasons enabled
        if (!data.subreddit || (notEnabled.indexOf(data.subreddit) != -1 && !alwaysShow) || TBUtils.isModmail) {
            return;
        }

        // Set attributes and open reason box if one already exists for this subreddit
        var $popup = $('#reason-popup-' + data.subreddit);
        // If the popup already exists, open it
        if ($popup.length) {
            // Click yes on the removal
            if (yes) yes.click();

            openPopup();
        }
        // Otherwise create the popup and open it
        else {
            // Get removal reasons.
            getRemovalReasons(data.subreddit, function (response) {
                // Removal reasons not enabled
                if (!response || response.reasons.length < 1) {
                    notEnabled.push(data.subreddit);

                    // we're done, unless the user has always show set.
                    if (!alwaysShow) return;

                    // Otherwise, setup a completely empty reason.
                    self.log('Using custom reason');

                    var customReasons = {
                        pmsubject: '',
                        logreason: '',
                        header: '',
                        footer: '',
                        logsub: '',
                        logtitle: '',
                        bantitle: '',
                        getfrom: '',
                        reasons: []
                    };
                    var reason = {
                        text: self.setting('customRemovalReason'),
                        flairText: '',
                        flairCSS: '',
                        title: ''
                    };
                    customReasons.reasons.push(reason);

                    //Set response to our empty reason.
                    response = customReasons;
                }

                // Click yes on the removal
                if (yes) yes.click();

                // Get PM subject line
                data.subject = response.pmsubject || 'Your {kind} was removed from /r/{subreddit}';

                // Add additional data that is found in the wiki JSON.
                // Any HTML needs to me unescaped, because we store it escaped in the wiki.
                data.logReason = response.logreason || '';
                data.header = unescape(response.header || '');
                data.footer = unescape(response.footer || '');
                data.logSub = response.logsub || '';
                data.logTitle = response.logtitle || DEFAULT_LOG_TITLE;
                data.banTitle = response.bantitle || DEFAULT_BAN_TITLE;

                // Loop through the reasons... unescaping each.
                data.reasons = [];
                $(response.reasons).each(function () {
                    data.reasons.push({
                        text: unescape(this.text),
                        title: this.title,
                        flairText: this.flairText,
                        flairCSS: this.flairCSS
                    });
                });

                // Open popup
                createPopup();
                openPopup();
            });
        }

        function createPopup() {
            self.log("Creating removal reason popup");

            // Options
            var selectNoneDisplay = data.logSub ? '' : 'none', // if there is no {reason} in the title but we still want to only log we'll need that "none" radio button.
                logDisplay = data.logSub && data.logTitle.indexOf('{reason}') >= 0 ? '' : 'none', // if {reason}  is present we want to fill it.
                headerDisplay = data.header ? '' : 'none',
                footerDisplay = data.footer ? '' : 'none';

            var reasonType = self.setting('reasonType');
            var reasonAsSub = self.setting('reasonAsSub');

            // Set up markdown renderer
            SnuOwnd.DEFAULT_HTML_ELEMENT_WHITELIST.push('select', 'option', 'textarea', 'input');
            SnuOwnd.DEFAULT_HTML_ATTR_WHITELIST.push('id');
            var parser = SnuOwnd.getParser(SnuOwnd.getRedditRenderer(SnuOwnd.DEFAULT_BODY_FLAGS | SnuOwnd.HTML_ALLOW_ELEMENT_WHITELIST));

            // Render header and footer
            var headerText = data.header ? parser.render(data.header) : '',
                footerText = data.footer ? parser.render(data.footer) : '';

            // Make box & add reason radio buttons
            var popup = $('\
    <div class="reason-popup" id="reason-popup-' + data.subreddit + '"> \
        <attrs /> \
        <div class="reason-popup-content"> \
            <div class="reason-popup-header">Removal reasons for /r/' + data.subreddit + ':</div> \
            <div class="reason-popup-innercontent"> \
                <p>Removing: <a class="mte-thread-link" href="' + data.url + '" target="_blank">' + TBUtils.htmlEncode(data.title) + '</a></p> \
                <div class="styled-reason" id="header-reason" style="display:' + headerDisplay + '"> \
                    <p> \
                        <input type="checkbox" id="include-header" checked> Include header. </input><br /> \
                        <label id="reason-header">' + headerText + '</label> \
                    </p> \
                </div> \
                <table id="removal-reasons-table"> \
                    <thead><tr> \
                        <th class="removal-toggle"></th> \
                        <th class="reason">reason</th> \
                        <th class="flair-text">flair text</th> \
                        <th class="flair-css">flair css</th> \
                    </tr></thead> \
                    <tbody id="reason-table" /> \
                </table> \
                <div class="styled-reason" id="footer-reason" style="display:' + footerDisplay + '"> \
                    <p>	\
                        <input type="checkbox" id="include-footer" checked> Include footer. </input><br />\
                        <label id="reason-footer">' + footerText + '</label> \
                    </p> \
                </div> \
                <div id="buttons"> \
                    <input class="reason-type" type="radio" id="type-PM-' + data.subreddit + '" value="PM"	name="type-' + data.subreddit + '"' + (reasonType == 'PM' ? ' checked="1"' : '') + ' /><label for="type-PM-' + data.subreddit + '">PM</label> \
                     (<input class="reason-as-sub" type="checkbox" id="type-as-sub"' + (reasonAsSub ? 'checked ' : '') + ' /><label for="type-as-sub">as /r/' + data.subreddit + '</label>) /\
                    <input class="reason-type" type="radio" id="type-reply-' + data.subreddit + '" value="reply" name="type-' + data.subreddit + '"' + (reasonType == 'reply' ? ' checked="1"' : '') + ' /><label for="type-reply-' + data.subreddit + '">reply</label> / \
                    <input class="reason-type" type="radio" id="type-both-' + data.subreddit + '" value="both"  name="type-' + data.subreddit + '"' + (reasonType == 'both' ? ' checked="1"' : '') + ' /><label for="type-both-' + data.subreddit + '">both</label> \
                    <span style="display:' + selectNoneDisplay + '"> / \
                        <input class="reason-type" type="radio" id="type-none-' + data.subreddit + '" value="none"  name="type-' + data.subreddit + '"' + (reasonType == 'none' ? ' checked="1"' : '') + ' /><label for="type-none-' + data.subreddit + '">none, will only log the removal.</label> \
                    </span> \
                </div> \
                <div id="log-reason" style="display:' + logDisplay + '"> \
                    <p>Log Reason(s): \
                        <input id="log-reason-input" type="text" name="logReason" value="' + data.logReason + '" /> \
                    </p> \
                    <p> \
                        (Used for posting a log to /r/' + data.logSub + '. Will only be used when "send" is clicked.) </label> \
                    </p> \
                </div> \
            </div> \
            <div class="reason-popup-footer"> \
                <input type="hidden" name="tom_or_not" value="no-tom"> \
                <span class="status error" style="display:none">This is an easter egg.</span> \
                <button class="save tb-action-button">send</button> \
                <button class="no-reason tb-action-button">no reason</button> \
                <button class="cancel tb-action-button">cancel and approve</button> \
            </div> \
        </div> \
    </div>');

            popup = $(popup).appendTo('body').find('attrs').attr(data).end();

            // Render reasons and add to popup
            $(data.reasons).each(function (index) {
                var reasonMarkdown = this.text + '\n\n';
                var reasonHtml = parser.render(reasonMarkdown);

                var tr = $('\
        <tr class="selectable-reason"> \
            <td class="removal-toggle"> \
                <input type="checkbox" class="reason-check" name="reason-' + data.subreddit + '" id="reason-' + data.subreddit + '-' + index + '" /> \
                <div class="reason-num">' + (index + 1) + '</div> \
            </td> \
            <td class="reason"> \
                <div class="removal-reason-title">' + (this.title ? this.title : "") + '</div>\
                <div class="styled-reason reason-content ' + data.subreddit + '-' + index + '">' + reasonHtml + '<br /></div> \
            </td> \
            <td class="flair-text"><span class="flair-text-span">' + (this.flairText ? this.flairText : "") + '</span></td> \
            <td class="flair-css"><span class="flair-css-span">' + (this.flairCSS ? this.flairCSS : "") + '</span></td> \
        </tr>');

                tr.data({
                    reasonId: index,
                    reasonMarkdown: reasonMarkdown,
                    title: this.title,
                    flairText: this.flairText,
                    flairCSS: this.flairCSS
                });

                if (this.title) {
                    tr.find('.styled-reason.reason-content').hide();
                    tr.find('.flair-text-span').hide();
                    tr.find('.flair-css-span').hide();
                } else {
                    tr.find('.removal-reason-title').remove();
                }

                popup.find('tbody').append(tr);
            });

            // Pre-fill reason input elements which have IDs.
            popup.find('.reason-content input[id], .reason-content textarea[id]').each(function () {
                this.id = 'reason-input-' + data.subreddit + '-' + this.id;
                this.value = TB.storage.getCache('RReasons', this.id, this.value);
            });
        }

        function openPopup() {
            // Reset state
            $popup.find('attrs').attr(data);
            $popup.find('.selectable-reason input[type=checkbox]:checked').prop('checked', false);
            $popup.find('.selectable-reason.reason-selected').removeClass('reason-selected');
            $popup.find('.status').hide();//css('display: none;');
            $popup.find('.error-highlight').removeClass('error-highlight');
            $popup.find('.mte-thread-link').attr('href', data.url).text(data.title);

            // Open popup
            /*popup.css({
             display: ''
             });*/
            $popup.show();
            $body.css('overflow', 'hidden');
        }
    });

    // Popup events
    function removePopup(popup) {
        popup.remove();
        $body.css('overflow', 'auto');
    }

    $body.on('click', '.reason-popup', function (e) {
        e.stopPropagation();
    });

    // Selection/deselection of removal reasons
    $body.on('click', '.selectable-reason', function (e) {
        var $this = $(this);
        var checkBox = $this.find('.reason-check'),
            isChecked = checkBox.is(':checked'),
            targetIsCheckBox = $(e.target).is('.reason-check');
        var hasTitle = $this.find('.removal-reason-title').length;

        if (!isChecked && !targetIsCheckBox) {
            $this.addClass('reason-selected');
            checkBox.prop('checked', true);
            if (hasTitle > 0) {
                $this.find('.reason-content').show();
                $this.find('.flair-text-span').show();
                $this.find('.flair-css-span').show();
            }
        }
        else if (isChecked && targetIsCheckBox) {
            $this.addClass('reason-selected');
            if (hasTitle > 0) {
                $this.find('.reason-content').show();
                $this.find('.flair-text-span').show();
                $this.find('.flair-css-span').show();
            }
        }
        else if (!isChecked && targetIsCheckBox) {
            $this.removeClass('reason-selected');
            if (hasTitle > 0) {
                $this.find('.reason-content').hide();
                $this.find('.flair-text-span').hide();
                $this.find('.flar-css-span').hide();
            }
        }
    });

    // Toggle PM/reply/both notification method
    $body.on('click', '.reason-type', function () {
        self.setting('reasonType', this.value);
    });

    $body.on('click', '.reason-as-sub', function () {
        self.setting('reasonAsSub', $(this).prop('checked'));
    });

    // 'no reason' button clicked
    $body.on('click', '.reason-popup .no-reason', function () {
        var popup = $(this).parents('.reason-popup');
        removePopup(popup);
    });

    // 'cancel' button clicked
    $body.on('click', '.reason-popup .cancel', function () {
        var popup = $(this).parents('.reason-popup'),
            status = popup.find('.status'),
            attrs = popup.find('attrs');

        TBUtils.approveThing(attrs.attr('fullname'), function (successful) {
            if (successful)
                removePopup(popup);
            else
                status.text(APPROVE_ERROR);
        });
    });

    // 'save' button clicked
    $body.on('click', '.reason-popup .save', function () {
        var popup = $(this).parents('.reason-popup'),
            notifyBy = popup.find('.reason-type:checked').val(),
            notifyAsSub = popup.find('.reason-as-sub').prop('checked'),
            checked = popup.find('.reason-check:checked'),
            status = popup.find('.status'),
            attrs = popup.find('attrs'),
            subject = attrs.attr('subject'),
            logTitle = attrs.attr('logTitle'),
            header = attrs.attr('header'),
            footer = attrs.attr('footer'),
            logReason = popup.find('#log-reason-input').val(),
            data = {
                subreddit: '',
                fullname: '',
                author: '',
                title: '',
                kind: '',
                mod: '',
                url: '',
                link: '',
                domain: '',
                logSub: ''
            };

        // Update status
        status.text(STATUS_DEFAULT_TEXT);
        status.show();
        popup.find('.error-highlight').removeClass('error-highlight');

        // Check if reason checked
        var noneSelected = $('body').find('.reason-type:checked').val();
        if (!checked.length && noneSelected !== 'none') {
            var table = popup.find('#reason-table');
            popup.find('#reason-table').addClass('error-highlight');
            return status.text(NO_REASON_ERROR);
        }

        // Get custom reason input
        var markdownReasons = [];
        var customInput = [];
        var flairText = "", flairCSS = "";

        checked.closest('.selectable-reason').each(function () {
            // Get markdown-formatted reason
            var markdownReason = $(this).data('reasonMarkdown');
            markdownReasons.push(markdownReason);

            // Get input from HTML-formatted reason
            var htmlReason = $(this).find('.reason-content');
            htmlReason.find('select, input, textarea').each(function () {
                customInput.push(this.value);
            });

            //Get flair data
            var temp;
            if (temp = $(this).data('flairText'))
                flairText += " " + temp;
            if (temp = $(this).data('flairCSS'))
                flairCSS += " " + temp;
        });

        // Generate reason text
        var reason = '';

        //// Add response body
        var customIndex = 0;
        markdownReasons.forEach(function (markdownReason) {
            $('<div>' + markdownReason + '</div>').contents().each(function () {
                // If an element, check for conversions
                if (this.nodeType == Node.ELEMENT_NODE) {
                    switch (this.tagName.toLowerCase()) {
                        // Convert breaks to lots of newlines
                        case 'br':
                            reason += '\n\n';
                            break;

                        // Convert input elements to custom input (stored in order)
                        case 'select':
                        case 'input':
                        case 'textarea':
                            reason += customInput[customIndex++];
                            break;
                    }
                }
                // If a text node, get content
                else if (this.nodeType == Node.TEXT_NODE) {
                    reason += this.textContent;
                }
            })
        });

        // See if any of the reasons actually have text.
        var reasonlength = reason.trim().length;

        //// Add header if selected
        if (popup.find('#include-header').is(':checked')) {
            reason = header + '\n\n' + reason;
        }

        //// Add footer if selected
        if (popup.find('#include-footer').is(':checked')) {
            reason += '\n\n' + footer;
        }

        //// Convert attribs back to data.
        for (var i in data) {
            data[i] = attrs.attr(i);
        }

        reason = TBUtils.replaceTokens(data, reason);
        subject = TBUtils.replaceTokens(data, subject);
        logTitle = TBUtils.replaceTokens(data, logTitle);

        //// Clean up reason
        reason = reason.trim();

        // Flair post if required
        flairText = flairText.trim();
        flairCSS = flairCSS.trim();
        if ((flairText != "" || flairCSS != "") && data.kind != "comment") {
            TBUtils.flairPost(data.fullname, data.subreddit, flairText, flairCSS, function (successful, response) {
                if (!successful)
                    status.text(FLAIR_ERROR);
            });
        }

        // If logSub is not empty, log the removal and send a PM/comment
        if (data.logSub) {

            // Finalize log reasons
            if (logTitle.indexOf('{reason}') >= 0) {
                // Check if a log reason is selected
                if (!logReason) {
                    popup.find('#log-reason-input').addClass('error-highlight');
                    return status.text(LOG_REASON_MISSING_ERROR);
                }

                // Set log reason to entered reason
                logTitle = logTitle.replace('{reason}', logReason);
            }

            // Submit log post
            TBUtils.postLink(data.url || data.link, TBUtils.removeQuotes(logTitle), data.logSub, function (successful, response) {
                if (successful) {
                    var logLink = response.json.data.url;
                    var loglinkToken = response.json.data.url;
                    logLink = response.json.data.name;
                    TBUtils.approveThing(logLink);

                    if (noneSelected === 'none') {
                        removePopup(popup);
                    } else {
                        sendRemovalMessage(loglinkToken);
                    }
                }
                else {
                    status.text(LOG_POST_ERROR);
                }
            });

        }
        // Otherwise only send PM and/or comment
        else {
            sendRemovalMessage(null);
        }

        // Function to send PM and comment
        function sendRemovalMessage(logLink) {
            // If there is no message to send, don't send one.
            if (reasonlength < 1) {
                if ((flairText != "" || flairCSS != "") && data.kind != "comment") {
                    // We'll flair only flair, we are done here.
                    return removePopup(popup);
                } else {
                    return status.text(NO_REASON_ERROR);
                }
            }

            // Check if a valid notification type is selected
            if ((!notifyBy && !notifyAsSub) || (logLink == null && notifyBy == 'none')) {
                popup.find('#buttons').addClass('error-highlight');
                return status.text(NO_REPLY_TYPE_ERROR);
            }

            // Finalize the reason with optional log post link
            if (logLink !== 'undefined')
                reason = reason.replace('{loglink}', logLink);

            var notifyByPM = notifyBy == 'PM' || notifyBy == 'both',
                notifyByReply = notifyBy == 'reply' || notifyBy == 'both';

            // Reply to submission/comment
            if (notifyByReply) {
                self.log("Sending removal message by comment reply.");
                TBUtils.postComment(data.fullname, reason, function (successful, response) {
                    if (successful) {
                        // Check if reddit actually returned an error
                        if (response.json.errors.length > 0) {
                            status.text(REPLY_ERROR + ": " + response.json.errors[0][1]);
                        }
                        else {
                            // Distinguish the new reply
                            TBUtils.distinguishThing(response.json.data.things[0].data.id, false, function (successful, response) {
                                if (successful) {
                                    if (notifyByPM)
                                        sendPM();
                                    else
                                        removePopup(popup);
                                }
                                else {
                                    status.text(DISTINGUISH_ERROR);
                                }
                            });
                        }
                    }
                    else {
                        status.text(REPLY_ERROR);
                    }
                });
            }
            else if (notifyByPM) {
                sendPM();
            }

            // Send PM the user
            function sendPM() {
                var text = reason + '\n\n---\n[[Link to your ' + data.kind + '](' + data.url + ')]';

                if (notifyAsSub) {
                    self.log("Sending removal message by PM as " + data.subreddit);
                    TBUtils.sendMessage(data.author, subject, text, data.subreddit, function (successful, response) {
                        if (successful) {
                            removePopup(popup);
                        }
                        else {
                            status.text(PM_ERROR);
                        }
                    });
                }
                else {
                    self.log("Sending removal message by PM as current user");
                    TBUtils.sendPM(data.author, subject, text, function (successful, response) {
                        if (successful) {
                            removePopup(popup);
                        }
                        else {
                            status.text(PM_ERROR);
                        }
                    });
                }
            }
        }
    });

    // Reason textarea/input/select changed
    $body.on('change', '.reason-popup td input[id],.reason-popup td textarea[id],.reason-popup td select[id]', function () {
        TB.storage.setCache('RReasons', this.id, this.selectedIndex || this.value);
    });
};

TB.register_module(self);
} // end removalreasons()

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        removalreasons();
    });
})();
