function modmacros() {


var macros = new TB.Module('Mod Macros');
macros.shortname = 'ModMacros';

macros.settings['enabled']['default'] = false;
macros.config['betamode'] = true;

macros.init = function macrosInit() {

    var $body = $('body'),
        macroConfig,
        MACROS = 'TB-MACROS',
        STYLE = 'background: transparent;padding-top: 2px;padding-right: 1px;padding-bottom: 4px;padding-left: 3px;';

    //$.log($body);
    //$.log(TB.utils.config);
    function setConfig(config) {
        if (!config.modMacros || config.modMacros.length < 1) {
            macros.log("!config.modMacros || config.modMacros.length < 1");
            return false;
        }
        macroConfig = config.modMacros;
        return true;
    }

    function getConfig(sub, callback) {
        if (TBUtils.noConfig.indexOf(sub) != -1) {
            macros.log("TBUtils.noConfig.indexOf(sub) != -1");
            callback(false);
        }

        // get our config.
        if (TBUtils.configCache[sub] !== undefined) {
            callback(setConfig(TBUtils.configCache[sub]));

        } else {
            TBUtils.readFromWiki(sub, 'toolbox', true, function (resp) {
                if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                    macros.log("!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN");
                    callback(false);
                }

                if (resp === TBUtils.NO_WIKI_PAGE) {
                    macros.log("resp === TBUtils.NO_WIKI_PAGE");
                    TBUtils.noConfig.push(sub);
                    callback(false);
                }

                // We likely have a god config, but maybe not domain tags.
                TBUtils.configCache[sub] = resp;
                callback(setConfig(TBUtils.configCache[sub]));
            });
        }
    }

    function populateSelect(selectClass) {
        $(macroConfig).each(function (i, item) {
            $(selectClass)
                .append($('<option>', {
                    value: item.text
                })
                    .text(item.title));
        });
    }

    TB.utils.getModSubs(function() {
        if (TB.utils.post_site && $.inArray(TB.utils.post_site, TB.utils.mySubs) != -1) {
            macros.log("getting config");
            getConfig(TB.utils.post_site, function (success) {
                // if we're a mod, add macros to top level reply button.
                if (success) {
                    $('.commentarea>.usertext .usertext-buttons .save').after('<select class="tb-top-macro-select" style="' + STYLE + '"><option value=' + MACROS + '>macros</option></select>');
                    populateSelect('.tb-top-macro-select');
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

            // if we don't have a config, get it.  If it fails, return.
            if (!macroConfig) {

                getConfig(info.subreddit, function (success) {
                    // if we're a mod, add macros to top level reply button.
                    if (success) {
                        $thing.find('.usertext-buttons .cancel').after('<select class="tb-macro-select" style="' + STYLE + '"><option value=' + MACROS + '>macros</option></select>');
                        populateSelect('.tb-macro-select');
                    }
                });

                return;
            }

            $thing.find('.usertext-buttons .cancel').after('<select class="tb-macro-select" style="' + STYLE + '"><option value=' + MACROS + '>macros</option></select>');
            populateSelect('.tb-macro-select');
        }
    });

    function editMacro(dropdown, info, comment, topLevel) {
        // get some placement variables

        var $usertext = dropdown.closest('.usertext-edit')

        var offset = $usertext.offset(),
            offsetLeft = offset.left,
            offsetTop = offset.top,
            minHeight = $usertext.outerHeight(),
            editMinWidth = $usertext.outerWidth(),
            editMinHeight = minHeight- 74;

        var title = dropdown.find('option:selected').text();
        console.log(title)
        $macroPopup = TB.ui.popup(
            'Mod Macro: ' + title,
            [
                {
                    title: 'Mod Macro:',
                    id: 'macro' + info.id, // reddit has things with class .role, so it's easier to do this than target CSS
                    tooltip: 'Mod Macro:' + title,
                    content: '<textarea class="macro-edit-area" data-toplevel="'+ topLevel +'" data-id="' + info.id + '">' + comment + '</textarea>',
                    footer: '<button class="macro-send">Post Macro</button>'
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
    }

    $body.on('click', '.macro-popup .close', function (e) {
        var $currentMacroPopup = $(this).closest('.macro-popup'),
            infoId = $currentMacroPopup.find('.macro-edit-area').data('id'),
            $selectElement = $body.find('#macro-dropdown-'+ infoId);

        $selectElement.val(MACROS);

        $currentMacroPopup.remove();
        $selectElement.prop('disabled', false);
    });

    $body.on('click', '.macro-popup .macro-send', function () {
        var $currentMacroPopup = $(this).closest('.macro-popup'),
            topLevel = $currentMacroPopup.find('.macro-edit-area').data('toplevel'),
            infoId = $currentMacroPopup.find('.macro-edit-area').data('id'),
            $selectElement = $body.find('#macro-dropdown-'+ infoId),
            editedcomment = $currentMacroPopup.find('.macro-edit-area').val();

        if ($selectElement.val() !== MACROS) {
            TBUtils.postComment(infoId, editedcomment, function (successful, response) {
                if (!successful) {
                    TB.ui.textFeedback('Failed to post reply', TB.ui.FEEDBACK_NEGATIVE);
                } else {
                    // Distinguish the new reply
                    TBUtils.distinguishThing(response.json.data.things[0].data.id, function (successful) {
                        if (!successful) {
                            $currentMacroPopup.remove();
                            TB.ui.textFeedback('Failed to distinguish reply', TB.ui.FEEDBACK_NEGATIVE);
                        } else {
                            TB.ui.textFeedback('Reply posted', TB.ui.FEEDBACK_POSITIVE);
                            $currentMacroPopup.remove();
                            $selectElement.prop('disabled', false);
                            if (topLevel) {
                                $selectElement.val(MACROS);
                            } else {
                                $selectElement.closest('.usertext-buttons').find('.cancel').trigger('click');
                            }
                        }
                    });
                }
            });
        }
    });

    $body.on('change', '.tb-top-macro-select, .tb-macro-select', function (e) {
        if (!macroConfig) return;

        var $this = $(this),
            comment = unescape($this.val()),
            topLevel = (e.target.className === 'tb-top-macro-select'),
            info;
            // disable the select box to prevent a mess with creating multiple popup boxes.
            $this.prop('disabled', 'disabled');
            // If it's a top-level reply we need to find the post's info.
            if (topLevel) {
                info = TB.utils.getThingInfo($('#siteTable .thing:first'));
            } else {
                info = TB.utils.getThingInfo($this);
            }

            // replace token.
            comment = TB.utils.replaceTokens(info, comment);

            // add unique id to the dropdown
            $this.attr('id', 'macro-dropdown-'+ info.id)
            editMacro($this, info, comment, topLevel);
    });
};

TB.register_module(macros);
}

(function () {
    // wait for storage
    window.addEventListener("TBUtilsLoaded", function () {
        modmacros();
    });
})();
