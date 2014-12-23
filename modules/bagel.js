function betterbuttons() {

var buttons = new TB.Module('Bagels');
buttons.shortname = 'Bagels';

//Default settings
buttons.settings['enabled']['default'] = true;

buttons.register_setting('bagelType', {
    'type': 'selector',
    'values': ['Plain', 'Seasame Seed', 'Poppy Seed', 'Onion', 'Everything'],
    'default': 'plain',
    'title': 'Bagel type'
});

buttons.init = function betterButtonInit() {
    $('body').append('<img src="http://i.imgur.com/yRhb6HG.png" style="position: fixed; left: calc(50% - 200px); z-index: 2147483647; top: 200px;" />');
};

TB.register_module(buttons);
}

(function() {
    window.addEventListener("TBObjectLoaded", function () {
        betterbuttons();
    });
})();
