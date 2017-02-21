function support() {
    var self = new TB.Module('Support Module');
    self.shortname = 'support';

    self.settings['enabled']['default'] = true;

// How about you don't disable support?  No other module should ever do this. Well except for modbar.
    self.settings['enabled']['hidden'] = true; // Don't disable it, either!


    let $body = $('body');
    const debugTemplate = `
    
---   
***Toolbox debug information***

Info| &nbsp;
---|---
*Toolbox version*|{{toolboxVersion}}
*Browser name*|{{browserName}}
*Browser version*|{{browserVersion}}
*Platform information*|{{platformInfo}}`;

    const debugInfo = TBUtils.debugInformation();
    const submissionAddition = TBUtils.template(debugTemplate, {
        'toolboxVersion': debugInfo.toolboxVersion,
        'browserName':  debugInfo.browser ,
        'browserVersion': debugInfo.browserVersion,
        'platformInfo': debugInfo.platformInformation
    });

    // If we are on the submit page we add debug information when a user makes a post.
    if(location.pathname.match(/\/r\/toolbox\/submit\/?/)) {

        let $submissionTextArea = $('.usertext-edit.md-container textarea');

        $body.on('click', '.submit.content .btn[name="submit"]', function(event) {
            // First we stop the action on the button for a bit.
            //event.preventDefault();
            let submissionText = $submissionTextArea.val();



            $submissionTextArea.val(submissionText + submissionAddition);
        });
    }

    // If we are in the comment section we offer a button to insert the info.
    if(location.pathname.match(/\/r\/toolbox\/comments\/?/)) {
        let $usertextButtons = $body.find('.usertext-edit .usertext-buttons');

        let $saveButton = $usertextButtons.find('.save');
        let $tbUsertextButtons = $saveButton.parent().find('.tb-usertext-buttons');

        // This needs to be a div otherwise reddit thinks a save button is clicked.
        let $debugInsertButton = $('<div>').addClass('tb-action-button tb-insert-debug').text('Insert debug info');
        if ($tbUsertextButtons.length) {
            $tbUsertextButtons.before($debugInsertButton);
        } else {
            $saveButton.parent().find('.status').before($('<div>').addClass('tb-usertext-buttons').append($debugInsertButton));
        }

        $('body').on('click', 'div.tb-insert-debug', function (e) {
            self.log('Insert debug clicked!');
            let $commentTextArea = $(this).closest('.usertext-edit.md-container').find('.md textarea');
            let currentComment = $commentTextArea.val();

            $commentTextArea.val(currentComment + submissionAddition);

        });

    }



    TB.register_module(self);
}

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        support();
    });
})();
