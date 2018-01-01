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

        function populateSearchSuggestion() {

            $(TBUtils.mySubs).each(function () {
                $body.find('#tb-search-suggest table#tb-search-suggest-list').append(`<tr data-subreddit="${this}"><td>${this}</td></td></tr>`);
            });
        }
        function commentSearch($optionsArea) {
        // Find comments made by the user in specific subreddits.
            if (TBUtils.modCheck) {

                $optionsArea.append(`<form id="tb-searchuser">
                        search comments: <input id="subredditsearch" type="text" placeholder="subreddit" class="tb-input tb-comment-search-input"> <input id="contentsearch" type="text" placeholder="content (optional)" class="tb-input tb-comment-search-input">
                        <input type="submit" value=" search " class="tb-action-button">
                    </form>`);

                $body.append('<div id="tb-search-suggest" style="display: none;"><table id="tb-search-suggest-list"></table></div>');



                TBUtils.getModSubs(function () {
                    populateSearchSuggestion();
                });

                $body.on('focus', '#subredditsearch', function () {
                    const offset = $(this).offset();
                    const offsetLeft = offset.left;
                    const offsetTop = (offset.top + 20);

                    $body.find('#tb-search-suggest').css({
                        'left': `${offsetLeft}px`,
                        'top': `${offsetTop}px`
                    });

                    if (!$body.find('#tb-search-suggest').is(':visible')) {
                        $body.find('#tb-search-suggest').show();
                    }
                });

                $body.find('#subredditsearch').keyup(function () {
                    let LiveSearchValue = $(this).val();
                    $body.find('#tb-search-suggest table#tb-search-suggest-list tr').each(function () {
                        var $this = $(this),
                            subredditName = $this.attr('data-subreddit');

                        if (subredditName.toUpperCase().indexOf(LiveSearchValue.toUpperCase()) < 0) {
                            $this.hide();
                        } else {
                            $this.show();
                        }
                    });
                });

                $(document).on('click', function (event) {
                    if (!$(event.target).closest('#tb-search-suggest').length && !$(event.target).closest('#subredditsearch').length) {
                        $body.find('#tb-search-suggest').hide();
                    }
                });

                $body.on('click', '#tb-search-suggest-list tr', function () {
                    const subSuggestion = $(this).attr('data-subreddit');
                    $body.find('#subredditsearch').val(subSuggestion);
                    $body.find('#tb-search-suggest').hide();
                });
                $body.on('submit', '#tb-searchuser', function () {
                    TB.ui.longLoadSpinner(true);
                    const $this = $(this);
                    const results = [];
                    const $windowContent = $this.closest('.tb-window-content');
                    const $siteTable = $windowContent.find('.tb-sitetable-comments');
                    $siteTable.removeClass('tb-sitetable-processed');
                    $siteTable.empty();
                    let subredditsearch = $body.find('#subredditsearch').val(),
                        usersearch = $this.closest('.tb-page-overlay').attr('data-user'),
                        contentsearch = $body.find('#contentsearch').val();

                    subredditsearch = subredditsearch.replace(/\/?r\//g, '');
                    subredditsearch = TBUtils.htmlEncode(subredditsearch);

                    function searchComments(user, options, after, callback) {
                        $.getJSON(`${TBUtils.baseDomain}/user/${user}/comments.json`, {
                            'raw_json': 1,
                            'after': after,
                            'limit': 100
                        }).done(function (data) {

                            $.each(data.data.children, function (i, value) {
                                let hit = true;

                                for (let option in options) {
                                    if (!value.data[option] || !options[option].test(`${value.data[option]}`)) {
                                        hit = false;
                                        break;
                                    }
                                }

                                if (hit) {
                                    results.push(value);
                                }
                            });
                            if (!data.data.after) {
                                return callback();
                            } else {
                                searchComments(user, options, data.data.after, function() {
                                    return callback();
                                });
                            }
                        });
                    }
                    function regExpEscape(query) {
                        return query.trim().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
                    }

                    let searchOptions = {};
                    if (subredditsearch) {
                        searchOptions.subreddit = new RegExp(`^${regExpEscape(subredditsearch)}$`, 'i');
                    }
                    if (contentsearch) {
                        searchOptions.body = new RegExp(regExpEscape(contentsearch), 'gi');
                    }
                    searchComments(usersearch, searchOptions, null, function() {


                        if(results.length > 0) {
                            addToSiteTable(results, $siteTable, function() {
                                TB.ui.longLoadSpinner(false);
                            });
                        } else {
                            TB.ui.longLoadSpinner(false);
                            $siteTable.append('<div class="error">no results found</div>');
                        }
                    });
                    return false;

                });
            }
        }

        function addToSiteTable(data, $siteTable, callback) {
            const commentOptions = {
                'parentLink' : true,
                'contextLink' : true,
                'contextPopup' : true,
                'fullCommentsLink' : true,
                'overviewData': true
            };
            TBUtils.forEachChunkedDynamic(data, function(entry) {
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
                    return callback();
                }, 1000);
            });
        }

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
            if(!renew && type === 'comments' && !$body.find('#tb-searchuser').length) {
                commentSearch($options);
            }

            $body.find('#tb-searchuser').hide();

            $siteTable.addClass('tb-sitetable-processed');
            $siteTable.empty();

            TBui.switchOverlayTab('tb-profile-overlay', type);
            const inputURL = `${TBUtils.baseDomain}/user/${user}/${type}.json`;
            $.getJSON(inputURL, {raw_json: 1, sort: sort}, function(data) {

                addToSiteTable(data.data.children, $siteTable, function() {
                    TB.ui.longLoadSpinner(false);
                    $sortSelect.show();
                    $body.find('#tb-searchuser').show();
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
