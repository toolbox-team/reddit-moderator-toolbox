function modmacros() {
    const self = new TB.Module('Mod Macros');
    self.shortname = 'ModMacros';

    self.settings['enabled']['default'] = true;

    self.init = function () {
        const $body = $('body'),
            MACROS = 'TB-MACROS';

        function getConfig(sub, callback) {
            if (TBUtils.noConfig.indexOf(sub) !== -1) {
                self.log('TBUtils.noConfig.indexOf(sub) != -1');
                callback(false);
            }

            // get our config.
            if (TBUtils.configCache[sub] !== undefined) {
                callback(checkConfig(TBUtils.configCache[sub]), TBUtils.configCache[sub].modMacros);

            } else {
                TBUtils.readFromWiki(sub, 'toolbox', true, function (resp) {
                    if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                        self.log('!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN');
                        callback(false);
                    }

                    if (resp === TBUtils.NO_WIKI_PAGE) {
                        self.log('resp === TBUtils.NO_WIKI_PAGE');
                        TBUtils.noConfig.push(sub);
                        callback(false);
                    }
                    TBStorage.purifyObject(resp);

                    // We likely have a good config, but maybe not domain tags.
                    TBUtils.configCache[sub] = resp;
                    callback(checkConfig(TBUtils.configCache[sub]), TBUtils.configCache[sub].modMacros);
                });
            }

            function checkConfig(config) {
                if (!config.modMacros || config.modMacros.length < 1) {
                    self.log('!config.modMacros || config.modMacros.length < 1');
                    return false;
                }

                return true;
            }
        }

        function populateSelect(selectClass, subreddit, config) {
            $(selectClass).each(function () {
                const $select = $(this),
                    sub = $select.attr('data-subreddit');

                self.log($select);
                self.log(`${sub} ${subreddit}`);

                if (sub === subreddit) {
                    if($select.hasClass('tb-populated')) {
                        return;
                    }
                    $select.addClass('tb-populated');
                    $(config).each(function (idx, item) {
                        $($select)
                            .append($('<option>', {
                                value: idx
                            })
                                .text(item.title));
                    });

                } else {
                    self.log('removing select');
                    $select.remove();
                }
            });
        }

        if(TBUtils.isOldReddit) {
            TB.utils.getModSubs(function () {
                if (TB.utils.post_site && $.inArray(TB.utils.post_site, TB.utils.mySubs) != -1) {
                    self.log('getting config');
                    getConfig(TB.utils.post_site, function (success, config) {
                    // if we're a mod, add macros to top level reply button.
                        if (success && config.length > 0) {

                            const $usertextButtons = $('.commentarea>.usertext .usertext-buttons');
                            const $tbUsertextButtons = $usertextButtons.find('.tb-usertext-buttons'),
                                macroButtonHtml = `<select class="tb-top-macro-select tb-action-button" data-subreddit="${TB.utils.post_site}"><option value=${MACROS}>macros</option></select>`;

                            if ($tbUsertextButtons.length) {
                                $tbUsertextButtons.append(macroButtonHtml);
                            } else {
                                $usertextButtons.find('.status').before(`<div class="tb-usertext-buttons">${macroButtonHtml}</div>`);
                            }

                            populateSelect('.tb-top-macro-select', TB.utils.post_site, config);
                        }
                    });
                }
            });

            // add macro buttons after we click reply, if we're a mod.
            $body.on('click', 'ul.buttons a', function () {
                const $this = $(this);
                if ($this.text() === 'reply') {

                    const $thing = $this.closest('.thing'),
                        info = TB.utils.getThingInfo($thing, true);

                    // This is because reddit clones the top-level reply box for all reply boxes.
                    // We need to remove it before adding the new one, because the new one works differently.
                    // RES' @andytuba is a golden fucking god.
                    $thing.find('.tb-top-macro-select').remove();

                    // Don't add macro button twice.
                    $thing.find('.tb-macro-select').remove();

                    // are we a mod?
                    if (!info.subreddit) return;
                    self.log(info.subreddit);

                    // if we don't have a config, get it.  If it fails, return.
                    getConfig(info.subreddit, function (success, config) {
                    // if we're a mod, add macros to top level reply button.
                        if (success && config.length > 0) {

                            const $tbUsertextButtons = $thing.find('.usertext-buttons .tb-usertext-buttons'),
                                macroButtonHtml = `<select class="tb-macro-select tb-action-button" data-subreddit="${info.subreddit}"><option value=${MACROS}>macros</option></select>`;

                            if ($tbUsertextButtons.length) {
                                $tbUsertextButtons.append(macroButtonHtml);
                            } else {
                                $thing.find('.usertext-buttons .status').before(`<div class="tb-usertext-buttons">${macroButtonHtml}</div>`);
                            }

                            populateSelect('.tb-macro-select', info.subreddit, config);
                        }
                    });
                }
            });
        }

        // Add macro button in new modmail
        function addNewMMMacro() {
            const $thing = $body.find('.InfoBar'),
                info = TB.utils.getThingInfo($thing, true);

            // Don't add macro button twice.
            if ($body.find('.tb-usertext-buttons').length) return;

            // are we a mod?
            if (!info.subreddit) return;
            self.log(info.subreddit);

            // if we don't have a config, get it.  If it fails, return.
            getConfig(info.subreddit, function (success, config) {
            // if we're a mod, add macros to top level reply button.
                if (success && config.length > 0) {

                    const macroButtonHtml = `<select class="tb-macro-select tb-action-button" data-subreddit="${info.subreddit}"><option value=${MACROS}>macros</option></select>`;
                    $body.find('.ThreadViewerReplyForm__replyOptions').before(`<div class="tb-usertext-buttons tb-macro-newmm">${macroButtonHtml}</div>`);

                    populateSelect('.tb-macro-select', info.subreddit, config);
                }
            });
        }
        setTimeout(function () {
            if(TBUtils.isNewMMThread) {
                addNewMMMacro();
            }
        }, 1000);

        $('body').on('click', 'button:contains("Reply")', function() {
            const $this = $(this);
            const $comment = $this.closest('.Comment');
            const commentDetails = $comment.find('.tb-frontend-container[data-tb-type="comment"]').data('tb-details');
            const subreddit = commentDetails.data.subreddit.name;
            const thingID = commentDetails.data.id;

            TBUtils.getModSubs(function () {
                if(TBUtils.modsSub(subreddit)) {
                    getConfig(subreddit, function (success, config) {
                        // if we're a mod, add macros to top level reply button.
                        if (success && config.length > 0) {
                            const $macro = $(`
                                    <select class="tb-macro-select tb-action-button" data-subreddit="${subreddit}" data-thingID="${thingID}">
                                        <option value=${MACROS}>macros</option>
                                    </select>
                            `).appendTo($comment);
                            $comment.on('click', 'button[type="reset"], button[type="submit"]', () => {
                                $macro.remove();
                            });
                            populateSelect('.tb-macro-select', subreddit, config);
                        }
                    });
                }
            });
        });

        window.addEventListener('TBNewPage', function (event) {

            if(event.detail.pageType === 'subredditCommentsPage') {
                const subreddit = event.detail.pageDetails.subreddit;

                TBUtils.getModSubs(function () {
                    if(TBUtils.modsSub(subreddit)) {
                        getConfig(subreddit, function (success, config) {
                            // if we're a mod, add macros to top level reply button.
                            if (success && config.length > 0) {
                                $body.find('span:contains("Comment as")').closest('div').after(`
                                    <select class="tb-top-macro-select tb-action-button" data-subreddit="${subreddit}" data-thingID="t3_${event.detail.pageDetails.submissionID}">
                                        <option value=${MACROS}>macros</option>
                                    </select>
                                    `);
                                populateSelect('.tb-top-macro-select', subreddit, config);
                            }
                        });
                    } else {
                        // Remove all macros
                        $body.find('.tb-macro-select').remove();
                    }
                });
            } else {
                // Remove all macros
                $body.find('.tb-macro-select').remove();
            }

        });

        // NER support.
        window.addEventListener('TBNewThings', function () {
            if(TBUtils.isNewModmail) {
                setTimeout(function () {
                    addNewMMMacro();
                }, 1000);
            }
        });

        function editMacro(dropdown, info, macro, topLevel) {
        // get some placement variables

            const remove = macro.remove,
                approve = macro.approve,
                ban = macro.ban,
                mute = macro.mute,
                distinguish = macro.distinguish === undefined ? true : macro.distunguish,
                lock = macro.lockthread,
                sticky = macro.sticky,
                archivemodmail = macro.archivemodmail,
                highlightmodmail = macro.highlightmodmail,
                kind = info.kind;
            let $usertext = dropdown.closest('.usertext-edit'),
                comment = unescape(macro.text),
                actionList = 'The following actions will be performed:<br>- Your reply will be saved';

            if(!$usertext.length) {
                $usertext = dropdown.closest('.Comment');
            }

            if(!$usertext.length) {
                $usertext = dropdown.closest('div');
            }
            if (TBUtils.isNewModmail) {
                $usertext = $body.find('.ThreadViewerReplyForm');
            }

            if (!TB.utils.isModmail && !TB.utils.isNewModmail) {
                if (remove) {
                    actionList += `<br>- This ${kind} will be removed`;
                }

                if (approve) {
                    actionList += `<br>- This ${kind} will be approved`;
                }

                if (distinguish) {
                    actionList += '<br>- This reply will be distinguished';
                }

                if (lock) {
                    actionList += '<br>- This post will be locked';
                }

                if (sticky && topLevel) {
                    actionList += '<br>- This reply will be stickied';
                }
            }

            if (ban) {
                actionList += '<br>- This user will be banned';
            }

            if (mute) {
                actionList += '<br>- This user will be muted';
            }

            if (TB.utils.isNewModmail) {
                if (archivemodmail) {
                    actionList += '<br>- This modmail thread will be archived.';
                }

                if (highlightmodmail) {
                    actionList += '<br>- This modmail thread will be highlighted.';
                }

            }

            // replace token.
            comment = TB.utils.replaceTokens(info, comment);

            const offset = $usertext.offset(),
                offsetLeft = offset.left,
                offsetTop = offset.top,
                minHeight = $usertext.outerHeight(),
                editMinWidth = $usertext.outerWidth(),
                editMinHeight = minHeight - 74;

            const title = dropdown.find('option:selected').text();
            self.log(title);
            const $macroPopup = TB.ui.popup(
                `Mod Macro: ${title}`,
                [
                    {
                        title: 'Mod Macro:',
                        id: `macro${info.id}`, // reddit has things with class .role, so it's easier to do this than target CSS
                        tooltip: `Mod Macro:${title}`,
                        content: `<textarea class="tb-input macro-edit-area" data-response-id="${info.id}">${comment}</textarea><br>
                                    <span>${actionList}</span>`,
                        footer: `<button class="macro-send-${info.id} tb-action-button">Post Macro</button>`
                    }
                ],
                '',
                'macro-popup', // class
                `macro-${info.id}` // id
            ).appendTo('body')
                .css({

                    'left': `${offsetLeft}px`,
                    'top': `${offsetTop}px`,
                    'min-height': `${minHeight}px`,
                    display: 'block'
                });

            if (TBUtils.isNewModmail) {
                $macroPopup.css('max-width', '100%');
            }
            $macroPopup.find('.macro-edit-area').css({
                'min-height': `${editMinHeight}px`,
                'min-width': `${editMinWidth}px`
            });

            $macroPopup.on('click', `.macro-send-${info.id}`, function () {
                const $currentMacroPopup = $(this).closest('.macro-popup'),
                    $selectElement = $body.find(`#macro-dropdown-${info.id}`),
                    editedcomment = $currentMacroPopup.find('.macro-edit-area').val();

                if ($selectElement.val() !== MACROS) {
                    self.log('Replying with:');
                    self.log(`  ${editedcomment}`);

                    // We split of new modmail from the rest of reddit because... well easier.
                    if (TBUtils.isNewModmail) {

                        // Since we are doing things on the page that need to finish we probably should make that clear.
                        TB.ui.longLoadSpinner(true);

                        if ($('.ThreadViewer  .icon-mute').closest('.InfoBar__control').hasClass('m-on')) {
                            TBui.textFeedback('Reply will not be posted because the user is muted.', TBui.FEEDBACK_NEUTRAL);
                        } else {
                            $body.find('.Textarea.ThreadViewerReplyForm__replyText ').val(editedcomment);
                            $body.find('.ThreadViewerReplyForm__replyButton').click();
                        }

                        self.log('Performing user actions');

                        if (ban) {
                            TBUtils.friendUser(info.author, 'banned', info.subreddit,
                                `Banned from: ${info.permalink}`,
                                `For the following ${kind}: ${info.permalink}`);
                        }

                        if (mute) {
                        // So we don't do an api call for this.
                            $body.find('.ThreadViewer .InfoBar__control:not(.m-on) .icon-mute').click();

                        }

                        if (highlightmodmail) {
                            $body.find('.ThreadViewer .ThreadViewerHeader__control:not(.m-selected) .icon-flair').click();
                        }

                        if (archivemodmail) {
                        // We wait a bit for the other actions to go through, then archive.
                            setTimeout(function () {
                                $body.find('.ThreadViewer .ThreadViewerHeader__control:not(.m-selected) .icon-archived').click();
                            }, 1000);

                        }

                        // All done! Wait a bit before removing all stuff.
                        setTimeout(function () {
                            $currentMacroPopup.remove();
                            $selectElement.prop('disabled', false);
                            $selectElement.val(MACROS);
                            TB.ui.longLoadSpinner(false);
                        }, 1500);

                    } else {

                        TBUtils.postComment(info.id, editedcomment, function (successful, response) {
                            if (!successful) {
                                TB.ui.textFeedback('Failed to post reply', TB.ui.FEEDBACK_NEGATIVE);
                            } else {
                                TB.ui.textFeedback('Reply posted', TB.ui.FEEDBACK_POSITIVE);
                                $currentMacroPopup.remove();
                                $selectElement.prop('disabled', false);
                                if (topLevel) {
                                    $selectElement.val(MACROS);
                                } else {
                                    $selectElement.closest('.usertext-buttons').find('.cancel').trigger('click');
                                }

                                if (distinguish && !TB.utils.isModmail) {
                                // Distinguish the new reply
                                    TBUtils.distinguishThing(response.json.data.things[0].data.id, sticky && topLevel, function (successful) {
                                        if (!successful) {
                                            $currentMacroPopup.remove();
                                            TB.ui.textFeedback('Failed to distinguish reply', TB.ui.FEEDBACK_NEGATIVE);
                                        }
                                    });
                                }
                            }
                        });

                        if (!TB.utils.isModmail && !TB.utils.isNewModmail) {
                            self.log('Performing non-modmail actions');

                            if (remove) {
                                TB.utils.removeThing(info.id, false);
                            }

                            if (approve) {
                                TB.utils.approveThing(info.id);
                            }

                            if (lock) {
                                TB.utils.lockThread(info.id);
                            }
                        }

                        self.log('Performing user actions');

                        if (ban) {
                            TBUtils.friendUser(info.author, 'banned', info.subreddit,
                                `Banned from: ${info.permalink}`,
                                `For the following ${kind}: ${info.permalink}`);
                        }

                        if (mute) {
                            self.log(`  Muting "${info.author}" from /r/${info.subreddit} @ ${info.permalink}`);
                            TBUtils.friendUser(info.author, 'muted', info.subreddit,
                                `Muted from: ${info.permalink}`);
                        }

                    }

                }
            });
        }

        $body.on('click', '.macro-popup .close', function () {

            const $currentMacroPopup = $(this).closest('.macro-popup'),
                infoId = $currentMacroPopup.find('.macro-edit-area').attr('data-response-id'),
                $selectElement = $body.find(`#macro-dropdown-${infoId}`);

            $selectElement.val(MACROS);
            $currentMacroPopup.remove();
            $selectElement.prop('disabled', false);
        });

        $body.on('change', '.tb-top-macro-select, .tb-macro-select', function () {

            const $this = $(this),
                sub = $this.closest('select').attr('data-subreddit'),
                thingID = $this.closest('select').attr('data-thingID'),
                index = $this.val(),
                topLevel = $this.hasClass('tb-top-macro-select');
            let info;

            self.log(`Macro selected: index=${index}`);
            self.log(`  subreddit=${sub}`);

            // disable the select box to prevent a mess with creating multiple popup boxes.
            $this.prop('disabled', 'disabled');
            // If it's a top-level reply we need to find the post's info.
            if (topLevel) {
                self.log('toplevel');
                info = TB.utils.getThingInfo($('#siteTable').find('.thing:first'));
            } else {
                info = TB.utils.getThingInfo($this.closest('.thing'));
            }

            self.log(info);

            getConfig(sub, function (success, config) {
                if (success && config.length > 0) {
                    const macro = config[index];

                    if(thingID) {
                        TBUtils.getApiThingInfo(thingID, sub, false, function(thinginfo) {
                            $this.attr('id', `macro-dropdown-${thinginfo.id}`);
                            editMacro($this, thinginfo, macro, topLevel);
                        });
                    } else {
                        // add unique id to the dropdown
                        $this.attr('id', `macro-dropdown-${info.id}`);
                        editMacro($this, info, macro, topLevel);
                    }

                }
            });
        });
    };

    TB.register_module(self);
}

window.addEventListener('TBModuleLoaded2', function () {
    modmacros();
});
