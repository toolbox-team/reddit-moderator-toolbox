function generalSettings() {
    const self = new TB.Module('General Settings');

    self.shortname = 'GenSettings';
    self.settings['enabled']['default'] = true;

    // How about you don't disable the general settings module?  No other module should ever do this. Well except for the support module.
    self.settings['enabled']['hidden'] = true; // Don't disable it, either!

    self.register_setting('onlyshowInhover', {
        'type': 'boolean',
        'default': true,
        'advanced': false,
        'title': 'Only show user related buttons (mod, history, usernotes) in the hover card'
    });

    self.init = function() {
        self.log('general reporting for duty!');
    };

    TB.register_module(self);

}

(function() {
    window.addEventListener('TBModuleLoaded2', function () {
        generalSettings();
    });
})();
