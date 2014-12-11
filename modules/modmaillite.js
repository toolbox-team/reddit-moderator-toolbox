function modmaillite() {
if (!TBUtils.isModmail || !TBUtils.logged || !TB.storage.getSetting('ModMailLite', 'enabled', false)) return;

//$.log('Loading MML Module');

var $sitetable = $('#siteTable'),//.hide(),
    $threads = $('.message-parent'),
    divs = [],
    entries = {},
    subs = [];

initialize();

function initialize() {

    $threads.each(function () {
        processThread(this);
    });
    $(divs).each(function () {
        $sitetable.append($(this));
    });
    $sitetable.show();


    /* Don't chunk the thread, chunk the entries.
     // Add filter link to each title, if it doesn't already have one.
     TBUtils.forEachChunked(threads, 35, 250, function (thread) {
     processThread(thread);
     }, function complete() {

     });
     */
}

function processThread(thread) {
    $thread = $(thread);
    if ($thread.hasClass('mml-processed')) {
        return;
    }
    $thread.addClass('mml-processed');
    $thread.hide();

    var info = TBUtils.getThingInfo(thread);
    //var subreddit = $(thing).closest('.message-parent').find('.correspondent.reddit.rounded a').text().replace('/r/', '');
    if ($.inArray(info.subreddit, subs) === -1) {
        subs.push(info.subreddit);

        var $div = $('\
            <div class="tb-mml-subreddit ' + info.subreddit + '">\
                <label class="tb-mml-expand" data-subreddit="' + info.subreddit + '">[+]</label><span class="subreddit">/r/' + info.subreddit + '</span><span class="message-count"></span>\
            </div>\
            ').show();

        $thread.appendTo($div).hide();
        divs.push($div);
    } else {

        //var sel = String("." + info.subreddit + "");
        //$.log(sel)
        //document.getElementsByClassName(subreddit);
        $thread.appendTo($(document.getElementsByClassName(info.subreddit)));
        //$thread.appendTo("" + sel + "");
    }


    /*
     var threadID = $(thread).attr('data-fullname'),
     entries = $(thread).find('.entry'),
     count = (entries.length - 1),
     subreddit = getSubname(thread),
     */
}

$('body').delegate('.tb-mml-expand', 'click', function () {
    $this = $(this);
    subreddit = $this.attr('data-subreddit');

    // TODO: save threads to a keyed array.
    $threads.each(function () {
        if (TBUtils.getThingInfo(this).subreddit === subreddit) {
            $(this).show();
        }
    });
});
}

(function() {
    window.addEventListener("TBUtilsLoaded", function () {
        modmaillite();
    });
})();
