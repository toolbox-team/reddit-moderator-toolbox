function devtools() {
// Developer Tools, for managing /r/toolbox/w/tbnotes (etc.)

    var self = new TB.Module('Developer Tools');
    self.settings['enabled']['default'] = false;

    self.setting('betamode', false);
    self.setting('devmode', true);

    TB.register_module(self);
}

(function () {
    window.addEventListener('TBModuleLoaded', function () {
        //devtools(); //disabled
    });
})();