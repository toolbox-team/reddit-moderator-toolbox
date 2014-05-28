var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
pageMod.PageMod({
    include: "*.reddit.com",
    attachTo: ["top", "frame", "existing"],
    contentScriptWhen: 'end',
    contentStyleFile : data.url("toolbox.css"),
    contentScriptFile: [
        data.url("libs/jquery-2.1.1.min.js"), 
        data.url("jquery-plugins.js"), 
        data.url("libs/snuownd.js"), 
        data.url("tbutils.js"), 
        data.url("notifier.js"), 
        data.url("domaintagger.js"), 
        data.url("usernotes.js"), 
        data.url("modbutton.js"), 
        data.url("modmailpro.js"), 
        data.url("queuetools.js"),
        data.url("removalreasons.js"),
        data.url("comment.js"), 
        data.url("stattittab.js"),
        data.url("modmatrix.js"),
        data.url("banlist.js"),                   
        data.url("config.js"),
        data.url("libs/ace.js"),                   
        data.url("libs/mode-css.js"),
        data.url("syntax.js"),
        data.url("frame.js"),
        data.url("modmaillite.js")
    ]
});
