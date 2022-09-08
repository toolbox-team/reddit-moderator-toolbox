import {messageHandlers} from '../messageHandling';

messageHandlers.set('tb-reload', () => {
    browser.runtime.reload();
});
