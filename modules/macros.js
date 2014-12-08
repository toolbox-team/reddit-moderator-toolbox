function modmacros() {


var macros = new TB.Module('Mod Macros');
macros.shortname = 'ModMacros';

macros.settings["enabled"]["default"] = false;
macros.config["betamode"] = true;
macros.config["needs_mod_subs"] = true;

macros.init = function macrosInit() {

    var $body = $('body'),
        macroConfig,
        MACROS = 'TB-MACROS',
        STYLE = 'background: transparent;padding-top: 2px;padding-right: 1px;padding-bottom: 4px;padding-left: 3px;';

    function setConfig(config) {
        if (!config.modMacros || config.modMacros.length < 1) {
            $.log("!config.modMacros || config.modMacros.length < 1");
            return false;
        }
        macroConfig = config.modMacros;
        return true;
    }

    function getConfig(sub, callback) {
        if (TBUtils.noConfig.indexOf(sub) != -1) {
            $.log("TBUtils.noConfig.indexOf(sub) != -1");
            callback(false);
        }

        // get our config.
        if (TBUtils.configCache[sub] !== undefined) {
            callback(setConfig(TBUtils.configCache[sub]));

        } else {
            TBUtils.readFromWiki(sub, 'toolbox', true, function (resp) {
                if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                    $.log("!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN");
                    callback(false);
                }

                if (resp === TBUtils.NO_WIKI_PAGE) {
                    $.log("resp === TBUtils.NO_WIKI_PAGE");
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
            $.log("getting config", false, 'modmacros');
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

    $body.on('change', '.tb-top-macro-select, .tb-macro-select', function (e) {
        if (!macroConfig) return;

        var $this = $(this),
            comment = unescape($this.val()),
            topLevel = (e.target.className === 'tb-top-macro-select'),
            info;

        // If it's a top-level reply we need to find the post's info.
        if (topLevel) {
            info = TB.utils.getThingInfo($('#siteTable .thing:first'));
        } else {
            info = TB.utils.getThingInfo($this);
        }

        // replace token.
        comment = TB.utils.replaceTokens(info, comment);

        if ($this.val() !== MACROS) {
            TBUtils.postComment(info.id, comment, function (successful, response) {
                if (!successful) {
                    TB.utils.textFeedback('Failed to post reply', 'negative');
                } else {
                    // Distinguish the new reply
                    TBUtils.distinguishThing(response.json.data.things[0].data.id, function (successful) {
                        if (!successful) {
                            TB.utils.textFeedback('Failed to distinguish reply', 'negative');
                        } else {
                            TB.utils.textFeedback('Reply posted', 'positive');
                            if (topLevel) {
                                $this.val(MACROS);
                            } else {
                                $this.closest('.usertext-buttons').find('.cancel').trigger('click');
                            }
                        }
                    });
                }
            });
        }
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
