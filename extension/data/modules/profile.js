function profilepro() {
    const self = new TB.Module('Profile Pro');
    self.shortname = 'Profile';

    ////Default settings
    self.settings['enabled']['default'] = true;
    self.config['betamode'] = false;
    TB.register_module(self);




    self.init = function () {
        const $body = $('body');

        function makeProfile(user) {
            TB.ui.longLoadSpinner(true);
            TB.ui.overlay(
                `Toolbox profile for /u/${user}`,
                [
                    {
                        title: 'profile',
                        tooltip: 'profile.',
                        content: `
                            <div id="tb-comment-sitetable"></div>
                        `,
                        footer: ''
                    }
                ],
                [], // extra header buttons
                'tb-profile-overflay', // class
                false // single overriding footer
            ).appendTo('body');

            $body.css('overflow', 'hidden');
            $body.on('click', '.tb-profile-overflay .close', function () {
                $('.tb-profile-overflay').remove();
                $body.css('overflow', 'auto');

            });
            let $siteTable = $body.find('#tb-comment-sitetable');
            $siteTable.empty();
            // Input must be the json permalink to a comment. As this is a dev tool it doesn't try to figure it out.
            const inputURL = `https://www.reddit.com/user/${user}/submitted.json`;
            $.getJSON(inputURL, {raw_json: 1}, function(data) {

                const commentOptions = {
                    'parentLink' : true,
                    'contextLink' : true,
                    'fullCommentsLink' : true,
                    'overviewData': true
                };
                TBUtils.forEachChunkedDynamic(data.data.children, function(entry) {
                    if(entry.kind === `t1`) {
                        let $comment = TBui.makeSingleComment(entry, commentOptions);
                        $siteTable.append($comment);
                        $('time.timeago').timeago();
                    }

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

        }

        window.addEventListener('TBNewPage', function (event) {
            if(event.detail.pageType === 'userProfile') {
                console.log(event)
                makeProfile(event.detail.pageDetails.user);
            }

        });

    };


}

(function () {
    window.addEventListener('TBModuleLoaded2', function () {
        profilepro();
    });
})();
