function bagels () { // eslint-disable-line no-unused-vars
    const self = new TB.Module('Bagels');
    self.shortname = 'Bagels';

    // Default settings
    self.settings['enabled']['default'] = false;

    self.register_setting('bagelType', {
        type: 'selector',
        values: ['Plain', 'Seasame Seed', 'Poppy Seed', 'Onion', 'Everything'],
        default: 'plain',
        title: 'Bagel type',
    });

    self.init = function () {
        $('body').append('<img src="http://i.imgur.com/yRhb6HG.png" style="position: fixed; left: calc(50% - 200px); z-index: 2147483647; top: 200px;" />');
    };

    TB.register_module(self);
}

window.addEventListener('TBModuleLoaded2', () => {
    // bagels(); //disabled
});
