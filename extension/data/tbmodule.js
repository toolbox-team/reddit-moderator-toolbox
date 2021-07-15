import TBLog from './tblog.js';
import * as TBStorage from './tbstorage.js';
import * as TBui from './tbui.js';
import * as TBHelpers from './tbhelpers.js';
import TBListener from './tblistener.js';
import * as TBCore from './tbcore.js';
import * as TBConstants from './tbconstants.js';

const logger = TBLog('TBModule');

const TBModule = {
    modules: {},

    /** @deprecated */
    get moduleList () {
        return Object.values(TBModule.modules).map(mod => mod.shortname);
    },

    register_module (module) {
        // TODO: compatibility; remove when we stop using `shortname`
        module.shortname = module.id;

        TBModule.modules[module.shortname] = module;
    },

    init: function tbInit () {
        setTimeout(() => {
            logger.debug('TBModule has TBStorage, loading modules');
            // call every module's init() method on page load
            for (let i = 0; i < TBModule.moduleList.length; i++) {
                const module = TBModule.modules[TBModule.moduleList[i]];

                // Don't do anything with beta modules unless beta mode is enabled
                if (!TBStorage.getSetting('Utils', 'betaMode', false) && module.beta) {
                    // skip this module entirely
                    logger.debug(`Beta  mode not enabled. Skipping ${module.name} module`);
                    continue;
                }

                // Don't do anything with dev modules unless debug mode is enabled
                if (!TBStorage.getSetting('Utils', 'debugMode', false) && module.debugMode) {
                    // skip this module entirely
                    logger.debug(`Debug mode not enabled. Skipping ${module.name} module`);
                    continue;
                }

                // FIXME: implement environment switches in modules
                if (!TBCore.isOldReddit && module.oldReddit) {
                    logger.debug(`Module not suitable for new reddit. Skipping ${module.name} module`);
                    continue;
                }

                // lock 'n load
                module.getEnabled().then(enabled => {
                    if (!enabled) {
                        return;
                    }
                    logger.debug(`Loading ${module.id} module`);
                    module.init();
                });
            }

            // Start the event listener once everything else is initialized
            TBListener.start();
        }, 50);
    },

    async showSettings () {
        const $body = $('body');
        this;

        //
        // preload some generic variables
        //
        const debugMode = TBStorage.getSetting('Utils', 'debugMode', false),
              betaMode = TBStorage.getSetting('Utils', 'betaMode', false),
              devMode = TBCore.devMode,
              advancedMode = TBStorage.getSetting('Utils', 'advancedMode', false),

              settingSub = TBStorage.getSetting('Utils', 'settingSub', ''),
              shortLength = TBStorage.getSetting('Utils', 'shortLength', 15),
              longLength = TBStorage.getSetting('Utils', 'longLength', 45),

              // last export stuff
              lastExport = await TBModule.modules['Modbar'].get('lastExport'),
              showExportReminder = await TBModule.modules['Modbar'].get('showExportReminder'),
              lastExportDays = Math.round(TBHelpers.millisecondsToDays(TBHelpers.getTime() - lastExport)),
              lastExportLabel = lastExport === 0 ? 'Never' : `${lastExportDays} days ago`;

        let lastExportState = '';

        if (lastExportDays > 30 || lastExport === 0) {
            lastExportState = 'sad';

            if (showExportReminder && settingSub !== '' && lastExport !== 0) {
                TBui.textFeedback(`Last toolbox settings backup: ${lastExportLabel}`, TBui.FEEDBACK_NEGATIVE, 3000, TBui.DISPLAY_BOTTOM);
            }
        } else if (lastExportDays < 15) {
            lastExportState = 'happy';
        }

        // Template for 'general settings'.
        const displayNone = 'display: none;';
        let coreSettingsContent = '';

        const coreSettings = [
            {
                settingName: 'settingssub',
                content: `
                        Backup/restore toolbox settings to a wiki page:<br>
                        <input type="text" class="tb-input" name="settingssub" placeholder="Fill in a private subreddit where you are mod..." value="${TBHelpers.htmlEncode(unescape(settingSub))}">
                        <input class="tb-settings-export tb-action-button" type="button" value="backup">
                        <input class="tb-settings-import tb-action-button" type="button" value="restore">
                        <b> Important:</b> This will reload the page without saving!
                        <label class="backup-warning ${lastExportState}">Last backup: <b>${lastExportLabel}</b></label>
                        `,
                display: '',
            },
            {
                settingName: 'showexportreminder',
                content: `<label><input type="checkbox" id="showExportReminder" ${showExportReminder ? 'checked' : ''}> Show reminder after 30 days of no backup.</label>`,
                display: '',
            },
            {
                settingName: 'debugmode',
                content: `<label><input type="checkbox" id="debugMode" ${debugMode ? 'checked' : ''}> Enable debug mode</label>`,
                display: advancedMode ? '' : displayNone,
            },
            {
                settingName: 'betamode',
                content: `<label><input type="checkbox" id="betaMode" ${betaMode ? 'checked' : ''}> Enable beta features</label>`,
                display: '',
            },
            {
                settingName: 'advancedmode',
                content: `<label><input type="checkbox" id="advancedMode" ${advancedMode ? 'checked' : ''}> Show advanced settings</label>`,
                display: '',
            },
            {
                settingName: 'longlength',
                content: `Cache subreddit config (removal reasons, domain tags, mod macros) time (in minutes):<br>
                        <input type="number" class="tb-input" name="longLength" value="${longLength}">`,
                display: advancedMode ? '' : displayNone,
            },
            {
                settingName: 'shortlength',
                content: `Cache subreddit user notes time (in minutes):<br>
                      <input type="number" class="tb-input" name="shortLength" value="${shortLength}">`,
                display: advancedMode ? '' : displayNone,
            },
            {
                settingName: 'clearcache',
                content: '<label><input type="checkbox" id="clearcache"> Clear cache on save. (NB: please close all other reddit tabs before clearing your cache.)</label>',
                display: '',
            },
            {
                settingName: 'showsettings',
                content: '<input type="button" id="showRawSettings" class="tb-action-button" value="Show Settings" />',
                display: '',
            },
        ];

        coreSettings.forEach(({settingName, content, display}) => {
            coreSettingsContent += `
                <p id="tb-toolbox-${settingName}" class="tb-settings-p" style="${display}">
                    ${content}&nbsp;
                    <a data-setting="${settingName}" href="javascript:;" class="tb-gen-setting-link tb-setting-link-${settingName} tb-icons">
                    ${TBConstants.icons.tbSettingLink}
                    </a>&nbsp;
                </p>
                <div style="display: none;" class="tb-setting-input tb-setting-input-${settingName}">
                    <input type="text" class="tb-input" readonly="readonly" value="[${settingName}](#?tbsettings=toolbox&setting=${settingName})"><br>
                    <input type="text" class="tb-input" readonly="readonly" value="https://www.reddit.com/#?tbsettings=toolbox&setting=${settingName}">
                </div>
                `;
        });

        $body.on('click', '.tb-gen-setting-link, .tb-module-setting-link', function () {
            const $this = $(this),
                  tbSet = $this.attr('data-setting'),
                  $inputSetting = $(`.tb-setting-input-${tbSet}`);

            if ($inputSetting.is(':visible')) {
                $this.css('opacity', '0.5');
                $inputSetting.hide();
            } else {
                $this.css('opacity', '1');
                $inputSetting.show(function () {
                    $(this).find('input:first-child').select();
                });
            }
        });

        const settingsTabs = [
            {
                title: 'Core Settings',
                tooltip: 'Edit toolbox core settings',
                help_page: 'toolbox',
                id: 'toolbox',
                content: coreSettingsContent,
            },
            {
                title: 'Toggle Modules',
                tooltip: 'Enable/disable individual modules',
                help_page: 'toggle-modules',
                content: '', // this gets propagated magically
            },
            {
                title: 'About',
                tooltip: '',
                help_page: 'about',
                id: 'about',
                content: `
                <h1 id="tb-random-about-quote">"${TBCore.RandomQuote}"</h1>
                <h3>About:</h3> <a href="${TBCore.link('/r/toolbox')}" target="_blank">/r/toolbox ${TBCore.toolboxVersionName}</a>
                    <h3> Open source </h3>
                    Toolbox is an open source software project. The source code and project can be found on <a href="https://github.com/toolbox-team" target="_blank">GitHub</a>.
                    <h3> Privacy </h3>
                    The toolbox development team highly values privacy. <br>
                    The toolbox privacy policy can be <a href="https://www.reddit.com/r/toolbox/wiki/privacy" target="_blank">found on this wiki page</a>.
                    <h3> made and maintained by: </h3>
                    <table class="tb-about-credits">
                        <tr>
                            <td><a href="https://www.reddit.com/user/creesch/">/u/creesch</a></td>
                            <td><a href="https://www.reddit.com/user/agentlame">/u/agentlame</a></td>
                            <td><a href="https://www.reddit.com/user/LowSociety">/u/LowSociety</a></td>
                        </tr><tr>
                            <td><a href="https://www.reddit.com/user/TheEnigmaBlade">/u/TheEnigmaBlade</a></td>
                            <td><a href="https://www.reddit.com/user/dakta">/u/dakta</a></td>
                            <td><a href="https://www.reddit.com/user/largenocream">/u/largenocream</a></td>
                        </tr><tr>
                            <td><a href="https://www.reddit.com/user/noeatnosleep">/u/noeatnosleep</a></td>
                            <td><a href="https://www.reddit.com/user/psdtwk">/u/psdtwk</a></td>
                            <td><a href="https://www.reddit.com/user/garethp">/u/garethp</a></td>
                        </tr><tr>
                            <td><a href="https://www.reddit.com/user/WorseThanHipster" title="Literally">/u/WorseThanHipster</a></td>
                            <td><a href="https://www.reddit.com/user/amici_ursi">/u/amici_ursi</a></td>
                            <td><a href="https://www.reddit.com/user/eritbh">/u/eritbh</a></td>
                        </tr><tr>
                            <td><a href="https://www.reddit.com/user/SpyTec13">/u/SpyTec13</a></td>
                            <td><a href="https://www.reddit.com/user/kenman">/u/kenman</a></td>
                            <td></td>
                        </tr>
                    </table>
                    <h3>Documentation by:</h3>
                    <table class="tb-about-credits">
                        <tr>
                            <td><a href="https://www.reddit.com/user/psdtwk">/u/psdtwk</a></td>
                            <td><a href="https://www.reddit.com/user/gorillagnomes">/u/gorillagnomes</a></td>
                            <td><a href="https://www.reddit.com/user/x_minus_one">/u/x_minus_one</a></td>
                        </tr><tr>
                            <td><a href="https://www.reddit.com/user/Gustavobc">/u/Gustavobc</a></td>
                            <td><a href="https://www.reddit.com/user/hermithome">/u/hermithome</a></td>
                            <td><a href="https://www.reddit.com/user/amici_ursi">/u/amici_ursi</a></td>
                        </tr>
                    </table>
                    <h3>Special thanks to:</h3>
                    <a href="https://www.reddit.com/user/andytuba">/u/andytuba</a> & <a href="https://www.reddit.com/user/erikdesjardins">/u/erikdesjardins</a>
                    <br>for all their amazing help and support of the TB team in resolving complex issues (and really simple ones)<br>
                    <h3>Credits:</h3>
                    <a href="https://www.reddit.com/user/ShaneH7646">/u/ShaneH7646 for the snoo running gif</a><br>
                    <a href="https://material.io/tools/icons/" target="_blank">Material icons</a><br>
                    <a href="${TBCore.link('/user/DEADB33F')}" target="_blank">Modtools base code by DEADB33F</a><br>
                    <a href="https://chrome.google.com/webstore/detail/reddit-mod-nuke-extension/omndholfgmbafjdodldjlekckdneggll?hl=en" target="_blank">Comment Thread Nuke Script</a> by <a href="${TBCore.link('/u/djimbob')}" target="_blank">/u/djimbob</a><br>
                    <a href="https://github.com/gamefreak/snuownd" target="_blank">snuownd.js by gamefreak</a><br>
                    <a href="https://codemirror.net/ target="_blank">CodeMirror code editor</a><br>
                    <h3>License:</h3>
                    <span>© 2013-2020 toolbox development team. </span>
                    <p class="tb-settings-p">Licensed under the Apache License, Version 2.0 (the "License");
                        <br> you may not use this file except in compliance with the License.
                        <br> You may obtain a copy of the License at </p>
                    <p class="tb-settings-p"><a href="http://www.apache.org/licenses/LICENSE-2.0">http://www.apache.org/licenses/LICENSE-2.0</a></p>
                    <p class="tb-settings-p">Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                        <br> See the License for the specific language governing permissions and limitations under the License.</p>
                    <p class="tb-settings-p" ${debugMode && !TBCore.devModeLock ? ' ' : 'style="display:none;" '}>
                        <label><input type="checkbox" id="devMode" ${devMode ? 'checked' : ''}> DEVMODE: DON'T EVER ENABLE THIS!</label>
                    </p>`,
            },
        ];

        // This was a clever idea, but for now it's easier to inject them
        // settingsTabs.push.apply(settingsTabs, this.generateSettings());

        const $settingsDialog = TBui.overlay(
            // title
            'toolbox Settings',
            // tabs
            settingsTabs,
            // extra header buttons TODO: make this generic
            `<a class="tb-help-main" href="javascript:;" currentpage="" title="Help"><i class="tb-icons">${TBConstants.icons.help}</i></a>`,
            // overlay main class
            'tb-settings tb-personal-settings', // TODO: remove tb-settings from this after port is complete
            // optional, overriding single footer
            `<input class="tb-save tb-action-button" type="button" value="save">${TBCore.devMode ? '&nbsp;<input class="tb-save-reload tb-action-button" type="button" value="save and reload">' : ''}`,
        );

        // Add ordering attributes to the existing tabs so we can insert other special tabs around them
        $settingsDialog.find('a[data-module="toolbox"]').attr('data-order', 1);
        $settingsDialog.find('a[data-module="toggle_modules"]').attr('data-order', 3);
        $settingsDialog.find('a[data-module="about"]').attr('data-order', 2);

        // This div contains the module links, separate from everything else
        const $moduleCategory = $(`
                <div class="tb-window-tabs-category">
                    <h2 class="tb-window-tabs-header">Modules</h2>
                </div>
            `);
            // TODO: this basically hardcodes where in the list the modules
            // category goes, but if we wanted it to not be hardcoded then we'd
            // have to rewrite how this window is generated, so it's good enough
        $settingsDialog.find('a[data-module="about"]').before($moduleCategory);

        $settingsDialog.on('click', '.tb-help-main', e => {
            const settingsDialog = e.delegateTarget;
            const page = $(settingsDialog).find('.tb-window-tabs a.active').data('help_page');
            window.open(`https://www.reddit.com/r/toolbox/wiki/livedocs/${page}`, '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');
        });

        $settingsDialog.on('click', '> .tb-window .buttons .close', () => {
            $settingsDialog.remove();
            // Settings can go on top of other overlays.
            if (!$('body').find('.tb-page-overlay').length) {
                $('body').css('overflow', 'auto');
            }
        });

        $settingsDialog.on('click', '.tb-save, .tb-save-reload', async e => {
            const settingsDialog = e.delegateTarget,
                  reload = $(e.target).hasClass('tb-save-reload');

            // save export sub
            let sub = $('input[name=settingssub]').val();
            if (sub) {
                // Just to be safe.
                sub = TBHelpers.cleanSubredditName(sub);

                // Save the sub, first.
                TBStorage.setSetting('Utils', 'settingSub', sub);
            }

            TBStorage.setSetting('Utils', 'debugMode', $('#debugMode').prop('checked'), false);
            TBStorage.setSetting('Utils', 'betaMode', $('#betaMode').prop('checked'), false);
            TBStorage.setSetting('Utils', 'devMode', $('#devMode').prop('checked'), false);
            TBStorage.setSetting('Utils', 'advancedMode', $('#advancedMode').prop('checked'), false);

            await TBModule.modules['Modbar'].set('showExportReminder', $('#showExportReminder').prop('checked'));

            // save cache settings.
            TBStorage.setSetting('Utils', 'longLength', parseInt($('input[name=longLength]').val()), false);

            TBStorage.setSetting('Utils', 'shortLength', parseInt($('input[name=shortLength]').val()), false);

            if ($('#clearcache').prop('checked')) {
                TBCore.clearCache();
            }

            $(settingsDialog).remove();
            // Settings can go on top of other overlays.
            if (!$('body').find('.tb-page-overlay').length) {
                $('body').css('overflow', 'auto');
            }

            TBStorage.verifiedSettingsSave(succ => {
                if (succ) {
                    TBui.textFeedback('Settings saved and verified', TBui.FEEDBACK_POSITIVE);
                    setTimeout(() => {
                        // Only reload in dev mode if we asked to.
                        if (!devMode || reload) {
                            window.location.reload();
                        }
                    }, 1000);
                } else {
                    TBui.textFeedback('Save could not be verified', TBui.FEEDBACK_NEGATIVE);
                }
            });
        });

        $settingsDialog.on('click', '.tb-settings-import, .tb-settings-export', async e => {
            let sub = $('input[name=settingssub]').val();
            if (!sub) {
                TBui.textFeedback('You have not set a subreddit to backup/restore settings', TBui.FEEDBACK_NEGATIVE);

                logger.debug('no setting sub');
                return;
            }

            // Just to be safe.
            sub = TBHelpers.cleanSubredditName(sub);

            // Save the sub, first.
            TBStorage.setSetting('Utils', 'settingSub', sub);

            if ($(e.target).hasClass('tb-settings-import')) {
                await TBCore.importSettings(sub);
                await TBModule.modules['Modbar'].set('lastExport', TBHelpers.getTime());
                TBCore.clearCache();
                TBStorage.verifiedSettingsSave(succ => {
                    if (succ) {
                        TBui.textFeedback('Settings imported and verified, reloading page', TBui.FEEDBACK_POSITIVE);
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        TBui.textFeedback('Imported settings could not be verified', TBui.FEEDBACK_NEGATIVE);
                    }
                });
            } else {
                TBui.textFeedback(`Backing up settings to /r/${sub}`, TBui.FEEDBACK_NEUTRAL);
                await TBCore.exportSettings(sub);
                await TBModule.modules['Modbar'].setting('lastExport', TBHelpers.getTime());
                TBCore.clearCache();
                window.location.reload();
            }
        });

        $settingsDialog.on('click', '#showRawSettings', () => {
            // Don't show multiple popups at once
            if ($('.tb-raw-settings').length) {
                return;
            }

            const $viewSettings = TBui.popup({
                title: 'toolbox raw setting display',
                tabs: [
                    {
                        title: '',
                        tooltip: '',
                        content: `
                                <textarea class="tb-input tb-edit-settings" rows="20" cols="60" readonly></textarea>
                            `,
                        footer: '<input class="anonymize-settings tb-action-button" type="button" value="Anonymize Settings">',
                    },
                ],
                cssClass: 'tb-raw-settings',
            }).appendTo($settingsDialog);

            const $editSettings = $('.tb-edit-settings');

            TBStorage.getSettings().then(settings => {
                $editSettings.val(JSON.stringify(settings, null, 2));
            });

            $viewSettings.on('click', '.anonymize-settings', async () => {
                const anonymizedSettings = await TBStorage.getAnonymizedSettings();
                $editSettings.val(JSON.stringify(anonymizedSettings, null, 2));
            });
        });

        $settingsDialog.on('click', '.tb-old-settings .tb-help-toggle, .toggle_modules .tb-help-toggle', function () {
            const module = $(this).attr('data-module');
            window.open(`https://www.reddit.com/r/toolbox/wiki/livedocs/${module}`, '', 'width=500,height=600,location=0,menubar=0,top=100,left=100');
        });

        // Lock 'n load
        $settingsDialog.appendTo('body').show();
        $body.css('overflow', 'hidden');

        // Sort the module list alphabetically
        TBModule.moduleList.sort((a, b) => a.localeCompare(b)).forEach(async moduleName => {
            const module = TBModule.modules[moduleName];
            // Don't do anything with beta modules unless beta mode is enabled
            if (!TBStorage.getSetting('Utils', 'betaMode', false) && module.beta) {
                return;
            }

            // Don't do anything with dev modules unless debug mode is enabled
            if (!TBStorage.getSetting('Utils', 'debugMode', false) && module.debugMode) {
                return;
            }

            //
            // build and inject our settings tab
            //

            let moduleHasSettingTab = false; // we set this to true later, if there's a visible setting
            const $tab = $(`<a href="javascript:;" class="tb-window-content-${module.id.toLowerCase()}" data-module="${module.shortname.toLowerCase()}">${module.name}</a>`),
                  $settings = $(`
                            <div class="tb-window-tab ${module.shortname.toLowerCase()}" style="display: none;">
                                <div class="tb-window-content">
                                    <div class="tb-settings"></div>
                                    <div class="tb-oldreddit-settings" style="display: none;">
                                        <h1>Settings below only affect things on old reddit</h1>
                                    </div>
                                </div>
                            </div>
                      `);

            $tab.data('module', module.id);
            $tab.data('help_page', module.shortname);

            const $body = $('body');
            const execAfterInject = [];

            // Handle module enable toggle
            if (!module.alwaysEnabled) {
                const name = module.shortname.toLowerCase();

                const $setting = $(`
                    <p id="tb-toggle_modules-${name}" class="tb-settings-p">
                        <label><input type="checkbox" id="${module.shortname}Enabled" ${await module.getEnabled() ? ' checked="checked"' : ''}>Enable ${TBHelpers.htmlEncode(module.name)}</label>
                                <a class="tb-help-toggle" href="javascript:;" data-module="${module.shortname}" title="Help">?</a>
                        <a data-setting="${name}" href="javascript:;" class="tb-module-setting-link tb-setting-link-${name}  tb-icons">
                            ${TBConstants.icons.tbSettingLink}
                        </a>&nbsp;
                        ${module.oldReddit ? '<span class="tb-oldReddit-module">Only works on old reddit</span>' : ''}
                    </p>
                    <div style="display: none;" class="tb-setting-input tb-setting-input-${name}">
                        <input type="text" class="tb-input" readonly="readonly" value="[${name}](#?tbsettings=toggle_modules&setting=${name})"><br>
                        <input type="text" class="tb-input" readonly="readonly" value="https://www.reddit.com/#?tbsettings=toggle_modules&setting=${name}">
                    </div>
                `);

                // Add the setting in its place to keep ABC order
                let added = false;
                $('.tb-settings .tb-window-tab.toggle_modules .tb-window-content p').each(function () {
                    const $this = $(this);
                    if ($this.text().localeCompare($setting.text()) > 0) {
                        $this.before($setting);
                        added = true;
                        return false;
                    }
                });
                if (!added) {
                    $('.tb-settings .tb-window-tab.toggle_modules .tb-window-content').append($setting);
                }
            }

            // Handle module settings
            for (const options of module.settings.values()) {
                const setting = options.id;
                let $setting;

                // "enabled" will eventually be special, but for now it just shows up like any other setting
                // if (setting == "enabled") {
                //     continue;
                // }

                // hide beta stuff unless beta mode enabled
                if (options.beta && !TBStorage.getSetting('Utils', 'betaMode', false)) {
                    continue;
                }

                // hide debug stuff unless debug mode enabled
                if (options.debug && !TBStorage.getSetting('Utils', 'debugMode', false)) {
                    continue;
                }

                // hide hidden settings, ofc
                // TODO: Tie to a specific setting rather than debug mode
                if (options.hidden && !TBStorage.getSetting('Utils', 'debugMode', false)) {
                    continue;
                }

                // hide advanced settings, but do it via CSS so it can be overridden.
                let displaySetting = true;
                if (options.advanced && !TBStorage.getSetting('Utils', 'advancedMode', false)) {
                    displaySetting = false;
                }

                moduleHasSettingTab = true;

                // blank slate
                $setting = $(`<p  class="tb-settings-p" ${displaySetting ? '' : 'style="display:none;"'}></p>`);
                const title = options.description;
                let noWrap = false;

                // automagical handling of input types
                switch (options.type) {
                case 'action':
                {
                    if (!options.event || !options.class) {
                        break;
                    }
                    const event = options.event;

                    $setting.append(TBui.actionButton(title, options.class));

                    $body.on('click', `.${options.class}`, () => {
                        TBCore.sendEvent(event);
                    });

                    break;
                }
                case 'boolean':
                {
                    $setting.append($('<label>').append($('<input type="checkbox" />').prop('checked', await module.get(setting))).append(` ${title}`));
                    break;
                }
                case 'number':
                {
                    $setting.append($('<label>').append($('<input type="number" class="tb-input" />').prop('min', options.min).prop('max', options.max).prop('step', options.step).val(await module.get(setting))).append(` ${title}`));
                    break;
                }
                case 'array':
                case 'JSON':
                {
                    const json = JSON.stringify(await module.get(setting), null, 0);
                    $setting.append(`${title}:<br />`);
                    $setting.append($('<textarea class="tb-input" rows="3" cols="80">').val(json)); // No matter shat I do, I can't get JSON to work with an input.
                    break;
                }
                case 'code':
                {
                    $setting.append(`${title}:<br />`);
                    $setting.append($('<textarea class="tb-input" rows="25" cols="80">').val(await module.get(setting)));
                    break;
                }
                case 'subreddit':
                case 'text':
                case 'list':
                {
                    $setting.append(`${title}:<br />`);
                    $setting.append($('<input type="text" class="tb-input" />').val(await module.get(setting)));
                    break;
                }
                case 'sublist':
                {
                    $setting.append(`${title}:<br />`);
                    $setting.append(TBui.selectMultiple.apply(TBui, [TBCore.mySubs, await module.get(setting)]));
                    break;
                }
                case 'map':
                {
                    $setting.append(`${title}:<br />`);
                    $setting.append(TBui.mapInput(options.labels, await module.get(setting)));
                    break;
                }
                case 'selector':
                {
                    const v = await module.get(setting);
                    $setting.append(`${title}:<br />`);
                    $setting.append(TBui.selectSingular.apply(TBui, [options.values, v === undefined || v === null || v === '' ? options.default : v]));
                    break;
                }
                case 'syntaxTheme':
                {
                    $setting.append(`${title}:<br/>`);
                    $setting.append(TBModule.modules.Syntax.themeSelect);
                    $setting.find('select').attr('id', `${module.shortname}_syntax_theme`);
                    $setting.append($(`
                    <textarea class="tb-input syntax-example" id="${module.shortname}_syntax_theme_css">
/* This is just some example code*/
body {
    font-family: sans-serif, "Helvetica Neue", Arial;
    font-weight: normal;
}

.md h3, .commentarea h3 {
    font-size: 1em;
}

#header {
    border-bottom: 1px solid #9A9A9A;
    box-shadow: 0px 1px 3px 1px #B3C2D1;
}
/* This is just some example code, this time to demonstrate word wrapping. If it is enabled this line will wrap to a next line as soon as it hits the box side, if it is disabled this line will just continue creating a horizontal scrollbar */\n
                    </textarea>`));
                    execAfterInject.push(async () => {
                        // Syntax highlighter selection stuff
                        $body.addClass('mod-syntax');
                        let editorSettings;
                        const enableWordWrap = TBStorage.getSetting('Syntax', 'enableWordWrap', true);
                        $(`#${module.shortname}_syntax_theme_css`).each(async (index, elem) => {
                            // Editor setup.
                            editorSettings = CodeMirror.fromTextArea(elem, {
                                mode: 'text/css',
                                autoCloseBrackets: true,
                                lineNumbers: true,
                                theme: await module.get(setting),
                                extraKeys: {
                                    'Ctrl-Alt-F': 'findPersistent',
                                    'Ctrl-Space': 'autocomplete',
                                    'F11' (cm) {
                                        cm.setOption('fullScreen', !cm.getOption('fullScreen'));
                                    },
                                    'Esc' (cm) {
                                        if (cm.getOption('fullScreen')) {
                                            cm.setOption('fullScreen', false);
                                        }
                                    },
                                },
                                lineWrapping: enableWordWrap,
                            });
                        });

                        TBCore.catchEvent(TBCore.events.TB_SYNTAX_SETTINGS, () => {
                            setTimeout(() => {
                                editorSettings.refresh();
                            }, 5);
                        });

                        $(`#${module.shortname}_syntax_theme`).val(await module.get(setting));
                        $body.on('change keydown', `#${module.shortname}_syntax_theme`, function () {
                            const thingy = $(this);
                            setTimeout(() => {
                                editorSettings.setOption('theme', thingy.val());
                            }, 0);
                        });
                    });
                    break;
                }
                case 'achievement_save':
                {
                    noWrap = true;

                    logger.debug('----------');
                    logger.debug('GENERATING ACHIEVEMENT PAGE');
                    const total = module.manager.getAchievementTotal(),
                          unlocked = module.manager.getUnlockedCount();

                    logger.debug(`  total=${total}`);
                    logger.debug(`  unlocked=${unlocked}`);

                    $setting = $('<div>').attr('class', 'achievements');
                    $setting.append($('<h1>').text('Mod Achievements'));
                    $setting.append($('<p class="tb-settings-p">').text(`${unlocked} of ${total} unlocked`));
                    $setting.append('<br />');

                    let save = await module.get(setting);
                    save = module.manager.decodeSave(save);

                    const $list = $('<div>').attr('class', 'achievements-list');
                    for (let saveIndex = 0; saveIndex < module.manager.getAchievementBlockCount(); saveIndex++) {
                        logger.debug(`  saveIndex: ${saveIndex}`);
                        for (let index = 0; index < module.manager.getAchievementCount(saveIndex); index++) {
                            logger.debug(`  index: ${index}`);
                            let aTitle = '???',
                                aDescr = '??????',
                                aClass = '';

                            if (module.manager.isUnlocked(saveIndex, index, save) || TBCore.devMode) {
                                const a = module.manager.getAchievement(saveIndex, index);
                                aTitle = a.title;
                                aDescr = a.descr;
                                aClass = 'unlocked';
                            }

                            const $a = $('<div>').attr('class', `achievement ${aClass}`);
                            $a.append($('<p>').attr('class', 'title').html(TBStorage.purify(aTitle)));
                            $a.append($('<p>').attr('class', 'description').text(aDescr));
                            $list.append($a);
                        }
                    }
                    $setting.append($list);

                    break;
                }
                default:
                {
                    // what in the world would we do here? maybe raw JSON?
                    // yes, we do raw JSON
                    const json = JSON.stringify(await module.get(setting), null, 0);
                    $setting.append(`${title}:<br />`);
                    $setting.append($('<textarea rows="1">').val(json)); // No matter shat I do, I can't get JSON to work with an input.
                    break;
                }
                }
                if (!noWrap) {
                    const moduleName = module.shortname.toLowerCase(),
                          settingName = setting.toLowerCase(),
                          linkClass = `tb-setting-link-${settingName}`,
                          inputClass = `tb-setting-input-${settingName}`,
                          redditLink = `[${setting}](#?tbsettings=${moduleName}&setting=${settingName})`,
                          internetLink = `https://www.reddit.com/#?tbsettings=${moduleName}&setting=${settingName}`;

                    $setting.append(`&nbsp;<a ${displaySetting ? '' : 'style="display:none;"'
                    } data-setting="${settingName}" href="javascript:;"" class="tb-setting-link ${linkClass} tb-icons">${TBConstants.icons.tbSettingLink}</a>` +
                            `&nbsp;<div style="display:none;" class="tb-setting-input ${inputClass}">` +
                            `<input  type="text" class="tb-input" readonly="readonly" value="${redditLink}"/><br>` +
                            `<input  type="text" class="tb-input" readonly="readonly" value="${internetLink}"/></div>`);

                    $setting = $('<span>').attr('class', 'setting-item').append($setting);
                    $setting.attr('id', `tb-${moduleName}-${settingName}`);
                    $setting.attr('data-module', module.shortname);
                    $setting.attr('data-setting', setting);

                    // TODO: somebody document this
                    $body.on('click', `.${linkClass}`, function () {
                        const $this = $(this),
                              tbSet = $this.attr('data-setting');

                        const $inputSetting = $(`.tb-setting-input-${tbSet}`);

                        if ($inputSetting.is(':visible')) {
                            $inputSetting.hide();
                            $this.css('opacity', '0.5');
                        } else {
                            $this.css('opacity', '1');
                            $inputSetting.show(function () {
                                $(this).select();
                            });
                        }
                    });
                }

                if (options.oldReddit) {
                    const $oldRedditSettings = $settings.find('.tb-window-content .tb-oldreddit-settings');
                    $oldRedditSettings.append($setting);
                    $oldRedditSettings.show();
                } else {
                    $settings.find('.tb-window-content .tb-settings').append($setting);
                }
            }

            // if ($settings.find('input').length > 0) {
            if (moduleHasSettingTab) {
                // attach tab and content
                if (!await module.getEnabled()) {
                    $tab.addClass('tb-module-disabled');
                    $tab.attr('title', 'This module is not active, you can activate it in the "Toggle Modules" tab.');
                    $settings.prepend('<span class="tb-module-disabled">This module is not active, you can activate it in the "Toggle Modules" tab.</span>');
                }

                if (module.oldReddit) {
                    $settings.prepend('<span class="tb-module-disabled">This module only works on old reddit.</span>');
                }
                $('.tb-settings .tb-window-tabs-wrapper').append($settings);
                if (module.sort) {
                    $tab.attr('data-order', module.sort.order);
                    // If the module specifies a sort, then we do that
                    if (module.sort.location === 'beforeModules') {
                        // Loop through the tabs above the modules list
                        $settingsDialog.find('.tb-window-tabs > *').each(function () {
                            const $existingTab = $(this);
                            if (module.sort.order < parseInt($existingTab.attr('data-order'), 10)) {
                                // We found a tab bigger than us! We should be before it.
                                $existingTab.before($tab);
                                // Break out of the loop since we're done.
                                return false;
                            } else if ($existingTab.is('div')) {
                                // We hit the module list! If it hasn't been added yet, add it here.
                                $existingTab.before($tab);
                                // Break the loop so we don't go into the bottom elements.
                                return false;
                            }
                        });
                    } else if (module.sort.location === 'afterModules') {
                        // Loop through the tabs below the modules list
                        let added = false;
                        $settingsDialog.find('.tb-window-tabs > div ~ a').each(function () {
                            const $existingTab = $(this);
                            if (module.sort.order < parseInt($existingTab.attr('data-order'), 10)) {
                                // We found a tab bigger than us!
                                $existingTab.before($tab);
                                added = true;
                                // We're added, so we don't need to continue
                                return false;
                            }
                        });
                        if (!added) {
                            // Not added yet? To the bottom we go.
                            $('.tb-window-tabs').append($tab);
                        }
                    }
                } else {
                    // Modules without a special sort just get added here
                    $moduleCategory.append($tab);
                }

                // stuff to exec after inject:
                for (let i = 0; i < execAfterInject.length; i++) {
                    execAfterInject[i]();
                }
            } else {
                // module has no settings, for now don't inject a tab
            }

            // we use a jQuery hack to stick this bind call at the top of the queue,
            // so that it runs before the bind call in notifier.js
            // this way we don't have to touch notifier.js to make it work.
            //
            // We get one additional click handler for each module that gets injected.
            // NOTE: For this to work properly, the event delegate has to match the primary .tb-save handler (above)
            $('.tb-settings').bindFirst('click', '.tb-save', () => {
                // handle module enable/disable on Toggle Modules first
                const $moduleEnabled = $(`.tb-settings .tb-window-tabs-wrapper .tb-window-tab.toggle_modules #${module.shortname}Enabled`).prop('checked');
                TBStorage.setSetting(module.id, 'enabled', $moduleEnabled);

                // handle the regular settings tab
                const $settings_page = $(`.tb-window-tab.${module.shortname.toLowerCase()} .tb-window-content`);

                $settings_page.find('span.setting-item').each(function () {
                    const $this = $(this);
                    let value = '';

                    // automagically parse input types
                    switch (module.settings.get($this.data('setting')).type) {
                    case 'action':
                        // this never needs to be saved.
                        break;
                    case 'boolean':
                        value = $this.find('input').prop('checked');
                        break;
                    case 'number':
                        value = JSON.parse($this.find('input').val());
                        break;
                    case 'array':
                    case 'JSON':
                        value = JSON.parse($this.find('textarea').val());
                        break;
                    case 'code':
                        value = $this.find('textarea').val();
                        break;
                    case 'subreddit':
                        value = TBHelpers.cleanSubredditName($this.find('input').val());
                        break;
                    case 'text':
                        value = $this.find('input').val();
                        break;
                    case 'list':
                        value = $this.find('input').val().split(',').map(str => str.trim()).clean('');
                        break;
                    case 'sublist':
                        value = [];
                        $this.find('.selected-list option').each(function () {
                            value.push($(this).val());
                        });
                        break;
                    case 'map':
                        value = {};
                        $this.find('.tb-map-input-table tbody tr').each(function () {
                            const key = escape($(this).find('input[name=key]').val()).trim(),
                                  val = escape($(this).find('input[name=value]').val()).trim();

                            if (key !== '' || val !== '') {
                                value[key] = val;
                            }
                        });
                        break;
                    case 'selector':
                        value = $this.find('.selector').val();
                        break;
                    case 'syntaxTheme':
                        value = $this.find(`#${module.shortname}_syntax_theme`).val();
                        break;
                    default:
                        value = JSON.parse($this.find('textarea').val());
                        break;
                    }
                    module.set($this.data('setting'), value, false);
                });
            });
        });
    },
};
export default TBModule;

/**
 * An object representing a single setting. Additional properties may be used
 * for settings of different `type`s.
 * @typedef SettingDefinition
 * @prop {string} id The setting ID, used to get and set the setting's value
 * @prop {string} description A human-readable description
 * @prop {any} default The default value of the setting, or a function (possibly
 * async) that returns a default value
 * @prop {string} [storageKey] The storage key associated with the setting
 * @prop {boolean} [beta=false] If true, the setting will only show up when beta
 * mode is enabled
 * @prop {boolean} [debug=false] If true, the setting will only show up when
 * debug mode is enabled
 * @prop {boolean} [advanced=false] If true, the setting will only show up when
 * advanced mode is enabled
 * @prop {boolean} [hidden=false] If true, the setting will not be configurable
 * or visible to users (can be used for module-specific persistent storage)
 */

/** A Toolbox feature module that can be enabled and disabled by the user. */
export class Module {
    /**
     * Defines a module.
     * @param {object} options
     * @param {string} options.name The human-readable name of the module
     * @param {string} options.id The ID of the module, used for storage keys
     * @param {boolean} [options.enabledByDefault=false] If true, the module
     * will be enabled on fresh installs
     * @param {boolean} [options.alwaysEnabled=false] If true, the module cannot
     * be disabled
     * @param {boolean} [options.beta=false] If true, the module will only show
     * up when beta mode is enabled
     * @param {boolean} [options.debug=false] If true, the module will only show
     * up when debug mode is enabled
     * @param {Array<SettingDefinition>} [options.settings=[]] Module settings
     * @param {Function} initializer The module's entry point, run automatically
     * when Toolbox loads with the module is enabled
     */
    constructor ({
        name,
        id = name.replace(/\s/g, ''),
        enabledByDefault = false,
        alwaysEnabled = false,
        beta = false,
        debug = false,
        settings = [],
    }, initializer) {
        /** @prop {string} name The human-readable name of the module */
        this.name = name;
        /** @prop {string} id The ID of the module, used for storage keys */
        this.id = id;
        /**
         * @prop {boolean} enabledByDefault If true, the module will be enabled
         * on fresh installs
         */
        this.enabledByDefault = enabledByDefault;
        /**
         * @prop {boolean} alwaysEnabled If true, the module cannot be disabled
         */
        this.alwaysEnabled = alwaysEnabled;
        /**
         * @prop {boolean} beta If true, the module will only show up when beta
         * mode is enabled
         */
        this.beta = beta;
        /**
         * @prop {boolean} debugMode If true, the module will only show up when
         * debug mode is enabled
        */
        // debugMode, not debug, because `debug` is a logger function
        this.debugMode = debug;
        /**
         * @prop {Function} initializer The module's entry point, run
         * automatically when Toolbox loads with the module is enabled
         */
        this.initializer = initializer;

        // Register settings
        /** @prop {Map<string, SettingDefinition>} settings Module settings */
        this.settings = new Map();
        for (const setting of settings) {
            this.settings.set(setting.id, {
                description: `(${setting.id})`,
                storageKey: `${id}.${setting.id}`,
                beta: false,
                debug: false,
                advanced: false,
                hidden: false,
                ...setting,
            });
        }

        // Add logging functions
        Object.assign(this, TBLog(this));
    }

    /**
     * Gets the value of a setting.
     * @param {string} id The ID of the setting to get
     * @returns {Promise<any>} Resolves to the current value of the setting
     */
    async get (id) {
        const setting = this.settings.get(id);
        if (!setting) {
            throw new TypeError(`Module ${this.name} does not have a setting ${id} to get`);
        }

        // TBStorage doesn't actually accept straight storage keys, so we have
        // to split the key into a module name and the rest of the key
        const mod = setting.storageKey.split('.')[0];
        const value = await TBStorage.getSettingAsync(mod, setting.storageKey.slice(mod.length + 1));

        // TODO: TBStorage should return `undefined` instead of `null` for unset
        //       settings, and this check should only be for `undefined`
        if (value == null) {
            if (typeof setting.default === 'function') {
                return setting.default();
            } else {
                return setting.default;
            }
        }
        return value;
    }

    /**
     * Sets the value of a setting.
     * @param {string} id The ID of the setting to get
     * @param {any} value The new setting value
     * @returns {Promise<any>} Resolves to the new value when complete
     */
    set (id, value) {
        const setting = this.settings.get(id);
        if (!setting) {
            throw new TypeError(`Module ${this.name} does not have a setting ${id} to set`);
        }

        // TBStorage doesn't actually accept straight storage keys, so we have
        // to split the key into a module name and the rest of the key
        const mod = setting.storageKey.split('.')[0];
        return TBStorage.setSettingAsync(mod, setting.storageKey.slice(mod.length + 1), value);
    }

    /**
     * "Starts" the module by calling its initializer.
     * @returns {Promise<void>} Resolves when the initializer is completed
     */
    async init () {
        // Read the current values of all registered settings
        const initialValues = Object.create(null);
        await Promise.all([...this.settings.values()].map(async setting => {
            initialValues[setting.id] = await this.get(setting.id);
        }));

        // Call the initializer, passing the module instance the settings
        await this.initializer.call(this, initialValues);
    }

    /**
     * Check whether or not the module is enabled.
     * @returns {Promise<boolean>} Resolves to whether the module is enabled
     */
    async getEnabled () {
        if (this.alwaysEnabled) {
            return true;
        }
        return !!await TBStorage.getSettingAsync(this.id, 'enabled');
    }

    /**
     * Enables or disables the module. This does not take effect until Toolbox
     * is reloaded.
     * @param {boolean} enabled True to enable the module, false to disable it
     * @returns {Promise<boolean>} Resolves to the new enable state
     * @throws {Error} when trying to disable a module that cannot be
     */
    setEnabled (enable) {
        if (this.alwaysEnabled && !enable) {
            throw new Error(`Cannot disable module ${this.id} which is always enabled`);
        }

        return TBStorage.setSettingAsync(this.id, 'enabled', !!enable);
    }
}
