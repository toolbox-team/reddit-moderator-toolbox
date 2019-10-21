'use strict';
require('../../../extension/data/modules/support');

describe('support.js', () => {
    it('calls TB.Module', () => {
        window.TB = {
            Module: jest.fn(),
            register_module: jest.fn(),
        };
        window.TB.Module.mockImplementation(() => ({
            shortname: 'support',
            settings: {
                enabled: {
                    default: false,
                    hidden: false,
                },
            },
        }));
        const event = new CustomEvent('TBModuleLoaded');
        window.dispatchEvent(event);
        expect(window.TB.Module).toHaveBeenCalled();
    });
});
