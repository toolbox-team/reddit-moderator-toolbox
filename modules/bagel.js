function make_bagels() {

var bagels = new TB.Module('Bagels');
bagels.shortname = 'Bagels';

//Default settings
bagels.settings['enabled']['default'] = true;

bagels.register_setting('bagelType', {
    'type': 'selector',
    'values': ['Plain', 'Seasame Seed', 'Poppy Seed', 'Onion', 'Everything'],
    'default': 'plain',
    'title': 'Bagel type'
});

bagels.init = function betterButtonInit() {
    $('body').append('<img src="http://i.imgur.com/yRhb6HG.png" style="position: fixed; left: calc(50% - 200px); z-index: 2147483647; top: 200px;" />');
};

TB.register_module(bagels);
}

(function() {
    window.addEventListener("TBObjectLoaded", function () {
        make_bagels();
    });
})();
