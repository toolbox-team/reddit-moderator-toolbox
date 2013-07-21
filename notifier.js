// ==UserScript==
// @name         Toolbox Notifier
// @namespace    http://www.reddit.com/r/toolbox
// @author       creesch, agentlame
// @description  notifications of messages
// @include      http://reddit.com/*
// @include      https://reddit.com/*
// @include      http://*.reddit.com/*
// @include      https://*.reddit.com/*
// @downloadURL  http://userscripts.org/scripts/source/172111.user.js
// @version 1.11
// ==/UserScript==

function tbnoti() {
    if (!reddit.logged) return;
    
    //
    // preload some generic variables 
    //
    var checkInterval = TBUtils.setting('Notifier', 'checkinterval', 1*60*1000), //default to check every minute for new stuff.
        modNotifications = localStorage['Toolbox.Notifier.modnotifications'] || 'on', //TODO: change all localStorage methods to use TBUtils.setting().
        messageNotifications = localStorage['Toolbox.Notifier.messagenotifications'] || 'on',
        modmailNotifications = TBUtils.setting('Notifier', 'modmailnotifications', true),
        modSubreddits = localStorage['Toolbox.Notifier.modsubreddits'] || 'mod',
        unmoderatedSubreddits = localStorage['Toolbox.Notifier.unmoderatedsubreddits'] || 'mod',
        shortcuts = localStorage['Toolbox.Notifier.shortcuts'] || '-',
        shortcuts2 = JSON.parse(localStorage['Toolbox.Notifier.shortcuts2'] || '{}'),
        modbarHidden = TBUtils.setting('Notifier', 'modbarhidden', false),
        unmoderatedOn = TBUtils.setting('Notifier', 'unmoderatedon', true),
        consolidatedMessages = TBUtils.setting('Notifier', 'consolidatedmessages', false),
        footer = $('.footer-parent'),
        unreadMessageCount = TBUtils.setting('Notifier', 'unreadmessagecount', 0),
        modqueueCount = TBUtils.setting('Notifier', 'modqueuecount', 0),
        unmoderatedCount = TBUtils.setting('Notifier', 'unmoderatedcount', 0),
        unreadPage = location.pathname.match(/\/message\/(?:unread)\/?/),  //TODO: promote to TBUtils.isUnreadPage
        modmailCount = TBUtils.setting('Notifier', 'modmailcount', 0),
        debugMode = TBUtils.debugMode,
        consoleShowing = false,
        newLoad = true,
    	messageunreadlink = TBUtils.setting('Notifier', 'messageunreadlink', false),
		modmailunreadlink = TBUtils.setting('Notifier', 'modmailunreadlink', false);
		
		if (messageunreadlink) {
        	messageunreadurl= '/message/unread/';
		} else { 
        	messageunreadurl= '/message/inbox/';
		}
		if (modmailunreadlink) {
        	modmailunreadurl = '/message/moderator/unread/';
		} else {
        	modmailunreadurl = '/message/moderator/';
		}
        
        
    // Module settings.
    var mmpEnabled = TBUtils.setting('ModMailPro', 'enabled', true),
        mbEnabled = TBUtils.setting('ModButton', 'enabled', true),
        mteEnabled = TBUtils.setting('ModTools', 'enabled', true),
        notesEnabled = TBUtils.setting('UserNotes', 'enabled', true),
        dtagEnabled = TBUtils.setting('DomainTagger', 'enabled', true),
        configEnabled = TBUtils.setting('TBConfig', 'enabled', true),
        stattitEnabled = TBUtils.setting('StattitTab', 'enabled', true);
        
    // MTE settings.
    var hideactioneditems = TBUtils.setting('ModTools', 'hideactioneditems', false),
        ignoreonapprove = TBUtils.setting('ModTools', 'ignoreonapprove', false),
        removalreasons = TBUtils.setting('ModTools', 'removalreasons', true),
        commentreasons = TBUtils.setting('ModTools', 'commentreasons', false),
        rtscomment = TBUtils.setting('ModTools', 'rtscomment', true),
        sortmodsubs = TBUtils.setting('ModTools', 'sortmodsubs', false);
        
    // cache settings.
        var shortLength = TBUtils.setting('cache', 'shortlength', 15),
            longLength = TBUtils.setting('cache', 'longlength', 45);
        
   
    //
    // UI elements 
    //
    
    $.log(TBUtils.isExtension);
    
    // toolbar, this will display all counters, quick links and other settings for the toolbox
	var modbar = $('\
    <div id="tb-bottombar" class="tb-toolbar">\
        <a class="tb-bottombar-hide" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconhide + '" /></a>&nbsp;&nbsp;\
        <a class="tb-toolbar tb-toolbarsettings" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.icon + '" /></a>\
        <span id="tb-toolbarshortcuts"></span>\
        <span id="tb-toolbarcounters">\
			<a title="no mail" href="http://www.reddit.com/message/inbox/" class="nohavemail" id="tb-mail"></a> \
			<a href="http://www.reddit.com/message/inbox/" class="tb-toolbar" id="tb-mailCount"></a>\
			<a title="modmail" href="http://www.reddit.com/message/moderator/" id="tb-modmail" class="nohavemail"></a>\
			<a href="http://www.reddit.com/message/moderator/" class="tb-toolbar" id="tb-modmailcount"></a>\
			<a title="modqueue" href="http://www.reddit.com/r/' + modSubreddits + '/about/modqueue" id="tb-modqueue"></a> \
			<a href="http://www.reddit.com/r/' + modSubreddits + '/about/modqueue" class="tb-toolbar" id="tb-queueCount"></a>\
		</span>\
	</div>\
		');
        
    var modbarhid = $('\
    <div id="tb-bottombar-hidden" class="tb-toolbar">\
       <a class="tb-bottombar-unhide" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconshow + '" /></a>\
    </div>');
    
    var $console = $('\
    <div class="tb-debug-window">\
			<div class="tb-debug-header"> Debug console <span class="tb-debug-header-options"><a class="tb-close" id="tb-debug-hide" href="javascript:;">X</a></span></div>\
			<div class="tb-debug-content">\
				<textarea class="tb-debug-console" rows="20" cols="20"></textarea>\
            </div>\
            <div class="tb-debug-footer" comment="for the looks">&nbsp;</div>\
    </div>\
        ');
            
    $console.appendTo('body').hide();
    
    $(footer).prepend(modbar);
    
	// if mod counters are on we append them to the rest of the counters here. 
	if (unmoderatedOn) {
	$('#tb-bottombar').find('#tb-toolbarcounters').append('\
			<a title="unmoderated" href="http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated" id="tb-unmoderated"></a>\
			<a href="http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated" class="tb-toolbar" id="tb-unmoderatedcount"></a>\
			');
	}
    
    if (debugMode) {
        $('#tb-bottombar').find('#tb-toolbarcounters').prepend('\
            <span><a href="javascript:;" id="tb-toggle-console"><img title="debug console" src="data:image/png;base64,' + TBUtils.iconConsole + '" /></a>&nbsp;&nbsp;&nbsp;</span>\
			');
            
        var $consoleText = $('.tb-debug-console');
        (function consoleLoop(){
            setTimeout(function(){
                $consoleText.val(TBUtils.log.join('\n'));
                consoleLoop();
            }, 500);
        })();
    }
    
	// Append shortcuts
    $.each(shortcuts2, function(index, value) {
        var shortcut = $('<span>- <a href="' + unescape(value) + '">' + unescape(index) + '</a> </span>');
        
        $(shortcut).appendTo('#tb-toolbarshortcuts');
	});
    
    $(footer).prepend(modbarhid);
    
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
        TBUtils.setting('Notifier', 'modbarhidden', '', hidden);
    }
    toggleMenuBar(modbarHidden);
    
    // Show/hide menubar
    $('body').delegate('.tb-bottombar-unhide, .tb-bottombar-hide', 'click', function () {
        toggleMenuBar($(this).hasClass('tb-bottombar-hide'));
    });
    
    // Show counts on hover
    $(modbarhid).hover(function modbarHover(e){
        var hoverString = 'New Messages: ' + unreadMessageCount +
                          '<br>Mod Queue: ' + modqueueCount +
                          '<br>Unmoderated Queue: ' + unmoderatedCount +
                          '<br>New Mod Mail: ' + modmailCount;
                          
        $.tooltip(hoverString, e);
    });
    
    $('body').delegate('#tb-toggle-console, #tb-debug-hide', 'click', function () {
       if (!consoleShowing) {
           $console.show();
       } else {
           $console.hide();
       }
       
       consoleShowing = !consoleShowing;
    });
    
    // Settings menu	
    function showSettings() {
        
        // I probably should have stored "checked" instead of "on" will have to change that later. 
        var modnotificationschecked,
			messagenotificationschecked,
			messageunreadlinkchecked,
			consolidatedmessageschecked,
			modmailnotificationschecked,
			modmailunreadlinkchecked,
			unmoderatedonchecked;
        
		if (messageunreadlink) {
            messageunreadlinkchecked = 'checked'; 
		} 		
		if (modmailunreadlink) {
            modmailunreadlinkchecked= 'checked'; 
		} 			
        if (modNotifications == 'on') {
            modnotificationschecked = 'checked';
        }
        if (messageNotifications == 'on') {
            messagenotificationschecked = 'checked';
        }
		if(modmailNotifications) {
            modmailnotificationschecked = 'checked';
        }
		if (unmoderatedOn) {
            unmoderatedonchecked = 'checked';
		}
		if(consolidatedMessages) {
            consolidatedmessageschecked = 'checked';
        }
        
        // The window in which all settings will be showed. 
        var html = '\
            <div class="tb-page-overlay tb-settings">\
            <div class="tb-window-wrapper">\
            <div class="tb-window-header"> Toolbox configuration <span class="tb-window-header-options"><a class="tb-help-main" href="javascript:;" currentpage="">?</a> - <a class="tb-close" href="javascript:;">X</a></span></div>\
            <div class="tb-window-tabs"></div>\
			<div class="tb-window-content">\
            </div>\
            <div class="tb-window-footer" comment="for the looks"><input class="tb-save" type="button" value="save"></div>\
            </div>\
            </div>\
            ';
        $(html).appendTo('body').show();
        $('body').css('overflow', 'hidden');
        
        // Settings for the tool bar. 
        var htmltoolbar = '\
            <div class="tb-window-content-toolbar">\
			<p>\
				<label><input type="checkbox" name="consolidatedmessages" ' + consolidatedmessageschecked + '> Do show consolidated notifications (x new messages) instead of individual notifications.</label>\
			</p>\
            <p>\
				<label style="width: 30%; display: inline-block;"><input type="checkbox" name="messagenotifications" ' + messagenotificationschecked + '> Get notifications for new messages</label>\
				<label><input type="checkbox" name="messageunreadlink" ' + messageunreadlinkchecked + '> Link to /message/unread/ if unread messages are present</label>\
			</p>\
			<p>\
				<label style="width: 30%; display: inline-block;"><input type="checkbox" name="modmailnotifications" ' + modmailnotificationschecked + '> Get modmail notifications</label>\
				<label><input type="checkbox" name="modmailunreadlink" ' + modmailunreadlinkchecked + '> Link to /message/moderator/unread/ if unread messages are present</label>\
			</p>\
			<p>\
				<label><input type="checkbox" name="modnotifications" ' + modnotificationschecked + '> Get modqueue notifications</label>\
			</p>\
			<p>\
				Multireddit of subs you want displayed in the modqueue counter:<br>\
				<input type="text" name="modsubreddits" value="'+ unescape(modSubreddits) +'">\
			</p>\
			<p>\
				<label><input type="checkbox" name="unmoderatedon" ' + unmoderatedonchecked + '>Show counter for unmoderated.</label>\
			</p>\
			<p>\
				Multireddit of subs you want displayed in the unmoderated counter:<br>\
				<input type="text" name="unmoderatedsubreddits" value="'+ unescape(unmoderatedSubreddits) +'">\
			</p>\
            <p>\
                <label><input type="checkbox" id="debugMode" ' + ((debugMode) ? "checked" : "") + '> Enable debug mode</label>\
			</p>\
			<div class="tb-help-main-content">Edit toolbar stuff</div>\
			</div>\
            ';
        $(htmltoolbar).appendTo('.tb-window-content');
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
		<a class="tb-add-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconadd + '" /></a>\
		<div class="tb-help-main-content">Add or remove shortcuts here!</div>\
		</div>\
            ';
		$(htmlshorcuts).appendTo('.tb-window-content').hide();
        
		if($.isEmptyObject(shortcuts2)) {
		$('<tr class="tb-window-content-shortcuts-tr"><td><input type="text" name="name"> </td><td> <input type="text" name="url">  <td><td class="tb-window-content-shortcuts-td-remove"> \
		<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconclose + '" /></a></td></tr>\
		').appendTo('.tb-window-content-shortcuts-table');
        
		}  else {
		$.each(shortcuts2, function(index, value) {
		shortcutinput = '<tr class="tb-window-content-shortcuts-tr"><td><input type="text" value="'+ unescape(index) + '" name="name"> </td><td> <input type="text" value="' + unescape(value) + '" name="url"> <td><td class="tb-window-content-shortcuts-td-remove">\
		<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconclose + '" /></a></td></tr>\
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
				<label><input type="checkbox" id="mbEnabled" ' + ((mbEnabled) ? "checked" : "") + '> Enable Mod Button</label>\
			</p>\
            <p>\
				<label><input type="checkbox" id="mteEnabled" ' + ((mteEnabled) ? "checked" : "") + '> Enable Mod Tools Enhanced</label>\
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
				<label><input type="checkbox" id="stattitEnabled" ' + ((stattitEnabled) ? "checked" : "") + '> Enable Stattit Tab</label>\
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
                <p>\
                <label><input type="checkbox" id="removalreasons" ' + ((removalreasons) ? "checked" : "") + '> Enable removal reasons</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="commentreasons" ' + ((commentreasons) ? "checked" : "") + '> Enable removal reasons for comments</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="rtscomment" ' + ((rtscomment) ? "checked" : "") + '> Post user summery when submitting to /r/reportthespammes</label>\
                </p>\
                <p>\
                <label><input type="checkbox" id="sortmodsubs" ' + ((sortmodsubs) ? "checked" : "") + '> Sort subreddits in /r/mod sidebar accoriding to mod queue count (warning: slows page loading if you mod more than a few subs)</label>\
                </p>\
			<div class="tb-help-main-content">Settings for Mod Tools Enhanced.</div>\
			</div>\
            ';
        if (mteEnabled) {
            $(htmlmodtools).appendTo('.tb-window-content').hide();
            $('<a href="javascript:;" class="tb-window-content-modtools">Mod Tools</a>').appendTo('.tb-window-tabs');
        }
        
        // Settings to toggle the modules 
        var htmlcache = '\
            <div class="tb-window-content-cache">\
    		<p>\
				Cache subreddit config (removal reasons, domain tags, mod macros) time (in minutes):<br>\
				<input type="text" name="longLength" value="'+ longLength +'">\
			</p>\
        	<p>\
				Cache subreddit user notes time (in minutes):<br>\
				<input type="text" name="shortLength" value="'+ shortLength +'">\
			</p>\
    		<p>\
				<label><input type="checkbox" id="clearcache"> Clear cache on save. (NB: please close all other open reddit tabs before click clearing cache.))</label>\
			</p>\
			<div class="tb-help-main-content">Settings Toolbox caches.</div>\
			</div>\
            ';
        $(htmlcache).appendTo('.tb-window-content').hide();
        $('<a href="javascript:;" class="tb-window-content-cache">Cache</a>').appendTo('.tb-window-tabs');
        
        // About page
        var htmlabout = '\
		<div class="tb-window-content-about">\
		<h3>About:</h3>	<a href="http://www.reddit.com/r/toolbox" target="_blank">/r/toolbox v'+ TBUtils.toolboxVersion +'</a> <br> made and maintained by: <a href="http://www.reddit.com/user/creesch/">/u/creesch</a> and <a href="http://www.reddit.com/user/agentlame">/u/agentlame</a><br><br>\
		<h3>Special thanks to:</h3>\
		<a href="http://www.reddit.com/user/LowSociety">/u/LowSociety</a> - Stattit Tab and several code contributions <br>\
        <a href="http://www.reddit.com/user/TheEnigmaBlade">/u/TheEnigmaBlade</a> - User Notes: note type tags <br><br>\
		<h3>Credits:</h3>\
		<a href="http://www.famfamfam.com/lab/icons/silk/" target="_blank">Silk icon set by Mark James</a><br>\
		<a href="http://www.reddit.com/user/DEADB33F">Modtools base code by DEADB33F</a>\
		<div class="tb-help-main-content">This is a about page!</div>\
		</div>';
		
		$(htmlabout).appendTo('.tb-window-content').hide();
        $('<a href="javascript:;" class="tb-window-content-about">About</a>').appendTo('.tb-window-tabs');
		
	//	$("input[name=shortcuts]").val(unescape(shortcuts));
    }
    
    // Open the settings
    $('body').delegate('.tb-toolbarsettings', 'click', function () {
        showSettings();
    });
    
    // change tabs 
    $('body').delegate('.tb-window-tabs a', 'click', function () {
        var tab = $(this).attr('class');
        $('.tb-help-main').attr('currentpage', tab);
        $('.tb-window-content').children().hide();
        $('div.' + tab).show();
    });
    
    // remove a shortcut
    $('body').delegate('.tb-remove-shortcuts', 'click', function () {
        $(this).closest('.tb-window-content-shortcuts-tr').remove();
    });
    
    // add a shortcut 
    $('body').delegate('.tb-add-shortcuts', 'click', function () {
			$('<tr class="tb-window-content-shortcuts-tr"><td><input type="text" name="name"> </td><td> <input type="text" name="url">  <td><td class="tb-window-content-shortcuts-td-remove"> \
		<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconclose + '" /></a></td></tr>\
		').appendTo('.tb-window-content-shortcuts-table');
    });
    
    // Save the settings 
    $('body').delegate('.tb-save', 'click', function () {
            var messagenotificationssave = $("input[name=messagenotifications]").is(':checked');
            if (messagenotificationssave === true) {
                localStorage['Toolbox.Notifier.messagenotifications'] = 'on';
            } else {
                localStorage['Toolbox.Notifier.messagenotifications'] = 'off';
            }
            
            var modnotificationscheckedsave = $("input[name=modnotifications]").is(':checked');
            if (modnotificationscheckedsave === true) {
                localStorage['Toolbox.Notifier.modnotifications'] = 'on';
            } else {
                localStorage['Toolbox.Notifier.modnotifications'] = 'off';
            }
            
            modmailnotificationscheckedsaved = $("input[name=modmailnotifications]").is(':checked');
			TBUtils.setting('Notifier', 'modmailnotifications', '', modmailnotificationscheckedsaved);
			
			unmoderatedoncheckedsave = $("input[name=unmoderatedon]").is(':checked');
            TBUtils.setting('Notifier', 'unmoderatedon', '', unmoderatedoncheckedsave);
            
            consolidatedmessagescheckedsave = $("input[name=consolidatedmessages]").is(':checked');
            TBUtils.setting('Notifier', 'consolidatedmessages', '', consolidatedmessagescheckedsave);
            
			messageunreadlinkcheckedsave = $("input[name=messageunreadlink]").is(':checked');
			TBUtils.setting('Notifier', 'messageunreadlink', '', messageunreadlinkcheckedsave),
		    
			modmailunreadlinkcheckedsave = $("input[name=modmailunreadlink]").is(':checked');
			TBUtils.setting('Notifier', 'modmailunreadlink', '', modmailunreadlinkcheckedsave);
			
            shortcuts = escape($("input[name=shortcuts]").val());
            localStorage['Toolbox.Notifier.shortcuts'] = shortcuts;
            
            modSubreddits = $("input[name=modsubreddits]").val();
            localStorage['Toolbox.Notifier.modsubreddits'] = modSubreddits;
            
            unmoderatedSubreddits = $("input[name=unmoderatedsubreddits]").val();
            localStorage['Toolbox.Notifier.unmoderatedsubreddits'] = unmoderatedSubreddits;
			
           
            TBUtils.setting('Utils', 'debugMode', '', $("#debugMode").prop('checked'));
            
            // Save shortcuts 
            if ($('.tb-window-content-shortcuts-tr').length === 0) {
                localStorage['Toolbox.Notifier.shortcuts2'] = JSON.stringify('{}');
            } else {
                shortcuts2 = {};
                
                $('.tb-window-content-shortcuts-tr').each(function () {
                var name = $(this).find('input[name=name]').val(),
                    url = $(this).find('input[name=url]').val();
                    
                    if (name.trim() !== '' || url.trim() !== '') {
                        shortcuts2[escape(name)] = escape(url);
                    }
                });
                
                localStorage['Toolbox.Notifier.shortcuts2'] = JSON.stringify(shortcuts2);
            }
            
		// Save which modules are enabled.
        TBUtils.setting('ModMailPro', 'enabled', '', $("#mmpEnabled").prop('checked'));
        TBUtils.setting('ModButton', 'enabled', '', $("#mbEnabled").prop('checked'));
        TBUtils.setting('ModTools', 'enabled', '', $("#mteEnabled").prop('checked'));
        TBUtils.setting('UserNotes', 'enabled', '', $("#notesEnabled").prop('checked'));
        TBUtils.setting('DomainTagger', 'enabled', '', $("#dtagEnabled").prop('checked'));
        TBUtils.setting('TBConfig', 'enabled', '', $("#configEnabled").prop('checked'));
        TBUtils.setting('StattitTab', 'enabled', '', $("#stattitEnabled").prop('checked'));
        
        // Save MTE settings.
        TBUtils.setting('ModTools', 'hideactioneditems', '', $("#hideactioneditems").prop('checked'));
        TBUtils.setting('ModTools', 'ignoreonapprove', '', $("#ignoreonapprove").prop('checked'));
        TBUtils.setting('ModTools', 'removalreasons', '', $("#removalreasons").prop('checked'));
        TBUtils.setting('ModTools', 'commentreasons', '', $("#commentreasons").prop('checked'));
        TBUtils.setting('ModTools', 'rtscomment', '', $("#rtscomment").prop('checked'));
        TBUtils.setting('ModTools', 'sortmodsubs', '', $("#sortmodsubs").prop('checked'));
        
        // save cache settings.
        TBUtils.setting('cache', 'longlength', '', $("input[name=longLength]").val());
        TBUtils.setting('cache', 'shortlength', '', $("input[name=shortLength]").val());
        
        if ($("#clearcache").prop('checked')) {
            TBUtils.noteCache =  {};
            TBUtils.configCache = {};
            TBUtils.noConfig = [];
            TBUtils.noNotes = [];
            TBUtils.mySubs = [];
        }
        
        
        $('.tb-settings').remove();
        $('body').css('overflow', 'auto');
        window.location.reload();
    });


    $('body').delegate('.tb-help-main', 'click', function () {
        var tab = $(this).attr('currentpage');
        tab = '.' + tab;
		var helpwindow = window.open('', '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');
        var htmlcontent = $(tab).find('.tb-help-main-content').html();
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
        <div class="help-content">' + htmlcontent + '</div>\
		</body>\
        </html>\
        ';
        helpwindow.document.write(html);
        helpwindow.focus();
    });
    
    // Close the Settings menu
    $('body').delegate('.tb-close', 'click', function () {
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
        $.getJSON('http://www.reddit.com/message/moderator/unread.json', function (json) {
            $.each(json.data.children, function (i, value) {

                var unreadmessageid = value.data.name;

                $.post('/api/read_message', {
                    id: unreadmessageid,
                    uh: reddit.modhash,
                    api_type: 'json'
                });
            });
        });
    }
	
    
    function getmessages() {
        // get some of the variables again, since we need to determine if there are new messages to display and counters to update.
        var lastchecked = TBUtils.setting('Notifier', 'lastchecked', -1),
            author = '',
            body_html = '',
            now = new Date().getTime();
            
        // Update counters.
        unreadMessageCount = TBUtils.setting('Notifier', 'unreadmessagecount', 0);
        modqueueCount = TBUtils.setting('Notifier', 'modqueuecount', 0);
        unmoderatedCount = TBUtils.setting('Notifier', 'unmoderatedcount', 0);
        modmailCount = TBUtils.setting('Notifier', 'modmailcount', 0);
        
        // 
        // Update methods
        //
        
        function updateMessagesCount(count) {
            if (count < 1) {
                $('#mailCount').html('');
                $('#mail').attr('class', 'nohavemail');
                $('#mail').attr('title', 'no new mail!');
				$('#mail').attr('href', 'http://www.reddit.com/message/inbox/');
				$('#mailcount').attr('href', 'http://www.reddit.com'+ messageunreadurl);
                $('#tb-mail').attr('class', 'nohavemail');
                $('#tb-mail').attr('title', 'no new mail!');
                $('#tb-mail').attr('href', 'http://www.reddit.com/message/inbox/');
                $('#tb-mailCount').attr('href', 'http://www.reddit.com/message/inbox/');
            } else {
                $('#mail').attr('class', 'havemail');
                $('#mail').attr('title', 'new mail!');
				$('#mail').attr('href', 'http://www.reddit.com'+ messageunreadurl);
				$('#mailcount').attr('href', 'http://www.reddit.com'+ messageunreadurl);
                $('#tb-mail').attr('class', 'havemail');
                $('#tb-mail').attr('title', 'new mail!');
                $('#tb-mail').attr('href', 'http://www.reddit.com'+ messageunreadurl);
                $('#tb-mailCount').attr('href', 'http://www.reddit.com'+ messageunreadurl);
            }
            $('#tb-mailCount').html('[' + count + ']');
            
			if (count > 0) {
                $('#mailCount').html('[' + count + ']');
			}
        }
        
        function updateModqueueCount(count) {
            $('#tb-queueCount').html('[' + count + ']');
        }
        
        function updateUnmodCount(count) {
            $('#tb-unmoderatedcount').html('[' + count + ']');
        }
        
        function updateModMailCount(count) {
            if (count < 1) {
                $('#tb-modmail').attr('class', 'nohavemail');
                $('#tb-modmail').attr('title', 'no new mail!');
                $('#tb-modmail').attr('href', 'http://www.reddit.com/message/moderator');
            } else {
                $('#modmail').attr('class', 'havemail');
                $('#modmail').attr('title', 'new mail!');
                $('#modmail').attr('href', 'http://www.reddit.com'+ modmailunreadurl);
                $('#tb-modmail').attr('class', 'havemail');
                $('#tb-modmail').attr('title', 'new mail!');
                $('#tb-modmail').attr('href', 'http://www.reddit.com'+ modmailunreadurl);
            }
            $('#tb-modmailcount').html('[' + count + ']');
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
        TBUtils.setting('Notifier', 'lastchecked', '', now);
        
        //
        // Messages
        //
        
        // The reddit api is silly sometimes, we want the title or reported comments and there is no easy way to get it, so here it goes: 
        // a silly function to get the title anyway. The $.getJSON is wrapped in a function to prevent if from running async outside the loop.
        
        function getcommentitle(unreadsubreddit, unreadcontexturl, unreadcontext, unreadauthor, unreadbody_html) {
            $.getJSON(unreadcontexturl, function (jsondata) {
                var commenttitle = jsondata[0].data.children[0].data.title;
                TBUtils.notification('Reply from: ' + unreadauthor + ' in:  ' + unreadsubreddit ,  ' post: '+commenttitle + '\n body:\n' + $(unreadbody_html).text(), 'http://www.reddit.com' + unreadcontext);
            });
        }
        
        // getting unread messages
        $.getJSON('http://www.reddit.com/message/unread.json', function (json) {
            var count = json.data.children.length || 0;
			TBUtils.setting('Notifier', 'unreadmessagecount', '', count);
            updateMessagesCount(count);
            if (count === 0) return;
            // Are we allowed to show a popup?
            if (messageNotifications == 'on' && count > unreadMessageCount) {
                   
      
                    // set up an array in which we will load the last 100 messages that have been displayed. 
                    // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.								
                    var pushedunread = JSON.parse(localStorage['Toolbox.Notifier.unreadpushed'] || '[]');
					//$.log(consolidatedMessages);
					if (consolidatedMessages) {
					var notificationbody,
						messagecount = 0; 
					$.each( json.data.children, function( i, value ) {
					
					
                        if ($.inArray(value.data.name, pushedunread) == -1 && value.kind == 't1') {
						var subreddit = value.data.subreddit,
						    author = value.data.author;
						
						if(!notificationbody) {
						 notificationbody = 'reply from: ' + author + '. in:'+ subreddit +'\n'; 
						} else {
						 notificationbody = notificationbody+'reply from: ' + author + '. in:'+ subreddit +'\n'; 
						}						 
                          messagecount++;
						  pushedunread.push(value.data.name);
                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block        
                        } else if ($.inArray(value.data.name, pushedunread) == -1) {
							var subject = value.data.subject,
							author = value.data.author;
						
						if(!notificationbody) { 
						notificationbody = 'pm from: ' + author + ' - '+ subject +'\n';
						} else {
						notificationbody = notificationbody+'pm from: ' + author + ' - '+ subject +'\n'; 
						}
						messagecount++;
						pushedunread.push(value.data.name);
                        }
					});
					
					
					//$.log(messagecount);
					//$.log(notificationbody);
					
					if (messagecount === 1) { 
					TBUtils.notification('One new message!', notificationbody, 'http://www.reddit.com'+ messageunreadurl);
                            
					} else if (messagecount > 1) { 
					TBUtils.notification(messagecount.toString() + ' new messages!', notificationbody, 'http://www.reddit.com'+ messageunreadurl);
					}
				
					
					
					} else {				
                    $.each( json.data.children, function( i, value ) {
                        
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
                    TBUtils.setting('Notifier', 'unreadpushed', '', pushedunread);
					
                
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
			
            if (modNotifications == 'on' && count > modqueueCount) {
                // Ok let's have a look and see if there are actually new items to display 
                //$.log('test');
                    // set up an array in which we will load the last 100 items that have been displayed. 
                    // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.								
                    var pusheditems = JSON.parse(localStorage['Toolbox.Notifier.modqueuepushed'] || '[]');
                    //$.log(consolidatedMessages);
					if (consolidatedMessages) {
					//$.log('here we go!');
					var notificationbody,
						queuecount = 0; 
					$.each( json.data.children, function( i, value ) {
					
					
                        if ($.inArray(value.data.name, pusheditems) == -1 && value.kind == 't3') {
						var subreddit = value.data.subreddit,
						    author = value.data.author;
						
						if(!notificationbody) {
						 notificationbody = 'post from: ' + author + ', in:'+ subreddit +'\n'; 
						} else {
						 notificationbody = notificationbody+'post from: ' + author + ', in:'+ subreddit +'\n'; 
						}						 
                          queuecount++;
						  pusheditems.push(value.data.name);                                   
                        } else if ($.inArray(value.data.name, pusheditems) == -1) {
							var subreddit = value.data.subreddit,
							author = value.data.author;
						
						if(!notificationbody) { 
						notificationbody = 'comment from: ' + author + ', in '+ subreddit +'\n';
						} else {
						notificationbody = notificationbody+'comment from: ' + author + ',  in'+ subreddit +'\n'; 
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
					
					$.each( json.data.children, function( i, value ) {
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
                    TBUtils.setting('Notifier', 'modqueuepushed', '', pusheditems);
					
                
            }
			TBUtils.setting('Notifier', 'modqueuecount', '', count);
        });
        
        //
        // Unmoderated
        //
        
        // getting unmoderated, for now only a counter, otherwise it might be to much with the notifications
		if (unmoderatedOn) {
            $.getJSON('http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated.json?limit=100', function (json) {
                var count = json.data.children.length || 0;
                
                TBUtils.setting('Notifier', 'unmoderatedcount', '', count);
                updateUnmodCount(count);
            });
        }
        
        //
        // Modmail
        //
       
        // getting unread modmail, will not show replies because... well the api sucks in that regard.
        $.getJSON('http://www.reddit.com/message/moderator/unread.json', function (json) {
            var count = json.data.children.length || 0;
            if (modmailNotifications && count > modmailCount) {
            var pushedmodmail = JSON.parse(localStorage['Toolbox.Notifier.modmailpushed'] || '[]');    

			if (consolidatedMessages) { 
 					var notificationbody,
						modmailcount = 0;                    
					$.each( json.data.children, function( i, value ) {
					if (TBUtils.setting('ModMailPro', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
                            invitespamid = value.data.name;
                            
                            $.post('/api/read_message', {
                                id: invitespamid,
                                uh: reddit.modhash,
                                api_type: 'json'
                            });
                        } else if ($.inArray(value.data.name, pushedmodmail) == -1) { 
						
						var subreddit = value.data.subreddit,
						author = value.data.author;
						
						if(!notificationbody) {
						 notificationbody = 'from: ' + author + ', in:'+ subreddit +'\n'; 
						} else {
						 notificationbody = notificationbody+'from: ' + author + ', in:'+ subreddit +'\n'; 
						}						 
                          modmailcount++;
						  pushedmodmail.push(value.data.name);  
						}
						});	
                        
				 	if (modmailcount === 1) { 
					TBUtils.notification('One new modmail thread!', notificationbody, 'http://www.reddit.com'+ modmailunreadurl);
                            
					} else if (modmailcount > 1) { 
					TBUtils.notification(modmailcount.toString() + ' new modmail threads!', notificationbody, 'http://www.reddit.com'+ modmailunreadurl);
					}		
			} else {
                    $.each( json.data.children, function( i, value ) {
                    
                    if (TBUtils.setting('ModMailPro', 'hideinvitespam', false) && (value.data.subject == 'moderator invited' || value.data.subject == 'moderator added')) {
                            invitespamid = value.data.name;
                            
                            $.post('/api/read_message', {
                                id: invitespamid,
                                uh: reddit.modhash,
                                api_type: 'json'
                            });
                        } else if ($.inArray(value.data.name, pushedmodmail) == -1) {
                                var modmailbody = value.data.body;
                                modmailsubject = value.data.subject;
                                modmailsubreddit = value.data.subreddit;
                                modmailpermalink = value.data.id;
                                
                                TBUtils.notification('Modmail: /r/' + modmailsubreddit + ' : ' + modmailsubject, modmailbody, 'http://www.reddit.com/message/messages/' + modmailpermalink);
                                pushedmodmail.push(value.data.name);
                                
                            
                        }
                        
                    });
					
			}
                    
                if (pushedmodmail.length > 100) {
                    pushedmodmail.splice(0, 100 - pushedmodmail.length);
                }
                TBUtils.setting('Notifier', 'modmailpushed', '', pushedmodmail);
                                       
            
            
            }
            TBUtils.setting('Notifier', 'modmailcount', '', count);
            updateModMailCount(count);
            
        });
    }
    // How often we check for new messages, this will later be adjustable in the settings. 
    setInterval(getmessages, checkInterval);
    getmessages();
}
    
// Add script to page
(function () {
    
    // Check if we are running as an extension
    if (typeof self.on !== "undefined" || (typeof chrome !== "undefined" && chrome.extension)) {
        init();
        return;
    }
    
    // Check if TBUtils has been added.
    if (!window.TBUadded) {
        window.TBUadded = true;
        
        var utilsURL = 'http://agentlame.github.io/toolbox/tbutils.js';
        var cssURL = 'http://agentlame.github.io/toolbox/tb.css';
        $('head').prepend('<script type="text/javascript" src=' + utilsURL + '></script>');
        $('head').prepend('<link rel="stylesheet" type="text/css" href="' + cssURL + '"></link>');
    }
    
    // Do not add script to page until TBUtils is added.
    (function loadLoop() {
        setTimeout(function () {
            if (typeof TBUtils !== "undefined") {
                init();
            } else {
                loadLoop();
            }
        }, 100);
    })();
    
    function init() {
        var s = document.createElement('script');
        s.textContent = "(" + tbnoti.toString() + ')();';
        document.head.appendChild(s);
    }
})();