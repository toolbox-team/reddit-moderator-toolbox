(function notifier() {
    if (!TBUtils.logged || TBUtils.isToolbarPage) return;
    $.log('Loading Notifier Module');

    $('body').addClass('mod-toolbox');
    //
    // preload some generic variables
    //
    var checkInterval = TBUtils.getSetting('Notifier', 'checkinterval', 1 * 60 * 1000), //default to check every minute for new stuff.
        // modNotifications = localStorage['Toolbox.Notifier.modnotifications'] || 'on',  // these need to be converted to booleans.
        modNotifications = TBUtils.getSetting('Notifier', 'modnotifications', true),  // these need to be converted to booleans.
        // messageNotifications = localStorage['Toolbox.Notifier.messagenotifications'] || 'on', // these need to be converted to booleans.
        messageNotifications = TBUtils.getSetting('Notifier', 'messagenotifications', true), // these need to be converted to booleans.
        modmailNotifications = TBUtils.getSetting('Notifier', 'modmailnotifications', true),
        unmoderatedNotifications = TBUtils.getSetting('Notifier', 'unmoderatednotifications', false),
        modSubreddits = TBUtils.getSetting('Notifier', 'modsubreddits', 'mod'),
        unmoderatedSubreddits = TBUtils.getSetting('Notifier', 'unmoderatedsubreddits', 'mod'),
        modmailSubreddits = TBUtils.getSetting('Notifier', 'modmailsubreddits', 'mod'),
        notifierEnabled = TBUtils.getSetting('Notifier', 'enabled', true),
        shortcuts = TBUtils.getSetting('Notifier', 'shortcuts', '-'),
        shortcuts2 = TBUtils.getSetting('Notifier', 'shortcuts2', {}),
        highlighted = TBUtils.getSetting('CommentsMod', 'highlighted', ''),
        modbarHidden = TBUtils.getSetting('Notifier', 'modbarhidden', false),
        compactHide = TBUtils.getSetting('Notifier', 'compacthide', false),
        hideRemoved = TBUtils.getSetting('CommentsMod', 'hideRemoved', false),
        unmoderatedOn = TBUtils.getSetting('Notifier', 'unmoderatedon', true),
        consolidatedMessages = TBUtils.getSetting('Notifier', 'consolidatedmessages', true),
        footer = $('.footer-parent'),
        unreadMessageCount = TBUtils.getSetting('Notifier', 'unreadmessagecount', 0),
        modqueueCount = TBUtils.getSetting('Notifier', 'modqueuecount', 0),
        unmoderatedCount = TBUtils.getSetting('Notifier', 'unmoderatedcount', 0),
        modmailCount = TBUtils.getSetting('Notifier', 'modmailcount', 0),
        straightToInbox = TBUtils.getSetting('Notifier', 'straightToInbox', false),
        debugMode = TBUtils.debugMode,
        betaMode = TBUtils.betaMode,
        consoleShowing = TBUtils.getSetting('Notifier', 'consoleshowing', false),
        lockscroll = TBUtils.getSetting('Notifier', 'lockscroll', false),
        newLoad = true,
        now = new Date().getTime(),
        messageunreadlink = TBUtils.getSetting('Notifier', 'messageunreadlink', false),
        modmailunreadlink = TBUtils.getSetting('Notifier', 'modmailunreadlink', false),
        approveComments = TBUtils.getSetting('CommentsMod', 'approvecomments', false),
        spamRemoved = TBUtils.getSetting('CommentsMod', 'spamremoved', false),
        hamSpammed = TBUtils.getSetting('CommentsMod', 'hamspammed', false),
        highlightTitles = TBUtils.getSetting('CommentsMod', 'highlightTitles', true),
        settingSub = TBUtils.getSetting('Utils', 'settingsub', '');


    // convert some settings values
    // TODO: add a fixer in the first run function for next release and drop this section
    if (modNotifications == 'on') {
        TBUtils.setSetting('Notifier', 'modnotifications', true);
        modNotifications = true;
    } else if (modNotifications == 'off') {
        TBUtils.setSetting('Notifier', 'modnotifications', false);
        modNotifications = false;
    }

    if (messageNotifications == 'on') {
        TBUtils.setSetting('Notifier', 'messagenotifications', true);
        messageNotifications = true;
    } else if (messageNotifications == 'off') {
        TBUtils.setSetting('Notifier', 'messagenotifications', true);
        messageNotifications = false;
    }

    if (messageunreadlink) {
        messageunreadurl = '/message/unread/';
    } else {
        messageunreadurl = '/message/inbox/';
    }
    if (modmailunreadlink) {
        modmailunreadurl = '/r/' + modmailSubreddits + '/about/message/moderator/unread/';
    } else {
        modmailunreadurl = '/r/' + modmailSubreddits + '/about/message/moderator/';
    }


    // Module settings.
    var mmpEnabled = TBUtils.getSetting('ModMailPro', 'enabled', true),
        rrEnabled = TBUtils.getSetting('RemovalReasons', 'enabled', true),
        qtEnabled = TBUtils.getSetting('QueueTools', 'enabled', true),
        notesEnabled = TBUtils.getSetting('UserNotes', 'enabled', true),
        dtagEnabled = TBUtils.getSetting('DomainTagger', 'enabled', false),
        configEnabled = TBUtils.getSetting('TBConfig', 'enabled', true),
        commentsEnabled = TBUtils.getSetting('CommentsMod', 'enabled', true),
        banlistEnabled = TBUtils.getSetting('BanList', 'enabled', true),
        syntaxHighlighterEnabled = TBUtils.getSetting('syntaxHighlighter', 'enabled', true),
        modmatrixEnabled = TBUtils.getSetting('ModMatrix', 'enabled', true);

    // Ban list settings.
    var banlistAutomatic = TBUtils.getSetting('BanList', 'automatic', false);

    // MTE settings.
    var hideactioneditems = TBUtils.getSetting('QueueTools', 'hideactioneditems', false),
        ignoreonapprove = TBUtils.getSetting('QueueTools', 'ignoreonapprove', false),
        removalreasons = TBUtils.getSetting('RemovalReasons', 'removalreasons', true),
        commentreasons = TBUtils.getSetting('RemovalReasons', 'commentreasons', false),
        rtscomment = TBUtils.getSetting('QueueTools', 'rtscomment', true),
        sortmodqueue = TBUtils.getSetting('QueueTools', 'sortmodqueue', false),
        sortunmoderated = TBUtils.getSetting('QueueTools', 'sortunmoderated', false),
        linkToQueues = TBUtils.getSetting('QueueTools', 'linktoqueues', false);

    // Syntax Highlight settings.
    var selectedTheme = TBUtils.getSetting('syntaxHighlighter', 'selectedTheme', 'monokai');

    // cache settings.
    var shortLength = TBUtils.getSetting('cache', 'shortlength', 15),
        longLength = TBUtils.getSetting('cache', 'longlength', 45);


    //
    // UI elements
    //
    // style="display: none;"
    // toolbar, this will display all counters, quick links and other settings for the toolbox
    var modbar = $('\
    <div id="tb-bottombar" class="tb-toolbar">\
        <a class="tb-bottombar-hide" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconHide + '" /></a>&nbsp;&nbsp;\
        <a class="tb-toolbar tb-toolbarsettings" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconBox + '" title="toolbox settings"/></a>\
        <span><label class="tb-first-run">&#060;-- Click for settings &nbsp;&nbsp;&nbsp;</label><span>\
        <span id="tb-toolbarshortcuts"></span>\
        <span id="tb-toolbarcounters">\
            <a title="no mail" href="http://www.reddit.com/message/inbox/" class="nohavemail" id="tb-mail"></a> \
            <a href="http://www.reddit.com/message/inbox/" class="tb-toolbar" id="tb-mailCount"></a>\
            <a title="modmail" href="http://www.reddit.com/r/' + modmailSubreddits + '/about/message/moderator/" id="tb-modmail" class="nohavemail"></a>\
            <a href="http://www.reddit.com/r/' + modmailSubreddits + '/about/message/moderator/" class="tb-toolbar" id="tb-modmailcount"></a>\
            <a title="modqueue" href="http://www.reddit.com/r/' + modSubreddits + '/about/modqueue" id="tb-modqueue"></a> \
            <a href="http://www.reddit.com/r/' + modSubreddits + '/about/modqueue" class="tb-toolbar" id="tb-queueCount"></a>\
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
            </div>\
            <div class="tb-debug-footer" comment="for the looks">\
                <label><input type="checkbox" id="tb-console-lockscroll" ' + ((lockscroll) ? "checked" : "") + '> lock scroll to bottom</label>\
                <!--input class="tb-console-copy" type="button" value="copy text"-->\
                <input class="tb-console-clear" type="button" value="clear console">\
            </div>\
    </div>\
        ');

    $console.appendTo('body').hide();

    $('body').append(modbar);
           
    if(TBUtils.betaMode) {    
        $('body').append('<div id="tb-my-subreddits" style="display: none;"><h1>Subreddits you moderate</h1><table></table>');
        $('body').find('#tb-toolbarshortcuts').before('<a href="javascript:void(0)" id="tb-toolbar-mysubs">Moderated Subreddits</a> ');
        TBUtils.getModSubs(function () {
        $(TBUtils.mySubsData).each(function () {
            $('body').find('#tb-my-subreddits table').append('\
            <tr><td><a href="/r/'+ this.subreddit +'" target="_blank">/r/'+ this.subreddit +'</a></td> \
            <td><a title="/r/'+ this.subreddit +' modmail!" target="_blank" href="http://www.reddit.com/r/'+ this.subreddit +'/about/message/moderator" class="generic-mail"></a>\
            <a title="/r/'+ this.subreddit +' modqueue" target="_blank" href="http://www.reddit.com/r/'+ this.subreddit +'/about/modqueue" class="generic-modqueue"></a>\
            <a title="/r/'+ this.subreddit +' unmoderated" target="_blank" href="http://www.reddit.com/r/'+ this.subreddit +'/about/unmoderated" class="generic-unmoderated"></a></td></tr>\
            ');
        });});
        
        $('body').on('click', '#tb-toolbar-mysubs', function() {
            $('body').find('#tb-my-subreddits').toggle();
        });
    }
    // if mod counters are on we append them to the rest of the counters here.
    if (unmoderatedOn) {
        $('#tb-bottombar').find('#tb-toolbarcounters').append('\
            <a title="unmoderated" href="http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated" id="tb-unmoderated"></a>\
            <a href="http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated" class="tb-toolbar" id="tb-unmoderatedcount"></a>\
            ');
    }

    if (TBUtils.firstRun) {
        $('.tb-first-run').show();
    }

    // Debug mode/console
    if (debugMode) {
        $('#tb-bottombar').find('#tb-toolbarcounters').append('\
            <span>&nbsp;&nbsp;&nbsp;<a href="javascript:;" id="tb-toggle-console"><img title="debug console" src="data:image/png;base64,' + TBui.iconConsole + '" /></a></span>\
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
        TBUtils.setSetting('Notifier', 'modbarhidden', hidden);
    }
    toggleMenuBar(modbarHidden);

    // Show/hide menubar
    $('body').on('click', '.tb-bottombar-unhide, .tb-bottombar-hide', function () {
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
    $('body').on('click', '#tb-toggle-console, #tb-debug-hide', function () {
        if (!consoleShowing) {
            $console.show();
        } else {
            $console.hide();
        }

        consoleShowing = !consoleShowing;
        TBUtils.setSetting('Notifier', 'consoleshowing', consoleShowing);
    });

    // Set console scroll
    $('body').on('click', '#tb-console-lockscroll', function () {
        lockscroll = !lockscroll;
        TBUtils.setSetting('Notifier', 'lockscroll', lockscroll);
    });

    /*
    // Console copy... needs work
    $('body').on('click', '#tb-console-copy', function () {
        lockscroll = !lockscroll;
        TBUtils.setSetting('Notifier', 'lockscroll', lockscroll)
    });
    */

    // Console clear
    $('body').on('click', '.tb-console-clear', function () {
        TBUtils.log = [];
    });
    /// End console stuff


    // Settings menu
    function showSettings() {

        // I probably should have stored "checked" instead of "on" will have to change that later.
        var modnotificationschecked, messagenotificationschecked, messageunreadlinkchecked, consolidatedmessageschecked, modmailnotificationschecked, modmailunreadlinkchecked, unmoderatedonchecked, unmoderatednotificationschecked, hideRemovedChecked;

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
        if (hideRemoved) {
            hideRemovedChecked = 'checked';
        }

        // The window in which all settings will be showed.
        var html = '\
            <div class="tb-page-overlay tb-settings"><div class="tb-window-wrapper">\
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
        $('body').css('overflow', 'hidden');

        // Settings for the tool bar.
        var htmltoolbar = '\
            <div class="tb-window-content-toolbar">\
            <p'+ ((betaMode) ? '' : ' style="display:none"') +'>\
                Import/export toolbox settings to a wiki page:<br>\
                <input type="text" name="settingssub" placeholder="Fill in a private subreddit where you are mod..." value="' + TBUtils.htmlEncode(unescape(settingSub)) + '">\
                <input class="tb-settings-import" type="button" value="import">\
                <input class="tb-settings-export" type="button" value="export">\
                <b> Important:</b> This will reload the page without saving!\
            </p>\
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
                <input type="text" name="modmailsubreddits" value="' + TBUtils.htmlEncode(unescape(modmailSubreddits)) + '">\
            </p>\
            <p>\
                <label><input type="checkbox" name="unmoderatedon" ' + unmoderatedonchecked + '> Show icon for unmoderated.</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="banlistAutomatic" ' + ((banlistAutomatic) ? "checked" : "") + '> Automatically load the whole ban list </label>\
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
            <div class="tb-help-main-content">Edit toolbar stuff</div>\
            </div>\
            ';

        var notifierSettings = $('<div class="tb-notifiersettings">\
            <p>\
                <label><input type="checkbox" name="consolidatedmessages" ' + consolidatedmessageschecked + '> Consolidate notifications (x new messages) instead of individual notifications.</label>\
            </p>\
            <p>\
                <label style="width: 30%; display: inline-block;"><input type="checkbox" name="messagenotifications" ' + messagenotificationschecked + '> Get notifications for new messages</label>\
                <label><input type="checkbox" name="messageunreadlink" ' + messageunreadlinkchecked + '> Link to /message/unread/ if unread messages are present</label>\
            </p>\
            <p>\
                <label style="width: 30%; display: inline-block;"><input type="checkbox" name="modmailnotifications" ' + modmailnotificationschecked + '> Get modmail notifications</label>\
                <label><input type="checkbox" name="modmailunreadlink" ' + modmailunreadlinkchecked + '> Link to /r/' + modmailSubreddits + '/about/message/moderator/unread/ if unread messages are present</label>\
            </p>\
            <p>\
            <label><input type="checkbox" id="straightToInbox" ' + ((straightToInbox) ? "checked" : "") + '> When clicking a comment notification go to the inbox.</label>\
            </p>\
            <p>\
                <label><input type="checkbox" name="modnotifications" ' + modnotificationschecked + '> Get modqueue notifications</label>\
            </p>\
            <p>\
                <label><input type="checkbox" name="unmoderatednotifications" ' + unmoderatednotificationschecked + '> Get unmoderated queue notifications</label>\
            </p></div>').hide();

        $(htmltoolbar).appendTo('.tb-window-content');

        // Add notifier settings, show them if not enabled.
        $('.tb-window-content-toolbar').prepend(notifierSettings);
        if (notifierEnabled) $(notifierSettings).show();

        $('<a href="javascript:;" class="tb-window-content-toolbar">Toolbar Settings</a>').appendTo('.tb-window-tabs');
        $('.tb-help-main').attr('currentpage', 'tb-window-content-toolbar');



        //$("input[name=modsubreddits]").val(unescape(modSubreddits));
        //$("input[name=unmoderatedsubreddits]").val(unescape(unmoderatedSubreddits));
        // Edit shortcuts
        //console.log(htmlshorcuts);
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

        // Settings to toggle the modules
        var htmlmodules = '\
            <div class="tb-window-content-modules">\
            <p>\
                <label><input type="checkbox" id="mmpEnabled" ' + ((mmpEnabled) ? "checked" : "") + '> Enable Mod Mail Pro</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="rrEnabled" ' + ((rrEnabled) ? "checked" : "") + '> Enable Removal Reasons</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="qtEnabled" ' + ((qtEnabled) ? "checked" : "") + '> Enable Queue Tools</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="notesEnabled" ' + ((notesEnabled) ? "checked" : "") + '> Enable User Notes</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="dtagEnabled" ' + ((dtagEnabled) ? "checked" : "") + '> Enable Domain Tagger</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="configEnabled" ' + ((configEnabled) ? "checked" : "") + '> Enable Toolbox Config</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="commentsEnabled" ' + ((commentsEnabled) ? "checked" : "") + '> Enable Comments Module</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="banlistEnabled" ' + ((banlistEnabled) ? "checked" : "") + '> Enable Ban List Module</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="syntaxHighlighterEnabled" ' + ((syntaxHighlighterEnabled) ? "checked" : "") + '> Enable Syntax Highlighter Module</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="modmatrixEnabled" ' + ((modmatrixEnabled) ? "checked" : "") + '> Enable Modlog Utilities</label>\
            </p>\
            <p>\
                <label><input type="checkbox" id="notifierEnabled" ' + ((notifierEnabled) ? "checked" : "") + '> Enable Notifier (queue counts and desktop notifications)</label>\
            </p>\
            <div class="tb-help-main-content">Here you can disable the several toolbox modules.</div>\
            </div>\
            ';
        $(htmlmodules).appendTo('.tb-window-content').hide();
        $('<a href="javascript:;" class="tb-window-content-modules">Toggle Modules</a>').appendTo('.tb-window-tabs');

        // Settings to toggle the modules
        var htmlmodtools = '\
            <div class="tb-window-content-modtools">\
                <p>\
                <label><input type="checkbox" id="hideactioneditems" ' + ((hideactioneditems) ? "checked" : "") + '> Hide items after mod action</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="ignoreonapprove" ' + ((ignoreonapprove) ? "checked" : "") + '> Ignore reports on approved items</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="linktoqueues" ' + ((linkToQueues) ? "checked" : "") + '> Link to subreddit queue on mod pages</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="removalreasons" ' + ((removalreasons) ? "checked" : "") + '> Enable removal reasons</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="commentreasons" ' + ((commentreasons) ? "checked" : "") + '> Enable removal reasons for comments</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="rtscomment" ' + ((rtscomment) ? "checked" : "") + '> Post user summery when submitting to /r/reportthespammers</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="sortmodqueue" ' + ((sortmodqueue) ? "checked" : "") + '> Sort Modqueue in /r/mod sidebar according to queue count (warning: slows page loading drastically)</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="sortunmoderated" ' + ((sortunmoderated) ? "checked" : "") + '> Sort Unmoderated in /r/mod sidebar according to unmoderated count (warning: slows page loading drastically)</label>\
                </p>\
            <div class="tb-help-main-content">Settings for Queue Tools.</div>\
            </div>\
            ';

        $(htmlmodtools).appendTo('.tb-window-content').hide();
        if (qtEnabled) {
            $('<a href="javascript:;" class="tb-window-content-modtools">Queue Tools</a>').appendTo('.tb-window-tabs');
        }

        // Settings for the comment module
        var htmlcomments = '\
            <div class="tb-window-content-comment">\
            <p>\
                <label><input type="checkbox" name="hideRemoved" ' + hideRemovedChecked + '> Hide removed comments by default</label>\
            </p>\
            <p>\
            <label><input type="checkbox" id="approveComments" ' + ((approveComments) ? "checked" : "") + '> Show approve button on all comments</label>\
            </p>\
            <p>\
            <label><input type="checkbox" id="spamRemoved" ' + ((spamRemoved) ? "checked" : "") + '> Show spam button on comments removed as ham</label>\
            </p>\
            <p>\
            <label><input type="checkbox" id="hamSpammed" ' + ((hamSpammed) ? "checked" : "") + '> Show remove (not spam) button on comments removed as spam</label>\
            </p>\
            <p>\
                Highlight keywords, keywords should entered separated by a comma without spaces:<br>\
            <input type="text" name="highlighted" value="' + TBUtils.htmlEncode(unescape(highlighted)) + '"><br>\
            <label><input type="checkbox" id="highlightTitles" ' + ((highlightTitles) ? "checked" : "") + '> Also highlight titles of submissions.</label>\
            </p>\
            <div class="tb-help-main-content">Settings Toolbox Comments.</div>\
            </div>\
            ';

        $(htmlcomments).appendTo('.tb-window-content').hide();
        if (commentsEnabled) {
            $('<a href="javascript:;" class="tb-window-content-comment">Comments</a>').appendTo('.tb-window-tabs');
        }

        // Settings for the syntax highlighter
        var htmlsyntaxHighlighter = '\
            <div class="tb-window-content-syntax">\
            <p>\
                Syntax highlight theme selection:<br>\
                <select id="setting_theme_selector">\
                    <option value="ambiance">ambiance</option>\
                    <option value="chaos">chaos</option>\
                    <option value="chrome">chrome</option>\
                    <option value="cloud9_day">cloud9_day</option>\
                    <option value="cloud9_night">cloud9_night</option>\
                    <option value="cloud9_night_low_color">cloud9_night_low_color</option>\
                    <option value="clouds">clouds</option>\
                    <option value="clouds_midnight">clouds_midnight</option>\
                    <option value="cobalt">cobalt</option>\
                    <option value="crimson_editor">crimson_editor</option>\
                    <option value="dawn">dawn</option>\
                    <option value="dreamweaver">dreamweaver</option>\
                    <option value="eclipse">eclipse</option>\
                    <option value="github">github</option>\
                    <option value="idle_fingers">idle_fingers</option>\
                    <option value="katzenmilch">katzenmilch</option>\
                    <option value="kuroir">kuroir</option>\
                    <option value="merbivore">merbivore</option>\
                    <option value="merbivore_soft">merbivore_soft</option>\
                    <option value="monokai">monokai</option>\
                    <option value="mono_industrial">mono_industrial</option>\
                    <option value="pastel_on_dark">pastel_on_dark</option>\
                    <option value="solarized_dark">solarized_dark</option>\
                    <option value="solarized_light">solarized_light</option>\
                    <option value="terminal">terminal</option>\
                    <option value="textmate">textmate</option>\
                    <option value="tomorrow">tomorrow</option>\
                    <option value="tomorrow_night">tomorrow_night</option>\
                    <option value="tomorrow_night_blue">tomorrow_night_blue</option>\
                    <option value="tomorrow_night_bright">tomorrow_night_bright</option>\
                    <option value="tomorrow_night_eighties">tomorrow_night_eighties</option>\
                    <option value="twilight">twilight</option>\
                    <option value="vibrant_ink">vibrant_ink</option>\
                    <option value="xcode">xcode</option>\
                </select> \
<pre id="syntax_setting_css">\
    /* This is just some example code*/\n\
    body {\n\
        font-family: sans-serif, "Helvetica Neue", Arial;\n\
        font-weight: normal;\n\
    }\n\
    \n\
    .md h3, .commentarea h3 {\n\
        font-size: 1em;\n\
    }\n\
    \n\
    #header {\n\
        border-bottom: 1px solid #9A9A9A; \n\
        box-shadow: 0px 1px 3px 1px #B3C2D1;\n\
    }\n\
</pre>\
            </p>\
            <div class="tb-help-main-content">Settings Toolbox Comments.</div>\
            </div>\
            ';

        $(htmlsyntaxHighlighter).appendTo('.tb-window-content').hide();

        if (syntaxHighlighterEnabled) {
            // Syntax highlighter selection stuff
        $('body').addClass('mod-toolbox-ace');
        var editorSettings = ace.edit("syntax_setting_css");
        editorSettings.setTheme("ace/theme/"+selectedTheme);
        editorSettings.getSession().setMode("ace/mode/css");

        $('#setting_theme_selector').val(selectedTheme);
        $('body').on('change', '#setting_theme_selector', function() {
            var themeName = $(this).val();
            editorSettings.setTheme("ace/theme/"+themeName);
        });

            $('<a href="javascript:;" class="tb-window-content-syntax">Syntax Highlighter</a>').appendTo('.tb-window-tabs');
        }

        // Settings for caching
        var htmlcache = '\
            <div class="tb-window-content-cache">\
            <p>\
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
            <div class="tb-help-main-content">Settings Toolbox caches.</div>\
            </div>\
            ';
        $(htmlcache).appendTo('.tb-window-content').hide();
        $('<a href="javascript:;" class="tb-window-content-cache">Cache</a>').appendTo('.tb-window-tabs');

        // About page
        var htmlabout = '\
        <div class="tb-window-content-about">\
        <h3>About:</h3>	<a href="http://www.reddit.com/r/toolbox" target="_blank">/r/toolbox v' + TBUtils.toolboxVersion + '</a> <br>\
            made and maintained by: <a href="http://www.reddit.com/user/creesch/">/u/creesch</a>, <a href="http://www.reddit.com/user/agentlame">/u/agentlame</a>, <a href="http://www.reddit.com/user/LowSociety">/u/LowSociety</a>,\
            <a href="http://www.reddit.com/user/TheEnigmaBlade">/u/TheEnigmaBlade</a>, <a href="http://www.reddit.com/user/dakta">/u/dakta</a> and <a href="http://www.reddit.com/user/largenocream">/u/largenocream</a> <br><br>\
        <h3>Documentation by:</h3>\
          <a href="http://www.reddit.com/user/psdtwk">/u/psdtwk</a><br><br>\
        <!--h3>Special thanks to:</h3>\
          <a href="http://www.reddit.com/user/largenocream">/u/largenocream</a> - Usernotes ver 3 schema and converter<br><br-->\
        <h3>Credits:</h3>\
        <a href="http://www.famfamfam.com/lab/icons/silk/" target="_blank">Silk icon set by Mark James</a><br>\
        <a href="http://www.reddit.com/user/DEADB33F" target="_blank">Modtools base code by DEADB33F</a><br>\
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

    $('body').on('click', '.tb-settings-import, .tb-settings-export', function (e) {
        var sub = $("input[name=settingssub]").val();
        if (!sub) return;

        // Just to be safe.
        sub = sub.replace('/r/', '').replace('/', '');

        // Save the sub, firest.
        TBUtils.setSetting('Utils', 'settingsub', sub);

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
    $('body').on('click', '.tb-toolbarsettings', function () {
        showSettings();
        TB.injectSettings();
    });

    // change tabs
    $('body').on('click', '.tb-window-tabs a', function () {
        var tab = $(this).attr('class');
        $('.tb-help-main').attr('currentpage', tab);
        // if we have module name, give that to the help button
        if ($(this).data('module')) {
            $('.tb-help-main').data('module', $(this).data('module'));
        }
        $('.tb-window-content').children().hide();
        $('div.' + tab).show();
    });

    // remove a shortcut
    $('body').on('click', '.tb-remove-shortcuts', function () {
        $(this).closest('.tb-window-content-shortcuts-tr').remove();
    });

    // add a shortcut
    $('body').on('click', '.tb-add-shortcuts', function () {
        $('<tr class="tb-window-content-shortcuts-tr"><td><input type="text" name="name"> </td><td> <input type="text" name="url">  <td><td class="tb-window-content-shortcuts-td-remove"> \
        <a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconClose + '" /></a></td></tr>\
        ').appendTo('.tb-window-content-shortcuts-table');
    });

    // Save the settings
    $('body').on('click', '.tb-save', function () {
        var messagenotificationssave = $("input[name=messagenotifications]").is(':checked');
        if (messagenotificationssave === true) {
            TBUtils.setSetting('Notifier', 'messagenotifications', true);
        } else {
            TBUtils.setSetting('Notifier', 'messagenotifications', false);
        }

        var modnotificationscheckedsave = $("input[name=modnotifications]").is(':checked');
        if (modnotificationscheckedsave === true) {
            TBUtils.setSetting('Notifier', 'modnotifications', true);
        } else {
            TBUtils.setSetting('Notifier', 'modnotifications', false);
        }

        modmailnotificationscheckedsaved = $("input[name=modmailnotifications]").is(':checked');
        TBUtils.setSetting('Notifier', 'modmailnotifications', modmailnotificationscheckedsaved);

        unmoderatednotificationscheckedsaved = $("input[name=unmoderatednotifications]").is(':checked');
        TBUtils.setSetting('Notifier', 'unmoderatednotifications', unmoderatednotificationscheckedsaved);

        unmoderatedoncheckedsave = $("input[name=unmoderatedon]").is(':checked');
        TBUtils.setSetting('Notifier', 'unmoderatedon', unmoderatedoncheckedsave);

        hideRemovedCheckedsave = $("input[name=hideRemoved]").is(':checked');
        TBUtils.setSetting('CommentsMod', 'hideRemoved', hideRemovedCheckedsave);

        consolidatedmessagescheckedsave = $("input[name=consolidatedmessages]").is(':checked');
        TBUtils.setSetting('Notifier', 'consolidatedmessages', consolidatedmessagescheckedsave);

        messageunreadlinkcheckedsave = $("input[name=messageunreadlink]").is(':checked');
        TBUtils.setSetting('Notifier', 'messageunreadlink', messageunreadlinkcheckedsave),

        modmailunreadlinkcheckedsave = $("input[name=modmailunreadlink]").is(':checked');
        TBUtils.setSetting('Notifier', 'modmailunreadlink', modmailunreadlinkcheckedsave);

        shortcuts = escape($("input[name=shortcuts]").val());
        TBUtils.setSetting('Notifier', 'shortcuts', shortcuts);

        modSubreddits = $("input[name=modsubreddits]").val();
        TBUtils.setSetting('Notifier', 'modsubreddits', modSubreddits);

        highlighted = $("input[name=highlighted]").val();
        
        TBUtils.setSetting('Notifier', 'straightToInbox', $("#straightToInbox").prop('checked'));
        

        if (highlighted.substr(highlighted.length - 1) === ',') {
            highlighted = highlighted.slice(0, -1);
        }

        TBUtils.setSetting('CommentsMod', 'highlighted', highlighted);

        TBUtils.setSetting('CommentsMod', 'approvecomments', $("#approveComments").prop('checked'));
        TBUtils.setSetting('CommentsMod', 'spamremoved', $("#spamRemoved").prop('checked'));
        TBUtils.setSetting('CommentsMod', 'hamspammed', $("#hamSpammed").prop('checked'));
        TBUtils.setSetting('CommentsMod', 'highlightTitles', $("#highlightTitles").prop('checked'));
        
        unmoderatedSubreddits = $("input[name=unmoderatedsubreddits]").val();
        if (unmoderatedSubreddits !== TBUtils.getSetting('Notifier', 'unmoderatedsubreddits', '')) {
            TBUtils.setSetting('Notifier', 'unmoderatedcount', 0);
            TBUtils.setSetting('Notifier', 'lastseenunmoderated', -1);
        }
        TBUtils.setSetting('Notifier', 'unmoderatedsubreddits', unmoderatedSubreddits);

        modmailSubreddits = $("input[name=modmailsubreddits]").val();
        if (modmailSubreddits !== TBUtils.getSetting('Notifier', 'modmailsubreddits', '')) {
            TBUtils.setSetting('Notifier', 'modmailcount', 0);
            TBUtils.setSetting('Notifier', 'lastseenmodmail', -1);
        }
        TBUtils.setSetting('Notifier', 'modmailsubreddits', modmailSubreddits);

        TBUtils.setSetting('Notifier', 'compacthide', $("#compactHide").prop('checked'));

        TBUtils.setSetting('Utils', 'debugMode', $("#debugMode").prop('checked'));
        TBUtils.setSetting('Utils', 'betaMode', $("#betaMode").prop('checked'));

        // Save shortcuts
        if ($('.tb-window-content-shortcuts-tr').length === 0) {
            TBUtils.setSetting('Notifier', 'shortcuts2', {});
        } else {
            shortcuts2 = {};

            $('.tb-window-content-shortcuts-tr').each(function () {
                var $this = $(this),
                    name = $this.find('input[name=name]').val(),
                    url = $this.find('input[name=url]').val();

                if (name.trim() !== '' || url.trim() !== '') {
                    shortcuts2[escape(name)] = escape(url);
                }
            });

            TBUtils.setSetting('Notifier', 'shortcuts2', shortcuts2);
        }

        // Save syntax highlighting settings
        var newThemeSelection = $('#setting_theme_selector').val();
        TBUtils.setSetting('syntaxHighlighter', 'selectedTheme', newThemeSelection);


        // Save which modules are enabled.
        TBUtils.setSetting('ModMailPro', 'enabled', $("#mmpEnabled").prop('checked'));
        TBUtils.setSetting('RemovalReasons', 'enabled', $("#rrEnabled").prop('checked'));
        TBUtils.setSetting('QueueTools', 'enabled', $("#qtEnabled").prop('checked'));
        TBUtils.setSetting('UserNotes', 'enabled', $("#notesEnabled").prop('checked'));
        TBUtils.setSetting('DomainTagger', 'enabled', $("#dtagEnabled").prop('checked'));
        TBUtils.setSetting('TBConfig', 'enabled', $("#configEnabled").prop('checked'));
        TBUtils.setSetting('CommentsMod', 'enabled', $("#commentsEnabled").prop('checked'));
        TBUtils.setSetting('BanList', 'enabled', $("#banlistEnabled").prop('checked'));
        TBUtils.setSetting('syntaxHighlighter', 'enabled', $("#syntaxHighlighterEnabled").prop('checked'));
        TBUtils.setSetting('ModMatrix', 'enabled', $("#modmatrixEnabled").prop('checked'));
        TBUtils.setSetting('Notifier', 'enabled', $("#notifierEnabled").prop('checked'));

        // Ban list settings
        TBUtils.setSetting('BanList', 'automatic', $("#banlistAutomatic").prop('checked'));

        // Save MTE settings.
        TBUtils.setSetting('QueueTools', 'hideactioneditems', $("#hideactioneditems").prop('checked'));
        TBUtils.setSetting('QueueTools', 'ignoreonapprove', $("#ignoreonapprove").prop('checked'));
        TBUtils.setSetting('RemovalReasons', 'removalreasons', $("#removalreasons").prop('checked'));
        TBUtils.setSetting('RemovalReasons', 'commentreasons', $("#commentreasons").prop('checked'));
        TBUtils.setSetting('QueueTools', 'rtscomment', $("#rtscomment").prop('checked'));
        TBUtils.setSetting('QueueTools', 'sortmodqueue', $("#sortmodqueue").prop('checked'));
        TBUtils.setSetting('QueueTools', 'sortunmoderated', $("#sortunmoderated").prop('checked'));
        TBUtils.setSetting('QueueTools', 'linktoqueues', $("#linktoqueues").prop('checked'));

        // save cache settings.
        TBUtils.setSetting('cache', 'longlength', $("input[name=longLength]").val());
        TBUtils.setSetting('cache', 'shortlength', $("input[name=shortLength]").val());

        if ($("#clearcache").prop('checked')) {
            TBUtils.clearCache();
        }


        $('.tb-settings').remove();
        $('body').css('overflow', 'auto');
        window.location.reload();
    });


    $('body').on('click', '.tb-help-main', function () {
        var $this = $(this),
            tab = $(this).attr('currentpage'),
            module = $this.data('module');

        $tab = $('.' + tab);

        var helpwindow = window.open('', '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');

        if (module) {
            // we do fancy stuff here
            var htmlcontent = 'Loading...';

            $.get('/r/toolbox/wiki/livedocs/'+module, function (result) {
                helpwindow.document.getElementById('help-content').innerHTML = $(result).find('.wiki-page-content .md.wiki').html();
            });
        } else {
            var htmlcontent = $tab.find('.tb-help-main-content').html();
        }

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
    });

    // Close the Settings menu
    $('body').on('click', '.tb-close', function () {
        $('.tb-settings').remove();
        $('body').css('overflow', 'auto');
    });

    //
    // Counters and notifications
    //

    // Mark all modmail messages read when visiting a modmail related page. This is done outside the function since it only has to run on page load when the page is modmail related.
    // If it was part of the function it would fail to show notifications when the user multiple tabs open and the script runs in a modmail tab.
    if (TBUtils.isModmailUnread || TBUtils.isModmail) {
        $.log('clearing all unread stuff');

        // We have nothing unread if we're on the mod mail page.
        TBUtils.setSetting('Notifier', 'lastseenmodmail', now);
        TBUtils.setSetting('Notifier', 'modmailcount', 0);

        $.getJSON('http://www.reddit.com/r/' + modmailSubreddits + '/about/message/moderator/unread.json', function (json) {
            $.each(json.data.children, function (i, value) {

                var unreadmessageid = value.data.name;

                $.post('/api/read_message', {
                    id: unreadmessageid,
                    uh: TBUtils.modhash,
                    api_type: 'json'
                });
            });
        });
    }


    function getmessages() {
        // get some of the variables again, since we need to determine if there are new messages to display and counters to update.
        var lastchecked = TBUtils.getSetting('Notifier', 'lastchecked', -1),
            author = '',
            body_html = '';

        // Update now.
        now = new Date().getTime();


        // Update counters.
        unreadMessageCount = TBUtils.getSetting('Notifier', 'unreadmessagecount', 0);
        modqueueCount = TBUtils.getSetting('Notifier', 'modqueuecount', 0);
        unmoderatedCount = TBUtils.getSetting('Notifier', 'unmoderatedcount', 0);
        modmailCount = TBUtils.getSetting('Notifier', 'modmailcount', 0);

        //
        // Update methods
        //

        function updateMessagesCount(count) {
            if (count < 1) {
                $('#mailCount').empty();
                $('#mail').attr('class', 'nohavemail');
                $('#mail').attr('title', 'no new mail!');
                $('#mail').attr('href', 'http://www.reddit.com/message/inbox/');
                $('#mailcount').attr('href', 'http://www.reddit.com' + messageunreadurl);
                $('#tb-mail').attr('class', 'nohavemail');
                $('#tb-mail').attr('title', 'no new mail!');
                $('#tb-mail').attr('href', 'http://www.reddit.com/message/inbox/');
                $('#tb-mailCount').attr('href', 'http://www.reddit.com/message/inbox/');
            } else {
                $('#mail').attr('class', 'havemail');
                $('#mail').attr('title', 'new mail!');
                $('#mail').attr('href', 'http://www.reddit.com' + messageunreadurl);
                $('#mailcount').attr('href', 'http://www.reddit.com' + messageunreadurl);
                $('#tb-mail').attr('class', 'havemail');
                $('#tb-mail').attr('title', 'new mail!');
                $('#tb-mail').attr('href', 'http://www.reddit.com' + messageunreadurl);
                $('#tb-mailCount').attr('href', 'http://www.reddit.com' + messageunreadurl);
            }
            $('#tb-mailCount').text('[' + count + ']');

            if (count > 0) {
                $('#mailCount').text('[' + count + ']');
            }
        }

        function updateModqueueCount(count) {
            $('#tb-queueCount').text('[' + count + ']');
        }

        function updateUnmodCount(count) {
            $('#tb-unmoderatedcount').text('[' + count + ']');
        }

        function updateModMailCount(count) {
            if (count < 1) {
                $('#tb-modmail').attr('class', 'nohavemail');
                $('#tb-modmail').attr('title', 'no new mail!');
                $('#tb-modmail').attr('href', 'http://www.reddit.com/r/' + modmailSubreddits + '/about/message/moderator');
            } else {
                $('#modmail').attr('class', 'havemail');
                $('#modmail').attr('title', 'new mail!');
                $('#modmail').attr('href', 'http://www.reddit.com' + modmailunreadurl);
                $('#tb-modmail').attr('class', 'havemail');
                $('#tb-modmail').attr('title', 'new mail!');
                $('#tb-modmail').attr('href', 'http://www.reddit.com' + modmailunreadurl);
            }
            $('#tb-modmailcount').text('[' + count + ']');
            // $('#tb-modmail').attr('href', 'http://www.reddit.com/message/moderator/');
        }

        if (!newLoad && (now - lastchecked) < checkInterval) {
            updateMessagesCount(unreadMessageCount);
            updateModqueueCount(modqueueCount);
            updateUnmodCount(unmoderatedCount);
            updateModMailCount(modmailCount);
            return;
        }

        newLoad = false;

        //$.log('updating totals');
        // We're checking now.
        TBUtils.setSetting('Notifier', 'lastchecked', now);

        //
        // Messages
        //
        // The reddit api is silly sometimes, we want the title or reported comments and there is no easy way to get it, so here it goes:
        // a silly function to get the title anyway. The $.getJSON is wrapped in a function to prevent if from running async outside the loop.

        function getcommentitle(unreadsubreddit, unreadcontexturl, unreadcontext, unreadauthor, unreadbody_html) {
            $.getJSON(unreadcontexturl, function (jsondata) {
                var commenttitle = jsondata[0].data.children[0].data.title;
                if(straightToInbox && messageunreadlink) {
                TBUtils.notification('Reply from: ' + unreadauthor + ' in:  ' + unreadsubreddit, ' post: ' + commenttitle + '\n body:\n' + $(unreadbody_html).text(), 'http://www.reddit.com/message/unread/');
                } else if (straightToInbox) {
                TBUtils.notification('Reply from: ' + unreadauthor + ' in:  ' + unreadsubreddit, ' post: ' + commenttitle + '\n body:\n' + $(unreadbody_html).text(), 'http://www.reddit.com/message/inbox/');
                } else {
                TBUtils.notification('Reply from: ' + unreadauthor + ' in:  ' + unreadsubreddit, ' post: ' + commenttitle + '\n body:\n' + $(unreadbody_html).text(), 'http://www.reddit.com' + unreadcontext);
                }
            });
        }

        // getting unread messages
        $.getJSON('http://www.reddit.com/message/unread.json', function (json) {
            var count = json.data.children.length || 0;
            TBUtils.setSetting('Notifier', 'unreadmessagecount', count);
            updateMessagesCount(count);
            if (count === 0) return;
            // Are we allowed to show a popup?
            if (messageNotifications && count > unreadMessageCount) {


                // set up an array in which we will load the last 100 messages that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                var pushedunread = TBUtils.getSetting('Notifier', 'unreadpushed', []);
                //$.log(consolidatedMessages);
                if (consolidatedMessages) {
                    var notificationbody, messagecount = 0;
                    $.each(json.data.children, function (i, value) {


                        if ($.inArray(value.data.name, pushedunread) == -1 && value.kind == 't1') {
                            var subreddit = value.data.subreddit,
                                author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = 'reply from: ' + author + '. in:' + subreddit + '\n';
                            } else {
                                notificationbody = notificationbody + 'reply from: ' + author + '. in:' + subreddit + '\n';
                            }
                            messagecount++;
                            pushedunread.push(value.data.name);
                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block
                        } else if ($.inArray(value.data.name, pushedunread) == -1) {
                            var subject = value.data.subject,
                                author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = 'pm from: ' + author + ' - ' + subject + '\n';
                            } else {
                                notificationbody = notificationbody + 'pm from: ' + author + ' - ' + subject + '\n';
                            }
                            messagecount++;
                            pushedunread.push(value.data.name);
                        }
                    });


                    //$.log(messagecount);
                    //$.log(notificationbody);
                    if (messagecount === 1) {
                        TBUtils.notification('One new message!', notificationbody, 'http://www.reddit.com' + messageunreadurl);

                    } else if (messagecount > 1) {
                        TBUtils.notification(messagecount.toString() + ' new messages!', notificationbody, 'http://www.reddit.com' + messageunreadurl);
                    }



                } else {
                    $.each(json.data.children, function (i, value) {

                        if ($.inArray(value.data.name, pushedunread) == -1 && value.kind == 't1') {

                            var context = value.data.context,
                                body_html = TBUtils.htmlDecode(value.data.body_html),
                                author = value.data.author,
                                subreddit = value.data.subreddit,
                                contexturl = 'http://www.reddit.com' + context.slice(0, -10) + '.json';

                            getcommentitle(subreddit, contexturl, context, author, body_html);
                            pushedunread.push(value.data.name);

                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block
                        } else if ($.inArray(value.data.name, pushedunread) == -1) {
                            var author = value.data.author,
                                body_html = TBUtils.htmlDecode(value.data.body_html),
                                subject = value.data.subject,
                                id = value.data.id;

                            TBUtils.notification('New message:' + subject, $(body_html).text() + '... \n \n from:' + author, 'http://www.reddit.com/message/messages/' + id);
                            pushedunread.push(value.data.name);
                        }
                    });
                }
                if (pushedunread.length > 100) {
                    pushedunread.splice(0, 100 - pushedunread.length);
                }
                TBUtils.setSetting('Notifier', 'unreadpushed', pushedunread);


            }
        });

        //
        // Modqueue
        //
        // wrapper around $.getJSON so it can be part of a loop


        function procesmqcomments(mqlinkid, mqreportauthor, mqidname) {
            $.getJSON(mqlinkid, function (jsondata) {
                var infopermalink = jsondata.data.children[0].data.permalink,
                    infotitle = jsondata.data.children[0].data.title,
                    infosubreddit = jsondata.data.children[0].data.subreddit;
                infopermalink = infopermalink + mqidname.substring(3);
                TBUtils.notification('Modqueue - /r/' + infosubreddit + ' - comment:', mqreportauthor + '\'s comment in ' + infotitle, 'http://www.reddit.com' + infopermalink + '?context=3');
            });
        }
        // getting modqueue
        $.getJSON('http://www.reddit.com/r/' + modSubreddits + '/about/modqueue.json?limit=100', function (json) {
            var count = json.data.children.length || 0;
            updateModqueueCount(count);
            //$.log(modNotifications);
            if (modNotifications && count > modqueueCount) {
                // Ok let's have a look and see if there are actually new items to display
                //$.log('test');
                // set up an array in which we will load the last 100 items that have been displayed.
                // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.
                var pusheditems = TBUtils.setSetting('Notifier', 'modqueuepushed', []);
                //$.log(consolidatedMessages);
                if (consolidatedMessages) {
                    //$.log('here we go!');
                    var notificationbody, queuecount = 0;
                    $.each(json.data.children, function (i, value) {


                        if ($.inArray(value.data.name, pusheditems) == -1 && value.kind == 't3') {
                            var subreddit = value.data.subreddit,
                                author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = 'post from: ' + author + ', in:' + subreddit + '\n';
                            } else {
                                notificationbody = notificationbody + 'post from: ' + author + ', in:' + subreddit + '\n';
                            }
                            queuecount++;
                            pusheditems.push(value.data.name);
                        } else if ($.inArray(value.data.name, pusheditems) == -1) {
                            var subreddit = value.data.subreddit,
                                author = value.data.author;

                            if (!notificationbody) {
                                notificationbody = 'comment from: ' + author + ', in ' + subreddit + '\n';
                            } else {
                                notificationbody = notificationbody + 'comment from: ' + author + ',  in' + subreddit + '\n';
                            }
                            queuecount++;
                            pusheditems.push(value.data.name);
                        }
                    });


                    //$.log(queuecount);
                    //$.log(notificationbody);
                    if (queuecount === 1) {
                        TBUtils.notification('One new modqueue item!', notificationbody, 'http://www.reddit.com/r/' + modSubreddits + '/about/modqueue');

                    } else {
                        TBUtils.notification(queuecount.toString() + ' new modqueue items!', notificationbody, 'http://www.reddit.com/r/' + modSubreddits + '/about/modqueue');
                    }

                } else {

                    $.each(json.data.children, function (i, value) {
                        if ($.inArray(value.data.name, pusheditems) == -1 && value.kind == 't3') {

                            var mqpermalink = value.data.permalink,
                                mqtitle = value.data.title,
                                mqauthor = value.data.author,
                                mqsubreddit = value.data.subreddit;

                            TBUtils.notification('Modqueue: /r/' + mqsubreddit + ' - post', mqtitle + ' By: ' + mqauthor, 'http://www.reddit.com' + mqpermalink);
                            pusheditems.push(value.data.name);
                        } else if ($.inArray(value.data.name, pusheditems) == -1) {
                            var reportauthor = value.data.author,
                                idname = value.data.name,
                                linkid = 'http://www.reddit.com/api/info.json?id=' + value.data.link_id;

                            //since we want to add some adition details to this we call the previous declared function
                            procesmqcomments(linkid, reportauthor, idname);
                            pusheditems.push(value.data.name);
                        }
                    });

                }
                if (pusheditems.length > 100) {
                    pusheditems.splice(0, 100 - pusheditems.length);
                }
                TBUtils.setSetting('Notifier', 'modqueuepushed', pusheditems);


            }
            TBUtils.setSetting('Notifier', 'modqueuecount', count);
        });

        //
        // Unmoderated
        //
        // getting unmoderated queue
        if (unmoderatedOn || unmoderatedNotifications) {
            $.getJSON('http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated.json?limit=100', function (json) {
                var count = json.data.children.length || 0;

                if (unmoderatedNotifications && count > unmoderatedCount) {
                    var lastSeen = TBUtils.getSetting('Notifier', 'lastseenunmoderated', -1);

                    if (consolidatedMessages) {
                        var notificationbody, queuecount = 0;

                        $.each(json.data.children, function (i, value) {
                            if (!lastSeen || value.data.created_utc * 1000 > lastSeen) {
                                var subreddit = value.data.subreddit
                                  , author    = value.data.author;

                                if (!notificationbody) {
                                      notificationbody  = 'post from: ' + author + ', in: ' + subreddit + '\n';
                                } else {
                                      notificationbody += 'post from: ' + author + ', in: ' + subreddit + '\n';
                                }

                                queuecount++;

                            }
                        });

                        if (queuecount === 1) {
                            TBUtils.notification('One new unmoderated item!', notificationbody, 'http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated');
                        } else {
                            TBUtils.notification(queuecount.toString() + ' new unmoderated items!', notificationbody, 'http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated');
                        }
                    } else {
                        $.each(json.data.children, function (i, value) {
                            if (!lastSeen || value.data.created_utc * 1000 > lastSeen) {
                                var uqpermalink = value.data.permalink,
                                    uqtitle = value.data.title,
                                    uqauthor = value.data.author,
                                    uqsubreddit = value.data.subreddit;

                                TBUtils.notification('Unmoderated: /r/' + uqsubreddit + ' - post', uqtitle + ' By: ' + uqauthor, 'http://www.reddit.com' + uqpermalink);
                            }
                        });
                    }

                    TBUtils.setSetting('Notifier', 'lastseenunmoderated', now);
                }

                TBUtils.setSetting('Notifier', 'unmoderatedcount', count);

                if (unmoderatedOn) {
                    updateUnmodCount(count);
                }
            });
        }

        //
        // Modmail
        //
        // getting unread modmail, will not show replies because... well the api sucks in that regard.
        $.getJSON('http://www.reddit.com/r/' + modmailSubreddits + '/about/message/moderator.json', function (json) {
            var count = json.data.children.length || 0;
            if (count === 0) {
                TBUtils.setSetting('Notifier', 'modmailcount', count);
                updateModMailCount(count);
                return;
            }

            var lastSeen = TBUtils.getSetting('Notifier', 'lastseenmodmail', -1),
                newIdx = '',
                title = '',
                text = '',
                newCount = 0;

            for (var i = 0; i < json.data.children.length; i++) {
                var messageTime = json.data.children[i].data.created_utc * 1000,
                    messageAuthor = json.data.children[i].data.author;

                var isInviteSpam = false;
                if (TBUtils.getSetting('ModMailPro', 'hideinvitespam', false) && (json.data.children[i].data.subject == 'moderator invited' || json.data.children[i].data.subject == 'moderator added')) {
                    isInviteSpam = true;
                }

                if ((!lastSeen || messageTime > lastSeen) && messageAuthor !== TBUtils.logged && !isInviteSpam) {
                    newCount++;
                    if (!newIdx) { newIdx = i; }
                }
            }

            $.log('New messages: ', newCount);

            if (modmailNotifications && newCount > 0 && newCount !== modmailCount) {  // Don't show the message twice.
                var notificationbody, messagecount = 0;

                if (consolidatedMessages || newCount>5) {

                    $.each(json.data.children, function (i, value) {

                        var isInviteSpam = false;
                        if (TBUtils.getSetting('ModMailPro', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
                            isInviteSpam = true;
                        }

                        var subreddit = value.data.subreddit,
                            author = value.data.author;

                        // Prevent changing the message body, since this loops through all messages, again.
                        // In all honesty, all of this needs to be rewriten...
                        if (author !== TBUtils.logged && !isInviteSpam) {
                            messagecount++;
                            if (messagecount > newCount) return false;

                            if (!notificationbody) {
                                notificationbody = 'from: ' + author + ', in:' + subreddit + '\n';
                            } else {
                                notificationbody = notificationbody + 'from: ' + author + ', in:' + subreddit + '\n';
                            }
                        }
                    });

                    if (newCount === 1) {
                        TBUtils.notification('One new modmail!', notificationbody, 'http://www.reddit.com' + modmailunreadurl);

                    } else if (newCount > 1) {
                        TBUtils.notification(newCount.toString() + ' new modmail!', notificationbody, 'http://www.reddit.com' + modmailunreadurl);
                    }
                } else {
                    $.each(json.data.children, function (i, value) {

                        var isInviteSpam = false;
                        if (TBUtils.getSetting('ModMailPro', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
                            isInviteSpam = true;
                        }

                        var author = value.data.author;

                        if (author !== TBUtils.logged && !isInviteSpam) {
                        // Sending 100 messages, since this loops through all messages, again.
                        // In all honesty, all of this needs to be rewriten...
                        messagecount++;
                        if (messagecount > newCount) return false;

                        var modmailbody = value.data.body;
                        modmailsubject = value.data.subject;
                        modmailsubreddit = value.data.subreddit;
                        modmailpermalink = value.data.id;

                        TBUtils.notification('Modmail: /r/' + modmailsubreddit + ' : ' + modmailsubject, modmailbody, 'http://www.reddit.com/message/messages/' + modmailpermalink);
                        }
                    });

                }
            }

            TBUtils.setSetting('Notifier', 'modmailcount', newCount);
            updateModMailCount(newCount);

        });
    }
    // How often we check for new messages, this will later be adjustable in the settings.
    if (notifierEnabled) {
        setInterval(getmessages, checkInterval);
        getmessages();
    } else { //this is a temp hack until 2.2
        TBUtils.setSetting('Notifier', 'unreadmessagecount', 0);
        TBUtils.setSetting('Notifier', 'modqueuecount', 0);
        TBUtils.setSetting('Notifier', 'unmoderatedcount', 0);
        TBUtils.setSetting('Notifier', 'modmailcount', 0);
    }

})();
