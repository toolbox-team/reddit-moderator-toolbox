import {Module} from '../tbmodule.js';
import {getModSubs, modsSub} from '../tbcore.js';
import * as TBApi from '../tbapi.js';
import TBListener from '../tblistener.js';

/**
 * Makes an API call to fetch the ID of the named subreddit.
 * @param {string} subreddit The name of the subreddit to fetch
 * @returns {Promise<string | null>} `null` if the ID couldn't be fetched
 */
// TODO: cache results
async function fetchSubredditID (subreddit) {
    try {
        const subredditInfo = await TBApi.aboutSubreddit(subreddit);
        return `t5_${subredditInfo.data.id}`;
    } catch (error) {
        return null;
    }
}

/**
 * Makes an API call to fetch the ID of the named user.
 * @param {*} username The name of the user to fetch
 * @returns {Promise<string | null>} `null` if the ID couldn't be fetched
 */
// TODO: cache results
async function fetchUserID (username) {
    try {
        const userInfo = await TBApi.aboutUser(username);
        return `t2_${userInfo.data.id}`;
    } catch (error) {
        return null;
    }
}

/**
 * Creates a mod note badge for the given information.
 * @param {object} data Data associated with the badge
 * @param {string} data.user Name of the relevant user
 * @param {string} data.userID ID of the relevant user
 * @param {string} data.subreddit Name of the relevant subreddit
 * @param {string} data.subredditID ID of the relevant subreddit
 * @param {string} data.label Text shown in the badge if there are no notes
 */
function createModNotesBadge ({
    user,
    userID,
    subreddit,
    subredditID,
    label = 'NN',
    notes,
}) {
    const $badge = $(`
        <a
            class="tb-bracket-button tb-modnote-badge"
            role="button"
            tabindex="0"
            title="Mod notes for /u/${user} in /r/${subreddit}"
            data-user="${user}"
            data-user-id="${userID}"
            data-subreddit="${subreddit}"
            data-subreddit-id="${subredditID}"
            data-label="${label}"
        >
            ${label}
        </a>
    `);

    // NOTE: Right now this call probably looks useless, but it will be nice
    //       once we have notes cached and we may want to create a badge for
    //       a user/subreddit with pre-cached notes. I'm passing all the
    //       data because I don't know what exactly will be useful later
    updateModNotesBadge($badge, {
        user,
        userID,
        subreddit,
        subredditID,
        notes,
    });

    return $badge;
}

// TODO: actually do some useful display
function updateModNotesBadge ($badge, {
    user,
    userID,
    subreddit,
    subredditID,
    notes,
}) {
    if (!notes || !notes.length) {
        $badge.textContent = $badge.attr('data-label');
        return;
    }

    $badge.empty();
    $badge.append(`
        something dynamically generated from notes array
    `);
}

export default new Module({
    name: 'Mod Notes',
    id: 'ModNotes',
    enabledByDefault: true,
}, function () {
    TBListener.on('author', async e => {
        const subreddit = e.detail.data.subreddit.name;
        const author = e.detail.data.author;

        // Deleted users can't have notes
        if (author === '[deleted]') {
            return;
        }

        // Can't fetch notes in a sub you're not a mod of
        // TODO: What specific permissions are required to fetch notes?
        await getModSubs();
        if (!await modsSub(subreddit)) {
            return;
        }

        // Make API calls to get IDs if we couldn't scrape them from the frontend
        const subredditID = e.detail.data.subreddit.id || await fetchSubredditID(subreddit);
        const authorID = e.detail.data.authorID || await fetchUserID(author);

        // Return early if we don't have the IDs we need
        if (!subredditID) {
            this.error(`Failed to fetch subreddit ID for /r/${subreddit}`);
            return;
        }

        if (!authorID) {
            this.error(`Failed to fetch user ID for /u/${author}`);
        }

        // Display badge for notes if not already present
        const $target = $(e.target);
        let $badge = $target.find('.tb-modnote-badge');
        if (!$badge.length) {
            $badge = createModNotesBadge({
                user: author,
                userID: authorID,
                subreddit,
                subredditID,
            });
            $badge.on('click', () => {
                // TODO: open popup with more information for this user
                this.info(`clicked badge for /u/${author} in /r/${subreddit}`);
            });
            $badge.appendTo($target);
        }

        // TODO:
        // - cache these calls
        // - update *all* badges for this user/subreddit when the cached call completes
        this.debug(`Fetching mod notes for /u/${author} (${authorID}) in /r/${subreddit} (${subredditID})`);
        try {
            const notes = await TBApi.getModNotes(subredditID, authorID);
            this.info(`Got notes for /u/${author} in /r/${subreddit}:`, notes);
            updateModNotesBadge($badge, {subredditID, authorID, notes});
        } catch (error) {
            this.error(`Error fetching mod notes for /u/${author} in /r/${subreddit}:`, error);
            debugger; // FIXME: remove before merge, this is just me being too lazy for breakpoints
        }
    });
});
