'use strict';

beforeEach(() => {
    jest.clearAllMocks();
});

window.$ = require('../../extension/data/libs/jquery-3.4.1');

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
