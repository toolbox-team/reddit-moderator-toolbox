function devtools() {
// Developer Tools, for managing /r/toolbox/w/tbnotes (etc.)

    const self = new TB.Module('Developer Tools');
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
            <span class="tb-bracket-button tb-show-api-info" data-json="${TBUtils.escapeHTML(JSON.stringify(e.detail, null, '\t'))}">
                api info
            </span>
            `);
            $target.on('click', '.tb-show-api-info', function(event) {
                const jsonData = TBUtils.escapeHTML($(this).attr('data-json'));
                console.log(jsonData);
                const $pasteContent = $(`<pre class="tb-api-info"><code>${jsonData}</code></pre>`);
                // Prepare for the popup.
                let leftPosition;
                if (document.documentElement.clientWidth - event.pageX < 400) {
                    leftPosition = event.pageX - 600;
                } else {
                    leftPosition = event.pageX - 50;
                }



                // Build the context popup and once that is done append it to the body.
                const $apiPopup = TB.ui.popup(
                    'front-end api info',
                    [
                        {
                            title: 'Context tab',
                            tooltip: 'Tab with context for comment.',
                            content: $pasteContent.show(),
                            footer: ''
                        }
                    ],
                    '',
                    'context-button-popup',
                    {
                        draggable: true
                    }
                ).appendTo($('body'))
                    .css({
                        left: leftPosition,
                        top: event.pageY - 10,
                        display: 'block'
                    });

                // Close the popup
                $apiPopup.on('click', '.close', function () {
                    $apiPopup.remove();
                });
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
