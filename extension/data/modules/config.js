import CodeMirror from 'codemirror';
import $ from 'jquery';

import * as TBApi from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import * as TBHelpers from '../tbhelpers.js';
import {Module} from '../tbmodule.jsx';
import * as TBui from '../tbui.js';
import {clearCache} from '../util/cache.ts';
import {icons} from '../util/icons.ts';
import createLogger from '../util/logging.ts';
import {getSettingSync} from '../util/oldLegacyStorageBullshit.ts';
import {purify, purifyObject} from '../util/purify.js';

const log = createLogger('TBConfig');

export default new Module({
    name: 'toolbox Config',
    id: 'TBConfig',
    enabledByDefault: true,
}, () => {
    // if (!(TBCore.post_site && TBCore.isMod) && !TBCore.isModpage) {
    //    return;
    // }

    // Set up some base variables
    const $body = $('body');
    const unManager = getSettingSync('UserNotes', 'unManagerLink', true);
    let config = TBCore.config;
    let sortReasons = [];
    let subreddit;
    let postFlairTemplates;
    let userFlairTemplates;

    // With the following function we will create the UI when we need it.
    // Create the window overlay.
    function showConfig (subredditConfig, configData) {
        TBui.overlay({
            title: `toolbox Configuration - /r/${subredditConfig}`,
            tabs: [
                {
                    title: 'Settings Home',
                    tooltip: 'Pointers and handy links.',
                    content: `
                <span class="tb-config-intro">
                Through this window you can edit the settings for /r/${subredditConfig}. </br>
                </br>Settings you change here will apply to the entire subreddit and by extension other moderators.
                </br>
                </br><a href="${
                        TBCore.link(`/r/${subredditConfig}/w/pages/`)
                    }" class="tb-general-button">All Wiki Pages</a>
                </br><a ${unManager ? 'style="display:none;"' : ''} href="${
                        TBCore.link(`/r/${subredditConfig}/about/usernotes/`)
                    }" class="tb-general-button">Manage Usernotes</a>

                </span>
                `,
                    footer: '',
                },
                {
                    title: 'edit toolbox config',
                    tooltip: 'Edit raw JSON for subreddit config.',
                    advanced: true,
                    content: `
                <textarea class="tb-input edit-wikidata" rows="20" cols="20"></textarea><br>
                <br>
                <input type="text" class="tb-input" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />`,
                    footer:
                        '<input class="save-wiki-data tb-action-button" data-tabname="edit_toolbox_config" type="button" style="display:none" value="Save Page to Wiki">',
                },
                {
                    title: 'edit user notes',
                    tooltip: 'Edit raw JSON for subreddit usernotes.',
                    advanced: true,
                    content: `
                <div class="error"><b>Here be dragons! Only edit this if you are absolutely sure what you are doing.</b></div>
                <textarea class="tb-input edit-wikidata" rows="20" cols="20"></textarea><br>
                <br>
                <input type="text" class="tb-input" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />`,
                    footer:
                        '<input class="save-wiki-data tb-action-button" data-tabname="edit_user_notes" type="button" style="display:none" value="Save Page to Wiki">',
                },
                {
                    title: 'edit user note types',
                    tooltip: 'Edit user note types and colors here.',
                    content: `<div id="tb-config-usernote-types">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Key</th>
                                </tr>
                            </thead>
                            <tbody id="tb-config-usernote-type-list"></tbody>
                        </table><a class="tb-general-button" href="javascript:;" id="add-usernote-type">Add user note type</a><a class="tb-general-button" data-module="usernotes" href="javascript:;" id="tb-config-help">help</a>
                    </div>`,
                    footer: $('<input>').prop('type', 'button').attr('id', 'save-usernote-types').addClass(
                        'tb-action-button',
                    ).prop('value', 'Save user note types'),
                },
                {
                    title: 'edit automoderator config',
                    tooltip: 'Edit the automoderator config.',
                    content: `
                <p class="tb-settings-p">
                    <a href="${
                        TBCore.link('/wiki/automoderator/full-documentation')
                    }" target="_blank">Full automoderator documentation</a>
                </p>
                <div class="error" style="display:none"><b>Config not saved!</b><br> <pre class="errorMessage"></pre></div>
                <textarea class="tb-input edit-wikidata" rows="20" cols="20"></textarea><br>
                <br>
                <input type="text" class="tb-input" name="edit-wikidata-note" placeholder="wiki page revision reason (optional)" />`,
                    footer:
                        '<input class="save-wiki-data tb-action-button" data-tabname="edit_automoderator_config" type="button" style="display:none" value="Save Page to Wiki">',
                },
                {
                    title: 'removal reasons settings',
                    tooltip: 'Configure the basic behavior for removal reasons here.',
                    content: `
                <div id="tb-removal-reason-settings">
                    <h3>Removal reason header text</h3>
                    <textarea placeholder="Header" class="tb-input edit-header" style="display:block;">${
                        TBHelpers.htmlEncode(
                            unescape(configData.removalReasons.header ? configData.removalReasons.header : ''),
                        )
                    }</textarea>
                    <h3>Removal reason footer text</h3>
                    <textarea placeholder="Footer" class="tb-input edit-footer" style="display:block;">${
                        TBHelpers.htmlEncode(
                            unescape(configData.removalReasons.footer ? configData.removalReasons.footer : ''),
                        )
                    }</textarea>
                    <h3>Removal reason actions</h3>
                    <select name="removal-option" id="removal-option">
                        <option value="suggest" ${
                        !configData.removalReasons.removalOption
                            || configData.removalReasons.removalOption === 'suggest'
                            ? 'selected'
                            : ''
                    }>Suggest to moderators</option>
                        <option value="force" ${
                        configData.removalReasons.removalOption === 'force' ? 'selected' : ''
                    }>Force for moderators</option>
                        <option value="leave" ${
                        configData.removalReasons.removalOption === 'leave' ? 'selected' : ''
                    }>Leave up to moderator settings</option>
                    </select>
                    <div id="buttons">
                        <ul>
                            <li>
                                <input name="type-reply" class="reason-type" type="radio" value="reply" id="type-reply-comment" ${
                        !configData.removalReasons.typeReply || configData.removalReasons.typeReply === 'reply'
                            ? 'checked'
                            : ''
                    }/>
                                <label for="type-reply-comment">Reply with a comment to the item that is removed.</label>
                                <ul>
                                    <li>
                                        <input class="reason-sticky" type="checkbox" id="type-stickied" ${
                        configData.removalReasons.typeStickied ? 'checked' : ''
                    }/>
                                        <label for="type-stickied">Sticky the removal comment.</label>
                                    </li>
                                    <li>
                                        <input class="action-lock-comment" type="checkbox" id="type-action-lock-comment" ${
                        configData.removalReasons.typeLockComment ? 'checked' : ''
                    }/>
                                        <label for="type-action-lock-comment">Lock the removal comment.</label>
                                    </li>
                                    <li>
                                        <input class="reason-comment-as-subreddit" type="checkbox" id="type-comment-as-subreddit" ${
                        configData.removalReasons.typeCommentAsSubreddit ? 'checked' : ''
                    }/>
                                        <label for="type-comment-as-subreddit">Send as /u/${subredditConfig}-ModTeam.</label>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <input name="type-reply" class="reason-type" type="radio" value="pm" id="type-reply-pm" ${
                        configData.removalReasons.typeReply === 'pm' ? 'checked' : ''
                    }/>
                                <label for="type-reply-pm">Send as PM (personal message)</label>
                                <ul>
                                    <li>
                                        <input class="reason-as-sub" type="checkbox" id="type-as-sub" ${
                        configData.removalReasons.typeAsSub ? 'checked' : ''
                    }/>
                                        <label for="type-as-sub">Send pm via modmail as subreddit <b>Note:</b> This will clutter up modmail.</label>
                                    </li>
                                    <li>
                                        <input class="reason-auto-archive" type="checkbox" id="type-auto-archive" ${
                        configData.removalReasons.autoArchive ? 'checked' : ''
                    }/>
                                        <label for="type-auto-archive">Auto-archive sent modmail pm <b>Note:</b> Only works on new modmail.</label>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <input name="type-reply" class="reason-type" type="radio" value="both" id="type-reply-both" ${
                        configData.removalReasons.typeReply === 'both' ? 'checked' : ''
                    }/>
                                <label for="type-reply-both">Send as both PM and reply.</label>
                            </li>
                            <li class="rr-advanced">
                                <input name="type-reply" class="reason-type" type="radio" value="none" id="type-reply-none" ${
                        configData.removalReasons.typeReply === 'none' ? 'checked' : ''
                    }/>
                                <label for="type-reply-none">Send nothing and log the removal.</label>
                            </li>
                            <li>
                                <input class="action-lock-thread" type="checkbox" id="type-action-lock-thread" ${
                        configData.removalReasons.typeLockThread ? 'checked' : ''
                    }/>
                                <label for="type-action-lock-thread">Lock the removed thread.</label>
                            </li>
                        </ul>
                    </div>
                    <a href="javascript:;" class="advanced-enable show-advanced tb-general-button" ${
                        getSettingSync('Utils', 'advancedMode', false) ? '' : 'style="display:none;"'
                    }>show advanced settings</a>
                    <h3 class="rr-advanced">Advanced settings</h3>
                    <div class="rr-advanced">
                        get reason from /r/:
                        <input class="getfrom tb-input" type="text" value="${
                        configData.removalReasons.getfrom ? configData.removalReasons.getfrom : ''
                    }"/> (<span style="color:red">WARNING:</span> this setting overrides all other settings.)  &nbsp;
                    </div>
                    <div class="rr-advanced">
                        logsub /r/:
                        <input class="logsub tb-input" type="text" value="${
                        configData.removalReasons.logsub ? configData.removalReasons.logsub : ''
                    }"/>
                    </div>
                    <div class="rr-advanced">
                        pmsubject:
                        <input class="pmsubject tb-input" type="text" value="${
                        configData.removalReasons.pmsubject ? configData.removalReasons.pmsubject : ''
                    }"/>
                    </div>
                    <div class="rr-advanced">
                        logtitle:
                        <input class="logtitle tb-input" type="text" value="${
                        configData.removalReasons.logtitle ? configData.removalReasons.logtitle : ''
                    }"/>
                    </div>
                    <div class="rr-advanced">
                        bantitle:
                        <input class="bantitle tb-input" type="text" value="${
                        configData.removalReasons.bantitle ? configData.removalReasons.bantitle : ''
                    }"/>
                    </div>
                    <div class="rr-advanced">
                        logreason:
                        <input class="logreason tb-input" type="text" value="${
                        configData.removalReasons.logreason ? configData.removalReasons.logreason : ''
                    }"/>
                    </div>
                </div>`,
                    footer:
                        '<input class="save-removal-settings tb-action-button" type="button" value="Save removal reasons settings">',
                },
                {
                    title: 'edit removal reasons',
                    tooltip: 'Edit and add your removal reasons here.',
                    content: `
                <a href="javascript:;" id="tb-add-removal-reason" class="tb-general-button"><i class="tb-icons">${icons.addCircle}</i> Add new removal reason</a>
                <a href="javascript:;" id="tb-config-help" class="tb-general-button" data-module="rreasons">help</a></br>
                <span id="tb-add-removal-reason-form" class="tb-removal-reason-field">
                    <input type="text" class="tb-input" name="removal-title" placeholder="removal reason title" /><br/>
                    <textarea class="tb-input edit-area" placeholder="reason comment text (optional if you're only using flair)"></textarea><br/>
                    <div>
                        <b>Use for:</b>
                        <input type="checkbox" id="remove-posts" name="remove-posts" checked>
                        <label for="remove-posts">Posts</label>
                        <input type="checkbox" id="remove-comments" name="remove-comments">
                        <label for="remove-comments">Comments</label>
                    </div>
                    <input type="text" class="tb-input" name="flair-text" placeholder="flair text" /><br/>
                    <input type="text" class="tb-input" name="flair-css" placeholder="flair css class" /><br/>
                    <select name="flair-id" id="flair-id-select" class="tb-action-button inline-button flair-picker">
                        <option value="Select flair" disabled>Select a flair template</option>
                        <option value="">None</option>
                    </select>
                    <input type="text" class="tb-input" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>
                    <input class="save-new-reason tb-action-button" type="button" value="Save new reason" /><input class="cancel-new-reason tb-action-button" type="button" value="Cancel adding reason" />
                </span>
                <table id="tb-removal-reasons-list">
                </table>
                `,
                    footer: '',
                },
                {
                    title: 'sort removal reasons',
                    tooltip: 'sort your removal reasons here.',
                    content: `
                <a href="javascript:;" id="tb-config-help" class="tb-general-button" data-module="rreasons">help</a>
                <div class="error">
                    <ul>
                        <li>When you hit save it will overwrite any unsaved changes in the "edit removal reasons" tab.</li>
                        <li>Navigating away from this tab will reset the reasons in their original order.</li>
                    </ul>
                </div>
                <table id="tb-removal-sort-list">
                </table>
                `,
                    footer:
                        '<input class="save-removal-sorting tb-action-button" type="button" value="Save removal reasons order">',
                },
                {
                    title: 'edit mod macros',
                    tooltip: 'Edit and add your mod macros here.',
                    content: `
                <a href="javascript:;" id="tb-add-mod-macro" class="tb-general-button"><i class="tb-icons">${icons.addCircle}</i> Add new mod macro</a>
                <a href="javascript:;" id="tb-config-help" class="tb-general-button" data-module="modmacros">help</a></br>
                <div id="tb-add-mod-macro-form">
                    <input type="text" class="tb-input" class="macro-title" name="macro-title" placeholder="macro title" /><br>
                    <textarea class="tb-input edit-area" placeholder="macro text"></textarea><br/>
                    <div class="tb-macro-actions">
                        <div class="tb-macro-actions-row">
                            <h2>Reply</h2>
                            <label><input type="checkbox" id="distinguish" checked>distinguish</label>
                            <label><input type="checkbox" id="sticky">sticky comment</label>
                            <label><input type="checkbox" id="lockreply">lock reply</label>
                        </div>
                        <div class="tb-macro-actions-row">
                            <h2>Item</h2>
                            <label><input type="checkbox" id="approveitem">approve item</label>
                            <label><input type="checkbox" id="removeitem">remove item</label>
                            <label><input type="checkbox" id="spamitem">spam item</label>
                            <label><input type="checkbox" id="lockitem">lock item</label>
                            <label><input type="checkbox" id="archivemodmail">archive modmail</label>
                            <label><input type="checkbox" id="highlightmodmail">highlight modmail</label>
                        </div>
                        <div class="tb-macro-actions-row">
                            <h2>User</h2>
                            <label><input type="checkbox" id="banuser">ban user</label>
                            <label><input type="checkbox" id="unbanuser">unban user</label>
                            <label><input type="checkbox" id="muteuser">mute user</label>
                        </div>
                        <div class="tb-macro-actions-row">
                            <h2 style="padding-right: 8px">User flair</h2>
                            <input type="hidden" class="tb-input" name="user-flair-text" id="userflair-text" value="">
                            <select name="user-flair-id" id="userflair-id-select" class="tb-action-button inline-button user-flair-picker">
                                <option value="Select user flair" disabled>Select user flair template</option>
                                <option value="">Don't touch</option>
                            </select>
                        </div>
                    </div>
                    <div class="tb-macro-context">
                        <h2>Which context</h2>
                        <label><input type="checkbox" id="context-post" name="context-post"> Post</label>
                        <label><input type="checkbox" id="context-comment" name="context-comment"> Comment</label>
                        <label><input type="checkbox" id="context-modmail" name="context-modmail"> Modmail</label>
                    </div>
                    <input type="text" class="tb-input" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>
                    <input class="save-new-macro tb-action-button" type="button" value="Save new macro"><input class="cancel-new-macro tb-action-button" type="button" value="Cancel adding macro">
                </div>
                <table id="tb-mod-macros-list">
                </table>
                `,
                    footer: '',
                },
                {
                    title: 'domain tags',
                    tooltip: 'basic domain tags stuff.',
                    content:
                        '<p>import tags from /r/:&nbsp;<input class="importfrom tb-input" type="text"/></input> (note: you need to mod wiki in this sub and the import sub.)</p>',
                    footer: '<input class="import tb-action-button" type="button" value="import" />',
                },
                {
                    title: 'ban macro',
                    tooltip: 'pre-fill the mod button ban note and reason with tekst and tokens..',
                    content: `
                    <table>
                    <td>
                        Ban note:
                    </td><td>
                        <input class="banNote tb-input" type="text" value="${
                        configData.banMacros && configData.banMacros.banNote ? configData.banMacros.banNote : ''
                    }"/>
                    </td>
                    </tr>
                    <tr>
                    <td>
                       Ban message:
                    </td><td>
                       <textarea class="tb-input banMessage">${
                        configData.banMacros && configData.banMacros.banMessage ? configData.banMacros.banMessage : ''
                    }</textarea>
                    </td>
                    </tr>
                </table>`,
                    footer: '<input class="save-ban-macro tb-action-button" type="button" value="Save ban macro">',
                },
            ],
        })
            .addClass('tb-config')
            .appendTo('body');

        $body.css('overflow', 'hidden');
    }

    // Advanced removal reasons
    $body.on('click', '.show-advanced', () => {
        $('.advanced-enable').hide();
        $('.rr-advanced').show();
    });

    // Help click event.
    $body.on('click', '#tb-config-help', function () {
        const module = $(this).attr('data-module');
        window.open(
            `https://old.reddit.com/r/toolbox/wiki/livedocs/${module}`,
            '',
            'scrollbars=1,width=500,height=600,location=0,menubar=0,top=100,left=100',
        );
    });

    window.addEventListener('TBNewPage', async event => {
        if (event.detail.pageDetails.subreddit) {
            const subreddit = event.detail.pageDetails.subreddit;

            const isMod = await TBCore.isModSub(subreddit);
            if (isMod) {
                TBui.contextTrigger('tb-config-link', {
                    addTrigger: true,
                    triggerText: `/r/${subreddit} config`,
                    triggerIcon: icons.tbSubConfig,
                    title: `toolbox configuration for /r/${subreddit}`,
                    dataAttributes: {
                        subreddit,
                    },
                });
            } else {
                TBui.contextTrigger('tb-config-link', {addTrigger: false});
            }
        } else {
            TBui.contextTrigger('tb-config-link', {addTrigger: false});
        }
    });

    // If it is one of the many buttons on a queue page we first have to fetch the data and see if it is there.
    $body.on('click', '#tb-config-link, .tb-config-link', function () {
        subreddit = $(this).attr('data-subreddit');

        TBApi.readFromWiki(subreddit, 'toolbox', true).then(resp => {
            if (!resp || resp === TBApi.WIKI_PAGE_UNKNOWN || resp === TBApi.NO_WIKI_PAGE) {
                log.debug('Failed: wiki config');

                config = TBCore.config;
                showConfig(subreddit, config);
            } else {
                config = resp;
                purifyObject(config);
                if (TBCore.isConfigValidVersion(subreddit, config)) {
                    showConfig(subreddit, config);
                } else {
                    TBui.textFeedback(
                        `This version of toolbox is not compatible with the /r/${subreddit} configuration.`,
                        TBui.FEEDBACK_NEGATIVE,
                    );
                }
            }
        });
    });

    // First before we do all the cool stuff, let's assume that people at one point also want to close the damn thing.

    $body.on('click', '.tb-config .close', () => {
        $('.tb-config').remove();
        $body.css('overflow', 'auto');

        $('.tb-config-color-chooser').remove();
        config = TBCore.config;
        sortReasons = [];
        subreddit = null;
        postFlairTemplates = null;
        userFlairTemplates = null;
    });

    // now we can play around!

    // Considering that this is a config page we want to be able to save whatever we do. This function takes care of that.
    function postToWiki (page, data, reason, isJSON, updateAM) {
        log.debug('posting to wiki');
        TBui.textFeedback('saving to wiki', TBui.FEEDBACK_NEUTRAL);
        TBApi.postToWiki(page, subreddit, data, reason, isJSON, updateAM).then(async () => {
            log.debug('save succ = true');
            if (page === 'config/automoderator') {
                $body.find('.edit_automoderator_config .error').hide();
            }
            log.debug('clearing cache');
            await clearCache();

            TBui.textFeedback('wiki page saved', TBui.FEEDBACK_POSITIVE);
        }).catch(async err => {
            log.debug(err);
            if (page === 'config/automoderator') {
                const $error = $body.find('.edit_automoderator_config .error');
                $error.show();

                const responseJSON = await err.response.json();
                const saveError = responseJSON.special_errors[0];
                $error.find('.errorMessage').html(purify(saveError));

                TBui.textFeedback('Config not saved!', TBui.FEEDBACK_NEGATIVE);
            } else {
                TBui.textFeedback(err.responseText, TBui.FEEDBACK_NEGATIVE);
            }
        });
    }

    // This function fetches all data for the wiki tabs.
    function wikiTabContent (tabname) {
        let page;
        let actualPage;
        switch (tabname) {
            case 'edit_toolbox_config':
                page = 'toolbox';
                actualPage = 'toolbox';
                break;
            case 'edit_user_notes':
                page = 'usernotes';
                actualPage = 'usernotes';
                break;
            case 'edit_automoderator_config':
                page = 'automoderator';
                actualPage = 'config/automoderator';
                break;
        }

        const $wikiContentArea = $body.find(`.tb-window-tab.${tabname}`);
        const $wikiFooterArea = $body.find(`.tb-window-footer.${tabname}`);

        const $textArea = $wikiContentArea.find('.edit-wikidata');
        const $saveButton = $wikiFooterArea.find('.save-wiki-data');

        if (getSettingSync('Syntax', 'enabled', true)) {
            $body.addClass('mod-syntax');
            let configEditor;
            let defaultMode = 'default';
            const selectedTheme = getSettingSync('Syntax', 'selectedTheme') || 'dracula';
            const enableWordWrap = getSettingSync('Syntax', 'enableWordWrap');

            if (page === 'automoderator') {
                defaultMode = 'text/x-yaml';
            } else {
                defaultMode = 'application/json';
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

            $textArea.each((index, elem) => {
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

                // Editor setup.
                configEditor = CodeMirror.fromTextArea(elem, {
                    mode: defaultMode,
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

            $textArea.val('getting wiki data...');
            configEditor.setValue('getting wiki data...');

            configEditor.on('change', () => {
                configEditor.save();
            });

            TBApi.readFromWiki(subreddit, actualPage, false).then(resp => {
                if (resp === TBApi.WIKI_PAGE_UNKNOWN) {
                    $textArea.val('error getting wiki data.');
                    configEditor.setValue('error getting wiki data.');
                    return;
                }

                if (resp === TBApi.NO_WIKI_PAGE) {
                    $textArea.val('');
                    configEditor.setValue('');
                    $saveButton.show();
                    $saveButton.attr('page', page);
                    return;
                }

                resp = TBHelpers.unescapeJSON(resp);

                if (page !== 'automoderator') {
                    resp = JSON.parse(resp);
                    resp = JSON.stringify(resp, null, 4);
                }

                // Found it, show it.
                $textArea.val(resp);
                configEditor.setValue(resp);

                $saveButton.show();
                $saveButton.attr('page', page);
            });
        } else {
            // load the text area, but not the save button.
            $textArea.val('getting wiki data...');

            TBApi.readFromWiki(subreddit, actualPage, false).then(resp => {
                if (resp === TBApi.WIKI_PAGE_UNKNOWN) {
                    $textArea.val('error getting wiki data.');
                    return;
                }

                if (resp === TBApi.NO_WIKI_PAGE) {
                    $textArea.val('');
                    $saveButton.show();
                    $saveButton.attr('page', page);
                    return;
                }

                resp = humanizeUsernotes(resp);
                resp = TBHelpers.unescapeJSON(resp);

                // Found it, show it.
                $textArea.val(resp);
                $saveButton.show();
                $saveButton.attr('page', page);
            });
        }

        function humanizeUsernotes (notes) {
            if (notes.ver >= 6) {
                return decompressBlob(notes);
            } else {
                return notes;
            }

            function decompressBlob (notes) {
                const decompressed = TBHelpers.zlibInflate(notes.blob);

                // Update notes with actual notes
                delete notes.blob;
                notes.users = JSON.parse(decompressed);
                return notes;
            }
        }
    }

    function populateUsernoteTypes () {
        let colors;
        if (config.usernoteColors && config.usernoteColors.length > 0) {
            colors = config.usernoteColors;
        } else {
            // Default types
            colors = TBCore.defaultUsernoteTypes;
        }

        let $list;
        colors.forEach(color => {
            $list = appendUsernoteType(color.key, color.text, color.color, $list);
        });
    }

    function appendUsernoteType (key, text, color, $list) {
        const safeColor = TBHelpers.colorNameToHex(color);
        if (!$list) {
            $list = $('#tb-config-usernote-type-list');
        }

        const $thing = $(`
            <tr class="usernote-type">
                <td><input class="name tb-input" name="type-name" placeholder="name (shown when adding a note)" type="text" value="${text}"></td>
                <td><input class="key tb-input" name="type-key" placeholder="key (should be unique)" type="text" value="${key}"></td>
                <td><input class="color" name="type-color" type="color" value="${safeColor}"></td>
                <td>
                    <a class="up-usernote-type tb-icons tb-icons-align-middle" href="javascript:;">${icons.sortUp}</a><a class="down-usernote-type tb-icons tb-icons-align-middle" href="javascript:;">${icons.sortDown}</a><a class="remove-usernote-type tb-icons tb-icons-negative tb-icons-align-middle" href="javascript:;">${icons.delete}</a>
                </td>
                <td class="usernote-error error"></td>
		    </tr>
            `);
        $list.append($thing);

        return $list;
    }

    async function addFlairTemplatesToDropdown ($dropdown, reasonNum) {
        // Fetching the flair templates if not fetched already
        if (!postFlairTemplates) {
            postFlairTemplates = await TBApi.apiOauthGET(`/r/${subreddit}/api/link_flair_v2`).then(r => r.json());
        }

        // We should only append the flair templates to the dropdown if they're not
        // already there, otherwise they'll duplicate with every click of the edit icon.
        if ($dropdown[0].childElementCount > 2) {
            return;
        }
        // Getting the current flair template for the reason so we can set the `selected` attribute
        // on one of the `<option>`s. When adding a new Removal Reason we don't have one
        // selected yet, so this argument won't be provided.
        const defaultOption = reasonNum ? config.removalReasons.reasons[reasonNum].flairTemplateID : '';

        postFlairTemplates.forEach(flair => {
            $dropdown.append(
                `<option value="${flair.id}" ${flair.id === defaultOption ? 'selected' : ''}>${flair.text}</option>`,
            );
        });
    }

    async function addUserFlairTemplatesToDropdown ($dropdown, macroNum) {
        // Fetching the flair templates if not fetched already
        if (!userFlairTemplates) {
            userFlairTemplates = await TBApi.apiOauthGET(`/r/${subreddit}/api/user_flair_v2`).then(r => r.json());
        }

        // We should only append user flair templates to the dropdown if they're not
        // already there, otherwise they'll duplicate with every click of the edit icon.
        if ($dropdown[0].childElementCount > 2) {
            return;
        }
        // Getting the current flair template for macro so we can set the `selected` attribute
        // on one of the `<option>`s. When adding a new macro we don't have one
        // selected yet, so this argument won't be provided.
        const defaultOption = macroNum ? config.modMacros[macroNum].userflair : '';

        userFlairTemplates.forEach(flair => {
            $dropdown.append(
                `<option value="${flair.id}" ${flair.id === defaultOption ? 'selected' : ''}>${flair.text}</option>`,
            );
        });
    }

    // With this function we'll fetch the removal reasons for editing
    function removalReasonsContent () {
        if (config.removalReasons && config.removalReasons.reasons.length > 0) {
            let i = 0;
            $(config.removalReasons.reasons).each(function () {
                let label = unescape(this.text);
                if (label === '') {
                    label = '<span style="color: #cecece">(no reason)</span>';
                } else {
                    if (label.length > 200) {
                        label = `${label.substring(0, 197)}...`;
                    }
                    label = TBHelpers.htmlEncode(label);
                }

                const removalReasonText = unescape(config.removalReasons.reasons[i].text) || '';
                const removalReasonTitle = config.removalReasons.reasons[i].title || '';
                const removalReasonRemovePosts = config.removalReasons.reasons[i].removePosts !== false
                    ? 'checked'
                    : '';
                const removalReasonRemoveComments = config.removalReasons.reasons[i].removeComments ? 'checked' : '';
                const removalReasonFlairText = config.removalReasons.reasons[i].flairText || '';
                const removalReasonFlairCSS = config.removalReasons.reasons[i].flairCSS || '';
                const removalReasonFlairID = config.removalReasons.reasons[i].flairID || [];

                const removalReasonTemplate = `
                <tr class="removal-reason" data-reason="{{i}}" data-subreddit="{{subreddit}}">
                    <td class="removal-reasons-buttons">
                        <a href="javascript:;" data-reason="{{i}}" data-subreddit="{{subreddit}}" class="edit tb-icons">${icons.edit}</a> <br>
                        <a href="javascript:;" data-reason="{{i}}" data-subreddit="{{subreddit}}" class="delete tb-icons tb-icons-negative">${icons.delete}</a>
                    </td>
                    <td class="removal-reasons-content" data-reason="{{i}}">
                        <span class="removal-reason-label" data-for="reason-{{subreddit}}-{{i++}}"><span><h3 class="removal-title">{{removalReasonTitle}}</h3>{{label}}</span></span><br>
                        <span class="removal-reason-edit tb-removal-reason-field">
                            <input type="text" class="tb-input" name="removal-title" placeholder="removal reason title" value="{{removalReasonTitle}}"/><br/>
                            <textarea class="tb-input edit-area">{{removalReasonText}}</textarea><br/>
                            <div>
                                <b>Use for:</b>
                                <input type="checkbox" class="tb-input" id="remove-posts{{i}}" name="remove-posts" {{removalReasonRemovePosts}}>
                                <label for="remove-posts{{i}}">Posts</label>
                                <input type="checkbox" class="tb-input" id="remove-comments{{i}}" name="remove-comments" {{removalReasonRemoveComments}}>
                                <label for="remove-comments{{i}}">Comments</label>
                            </div>
                            <input type="text" class="tb-input" name="flair-text" placeholder="flair text" value="{{removalReasonFlairText}}"/><br/>
                            <input type="text" class="tb-input" name="flair-css" placeholder="flair css class" value="{{removalReasonFlairCSS}}"/><br/>
                            <select name="flair-id" id="flair-id-select" class="tb-action-button inline-button flair-picker">
                                <option value="Select flair" disabled>Select a flair template</option>
                                <option value="">None</option>
                            </select>
                            <input type="text" class="tb-input" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>
                            <input class="save-edit-reason tb-action-button" type="button" value="Save reason" /><input class="cancel-edit-reason tb-action-button" type="button" value="Cancel" />
                        </span>
                    </td>
                </tr>`;

                const removalReasonTemplateHTML = TBHelpers.template(removalReasonTemplate, {
                    i,
                    subreddit,
                    'i++': i++,
                    label,
                    'removalReasonText': TBHelpers.escapeHTML(removalReasonText),
                    removalReasonTitle,
                    removalReasonRemovePosts,
                    removalReasonRemoveComments,
                    removalReasonFlairText,
                    removalReasonFlairCSS,
                    removalReasonFlairID,
                });

                const $removalReasonsList = $body.find('.edit_removal_reasons #tb-removal-reasons-list');

                $removalReasonsList.append(removalReasonTemplateHTML);
            });
        }
    }

    // With this function we'll fetch the removal reasons for editing
    function removalReasonsEditContent () {
        if (config.removalReasons && config.removalReasons.reasons.length > 0) {
            // Copy the reasons to a new array without reference to the old one.
            sortReasons = JSON.parse(JSON.stringify(config.removalReasons.reasons));

            config.removalReasons.reasons.forEach((reason, index) => {
                const removalReasonTitle = reason.title || '';

                const removalReasonTemplateHTML = `
                <tr class="removal-reason" data-reason="${index}" data-subreddit="${subreddit}">
                    <td class="removal-reasons-sort-buttons">
                        <a href="javascript:;" class="tb-sort-up tb-icons">${icons.sortUp}</a>
                        <a href="javascript:;" class="tb-sort-down tb-icons">${icons.sortDown}</a>
                    </td>
                    <td class="removal-reasons-content">
                        <span class="removal-reason-label">${removalReasonTitle}</span>
                    </td>
                </tr>`;

                const $removalReasonsList = $body.find('.sort_removal_reasons #tb-removal-sort-list');

                $removalReasonsList.append(removalReasonTemplateHTML);
            });
        }
    }

    // Mod macros are also nice to have!
    function modMacrosContent () {
        if (config.modMacros && config.modMacros.length > 0) {
            $(config.modMacros).each((i, item) => {
                let label = unescape(item.text);
                if (label === '') {
                    label = '<span style="color: #cecece">(no macro)</span>';
                } else {
                    if (label.length > 200) {
                        label = `${label.substring(0, 197)}...`;
                    }
                    label = TBHelpers.htmlEncode(label);
                }
                const macro = config.modMacros[i];
                const modMacroText = unescape(macro.text) || '';
                const modMacroTitle = macro.title || '';

                const modMacroTemplate = `
                <tr class="mod-macro" data-macro="{{i}}" data-subreddit="{{subreddit}}">
                    <td class="mod-macros-buttons">
                        <a href="javascript:;" data-macro="{{i}}" data-subreddit="{{subreddit}}" class="edit tb-icons">${icons.edit}</a> <br>
                        <a href="javascript:;" data-macro="{{i}}" data-subreddit="{{subreddit}}" class="delete tb-icons tb-icons-negative">${icons.delete}</a>
                    </td>
                    <td class="mod-macros-content" data-macro="{{i}}">
                        <span class="mod-macro-label" data-for="macro-{{subreddit}}-{{i}}"><span><h3 class="macro-title">{{modMacroTitle}}</h3>{{label}}</span></span><br>
                        <span class="mod-macro-edit">
                            <textarea class="tb-input edit-area" placeholder="macro text">{{modMacroText}}</textarea><br/>
                            <input type="text" class="macro-title tb-input" name="macro-title" placeholder="macro title" value="{{modMacroTitle}}" /><br>
                            <div class="tb-macro-actions">
                                <div class="tb-macro-actions-row">
                                    <h2>Reply</h2>
                                    <label><input type="checkbox" class="{{i}}-distinguish" id="distinguish">distinguish</label>
                                    <label><input type="checkbox" class="{{i}}-sticky" id="sticky">sticky comment</label>
                                    <label><input type="checkbox" class="{{i}}-lockreply" id="lockreply">lock reply</label>
                                </div>
                                <div class="tb-macro-actions-row">
                                    <h2>Item</h2>
                                    <label><input type="checkbox" class="{{i}}-approveitem" id="approveitem">approve item</label>
                                    <label><input type="checkbox" class="{{i}}-removeitem" id="removeitem">remove item</label>
                                    <label><input type="checkbox" class="{{i}}-spamitem" id="spamitem">spam item</label>
                                    <label><input type="checkbox" class="{{i}}-lockitem" id="lockitem">lock item</label>
                                    <label><input type="checkbox" class="{{i}}-archivemodmail" id="archivemodmail">archive modmail</label>
                                    <label><input type="checkbox" class="{{i}}-highlightmodmail" id="highlightmodmail">highlight modmail</label><br>
                                </div>
                                <div class="tb-macro-actions-row">
                                    <h2>User</h2>
                                    <label><input type="checkbox" class="{{i}}-banuser" id="banuser">ban user</label>
                                    <label><input type="checkbox" class="{{i}}-unbanuser" id="unbanuser">unban user</label>
                                    <label><input type="checkbox" class="{{i}}-muteuser" id="muteuser">mute user</label>
                                </div>
                                <div class="tb-macro-actions-row">
                                    <h2 style="padding-right: 8px;">User flair</h2>
                                    <input type="hidden" name="user-flair-text" class="tb-input {{i}}-user-flair-text" id="userflair-text" value="">
                                    <select name="user-flair-id" id="userflair-id-select" class="tb-action-button inline-button {{i}}-user-flair-picker">
                                        <option value="Select user flair" disabled>Select user flair template</option>
                                        <option value="">Don't touch</option>
                                    </select>
                                </div>
                            </div>
                            <div class="tb-macro-context">
                                <h2>Which context</h2>
                                <label><input type="checkbox" class="{{i}}-context-post" id="context-post" name="context-post"> Post</label>
                                <label><input type="checkbox" class="{{i}}-context-comment" id="context-comment" name="context-comment"> Comment</label>
                                <label><input type="checkbox" class="{{i}}-context-modmail" id="context-modmail" name="context-modmail"> Modmail</label>
                            </div>
                            <input type="text" class="tb-input" name="edit-note" placeholder="reason for wiki edit (optional)" /><br>
                            <input class="save-edit-macro tb-action-button" type="button" value="Save macro" /><input class="cancel-edit-macro tb-action-button" type="button" value="Cancel editing macro" />
                        </span>
                    </td>
                </tr>`;

                const modMacroTemplateHTML = TBHelpers.template(modMacroTemplate, {
                    i,
                    subreddit,
                    label,
                    modMacroText,
                    modMacroTitle,
                });

                const $removalReasonsList = $body.find('.edit_mod_macros #tb-mod-macros-list');
                $removalReasonsList.append(modMacroTemplateHTML);

                $(`.${i}-distinguish`).prop('checked', macro.distinguish);
                $(`.${i}-banuser`).prop('checked', macro.ban);
                $(`.${i}-unbanuser`).prop('checked', macro.unban);
                $(`.${i}-muteuser`).prop('checked', macro.mute);
                $(`.${i}-user-flair-picker`).val(macro.userflair);
                $(`.${i}-user-flair-text`).val(macro.userflairtext);
                $(`.${i}-removeitem`).prop('checked', macro.remove);
                $(`.${i}-spamitem`).prop('checked', macro.spam);
                $(`.${i}-approveitem`).prop('checked', macro.approve);
                $(`.${i}-lockitem`).prop('checked', macro.lockthread);
                $(`.${i}-lockreply`).prop('checked', macro.lockreply);
                $(`.${i}-sticky`).prop('checked', macro.sticky);
                $(`.${i}-archivemodmail`).prop('checked', macro.archivemodmail);
                $(`.${i}-highlightmodmail`).prop('checked', macro.highlightmodmail);

                $(`.${i}-context-post`).prop('checked', macro.contextpost === undefined ? true : macro.contextpost);
                $(`.${i}-context-comment`).prop(
                    'checked',
                    macro.contextcomment === undefined ? true : macro.contextcomment,
                );
                $(`.${i}-context-modmail`).prop(
                    'checked',
                    macro.contextmodmail === undefined ? true : macro.contextmodmail,
                );
            });
        }
    }

    // Now we have all our data and the functions in place to use it, let's use it!

    // toolbox config WIKI tab
    $body.on('click', '.tb-window-tabs .edit_toolbox_config', function () {
        const $this = $(this);
        if (!$this.hasClass('content-populated')) {
            wikiTabContent('edit_toolbox_config');
            $this.addClass('content-populated');
        }
    });

    // user note config WIKI tab
    $body.on('click', '.tb-window-tabs .edit_user_notes', function () {
        const $this = $(this);
        if (!$this.hasClass('content-populated')) {
            wikiTabContent('edit_user_notes');
            $this.addClass('content-populated');
        }
    });

    // user note config WIKI tab
    $body.on('click', '.tb-window-tabs .edit_automoderator_config', function () {
        const $this = $(this);
        if (!$this.hasClass('content-populated')) {
            wikiTabContent('edit_automoderator_config');
            $this.addClass('content-populated');
        }
    });

    // Wiki tab save button is clicked.
    $body.on('click', '.save-wiki-data', function () {
        const $this = $(this);
        const tabname = $this.attr('data-tabname');
        let page;
        let actualPage;

        switch (tabname) {
            case 'edit_toolbox_config':
                page = 'toolbox';
                actualPage = 'toolbox';
                $body.addClass('toolbox-wiki-edited');
                break;
            case 'edit_user_notes':
                page = 'usernotes';
                actualPage = 'usernotes';
                break;
            case 'edit_automoderator_config':
                page = 'automoderator';
                actualPage = 'config/automoderator';
                break;
        }

        const $wikiContentArea = $body.find(`.tb-window-tab.${tabname}`);
        const textArea = $wikiContentArea.find('.edit-wikidata');
        const editNote = $wikiContentArea.find('input[name=edit-wikidata-note]').val()
            || `updated ${page} configuration`;
        const updateAM = page === 'automoderator';

        let text = $(textArea).val();

        // efficiently save json instead of pretty.
        if (!updateAM) {
            try {
                text = JSON.parse(text);
            } catch (e) {
                log.debug(`Error saving JSON page ${e.toString()}`);
                TBui.textFeedback(`Page not saved, JSON is not correct.<br> ${e.toString()}`, TBui.FEEDBACK_NEGATIVE);
                return;
            }

            text = JSON.stringify(text);
        }
        // save the data, and blank the text area.
        // also, yes some of the pages are in JSON, but they aren't JSON objects,
        // so they don't need to be re-strinified.
        postToWiki(actualPage, text, editNote, false, updateAM);
    });

    // toolbox config FORM tab save
    $body.on('click', '.save-removal-settings', () => {
        config.removalReasons = {
            pmsubject: $('.pmsubject').val(),
            logreason: $('.logreason').val(),
            header: escape($('.edit-header').val()),
            footer: escape($('.edit-footer').val()),
            removalOption: $('#removal-option').val(),
            typeReply: $('input[name="type-reply"]:checked').val(),
            typeStickied: $('#type-stickied').prop('checked'),
            typeCommentAsSubreddit: $('#type-comment-as-subreddit').prop('checked'),
            typeLockComment: $('#type-action-lock-comment').prop('checked'),
            typeAsSub: $('#type-as-sub').prop('checked'),
            autoArchive: $('#type-auto-archive').prop('checked'),
            typeLockThread: $('#type-action-lock-thread').prop('checked'),
            logsub: $('.logsub').val(),
            logtitle: $('.logtitle').val(),
            bantitle: $('.bantitle').val(),
            getfrom: $('.getfrom').val(),
            reasons: config.removalReasons.reasons || [],
        };

        postToWiki('toolbox', config, 'updated removal reason settings', true);
        // Let people know that settings are saved.
        TBui.textFeedback('Removal reasons settings are saved', TBui.FEEDBACK_POSITIVE);
    });

    // Usernote types tab
    $body.on('click', '.tb-window-tabs .edit_user_note_types', function () {
        const $this = $(this);
        if (!$this.hasClass('content-populated')) {
            // determine if we want to pull a new config, we only do this if the toolbox config wiki has been edited.
            if ($body.hasClass('toolbox-wiki-edited')) {
                TBApi.readFromWiki(subreddit, 'toolbox', true).then(resp => {
                    if (!resp || resp === TBApi.WIKI_PAGE_UNKNOWN || resp === TBApi.NO_WIKI_PAGE) {
                        log.debug('Failed: wiki config');
                        return;
                    }

                    config = resp;
                    purifyObject(config);
                    populateUsernoteTypes();
                });
            } else {
                populateUsernoteTypes();
            }

            $this.addClass('content-populated');
        }
    });

    $body.on('click', '#add-usernote-type', () => {
        appendUsernoteType('', '', 'ALICEBLUE');
    });

    $body.on('keyup', '#tb-config-usernote-type-list .name', function () {
        const $this = $(this);
        const name = $this.val();
        const $key = $this.parents('.usernote-type').find('.key');
        const keyEdited = $key.data('edited');
        if (!keyEdited && name) {
            $key.val(name.toLowerCase().replace(/ /g, '_').replace(/[^\w-]/g, '').replace(/([-_])\1+/g, '$1'));
        }
    });

    $body.on('keyup', '#tb-config-usernote-type-list .key', function () {
        const $this = $(this);
        const edited = $this.data('edited');
        if (!edited) {
            $this.attr('data-edited', true);
        }
    });

    $body.on('click', '.remove-usernote-type', function () {
        $(this).closest('tr').remove();
    });

    $body.on('click', '.up-usernote-type', function () {
        const $row = $(this).closest('tr');
        const $prev = $row.prev();

        if ($prev && $prev.length > 0) {
            $row.fadeOut(100, () => {
                $row.detach();
                $row.insertBefore($prev);
                $row.fadeIn(300);
            });
        }
    });

    $body.on('click', '.down-usernote-type', function () {
        const $row = $(this).closest('tr');
        const $next = $row.next();

        if ($next && $next.length > 0) {
            $row.fadeOut(100, () => {
                $row.detach();
                $row.insertAfter($next);
                $row.fadeIn(300);
            });
        }
    });

    $body.on('click', '#save-usernote-types', () => {
        log.debug('Saving usernote types');

        const $rows = $('#tb-config-usernote-type-list').find('.usernote-type');
        log.debug(`  Num types: ${$rows.length}`);
        $rows.find('input').removeClass('error');
        $rows.find('.usernote-error').text('');

        // Validate
        log.debug('  Validating type settings');
        let error = false;
        const seenKeys = [];
        $rows.each(function () {
            const $row = $(this);
            const $error = $row.find('.usernote-error');
            const $key = $row.find('.key');
            const key = $key.val();
            const $text = $row.find('.name');
            const text = $text.val();

            // Empty fields
            if (!text || !key) {
                if (!text) {
                    $text.addClass('error');
                }
                if (!key) {
                    $key.addClass('error');
                }
                $error.text('Cannot have empty fields.');
                error = true;
            }

            // Invalid key characters
            if (!key || !key.match(/^[\w-]+$/)) {
                $key.addClass('error');
                $error.text('Keys can only contain a-z, 0-9, -, and _.');
                error = true;
            }

            // Duplicate keys
            if (seenKeys.indexOf(key) > -1) {
                $key.addClass('error');
                $error.text('Keys must be unique.');
                error = true;
            } else {
                seenKeys.push(key);
            }
        });
        if (error) {
            log.debug('  Failed validation');
            return;
        }

        // Update config
        config.usernoteColors = [];
        $rows.each(function () {
            const $row = $(this);
            const key = $row.find('.key').val();
            const text = $row.find('.name').val();
            const color = $row.find('.color').val();
            log.debug(`  key=${key}, text="${text}", color=${color}`);

            config.usernoteColors.push({
                key,
                text,
                color,
            });
        });

        // Save config
        postToWiki('toolbox', config, 'Updated user note types', true);
        TBui.textFeedback('User note types saved', TBui.FEEDBACK_POSITIVE);
    });

    // Removal reasons tab
    $body.on('click', '.tb-window-tabs .edit_removal_reasons', function () {
        const $this = $(this);
        if (!$this.hasClass('content-populated')) {
            // determine if we want to pull a new config, we only do this if the toolbox config wiki has been edited.
            if ($body.hasClass('toolbox-wiki-edited')) {
                TBApi.readFromWiki(subreddit, 'toolbox', true).then(resp => {
                    if (!resp || resp === TBApi.WIKI_PAGE_UNKNOWN || resp === TBApi.NO_WIKI_PAGE) {
                        log.debug('Failed: wiki config');
                        return;
                    }

                    config = resp;
                    purifyObject(config);
                    removalReasonsContent();
                });
            } else {
                removalReasonsContent();
            }

            $this.addClass('content-populated');
        }
    });

    // Removal reasons interaction and related functions.

    // Showing the edit form for a removal reason
    $body.on('click', '.removal-reasons-buttons .edit', function () {
        const $this = $(this);

        $this.closest('tr.removal-reason').find('.removal-reason-label').hide();
        $this.closest('tr.removal-reason').find('.removal-reason-edit').show();

        // Getting the flair dropdown
        const $flairDropdown = $this.closest('.removal-reason').find('#flair-id-select');

        const reasonNum = $this.attr('data-reason');

        addFlairTemplatesToDropdown($flairDropdown, reasonNum);
    });

    // cancel
    $body.on('click', '.removal-reason-edit .cancel-edit-reason', function () {
        const $this = $(this);
        const $removalContent = $this.closest('td.removal-reasons-content');
        const reasonsNum = $removalContent.attr('data-reason');

        $removalContent.find('.edit-area').val(
            unescape(config.removalReasons.reasons[reasonsNum].text)
                || '<span style="color: #cecece">(no macro)</span>',
        );
        $removalContent.find('input[name=removal-title]').val(config.removalReasons.reasons[reasonsNum].title || '');
        $removalContent.find('input[name=remove-posts]').val(
            config.removalReasons.reasons[reasonsNum].removePosts || undefined,
        );
        $removalContent.find('input[name=remove-comments]').val(
            config.removalReasons.reasons[reasonsNum].removeComments || undefined,
        );
        $removalContent.find('input[name=flair-text]').val(config.removalReasons.reasons[reasonsNum].flairText || '');
        $removalContent.find('input[name=flair-css]').val(config.removalReasons.reasons[reasonsNum].flairCSS || '');
        $removalContent.find('input[name=edit-note]').val('');

        $removalContent.find('.removal-reason-label').show();
        $removalContent.find('.removal-reason-edit').hide();
    });

    // save
    $body.on('click', '.removal-reason-edit .save-edit-reason', function () {
        const $this = $(this);
        const $removalContent = $this.closest('td.removal-reasons-content');
        const reasonsNum = $removalContent.attr('data-reason');
        const reasonText = $removalContent.find('.edit-area').val();
        const reasonTitle = $removalContent.find('input[name=removal-title]').val();
        const reasonRemovePosts = $removalContent.find('input[name=remove-posts]').is(':checked');
        const reasonRemoveComments = $removalContent.find('input[name=remove-comments]').is(':checked');
        const reasonFlairText = $removalContent.find('input[name=flair-text]').val();
        const reasonFlairCSS = $removalContent.find('input[name=flair-css]').val();
        const reasonFlairTemplateID = $removalContent.find('select[name=flair-id]').val();
        let editNote = $removalContent.find('input[name=edit-note]').val();

        if (!editNote) {
            // default note
            editNote = 'update';
        }
        editNote += `, reason #${reasonsNum + 1}`;

        config.removalReasons.reasons[reasonsNum].text = escape(reasonText);
        config.removalReasons.reasons[reasonsNum].flairText = reasonFlairText;
        config.removalReasons.reasons[reasonsNum].flairCSS = reasonFlairCSS;
        config.removalReasons.reasons[reasonsNum].removePosts = reasonRemovePosts;
        config.removalReasons.reasons[reasonsNum].removeComments = reasonRemoveComments;
        config.removalReasons.reasons[reasonsNum].title = reasonTitle;
        config.removalReasons.reasons[reasonsNum].flairTemplateID = reasonFlairTemplateID;

        postToWiki('toolbox', config, editNote, true);

        let label = unescape(reasonText);
        if (label === '') {
            label = '<span style="color: #cecece">(no reason)</span>';
        } else {
            if (label.length > 200) {
                label = `${label.substring(0, 197)}...`;
            }
            label = TBHelpers.htmlEncode(label);
        }

        const $removalReasonLabel = $removalContent.find('.removal-reason-label');
        $removalReasonLabel.html(
            purify(
                `<span><h3 class="removal-title">${TBHelpers.htmlEncode(reasonTitle)}</h3>${label}</span>`,
            ),
        );

        $removalReasonLabel.show();
        $removalContent.find('.removal-reason-edit').hide();
    });

    // deleting a reason
    $body.on('click', '.removal-reasons-buttons .delete', function () {
        const $this = $(this);

        const confirmDelete = confirm('This will delete this removal reason, are you sure?');
        if (confirmDelete) {
            const reasonsNum = $this.attr('data-reason');

            if (reasonsNum) {
                config.removalReasons.reasons.splice(reasonsNum, 1);
                // config.removalReasons.reasons[reasonsNum].remove();
            } else {
                return;
            }
            postToWiki('toolbox', config, `delete reason #${reasonsNum + 1}`, true);
            const $removalReasonList = $this.closest('#tb-removal-reasons-list');

            // Remove reason from DOM
            $this.closest('.removal-reason').remove();

            // Renumber remaining reasons.
            let reasonKey = 0;
            $removalReasonList.find('tr.removal-reason').each(function () {
                const $this = $(this);

                const currentKey = $this.attr('data-reason');
                const subreddit = $this.attr('subreddit');
                $this.find(`[data-reason="${currentKey}"]`).attr('data-reason', reasonKey);
                $this.attr('data-reason', reasonKey);
                $this.find('.removal-reason-label').attr('data-for', `reason-${subreddit}-${reasonKey}`);

                reasonKey++;
            });
        }
    });

    // Adding a new reason
    $body.on('click', '#tb-add-removal-reason', function () {
        $(this).hide();

        const $addRemovalReasonForm = $('#tb-add-removal-reason-form');

        $addRemovalReasonForm.show();

        const $flairDropdown = $addRemovalReasonForm.find('select#flair-id-select');

        addFlairTemplatesToDropdown($flairDropdown);
    });

    // Watching for changes in the flair template dropdown and assigning the flair text and class
    $body.on('change', '#flair-id-select', function () {
        const $this = $(this);
        const selectedFlairID = $this.val();

        const $flairText = $this.parents('.tb-removal-reason-field').find('input.tb-input[name="flair-text"]');
        const $flairCSS = $this.parents('.tb-removal-reason-field').find('input.tb-input[name="flair-css"]');

        const flairTemplate = postFlairTemplates.find(flair => flair.id === selectedFlairID);

        $flairText.val(flairTemplate.text);
        $flairCSS.val(flairTemplate.css_class);
    });

    // Watching for changes in the flair template dropdown and assigning the flair text and class
    $body.on('change', '#userflair-id-select', function () {
        const $this = $(this);
        const selectedFlairID = $this.val();

        const $flairText = $this.parents('.tb-macro-actions').find('input.tb-input[name="user-flair-text"]');

        const flairTemplate = userFlairTemplates.find(flair => flair.id === selectedFlairID);

        $flairText.val(flairTemplate?.text ?? '');
    });

    const resetForm = () => {
        $body.find('#tb-add-removal-reason').show();
        $body.find('#tb-add-removal-reason-form').hide();
        $body.find('#tb-add-removal-reason-form .edit-area').val('');
        $body.find('#tb-add-removal-reason-form input[name=removal-title]').val('');
        $body.find('#tb-add-removal-reason-form input[name=remove-posts]').prop('checked', true);
        $body.find('#tb-add-removal-reason-form input[name=remove-comments]').prop('checked', false);
        $body.find('#tb-add-removal-reason-form input[name=flair-text]').val('');
        $body.find('#tb-add-removal-reason-form input[name=flair-css]').val('');
        $body.find('#tb-add-removal-reason-form input[name=edit-note]').val('');
    };

    // Save new reason
    $body.on('click', '#tb-add-removal-reason-form .save-new-reason', () => {
        const reasonText = $body.find('#tb-add-removal-reason-form .edit-area').val();
        const reasonTitle = $body.find('#tb-add-removal-reason-form input[name=removal-title]').val();
        const reasonRemovePosts = $body.find('#tb-add-removal-reason-form input[name=remove-posts]').is(':checked');
        const reasonRemoveComments = $body.find('#tb-add-removal-reason-form input[name=remove-comments]').is(
            ':checked',
        );
        const reasonFlairText = $body.find('#tb-add-removal-reason-form input[name=flair-text]').val();
        const reasonFlairCSS = $body.find('#tb-add-removal-reason-form input[name=flair-css]').val();
        const reasonFlairTemplateID = $body.find('#tb-add-removal-reason-form select#flair-id-select').val();
        let editNote = $body.find('#tb-add-removal-reason-form input[name=edit-note]').val();

        editNote = `create new reason${editNote ? `, ${editNote}` : ''}`;

        const reason = {
            text: escape(reasonText),
        };

        reason.flairTemplateID = reasonFlairTemplateID;
        reason.flairText = reasonFlairText;
        reason.flairCSS = reasonFlairCSS;
        reason.removePosts = reasonRemovePosts;
        reason.removeComments = reasonRemoveComments;
        reason.title = reasonTitle;

        if (!config.removalReasons) {
            config.removalReasons = {
                reasons: [],
            };
        } else if (config.removalReasons.reasons === undefined) {
            config.removalReasons.reasons = [];
        }

        config.removalReasons.reasons.push(reason);

        postToWiki('toolbox', config, editNote, true);

        // And finally we repopulate the reasons list and hide the current form.
        $body.find('#tb-removal-reasons-list').html('');
        removalReasonsContent();
        resetForm();
    });

    // cancel
    $body.on('click', '#tb-add-removal-reason-form .cancel-new-reason', resetForm);

    // Removal reasons sorting tab
    $body.on('click', '.tb-window-tabs .sort_removal_reasons', function () {
        const $this = $(this);
        $body.find('#tb-removal-sort-list').empty();
        // determine if we want to pull a new config, we only do this if the toolbox config wiki has been edited.
        if ($body.hasClass('toolbox-wiki-edited')) {
            TBApi.readFromWiki(subreddit, 'toolbox', true).then(resp => {
                if (!resp || resp === TBApi.WIKI_PAGE_UNKNOWN || resp === TBApi.NO_WIKI_PAGE) {
                    log.debug('Failed: wiki config');
                    return;
                }

                config = resp;
                purifyObject(config);
                removalReasonsEditContent();
            });
        } else {
            removalReasonsEditContent();
        }

        $this.addClass('content-populated');
    });

    $body.on('click', '.tb-sort-up', function () {
        const $row = $(this).closest('tr');
        const $prev = $row.prev();

        if ($prev && $prev.length > 0) {
            // Get the keys for the reasons that will be moved.
            const upReasonKey = $row.attr('data-reason');
            const downReasonKey = $prev.attr('data-reason');

            // Move them in the array.
            sortReasons = TBHelpers.moveArrayItem(sortReasons, parseInt(upReasonKey), parseInt(downReasonKey));

            // Now move the elements on page.
            $row.attr('data-reason', downReasonKey);
            $prev.attr('data-reason', upReasonKey);
            $row.fadeOut(100, () => {
                $row.detach();
                $row.insertBefore($prev);
                $row.fadeIn(300);
            });
        }
    });

    $body.on('click', '.tb-sort-down ', function () {
        const $row = $(this).closest('tr');
        const $next = $row.next();

        if ($next && $next.length > 0) {
            // Get the keys for the reasons that will be moved.
            const upReasonKey = $next.attr('data-reason');
            const downReasonKey = $row.attr('data-reason');

            // Move them in the array.
            sortReasons = TBHelpers.moveArrayItem(sortReasons, parseInt(downReasonKey), parseInt(upReasonKey));

            // Now move the elements on page.
            $row.attr('data-reason', upReasonKey);
            $next.attr('data-reason', downReasonKey);
            $row.fadeOut(100, () => {
                $row.detach();
                $row.insertAfter($next);
                $row.fadeIn(300);
            });
        }
    });

    // Save the new order of removal reasons.
    $body.on('click', '.save-removal-sorting', () => {
        // Overwrite the removal reasons
        config.removalReasons.reasons = JSON.parse(JSON.stringify(sortReasons));
        const editNote = 'Sorting removal reasons from toolbox config.';
        postToWiki('toolbox', config, editNote, true);

        // For now we just remove all contents of the edit tab.
        // TODO: Think of a nicer method that allows the contents of that tab to be restored when the order is changed.
        // The tricky part with that is that we only want to do that when the new order is saved, not before that happens.
        $body.find('#tb-removal-reasons-list').empty();
        $body.find('.tb-window-tabs .edit_removal_reasons').removeClass('content-populated');
    });

    // Mod macros tab is clicked.
    $body.on('click', '.tb-window-tabs .edit_mod_macros', function () {
        const $this = $(this);
        if (!$this.hasClass('content-populated')) {
            // determine if we want to pull a new config, we only do this if the toolbox config wiki has been edited.
            if ($body.hasClass('toolbox-wiki-edited')) {
                TBApi.readFromWiki(subreddit, 'toolbox', true).then(resp => {
                    if (!resp || resp === TBApi.WIKI_PAGE_UNKNOWN || resp === TBApi.NO_WIKI_PAGE) {
                        log.debug('Failed: wiki config');
                        return;
                    }

                    config = resp;
                    purifyObject(config);
                    modMacrosContent();
                });
            } else {
                modMacrosContent();
            }
            $this.addClass('content-populated');
        }
    });

    // mod macros interaction and related functions

    // editing of reasons
    $body.on('click', '.mod-macros-buttons .edit', function () {
        const $this = $(this);

        $this.closest('tr.mod-macro').find('.mod-macro-label').hide();

        // Getting the flair dropdown
        const macroNum = $this.attr('data-macro');
        const $flairDropdown = $this.closest('.mod-macro').find('#userflair-id-select');

        addUserFlairTemplatesToDropdown($flairDropdown, macroNum);

        $this.closest('tr.mod-macro').find('.mod-macro-edit').show();
    });

    // cancel
    $body.on('click', '.mod-macro-edit .cancel-edit-macro', function () {
        const $this = $(this);
        const $macroContent = $this.closest('td.mod-macros-content');
        const macroNum = $macroContent.attr('data-macro');
        const macro = config.modMacros[macroNum];

        $macroContent.find('.edit-area').val(unescape(macro.text) || '<span style="color: #cecece">(no macro)</span>');
        $macroContent.find('input[name=macro-title]').val(macro.title || '');
        $macroContent.find('#distinguish').prop('checked', macro.distinguish);
        $macroContent.find('#banuser').prop('checked', macro.ban);
        $macroContent.find('#unbanuser').prop('checked', macro.unban);
        $macroContent.find('#muteuser').prop('checked', macro.mute);
        $macroContent.find('#userflair-id-select').val(macro.userflair);
        $macroContent.find('#userflair-text').val(macro.userflairtext);
        $macroContent.find('#removeitem').prop('checked', macro.remove);
        $macroContent.find('#approveitem').prop('checked', macro.approve);
        // saved as lockthread for legacy reasons
        $macroContent.find('#lockitem').prop('checked', macro.lockthread);
        $macroContent.find('#lockreply').prop('checked', macro.lockreply);
        $macroContent.find('#sticky').prop('checked', macro.sticky);
        $macroContent.find('#archivemodmail').prop('checked', macro.archivemodmail);
        $macroContent.find('#highlightmodmail').prop('checked', macro.highlightmodmail);
        $macroContent.find('input[name=edit-note]').val('');

        $macroContent.find('.mod-macro-label').show();
        $macroContent.find('.mod-macro-edit').hide();
    });

    // save
    $body.on('click', '.mod-macro-edit .save-edit-macro', function () {
        const $this = $(this);
        const $macroContent = $this.closest('td.mod-macros-content');
        const macroNum = $macroContent.attr('data-macro');
        const macroText = $macroContent.find('.edit-area').val();
        const macroTitle = $macroContent.find('input[name=macro-title]').val();
        const distinguish = $macroContent.find('#distinguish').prop('checked');
        const banuser = $macroContent.find('#banuser').prop('checked');
        const unbanuser = $macroContent.find('#unbanuser').prop('checked');
        const muteuser = $macroContent.find('#muteuser').prop('checked');
        const flairuser = $macroContent.find('#userflair-id-select').val();
        const flairusertext = $macroContent.find('#userflair-text').val();
        const removeitem = $macroContent.find('#removeitem').prop('checked');
        const approveitem = $macroContent.find('#approveitem').prop('checked');
        const lockitem = $macroContent.find('#lockitem').prop('checked');
        const lockreply = $macroContent.find('#lockreply').prop('checked');
        const sticky = $macroContent.find('#sticky').prop('checked');
        const archivemodmail = $macroContent.find('#archivemodmail').prop('checked');
        const highlightmodmail = $macroContent.find('#highlightmodmail').prop('checked');
        const contextpost = $macroContent.find('#context-post').prop('checked');
        const contextcomment = $macroContent.find('#context-comment').prop('checked');
        const contextmodmail = $macroContent.find('#context-modmail').prop('checked');
        const macro = config.modMacros[macroNum];
        let editNote = $macroContent.find('input[name=edit-note]').val();

        if (macroTitle.length < 1) {
            TBui.textFeedback('Macro title is required', TBui.FEEDBACK_NEGATIVE);
            return;
        }

        if (!editNote) {
            // default note
            editNote = 'update';
        }
        editNote += `, macro #${macroNum + 1}`;

        macro.text = escape(macroText);
        macro.title = macroTitle;
        macro.distinguish = distinguish;
        macro.ban = banuser;
        macro.unban = unbanuser;
        macro.mute = muteuser;
        macro.userflair = flairuser;
        macro.userflairtext = flairusertext;
        macro.remove = removeitem;
        macro.approve = approveitem;
        // saved as lockthread for legacy reasons
        macro.lockthread = lockitem;
        macro.lockreply = lockreply;
        macro.sticky = sticky;
        macro.archivemodmail = archivemodmail;
        macro.highlightmodmail = highlightmodmail;
        macro.contextpost = contextpost;
        macro.contextcomment = contextcomment;
        macro.contextmodmail = contextmodmail;

        postToWiki('toolbox', config, editNote, true);

        let label = unescape(macroText);

        if (label === '') {
            label = '<span style="color: #cecece">(no macro)</span>';
        } else {
            if (label.length > 200) {
                label = `${label.substring(0, 197)}...`;
            }
            label = TBHelpers.htmlEncode(label);
        }

        const $modMacroLabel = $macroContent.find('.mod-macro-label');
        $modMacroLabel.html(purify(`<span><h3 class="macro-title">${macroTitle}</h3>${label}</span>`));

        $modMacroLabel.show();
        $macroContent.find('.mod-macro-edit').hide();
    });

    // deleting a macro
    $body.on('click', '.mod-macros-buttons .delete', function () {
        const $this = $(this);

        const confirmDelete = confirm('This will delete this mod macro, are you sure?');
        if (confirmDelete) {
            const macroNum = $this.attr('data-macro');

            if (macroNum) {
                config.modMacros.splice(macroNum, 1);
            } else {
                return;
            }
            postToWiki('toolbox', config, `delete macro #${macroNum + 1}`, true);

            const $macroList = $this.closest('#tb-mod-macros-list');

            // Remove macro from DOM
            $this.closest('.mod-macro').remove();

            // Renumber remaining macros.
            let macroKey = 0;
            $macroList.find('tr.mod-macro').each(function () {
                const $this = $(this);

                const currentKey = $this.attr('data-macro');
                const subreddit = $this.attr('subreddit');
                $this.find(`[data-macro="${currentKey}"]`).attr('data-macro', macroKey);
                $this.attr('data-macro', macroKey);
                $this.find('.mod-macro-label').attr('data-for', `macro-${subreddit}-${macroKey}`);

                macroKey++;
            });
        }
    });

    // Adding a new macro
    $body.on('click', '#tb-add-mod-macro', function () {
        const $this = $(this);

        $this.hide();

        // Getting the flair dropdown
        const $addMacroForm = $('#tb-add-mod-macro-form');
        const $flairDropdown = $addMacroForm.find('select#userflair-id-select');

        addUserFlairTemplatesToDropdown($flairDropdown);

        $body.find('#tb-add-mod-macro-form').show();
    });

    // Save new macro
    $body.on('click', '#tb-add-mod-macro-form .save-new-macro', () => {
        const macroText = $body.find('#tb-add-mod-macro-form .edit-area').val();
        const macroTitle = $body.find('#tb-add-mod-macro-form input[name=macro-title]').val();
        const distinguish = $body.find('#distinguish').prop('checked');
        const banuser = $body.find('#banuser').prop('checked');
        const unbanuser = $body.find('#unbanuser').prop('checked');
        const muteuser = $body.find('#muteuser').prop('checked');
        const flairuser = $body.find('#userflair-id-select').val();
        const flairusertext = $body.find('#userflair-text').val();
        const removeitem = $body.find('#removeitem').prop('checked');
        const approveitem = $body.find('#approveitem').prop('checked');
        const spamitem = $body.find('#spamitem').prop('checked');
        const lockitem = $body.find('#lockitem').prop('checked');
        const lockreply = $body.find('#lockreply').prop('checked');
        const sticky = $body.find('#sticky').prop('checked');
        const archivemodmail = $body.find('#archivemodmail').prop('checked');
        const highlightmodmail = $body.find('#highlightmodmail').prop('checked');
        const contextpost = $body.find('#context-post').prop('checked');
        const contextcomment = $body.find('#context-comment').prop('checked');
        const contextmodmail = $body.find('#context-modmail').prop('checked');
        let editNote = $body.find('#tb-add-mod-macro-form input[name=edit-note]').val();

        if (macroTitle.length < 1) {
            TBui.textFeedback('Macro title is required', TBui.FEEDBACK_NEGATIVE);
            return;
        }

        editNote = `create new macro ${editNote ? `, ${editNote}` : ''}`;

        const macro = {
            text: escape(macroText),
        };

        macro.title = macroTitle;
        macro.distinguish = distinguish;
        macro.ban = banuser;
        macro.unban = unbanuser;
        macro.mute = muteuser;
        macro.userflair = flairuser;
        macro.userflairtext = flairusertext;
        macro.remove = removeitem;
        macro.approve = approveitem;
        macro.spam = spamitem;
        // saved as lockthread for legacy reasons
        macro.lockthread = lockitem;
        macro.lockreply = lockreply;
        macro.sticky = sticky;
        macro.archivemodmail = archivemodmail;
        macro.highlightmodmail = highlightmodmail;
        macro.contextpost = contextpost;
        macro.contextcomment = contextcomment;
        macro.contextmodmail = contextmodmail;

        if (!config.modMacros) {
            config.modMacros = [];
        }

        config.modMacros.push(macro);

        postToWiki('toolbox', config, editNote, true);

        // And finally we repopulate the macro list and hide the current form.
        $body.find('#tb-mod-macros-list').html('');
        modMacrosContent();
        $body.find('#tb-add-mod-macro').show();
        $body.find('#tb-add-mod-macro-form').hide();
        $body.find('#tb-add-mod-macro-form .edit-area').val('');
        $body.find('#tb-add-mod-macro-form input[name=macro-title]').val('');
        $body.find('#tb-add-mod-macro-form input[name=edit-note]').val('');
        $body.find('#distinguish').prop('checked', false);
        $body.find('#banuser').prop('checked', false);
        $body.find('#unbanuser').prop('checked', false);
        $body.find('#muteuser').prop('checked', false);
        $body.find('#userflair-id-select').val('');
        $body.find('#userflair-text').val('');
        $body.find('#removeitem').prop('checked', false);
        $body.find('#approveitem').prop('checked', false);
        $body.find('#spamitem').prop('checked', false);
        $body.find('#lockitem').prop('checked', false);
        $body.find('#lockreply').prop('checked', false);
        $body.find('#sticky').prop('checked', false);
        $body.find('#archivemodmail').prop('checked', false);
        $body.find('#highlightmodmail').prop('checked', false);
        $body.find('#context-post').prop('checked', false);
        $body.find('#context-comment').prop('checked', false);
        $body.find('#context-modmail').prop('checked', false);
    });

    // cancel
    $body.on('click', '#tb-add-mod-macro-form .cancel-new-macro', () => {
        $body.find('#tb-add-mod-macro').show();
        $body.find('#tb-add-mod-macro-form').hide();
        $body.find('#tb-add-mod-macro-form .edit-area').val('');
        $body.find('#tb-add-mod-macro-form input[name=macro-title]').val('');
        $body.find('#tb-add-mod-macro-form input[name=edit-note]').val('');
        $body.find('#distinguish').prop('checked', false);
        $body.find('#banuser').prop('checked', false);
        $body.find('#unbanuser').prop('checked', false);
        $body.find('#muteuser').prop('checked', false);
        $body.find('#userflair-id-select').val('');
        $body.find('#userflair-text').val('');
        $body.find('#removeitem').prop('checked', false);
        $body.find('#approveitem').prop('checked', false);
        $body.find('#lockitem').prop('checked', false);
        $body.find('#lockreply').prop('checked', false);
        $body.find('#sticky').prop('checked', false);
        $body.find('#archivemodmail').prop('checked', false);
        $body.find('#highlightmodmail').prop('checked', false);
    });

    // When the import button is clicked on the domain tags thing.
    $body.on('click', '.domain_tags .import', async () => {
        const json = await TBApi.getJSON(`/r/${$body.find('.domain_tags .importfrom').val()}/wiki/toolbox.json`);
        purifyObject(json);
        if (json.data.content_md) {
            const tags = JSON.parse(json.data.content_md).domainTags;
            if (tags) {
                config.domainTags = tags;
                postToWiki('toolbox', config, '.import click', true);
            }
        }
    });

    $body.on('click', '.save-ban-macro', () => {
        config.banMacros = {
            banNote: $('.banNote').val(),
            banMessage: $('.banMessage').val(),
        };

        postToWiki('toolbox', config, 'updated ban macro', true);
        // Let people know that settings are saved.
        TBui.textFeedback('Ban macro is saved.', TBui.FEEDBACK_POSITIVE);
    });
});
