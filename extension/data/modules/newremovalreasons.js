'use strict';

function newremovalreasons() {
    const self = new TB.Module('New Removal Reasons');
    self.shortname = 'new_removal_reasons';

    self.settings['enabled']['default'] = true;

    self.register_setting('commentReasons', {
        type: 'boolean',
        default: false,
        title: 'Enable removal reasons for comments.',
    });

    self.register_setting('alwaysShow', {
        type: 'boolean',
        default: false,
        title: 'Show an empty removal reason box for subreddits that don\'t have removal reasons.',
    });

    // Storage settings.
    self.register_setting('reasonType', {
        type: 'selector',
        values: ['Reply with a comment to the item that is removed', 'Send as PM (personal message)', 'Send as both PM and reply', 'None (This only works when a logsub has been set)'],
        default: 'reply',
        title: 'Method of sending removal reasons.',
    });

    self.register_setting('reasonAsSub', {
        type: 'boolean',
        default: false,
        advanced: false,
        title: 'Send removal reasons as a subreddit. <b>Note:</b> these will appear in modmail and potentially clutter it up.',
    });

    self.register_setting('reasonAutoArchive', {
        type: 'boolean',
        default: false,
        advanced: false,
        title: 'Auto-archive sent modmail pm. <b>Note:</b> Only works on new modmail.',
    });

    self.register_setting('reasonSticky', {
        type: 'boolean',
        default: false,
        title: 'Leave removal reasons as a sticky comment.',
    });

    self.register_setting('actionLock', {
        type: 'boolean',
        default: false,
        title: 'Lock threads after leaving a removal reason.',
    });

    self.register_setting('actionLockComment', {
        type: 'boolean',
        default: false,
        title: 'Lock removal reasons when replying as a comment.',
    });

    // Default is escape()'d: <textarea id="customTextarea" placeholder="Enter Custom reason"></textarea>
    // May make this a user setting, one day.
    self.register_setting('customRemovalReason', {
        type: 'string',
        default: '%3Ctextarea%20id%3D%22customTextarea%22%20%20class%3D%22tb-input%22%20placeholder%3D%22Enter%20Custom%20reason%22%3E%3C/textarea%3E',
        hidden: true,
    });

    // Error texts
    const STATUS_DEFAULT_TEXT = 'saving...',
        APPROVE_ERROR = 'error, failed to approve post',
        FLAIR_ERROR = 'error, failed to flair post',
        NO_REASON_ERROR = 'error, no reason selected',
        NO_REPLY_TYPE_ERROR = 'error, no reply type selected',
        REPLY_ERROR = 'error, failed to post reply',
        PM_ERROR = 'error, failed to send PM',
        MODMAIL_ERROR = 'error, failed to send Modmail',
        MODMAIL_ARCHIVE_ERROR = 'error, failed to archive sent Modmail',
        DISTINGUISH_ERROR = 'error, failed to distinguish reply',
        LOCK_POST_ERROR = 'error, failed to lock post',
        LOCK_COMMENT_ERROR = 'error, failed to lock reply',
        LOG_REASON_MISSING_ERROR = 'error, public log reason missing',
        LOG_POST_ERROR = 'error, failed to create log post';

    // Set up markdown renderer
    SnuOwnd.DEFAULT_HTML_ELEMENT_WHITELIST.push('select', 'option', 'textarea', 'input');
    SnuOwnd.DEFAULT_HTML_ATTR_WHITELIST.push('id', 'placeholder', 'label', 'value');
    const MARKDOWN_PARSER = SnuOwnd.getParser(SnuOwnd.getRedditRenderer(SnuOwnd.DEFAULT_BODY_FLAGS | SnuOwnd.HTML_ALLOW_ELEMENT_WHITELIST));

    // helper function that converts the specified element constructed
    // of markdown and possible inline html into the equivalent markdown
    // with the inputs replaced by their legitimate values.
    function reasonElementToMarkdown(entry) {
        let markdown = "";

        let $inputs = entry.$element.find(".styled-reason").find("select, input, textarea");
        let indexCounter = 0;

        console.log(`<div>${entry.reason.text}</div>`);
        $(`<div>${entry.reason.text}</div>`).contents().each((_, el) => {
            // If an element, check for conversions
            if (el.nodeType === Node.ELEMENT_NODE) {
                switch (el.tagName.toLowerCase()) {
                    // Convert breaks to lots of newlines
                    case 'br':
                        markdown += '\n\n';
                        break;

                    // Convert input elements to custom input (stored in order)
                    case 'select':
                    case 'input':
                    case 'textarea':
                        markdown += $inputs[indexCounter++].value || "";
                        break;
                }
            } else if (el.nodeType === Node.TEXT_NODE) {
                // If a text node, get content
                markdown += el.textContent;
            }
        });

        return markdown;
    }

    // settings: settings of removal reasons as returned from getRemovalReasonsSettings
    // title: title of the modal
    // context: string shown at the top providing context for the removal reason popup
    // show: either "submission", "comment" or "all" to determine which options to list
    // returns a promise that resolves with the chosen options, or a promise that resolves
    // with null if the user selected nothing, or a promise that rejects if the user cancelled
    async function promptRemovalReason(settings, title, context, show = "all") {
        // Render header and footer. Note that the strings will be empty if no header/footer is
        // set, so this will always succeed as long as the input was valid.
        const headerText = MARKDOWN_PARSER.render(settings.header);
        const footerText = MARKDOWN_PARSER.render(settings.footer);

        // whether to show various parts
        const headerDisplay = settings.header ? "" : "none";
        const footerDisplay = settings.footer ? "" : "none";
        const hasCustomLogReason = settings.logSub && settings.logTitle.includes("{reason}");
        const logReasonDisplay = hasCustomLogReason ? "" : "none";
        const isThread = show === "submission" || show === "all";

        // defaults for reply options
        const replyType = settings.forceSettings ? settings.replyType : ({
            "reply_with_a_comment_to_the_item_that_is_removed": "reply",
            "send_as_pm_(personal_message)": "pm",
            "send_as_both_pm_and_reply": "both",
            "none_(this_only_works_when_a_logsub_has_been_set)": "none"
        } [self.setting("reasonType")] || "reply");

        // Construct popup.
        const $popup = $( /* html */ `
            <div class="reason-popup">
                <div class="reason-popup-content">
                    <div class="reason-popup-header">${title}</div>

                    <div class="reason-popup-innercontent">
                        ${context}

                        <!-- Header -->
                        <div class="styled-reason" id="header-reason" style="display: ${headerDisplay}">
                            <p>
                                <label for="include-header">
                                    <input type="checkbox" id="include-header" checked>
                                    Include header.
                                </label>

                                ${headerText}
                            </p>
                        </div>

                        <!-- Removal reasons -->
                        <table id="removal-reasons-table">
                            <thead>
                                <tr>
                                    <th class="removal-toggle"></th>
                                    <th class="reason">reason</th>
                                    <th class="flair-text">flair text</th>
                                    <th class="flair-css">flair css</th>
                                </tr>
                            </thead>
                            <tbody id="reason-table"></tbody>
                        </table>

                        <!-- Footer -->
                        <div class="styled-reason" id="footer-reason" style="display: ${footerDisplay}">
                            <p>
                                <label for="include-footer">
                                    <input type="checkbox" id="include-footer" checked>
                                    Include footer.
                                </label>

                                ${footerText}
                            </p>
                        </div>

                        <!-- Send options -->
                        <div id="buttons">
                            <ul>
                                <!-- Reply with a comment. -->
                                <li>
                                    <label>
                                        <input class="reason-type" type="radio" value="reply" name="reply-type">
                                        Reply with a comment to the item that is removed.
                                    </label>
                                    
                                    <ul>
                                        <li>
                                            <input ${!isThread ? "disabled" : ""} class="reason-sticky" type="checkbox" id="type-stickied">
                                            <label for="type-stickied">Sticky the removal comment.</label>
                                        </li>

                                        <li>
                                            <input class="action-lock-comment" id="type-action-lock-comment" type="checkbox">
                                            <label for="type-action-lock-comment">Lock the removal comment.</label>
                                        </li>
                                    </ul>
                                </li>

                                <!-- Send a PM -->
                                <li>
                                    <label>
                                        <input class="reason-type" type="radio" value="pm" name="reply-type">
                                        Send as PM (personal message)
                                    </label>

                                    <ul>
                                        <li>
                                            <input class="reason-as-sub" type="checkbox" id="type-as-sub">
                                            <label for="type-as-sub">Send pm via modmail as subreddit. <b>Note:</b> This will clutter up modmail.</label>
                                        </li>

                                        <li>
                                            <input class="reason-auto-archive" type="checkbox" id="type-auto-archive">
                                            <label for="type-auto-archive">Automatically archive the sent modmail. <b>Note:</b> Only works when using new modmail.</label>
                                        </li>
                                    </ul>
                                </li>

                                <!-- Both -->
                                <li>
                                    <label>
                                        <input class="reason-type" type="radio" value="both" name="reply-type">
                                        Send as both PM and reply.
                                    </label>
                                </li>

                                <!-- None -->
                                <li style="display: ${settings.logSub ? "" : "none"}">
                                    <label>
                                        <input class="reason-type" type="radio" value="none" name="reply-type">
                                        Don't send a removal message, only log the removed thread.
                                    </label>
                                </li>

                                <!-- Remove the thread -->
                                <li>
                                    <input class="action-lock-thread" id="type-action-lock-thread" type="checkbox">
                                    <label for="type-action-lock-thread">Lock the removed thread.</label>
                                </li>
                            </ul>
                        </div>

                        <!-- Logging options -->
                        <div id="log-reason" style="display: ${logReasonDisplay}">
                            <p>
                                Log Reason(s):
                                <input id="log-reason-input" type="text" class="tb-input" name="logReason">
                            </p>

                            <p>
                                (Used for posting a log to /r/${settings.logSub}. Will only be used when "send" is clicked.) </label>
                            </p>
                        </div>
                    </div>

                    <div class="reason-popup-footer">
                        <span class="status error"></span>
                        <button class="save tb-action-button">send</button>
                        <button class="no-reason tb-action-button">no reason</button>
                        <button class="cancel tb-action-button">cancel and approve</button>
                    </div>
                </div>
            </div>
        `);

        // Fill values.
        if (settings.forceSettings) {
            // disable all sending options if we force settings
            $popup.find("#buttons input").prop("disabled", true);
        }

        // Disable certain options if we're not removing a thread.
        if (!isThread) {
            $popup.find("#type-stickied").prop("disabled", true);
            $popup.find("#type-action-lock-thread").prop("disabled", true);
        }

        // populate inputs
        $popup.find("input[name=reply-type]").val([replyType]); // set reply type
        $popup.find("#type-stickied").prop("checked", settings.forceSettings ? settings.stickyComment : self.setting('reasonSticky'));
        $popup.find("#type-action-lock-comment").prop("checked", settings.forceSettings ? settings.lockComment : self.setting('actionLockComment'));
        $popup.find("#type-as-sub").prop("checked", settings.forceSettings ? settings.sendPMAsSub : self.setting('reasonAsSub'));
        $popup.find("#type-auto-archive").prop("checked", settings.forceSettings ? settings.autoArchivePM : self.setting('reasonAutoArchive'));
        $popup.find("#type-action-lock-thread").prop("checked", settings.forceSettings ? settings.lockThread : self.setting("actionLock"));
        $popup.find("#log-reason-input").val(settings.logReason);

        const reasonInputs = [];

        // populate reasons and set up listeners for them
        for (let i = 0; i < settings.reasons.length; i++) {
            const reason = settings.reasons[i];
            if ((show === "submission" && !reason.appliesToPosts) || (show === "comment" && !reason.appliesToComments)) {
                continue;
            }

            const reasonMarkdown = `${reason.text}\n\n`;
            const reasonHtml = MARKDOWN_PARSER.render(reasonMarkdown);

            const $tr = $( /* html */ `
                <tr class="selectable-reason">
                    <td class="removal-toggle">
                        <input type="checkbox" class="reason-check" name="reason-${i}" />
                        <div class="reason-num">${i + 1}</div>
                    </td>

                    <td class="reason">
                        <div class="removal-reason-title">${reason.title || ""}</div>
                        <div class="styled-reason reason-content">${reasonHtml}<br></div>
                    </td>

                    <td class="flair-text">
                        <span class="flair-text-span">${reason.flairText || ""}</span>
                    </td>

                    <td class="flair-css">
                        <span class="flair-css-span">${reason.flairCSS || ""}</span>
                    </td>
                </tr>
            `);

            // if we have a title, hide details until checked.
            // else, remove the title.
            if (reason.title) {
                $tr.find(".styled-reason, .flair-text-span, .flair-css-span").hide();
            } else {
                $tr.find(".removal-reason-title").remove();
            }

            $popup.find("#reason-table").append($tr);

            // setup element in the list, attach listeners for toggling select
            const reasonInputEntry = {
                $element: $tr,
                reason,
                selected: false
            };

            $tr.on("click", (e) => {
                const clickedOnCheckbox = $(e.target).is(".reason-check");

                // if not selected, clicking anywhere will select it.
                if (!reasonInputEntry.selected) {
                    reasonInputEntry.selected = true;
                    $tr.addClass("reason-selected");
                    $tr.find(".reason-check").prop("checked", true);

                    // show contents if we're only showing the title
                    if (reason.title) {
                        $tr.find(".styled-reason, .flair-text-span, .flair-css-span").show();
                    }
                } else if (clickedOnCheckbox) {
                    // only deselect if we explicitly clicked on the checkbox
                    reasonInputEntry.selected = false;
                    $tr.removeClass("reason-selected");
                    $tr.find(".reason-check").prop("checked", false);

                    // only hide the contents if we have a title to show
                    if (reason.title) {
                        $tr.find(".styled-reason, .flair-text-span, .flair-css-span").hide();
                    }
                }
            });

            reasonInputs.push(reasonInputEntry);
        }

        // pre-fill input elements in the custom reasons (inputs, textareas)
        $popup.find('.reason-content input[id], .reason-content textarea[id]').each(async (i, el) => {
            el.id = `reason-input-${settings.subreddit}-${el.id}`;
            el.value = await TB.storage.getCache('RReasons', el.id, el.value);
        });

        // listen to changes to these input elements and persist them to cache
        $popup.on("change", ".reason-content input[id], .reason-content textarea[id]", function () {
            TB.storage.setCache('RReasons', this.id, this.selectedIndex || this.value);
        });

        $popup.appendTo('body');

        // return a promise that resolves/rejects based on the button pressed
        return new Promise((resolve, reject) => {
            // no reason, resolve with null
            $popup.find(".no-reason").on("click", () => {
                $popup.remove();
                resolve(null);
            });

            // cancel, reject
            $popup.find(".cancel").on("click", () => {
                $popup.remove();
                reject();
            });

            // save, compute values and resolve with them
            $popup.find(".save").on("click", () => {
                const result = {};
                const $status = $popup.find(".status");
                const replyType = $popup.find("input[name=reply-type]:checked").val();

                // Step 1: compute removal message
                const selected = reasonInputs.filter(x => x.selected);
                if (!selected.length && replyType !== "none") {
                    // none selected
                    $status.text(NO_REASON_ERROR);
                    return;
                }

                let message = "";
                let flairText = "";
                let flairCSS = "";
                let flairTemplateID = "";
                for (const selectedReason of selected) {
                    // convert reason to markdown with inputs filled
                    message += "\n\n" + reasonElementToMarkdown(selectedReason);
                    flairText += " " + selectedReason.reason.flairText;
                    flairCSS += " " + selectedReason.reason.flairCSS;
                    flairTemplateID = selectedReason.reason.flairTemplateID;
                }

                if ($popup.find("#include-header").is(":checked")) {
                    message = `${settings.header}${message}`; // message is already prefixed with double newline
                }

                if ($popup.find("#include-footer").is(":checked")) {
                    message += `\n\n${settings.footer}`;
                }

                message = message.trim();

                // step 2: assign data

                // assign flair settings
                if (isThread) {
                    flairText = flairText.trim();
                    flairCSS = flairCSS.trim();

                    result.submission = {
                        lock: $popup.find("#type-action-lock-thread").is(":checked"),
                        flair: (flairText.length || flairCSS.length || flairTemplateID) ? {
                            text: flairText,
                            css: flairCSS,
                            templateID: flairTemplateID.trim() || null
                        } : null
                    };
                }

                // comment reply
                if ((replyType === "reply" || replyType === "both") && message.length) {
                    result.comment = {
                        content: message,
                        lock: $popup.find("#type-action-lock-comment").is(":checked"),
                        sticky: $popup.find("#type-stickied").is(":checked"),
                    };
                }

                // dm reply
                if ((replyType === "dm" || replyType === "both") && message.length) {
                    result.dm = {
                        subject: settings.pmSubject,
                        content: message,
                        asSub: $popup.find("#type-as-sub").is(":checked"),
                        archive: $popup.find("#type-auto-archive").is(":checked")
                    };
                }

                // log sub
                if (settings.logSub) {
                    const removeReason = $popup.find('#log-reason-input').val().trim();
                    
                    if (hasCustomLogReason && !removeReason.length) {
                        $status.text(LOG_REASON_MISSING_ERROR);
                        return;
                    }

                    result.logSubmission = {
                        subreddit: settings.logSub,
                        title: TBHelpers.removeQuotes(settings.logTitle.replace("{reason}", removeReason))
                    };
                }

                console.log(JSON.stringify(result, null, 4));

                // step 3: remove and return
                $popup.remove();
                resolve(result);
            });
        });
    }
    window.promptRemovalReason = promptRemovalReason; // hack

    // Returns { id, subreddit } of the given element, where the given element is something
    // inside the comment/submission (will extract closest parent)
    function findThingID($el) {
        if (TBCore.isOldReddit) {
            const $thing = $el.closest('.thing, .tb-thing');
            const isComment = $thing.hasClass('comment') || $thing.hasClass('was-comment') || $thing.hasClass('tb-comment');

            return {
                id: $thing.attr('data-fullname'),
                subreddit: $thing.attr('data-subreddit'),
                isComment
            };
        } else {
            const $button = $el.find(".tb-add-removal-reason");

            if ($button) {
                return {
                    id: $button.attr('data-id'),
                    subreddit: $button.attr('data-subreddit'),
                    isComment: $button.closest('.tb-frontend-container').data('tb-type') === 'comment'
                };
            } else {
                const $parent = $el.closest('.Post');
                const postDetails = $parent.find('.tb-frontend-container[data-tb-type="post"]').data('tb-details');

                return {
                    id: postDetails.data.id,
                    subreddit: postDetails.data.subreddit.name,
                    isComment: false
                };
            }
        }
    }

    /**
     * Applies the result of `result` to the element to the given thingInfo, where
     * thingInfo is the result of calling `getAPIThingInfo` on the data.
     */
    async function applyRemovalResult(thingInfo, result) {
        // Step 1: figure out the data of the object we're removing
        const data = {
            subreddit: thingInfo.subreddit,
            fullname: thingInfo.id,
            author: thingInfo.user,
            title: thingInfo.title,
            kind: thingInfo.kind,
            mod: thingInfo.mod,
            url: thingInfo.permalink,
            link: thingInfo.postlink,
            domain: thingInfo.domain,
            logSub: result.logSubmission ? result.logSubmission.subreddit : "",
            body: thingInfo.body,
            raw_body: thingInfo.raw_body,
            uri_body: thingInfo.uri_body || encodeURIComponent(thingInfo.body),
            uri_title: thingInfo.uri_title || encodeURIComponent(thingInfo.title),
        };

        // Step 2: remove the actual object, if it wasn't already
        // we do this async
        TBCore.getApiThingInfo(data.fullname, data.subreddit, false, ({ ham }) => {
            if (!ham) {
                TBApi.removeThing(data.fullname);
            }
        });

        // Step 3: flair if needed
        if (result.submission && result.submission.flair) {
            const flair = result.submission.flair;
            await TBApi.flairPost(data.fullname, data.subreddit, flair.text, flair.css, flair.templateID);
        }

        // Step 4: post to log sub if needed
        if (result.logSubmission) {
            await TBApi.postLink(data.url || data.link, result.logSubmission.title, result.logSubmission.subreddit).then(response => {
                // approve immediately, set the log link
                data.loglink = response.json.data.url;

                return TBApi.approveThing(response.json.data.name);
            });
        }

        // Step 5: post the removal message, if needed
        if (result.comment) {
            // substitute data
            const content = TBHelpers.replaceTokens(data, result.comment.content);

            const comment = await TBApi.postComment(data.fullname, content).then(x => x.json.data.things[0]);

            // distinguish (and sticky if needed)
            await TBApi.distinguishThing(comment.data.id, result.comment.sticky);

            // lock if needed
            if (result.comment.lock) {
                await TBApi.lock(comment.data.id);
            }
        }

        // Step 6: lock submission if needed
        if (result.submission && result.submission.lock) {
            await TBApi.lock(data.fullname);
        }

        // Step 7: send dm if needed
        if (result.dm) {
            // we need to find out if this sub uses old or new modmail
            // load mod sub info
            await new Promise(r => TBCore.getModSubs(r));

            const subredditData = TBCore.mySubsData.find(s => s.subreddit === data.subreddit);
            const useNewModmail = result.dm.asSub && result.dm.archive && subredditData && subredditData.is_enrolled_in_new_modmail;

            const subject = TBHelpers.replaceTokens(data, result.dm.subject);
            const message = `${TBHelpers.replaceTokens(data, result.dm.content)}\n\n---\n[[Link to your ${data.kind}](${data.url})]`;

            if (useNewModmail) {
                const conversation = await TBApi.apiOauthPOST("/api/mod/conversations", {
                    to: data.author,
                    isAuthorHidden: true,
                    subject,
                    body: message,
                    srName: data.subreddit
                }).then(x => x.json()).then(x => x.conversation);

                if (result.dm.archive && !conversation.isInternal) {
                    await TBApi.apiOauthPOST(`/api/mod/conversations/${conversation.id}/archive`);
                }
            } else {
                await TBApi.sendMessage(data.author, subject, message, result.dm.asSub ? data.subreddit : undefined);
            }
        }

        // Done!
    }

    async function possiblyAddSuggestedRemovalButton($target, data) {
        const automodReport = data.modReports.find(x => x.startsWith("AutoModerator: "));
        if (!automodReport) return;

        const suggestions = await TBHelpers.getSuggestedReasonsForSubreddit(data.subreddit.name);

        // find matching suggestion
        let match = null;
        for (const [k, v] of Object.entries(suggestions)) {
            const regex = new RegExp("^AutoModerator: " + k + "$");
            if (!regex.test(automodReport)) continue;

            match = v;
        }

        if (!match) return;

        // add button if we have one that matches
        $target.append(`<span class="tb-bracket-button tb-remove-using-suggested-reason">Remove with suggested reason</span>`);

        // handle clicks
        $target.on("click", ".tb-remove-using-suggested-reason", async () => {
            // get info on the thing
            const thingData = await new Promise(r => TBCore.getApiThingInfo(data.id, data.subreddit.name, false, r));

            // apply removal
            await applyRemovalResult(thingData, match);

            // signify ok
            TB.ui.textFeedback("Removed!", TB.ui.FEEDBACK_POSITIVE);
        });
    }

    self.init = function () {
        console.log("Inite");

        // Check if removal reasons are runnable
        if (TBCore.isModmail) {
            self.log('Disabled because modmail');
            return;
        }

        // set up listeners
        TB.listener.on('post', e => {
            const $target = $(e.target);
            possiblyAddSuggestedRemovalButton($target, e.detail.data);

            if (e.detail.data.isRemoved && TBCore.pageDetails.pageType !== 'queueListing') {
                $target.append(`<span class="tb-bracket-button tb-add-removal-reason" data-id="${e.detail.data.id}" data-subreddit="${e.detail.data.subreddit.name}">Add removal reason (new)</span>`);
            }
        });

        if (self.setting('commentReasons')) {
            TB.listener.on('comment', e => {
                const $target = $(e.target);
                possiblyAddSuggestedRemovalButton($target, e.detail.data);

                if (e.detail.data.isRemoved && TBCore.pageDetails.pageType !== 'queueListing') {
                    $target.append(`<span class="tb-bracket-button tb-add-removal-reason" data-id="${e.detail.data.id}" data-subreddit="${e.detail.data.subreddit.name}">Add removal reason (new)</span>`);
                }
            });
        }

        // Open reason drop-down when we remove something as ham.
        $('body').on('click', 'button:contains("remove"), button:contains("Confirm removal"), .tb-add-removal-reason, .big-mod-buttons > span > .pretty-button.neutral, .remove-button, .tb-submission-button-remove, .tb-comment-button-remove', async function (event) {
            const $button = $(this);
            const { id, subreddit, isComment } = findThingID($button);

            // load data and removal reasons
            const data = await new Promise(r => TBCore.getApiThingInfo(id, subreddit, false, r));
            const reasons = await TBHelpers.getRemovalReasonsSettings(subreddit);

            // todo: confirm remove here immediately

            // ask user for the removal reason
            const result = await promptRemovalReason(
                reasons,
                `Removal reasons for /r/${subreddit}:`,
                `Removing: <a class="mte-thread-link" href="${data.url}" target="_blank">${TBHelpers.htmlEncode(data.title)}</a>`,
                isComment ? "comment" : "submission"
            );

            if (!result) return; // selected none

            // perform result
            await applyRemovalResult(data, result);
        });
    };

    TB.register_module(self);
} // end newremovalreasons()

window.addEventListener('TBModuleLoaded', () => {
    newremovalreasons();
});
