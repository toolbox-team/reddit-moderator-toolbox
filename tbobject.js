(function tbobject() {

Toolbox = {
    utils: TBUtils,
    version: '2.0.1',

    modules: {},

    register_module: function(module) {
        this.modules[module.shortname] = module;
    },

    init: function () {
        // call every module's init() method on page load
        for (m in this.modules) {
            var module = this.modules[m];

            // Don't do anything with beta modules unless beta mode is enabled
            // Need Toolbox.setting() call for non-module settings
            // if (!Toolbox.setting('betamode') && module.setting('betamode')) {
            if (!Toolbox.utils.getSetting('Utils', 'betaMode', false) && module.setting('betamode')) {
                // skip this module entirely
                continue;
            }

            // lock 'n load
            if (module.setting('enabled')) {
                module.init();
            }

        }
    },

    injectSettings: function () {
        for (m in this.modules) {
            var module = this.modules[m];

            // Don't do anything with beta modules unless beta mode is enabled
            // Need Toolbox.setting() call for non-module settings
            // if (!Toolbox.setting('betamode') && module.setting('betamode')) {
            if (!Toolbox.utils.getSetting('Utils', 'betaMode', false) && module.setting('betamode')) {
                // skip this module entirely
                continue;
            }

            // build and inject our settings tab

            var $tab = $('<a href="javascript:;" class="tb-window-content-'+module.shortname.toLowerCase()+'">'+module.name+'</a>'),
                $settings = $('<div class="tb-window-content-'+module.shortname.toLowerCase()+'" style="display: none;"><div class="tb-help-main-content"></div></div>');

            for (setting in module.settings) {
                if (setting == "enabled") {
                    // enabled is special
                    continue;
                }

                var options = module.settings[setting];

                // if (!options.visible) {
                //     // don't show hidden settings
                //     continue;
                // }

                var $setting = $('<p></p>');

                switch (options.type) {
                    case "boolean":
                        $setting.append($('<label><input type="checkbox" name="'+module.shortname+'-'+setting+'"'+(module.setting(setting) ? ' checked="checked"' : '')+'>'+options.title+'</label>'));
                        break;
                    case "text":
                        $setting.append(options.title+':<br />');
                        $setting.append($('<input type="'+options.type+'" value="'+module.setting(setting)+'">'));
                        break;
                    case "number":
                        $setting.append(options.title+': <input type="'+options.type+'" value="'+module.setting(setting)+'">');
                        break;
                    default:
                        // what in the world would we do here?
                        break;
                }

                $settings.append($setting);

            }

            console.log($tab);
            console.log($settings);
            $('.tb-settings .tb-window-tabs').append($tab);
            $('.tb-settings .tb-window-content').append($settings);
        }
    }
};

// Prototype for all Toolbox modules
Toolbox.TBModule = function (name, version) {
    // PUBLIC: Module Metadata
    this.name = name;
    this.version = version;
    this.__defineGetter__('shortname', function () {
        // return name.trim().toLowerCase().replace(' ', '_');
        return name.trim().replace(' ', '');
    });

    this.settings = {
        "enabled": {
            "type": "checkbox", // just an example, "enabled" is a special setting
            "default": false,
            "title": "Enable this module." // just an example
        }
    };

    // PUBLIC: settings interface
    this.setting = function (name, value) {
        value = (value !== undefined) ? value : null;

        // are we setting or getting?
        if (value) {
            // setting
            return Toolbox.utils.setSetting(this.shortname, name, value);
        } else {
            // getting
            // do we have a default?
            if (this.settings.hasOwnProperty(name)) {
                // we know what the default should be
                return Toolbox.utils.getSetting(this.shortname, name, this.settings[name]["default"])
            } else {
                // getSetting defaults to null for default value
                return Toolbox.utils.getSetting(this.shortname, name);
            }
        }
    };

    // PUBLIC: placeholder init(), just in case
    this.init = function () {
        // pass
    }
}


// This needs to be called last. There's probably some clever way to do it, but I haven't figured it out.
// Toolbox.init();

})();