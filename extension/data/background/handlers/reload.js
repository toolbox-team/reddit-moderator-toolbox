import browser from 'webextension-polyfill';

import {messageHandlers} from '../messageHandling';

messageHandlers.set('tb-reload', () => {
    browser.runtime.reload();
});
