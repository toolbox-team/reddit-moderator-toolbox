function tbconfig() {
var self = new TB.Module('toolbox Config');
self.shortname = 'TBConfig'; // for backwards compatibility

//Default settings
self.settings['enabled']['default'] = true;

self.init = function() {

    //if (!(TBUtils.post_site && TBUtils.isMod) && !TBUtils.isModpage) {
    //    return;
    //}


    // Set up some base variables
    var $body = $('body'),
        config = TBUtils.config,
        unManager = TB.storage.getSetting('UserNotes', 'unManagerLink', true);

    // With the following function we will create the UI when we need it.
    // Create the window overlay.
    function showConfig(subredditConfig, configData) {


        $overlay = TB.ui.overlay(
            'toolbox Configuration - /r/' + subredditConfig,
            [
                {
                    title: 'Settings Home',
                    tooltip: 'Pointers and handy links.',
                    content: '\
                <span class="tb-config-intro">\
                Through this window you can edit the settings for /r/' + subredditConfig + '. </br>\
                </br>Settings you change here will apply to the entire subreddit and by extension other moderators.\
                </br>\
                </br><a href="/r/' + subredditConfig + '/w/pages/" class="tb-general-button">All Wiki Pages</a>\
                </br><a ' + ((unManager) ? 'style="display:none;"' : '') + ' href="/r/' + subredditConfig + '/about/usernotes/" class="tb-general-button">Manage Usernotes</a>\
                \
                </span>\
                ',
                    footer: ''
                },
                {
                    title: 'edit toolbox config',
                    tooltip: 'Edit raw JSON for subreddit config.',
                    advanced: true,
                    content: '\
                <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                <div id="edit-wikidata-toolbox-div" style="display: none; height: 500px;"></div>\
                <br>\
                <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                    footer: '<input class="save-wiki-data tb-action-button" data-tabname="edit_toolbox_config" type="button" style="display:none" value="Save Page to Wiki">'
                },
                {
                    title: 'edit user notes',
                    tooltip: 'Edit raw JSON for subreddit usernotes.',
                    advanced: true,
                    content: '\
                <div class="error"><b>Here be dragons! Only edit this if you are absolutely sure what you are doing.</b></div>\
                <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                <div id="edit-wikidata-usernotes-div" style="display: none; height: 500px;"></div>\
                <br>\
                <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                    footer: '<input class="save-wiki-data tb-action-button" data-tabname="edit_user_notes" type="button" style="display:none" value="Save Page to Wiki">'
                },
                {
                    title: 'edit automoderator config',
                    tooltip: 'Edit the automoderator config.',
                    content: '\
                <p>\
                    <a href="/wiki/automoderator/full-documentation" target="_blank">Full automoderator documentation</a>\
                </p>\
                <div class="error" style="display:none"><b>Config not saved!</b><br> <pre class="errorMessage"></pre></div>\
                <textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
                <div id="edit-wikidata-automoderator-div" style="display: none; height: 500px;"></div>\
                <br>\
                <input type="text" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />',
                    footer: '<input class="save-wiki-data tb-action-button" data-tabname="edit_automoderator_config" type="button" style="display:none" value="Save Page to Wiki">'
                },
                {
                    title: 'removal reasons settings',
                    tooltip: 'Configure the basic behavior for removal reasons here.',
                    content: '\
                <table>\
                    <td>Header:</td>\
                    <td><textarea class="edit-header" >' + TBUtils.htmlEncode(unescape(configData.removalReasons.header ? configData.removalReasons.header : '')) + '</textarea></td>\
                    </tr><tr>\
                    <td>Footer:</td>\
                    <td><textarea class="edit-footer" >' + TBUtils.htmlEncode(unescape(configData.removalReasons.footer ? configData.removalReasons.footer : '')) + '</textarea></td>\
                    </tr>\
                    <tr class="advanced-enable" ' + ((TB.utils.advancedMode) ? '' : 'style="display:none;"') + '>\
                    <td><a href="javascript:;" class="show-advanced tb-general-button">show advanced settings</a></td>\
                    </tr>\
                    <tr class="rr-advanced">\
                    <td>\
                        get reason from /r/:\
                    </td><td>\
                        <input class="getfrom" type="text" value="' + (configData.removalReasons.getfrom ? configData.removalReasons.getfrom : '') + '"/> (<span style="color:red">WARNING:</span> this setting overrides all other settings.)  &nbsp;\
                    </tr>\
                    <tr class="rr-advanced">\
                    <td>\
                        logsub /r/:\
                    </td><td>\
                        <input class="logsub" type="text" value="' + (configData.removalReasons.logsub ? configData.removalReasons.logsub : '') + '"/>\
                    </td>\
                    </tr>\
                    <tr class="rr-advanced">\
                    <td>\
                       pmsubject:\
                    </td><td>\
                       <input class="pmsubject" type="text" value="' + (configData.removalReasons.pmsubject ? configData.removalReasons.pmsubject : '') + '"/>\
                    </td>\
                    </tr>\
                    <tr class="rr-advanced">\
                    <td>\
                        logtitle:\
                    </td><td>\
                        <input class="logtitle" type="text" value="' + (configData.removalReasons.logtitle ? configData.removalReasons.logtitle : '') + '"/>\
                    </td>\
                    </tr>\
                    <tr class="rr-advanced">\
                    <td>\
                        bantitle:\
                    </td><td>\
                        <input class="bantitle" type="text" value="' + (configData.removalReasons.bantitle ? configData.removalReasons.bantitle : '') + '"/>\
                    </td>\
                    </tr>\
                    <tr class="rr-advanced">\
                    <td>\
                        logreason:\
                    </td><td>\
                        <input class="logreason" type="text" value="' + (configData.removalReasons.logreason ? configData.removalReasons.logreason : '') + '"/>\
                    </td>\
                    </tr><tr>\
                </table>',
                    footer: '<input class="save-removal-settings tb-action-button" type="button" value="Save removal reasons settings">'
                },
                {
                    title: 'edit removal reasons',
                    tooltip: 'Edit and add your removal reasons here.',
                    content: '\
                <a href="javascript:;" id="tb-add-removal-reason" class="tb-general-button"><img src="data:image/png;base64,' + TBui.iconAdd + '"> Add new removal reason</a>\
                <a href="javascript:;" id="tb-config-help" class="tb-general-button" data-module="rreasons">help</a></br>\
                <span id="tb-add-removal-reason-form">\
                    <textarea class="edit-area" placeholder="reason comment text (optional if you\'re using flair only)"></textarea><br/>\
                    <input type="text" name="removal-title" placeholder="removal reason title" /><br/>\
                    <input type="text" name="flair-text" placeholder="flair text" /><br/>\
                    <input type="text" name="flair-css" placeholder="flair css class" /><br/>\
                    <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>\
                    <input class="save-new-reason tb-action-button" type="button" value="Save new reason"><input class="cancel-new-reason tb-action-button" type="button" value="Cancel adding reason">\
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
                <a href="javascript:;" id="tb-add-mod-macro" class="tb-general-button"><img src="data:image/png;base64,' + TBui.iconAdd + '"> Add new mod macro</a>\
                <a href="javascript:;" id="tb-config-help" class="tb-general-button" data-module="modmacros">help</a></br>\
                <span id="tb-add-mod-macro-form">\
                    <textarea class="edit-area"></textarea><br/>\
                    <input type="text" class="macro-title" name="macro-title" placeholder="macro title" /><br>\
                    <label><input type="checkbox" id="distinguish" checked>distinguish</label>\
                    <label><input type="checkbox" id="banuser">ban user</label>\
                    <label><input type="checkbox" id="muteuser">mute user</label>\
                    <label><input type="checkbox" id="removeitem">remove item</label>\
                    <label><input type="checkbox" id="approveitem">approve item</label>\
                    <label><input type="checkbox" id="lockthread">lock post</label>\
                    <label><input type="checkbox" id="sticky">sticky comment</label><br>\
                    <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>\
                    <input class="save-new-macro tb-action-button" type="button" value="Save new macro"><input class="cancel-new-macro tb-action-button" type="button" value="Cancel adding macro">\
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
                    footer: '<input class="import tb-action-button" type="button" value="import" />'
                }
            ],
            [], // extra header buttons
            'tb-config', // class
            false // single overriding footer
        ).appendTo('body');
        $body.css('overflow', 'hidden');
    }


    // Advanced removal reasons
    $body.on('click', '.show-advanced', function () {
        $('.advanced-enable').hide();
        $('.rr-advanced').show();
    });

    // Help click event.
    $body.on('click', '#tb-config-help', function () {
        var module = $(this).attr('data-module');
        window.open('https://www.reddit.com/r/toolbox/wiki/livedocs/' + module, '', 'scrollbars=1,width=500,height=600,location=0,menubar=0,top=100,left=100');

    });

    // Now we want to figure out if we are on a subreddit, or not.
    // If we are on a subreddit we mod, add a button to the moderation tools box.
    var subreddit;
    if (TBUtils.post_site && TBUtils.isMod) {
        subreddit = TBUtils.post_site;
        // Load the data we need from the wiki.
        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                self.log('Failed: wiki config');
            } else {
                // At this point we are good to go! Let's add a button!
                config = resp;


            }
        });

        var $toolbox = $('#moderation_tools').find('.content .icon-menu'),
            configLink = '<li><span class="separator"></span><a href="javascript:;" class="toolbox-edit" title="toolbox configuration for this subreddit"><img class="tb-moderation-tools-icons" src="data:image/png;base64,' + TBui.iconWrench + '"/>toolbox configuration</a></li>';
        $toolbox.append(configLink);
        // If we are not on a subreddit but we are on a queue page we want to add the buttons to the multireddit listing.
    } else if (TBUtils.isModpage) {

        $body.find('.subscription-box ul li').each(function () {
            var $this = $(this),
                itemSubreddit = $this.find('a.title').text();

            $this.find('a.title').after('<a href="javascript:;" class="toolbox-edit-from-multi" data-subreddit="' + itemSubreddit + '" title="toolbox configuration for /r/' + itemSubreddit + '"><img src="data:image/png;base64,' + TBui.iconWrench + '"/></a>');
        });
    }

    // Oh dear! One of the buttons we created is clicked! What do we do!!?!
    // If it is on a subreddit we already know the sub and can just activate the whole bunch.
    $body.on('click', '.toolbox-edit', function () {
        showConfig(subreddit, config);
    });

    // If it is one of the many buttons on a queue page we first have to fetch the data and see if it is there.
    $body.on('click', '.toolbox-edit-from-multi', function () {
        subreddit = $(this).data('subreddit');

        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            console.log(resp);
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                self.log('Failed: wiki config');

                config = TBUtils.config;
                showConfig(subreddit, config);
            } else {
                config = resp;

                showConfig(subreddit, config);
            }
        });

    });

    // First before we do all the cool stuff, let's assume that people at one point also want to close the damn thing.

    $body.on('click', '.tb-config .close', function () {
        $('.tb-config').remove();
        $body.css('overflow', 'auto');
    });

    // now we can play around!

    // Considering that this is a config page we want to be able to save whatever we do. This function takes care of that.
    function postToWiki(page, data, reason, isJSON, updateAM) {
        self.log("posting to wiki");
        TB.ui.textFeedback('saving to wiki', TB.ui.FEEDBACK_NEUTRAL);
        TBUtils.postToWiki(page, subreddit, data, reason, isJSON, updateAM, function done(succ, err) {
            self.log("save succ = " + succ);
            if (!succ) {


                self.log(err);
                if (page === 'config/automoderator') {
                    $error = $body.find('.edit_automoderator_config .error');
                    $error.show();

                    var saveError = err.responseJSON.special_errors[0];
                    $error.find('.errorMessage').html(saveError);

                    TB.ui.textFeedback('Config not saved!', TB.ui.FEEDBACK_NEGATIVE);
                } else {
                    TB.ui.textFeedback(err.responseText, TB.ui.FEEDBACK_NEGATIVE);
                }
            } else {
                if (page === 'config/automoderator') {
                    $body.find('.edit_automoderator_config .error').hide();
                }
                self.log("clearing cache");
                TBUtils.clearCache();

                TB.ui.textFeedback('wiki page saved', TB.ui.FEEDBACK_POSITIVE);
            }
        });
    }

    // This function fetches all data for the wiki tabs.
    function wikiTabContent(tabname) {

        var page;
        var actualPage;
        switch (tabname) {
            case 'edit_toolbox_config':
                page = 'toolbox';
                actualPage = 'toolbox';
                break;
            case 'edit_user_notes':
                page = 'usernotes';
                actualPage = 'usernotes';
                break;
            case 'edit_automoderator_config':
                page = 'automoderator';
                actualPage =  'config/automoderator'
                break;
        }
        var $wikiContentArea = $body.find('.tb-window-tab.' + tabname),
            $textArea = $wikiContentArea.find('.edit-wikidata'),
            $textAreaDiv = $wikiContentArea.find('#edit-wikidata-' + page + '-div'),
            $saveButton = $wikiContentArea.find('.save-wiki-data');


        if (TB.storage.getSetting('Syntax', 'enabled', true)) {
            $body.addClass('mod-toolbox-ace');
            $textArea.hide();
            $textAreaDiv.show();

            var selectedTheme = TB.storage.getSetting('Syntax', 'selectedTheme'),
                configEditor = ace.edit('edit-wikidata-' + page + '-div');

            configEditor.getSession().setUseWrapMode(TB.storage.getSetting('Syntax', 'enableWordWrap'));
            configEditor.setTheme('ace/theme/' + selectedTheme);

            if (page === 'automoderator') {
                configEditor.getSession().setMode('ace/mode/yaml');
            } else {
                configEditor.getSession().setMode('ace/mode/json');
            }

            $textArea.val('getting wiki data...');
            configEditor.getSession().setValue('getting wiki data...');

            configEditor.getSession().on('change', function () {
                $textArea.val(configEditor.getSession().getValue());
            });


            TBUtils.readFromWiki(subreddit, actualPage, false, function (resp) {
                if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                    $($textArea).val('error getting wiki data.');
                    configEditor.getSession().setValue('error getting wiki data.');
                    return;
                }

                if (resp === TBUtils.NO_WIKI_PAGE) {
                    $($textArea).val('');
                    configEditor.getSession().setValue('');
                    $($saveButton).show();
                    $($saveButton).attr('page', page);
                    return;
                }

                resp = TBUtils.unescapeJSON(resp);

                // Found it, show it.
                $textArea.val(resp);
                configEditor.getSession().setValue(resp);
                $saveButton.show();
                $saveButton.attr('page', page);
            });
        } else {
            // load the text area, but not the save button.
            $textArea.val('getting wiki data...');

            TBUtils.readFromWiki(subreddit, actualPage, false, function (resp) {
                if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                    $textArea.val('error getting wiki data.');
                    return;
                }

                if (resp === TBUtils.NO_WIKI_PAGE) {
                    $textArea.val('');
                    $saveButton.show();
                    $saveButton.attr('page', page);
                    return;
                }

                resp = humanizeUsernotes(resp);
                resp = TBUtils.unescapeJSON(resp);

                // Found it, show it.
                $textArea.val(resp);
                $saveButton.show();
                $saveButton.attr('page', page);
            });
        }

        function humanizeUsernotes(notes) {
            if(notes.ver >= 6) {
                return decompressBlob(notes);
            }
            else {
                return notes;
            }

            function decompressBlob(notes) {
                var decompressed = TBUtils.zlibInflate(notes.blob);

                // Update notes with actual notes
                delete notes.blob;
                notes.users = JSON.parse(decompressed);
                return notes;
            }
        }
    }

    // With this function we'll fetch the removal reasons!
    function removalReasonsContent() {

        if (config.removalReasons && config.removalReasons.reasons.length > 0) {

            var i = 0;
            $(config.removalReasons.reasons).each(function () {
                var label = unescape(this.text);
                if (label == '') {
                    label = '<span style="color: #cecece">(no reason)</span>';
                } else {
                    if (label.length > 200) {
                        label = label.substring(0, 197) + '...';
                    }
                    label = TBUtils.htmlEncode(label);
                }

                var removalReasonText = unescape(config.removalReasons.reasons[i].text) || '',
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
                        <span class="removal-reason-label" data-for="reason-{{subreddit}}-{{i++}}"><span><h3 class="removal-title">{{removalReasonTitle}}</h3>{{label}}</span></span><br>\
                        <span class="removal-reason-edit">\
                            <textarea class="edit-area">{{removalReasonText}}</textarea><br/>\
                            <input type="text" name="removal-title" placeholder="removal reason title" value="{{removalReasonTitle}}"/><br/>\
                            <input type="text" name="flair-text" placeholder="flair text" value="{{removalReasonFlairText}}"/><br/>\
                            <input type="text" name="flair-css" placeholder="flair css class" value="{{removalReasonFlairCSS}}"/><br/>\
                            <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>\
                            <input class="save-edit-reason tb-action-button" type="button" value="Save reason"><input class="cancel-edit-reason tb-action-button" type="button" value="Cancel">\
                        </span>\
                    </td>\
                </tr>';

                var removalReasonTemplateHTML = TBUtils.template(removalReasonTemplate, {
                    'i': i,
                    'subreddit': subreddit,
                    'i++': (i++),
                    'label': label,
                    'removalReasonText': TBUtils.escapeHTML(removalReasonText),
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

    // Mod macros are also nice to have!

    function modMacrosContent() {
        if (config.modMacros && config.modMacros.length > 0) {

            $(config.modMacros).each(function (i, item) {
                var label = unescape(item.text);
                if (label == '') {
                    label = '<span style="color: #cecece">(no macro)</span>';
                } else {
                    if (label.length > 200) {
                        label = label.substring(0, 197) + '...';
                    }
                    label = TBUtils.htmlEncode(label);
                }
                var macro = config.modMacros[i];
                    modMacroText = unescape(macro.text) || '',
                    modMacroTitle = macro.title || '';

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
                            <input type="text" class="macro-title" name="macro-title" placeholder="macro title" value="{{modMacroTitle}}" /><br>\
                            <label><input type="checkbox" class="{{i}}-distinguish" id="distinguish">distinguish</label>\
                            <label><input type="checkbox" class="{{i}}-banuser" id="banuser">ban user</label>\
                            <label><input type="checkbox" class="{{i}}-muteuser" id="muteuser">mute user</label>\
                            <label><input type="checkbox" class="{{i}}-removeitem" id="removeitem">remove item</label>\
                            <label><input type="checkbox" class="{{i}}-approveitem" id="approveitem">approve item</label>\
                            <label><input type="checkbox" class="{{i}}-lockthread" id="lockthread">lock post</label>\
                            <label><input type="checkbox" class="{{i}}-sticky" id="sticky">sticky comment</label><br>\
                            <input type="text" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>\
                            <input class="save-edit-macro tb-action-button" type="button" value="Save macro"><input class="cancel-edit-macro tb-action-button" type="button" value="Cancel editing macro">\
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

                $('.' + i + '-distinguish').prop('checked', macro.distinguish);
                $('.' + i + '-banuser').prop('checked', macro.ban);
                $('.' + i + '-muteuser').prop('checked', macro.mute);
                $('.' + i + '-removeitem').prop('checked', macro.remove);
                $('.' + i + '-approveitem').prop('checked', macro.approve);
                $('.' + i + '-lockthread').prop('checked', macro.lockthread);
                $('.' + i + '-sticky').prop('checked', macro.sticky);

            });


        }

    }

    // Now we have all our data and the functions in place to use it, let's use it!

    // toolbox config WIKI tab
    $body.on('click', '.tb-window-tabs .edit_toolbox_config', function () {
        var $this = $(this);
        if (!$this.hasClass('content-populated')) {
            wikiTabContent('edit_toolbox_config');
            $this.addClass('content-populated');
        }
    });

    // user note config WIKI tab
    $body.on('click', '.tb-window-tabs .edit_user_notes', function () {
        var $this = $(this);
        if (!$this.hasClass('content-populated')) {
            wikiTabContent('edit_user_notes');
            $this.addClass('content-populated');
        }
    });

    // user note config WIKI tab
    $body.on('click', '.tb-window-tabs .edit_automoderator_config', function () {
        var $this = $(this);
        if (!$this.hasClass('content-populated')) {
            wikiTabContent('edit_automoderator_config');
            $this.addClass('content-populated');
        }
    });
    // Wiki tab save button is clicked.
    $body.on('click', '.save-wiki-data', function () {
        var $this = $(this),
            tabname = $this.attr('data-tabname'),
            page,
            actualPage;

        switch (tabname) {
            case 'edit_toolbox_config':
                page = 'toolbox';
                actualPage = 'toolbox';
                $body.addClass('toolbox-wiki-edited');
                break;
            case 'edit_user_notes':
                page = 'usernotes';
                actualPage = 'usernotes';
                break;
            case 'edit_automoderator_config':
                page = 'automoderator';
                actualPage = 'config/automoderator';
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
        postToWiki(actualPage, text, editNote, false, updateAM);
    });

    // toolbox config FORM tab save
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
    $body.on('click', '.tb-window-tabs .edit_removal_reasons', function () {
        var $this = $(this);
        if (!$this.hasClass('content-populated')) {

            // determine if we want to pull a new config, we only do this if the toolbox config wiki has been edited.
            if ($body.hasClass('toolbox-wiki-edited')) {
                TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
                    if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                        self.log('Failed: wiki config');
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
    $body.on('click', '.removal-reasons-buttons .edit', function () {
        var $this = $(this);

        $this.closest('tr.removal-reason').find('.removal-reason-label').hide();
        $this.closest('tr.removal-reason').find('.removal-reason-edit').show();
    });

    // cancel
    $body.on('click', '.removal-reason-edit .cancel-edit-reason', function () {
        var $this = $(this),
            $removalContent = $this.closest('td.removal-reasons-content'),
            reasonsNum = $removalContent.attr('data-reason');

        $removalContent.find('.edit-area').val(unescape(config.removalReasons.reasons[reasonsNum].text) || '<span style="color: #cecece">(no macro)</span>');
        $removalContent.find('input[name=removal-title]').val(config.removalReasons.reasons[reasonsNum].title || '');
        $removalContent.find('input[name=flair-text]').val(config.removalReasons.reasons[reasonsNum].flairText || '');
        $removalContent.find('input[name=flair-css]').val(config.removalReasons.reasons[reasonsNum].flairCSS || '');
        $removalContent.find('input[name=edit-note]').val('');

        $removalContent.find('.removal-reason-label').show();
        $removalContent.find('.removal-reason-edit').hide();
    });

    // save

    $body.on('click', '.removal-reason-edit .save-edit-reason', function () {
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
        editNote += ', reason #' + (reasonsNum + 1);

        config.removalReasons.reasons[reasonsNum].text = escape(reasonText);
        config.removalReasons.reasons[reasonsNum].flairText = reasonFlairText;
        config.removalReasons.reasons[reasonsNum].flairCSS = reasonFlairCSS;
        config.removalReasons.reasons[reasonsNum].title = reasonTitle;

        postToWiki('toolbox', config, editNote, true);

         var label = unescape(reasonText);
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
    $body.on('click', '.removal-reasons-buttons .delete', function () {
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
            postToWiki('toolbox', config, 'delete reason #' + (reasonsNum + 1), true);


            $this.closest('.removal-reason').remove();
        }
    });

    // Adding a new reason
    $body.on('click', '#tb-add-removal-reason', function () {

        $(this).hide();
        $body.find('#tb-add-removal-reason-form').show();
    });

    // Save new reason
    $body.on('click', '#tb-add-removal-reason-form .save-new-reason', function () {

        var reasonText = $body.find('#tb-add-removal-reason-form .edit-area').val(),
            reasonTitle = $body.find('#tb-add-removal-reason-form input[name=removal-title]').val(),
            reasonFlairText = $body.find('#tb-add-removal-reason-form input[name=flair-text]').val(),
            reasonFlairCSS = $body.find('#tb-add-removal-reason-form input[name=flair-css]').val(),
            editNote = $body.find('#tb-add-removal-reason-form input[name=edit-note]').val();

        editNote = 'create new reason' + (editNote ? ', ' + editNote : '');

        var reason = {
            text: escape(reasonText)
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
    $body.on('click', '#tb-add-removal-reason-form .cancel-new-reason', function () {

        $body.find('#tb-add-removal-reason').show();
        $body.find('#tb-add-removal-reason-form').hide();
        $body.find('#tb-add-removal-reason-form .edit-area').val('');
        $body.find('#tb-add-removal-reason-form input[name=removal-title]').val('');
        $body.find('#tb-add-removal-reason-form input[name=flair-text]').val('');
        $body.find('#tb-add-removal-reason-form input[name=flair-css]').val('');
        $body.find('#tb-add-removal-reason-form input[name=edit-note]').val('');
    });

    // Mod macros tab is clicked.
    $body.on('click', '.tb-window-tabs .edit_mod_macros', function () {
        var $this = $(this);
        if (!$this.hasClass('content-populated')) {

            // determine if we want to pull a new config, we only do this if the toolbox config wiki has been edited.
            if ($body.hasClass('toolbox-wiki-edited')) {
                TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
                    if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE) {
                        self.log('Failed: wiki config');
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
    $body.on('click', '.mod-macros-buttons .edit', function () {
        var $this = $(this);

        $this.closest('tr.mod-macro').find('.mod-macro-label').hide();
        $this.closest('tr.mod-macro').find('.mod-macro-edit').show();
    });

    // cancel
    $body.on('click', '.mod-macro-edit .cancel-edit-macro', function () {
        var $this = $(this),
            $macroContent = $this.closest('td.mod-macros-content'),
            macroNum = $macroContent.attr('data-macro'),
            macro = config.modMacros[macroNum];

        $macroContent.find('.edit-area').val(unescape(macro.text) || '<span style="color: #cecece">(no macro)</span>');
        $macroContent.find('input[name=macro-title]').val(macro.title || '');
        $macroContent.find('#distinguish').prop("checked", macro.distinguish);
        $macroContent.find('#banuser').prop("checked", macro.ban);
        $macroContent.find('#muteuser').prop("checked", macro.mute);
        $macroContent.find('#removeitem').prop("checked", macro.remove);
        $macroContent.find('#approveitem').prop("checked", macro.approve);
        $macroContent.find('#lockthread').prop("checked", macro.lockthread);
        $macroContent.find('#sticky').prop("checked", macro.sticky);
        $macroContent.find('input[name=edit-note]').val('');

        $macroContent.find('.mod-macro-label').show();
        $macroContent.find('.mod-macro-edit').hide();
    });

    // save
    $body.on('click', '.mod-macro-edit .save-edit-macro', function () {
        var $this = $(this),
            $macroContent = $this.closest('td.mod-macros-content'),
            macroNum = $macroContent.attr('data-macro'),
            macroText = $macroContent.find('.edit-area').val(),
            macroTitle = $macroContent.find('input[name=macro-title]').val(),
            distinguish = $macroContent.find('#distinguish').prop("checked"),
            banuser = $macroContent.find('#banuser').prop("checked"),
            muteuser = $macroContent.find('#muteuser').prop("checked"),
            removeitem = $macroContent.find('#removeitem').prop("checked"),
            approveitem = $macroContent.find('#approveitem').prop("checked"),
            lockthread = $macroContent.find('#lockthread').prop("checked"),
            sticky = $macroContent.find('#sticky').prop("checked"),
            editNote = $macroContent.find('input[name=edit-note]').val(),
            macro = config.modMacros[macroNum];


        if (macroTitle.length < 1) {
            TB.ui.textFeedback('Macro title is required', TB.ui.FEEDBACK_NEGATIVE);
            return;
        }

        if (!editNote) {
            // default note
            editNote = 'update';
        }
        editNote += ', macro #' + (macroNum + 1);

        macro.text = escape(macroText);
        macro.title = macroTitle;
        macro.distinguish = distinguish;
        macro.ban = banuser;
        macro.mute = muteuser;
        macro.remove = removeitem;
        macro.approve = approveitem;
        macro.lockthread = lockthread;
        macro.sticky = sticky;

        postToWiki('toolbox', config, editNote, true);


        var label = unescape(macroText);

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
    $body.on('click', '.mod-macros-buttons .delete', function () {
        var $this = $(this);

        var confirmDelete = confirm('This will delete this mod macro, are you sure?');
        if (confirmDelete) {
            var macroNum = $this.attr('data-macro');

            if (macroNum) {
                config.modMacros.splice(macroNum, 1);
            } else {
                return;
            }
            postToWiki('toolbox', config, 'delete macro #' + (macroNum + 1), true);


            $this.closest('.mod-macro').remove();
        }

    });

    // Adding a new macro
    $body.on('click', '#tb-add-mod-macro', function () {

        $(this).hide();
        $body.find('#tb-add-mod-macro-form').show();
    });

    // Save new macro
    $body.on('click', '#tb-add-mod-macro-form .save-new-macro', function () {
        var macroText = $body.find('#tb-add-mod-macro-form .edit-area').val(),
            macroTitle = $body.find('#tb-add-mod-macro-form input[name=macro-title]').val(),
            distinguish = $body.find('#distinguish').prop("checked"),
            banuser = $body.find('#banuser').prop("checked"),
            muteuser = $body.find('#muteuser').prop("checked"),
            removeitem = $body.find('#removeitem').prop("checked"),
            approveitem = $body.find('#approveitem').prop("checked"),
            lockthread = $body.find('#lockthread').prop("checked"),
            sticky = $body.find('#sticky').prop("checked"),
            editNote = $body.find('#tb-add-mod-macro-form input[name=edit-note]').val();

        if (macroTitle.length < 1) {
            TB.ui.textFeedback('Macro title is required', TB.ui.FEEDBACK_NEGATIVE);
            return;
        }

        editNote = 'create new macro ' + (editNote ? ', ' + editNote : '');

        var macro = {
            text: escape(macroText)
        };

        macro.title = macroTitle;
        macro.distinguish = distinguish;
        macro.ban = banuser;
        macro.mute = muteuser;
        macro.remove = removeitem;
        macro.approve = approveitem;
        macro.lockthread = lockthread;
        macro.sticky = sticky;

        if (!config.modMacros) {
            config.modMacros = [];
        }

        config.modMacros.push(macro);

        postToWiki('toolbox', config, editNote, true);

          // And finally we repopulate the macro list and hide the current form.
        $body.find('#tb-mod-macros-list').html('');
        modMacrosContent();
        $body.find('#tb-add-mod-macro').show();
        $body.find('#tb-add-mod-macro-form').hide();
        $body.find('#tb-add-mod-macro-form .edit-area').val('');
        $body.find('#tb-add-mod-macro-form input[name=macro-title]').val('');
        $body.find('#tb-add-mod-macro-form input[name=edit-note]').val('');
        $body.find('#distinguish').prop("checked", false);
        $body.find('#banuser').prop("checked", false);
        $body.find('#muteuser').prop("checked", false);
        $body.find('#removeitem').prop("checked", false);
        $body.find('#approveitem').prop("checked", false);
        $body.find('#lockthread').prop("checked", false);
        $body.find('#sticky').prop("checked", false);
    });

    // cancel
    $body.on('click', '#tb-add-mod-macro-form .cancel-new-macro', function () {
        $body.find('#tb-add-mod-macro').show();
        $body.find('#tb-add-mod-macro-form').hide();
        $body.find('#tb-add-mod-macro-form .edit-area').val('');
        $body.find('#tb-add-mod-macro-form input[name=macro-title]').val('');
        $body.find('#tb-add-mod-macro-form input[name=edit-note]').val('');
        $body.find('#distinguish').prop("checked", false);
        $body.find('#banuser').prop("checked", false);
        $body.find('#muteuser').prop("checked", false);
        $body.find('#removeitem').prop("checked", false);
        $body.find('#approveitem').prop("checked", false);
        $body.find('#lockthread').prop("checked", false);
        $body.find('#sticky').prop("checked", false);
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

TB.register_module(self);
} // tbconfig() wrapper

(function() {
    window.addEventListener('TBModuleLoaded', function () {
        tbconfig();
    });
})();
