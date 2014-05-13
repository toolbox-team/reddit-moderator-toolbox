// ==UserScript==
// @name         Toolbox Comments Module
// @namespace    http://www.reddit.com/r/toolbox
// @author       creesch, agentlame
// @description  notifications of messages
// @include      http://reddit.com/*
// @include      https://reddit.com/*
// @include      http://*.reddit.com/*
// @include      https://*.reddit.com/*
// @version 1.0
// ==/UserScript==


(function comments() {
    if (!TBUtils.logged || !$('.moderator').length || !TBUtils.getSetting('CommentsMod', 'enabled', true) || TBUtils.isModmail) return;
    $.log('Loading Comments Module');

    //
    // preload some generic variables 
    //
    var hideRemoved = TBUtils.getSetting('commentsMod', 'hideRemoved', false),
        highlighted = TBUtils.getSetting('commentsMod', 'highlighted', '');


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
        $('#tb-bottombar').find('#tb-toolbarcounters').prepend('<a id="tb-toggle-removed" title="Toggle hide/view removed comments" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconCommentsRemove + '" />[1]</a>');
    } else if (removedCounter > 1) {
        $('#tb-bottombar').find('#tb-toolbarcounters').prepend('<a id="tb-toggle-removed" title="Toggle hide/view removed comments" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconCommentsRemove + '" />[' + removedCounter.toString() + ']</a>');
    }

    if (hideRemoved) {
        $('.tb-comment-spam').hide();
    }

    $('body').delegate('#tb-toggle-removed', 'click', function () {
        if ($('.tb-comment-spam').is(':visible')) {
            $('.tb-comment-spam').hide();
        } else {
            $('.tb-comment-spam').show();
        }

    });

    if (TBUtils.betaMode) {
        function run () {
            $('.thing.comment').each(function () {
                if (!$(this).hasClass('.approve-buttoned')) {
                    $(this).addClass('approve-buttoned');

                    var thing = TBUtils.getThingInfo(this, true);

                    // only for subreddits we mod
                    // and for submissions that haven't already been approved
                    if (thing.subreddit
                        && !thing.approved_by) {
                        // and only if there isn't already one
                        if ($(this).children('.entry').find('.buttons .positive').length == 0) {
                            // lifted straight from the "remove" link button
                            $('<li><form class="toggle approve-button" action="#" method="get"><input type="hidden" name="executed" value="approved"><span class="option main active"><a href="#" class="togglebutton" onclick="return toggle(this)">approve</a></span><span class="option error">are you sure?  <a href="javascript:void(0)" class="yes" onclick="change_state(this, &quot;approve&quot;, null, undefined, null)">yes</a> / <a href="javascript:void(0)" class="no" onclick="return toggle(this)">no</a></span></form></li>')
                                .insertAfter($(this).children('.entry').find('input[value="removed"]').closest('li'));
                        }
                    }
                }
            });

        }
        // NER support.
        window.addEventListener("TBNewThings", function () {
            run();
        });
        run();
    }

  //  $('.thing.comment.spam').click(function () {
  //      var hiddenComment;
   //     hiddenComment = $(this).find('.tb-comment-spam');

  //      if (hiddenComment.is(':visible')) {
 //           hiddenComment.hide();
 //       } else {
 //           hiddenComment.show();
 //       }
 //   }).children().click(function (e) {
//        return;
//    });

    // Add a bit of js based css since the hover effects otherwise will go to the child elements as well 
    $('.thing.comment.spam').children().hover(function () {
        $(this).css('cursor', 'auto');
    });



    //
    //  Highlight words 
    //	

    if (highlighted) {
        highlighted = highlighted.split(',');

        $('.md p').highlight(highlighted);
    }
})();
