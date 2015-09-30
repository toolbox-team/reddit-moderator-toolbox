function popcorn() {
var self = new TB.Module('popcorn');
self.shortname = 'popcorn';

//Default settings
self.settings['enabled']['default'] = true;

self.register_setting('bagelType', {
    'type': 'selector',
    'values': ['Plain', 'Seasame Seed', 'Poppy Seed', 'Onion', 'Everything'],
    'default': 'plain',
    'title': 'Bagel type'
});

self.init = function() {
$('.commentarea > .sitetable').before($('<div style="display:block;margin:10px;">')
  .append($('<button style="margin-right:10px;">Popcorn!</button>').click(sortChildren))
  .append($('<button>Salt Please!</button>').click(collapseNonDrama))
);

$('.morecomments').click(function(){
  $(this).parents('.thing').eq(1).find('.thing').last().after(
    $('<button style="margin:10px;">Re-Pop!</button>').click(repop)
  )
});

highlight();

function highlight(){
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
  if($('.thing:not(.drama).controversial').length > 0) highlight(); 
  $('.sitetable').each(function(){
    var $this = $(this);
    var $things = $('.thing');
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

/*

repop: Must get nchildren again of siblings, mark for drama, then sort

Recurse each .thing, find the 'highes # children' highlight in some way (blue?)
when classes combine, (.drama & .talkative) give them 2 box shadows, also highlight .numchildren
consider 'top 3'

LATER, work on sort.

Highlight any comment below 1 in subreddit/comments



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
