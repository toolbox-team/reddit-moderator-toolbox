(function syntax() {

if (!location.pathname.match(/\/about\/stylesheet\/?/)) return;

$('.sheets .col').prepend('<div id="stylesheet_contents_div"></div>');

var editor = ace.edit("stylesheet_contents_div");
var textarea = $('textarea[name="stylesheet_contents"]').hide();
editor.getSession().setMode("ace/mode/css");
editor.getSession().setValue(textarea.val());
editor.getSession().on('change', function(){
  textarea.val(editor.getSession().getValue());
});

})();