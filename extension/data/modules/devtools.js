function devtools() {
// Developer Tools, for managing /r/toolbox/w/tbnotes (etc.)

    var self = new TB.Module('Developer Tools');
    self.settings['enabled']['default'] = false;

    self.setting('betamode', false);
    self.setting('devmode', true);



    // Module init
    self.init = function() {

        // Function that handles
        function modifyDiv(e) {
            console.log(e);
            const $target = $(e.target);
            $target.append(`
            <span class="tb-bracket-button tb-show-api-info">
                api info
            </span>
            <pre class="tb-api-info"><code>${JSON.stringify(e.detail, null, '\t')}</code></pre>`);
            $target.on('click', '.tb-show-api-info', function() {
                $target.find('.tb-api-info').toggle();
            });
        }

        TB.listener.debugFunc = modifyDiv;
    };

    TB.register_module(self);
}

(function () {
    window.addEventListener('TBModuleLoaded2', function () {
        devtools();
    });
})();
