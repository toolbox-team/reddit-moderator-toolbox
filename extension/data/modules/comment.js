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

    const commentsAsFullPage = self.setting('commentsAsFullPage');

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
            let $htmlCommentView = $(`<div id="tb-sitetable"></div>`); // This will contain the new html we will add to the page.

            var siteTable = `#tb-sitetable`; // sitetable id which we will be clearing.
            $(siteTable).empty(); // clear the site table.
            TB.ui.longLoadSpinner(true); // We are doing stuff, fire up the spinner that isn't a spinner!

            // construct the url from which we grab the comments json.
            var jsonurl = `${TBUtils.baseDomain}${location.pathname}.json`;

            // Lets get the comments.
            $.getJSON(`${jsonurl}.json?limit=1500`, {raw_json: 1}).done(function (data) {
            // put the json through our deconstructor.
                data[1].isreply = false;
                parseComments(data[1]);
                // and get back a nice flat listing of ids
                idListing = TBUtils.saneSortAs(idListing);


                // from each id in the idlisting we construct a new comment.
                $.each(idListing, function (index, value) {

                    const commentOptions = {
                        'parentLink' : true,
                        'contextLink' : true,
                        'fullCommentsLink' : true,
                        'noOddEven': true
                    };
                    const $comment = TBui.makeSingleComment(flatListing[value], commentOptions);
                    $htmlCommentView.append($comment);

                });

                TB.ui.longLoadSpinner(false);

                // add the new comment list to the page.
                TB.ui.overlay(
                    `Flatview`,
                    [
                        {
                            title: 'Flatview',
                            tooltip: 'commentFlatview.',
                            content: $htmlCommentView,
                            footer: ''
                        }
                    ],
                    [], // extra header buttons
                    'tb-flat-view', // class
                    false // single overriding footer
                ).appendTo('body');
                $body.css('overflow', 'hidden');
                $body.on('click', '.tb-flat-view .close', function () {
                    $('.tb-flat-view').remove();
                    $body.css('overflow', 'auto');

                });
                // Add filter options to the page
                if (!$body.find('#tb-flatview-search').length) {
                    var $filterHTML = $(`<div id="tb-flatview-search">
                        Filter by name: <input type="text" id="tb-flatview-search-name" class="tb-flatview-search-input tb-input" placeholder="start typing...">
                        Filter by content: <input type="text" id="tb-flatview-search-content" class="tb-flatview-search-input tb-input" placeholder="start typing...">
                        <span id="tb-flatview-search-count"></span>
                    </div>`);

                    $(siteTable).before($filterHTML);
                    $('#tb-flatview-search-count').text($body.find(`${siteTable} .tb-comment:visible`).length);
                } else {
                    $body.find('#tb-flatview-search-name').val('');
                    $body.find('#tb-flatview-search-content').val('');
                    $('#tb-flatview-search-count').text($body.find(`${siteTable} .tb-comment:visible`).length);
                }

                $body.find('.tb-flatview-search-input').keyup(function () {
                    self.log('typing');
                    var FlatViewSearchName = $body.find('#tb-flatview-search-name').val();
                    var FlatViewSearchContent = $body.find('#tb-flatview-search-content').val();

                    self.log(FlatViewSearchName);
                    self.log(FlatViewSearchContent);

                    $body.find(`${siteTable} .tb-comment`).each(function () {
                        var $this = $(this);

                        var flatUserName = $this.find('.tb-tagline a.tb-comment-author').text();
                        var flatContent = $this.find('.tb-comment-body .md').text();

                        if (flatUserName.toUpperCase().indexOf(FlatViewSearchName.toUpperCase()) < 0 || flatContent.toUpperCase().indexOf(FlatViewSearchContent.toUpperCase()) < 0) {
                            $this.hide();
                        } else {
                            $this.show();



                        }
                        $('#tb-flatview-search-count').text($body.find(`${siteTable} .tb-comment:visible`).length);
                    });
                });


                // and simulate reddits timeago function with our native function.
                $('time.timeago').timeago();
            });
        });
    };









    TB.register_module(self);
}

(function() {
    window.addEventListener('TBModuleLoaded2', function () {
        comments();
    });
})();
