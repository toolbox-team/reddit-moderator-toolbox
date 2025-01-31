// Handling for writing Toolbox settings into extension storage.
//
// The entire settings object is stored as a single JSON value, so in order to
// update a single setting, we need to read the entire object, update the
// setting in our copy of the object, and then write back the entire object.
// However, because reading and writing extension storage are asynchronous
// operations, doing this naively would result in conflicts if two things wanted
// to change settings at the same time - two consumers could both read the state
// before the other has time to commit an update, leading to one update being
// "forgotten" by the other. We get around this by introducing a mutex for
// writing to setting storage. Content scripts request writes by messaging the
// background page, so writes from all sources are governed by a single mutex.

import {Mutex} from 'async-mutex';
import browser from 'webextension-polyfill';

// these are safe to import because they're implemented purely in terms of
// `browser.storage`, with no reliance on state held in the content script
import {messageHandlers} from '../messageHandling';

/** Mutex governing writes to the `tbsettings` key of `browser.storage.local` */
const settingsWriteMutex = new Mutex();

/** Reads settings from storage */
const getSettings = async () => (await browser.storage.local.get('tbsettings')).tbsettings;

/** Writes a full settings object into storage */
const writeSettings = newSettings => browser.storage.local.set({tbsettings: newSettings});

// Updates the value(s) of one or more settings.
//
// NOTE: Messages are serialized to JSON, so it's not possible for a key to be
//       present in a message object but have its value be `undefined` (which is
//       how we typically represent the operation of removing a setting's key
//       from storage). I don't want to use `null` for that instead, because
//       there's lots of places in the storage code that freak out if they see
//       `null`s as values and I don't want to cause issues with whatever's
//       going on there. So we do it the slightly janky way: two message fields,
//       one object mapping keys to new values, and one array of deleted keys.
messageHandlers.set('tb-update-settings', async ({
    updatedSettings,
    deletedSettings,
}) => {
    await settingsWriteMutex.runExclusive(async () => {
        const settings = await getSettings();
        for (const [key, value] of Object.entries(updatedSettings ?? {})) {
            if (value == null) {
                continue;
            }
            settings[key] = value;
        }
        for (const key of deletedSettings ?? []) {
            delete settings[key];
        }
        await writeSettings(settings);
    });
});

// Overwrites the entire settings object.
messageHandlers.set('tb-overwrite-all-settings', async ({newSettings}) => {
    await settingsWriteMutex.runExclusive(async () => {
        await writeSettings(newSettings);
    });
});
