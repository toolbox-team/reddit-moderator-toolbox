function comments() {
    var self = new TB.Module('Comments');
    self.shortname = 'Comments'; // historical precedent for settings

    self.settings['enabled']['default'] = true;

    self.register_setting('hideRemoved', {
        'type': 'boolean',
        'default': false,
        'advanced': true,
        'title': 'Hide removed comments by default.'
    });
    self.register_setting('approveComments', {
        'type': 'boolean',
        'default': false,
        'title': 'Show approve button on all comments.'
    });
    self.register_setting('spamRemoved', {
        'type': 'boolean',
        'default': false,
        'title': 'Show spam button on comments removed as ham.'
    });
    self.register_setting('hamSpammed', {
        'type': 'boolean',
        'default': false,
        'title': 'Show remove (not spam) button on comments removed as spam.'
    });
    self.register_setting('highlighted', {
        'type': 'list',
        'default': [],
        'title': 'Highlight keywords, keywords should entered separated by a comma without spaces.'
    });
    self.register_setting('highlightTitles', {
        'type': 'boolean',
        'default': true,
        'advanced': true,
        'title': 'Also highlight titles of submissions.'
    });
    self.register_setting('showHideOld', {
        'type': 'boolean',
        'default': true,
        'advanced': false,
        'title': 'Show button to hide old comments.'
    });

    self.init = function () {
        var $body = $('body');
        let newThingRunning = false;

        // Perform comment actions on pages where you are mod and which are not modmail.



        // Add flat view link.
        window.addEventListener('TBNewPage', function (event) {

            if(event.detail.pageType === 'subredditCommentsPage') {
                TBui.contextTrigger('tb-flatview-link', true, `<span class="tb-loadFlat">comment flat view</a>`);
            } else {
                TBui.contextTrigger('tb-flatview-link', false);
            }

        });

        $body.on('click', '.tb-loadFlat', function () {

            // Template for comment construction Note: We do not include all user functions like voting since flat view removes all context. This is purely for mod related stuff.
            var htmlComment = `
<div class="thing comment noncollapsed id-{{thingClasses}}" onclick="click_thing(this)" data-fullname="{{name}}">
<div class="entry mod-button" subreddit="{{subreddit}}">
<p class="tagline">
    <a href="/user/{{author}}" class="{{authorClass}} may-blank">{{author}}</a>
    <span class="userattrs">
    </span>
    <span class="score">{{score}} points</span>
    <time title="{{createdUTC}}" datetime="{{createdTimeAgo}}" class="live-timestamp timeago">{{createdTimeAgo}}</time>
</p>
<form class="usertext">
    <div class="usertext-body">
    {{bodyHtml}}
    </div>
</form>
<ul class="flat-list buttons">
    <li class="first">
        <a href="{{permaLinkComment}}" class="bylink" rel="nofollow" target="_blank">permalink</a>
    </li>
    <li>
        <a href="javascript:;" class="global-mod-button">mod</a>
    </li>
    <li>
        <a href="{{permaLinkComment}}/?context=3" class="bylink" rel="nofollow"  target="_blank">context</a>
    </li>
    <li>
        <a href="{{threadPermalink}}" class="bylink" rel="nofollow"  target="_blank">full comments</a>
    </li>
    {{bannedBy}}
    {{modButtons}}
    <li>
        <a class="" href="javascript:void(0)" onclick="return reply(this)">reply</a></li>
</ul>
</div>
<div class="child"></div>
<div class="comment-nest-info">{{commentNestInfo}}</div>
</div>`;


            var flatListing = {}, // This will contain all comments later on.
                idListing = []; // this will list all IDs in order from which we will rebuild the comment area.

            // deconstruct the json we got.

            function parseComments(object) {
                switch (object.kind) {

                case 'Listing':
                    for (var i = 0; i < object.data.children.length; i++) {
                        // let's make sure that child comments also have the istop property and have it set to false.
                        if (object.isreply) {
                            object.data.children[i].data.istop = false;
                        } else {
                            object.data.children[i].data.istop = true;
                        }

                        parseComments(object.data.children[i]);
                    }

                    break;

                case 't1':
                    flatListing[object.data.id] = JSON.parse(JSON.stringify(object.data)); // deep copy, we don't want references
                    idListing.push(object.data.id);


                    // if we have replies
                    if (flatListing[object.data.id].hasOwnProperty('replies') && flatListing[object.data.id].replies && typeof flatListing[object.data.id].replies === 'object') {
                        delete flatListing[object.data.id].replies; // remove them from the flat object
                        flatListing[object.data.id].hasreplies = true;

                        object.data.replies.isreply = true;
                        parseComments(object.data.replies); // parse them too
                    } else {
                        flatListing[object.data.id].hasreplies = false;
                    }
                    break;

                default:
                    break;
                }
            }

            // Variables we need later on to be able to reconstruct comments.
            var htmlCommentView = ''; // This will contain the new html we will add to the page.

            var siteTable = `#tb-sitetable`; // sitetable id which we will be clearing.
            $(siteTable).empty(); // clear the site table.
            TB.ui.longLoadSpinner(true); // We are doing stuff, fire up the spinner that isn't a spinner!

            // construct the url from which we grab the comments json.
            var jsonurl = `${TBUtils.baseDomain}${location.pathname}.json`;

            // Lets get the comments.
            $.getJSON(`${jsonurl}.json?limit=1500`).done(function (data) {
            // put the json through our deconstructor.
                data[1].isreply = false;
                parseComments(data[1]);
                // and get back a nice flat listing of ids
                idListing = TBUtils.saneSortAs(idListing);
                var linkAuthor = data[0].data.children[0].data.author,
                    threadPermalink = data[0].data.children[0].data.permalink;

                // from each id in the idlisting we construct a new comment.
                $.each(idListing, function (index, value) {

                // All variables we will need to construct a fresh new comment.
                    var author = flatListing[value].author,
                        bannedBy = flatListing[value].banned_by,
                        bodyHtml = flatListing[value].body_html,
                        createdUTC = flatListing[value].created_utc,
                        distinguished = flatListing[value].distinguished,
                        commentID = flatListing[value].id,
                        name = flatListing[value].name,
                        score = flatListing[value].score,
                        subreddit = flatListing[value].subreddit,
                        hasreplies = flatListing[value].hasreplies,
                        istop = flatListing[value].istop;

                    var commentNestInfo = '';

                    if (istop) {
                        commentNestInfo = 'top level comment</span> ';
                    } else {
                        commentNestInfo = 'child comment ';
                    }

                    if (hasreplies) {
                        commentNestInfo = `${commentNestInfo}with replies.`;
                    } else {
                        commentNestInfo = `${commentNestInfo}without replies.`;
                    }


                    // figure out if we need to add author and mod stuff.
                    var authorClass = 'author';
                    if (distinguished === 'moderator') {
                        authorClass = `${authorClass} moderator`;
                    }

                    if (linkAuthor === author) {
                        authorClass = `${authorClass} submitter`;
                    }
                    var createdTimeAgo = TBUtils.timeConverterISO(createdUTC);

                    var permaLinkComment = threadPermalink + commentID;


                    var thingClasses = name;

                    if (bannedBy) {

                        bannedBy = `<li><b>[ removed by ${bannedBy} ]</b></li>`;
                        thingClasses = `${thingClasses} spam`;
                    } else {
                        bannedBy = '';
                    }

                    var modButtons = '';
                    if ($body.hasClass('moderator')) {
                        modButtons = `
<li>
    <form class="toggle remove-button " action="#" method="get"><input type="hidden" name="executed" value="spammed"><span class="option main active"><a href="#" class="togglebutton" onclick="return toggle(this)">spam</a></span><span class="option error">are you sure?  <a href="javascript:void(0)" class="yes" onclick="change_state(this, &quot;remove&quot;, null, undefined, null)">yes</a> / <a href="javascript:void(0)" class="no" onclick="return toggle(this)">no</a></span></form>
</li>
<li>
    <form class="toggle remove-button " action="#" method="get"><input type="hidden" name="executed" value="removed"><input type="hidden" name="spam" value="False"><span class="option main active"><a href="#" class="togglebutton" onclick="return toggle(this)">remove</a></span><span class="option error">are you sure?  <a href="javascript:void(0)" class="yes" onclick="change_state(this, &quot;remove&quot;, null, undefined, null)">yes</a> / <a href="javascript:void(0)" class="no" onclick="return toggle(this)">no</a></span></form>
</li>
`;
                    }

                    // Constructing the comment.

                    var htmlConstructedComment = TBUtils.template(htmlComment, {
                        'thingClasses': thingClasses,
                        'name': name,
                        'subreddit': subreddit,
                        'author': author,
                        'authorClass': authorClass,
                        'score': score,
                        'createdUTC': TBUtils.timeConverterRead(createdUTC),
                        'createdTimeAgo': createdTimeAgo,
                        'bodyHtml': TBUtils.htmlDecode(bodyHtml),
                        'permaLinkComment': permaLinkComment,
                        'threadPermalink': threadPermalink,
                        'bannedBy': bannedBy,
                        'modButtons': modButtons,
                        'commentNestInfo': commentNestInfo
                    });


                    htmlCommentView = htmlCommentView + htmlConstructedComment;
                });

                TB.ui.longLoadSpinner(false);

                // add the new comment list to the page.
                TB.ui.overlay(
                    `Flatview`,
                    [
                        {
                            title: 'Flatview',
                            tooltip: 'commentFlatview.',
                            content: `<div id="tb-sitetable"> ${htmlCommentView} </div>`,
                            footer: ''
                        }
                    ],
                    [], // extra header buttons
                    'tb-flat-view', // class
                    false // single overriding footer
                ).appendTo('body');


                // Add filter options to the page
                if (!$body.find('#tb-flatview-search').length) {
                    var $filterHTML = $(`<div id="tb-flatview-search">
                        Filter by name: <input type="text" id="tb-flatview-search-name" class="tb-flatview-search-input" placeholder="start typing...">
                        Filter by content: <input type="text" id="tb-flatview-search-content" class="tb-flatview-search-input" placeholder="start typing...">
                        <span id="tb-flatview-search-count"></span>
                    </div>`);
                    var FilterRightPosition = $('.side').outerWidth() + 5;
                    $filterHTML.css({
                        'margin-right': `${FilterRightPosition}px`
                    });

                    $(siteTable).before($filterHTML);
                    $('#tb-flatview-search-count').text($body.find(`${siteTable} .thing.comment:visible`).length);
                } else {
                    $body.find('#tb-flatview-search-name').val('');
                    $body.find('#tb-flatview-search-content').val('');
                    $('#tb-flatview-search-count').text($body.find(`${siteTable} .thing.comment:visible`).length);
                }

                $body.find('.tb-flatview-search-input').keyup(function () {
                    self.log('typing');
                    var FlatViewSearchName = $body.find('#tb-flatview-search-name').val();
                    var FlatViewSearchContent = $body.find('#tb-flatview-search-content').val();

                    self.log(FlatViewSearchName);
                    self.log(FlatViewSearchContent);

                    $body.find(`${siteTable} .thing.comment`).each(function () {
                        var $this = $(this);

                        var flatUserName = $this.find('.tagline a.author').text();
                        var flatContent = $this.find('.usertext-body .md').text();

                        if (flatUserName.toUpperCase().indexOf(FlatViewSearchName.toUpperCase()) < 0 || flatContent.toUpperCase().indexOf(FlatViewSearchContent.toUpperCase()) < 0) {
                            $this.hide();
                        } else {
                            $this.show();



                        }
                        $('#tb-flatview-search-count').text($body.find(`${siteTable} .thing.comment:visible`).length);
                    });
                });



                // and simulate reddits timeago function with our native function.
                $('time.timeago').timeago();

                // Fire the same even as with NER support, this will allow the history and note buttons to do their thing.
                // It is entirely possible that TBNewThings is fired multiple times.
                // That is why we only set a new timeout if there isn't one set already.
                if(!newThingRunning) {
                    newThingRunning = true;
                    // Wait a sec for stuff to load.
                    setTimeout(function () {
                        newThingRunning = false;
                        var event = new CustomEvent('TBNewThings');
                        window.dispatchEvent(event);
                    }, 1000);
                }
            });
        });
    }









    TB.register_module(self);
}

(function() {
    window.addEventListener('TBModuleLoaded2', function () {
        comments();
    });
})();
