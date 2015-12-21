function modmacros() {
var self = new TB.Module('Mod Macros');
self.shortname = 'ModMacros';

self.settings['enabled']['default'] = true;

self.init = function () {
    var $body = $('body'),
        MACROS = 'TB-MACROS';


    function getConfig(sub, callback) {
        if (TBUtils.noConfig.indexOf(sub) != -1) {
            self.log("TBUtils.noConfig.indexOf(sub) != -1");
            callback(false);
        }

        // get our config.
        if (TBUtils.configCache[sub] !== undefined) {
            callback(checkConfig(TBUtils.configCache[sub]), TBUtils.configCache[sub].modMacros);

        } else {
            TBUtils.readFromWiki(sub, 'toolbox', true, function (resp) {
                if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                    self.log("!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN");
                    callback(false);
                }

                if (resp === TBUtils.NO_WIKI_PAGE) {
                    self.log("resp === TBUtils.NO_WIKI_PAGE");
                    TBUtils.noConfig.push(sub);
                    callback(false);
                }

                // We likely have a god config, but maybe not domain tags.
                TBUtils.configCache[sub] = resp;
                callback(checkConfig(TBUtils.configCache[sub]), TBUtils.configCache[sub].modMacros);
            });
        }

        function checkConfig(config) {
            if (!config.modMacros || config.modMacros.length < 1) {
                self.log("!config.modMacros || config.modMacros.length < 1");
                return false;
            }

            return true;
        }
    }

    function populateSelect(selectClass, subreddit, config) {
        $(selectClass).each(function () {
            var $select = $(this),
                sub = $select.attr('data-subreddit');

            self.log($select);
            self.log(sub + ' ' + subreddit);

            if (sub == subreddit) {
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

    TB.utils.getModSubs(function () {
        if (TB.utils.post_site && $.inArray(TB.utils.post_site, TB.utils.mySubs) != -1) {
            self.log("getting config");
            getConfig(TB.utils.post_site, function (success, config) {
                // if we're a mod, add macros to top level reply button.
                if (success && config.length > 0) {

                    var $usertextButtons = $('.commentarea>.usertext .usertext-buttons');
                    var $tbUsertextButtons = $usertextButtons.find('.tb-usertext-buttons'),
                        macroButtonHtml = '<select class="tb-top-macro-select tb-action-button" data-subreddit="'+ TB.utils.post_site +'"><option value=' + MACROS + '>macros</option></select>';

                    if ($tbUsertextButtons.length) {
                        $tbUsertextButtons.append(macroButtonHtml);
                    } else {
                        $usertextButtons.find('.status').before('<div class="tb-usertext-buttons">'+ macroButtonHtml +'</div>');
                    }


                    populateSelect('.tb-top-macro-select', TB.utils.post_site, config);
                }
            });
        }
    });

    // add macro buttons after we click reply, if we're a mod.
    $body.on('click', 'ul.buttons a', function () {
        var $this = $(this);
        if ($this.text() === 'reply') {

            var $thing = $this.closest('.thing'),
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

                    var $tbUsertextButtons = $thing.find('.usertext-buttons .tb-usertext-buttons'),
                        macroButtonHtml = '<select class="tb-macro-select tb-action-button" data-subreddit="' + info.subreddit + '"><option value=' + MACROS + '>macros</option></select>';

                    if ($tbUsertextButtons.length) {
                        $tbUsertextButtons.append(macroButtonHtml);
                    } else {
                        $thing.find('.usertext-buttons .status').before('<div class="tb-usertext-buttons">'+ macroButtonHtml +'</div>');
                    }

                    populateSelect('.tb-macro-select', info.subreddit, config);
                }
            });
        }
    });

    function editMacro(dropdown, info, macro, topLevel) {
        // get some placement variables

        var $usertext = dropdown.closest('.usertext-edit'),
            comment = unescape(macro.text),
            remove = macro.remove,
            approve = macro.approve,
            ban = macro.ban,
            mute = macro.mute,
            distinguish = macro.distinguish,
            lock = macro.lockthread,
            sticky = macro.sticky,
            actionList = 'The following actions will be performed:<br>- Your reply will be saved',
            kind = info.kind;

        // If it's undefined assume previous default behaviour and always distinguish.
        if (macro.distinguish === undefined) {
            distinguish = true;
        }

        if (!TB.utils.isModmail) {
            if (remove) {
                actionList += '<br>- This ' + kind + ' will be removed';
            }

            if (approve) {
                actionList += '<br>- This ' + kind + ' will be approved';
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

        // replace token.
        comment = TB.utils.replaceTokens(info, comment);

        var offset = $usertext.offset(),
            offsetLeft = offset.left,
            offsetTop = offset.top,
            minHeight = $usertext.outerHeight(),
            editMinWidth = $usertext.outerWidth(),
            editMinHeight = minHeight - 74;

        var title = dropdown.find('option:selected').text();
        self.log(title);
        var $macroPopup = TB.ui.popup(
            'Mod Macro: ' + title,
            [
                {
                    title: 'Mod Macro:',
                    id: 'macro' + info.id, // reddit has things with class .role, so it's easier to do this than target CSS
                    tooltip: 'Mod Macro:' + title,
                    content: '<textarea class="macro-edit-area" data-response-id="'+ info.id + '">' + comment + '</textarea><br>\
                    <span>'+ actionList +'</span>',
                    footer: '<button class="macro-send-'+ info.id +' tb-action-button">Post Macro</button>'
                }
            ],
            '',
            'macro-popup', // class
            'macro-' + info.id // id
        ).appendTo('body')
            .css({
                'left': offsetLeft + 'px',
                'top': offsetTop + 'px',
                'min-height': minHeight + 'px',
                display: 'block'
            });

        $macroPopup.find('.macro-edit-area').css({
            'min-height': editMinHeight + 'px',
            'min-width': editMinWidth + 'px'
        });

        $body.on('click', '.macro-popup .macro-send-'+ info.id +'', function () {
            var $currentMacroPopup = $(this).closest('.macro-popup'),
                $selectElement = $body.find('#macro-dropdown-' + info.id),
                editedcomment = $currentMacroPopup.find('.macro-edit-area').val();

            if ($selectElement.val() !== MACROS) {
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
                            TBUtils.distinguishThing(response.json.data.things[0].data.id, sticky, function (successful) {
                                if (!successful) {
                                    $currentMacroPopup.remove();
                                    TB.ui.textFeedback('Failed to distinguish reply', TB.ui.FEEDBACK_NEGATIVE);
                                }
                            });
                        }
                    }
                });

                if (!TB.utils.isModmail) {
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

                if (ban) {
                    TBUtils.friendUser(info.author, 'banned', info.subreddit,
                    'Banned from: ' + info.permalink,
                    'For the following '+ kind + ': ' + info.permalink);
                }

                if (mute) {
                    TBUtils.friendUser(info.author, 'muted', info.subreddit,
                        'Banned from: ' + info.permalink);
                }

            }
        });
    }

    $body.on('click', '.macro-popup .close', function (e) {

        var $currentMacroPopup = $(this).closest('.macro-popup'),
            infoId = $currentMacroPopup.find('.macro-edit-area').attr('data-response-id'),
            $selectElement = $body.find('#macro-dropdown-' + infoId);


        $selectElement.val(MACROS);
        $currentMacroPopup.remove();
        $selectElement.prop('disabled', false);
    });

    $body.on('change', '.tb-top-macro-select, .tb-macro-select', function (e) {

        var $this = $(this),
            sub = $this.closest('select').attr('data-subreddit'),
            index = $this.val(),
            topLevel = $this.hasClass('tb-top-macro-select'),
            info;

        // disable the select box to prevent a mess with creating multiple popup boxes.
        $this.prop('disabled', 'disabled');
        // If it's a top-level reply we need to find the post's info.
        if (topLevel) {
            self.log('toplevel');
            info = TB.utils.getThingInfo($('#siteTable .thing:first'));
        } else {
            info = TB.utils.getThingInfo($this);
        }

        self.log(sub);
        getConfig(sub, function (success, config) {
            if (success && config.length > 0) {
                var macro = config[index];

                // add unique id to the dropdown
                $this.attr('id', 'macro-dropdown-' + info.id);
                editMacro($this, info, macro, topLevel);
            }
        });
    });
};

TB.register_module(self);
}

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        modmacros();
    });
})();
