// ==UserScript==
// @name    Reddit moderation log matrix
// @namespace    reddit.com/user/LowSociety
// @description    Get a nice matrix of mod actions on reddit.
// @match    *://*.reddit.com/r/*/about/log*
// @version    1.1
// ==/UserScript==

var modLogMatrix = {

    limit : 100,
	after : null,
	subredditUrl : null,
	subredditModerators : null,
	subredditActions : null,
	total : 0,
	
    init : function() {
    	this.addButton();
		
		var subredditUrl = this.getSubredditUrl();
		if(subredditUrl.charAt(subredditUrl.length-1) != "/")
			subredditUrl += "/";
		this.subredditUrl = subredditUrl;
		
		if(location.hash != null && location.hash == "#matrix")
			modLogMatrix.renderMatrix();
    },
	
    addButton : function() {
		
        // The reason for the <span> is in case the user has both report matrix AND report gen: http://i.imgur.com/Izbm6Rh.png,
        // the reason the &nbsp; is before and after is becase we don't know which script will load first.  Not a great solution, but it works.
        $('.menuarea').append('\
            <div class="spacer">\
                <span style="float:right;">&nbsp;<a class="reddit-moderationlog" href="#matrix" >moderation log matrix</a>&nbsp;</span>\
            </div>\
        ');
        
		$('.reddit-moderationlog').click(function() { modLogMatrix.renderMatrix(); });
    },
    
    renderMatrix : function() {
     	var siteTable = $("#siteTable");
		
		$(".drop-choices.lightdrop a").each(function() {
			$(this).attr("href", $(this).attr("href") + "#matrix");
		});
		
		this.subredditModerators = this.getSubredditModerators();
		this.subredditActions = this.getSubredditActions();
		
        siteTable.find("table").hide();
        
		// Create table
        var matrix = $("<table></table>").addClass("generic-table mod-matrix").attr("id", "mod-matrix");
        
		var header = $("<tr></tr>").wrap("<thead></thead>");
        header.append("<th></th>");
		var footer = $("<tr class=\"totals\"></tr>").wrap("<tfoot></tfoot>");
        footer.append("<td></td>");
		
		for(var subredditAction in this.subredditActions) {
			header.append("<th style=\"text-align: center\"><a class=\"modactions " + subredditAction + "\" title=\"" + this.subredditActions[subredditAction].title + "\"></a></th>");
			footer.append("<td class=\"action-" + subredditAction + "\" style=\"text-align: center; font-weight: bold;\" title=\"Total " + this.subredditActions[subredditAction].title + " actions\">0</td>");
		}
		header.append("<th style=\"text-align: center; font-weight: bold;\">Total</th>");
		footer.append("<td class=\"action-total\" style=\"text-align: center; font-weight: bold;\">0</td>");
		
		var body = $("<tbody></tbody");
		
		header.parent().appendTo(matrix);
		footer.parent().appendTo(matrix);
		body.appendTo(matrix);
		
		siteTable.append(matrix);
		
		for(var moderator in this.subredditModerators) {
			this.createModeratorRow(moderator);
		}
		
		// Hide next/prev (if RES, not an issue).
		$(".content .nextprev").hide();
        
        $('.reddit-moderationlog').unbind('click').click(function() {
			modLogMatrix.getActions();
		});
		
		// Load data
		this.getActions();
    },
	
	createModeratorRow : function(moderator) {
		var body = $("#mod-matrix tbody");
		var row = $("<tr></tr>").addClass("moderator-" + moderator);
			
		row.append("<td><a href=\"http://www.reddit.com/user/" + moderator + "\" title=\"" + moderator + "\">" + moderator + "</a></td>");
		for(var subredditAction in this.subredditActions) {
			row.append("<td class=\"action-" + subredditAction + "\" style=\"text-align: center\" title=\"" + this.subredditActions[subredditAction].title + " actions by " + moderator + "\">0</td>");
		}
		row.append("<td class=\"action-total\" style=\"text-align: center; font-weight: bold;\" title=\"Total actions by " + moderator + "\">0</td>");
		
		body.append(row);
	},
	
	getActions : function() {
		var requestData = {
			limit : this.limit
		};
		if(this.after != null) requestData.after = this.after;
			
		var filterType = this.getQuerystringByName("type");
			if(filterType != null) requestData.type = filterType;
		var filterMod = this.getQuerystringByName("mod");
			if(filterMod != null) requestData.mod = filterMod;
		
		$(".reddit-moderationlog").text("loading...");
		$.getJSON(this.subredditUrl + "about/log.json", requestData, function(response) {
			var data = response.data;

			for(var i = 0; i < data.children.length; i++) {
				var item = data.children[i].data;
				var action = item.action;
				var mod = item.mod;
				var moderator = modLogMatrix.subredditModerators[mod];
					
				if(moderator == null) {
					moderator = { total : 0 };
					modLogMatrix.subredditModerators[mod] = moderator;
					modLogMatrix.createModeratorRow(mod);
				}
				
				var actionCount = moderator[action]? moderator[action] + 1 : 1;
				
				moderator[action] = actionCount;
				moderator.total += 1;
				
				modLogMatrix.subredditActions[action].total += 1;
				modLogMatrix.total += 1;
			}
			var matrix = $("#mod-matrix");
			for(var mod in modLogMatrix.subredditModerators) {
				var moderator = modLogMatrix.subredditModerators[mod];
				
				for(var action in moderator) {
					matrix.find(".moderator-" + mod + " .action-" + action + "").text(moderator[action]);
				}
			}
			
			for(var subredditAction in modLogMatrix.subredditActions) {
				var action = modLogMatrix.subredditActions[subredditAction];
				matrix.find(".totals .action-" + subredditAction + "").text(action.total);
			}
			matrix.find(".totals .action-total").text(modLogMatrix.total);
			
			 if(data.after == modLogMatrix.after || data.after == null) {
				$(".reddit-moderationlog").unbind("click").text("all actions loaded");
        		} else {
				modLogMatrix.after = data.after;
				$(".reddit-moderationlog").text("load " + modLogMatrix.limit + " more actions");
            		}
		});
	},
	
	getSubredditUrl : function() {
		return $("#header .hover.pagename.redditname a").attr("href");
	},
	
	getSubredditModerators : function() {
		var modItems = $(".drop-choices.lightdrop:not(.modaction-drop) a");
		
		var moderators = {};
		
		modItems.each(function() {
			var mod = $(this).text();
			if(mod == "all" || mod == "admins*")
				return;
				
			moderators[$(this).text()] = { "total" : 0 };
		});
		
		return moderators;
	},
	
	getSubredditActions : function() {
		var actionItems = $(".drop-choices.lightdrop.modaction-drop a");
		
		var actions = {};
		
		actionItems.each(function() {
			if($(this).text() == "all")
				return;
			
			var actionLink = $(this).attr("href");
			var actionCode = modLogMatrix.getQuerystringByName("type",actionLink);
			actions[actionCode] = { "title" : $(this).text(), "total" : 0, "className" : actionCode };
		});
		
		return actions;
	},
	
	getQuerystringByName : function(name, url) {
		if(url == null)
			url = location.search;
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(url);
		return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
    
}

if (JSON.parse(localStorage['Toolbox.Utils.betaMode'] || 'false') && location.pathname.match(/\/about\/(?:log)\/?/)) {
    modLogMatrix.init();
}