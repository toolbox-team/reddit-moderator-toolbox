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
// @version 1.7
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
        consoleShowing = false;
        
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
        
    var icon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHaSURBVDjLlZO7a1NRHMfzfzhIKQ5OHR1ddRRBLA6lg4iT\
                d5PSas37YR56Y2JiHgg21uoFxSatCVFjbl5iNBBiMmUJgWwZhCB4pR9/V4QKfSQdDufF5/v7nu85xwJYprV0Oq0kk8luIpEw4vG48f/eVDiVSikCTobDIePxmGg0yokEBO4OBgNGoxH5fJ5wOHwygVgsZpjVW60WqqqWz\
                bVgMIjf78fn8xlTBcTy736/T7VaJRQKfQoEArqmafR6Pdxu9/ECkUjkglje63Q6NBoNisUihUKBcrlMpVLB6XR2D4df3VQnmRstsWzU63WazSZmX6vV0HWdUqmEw+GY2Gw25SC8dV1l1wrZNX5s3qLdbpPL5fB6vXumZal\
                q2O32rtVqVQ6GuGnCd+HbFnx9AZrC+MkSHo/np8vlmj/M7f4ks6yysyawgB8fwPv70HgKG8v8cp/7fFRO/+AllewqNJ/DhyBsi9A7J1QTkF4E69mXRws8u6ayvSJwRqoG4K2Md+ygxyF5FdbPaMfdlIXUZfiyAUWx/OY25O\
                4JHBP4CtyZ16a9EwuRi1CXs+5K1ew6lB9DXERX517P8tEsPDzfNIP6C5YeQewSrJyeCd4P0bnwXYISy3MCn5oZNtsf3pH46e7XBJcAAAAASUVORK5CYII=';
                
	var iconclose = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJdSURBVDjLpZP7S1NhGMf9W7YfogSJboSEUVCY8zJ31trcps6z\
                TI9bLGJpjp1hmkGNxVz4Q6ildtXKXzJNbJRaRmrXoeWx8tJOTWptnrNryre5YCYuI3rh+8vL+/m8PA/PkwIg5X+y5mJWrxfOUBXm91QZM6UluUmthntHqplxUml2lciF6wrmdHriI0Wx3xw2hAediLwZRWRkCPzdDswaSvGq\
                kGCfq8VEUsEyPF1O8Qu3O7A09RbRvjuIttsRbT6HHzebsDjcB4/JgFFlNv9MnkmsEszodIIY7Oaut2OJcSF68Qx8dgv8tmqEL1gQaaARtp5A+N4NzB0lMXxon/uxbI8gIYjB9HytGYuusfiPIQcN71kjgnW6VeFOkgh3XcHL\
                vAwMSDPohOADdYQJdF1FtLMZPmslvhZJk2ahkgRvq4HHUoWHRDqTEDDl2mDkfheiDgt8pw340/EocuClCuFvboQzb0cwIZgki4KhzlaE6w0InipbVzBfqoK/qRH94i0rgokSFeO11iBkp8EdV8cfJo0yD75aE2ZNRvSJ0lZK\
                cBXLaUYmQrCzDT6tDN5SyRqYlWeDLZAg0H4JQ+Jt6M3atNLE10VSwQsN4Z6r0CBwqzXesHmV+BeoyAUri8EyMfi2FowXS5dhd7doo2DVII0V5BAjigP89GEVAtda8b2ehodU4rNaAW+dGfzlFkyo89GTlcrHYCLpKD+V7yee\
                HNzLjkp24Uu1Ed6G8/F8qjqGRzlbl2H2dzjpMg1KdwsHxOlmJ7GTeZC/nesXbeZ6c9OYnuxUc3fmBuFft/Ff8xMd0s65SXIb/gAAAABJRU5ErkJggg==';
                
	var iconhide = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEXSURBVDjLY/j//z8DJZiBLgZkz37Ynjrz4ReyDEideb89afrD\
                f5ET7v4n2YCEqXf7qpY9/T9r76v/Xu03STMgasLteaVLHv+fufvl/6k7X/y3qrlCvAHBvTeXFC54ANbctv7p/95Nz/5rFZ0nzoCAzpuPsuc++D91x4v/jasf/y9aeP9/89rH/6VTTxJngGPDtc3xU+/879789H/5kgf/02fd\
                +V+17OF/yZhjxBmgVXCaRT3v7BqP1mv/a1Y+/J824/b/woX3/osHHSAtECVjjqy0Lb/wP2/+3f+Zs+/8F3XfS3o0inntXWSeffJ/0tRb/0Ucdv4nKyEJW25ZYBh/5L+w5fb/ZCdlQYMNs4WMt/wfuMyEDwMA0Irn/pDRT58A\
                AAAASUVORK5CYII=';
                
	var iconshow = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEdSURBVDjLY/j//z8DJZiB6gY0rH7xpW7li3YKDHj1v2bli38l\
                ix61k2VA5fJn/9eeeP+/fcOL/wlT7/aRbEDegkf/Vxx/93/xobf/S5c8/u/ecm0eSQYkTX/4f+HBN/8nbX/xf+bul/8Tp9/9r1N0dgnRBgT33QZqfPW/YdXj/42rH//v2vjkv3fHtf9SScceEWWAc8u1/xO2Pv9fsvjB//Il\
                D4CGPPrvXH/5v2Tksc1EGWBaful/+/on/4sW3gfGxsP/9lUX/ksEH1gj6rqdhSgDlPPO/q9b8fB/5bIH/23LL/wXD9i7kqRAlEo6+b908f3/NiXn/4t57V1EcjRKRB75b1145r+o684FZCUkMb8D/0Uct88euMxEKgYA7Ojr\
                v4CgE7EAAAAASUVORK5CYII=';
				
	var iconadd= 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJvSURBVDjLpZPrS5NhGIf9W7YvBYOkhlkoqCklWChv2WyKik7b\
                lnNris72bi6dus0DLZ0TDxW1odtopDs4D8MDZuLU0kXq61CijSIIasOvv94VTUfLiB74fXngup7nvrnvJABJ/5PfLnTTdcwOj4RsdYmo5glBWP6iOtzwvIKSWstI0Wgx80SBblpKtE9KQs/We7EaWoT/8wbWP61gMmCH0lMD\
                vokT4j25TiQU/ITFkek9Ow6+7WH2gwsmahCPdwyw75uw9HEO2gUZSkfyI9zBPCJOoJ2SMmg46N61YO/rNoa39Xi41oFuXysMfh36/Fp0b7bAfWAH6RGi0HglWNCbzYgJaFjRv6zGuy+b9It96N3SQvNKiV9HvSaDfFEIxXIt\
                nPs23BzJQd6DDEVM0OKsoVwBG/1VMzpXVWhbkUM2K4oJBDYuGmbKIJ0qxsAbHfRLzbjcnUbFBIpx/qH3vQv9b3U03IQ/HfFkERTzfFj8w8jSpR7GBE123uFEYAzaDRIqX/2JAtJbDat/COkd7CNBva2cMvq0MGxp0PRSCPF8\
                BXjWG3FgNHc9XPT71Ojy3sMFdfJRCeKxEsVtKwFHwALZfCUk3tIfNR8XiJwc1LmL4dg141JPKtj3WUdNFJqLGFVPC4OkR4BxajTWsChY64wmCnMxsWPCHcutKBxMVp5mxA1S+aMComToaqTRUQknLTH62kHOVEE+VQnjahsc\
                NCy0cMBWsSI0TCQcZc5ALkEYckL5A5noWSBhfm2AecMAjbcRWV0pUTh0HE64TNf0mczcnnQyu/MilaFJCae1nw2fbz1DnVOxyGTlKeZft/Ff8x1BRssfACjTwQAAAABJRU5ErkJggg==';
                
    var iconConsole = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFke\
    XHJZTwAAAIiSURBVBgZpcE7SJZhFMDx/3neV/u8ZlhoVxAkESoyJYoa3BojDCFc25psaS8CWxoEhxAagiCpHCpqaa3AyiIISwjTtHIou3wX/b73nFOPIEG0\
    SL+fuDv/Q04Mjp052ttz6WvR69wBM9wMNcXNMTdcFXPHVVEzGqsrhamphXPjl/tH0p4jPcNVubrQkmM96gpFHQZG0mLFQ/FrnvUqVTzwW+rqXBxoZ71OD80Sp\
    e5GVM4UB9wcNTAcM0fN0MzRzFE3yuq0tTagpkQBdyIJQhAIQQgJJCKkIZAmKf7zBeV3Q1RJidqqlMgyJQpqShQAEUGCkAQhJIIECF5ieW6c\
    +uZ9VD7dJ60ORKZGFNycVSJEAQgihCAkiVD88IDa5i4at3ZRmHsI+RkiMyUKZsoaEQERogBofoFv7+7RsLkJ/XGHLZ2n+P72Bm4ZZkYUskqFVSKI\
    CJGIEH15c5Pm9uOwPMnEtevUN5X4MfOI77OPySoZUXA1ogQQQEQQoPB5Ei0s0bCpiK3MgBuaf0pb71nmn1yhimWiYGasESAA4sris6s07dqPFV/hVqK7\
    rwMrfySXm6ZxxyG6aiaI5MTg2FjLzm39poqpoars2fCUkwdztO6uQfMTuJd5fnuK7r5OJNkINcd4NHphpdpLB8Td+dvE8OH5vQPXtyfhPZ4tAc4fgaSmg\
    8XXL5m+e/5Wyj9kK+Xc5Ghfyc1xM9wMN8PNcTPcHMxw99ZfSC4lgw+6sSMAAAAASUVORK5CYII=';
    
    //
    // UI elements 
    //
    
	// Mark messages on /unread/ read.
    if (unreadPage) {
        var entries = $('.entry');
        $(entries).click();
    }
    
    $.log(TBUtils.isExtension);
    
    // toolbar, this will display all counters, quick links and other settings for the toolbox
	var modbar = $('\
    <div id="tb-bottombar" class="tb-toolbar">\
        <a class="tb-bottombar-hide" href="javascript:void(0)"><img src="data:image/png;base64,' + iconhide + '" /></a>&nbsp;&nbsp;\
        <a class="tb-toolbar tb-toolbarsettings" href="javascript:void(0)"><img src="data:image/png;base64,' + icon + '" /></a>\
        <span id="tb-toolbarshortcuts"></span>\
        <span id="tb-toolbarcounters">\
			<a title="no mail" href="http://www.reddit.com/message/inbox/" class="nohavemail" id="tb-mail"></a> \
			<a href="http://www.reddit.com/message/inbox/" class="tb-toolbar" id="tb-mailCount">[0]</a>\
			<a title="modqueue" href="http://www.reddit.com/r/' + modSubreddits + '/about/modqueue" id="tb-modqueue"></a> \
			<a href="http://www.reddit.com/r/' + modSubreddits + '/about/modqueue" class="tb-toolbar" id="tb-queueCount">[0]</a>\
			<a title="modmail" href="http://www.reddit.com/message/moderator/" id="tb-modmail" class="nohavemail"></a>\
			<a href="http://www.reddit.com/message/moderator/" class="tb-toolbar" id="tb-modmailcount">[0]</a>\
		</span>\
	</div>\
		');
        
    var modbarhid = $('\
    <div id="tb-bottombar-hidden" class="tb-toolbar">\
       <a class="tb-bottombar-unhide" href="javascript:void(0)"><img src="data:image/png;base64,' + iconshow + '" /></a>\
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
			<a href="http://www.reddit.com/r/' + unmoderatedSubreddits + '/about/unmoderated" class="tb-toolbar" id="tb-unmoderatedcount">[0]</a>\
			');
	}
    
    if (debugMode) {
        $('#tb-bottombar').find('#tb-toolbarcounters').prepend('\
            <span><a href="javascript:;" id="tb-toggle-console"><img title="debug console" src="data:image/png;base64,' + iconConsole + '" /></a>&nbsp;&nbsp;&nbsp;</span>\
			');
            
        var $consoleText = $('.tb-debug-console');
        (function consoleLoop(){
            setTimeout(function(){
                $consoleText.val(TBUtils.log);
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
			consolidatedmessageschecked,
			modmailnotificationschecked,
			unmoderatedonchecked;
            
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
				<label><input type="checkbox" name="messagenotifications" ' + messagenotificationschecked + '> Get notifications for new messages</label>\
			</p>\
			<p>\
				<label><input type="checkbox" name="modmailnotifications" ' + modmailnotificationschecked + '> Get modmail notifications</label>\
			</p>\
			<p>\
				<label><input type="checkbox" name="modnotifications" ' + modnotificationschecked + '> Get modqueue notifications</label>\
			</p>\
			<p>\
				Multireddit of subs you want displayed in the modqueue counter:<br>\
				<input type="text" name="modsubreddits">\
			</p>\
			<p>\
				<label><input type="checkbox" name="unmoderatedon" ' + unmoderatedonchecked + '>Show counter for unmoderated.</label>\
			</p>\
			<p>\
				Multireddit of subs you want displayed in the unmoderated counter:<br>\
				<input type="text" name="unmoderatedsubreddits">\
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
        
        $("input[name=modsubreddits]").val(unescape(modSubreddits));
        $("input[name=unmoderatedsubreddits]").val(unescape(unmoderatedSubreddits));
        
        // Edit shortcuts
		//console.log(htmlshorcuts);
        var htmlshorcuts = '\
		<div class="tb-window-content-shortcuts">\
		<table class="tb-window-content-shortcuts-table"><tr><td>name</td><td> url </td><td class="tb-window-content-shortcuts-td-remove"> remove</td></tr>\
		</table>\
		<a class="tb-add-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + iconadd + '" /></a>\
		<div class="tb-help-main-content">Add or remove shortcuts here!</div>\
		</div>\
            ';
		$(htmlshorcuts).appendTo('.tb-window-content').hide();
        
		if($.isEmptyObject(shortcuts2)) {
		$('<tr class="tb-window-content-shortcuts-tr"><td><input type="text" name="name"> </td><td> <input type="text" name="url">  <td><td class="tb-window-content-shortcuts-td-remove"> \
		<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + iconclose + '" /></a></td></tr>\
		').appendTo('.tb-window-content-shortcuts-table');
        
		}  else {
		$.each(shortcuts2, function(index, value) {
		shortcutinput = '<tr class="tb-window-content-shortcuts-tr"><td><input type="text" value="'+ unescape(index) + '" name="name"> </td><td> <input type="text" value="' + unescape(value) + '" name="url"> <td><td class="tb-window-content-shortcuts-td-remove">\
		<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + iconclose + '" /></a></td></tr>\
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
        
        // About page
        var htmlabout = '\
		<div class="tb-window-content-about">\
		<h3>About:</h3>	<a href="http://www.reddit.com/r/toolbox" target="_blank">/r/toolbox</a> <br> made and maintained by: <a href="http://www.reddit.com/user/creesch/">/u/creesch</a> and <a href="http://www.reddit.com/user/agentlame">/u/agentlame</a><br><br>\
		<h3>Special thanks to:</h3>\
		<a href="http://www.reddit.com/user/LowSociety">/u/LowSociety</a> - Stattit Tab and several code contributions <br><br>\
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
		<a class="tb-remove-shortcuts" href="javascript:void(0)"><img src="data:image/png;base64,' + iconclose + '" /></a></td></tr>\
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
                shortcuts2 = JSON.parse('{}');
                
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
                $('#tb-mail').attr('class', 'nohavemail');
                $('#tb-mail').attr('title', 'no new mail!');
                $('#tb-mail').attr('href', 'http://www.reddit.com/message/inbox/');
                $('#tb-mailCount').attr('href', 'http://www.reddit.com/message/inbox/');
            } else {
                $('#mail').attr('class', 'havemail');
                $('#mail').attr('title', 'new mail!');
                $('#tb-mail').attr('class', 'havemail');
                $('#tb-mail').attr('title', 'new mail!');
                $('#tb-mail').attr('href', 'http://www.reddit.com/message/unread');
                $('#tb-mailCount').attr('href', 'http://www.reddit.com/message/unread');
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
                //$('#tb-modmail').attr('href', 'http://www.reddit.com/message/moderator/');
            } else {
                $('#modmail').attr('class', 'havemail');
                $('#modmail').attr('title', 'new mail!');
                //$('#modmail').attr('href', 'http://www.reddit.com/message/moderator/unread');
                $('#tb-modmail').attr('class', 'havemail');
                $('#tb-modmail').attr('title', 'new mail!');
                //$('#tb-modmail').attr('href', 'http://www.reddit.com/message/moderator/unread');
            }
            $('#tb-modmailcount').html('[' + count + ']');
            $('#tb-modmail').attr('href', 'http://www.reddit.com/message/moderator/');
        }
        
        if ((now - lastchecked) < checkInterval) {
            updateMessagesCount(unreadMessageCount);
            updateModqueueCount(modqueueCount);
            updateUnmodCount(unmoderatedCount);
            updateModMailCount(modmailCount);
            return;
        }
        
        // We're checking now.
        TBUtils.setting('Notifier', 'lastchecked', '', now);
        
        //
        // Messages
        //
        
        // The reddit api is silly sometimes, we want the title or reported comments and there is no easy way to get it, so here it goes: 
        // a silly function to get the title anyway. The $.getJSON is wrapped in a function to prevent if from running async outside the loop.
        
        function getcommentitle(unreadcontexturl, unreadcontext, unreadauthor, unreadbody_html) {
            $.getJSON(unreadcontexturl, function (jsondata) {
                var commenttitle = jsondata[0].data.children[0].data.title;
                TBUtils.notification('New reply:' + commenttitle + ' from:' + unreadauthor, $(unreadbody_html).text().substring(0, 400) +
                    '...', 'http://www.reddit.com' + unreadcontext);
            });
        }
        
        // getting unread messages
        $.getJSON('http://www.reddit.com/message/unread.json', function (json) {
            var count = json.data.children.length || 0;
			TBUtils.setting('Notifier', 'unreadmessagecount', '', count);
            updateMessagesCount(count);
            if (count === 0) return;
            // Are we allowed to show a popup?
            if (messageNotifications == 'on') {
                if (count > unreadMessageCount) {
                    
                if (consolidatedMessages) {
				var messageamount = count - unreadMessageCount;
				var notifcationbody; //huh?
                
				if (messageamount == 1) {
                    notifcationbody = 'There is one new message in your inbox';
				} else {
                    notifcationbody = 'There are ' + messageamount.toString(2) + ' new messages in your inbox';
				}
                TBUtils.notification('New messages', notifcationbody, 'http://www.reddit.com/message/unread');
                } else {
                    // set up an array in which we will load the last 100 messages that have been displayed. 
                    // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.								
                    var pushedunread = JSON.parse(localStorage['Toolbox.Notifier.unreadpushed'] || '[]');
                    for (var i = 0; i < count; i++) {
                        
                        if ($.inArray(json.data.children[i].data.name, pushedunread) == -1 && json.data.children[i].kind == 't1') {
                            
                            var context = json.data.children[i].data.context;
                            body_html = TBUtils.htmlDecode(json.data.children[i].data.body_html);
                            
                            author = json.data.children[i].data.author;
                            var contexturl = 'http://www.reddit.com' + context.slice(0, -10) + '.json';
                            getcommentitle(contexturl, context, author, body_html);
                            pushedunread.push(json.data.children[i].data.name);
                            
                            // if it is a personal message, or some other unknown idea(future proof!)  we use this code block        
                        } else if ($.inArray(json.data.children[i].data.name, pushedunread) == -1) {
                            author = json.data.children[i].data.author;
                            body_html = TBUtils.htmlDecode(json.data.children[i].data.body_html);
                            //var subject = htmlDecode(json.data.children[i].data.subject);
                            var id = json.data.children[i].data.id;
                            
                            TBUtils.notification('New message from:' + author, $(body_html).text().substring(0, 400) + '...', 'http://www.reddit.com/message/messages/' + id);
                            pushedunread.push(json.data.children[i].data.name);
                        }
                    }
                    if (pushedunread.length > 100) {
                        pushedunread.splice(0, 100 - pushedunread.length);
                    }
                    TBUtils.setting('Notifier', 'unreadpushed', '', pushedunread);
					}
                }
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
            TBUtils.setting('Notifier', 'modqueuecount', '', count);
            if (count === 0) return;
            
            if (modNotifications == 'on') {
                // Ok let's have a look and see if there are actually new items to display 
                if (count > modqueueCount) {
                    
                if (consolidatedMessages) {
				var modqueamount = count - modqueueCount;
				var notifcationbody; // huh?
				
				if (modqueamount == 1) {
                    notifcationbody = 'There is one new item in modqueue';
				} else {
                    notifcationbody = 'There are ' + modqueamount.toString(2) + ' new items in modqueue';
				}
                TBUtils.notification('New modqueue items', notifcationbody , 'http://www.reddit.com/r/' + modSubreddits + '/about/modqueue');
                } else {
                    // set up an array in which we will load the last 100 items that have been displayed. 
                    // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.								
                    var pusheditems = JSON.parse(localStorage['Toolbox.Notifier.modqueuepushed'] || '[]');
                    for (var i = 0; i < count; i++) {
                        if ($.inArray(json.data.children[i].data.name, pusheditems) == -1 && json.data.children[i].kind == 't3') {
                            
                            var mqpermalink = item.data.permalink,
                                mqtitle = item.data.title,
                                mqauthor = item.data.author,
                                mqsubreddit = item.data.subreddit;
                                
                            TBUtils.notification('Modqueue: /r/' + mqsubreddit + ' - post', mqtitle + ' By: ' + mqauthor, 'http://www.reddit.com' + mqpermalink);
                            pusheditems.push(item.data.name);
                        } else if ($.inArray(item.data.name, pusheditems) == -1) {
                            var reportauthor = item.data.author,
                                idname = item.data.name,
                                linkid = 'http://www.reddit.com/api/info.json?id=' + item.data.link_id;
                                
                            //since we want to add some adition details to this we call the previous declared function
                            procesmqcomments(linkid, reportauthor, idname);
                            pusheditems.push(item.data.name);
                        }
                    }
                    
                    if (pusheditems.length > 100) {
                        pusheditems.splice(0, 100 - pusheditems.length);
                    }
                    TBUtils.setting('Notifier', 'modqueuepushed', '', pusheditems);
					}
                }
            }
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
            if (modmailNotifications) {
            if (count > modmailCount) { // ^ these should be a single check.
                
                if (consolidatedMessages) {
				var modmailamount = count - modmailCount;
                var notifcationbody;
                
				if (modmailamount == 1) {
                    notifcationbody = 'There is one new message in modmail.';
				} else {
                    notifcationbody = 'There are ' + modmailamount.toString(2) + ' new messages in modmail';
				}
				
                TBUtils.notification('New modmail messages', notifcationbody, 'http://www.reddit.com/message/moderator/');
                } else {
                    for (var i = 0; i < count; i++) {
                        
					// $.log(TBUtils.setting('ModMailPro', 'hideinvitespam', false));
                        var pushedmodmail = JSON.parse(localStorage['Toolbox.Notifier.modmailpushed'] || '[]');
                        
                        if (TBUtils.setting('ModMailPro', 'hideinvitespam', false) && (json.data.children[i].data.subject == 'moderator invited' || json.data.children[i].data.subject == 'moderator added')) {
                            invitespamid = json.data.children[i].data.name;
                            
                            $.post('/api/read_message', {
                                id: invitespamid,
                                uh: reddit.modhash,
                                api_type: 'json'
                            });
                        } else {
                            if ($.inArray(json.data.children[i].data.name, pushedmodmail) == -1) {
                                var modmailbody = json.data.children[i].data.body;
                                modmailsubject = json.data.children[i].data.subject;
                                modmailsubreddit = json.data.children[i].data.subreddit;
                                modmailpermalink = json.data.children[i].data.id;
                                
                                TBUtils.notification('Modmail: /r/' + modmailsubreddit + ' : ' + modmailsubject, modmailbody, 'http://www.reddit.com/message/messages/' + modmailpermalink);
                                
                                
                            }
                        }
                        if (pushedmodmail.length > 100) {
                            pushedmodmail.splice(0, 100 - pushedmodmail.length);
                        }
                        TBUtils.setting('Notifier', 'modmailpushed', '', pushedmodmail);
                        
                    }
                    
                }
            }
            
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