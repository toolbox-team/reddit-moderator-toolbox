// syntax highlighter with ACE, by creesch

var syntaxHighlighter = new TB.Module('Syntax Highlighter');

syntaxHighlighter.config["betamode"] = false;

syntaxHighlighter.register_setting(
    'selectedTheme', {
        "type": "syntaxTheme",
        "default": 'monokai',
        "hidden": false,
        "title": "Syntax highlight theme selection"
    });

syntaxHighlighter.settings["enabled"]["default"] = true; // on by default

// we reference this from tbobject for settings generation
syntaxHighlighter.themeSelect = '\
<select id="theme_selector">\
    <option value="ambiance">ambiance</option>\
    <option value="chaos">chaos</option>\
    <option value="chrome">chrome</option>\
    <option value="cloud9_day">cloud9_day</option>\
    <option value="cloud9_night">cloud9_night</option>\
    <option value="cloud9_night_low_color">cloud9_night_low_color</option>\
    <option value="clouds">clouds</option>\
    <option value="clouds_midnight">clouds_midnight</option>\
    <option value="cobalt">cobalt</option>\
    <option value="crimson_editor">crimson_editor</option>\
    <option value="dawn">dawn</option>\
    <option value="dreamweaver">dreamweaver</option>\
    <option value="eclipse">eclipse</option>\
    <option value="github">github</option>\
    <option value="idle_fingers">idle_fingers</option>\
    <option value="katzenmilch">katzenmilch</option>\
    <option value="kuroir">kuroir</option>\
    <option value="merbivore">merbivore</option>\
    <option value="merbivore_soft">merbivore_soft</option>\
    <option value="monokai">monokai</option>\
    <option value="mono_industrial">mono_industrial</option>\
    <option value="pastel_on_dark">pastel_on_dark</option>\
    <option value="solarized_dark">solarized_dark</option>\
    <option value="solarized_light">solarized_light</option>\
    <option value="terminal">terminal</option>\
    <option value="textmate">textmate</option>\
    <option value="tomorrow">tomorrow</option>\
    <option value="tomorrow_night">tomorrow_night</option>\
    <option value="tomorrow_night_blue">tomorrow_night_blue</option>\
    <option value="tomorrow_night_bright">tomorrow_night_bright</option>\
    <option value="tomorrow_night_eighties">tomorrow_night_eighties</option>\
    <option value="twilight">twilight</option>\
    <option value="vibrant_ink">vibrant_ink</option>\
    <option value="xcode">xcode</option>\
</select>\
';

syntaxHighlighter.init = function init() {

    var selectedTheme = this.setting('selectedTheme');

    if (location.pathname.match(/\/about\/stylesheet\/?/)) {
        $('.sheets .col').prepend('<div id="stylesheet_contents_div"></div>');

        var editor = ace.edit("stylesheet_contents_div"),
            textarea = $('textarea[name="stylesheet_contents"]').hide();

        editor.setTheme("ace/theme/" + selectedTheme);
        editor.getSession().setMode("ace/mode/css");

        editor.getSession().setValue(textarea.val());
        editor.getSession().on('change', function () {
            textarea.val(editor.getSession().getValue());
        });
        $('body').addClass('mod-toolbox-ace');

        $('#stylesheet_contents_div').before(this.themeSelect);

        $('#theme_selector').val(selectedTheme);

        $('body').on('change', '#theme_selector', function () {

            var themeName = $(this).val();
            editor.setTheme("ace/theme/" + themeName);


        });
    }

    if (location.pathname.match(/\/wiki\/edit\/automoderator\/?/) || location.pathname.match(/\/wiki\/edit\/toolbox\/?/)) {
        $('#editform').prepend('<div id="wiki_contents_div"></div>');

        var editor = ace.edit("wiki_contents_div"),
            textarea = $('textarea[name="content"]').hide();

        editor.setTheme("ace/theme/" + selectedTheme);

        if (location.pathname.match(/\/wiki\/edit\/automoderator\/?/)) {
            editor.getSession().setMode("ace/mode/yaml");
        }
        if (location.pathname.match(/\/wiki\/edit\/toolbox\/?/)) {
            editor.getSession().setMode("ace/mode/json");
        }
        editor.getSession().setValue(textarea.val());
        editor.getSession().on('change', function () {
            textarea.val(editor.getSession().getValue());
        });
        $('body').addClass('mod-toolbox-ace');

        $('#editform').prepend(this.themeSelect);

        $('#theme_selector').val(selectedTheme);

        $('body').on('change', '#theme_selector', function () {

            var themeName = $(this).val();
            editor.setTheme("ace/theme/" + themeName);


        });
    }


    $('.ace_editor').on("webkitTransitionEnd transitionend oTransitionEnd", function () {
       editor.resize();
    });

};

TB.register_module(syntaxHighlighter);
