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



self.init = function() {
    var $siteTable = $('.commentarea > .sitetable'),
        $body = $('body').addClass('tb-popcorn'),
        neg_thresh = self.setting('negHighlightThreshold');


    $siteTable.before(
        $('<div style="margin:10px;">')
            .append($('<button style="margin-right:10px;">Popcorn!</button>').click(sortChildren))
            .append($('<button>Salt Please!</button>').click(collapseNonDrama))
    ).before(
        $('<input type="checkbox" class="tb-hideNonDrama tb-cb" data-text="hide non-drama">')
    );

    window.addEventListener("TBNewThings", function () {
        init();
    });

    init();



    /* Functions */
    function init(){
        highlight();
        markThings();
    }

    function highlight(){

        $('.thing:not(.processed) .numchildren').each(numChildren);
        $('.thing:not(.processed).controversial > .entry').addClass('tb-drama')
        .parents('.thing').addClass('tb-drama');
        $('.thing:not(.processed) .score.unvoted').each(score);
    }

    function score(){
        var $this = $(this),
            thing = $this.parents('.thing')[0];
        //highlighting here to avoid another iteration
        if( (thing.dataset.score = $this.text().match(/^(-)?\d+/)[0]) <= neg_thresh ) $(thing).addClass('tb-neg tb-ndrama').parents('.thing').addClass('tb-ndrama');
    }

    function numChildren(){
        var $this = $(this);
        $this.parents('.thing')[0].dataset.nchildren = $this.text().match(/\d+/)[0];
    }

    function sortChildren(){
        if($('.thing:not(.tb-drama).controversial').length > 0) highlight();//is wierd for some reason, must test, forgot why. Investigate!
        $('.sitetable').each(function(){
            var $this = $(this);
            var $things = $this.find('.thing');
            if($things.length < 2) return;
            $things = $this.children('.thing:not(.morechildren)')
            .sort(function(a, b){
                return (b.dataset.nchildren - a.dataset.nchildren);
            });
            $this.prepend($things).prepend($this.children('.thing.tb-drama')).prepend($this.children('.thing.tb-ndrama'));
        });
    }

    function collapseThing(){
        $(this).addClass('collapsed').find('.expand').eq(0).text('[+]');
    }
    function uncollapseThing(){
        $(this).removeClass('collapsed').find('.expand').eq(0).text('[–]');
    }

    function collapseNonDrama(){
        $('.thing.tb-drama, .thing.tb-ndrama').each(uncollapseThing);
        $('.commentarea > .sitetable > .thing:not(.tb-drama, .tb-ndrama), .thing.tb-drama > .child > .sitetable > .thing:not(.tb-drama, .tb-ndrama), .thing.tb-ndrama > .child > .sitetable > .thing:not(.tb-drama, .tb-ndrama)')
        .each(collapseThing);
    }

    function markThings(){
        $('.thing:not(.tb-processed)').addClass('tb-processed');
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
