function tbobject() {

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

            if (module.setting('enabled')) {
                module.init();
            }
        }
    },

    build_settings: function () {
        var tabs = {};

        for (m in this.modules) {
            var module = this.modules[m];
            tabs[module.shortname] = module.config;
        }

        return tabs;
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

    // Settings and Defaults
    // PRIVATE: default values for module settings
    this.settings_defaults = [];
    this.settings_defaults['enabled'] = false;

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
            if (this.settings_defaults.hasOwnProperty(name)) { // note: .indexOf(name) doesn't work here, not sure exactly why
                // we know what the default should be
                return Toolbox.utils.getSetting(this.shortname, name, this.settings_defaults[name]);
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

    // Configuration
    this.config = {
        title: this.name,
        body: '',
        help: ''
    }

}


// This needs to be called last. There's probably some clever way to do it, but I haven't figured it out.
// Toolbox.init();

}

// Add script to page
(function () {
    var s = document.createElement('script');
    s.textContent = "(" + tbobject.toString() + ')();';
    document.head.appendChild(s);
})();