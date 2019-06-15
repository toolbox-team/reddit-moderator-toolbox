function generalSettings () {
    const self = new TB.Module('General Settings');

    self.shortname = 'GenSettings';
    self.settings['enabled']['default'] = true;

    // How about you don't disable the general settings module?  No other module should ever do this. Well except for the support module and the old reddit module..
    // So yeah it depends... But seriously normal modules should not do this.
    self.settings['enabled']['hidden'] = true; // Don't disable it, either!

    self.register_setting('onlyshowInhover', {
        type: 'boolean',
        default: true,
        advanced: false,
        title: 'Only show user related buttons (mod, history, usernotes) in the hover card',
    });

    self.register_setting('contextMenuLocation', {
        type: 'selector',
        default: 'left',
        values: ['left', 'right'],
        advanced: false,
        title: 'On what side of the screen should the context menu be shown?',
    });

    self.init = function () {
        self.log('general reporting for duty!');
    };

    TB.register_module(self);
}

window.addEventListener('TBModuleLoaded', () => {
    generalSettings();
});
