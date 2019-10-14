/* global messageHandlers */
'use strict';

messageHandlers.set('tb-reload', () => {
    browser.runtime.reload();
});
