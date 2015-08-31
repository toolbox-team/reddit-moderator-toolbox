function modbar() {
var self = new TB.Module('Modbar');
self.shortname = 'Modbar';

self.settings['enabled']['default'] = true;

// How about you don't disable modbar?  No other module should ever do this.
self.settings['enabled']['hidden'] = true; // Don't disable it, either!

self.register_setting('compactHide', {
    'type': 'boolean',
    'default': false,
    'advanced': true,
    'title': 'Use compact mode for modbar'
});
self.register_setting('unmoderatedOn', {
    'type': 'boolean',
    'default': true,
    'title': 'Show icon for unmoderated'
});
self.register_setting('enableTopLink', {
    'type': 'boolean',
    'default': false,
    'title': 'Show Top link in the modbar'
});
self.register_setting('enableModSubs', {
    'type': 'boolean',
    'default': true,
    'title': 'Show Moderated Subreddits in the modbar'
});

// private settings.    // there is no JSON setting type.
self.register_setting('shortcuts', {
    'type': 'JSON',
    'default': {},
    'hidden': true
});
self.register_setting('modbarHidden', {
    'type': 'boolean',
    'default': false,
    'hidden': true
});
self.register_setting('consoleShowing', {
    'type': 'boolean',
    'default': false,
    'hidden': true
});
self.register_setting('lockScroll', {
    'type': 'boolean',
    'default': false,
    'hidden': true
});
self.register_setting('customCSS', {
    'type': 'code',
    'default': '',
    'hidden': true
});
self.register_setting('lastExport', {
    'type': 'number',
    'default': 0,
    'hidden': true
});
self.register_setting('showExportReminder', {
    'type': 'boolean',
    'default': true,
    'hidden': true
});

self.init = function() {
    if (!TBUtils.logged || TBUtils.isToolbarPage) return;

    var $body = $('body'),
        footer = $('.footer-parent'),
        moduleCount = 0,
        DEFAULT_MODULE = 'DEFAULT_MODULE',
        currentModule = DEFAULT_MODULE;


    //
    // preload some generic variables
    //
    var shortcuts = self.setting('shortcuts'),//TB.storage.getSetting('Modbar','shortcuts', {}),// there is no JSON setting type.
        modbarHidden = self.setting('modbarHidden'),
        compactHide = self.setting('compactHide'),
        unmoderatedOn = self.setting('unmoderatedOn'),
        consoleShowing = self.setting('consoleShowing'),
        lockscroll = self.setting('lockScroll'),
        enableTopLink = self.setting('enableTopLink'),
        enableModSubs = self.setting('enableModSubs'),
        customCSS = self.setting('customCSS'),

        debugMode = TBUtils.debugMode,
        betaMode = TBUtils.betaMode,
        devMode = TBUtils.devMode,
        advancedMode = TBUtils.advancedMode,

        settingSub = TB.storage.getSetting('Utils', 'settingSub', ''),
        browserConsole = TB.storage.getSetting('Utils', 'skipLocalConsole', false),
        shortLength = TB.storage.getSetting('Utils', 'shortLength', 15),
        longLength = TB.storage.getSetting('Utils', 'longLength', 45),

        modSubreddits = TB.storage.getSetting('Notifier', 'modSubreddits', 'mod'),
        unmoderatedSubreddits = TB.storage.getSetting('Notifier', 'unmoderatedSubreddits', 'mod'),
        unreadMessageCount = TB.storage.getSetting('Notifier', 'unreadMessageCount', 0),
        modqueueCount = TB.storage.getSetting('Notifier', 'modqueueCount', 0),
        unmoderatedCount = TB.storage.getSetting('Notifier', 'unmoderatedCount', 0),
        modmailCount = TB.storage.getSetting('Notifier', 'modmailCount', 0),
        notifierEnabled = TB.storage.getSetting('Notifier', 'enabled', true),
        modmailCustomLimit = TB.storage.getSetting('ModMail', 'customLimit', 0),

        // last export stuff
        lastExport = self.setting('lastExport'),
        showExportReminder = self.setting('showExportReminder'),
        lastExportDays = Math.round(TB.utils.millisecondsToDays(TBUtils.getTime() - lastExport)),
        lastExportLabel = (lastExport === 0) ? 'Never' : lastExportDays + ' days ago',
        lastExportState = "";

    if (lastExportDays > 30 || lastExport === 0) {
        lastExportState = "sad";

        if (showExportReminder && settingSub !== '' && lastExport !== 0){
            TB.ui.textFeedback('Last toolbox settings backup: ' + lastExportLabel, TB.ui.FEEDBACK_NEGATIVE, 3000, TB.ui.DISPLAY_BOTTOM);
        }
    }
    else if (lastExportDays < 15) {
        lastExportState = "happy";
    }


    // Custom CSS for devmode/testing
    if (customCSS) {
        $('head').append('<style type="text/css">' + customCSS + '</style>');
    }

    //
    // UI elements
    //
    // style="display: none;"
    // toolbar, this will display all counters, quick links and other settings for the toolbox



    var modMailUrl = '/message/moderator/';
    if (parseInt(modmailCustomLimit) > 0) {
        modMailUrl += '?limit=' + modmailCustomLimit;
        $('#modmail').attr('href', '/message/moderator/?limit=' + modmailCustomLimit);
    }

    var modBar = $('\
<div id="tb-bottombar" class="tb-toolbar">\
    <a class="tb-bottombar-hide" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconHide + '" /></a>&nbsp;&nbsp;\
    <a class="tb-toolbar tb-toolbarsettings" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconGear + '" title="toolbox settings"/></a>\
    <span><label class="tb-first-run">&#060;-- Click for settings &nbsp;&nbsp;&nbsp;</label><span>\
    <span>&nbsp;</span>\
    <span id="tb-toolbarshortcuts"></span>\
    <span id="tb-toolbarcounters">\
    <a title="no mail" href="/message/inbox/" class="nohavemail" id="tb-mail"></a> \
    <a href="/message/inbox/" class="tb-toolbar" id="tb-mailCount"></a>\
    <a title="modmail" href="' + modMailUrl + '" id="tb-modmail" class="nohavemail"></a>\
    <a href="' + modMailUrl + '" class="tb-toolbar" id="tb-modmailcount"></a>\
    <a title="modqueue" href="/r/' + modSubreddits + '/about/modqueue" id="tb-modqueue"></a> \
    <a href="/r/' + modSubreddits + '/about/modqueue" class="tb-toolbar" id="tb-queueCount"></a>\
    </span>\
</div>\
');

    // Add unmoderated icon if it is enabled.

    if (unmoderatedOn) {
        modBar.find('#tb-toolbarcounters').append('\
<a title="unmoderated" href="/r/' + unmoderatedSubreddits + '/about/unmoderated" id="tb-unmoderated"></a>\
<a href="/r/' + unmoderatedSubreddits + '/about/unmoderated" class="tb-toolbar" id="tb-unmoderatedcount"></a>\
');

    }


    var modbarhid = $('\
<div id="tb-bottombar-hidden" class="tb-toolbar">\
    <a class="tb-bottombar-unhide" href="javascript:void(0)"><img id="tb-bottombar-image" src="data:image/png;base64,' + ((compactHide) ? TBui.iconGripper : TBui.iconShow) + '" /></a>\
</div>\
');


    if (debugMode) {

        var $console = $('\
<div class="tb-debug-window">\
    <div class="tb-debug-header"><div id="tb-debug-header-handle"> Debug Console </div><span class="tb-debug-header-options"><a class="tb-close" id="tb-debug-hide" href="javascript:;">✕</a></span></div>\
    <div class="tb-debug-content">\
        <textarea class="tb-debug-console" rows="20" cols="20"></textarea>\
        <input type="text" class="tb-debug-input" placeholder="eval() in toolbox scope" />\
    </div>\
    <div class="tb-debug-footer">\
        <select class="module-select"><option value="' + DEFAULT_MODULE + '">all modules</option></select>\
        <label><input type="checkbox" id="tb-console-lockscroll" ' + ((lockscroll) ? "checked" : "") + '> lock scroll</label>\
        <!--input class="tb-console-copy" type="button" value="copy text"-->\
        <input class="tb-console-clear tb-action-button" type="button" value="clear console">\
    </div>\
</div>\
');

        $console.appendTo('body').hide();

        $console.drag('#tb-debug-header-handle');
    }

    $body.append(modBar);

    // Always add moderated subreddits, but hide it.  Reason: personal notes needs the elem to exist.
    $body.find('#tb-toolbarshortcuts').before('<a href="javascript:void(0)" id="tb-toolbar-mysubs" style="display: none">Moderated Subreddits</a> ');

    // moderated subreddits button.
    if (enableModSubs) {
        var subList = '',
            livefilterCount,
            mySubsTemplate = '\
<div id="tb-my-subreddits">\
    <input id="tb-livefilter-input" type="text" placeholder="live search" value=""> \
    <span class="tb-livefilter-count">{{livefilterCount}}</span>\
    <br>\
    <table id="tb-my-subreddit-list">{{subList}}</table>\
</div>\
';

        TBUtils.getModSubs(function () {
            self.log('got mod subs');
            self.log(TBUtils.mySubs.length);
            self.log(TBUtils.mySubsData.length);
            $(TBUtils.mySubsData).each(function () {
                subList = subList + '\
<tr data-subreddit="' + this.subreddit + '">\
    <td><a href="/r/' + this.subreddit + '" target="_blank">/r/' + this.subreddit + '</a></td>\
    <td class="tb-my-subreddits-subreddit">\
        <a title="/r/' + this.subreddit + ' modmail!" target="_blank" href="/r/' + this.subreddit + '/message/moderator" class="generic-mail"></a>\
        <a title="/r/' + this.subreddit + ' modqueue" target="_blank" href="/r/' + this.subreddit + '/about/modqueue" class="generic-modqueue"></a>\
        <a title="/r/' + this.subreddit + ' unmoderated" target="_blank" href="/r/' + this.subreddit + '/about/unmoderated" class="generic-unmoderated"></a>\
    </td>\
</tr>\
';
            });
            livefilterCount = TBUtils.mySubs.length;

            var modSubsPopupContent = TBUtils.template(mySubsTemplate, {
                'livefilterCount': livefilterCount,
                'subList': subList
            });


            $body.on('click', '#tb-toolbar-mysubs', function () {
                var $this = $(this);
                if (!$this.hasClass('tb-mysubs-activated')) {
                    $this.addClass('tb-mysubs-activated');
                    TB.ui.popup(
                        'Subreddits you moderate',
                        [
                            {
                                title: 'Subreddits you moderate',
                                id: 'sub-you-mod', // reddit has things with class .role, so it's easier to do this than target CSS
                                tooltip: 'Subreddits you moderate',
                                content: modSubsPopupContent,
                                footer: ''
                            }
                        ],
                        '',
                        'subreddits-you-mod-popup' // class
                    ).appendTo('body').css({
                            'position': 'fixed',
                            'bottom': '31px',
                            'left': '20px'
                        });
                }

                $body.find('#tb-livefilter-input').keyup(function () {
                    var LiveSearchValue = $(this).val();
                    $body.find('#tb-my-subreddits table tr').each(function () {
                        var $this = $(this),
                            subredditName = $this.attr('data-subreddit');

                        if (subredditName.toUpperCase().indexOf(LiveSearchValue.toUpperCase()) < 0) {
                            $this.hide();
                        } else {
                            $this.show();
                        }
                        $('.tb-livefilter-count').text($('#tb-my-subreddits table tr:visible').length);
                    });
                });
            });

            $body.on('click', '.subreddits-you-mod-popup .close', function () {
                $(this).closest('.subreddits-you-mod-popup').remove();
                $body.find('#tb-toolbar-mysubs').removeClass('tb-mysubs-activated');
            });

            // only show the button once it's populated.
            $('#tb-toolbar-mysubs').show();
        });
    }

    if (TBUtils.firstRun) {
        $('.tb-first-run').show();
    }

    if (enableTopLink) {
        $('#tb-bottombar').find('#tb-toolbarcounters').before('<a href="#content" id="tb-top-link"><img title="go to top" src="data:image/png;base64,' + TBui.topIcon + '" /></a>'); // needs an icon.
    }

    // Debug mode/console
    if (debugMode) {
        $('#tb-bottombar').find('#tb-toolbarcounters').before('\
<a href="javascript:;" id="tb-toggle-console"><img title="debug console" src="data:image/png;base64,' + TBui.iconConsole + '" /></a>\
');

        var $consoleText = $('.tb-debug-console');

        setInterval(function () {

            if (currentModule == DEFAULT_MODULE) {
                $consoleText.val(TBUtils.log.join('\n'));
            }

            // filter log by module.
            else {
                var search = '[' + currentModule + ']',
                    moduleLog = [];

                // hack-y substring search for arrays.
                for (i = 0; i < TB.utils.log.length; i++) {
                    if (TB.utils.log[i].indexOf(search) > -1) {
                        moduleLog.push(TB.utils.log[i]);
                    }
                }

                $consoleText.val(moduleLog.join('\n'));
            }

            if (lockscroll) {
                $consoleText.scrollTop($consoleText[0].scrollHeight);
            }

            // add new modules to dropdown.
            if (TB.utils.logModules.length > moduleCount){
                moduleCount = TB.utils.logModules.length;

                var $moduleSelect = $('.module-select');

                // clear old list
                $('.module-select option').remove();

                // re-add default option
                $moduleSelect.append($('<option>', {
                    value: DEFAULT_MODULE
                }).text('all modules'));

                $(TB.utils.logModules).each(function () {
                    $moduleSelect.append($('<option>', {
                        value: this
                    }).text(this));
                }).promise().done( function(){
                    $moduleSelect.val(currentModule);
                });
            }
        }, 500);

        if (consoleShowing && debugMode) {
            $console.show();
        }

    }

    // Append shortcuts
    $.each(shortcuts, function (index, value) {
        var shortcut = $('<span>- <a class="tb-no-gustavobc" href="' + TBUtils.htmlEncode(unescape(value)) + '">' + TBUtils.htmlEncode(unescape(index)) + '</a> </span>');

        $(shortcut).appendTo('#tb-toolbarshortcuts');
    });

    $(footer).prepend(modbarhid);

    // Always default to hidden.

    if (compactHide) {
        modbarHidden = true;
        $('#tb-bottombar-image').hide();
    }

    function toggleMenuBar(hidden) {
        if (hidden) {
            $(modBar).hide();
            $(modbarhid).show();
            $body.find('.tb-debug-window').hide(); // hide the console, but don't change consoleShowing.
        } else {
            $(modBar).show();
            $(modbarhid).hide();
            if (consoleShowing && debugMode) $body.find('.tb-debug-window').show();
        }
        self.setting('modbarHidden', hidden);
    }

    toggleMenuBar(modbarHidden);

    // Show/hide menubar
    $body.on('click', '.tb-bottombar-unhide, .tb-bottombar-hide', function () {
        toggleMenuBar($(this).hasClass('tb-bottombar-hide'));
    });

    // Show counts on hover
    $(modbarhid).hover(function modbarHover(e) {
        if (!notifierEnabled || compactHide) return;
        var hoverString = 'New Messages: ' + unreadMessageCount + '<br>Mod Queue: ' + modqueueCount + '<br>Unmoderated Queue: ' + unmoderatedCount + '<br>New Mod Mail: ' + modmailCount;

        $.tooltip(hoverString, e);
    });

    if (compactHide) {
        $(modbarhid)
            .mouseover(function () {
                $body.find('#tb-bottombar-image').show();
            })
            .mouseout(function () {
                $body.find('#tb-bottombar-image').hide();
            });
    }

    /// Console stuff
    // Show/hide console
    if (debugMode) {
        $body.on('click', '#tb-toggle-console, #tb-debug-hide', function () {
            if (consoleShowing) {
                $console.hide();
            } else {
                $console.show();
            }

            consoleShowing = !consoleShowing;
            self.setting('consoleShowing', consoleShowing);
        });

        // Set console scroll
        $body.on('click', '#tb-console-lockscroll', function () {
            lockscroll = !lockscroll;
            self.setting('lockScroll', lockscroll);
        });

        /*
         // Console copy... needs work
         $body.on('click', '#tb-console-copy', function () {
         lockscroll = !lockscroll;
         TBUtils.setSetting('Notifier', 'lockscroll', lockscroll)
         });
         */

        // Console clear
        $body.on('click', '.tb-console-clear', function () {
            TBUtils.log = [];
        });

        // Run console input
        $('.tb-debug-input').keyup(function (e) {
            if (e.keyCode == 13) {
                self.log(eval($(this).val()));
                $(this).val(''); // clear line
            }
        });

        // change modules
        $('.module-select').change(function () {
            currentModule = $(this).val();
            self.log('selected module: ' + currentModule);
        });
    }

/// End console stuff


    // Settings menu
    function showSettings() {


        // The window in which all settings will be showed.
        var html = '\
<div class="tb-page-overlay tb-settings tb-personal-settings">\
    <div class="tb-window-wrapper">\
        <div class="tb-window-header">\
            toolbox Settings\
            <span class="tb-window-header-options"><a class="tb-help-main" href="javascript:;" currentpage="" title="Help">?</a><a class="tb-close" title="Close Settings" href="javascript:;">✕</a></span>\
        </div>\
        <div class="tb-window-tabs"></div>\
        <div class="tb-window-content"></div>\
        <div class="tb-window-footer"><input class="tb-save tb-action-button" type="button" value="save">' + (devMode ? '&nbsp;<input class="tb-save-reload tb-action-button" type="button" value="save and reload">' : '') + '</div>\
    </div>\
</div>\
';
        $(html).appendTo('body').show();
        $body.css('overflow', 'hidden');

        // Settings for the tool bar.
        var $toolboxSettings = $('\
<div class="tb-window-content-toolbox">\
    <p id="tb-toolbox-settingssub">\
        Backup/restore toolbox settings to a wiki page:<br>\
        <input type="text" name="settingssub" placeholder="Fill in a private subreddit where you are mod..." value="' + TBUtils.htmlEncode(unescape(settingSub)) + '">\
        <input class="tb-settings-export tb-action-button" type="button" value="backup">\
        <input class="tb-settings-import tb-action-button" type="button" value="restore">\
        <b> Important:</b> This will reload the page without saving!\
        <label class="backup-warning ' + lastExportState + '">Last backup: <b>'+ lastExportLabel +'</b></label>\
    </p><p id="tb-toolbox-showexportreminder">\
        <label><input type="checkbox" id="showExportReminder" ' + ((showExportReminder) ? "checked" : "") + '> Show backup reminder every 30 days.</label>\
    </p><p id="tb-toolbox-debugmode"' + ((advancedMode) ? '' : 'style="display:none;"') + '>\
        <label><input type="checkbox" id="debugMode" ' + ((debugMode) ? "checked" : "") + '> Enable debug mode</label>\
    </p><p id="tb-toolbox-browserconsole"' + ((debugMode) ? '' : 'style="display:none;"') + '>\
        <label><input type="checkbox" id="browserConsole" ' + ((browserConsole) ? "checked" : "") + '> Use browser\'s console</label>\
    </p><p id="tb-toolbox-betamode">\
        <label><input type="checkbox" id="betaMode" ' + ((betaMode) ? "checked" : "") + '> Enable beta features</label>\
    </p><p id="tb-toolbox-advancedmode">\
        <label><input type="checkbox" id="advancedMode" ' + ((advancedMode) ? "checked" : "") + '> Show advanced settings</label>\
    </p><p id="tb-toolbox-longlength"' + ((advancedMode) ? '' : 'style="display:none;"') + '>\
        Cache subreddit config (removal reasons, domain tags, mod macros) time (in minutes):<br>\
        <input type="text" name="longLength" value="' + longLength + '">\
    </p><p id="tb-toolbox-shortlength"' + ((advancedMode) ? '' : 'style="display:none;"') + '>\
        Cache subreddit user notes time (in minutes):<br>\
        <input type="text" name="shortLength" value="' + shortLength + '">\
    </p><p id="tb-toolbox-clearcache">\
        <label><input type="checkbox" id="clearcache"> Clear cache on save. (NB: please close all other open reddit tabs before click clearing cache.)</label>\
    </p>\
    <p id="tb-toolbox-showsettings"' + ((debugMode && !TB.utils.devModeLock) ? ' ' : 'style="display:none;" ') + '>\
        <input type="button" id="showRawSettings" class="tb-action-button" value="Show Settings" />\
    </p>\
    <div class="tb-help-main-content">Edit toolbox general settings</div>\
</div>\
');

        // add them to the dialog
        $toolboxSettings.appendTo('.tb-window-content');
        $('<a href="javascript:;" class="tb-window-content-toolbox" data-module="toolbox">General Settings</a>').addClass('active').appendTo('.tb-window-tabs');
        $('.tb-help-main').attr('currentpage', 'toolbox');

        // Settings to toggle the modules
        var htmlmodules = '\
<div class="tb-window-content-modules">\
    <div class="tb-help-main-content">Here you can enable/disable toolbox modules.</div>\
</div>\
';
        $(htmlmodules).appendTo('.tb-window-content').hide();
        $('<a href="javascript:;" class="tb-window-content-modules" data-module="modules">Toggle Modules</a>').appendTo('.tb-window-tabs');


        // Edit shortcuts
        var htmlshorcuts = '\
<div class="tb-window-content-shortcuts">\
    <table class="tb-window-content-shortcuts-table"><tr><td>name</td><td> url </td><td class="tb-window-content-shortcuts-td-remove"> remove</td></tr></table>\
    <a class="tb-add-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconAdd + '" /></a>\
    <div class="tb-help-main-content">Add or remove shortcuts here!</div>\
</div>\
';
        $(htmlshorcuts).appendTo('.tb-window-content').hide();

        if ($.isEmptyObject(shortcuts)) {
            $('\
<tr class="tb-window-content-shortcuts-tr">\
    <td>\
        <input type="text" name="name">\
    </td>\
    <td>\
        <input type="text" name="url">\
        <td>\
            <td class="tb-window-content-shortcuts-td-remove">\
                <a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconDelete + '" /></a>\
    </td></td></td>\
</tr>\
').appendTo('.tb-window-content-shortcuts-table');

        } else {
            $.each(shortcuts, function (index, value) {
                shortcutinput = '\
<tr class="tb-window-content-shortcuts-tr">\
    <td>\
        <input type="text" value="' + TBUtils.htmlEncode(unescape(index)) + '" name="name"> </td>\
    <td>\
        <input type="text" value="' + TBUtils.htmlEncode(unescape(value)) + '" name="url">\
        <td>\
            <td class="tb-window-content-shortcuts-td-remove">\
                <a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconDelete + '" /></a>\
    </td></td></td>\
</tr><br><br>\
';
                //console.log(shortcutinput);
                $(shortcutinput).appendTo('.tb-window-content-shortcuts-table');
            });
        }

        $('<a href="javascript:;" class="tb-window-content-shortcuts" data-module="shortcuts">Shortcuts</a>').appendTo('.tb-window-tabs');

        // About page
        var htmlabout = '\
<div class="tb-window-content-about">\
    <h3>About:</h3> <a href="/r/toolbox" target="_blank">/r/toolbox v' + TBUtils.toolboxVersion + ': "' + TBUtils.releaseName + '"</a>\
    <br> made and maintained by: <a href="/user/creesch/">/u/creesch</a>, <a href="/user/agentlame">/u/agentlame</a>, <a href="/user/LowSociety">/u/LowSociety</a>,\
    <a href="/user/TheEnigmaBlade">/u/TheEnigmaBlade</a>, <a href="/user/dakta">/u/dakta</a>, <a href="/user/largenocream">/u/largenocream</a>,\
    <a href="/user/noeatnosleep">/u/noeatnosleep</a>, <a href="/user/psdtwk">/u/psdtwk</a> and <a href="/user/garethp">/u/garethp</a><br><br> "\
    <i>' + TBUtils.RandomQuote + '</i>"<br><br>\
    <h3>Documentation by:</h3>\
    <a href="/user/psdtwk">/u/psdtwk</a>, <a href="/user/gorillagnomes">/u/gorillagnomes</a>, <a href="/user/x_minus_one">/u/x_minus_one</a>, <a href="/user/Gustavobc">/u/Gustavobc</a> and <a href="/user/hermithome">/u/hermithome</a><br><br>\
    <h3>Special thanks to:</h3>\
    <a href="/user/andytuba">/u/andytuba</a> - for all his amazing help and support of the TB team in resolving complex issues (and really simple ones)<br><br>\
    <h3>Credits:</h3>\
    <a href="http://www.famfamfam.com/lab/icons/silk/" target="_blank">Silk icon set by Mark James</a><br>\
    <a href="http://p.yusukekamiyamane.com/" target="_blank">Diagona icon set by Yusuke Kamiyamane</a><br>\
    <a href="http://momentumdesignlab.com/" target="_blank">Momentum Matte icons</a><br>\
    <a href="/user/DEADB33F" target="_blank">Modtools and realtime base code by DEADB33F</a><br>\
    <a href="https://chrome.google.com/webstore/detail/reddit-mod-nuke-extension/omndholfgmbafjdodldjlekckdneggll?hl=en" target="_blank">Comment Thread Nuke Script</a> by <a href="/u/djimbob" target="_blank">/u/djimbob</a><br>\
    <a href="https://github.com/gamefreak/snuownd" target="_blank">snuownd.js by gamefreak</a><br>\
    <a href="http://ace.c9.io/" target="_blank">Ace embeddable code editor</a><br><br>\
    <h3>License:</h3>\
    <span>Copyright 2013-2015 toolbox development team. </span>\
    <p>Licensed under the Apache License, Version 2.0 (the "License");\
        <br> you may not use this file except in compliance with the License.\
        <br> You may obtain a copy of the License at </p>\
    <p><a href="http://www.apache.org/licenses/LICENSE-2.0">http://www.apache.org/licenses/LICENSE-2.0</a></p>\
    <p>Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\
        <br> See the License for the specific language governing permissions and limitations under the License.</p>\
    <p ' + ((debugMode && !TB.utils.devModeLock) ? ' ' : 'style="display:none;" ') + '>\
        <label><input type="checkbox" id="devMode" ' + ((devMode) ? "checked" : "") + '> DEVMODE: DON\'T EVER ENABLE THIS!</label>\
    </p>\
    <div class="tb-help-main-content">This is a about page!</div>\
</div>\
';

        $(htmlabout).appendTo('.tb-window-content').hide();
        $('<a href="javascript:;" class="tb-window-content-about" data-module="about">About</a>').appendTo('.tb-window-tabs');
    }

    $body.on('click', '.tb-settings-import, .tb-settings-export', function (e) {
        var sub = $("input[name=settingssub]").val();
        if (!sub) return self.log('no setting sub');

        // Just to be safe.
        sub = TB.utils.cleanSubredditName(sub);

        // Save the sub, first.
        TB.storage.setSetting('Utils', 'settingSub', sub);

        if ($(e.target).hasClass('tb-settings-import')) {
            TBUtils.importSettings(sub, function () {
                self.setting('lastExport', TB.utils.getTime());
                TBUtils.clearCache();
                window.location.reload();
            });
        }
        else {
            TBUtils.exportSettings(sub, function () {
                self.setting('lastExport', TB.utils.getTime());
                TBUtils.clearCache();
                window.location.reload();
            });
        }
    });

    // Open the settings
    $body.on('click', '.tb-toolbarsettings', function () {
        TB.utils.getModSubs(function () {
            showSettings();
            TB.injectSettings();
        });
    });

    // check for passed settings.
    function switchTab(module) {

        var $this = $body.find("[data-module='" + module + "']"),
            $tb_help_mains = $('.tb-help-main');

        // achievement support
        if (module == 'about'){
            TB.utils.sendEvent(TB.utils.events.TB_ABOUT_PAGE);
        }

        $('.tb-window-tabs a').removeClass('active');
        $this.addClass('active');

        $tb_help_mains.attr('currentpage', module);
        // if we have module name, give that to the help button
        if ($this.data('module')) {
            $tb_help_mains.data('module', $this.data('module'));
        }
        $('.tb-window-content').children().hide();
        $('div.tb-window-content-' + module).show();
    }

    function checkHash() {
        if (window.location.hash) {
            var module = TB.utils.getHashParameter('tbsettings'),
                setting = TB.utils.getHashParameter('setting');

            self.log(setting);
            if (module) {
                // prevent tbsetting URL hash from persisting on reload.
                history.pushState("", document.title, window.location.pathname);

                module = module.toLowerCase();

                if (setting) {
                    setting = setting.toLowerCase();
                    var id = '#tb-' + module + '-' + setting,
                        highlightedCSS = id + ' p {background-color: #'+ TB.ui.standardColors.softyellow +'; display: block !important;}';

                    // this next line is to deal with legacy settings
                    highlightedCSS += id + '{background-color: #'+ TB.ui.standardColors.softyellow +'; display: block !important;}';
                    highlightedCSS += '.tb-setting-link-' + setting + ' {display: block !important;}';

                    $('head').append('<style type="text/css">' + highlightedCSS + '</style>');
                }

                // Wait a sec for stuff to load.
                setTimeout(function () {

                    showSettings();
                    TB.injectSettings();
                    switchTab(module);
                }, 1000);
            }
        }
    }
    checkHash();
    setInterval(checkHash, 500);

    // change tabs
    $body.on('click', '.tb-window-tabs a:not(.active)', function () {
        var tab = $(this).attr('data-module');
        switchTab(tab);
    });

    // remove a shortcut
    $body.on('click', '.tb-remove-shortcuts', function () {
        $(this).closest('.tb-window-content-shortcuts-tr').remove();
    });

    // add a shortcut
    $body.on('click', '.tb-add-shortcuts', function () {
        $('\
<tr class="tb-window-content-shortcuts-tr">\
    <td>\
        <input type="text" name="name"> </td>\
    <td>\
        <input type="text" name="url">\
        <td>\
            <td class="tb-window-content-shortcuts-td-remove">\
                <a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconDelete + '" /></a>\
    </td></td></td>\
</tr>\
').appendTo('.tb-window-content-shortcuts-table');
    });

    // Save the settings
    $body.on('click', '.tb-save, .tb-save-reload', function (e) {
        var reload = (e.target.className === 'tb-save-reload');

        TB.storage.setSetting('Utils', 'debugMode', $("#debugMode").prop('checked'));
        TB.storage.setSetting('Utils', 'betaMode', $("#betaMode").prop('checked'));
        TB.storage.setSetting('Utils', 'devMode', $("#devMode").prop('checked'));
        TB.storage.setSetting('Utils', 'advancedMode', $("#advancedMode").prop('checked'));
        TB.storage.setSetting('Utils', 'skipLocalConsole', $("#browserConsole").prop('checked'));

        self.setting('showExportReminder', $("#showExportReminder").prop('checked'));

        // Save shortcuts
        var $shortcuts = $('.tb-window-content-shortcuts-tr');
        if ($shortcuts.length === 0) {
            self.setting('shortcuts', {}); // no JSON setting type.
        } else {
            shortcuts = {};

            $shortcuts.each(function () {
                var $this = $(this),
                    name = $this.find('input[name=name]').val(),
                    url = $this.find('input[name=url]').val();

                if (name.trim() !== '' || url.trim() !== '') {
                    shortcuts[escape(name)] = escape(url);
                }
            });

            self.setting('shortcuts', shortcuts);
        }

        // save cache settings.
        TB.storage.setSetting('Utils', 'longLength', $("input[name=longLength]").val());
        TB.storage.setSetting('Utils', 'shortLength', $("input[name=shortLength]").val());

        if ($("#clearcache").prop('checked')) {
            TBUtils.clearCache();
        }

        $('.tb-settings').remove();
        $body.css('overflow', 'auto');

        TB.storage.verifiedSettingsSave(function (succ) {
            if (succ) {
                TB.ui.textFeedback("Settings saved and verified", TB.ui.FEEDBACK_POSITIVE);
                setTimeout(function () {
                    // Only reload in dev mode if we asked to.
                    if (!devMode || reload) {
                        window.location.reload();
                    }
                }, 1000);
            } else {
                TB.ui.textFeedback("Save could not be verified", TB.ui.FEEDBACK_NEGATIVE);
            }
        });
    });

    $body.on('click', '#showRawSettings', function () {
        $overlay = TB.ui.overlay(
            'toolbox raw setting display',
            [
                {
                    title: '',
                    tooltip: '',
                    content: '\
                <span class="tb-settings-display">\
                <textarea class="edit-settings" rows="20" cols="20"></textarea>\
                </br>\
                </span>\
                ',
                    footer: '<input class="anonymize-settings tb-action-button" type="button" value="Anonymize Settings">'
                }
            ],
            '', // meta
            'tb-raw-settings'
        ).appendTo('body');
        $body.css('overflow', 'hidden');

        var $editSettings = $('.edit-settings');

        TB.storage.getSettingsObject(function (sObject) {
            $editSettings.val(JSON.stringify(sObject, null, 2));
        });

        $body.on('click', '.anonymize-settings', function () {
            TB.storage.getAnonymizedSettingsObject(function (sObject) {
                $editSettings.val(JSON.stringify(sObject, null, 2));
            });
        });


    });

    $body.on('click', '.tb-raw-settings .close', function () {
        $('.tb-raw-settings').remove(); // should we have some confirmation dialog here?
    });


    $body.on('click', '.tb-help-toggle', function () {
        var module = $(this).attr('data-module');
        window.open('https://www.reddit.com/r/toolbox/wiki/livedocs/' + module, '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');

    });

    $body.on('click', '.tb-help-main', function () {
        var $this = $(this),
            module = $this.attr('currentpage');

        window.open('https://www.reddit.com/r/toolbox/wiki/livedocs/' + module, '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');
    });

    // Close the Settings menu
    $body.on('click', '.tb-close', function () {
        $('.tb-settings').remove();
        $body.css('overflow', 'auto');
    });
};
TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        modbar();
    });
})();
