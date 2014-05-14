// ==UserScript==
// @name	Toolbox - Removal Reasons
// @include	http://reddit.com/*
// @include	http://*.reddit.com/*
// @version	1.0
// @run-at	document-start
// ==/UserScript==

// Add script to the page
(function removalreasons() {
    // I don't actually know why this works the way it does, but without them modtools doesn't load.
    if (!document.head)
        return setTimeout(removalreasons);
    if (!document.body)
        return setTimeout(removalreasons);

    if (!TBUtils.logged || !TBUtils.getSetting('RemovalReasons', 'enabled', true) || TBUtils.isModmail) return;
    $.log('Loading Removal Reasons Module');
    
    // The CSS that was supposed to be added but wasn't actually being added by the old version looked weird.
    // So I disabled it for now.
    //if (TBUtils.isModpage || TBUtils.isModFakereddit) {
    //	$('body').addClass('mod-page');
    //}
    
    // Error texts
    var STATUS_DEFAULT_TEXT			= "saving...",
        APPROVE_ERROR				= "error, failed to approve post",
        FLAIR_ERROR					= "error, failed to flair post",
        NO_REASON_ERROR				= "error, no reason selected",
        NO_REPLY_TYPE_ERROR			= "error, no reply type selected",
        REPLY_ERROR					= "error, failed to post reply",
        PM_ERROR					= "error, failed to send PM",
        DISTINGUISH_ERROR			= "error, failed to distinguish reply",
        LOG_REASON_MISSING_ERROR	= "error, public log reason missing",
        LOG_POST_ERROR				= "error, failed to create log post";
    
    // Default texts
    var DEFAULT_LOG_TITLE	= "Removed: {kind} by /u/{author} to /r/{subreddit}",
        DEFAULT_BAN_TITLE	= "/u/{author} has been {title} from /r/{subreddit} for {reason}";
    
    // Cached data
    var notEnabled = [],
        //because of the CSS fallback, we can't use TBUtils.noConfig.
        commentsEnabled = TBUtils.getSetting('RemovalReasons', 'commentreasons', false);
    
    function getRemovalReasons(subreddit, callback) {
        $.log('getting config: ' + subreddit);
        var reasons = '';
        
        // See if we have the reasons in the cache.
        if (TBUtils.configCache[subreddit] !== undefined) {
            reasons = TBUtils.configCache[subreddit].removalReasons;

            // If we need to get them from another sub, recurse.
            if (reasons && reasons.getfrom) {
                getRemovalReasons(reasons.getfrom, callback); //this may not work.
                return;
            }
        }

        // If we have removal reasons, send them back.
        if (reasons) {
            $.log('returning: cache');
            callback(reasons);
            return;
        }

        // OK, they are not cached.  Try the wiki.
        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || !resp.removalReasons) {
                $.log('failed: wiki config');
                callback(false);
                return;
            }

            // We have a valid config, cache it.
            TBUtils.configCache[subreddit] = resp;
            reasons = resp.removalReasons;

            // Again, check if there is a fallback sub, and recurse.
            if (reasons && reasons.getfrom) {
                $.log('trying: get from, no cache');
                getRemovalReasons(reasons.getfrom, callback); //this may not work.
                return;
            }

            // Last try, or return false.
            if (reasons) {
                $.log('returning: no cache');
                callback(reasons);
                return;
            }

            $.log('falied: all');
            callback(false);
            return;
        });
    }

    // Open reason drop-down when we remove something as ham.
    $('body').delegate('.big-mod-buttons > span > .pretty-button.neutral, .remove-button', 'click', function() {
        // Ignore if a comment and comment reasons disabled
        var thingclasses = $(this).parents('div.thing').attr('class');
        if (thingclasses.match(/\bcomment\b/) && !commentsEnabled)
            return;
        
        // Get link/comment attributes
        var button = $(this),
            thing = button.closest('.thing'),
            yes = button.find('.yes')[0],
            info = TBUtils.getThingInfo(button),
            data = {
                subreddit: info.subreddit,
                fullname: info.id,
                author: info.user,
                title: info.title,
                kind: info.kind,
                mod: TBUtils.logged,
                url: info.permalink,
                link: info.postlink,
                domain: info.domain
            };
        
        // Causes recursion loop.
        button.removeClass('remove-button');

        if (!data.subreddit || notEnabled.indexOf(data.subreddit) != -1)
            return;
        
        // Set attributes and open reason box if one already exists for this subreddit
        var popup = $('#reason-popup-' + data.subreddit);
        if (popup.length) {
            // Click yes on the removal
            if (yes) yes.click();
            
            openPopup();
            
            return false;
        }
        
        // Get removal reasons.
        getRemovalReasons(data.subreddit, function (response) {
            // Removal reasons not enabled
            if (!response || response.reasons.length < 1) {
                notEnabled.push(data.subreddit);
                return;
            }
            
            // Click yes on the removal

            // FUCKED: now loops forever until jquery overflows.  
            // The reason is the 'yes' button has the class remove-button
            // Which has never fucking changed.  
            if (yes) yes.click();
            
            
            // Get PM subject line
            data.subject = response.pmsubject || 'Your {kind} was removed from {subreddit}';

            // Add additional data that is found in the wiki JSON.  
            // Any HTML needs to me unescaped, because we store it escaped in the wiki.
            data.logreason = response.logreason || '';
            data.header = unescape(response.header || '');
            data.footer = unescape(response.footer || '');
            data.logsub = response.logsub || '';
            data.logtitle = response.logtitle || DEFAULT_LOG_TITLE;
            data.bantitle = response.bantitle || DEFAULT_BAN_TITLE;

            // Loop through the reasons... unescaping each.
            data.reasons = [];
            $(response.reasons).each(function () {
                data.reasons.push({
                    text : unescape(this.text),
                    flairText : this.flairText,
                    flairCSS : this.flairCSS
                });
            });
            
            // Open popup
            createPopup();
            openPopup();
        });
        
        function createPopup() {
            // Options
            var logDisplay = data.logsub ? '' : 'none',
                headerDisplay = data.header ? '' : 'none',
                footerDisplay = data.footer ? '' : 'none';
            
            var reasonType = TBUtils.getSetting('cache', 'reason-type', 'none');
            
            // Set up markdown renderer
            SnuOwnd.DEFAULT_HTML_ELEMENT_WHITELIST.push('select', 'option', 'textarea', 'input');
            SnuOwnd.DEFAULT_HTML_ATTR_WHITELIST.push('id');
            var parser = SnuOwnd.getParser(SnuOwnd.getRedditRenderer(SnuOwnd.DEFAULT_BODY_FLAGS | SnuOwnd.HTML_ALLOW_ELEMENT_WHITELIST));
            
            // Render header and footer
            var headerText = data.header ? parser.render(data.header) : '',
                footerText = data.footer ? parser.render(data.footer) : '';
            
            // Make box & add reason radio buttons
            var popup = $('\
                <div class="reason-popup" id="reason-popup-' + data.subreddit + '" > \
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
                            <table> \
                                <thead><tr> \
                                    <th></th> \
                                    <th>reason</th> \
                                    <th>flair text</th> \
                                    <th>flair css</th> \
                                </tr></thead> \
                                <tbody id="reason-table" /> \
                            </table> \
                            <div class="styled-reason" id="footer-reason" style="display:' + footerDisplay + '"> \
                                <p>	\
                                    <input type="checkbox" id="include-footer" checked> Include footer. </input><br />\
                                    <label id="reason-footer" name="footer">' + footerText + '</label> \
                                </p> \
                            </div> \
                            <div id="buttons"> \
                                <input class="reason-type" type="radio" id="type-PM-' + data.subreddit + '" value="PM"	name="type-' + data.subreddit + '"' + (reasonType == 'PM' ? ' checked="1"' : '') + '><label for="type-PM-' + data.subreddit + '">PM</label> / \
                                <input class="reason-type" type="radio" id="type-reply-' + data.subreddit + '" value="reply" name="type-' + data.subreddit + '"' + (reasonType == 'reply' ? ' checked="1"' : '') + '><label for="type-reply-' + data.subreddit + '">reply</label> / \
                                <input class="reason-type" type="radio" id="type-both-' + data.subreddit + '" value="both"  name="type-' + data.subreddit + '"' + (reasonType == 'both' ? ' checked="1"' : '') + '><label for="type-both-' + data.subreddit + '">both</label> \
                                <span style="display:' + logDisplay + '"> / \
                                    <input class="reason-type" type="radio" id="type-none-' + data.subreddit + '" value="none"  name="type-' + data.subreddit + '"' + (reasonType == 'none' ? ' checked="1"' : '') + '><label for="type-none-' + data.subreddit + '">none</label> \
                                </span> \
                            </div> \
                            <div id="log-reason" style="display:' + logDisplay + '"> \
                                <p>Log Reason(s): \
                                    <input id="log-reason-input" type="text" name="logreason" value="' + data.logreason + '" /> \
                                </p> \
                                <p> \
                                    (Used for posting a log to /r/' + data.logsub + '. Will only be used when "send" is clicked.) </label> \
                                </p> \
                            </div> \
                        </div> \
                        <div class="reason-popup-footer"> \
                            <input type="hidden" name="tom_or_not" value="no-tom"> \
                            <span class="status error" style="display:none">This is an easter egg.</span> \
                            <button class="save">send</button> \
                            <button class="no-reason">no reason</button> \
                            <button class="cancel">cancel and approve</button> \
                        </div> \
                    </div> \
                </div>');
            
            popup = $(popup).appendTo('body').find('attrs').attr(data).end();
            
            // Render reasons and add to popup
            $(data.reasons).each(function(index) {
                var reasonMarkdown = this.text + '\n\n';
                var reasonHtml = parser.render(reasonMarkdown);
                
                var tr = $('\
                    <tr class="selectable-reason"> \
                        <td> \
                            <input type="checkbox" class="reason-check" name="reason-' + data.subreddit + '" id="reason-' + data.subreddit + '-' + index + '" /> \
                            <div class="reason-num">' + (index+1) + '</div> \
                        </td> \
                        <td> \
                            <div class="styled-reason reason-content ' + data.subreddit + '-' + index + '">' + reasonHtml + '<br /></div> \
                        </td> \
                        <td>' + (this.flairText? this.flairText : "") + '</td> \
                        <td>' + (this.flairCSS? this.flairCSS : "") + '</td> \
                    </tr>');
                
                tr.data({
                    reasonId : index,
                    reasonMarkdown: reasonMarkdown,
                    flairText: this.flairText,
                    flairCSS: this.flairCSS
                });
                popup.find('tbody').append(tr);
            });
            
            // Pre-fill reason input elements which have IDs.
            popup.find('.reason-content input[id], .reason-content textarea[id]').each(function () {
                this.id = 'reason-input-' + data.subreddit + '-' + this.id;
                this.value = TBUtils.getSetting('cache', this.id, this.value);
            });
        }
        
        function openPopup() {
            // Reset state
            popup.find('attrs').attr(data);
            popup.find('.selectable-reason input[type=checkbox]:checked').attr('checked', false);
            popup.find('.selectable-reason.reason-selected').removeClass('reason-selected');
            popup.find('.status').hide();//css('display: none;');
            popup.find('.error-highlight').removeClass('error-highlight');
            popup.find('.mte-thread-link').attr('href', data.url).text(data.title);
            
            // Open popup
            /*popup.css({
                display: ''
            });*/
            popup.show();
        }
    });
    
    // Popup events
    
    $('body').delegate('.reason-popup', 'click', function (e) {
        e.stopPropagation();
    });
    
    // Selection/deselection of removal reasons
    $('body').delegate('.selectable-reason', 'click', function (e) {
        var checkBox = $(this).find('.reason-check'),
            isChecked = checkBox.is(':checked'),
            targetIsCheckBox = $(e.target).is('.reason-check');
        
        if (!isChecked && !targetIsCheckBox) {
            $(this).addClass('reason-selected');
            checkBox.prop('checked', true);
        }
        else if (isChecked && targetIsCheckBox) {
            $(this).addClass('reason-selected');
        }
        else if (!isChecked && targetIsCheckBox) {
            $(this).removeClass('reason-selected');
        }
    });
    
    // Toggle PM/reply/both notification method
    $('body').delegate('.reason-type', 'click', function () {
        TBUtils.setSetting('cache', 'reason-type', this.value);
    });
    
    // 'no reason' button clicked
    $('body').delegate('.reason-popup .no-reason', 'click', function () {
        $(this).parents('.reason-popup').hide();
    });
    
    // 'cancel' button clicked
    $('body').delegate('.reason-popup .cancel', 'click', function () {
        var popup = $(this).parents('.reason-popup'),
            status = popup.find('.status'),
            attrs = popup.find('attrs');
        
        TBUtils.approveThing(attrs.attr('fullname'), function (successful) {
            if(successful)
                popup.remove();
            else
                status.text(APPROVE_ERROR);
        });
    });
    
    // 'save' button clicked
    $('body').delegate('.reason-popup .save', 'click', function () {
        var popup = $(this).parents('.reason-popup'),
            notifyBy = popup.find('.reason-type:checked').val(),
            checked = popup.find('.reason-check:checked'),
            status = popup.find('.status'),
            attrs = popup.find('attrs'),
            subject = attrs.attr('subject'),
            logtitle = attrs.attr('logtitle'),
            header = attrs.attr('header'),
            footer = attrs.attr('footer'),
            logreason = popup.find('#log-reason-input').val(),
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
                logsub: ''
            };
        
        // Update status
        status.text(STATUS_DEFAULT_TEXT);
        status.show();
        popup.find('.error-highlight').removeClass('error-highlight');
        
        // Check if reason checked
        if (!checked.length) {
            var table = popup.find('#reason-table');
            popup.find('#reason-table').addClass('error-highlight');
            return status.text(NO_REASON_ERROR);
        }
        
        // Get custom reason input
        var markdownReasons = [];
        var customInput = [];
        var flairText = "", flairCSS = "";
        
        checked.closest('.selectable-reason').each(function() {
            // Get markdown-formatted reason
            var markdownReason = $(this).data('reasonMarkdown');
            markdownReasons.push(markdownReason);
            
            // Get input from HTML-formatted reason
            var htmlReason = $(this).find('.reason-content');
            htmlReason.find('select, input, textarea').each(function() {
                customInput.push(this.value);
            });
            
            //Get flair data
            var temp;
            if(temp = $(this).data('flairText'))
                flairText += " " + temp;
            if(temp = $(this).data('flairCSS'))
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
        
        //// Replace reason variables
        for (i in data) {
            var pattern = new RegExp('{' + i + '}', 'mig');
            data[i] = attrs.attr(i);
            reason = reason.replace(pattern, data[i]);
            subject = subject.replace(pattern, data[i]);
            logtitle = logtitle.replace(pattern, data[i]);
        }
        
        //// Clean up reason
        reason = reason.trim();
        
        // Flair post if required
        flairText = flairText.trim();
        flairCSS = flairCSS.trim();
        if((flairText != "" || flairCSS != "") && data.kind != "comment") {
            TBUtils.flairPost(data.fullname, data.subreddit, flairText, flairCSS, function(successful, response){
                if(!successful)
                    status.text(FLAIR_ERROR);
            });
        }
        
        // If logsub is not empty, log the removal and send a PM/comment
        if (data.logsub) {
            // Check if a log reason is selected
            if (!logreason) {
                popup.find('#log-reason-input').addClass('error-highlight');
                return status.text(LOG_REASON_MISSING_ERROR);
            }
            
            // Set log reason to entered reason
            logtitle = logtitle.replace('{reason}', logreason);
            
            // Submit log post
            TBUtils.postLink(data.url || data.link, TBUtils.removeQuotes(logtitle), data.logsub, function(successful, response) {
                if(successful) {
                    var logLink = response.json.data.url;
                    
                    logLink = logLink.match(/https?:\/\/www.reddit.com\/r\/.+?\/comments\/([^\/]+?)\/.*/);
                    logLink = 't3_' + logLink[1];
                    TBUtils.approveThing(logLink);
                    
                    sendRemovalMessage(logLink);
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
            if (reasonlength < 1) return popup.remove();
            
            // Check if a valid notification type is selected
            if (!notifyBy || (logLink == null && notifyBy == 'none')) {
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
                TBUtils.postComment(data.fullname, reason, function(successful, response) {
                    if(successful) {
                        // Check if reddit actually returned an error
                        if(response.json.errors.length > 0) {
                            status.text(REPLY_ERROR+": " + response.json.errors[0][1]);
                        }
                        else {
                            // Distinguish the new reply
                            TBUtils.distinguishThing(response.json.data.things[0].data.id, function(successful, response) {
                                if(successful) {
                                    if(notifyByPM)
                                        sendPM();
                                    else
                                        popup.remove();
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
            else {
                sendPM();
            }
            
            // Send PM the user
            function sendPM() {
                if (notifyByPM) {
                    TBUtils.sendPM(data.author, subject, reason + '\n\n---\n[[Link to your ' + data.kind + '](' + data.url + ')]', function(successful, response) {
                        if(successful) {
                            popup.remove();
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
    $('body').delegate('.reason-popup td input[id],.reason-popup td textarea[id],.reason-popup td select[id]', 'change', function () {
        TBUtils.setSetting('cache', this.id, this.selectedIndex || this.value);
    });
})();
