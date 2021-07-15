import {Module} from '../tbmodule.js';

const self = new Module({
    name: 'General Settings',
    id: 'GenSettings',
    enabledByDefault: true,
    settings: [
        {
            id: 'nativeNotifications',
            type: 'boolean',
            default: true,
            description: 'Display native operating system notifications rather than in-page notifications',
        },
        {
            id: 'onlyshowInhover',
            type: 'boolean',
            default: true,
            advanced: false,
            description: 'Only show user related buttons (mod, history, usernotes) in the hover card',
        },
        {
            id: 'contextMenuLocation',
            type: 'selector',
            default: 'left',
            values: ['left', 'right'],
            advanced: false,
            description: 'Side of the screen the context menu is shown',
        },
        {
            id: 'contextMenuAttention',
            type: 'selector',
            default: 'open',
            values: ['open', 'fade', 'none'],
            advanced: false,
            description: 'Select what effect the context menu uses to show that new items are available',
        },
        {
            id: 'contextMenuClick',
            type: 'boolean',
            default: false,
            advanced: false,
            description: 'Make the context menu only open when you click on it',
        },
    ],
}, () => {
    // Do nothing - this module is just a container for settings
});

// This controls settings for multiple modules, so we sort it outside the
// module list in the settings window
self.sort = {
    location: 'beforeModules',
    order: 2, // below core settings, above toggle modules
};

export default self;
