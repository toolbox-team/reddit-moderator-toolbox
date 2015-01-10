function bagels() {
var self = new TB.Module('Bagels');
self.shortname = 'Bagels';

//Default settings
self.settings['enabled']['default'] = false;

self.register_setting('bagelType', {
    'type': 'selector',
    'values': ['Plain', 'Seasame Seed', 'Poppy Seed', 'Onion', 'Everything'],
    'default': 'plain',
    'title': 'Bagel type'
});

self.init = function() {
    $('body').append('<img src="http://i.imgur.com/yRhb6HG.png" style="position: fixed; left: calc(50% - 200px); z-index: 2147483647; top: 200px;" />');
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        //bagels(); //disabled
    });
})();
