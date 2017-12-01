function queuetools() {
    var self = new TB.Module('Queue Tools');
    self.shortname = 'QueueTools';

    self.settings['enabled']['default'] = true;

    self.register_setting('showActionReason', {
        'type': 'boolean',
        'default': true,
        'title': 'Show previously taken actions next to submissions. Based on the last 100 actions in the subreddit modlog'
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

    self.register_setting('highlightAutomodMatches', {
        'type': 'boolean',
        'default': true,
        'beta': false,
        'title': 'Highlight words in Automoderator report and action reasons which are enclosed in []. Can be used to highlight automod regex matches.'
    });


    self.init = function () {
        var $body = $('body');

        // Cached data
        var showActionReason = self.setting('showActionReason'),
            queueCreature = self.setting('queueCreature'),
            highlightAutomodMatches = self.setting('highlightAutomodMatches'),
            expandReports = self.setting('expandReports');

        function fadeOutCreature() {
            $body.find('#queueCreatureWrapper').fadeOut(300, function() { $(this).remove(); });
        }

        window.addEventListener('TBNewPage', function (event) {
            if(event.detail.pageType === 'queueListing' && queueCreature !== 'i_have_no_soul') {
                let gotQueue = $body.find('.tb-frontend-container').length;
                if(gotQueue) {
                    fadeOutCreature();
                }
                window.setTimeout(function() {
                    gotQueue = $body.find('.tb-frontend-container').length;

                    if(!gotQueue) {
                        let $noResults = $body.find('#queueCreatureWrapper');
                        if(!$noResults.length) {
                            $noResults = $('<div id="queueCreatureWrapper"><div id="queueCreature"></div></div>').appendTo($body);
                        }

                        $noResults.fadeIn('400');
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
            } else {
                fadeOutCreature();
            }

        });



    }; // queueTools.init()

    TB.register_module(self);
}// queuetools() wrapper

(function() {
    window.addEventListener('TBModuleLoaded2', function () {
        queuetools();
    });
})();
