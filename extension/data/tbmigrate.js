// This should only be part of toolbox as long as v4.x and v3.x can be installed next to each other.
// The only goal is to try and make sure that if v4 is active v3 will not activate on the same page.
// In order to do that we load this script first, do a quick check if v4 is going to activate and set a session storage key.
const start = performance.now();
let previousName = 'start';
let previous = start;

function profileResults (name, number) {
    console.groupCollapsed('Profiling thing:', name, number);
    if (name === 'start') {
        console.log('   ');
        console.log('performance start:', number);
        console.log('--------------------------');
        console.log('ms:', start);
        console.log('sec:', Math.round(start / 1000));
    } else {
        const secs = Math.round((number - start) / 1000);
        const secsPrevious = Math.round((number - previous) / 1000);
        console.log('   ');
        console.log(`Profile: ${name}`);
        console.log('--------------------------');
        console.log('ms:', number - start);
        console.log('sec:', secs);
        console.log(`Profile: ${name} since ${previousName}`);
        console.log('---');
        console.log('ms:', number - previous);
        console.log('sec:', secsPrevious);
        console.log('   ');

        previousName = name;
        previous = number;
    }
    console.groupEnd();
}

profileResults('start', start);

// Let's do some housecleaning to make sure leftovers of previous versions are no longer lingering.
Object.keys(localStorage)
    .forEach(key => {
        if (/^(TBCachev4.|Toolboxv4.)/.test(key)) {
            localStorage.removeItem(key);
        }
    });

if (location.host === 'mod.reddit.com') {
    sessionStorage.setItem('v4active', 'true');
} else {
    chrome.storage.local.get('tbsettings', sObject => {
        if (sObject.tbsettings && sObject.tbsettings['Toolboxv4.oldreddit.enabled']) {
            sessionStorage.setItem('v4active', 'true');
        } else {
            sessionStorage.removeItem('v4active');
        }
    });
}
window.addEventListener('unload', () => {
    sessionStorage.removeItem('v4active');
});

window.addEventListener('TbMigrationActive', event => {
    console.log('Migration event has been fired.');

    const migrationType = event.detail.migrationType;
    const $body = $('body');

    let migrationInstructions;

    if (migrationType === 'wikiActivated') {
        let storeURL;

        // We assume that if it isn't firefox it is a chrome derrived browser.
        if (TBUtils.browser === 'firefox') {
            storeURL = 'https://addons.mozilla.org/en-US/firefox/addon/reddit-moderator-toolbox/';
        } else {
            storeURL = 'https://chrome.google.com/webstore/detail/moderator-toolbox-for-red/jhjpjhhkcbkmgdkahnckfboefnkgghpo';
        }

        migrationInstructions = `
        <p>You are using an outdated test version of toolbox which has been disabled. Not to worry you can keep using toolbox. You just have to switch to the stable version. Simply follow these steps:</p>
        <ol>
        <li0>Optional: Export your current toolbox settings to a <strong>private</strong> subreddit with the functionality below.</li>
        <li>Install the new toolbox version through <a href="${storeURL}" target="_blank">this link</a>.</li>
        <li>Optional: Import your previously exported settings in the newly installed toolbox. <a href="https://www.reddit.com/r/toolbox/wiki/docs/backup_restore_settings" target="_blank">Instructions in this wiki article</a>.</li>
        <li>Make sure to uninstall this version of toolbox. <a href="https://www.reddit.com/r/toolbox/wiki/docs/uninstalling_toolbox_alpha" target="_blank">Click here for instructions on how to do this</a>. This will also make this message go away.</li>
        </ol>
        `;
    }

    if (migrationType === 'sessionStorageActivated') {
        migrationInstructions = `
        <p>
            You have an outdated test version of toolbox installed next to the stable version of toolbox. This test version has been disable to prevent conflicts.
        </p>
        <p>
            You should uninstall this test version. <a href="https://www.reddit.com/r/toolbox/wiki/docs/uninstalling_toolbox_alpha" target="_blank">Click here for instructions on how to do this</a>. This will also make this message go away.
        </p>
        <p>
            <strong>Before you do so</strong> you can export the settings of the test version of toolbox to a private subreddit with the functionality below. You can then import them into the stable version of toolbox. <a href="https://www.reddit.com/r/toolbox/wiki/docs/backup_restore_settings" target="_blank">Instructions in this wiki article</a>.
        </p>
        `;
    }

    const migrationInfoPopupContent = `
    <div id="tb-migration-info">
            ${migrationInstructions}
            <hr>
            <p>
                Backup/export toolbox settings to a wiki page:
            </p>
            <p>
                <input type="text" class="tb-input" name="settingssub" placeholder="Fill in a private subreddit where you are mod...">
                <input class="tb-migrate-export tb-action-button" type="button" value="backup">
            </p>

    </div>`;

    const $popup = TBui.popup(
        'Toolbox migration',
        [
            {
                title: 'Migrate',
                tooltip: 'Migrate',
                content: migrationInfoPopupContent,
                footer: '',
            },
        ],
        '',
        'migrate-popup',
        {
            draggable: false,
        }
    ).appendTo($body)
        .css({
            'right': '100px',
            'top': '100px',
            'max-width': '600px',
            'display': 'block',
            'position': 'fixed',
        });

    $popup.on('click', '.tb-migrate-export', () => {
        let subreddit = $popup.find('input[name=settingssub]').val();
        subreddit = TBUtils.cleanSubredditName(subreddit);

        TBUtils.exportSettings(subreddit, success => {
            if (!success) {
                TBui.textFeedback('Something went wrong, your settings have not been saved.', TBui.FEEDBACK_NEGATIVE, 5000);
                return;
            } else {
                TBui.textFeedback('Settings exported!', TBui.FEEDBACK_POSITIVE, 2000);
            }
        });
    });
});
