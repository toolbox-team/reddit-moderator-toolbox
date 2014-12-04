function tbobject() {

TB = {
    utils: TBUtils,
    ui: TBui,
    storage: TBStorage,

    modules: {},
    moduleList: [],

    register_module: function register_module(module) {
        this.moduleList.push(module.shortname);
        this.modules[module.shortname] = module;
    },

    init: function tbInit() {
        initLoop();

        function initLoop() {
            setTimeout(function init() {
                if (TB.storage.isLoaded === true) {

                    $.log("TBObject has TBStorage, loading modules...");
                    // call every module's init() method on page load
                    for (var i = 0; i < TB.moduleList.length; i++) {
                        var module = TB.modules[TB.moduleList[i]];

                        // Don't do anything with beta modules unless beta mode is enabled
                        // Need TB.setting() call for non-module settings
                        // if (!TB.setting('betamode') && module.setting('betamode')) {
                        if (!TB.storage.getSetting('Utils', 'betaMode', false) && module.config['betamode']) {
                            // skip this module entirely
                            continue;
                        }

                        // Don't do anything with dev modules unless debug mode is enabled
                        // Need TB.setting() call for non-module settings
                        // if (!TB.setting('betamode') && module.setting('betamode')) {
                        if (!TB.storage.getSetting('Utils', 'debugMode', false) && module.config['devmode']) {
                            // skip this module entirely
                            continue;
                        }

                        // lock 'n load
                        if (module.setting('enabled')) {
                            $.log('Loading ' + module.name + ' module');
                            module.init();
                            // unnecessary; we do it in TB.utils.getModSubs now
                            // if (module.config["needs_mod_subs"]) {
                            //     $.log("  We require additional mod subs");
                            //     TB.utils.getModSubs(function init() {
                            //         module.init();
                            //     });
                            // } else {
                            //     module.init();
                            // }
                        }

                    }
                } else {
                    console.log("no storage, looping", true);
                    initLoop();
                }
            }, 50);
        }
    },

    injectSettings: function injectSettings() {
        for (var i = 0; i < this.moduleList.length; i++) {
            var idx = i,
                self = this;

            (function () {
                // wrap each iteration in a self-executing anonymous function, to preserve scope for bindFirst()
                // otherwise, we get the bindFirst callback having `var module` refer to the last time it was set
                // becausde we're in for loop not a special scope, d'oh.
                var module = self.modules[self.moduleList[idx]];

                // Don't do anything with beta modules unless beta mode is enabled
                // Need TB.setting() call for non-module settings
                // if (!TB.setting('betamode') && module.setting('betamode')) {
                if (!TB.storage.getSetting('Utils', 'betaMode', false)
                    && module.config['betamode']
                ) {
                    // skip this module entirely
                    // use `return false` because we're in a self-executing anonymous function
                    return false;
                }
                // Don't do anything with dev modules unless debug mode is enabled
                // Need TB.setting() call for non-module settings
                // if (!TB.setting('betamode') && module.setting('betamode')) {
                if (!TB.storage.getSetting('Utils', 'debugMode', false)
                    && module.config['devmode']
                ) {
                    // skip this module entirely
                    // use `return false` because we're in a self-executing anonymous function
                    return false;
                }


                //
                // build and inject our settings tab
                //

                var moduleHasSettingTab = false, // we set this to true later, if there's a visible setting
                    $tab = $('<a href="javascript:;" class="tb-window-content-' + module.shortname.toLowerCase() + '">' + module.name + '</a>'),
                    $settings = $('<div class="tb-window-content-' + module.shortname.toLowerCase() + '" style="display: none;"><div class="tb-help-main-content"></div></div>');

                $tab.data('module', module.shortname);

                var $body = $('body');

                for (var j = 0; j < module.settingsList.length; j++) {
                    var setting = module.settingsList[j],
                        options = module.settings[setting];

                    // "enabled" will eventually be special, but for now it just shows up like any other setting
                    // if (setting == "enabled") {
                    //     continue;
                    // }

                    // "enabled" is special during the transition period, while the "Toggle Modules" tab still exists
                    if (setting == "enabled") {
                        // blank slate
                        var $setting = $('<p></p>');
                        $setting.append($('<label><input type="checkbox" id="' + module.shortname + 'Enabled" ' + (module.setting(setting) ? ' checked="checked"' : '') + '> ' + options.title + '</label>'));

                        $('.tb-window-content .tb-window-content-modules').append($setting);

                        // don't need this on the module's tab, too
                        continue;
                    }

                    // hide beta stuff unless beta mode enabled
                    if (options.hasOwnProperty("betamode")
                        && !TB.storage.getSetting('Utils', 'betaMode', false)
                        && options["betamode"]
                    ) {
                        continue;
                    }
                    // hide dev stuff unless debug mode enabled
                    if (options.hasOwnProperty("devmode")
                        && !TB.storage.getSetting('Utils', 'debugMode', false)
                        && options["devmode"]
                    ) {
                        continue;
                    }

                    // hide hidden settings, ofc
                    if (options.hasOwnProperty("hidden")
                        && options["hidden"]
                    ) {
                        continue;
                    }

                    moduleHasSettingTab = true;

                    // blank slate
                    var $setting = $('<p></p>'),
                        execAfterInject = [];

                    // automagical handling of input types
                    switch (options.type) {
                        case "boolean":
                            $setting.append($('<label><input type="checkbox" ' + (module.setting(setting) ? ' checked="checked"' : '') + '> ' + options.title + '</label>'));
                            break;
                        case "number":
                            $setting.append($('<label><input type="number" value="' + module.setting(setting) + '" min="' + options.min + '" max="' + options.max + '" step="' + options.step + '"> ' + options.title + '</label>'));
                            break;
                        case "text":
                        case "list":
                            $setting.append(options.title + ':<br />');
                            $setting.append($('<input type="text" value="' + module.setting(setting) + '">'));
                            break;
                        case "sublist":
                            $setting.append(options.title + ':<br />');
                            $setting.append(TB.ui.selectMultiple.apply(TB.ui, options.args)); // first arg sets `this` inside func
                            break;
                        case "selector":
                            var v = module.setting(setting);
                            $.log("Current setting: " + v);
                            $setting.append(options.title + ':<br />');
                            $setting.append(TB.ui.selectSingular.apply(TB.ui, [options.values, v === undefined || v == null || v == '' ? options.default : v]));
                            break;
                        case "syntaxTheme":
                            $setting.append(options.title + ':<br/>');
                            $setting.append(TB.modules.SyntaxHighlighter.themeSelect);
                            $setting.find('select').attr('id', module.shortname + '_syntax_theme');
                            $setting.append($('\
                            <pre class="syntax-example" id="' + module.shortname + '_syntax_theme_css">\
/* This is just some example code*/\n\
body {\n\
    font-family: sans-serif, "Helvetica Neue", Arial;\n\
    font-weight: normal;\n\
}\n\
\n\
.md h3, .commentarea h3 {\n\
    font-size: 1em;\n\
}\n\
\n\
#header {\n\
    border-bottom: 1px solid #9A9A9A; \n\
    box-shadow: 0px 1px 3px 1px #B3C2D1;\n\
}\n\
/* This is just some example code, this time to demonstrate word wrapping. If it is enabled this line will wrap to a next line as soon as it hits the box side, if it is disabled this line will just continue creating a horizontal scrollbar */\n\
                            </pre>'));
                            execAfterInject.push(function () {
                                // Syntax highlighter selection stuff
                                $body.addClass('mod-toolbox-ace');
                                var editorSettings = ace.edit(module.shortname + '_syntax_theme_css');
                                editorSettings.setTheme("ace/theme/" + module.setting(setting));
                                editorSettings.getSession().setUseWrapMode(TB.storage.getSetting('SyntaxHighlighter', 'enableWordWrap', true));

                                if (TBUtils.browser == 'chrome') {
                                    ace.config.set("workerPath", chrome.extension.getURL("/libs/"));
                                }
                                editorSettings.getSession().setMode("ace/mode/css");

                                $('#' + module.shortname + '_syntax_theme').val(module.setting(setting));
                                $body.on('change keydown', '#' + module.shortname + '_syntax_theme', function () {
                                    var thingy = $(this);
                                    setTimeout(function () {
                                        editorSettings.setTheme("ace/theme/" + thingy.val());
                                    }, 0);
                                });
                            });
                            break;
                        case "number":
                            $setting.append(options.title + ': <input type="number" value="' + module.setting(setting) + '">');
                            break;
                        default:
                            // what in the world would we do here? maybe raw JSON?
                            break;
                    }
                    $setting = $('<span></span>').attr('class', 'setting-item').append($setting);
                    $setting.attr('id', 'tb-' + module.shortname + '-' + setting);
                    $setting.data('module', module.shortname);
                    $setting.data('setting', setting);

                    $settings.append($setting);
                }

                // if ($settings.find('input').length > 0) {
                if (moduleHasSettingTab) {
                    // attach tab and content
                    $('.tb-settings .tb-window-tabs a:nth-last-child(1)').before($tab);
                    $('.tb-settings .tb-window-content').append($settings);

                    // stuff to exec after inject:
                    for (var i = 0; i < execAfterInject.length; i++) {
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
                $body.bindFirst('click', '.tb-save', function (event) {
                    // handle module enable/disable on Toggle Modules first
                    var $moduleEnabled = $('.tb-window-content .tb-window-content-modules #' + module.shortname + 'Enabled').prop('checked');
                    module.setting('enabled', $moduleEnabled);

                    // handle the regular settings tab
                    var $settings_page = $('.tb-window-content-' + module.shortname.toLowerCase());

                    $settings_page.find('span.setting-item').each(function () {
                        var $this = $(this),
                            value = '';

                        // automagically parse input types
                        switch (module.settings[$this.data('setting')].type) {
                            case 'boolean':
                                value = $this.find('input').prop('checked');
                                break;
                            case 'number':
                                value = JSON.parse($this.find('input').val());
                                break;
                            case 'text':
                                value = $this.find('input').val();
                                break;
                            case 'list':
                                value = $this.find('input').val().split(',').map(function (str) {
                                    return str.trim();
                                }).clean("");
                                break;
                            case 'sublist':
                                value = [];
                                $.each($this.find('.selected-list option'), function () {
                                    value.push($(this).val());
                                });
                                break;
                            case 'selector':
                                value = $this.find('.selector').val();
                                break;
                            case 'syntaxTheme':
                                value = $this.find('#' + module.shortname + '_syntax_theme').val();
                                break;
                            default:
                                value = JSON.parse($this.find('input').val());
                                break;
                        }

                        module.setting($this.data('setting'), value);
                    });
                });
            }());
        }
    }
};

// Prototype for all Toolbox modules
TB.Module = function Module(name) {
    // PUBLIC: Module Metadata
    this.name = name;

    this.config = {
        "betamode": false,
        "devmode": false,
        "needs_mod_subs": false
    };

    this.settings = {};
    this.settingsList = [];

    this.register_setting = function register_setting(name, setting) {
        this.settingsList.push(name);
        this.settings[name] = setting;
    };

    this.register_setting(
        "enabled", { // this one serves as an example as well as the absolute minimum setting that every module has
            "type": "boolean",
            "default": false,
            "betamode": false, // optional
            "hidden": false, // optional
            "title": "Enable " + this.name
        });

    // PUBLIC: settings interface
    this.setting = function setting(name, value) {
        // are we setting or getting?
        if (typeof value !== "undefined") {
            // setting
            return TB.storage.setSetting(this.shortname, name, value);
        } else {
            // getting
            // do we have a default?
            if (this.settings.hasOwnProperty(name)
                && this.settings[name].hasOwnProperty("default")
            ) {
                // we know what the default should be
                return TB.storage.getSetting(this.shortname, name, this.settings[name]["default"])
            } else {
                // getSetting defaults to null for default value, no need to pass it explicitly
                return TB.storage.getSetting(this.shortname, name);
            }
        }
    };

    // PUBLIC: placeholder init(), just in case
    this.init = function init() {
        // pass
    };
};

TB.Module.prototype = {
    _shortname: '',
    get shortname() {
        // return name.trim().toLowerCase().replace(' ', '_');
        return this._shortname.length > 0 ? this._shortname : this.name.trim().replace(/\s/g, '');
    },
    set shortname(val) {
        this._shortname = val;
    }
};
}

(function TBinit() {
    window.addEventListener("TBUtilsLoaded", function () {
        $.log("TBObject has TBUtils", false, "TBinit");
        tbobject();

        var event = new CustomEvent("TBObjectLoaded");
        window.dispatchEvent(event);
    });
})();
