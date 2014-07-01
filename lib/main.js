var data = require("sdk/self").data;
var ss = require('sdk/simple-storage');
var pageMod = require("sdk/page-mod");

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
        data.url("tbplugins.js"),
        data.url("tbutils.js"),
        data.url("tbobject.js"),
        data.url("modules/core.js"),
        data.url("modules/notifier.js"),
        data.url("modules/domaintagger.js"),
        data.url("modules/usernotes.js"),
        data.url("modules/modbutton.js"),
        data.url("modules/modmailpro.js"),
        data.url("modules/queuetools.js"),
        data.url("modules/removalreasons.js"),
        data.url("modules/comment.js"),
        data.url("modules/stattittab.js"),
        data.url("modules/modmatrix.js"),
        data.url("modules/banlist.js"),
        data.url("modules/config.js"),
        data.url("modules/syntax.js"),
        data.url("modules/frame.js"),
        data.url("modules/modmaillite.js"),
        data.url("modules/devtools.js"),
        data.url("modules/betterbuttons.js"),
        data.url("tbobjectinit.js") // this one always goes last
    ],
    onAttach: settingsWorker
});

function settingsWorker(worker) {
    worker.port.on('tb-getsettings', function () {
        worker.port.emit('tb-settings-reply', ss.storage.tbsettings);
    });

    worker.port.on('tb-setsettings', function (tbsettingString) {
        ss.storage.tbsettings = tbsettingString;
    });

    worker.port.on('tb-clearsettings', function (tbsettingString) {
        delete ss.storage.tbsettings;
        worker.port.emit('tb-clearsettings-reply', ss.storage.tbsettings);
    });
}