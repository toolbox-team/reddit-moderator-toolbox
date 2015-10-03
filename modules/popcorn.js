function popcorn() {
    var self = new TB.Module('Popcorn');
    self.shortname = 'popcorn';

//Default settings
self.settings['enabled']['default'] = true;

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

self.init = function() {
    var neg_thresh = self.setting('negHighlightThreshold'),
        expand = self.setting('expandOnLoad');

    $('body').addClass('tb-popcorn');

    $('.commentarea > .sitetable').before(
        $('<div style="margin:10px;">')
            .append($('<button style="margin-right:10px;">Popcorn!</button>').click(sortChildren))
            .append($('<button>Salt Please!</button>').click(collapseNonDrama))
    );

    window.addEventListener("TBNewThings", function () {
        init();
    });

    init();

    function init(){
        highlight();
        markProcessedThings();
        if(expand) $('.tb-drama, .tb-ndrama').each(uncollapseThing);
    }

    function highlight(){

        $('.thing:not(.tb-pc-proc) .numchildren').each(numChildren);
        //Consider storing $('.thing:not(.tb-pc-proc)')
        $('.thing:not(.tb-pc-proc) .score.unvoted').each(score);

        $('.thing:not(.tb-pc-proc).controversial > .entry').addClass('tb-drama')
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
        
        $('.sitetable').each(function(){
            var $this = $(this),
                $things = $this.find('.thing');

            if($things.length < 2) return;

            $things = $this.children('.thing:not(.morechildren)')
                .sort(function(a, b){
                    return (b.dataset.nchildren - a.dataset.nchildren);
                });

            $this.prepend($things)
                .prepend($this.children('.thing.tb-drama'))
                .prepend($this.children('.thing.tb-ndrama'));
        });
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

    Calculate %upvoted to get real numbers.

    */
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        popcorn(); //run
    });
})();
