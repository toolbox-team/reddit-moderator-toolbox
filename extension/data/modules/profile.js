function profilepro() {
    const self = new TB.Module('Profile Pro');
    self.shortname = 'Profile';

    ////Default settings
    self.settings['enabled']['default'] = true;


    self.config['betamode'] = false;

    self.register_setting('alwaysTbProfile', {
        'type': 'boolean',
        'default': true,
        'title': 'Always open toolbox profile overlay on reddit profiles.'
    });


    TB.register_module(self);

    self.init = function () {
        const $body = $('body');

        const alwaysTbProfile = self.setting('alwaysTbProfile');

        function makeProfile(user, type, sort, renew) {
            TB.ui.longLoadSpinner(true);

            let $overlay = $body.find('.tb-profile-overlay');

            if(!$overlay.length) {
                $overlay = TB.ui.overlay(
                    `Toolbox profile for /u/${user}`,
                    [
                        {
                            title: 'overview',
                            tooltip: 'Overview profile.',
                            content: `
                                <div class="tb-profile-options-overview"></div>
                                <div class="tb-sitetable-overview"></div>
                            `,
                            footer: ''
                        },
                        {
                            title: 'submitted',
                            tooltip: 'submitted profile.',
                            content: `
                                <div class="tb-profile-options-submitted"></div>
                                <div class="tb-sitetable-submitted"></div>
                            `,
                            footer: ''
                        },
                        {
                            title: 'comments',
                            tooltip: 'comment profile.',
                            content: `
                                <div class="tb-profile-options-comments"></div>
                                <div class="tb-sitetable-comments"></div>
                            `,
                            footer: ''
                        }
                    ],
                    [], // extra header buttons
                    'tb-profile-overlay', // class
                    false, // single overriding footer
                    {
                        user: user
                    }
                ).appendTo('body');

                $body.css('overflow', 'hidden');
                $body.on('click', '.tb-profile-overlay .close', function () {
                    $('.tb-profile-overlay').remove();
                    $body.css('overflow', 'auto');

                });

            }
            let $siteTable = $overlay.find(`.tb-sitetable-${type}`);
            let $options = $overlay.find(`.tb-profile-options-${type}`);

            if($siteTable.hasClass('tb-sitetable-processed') && !renew) {
                TB.ui.longLoadSpinner(false);
                return;
            }


            let $sortSelect = $options.find('.tb-sort-select');
            if(!$sortSelect.length) {
                $sortSelect = $(`
                <select class="tb-sort-select tb-action-button" data-type="${type}">
                    <option value="new">new</option>
                    <option value="top">top</option>
                    <option value="controversial">controversial</option>
                    <option value="hot">hot</option>
                </select>`).appendTo($options);
            }
            // Prevent some issues with people selecting a new sort method while toolbox is still busy.
            $sortSelect.hide();

            $sortSelect.val(sort);

            $siteTable.addClass('tb-sitetable-processed');
            $siteTable.empty();

            TBui.switchOverlayTab('tb-profile-overlay', type);
            const inputURL = `https://www.reddit.com/user/${user}/${type}.json`;
            $.getJSON(inputURL, {raw_json: 1, sort: sort}, function(data) {

                const commentOptions = {
                    'parentLink' : true,
                    'contextLink' : true,
                    'contextPopup' : true,
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
                        TBui.tbRedditEvent($siteTable, 'comment,submission');
                        TB.ui.longLoadSpinner(false);
                        $sortSelect.show();
                    }, 1000);
                });



            });

        }

        $body.on('change keydown', '.tb-sort-select', function () {
            const $this = $(this);
            const newSort = $this.val(),
                user = $this.closest('.tb-page-overlay').attr('data-user'),
                listing = $this.attr('data-type');
            makeProfile(user, listing, newSort, true);

        });

        $body.on('click', '.tb-profile-overlay .tb-window-tabs a', function() {
            const $this = $(this);
            const listing = $this.attr('data-module'),
                user = $this.closest('.tb-page-overlay').attr('data-user');
            makeProfile(user, listing, 'new', false);
        });

        window.addEventListener('TBNewPage', function (event) {
            const popupTypes = ['comments', 'submitted', 'overview'];
            if(event.detail.pageType === 'userProfile' && popupTypes.includes(event.detail.pageDetails.listing)) {
                const user = event.detail.pageDetails.user,
                    listing = event.detail.pageDetails.listing;
                TBui.contextTrigger('tb-user-profile', {
                    addTrigger: true,
                    triggerText: `toolbox profile`,
                    triggerIcon: 'account_circle',
                    title: `Show toolbox profile for /u/${user}`,
                    dataAttributes: {
                        user: user,
                        listing: listing
                    }
                });
                if(alwaysTbProfile) {
                    makeProfile(user, listing, 'new', false);
                }

            }

            if (event.detail.pageType !== 'userProfile' || !popupTypes.includes(event.detail.pageDetails.listing)){
                TBui.contextTrigger('tb-un-config-link', { addTrigger: false });
            }
        });

        $body.on('click', '#tb-user-profile', function(){
            const $this = $(this);
            const user = $this.attr('data-user'),
                listing = $this.attr('data-listing');

            makeProfile(user, listing, 'new', false);
        });

    };


}

(function () {
    window.addEventListener('TBModuleLoaded2', function () {
        profilepro();
    });
})();
