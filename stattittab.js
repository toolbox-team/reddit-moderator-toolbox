// @copyright  2013+, LowSociety, dakta

var stattitTab = new TB.Module('Stattit Tab');
    
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

TB.register_module(stattitTab);
