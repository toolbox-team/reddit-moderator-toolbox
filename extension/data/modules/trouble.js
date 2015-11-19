function trouble() {
var self = new TB.Module('Trouble Shooter');
self.shortname = 'Trouble';

//Default settings
self.settings['enabled']['default'] = false;
self.config['betamode'] = true;

self.register_setting('highlightAuto', {
    'type': 'boolean',
    'default': false,
    'title': 'Highlight comments automatically'
});

self.register_setting('negHighlightThreshold', {
    'type': 'number',
    'default': 0,
    'title': 'Negative comment highlight score threshold'
});

self.register_setting('expandOnLoad', {
    'type': 'boolean',
    'default': false,
    'title': 'Expand all downvoted/controversial comments on page load'
});

self.register_setting('sortOnMoreChildren', {
    'type': 'boolean',
    'default': false,
    'title': 'Continue to sort children on "load more comments"'
});

self.register_setting('displayNChildren', {
    'type': 'boolean',
    'default': false,
    'title': 'Display the number of children a comment has in the upper left.  This may change the normal flow of the comments page slightly.'
});

self.sorted = false;
self.pending = [];

self.init = function() {
    var neg_thresh_pref = self.setting('negHighlightThreshold'),
        expand = self.setting('expandOnLoad'),
        auto = self.setting('highlightAuto'),
        sortOnMoreChildren = self.setting('sortOnMoreChildren'),
        nChildren = self.setting('displayNChildren'),
        $body = $('body'),
        $buttons = $('<div id="tb-trouble-buttons">'),
        $init_btn = $('<button id="tb-trouble-init" class="tb-action-button">Trouble Shoot</button>').click(start),
        $sitetable;

    if(!TBUtils.isMod) return;

    if(!TBUtils.isCommentsPage) return;

    if($body.hasClass('listing-page')){
        $sitetable = $('.content > .sitetable');
    } else {
        $sitetable = $('.commentarea > .sitetable');
    }

    $sitetable.before($buttons);

    if(auto){
        start();
    } else {
        $buttons.append($init_btn);
    }

    function start(){

        $init_btn.remove();

        $body.addClass('tb-trouble');
        if(nChildren) $body.addClass('tb-nchildren');

        $buttons.append($('<button id="tb-trouble-sort" class="tb-action-button">Sort</button>').click(sortChildren))
                .append($('<button class="tb-action-button" id="tb-trouble-collapse">Collapse</button>').click(collapseNonDrama));

        if(sortOnMoreChildren){
            $('.commentarea').on('click', '.morecomments', function(){
                if(self.sorted) self.pending.push(sortMe.bind($(this).closest('.sitetable')));
            });
        }
        window.addEventListener("TBNewThings", function () {
            run();
        });

        run();

        if (expand) $('.thing.tb-drama, .thing.tb-ndrama').each(uncollapseThing);
    }

    function run() {
        var start = performance.now(),
            key = 'proc-things';

        self.startProfile(key);
        var $things = $('.thing.comment:not(.tb-pc-proc)');

        highlightComments($things);

        while (self.pending.length) self.pending.pop()();

        if (expand) $('.thing.tb-drama:not(.tb-pc-proc), .thing.tb-ndrama:not(.tb-pc-proc)').each(uncollapseThing);

        markProcessedThings();

        self.endProfile(key);
        self.log('load time: ' + self.getProfile(key).time.toFixed(4));
    }

    function highlightComments($things){
        var controversial = new RegExp(/\bcontroversial\b/);

        $things.find('.numchildren').each(numChildren);

        $things.find('.score.unvoted').each(score);

        $things.filter(function(){ return controversial.test(this.className); }).children('.entry').addClass('tb-drama')
            .parents('.thing').addClass('tb-drama');
    }

    function score(){
        var $this = $(this),
            $thing = $this.closest('.thing'),
            neg_thresh = neg_thresh_pref;

        //lower the threashold by one for user's comments
        if(RegExp("\/"+TBUtils.logged+"\\b").test($thing.find('> .entry .author')[0].href)) --neg_thresh;

        //highlighting here to avoid another .each() iteration
        if( ($thing[0].dataset.score = $this.text().match(/^(-)?\d+/)[0]) <= neg_thresh ){
            $thing.addClass('tb-neg tb-ndrama')
                .parents('.thing').addClass('tb-ndrama');
        }
    }

    function numChildren(){
        var $this = $(this);

        $this.closest('.thing')[0].dataset.nchildren = $this.text().match(/\d+/)[0];
    }

    function sortChildren(){

        self.sorted = true;

        sortMe.call($(this).closest('.sitetable, .commentarea, .content').find('> .sitetable'));
    }

    function fixFlatNER($this){
        var $NERs = $this.find('.linklisting');
        if(!$NERs.length) return;

        $this.append($NERs.children('.thing'));
        $('.NERPageMarker, .clearleft + .clearleft').css('display', 'none');
    }

    function sortMe(){
        var $this = $(this),
            $things;

        fixFlatNER($this);

        $things = $this.children('.thing:not(.morechildren)')
        .sort(function(a, b){
            return (b.dataset.nchildren - a.dataset.nchildren);
        });

        $this.prepend($things)
            .prepend($this.children('.thing.tb-drama'))
            .prepend($this.children('.thing.tb-ndrama'));

        $things.find('> .child > .sitetable').each(sortMe);
    }

    function collapseThing(){
        $(this).addClass('collapsed').find('.expand').eq(0).text('[+]');
    }

    function uncollapseThing(){
        $(this).removeClass('collapsed').find('.expand').eq(0).text('[–]');
    }

    function markProcessedThings(){
        $('.thing:not(.tb-pc-proc)').addClass('tb-pc-proc');
    }

    function collapseNonDrama(){

        $('.thing.tb-drama, .thing.tb-ndrama').each(uncollapseThing);

        $('.commentarea > .sitetable > .thing:not(.tb-drama, .tb-ndrama), .thing.tb-drama > .child > .sitetable > .thing:not(.tb-drama, .tb-ndrama), .thing.tb-ndrama > .child > .sitetable > .thing:not(.tb-drama, .tb-ndrama)')
            .each(collapseThing);//collapsing only top-level-most comment children of drama
    }
/*  TODO

    Include below threshold comments when the score is hidden?

    Build a filter for collections so elements can remove themselves if they don't need being "dealt with"

    Calculate %upvoted to get real numbers.

    */
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        trouble(); //run
    });
})();
