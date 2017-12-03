/** @module QueueTools */
function queuetools() {
    const self = new TB.Module('Queue Tools');
    self.shortname = 'QueueTools';

    self.settings['enabled']['default'] = true;

    self.register_setting('showActionReason', {
        'type': 'boolean',
        'default': true,
        'title': 'Show previously taken actions next to submissions. Based on the last 100 actions in the subreddit modlog'
    });
    self.register_setting('expandActionReasonQueue', {
        'type': 'boolean',
        'default': true,
        'title': 'Automatically expand the mod action table in queues'
    });

    self.register_setting('expandReports', {
        'type': 'boolean',
        'default': false,
        'title': 'Automatically expand reports on mod pages.'
    });

    self.register_setting('queueCreature', {
        'type': 'selector',
        'values': ['kitteh', 'puppy', '/r/babyelephantgifs','/r/spiderbros', 'piggy','i have no soul'],
        'default': 'kitteh',
        'title': 'Queue Creature'
    });

    self.register_setting('directProfileToLegacy', {
        'type': 'boolean',
        'default': false,
        'title': 'Open legacy user overview when clicking on profile links.'
    });




    self.init = function () {
        let $body = $('body');
        let modlogCache = {};

        // Cached data
        const showActionReason = self.setting('showActionReason'),
            expandActionReasonQueue = self.setting('expandActionReasonQueue'),
            queueCreature = self.setting('queueCreature'),
            directProfileToLegacy = self.setting('directProfileToLegacy'),
            expandReports = self.setting('expandReports');

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

        // If the queue creature element is on page it will fade it out first and then remove the element.
        function fadeOutCreature() {
            $body.find('#queueCreatureWrapper').fadeOut(200, function() { $(this).remove(); });
        }

        // Activate on queue pages.
        window.addEventListener('TBNewPage', function (event) {
            if(expandActionReasonQueue && event.detail.pageType === 'queueListing') {
                $body.addClass('tb-show-actions');
            } else {
                $body.removeClass('tb-show-actions');
            }

            // Queue creature
            // TODO: host the images somewhere else as at some point we probably cannot use images stored for old css
            if(event.detail.pageType === 'queueListing' && queueCreature !== 'i_have_no_soul') {
                // Well maybe, let's wait a little bit.
                setTimeout(function () {
                    // Creature time for real!
                    const gotQueue = $body.find('.tb-frontend-container').length;
                    if(!gotQueue) {

                        let $noResults = $body.find('#queueCreatureWrapper');
                        if(!$noResults.length) {
                            $noResults = $('<div id="queueCreatureWrapper"><div id="queueCreature"></div></div>').appendTo($body);
                        }
                        $noResults.fadeIn('200');
                        const $queueCreature = $noResults.find('#queueCreature');
                        self.log(queueCreature);
                        if (queueCreature === 'puppy') {
                            $queueCreature.addClass('tb-puppy');
                        } else if (queueCreature === 'kitteh') {
                            $queueCreature.addClass('tb-kitteh');
                        } else if (queueCreature === '/r/babyelephantgifs') {
                            $queueCreature.addClass('tb-begifs');
                        } else if (queueCreature === '/r/spiderbros') {
                            $queueCreature.addClass('tb-spiders');
                        } else if (queueCreature === 'piggy') {
                            // https://www.flickr.com/photos/michaelcr/5797087585
                            $queueCreature.addClass('tb-piggy');
                        }
                    } else {
                        fadeOutCreature();
                    }
                }, 500);

                let qCreatureObserver = new MutationObserver(function (mutations) {

                    mutations.forEach(function (mutation) {
                        console.log(mutation);
                        let $target = $(mutation.target);

                        if ($target.find('.tb-frontend-container').length > 0) {
                            fadeOutCreature();
                        }
                        if ($target.is('.tb-frontend-container')) {
                            fadeOutCreature();
                        }
                    });
                });

                // configuration of the observer:
                // We specifically want all child elements but nothing else.
                const qCreatureConfig = {
                    attributes: false,
                    childList: true,
                    characterData: false,
                    subtree: true
                };

                const qCreatureTarget = document.querySelector('body');
                // pass in the target node, as well as the observer options
                qCreatureObserver.observe(qCreatureTarget, qCreatureConfig);

                // Wait a bit for dom changes to occur and then disconnect it again.
                setTimeout(function () {
                    qCreatureObserver.disconnect();
                }, 5000);
            } else {
                fadeOutCreature();
            }

        });

        /**
         * Callback for further handling the modlog.
         *
         * @callback getModlogCallback

         */

        /**
         * Fetches the modlog for a subreddit and updates modlogCache.
         * @function getModlog

         * @param {string} subreddit - the subreddit for which the modlog needs to be fetched
         * @param {getModlogCallback} callback - callback that handles further modlog interactions
         */
        function getModlog(subreddit, callback) {
            $.getJSON(`${TBUtils.baseDomain}/r/${subreddit}/about/log/.json?limit=100`).done(function (json) {
                $.each(json.data.children, function (i, value) {
                    const fullName = value.data.target_fullname;
                    const actionID = value.data.id;
                    if(!fullName) {
                        return;
                    }
                    if(!modlogCache[subreddit].actions.hasOwnProperty(fullName)) {
                        modlogCache[subreddit].actions[fullName] = {};
                    }
                    modlogCache[subreddit].actions[fullName][actionID] = value.data;
                });
                modlogCache[subreddit].activeFetch = false;
                callback();
            });
        }




        /**
         * Checks modLogCache for actions on the given fullName and subreddit.
         * @function checkForActions

         * @param {string} subreddit The subreddit the fullName thing belongs to.
         * @param {string} fullName Thing (post/comment) fullName
         * @returns {(false|object)} Either false or an object with actions
         */
        function checkForActions(subreddit, fullName) {
            if(modlogCache[subreddit].actions.hasOwnProperty(fullName)) {
                return modlogCache[subreddit].actions[fullName];
            } else {
                return false;
            }
        }

        /**
         * Callback for further handling the modlog.
         * @callback getActionsCallback

         * @param {(Boolean|Object)} result Either false or an object with actions
         */

        /**
         * Checks for mod actions on the given fullName thing and subreddit through a caching mechanism.
         * @function getActions

         * @param {string} subreddit - the subreddit for which the modlog needs to be fetched
         * @param {string} fullName - thing (post/comment) fullName
         * @param {getActionsCallback} callback - callback that handles further modlog interactions
         */
        function getActions(subreddit, fullName, callback) {
            self.log(subreddit);
            const dateNow = Date.now();

            // check if we even have data
            if(!modlogCache.hasOwnProperty(subreddit)) {
                modlogCache[subreddit] = {
                    actions: {},
                    activeFetch: true,
                    lastFetch: dateNow
                };

                getModlog(subreddit, function() {
                    callback(checkForActions(subreddit, fullName));
                });

            // If we do have data but it is being refreshed we wait and try again.
            } else if (modlogCache.hasOwnProperty(subreddit) && modlogCache[subreddit].activeFetch) {
                setTimeout(function() {
                    getActions(subreddit, fullName, callback);
                }, 100);
            } else if ((dateNow - modlogCache[subreddit].lastFetch) > 300000) {
                getModlog(subreddit, function() {
                    callback(checkForActions(subreddit, fullName));
                });
            } else {
                callback(checkForActions(subreddit, fullName));
            }

        }

        // Show history of actions near posts.
        if(showActionReason) {
            TB.listener.on('post', function(e) {

                const $target = $(e.target);
                const subreddit = e.detail.data.subreddit.name;
                const id = e.detail.data.id;
                TBUtils.getModSubs(function () {
                    if(TBUtils.modsSub(subreddit)) {
                        getActions(subreddit, id, function(actions) {
                            if(actions) {
                                let $postActionTable = $(`
                                <div class="tb-action-details">
                                    <span class="tb-bracket-button tb-show-action-table">recent mod actions history</span>
                                    <table class="tb-action-table">
                                        <tr>
                                            <th>mod</th>
                                            <th>action</th>
                                            <th>time</th>
                                        </tr>
                                    </table>
                                </div>
                                `);
                                $.each(actions, function (i, value) {
                                    const mod = value.mod;
                                    const action = value.action;
                                    const createdUTC = TBUtils.timeConverterRead(value.created_utc);
                                    const createdTimeAgo = TBUtils.timeConverterISO(value.created_utc);

                                    const actionHTML = `
                                    <tr>
                                        <td>${mod}</td>
                                        <td>${action}</td>
                                        <td><time title="${createdUTC}" datetime="${createdTimeAgo}" class="live-timestamp timeago">${createdTimeAgo}</time></td>
                                    </tr>
                                    `;
                                    $postActionTable.find('.tb-action-table').append(actionHTML);

                                });
                                $target.append($postActionTable);
                                $postActionTable.find('time.timeago').timeago();


                            }
                        });
                    }
                });
            });
        }

    }; // queueTools.init()

    TB.register_module(self);
}// queuetools() wrapper

(function() {
    window.addEventListener('TBModuleLoaded2', function () {
        queuetools();
    });
})();
