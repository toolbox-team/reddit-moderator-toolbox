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
    var hideRemoved = TBUtils.getSetting('CommentsMod', 'hideRemoved', false),
        approveComments = TBUtils.getSetting('CommentsMod', 'approvecomments', false),
        spamRemoved = TBUtils.getSetting('CommentsMod', 'spamremoved', false),
        hamSpammed = TBUtils.getSetting('CommentsMod', 'hamspammed', false);




    $('body').on('click', '#tb-toggle-removed', function () {
        if ($('.tb-comment-spam').is(':visible')) {
            $('.tb-comment-spam').hide();
        } else {
            $('.tb-comment-spam').show();
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
        }
    }
    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();

    });

    run();





})();