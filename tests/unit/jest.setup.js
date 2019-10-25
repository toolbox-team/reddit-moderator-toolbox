'use strict';

// Mock module and register_module
window.TB = {
    // What's returned when calling new TB.Module('name')
    Module: jest.fn().mockImplementation(() => ({
        shortname: 'support',
        settings: {
            enabled: {
                default: false,
                hidden: false,
            },
        },
    })),
    register_module: jest.fn(),
};
