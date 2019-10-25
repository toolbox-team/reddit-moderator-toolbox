'use strict';
window.$ = require('../../extension/data/libs/jquery-3.4.1');

beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = undefined;
    $('body').off();
});

// Mock module and register_module
window.TB = {
    // What's returned when calling new TB.Module('name')
    Module: jest.fn().mockImplementation(() => ({
        shortname: 'support',
        settings: {
            enabled: {
                default: null,
                hidden: null,
            },
        },
        log: jest.fn(),
    })),
    register_module: jest.fn(),
};

const debugInformationField = jest.fn().mockReturnValue('debugInfoField');
window.TBCore = {
    debugInformation: jest.fn().mockReturnValue(debugInformationField),
};

window.TBHelpers = {
    template: jest.fn().mockReturnValue('test response'),
};
