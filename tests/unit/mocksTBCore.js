'use strict';

// Mock module and register_module
const TB = {
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
module.exports.TB = TB;

const debugInformationField = jest.fn().mockReturnValue('debugInfoField');
const TBCore = {
    debugInformation: jest.fn().mockReturnValue(debugInformationField),
};
module.exports.TBCore = TBCore;

const TBHelpers = {
    template: jest.fn().mockReturnValue('test response'),
};
module.exports.TBHelpers = TBHelpers;

const mockWindow = {
    TB,
    TBCore,
    TBHelpers,
};
module.exports.mockWindow = mockWindow;
