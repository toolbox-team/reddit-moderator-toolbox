function devtools() {
    var self = new TB.Module('Developer Tools');
    self.shortname = 'DevTools';

    ////Default settings
    self.settings['enabled']['default'] = true;

    self.config['betamode'] = false;
    self.config['devmode'] = true;

    self.register_setting('apiHelper', {
        'type': 'boolean',
        'default': false,
        'advanced': true,
        'title': 'Show api button next for each element received from front-end api'
    });

    self.register_setting('commentUItester', {
        'type': 'boolean',
        'default': false,
        'advanced': true,
        'title': 'Add a button to the context menu that opens an overlay to test the TBui comment constructors.'
    });
    // Module init
    self.init = function() {
        let $body = $('body');

        const apiHelper = self.setting('apiHelper'),
            commentUItester = self.setting('commentUItester');

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

        if(apiHelper) {
            TB.listener.debugFunc = modifyDiv;
        }

        if(commentUItester) {
            TBui.contextTrigger(`tb-testCommentUI-link`, {
                addTrigger: true,
                triggerText: `Show ze overlay!`,
                triggerIcon: 'view_array'
            });
        }

        $body.on('click', '#tb-testCommentUI-link', function() {
            TB.ui.overlay(
                `Comment UI tester`,
                [
                    {
                        title: 'Flatview',
                        tooltip: 'commentFlatview.',
                        content: `
                            <div id="tb-comment-sitetable"></div>
                            <div id="tb-testCommentUI-input tb-input">
                                <input type="text" placeholder="gimme that json url" id="tb-testCommentUI-input-url" class="tb-input">
                                <button class="tb-action-button tb-testCommentUI-button fetch-single">fetch single</button>
                                <button class="tb-action-button tb-testCommentUI-button fetch-thread">fetch thread</button>
                                <button class="tb-action-button tb-testSubmissionUI-button fetch-listing">fetch submission listing</button>
                        `,
                        footer: ''
                    }
                ],
                [], // extra header buttons
                'tb-comment-ui-test', // class
                false // single overriding footer
            ).appendTo('body');

            $body.css('overflow', 'hidden');
            $body.on('click', '.tb-comment-ui-test .close', function () {
                $('.tb-comment-ui-test').remove();
                $body.css('overflow', 'auto');

            });

            $body.on('click', '.tb-testCommentUI-button', function () {
                const $this = $(this);
                let $siteTable = $body.find('#tb-comment-sitetable');
                $siteTable.empty();
                // Input must be the json permalink to a comment. As this is a dev tool it doesn't try to figure it out.
                const inputURL = $body.find('#tb-testCommentUI-input-url').val();
                $.getJSON(inputURL, {raw_json: 1}, function(data) {

                    const commentOptions = {
                        'parentLink' : true,
                        'contextLink' : true,
                        'fullCommentsLink' : true
                    };

                    if($this.hasClass('fetch-thread')) {
                        const $comments = TBui.makeCommentThread(data[1].data.children, commentOptions);
                        $siteTable.append($comments);
                        TBui.tbRedditEvent($comments, 'comment');
                        $('time.timeago').timeago();
                    } else {
                        let $comment = TBui.makeSingleComment(data[1].data.children[0], commentOptions);
                        $siteTable.append($comment);
                        TBui.tbRedditEvent($comment, 'comment');
                        $('time.timeago').timeago();
                    }

                });
            });

            $body.on('click', '.tb-testSubmissionUI-button', function () {
                let $siteTable = $body.find('#tb-comment-sitetable');
                $siteTable.empty();
                const inputURL = $body.find('#tb-testCommentUI-input-url').val();
                $.getJSON(inputURL, {raw_json: 1}, function(data) {
                    TBUtils.forEachChunkedDynamic(data.data.children, function(entry) {
                        if(entry.kind === `t3`) {
                            let $submission = TBui.makeSubmissionEntry(entry);
                            $siteTable.append($submission);
                            $('time.timeago').timeago();
                        }

                    }).then(function() {
                        setTimeout(function () {
                            TBui.tbRedditEvent($siteTable, 'comment');
                            TB.ui.longLoadSpinner(false);
                        }, 1000);
                    });
                });

            });

        });

    };

    TB.register_module(self);
}

(function() {
    window.addEventListener('TBModuleLoaded2', function () {
        devtools();
    });
})();
