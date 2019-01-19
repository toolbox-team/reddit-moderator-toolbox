/** @module QueueTools */
function queuetools() {
    const self = new TB.Module('Queue Tools');
    self.shortname = 'QueueTools';

    self.settings['enabled']['default'] = true;

    self.register_setting('showActionReason', {
        'type': 'boolean',
        'default': true,
        'title': 'Show previously taken actions next to submissions. Based on the last 500 actions in the subreddit modlog'
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

    self.register_setting('subredditColor', {
        'type': 'boolean',
        'default': false,
        'title': 'Add a border to items in the queue with color unique to the subreddit name.'
    });

    self.register_setting('subredditColorSalt', {
        'type': 'text',
        'default': 'PJSalt',
        'title': 'Text to randomly change the subreddit color',
        'advanced': true,
        'hidden': !self.setting('subredditColor')
    });

    self.init = function () {
        let $body = $('body');
        let modlogCache = {};

        // Cached data
        const showActionReason = self.setting('showActionReason'),
            expandActionReasonQueue = self.setting('expandActionReasonQueue'),
            queueCreature = self.setting('queueCreature');
            //expandReports = self.setting('expandReports');

        // If the queue creature element is on page it will fade it out first and then remove the element.
        function createCreature() {
            // Creature time for real!
            const $redditQueueCreature = $body.find('div:contains("The queue is clean!")');
            const gotQueueCreature = $redditQueueCreature.length;
            if(gotQueueCreature) {
                const $creatureParent = $redditQueueCreature.parents().eq(0);
                const $queueCreature = $('<div id="queueCreature"></div>');
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

                $creatureParent.html($queueCreature);
                //$queueCreature.siblings().hide();
            }
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

                // Let's try to replace the imposter creature with our own.
                createCreature();
                // To be sure let's wait a little bit and try again.
                setTimeout(function () {
                    createCreature();
                }, 500);

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
            $.getJSON(`${TBUtils.baseDomain}/r/${subreddit}/about/log/.json`, {limit: 500}).done(function (json) {
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

        function makeActionTable($target, subreddit, id) {
            TBUtils.getModSubs(function () {
                if(TBUtils.modsSub(subreddit)) {
                    getActions(subreddit, id, function(actions) {
                        if(actions) {
                            const $actionTable = $(`
                            <div class="tb-action-details">
                                <span class="tb-bracket-button tb-show-action-table">show recent actions</span>
                                <table class="tb-action-table">
                                    <tr>
                                        <th>mod</th>
                                        <th>action</th>
                                        <th>details</th>
                                        <th>time</th>
                                    </tr>
                                </table>
                            </div>
                            `);

                            $.each(actions, function (i, value) {
                                const mod = value.mod;
                                const action = value.action;
                                const details = value.details;
                                const createdUTC = TBUtils.timeConverterRead(value.created_utc);
                                const createdTimeAgo = TBUtils.timeConverterISO(value.created_utc);

                                const actionHTML = `
                                <tr>
                                    <td>${mod}</td>
                                    <td>${action}</td>
                                    <td>${details}</td>
                                    <td><time title="${createdUTC}" datetime="${createdTimeAgo}" class="live-timestamp timeago">${createdTimeAgo}</time></td>
                                </tr>
                                `;
                                $actionTable.find('.tb-action-table').append(actionHTML);
                            });

                            requestAnimationFrame(() => {
                                $target.append($actionTable);
                                $actionTable.find('time.timeago').timeago();
                            });
                        }
                    });
                }
            });

        }
        // Show history of actions near posts.
        if(showActionReason) {

            TB.listener.on('post', function(e) {
                const $target = $(e.target);
                const subreddit = e.detail.data.subreddit.name;
                const id = e.detail.data.id;
                makeActionTable($target, subreddit, id);

                if(e.detail.type === 'TBpost') {
                    const $actionTable = $target.find('.tb-action-table');
                    $actionTable.show();
                    $target.find('.tb-show-action-table').hide();
                }
            });

            TB.listener.on('comment', function(e) {
                const $target = $(e.target);
                const subreddit = e.detail.data.subreddit.name;
                const id = e.detail.data.id;

                // For now only try this on toolbox generated comments due to target placement.
                if(e.detail.type === 'TBcomment' || e.detail.type === 'TBcommentOldReddit') {
                    makeActionTable($target, subreddit, id);
                    const $actionTable = $target.find('.tb-action-table');
                    $actionTable.show();
                    $target.find('.tb-show-action-table').hide();

                }

            });

            $body.on('click', '.tb-show-action-table', function() {
                const $this = $(this);
                const $actionTable = $this.closest('.tb-action-details').find('.tb-action-table');
                if($actionTable.is(':visible')) {
                    $actionTable.hide();
                    $this.text('show recent actions');
                } else {
                    $actionTable.show();
                    $this.text('hide recent actions');
                }

            });

        }

    }; // queueTools.init()

    TB.register_module(self);
}// queuetools() wrapper

window.addEventListener('TBModuleLoaded2', function () {
    queuetools();
});
