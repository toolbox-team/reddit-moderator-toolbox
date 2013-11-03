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


function tbcomm() {
    if (!reddit.logged || !$('.moderator').length || !TBUtils.setting('CommentsMod', 'enabled', true) || TBUtils.isModmail) return;

    //
    // preload some generic variables 
    //
    var hideRemoved = TBUtils.setting('commentsMod', 'hideRemoved', false),
        highlighted = TBUtils.setting('commentsMod', 'highlighted', '');


    //
    //  Do stuff with removed comments
    //
    // Show a removed comments counter when visiting a comment page on a sub where you are moderator. When hiding of removed comments is enabled this doubles as a toggle for that.
    var removedCounter = 0;

    $('.comments-page .thing.comment.spam > .entry').each(function () {
        $(this).addClass('tb-comment-spam');
        removedCounter = removedCounter + 1;
    });
    console.log(removedCounter);
    if (removedCounter == 1) {
        $('#tb-bottombar').find('#tb-toolbarcounters').prepend('<a id="tb-toggle-removed" title"Toggle hide/view removed comments" href="javascript:void(0)"><img src="data:image/png;base64,' + TBUtils.iconCommentsRemove + '" />[1]</a>');
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
}

// Add script to page
(function () {

    // Check if we are running as an extension
    if (typeof self.on !== "undefined" || (typeof chrome !== "undefined" && chrome.extension)) {
        init();
        return;
    }

    // Check if TBUtils has been added.
    if (!window.TBUadded) {
        window.TBUadded = true;

        var utilsURL = 'http://agentlame.github.io/toolbox/tbutils.js';
        var cssURL = 'http://agentlame.github.io/toolbox/tb.css';
        $('head').prepend('<script type="text/javascript" src=' + utilsURL + '></script>');
        $('head').prepend('<link rel="stylesheet" type="text/css" href="' + cssURL + '"></link>');
    }

    // Do not add script to page until TBUtils is added.
    (function loadLoop() {
        setTimeout(function () {
            if (typeof TBUtils !== "undefined") {
                init();
            } else {
                loadLoop();
            }
        }, 100);
    })();

    function init() {
        var s = document.createElement('script');
        s.textContent = "(" + tbcomm.toString() + ')();';
        document.head.appendChild(s);
    }
})();
