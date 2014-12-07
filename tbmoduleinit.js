// We have to call this after all of the modules are loaded.
// There's no super-clever way to trigger it automatically

(function TBObjectInit() {
    window.addEventListener("TBObjectLoaded", function () {
        $.log("TBObject loaded, getting TBStorage", false, 'TBObjectInit');
        TB.init();
    });
})();
