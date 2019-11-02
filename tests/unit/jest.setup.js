'use strict';

window.$ = require('../../extension/data/libs/jquery-3.4.1');
Object.assign(window.$, {
    log: jest.fn(),
});

beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = undefined;
    $('body').off();
});
