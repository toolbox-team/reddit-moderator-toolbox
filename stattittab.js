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

function stattitTabWrapper() {

var stattitTab = new Toolbox.TBModule('Stattit Tab', '0.1');
    
stattitTab.getSectionFromUrl = function(url) {
    var regex = new RegExp(/^(http|https):\/\/([a-z]+\.)?reddit\.com\/(user|r)\/([^\/]+)(\/|$)/g);
    var matches = regex.exec(url);
    
    if(matches != null) {
        return { section : matches[3], subSection : matches[4] };
    } else {
        return null;
    }
};
    
stattitTab.init = function() {
    var page = this.getSectionFromUrl(window.location.href);
        
    if(page == null) {
        return false;
    }
    
    var header = document.getElementById("header-bottom-left");
    var tabList = header.getElementsByTagName("ul")[0];
    
    if (tabList == null) {
        return false;
    }
    
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
};

Toolbox.register_module(stattitTab);

} // end of stattitTabWrapper()

// if (document.body) {
//   if (JSON.parse(localStorage['Toolbox.StattitTab.enabled'] || 'true')) {
//       stattitTab.init();  
//   }
// }

// Add script to page
(function () {
    var s = document.createElement('script');
    s.textContent = "(" + stattitTabWrapper.toString() + ')();';
    document.head.appendChild(s);
})();