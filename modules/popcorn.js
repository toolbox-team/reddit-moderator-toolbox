function popcorn() {
    var self = new TB.Module('Popcorn');
    self.shortname = 'popcorn';

//Default settings
self.settings['enabled']['default'] = true;

self.register_setting('negHighlightThreshold', {
    'type': 'number',
    'default': '0',
    'title': 'Negative comment highlight score threshold'
});

self.init = function() {
    var neg_thresh = self.setting('negHighlightThreshold');
    $('.commentarea > .sitetable').before($('<div style="margin:10px;">')
        .append($('<button style="margin-right:10px;">Popcorn!</button>').click(sortChildren))
        .append($('<button>Salt Please!</button>').click(collapseNonDrama))
        );

    $('.morecomments').click(function(){
        $(this).parents('.thing').eq(1).find('.thing').last().after($('<button style="margin:10px;">Re-Pop!</button>')
            .click(repop)
            );
    });

    init();


    function init(){
        highlight();
    }



    /* Functions */

    function highlight(){
        //highlight negative children (You left code at work!)
        $('.numchildren').each(numberChildren);
        $('.controversial > .entry').addClass('drama')
        .parents('.thing').addClass('drama');
    }

    function numberChildren(){
        var $this = $(this);
        $this.parents('.thing')[0].dataset.nchildren = $this.text().match(/\d+/)[0];
    }

    function repop(){
        $(this).parents('.thing').eq(0).find('.controversial > .entry')
        .addClass('drama').parents('.thing').addClass('drama');
        $(this).remove();
    }

    function sortChildren(){
        if($('.thing:not(.drama).controversial').length > 0) highlight();//is wierd for some reason, must test, forgot why. Investigate!
        $('.sitetable').each(function(){
            var $this = $(this);
            var $things = $this.find('.thing');
            if($things.length < 2) return;
            $things = $this.children('.thing:not(.morechildren)')
            .sort(function(a, b){
                return (b.dataset.nchildren - a.dataset.nchildren);
            });
            $this.prepend($things).prepend($this.children('.thing.drama'));
        });
    }

    function collapseNonDrama(){
        $('.thing:not(.drama)').addClass('collapsed').removeClass('noncollapsed');
        $('.thing.drama').addClass('noncollapsed').removeClass('collapsed');
    }

/*  TODO
    
    Don't reselect different .thing's all the time?  Is it faster to reselect by class or to probe exesting collection ( .hasClass() )?

    highlight should be child based so on init() it grabs the appropriate parent, but on morecomments() it grabs child.things

    Steal .collapsed css make .tb-collapsed

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
