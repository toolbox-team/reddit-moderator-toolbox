/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');
const extensionManifest = require('./extension/manifest.json');

const chromeBuildLocation = path.resolve(__dirname, 'build', `toolbox_v${extensionManifest.version}_chrome.zip`);
const firefoxProfileLocaction = path.resolve(__dirname, 'build', `toolbox_v${extensionManifest.version}_firefox_profile.zip`);

module.exports = {
    src_folders: ['tests/e2e'],
    test_workers: {
        enabled: true,
        workers: 5,
    },
    detailed_output: true,
    live_output: true,
    test_settings: {
        default: {
            selenium_host: process.env.SELENIUM_HOST,
            selenium_port: process.env.SELENIUM_PORT,
            username: process.env.SAUCE_USERNAME,
            access_key: process.env.SAUCE_ACCESS_KEY,
            use_ssl: true,
            globals: {
                waitForConditionTimeout: 10000,
                afterEach (browser, done) {
                    console.log('View results:', `https://saucelabs.com/tests/${browser.capabilities['webdriver.remote.sessionid']}/`);
                    done();
                },
            },
            desiredCapabilities: {
                javascriptEnabled: true,
                public: 'public restricted',
            },
        },
        chrome: {
            desiredCapabilities: {
                browserName: 'chrome',
                version: '70',
                platform: 'Windows 10',
                chromeOptions: {
                    args: ['--no-sandbox'],
                    extensions: [getChromePackage()],
                },
            },
        },
        firefox: {
            desiredCapabilities: {
                browserName: 'firefox',
                version: 'dev',
                firefox_profile: getFirefoxPackage(),
            },
        },
    },
};

function getFirefoxPackage () {
    return fs.readFileSync(firefoxProfileLocaction).toString('base64');
}

function getChromePackage () {
    return fs.readFileSync(chromeBuildLocation).toString('base64');
}
