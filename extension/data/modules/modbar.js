function modbar() {
    var self = new TB.Module('Modbar');
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
        'default': TB.storage.getSetting('ModMail', 'subredditColorSalt', 'PJSalt'),
        'hidden': true
    });


    self.init = function() {
        if (!TBUtils.logged || TBUtils.isToolbarPage) return;

        var $body = $('body'),
            moduleCount = 0,
            DEFAULT_MODULE = 'DEFAULT_MODULE',
            currentModule = DEFAULT_MODULE;

        //
        // preload some generic variables
        //
        var shortcuts = self.setting('shortcuts'),
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
        var modMailUrl = $('#modmail').attr('href') || `${TBUtils.baseDomain}/message/moderator/`;
        if (parseInt(modmailCustomLimit) > 0) {

            modMailUrl += `?limit=${modmailCustomLimit}`;
            $('#modmail').attr('href', modMailUrl);
            $('#tb-modmail').attr('href', modMailUrl);
            $('#tb-modmailcount').attr('href', modMailUrl);
        }

        var modQueueUrl = TBUtils.baseDomain + (modSubredditsFMod ? '/me/f/mod/about/modqueue/' : `/r/${modSubreddits}/about/modqueue`);
        var modBar = $(`
<div id="tb-bottombar" class="tb-toolbar">
    <a class="tb-bottombar-hide" href="javascript:void(0)"><img src="data:image/png;base64,${TBui.iconHide}" /></a>
    <a class="tb-toolbar tb-toolbar-new-settings" href="javascript:void(0)"><img src="data:image/png;base64,${TBui.iconGear}" title="toolbox settings"/></a>
    <label class="tb-first-run">&#060;-- Click for settings &nbsp;&nbsp;&nbsp;</label>
    <span id="tb-bottombar-contentleft">
        <span id="tb-toolbarshortcuts"></span>
    </span>
    <span id="tb-bottombar-contentright">
        <span id="tb-toolbarcounters">
            <a title="no mail" href="${TBUtils.baseDomain}/message/inbox/" class="nohavemail" id="tb-mail"></a>
            <a href="${TBUtils.baseDomain}/message/inbox/" class="tb-toolbar" id="tb-mailCount"></a>
            <a title="modmail" href="${modMailUrl}" id="tb-modmail" class="nohavemail"></a>
            <a href="${modMailUrl}" class="tb-toolbar" id="tb-modmailcount"></a>
            <a href="${newModmailUrl}" class="nohavemail access-required" id="tb-new_modmail" ${openMailTab ? `target="_blank"`: ``}></a>
            <a href="${newModmailUrl}" class="tb-toolbar" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"`: ``}></a>
            <a title="modqueue" href="${modQueueUrl}" id="tb-modqueue" ></a>
            <a href="${modQueueUrl}" class="tb-toolbar" id="tb-queueCount"></a>
        </span>
    </span>
    <div id="tb-new-modmail-tooltip">
        <table>
            <tr id="tb-new-modmail-new">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/new" class="tb-toolbar" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"`: ``}>New</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-inprogress">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/inprogress" class="tb-toolbar" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"`: ``}>In Progress</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-highlighted">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/highlighted" class="tb-toolbar" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"`: ``}>Highlighted</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-mod">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/mod" class="tb-toolbar" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"`: ``}>Mod Discussions</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
            <tr id="tb-new-modmail-notifications">
                <td class="tb-new-mm-category"><a href="https://mod.reddit.com/mail/notifications" class="tb-toolbar" id="tb-new-modmailcount" ${openMailTab ? `target="_blank"`: ``}>Notifications</a></td>
                <td class="tb-new-mm-count"></td>
            </tr>
    </div>
</div>
`);
        let hoverTimeout;
        modBar.find('#tb-new_modmail, #tb-new-modmailcount, #tb-new-modmail-tooltip').hover(function() {
            clearTimeout(hoverTimeout);
            modBar.find('#tb-new-modmail-tooltip').show();
        }, function() {
            hoverTimeout = setTimeout(function(){
                modBar.find('#tb-new-modmail-tooltip').hide(100);
            }, 1000);
        });




        // Add unmoderated icon if it is enabled.

        if (unmoderatedOn) {
            var unModQueueUrl = TBUtils.baseDomain + (unmoderatedSubredditsFMod ? '/me/f/mod/about/unmoderated/' : `/r/${unmoderatedSubreddits}/about/unmoderated`);
            modBar.find('#tb-toolbarcounters').append(`
<a title="unmoderated" href="${unModQueueUrl}" id="tb-unmoderated"></a>
<a href="${unModQueueUrl}" class="tb-toolbar" id="tb-unmoderatedcount"></a>
`);

        }



        var modbarhid = $(`
<div id="tb-bottombar-hidden" class="tb-toolbar">
    <a class="tb-bottombar-unhide" href="javascript:void(0)"><img id="tb-bottombar-image" src="data:image/png;base64,${compactHide ? TBui.iconGripper : TBui.iconShow}" /></a>
</div>
`);


        if (debugMode) {

            var $console = $(`
<div class="tb-debug-window tb-popup">
    <div class="tb-popup-header"><div id="tb-debug-header-handle" class="tb-popup-title"> Debug Console </div><span class="buttons"><a class="close" id="tb-debug-hide" href="javascript:;">✕</a></span></div>
    <div class="tb-popup-content">
        <textarea class="tb-debug-console" rows="20" cols="20"></textarea>
        <input type="text" class="tb-debug-input" placeholder="eval() in toolbox scope" />
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

        $body.append(modBar);

        // Always add moderated subreddits, but hide it.  Reason: personal notes needs the elem to exist.
        $body.find('#tb-toolbarshortcuts').before('<a href="javascript:void(0)" id="tb-toolbar-mysubs" style="display: none">Moderated Subreddits</a> ');

        // moderated subreddits button.
        if (enableModSubs) {
            var subList = '',
                livefilterCount,
                subredditColorSalt = self.setting('subredditColorSalt'),
                mySubsTemplate = `
<div id="tb-my-subreddits">
    <input id="tb-livefilter-input" type="text" placeholder="live search" value="">
    <span class="tb-livefilter-count">{{livefilterCount}}</span>
    <br>
    <table id="tb-my-subreddit-list">{{subList}}</table>
</div>
`;

            TBUtils.getModSubs(function () {
                self.log('got mod subs');
                self.log(TBUtils.mySubs.length);
                self.log(TBUtils.mySubsData.length);
                $(TBUtils.mySubsData).each(function () {
                    subList = `${subList}
<tr style="border-left: solid 3px ${TBUtils.stringToColor(this.subreddit + subredditColorSalt)} !important;" data-subreddit="${this.subreddit}">
    <td><a href="${TBUtils.baseDomain}/r/${this.subreddit}" target="_blank">/r/${this.subreddit}</a></td>
    <td class="tb-my-subreddits-subreddit">
        <a title="/r/${this.subreddit} modmail!" target="_blank" href="${TBUtils.baseDomain}/r/${this.subreddit}/message/moderator" class="generic-mail"></a>
        <a title="/r/${this.subreddit} modqueue" target="_blank" href="${TBUtils.baseDomain}/r/${this.subreddit}/about/modqueue" class="generic-modqueue"></a>
        <a title="/r/${this.subreddit} unmoderated" target="_blank" href="${TBUtils.baseDomain}/r/${this.subreddit}/about/unmoderated" class="generic-unmoderated"></a>
    </td>
</tr>
`;
                });
                livefilterCount = TBUtils.mySubs.length;

                var modSubsPopupContent = TBUtils.template(mySubsTemplate, {
                    'livefilterCount': livefilterCount,
                    'subList': subList
                });


                $body.on('click', '#tb-toolbar-mysubs', function () {
                    var $this = $(this);
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
                            'bottom': '31px',
                            'left': '20px'
                        });
                        // Focus the filter bar for convenience
                        $('#tb-livefilter-input').focus();
                    } else {
                        $this.removeClass('tb-mysubs-activated');
                        $('.subreddits-you-mod-popup').remove();
                    }

                    $body.find('#tb-livefilter-input').keyup(function () {
                        var LiveSearchValue = $(this).val();
                        $body.find('#tb-my-subreddits table tr').each(function () {
                            var $this = $(this),
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
            $('#tb-bottombar').find('#tb-toolbarcounters').before(`<a href="javascript:;" id="tb-reload-link"><img title="reload toolbox" src="data:image/png;base64,${TBui.iconRefresh}" /></a>`);

            $body.on('click', '#tb-reload-link', function () {
                self.log('reloading chrome');
                TB.utils.reloadToolbox();
            });
        }

        // Debug mode/console
        if (debugMode) {
            $('#tb-bottombar').find('#tb-toolbarcounters').before(`<a href="javascript:;" id="tb-toggle-console"><img title="debug console" src="data:image/png;base64,${TBui.iconConsole}" /></a>`);
            var selectedTheme = TB.storage.getSetting('Syntax', 'selectedTheme') || 'dracula';

            var debugEditor;
            $('.tb-debug-console').each(function(index, elem){
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


            var logLength = 0;
            var logVisibleLength = 0;
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
                    var search = `[${currentModule}]`,
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
                    var bottom = debugEditor.charCoords({line: logVisibleLength, ch: 0}, 'local').bottom;
                    debugEditor.scrollTo(null, bottom);
                // $consoleText.scrollTop($consoleText[0].scrollHeight);
                }

                // add new modules to dropdown.
                if (TB.utils.logModules.length > moduleCount){
                    moduleCount = TB.utils.logModules.length;

                    var $moduleSelect = $('.module-select');

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
                    }).promise().done( function(){
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
            var $shortcut = $(`<span>&nbsp;- <a class="tb-no-gustavobc" href="${TBUtils.htmlEncode(unescape(value))}">${TBUtils.htmlEncode(unescape(index))}</a> </span>`);
            $shortcut.appendTo('#tb-toolbarshortcuts');
        });

        $body.append(modbarhid);

        // Always default to hidden.

        if (compactHide) {
            modbarHidden = true;
            $('#tb-bottombar-image').hide();
        }

        function toggleMenuBar(hidden) {
            if (hidden) {
                $(modBar).hide();
                $(modbarhid).show();
                $body.find('.tb-debug-window').hide(); // hide the console, but don't change consoleShowing.
                $body.toggleClass('tb-modbar-shown', false); // New modmail uses this style to add space to the bottom of the page
            } else {
                $(modBar).show();
                $(modbarhid).hide();
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
        $(modbarhid).hover(function modbarHover(e) {
            if (!notifierEnabled || compactHide) return;
            var hoverString = `New Messages: ${unreadMessageCount}<br>Mod Queue: ${modqueueCount}<br>Unmoderated Queue: ${unmoderatedCount}<br>Mod Mail: ${modmailCount}<br>New Mod Mail ${newModmailCount}`;

            $.tooltip(hoverString, e);
        });

        if (compactHide) {
            $(modbarhid)
                .mouseover(function () {
                    $body.find('#tb-bottombar-image').show();
                })
                .mouseout(function () {
                    $body.find('#tb-bottombar-image').hide();
                });
        }

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
            TB.utils.getModSubs(function () {
                TB.showSettings();
            });
        });

        // check for passed settings.
        function switchTab(module) {

            var $this = $body.find(`[data-module="${module}"]`),
                $tb_help_mains = $('.tb-help-main');

            // achievement support
            if (module === 'about'){
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
            $('.tb-window-wrapper .tb-window-tab').hide();
            $(`.tb-window-wrapper .tb-window-tab.${module}`).show();
        }

        function checkHash() {
            if (window.location.hash) {
                var module = TB.utils.getHashParameter('tbsettings'),
                    setting = TB.utils.getHashParameter('setting');

                self.log(setting);
                if (module) {
                // prevent tbsetting URL hash from persisting on reload.
                    history.pushState('', document.title, window.location.pathname);

                    module = module.toLowerCase();

                    if (setting) {
                        setting = setting.toLowerCase();
                        var id = `#tb-${module}-${setting}`,
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
            var tab = $(this).attr('data-module');
            switchTab(tab);
        });
    };
    TB.register_module(self);
}

(function() {
    window.addEventListener('TBModuleLoaded', function () {
        modbar();
    });
})();
