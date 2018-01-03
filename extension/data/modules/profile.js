function profilepro() {
    const self = new TB.Module('Profile Pro');
    self.shortname = 'Profile';

    ////Default settings
    self.settings['enabled']['default'] = true;


    self.config['betamode'] = false;

    self.register_setting('alwaysTbProfile', {
        'type': 'boolean',
        'default': false,
        'title': 'Always open toolbox profile overlay on reddit profiles.'
    });

    self.register_setting('directProfileToLegacy', {
        'type': 'boolean',
        'default': false,
        'title': 'Open legacy user overview when clicking on profile links.'
    });

    self.register_setting('subredditColor', {
        'type': 'boolean',
        'default': TB.storage.getSetting('QueueTools', 'subredditColor', false),
        'hidden': true
    });


    TB.register_module(self);

    self.init = function () {
        const $body = $('body');
        let filterModThings = false;
        let hideModActions = false;

        const alwaysTbProfile = self.setting('alwaysTbProfile'),
            directProfileToLegacy = self.setting('directProfileToLegacy'),
            subredditColor = self.setting('subredditColor');

        if(directProfileToLegacy) {
            $body.on('click', 'a', function(event) {
                const userProfileRegex = /(?:\.reddit\.com)?\/(?:user|u)\/[^/]*?\/?$/;
                const thisHref = $(this).attr('href');

                // If the url matches and we are not on an old style profile already.
                if(userProfileRegex.test(thisHref) && !userProfileRegex.test(window.location.href)) {
                    event.preventDefault();
                    const lastChar = thisHref.substr(-1);
                    const newHref = `${thisHref}${lastChar === `/` ? `` : `/`}overview`;
                    if (event.ctrlKey || event.metaKey) {
                        window.open(newHref,'_blank');
                    } else {
                        window.location.href = newHref;
                    }
                }
            });
        }

        function hideModActionsThings(hide) {
            const $things = $('.tb-thing');
            if(hide) {
                TBUtils.forEachChunkedDynamic($things, function(thing) {
                    const $thing = $(thing);
                    const modAction = $thing.find('.tb-moderator').length;
                    if (modAction) {
                        $thing.addClass('tb-mod-hidden');
                    }
                }, {framerate: 40});
            } else {
                TBUtils.forEachChunkedDynamic($things, function(thing) {
                    const $thing = $(thing);
                    const modAction = $thing.find('.tb-moderator').length;
                    if (modAction) {
                        $thing.removeClass('tb-mod-hidden');
                    }
                }, {framerate: 40});
            }
        }

        function filterModdable(hide) {
            const $things = $('.tb-thing');
            if(hide) {
                TBUtils.getModSubs(function () {

                    TBUtils.forEachChunkedDynamic($things, function(thing) {
                        const $thing = $(thing);
                        const subreddit = TB.utils.cleanSubredditName($thing.attr('data-subreddit'));
                        if (!TBUtils.mySubs.includes(subreddit)) {
                            $thing.addClass('tb-mod-filtered');
                        }
                    }, {framerate: 40});

                });
            } else {
                TBUtils.forEachChunkedDynamic($things, function(thing) {
                    const $thing = $(thing);
                    $thing.removeClass('tb-mod-filtered');
                }, {framerate: 40});
            }


        }

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
                            addToSiteTable(results, $siteTable, false, function() {
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

        function addToSiteTable(data, $siteTable, after, callback) {
            let commentOptions = {
                'parentLink' : true,
                'contextLink' : true,
                'contextPopup' : true,
                'fullCommentsLink' : true,
                'overviewData': true
            };

            let submissionOptions = {};

            if(subredditColor) {
                commentOptions.subredditColor = true;
                submissionOptions.subredditColor = true;
            }
            TBUtils.forEachChunkedDynamic(data, function(entry) {
                if(entry.kind === `t1`) {
                    let $comment = TBui.makeSingleComment(entry, commentOptions);
                    $siteTable.append($comment);
                    $('time.timeago').timeago();
                }

                if(entry.kind === `t3`) {
                    let $submission = TBui.makeSubmissionEntry(entry, submissionOptions);
                    $siteTable.append($submission);
                    $('time.timeago').timeago();
                }


            }).then(function() {
                if(after) {
                    $siteTable.append(`<div data-after="${after}" class="tb-load-more">load more</div>`);
                }
                setTimeout(function () {
                    TBui.tbRedditEvent($siteTable, 'comment,submission');
                    if(filterModThings) {
                        filterModdable(true);
                    }
                    if(hideModActions) {
                        hideModActionsThings(true);
                    }
                    return callback();
                }, 1000);
            });
        }

        function makeProfile(user, type, options) {
            const sort = options.sort || 'new';
            const renew = options.renew || false;
            const after = options.after || '';
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
                                <div class="tb-profile-options tb-profile-options-overview"></div>
                                <div class="tb-sitetable tb-sitetable-overview"></div>
                            `,
                            footer: ''
                        },
                        {
                            title: 'submitted',
                            tooltip: 'submitted profile.',
                            content: `
                                <div class="tb-profile-options tb-profile-options-submitted"></div>
                                <div class="tb-sitetable tb-sitetable-submitted"></div>
                            `,
                            footer: ''
                        },
                        {
                            title: 'comments',
                            tooltip: 'comment profile.',
                            content: `
                                <div class="tb-profile-options tb-profile-options-comments"></div>
                                <div class="tb-sitetable tb-sitetable-comments"></div>
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
                    filterModThings = false;
                });

            }
            let $siteTable = $overlay.find(`.tb-sitetable-${type}`);
            let $options = $overlay.find(`.tb-profile-options-${type}`);

            $siteTable.attr({
                'data-user' : user,
                'data-sort' : sort,
                'data-listing' : type
            });

            if($siteTable.hasClass('tb-sitetable-processed') && !renew && !after) {
                TB.ui.longLoadSpinner(false);
                return;
            }
            // Prevent some issues with people selecting a new sort method while toolbox is still busy.
            $options.hide();

            // Filter options
            let $filterOptions = $options.find('.tb-filter-options');
            if(!$filterOptions.length) {
                $filterOptions = $(`
                <div class="tb-filter-options">
                    <select class="tb-sort-select tb-general-button" data-type="${type}">
                        <option value="new">new</option>
                        <option value="top">top</option>
                        <option value="controversial">controversial</option>
                        <option value="hot">hot</option>
                    </select>
                    <button class="tb-general-button tb-filter-moddable">${filterModThings? 'Show unmoddable' : `Hide unmoddable`}</button>
                    <button name="hideModComments" class="tb-hide-mod-comments tb-general-button">${hideModActions ? 'Show mod actions' : `Hide mod actions`}</a>
                </div>`).appendTo($options);
            }

            const $sortSelect = $filterOptions.find('.tb-sort-select');

            $sortSelect.val(sort);
            // comment search
            if(!renew && type === 'comments' && !$body.find('#tb-searchuser').length) {
                commentSearch($options);
            }

            if(!after) {
                $siteTable.addClass('tb-sitetable-processed');
                $siteTable.empty();
            }


            TBui.switchOverlayTab('tb-profile-overlay', type);
            const inputURL = `${TBUtils.baseDomain}/user/${user}/${type}.json`;
            $.getJSON(inputURL, {
                raw_json: 1,
                'after': after,
                sort: sort,
                'limit': 25
            }, function(data) {
                let after = false;
                if (data.data.after) {
                    after = data.data.after;
                }
                addToSiteTable(data.data.children, $siteTable, after, function() {
                    TB.ui.longLoadSpinner(false);
                    $options.show();
                });
            });

        }

        $body.on('click', '.tb-load-more', function() {
            const $this = $(this);
            const $siteTable = $this.closest('.tb-sitetable');
            const after = $this.attr('data-after'),
                user = $siteTable.attr('data-user'),
                listing = $siteTable.attr('data-listing'),
                sort = $siteTable.attr('data-sort');
            makeProfile(user, listing, {sort: sort, renew: false, after: after});

            $this.remove();
        });

        $body.on('change keydown', '.tb-sort-select', function () {
            const $this = $(this);
            const newSort = $this.val(),
                user = $this.closest('.tb-page-overlay').attr('data-user'),
                listing = $this.attr('data-type');
            makeProfile(user, listing, {sort: newSort, renew: true});

        });

        $body.on('click', '.tb-filter-moddable', function() {
            const $filterMod = $body.find('.tb-filter-moddable');
            if(filterModThings) {
                filterModdable(false);
                $filterMod.text(`Hide unmoddable`);
                filterModThings = false;
            } else {
                filterModdable(true);
                $filterMod.text('Show unmoddable');
                filterModThings = true;
            }
        });

        $body.on('click', '.tb-hide-mod-comments', function() {
            const $hideMod = $('.tb-hide-mod-comments');
            if(hideModActions) {
                hideModActionsThings(false);
                $hideMod.text(`Hide mod actions`);
                hideModActions = false;
            } else {
                hideModActionsThings(true);
                $hideMod.text('Show mod actions');
                hideModActions = true;
            }
        });

        $body.on('click', '.tb-profile-overlay .tb-window-tabs a', function() {
            const $this = $(this);
            const listing = $this.attr('data-module'),
                user = $this.closest('.tb-page-overlay').attr('data-user');
            makeProfile(user, listing, {sort: 'new'});
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
                    makeProfile(user, listing, {sort: 'new', renew: false});
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

            makeProfile(user, listing, {sort: 'new', renew: false});
        });

    };


}

(function () {
    window.addEventListener('TBModuleLoaded2', function () {
        profilepro();
    });
})();
