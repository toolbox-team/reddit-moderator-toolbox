import CodeMirror from 'codemirror';
import $ from 'jquery';

import {syntaxHighlighterThemeSelect as themeSelect} from '../tbconstants.js';
import {Module} from '../tbmodule.js';
import * as TBui from '../tbui.js';

export default new Module({
    name: 'Syntax Highlighter',
    id: 'Syntax',
    enabledByDefault: true,
    oldReddit: true,
    settings: [
        {
            id: 'enableWordWrap',
            description: 'Enable word wrap in editor',
            type: 'boolean',
            default: true,
        },
        {
            id: 'wikiPages',
            description:
                'In addition to the CSS, the following wiki pages get the specified code formatting. Language is one of css, json, markdown, or yaml',
            type: 'map',
            default: {
                'config/automoderator': 'yaml',
                'config/stylesheet': 'css',
                'automoderator-schedule': 'yaml',
                'toolbox': 'json',
            },
            labels: ['page', 'language'], // language is one of [css,json,markdown,yaml] - otherwise, defaults to markdown. md is also explicitly an alias of markdown
        },
        {
            id: 'selectedTheme',
            description: 'Syntax highlight theme selection',
            type: 'syntaxTheme',
            default: 'dracula',
        },
    ],
}, ({selectedTheme, enableWordWrap, wikiPages}) => {
    const $body = $('body');

    // This makes sure codemirror behaves and uses spaces instead of tabs.
    function betterTab (cm) {
        if (cm.somethingSelected()) {
            cm.indentSelection('add');
        } else {
            cm.replaceSelection(
                cm.getOption('indentWithTabs')
                    ? '\t'
                    : Array(cm.getOption('indentUnit') + 1).join(' '),
                'end',
                '+input',
            );
        }
    }

    const keyboardShortcutsHelper = `<div class="tb-syntax-keyboard">
                                              <b>Keyboard shortcuts</b>
                                                  <ul>
                                                    <li><i>F11:</i> Fullscreen</li>
                                                    <li><i>Esc:</i> Close Fullscreen</li>
                                                    <li><i>Ctrl-/ / Cmd-/:</i> Toggle comment</li>
                                                    <li><i>Ctrl-F / Cmd-F:</i> Start searching</li>
                                                    <li><i>Ctrl-Alt-F / Cmd-Alt-F:</i> Persistent search (dialog doesn't autoclose) </li>
                                                    <li><i>Ctrl-G / Cmd-G:</i> Find next</li>
                                                    <li><i>Shift-Ctrl-G / Shift-Cmd-G:</i>  Find previous</li>
                                                    <li><i>Shift-Ctrl-F / Cmd-Option-F:</i> Replace</li>
                                                    <li><i>Shift-Ctrl-R / Shift-Cmd-Option-F:</i>  Replace all</li>
                                                    <li><i>Alt-G:</i> Jump to line </li>
                                                    <li><i>Ctrl-Space / Cmd-Space:</i> autocomplete</li>
                                                </ul>
                                              </div>`;
    //  Editor for css.
    if (location.pathname.match(/\/about\/stylesheet\/?/)) {
        let stylesheetEditor;

        // Class added to apply some specific css.
        $body.addClass('mod-syntax');
        // Theme selector, doesn't really belong here but gives people the opportunity to see how it looks with the css they want to edit.
        $('.sheets .col').before(themeSelect);

        $('#theme_selector').val(selectedTheme);

        // Here apply codeMirror to the text area, the each itteration allows us to use the javascript object as codemirror works with those.
        $('#stylesheet_contents').each((index, elem) => {
            // Editor setup.
            stylesheetEditor = CodeMirror.fromTextArea(elem, {
                mode: 'text/css',
                autoCloseBrackets: true,
                lineNumbers: true,
                theme: selectedTheme,
                indentUnit: 4,
                extraKeys: {
                    'Ctrl-Space': 'autocomplete',
                    'Ctrl-Alt-F': 'findPersistent',
                    'Ctrl-/': 'toggleComment',
                    'F11' (cm) {
                        cm.setOption('fullScreen', !cm.getOption('fullScreen'));
                    },
                    'Esc' (cm) {
                        if (cm.getOption('fullScreen')) {
                            cm.setOption('fullScreen', false);
                        }
                    },
                    'Tab': betterTab,
                    'Shift-Tab' (cm) {
                        cm.indentSelection('subtract');
                    },
                },
                lineWrapping: enableWordWrap,
            });

            $body.find('.CodeMirror.CodeMirror-wrap').prepend(keyboardShortcutsHelper);
        });

        // In order to make save buttons work we need to hijack  and replace them.
        const tbSyntaxButtons = `<div id="tb-syntax-buttons">
                ${TBui.actionButton('save', 'tb-syntax-button-save')} - ${
            TBui.actionButton('preview', 'tb-syntax-button-preview')
        }
            </div>`;

        $body.find('.sheets .buttons').before(tbSyntaxButtons);

        // When the toolbox buttons are clicked we put back the content in the text area and click the now hidden original buttons.
        $body.delegate('.tb-syntax-button-save', 'click', () => {
            stylesheetEditor.save();
            $('.sheets .buttons .btn[name="save"]').click();
        });

        $body.delegate('.tb-syntax-button-preview', 'click', () => {
            stylesheetEditor.save();
            $('.sheets .buttons .btn[name="preview"]').click();
        });

        // Actually dealing with the theme dropdown is done here.
        $body.on('change keydown', '#theme_selector', function () {
            const thingy = $(this);
            setTimeout(() => {
                stylesheetEditor.setOption('theme', thingy.val());
            }, 0);
        });
    }

    // Are we on a wiki edit or create page?
    const wikiRegex = /\/wiki\/(?:edit|create)\/?([a-z0-9-_/]*[a-z0-9-_])/;
    const wikiMatch = location.pathname.match(wikiRegex);
    // Are we on a page from the list in the settings?
    if (wikiMatch) {
        const wikiPage = wikiMatch[1]; // make sure wikiMatch exists before referencing it
        const language = wikiPages[wikiPage];
        if (language) {
            // we've checked the current page is the edit page for one of the pages in the settings, replace the textarea with CodeMirror
            let miscEditor;
            const $editform = $('#editform');

            // let's get the type and convert it to the correct mimetype for codemirror
            let mimetype;
            switch (wikiPages[wikiPage].toLowerCase()) {
                case 'css':
                    mimetype = 'text/css';
                    break;
                case 'json':
                    mimetype = 'application/json';
                    break;
                case 'markdown':
                case 'md':
                    mimetype = 'text/markdown';
                    break;
                case 'yaml':
                    mimetype = 'text/x-yaml';
                    break;
                default:
                    mimetype = 'text/markdown';
            }

            // Class added to apply some specific css.
            $body.addClass('mod-syntax');

            // We also need to remove some stuff RES likes to add.
            $body.find('.markdownEditor-wrapper, .RESBigEditorPop, .help-toggle').remove();

            // Theme selector, doesn't really belong here but gives people the opportunity to see how it looks with the css they want to edit.
            $editform.prepend(themeSelect);

            $('#theme_selector').val(selectedTheme);

            // Here apply codeMirror to the text area, the each itteration allows us to use the javascript object as codemirror works with those.
            $('#wiki_page_content').each((index, elem) => {
                // Editor setup.
                miscEditor = CodeMirror.fromTextArea(elem, {
                    mode: mimetype,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                    theme: selectedTheme,
                    indentUnit: 4,
                    extraKeys: {
                        'Ctrl-Alt-F': 'findPersistent',
                        'Ctrl-/': 'toggleComment',
                        'F11' (cm) {
                            cm.setOption('fullScreen', !cm.getOption('fullScreen'));
                        },
                        'Esc' (cm) {
                            if (cm.getOption('fullScreen')) {
                                cm.setOption('fullScreen', false);
                            }
                        },
                        'Tab': betterTab,
                        'Shift-Tab' (cm) {
                            cm.indentSelection('subtract');
                        },
                    },
                    lineWrapping: enableWordWrap,
                });

                $body.find('.CodeMirror.CodeMirror-wrap').prepend(keyboardShortcutsHelper);
            });

            // In order to make save button work we need to hijack and replace it.
            $('#wiki_save_button').after(TBui.actionButton('save page', 'tb-syntax-button-save-wiki'));

            // When the toolbox buttons is clicked we put back the content in the text area and click the now hidden original button.
            $body.delegate('.tb-syntax-button-save-wiki', 'click', () => {
                miscEditor.save();
                $('#wiki_save_button').click();
            });

            // Actually dealing with the theme dropdown is done here.
            $body.on('change keydown', '#theme_selector', function () {
                const thingy = $(this);
                setTimeout(() => {
                    miscEditor.setOption('theme', thingy.val());
                }, 0);
            });
        }
    }
});
