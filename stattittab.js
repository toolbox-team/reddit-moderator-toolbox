// ==UserScript==
// @name       Stattit tab
// @namespace  http://reddit.com/user/LowSociety
// @version    1.0
// @description  Adds a Stattit tab to Reddit user profiles and subreddits.
// @match	http://*.reddit.com/user/*
// @match	https://*.reddit.com/user/*
// @match	http://*.reddit.com/r/*
// @match	https://*.reddit.com/r/*
// @copyright  2013+, LowSociety
// ==/UserScript==

(function stattittab() {
    var stattitTab = {

        getSectionFromUrl: function (url) {
            var regex = new RegExp(/^(http|https):\/\/([a-z]+\.)?reddit\.com\/(user|r)\/([^\/]+)(\/|$)/g);
            var matches = regex.exec(url);

            if (matches != null)
                return { section: matches[3], subSection: matches[4] };
            else
                return null;
        },

        init: function () {
            var page = this.getSectionFromUrl(window.location.href);

            if (page == null)
                return false;

            var header = document.getElementById("header-bottom-left");
            var tabList = header.getElementsByTagName("ul")[0];

            if (tabList == null)
                return false;

            var listItem = document.createElement("li");
            var link = document.createElement("a");

            if (page.section === 'user') {
                link.href = "http://karmawhores.net/" + page.section + "/" + page.subSection;
                link.innerHTML = "karma stats";
            } else {
                link.href = "http://redditmetrics.com/" + page.section + "/" + page.subSection;
                link.innerHTML = "reddit metrics";
            }

            link.target = "_blank";
            listItem.appendChild(link);
            tabList.appendChild(listItem);
        }

    }

    if (document.body) {
        if (TBUtils.getSetting('StattitTab', 'enabled', true)) {
            $.log('Loading Stattit Tab Module');
            stattitTab.init();
        }
    }
})();