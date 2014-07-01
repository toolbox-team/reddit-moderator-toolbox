function core(){
// core.js for Toolbox general settings

core = new TB.Module("General"); // because the settings tab should say this

// We're going to have to figure out a nice way to port/rename the various settings
// that should be in this module...

core.init = function init() {
    // Nothing here, for now.
}

TB.register_module(core);
}

(function () {
    window.addEventListener("TBStorageLoaded", function () {
        console.log("got storage");
        core();
    });
})();