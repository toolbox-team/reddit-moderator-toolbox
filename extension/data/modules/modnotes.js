import {Module} from '../tbmodule.js';
import {getModSubs, modsSub} from '../tbcore.js';
import {htmlEncode} from '../tbhelpers.js';
import * as TBApi from '../tbapi.js';
import {actionButton, drawPosition, popup} from '../tbui.js';
import TBListener from '../tblistener.js';

/**
 * An object mapping modnote labels to display colors. All colors are from
 * the default Toolbox usernote type colors, except the HELPFUL_USER label
 * which doesn't have an analogue in Toolbox usernotes.
 * @constant {object}
 */
const labelColors = {
    BOT_BAN: 'black',
    PERMA_BAN: 'darkred',
    BAN: 'red',
    ABUSE_WARNING: 'orange',
    SPAM_WARNING: 'purple',
    SPAM_WATCH: 'fuschia',
    SOLID_CONTRIBUTOR: 'green',
    HELPFUL_USER: 'lightseagreen',
};

/**
 * Creates a mod note badge for the given information.
 * @param {object} data Data associated with the badge
 * @param {string} data.user Name of the relevant user
 * @param {string} data.subreddit Name of the relevant subreddit
 * @param {string} data.label Text shown in the badge if there are no notes
 * @param {object} [data.note] The most recent mod note left on the user
 * @param {number} [data.noteCount] The number of total notes for the user
 * @returns {jQuery} The created badge
 */
function createModNotesBadge ({
    user,
    subreddit,
    label = 'NN',
    note,
    noteCount,
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

    updateModNotesBadge($badge, {
        note,
        noteCount,
    });

    return $badge;
}

/**
 * Updates mod note badges in place with the given information.
 * @param {jQuery} $badge The badge(s) to update
 * @param {object} data Data associated with the badge
 * @param {object} [data.note] The most recent mod note left on the user
 * @param {number} [data.noteCount] The number of total notes for the user
 */
function updateModNotesBadge ($badge, {
    note,
    noteCount,
}) {
    if (!note) {
        $badge.text($badge.attr('data-label'));
        return;
    }

    // The latest note is the first in the array; look up its color
    const noteColor = labelColors[note.user_note_data.label];

    $badge.empty();
    $badge.append(`
        <b style="${noteColor ? `color: ${noteColor}` : ''}">
            ${htmlEncode(note.user_note_data.note)}
        </b>
    `);

    // If there are more mod notes, list how many more
    if (noteCount > 1) {
        $badge.append(`
            <span class="tb-modnote-more-counter">
                    (+${noteCount - 1})
            </span>
        `);
    }
}
/**
 * Creates a mod note popup for the given information.
 * @param {object} data Data associated with the popup
 * @param {string} data.user Name of the relevant user
 * @param {string} data.subreddit Name of the relevant subreddit
 */
function createModNotesPopup ({
    user,
    subreddit,
    notes,
}) {
    const $popup = popup({
        title: `Mod notes for /u/${user} in /r/${subreddit}`,
        tabs: [{
            title: 'All Activity',
            content: `
                <p class="error">loading...</p>
            `,
            footer: actionButton('dab', 'tb-modnote-dab'),
        }],
        cssClass: 'tb-modnote-popup',
    });
    $popup.attr('data-user', user);
    $popup.attr('data-subreddit', subreddit);

    updateModNotesPopup($popup, {
        notes,
    });

    return $popup;
}

function updateModNotesPopup ($popup, {
    notes,
}) {
    const $content = $popup.find('.tb-window-content');
    $content.empty();
    if (!notes) {
        $content.append(`
            <p class="error">
                Error fetching mod notes
            </p>
        `);
        return;
    }

    if (!notes.length) {
        $content.append(`
            <p>
                No notes
            </p>
        `);
        return;
    }

    $content.append($('<pre>').text(JSON.stringify(notes, null, 2)));
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
            $badge.on('click', async clickEvent => {
                // TODO: open popup with more information for this user
                this.info(`clicked badge for /u/${author} in /r/${subreddit}`);

                // Fetch all usernotes for this user
                let notes;
                try {
                    // TODO: store these somewhere persistent so they can be
                    //       added to later if the user wants to load more
                    notes = await TBApi.getModNotes(subreddit, author);
                } catch (error) {
                    self.error(`Error fetching mod notes for /u/${author} in /r/${subreddit}`, error);
                }

                // Create, position, and display popup
                const positions = drawPosition(clickEvent);
                createModNotesPopup({
                    user: author,
                    subreddit,
                    notes,
                })
                    .css({
                        top: positions.topPosition,
                        left: positions.leftPosition,
                    })
                    .appendTo($('body'));
            });
            $badge.appendTo($target);
        }

        // TODO: Use bulk endpoint to fetch multiple users' top notes, see
        //       https://reddit.com/comments/tjfxvt/_/i1kbioo/?context=9
        self.debug(`Fetching mod notes for /u/${author} in /r/${subreddit}`);
        try {
            const notes = await TBApi.getModNotes(subreddit, author);
            self.info(`Got notes for /u/${author} in /r/${subreddit}:`, notes);
            updateModNotesBadge($badge, {
                note: notes.find(note => note.type === 'NOTE'),
                noteCount: notes.length,
            });
        } catch (error) {
            self.error(`Error fetching mod notes for /u/${author} in /r/${subreddit}:`, error);
        }
    });
});
