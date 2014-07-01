// We have to call this after all of the modules are loaded.
// There's no super-clever way to trigger it automatically

(function TBOBjectInit() {
    window.addEventListener("TBStorageLoaded", function () {
        console.log("got storage (objects)");
        TB.init();
    });
})();
