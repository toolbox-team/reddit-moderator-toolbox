function notifier() {
if (!TBUtils.logged || TBUtils.isToolbarPage)
    return;
$.log('Loading Notifier Module');

var $body = $('body');
$body.addClass('mod-toolbox');

//
// preload some generic variables
//
var checkInterval = TB.storage.getSetting('Notifier', 'checkinterval', 1 * 60 * 1000), //default to check every minute for new stuff.
    modNotifications = TB.storage.getSetting('Notifier', 'modnotifications', true),  // these need to be converted to booleans.
    messageNotifications = TB.storage.getSetting('Notifier', 'messagenotifications', true), // these need to be converted to booleans.
    modmailNotifications = TB.storage.getSetting('Notifier', 'modmailnotifications', true),
    unmoderatedNotifications = TB.storage.getSetting('Notifier', 'unmoderatednotifications', false),
    modSubreddits = TB.storage.getSetting('Notifier', 'modsubreddits', 'mod'),
    unmoderatedSubreddits = TB.storage.getSetting('Notifier', 'unmoderatedsubreddits', 'mod'),
    modmailSubreddits = TB.storage.getSetting('Notifier', 'modmailsubreddits', 'mod'),
    modmailSubredditsFromPro = TB.storage.getSetting('Notifier', 'modmailsubredditsfrompro', false),
    modmailFilteredSubreddits = modmailSubreddits,
    notifierEnabled = TB.storage.getSetting('Notifier', 'enabled', true),
    shortcuts = TB.storage.getSetting('Notifier', 'shortcuts', '-'),
    shortcuts2 = TB.storage.getSetting('Notifier', 'shortcuts2', {}),
    modbarHidden = TB.storage.getSetting('Notifier', 'modbarhidden', false),
    compactHide = TB.storage.getSetting('Notifier', 'compacthide', false),
    unmoderatedOn = TB.storage.getSetting('Notifier', 'unmoderatedon', true),
    consolidatedMessages = TB.storage.getSetting('Notifier', 'consolidatedmessages', true),
    footer = $('.footer-parent'),
    unreadMessageCount = TB.storage.getSetting('Notifier', 'unreadmessagecount', 0),
    modqueueCount = TB.storage.getSetting('Notifier', 'modqueuecount', 0),
    unmoderatedCount = TB.storage.getSetting('Notifier', 'unmoderatedcount', 0),
    modmailCount = TB.storage.getSetting('Notifier', 'modmailcount', 0),
    straightToInbox = TB.storage.getSetting('Notifier', 'straightToInbox', false),
    debugMode = TBUtils.debugMode,
    betaMode = TBUtils.betaMode,
    consoleShowing = TB.storage.getSetting('Notifier', 'consoleshowing', false),
    lockscroll = TB.storage.getSetting('Notifier', 'lockscroll', false),
    newLoad = true,
    now = new Date().getTime(),
    messageunreadlink = TB.storage.getSetting('Notifier', 'messageunreadlink', false),
    modmailunreadlink = TB.storage.getSetting('Notifier', 'modmailunreadlink', false),
    settingSub = TB.storage.getSetting('Utils', 'settingsub', '');


// use filter subs from MMP, if appropriate
if (modmailSubredditsFromPro) {
    modmailFilteredSubreddits = 'mod';
    if (TB.storage.getSetting('ModMailPro', 'filteredsubs', []).length > 0) {
        modmailFilteredSubreddits += '-' + TB.storage.getSetting('ModMailPro', 'filteredsubs', []).join('-');
    }
}

// convert some settings values
// TODO: add a fixer in the first run function for next release and drop this section
if (modNotifications == 'on') {
    TB.storage.setSetting('Notifier', 'modnotifications', true);
    modNotifications = true;
} else if (modNotifications == 'off') {
    TB.storage.setSetting('Notifier', 'modnotifications', false);
    modNotifications = false;
}

if (messageNotifications == 'on') {
    TB.storage.setSetting('Notifier', 'messagenotifications', true);
    messageNotifications = true;
} else if (messageNotifications == 'off') {
    TB.storage.setSetting('Notifier', 'messagenotifications', true);
    messageNotifications = false;
}

if (messageunreadlink) {
    messageunreadurl = '/message/unread/';
} else {
    messageunreadurl = '/message/inbox/';
}

// this is a placeholder from issue #217
// TODO: provide an option for this once we fix modmailpro filtering
modmailunreadurl = '/message/moderator/'
if (modmailunreadlink) {
    // modmailunreadurl = '/r/' + modmailFilteredSubreddits + '/message/moderator/unread';
    modmailunreadurl += 'unread/';
} else {
    // modmailunreadurl = '/r/' + modmailFilteredSubreddits + '/message/moderator/';
}

// cache settings.
var shortLength = TB.storage.getCache('Core', 'shortlength', 15),
    longLength = TB.storage.getCache('Core', 'longlength', 45);


//
// UI elements
//
// style="display: none;"
// toolbar, this will display all counters, quick links and other settings for the toolbox
var modbar = $('\
<div id="tb-bottombar" class="tb-toolbar">\
    <a class="tb-bottombar-hide" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconHide + '" /></a>&nbsp;&nbsp;\
    <a class="tb-toolbar tb-toolbarsettings" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconWrench + '" title="toolbox settings"/></a>\
    <span><label class="tb-first-run">&#060;-- Click for settings &nbsp;&nbsp;&nbsp;</label><span>\
    <span id="tb-toolbarshortcuts"></span>\
    <span id="tb-toolbarcounters">\
        <a title="no mail" href="/message/inbox/" class="nohavemail" id="tb-mail"></a> \
        <a href="/message/inbox/" class="tb-toolbar" id="tb-mailCount"></a>\
        <!-- <a title="modmail" href="/r/' + modmailFilteredSubreddits + '/message/moderator/" id="tb-modmail" class="nohavemail"></a> -->\
        <!-- <a href="/r/' + modmailFilteredSubreddits + '/message/moderator/" class="tb-toolbar" id="tb-modmailcount"></a> -->\
        <a title="modmail" href="/message/moderator/" id="tb-modmail" class="nohavemail"></a>\
        <a href="/message/moderator/" class="tb-toolbar" id="tb-modmailcount"></a>\
        <a title="modqueue" href="/r/' + modSubreddits + '/about/modqueue" id="tb-modqueue"></a> \
        <a href="/r/' + modSubreddits + '/about/modqueue" class="tb-toolbar" id="tb-queueCount"></a>\
    </span>\
</div>\
    ');

var modbarhid = $('\
<div id="tb-bottombar-hidden" class="tb-toolbar">\
   <a class="tb-bottombar-unhide" href="javascript:void(0)"><img id="tb-bottombar-image" src="data:image/png;base64,' + ((compactHide) ? TBui.iconGripper : TBui.iconShow) + '" /></a>\
</div>');

var $console = $('\
<div class="tb-debug-window">\
        <div class="tb-debug-header"> Debug Console <span class="tb-debug-header-options"><a class="tb-close" id="tb-debug-hide" href="javascript:;">✕</a></span></div>\
        <div class="tb-debug-content">\
            <textarea class="tb-debug-console" rows="20" cols="20"></textarea>\
            <input type="text" class="tb-debug-input" placeholder="eval() in Toolbox scope" />\
        </div>\
        <div class="tb-debug-footer" comment="for the looks">\
            <label><input type="checkbox" id="tb-console-lockscroll" ' + ((lockscroll) ? "checked" : "") + '> lock scroll to bottom</label>\
            <!--input class="tb-console-copy" type="button" value="copy text"-->\
            <input class="tb-console-clear" type="button" value="clear console">\
        </div>\
</div>\
    ');

$console.appendTo('body').hide();

$body.append(modbar);

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

    if (consoleShowing) {
        $console.show();
    }

}

// Append shortcuts
$.each(shortcuts2, function (index, value) {
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
        $(modbar).hide();
        $(modbarhid).show();
        $console.hide(); // hide the console, but don't change consoleShowing.
    } else {
        $(modbar).show();
        $(modbarhid).hide();
        if (consoleShowing) $console.show();
    }
    TB.storage.setSetting('Notifier', 'modbarhidden', hidden);
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
        .mouseenter(function () {
            $('#tb-bottombar-image').show();
        })
        .mouseleave(function () {
            $('#tb-bottombar-image').hide();
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
    TB.storage.setSetting('Notifier', 'consoleshowing', consoleShowing);
});

// Set console scroll
$body.on('click', '#tb-console-lockscroll', function () {
    lockscroll = !lockscroll;
    TB.storage.setSetting('Notifier', 'lockscroll', lockscroll);
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
        $.log(eval($(this).val()));
        $(this).val(''); // clear line
    }
});
/// End console stuff


// Settings menu
function showSettings() {

    // I probably should have stored "checked" instead of "on" will have to change that later.
    var modnotificationschecked, messagenotificationschecked, messageunreadlinkchecked, consolidatedmessageschecked, modmailnotificationschecked, modmailunreadlinkchecked, unmoderatedonchecked, unmoderatednotificationschecked;

    if (messageunreadlink) {
        messageunreadlinkchecked = 'checked';
    }
    if (modmailunreadlink) {
        modmailunreadlinkchecked = 'checked';
    }
    if (modNotifications) {
        modnotificationschecked = 'checked';
    }
    if (messageNotifications) {
        messagenotificationschecked = 'checked';
    }
    if (modmailNotifications) {
        modmailnotificationschecked = 'checked';
    }
    if (unmoderatedOn) {
        unmoderatedonchecked = 'checked';
    }
    if (unmoderatedNotifications) {
        unmoderatednotificationschecked = 'checked';
    }
    if (consolidatedMessages) {
        consolidatedmessageschecked = 'checked';
    }

    // The window in which all settings will be showed.
    var html = '\
        <div class="tb-page-overlay tb-settings tb-personal-settings"><div class="tb-window-wrapper">\
            <div class="tb-window-header">\
                Toolbox Settings\
                <span class="tb-window-header-options"><a class="tb-help-main" href="javascript:;" currentpage="" title="Help">?</a> - <a class="tb-close" title="Close Settings" href="javascript:;">✕</a></span>\
            </div>\
            <div class="tb-window-tabs"></div>\
            <div class="tb-window-content"></div>\
            <div class="tb-window-footer" comment="for the looks"><input class="tb-save" type="button" value="save"></div>\
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
        <p>\
            <label><input type="checkbox" id="betaMode" ' + ((betaMode) ? "checked" : "") + '> Enable beta features</label>\
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
    // // we really shouldn't set these inline.
    // $toolboxSettings.find('input[name=modmailsubreddits]').prop('disabled', modmailSubredditsFromPro);

    // add them to the dialog
    $toolboxSettings.appendTo('.tb-window-content');
    $('<a href="javascript:;" class="tb-window-content-toolbox">Toolbox Settings</a>').addClass('active').appendTo('.tb-window-tabs');
    $('.tb-help-main').attr('currentpage', 'tb-window-content-toolbox');

    // Settings to toggle the modules
    var htmlmodules = '\
        <div class="tb-window-content-modules">\
        </p>\
        <div class="tb-help-main-content">Here you can enable/disable Toolbox modules.</div>\
        </div>\
        ';
    $(htmlmodules).appendTo('.tb-window-content').hide();
    $('<a href="javascript:;" class="tb-window-content-modules">Toggle Modules</a>').appendTo('.tb-window-tabs');


    var $notifierSettings = $('<div class="tb-window-content-notifier">\
        <p>\
            Multireddit of subs you want displayed in the modqueue counter:<br>\
            <input type="text" name="modsubreddits" value="' + TBUtils.htmlEncode(unescape(modSubreddits)) + '">\
        </p>\
        <p>\
            Multireddit of subs you want displayed in the unmoderated counter:<br>\
            <input type="text" name="unmoderatedsubreddits" value="' + TBUtils.htmlEncode(unescape(unmoderatedSubreddits)) + '">\
        </p>\
        <p>\
            Multireddit of subs you want displayed in the modmail counter:<br>\
            <input type="text" name="modmailsubreddits" value="' + TBUtils.htmlEncode(unescape(modmailSubreddits)) + '"' + ((modmailSubredditsFromPro) ? " disabled" : "") + '><br/>\
            <label><input type="checkbox" name="modmailsubredditsfrompro"' + ((modmailSubredditsFromPro) ? " checked" : "") + '> Use filtered subreddits from ModMail Pro (overrides the list above)</label>\
        </p>\
        <p>\
            <label><input type="checkbox" name="unmoderatedon" ' + unmoderatedonchecked + '> Show icon for unmoderated.</label>\
        </p>\
        <p>\
            <label><input type="checkbox" name="consolidatedmessages" ' + consolidatedmessageschecked + '> Consolidate notifications (x new messages) instead of individual notifications.</label>\
        </p>\
        <p>\
            <label style="width: 30%; display: inline-block;"><input type="checkbox" name="messagenotifications" ' + messagenotificationschecked + '> Get notifications for new messages</label>\
            <label><input type="checkbox" name="messageunreadlink" ' + messageunreadlinkchecked + '> Link to /message/unread/ if unread messages are present</label>\
        </p>\
        <p>\
            <label style="width: 30%; display: inline-block;"><input type="checkbox" name="modmailnotifications" ' + modmailnotificationschecked + '> Get modmail notifications</label>\
            <!-- <label><input type="checkbox" name="modmailunreadlink" ' + modmailunreadlinkchecked + '> Link to /r/' + modmailFilteredSubreddits + '/message/moderator/unread/ if unread messages are present</label> -->\
            <label><input type="checkbox" name="modmailunreadlink" ' + modmailunreadlinkchecked + '> Link to /message/moderator/unread/ if unread messages are present</label>\
        </p>\
        <p>\
        <label><input type="checkbox" id="straightToInbox" ' + ((straightToInbox) ? "checked" : "") + '> When clicking a comment notification go to the inbox.</label>\
        </p>\
        <p>\
            <label><input type="checkbox" name="modnotifications" ' + modnotificationschecked + '> Get modqueue notifications</label>\
        </p>\
        <p>\
            <label><input type="checkbox" name="unmoderatednotifications" ' + unmoderatednotificationschecked + '> Get unmoderated queue notifications</label>\
        </p>\
        <div class="tb-help-main-content">Edit notifier settings</div>\
    </div>').hide();

    // get the checkbox change handler
    $notifierSettings.find('input[name=modmailsubredditsfrompro]').change(function () {
        $('input[name=modmailsubreddits]').prop('disabled', this.checked);
    });

    // Add notifier settings to dialog
    $notifierSettings.appendTo('.tb-window-content');
    $('<a href="javascript:;" class="tb-window-content-notifier">Notifier</a>').appendTo('.tb-window-tabs');


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

    if ($.isEmptyObject(shortcuts2)) {
        $('<tr class="tb-window-content-shortcuts-tr"><td><input type="text" name="name"> </td><td> <input type="text" name="url">  <td><td class="tb-window-content-shortcuts-td-remove"> \
    <a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconClose + '" /></a></td></tr>\
    ').appendTo('.tb-window-content-shortcuts-table');

    } else {
        $.each(shortcuts2, function (index, value) {
            shortcutinput = '<tr class="tb-window-content-shortcuts-tr"><td><input type="text" value="' + TBUtils.htmlEncode(unescape(index)) + '" name="name"> </td><td> <input type="text" value="' + TBUtils.htmlEncode(unescape(value)) + '" name="url"> <td><td class="tb-window-content-shortcuts-td-remove">\
    <a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconClose + '" /></a></td></tr>\
    <br><br>';
            //console.log(shortcutinput);
            $(shortcutinput).appendTo('.tb-window-content-shortcuts-table');
        });
    }

    $('<a href="javascript:;" class="tb-window-content-shortcuts">Shortcuts</a>').appendTo('.tb-window-tabs');

    // About page
    var htmlabout = '\
    <div class="tb-window-content-about">\
    <h3>About:</h3>	<a href="/r/toolbox" target="_blank">/r/toolbox v' + TBUtils.toolboxVersion + ': "' + TBUtils.releaseName + '"</a> <br>\
        made and maintained by: <a href="/user/creesch/">/u/creesch</a>, <a href="/user/agentlame">/u/agentlame</a>, <a href="/user/LowSociety">/u/LowSociety</a>,\
        <a href="/user/TheEnigmaBlade">/u/TheEnigmaBlade</a>, <a href="/user/dakta">/u/dakta</a> and <a href="/user/largenocream">/u/largenocream</a> <br><br>\
    <h3>Documentation by:</h3>\
      <a href="/user/psdtwk">/u/psdtwk</a><br><br>\
    <!--h3>Special thanks to:</h3>\
      <a href="/user/largenocream">/u/largenocream</a> - Usernotes ver 3 schema and converter<br><br-->\
    <h3>Credits:</h3>\
    <a href="http://www.famfamfam.com/lab/icons/silk/" target="_blank">Silk icon set by Mark James</a><br>\
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
    <div class="tb-help-main-content">This is a about page!</div>\
    </div>';

    $(htmlabout).appendTo('.tb-window-content').hide();
    $('<a href="javascript:;" class="tb-window-content-about">About</a>').appendTo('.tb-window-tabs');

    //	$("input[name=shortcuts]").val(unescape(shortcuts));
}

$body.on('click', '.tb-settings-import, .tb-settings-export', function (e) {
    var sub = $("input[name=settingssub]").val();
    if (!sub) return;

    // Just to be safe.
    sub = sub.replace('/r/', '').replace('/', '');

    // Save the sub, firest.
    TB.storage.setSetting('Utils', 'settingsub', sub);

    if ($(e.target).hasClass('tb-settings-import')) {
        TBUtils.importSettings(sub, function () {
            window.location.reload();
        });
    }
    else {
        TBUtils.exportSettings(sub, function () {
            window.location.reload();
        });
    }
});

// Open the settings
$body.on('click', '.tb-toolbarsettings', function () {
    showSettings();
    TB.injectSettings();
});

// change tabs
$body.on('click', '.tb-window-tabs a:not(.active)', function () {
    var tab = $(this).attr('class'),
        $tb_help_mains = $('.tb-help-main');

    $('.tb-window-tabs a').removeClass('active');
    $(this).addClass('active');

    $tb_help_mains.attr('currentpage', tab);
    // if we have module name, give that to the help button
    if ($(this).data('module')) {
        $tb_help_mains.data('module', $(this).data('module'));
    }
    $('.tb-window-content').children().hide();
    $('div.' + tab).show();
});

// remove a shortcut
$body.on('click', '.tb-remove-shortcuts', function () {
    $(this).closest('.tb-window-content-shortcuts-tr').remove();
});

// add a shortcut
$body.on('click', '.tb-add-shortcuts', function () {
    $('<tr class="tb-window-content-shortcuts-tr"><td><input type="text" name="name"> </td><td> <input type="text" name="url">  <td><td class="tb-window-content-shortcuts-td-remove"> \
    <a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconClose + '" /></a></td></tr>\
    ').appendTo('.tb-window-content-shortcuts-table');
});

// Save the settings
$body.on('click', '.tb-save', function () {
    var messagenotificationssave = $("input[name=messagenotifications]").is(':checked');
    if (messagenotificationssave === true) {
        TB.storage.setSetting('Notifier', 'messagenotifications', true);
    } else {
        TB.storage.setSetting('Notifier', 'messagenotifications', false);
    }

    var modnotificationscheckedsave = $("input[name=modnotifications]").is(':checked');
    if (modnotificationscheckedsave === true) {
        TB.storage.setSetting('Notifier', 'modnotifications', true);
    } else {
        TB.storage.setSetting('Notifier', 'modnotifications', false);
    }

    modmailnotificationscheckedsaved = $("input[name=modmailnotifications]").is(':checked');
    TB.storage.setSetting('Notifier', 'modmailnotifications', modmailnotificationscheckedsaved);

    unmoderatednotificationscheckedsaved = $("input[name=unmoderatednotifications]").is(':checked');
    TB.storage.setSetting('Notifier', 'unmoderatednotifications', unmoderatednotificationscheckedsaved);

    unmoderatedoncheckedsave = $("input[name=unmoderatedon]").is(':checked');
    TB.storage.setSetting('Notifier', 'unmoderatedon', unmoderatedoncheckedsave);

    consolidatedmessagescheckedsave = $("input[name=consolidatedmessages]").is(':checked');
    TB.storage.setSetting('Notifier', 'consolidatedmessages', consolidatedmessagescheckedsave);

    messageunreadlinkcheckedsave = $("input[name=messageunreadlink]").is(':checked');
    TB.storage.setSetting('Notifier', 'messageunreadlink', messageunreadlinkcheckedsave),

        modmailunreadlinkcheckedsave = $("input[name=modmailunreadlink]").is(':checked');
    TB.storage.setSetting('Notifier', 'modmailunreadlink', modmailunreadlinkcheckedsave);

    shortcuts = escape($("input[name=shortcuts]").val());
    TB.storage.setSetting('Notifier', 'shortcuts', shortcuts);

    modSubreddits = $("input[name=modsubreddits]").val();
    TB.storage.setSetting('Notifier', 'modsubreddits', modSubreddits);

    highlighted = $("input[name=highlighted]").val();

    TB.storage.setSetting('Notifier', 'straightToInbox', $("#straightToInbox").prop('checked'));

    unmoderatedSubreddits = $("input[name=unmoderatedsubreddits]").val();
    if (unmoderatedSubreddits !== TB.storage.getSetting('Notifier', 'unmoderatedsubreddits', '')) {
        TB.storage.setSetting('Notifier', 'unmoderatedcount', 0);
        TB.storage.setSetting('Notifier', 'lastseenunmoderated', -1);
    }
    TB.storage.setSetting('Notifier', 'unmoderatedsubreddits', unmoderatedSubreddits);

    // pull filtered subreddits from MMP?
    modmailSubredditsFromPro = $("input[name=modmailsubredditsfrompro]")[0].checked; // $()[0].checked is a million times faster than other methods
    TB.storage.setSetting('Notifier', 'modmailsubredditsfrompro', modmailSubredditsFromPro);

    modmailSubreddits = $("input[name=modmailsubreddits]").val();
    modmailFilteredSubreddits = modmailSubreddits;

    if (modmailSubredditsFromPro) {
        // use MMP's filtered subs
        // we don't want to overwrite the user's regular settings, just bypass them,
        // so don't actually save modmailSubreddits if they are using filtered subs from MMP

        modmailFilteredSubreddits = 'mod';
        if (TB.storage.getSetting('ModMailPro', 'filteredsubs', []).length > 0) {
            modmailFilteredSubreddits += '-' + TB.storage.getSetting('ModMailPro', 'filteredsubs', []).join('-');
        }
    } else {
        // save manually set filtered subs
        if (modmailSubreddits !== TB.storage.getSetting('Notifier', 'modmailsubreddits', '')) {
            TB.storage.setSetting('Notifier', 'modmailcount', 0);
            TB.storage.setSetting('Notifier', 'lastseenmodmail', -1);
        }
        TB.storage.setSetting('Notifier', 'modmailsubreddits', modmailSubreddits);
    }

    TB.storage.setSetting('Notifier', 'compacthide', $("#compactHide").prop('checked'));

    TB.storage.setSetting('Utils', 'debugMode', $("#debugMode").prop('checked'));
    TB.storage.setSetting('Utils', 'betaMode', $("#betaMode").prop('checked'));

    // Save shortcuts
    var $shortcuts = $('.tb-window-content-shortcuts-tr');
    if ($shortcuts.length === 0) {
        TB.storage.setSetting('Notifier', 'shortcuts2', {});
    } else {
        shortcuts2 = {};

        $shortcuts.each(function () {
            var $this = $(this),
                name = $this.find('input[name=name]').val(),
                url = $this.find('input[name=url]').val();

            if (name.trim() !== '' || url.trim() !== '') {
                shortcuts2[escape(name)] = escape(url);
            }
        });

        TB.storage.setSetting('Notifier', 'shortcuts2', shortcuts2);
    }

    // Save which modules are enabled.
    TB.storage.setSetting('Notifier', 'enabled', $("#notifierEnabled").prop('checked'));

    // save cache settings.
    TB.storage.setCache('Core', 'longlength', $("input[name=longLength]").val());
    TB.storage.setCache('Core', 'shortlength', $("input[name=shortLength]").val());

    if ($("#clearcache").prop('checked')) {
        TBUtils.clearCache();
    }


    $('.tb-settings').remove();
    $body.css('overflow', 'auto');
    window.location.reload();
});


$body.on('click', '.tb-help-main', function () {
    var $this = $(this),
        tab = $(this).attr('currentpage'),
        module = $this.data('module');

    $tab = $('.' + tab);

    var helpwindow = window.open('', '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');

    if (module) {
        // we do fancy stuff here
        var htmlcontent = 'Loading...';

        // We should use this, eventually...
        TBUtils.readFromWiki('toolbox', 'livedocs/' + module, false, function (result) {
            var parser = SnuOwnd.getParser(SnuOwnd.getRedditRenderer(SnuOwnd.DEFAULT_BODY_FLAGS | SnuOwnd.HTML_ALLOW_ELEMENT_WHITELIST));

            var html = '\
                <!DOCTYPE html>\
                <html>\
                <head>\
                <style>\
                body {\
                font: normal x-small verdana,arial,helvetica,sans-serif;\
                }\
                </style>\
                </head>\
                <body>\
                <div class="help-content" id="help-content">' + parser.render(result) + '</div>\
                </body>\
                </html>\
            ';
            helpwindow.document.write(html);
            helpwindow.focus();

        });
    } else {
        var htmlcontent = $tab.find('.tb-help-main-content').html();
        var html = '\
            <!DOCTYPE html>\
            <html>\
            <head>\
            <style>\
            body {\
            font: normal x-small verdana,arial,helvetica,sans-serif;\
            }\
            </style>\
            </head>\
            <body>\
            <div class="help-content" id="help-content">' + htmlcontent + '</div>\
            </body>\
            </html>\
        ';
        helpwindow.document.write(html);
        helpwindow.focus();
    }


});

// Close the Settings menu
$body.on('click', '.tb-close', function () {
    $('.tb-settings').remove();
    $body.css('overflow', 'auto');
});
}

(function() {
    // wait for storage
    window.addEventListener("TBUtilsLoaded", function () {
        notifier();
    });
})();