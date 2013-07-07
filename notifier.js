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
// @version 1.2
// ==/UserScript==

function tbnoti() {
    if (!reddit.logged) return;

    //
    // preload some generic variables 
    //
    var modnotifications = localStorage['Toolbox.Notifier.modnotifications'] || 'on',
        messagenotifications = localStorage['Toolbox.Notifier.messagenotifications'] || 'on',
        modsubreddits = localStorage['Toolbox.Notifier.modsubreddits'] || 'mod',
        unmoderatedsubreddits = localStorage['Toolbox.Notifier.unmoderatedsubreddits'] || 'mod',
        shortcuts = localStorage['Toolbox.Notifier.shortcuts'] || '-',
        unreadmessagecount = localStorage['Toolbox.Notifier.unreadmessagecount'] || '0',
        modqueuecount = localStorage['Toolbox.Notifier.modqueuecount'] || '0',
        unmoderatedcount = localStorage['Toolbox.Notifier.unmoderatedcount'] || '0',
        modmailcount = localStorage['Toolbox.Notifier.modmailcount'] || '0';

    // Module settings.
    var mmpEnabled = TBUtils.setting('ModMailPro', 'enabled', true),
        mbEnabled = TBUtils.setting('ModButton', 'enabled', true),
        mteEnabled = TBUtils.setting('ModTools', 'enabled', true),
        notesEnabled = TBUtils.setting('UserNotes', 'enabled', true),
        dtagEnabled = TBUtils.setting('DomainTagger', 'enabled', true),
        configEnabled = TBUtils.setting('TBConfig', 'enabled', true),
        stattitEnabled = TBUtils.setting('StattitTab', 'enabled', true);

    //
    // generic functions
    //    

    // easy way to simulate the php html encode and decode functions

    function htmlEncode(value) {
        //create a in-memory div, set it's inner text(which jQuery automatically encodes)
        //then grab the encoded contents back out.  The div never exists on the page.
        return $('<div/>').text(value).html();
    }

    function htmlDecode(value) {
        return $('<div/>').html(value).text();
    }

    //
    // UI elements 
    //

    // toolbar, this will display all counters, quick links and other settings for the toolbox
    $('.footer-parent').prepend('\
    <div id="tb-bottombar" class="tb-toolbar">\
		<a class="tb-toolbar tb-toolbarsettings" href="javascript:void(0)">Settings</a>\
		<span id="tb-toolbarshortcuts">' + unescape(shortcuts) + '</span>\
		<span id="tb-toolbarcounters">\
			<a title="no mail" href="http://www.reddit.com/message/inbox/" class="nohavemail" id="tb-mail"></a> \
			<a href="http://www.reddit.com/message/unread" class="tb-toolbar" id="tb-mailCount">[' + unreadmessagecount + '] </a>\
			<a title="modqueue" href="http://www.reddit.com/r/' + modsubreddits + '/about/modqueue" id="tb-modqueue"></a> \
			<a href="http://www.reddit.com/r/' + modsubreddits + '/about/modqueue" class="tb-toolbar" id="tb-queueCount">[' + modqueuecount + ']</a>\
			<a title="unmoderated" href="http://www.reddit.com/r/' + unmoderatedsubreddits + '/about/unmoderated" id="tb-unmoderated"></a>\
			<a href="http://www.reddit.com/r/' + unmoderatedsubreddits + '/about/unmoderated" class="tb-toolbar" id="tb-unmoderatedcount">[' + unmoderatedcount + ']</a> \
			<a title="modmail" href="http://www.reddit.com/message/moderator/unread/" id="tb-modmail" class="nohavemail"></a>\
			<a href="http://www.reddit.com/message/moderator/unread/" class="tb-toolbar" id="tb-modmailcount">[' + modmailcount + ']</a>\
		</span>\
	</div>');

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
				Get notifications for new messages?<br>\
				<input type="checkbox" name="messagenotifications" ' + messagenotificationschecked + '>\
			</p>\
			<p>\
				Get modqueue notifications? <br>\
				<input type="checkbox" name="modnotifications" ' + modnotificationschecked + '>\
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
            $(htmltoolbar).appendTo('.tb-window-content')	
			$('<a href="javascript:;" class="tb-window-content-toolbar">Toolbar Settings</a>').appendTo('.tb-window-tabs');
			$('.tb-help').attr('currentpage', 'tb-window-content-toolbar');
		
        $("input[name=shortcuts]").val(unescape(shortcuts));
        $("input[name=modsubreddits]").val(unescape(modsubreddits));
        $("input[name=unmoderatedsubreddits]").val(unescape(unmoderatedsubreddits));

		
		// Settings to toggle the modules 
		var htmlmodules = '\
		<div class="tb-window-content-modules">\
		    		<p>\
				Enable ModMailPro? <br>\
				<input type="checkbox" id="mmpEnabled" ' + ((mmpEnabled) ? "checked" : "") + '>\
			</p>\
        	<p>\
				Enable ModButton? <br>\
				<input type="checkbox" id="mbEnabled" ' + ((mbEnabled) ? "checked" : "") + '>\
			</p>\
        	<p>\
				Enable Mod Tools Enhanced? <br>\
				<input type="checkbox" id="mteEnabled" ' + ((mteEnabled) ? "checked" : "") + '>\
			</p>\
        	<p>\
				Enable User Notes? <br>\
				<input type="checkbox" id="notesEnabled" ' + ((notesEnabled) ? "checked" : "") + '>\
			</p>\
        	<p>\
				Enable Domain Tagger? <br>\
				<input type="checkbox" id="dtagEnabled" ' + ((dtagEnabled) ? "checked" : "") + '>\
			</p>\
        	<p>\
				Enable Toolbox Config? <br>\
				<input type="checkbox" id="configEnabled" ' + ((configEnabled) ? "checked" : "") + '>\
			</p>\
        	<p>\
				Enable Stattit Tab? <br>\
				<input type="checkbox" id="stattitEnabled" ' + ((stattitEnabled) ? "checked" : "") + '>\
			</p>\
			<div class="tb-help-content">Here you can disable the several toolbox modules.</div>\
			</div>\
            ';
			$(htmlmodules).appendTo('.tb-window-content').hide();;
			$('<a href="javascript:;" class="tb-window-content-modules">Toggle Modules</a>').appendTo('.tb-window-tabs');

			

    }

    // Open the settings
    $('body').delegate('.tb-toolbarsettings', 'click', function () {
        showSettings();
    });

    // change tabs 
	$('body').delegate('.tb-window-tabs a', 'click', function() { 
	console.log('tab toggle');
		var tab = $(this).attr('class');
		console.log(tab);
		console.log($('.tb-window-content').children());
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

        $('.tb-settings').remove();
        $('body').css('overflow', 'auto');
    });


    $('body').delegate('.tb-help', 'click', function () {
	    var tab = $(this).attr('currentpage');
		tab = '.'+tab;
		console.log(tab);
        var helpwindow = window.open('', '', 'width=500,height=600,location=0,menubar=0,top=100,left=100')
        var htmlcontent = $(tab).find('.tb-help-content').html();
		console.log(htmlcontent);
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
        //console.log(localStorage.getItem('Toolbox.Notifier.unreadmessagecount'));
        // get some of the variables again, since we need to determine if there are new messages to display and counters to update.
        var unreadmessagecount = localStorage['Toolbox.Notifier.unreadmessagecount'] || '0',
            modqueuecount = localStorage['Toolbox.Notifier.modqueuecount'] || '0',
            unmoderatedcount = localStorage['Toolbox.Notifier.unmoderatedcount'] || '0',
            modmailcount = localStorage['Toolbox.Notifier.modmailcount'] || '0';
        //console.log('unreadmessagecount: ' + unreadmessagecount);
        //
        // Messages
        //

        // the reddit api is silly sometimes, we want the title or reported comments and there is no easy way to get it, so here it goes: a silly function to get the title anyway. The $.getJSON is wrapped in a function to prevent if from running async outside the loop.

        function getcommentitle(unreadcontexturl, unreadcontext, unreadauthor, unreadbody_html) {
            $.getJSON(unreadcontexturl, function (jsondata) {
                var commenttitle = jsondata[0].data.children[0].data.title;
                TBUtils.notification('New reply:' + commenttitle + ' from:' + unreadauthor, $(unreadbody_html).text().substring(0, 400) + '...', 'http://www.reddit.com' + unreadcontext);
            });
        }
        // getting unread messages
        $.getJSON('http://www.reddit.com/message/unread.json', function (json) {
            //console.log('unreadmessagecount2: ' + unreadmessagecount);
            if (json.data.children == '') {

                unreadmessagecount = 0;
                $('#mailCount').html('');
                $('#tb-mailCount').html('[0]');
                // here we wil set the new value for dcunreamessagedcount. a function call to change counters will also be here
                localStorage['Toolbox.Notifier.unreadmessagecount'] = unreadmessagecount;
                $('#mail').attr('class', 'nohavemail');
                $('#mail').attr('title', 'no new mail!');
                $('#tb-mail').attr('class', 'nohavemail');
                $('#tb-mail').attr('title', 'no new mail!');
                $('#tb-mail').attr('href', 'http://www.reddit.com/message/inbox');
            } else {

                // here we wil set the new value for unreadmessagecount.
                $('#mail').attr('class', 'havemail');
                $('#mail').attr('title', 'new mail!');
                $('#mailCount').html('[' + json.data.children.length + ']');
                $('#tb-mail').attr('class', 'havemail');
                $('#tb-mail').attr('title', 'new mail!');
                $('#tb-mail').attr('href', 'http://www.reddit.com/message/unread');
                $('#tb-mailCount').html('[' + json.data.children.length + ']');
                //console.log('unreadmessagecount3: ' + unreadmessagecount);
                // Are we allowed to show a popup?
                if (messagenotifications == 'on') {
                    if (json.data.children.length > unreadmessagecount) {
                        //console.log('go ahead for a popup!');
                        var unreadmessagecounter = (json.data.children.length - unreadmessagecount);
                        var unreadmessageamount = json.data.children.length;

                        // set up an array in which we will load the last 100 messages that have been displayed. 
                        // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.								
                        var pushedunread = new Array();
                        pushedunread = JSON.parse(localStorage['Toolbox.Notifier.unreadpushed'] || '[]');
                        for (var i = 0; i < unreadmessageamount; i++) {

                            if ($.inArray(json.data.children[i].data.name, pushedunread) == -1 && json.data.children[i].kind == 't1') {

                                var context = json.data.children[i].data.context;
                                var body_html = htmlDecode(json.data.children[i].data.body_html);

                                var author = json.data.children[i].data.author;
                                var contexturl = 'http://www.reddit.com' + context.slice(0, -10) + '.json';
                                getcommentitle(contexturl, context, author, body_html);
                                pushedunread.push(json.data.children[i].data.name);

                                // if it is a personal message, or some other unknown idea(future proof!)  we use this code block        
                            } else if ($.inArray(json.data.children[i].data.name, pushedunread) == -1) {
                                var author = json.data.children[i].data.author;
                                var body_html = htmlDecode(json.data.children[i].data.body_html);
                                var subject = htmlDecode(json.data.children[i].data.subject);
                                var id = json.data.children[i].data.id;
                                
                                TBUtils.notification('New message from:' + author, $(body_html).text().substring(0, 400) + '...', 'http://www.reddit.com/message/messages/' + id);
                                pushedunread.push(json.data.children[i].data.name);
                                
                            }
                            
                        }
                        if (pushedunread.length > 100) {
                            pushedunread.splice(0, 100 - pushedunread.length);
                        }

                        localStorage['Toolbox.Notifier.unreadpushed'] = JSON.stringify(pushedunread);
                    }
                }
                // Write the new variable to localstorage
                localStorage['Toolbox.Notifier.unreadmessagecount'] = json.data.children.length;
            }
        });
        //
        // Modqueue
        //

        // wrapper around $.getJSON so it can be part of a loop

        function procesmqcomments(mqlinkid, mqreportauthor, mqidname) {
            $.getJSON(mqlinkid, function (jsondata) {
                var infopermalink = jsondata.data.children[0].data.permalink;
                var infotitle = jsondata.data.children[0].data.title;
                var infosubreddit = jsondata.data.children[0].data.subreddit;
                infopermalink = infopermalink + mqidname.substring(3);
                TBUtils.notification('Modqueue - /r/' + infosubreddit + ' - comment:', mqreportauthor + '\'s comment in ' + infotitle, 'http://www.reddit.com' + infopermalink + '?context=3');
            });
        }
        // getting modqueue
        $.getJSON('http://www.reddit.com/r/' + modsubreddits + '/about/modqueue.json?limit=100', function (json) {
            // check if there are items in the modqueue
            if (json.data.children == '') {

                modqueuecount = 0;
                $('#modqueuecount').html('[0]');
                // here we wil set the new value for modqueuecount, disabled so it will keep showing messages for debugging. This will also be used in order to change the counters in the toolbar to the correct value.
                localStorage['Toolbox.Notifier.modqueuecount'] = modqueuecount;
            } else {
                var mqitemsinqueue = json.data.children.length;

                if (modnotifications == 'on') {
                    // Ok let's have a look and see if there are actually new items to display 
                    if (json.data.children.length > modqueuecount) {

                        var modqueecounter = (json.data.children.length - modqueuecount);
                        var modqueecountersecond = (json.data.children.length - modqueecounter - 1);
                        var modqueeamount = json.data.children.length;
                        // set up an array in which we will load the last 100 items that have been displayed. 
                        // this is done through a array since the modqueue is in chronological order of post date, so there is no real way to see what item got send to queue first.								
                        var pusheditems = new Array();
                        pusheditems = JSON.parse(localStorage['Toolbox.Notifier.modqueuepushed'] || '[]');
                        console.log(pusheditems);
                        console.log('ok0');
                        for (var i = 0; i < modqueeamount; i++) {



                            if ($.inArray(json.data.children[i].data.name, pusheditems) == -1 && json.data.children[i].kind == 't3') {
                                console.log('ok1' + i);

                                var mqpermalink = json.data.children[i].data.permalink;

                                var mqtitle = json.data.children[i].data.title;

                                var mqauthor = json.data.children[i].data.author;

                                var mqsubreddit = json.data.children[i].data.subreddit;

                                TBUtils.notification('Modqueue: /r/' + mqsubreddit + ' - post', mqtitle + ' By: ' + mqauthor, 'http://www.reddit.com' + mqpermalink);
                                pusheditems.push(json.data.children[i].data.name);


                            } else if ($.inArray(json.data.children[i].data.name, pusheditems) == -1) {
                                var reportauthor = json.data.children[i].data.author;

                                var idname = json.data.children[i].data.name;

                                var linkid = 'http://www.reddit.com/api/info.json?id=' + json.data.children[i].data.link_id;
                                //since we want to add some adition details to this we call the previous declared function
                                procesmqcomments(linkid, reportauthor, idname);
                                pusheditems.push(json.data.children[i].data.name);

                            }
                        }

                        if (pusheditems.length > 100) {
                            pusheditems.splice(0, 100 - pusheditems.length);
                        }

                        localStorage['Toolbox.Notifier.modqueuepushed'] = JSON.stringify(pusheditems);



                    }




                }
                localStorage['Toolbox.Notifier.modqueuecount'] = json.data.children.length;
                $('#tb-queueCount').html('[' + json.data.children.length + ']');
            }
        });
        //
        // Unmoderated
        //

        // getting unmoderated, for now only a counter, otherwise it might be to much with the notifications
        $.getJSON('http://www.reddit.com/r/' + unmoderatedsubreddits + '/about/unmoderated.json', function (json) {
            // check if there are items in the modqueue
            if (json.data.children == '') {

                unmoderatedcount = 0;
                $('#tb-unmoderatedcount').html('[0]');
                // here we wil set the new value for unmoderatedcount, disabled so it will keep showing messages for debugging. This will also be used in order to change the counters in the toolbar to the correct value.
                localStorage['Toolbox.Notifier.unmoderatedcount'] = unmoderatedcount;
            } else {
                var itemsinqueue = json.data.children.length;

                $('#tb-unmoderatedcount').html('[' + itemsinqueue + ']');
                // check if it can come out and play or already did last time
                localStorage['Toolbox.Notifier.unmoderatedcount'] = json.data.children.length;
            }
        });

        //
        // Unmoderated
        //

        // getting unread modmail, will not show replies because... well the api sucks in that regard.
        $.getJSON('http://www.reddit.com/message/moderator/unread.json', function (json) {
            // check if there are items in the modqueue
            if (json.data.children == '') {

                modmailcount = 0;
                $('#tb-modmailcount').html('[0]');
                $('#tb-modmail').attr('class', 'nohavemail');
                $('#tb-modmail').attr('title', 'no new mail!');
                $('#tb-modmail').attr('href', 'http://www.reddit.com/message/moderator/');

                localStorage['Toolbox.Notifier.modmailcount'] = modmailcount;
            } else {

                $('#modmail').attr('class', 'havemail');
                $('#modmail').attr('title', 'new mail!');
                $('#tb-modmail').attr('class', 'havemail');
                $('#tb-modmail').attr('title', 'new mail!');
                $('#tb-modmail').attr('href', 'http://www.reddit.com/message/moderator/unread/');
                var modmailcount = json.data.children.length

                $('#tb-modmailcount').html('[' + modmailcount + ']');
                localStorage['Toolbox.Notifier.modmailcount'] = modmailcount;
            }
        });

    }
    // How often we check for new messages, this will later be adjustable in the settings. 
    var timer = setInterval(getmessages, 30000);
    getmessages();
}

// Add script to page
(function () {

    // Check if we are running as an extension
    if (typeof chrome !== "undefined" && chrome.extension) {
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