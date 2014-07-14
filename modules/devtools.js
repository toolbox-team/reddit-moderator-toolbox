function devtools() {
// Developer Tools, for managing /r/toolbox/w/tbnotes (etc.)

var devTools = new TB.Module('Developer Tools');

devTools.setting('betamode', false);
devTools.setting('devmode', true);

}

(function () {
    window.addEventListener("TBObjectLoaded", function () {
        $.log("got tbobject");
        devtools();
    });
})();