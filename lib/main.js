var data = require("sdk/self").data;
var ss = require('sdk/simple-storage');
var pageMod = require("sdk/page-mod");
//let worker = tabs.activeTab.attach();
//worker.port.on('simple-storage', function(newData) {
//    ss.storage = newData;
//});

pageMod.PageMod({
    include: "*.reddit.com",
    attachTo: ["top", "frame", "existing"],
    contentScriptWhen: 'end',
    contentStyleFile : data.url("toolbox.css"),
    contentScriptFile: [
        data.url("libs/jquery-2.1.1.js"),
        data.url("libs/snuownd.js"),
        data.url("libs/ace.js"),
        data.url("libs/mode-css.js"),
        data.url("libs/mode-json.js"),
        data.url("libs/mode-yaml.js"),
        data.url("libs/ace-themes.js"),
        data.url("tbstorage.js"),
        data.url("tbui.js"),
        data.url("jquery-plugins.js"),
        data.url("tbutils.js"),
        data.url("tbobject.js"),
        data.url("core.js"),
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
        data.url("syntax.js"),
        data.url("frame.js"),
        data.url("modmaillite.js"),
        data.url("devtools.js"),
        data.url("tbobjectinit.js") // this one always goes last
    ],
    onAttach: listening
});

function listening(worker) {
    worker.port.on('simple-storage', function (tbsettingString) {
        ss.storage.tbsettings = tbsettingString;
        worker.port.emit('storage-reply', ss.storage.tbsettings);
    });
}