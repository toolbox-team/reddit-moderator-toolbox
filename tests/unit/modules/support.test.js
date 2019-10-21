'use strict';
require('../../../extension/data/modules/support');

describe('support.js', () => {
    it('calls TB.Module', () => {
        // Mock module and register_module
        window.TB = {
            Module: jest.fn(),
            register_module: jest.fn(),
        };
        // What's returned when calling new TB.Module('name')
        window.TB.Module.mockImplementation(() => ({
            shortname: 'support',
            settings: {
                enabled: {
                    default: false,
                    hidden: false,
                },
            },
        }));
        // Dispatch an event to call the function
        const event = new CustomEvent('TBModuleLoaded');
        window.dispatchEvent(event);
        expect(window.TB.Module).toHaveBeenCalledWith('Support Module');
    });
});
