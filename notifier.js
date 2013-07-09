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
// @version 1.3
// ==/UserScript==

function tbnoti() {
    if (!reddit.logged) return;

    //
    // preload some generic variables 
    //
    var checkInterval = TBUtils.setting('Notifier', 'checkinterval', 1*60*1000), //default to check every minute for new stuff.
        modnotifications = localStorage['Toolbox.Notifier.modnotifications'] || 'on',
        messagenotifications = localStorage['Toolbox.Notifier.messagenotifications'] || 'on',
        modsubreddits = localStorage['Toolbox.Notifier.modsubreddits'] || 'mod',
        unmoderatedsubreddits = localStorage['Toolbox.Notifier.unmoderatedsubreddits'] || 'mod',
        shortcuts = localStorage['Toolbox.Notifier.shortcuts'] || '-',
        modbarhidden = TBUtils.setting('Notifier', 'modbarhidden', false),
        footer =  $('.footer-parent');
 
    	
    var icon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHaSURBVDjLlZO7a1NRHMfzfzhIKQ5OHR1ddRRBLA6lg4iT\
                d5PSas37YR56Y2JiHgg21uoFxSatCVFjbl5iNBBiMmUJgWwZhCB4pR9/V4QKfSQdDufF5/v7nu85xwJYprV0Oq0kk8luIpEw4vG48f/eVDiVSikCTobDIePxmGg0yokEBO4OBgNGoxH5fJ5wOHwygVgsZpjVW60WqqqWz\
                bVgMIjf78fn8xlTBcTy736/T7VaJRQKfQoEArqmafR6Pdxu9/ECkUjkglje63Q6NBoNisUihUKBcrlMpVLB6XR2D4df3VQnmRstsWzU63WazSZmX6vV0HWdUqmEw+GY2Gw25SC8dV1l1wrZNX5s3qLdbpPL5fB6vXumZal\
                q2O32rtVqVQ6GuGnCd+HbFnx9AZrC+MkSHo/np8vlmj/M7f4ks6yysyawgB8fwPv70HgKG8v8cp/7fFRO/+AllewqNJ/DhyBsi9A7J1QTkF4E69mXRws8u6ayvSJwRqoG4K2Md+ygxyF5FdbPaMfdlIXUZfiyAUWx/OY25O\
                4JHBP4CtyZ16a9EwuRi1CXs+5K1ew6lB9DXERX517P8tEsPDzfNIP6C5YeQewSrJyeCd4P0bnwXYISy3MCn5oZNtsf3pH46e7XBJcAAAAASUVORK5CYII=';
				
 
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
        rtscomment = TBUtils.setting('ModTools', 'rtscomment', true);
        
        

    //
    // UI elements 
    //

    // toolbar, this will display all counters, quick links and other settings for the toolbox
    var modbar = $('\
    <div id="tb-bottombar" class="tb-toolbar">\
        <a class="tb-bottombar-hide" href="javascript:void(0)">hide</a>&nbsp;&nbsp;\
        <a class="tb-toolbar tb-toolbarsettings" href="javascript:void(0)"><img src="data:image/png;base64,'+ icon +'" /></a>\
        <span id="tb-toolbarshortcuts">' + unescape(shortcuts) + '</span>\
        <span id="tb-toolbarcounters">\
			<a title="no mail" href="http://www.reddit.com/message/inbox/" class="nohavemail" id="tb-mail"></a> \
			<a href="http://www.reddit.com/message/inbox/" class="tb-toolbar" id="tb-mailCount">[0]</a>\
			<a title="modqueue" href="http://www.reddit.com/r/' + modsubreddits + '/about/modqueue" id="tb-modqueue"></a> \
			<a href="http://www.reddit.com/r/' + modsubreddits + '/about/modqueue" class="tb-toolbar" id="tb-queueCount">[0]</a>\
			<a title="unmoderated" href="http://www.reddit.com/r/' + unmoderatedsubreddits + '/about/unmoderated" id="tb-unmoderated"></a>\
			<a href="http://www.reddit.com/r/' + unmoderatedsubreddits + '/about/unmoderated" class="tb-toolbar" id="tb-unmoderatedcount">[0]</a> \
			<a title="modmail" href="http://www.reddit.com/message/moderator/unread/" id="tb-modmail" class="nohavemail"></a>\
			<a href="http://www.reddit.com/message/moderator/unread/" class="tb-toolbar" id="tb-modmailcount">[0]</a>\
		</span>\
	</div>');
    
    var modbarhid = $('\
    <div id="tb-bottombar-hidden" class="tb-toolbar">\
       <a class="tb-bottombar-unhide" href="javascript:void(0)">show</a>\
    </div>');
    
    $(footer).prepend(modbar);
    $(footer).prepend(modbarhid);
    function toggleMenuBar(hidden) {
        if (hidden) {
            $(modbar).hide();
            $(modbarhid).show();
        } else {
            $(modbar).show();
            $(modbarhid).hide();
        }
        TBUtils.setting('Notifier', 'modbarhidden', '', hidden);
    }
    toggleMenuBar(modbarhidden);
    
    // Show/hide menubar
    $('body').delegate('.tb-bottombar-unhide, .tb-bottombar-hide', 'click', function (e) {
        toggleMenuBar($(e.target).hasClass('tb-bottombar-hide'));
    });

    // Settings menu	

    function showSettings() {

        // I probably should have stored "checked" instead of "on" will have to change that later. 
        var modnotificationschecked;
        var messagenotificationschecked;

        if (modnotifications == 'on') {
            modnotificationschecked = 'checked';
        }

        if (messagenotifications == 'on') {
            messagenotificationschecked = 'checked';
        }


		// The window in which all settings will be showed. 
        var html = '\
            <div class="tb-page-overlay tb-settings">\
            <div class="tb-window-wrapper">\
            <div class="tb-window-header"> Notifier Configuration <span class="tb-window-header-options"><a class="tb-help" href="javascript:;" currentpage="">?</a> - <a class="tb-close" href="javascript:;">X</a></span></div>\
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
				<label><input type="checkbox" name="messagenotifications" ' + messagenotificationschecked + '> Get notifications for new messages</label>\
			</p>\
			<p>\
				<label><input type="checkbox" name="modnotifications" ' + modnotificationschecked + '> Get modqueue notifications</label>\
			</p>\
			<p>\
				Shortcuts (carefull! takes full html):<br>\
				<input type="text" name="shortcuts">\
				</p>\
			<p>\
				Multireddit of subs you want displayed in the modqueue counter:<br>\
				<input type="text" name="modsubreddits">\
			</p>\
			<p>\
				Multireddit of subs you want displayed in the unmoderated counter:<br>\
				<input type="text" name="unmoderatedsubreddits">\
			</p>\
			<div class="tb-help-content">Edit toolbar stuff</div>\
            ';
            $(htmltoolbar).appendTo('.tb-window-content');
			$('<a href="javascript:;" class="tb-window-content-toolbar">Toolbar Settings</a>').appendTo('.tb-window-tabs');
			$('.tb-help').attr('currentpage', 'tb-window-content-toolbar');
		
        $("input[name=shortcuts]").val(unescape(shortcuts));
        $("input[name=modsubreddits]").val(unescape(modsubreddits));
        $("input[name=unmoderatedsubreddits]").val(unescape(unmoderatedsubreddits));

		
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
			<div class="tb-help-content">Here you can disable the several toolbox modules.</div>\
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
			<div class="tb-help-content">Settings for Mod Tools Enhanced.</div>\
			</div>\
            ';
			if (mteEnabled) {
                $(htmlmodtools).appendTo('.tb-window-content').hide();
                $('<a href="javascript:;" class="tb-window-content-modtools">Mod Tools</a>').appendTo('.tb-window-tabs');
			}
    }
    
    // Open the settings
    $('body').delegate('.tb-toolbarsettings', 'click', function () {
        showSettings();
    });

    // change tabs 
	$('body').delegate('.tb-window-tabs a', 'click', function() { 
		var tab = $(this).attr('class');
		$('.tb-help').attr('currentpage', tab);
		$('.tb-window-content').children().hide(); 
		$('div.'+tab).show();
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

        shortcuts = escape($("input[name=shortcuts]").val());
        localStorage['Toolbox.Notifier.shortcuts'] = shortcuts;

        modsubreddits = $("input[name=modsubreddits]").val();
        localStorage['Toolbox.Notifier.modsubreddits'] = modsubreddits;

        unmoderatedsubreddits = $("input[name=unmoderatedsubreddits]").val();
        localStorage['Toolbox.Notifier.unmoderatedsubreddits'] = unmoderatedsubreddits;

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

        $('.tb-settings').remove();
        $('body').css('overflow', 'auto');
        window.location.reload();
    });


    $('body').delegate('.tb-help', 'click', function () {
        var tab = $(this).attr('currentpage');
		tab = '.'+tab;
        var helpwindow = window.open('', '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');
        var htmlcontent = $(tab).find('.tb-help-content').html();
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
        var unreadmessagecount = TBUtils.setting('Notifier', 'unreadmessagecount', 0), 
            modqueuecount = TBUtils.setting('Notifier', 'modqueuecount', 0), 
            unmoderatedcount = TBUtils.setting('Notifier', 'unmoderatedcount', 0),
            modmailcount = TBUtils.setting('Notifier', 'modmailcount', 0),
            lastchecked = TBUtils.setting('Notifier', 'lastchecked', -1),
            author = '',
            body_html = '',
            now = new Date().getTime();
        
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
            console.log('Checked less than check interval, likely running on another page, or a reload.');
            updateMessagesCount(unreadmessagecount);
            updateModqueueCount(modqueuecount);
            updateUnmodCount(unmoderatedcount);
            updateModMailCount(modmailcount);
            return;
        }
        
        // We're checking now.
        TBUtils.setting('Notifier', 'lastchecked', '', now);
        console.log('cheicking now');
        
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
            if (messagenotifications == 'on') {
                if (count > unreadmessagecount) {
                    
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
        $.getJSON('http://www.reddit.com/r/' + modsubreddits + '/about/modqueue.json?limit=100', function (json) {
            var count = json.data.children.length || 0;
            updateModqueueCount(count);
            TBUtils.setting('Notifier', 'modqueuecount', '', count);
            if (count === 0) return;
            
            if (modnotifications == 'on') {
                // Ok let's have a look and see if there are actually new items to display 
                if (count > modqueuecount) {
                    
                    // set up an array in which we will load the last 100 items that have been displayed. 
                    // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.								
                    var pusheditems = JSON.parse(localStorage['Toolbox.Notifier.modqueuepushed'] || '[]');
                    $(pusheditems).each(function(item) {
                        
                        if ($.inArray(item.data.name, pusheditems) == -1 && item.kind == 't3') {
                            
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
                    });
                    
                    if (pusheditems.length > 100) {
                        pusheditems.splice(0, 100 - pusheditems.length);
                    }
                    TBUtils.setting('Notifier', 'modqueuepushed', '', pusheditems);
                }
            }
        });
        
        //
        // Unmoderated
        //
        
        // getting unmoderated, for now only a counter, otherwise it might be to much with the notifications
        $.getJSON('http://www.reddit.com/r/' + unmoderatedsubreddits + '/about/unmoderated.json?limit=100', function (json) {
            var count = json.data.children.length || 0;
            TBUtils.setting('Notifier', 'unmoderatedcount', '', count);
            updateUnmodCount(count);
        });
        
        //
        // Modmail
        //
        
        // getting unread modmail, will not show replies because... well the api sucks in that regard.
        $.getJSON('http://www.reddit.com/message/moderator.json', function (json) {
            var count = json.data.children.length || 0;
            if (count === 0) {
                TBUtils.setting('Notifier', 'modmailcount', '', count);
                updateModMailCount(count);
                return;
            }
            
            var lastSeen = TBUtils.setting('Notifier', 'lastseenmodmail', -1),
                newIdx = '',
                title = '',
                text = '',
                newCount = 0;
            
            for (var i = 0; i < json.data.children.length; i++) {
                var messageTime = json.data.children[i].data.created_utc * 1000;
                
                if (!lastSeen || messageTime > lastSeen) {
                    newCount++;
                    if (!newIdx) { newIdx = i; }
                }
            }
            
            // Don't show the message twice.
            if (newCount === modmailcount) return;
            
            console.log('New messages: ', newCount);
            
            if (newCount == 1) {
                var message = json.data.children[newIdx];
                title = '/r/' + message.data.subreddit + ': ' + message.data.subject;
                text = 'From: /u/' + message.data.author + '\n' + message.data.body;
            } else if (newCount > 1) {
                title = 'New Mod Mail!';
                text = 'You have ' + newCount + ' new mod mail thead' + (newCount == 1 ? '': 's');
            }
                
            if (newCount > 0) {
                TBUtils.notification(title, text, 'http://www.reddit.com/message/moderator');
            }
            TBUtils.setting('Notifier', 'modmailcount', '', newCount);
            updateModMailCount(newCount);
            
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