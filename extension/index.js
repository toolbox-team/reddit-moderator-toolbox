var data = require("sdk/self").data;
var ss = require('sdk/simple-storage');
var pageMod = require("sdk/page-mod");
var privateBrowsing = require("sdk/private-browsing");

pageMod.PageMod({
    include: "*.reddit.com",
    attachTo: ["top"],
    contentScriptWhen: 'end',
    contentStyleFile: [
        "./libs/spectrum.css",
        "./styles/toolbox.css",
        "./styles/comment.css",
        "./styles/modmatrix.css",
        "./styles/removalreasons.css",
        "./styles/personalnotes.css",
        "./styles/modmaillite.css",
        "./styles/queuetools.css",
        "./styles/modmailpro.css",
        "./styles/achievements.css",
        "./styles/modbar.css",
        "./styles/historybutton.css",
        "./styles/trouble.css",
        "./styles/notifier.css",
        "./styles/domaintagger.css",
        "./styles/usernotes.css",
        "./styles/config.css"
    ],
    contentScriptFile: [
        "./libs/jquery-2.1.1.js",
        "./libs/tbplugins.js",
        "./libs/snuownd.js",
        "./libs/ace.js",
        "./libs/pako.js",
        "./libs/mode-css.js",
        "./libs/mode-json.js",
        "./libs/mode-yaml.js",
        "./libs/ace-themes.js",
        "./libs/redditapi.js",
        "./libs/spectrum.js",
        "./tbstorage.js",
        "./tbui.js",
        "./tbutils.js",
        "./tbmodule.js",
        "./modules/modbar.js",
        "./modules/modbutton.js",
        "./modules/notifier.js",
        "./modules/modmailpro.js",
        "./modules/domaintagger.js",
        "./modules/usernotes.js",
        "./modules/removalreasons.js",
        "./modules/comment.js",
        "./modules/metricstab.js",
        "./modules/modmatrix.js",
        "./modules/banlist.js",
        "./modules/config.js",
        "./modules/historybutton.js",
        "./modules/syntax.js",
        "./modules/macros.js",
        "./modules/realtime.js",
        "./modules/nukecomments.js",
        "./modules/personalnotes.js",
        "./modules/modmaillite.js",
        "./modules/betterbuttons.js",
        "./modules/bagel.js",
        "./modules/flyingsnoo.js",
        "./modules/achievements.js",
        "./modules/trouble.js",
        "./modules/queuetools.js", // always load as last module, it can break others.
        "./tbmoduleinit.js" // this one always goes last
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
