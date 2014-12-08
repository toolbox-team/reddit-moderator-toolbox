function tbconfig() {
//Setup
    var TBConfig = new TB.Module('Toolbox Config');
    TBConfig.shortname = 'TBConfig'; // for backwards compatibility
    //Default settings
    TBConfig.settings['enabled']['default'] = true;

    TBConfig.init = function () {

        var $body = $('body');

        // set up some variables.
        var toolbox = $('#moderation_tools').find('.content .icon-menu'),
            configLink = '<li><img src="data:image/png;base64,' + TBui.iconWrench + '"/><span class="separator"></span><a href="javascript:;" class="toolbox-edit" title="toolbox configuration for this subreddit">toolbox configuration</a></li>',
            subreddit = TBUtils.post_site,
            config = TBUtils.config;

        // only load on definite subreddits
        if (!subreddit) {
            $.log('Aborting: invalid subreddit', false, 'TBConfig');
            return;
        }

        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                $.log('Failed: wiki config', false, 'TBConfig');
                return;
            }

            config = resp;
            init();
        });

        function init() {
            $(toolbox).append(configLink);
        }

        $body.on('click', '.toolbox-edit', function () {
            showSettings();
        });

        function postToWiki(page, data, reason, isJSON, updateAM) {
            $.log("posting to wiki");
            TB.ui.textFeedback('saving to wiki', TB.ui.FEEDBACK_NEUTRAL);
            TBUtils.postToWiki(page, subreddit, data, reason, isJSON, updateAM, function done(succ, err) {
                $.log("save succ = " + succ);
                console.log("save succ = " + succ);
                if (!succ) {
                    $.log(err.responseText, true);
                    TB.ui.textFeedback(err.responseText, TB.ui.FEEDBACK_NEGATIVE);
                } else {
                    $.log("clearing cache");
                    TB.ui.textFeedback('wiki page saved', TB.ui.FEEDBACK_POSITIVE);
                    TBUtils.clearCache();
                }
            });
        }

        // Create the window overlay.
        function showSettings() {


            var $overlay = TB.ui.overlay(
                'Toolbox Configuration - /r/' + subreddit,
                [
                    {
                        title: "Settings Home",
                        tooltip: "Pointers and handy links.",
                        content: '\
                        Through this window you can edit the settings for /r/' + subreddit + '. </br></br>Settings you change here will apply to the entire subreddit and by extension other moderators.\
                        ',
                        footer: ''
                    },
                    {
                        title: "edit toolbox config",
                        tooltip: "Edit raw JSON for subreddit config.",
                        content: '\
                        <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                        <div id="edit-wikidata-toolbox-div" style="display: none; height: 500px;"></div>\
                        <br>\
                        <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                        footer: '<input class="save-wiki-data" data-tabname="edit_toolbox_config" type="button" style="display:none" value="Save Page to Wiki">'
                    },
                    {
                        title: "edit user notes",
                        tooltip: "Edit raw JSON for subreddit usernotes.",
                        content: '\
                        <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                        <div id="edit-wikidata-usernotes-div" style="display: none; height: 500px;"></div>\
                        <br>\
                        <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                        footer: '<input class="save-wiki-data" data-tabname="edit_user_notes" type="button" style="display:none" value="Save Page to Wiki">'
                    },
                    {
                        title: "edit automoderator config",
                        tooltip: "Edit the automoderator config.",
                        content: '\
                        <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                        <div id="edit-wikidata-automoderator-div" style="display: none; height: 500px;"></div>\
                        <br>\
                        <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                        footer: '<input class="save-wiki-data" data-tabname="edit_automoderator_config" type="button" style="display:none" value="Save Page to Wiki">'
                    },
                    {
                        title: "removal reasons settings",
                        tooltip: "Configure the basic behavior for removal reasons here.",
                        content: '\
                        <table>\
                            <tr>\
                            <td>\
                                get reason from /r/:\
                            </td><td>\
                                <input class="getfrom" type="text" value="' + (config.removalReasons.getfrom || '') + '"/> (<span style="color:red">WARNING:</span> this setting overrides all other settings.)  &nbsp;\
                            </tr><tr>\
                            <td>\
                                logsub /r/:\
                            </td><td>\
                                <input class="logsub" type="text" value="' + (config.removalReasons.logsub || '') + '"/>\
                            </td>\
                            </tr><tr>\
                            <td>\
                               pmsubject:\
                            </td><td>\
                               <input class="pmsubject" type="text" value="' + (config.removalReasons.pmsubject || '') + '"/>\
                            </td>\
                            </tr><tr>\
                            <td>\
                                logtitle:\
                            </td><td>\
                                <input class="logtitle" type="text" value="' + (config.removalReasons.logtitle || '') + '"/>\
                            </td>\
                            </tr><tr>\
                            <td>\
                                bantitle:\
                            </td><td>\
                                <input class="bantitle" type="text" value="' + (config.removalReasons.bantitle || '') + '"/>\
                            </td>\
                            </tr><tr>\
                            <td>\
                                logreason:\
                            </td><td>\
                                <input class="logreason" type="text" value="' + (config.removalReasons.logreason || '') + '"/>\
                            </td>\
                            </tr>\
                            </table>\
                            <span>Header:</span>\
                            <p><textarea class="edit-header" >' + TBUtils.htmlEncode(unescape(config.removalReasons.header || '')) + '</textarea></p>\
                            <span>Footer:</span>\
                            <p><textarea class="edit-footer" >' + TBUtils.htmlEncode(unescape(config.removalReasons.footer || '')) + '</textarea></p>\
                    ',
                        footer: '<input class="save-removal-settings" type="button" value="Save removal reasons settings">'
                    },
                    {
                        title: "edit removal reasons",
                        tooltip: "Edit and add your removal reasons here.",
                        content: '\
                        <a href="javascript:;" id="tb-add-removal-reason"> Add new removal reason</a></br>\
                        <span id="tb-add-removal-reason-form">\
                            <textarea class="edit-area" style="width: 800px; height: 150px;"></textarea><br/>\
                            <input type="text" name="flair-text" placeholder="flair text" /><br/>\
                            <input type="text" name="flair-css" placeholder="flair css" /><br/>\
                            <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br><br>\
                            <input class="save-new-reason" type="button" value="Save new reason"><input class="cancel-new-reason" type="button" value="Cancel adding reason">\
                        </span>\
                        <table id="tb-removal-reasons-list">\
                        </table>\
                        ',
                        footer: ''
                    },
                    {
                        title: "edit mod macros",
                        tooltip: "Edit and add your mod macros here.",
                        content: 'stuff',
                        footer: ''
                    },
                    {
                        title: "domain tags",
                        tooltip: "basic domain tags stuff.",
                        content: '<p>import tags from /r/:&nbsp;<input class="importfrom" type="text"/></input> (note: you need to mod wiki in this sub and the import sub.)</p>',
                        footer: '<input class="import" type="button" value="import" />'
                    }
                ],
                '', // meta
                'tb-settings' // class
            ).appendTo('body');
            $body.css('overflow', 'hidden');
        }


    $body.on('click', '.tb-settings .close', function () {
        $('.tb-settings').remove();
        $body.css('overflow', 'auto');
    });


    // Functions to be used later on when we play with the content of tabs.

        function wikiTabContent(tabname) {

            var page;

            switch (tabname) {
                case 'edit_toolbox_config':
                    page = 'toolbox';
                    break;
                case 'edit_user_notes':
                    page = 'usernotes';
                    break;
                case 'edit_automoderator_config':
                    page = 'automoderator';
                    break;
            }
            var $wikiContentArea = $body.find('.tb-window-tab.' + tabname),
                textArea = $wikiContentArea.find('.edit-wikidata'),
                textAreaDiv = $wikiContentArea.find('#edit-wikidata-' + page + '-div'),
                saveButton = $wikiContentArea.find('.save-wiki-data');



            if (TB.storage.getSetting('SyntaxHighlighter', 'enabled', true)) {
                $body.addClass('mod-toolbox-ace');
                $(textArea).hide();
                $(textAreaDiv).show();

                var selectedTheme = TB.storage.getSetting('SyntaxHighlighter', 'selectedTheme', 'monokai'),
                    configEditor = ace.edit('edit-wikidata-' + page + '-div');

                configEditor.getSession().setUseWrapMode(TB.storage.getSetting('SyntaxHighlighter', 'enableWordWrap', true));
                configEditor.setTheme("ace/theme/" + selectedTheme);

                if (page === 'automoderator') {
                    configEditor.getSession().setMode("ace/mode/yaml");
                } else {
                    configEditor.getSession().setMode("ace/mode/json");
                }

                $(textArea).val('getting wiki data...');
                configEditor.getSession().setValue('getting wiki data...');

                configEditor.getSession().on('change', function () {
                    textArea.val(configEditor.getSession().getValue());
                });


                TBUtils.readFromWiki(subreddit, page, false, function (resp) {
                    if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                        $(textArea).val('error getting wiki data.');
                        configEditor.getSession().setValue('error getting wiki data.');
                        return;
                    }

                    if (resp === TBUtils.NO_WIKI_PAGE) {
                        $(textArea).val('');
                        configEditor.getSession().setValue('');
                        $(saveButton).show();
                        $(saveButton).attr('page', page);
                        return;
                    }

                    resp = TBUtils.unescapeJSON(resp);

                    // Found it, show it.
                    $(textArea).val(resp);
                    configEditor.getSession().setValue(resp);
                    $(saveButton).show();
                    $(saveButton).attr('page', page);
                });
            } else {
                // load the text area, but not the save button.
                $(textArea).val('getting wiki data...');

                TBUtils.readFromWiki(subreddit, page, false, function (resp) {
                    if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                        $(textArea).val('error getting wiki data.');
                        return;
                    }

                    if (resp === TBUtils.NO_WIKI_PAGE) {
                        $(textArea).val('');
                        $(saveButton).show();
                        $(saveButton).attr('page', page);
                        return;
                    }

                    resp = TBUtils.unescapeJSON(resp);

                    // Found it, show it.
                    $(textArea).val(resp);
                    $(saveButton).show();
                    $(saveButton).attr('page', page);
                });
            }
        }

        function removalReasonsContent() {

        }

        function modMacrosContent() {

        }

    // Let's do some stuff with all those nice tabs we generated!

    // Toolbox config WIKI tab
        $body.on('click', '.tb-window-tabs .edit_toolbox_config', function() {
            var $this = $(this);
            if(!$this.hasClass('content-populated')) {
                wikiTabContent('edit_toolbox_config');
                $this.addClass('content-populated');
            }
        });

    // user note config WIKI tab
        $body.on('click', '.tb-window-tabs .edit_user_notes', function() {
            var $this = $(this);
            if(!$this.hasClass('content-populated')) {
                wikiTabContent('edit_user_notes');
                $this.addClass('content-populated');
            }
        });

    // user note config WIKI tab
        $body.on('click', '.tb-window-tabs .edit_automoderator_config', function() {
            var $this = $(this);
            if(!$this.hasClass('content-populated')) {
                wikiTabContent('edit_automoderator_config');
                $this.addClass('content-populated');
            }
        });
    // Wiki tab save button is clicked.
        $body.on('click', '.save-wiki-data', function () {
            var $this = $(this),
                tabname = $this.attr('data-tabname'),
                page;

            switch (tabname) {
                case 'edit_toolbox_config':
                    page = 'toolbox';
                    break;
                case 'edit_user_notes':
                    page = 'usernotes';
                    break;
                case 'edit_automoderator_config':
                    page = 'automoderator';
                    break;
            }

            var $wikiContentArea = $body.find('.tb-window-tab.' + tabname),
                textArea = $wikiContentArea.find('.edit-wikidata'),
                text = $(textArea).val(),
                editNote = $wikiContentArea.find('input[name=edit-wikidata-note]').val(),
                updateAM = (page === 'automoderator');

            if (!editNote) {
                editNote = 'updated ' + page + ' configuration';
            }
            // save the data, and blank the text area.
            // also, yes some of the pages are in JSON, but they aren't JSON objects,
            // so they don't need to be re-strinified.
            postToWiki(page, text, editNote, false, updateAM);
        });

    // Toolbox config FORM tab save
        $body.on('click', '.save-removal-settings', function () {


            config.removalReasons = {
                pmsubject: $('.pmsubject').val(),
                logreason: $('.logreason').val(),
                header: escape($('.edit-header').val()),
                footer: escape($('.edit-footer').val()),
                logsub: $('.logsub').val(),
                logtitle: $('.logtitle').val(),
                bantitle: $('.bantitle').val(),
                getfrom: $('.getfrom').val(),
                reasons: config.removalReasons.reasons || []
            };

            postToWiki('toolbox', config, 'updated removal reason settings', true);
            // Let people know that settings are saved.
            TB.ui.textFeedback('Removal reasons settings are saved', TB.ui.FEEDBACK_POSITIVE);
        });

    // Removal reasons tab
        $body.on('click', '.tb-window-tabs .edit_removal_reasons', function() {
            var $this = $(this);
            if(!$this.hasClass('content-populated')) {
                removalReasonsContent();
                $this.addClass('content-populated');
            }
        });

        // Removal reasons interaction and related functions.

    // Mod macros tab is clicked.
        $body.on('click', '.tb-window-tabs .edit_mod_macros', function() {
            if(!$this.hasClass('content-populated')) {
                modMacrosContent();
                $this.addClass('content-populated');
            }
        });

        // mod macros interaction and related functions

    // When the import button is clicked on the domain tags thing.
        $body.on('click', '.domain_tags .import', function () {

            $.getJSON('/r/' + $body.find('.domain_tags .importfrom').val() + '/wiki/toolbox.json', function (json) {

                if (json.data.content_md) {
                    var tags = JSON.parse(json.data.content_md).domainTags;
                    if (tags) {
                        config.domainTags = tags;
                        postToWiki('toolbox', config, '.import click', true);
                    }
                }
            });
        });
    }; // TBConfig.init()

    TB.register_module(TBConfig);
} // tbconfig() wrapper

(function() {
    window.addEventListener("TBUtilsLoaded", function () {
        tbconfig();
    });
})();