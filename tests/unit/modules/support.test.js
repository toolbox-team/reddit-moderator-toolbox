'use strict';
require('../../../extension/data/modules/support');

describe('support.js', () => {
    it('calls TB.Module', () => {
        // Dispatch an event to call the function
        const event = new CustomEvent('TBModuleLoaded');
        window.dispatchEvent(event);
        expect(window.TB.Module).toHaveBeenCalledWith('Support Module');
    });
});
