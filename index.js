var data = require("sdk/self").data;
var ss = require('sdk/simple-storage');
var pageMod = require("sdk/page-mod");
var privateBrowsing = require("sdk/private-browsing");

pageMod.PageMod({
    include: "*.reddit.com",
    attachTo: ["top"],
    contentScriptWhen: 'end',
    contentStyleFile: [
        data.url("styles/toolbox.css"),
        data.url("styles/comment.css"),
        data.url("styles/modmatrix.css"),
        data.url("styles/removalreasons.css"),
        data.url("styles/personalnotes.css"),
        data.url("styles/modmaillite.css"),
        data.url("styles/queuetools.css"),
        data.url("styles/modmailpro.css"),
        data.url("styles/achievements.css"),
        data.url("styles/modbar.css"),
        data.url("styles/historybutton.css"),
        data.url("styles/trouble.css"),
        data.url("styles/notifier.css"),
        data.url("styles/domaintagger.css")
    ],
    contentScriptFile: [
        data.url("libs/jquery-2.1.1.js"),
        data.url("libs/tbplugins.js"),
        data.url("libs/snuownd.js"),
        data.url("libs/ace.js"),
        data.url("libs/pako.js"),
        data.url("libs/mode-css.js"),
        data.url("libs/mode-json.js"),
        data.url("libs/mode-yaml.js"),
        data.url("libs/ace-themes.js"),
        data.url("libs/redditapi.js"),
        data.url("tbstorage.js"),
        data.url("tbui.js"),
        data.url("tbutils.js"),
        data.url("tbmodule.js"),
        data.url("modules/modbar.js"),
        data.url("modules/modbutton.js"),
        data.url("modules/notifier.js"),
        data.url("modules/modmailpro.js"),
        data.url("modules/domaintagger.js"),
        data.url("modules/usernotes.js"),
        data.url("modules/removalreasons.js"),
        data.url("modules/comment.js"),
        data.url("modules/metricstab.js"),
        data.url("modules/modmatrix.js"),
        data.url("modules/banlist.js"),
        data.url("modules/config.js"),
        data.url("modules/historybutton.js"),
        data.url("modules/syntax.js"),
        data.url("modules/macros.js"),
        data.url("modules/realtime.js"),
        data.url("modules/nukecomments.js"),
        data.url("modules/personalnotes.js"),
        data.url("modules/modmaillite.js"),
        data.url("modules/betterbuttons.js"),
        data.url("modules/bagel.js"),
        data.url("modules/flyingsnoo.js"),
        data.url("modules/achievements.js"),
        data.url("modules/trouble.js"),
        data.url("modules/queuetools.js"), // always load as last module, it can break others.
        data.url("tbmoduleinit.js") // this one always goes last
    ],
    contentScriptOptions: {
        "icon16": data.url("images/icon16.png"), // reference from content script with 'self.options.icon16'
        "nukeIcon": data.url("images/nuke.png") // 'self.options.nukeIcon'
    },
    onAttach: settingsWorker
});

function settingsWorker(worker) {
    worker.port.on('tb-getsettings', function () {
        worker.port.emit('tb-settings-reply', ss.storage.tbsettings);
    });

    worker.port.on('tb-setsettings', function (tbsettingString) {
        if (privateBrowsing.isPrivate(worker)) {
            console.log('private browser. Not storing.')
        } else {
            ss.storage.tbsettings = tbsettingString;
        }
    });

    worker.port.on('tb-clearsettings', function () {
        delete ss.storage.tbsettings;
        worker.port.emit('tb-clearsettings-reply', ss.storage.tbsettings);
    });
}
