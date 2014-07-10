// We have to call this after all of the modules are loaded.
// There's no super-clever way to trigger it automatically

(function TBOBjectInit() {
    window.addEventListener("TBObjectLoaded", function () {
        console.log("got tbobject");
        TB.init();
    });
})();
