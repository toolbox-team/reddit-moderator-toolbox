function profilepro () {
    const self = new TB.Module('Profile Pro');
    self.shortname = 'Profile';

    // //Default settings
    self.settings['enabled']['default'] = true;

    self.config['betamode'] = false;

    self.register_setting('alwaysTbProfile', {
        type: 'boolean',
        default: false,
        title: 'Always open toolbox profile overlay on reddit profiles.',
    });

    self.register_setting('profileButtonEnabled', {
        type: 'boolean',
        default: true,
        title: 'Show profile button next to usernames in subs you mod. Allows you to quickly open the toolbox profile on that page.',
    });

    self.register_setting('directProfileToLegacy', {
        type: 'boolean',
        default: false,
        title: 'Open legacy user overview when clicking on profile links.',
    });

    self.register_setting('subredditColor', {
        type: 'boolean',
        default: TB.storage.getSetting('QueueTools', 'subredditColor', false),
        hidden: true,
    });

    self.register_setting('onlyshowInhover', {
        type: 'boolean',
        default: TB.storage.getSetting('GenSettings', 'onlyshowInhover', true),
        hidden: true,
    });

    TB.register_module(self);

    self.init = function () {
        const $body = $('body');
        let filterModThings = false;
        let hideModActions = false;

        const alwaysTbProfile = self.setting('alwaysTbProfile'),
              directProfileToLegacy = self.setting('directProfileToLegacy'),
              subredditColor = self.setting('subredditColor'),
              profileButtonEnabled = self.setting('profileButtonEnabled'),
              onlyshowInhover = self.setting('onlyshowInhover');

        if (directProfileToLegacy) {
            $body.on('click', 'a', function (event) {
                const userProfileRegex = /(?:\.reddit\.com)?\/(?:user|u)\/[^/]*?\/?$/;
                const thisHref = $(this).attr('href');

                // If the url matches and we are not on an old style profile already.
                if (userProfileRegex.test(thisHref) && !userProfileRegex.test(window.location.href)) {
                    event.preventDefault();
                    const lastChar = thisHref.substr(-1);
                    const newHref = `${thisHref}${lastChar === `/` ? `` : `/`}overview`;
                    if (event.ctrlKey || event.metaKey) {
                        window.open(newHref, '_blank');
                    } else {
                        window.location.href = newHref;
                    }
                }
            });
        }

        function hideModActionsThings (hide) {
            const $things = $('.tb-thing');
            if (hide) {
                TBUtils.forEachChunkedDynamic($things, thing => {
                    const $thing = $(thing);
                    const modAction = $thing.find('.tb-moderator').length;
                    if (modAction) {
                        $thing.addClass('tb-mod-hidden');
                    }
                }, {framerate: 40});
            } else {
                TBUtils.forEachChunkedDynamic($things, thing => {
                    const $thing = $(thing);
                    const modAction = $thing.find('.tb-moderator').length;
                    if (modAction) {
                        $thing.removeClass('tb-mod-hidden');
                    }
                }, {framerate: 40});
            }
        }

        function filterModdable (hide) {
            const $things = $('.tb-thing');
            if (hide) {
                TBUtils.getModSubs(() => {
                    TBUtils.forEachChunkedDynamic($things, thing => {
                        const $thing = $(thing);
                        const subreddit = TB.utils.cleanSubredditName($thing.attr('data-subreddit'));
                        if (!TBUtils.mySubs.includes(subreddit)) {
                            $thing.addClass('tb-mod-filtered');
                        }
                    }, {framerate: 40});
                });
            } else {
                TBUtils.forEachChunkedDynamic($things, thing => {
                    const $thing = $(thing);
                    $thing.removeClass('tb-mod-filtered');
                }, {framerate: 40});
            }
        }

        function addToSiteTable (data, $siteTable, after, callback) {
            const commentOptions = {
                parentLink: true,
                contextLink: true,
                contextPopup: true,
                fullCommentsLink: true,
                overviewData: true,
            };

            const submissionOptions = {};

            if (subredditColor) {
                commentOptions.subredditColor = true;
                submissionOptions.subredditColor = true;
            }
            TBUtils.forEachChunkedDynamic(data, entry => {
                if (entry.kind === `t1`) {
                    const $comment = TBui.makeSingleComment(entry, commentOptions);
                    if (entry.highlight) {
                        $comment.find('.md p').highlight(entry.highlight, '', true);
                    }
                    $siteTable.append($comment);
                    $('time.timeago').timeago();
                }

                if (entry.kind === `t3`) {
                    const $submission = TBui.makeSubmissionEntry(entry, submissionOptions);
                    if (entry.highlight) {
                        $submission.find('.tb-title, .md').highlight(entry.highlight, '', true);
                    }
                    $siteTable.append($submission);
                    $('time.timeago').timeago();
                }
            }).then(() => {
                if (after) {
                    $siteTable.append(`<div data-after="${after}" class="tb-load-more">load more</div>`);
                }
                setTimeout(() => {
                    TBui.tbRedditEvent($siteTable, 'comment,submission');
                    if (filterModThings) {
                        filterModdable(true);
                    }
                    if (hideModActions) {
                        hideModActionsThings(true);
                    }
                    return callback();
                }, 1000);
            });
        }

        function addTrophiesToSidebar (user, $sidebar) {
            const inputURL = `${TBUtils.baseDomain}/user/${user}/trophies.json`;
            $.getJSON(inputURL).done(data => {
                if (Object.keys(data).length > 0 && data.constructor === Object) {
                    TBStorage.purifyObject(data);
                    const $userTrophies = $(`<div class="tb-user-trophies">
                        <h3> Trophies </h3>
                    </div>`).appendTo($sidebar);
                    $.each(data.data.trophies, (i, trophy) => {
                        let tropyHTML;

                        const trophyInnerHTML = `
                            <img class="tb-trophy-icon" src="${trophy.data.icon_40}">
                            <br>
                            <span class="tb-trophy-name">${trophy.data.name}</span>
                            <br>
                            ${trophy.data.description ? `<span class="tb-trophy-description">${trophy.data.description}</span>` : ``}
                            <br>`;

                        if (trophy.data.url) {
                            tropyHTML = `
                            <div class="tb-trophy-info">
                                <a href="${trophy.data.url}">
                                    ${trophyInnerHTML}
                                </a>
                            </div>`;
                        } else {
                            tropyHTML = `
                            <div class="tb-trophy-info">
                                ${trophyInnerHTML}
                            </div>`;
                        }
                        $userTrophies.append(tropyHTML);
                    });
                }
            });
        }

        function addModSubsToSidebar (user, $sidebar) {
            const inputURL = `${TBUtils.baseDomain}/user/${user}/moderated_subreddits.json`;
            $.getJSON(inputURL).done(data => {
                if (Object.keys(data).length > 0 && data.constructor === Object) {
                    TBStorage.purifyObject(data);
                    const $userModSubs = $(`<div class="tb-user-modsubs">
                        <h3> ${data.data.length} Moderated subreddits </h3>
                    </div>`).appendTo($sidebar);

                    const $moderatedSubListVisible = $('<ul class="tb-user-modsubs-ul"></ul>').appendTo($userModSubs);
                    const $moderatedSubListExpanded = $('<ul class="tb-user-modsubs-expand-ul"></ul>').appendTo($userModSubs);
                    let subCount = 0;

                    TBUtils.forEachChunkedDynamic(data.data, subreddit => {
                        subCount++;
                        const subredditName = subreddit.sr,
                              iconImage = subreddit.icon_img,
                              over18 = subreddit.over_18,
                              subscribers = subreddit.subscribers;

                        const liElement = `<li>
                            <a href="${TBUtils.tempBaseDomain}/r/${subredditName}" title="${subscribers} subscribers">/r/${subredditName}</a>
                            ${over18 ? `<span class="tb-nsfw-stamp tb-stamp"><acronym title="Adult content: Not Safe For Work">NSFW</acronym></span>` : ''}
                            ${iconImage ? `<img src="${iconImage}" class="tb-subreddit-icon">` : ``}
                        </li>`;

                        if (subCount < 10) {
                            $moderatedSubListVisible.append(liElement);
                        } else {
                            $moderatedSubListExpanded.append(liElement);
                        }
                    }, {framerate: 40}).then(() => {
                        if (subCount > 10) {
                            $moderatedSubListVisible.after(`<button class="tb-general-button tb-sidebar-loadmod tb-more" data-action="more">${subCount - 10} more ...</button>`);
                            $moderatedSubListExpanded.after(`<button class="tb-general-button tb-sidebar-loadmod tb-less" data-action="less">show ${subCount - 10} less</button>`);

                            $body.on('click', '.tb-sidebar-loadmod', function () {
                                const $this = $(this);
                                const action = $this.attr('data-action');

                                if (action === 'more') {
                                    $moderatedSubListExpanded.show();
                                    $sidebar.find('.tb-sidebar-loadmod.tb-less').show();
                                    $this.hide();
                                } else if (action === 'less') {
                                    $moderatedSubListExpanded.hide();
                                    $sidebar.find('.tb-sidebar-loadmod.tb-more').show();
                                    $this.hide();
                                }
                            });
                        }

                        addTrophiesToSidebar(user, $sidebar);
                    });
                } else {
                    addTrophiesToSidebar(user, $sidebar);
                }
            });
        }
        function makeUserSidebar (user, $overlay) {
            const $tabWrapper = $overlay.find('.tb-window-tabs-wrapper');
            const inputURL = `${TBUtils.baseDomain}/user/${user}/about.json`;
            $.getJSON(inputURL).done(data => {
                TBStorage.purifyObject(data);
                const userThumbnail = data.data.icon_img,
                      userCreated = data.data.created_utc,
                      verifiedMail = data.data.has_verified_email,
                      linkKarma = data.data.link_karma,
                      commentKarma = data.data.comment_karma;
                const readableCreatedUTC = TBUtils.timeConverterRead(userCreated),
                      createdTimeAgo = TBUtils.timeConverterISO(userCreated);

                const $sidebar = $(`<div class="tb-profile-sidebar">
                    ${userThumbnail ? `<img src="${userThumbnail}" class="tb-user-thumbnail">` : ``}
                    <ul class="tb-user-detail-ul">
                        <li><a href="${TBUtils.tempBaseDomain}/user/${user}">/u/${user}</a></li>
                        <li>Link karma: ${linkKarma}</li>
                        <li>Comment karma: ${commentKarma}</li>
                        <li>Joined <time title="${readableCreatedUTC}" datetime="${createdTimeAgo}" class="tb-live-timestamp timeago">${createdTimeAgo}</time></li>
                        <li>${verifiedMail ? `Verified mail` : `No verified mail`}</li>
                    </ul>
                </div>`);
                $tabWrapper.after($sidebar);
                $sidebar.find('time.timeago').timeago();

                addModSubsToSidebar(user, $sidebar);
            });
        }

        function searchProfile (user, type, sortMethod, $siteTable, options, after, match, callback) {
            let hits = match || false;
            const results = [];
            const subredditPattern = options.subredditPattern || false;
            const searchPattern = options.searchPattern || false;

            if (!subredditPattern && !searchPattern) {
                return callback(false);
            }
            const inputURL = `${TBUtils.baseDomain}/user/${user}/${type}.json`;
            $.getJSON(inputURL, {
                raw_json: 1,
                after,
                sort: sortMethod,
                limit: 100,
                t: 'all',
            }).done(data => {
                TBStorage.purifyObject(data);
                $.each(data.data.children, (i, value) => {
                    let hit = false;
                    let subredditMatch = false;
                    let patternMatch = false;
                    if (value.kind === 't1') {
                        subredditMatch = subredditPattern && subredditPattern.test(value.data.subreddit);
                        patternMatch = searchPattern && searchPattern.test(value.data.body);
                    }

                    if (value.kind === 't3') {
                        subredditMatch = subredditPattern && subredditPattern.test(value.data.subreddit);
                        patternMatch = searchPattern && (value.data.selftext && searchPattern.test(value.data.selftext) || searchPattern.test(value.data.title));
                    }

                    if (
                        (subredditMatch && !searchPattern) ||
                        (patternMatch && !subredditPattern) ||
                        (subredditMatch && patternMatch)
                    ) {
                        hit = true;
                    }

                    if (hit) {
                        if (searchPattern) {
                            value.highlight = options.searchString;
                        }
                        results.push(value);
                        hits = true;
                    }
                });
                if (!data.data.after) {
                    return callback(hits);
                } else {
                    if (results.length > 0) {
                        addToSiteTable(results, $siteTable, false, () => {
                            searchProfile(user, type, sortMethod, $siteTable, options, data.data.after, match, found => callback(found));
                        });
                    } else {
                        searchProfile(user, type, sortMethod, $siteTable, options, data.data.after, match, found => callback(found));
                    }
                }
            });
        }

        function regExpEscape (query) {
            return query.trim().replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
        }

        $body.on('submit', '.tb-searchuser', function () {
            TB.ui.longLoadSpinner(true);
            const $this = $(this);
            const $windowContent = $this.closest('.tb-window-content');
            const $siteTable = $windowContent.find('.tb-sitetable');

            const typeListing = $siteTable.attr('data-listing');

            let subredditsearch = $this.find('.tb-subredditsearch').val();
            const usersearch = $this.closest('.tb-page-overlay').attr('data-user'),
                  contentsearch = $this.find('.tb-contentsearch').val(),
                  useSort = $this.find('.tb-search-sort').is(':checked');

            let sortMethod = 'new';

            if (useSort) {
                sortMethod = $siteTable.attr('data-sort');
            }

            subredditsearch = subredditsearch.replace(/\/?r\//g, '');
            subredditsearch = TBUtils.htmlEncode(subredditsearch);

            $siteTable.removeClass('tb-sitetable-processed');
            $siteTable.empty();

            const searchOptions = {};
            if (subredditsearch) {
                searchOptions.subredditPattern = new RegExp(`^${regExpEscape(subredditsearch)}$`, 'i');
            }
            if (contentsearch) {
                searchOptions.searchPattern = new RegExp(regExpEscape(contentsearch), 'gi');
                searchOptions.searchString = contentsearch;
            }
            searchProfile(usersearch, typeListing, sortMethod, $siteTable, searchOptions, null, false, results => {
                if (results) {
                    TB.ui.longLoadSpinner(false);
                } else {
                    TB.ui.longLoadSpinner(false);
                    $siteTable.append('<div class="error">no results found</div>');
                }
            });
            return false;
        });

        function populateSearchSuggestion (subreddit) {
            if (subreddit && TBUtils.mySubs.includes(subreddit)) {
                $body.find('#tb-search-suggest table#tb-search-suggest-list').append(`<tr data-subreddit="${subreddit}"><td>${subreddit}</td></td></tr>`);
            }
            $(TBUtils.mySubs).each(function () {
                if (this !== subreddit) {
                    $body.find('#tb-search-suggest table#tb-search-suggest-list').append(`<tr data-subreddit="${this}"><td>${this}</td></td></tr>`);
                }
            });
        }

        function liveSearch (liveSearchValue) {
            $body.find('#tb-search-suggest table#tb-search-suggest-list tr').each(function () {
                const $this = $(this),
                      subredditName = $this.attr('data-subreddit');

                if (subredditName.toUpperCase().indexOf(liveSearchValue.toUpperCase()) < 0) {
                    $this.hide();
                } else {
                    $this.show();
                }
            });
        }

        function initSearchSuggestion (subreddit) {
            if (!$body.find('#tb-search-suggest').length) {
                $body.append('<div id="tb-search-suggest" style="display: none;"><table id="tb-search-suggest-list"></table></div>');
                TBUtils.getModSubs(() => {
                    populateSearchSuggestion(subreddit);
                });
            }

            $body.on('focus', '.tb-subredditsearch', function () {
                const offset = $(this).offset();
                const offsetLeft = offset.left;
                const offsetTop = (offset.top + 26);

                $body.find('#tb-search-suggest').css({
                    left: `${offsetLeft}px`,
                    top: `${offsetTop}px`,
                });

                if (!$body.find('#tb-search-suggest').is(':visible')) {
                    $body.find('#tb-search-suggest').show();
                }
                const liveSearchValue = $(this).val();
                liveSearch(liveSearchValue);
            });

            $body.find('.tb-subredditsearch').keyup(function () {
                const liveSearchValue = $(this).val();
                liveSearch(liveSearchValue);
            });

            $(document).on('click', event => {
                if (!$(event.target).closest('#tb-search-suggest').length && !$(event.target).closest('.tb-subredditsearch').length) {
                    $body.find('#tb-search-suggest').hide();
                }
            });

            $body.on('click', '#tb-search-suggest-list tr', function () {
                const subSuggestion = $(this).attr('data-subreddit');
                $body.find('.tb-subredditsearch:visible').val(subSuggestion);
                $body.find('#tb-search-suggest').hide();
            });
        }

        function makeProfile (user, type, options) {
            const sort = options.sort || 'new';
            const renew = options.renew || false;
            const after = options.after || '';
            const subreddit = options.subreddit || '';
            TB.ui.longLoadSpinner(true);

            let $overlay = $body.find('.tb-profile-overlay');

            if (!$overlay.length) {
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
                            footer: '',
                        },
                        {
                            title: 'submitted',
                            tooltip: 'submitted profile.',
                            content: `
                                <div class="tb-profile-options tb-profile-options-submitted"></div>
                                <div class="tb-sitetable tb-sitetable-submitted"></div>
                            `,
                            footer: '',
                        },
                        {
                            title: 'comments',
                            tooltip: 'comment profile.',
                            content: `
                                <div class="tb-profile-options tb-profile-options-comments"></div>
                                <div class="tb-sitetable tb-sitetable-comments"></div>
                            `,
                            footer: '',
                        },
                    ],
                    [], // extra header buttons
                    'tb-profile-overlay tb-overlay-horizontal-tabs', // class
                    false, // single overriding footer
                    {
                        user,
                    }
                ).appendTo('body');

                $body.css('overflow', 'hidden');

                makeUserSidebar(user, $overlay);
                $body.on('click', '.tb-profile-overlay .tb-window-header .close', () => {
                    $('.tb-profile-overlay').remove();
                    $body.css('overflow', 'auto');
                    filterModThings = false;
                });
            }
            const $siteTable = $overlay.find(`.tb-sitetable-${type}`);
            const $options = $overlay.find(`.tb-profile-options-${type}`);

            $siteTable.attr({
                'data-user': user,
                'data-sort': sort,
                'data-listing': type,
                't': 'all',
            });

            if ($siteTable.hasClass('tb-sitetable-processed') && !renew && !after) {
                TB.ui.longLoadSpinner(false);
                return;
            }
            // Prevent some issues with people selecting a new sort method while toolbox is still busy.
            $options.hide();

            // Filter options
            let $filterOptions = $options.find('.tb-filter-options');
            if (!$filterOptions.length) {
                $filterOptions = $(`
                <div class="tb-filter-options">
                    <select class="tb-sort-select tb-general-button" data-type="${type}">
                        <option value="new">new</option>
                        <option value="top">top</option>
                        <option value="controversial">controversial</option>
                        <option value="hot">hot</option>
                    </select>
                    <button class="tb-general-button tb-filter-moddable">${filterModThings ? 'Show unmoddable' : `Hide unmoddable`}</button>
                    <button name="hideModComments" class="tb-hide-mod-comments tb-general-button">${hideModActions ? 'Show mod actions' : `Hide mod actions`}</a>
                </div>`).appendTo($options);

                $options.append(`<form class="tb-searchuser">
                        search: <input type="text" placeholder="subreddit" class="tb-subredditsearch tb-input tb-search-input"> <input type="text" placeholder="content (optional)" class="tb-contentsearch tb-input tb-search-input">
                        <label> <input type="checkbox" class="tb-search-sort"> use sort selection </label>
                        <input type="submit" value=" search " class="tb-action-button">
                </form>`);
                initSearchSuggestion(subreddit);
            }

            const $sortSelect = $filterOptions.find('.tb-sort-select');

            $sortSelect.val(sort);

            if (!after) {
                $siteTable.addClass('tb-sitetable-processed');
                $siteTable.empty();
            }

            TBui.switchOverlayTab('tb-profile-overlay', type);
            const inputURL = `${TBUtils.baseDomain}/user/${user}/${type}.json`;
            $.getJSON(inputURL, {
                raw_json: 1,
                after,
                sort,
                limit: 25,
            }, data => {
                TBStorage.purifyObject(data);
                let after = false;
                if (data.data.after) {
                    after = data.data.after;
                }
                addToSiteTable(data.data.children, $siteTable, after, () => {
                    TB.ui.longLoadSpinner(false);
                    $options.show();
                });
            });
        }

        $body.on('click', '.tb-load-more', function () {
            const $this = $(this);
            const $siteTable = $this.closest('.tb-sitetable');
            const after = $this.attr('data-after'),
                  user = $siteTable.attr('data-user'),
                  listing = $siteTable.attr('data-listing'),
                  sort = $siteTable.attr('data-sort');
            makeProfile(user, listing, {sort, renew: false, after});

            $this.remove();
        });

        $body.on('change keydown', '.tb-sort-select', function () {
            const $this = $(this);
            const newSort = $this.val(),
                  user = $this.closest('.tb-page-overlay').attr('data-user'),
                  listing = $this.attr('data-type');
            makeProfile(user, listing, {sort: newSort, renew: true});
        });

        $body.on('click', '.tb-filter-moddable', () => {
            const $filterMod = $body.find('.tb-filter-moddable');
            if (filterModThings) {
                filterModdable(false);
                $filterMod.text(`Hide unmoddable`);
                filterModThings = false;
            } else {
                filterModdable(true);
                $filterMod.text('Show unmoddable');
                filterModThings = true;
            }
        });

        $body.on('click', '.tb-hide-mod-comments', () => {
            const $hideMod = $('.tb-hide-mod-comments');
            if (hideModActions) {
                hideModActionsThings(false);
                $hideMod.text(`Hide mod actions`);
                hideModActions = false;
            } else {
                hideModActionsThings(true);
                $hideMod.text('Show mod actions');
                hideModActions = true;
            }
        });

        $body.on('click', '.tb-profile-overlay .tb-window-tabs a', function () {
            const $this = $(this);
            const listing = $this.attr('data-module'),
                  user = $this.closest('.tb-page-overlay').attr('data-user');
            makeProfile(user, listing, {sort: 'new'});
        });

        window.addEventListener('TBNewPage', event => {
            const popupTypes = ['comments', 'submitted', 'overview'];
            if (event.detail.pageType === 'userProfile' && popupTypes.includes(event.detail.pageDetails.listing)) {
                const user = event.detail.pageDetails.user,
                      listing = event.detail.pageDetails.listing;
                TBui.contextTrigger('tb-user-profile', {
                    addTrigger: true,
                    triggerText: `toolbox profile`,
                    triggerIcon: 'account_circle',
                    title: `Show toolbox profile for /u/${user}`,
                    dataAttributes: {
                        user,
                        listing,
                    },
                });
                if (alwaysTbProfile) {
                    makeProfile(user, listing, {sort: 'new', renew: false});
                }
            } else {
                TBui.contextTrigger('tb-user-profile', {addTrigger: false});
            }
        });

        if (profileButtonEnabled) {
            TB.listener.on('author', e => {
                const $target = $(e.target);

                if (!$target.closest('.tb-profile-overlay').length && (!onlyshowInhover || TBUtils.isOldReddit)) {
                    const author = e.detail.data.author;
                    const subreddit = e.detail.data.subreddit.name;
                    TBUtils.getModSubs(() => {
                        if (TBUtils.modsSub(subreddit)) {
                            const profileButton = `<a href="javascript:;" class="tb-user-profile tb-bracket-button" data-listing="overview" data-user="${author}" data-subreddit="${subreddit}" title="view & filter user's profile in toolbox overlay">P</a>`;
                            requestAnimationFrame(() => {
                                $target.append(profileButton);
                            });
                        }
                    });
                }
            });

            TB.listener.on('userHovercard', e => {
                const $target = $(e.target);
                const subreddit = e.detail.data.subreddit.name;
                const author = e.detail.data.user.username;

                TBUtils.getModSubs(() => {
                    if (TBUtils.modsSub(subreddit)) {
                        const profileButton = `<a href="javascript:;" class="tb-user-profile tb-bracket-button" data-listing="overview" data-user="${author}" data-subreddit="${subreddit}" title="view & filter user's profile in toolbox overlay">Toolbox Profile View</a>`;
                        $target.append(profileButton);
                    }
                });
            });
        }

        $body.on('click', '#tb-user-profile, .tb-user-profile', function () {
            const $this = $(this);
            const user = $this.attr('data-user'),
                  listing = $this.attr('data-listing'),
                  subreddit = $this.attr('data-subreddit');

            const options = {
                sort: 'new',
                renew: false,
            };
            if (subreddit) {
                options.subreddit = subreddit;
            }
            makeProfile(user, listing, options);
        });
    };
}

window.addEventListener('TBModuleLoaded2', () => {
    profilepro();
});
