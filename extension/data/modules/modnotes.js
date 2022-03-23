import {Module} from '../tbmodule.js';
import {getModSubs, modsSub} from '../tbcore.js';
import {htmlEncode} from '../tbhelpers.js';
import * as TBApi from '../tbapi.js';
import TBListener from '../tblistener.js';

/**
 * Creates a mod note badge for the given information.
 * @param {object} data Data associated with the badge
 * @param {string} data.user Name of the relevant user
 * @param {string} data.subreddit Name of the relevant subreddit
 * @param {string} data.label Text shown in the badge if there are no notes
 */
function createModNotesBadge ({
    user,
    subreddit,
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
            data-subreddit="${subreddit}"
            data-label="${label}"
        >
    `);

    // NOTE: Right now this call probably looks useless, but it will be nice
    //       once we have notes cached and we may want to create a badge for
    //       a user/subreddit with pre-cached notes. I'm passing all the
    //       data because I don't know what exactly will be useful later
    updateModNotesBadge($badge, {
        user,
        subreddit,
        notes,
    });

    return $badge;
}

// TODO: actually do some useful display
function updateModNotesBadge ($badge, {
    user,
    subreddit,
    notes,
}) {
    if (!notes || !notes.length) {
        $badge.text($badge.attr('data-label'));
        return;
    }

    $badge.empty();

    // Get only the notes left by mods with custom text
    const manualNotes = notes.filter(note => note.type === 'NOTE');

    if (!manualNotes.length) {
        $badge.append('nothing');
        return;
    }

    $badge.append(`
        <span class="tb-modnote-preview">
            ${htmlEncode(manualNotes[0].user_note_data.note)}
        </span>
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

        // Return early if we don't have the things we need
        if (!e.detail.data.subreddit.name || !e.detail.data.author) {
            return;
        }

        // Display badge for notes if not already present
        const $target = $(e.target);
        let $badge = $target.find('.tb-modnote-badge');
        if (!$badge.length) {
            $badge = createModNotesBadge({
                user: e.detail.data.author,
                subreddit: e.detail.data.subreddit.name,
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
        self.debug(`Fetching mod notes for /u/${author} in /r/${subreddit}`);
        try {
            const notes = await TBApi.getModNotes(subreddit, author);
            self.info(`Got notes for /u/${author} in /r/${subreddit}:`, notes);
            updateModNotesBadge($badge, {subreddit, author, notes});
        } catch (error) {
            this.error(`Error fetching mod notes for /u/${author} in /r/${subreddit}:`, error);
            debugger; // FIXME: remove before merge, this is just me being too lazy for breakpoints
        }
    });
});
