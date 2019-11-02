'use strict';
require('../../../extension/data/modules/support');
const {mockWindow} = require('../mocksTBCore');

describe('support.js', () => {
    beforeAll(() => {
        Object.assign(window, mockWindow);
    });

    it('calls TB.Module with "Support Module"', () => {
        const event = new CustomEvent('TBModuleLoaded');
        window.dispatchEvent(event);
        expect(window.TB.Module).toHaveBeenCalledWith('Support Module');
    });
    it('sets name to "support"', () => {
        const event = new CustomEvent('TBModuleLoaded');
        window.dispatchEvent(event);
        expect(window.TB.Module.mock.results[0].value.shortname).toEqual('support');
    });
    it('sets name to enable.default to true', () => {
        const event = new CustomEvent('TBModuleLoaded');
        window.dispatchEvent(event);
        expect(window.TB.Module.mock.results[0].value.settings.enabled.default).toBeTruthy();
    });
    it('sets name to enabled.hidden to true', () => {
        const event = new CustomEvent('TBModuleLoaded');
        window.dispatchEvent(event);
        expect(window.TB.Module.mock.results[0].value.settings.enabled.hidden).toBeTruthy();
    });
    describe('init()', () => {
        it('calls TBCore.debugInformation()', () => {
            const event = new CustomEvent('TBModuleLoaded');
            window.dispatchEvent(event);
            window.TB.Module.mock.results[0].value.init();
            expect(window.TBCore.debugInformation).toHaveBeenCalledTimes(1);
        });
        it('updates textArea with debug info on r/toolbox link submit', () => {
            window.history.replaceState({}, 'Page Title', '/r/toolbox/submit');

            const textArea = 'test value';
            document.body.innerHTML =
                `<div class="submit content usertext-edit md-container">  
                    <textarea>${textArea}</textarea>
                    <button class="btn" name="submit" />
                </div>`;

            const event = new CustomEvent('TBModuleLoaded');
            window.dispatchEvent(event);
            window.TB.Module.mock.results[0].value.init();

            $('.submit.content .btn[name="submit"]').click();

            const textAreaResult = textArea + window.TBHelpers.template.mock.results[0].value;
            expect($('.usertext-edit.md-container textarea').val()).toEqual(textAreaResult);
        });
        it('updates comment textArea with debug info when clicking debug button on r/toolbox when tb-usertext-buttons exists', () => {
            window.history.replaceState({}, 'Page Title', '/r/toolbox/comments');

            const textArea = 'test value';
            document.body.innerHTML =
                `<div class="submit content usertext-edit usertext-edit md-container">
                    <div class="usertext-buttons md">  
                        <textarea>${textArea}</textarea>
                        <button class="save" name="submit" />
                        <div class="tb-usertext-buttons"></div>
                    </div>
                </div>`;

            const event = new CustomEvent('TBModuleLoaded');
            window.dispatchEvent(event);
            window.TB.Module.mock.results[0].value.init();

            $('div.tb-insert-debug').click();
            const textAreaResult = textArea + window.TBHelpers.template.mock.results[0].value;
            expect($('textarea').val()).toEqual(textAreaResult);
        });
        it('updates comment textArea with debug info when clicking debug button on r/toolbox when tb-usertext-buttons does not exists', () => {
            window.history.replaceState({}, 'Page Title', '/r/toolbox/comments');
            const textArea = 'test value';
            document.body.innerHTML =
                `<div class="submit content usertext-edit usertext-edit md-container">
                    <div class="usertext-buttons md">  
                        <textarea>${textArea}</textarea>
                        <button class="save" name="submit" />
                        <div class="status"></div>
                    </div>
                </div>`;

            const event = new CustomEvent('TBModuleLoaded');
            window.dispatchEvent(event);
            window.TB.Module.mock.results[0].value.init();
            $('div.tb-insert-debug').click();
            const textAreaResult = textArea + window.TBHelpers.template.mock.results[0].value;
            expect($('textarea').val()).toEqual(textAreaResult);
        });
    });
});
