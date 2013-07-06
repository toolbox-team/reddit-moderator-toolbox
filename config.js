// ==UserScript==
// @name        Toolbox Config
// @namespace   http://www.reddit.com/r/toolbox
// @author      agentlame, creesch
// @description Edit toolbox configuration settings.
// @include     http://www.reddit.com/*
// @include     http://reddit.com/*
// @include     http://*.reddit.com/*
// @downloadURL http://userscripts.org/scripts/source/170952.user.js
// @version     1.2
// ==/UserScript==

function tbconf() {   
    if (!reddit.logged || !TBUtils.setting('TBConfig', 'enabled', true)) return;
    
    var icon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHaSURBVDjLlZO7a1NRHMfzfzhIKQ5OHR1ddRRBLA6lg4iT\
                d5PSas37YR56Y2JiHgg21uoFxSatCVFjbl5iNBBiMmUJgWwZhCB4pR9/V4QKfSQdDufF5/v7nu85xwJYprV0Oq0kk8luIpEw4vG48f/eVDiVSikCTobDIePxmGg0yokEBO4OBgNGoxH5fJ5wOHwygVgsZpjVW60WqqqWz\
                bVgMIjf78fn8xlTBcTy736/T7VaJRQKfQoEArqmafR6Pdxu9/ECkUjkglje63Q6NBoNisUihUKBcrlMpVLB6XR2D4df3VQnmRstsWzU63WazSZmX6vV0HWdUqmEw+GY2Gw25SC8dV1l1wrZNX5s3qLdbpPL5fB6vXumZal\
                q2O32rtVqVQ6GuGnCd+HbFnx9AZrC+MkSHo/np8vlmj/M7f4ks6yysyawgB8fwPv70HgKG8v8cp/7fFRO/+AllewqNJ/DhyBsi9A7J1QTkF4E69mXRws8u6ayvSJwRqoG4K2Md+ygxyF5FdbPaMfdlIXUZfiyAUWx/OY25O\
                4JHBP4CtyZ16a9EwuRi1CXs+5K1ew6lB9DXERX517P8tEsPDzfNIP6C5YeQewSrJyeCd4P0bnwXYISy3MCn5oZNtsf3pH46e7XBJcAAAAASUVORK5CYII='
                
    var toolbox = $('#moderation_tools').find('.content'),
        configLink = '<li><img src="data:image/png;base64,'+ icon +'" /><span class="separator"></span><a href="javascript:;" class="toolbox-edit">toolbox configuration</a></li>',
        subreddit = reddit.post_site || $('.titlebox h1.redditname a').text();
    
     var config = TBUtils.config;
    
    if (!subreddit) return;
    
    $.getJSON('http://www.reddit.com/r/'+ subreddit +'/wiki/toolbox.json', function(json) {
        if (json.data.content_md)
        {
            config = JSON.parse(json.data.content_md);
        } 
        init();
    }).error(function() {
        init();
    });
    
    function init() {    
        $(toolbox).append(configLink);
    }
    
    $('body').delegate('.toolbox-edit', 'click', function() {
        showSettings();
    });    
    
    function postToWiki(page, data, isJSON, updateAM) {
        TBUtils.postToWiki(page, subreddit, data, isJSON, updateAM, function done(succ, err) {
            if (!succ) console.log(err.responseText);
        });
    }
    
    function showSettings() {
        
        // No reasons storred in the config.  Check the CSS.
        if (!config.removalReasons) {
            TBUtils.getReasosnFromCSS(subreddit, function(resp) {
                if (resp) {
                    $('.reasons-notice').show();
                    
                    // Save old removal reasosns when clicked.
                    $('.update-reasons').click(function() {
                        config.removalReasons = resp;
                        
                        postToWiki('toolbox', config, true);
                        
                        $('.reasons-notice').hide();
                    });
                }
            });
        }           
        
        var html = '\
<div class="tb-page-overlay tb-settings" comment="the white fade out over the page, we can do without, personally like it">\
<div class="tb-window-wrapper" comment="the window itself">\
<div class="tb-window-header" comment="This will contain the name of the window"> Toolbox Configuration <span class="tb-window-header-options"><a class="tb-help" href="javascript:;">?</a> - <a class="tb-close" href="javascript:;">X</a></span></div>\
<div class="tb-window-content" comment="This will contain all other elements, this is basically a wrapper to give is more flexibility in the future">\
\
\
<div class="tb-form">\
<p>\
<a class="reason-settings" href="javascript:;">removal reason settings</a><br>\
<a class="edit-reasons" href="javascript:;">edit removal reasons</a><br>\
<a class="edit-domains" href="javascript:;">domain tags</a><br>\
<!--<a class="tb-local-settings" href="javascript:;">toolbox settings</a><br>-->\
<a href="http://www.reddit.com/r/'+ subreddit +'/wiki/pages" >wiki page listing</a><br><br>\
<a href="javascript:;" class="edit-wiki-page" page="toolbox">edit toolbox config</a><br>\
<a href="javascript:;" class="edit-wiki-page" page="usernotes">edit user notes</a><br>\
<a href="javascript:;" class="edit-wiki-page" page="automoderator">edit automoderator config</a><br>\
<div class="wiki-edit-area" style="display: none;">\
<textarea class="edit-wikidata" rows="20" cols="20"></textarea><br>\
<input class="save-wiki-data" type="button" value="Save Page to Wiki"></input>&nbsp;&nbsp;\
<input class="cancel-wiki-data" type="button" value="Cancel"></input></div>\
</p>\
<div class="reasons-notice" style="display:none;">\
<br><br><p>Removal reasons were found in your CSS but have not been saved to the wiki configuration page.<br />\
You will need to save them to the wiki before you can edit them. &nbsp;Would you like to do so now?<br />\
<a class="update-reasons" href="javascript:;">Save removal reasons to wiki</a> (note: this requires that you have wiki editing permisissions)</p>\
</div></div>\
\
\
</div>\
<div class="tb-window-footer" comment="for the looks">&nbsp;</div>\
<div class="tb-help-content">Choose what you want to edit.</div>\
</div>\
</div>\
        ';
        $(html).appendTo('body').show();
        $('body').css('overflow','hidden');
    }
    
    $('body').delegate('.tb-close', 'click', function() {
        $('.tb-settings').remove();
		$('body').css('overflow','auto');
    });
    
    $('body').delegate('.edit-domains', 'click', function() {
        
        var html = $('\
<div class="tb-page-overlay edit-domains-form " comment="the white fade out over the page, we can do without, personally like it">\
<div class="tb-window-wrapper" comment="the window itself">\
<div class="tb-window-header" comment="This will contain the name of the window"> Edit domains <span class="tb-window-header-options"><a class="tb-help" href="javascript:;">?</a></span></div>\
<div class="tb-window-content" comment="This will contain all other elements, this is basically a wrapper to give is more flexibility in the future">\
\
\
<div class="tb-form">\
<p>import tags from /r/:&nbsp;<input class="importfrom" type="text"/></input> (note: you need to mod wiki in this sub and the import sub.)\
<p><input class="import" type="button" value="import" />&nbsp;&nbsp;&nbsp;<input class="cancel" type="button" value="cancel" /></p>\
<table><tbody /></table></div>\
\
\
</div>\
<div class="tb-window-footer" comment="for the looks">&nbsp;</div>\
<div class="tb-help-content">Help for "edit domains"</div>\
</div>\
</div>\
');
        $(html).appendTo('body').show();

        
        $(html).delegate('.import', 'click', function() {
            
            $.getJSON('http://www.reddit.com/r/'+ $('.importfrom').val() +'/wiki/toolbox.json', function(json) {
                
                if (json.data.content_md)
                {
                    var tags = JSON.parse(json.data.content_md).domainTags;
                    if (tags) {
                        config.domainTags = tags;
                        postToWiki('toolbox', config, true);
                    }
                    $(html).remove();
                }
            });
        });
        
        $(html).delegate('.cancel', 'click', function() {
            $(html).remove();
        }); 
    });
    
    $('body').delegate('.edit-reasons', 'click', function() {
        
        var html = $('\
<div class="tb-page-overlay edit-reasons-form" comment="the white fade out over the page, we can do without, personally like it">\
<div class="tb-window-wrapper" comment="the window itself">\
<div class="tb-window-header" comment="This will contain the name of the window"> Edit reasons <span class="tb-window-header-options"><a class="tb-help" href="javascript:;">?</a></span></div>\
<div class="tb-window-content" comment="This will contain all other elements, this is basically a wrapper to give is more flexibility in the future">\
\
\
<div class="tb-form">\
<p><textarea class="edit-area" style="width: 800px; height: 150px;"></textarea></p>\
<span class="edit-save-area"><input class="save" type="button" value="new"/>&nbsp;&nbsp;&nbsp;<input class="cancel" type="button" value="cancel" />\
&nbsp;&nbsp;(click on a reason below to edit it.)</span><br><br><br>\
<table ><tbody /></table></div>\
\
\
</div>\
<div class="tb-window-footer" comment="for the looks">&nbsp;</div>\
<div class="tb-help-content">\
<h2>Input options:</h2>\
<p>\
<strong>Selection box:</strong><br>\
&lt;select id="contextSelectbox"&gt;<br>\
&lt;option&gt;Option 1&lt;/option&gt;<br>\
&lt;option&gt;Option 2&lt;/option&gt;<br>\
&lt;option&gt;Option 3&lt;/option&gt;<br>\
&lt;/select&gt;<br><br>\
<select id="contextSelectbox">\
<option>Option 1</option>\
<option>Option 2</option>\
<option>Option 3</option>\
</select>\
</p><p>\
<strong>Inputbox:</strong><br>\
&lt;input id="customid"&gt;<br><br>\
<input id="customid"> \
</p><p>\
<strong>Text Area:</strong><br>\
&lt;textarea id="customTextarea" placeholder="Enter Custom reason"&gt;&lt;/textarea&gt;<br><br>\
<textarea id="customTextarea" placeholder="Enter Custom reason"></textarea>\
</p>\
<h2>Valid tokens:</h2>\
<p><strong>{subreddit}</strong> - The subreddit the post/comment was posted to.<br>\
<strong>{author}</strong> - The author of the link/comment<br>\
<strong>{kind}</strong> - The type of post, either \'submission\' or \'comment\'<br>\
<strong>{mod}</strong> - The name of the mod removing the post (you)<br>\
<strong>{title}</strong> - The title of the submission<br>\
<strong>{url}</strong> - url/permalink to the removed post.<br>\
<strong>{domain}</strong> - the domain of the removed submission.<br>\
<strong>{link}</strong> - the link of the removed submission (same as {url} for self-posts)<br>\
<strong>{reason}</strong> - this is the reason something was removed or someone was banned. It should not be used/will not work without &lt;logsub&gt;.<br>\
<strong>{loglink}</strong> -  the link to the removal log thread. It should not be used/will not work without &lt;logsub&gt;. </p>\
</div>\
</div>\
</div>\
');
        $(html).appendTo('body').show();
        
        // No reasons storred in the config, don't populate list.
        if (config.removalReasons && config.removalReasons.reasons.length > 0) {
        
            var i = 0;
            $(config.removalReasons.reasons).each(function () {
                $(html).find('tbody').append('<tr class="removal-reason"><th><input type="radio" style="display:none;" reason="'+ i +'"name="reason-' + subreddit + '" id="reason-' + subreddit + '-' + i + '"></th><td><br><label for="reason-' + subreddit + '-' + (i++) + '">' + unescape(this.text) + '</label><br><br></td></tr>');
            }); 
            
            $('th input[type=radio]').change(function(){
                $(html).find('.save').val('save');
                var reasonsNum = $(this).attr('reason');
                $('.edit-area').val(unescape(config.removalReasons.reasons[reasonsNum].text));
                $('.edit-area').attr('reason', reasonsNum);
            }); 
        }
        
        // Do things about stuff.
        $(html).delegate('.save', 'click', function() {
            var reasonsNum = $('.edit-area').attr('reason');
            var reasonText = $('.edit-area').val();
            
            if (reasonsNum) {
                config.removalReasons.reasons[reasonsNum].text = escape(reasonText);
            } else { 
                var reason = { text: escape(reasonText) };
                
                if (!config.removalReasons) {
                    config.removalReasons = {
                        reasons: []
                    };
                }
                
                config.removalReasons.reasons.push(reason);
            }
            postToWiki('toolbox', config, true);
            $(html).remove();
        });
        
        $(html).delegate('.cancel', 'click', function() {
            $(html).remove();
        });        
    });
    
    $('body').delegate('.reason-settings', 'click', function() {
        var html = '\
<div class="tb-page-overlay reason-setting-form " comment="the white fade out over the page, we can do without, personally like it">\
<div class="tb-window-wrapper" comment="the window itself">\
<div class="tb-window-header" comment="This will contain the name of the window"> Reason settings <span class="tb-window-header-options"><a class="tb-help" href="javascript:;">?</a></span></div>\
<div class="tb-window-content" comment="This will contain all other elements, this is basically a wrapper to give is more flexibility in the future">\
\
\
            <div class="tb-form">\
			<table>\
			<tr>\
            <td>\
			    get reason from /r/:\
			</td><td>\
			    <input class="getfrom" type="text" value="'+ (config.removalReasons.getfrom || '') +'"/> (<span style="color:red">WARNING:</span> this setting overrides all other settings.)  &nbsp;\
			</tr><tr>\
            <td>\
                logsub /r/:\
			</td><td>\
			    <input class="logsub" type="text" value="'+ (config.removalReasons.logsub || '') +'"/>\
			</td>\
			</tr><tr>\
            <td>\
               pmsubject:\
			</td><td>\
			   <input class="pmsubject" style="width: 600px;" type="text" value="'+ (config.removalReasons.pmsubject ||'') +'"/>\
			</td>\
			</tr><tr>\
            <td>\
                logtitle:\
			</td><td>\
				<input class="logtitle" style="width: 600px;" type="text" value="'+ (config.removalReasons.logtitle || '') +'"/>\
 			</td>\
			</tr><tr>\
            <td>\
				bantitle:\
			</td><td>\
				<input class="bantitle" style="width: 600px;" type="text" value="'+ (config.removalReasons.bantitle || '') +'"/>\
 			</td>\
			</tr><tr>\
            <td>\
				logreason:\
			</td><td>\
				<input class="logreason" style="width: 600px;" type="text" value="'+ (config.removalReasons.logreason || '') +'"/>\
			</td>\
			</tr><tr>\
            <td>\
			</table>\
				<span>Header:</span>\
                <p><textarea class="edit-header" style="width: 600px; height: 100px;">'+ unescape(config.removalReasons.header || '') +'</textarea></p>\
                <span>Footer:</span>\
                <p><textarea class="edit-footer" style="width: 600px; height: 100px;">'+ unescape(config.removalReasons.footer || '') +'</textarea></p>\
                <p><input class="save" type="button" value="save" />&nbsp;&nbsp;&nbsp;<input class="cancel" type="button" value="cancel" /></p>\
            </div>\
\
\
</div>\
<div class="tb-window-footer" comment="for the looks">&nbsp;</div>\
<div class="tb-help-content">\
        <p><strong>get reason from /r/:</strong> This will load the excisting reasons from an other subreddit. <span style="color:red">WARNING:</span> Will override all settings currently in place<p>\
        <p><strong>logsub /r/:</strong>If this is filled in all removals will be logged to a subreddit specified in this field.<p>\
        <p><strong>pmsubject:</strong> Subject field for the pm that can be send to a user after a removal.<p>\
        <p><strong>logtitle:</strong> Used for a public modlog to define the title of the log post.<p>\
        <p><strong>bantitle:</strong> Same as above but then for bans.<p>\
        <p><strong>logreason:</strong> The standard reason a mod will be presented when logging a removal or ban.<p>\
        <p><strong>Header:</strong> The standard line of text to start each removal post/pm with.<p>\
        <p><strong>Footer:</strong> The standard line of text to end each removal post/pm with.<p>\
        <h2>Valid tokens:</h2>\
        <p><strong>{subreddit}</strong> - The subreddit the post/comment was posted to.<br>\
        <strong>{author}</strong> - The author of the link/comment<br>\
        <strong>{kind}</strong> - The type of post, either \'submission\' or \'comment\'<br>\
        <strong>{mod}</strong> - The name of the mod removing the post (you)<br>\
        <strong>{title}</strong> - The title of the submission<br>\
        <strong>{url}</strong> - url/permalink to the removed post.<br>\
        <strong>{domain}</strong> - the domain of the removed submission.<br>\
        <strong>{link}</strong> - the link of the removed submission (same as {url} for self-posts)<br>\
        <strong>{reason}</strong> - this is the reason something was removed or someone was banned. It should not be used/will not work without &lt;logsub&gt;.<br>\
        <strong>{loglink}</strong> -  the link to the removal log thread. It should not be used/will not work without &lt;logsub&gt;. </p>\
</div>\
</div>\
</div>\
        ';
        $(html).appendTo('body').show();
        
        
        $('.reason-setting-form').delegate('.save', 'click', function() {
            
            
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
            
            postToWiki('toolbox', config, true);
            
            $('.reason-setting-form').remove();
        });
        
        $('.reason-setting-form').delegate('.cancel', 'click', function() {
            $('.reason-setting-form').remove();
        });
    });

    $('body').delegate('.tb-help', 'click', function() {	
        var helpwindow=window.open('','','width=500,height=600,location=0,menubar=0,top=100,left=100')
		var htmlcontent = $(this).parents('.tb-window-wrapper').find('.tb-help-content').html();
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
        <div class="help-content">'+htmlcontent+'</div>\
		</body>\
        </html>\
        ';
        helpwindow.document.write(html);
        helpwindow.focus();
	});
    
    


    $('body').delegate('.edit-wiki-page', 'click', function(e) {
        var page = $(e.target).attr('page'),
            textArea = $('.edit-wikidata'),
            saveButton = $('.save-wiki-data'),
            editArea = $('.wiki-edit-area'),
            isAM = (page === 'automoderator');
        
        // load the text area, but not the save button.
        $(editArea).show();
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
            
            // Fix < and > for AM config.
            if (isAM) {
                resp = resp.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            }
            
            // Found it, show it.
            $(textArea).val(resp);
            $(saveButton).show();
            $(saveButton).attr('page', page);
        });
    });
    
    
    $('body').delegate('.save-wiki-data, .cancel-wiki-data', 'click', function(e) {
        var button = e.target,
            editArea = $('.wiki-edit-area'),
            page = $(button).attr('page'),
            textArea = $('.edit-wikidata'),
            text = $(textArea).val(),
            updateAM = (page === 'automoderator'),
            cancel = (e.target.className == 'cancel-wiki-data')

        $(button).removeAttr('page');
        $(textArea).val('');
        $(editArea).hide();
        
        // not really needed, the cancel button doesn't have a page attrib.
        if (!page || cancel) return;
        
        
        // save the data, and blank the text area.
        // also, yes some of the pages are in JSON, but they aren't JSON objects,
        // so they don't need to be re-strinified.
        postToWiki(page, text, false, updateAM);
    });
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
        $('head').prepend('<link rel="stylesheet" type="text/css" href="'+ cssURL +'"></link>');
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
        s.textContent = "(" + tbconf.toString() + ')();';
        document.head.appendChild(s);
    }
})();