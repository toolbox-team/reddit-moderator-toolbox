function modbar() {
    const self = new TB.Module('Modbar');
    self.shortname = 'Modbar';

    self.settings['enabled']['default'] = true;

    // How about you don't disable modbar?  No other module should ever do this. Well except for the support module.
    self.settings['enabled']['hidden'] = true; // Don't disable it, either!

    self.register_setting('compactHide', {
        'type': 'boolean',
        'default': false,
        'advanced': true,
        'title': 'Use compact mode for modbar'
    });
    self.register_setting('unmoderatedOn', {
        'type': 'boolean',
        'default': true,
        'title': 'Show icon for unmoderated'
    });
    self.register_setting('enableModSubs', {
        'type': 'boolean',
        'default': true,
        'title': 'Show Moderated Subreddits in the modbar'
    });
    self.register_setting('shortcuts', {
        'type': 'map',
        'default': {},
        'labels': ['name', 'url'],
        'title': 'Shortcuts',
        'hidden': false
    });

    // private (hidden) settings.
    self.register_setting('modbarHidden', {
        'type': 'boolean',
        'default': false,
        'hidden': true
    });
    self.register_setting('consoleShowing', {
        'type': 'boolean',
        'default': false,
        'hidden': true
    });
    self.register_setting('lockScroll', {
        'type': 'boolean',
        'default': false,
        'hidden': true
    });
    self.register_setting('customCSS', {
        'type': 'code',
        'default': '',
        'hidden': true
    });
    self.register_setting('lastExport', {
        'type': 'number',
        'default': 0,
        'hidden': true
    });
    self.register_setting('showExportReminder', {
        'type': 'boolean',
        'default': true,
        'hidden': true
    });

    self.register_setting('subredditColorSalt', {
        'type': 'text',
        'default': TB.storage.getSetting('QueueTools', 'subredditColorSalt', 'PJSalt'),
        'hidden': true
    });

    self.init = function() {
        let $body = $('body'),
            moduleCount = 0,
            DEFAULT_MODULE = 'DEFAULT_MODULE',
            currentModule = DEFAULT_MODULE;

        // Footer element below the page so toolbox never should be in the way.
        // Doing it like this because it means we don't have to mess with reddit css
        const $footerblock = $('<div id="tb-footer-block">').appendTo($body);

        if (!TBUtils.logged || TBUtils.isEmbedded) return;

        // This prevents some weird scrollbar behavior on new reddit iframe embeds.
        window.addEventListener('TBNewPage', function (event) {
            const pageType = event.detail.pageType;
            if(pageType === 'oldModmail' || pageType === 'message') {
                $footerblock.hide();
            } else {
                $footerblock.show();
            }
        });

        //
        // preload some generic variables
        //
        let shortcuts = self.setting('shortcuts'),
            modbarHidden = self.setting('modbarHidden'),
            compactHide = self.setting('compactHide'),
            unmoderatedOn = self.setting('unmoderatedOn'),
            consoleShowing = self.setting('consoleShowing'),
            lockscroll = self.setting('lockScroll'),
            enableModSubs = self.setting('enableModSubs'),
            customCSS = self.setting('customCSS'),

            debugMode = TBUtils.debugMode,

            modSubreddits = TB.storage.getSetting('Notifier', 'modSubreddits', 'mod'),
            unmoderatedSubreddits = TB.storage.getSetting('Notifier', 'unmoderatedSubreddits', 'mod'),
            unreadMessageCount = TB.storage.getSetting('Notifier', 'unreadMessageCount', 0),
            modqueueCount = TB.storage.getSetting('Notifier', 'modqueueCount', 0),
            unmoderatedCount = TB.storage.getSetting('Notifier', 'unmoderatedCount', 0),
            modmailCount = TB.storage.getSetting('Notifier', 'modmailCount', 0),
            newModmailCount = TB.storage.getSetting('Notifier', 'newModmailCount', 0),
            notifierEnabled = TB.storage.getSetting('Notifier', 'enabled', true),
            modmailCustomLimit = TB.storage.getSetting('ModMail', 'customLimit', 0),

            modSubredditsFMod = TB.storage.getSetting('Notifier', 'modSubredditsFMod', false),
            unmoderatedSubredditsFMod = TB.storage.getSetting('Notifier', 'unmoderatedSubredditsFMod', false);

        // Ready some details for new modmail linking
        let modmailLink = TB.storage.getSetting('NewModMail', 'modmaillink', 'all_modmail'),
            openMailTab = TB.storage.getSetting('NewModMail', 'openmailtab', false),
            newModmailBaseUrl = 'https://mod.reddit.com/mail/',
            newModmailUrl;

        switch(modmailLink) {
        case 'all_modmail':
            newModmailUrl = `${newModmailBaseUrl}all`;

            break;
        case 'new':
            newModmailUrl = `${newModmailBaseUrl}new`;

            break;
        case 'in_progress':
            newModmailUrl = `${newModmailBaseUrl}inprogress`;

            break;
        case 'archived':
            newModmailUrl = `${newModmailBaseUrl}archived`;

            break;
        case 'highlighted':
            newModmailUrl = `${newModmailBaseUrl}highlighted`;

            break;
        case 'mod_discussions':
            newModmailUrl = `${newModmailBaseUrl}mod`;

            break;
        case 'notifications':
            newModmailUrl = `${newModmailBaseUrl}notifications`;

        }

        // Custom CSS for devmode/testing
        if (customCSS) {
            $('head').append(`<style type="text/css">${customCSS}</style>`);
        }

        //
        // UI elements
        //
        // style="display: none;"
        // toolbar, this will display all counters, quick links and other settings for the toolbox

        // This is here in case notifier is disabled which is where this normally is set.
        // Atleast, I think.... - creesch
        let modMailUrl = $('#modmail').attr('href') || `${TBUtils.tempBaseDomain}/message/moderator/`;
        if (parseInt(modmailCustomLimit) > 0) {

            modMailUrl += `?limit=${modmailCustomLimit}`;
            $('#modmail').attr('href', modMailUrl);
            $('#tb-modmail').attr('href', modMailUrl);
            $('#tb-modmailcount').attr('href', modMailUrl);
        }

        const modQueueUrl = TBUtils.tempBaseDomain + (modSubredditsFMod ? '/me/f/mod/about/modqueue/' : `/r/${modSubreddits}/about/modqueue`);
        const $modBar = $(`
<div id="tb-bottombar">
    <a class="tb-bottombar-hide tb-icons" href="javascript:void(0)">keyboard_arrow_left</a>
    <a class="tb-toolbar-new-settings tb-icons" href="javascript:void(0)" title="toolbox settings">settings</a>
    <label class="tb-first-run">&#060;-- Click for settings</label>
    <span id="tb-bottombar-contentleft">
        <span id="tb-toolbarshortcuts"></span>
    </span>
    <span id="tb-bottombar-contentright">
        <span id="tb-toolbarcounters">
            <a title="no mail" href="${TBUtils.tempBaseDomain}/message/inbox/" class="nohavemail tb-icons" id="tb-mail">email</a>
            <a href="${TBUtils.tempBaseDomain}/message/inbox/" id="tb-mailCount"></a>
            <a title="modmail" href="${modMailUrl}" id="tb-modmail" class="nohavemail tb-icons">inbox</a>
            <a href="${modMailUrl}" id="tb-modmailcount"></a>
            <a href="${newModmailUrl}" class="nohavemail access-required tb-icons" id="tb-new_modmail" ${openMailTab ? `target="_blank"` : ``}>move_to_inbox</a>
            <a href="${newModmailUrl}" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"` : ``}></a>
            <a title="modqueue" href="${modQueueUrl}" id="tb-modqueue" class="tb-icons">report_problem</a>
            <a href="${modQueueUrl}" id="tb-queueCount"></a>
        </span>
    </span>
    <div id="tb-new-modmail-tooltip">
        <table>
            <tr id="tb-new-modmail-new">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/new" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"` : ``}>New</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-inprogress">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/inprogress" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"` : ``}>In Progress</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-highlighted">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/highlighted" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"` : ``}>Highlighted</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-mod">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/mod" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"` : ``}>Mod Discussions</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-notifications">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/notifications" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"` : ``}>Notifications</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
    </div>
</div>
`);
        let hoverTimeout;
        $modBar.find('#tb-new_modmail, #tb-new-modmailcount, #tb-new-modmail-tooltip').hover(function() {
            clearTimeout(hoverTimeout);
            $modBar.find('#tb-new-modmail-tooltip').show();
        }, function() {
            hoverTimeout = setTimeout(function() {
                $modBar.find('#tb-new-modmail-tooltip').hide(100);
            }, 1000);
        });

        // Add unmoderated icon if it is enabled.

        if (unmoderatedOn) {
            const unModQueueUrl = TBUtils.tempBaseDomain + (unmoderatedSubredditsFMod ? '/me/f/mod/about/unmoderated/' : `/r/${unmoderatedSubreddits}/about/unmoderated`);
            $modBar.find('#tb-toolbarcounters').append(`
<a title="unmoderated" href="${unModQueueUrl}" class="tb-icons" id="tb-unmoderated">remove_red_eye</a>
<a href="${unModQueueUrl}" id="tb-unmoderatedcount"></a>
`);

        }

        const $modbarhid = $(`
<div id="tb-bottombar-hidden" class="${compactHide ? 'tb-bottombar-compact' : ''}">
    <a class="tb-bottombar-unhide tb-icons" href="javascript:void(0)">${compactHide ? 'more_vert' : 'keyboard_arrow_right'}</a>
</div>
`);

        let $console;
        if (debugMode) {

            $console = $(`
<div class="tb-debug-window tb-popup">
    <div class="tb-popup-header">
        <div id="tb-debug-header-handle" class="tb-popup-title"> Debug Console </div>
        <span class="buttons">
            <a class="close" id="tb-debug-hide" href="javascript:;">
                <i class="tb-icons">close</i>
            </a>
        </span>
    </div>
    <div class="tb-popup-content">
        <textarea class="tb-input tb-debug-console" rows="20" cols="20"></textarea>
        <input type="text" class="tb-debug-input tb-input" placeholder="eval() in toolbox scope" />
    </div>
    <div class="tb-popup-footer">
        <select class="module-select tb-action-button inline-button"><option value="${DEFAULT_MODULE}">all modules</option></select>
        <label><input type="checkbox" id="tb-console-lockscroll" ${lockscroll ? 'checked' : ''}> lock scroll</label>
        <!--input class="tb-console-copy" type="button" value="copy text"-->
        <input class="tb-console-clear tb-action-button inline-button" type="button" value="clear console">
    </div>
</div>
`);

            $console.appendTo('body').hide();

            $console.drag('#tb-debug-header-handle');
        }

        $body.append($modBar);

        // moderated subreddits button.
        if (enableModSubs) {
            $body.find('#tb-bottombar-contentleft').prepend('<a href="javascript:void(0)" class="tb-modbar-button" id="tb-toolbar-mysubs" style="display: none">Moderated Subreddits</a> ');

            let subList = '',
                livefilterCount,
                subredditColorSalt = self.setting('subredditColorSalt'),
                configEnabled = TB.storage.getSetting('TBConfig', 'enabled', false);
            TBUtils.getModSubs(function () {
                self.log('got mod subs');
                self.log(TBUtils.mySubs.length);
                self.log(TBUtils.mySubsData.length);
                $(TBUtils.mySubsData).each(function () {
                    const subColor = TBUtils.stringToColor(this.subreddit + subredditColorSalt);
                    subList = `${subList}
<tr style="border-left: solid 3px ${subColor} !important;" data-subreddit="${this.subreddit}">
    <td class="tb-my-subreddits-name"><a href="${TBUtils.tempBaseDomain}/r/${this.subreddit}" target="_blank">/r/${this.subreddit}</a></td>
    <td class="tb-my-subreddits-subreddit">
        <a title="/r/${this.subreddit} modmail!" target="_blank" href="${TBUtils.baseDomain}/r/${this.subreddit}/message/moderator" class="tb-icons">inbox</a>
        <a title="/r/${this.subreddit} modqueue" target="_blank" href="${TBUtils.tempBaseDomain}/r/mod/about/modqueue?subreddit=${this.subreddit}" class="tb-icons">report_problem</a>
        <a title="/r/${this.subreddit} unmoderated" target="_blank" href="${TBUtils.tempBaseDomain}/r/mod/about/unmoderated?subreddit=${this.subreddit}" class="tb-icons">remove_red_eye</a>
        <a title="/r/${this.subreddit} moderation log" target="_blank" href="${TBUtils.baseDomain}/r/${this.subreddit}/about/log" class="tb-icons">grid_on</a>
        <a title="/r/${this.subreddit} traffic stats" target="_blank" href="${TBUtils.baseDomain}/r/${this.subreddit}/about/traffic" class="tb-icons">show_chart</a>
        ${configEnabled ? `<a title="/r/${this.subreddit} config" target="_blank" href="javascript:;" class="tb-config-link tb-icons" data-subreddit="${this.subreddit}">build</a>` : ''}
    </td>
</tr>
`;
                });
                livefilterCount = TBUtils.mySubs.length;

                const modSubsPopupContent = `
                <div id="tb-my-subreddits">
                    <input id="tb-livefilter-input" type="text" class="tb-input" placeholder="live search" value="">
                    <span class="tb-livefilter-count">${livefilterCount}</span>
                    <br>
                    <table id="tb-my-subreddit-list">${subList}</table>
                </div>
                `;

                $body.on('click', '#tb-toolbar-mysubs', function () {
                    const $this = $(this);
                    if (!$this.hasClass('tb-mysubs-activated')) {
                        $this.addClass('tb-mysubs-activated');
                        TB.ui.popup(
                            'Subreddits you moderate',
                            [
                                {
                                    title: 'Subreddits you moderate',
                                    id: 'sub-you-mod', // reddit has things with class .role, so it's easier to do this than target CSS
                                    tooltip: 'Subreddits you moderate',
                                    content: modSubsPopupContent,
                                    footer: ''
                                }
                            ],
                            '',
                            'subreddits-you-mod-popup' // class
                        ).appendTo('body').css({
                            'position': 'fixed',
                            'bottom': '41px',
                            'left': '20px'
                        });
                        // Focus the filter bar for convenience
                        $('#tb-livefilter-input').focus();
                    } else {
                        $this.removeClass('tb-mysubs-activated');
                        $('.subreddits-you-mod-popup').remove();
                    }

                    $body.find('#tb-livefilter-input').keyup(function () {
                        const LiveSearchValue = $(this).val();
                        $body.find('#tb-my-subreddits table tr').each(function () {
                            const $this = $(this),
                                subredditName = $this.attr('data-subreddit');

                            if (subredditName.toUpperCase().indexOf(LiveSearchValue.toUpperCase()) < 0) {
                                $this.hide();
                            } else {
                                $this.show();
                            }
                            $('.tb-livefilter-count').text($('#tb-my-subreddits table tr:visible').length);
                        });
                    });
                });

                $body.on('click', '.subreddits-you-mod-popup .close', function () {
                    $(this).closest('.subreddits-you-mod-popup').remove();
                    $body.find('#tb-toolbar-mysubs').removeClass('tb-mysubs-activated');
                });

                // only show the button once it's populated.
                $('#tb-toolbar-mysubs').show();
            });
        }

        if (TBUtils.firstRun) {
            $('.tb-first-run').show().css('display', 'inline-block');
        }

        if (debugMode && TB.utils.browser === TB.utils.browsers.CHROME) {
            $('#tb-bottombar').find('#tb-toolbarcounters').before(`<a href="javascript:;" id="tb-reload-link" class="tb-icons" title="reload toolbox">cached</a>`);

            $body.on('click', '#tb-reload-link', function () {
                self.log('reloading chrome');
                TB.utils.reloadToolbox();
            });
        }

        // Debug mode/console
        if (debugMode) {
            $('#tb-bottombar').find('#tb-toolbarcounters').before(`<a href="javascript:;" id="tb-toggle-console" title="debug console" class="tb-icons" >bug_report</a>`);
            const selectedTheme = TB.storage.getSetting('Syntax', 'selectedTheme') || 'dracula';

            let debugEditor;
            $('.tb-debug-console').each(function(index, elem) {
            // This makes sure codemirror behaves and uses spaces instead of tabs.
            // Editor setup.
                debugEditor = CodeMirror.fromTextArea(elem, {
                    mode: 'text/x-yaml',
                    autoCloseBrackets: true,
                    lineNumbers: true,
                    theme: selectedTheme,
                    indentUnit: 4,
                    readOnly: true,
                    viewportMargin: Infinity,
                    extraKeys: {
                        'Ctrl-Alt-F': 'findPersistent',
                        'F11': function(cm) {
                            cm.setOption('fullScreen', !cm.getOption('fullScreen'));
                        },
                        'Esc': function(cm) {
                            if (cm.getOption('fullScreen')) cm.setOption('fullScreen', false);
                        }
                    },
                    lineWrapping: true
                });

            });

            let logLength = 0;
            let logVisibleLength = 0;
            setInterval(function () {
            // If the console window is hidden, we don't need to handle this yet
                if (!consoleShowing) {
                    return;
                }

                if (currentModule == DEFAULT_MODULE) {
                    if (logLength < TBUtils.log.length) {
                        debugEditor.setValue(TBUtils.log.join('\n'));
                        logLength = TBUtils.log.length;
                        logVisibleLength = logLength;
                    }
                }

                // filter log by module.
                else {
                    const search = `[${currentModule}]`,
                        moduleLog = [];

                    // hack-y substring search for arrays.
                    for (let i = 0; i < TB.utils.log.length; i++) {
                        if (TB.utils.log[i].indexOf(search) > -1) {
                            moduleLog.push(TB.utils.log[i]);
                        }
                    }
                    if (logLength < TBUtils.log.length) {
                        logLength = TBUtils.log.length;
                        logVisibleLength = moduleLog.length;
                        debugEditor.setValue(moduleLog.join('\n'));
                    }
                }

                if (lockscroll) {
                    const bottom = debugEditor.charCoords({line: logVisibleLength, ch: 0}, 'local').bottom;
                    debugEditor.scrollTo(null, bottom);
                // $consoleText.scrollTop($consoleText[0].scrollHeight);
                }

                // add new modules to dropdown.
                if (TB.utils.logModules.length > moduleCount) {
                    moduleCount = TB.utils.logModules.length;

                    const $moduleSelect = $('.module-select');

                    // clear old list
                    $('.module-select option').remove();

                    // re-add default option
                    $moduleSelect.append($('<option>', {
                        value: DEFAULT_MODULE
                    }).text('all modules'));

                    $(TB.utils.logModules).each(function () {
                        $moduleSelect.append($('<option>', {
                            value: this
                        }).text(this));
                    }).promise().done( function() {
                        $moduleSelect.val(currentModule);
                    });
                }
            }, 500);

            if (consoleShowing && debugMode) {
                $console.show();
            }

        }

        // Append shortcuts
        $.each(shortcuts, function (index, value) {
            // TODO: Separators here should probably use CSS rather than having nested elements and stuff
            const $shortcut = $(`<a class="tb-no-gustavobc" href="${TBUtils.htmlEncode(unescape(value))}">${TBUtils.htmlEncode(unescape(index))}</a>`);
            $shortcut.appendTo('#tb-toolbarshortcuts');
        });

        $body.append($modbarhid);

        // Always default to hidden.

        if (compactHide) {
            modbarHidden = true;
        }

        function toggleMenuBar(hidden) {
            if (hidden) {
                $modBar.hide();
                $modbarhid.show();
                $body.find('.tb-debug-window').hide(); // hide the console, but don't change consoleShowing.
                $body.toggleClass('tb-modbar-shown', false); // New modmail uses this style to add space to the bottom of the page
            } else {
                $modBar.show();
                $modbarhid.hide();
                if (consoleShowing && debugMode) $body.find('.tb-debug-window').show();
                $body.toggleClass('tb-modbar-shown', true);
            }
            self.setting('modbarHidden', hidden);
        }

        toggleMenuBar(modbarHidden);

        // Show/hide menubar
        $body.on('click', '.tb-bottombar-unhide, .tb-bottombar-hide', function () {
            toggleMenuBar($(this).hasClass('tb-bottombar-hide'));
        });

        // Show counts on hover
        let $modBarHidTooltip = $body.find('#tb-modbar-hide-tooltip');
        $modbarhid.mouseenter(function() {
            if (!notifierEnabled || compactHide) return;

            const hoverContent = `
                <table>
                    <tr>
                        <td>New Messages</td>
                        <td>${unreadMessageCount}</td>
                    </tr>
                    <tr >
                        <td>Mod Queue</td>
                        <td>${modqueueCount}</td>
                    </tr>
                    <tr >
                        <td>Unmoderated Queue</td>
                        <td>${unmoderatedCount}</td>
                    </tr>
                    <tr>
                        <td>Mod Mail</td>
                        <td >${modmailCount}</td>
                    </tr>
                    <tr>
                        <td>New Mod Mail</td>
                        <td >${newModmailCount}</td>
                    </tr>
                </table>
            `;

            if(!$modBarHidTooltip.length) {
                $modBarHidTooltip = $('<div id="tb-modbar-hide-tooltip"></div>').appendTo($body);
            }
            $modBarHidTooltip.html(TBStorage.purify(hoverContent));
            $modBarHidTooltip.fadeIn(200);
        }).mouseleave(function() {
            $modBarHidTooltip.fadeOut(200);
        });

        /// Console stuff
        // Show/hide console
        if (debugMode) {
            $body.on('click', '#tb-toggle-console, #tb-debug-hide', function () {
                if (consoleShowing) {
                    $console.hide();
                } else {
                    $console.show();
                }

                consoleShowing = !consoleShowing;
                self.setting('consoleShowing', consoleShowing);
            });

            // Set console scroll
            $body.on('click', '#tb-console-lockscroll', function () {
                lockscroll = !lockscroll;
                self.setting('lockScroll', lockscroll);
            });

            /*
         // Console copy... needs work
         $body.on('click', '#tb-console-copy', function () {
         lockscroll = !lockscroll;
         TBUtils.setSetting('Notifier', 'lockscroll', lockscroll)
         });
         */

            // Console clear
            $body.on('click', '.tb-console-clear', function () {
                TBUtils.log = [];
            });

            // Run console input
            $('.tb-debug-input').keyup(function (e) {
                if (e.keyCode == 13) {
                    self.log(eval($(this).val()));
                    $(this).val(''); // clear line
                }
            });

            // change modules
            $('.module-select').change(function () {
                currentModule = $(this).val();
                self.log(`selected module: ${currentModule}`);
            });
        }

        /// End console stuff

        // Open the settings
        $body.on('click', '.tb-toolbar-new-settings', function () {
            if ($('.tb-settings').length) return; // Don't show the window twice
            TB.utils.getModSubs(function () {
                TB.showSettings();
            });
        });

        // check for passed settings.
        function switchTab(module) {

            const $this = $body.find(`[data-module="${module}"]`),
                $tb_help_mains = $('.tb-help-main');

            // achievement support
            if (module === 'about') {
                TB.utils.sendEvent(TB.utils.events.TB_ABOUT_PAGE);
            }
            if (module === 'syntax') {
                TB.utils.sendEvent(TB.utils.events.TB_SYNTAX_SETTINGS);
            }

            $('.tb-window-tabs a').removeClass('active');
            $this.addClass('active');

            $tb_help_mains.attr('currentpage', module);
            // if we have module name, give that to the help button
            if ($this.data('module')) {
                $tb_help_mains.data('module', $this.data('module'));
            }
            $('.tb-personal-settings .tb-window-wrapper .tb-window-tab').hide();
            $(`.tb-personal-settings .tb-window-wrapper .tb-window-tab.${module}`).show();
        }

        function checkHash() {
            if (window.location.hash) {
                let module = TB.utils.getHashParameter('tbsettings'),
                    setting = TB.utils.getHashParameter('setting');

                self.log(setting);
                if (module) {
                // prevent tbsetting URL hash from persisting on reload.
                    history.pushState('', document.title, window.location.pathname);

                    module = module.toLowerCase();

                    if (setting) {
                        setting = setting.toLowerCase();
                        let id = `#tb-${module}-${setting}`,
                            highlightedCSS = `${id} p {background-color: ${TB.ui.standardColors.softyellow}; display: block !important;}`;

                        // this next line is to deal with legacy settings
                        highlightedCSS += `${id}{background-color: ${TB.ui.standardColors.softyellow}; display: block !important;}`;
                        highlightedCSS += `.tb-setting-link-${setting} {display: inline !important;}`;

                        $('head').append(`<style type="text/css">${highlightedCSS}</style>`);
                    }

                    // Wait a sec for stuff to load.
                    setTimeout(function () {

                        TB.showSettings();
                        switchTab(module);
                    }, 1000);
                }
            }
        }
        checkHash();
        setInterval(checkHash, 500);

        // change tabs
        $body.on('click', '.tb-window-tabs a:not(.active)', function () {
            const tab = $(this).attr('data-module');
            switchTab(tab);
        });
    };
    TB.register_module(self);
}

window.addEventListener('TBModuleLoaded2', function () {
    modbar();
});
