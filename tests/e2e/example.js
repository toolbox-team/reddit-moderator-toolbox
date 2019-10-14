/* eslint-env node */
'use strict';
module.exports = {
    'This is an example test': browser => {
        browser
            .url('https://old.reddit.com/')
            .waitForElementVisible('#header', 5000)
            .setValue('[name="user"]', 'creesch_bot')
            .setValue('[name="passwd"]', process.env.TEST_PASSWORD)
            .click('#login_login-main .submit button[type="submit"]')
            .waitForElementVisible('#tb-bottombar', 5000)
            .end();
    },
};
