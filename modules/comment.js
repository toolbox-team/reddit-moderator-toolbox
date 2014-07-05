function comments() {
    if (!TBUtils.logged || !$('.moderator').length || !TBUtils.getSetting('CommentsMod', 'enabled', true) || TBUtils.isModmail)
        return;
    $.log('Loading Comments Module');
    
    var $body = $('body');
    
    //
    // preload some generic variables
    //
    var hideRemoved = TBUtils.getSetting('CommentsMod', 'hideRemoved', false),
        approveComments = TBUtils.getSetting('CommentsMod', 'approvecomments', false),
        spamRemoved = TBUtils.getSetting('CommentsMod', 'spamremoved', false),
        hamSpammed = TBUtils.getSetting('CommentsMod', 'hamspammed', false);

    $body.on('click', '#tb-toggle-removed', function () {
        var $comment_spam = $('.tb-comment-spam');
        if ($comment_spam.is(':visible')) {
            $comment_spam.hide();
        } else {
            $comment_spam.show();
        }

    });

    function run() {

        //
        //  Do stuff with removed comments
        //
        // Show a removed comments counter when visiting a comment page on a sub where you are moderator. When hiding of removed comments is enabled this doubles as a toggle for that.
        var removedCounter = 0;

        $('.comments-page .thing.comment.spam > .entry').each(function () {
            $(this).addClass('tb-comment-spam');
            removedCounter = removedCounter + 1;
        });
        $.log(removedCounter, true);
        if (removedCounter == 1) {
            $('#tb-bottombar').find('#tb-toolbarcounters').prepend('<a id="tb-toggle-removed" title="Toggle hide/view removed comments" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconCommentsRemove + '" />[1]</a>');
        } else if (removedCounter > 1) {
            $('#tb-bottombar').find('#tb-toolbarcounters').prepend('<a id="tb-toggle-removed" title="Toggle hide/view removed comments" href="javascript:void(0)"><img src="data:image/png;base64,' + TBui.iconCommentsRemove + '" />[' + removedCounter.toString() + ']</a>');
        }

        if (hideRemoved) {
            $('.tb-comment-spam').hide();
        }
        if (approveComments || spamRemoved || hamSpammed) {
            // only need to iterate if at least one of the options is enabled
            $('.thing.comment').each(function () {
                if (!$(this).hasClass('.tb-comments-checked')) {
                    $(this).addClass('tb-comments-checked');

                    var thing = TBUtils.getThingInfo(this, true);

                    if (approveComments) {
                        // only for subreddits we mod
                        // and for comments that haven't already been approved
                        if (thing.subreddit && !thing.approved_by) {
                            // and only if there isn't already one
                            if ($(this).children('.entry').find('.buttons .positive').length == 0) {
                                // lifted straight from the "remove" link button
                                $('<li><form class="toggle approve-button" action="#" method="get"><input type="hidden" name="executed" value="approved"><span class="option main active"><a href="#" class="togglebutton" onclick="return toggle(this)">approve</a></span><span class="option error">are you sure?  <a href="javascript:void(0)" class="yes" onclick="change_state(this, &quot;approve&quot;, null, undefined, null)">yes</a> / <a href="javascript:void(0)" class="no" onclick="return toggle(this)">no</a></span></form></li>')
                                    .insertAfter($(this).children('.entry').find('input[value="removed"]').closest('li'));
                            }
                        }
                    }

                    if (spamRemoved) {
                        // only for subreddits we mod
                        // and for comments that have been removed as ham ("remove not spam")
                        if (thing.subreddit && thing.ham) {
                            // and only if there isn't already one
                            if ($(this).children('.entry').find('.big-mod-buttons .negative').length == 0) {
                                // lifted straight from the "spam" big mod button
                                $('<a class="pretty-button negative" href="#" onclick="return big_mod_action($(this), -2)">spam</a>')
                                    .insertBefore($(this).children('.entry').find('.big-mod-buttons .positive'));
                                $('<span class="status-msg spammed">spammed</span>')
                                    .insertBefore($(this).children('.entry').find('.big-mod-buttons .status-msg'));
                            }
                        }
                    }

                    if (hamSpammed) {
                        // only for subreddits we mod
                        // and for comments that have been removed as spam ("spam" or "confirm spam")
                        if (thing.subreddit && thing.spam) {
                            // and only if there isn't already one
                            if ($(this).children('.entry').find('.big-mod-buttons .neutral').length == 0) {
                                // lifted straight from the "remove" big mod button
                                $('<a class="pretty-button neutral" href="#" onclick="return big_mod_action($(this), -1)">remove</a>')
                                    .insertBefore($(this).children('.entry').find('.big-mod-buttons .positive'));
                                $('<span class="status-msg removed">removed</span>')
                                    .insertBefore($(this).children('.entry').find('.big-mod-buttons .status-msg'));
                            }
                        }
                    }


                }

            });

        }

        if (TBUtils.getSetting('CommentsMod', 'highlighted', '')) {
            var highlighted = TBUtils.getSetting('CommentsMod', 'highlighted', '');
            highlighted = highlighted.split(',');

            $('.md p').highlight(highlighted);
            
            if (TBUtils.getSetting('CommentsMod', 'highlightTitles', true)) {     
                $('a.title').highlight(highlighted);
            }
        }
    }
    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();

    });

    run();



$(".commentarea .usertext-edit:first-of-type").after('<a href="javascript:void(0)" class="loadFlat">Load comments in flat view</a>');
    $("body").on("click", ".loadFlat", function () {
        var flatListing = {},
        idListing = [];

        function parseComments(object) {
            switch (object.kind) {
                case "Listing":
                    for (var i = 0; i < object.data.children.length; i++) {

                        parseComments(object.data.children[i]);
                    }
                    break;
                case "t1":
                    flatListing[object.data.id] = JSON.parse(JSON.stringify(object.data)); // deep copy, we don't want references
                    idListing.push(object.data.id);

                    // if we have replies
                    if (flatListing[object.data.id].hasOwnProperty('replies') && flatListing[object.data.id].replies && typeof flatListing[object.data.id].replies === "object") {
                        delete flatListing[object.data.id].replies; // remove them from the flat object
                        parseComments(object.data.replies); // parse them too
                    }
                    break;
                default:

                    break;
            }

        }
        var htmlCommentView = '';
        var fullId = $('.thing.link').attr('data-fullname');
        var smallId = fullId.substring(3);

        var siteTable = "#siteTable_" + fullId;
        $(siteTable).empty();
        TBUtils.longLoadSpinner(true);


        var jsonurl = $('.entry a.comments').attr('href');

        $.getJSON(jsonurl + '.json?limit=500').done(function (data, status, jqxhr) {
            parseComments(data[1]);
            idListing = TBUtils.saneSortAs(idListing);
            var linkAuthor = data[0].data.children[0].data.author,
                threadPermalink = data[0].data.children[0].data.permalink;

            $.each(idListing, function (index, value) {

                var approvedBy = flatListing[value].approved_by,
                    author = flatListing[value].author,
                    authorFlairCssClass = flatListing[value].author_flair_css_class,
                    authorFlairText = flatListing[value].author_flair_text,
                    bannedBy = flatListing[value].banned_by,
                    bodyHtml = flatListing[value].body_html,
                    createdUTC = flatListing[value].created_utc,
                    distinguished = flatListing[value].distinguished,
                    commentID = flatListing[value].id,
                    linkId = flatListing[value].link_id,
                    name = flatListing[value].name,
                    numReports = flatListing[value].num_reports,
                    parentId = flatListing[value].parent_id,
                    score = flatListing[value].score,
                    scoreHidden = flatListing[value].score_hidden,
                    subreddit = flatListing[value].subreddit;

                var authorClass = 'author';
                if (distinguished === 'moderator') {
                    authorClass = authorClass + ' moderator';
                }

                if (linkAuthor === author) {
                    authorClass = authorClass + ' submitter';
                }
                createdTimeAgo = TBUtils.timeConverterISO(createdUTC);

                permaLinkComment = threadPermalink + commentID;


                var thingClasses = name;

                if (bannedBy) {

                    bannedBy = '<li><b>[ removed by ' + bannedBy + ' ]</b></li>';
                    thingClasses = thingClasses + ' spam';
                } else {
                    bannedBy = '';
                }

                var modButtons = '';
                if ($('body').hasClass('moderator')) {
                modButtons = '\
                <li>\
                    <form class="toggle remove-button " action="#" method="get"><input type="hidden" name="executed" value="spammed"><span class="option main active"><a href="#" class="togglebutton" onclick="return toggle(this)">spam</a></span><span class="option error">are you sure?  <a href="javascript:void(0)" class="yes" onclick="change_state(this, &quot;remove&quot;, null, undefined, null)">yes</a> / <a href="javascript:void(0)" class="no" onclick="return toggle(this)">no</a></span></form>\
                </li>\
                <li>\
                    <form class="toggle remove-button " action="#" method="get"><input type="hidden" name="executed" value="removed"><input type="hidden" name="spam" value="False"><span class="option main active"><a href="#" class="togglebutton" onclick="return toggle(this)">remove</a></span><span class="option error">are you sure?  <a href="javascript:void(0)" class="yes" onclick="change_state(this, &quot;remove&quot;, null, undefined, null)">yes</a> / <a href="javascript:void(0)" class="no" onclick="return toggle(this)">no</a></span></form>\
                </li>\
                ';
                }

                htmlComment = '\
<div class="thing comment id-' + thingClasses + '" onclick="click_thing(this)" data-fullname="' + name + '">\
    <div class="entry mod-button" subreddit="' + subreddit + '">\
        <div class="noncollapsed">\
            <p class="tagline">\
                <a href="http://www.reddit.com/user/' + author + '" class="' + authorClass + ' may-blank">' + author + '</a>\
                <span class="score">' + score + ' points</span>\
                <time title="' + TBUtils.timeConverterRead(createdUTC) + '" datetime="' + createdTimeAgo + '" class="live-timestamp timeago">' + createdTimeAgo + '</time>\
            </p>\
            <div class="usertext-body">\
            ' + TBUtils.htmlDecode(bodyHtml) + '\
            </div>\
            <ul class="flat-list buttons">\
                <li class="first">\
                    <a href="' + permaLinkComment + '" class="bylink" rel="nofollow" target="_blank">permalink</a>\
                </li>\
                <li>\
                    <a href="' + permaLinkComment + '/?context=3" class="bylink" rel="nofollow"  target="_blank">context</a>\
                </li> \
                <li>\
                    <a href="' + threadPermalink + '" class="bylink" rel="nofollow"  target="_blank">full comments</a>\
                </li> \
                ' + bannedBy + '\
                ' + modButtons + '\
                <li>\
                    <a href="javascript:;" class="global-mod-button">mod</a>\
                </li>\
                <li>\
                    <a class="" href="javascript:void(0)" onclick="return reply(this)">reply</a></li>\
            </ul>\
        </div>\
    </div>\
    <div class="child"></div>\
</div>';


                htmlCommentView = htmlCommentView + htmlComment;
            });

            TBUtils.longLoadSpinner(false);

            $(siteTable).append(htmlCommentView);

            $("time.timeago").timeago();

        });



    });

}

(function () {
    // wait for storage
    window.addEventListener("TBStorageLoaded", function () {
        console.log("got storage");
        comments();
    });
})();
