function metricstab() {
	var self = new TB.Module('Metrics Tab');
	self.shortname = 'Metrics';

	self.settings['enabled']['default'] = true;

	self.getSectionFromUrl = function getSectionFromUrl(url) {
	    var regex = new RegExp(/^(http|https):\/\/([a-z]+\.)?reddit\.com\/(user|r)\/([^\/]+)(\/|$)/g);
	    var matches = regex.exec(url);

	    if (matches != null) {
	        return {section: matches[3], subSection: matches[4]};
	    } else {
	        return null;
	    }
	};

	self.init = function() {
	    var page = this.getSectionFromUrl(window.location.href);

	    if (page == null) {
	        return false;
	    }

		var metrics = {
			user: {
				'SnoopSnoo': 'http://www.snoopsnoo.com/u/{subSection}',
				'Observatory': 'http://0bservat0ry.com/reddit/u/{subSection}.html',
				'Karmawhores' : 'http://www.karmawhores.net/user/{subSection}'
			},

			r: {
				'MetaReddit': 'http://metareddit.com/r/{subSection}',
				'RedditMetrics': 'http://redditmetrics.com/r/{subSection}'
			}
		};
		
	    var header = document.getElementById("header-bottom-left");
	    var tabList = header.getElementsByTagName("ul")[0];

	    if (tabList == null) {
	        return false;
	    }

		var $tabList = $(tabList);
		$tabList.css('overflow', 'visible');

		var $listItem = $("<li class='dropdown tb-metrics' style=''><a href='#'>Metrics</a></li>");
		$listItem.css({
			overflow: 'visible',
			position: 'relative'
		});

		$(tabList).append($listItem);

		var links = metrics[page.section];
		for(var i in links)
		{
			var url = links[i];
			url = url.replace(/\{subSection\}/g, page.subSection);
			$tabList.append("<li style='display: none;' class='hidden metricTab'><a href='" + url + "'>" + i + "</a></li>");
		}

		$listItem.on('click', function()
		{
			$tabList.find('.metricTab').toggle();
		});
	};

	TB.register_module(self);
}

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        metricstab();
    });
})();