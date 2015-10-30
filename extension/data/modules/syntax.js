function syntax() {
// syntax highlighter with ACE, by creesch

var self = new TB.Module('Syntax Highlighter');
self.shortname = 'Syntax';

self.settings['enabled']['default'] = true;

self.register_setting('enableWordWrap', {
    'type': 'boolean',
    'default': true,
    'title': 'Enable word wrap in editor'
});
self.register_setting('selectedTheme', {
    'type': 'syntaxTheme',
    'default': 'monokai',
    'title': 'Syntax highlight theme selection'
});

self.settings['enabled']['default'] = true; // on by default

// we reference this from tbobject for settings generation
self.themeSelect = '\
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

self.init = function () {
    var $body = $('body'),
        selectedTheme = this.setting('selectedTheme'),
        enableWordWrap = this.setting('enableWordWrap'),
        editor, session, textarea;


    if (location.pathname.match(/\/about\/stylesheet\/?/)) {
        $('.sheets .col').prepend('<div id="stylesheet_contents_div"></div>');

        editor = ace.edit("stylesheet_contents_div");
        session = editor.getSession();
        textarea = $('textarea[name="stylesheet_contents"]').hide();

        editor.getSession().setUseWrapMode(enableWordWrap);

        editor.setTheme("ace/theme/" + selectedTheme);
        if (TBUtils.browser == 'chrome') {
            ace.config.set("workerPath", chrome.extension.getURL("/data/libs/"));
        } else if (TBUtils.browser == 'safari') {
            ace.config.set('workerPath', safari.extension.baseURI + '/data/libs/')
        } else if (TBUtils.browser == 'firefox') {
            session.setUseWorker(false);
        }
        session.setMode("ace/mode/css");


        session.setValue(textarea.val());
        var tbAceButtonsHTML = '<div id="tb-ace-buttons">{{save}} - {{preview}}</div>';

        var tbAceButtons = TB.utils.template(tbAceButtonsHTML, {
            'save': TB.ui.actionButton('save', 'tb-ace-button-save'),
            'preview': TB.ui.actionButton('preview', 'tb-ace-button-preview')
        });


        $body.find('.sheets .buttons').before(tbAceButtons);

        $body.delegate('.tb-ace-button-save', 'click', function() {
            textarea.val(session.getValue());
            $('.sheets .buttons .btn[name="save"]').click();
        });

        $body.delegate('.tb-ace-button-preview', 'click', function() {
            textarea.val(session.getValue());
            $('.sheets .buttons .btn[name="preview"]').click();
        });


        $body.addClass('mod-toolbox-ace');

        $('#stylesheet_contents_div').before(this.themeSelect);

        $('#theme_selector').val(selectedTheme);

        $body.on('change keydown', '#theme_selector', function () {
            var thingy = $(this);
            setTimeout(function () {
                editor.setTheme("ace/theme/" + thingy.val());
            }, 0);
        });
    }

    if (location.pathname.match(/\/wiki\/(edit|create)\/(config\/)?automoderator(-schedule)?\/?$/)
        || location.pathname.match(/\/wiki\/edit\/toolbox\/?$/)

    ) {
        $body.addClass('mod-toolbox-ace');
        $body.find('.markdownEditor-wrapper, .RESBigEditorPop, .help-toggle').remove();
        var $editform = $('#editform');

        $editform.prepend('<div id="wiki_contents_div"></div>');

        editor = ace.edit("wiki_contents_div");
        session = editor.getSession();
        textarea = $('textarea[name="content"]').hide();

        if (enableWordWrap) {
            editor.getSession().setUseWrapMode(true);
        }
        editor.setTheme("ace/theme/" + selectedTheme);

        if (location.pathname.match(/\/wiki\/(edit|create)\/(config\/)?automoderator(-schedule)?\/?$/)) {
            session.setMode("ace/mode/yaml");
        }
        if (location.pathname.match(/\/wiki\/edit\/toolbox\/?$/)) {
            session.setMode("ace/mode/json");
        }
        session.setValue(textarea.val());

        $('#wiki_save_button').after(TB.ui.actionButton('save page', 'tb-ace-button-save-wiki'));

        $body.delegate('.tb-ace-button-save-wiki', 'click', function() {
            textarea.val(session.getValue());
            $('#wiki_save_button').click();
        });


        $editform.prepend(this.themeSelect);

        $('#theme_selector').val(selectedTheme);

        $body.on('change keydown', '#theme_selector', function () {
            var thingy = $(this);
            setTimeout(function () {
                editor.setTheme("ace/theme/" + thingy.val());
            }, 0);
        });
    }

    $('.ace_editor').on("webkitTransitionEnd transitionend oTransitionEnd", function () {
        editor.resize();
    });
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        syntax();
    });
})();
