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
            TBConfig.log('Aborting: invalid subreddit');
            return;
        }

        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                TBConfig.log('Failed: wiki config');
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
                if (!succ) {
                    $.log(err.responseText);
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


             $overlay = TB.ui.overlay(
                'Toolbox Configuration - /r/' + subreddit,
                [
                    {
                        title: 'Settings Home',
                        tooltip: 'Pointers and handy links.',
                        content: '\
                        <span class="tb-config-intro">\
                        Through this window you can edit the settings for /r/' + subreddit + '. </br>\
                        </br>Settings you change here will apply to the entire subreddit and by extension other moderators.\
                        </br>\
                        </br><a href="/r/'+ subreddit +'/w/pages/">All Wiki Pages</a>\
                        </br><a href="/r/'+ subreddit +'/about/usernotes/">Manage Usernotes</a>\
                        \
                        </span>\
                        ',
                        footer: ''
                    },
                    {
                        title: 'edit toolbox config',
                        tooltip: 'Edit raw JSON for subreddit config.',
                        content: '\
                        <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                        <div id="edit-wikidata-toolbox-div" style="display: none; height: 500px;"></div>\
                        <br>\
                        <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                        footer: '<input class="save-wiki-data" data-tabname="edit_toolbox_config" type="button" style="display:none" value="Save Page to Wiki">'
                    },
                    {
                        title: 'edit user notes',
                        tooltip: 'Edit raw JSON for subreddit usernotes.',
                        content: '\
                        <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                        <div id="edit-wikidata-usernotes-div" style="display: none; height: 500px;"></div>\
                        <br>\
                        <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                        footer: '<input class="save-wiki-data" data-tabname="edit_user_notes" type="button" style="display:none" value="Save Page to Wiki">'
                    },
                    {
                        title: 'edit automoderator config',
                        tooltip: 'Edit the automoderator config.',
                        content: '\
                        <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                        <div id="edit-wikidata-automoderator-div" style="display: none; height: 500px;"></div>\
                        <br>\
                        <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                        footer: '<input class="save-wiki-data" data-tabname="edit_automoderator_config" type="button" style="display:none" value="Save Page to Wiki">'
                    },
                    {
                        title: 'removal reasons settings',
                        tooltip: 'Configure the basic behavior for removal reasons here.',
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
                            </tr><tr>\
                            <td>Header:</td>\
                            <td><textarea class="edit-header" >' + TBUtils.htmlEncode(decodeURI(config.removalReasons.header || '')) + '</textarea></td>\
                            </tr><tr>\
                            <td>Footer:</td>\
                            <td><textarea class="edit-footer" >' + TBUtils.htmlEncode(decodeURI(config.removalReasons.footer || '')) + '</textarea></td>\
                            </tr>\
                        </table>\
                    ',
                        footer: '<input class="save-removal-settings" type="button" value="Save removal reasons settings">'
                    },
                    {
                        title: 'edit removal reasons',
                        tooltip: 'Edit and add your removal reasons here.',
                        content: '\
                        <a href="javascript:;" id="tb-add-removal-reason"><img src="data:image/png;base64,'+ TBui.iconAdd  +'"> Add new removal reason</a></br>\
                        <span id="tb-add-removal-reason-form">\
                            <textarea class="edit-area"></textarea><br/>\
                            <input type="text" name="removal-title" placeholder="removal reason title" /><br/>\
                            <input type="text" name="flair-text" placeholder="flair text" /><br/>\
                            <input type="text" name="flair-css" placeholder="flair css" /><br/>\
                            <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>\
                            <input class="save-new-reason" type="button" value="Save new reason"><input class="cancel-new-reason" type="button" value="Cancel adding reason">\
                        </span>\
                        <table id="tb-removal-reasons-list">\
                        </table>\
                        ',
                        footer: ''
                    },
                    {
                        title: 'edit mod macros',
                        tooltip: 'Edit and add your mod macros here.',
                        content: '\
                        <a href="javascript:;" id="tb-add-mod-macro"><img src="data:image/png;base64,'+ TBui.iconAdd  +'"> Add new mod macro</a></br>\
                        <span id="tb-add-mod-macro-form">\
                            <textarea class="edit-area"></textarea><br/>\
                            <input type="text" class="macro-title" name="macro-title" placeholder="macro title" />\
                            <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>\
                            <input class="save-new-macro" type="button" value="Save new macro"><input class="cancel-new-macro" type="button" value="Cancel adding macro">\
                        </span>\
                        <table id="tb-mod-macros-list">\
                        </table>\
                        ',
                        footer: ''
                    },
                    {
                        title: 'domain tags',
                        tooltip: 'basic domain tags stuff.',
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
                configEditor.setTheme('ace/theme/' + selectedTheme);

                if (page === 'automoderator') {
                    configEditor.getSession().setMode('ace/mode/yaml');
                } else {
                    configEditor.getSession().setMode('ace/mode/json');
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

            if (config.removalReasons && config.removalReasons.reasons.length > 0) {

                var i = 0;
                $(config.removalReasons.reasons).each(function () {
                    var label = decodeURIComponent(this.text);
                    if (label == '') {
                        label = '<span style="color: #cecece">(no reason)</span>';
                    } else {
                        if (label.length > 200) {
                            label = label.substring(0, 197) + '...';
                        }
                        label = TBUtils.htmlEncode(label);
                    }

                    var removalReasonText = decodeURIComponent(config.removalReasons.reasons[i].text) || '<span style="color: #cecece">(no reason)</span>',
                        removalReasonTitle = config.removalReasons.reasons[i].title || '',
                        removalReasonFlairText = config.removalReasons.reasons[i].flairText || '',
                        removalReasonFlairCSS = config.removalReasons.reasons[i].flairCSS || '';

                    var removalReasonTemplate = '\
                    <tr class="removal-reason" data-reason="{{i}}" data-subreddit="{{subreddit}}">\
                        <td class="removal-reasons-buttons">\
                            <a href="javascript:;" data-reason="{{i}}" data-subreddit="{{subreddit}}" class="edit"><img src="data:image/png;base64,{{uiCommentEdit}}"></a> <br>\
                            <a href="javascript:;" data-reason="{{i}}" data-subreddit="{{subreddit}}" class="delete"><img src="data:image/png;base64,{{uiCommentRemove}}"></a>\
                        </td>\
                        <td class="removal-reasons-content" data-reason="{{i}}">\
                            <span class="removal-reason-label" data-for="reason-{{subreddit}}-{{i++}}"><span><h3 class="reason-title">{{removalReasonTitle}}</h3>{{label}}</span></span><br>\
                            <span class="removal-reason-edit">\
                                <textarea class="edit-area">{{removalReasonText}}</textarea><br/>\
                                <input type="text" name="removal-title" placeholder="removal reason title" value="{{removalReasonTitle}}"/><br/>\
                                <input type="text" name="flair-text" placeholder="flair text" value="{{removalReasonFlairText}}"/><br/>\
                                <input type="text" name="flair-css" placeholder="flair css" value="{{removalReasonFlairCSS}}"/><br/>\
                                <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>\
                                <input class="save-edit-reason" type="button" value="Save reason"><input class="cancel-edit-reason" type="button" value="Cancel editing reason">\
                            </span>\
                        </td>\
                    </tr>';

                    var removalReasonTemplateHTML = TBUtils.template(removalReasonTemplate, {
                        'i': i,
                        'subreddit': subreddit,
                        'i++': (i++),
                        'label': label,
                        'removalReasonText': removalReasonText,
                        'removalReasonTitle': removalReasonTitle,
                        'removalReasonFlairText': removalReasonFlairText,
                        'removalReasonFlairCSS': removalReasonFlairCSS,
                        'uiCommentRemove': TBui.iconCommentRemove,
                        'uiCommentEdit': TBui.iconCommentsEdit
                    });

                    var $removalReasonsList = $body.find('.edit_removal_reasons #tb-removal-reasons-list');

                    $removalReasonsList.append(removalReasonTemplateHTML);
                });

            }

        }

        function modMacrosContent() {
            if (config.modMacros && config.modMacros.length > 0) {

                $(config.modMacros).each(function (i, item) {
                    var label = decodeURIComponent(item.text);
                    if (label == '') {
                        label = '<span style="color: #cecece">(no macro)</span>';
                    } else {
                        if (label.length > 200) {
                            label = label.substring(0, 197) + '...';
                        }
                        label = TBUtils.htmlEncode(label);
                    }
                    var modMacroText = decodeURIComponent(config.modMacros[i].text)  || '<span style="color: #cecece">(no macro)</span>',
                        modMacroTitle = config.modMacros[i].title || '';

                    var modMacroTemplate = '\
                    <tr class="mod-macro" data-macro="{{i}}" data-subreddit="{{subreddit}}">\
                        <td class="mod-macros-buttons">\
                            <a href="javascript:;" data-macro="{{i}}" data-subreddit="{{subreddit}}" class="edit"><img src="data:image/png;base64,{{uiMacroEdit}}"></a> <br>\
                            <a href="javascript:;" data-macro="{{i}}" data-subreddit="{{subreddit}}" class="delete"><img src="data:image/png;base64,{{uiMacroRemove}}"></a>\
                        </td>\
                        <td class="mod-macros-content" data-macro="{{i}}">\
                            <span class="mod-macro-label" data-for="macro-{{subreddit}}-{{i}}"><span><h3 class="macro-title">{{modMacroTitle}}</h3>{{label}}</span></span><br>\
                            <span class="mod-macro-edit">\
                                <textarea class="edit-area">{{modMacroText}}</textarea><br/>\
                                <input type="text" class="macro-title" name="macro-title" placeholder="macro title" value="{{modMacroTitle}}" />\
                                <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>\
                                <input class="save-edit-macro" type="button" value="Save macro"><input class="cancel-edit-macro" type="button" value="Cancel editing macro">\
                            </span>\
                        </td>\
                    </tr>';

                    var modMacroTemplateHTML = TBUtils.template(modMacroTemplate, {
                        'i': i,
                        'subreddit': subreddit,
                        'label': label,
                        'modMacroText': modMacroText,
                        'modMacroTitle': modMacroTitle,
                        'uiMacroRemove': TBui.iconCommentRemove,
                        'uiMacroEdit': TBui.iconCommentsEdit
                    });

                    var $removalReasonsList = $body.find('.edit_mod_macros #tb-mod-macros-list');
                    $removalReasonsList.append(modMacroTemplateHTML);

                });


            }

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
                    $body.addClass('toolbox-wiki-edited');
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
                header: encodeURIComponent($('.edit-header').val()),
                footer: encodeURIComponent($('.edit-footer').val()),
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

                // determine if we want to pull a new config, we only do this if the toolbox config wiki has been edited.
                if ($body.hasClass('toolbox-wiki-edited')) {
                    TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
                        if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                            TBConfig.log('Failed: wiki config');
                            return;
                        }

                        config = resp;
                        removalReasonsContent();
                    });
                } else {
                    removalReasonsContent();
                }



                $this.addClass('content-populated');
            }
        });

        // Removal reasons interaction and related functions.

            // editing of reasons
            $body.on('click', '.removal-reasons-buttons .edit', function() {
                var $this = $(this);

                $this.closest('tr.removal-reason').find('.removal-reason-label').hide();
                $this.closest('tr.removal-reason').find('.removal-reason-edit').show();
            });

            // cancel
            $body.on('click', '.removal-reason-edit .cancel-edit-reason', function() {
                var $this = $(this),
                    $removalContent = $this.closest('td.removal-reasons-content'),
                    reasonsNum = $removalContent.attr('data-reason');

                $removalContent.find('.edit-area').val(decodeURIComponent(config.removalReasons.reasons[reasonsNum].text) || '<span style="color: #cecece">(no macro)</span>');
                $removalContent.find('input[name=removal-title]').val(config.removalReasons.reasons[reasonsNum].title || '');
                $removalContent.find('input[name=flair-text]').val(config.removalReasons.reasons[reasonsNum].flairText || '');
                $removalContent.find('input[name=flair-css]').val(config.removalReasons.reasons[reasonsNum].flairCSS || '');
                $removalContent.find('input[name=edit-note]').val('');

                $removalContent.find('.removal-reason-label').show();
                $removalContent.find('.removal-reason-edit').hide();
            });

            // save

            $body.on('click', '.removal-reason-edit .save-edit-reason', function() {
                var $this = $(this),
                    $removalContent = $this.closest('td.removal-reasons-content'),
                    reasonsNum = $removalContent.attr('data-reason'),
                    reasonText = $removalContent.find('.edit-area').val(),
                    reasonTitle = $removalContent.find('input[name=removal-title]').val(),
                    reasonFlairText = $removalContent.find('input[name=flair-text]').val(),
                    reasonFlairCSS = $removalContent.find('input[name=flair-css]').val(),
                    editNote = $removalContent.find('input[name=edit-note]').val();


                if (!editNote) {
                    // default note
                    editNote = 'update';
                }
                editNote += ', reason #' + reasonsNum;

                config.removalReasons.reasons[reasonsNum].text = encodeURIComponent(reasonText);
                config.removalReasons.reasons[reasonsNum].flairText = reasonFlairText;
                config.removalReasons.reasons[reasonsNum].flairCSS = reasonFlairCSS;
                config.removalReasons.reasons[reasonsNum].title = reasonTitle;

                postToWiki('toolbox', config, editNote, true);
                if (TBUtils.configCache[subreddit] !== undefined) {
                    delete TBUtils.configCache[subreddit]; // should this use TBUtils.clearCache?  I'm not clear on what this does. -al
                }

                var label = decodeURIComponent(reasonText);
                if (label == '') {
                    label = '<span style="color: #cecece">(no reason)</span>';
                } else {
                    if (label.length > 200) {
                        label = label.substring(0, 197) + '...';
                    }
                    label = TBUtils.htmlEncode(label);
                }


                var $removalReasonLabel = $removalContent.find('.removal-reason-label');
                $removalReasonLabel.html('<span><h3 class="removal-title">' + reasonTitle + '</h3>' + label + '</span>');


                $removalReasonLabel.show();
                $removalContent.find('.removal-reason-edit').hide();
            });

            // deleting a reason
            $body.on('click', '.removal-reasons-buttons .delete', function() {
                var $this = $(this);

                var confirmDelete = confirm('This will delete this removal reason, are you sure?');
                if (confirmDelete) {
                    var reasonsNum = $this.attr('data-reason');

                    if (reasonsNum) {
                        config.removalReasons.reasons.splice(reasonsNum, 1);
                        //config.removalReasons.reasons[reasonsNum].remove();
                    } else {
                        return;
                    }
                    postToWiki('toolbox', config, 'delete reason #' + reasonsNum, true);
                    if (TBUtils.configCache[subreddit] !== undefined) {
                        delete TBUtils.configCache[subreddit]; // should this use TBUtils.clearCache?  I'm not clear on what this does. -al Aren't removal reasons cached? - cr
                    }

                    $this.closest('.removal-reason').remove();
                }
            });

            // Adding a new reason
            $body.on('click', '#tb-add-removal-reason', function() {

                $(this).hide();
                $body.find('#tb-add-removal-reason-form').show();
            });

            // Save new reason
            $body.on('click', '#tb-add-removal-reason-form .save-new-reason', function() {

                var reasonText = $body.find('#tb-add-removal-reason-form .edit-area').val(),
                    reasonTitle = $body.find('#tb-add-removal-reason-form input[name=removal-title]').val(),
                    reasonFlairText = $body.find('#tb-add-removal-reason-form input[name=flair-text]').val(),
                    reasonFlairCSS = $body.find('#tb-add-removal-reason-form input[name=flair-css]').val(),
                    editNote = $body.find('#tb-add-removal-reason-form input[name=edit-note]').val();

                    editNote = 'create new reason' + (editNote ? ', ' + editNote : '');

                    var reason = {
                        text: encodeURIComponent(reasonText)
                    };

                    reason.flairText = reasonFlairText;
                    reason.flairCSS = reasonFlairCSS;
                    reason.title = reasonTitle;

                    if (!config.removalReasons) {
                        config.removalReasons = {
                            reasons: []
                        };
                    }

                    config.removalReasons.reasons.push(reason);

                    postToWiki('toolbox', config, editNote, true);
                    if (TBUtils.configCache[subreddit] !== undefined) {
                        delete TBUtils.configCache[subreddit]; // should this use TBUtils.clearCache?  I'm not clear on what this does. -al
                    }
                    // And finally we repopulate the reasons list and hide the current form.
                    $body.find('#tb-removal-reasons-list').html('');
                    removalReasonsContent();
                    $body.find('#tb-add-removal-reason').show();
                    $body.find('#tb-add-removal-reason-form').hide();
                    $body.find('#tb-add-removal-reason-form .edit-area').val('');
                    $body.find('#tb-add-removal-reason-form input[name=removal-title]').val('');
                    $body.find('#tb-add-removal-reason-form input[name=flair-text]').val('');
                    $body.find('#tb-add-removal-reason-form input[name=flair-css]').val('');
                    $body.find('#tb-add-removal-reason-form input[name=edit-note]').val('');
            });
            // cancel
            $body.on('click', '#tb-add-removal-reason-form .cancel-new-reason', function() {

                $body.find('#tb-add-removal-reason').show();
                $body.find('#tb-add-removal-reason-form').hide();
                $body.find('#tb-add-removal-reason-form .edit-area').val('');
                $body.find('#tb-add-removal-reason-form input[name=removal-title]').val('');
                $body.find('#tb-add-removal-reason-form input[name=flair-text]').val('');
                $body.find('#tb-add-removal-reason-form input[name=flair-css]').val('');
                $body.find('#tb-add-removal-reason-form input[name=edit-note]').val('');
            });

    // Mod macros tab is clicked.
        $body.on('click', '.tb-window-tabs .edit_mod_macros', function() {
            $this = $(this);
            if(!$this.hasClass('content-populated')) {

                // determine if we want to pull a new config, we only do this if the toolbox config wiki has been edited.
                if ($body.hasClass('toolbox-wiki-edited')) {
                    TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
                        if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                            TBConfig.log('Failed: wiki config');
                            return;
                        }

                        config = resp;
                        modMacrosContent();
                    });
                } else {
                    modMacrosContent();
                }
                $this.addClass('content-populated');

            }
        });

        // mod macros interaction and related functions

            // editing of reasons
            $body.on('click', '.mod-macros-buttons .edit', function() {
                var $this = $(this);

                $this.closest('tr.mod-macro').find('.mod-macro-label').hide();
                $this.closest('tr.mod-macro').find('.mod-macro-edit').show();
            });

            // cancel
            $body.on('click', '.mod-macro-edit .cancel-edit-macro', function() {
                var $this = $(this),
                    $macroContent = $this.closest('td.mod-macros-content'),
                    reasonsNum = $macroContent.attr('data-macro');

                $macroContent.find('.edit-area').val(decodeURIComponent(config.modMacros[reasonsNum].text)  || '<span style="color: #cecece">(no macro)</span>');
                $macroContent.find('input[name=macro-title]').val(config.modMacros[reasonsNum].title || '');
                $macroContent.find('input[name=edit-note]').val('');

                $macroContent.find('.mod-macro-label').show();
                $macroContent.find('.mod-macro-edit').hide();
            });

            // save
            $body.on('click', '.mod-macro-edit .save-edit-macro', function() {
                var $this = $(this),
                    $macroContent = $this.closest('td.mod-macros-content'),
                    macroNum = $macroContent.attr('data-macro'),
                    macroText = $macroContent.find('.edit-area').val(),
                    macroTitle = $macroContent.find('input[name=macro-title]').val(),
                    editNote = $macroContent.find('input[name=edit-note]').val();

                if (!editNote) {
                    // default note
                    editNote = 'update';
                }
                editNote += ', macro #' + macroNum;

                config.modMacros[macroNum].text = encodeURIComponent(macroText);
                config.modMacros[macroNum].title = macroTitle;

                postToWiki('toolbox', config, editNote, true);
                if (TBUtils.configCache[subreddit] !== undefined) {
                    delete TBUtils.configCache[subreddit]; // should this use TBUtils.clearCache?  I'm not clear on what this does. -al
                }

                var label = decodeURIComponent(macroText);

                if (label == '') {
                    label = '<span style="color: #cecece">(no macro)</span>';
                } else {
                    if (label.length > 200) {
                        label = label.substring(0, 197) + '...';
                    }
                    label = TBUtils.htmlEncode(label);
                }

                var $modMacroLabel = $macroContent.find('.mod-macro-label');
                $modMacroLabel.html('<span><h3 class="macro-title">' + macroTitle + '</h3>' + label + '</span>');

                $modMacroLabel.show();
                $macroContent.find('.mod-macro-edit').hide();
            });

            // deleting a macro
            $body.on('click', '.mod-macros-buttons .delete', function() {
                var $this = $(this);

                var confirmDelete = confirm('This will delete this mod macro, are you sure?');
                if (confirmDelete) {
                    var macroNum = $this.attr('data-macro');

                    if (macroNum) {
                        config.modMacros.splice(macroNum, 1);
                    } else {
                        return;
                    }
                    postToWiki('toolbox', config, 'delete macro #' + macroNum, true);
                    if (TBUtils.configCache[subreddit] !== undefined) {
                        delete TBUtils.configCache[subreddit]; // should this use TBUtils.clearCache?  I'm not clear on what this does. -al
                    }

                    $this.closest('.mod-macro').remove();
                }

            });

            // Adding a new reason
            $body.on('click', '#tb-add-mod-macro', function() {

                $(this).hide();
                $body.find('#tb-add-mod-macro-form').show();
            });

            // Save new reason
            $body.on('click', '#tb-add-mod-macro-form .save-new-macro', function() {
                var macroText = $body.find('#tb-add-mod-macro-form .edit-area').val(),
                    macroTitle = $body.find('#tb-add-mod-macro-form input[name=macro-title]').val(),
                    editNote = $body.find('#tb-add-mod-macro-form input[name=edit-note]').val();

                editNote = 'create new macro ' + (editNote ? ', ' + editNote : '');

                var macro = {
                    text: encodeURIComponent(macroText)
                };

                macro.title = macroTitle;

                if (!config.modMacros) {
                    config.modMacros = [];
                }

                config.modMacros.push(macro);

                postToWiki('toolbox', config, editNote, true);
                if (TBUtils.configCache[subreddit] !== undefined) {
                    delete TBUtils.configCache[subreddit]; // should this use TBUtils.clearCache?  I'm not clear on what this does. -al
                }
                // And finally we repopulate the macro list and hide the current form.
                $body.find('#tb-mod-macros-list').html('');
                modMacrosContent();
                $body.find('#tb-add-mod-macro').show();
                $body.find('#tb-add-mod-macro-form').hide();
                $body.find('#tb-add-mod-macro-form .edit-area').val('');
                $body.find('#tb-add-mod-macro-form input[name=flair-text]').val('');
                $body.find('#tb-add-mod-macro-form input[name=flair-css]').val('');
                $body.find('#tb-add-mod-macro-form input[name=edit-note]').val('');
            });

            // cancel
            $body.on('click', '#tb-add-mod-macro-form .cancel-new-macro', function() {
                $body.find('#tb-add-mod-macro').show();
                $body.find('#tb-add-mod-macro-form').hide();
                $body.find('#tb-add-mod-macro-form .edit-area').val('');
                $body.find('#tb-add-mod-macro-form input[name=flair-text]').val('');
                $body.find('#tb-add-mod-macro-form input[name=flair-css]').val('');
                $body.find('#tb-add-mod-macro-form input[name=edit-note]').val('');
            });

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
    window.addEventListener('TBUtilsLoaded', function () {
        tbconfig();
    });
})();