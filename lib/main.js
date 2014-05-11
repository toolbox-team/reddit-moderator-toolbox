var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
pageMod.PageMod({
    include: "*.reddit.com",
    attachTo: ["top", "frame", "existing"],
  contentScriptWhen: 'end',
  contentStyleFile : data.url("toolbox.css"),
  contentScriptFile: [data.url("jquery-1.9.0.js"), 
            data.url("jquery-migrate-1.2.1.js"), 
            data.url("jquery-plugins.js"), 
            data.url("snuownd.js"), 
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
                      data.url("config.js")]
});
