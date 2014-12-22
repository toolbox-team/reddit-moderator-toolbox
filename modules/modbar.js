function tbmodbar() {

var modbar = new TB.Module('Toolbox UI (modbar)');
modbar.shortname = 'Modbar';

modbar.settings['enabled']['default'] = true;

// How about you don't disable modbar?  No other module should ever do this.
modbar.settings['enabled']['hidden'] = true; // Don't disable it, either!

modbar.register_setting('compactHide', {
    'type': 'boolean',
    'default': false,
    'hidden': true,
    'title': 'Use compact mode for mod bar'
});
modbar.register_setting('unmoderatedOn', {
    'type': 'boolean',
    'default': true,
    'hidden': true,
    'title': 'Show icon for unmoderated'
});
modbar.register_setting('enableTopLink', {
    'type': 'boolean',
    'default': false,
    'hidden': true,
    'title': 'Show top link in modbar'
});

// private settings.    // there is no JSON setting type.
modbar.register_setting('shortcuts', {
    'type': 'JSON',
    'default': {},
    'hidden': true
});
modbar.register_setting('modbarHidden', {
    'type': 'boolean',
    'default': false,
    'hidden': true
});
modbar.register_setting('consoleShowing', {
    'type': 'boolean',
    'default': false,
    'hidden': true
});
modbar.register_setting('lockScroll', {
    'type': 'boolean',
    'default': false,
    'hidden': true
});

modbar.init = function modbarInit() {
    if (!TBUtils.logged || TBUtils.isToolbarPage) return;

    var $body = $('body'),
        footer = $('.footer-parent');

    $body.addClass('mod-toolbox');

    //
    // preload some generic variables
    //
    var shortcuts = modbar.setting('shortcuts'),//TB.storage.getSetting('Modbar','shortcuts', {}),// there is no JSON setting type.
        modbarHidden = modbar.setting('modbarHidden'),
        compactHide = modbar.setting('compactHide'),
        unmoderatedOn = modbar.setting('unmoderatedOn'),
        consoleShowing = modbar.setting('consoleShowing'),
        lockscroll = modbar.setting('lockScroll'),
        enableTopLink = modbar.setting('enableTopLink'),

        debugMode = TBUtils.debugMode,
        betaMode = TBUtils.betaMode,
        devMode = TBUtils.devMode,

        settingSub = TB.storage.getSetting('Utils', 'settingSub', ''),
        browserConsole = TB.storage.getSetting('Utils', 'skipLocalConsole', false),
        shortLength = TB.storage.getSetting('Utils', 'shortLength', 15),
        longLength = TB.storage.getSetting('Utils', 'longLength', 45),

        modSubreddits = TB.storage.getSetting('Notifier', 'modmailSubreddits', 'mod'),
        unmoderatedSubreddits = TB.storage.getSetting('Notifier', 'unmoderatedSubreddits', 'mod'),
        unreadMessageCount = TB.storage.getSetting('Notifier', 'unreadMessageCount', 0),
        modqueueCount = TB.storage.getSetting('Notifier', 'modqueueCount', 0),
        unmoderatedCount = TB.storage.getSetting('Notifier', 'unmoderatedCount', 0),
        modmailCount = TB.storage.getSetting('Notifier', 'modmailCount', 0),
        notifierEnabled = TB.storage.getSetting('Notifier', 'enabled', true);
        
    var randomQuotes = new Array("Dude, in like 24 months, I see you Skyping someone to watch them search someone's comments on reddit.", 
                                 "Simple solution, don't use nightmode....", 
                                 "Nightmode users are a buncha nerds.", 
                                 "Oh, so that's where that code went, I thought i had lost it somehow.",
                                 "Are all close buttons pretty now?!?!?"),    
        randomQuote = randomQuotes[Math.floor( Math.random() * randomQuotes.length )];
   


    //
    // UI elements
    //
    // style="display: none;"
    // toolbar, this will display all counters, quick links and other settings for the toolbox


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
    <a title="modmail" href="/message/moderator/" id="tb-modmail" class="nohavemail"></a>\
    <a href="/message/moderator/" class="tb-toolbar" id="tb-modmailcount"></a>\
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
</div>');


    if (debugMode) {

        var $console = $('\
    <div class="tb-debug-window">\
        <div class="tb-debug-header"><div id="tb-debug-header-handle"> Debug Console </div><span class="tb-debug-header-options"><a class="tb-close" id="tb-debug-hide" href="javascript:;">✕</a></span></div>\
        <div class="tb-debug-content">\
            <textarea class="tb-debug-console" rows="20" cols="20"></textarea>\
            <input type="text" class="tb-debug-input" placeholder="eval() in Toolbox scope" />\
        </div>\
        <div class="tb-debug-footer">\
            <label><input type="checkbox" id="tb-console-lockscroll" ' + ((lockscroll) ? "checked" : "") + '> lock scroll to bottom</label>\
            <!--input class="tb-console-copy" type="button" value="copy text"-->\
            <input class="tb-console-clear" type="button" value="clear console">\
        </div>\
    </div>\
    ');

        $console.appendTo('body').hide();

        $console.drag('#tb-debug-header-handle');
    }

    $body.append(modBar);

    // moderated subreddits button.
    $body.append('<div id="tb-my-subreddits" style="display: none;"><h1>Subreddits you moderate</h1> <input id="tb-livefilter-input" type="text" placeholder="live search" value=""> <span class="tb-livefilter-count"></span><br><table id="tb-my-subreddit-list"></table>');
    $body.find('#tb-toolbarshortcuts').before('<a href="javascript:void(0)" id="tb-toolbar-mysubs">Moderated Subreddits</a> ');
    TBUtils.getModSubs(function notifierinit() {
        $(TBUtils.mySubsData).each(function () {
            $body.find('#tb-my-subreddits table').append('\
    <tr data-subreddit="' + this.subreddit + '"><td><a href="/r/' + this.subreddit + '" target="_blank">/r/' + this.subreddit + '</a></td> \
    <td class="tb-my-subreddits-subreddit"><a title="/r/' + this.subreddit + ' modmail!" target="_blank" href="/r/' + this.subreddit + '/message/moderator" class="generic-mail"></a>\
    <a title="/r/' + this.subreddit + ' modqueue" target="_blank" href="/r/' + this.subreddit + '/about/modqueue" class="generic-modqueue"></a>\
    <a title="/r/' + this.subreddit + ' unmoderated" target="_blank" href="/r/' + this.subreddit + '/about/unmoderated" class="generic-unmoderated"></a></td></tr>\
    ');
        });
        $('.tb-livefilter-count').text($('#tb-my-subreddits table tr:visible').length + '/' + TBUtils.mySubs.length);
    });

    $body.on('click', '#tb-toolbar-mysubs', function () {
        $body.find('#tb-my-subreddits').toggle();
    });

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
            $consoleText.val(TBUtils.log.join('\n'));
            if (lockscroll) {
                $consoleText.scrollTop($consoleText[0].scrollHeight);
            }
        }, 500);

        if (consoleShowing && debugMode) {
            $console.show();
        }

    }

    // Append shortcuts
    $.each(shortcuts, function (index, value) {
        var shortcut = $('<span>- <a href="' + TBUtils.htmlEncode(unescape(value)) + '">' + TBUtils.htmlEncode(unescape(index)) + '</a> </span>');

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
        modbar.setting('modbarHidden', hidden);
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
    $body.on('click', '#tb-toggle-console, #tb-debug-hide', function () {
        if (consoleShowing) {
            $console.hide();
        } else {
            $console.show();
        }

        consoleShowing = !consoleShowing;
        modbar.setting('consoleShowing', consoleShowing);
    });

    // Set console scroll
    $body.on('click', '#tb-console-lockscroll', function () {
        lockscroll = !lockscroll;
        modbar.setting('lockScroll', lockscroll);
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
            modbar.log(eval($(this).val()));
            $(this).val(''); // clear line
        }
    });
/// End console stuff


    // Settings menu
    function showSettings() {



        // The window in which all settings will be showed.
        var html = '\
    <div class="tb-page-overlay tb-settings tb-personal-settings"><div class="tb-window-wrapper">\
        <div class="tb-window-header">\
            Toolbox Settings\
            <span class="tb-window-header-options"><a class="tb-help-main" href="javascript:;" currentpage="" title="Help">?</a><a class="tb-close" title="Close Settings" href="javascript:;">✕</a></span>\
        </div>\
        <div class="tb-window-tabs"></div>\
        <div class="tb-window-content"></div>\
        <div class="tb-window-footer"><input class="tb-save" type="button" value="save"></div>\
    </div></div>\
    ';
        $(html).appendTo('body').show();
        $body.css('overflow', 'hidden');

        // Settings for the tool bar.
        var $toolboxSettings = $('\
    <div class="tb-window-content-toolbox">\
    <p>\
        Import/export toolbox settings to a wiki page:<br>\
        <input type="text" name="settingssub" placeholder="Fill in a private subreddit where you are mod..." value="' + TBUtils.htmlEncode(unescape(settingSub)) + '">\
        <input class="tb-settings-import" type="button" value="import">\
        <input class="tb-settings-export" type="button" value="export">\
        <b> Important:</b> This will reload the page without saving!\
    </p>\
    <p>\
        <label><input type="checkbox" id="compactHide" ' + ((compactHide) ? "checked" : "") + '> Use compact mode for mod bar </label>\
    </p>\
    <p>\
        <label><input type="checkbox" id="debugMode" ' + ((debugMode) ? "checked" : "") + '> Enable debug mode</label>\
    </p>\
    <p '+ ((debugMode) ? '' : 'style="display:none;"') +'>\
        <label><input type="checkbox" id="browserConsole" ' + ((browserConsole) ? "checked" : "") + '> Use browser\'s console</label>\
    </p>\
    <p>\
        <label><input type="checkbox" id="betaMode" ' + ((betaMode) ? "checked" : "") + '> Enable beta features</label>\
    </p>\
    <p>\
        <label><input type="checkbox" id="enableTopLink" ' + ((enableTopLink) ? "checked" : "") + '> Show top link in modbar</label>\
    </p>\
    <p>\
        <label><input type="checkbox" id="unmoderatedOn" ' + ((unmoderatedOn) ? "checked" : "") + '> Show icon for unmoderated</label>\
    </p>\
        Cache subreddit config (removal reasons, domain tags, mod macros) time (in minutes):<br>\
        <input type="text" name="longLength" value="' + longLength + '">\
    </p>\
    <p>\
        Cache subreddit user notes time (in minutes):<br>\
        <input type="text" name="shortLength" value="' + shortLength + '">\
    </p>\
    <p>\
        <label><input type="checkbox" id="clearcache"> Clear cache on save. (NB: please close all other open reddit tabs before click clearing cache.)</label>\
    </p>\
    <div class="tb-help-main-content">Edit Toolbox general settings</div>\
    </div>\
    ');

        // add them to the dialog
        $toolboxSettings.appendTo('.tb-window-content');
        $('<a href="javascript:;" class="tb-window-content-toolbox" data-module="toolbox">Toolbox Settings</a>').addClass('active').appendTo('.tb-window-tabs');
        $('.tb-help-main').attr('currentpage', 'toolbox');

        // Settings to toggle the modules
        var htmlmodules = '\
    <div class="tb-window-content-modules">\
    <div class="tb-help-main-content">Here you can enable/disable Toolbox modules.</div>\
    </div>\
    ';
        $(htmlmodules).appendTo('.tb-window-content').hide();
        $('<a href="javascript:;" class="tb-window-content-modules" data-module="modules">Toggle Modules</a>').appendTo('.tb-window-tabs');


        // Edit shortcuts
        var htmlshorcuts = '\
<div class="tb-window-content-shortcuts">\
<table class="tb-window-content-shortcuts-table"><tr><td>name</td><td> url </td><td class="tb-window-content-shortcuts-td-remove"> remove</td></tr>\
</table>\
<a class="tb-add-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconAdd + '" /></a>\
<div class="tb-help-main-content">Add or remove shortcuts here!</div>\
</div>\
    ';
        $(htmlshorcuts).appendTo('.tb-window-content').hide();

        if ($.isEmptyObject(shortcuts)) {
            $('<tr class="tb-window-content-shortcuts-tr"><td><input type="text" name="name"> </td><td> <input type="text" name="url">  <td><td class="tb-window-content-shortcuts-td-remove"> \
<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconDelete + '" /></a></td></tr>\
').appendTo('.tb-window-content-shortcuts-table');

        } else {
            $.each(shortcuts, function (index, value) {
                shortcutinput = '<tr class="tb-window-content-shortcuts-tr"><td><input type="text" value="' + TBUtils.htmlEncode(unescape(index)) + '" name="name"> </td><td> <input type="text" value="' + TBUtils.htmlEncode(unescape(value)) + '" name="url"> <td><td class="tb-window-content-shortcuts-td-remove">\
<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconDelete + '" /></a></td></tr>\
<br><br>';
                //console.log(shortcutinput);
                $(shortcutinput).appendTo('.tb-window-content-shortcuts-table');
            });
        }

        $('<a href="javascript:;" class="tb-window-content-shortcuts" data-module="shortcuts">Shortcuts</a>').appendTo('.tb-window-tabs');

        // About page
        var htmlabout = '\
<div class="tb-window-content-about">\
<h3>About:</h3>	<a href="/r/toolbox" target="_blank">/r/toolbox v' + TBUtils.toolboxVersion + ': "' + TBUtils.releaseName + '"</a> <br>\
    made and maintained by: <a href="/user/creesch/">/u/creesch</a>, <a href="/user/agentlame">/u/agentlame</a>, <a href="/user/LowSociety">/u/LowSociety</a>,\
    <a href="/user/TheEnigmaBlade">/u/TheEnigmaBlade</a>, <a href="/user/dakta">/u/dakta</a>, <a href="/user/largenocream">/u/largenocream</a> and <a href="/user/noeatnosleep">/u/noeatnosleep</a><br><br>\
    "<i>'  + randomQuote + '</i>"<br><br>\
<h3>Documentation by:</h3>\
  <a href="/user/psdtwk">/u/psdtwk</a><br><br>\
<!--h3>Special thanks to:</h3>\
  <a href="/user/largenocream">/u/largenocream</a> - Usernotes ver 3 schema and converter<br><br-->\
<h3>Credits:</h3>\
<a href="http://www.famfamfam.com/lab/icons/silk/" target="_blank">Silk icon set by Mark James</a><br>\
<a href="http://p.yusukekamiyamane.com/" target="_blank">Diagona icon set by Yusuke Kamiyamane</a><br>\
<a href="http://momentumdesignlab.com/" target="_blank">Momentum Matte icons</a><br>\
<a href="/user/DEADB33F" target="_blank">Modtools and realtime base code by DEADB33F</a><br>\
<a href="https://chrome.google.com/webstore/detail/reddit-mod-nuke-extension/omndholfgmbafjdodldjlekckdneggll?hl=en" target="_blank">Comment Thread Nuke Script</a> by <a href="/u/djimbob" target="_blank">/u/djimbob</a><br>\
<a href="https://github.com/gamefreak/snuownd" target="_blank">snuownd.js by gamefreak</a><br>\
<a href="http://ace.c9.io/" target="_blank">Ace embeddable code editor</a><br><br>\
<h3>License:</h3>\
<span>Copyright 2014 Toolbox development team. </span>\
<p>Licensed under the Apache License, Version 2.0 (the "License"); <br>\
you may not use this file except in compliance with the License. <br>\
You may obtain a copy of the License at </p>\
<p><a href="http://www.apache.org/licenses/LICENSE-2.0">http://www.apache.org/licenses/LICENSE-2.0</a></p>\
<p>Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.<br>\
See the License for the specific language governing permissions and limitations under the License.</p>\
<p '+ ((debugMode && !TB.utils.devModeLock) ? '' : 'style="display:none;"') +'>\
    <label><input type="checkbox" id="devMode" ' + ((devMode) ? "checked" : "") + '> DEVMODE: DON\'T EVER ENABLE THIS!</label>\
</p>\
<div class="tb-help-main-content">This is a about page!</div>\
</div>';

        $(htmlabout).appendTo('.tb-window-content').hide();
        $('<a href="javascript:;" class="tb-window-content-about" data-module="about">About</a>').appendTo('.tb-window-tabs');

        //	$("input[name=shortcuts]").val(unescape(shortcuts));
    }

    $body.on('click', '.tb-settings-import, .tb-settings-export', function (e) {
        var sub = $("input[name=settingssub]").val();
        if (!sub) return;

        // Just to be safe.
        sub = TB.utils.cleanSubredditName(sub);

        // Save the sub, first.
        TB.storage.setSetting('Utils', 'settingSub', sub);

        if ($(e.target).hasClass('tb-settings-import')) {
            TBUtils.importSettings(sub, function () {
                TBUtils.clearCache();
                window.location.reload();
            });
        }
        else {
            TBUtils.exportSettings(sub, function () {
                TBUtils.clearCache();
                window.location.reload();
            });
        }
    });

    // Open the settings
    $body.on('click', '.tb-toolbarsettings', function () {
        TB.utils.getModSubs(function(){
            showSettings();
            TB.injectSettings();
        });
    });

    // change tabs
    $body.on('click', '.tb-window-tabs a:not(.active)', function () {
        var tab = $(this).attr('data-module'),
            $tb_help_mains = $('.tb-help-main');

        $('.tb-window-tabs a').removeClass('active');
        $(this).addClass('active');

        $tb_help_mains.attr('currentpage', tab);
        // if we have module name, give that to the help button
        if ($(this).data('module')) {
            $tb_help_mains.data('module', $(this).data('module'));
        }
        $('.tb-window-content').children().hide();
        $('div.tb-window-content-' + tab).show();
    });

    // remove a shortcut
    $body.on('click', '.tb-remove-shortcuts', function () {
        $(this).closest('.tb-window-content-shortcuts-tr').remove();
    });

    // add a shortcut
    $body.on('click', '.tb-add-shortcuts', function () {
        $('<tr class="tb-window-content-shortcuts-tr"><td><input type="text" name="name"> </td><td> <input type="text" name="url">  <td><td class="tb-window-content-shortcuts-td-remove"> \
<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconDelete + '" /></a></td></tr>\
').appendTo('.tb-window-content-shortcuts-table');
    });

    // Save the settings
    $body.on('click', '.tb-save', function () {

        // TODO: Check if the settings below work as intended.
        modbar.setting('compactHide', $("#compactHide").prop('checked'));
        modbar.setting('enableTopLink', $("#enableTopLink").prop('checked'));
        modbar.setting('unmoderatedOn', $("#unmoderatedOn").prop('checked'));

        TB.storage.setSetting('Utils', 'debugMode', $("#debugMode").prop('checked'));
        TB.storage.setSetting('Utils', 'betaMode', $("#betaMode").prop('checked'));
        TB.storage.setSetting('Utils', 'devMode', $("#devMode").prop('checked'));

        TB.storage.setSetting('Utils', 'skipLocalConsole', $("#browserConsole").prop('checked'));


        // Save shortcuts
        var $shortcuts = $('.tb-window-content-shortcuts-tr');
        if ($shortcuts.length === 0) {
            modbar.setting('shortcuts', {}); // no JSON setting type.
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

            modbar.setting('shortcuts', shortcuts);
        }

        // save cache settings.
        TB.storage.setSetting('Utils', 'longLength', $("input[name=longLength]").val());
        TB.storage.setSetting('Utils', 'shortLength', $("input[name=shortLength]").val());

        if ($("#clearcache").prop('checked')) {
            TBUtils.clearCache();
        }

        $('.tb-settings').remove();
        $body.css('overflow', 'auto');

        TB.storage.verifiedSettingsSave(function(succ){
            if (succ){
                TB.ui.textFeedback("Settings saved and verified", TB.ui.FEEDBACK_POSITIVE);
                setTimeout(function () {
                    if (!devMode) window.location.reload();
                }, 1000);
            } else{
                TB.ui.textFeedback("Save could not be verified", TB.ui.FEEDBACK_NEGATIVE);
            }
        });
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
TB.register_module(modbar);
}

(function() {
    // wait for storage
    window.addEventListener("TBUtilsLoaded", function () {
        tbmodbar();
    });
})();
