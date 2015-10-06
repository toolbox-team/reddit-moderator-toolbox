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

self.sorted = false;
self.pending = [];

self.init = function() {
    var neg_thresh = self.setting('negHighlightThreshold'),
        expand = self.setting('expandOnLoad'),
        auto = self.setting('highlightAuto'),
        sortOnMoreChildren = self.setting('sortOnMoreChildren'),
        $body = $('body'),
        $buttons = $('<div id="tb-trouble-buttons">'),
        $init_btn = $('<button id="tb-trouble-init" class="tb-action-button">Trouble-seeker</button>').click(start),
        $sitetable;

    // if(!TBUtils.isMod) return;

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
    }


    function run() {
        var start = performance.now(),
            key = 'proc-things';

        self.startProfile(key);
        var $things = $('.thing:not(.tb-pc-proc)');

        highlightComments($things);

        if (expand) $things.find('.tb-drama, .tb-ndrama').each(uncollapseThing);

        while (self.pending.length) self.pending.pop()();

        markProcessedThings();

        self.endProfile(key);
        self.log('load time: ' + self.getProfile(key).time.toFixed(4));
    }

    function highlightComments($things){

        $things.find('.numchildren').each(numChildren);
        //Consider storing $('.thing:not(.tb-pc-proc)')
        $things.find('.score.unvoted').each(score);

        $things.find('.controversial > .entry').addClass('tb-drama')
            .parents('.thing').addClass('tb-drama');
    }

    function score(){
        var $this = $(this),
            thing = $this.parents('.thing')[0];

        //highlighting here to avoid another .each() iteration
        if( (thing.dataset.score = $this.text().match(/^(-)?\d+/)[0]) <= neg_thresh ){
            $(thing).addClass('tb-neg tb-ndrama')
                .parents('.thing').addClass('tb-ndrama');
        }
    }

    function numChildren(){
        var $this = $(this);

        $this.parents('.thing')[0].dataset.nchildren = $this.text().match(/\d+/)[0];
    }

    function sortChildren(){

        self.sorted = true;

        $(this).closest('.sitetable, .commentarea, .content').find('.sitetable').each(sortMe);
    }

    function sortMe(){
        var $this = $(this),
            $things = $this.children('.thing:not(.morechildren)')
            .sort(function(a, b){
                return (b.dataset.nchildren - a.dataset.nchildren);
            }).each(sortMe);

        $this.prepend($things)
            .prepend($this.children('.thing.tb-drama'))
            .prepend($this.children('.thing.tb-ndrama'));
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
