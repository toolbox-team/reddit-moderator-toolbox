import browser from 'webextension-polyfill';

import {purifyObject} from './purify';

/** A flat object which holds all Toolbox's settings. */
// TODO: we can do better than this probably
export interface SettingsObject {
    [key: string]: any;
}

/** Retrieves the current settings object directly from extension storage. */
export async function getSettings () {
    const {tbsettings} = await browser.storage.local.get('tbsettings');
    return (tbsettings || {}) as SettingsObject;
}

/**
 * Writes the given settings object into extension storage.
 * @param newSettings A full settings object to write
 */
export async function writeSettings (newSettings: SettingsObject) {
    await browser.runtime.sendMessage({
        action: 'tb-overwrite-all-settings',
        newSettings,
    });
}

/**
 * Updates the values of multiple settings.
 * @param settings Object mapping setting keys to their new values. Keys not
 * present in this object will retain their stored values. Keys of this object
 * whose values are `undefined` will be removed from storage. `null` is an
 * invalid value for settings and will be ignored.
 */
export async function updateSettings (settings: Partial<SettingsObject>) {
    await browser.runtime.sendMessage({
        action: 'tb-update-settings',
        updatedSettings: Object.fromEntries(Object.entries(settings).filter(([_key, value]) => value != null)),
        deletedSettings: Object.keys(settings).filter(key => settings[key] === undefined),
    });
}

/**
 * Returns the value of a setting, falling back to a given value if the setting
 * has not been set.
 * @param moduleID The ID of the module the setting belongs to
 * @param setting The name of the setting
 * @param defaultVal The value returned if the setting is not set
 */
export async function getSettingAsync (moduleID: string, setting: string, defaultVal: any = undefined) {
    const settings = await getSettings();
    const value = settings[`Toolbox.${moduleID}.${setting}`];

    if (value == null) {
        return defaultVal;
    }
    return value;
}

/**
 * Sets a setting to a new value.
 * @param moduleID The ID of the module the setting belongs to
 * @param setting The name of the setting
 * @param value The new value of the setting
 */
export const setSettingAsync = (moduleID: string, setting: string, value: any) =>
    updateSettings({
        [`Toolbox.${moduleID}.${setting}`]: value,
    });

/**
 * Generates an anonymized version of the settings object, with some sensitive
 * settings omitted and other settings represented differently.
 * @returns {Promise<Record<string, unknown>>}
 */
export const getAnonymizedSettings = async () => {
    const sObject = await getSettings();

    // in creesch's words: "because we are paranoid"
    purifyObject(sObject);

    // settings we delete
    delete sObject['Toolbox.Achievements.lastSeen'];
    delete sObject['Toolbox.Achievements.last_seen'];
    delete sObject['Toolbox.Bagels.bagelType'];
    delete sObject['Toolbox.Bagels.enabled'];
    delete sObject['Toolbox.Modbar.customCSS'];
    delete sObject['Toolbox.ModMail.lastVisited'];
    delete sObject['Toolbox.ModMail.replied'];
    delete sObject['Toolbox.ModMail.subredditColorSalt'];
    delete sObject['Toolbox.Notifier.lastChecked'];
    delete sObject['Toolbox.Notifier.lastSeenModmail'];
    delete sObject['Toolbox.Notifier.lastSeenUnmoderated'];
    delete sObject['Toolbox.Notifier.modmailCount'];
    delete sObject['Toolbox.Notifier.modqueueCount'];
    delete sObject['Toolbox.Notifier.modqueuePushed'];
    delete sObject['Toolbox.Notifier.unmoderatedCount'];
    delete sObject['Toolbox.Notifier.unreadMessageCount'];
    delete sObject['Toolbox.Notifier.unreadPushed'];
    delete sObject['Toolbox.QueueTools.kitteh'];
    delete sObject['Toolbox.RReasons.customRemovalReason'];
    delete sObject['Toolbox.Snoo.enabled'];
    delete sObject['Toolbox.Storage.settings'];
    delete sObject['Toolbox.Utils.echoTest'];
    delete sObject['Toolbox.Utils.tbDevs'];

    // these settings we want the length of the val.
    sObject['Toolbox.Comments.highlighted'] = undefindedOrLength(sObject['Toolbox.Comments.highlighted']);
    sObject['Toolbox.ModButton.savedSubs'] = undefindedOrLength(sObject['Toolbox.ModButton.savedSubs']);
    sObject['Toolbox.ModMail.botsToFilter'] = undefindedOrLength(sObject['Toolbox.ModMail.botsToFilter']);
    sObject['Toolbox.ModMail.filteredSubs'] = undefindedOrLength(sObject['Toolbox.ModMail.filteredSubs']);
    sObject['Toolbox.Modbar.shortcuts'] = undefindedOrLength(sObject['Toolbox.Modbar.shortcuts']);
    sObject['Toolbox.QueueTools.botCheckmark'] = undefindedOrLength(sObject['Toolbox.QueueTools.botCheckmark']);
    sObject['Toolbox.Utils.seenNotes'] = undefindedOrLength(sObject['Toolbox.Utils.seenNotes']);

    // these settings we just want to know if they are populated at all
    sObject['Toolbox.Achievements.save'] = undefindedOrTrue(sObject['Toolbox.Achievements.save']);
    sObject['Toolbox.ModButton.lastAction'] = undefindedOrTrue(sObject['Toolbox.ModButton.lastAction']);
    sObject['Toolbox.Modbar.lastExport'] = undefindedOrTrue(sObject['Toolbox.Modbar.lastExport']);
    sObject['Toolbox.Notifier.modSubreddits'] = undefindedOrTrue(sObject['Toolbox.Notifier.modSubreddits']);
    sObject['Toolbox.Notifier.modmailSubreddits'] = undefindedOrTrue(
        sObject['Toolbox.Notifier.modmailSubreddits'],
    );
    sObject['Toolbox.Notifier.unmoderatedSubreddits'] = undefindedOrTrue(
        sObject['Toolbox.Notifier.unmoderatedSubreddits'],
    );
    sObject['Toolbox.PNotes.noteWiki'] = undefindedOrTrue(sObject['Toolbox.PNotes.noteWiki']);
    sObject['Toolbox.QueueTools.queueCreature'] = undefindedOrTrue(sObject['Toolbox.QueueTools.queueCreature']);
    sObject['Toolbox.QueueTools.subredditColorSalt'] = undefindedOrTrue(
        sObject['Toolbox.QueueTools.subredditColorSalt'],
    );
    sObject['Toolbox.Utils.settingSub'] = undefindedOrTrue(sObject['Toolbox.Utils.settingSub']);

    return sObject;

    function undefindedOrLength (setting: any) {
        return setting === undefined ? 0 : setting.length;
    }

    function undefindedOrTrue (setting: any) {
        if (!setting) {
            return false;
        }
        if (setting.length > 0) {
            return true;
        }
    }
};
