function newmodmailpro() {
    var self = new TB.Module('New Mod Mail Pro');
    self.shortname = 'NewModMail';

////Default settings
    self.settings['enabled']['default'] = false;
    self.config['betamode'] = false;

    self.register_setting('modmaillink', {
        'type': 'selector',
        'values': ['All modmail', 'New', 'In Progress', 'Archived', 'Highlighted', 'Mod Discussions', 'Notifications'],
        'default': 'all_modmail',
        'title': 'Change the modmail link to open a different modmail view by default.'
    });

    self.register_setting('openmailtab', {
        'type': 'boolean',
        'default': true,
        'title': 'Open modmail in a new tab.'
    });

    self.register_setting('lastreplytypecheck', {
        'type': 'boolean',
        'default': true,
        'title': 'Warns you if you reply as yourself but the last reply type is a private mod note or a "as subreddit" reply. '
    });

    self.register_setting('modmailnightmode', {
        'type': 'boolean',
        'default': false,
        'title': 'Open modmail in nightmode'
    });

    self.register_setting('searcharchive', {
        'type': 'boolean',
        'default': false,
        'beta': true,
        'title': 'Add rudimentary search functionality to the archive page. This will only be able to search the preview text.'
    });

    let activeSearch = false,
        searchAdded = false;

    // Function to search through archive.
    function searchAndScroll(searchString, $threadPreviewerThreads, $searchResults, count) {
        // Debugging so we can see if this is running.
        self.log(`searchAndScroll: ${count}`);
        count++;

        // Let's not bother with case sensitive searching.
        searchString = searchString.toLowerCase();
        $threadPreviewerThreads.find('.ThreadPreviewViewer__thread:not(.tb-searched)').each(function() {

            let $this = $(this);
            // Again, let's not bother.
            const previewText = $this.text().toLowerCase();

            // We have a match! Let's hangle it.
            if(previewText.includes(searchString)) {
                // Clone the preview bit (react doesn't like it when we just move it)
                const $thisClone = $this.clone();

                // Remove the archive button as it will no longer work.
                $thisClone.find('.icon-archived').remove();

                // Highlight the match.
                $thisClone.highlight(searchString);
                $searchResults.append($thisClone);
            }
            // And mark it as processed.
            $this.addClass('tb-searched');

        });

        // If the stop button has not been pressed we will do another loop.
        if(activeSearch) {
            // Get the current scroll position.
            let scrollTop = $threadPreviewerThreads.scrollTop();
            // Add 300
            let scrollDistance = scrollTop + 300;
            // And scroll a bit down so we trigger new previews to load.
            $threadPreviewerThreads.scrollTop(scrollDistance);

            // Now wait a bit so we are sure they are loaded and then activate another loop of this function.
            setTimeout(function(){
                searchAndScroll(searchString, $threadPreviewerThreads, $searchResults, count);
            }, 1000);
        }
    }

    // Activate search functionality or deactivate it when appropriate.
    function addSearch(locationHref) {
        // Activate search functionality when the correct location is given.
        if(locationHref === 'https://mod.reddit.com/mail/archived') {
            // Prepare the search input bits.
            const $searchHeaderDiv = $('<div id="tb-search-header"><input type="text" id="tb-search-value"> <button class="tb-action-button" id="tb-search-start">Search</button><button class="tb-action-button tb-button-hidden" id="tb-search-stop">Stop search</button>');
            let $selectAfter = $body.find('.ThreadPreviewViewerHeader__select');
            $selectAfter.after($searchHeaderDiv);

            // Prepare the DIV which will show the results and add it to the body.
            const $searchResults = $('<div>', {id: 'tb-search-result'});
            $body.append($searchResults);

            // This is the area where the individual previews reside. We will pass this to the search function.
            const $threadPreviewerThreads = $body.find('.ThreadPreviewViewer__threads>div');

            // Search bits have been added.
            searchAdded = true;

            // Start search button is clicked, let's start searching!
            $body.on('click', '#tb-search-start', function() {
                // Hide the button.
                $(this).addClass('tb-button-hidden');
                // Show the stop button. (search will keep running)/
                // TODO built functionality to stop searching when results are older than X period.
                $body.find('#tb-search-stop').removeClass('tb-button-hidden');

                // Activate long load spinner.
                TB.ui.longLoadSpinner(true);

                // Scroll to the top of the preview area so we include all the bits.
                $threadPreviewerThreads.scrollTop(0);

                // Clear out possible previous results and show the results area.
                $searchResults.empty();
                $searchResults.show();

                // Grab the search string.
                const searchString = $body.find('#tb-search-value').val();

                // Indicate we are searching.
                activeSearch = true;

                // And start the search!
                searchAndScroll(searchString, $threadPreviewerThreads, $searchResults, 1);
            });

            // Searching continues all the time until you hit the stop button.
            $body.on('click', '#tb-search-stop', function() {
                $(this).addClass('tb-button-hidden');
                $body.find('#tb-search-start').removeClass('tb-button-hidden');
                TB.ui.longLoadSpinner(false);
                activeSearch = false;
            });

            // We can't use react functionality so instead we make the thing do an actual page load when a preview thingy is clicked.
            $searchResults.on('click', '.ThreadPreviewViewer__thread:not(a)', function() {
                const $this = $(this);
                const permaLink = $this.find('.ThreadPreview__headerRight a').attr('href');
                TB.ui.longLoadSpinner(false);
                window.location.href = `https://mod.reddit.com${permaLink}`;
            });

            // Just making sure you can still click on urls visible in the preview.
            $searchResults.on('click', 'a', function(event) {
                event.stopPropagation();
            });

        // If search was already added we can assume we are moving away from the archive page and that we need to clean up.
        } else if(searchAdded) {
            $body.find('#tb-search-header').remove();
            $body.find('#tb-search-result').remove();
            if(activeSearch) {
                TB.ui.longLoadSpinner(false);
            }
        }
    }


    // All stuff we want to do when we are on new modmail
    if (TBUtils.isNewModmail) {
        // Add a class to body
        var $body = $('body');

        $body.addClass('tb-new-modmail');

        // ready some variables.
        var modMailNightmode = self.setting('modmailnightmode'),
            lastReplyTypeCheck = self.setting('lastreplytypecheck'),
            searchArchive = self.setting('searcharchive');


        if (lastReplyTypeCheck && TBUtils.isNewMMThread) {
            $body.on('click', '.ThreadViewerReplyForm__replyButton', function(event) {

                // Get all mod replies and see if they are something we need to warn the user about.
                let $lastReply = $body.find('.Thread__messages .Thread__message:has(.m-mod)').last();
                const replyTypeMyself = $body.find('.FancySelect__valueText').text() === 'Reply as myself';

                // if it finds this the last mod that replied did so with "as subreddit".
                if ($lastReply.find('.icon-profile-slash').length && replyTypeMyself) {
                    if (confirm('The last mod that replied did so as the subreddit, are you sure you want to reply as yourself?')) {
                        // Ok, do nothing and let the message be posted.
                    } else {
                        // Not ok, prevent the button from being clicked.
                        event.preventDefault();
                    }

                }

                // If it finds this class it means the last reply was a private mod note.
                if ($lastReply.find('.Thread__messageIsMod').length && replyTypeMyself) {
                    if (confirm('The last mod that replied did so with a private mod note, are you sure you want to reply as yourself?')) {
                        // Ok, do nothing and let the message be posted.
                    } else {
                        // Not ok, prevent the button from being clicked.
                        event.preventDefault();
                    }
                }

            });
        }

        if (modMailNightmode) {
            // Let's make sure RES nightmode doesn't mess things up.
            $('html, body').removeClass('res-nightmode');

            // Now enable toolbox nightmode.
            // Firefox can't do simple nightmode so we do it like this
            if(TBUtils.browser === 'firefox') {
                $('html').addClass('tb-nightmode-firefox');
                $('body').addClass('tb-nightmode-firefox');
            } else {
                $('html').addClass('tb-nightmode');
            }
        }

        // Let's add search if needed.
        if(searchArchive) {
            addSearch(location.href);
            window.addEventListener('TBNewPage', function (event) {
                addSearch(event.detail.locationHref);
            });

        }
    }

    // Below all stuff we do when we are NOT on new modmail.
    if (!TBUtils.isNewModmail) {

        // ready some variables.
        var modmailLink = self.setting('modmaillink'),
            openMailTab = self.setting('openmailtab');


        // Let's mess around with the link to modmail.
        var $newModmailLinkElement = $('#new_modmail'),
            newModmailBaseUrl = 'https://mod.reddit.com/mail/';

        // Open modmail in a new tab if the option is selected
        if (openMailTab) {
            $newModmailLinkElement.attr('target', '_blank');
        }

        // let's replace urls.
        switch(modmailLink) {
            case 'all_modmail':
                $newModmailLinkElement.attr('href', newModmailBaseUrl + 'all');

                break;
            case 'new':
                $newModmailLinkElement.attr('href', newModmailBaseUrl + 'new');

                break;
            case 'in_progress':
                $newModmailLinkElement.attr('href', newModmailBaseUrl + 'inprogress');

                break;
            case 'archived':
                $newModmailLinkElement.attr('href', newModmailBaseUrl + 'archived');

                break;
            case 'highlighted':
                $newModmailLinkElement.attr('href', newModmailBaseUrl + 'highlighted');

                break;
            case 'mod_discussions':
                $newModmailLinkElement.attr('href', newModmailBaseUrl + 'mod');

                break;
            case 'notifications':
                $newModmailLinkElement.attr('href', newModmailBaseUrl + 'notifications');

        }

    }

    TB.register_module(self);
}

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        newmodmailpro();
    });
})();
