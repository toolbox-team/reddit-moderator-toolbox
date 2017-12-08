function comments() {
    var self = new TB.Module('Comments');
    self.shortname = 'Comments'; // historical precedent for settings

    self.settings['enabled']['default'] = true;

    self.register_setting('commentsAsFullPage', {
        'type': 'boolean',
        'default': false,
        'advanced': false,
        'title': 'Always open comments as new page (instead of lightbox).'
    });

    self.register_setting('openContextInPopup', {
        'type': 'boolean',
        'default': true,
        'beta': false,
        'title': 'Add a link to comments where appropiate to open the context in a popup on page.'
    });

    const commentsAsFullPage = self.setting('commentsAsFullPage');
    const openContextInPopup = self.setting('openContextInPopup');

    self.init = function () {
        let $body = $('body');

        // Do not open lightbox but go to full comment page.
        if (commentsAsFullPage) {
            $body.on('click', 'a', function(event){
                const subredditCommentsPageReg = /^\/r\/([^/]*?)\/comments\/([^/]*?)\/([^/]*?)\/?$/;
                const $this = $(this);
                const thisHref = $this.attr('href');
                if(subredditCommentsPageReg.test(thisHref)) {
                    event.preventDefault();
                    window.location.href = thisHref;
                }
            });
        }

        // Add flat view link.

        window.addEventListener('TBNewPage', function (event) {
            if(event.detail.pageType === 'subredditCommentsPage') {
                TBui.contextTrigger('tb-flatview-link', {
                    addTrigger: true,
                    title: 'View comments for this thread in chronological flat view.',
                    triggerText: `comment flat view`,
                    triggerIcon: 'list'
                });
            } else {
                TBui.contextTrigger('tb-flatview-link', { addTrigger: false });
            }

        });

        $body.on('click', '#tb-flatview-link', function () {

            let flatListing = {}, // This will contain all comments later on.
                idListing = []; // this will list all IDs in order from which we will rebuild the comment area.

            // deconstruct the json we got.

            function parseComments(object) {
                switch (object.kind) {

                case 'Listing':
                    for (let i = 0; i < object.data.children.length; i++) {
                        parseComments(object.data.children[i]);
                    }

                    break;

                case 't1':
                    flatListing[object.data.id] = JSON.parse(JSON.stringify(object)); // deep copy, we don't want references
                    idListing.push(object.data.id);

                    if (flatListing[object.data.id].data.hasOwnProperty('replies') && flatListing[object.data.id].data.replies && typeof flatListing[object.data.id].data.replies === 'object') {
                        parseComments(object.data.replies); // we need to go deeper.
                    }
                    break;

                default:
                    break;
                }
            }

            // Variables we need later on to be able to reconstruct comments.
            let $windowContent = $(`
            <div id="tb-flatview-search">
            Filter by name: <input type="text" id="tb-flatview-search-name" class="tb-flatview-search-input tb-input" placeholder="start typing...">
            Filter by content: <input type="text" id="tb-flatview-search-content" class="tb-flatview-search-input tb-input" placeholder="start typing...">
            <span id="tb-flatview-search-count">0</span>
            </div>
            <div id="tb-sitetable"></div>`);

            // add the new comment list to the page.
            const $flatViewOverlay = TB.ui.overlay(
                `Flatview`,
                [
                    {
                        title: 'Flatview',
                        tooltip: 'commentFlatview.',
                        content: $windowContent,
                        footer: ''
                    }
                ],
                [], // extra header buttons
                'tb-flat-view', // class
                false // single overriding footer
            ).appendTo('body');

            $flatViewOverlay.hide();

            $body.on('click', '.tb-flat-view .close', function () {
                $('.tb-flat-view').remove();
                $body.css('overflow', 'auto');

            });
            let $flatSearchCount = $body.find('#tb-flatview-search-count');
            let $htmlCommentView = $body.find('#tb-sitetable'); // This will contain the new html we will add to the page.

            $body.find('.tb-flatview-search-input').keyup(function () {
                self.log('typing');
                var FlatViewSearchName = $body.find('#tb-flatview-search-name').val();
                var FlatViewSearchContent = $body.find('#tb-flatview-search-content').val();

                self.log(FlatViewSearchName);
                self.log(FlatViewSearchContent);

                $htmlCommentView.find(`.tb-comment`).each(function () {
                    var $this = $(this);

                    var flatUserName = $this.find('.tb-tagline a.tb-comment-author').text();
                    var flatContent = $this.find('.tb-comment-body .md').text();

                    if (flatUserName.toUpperCase().indexOf(FlatViewSearchName.toUpperCase()) < 0 || flatContent.toUpperCase().indexOf(FlatViewSearchContent.toUpperCase()) < 0) {
                        $this.hide();
                    } else {
                        $this.show();



                    }
                    $flatSearchCount.text($htmlCommentView.find(`.tb-comment:visible`).length);
                });
            });

            TB.ui.longLoadSpinner(true); // We are doing stuff, fire up the spinner that isn't a spinner!

            // construct the url from which we grab the comments json.
            var jsonurl = `${TBUtils.baseDomain}${location.pathname}.json`;
            TB.ui.textFeedback('Fetching comment data.', TBui.FEEDBACK_NEUTRAL);
            // Lets get the comments.
            $.getJSON(`${jsonurl}.json?limit=1500`, {raw_json: 1}).done(function (data) {
                // put the json through our deconstructor.
                data[1].isreply = false;
                parseComments(data[1]);
                // and get back a nice flat listing of ids
                idListing = TBUtils.saneSortAs(idListing);
                const commentOptions = {
                    'parentLink' : true,
                    'contextLink' : true,
                    'fullCommentsLink' : true,
                    'noOddEven': true,
                    'contextPopup': openContextInPopup
                };
                let count = 0;
                // from each id in the idlisting we construct a new comment.
                TBUtils.forEachChunkedDynamic(idListing, function(value) {
                    count++;
                    const msg = `Building comment ${count}/${idListing.length}`;
                    TB.ui.textFeedback(msg, TBui.FEEDBACK_NEUTRAL);
                    const $comment = TBui.makeSingleComment(flatListing[value], commentOptions);
                    $comment.find('time.timeago').timeago();
                    $htmlCommentView.append($comment);

                }).then(function() {
                    $flatSearchCount.text(count);
                    setTimeout(function () {
                        TBui.tbRedditEvent($htmlCommentView, 'comment');
                        TB.ui.longLoadSpinner(false);
                        $body.css('overflow', 'hidden');
                        $flatViewOverlay.show();
                    }, 1000);
                });




            });
        });
        if (openContextInPopup) {
            self.log('openContextInPopup enabled.');

            $body.on('click', '.tb-comment-context-popup', function(event){
                self.log('Context button clicked.');

                const $this = $(this);
                // Grab the url.
                let contextUrl = $this.attr('data-context-json-url');
                if (contextUrl.indexOf('.reddit.com') < 0) {
                    contextUrl = `${TBUtils.baseDomain}${contextUrl}`;
                }

                // Get the context
                $.getJSON(contextUrl, {raw_json: 1}).done(function(data) {

                    const commentOptions = {
                        'parentLink' : true,
                        'contextLink' : true,
                        'fullCommentsLink' : true
                    };

                    const $comments = TBui.makeCommentThread(data[1].data.children, commentOptions);
                    const contextUser = data[1].data.children[0].data.author;
                    const contextSubreddit = data[1].data.children[0].data.subreddit;

                    // Prepare for the popup.
                    let leftPosition;
                    if (document.documentElement.clientWidth - event.pageX < 400) {
                        leftPosition = event.pageX - 600;
                    } else {
                        leftPosition = event.pageX - 50;
                    }

                    // Title is probably also nice.
                    const contextTitle =  `Context for /u/${contextUser} in /r/${contextSubreddit}`;

                    // Build the context popup and once that is done append it to the body.
                    let $contextPopup = TB.ui.popup(
                        contextTitle,
                        [
                            {
                                title: 'Context tab',
                                tooltip: 'Tab with context for comment.',
                                content: $comments,
                                footer: ''
                            }
                        ],
                        '',
                        'context-button-popup',
                        {
                            draggable: true
                        }
                    ).appendTo($body)
                        .css({
                            left: leftPosition,
                            top: event.pageY - 10,
                            display: 'block'
                        });
                    TBui.tbRedditEvent($comments, 'comment');
                    $('time.timeago').timeago();

                    // Close the popup
                    $contextPopup.on('click', '.close', function () {
                        $contextPopup.remove();
                    });


                });


            });
        }

    };









    TB.register_module(self);
}

(function() {
    window.addEventListener('TBModuleLoaded2', function () {
        comments();
    });
})();
