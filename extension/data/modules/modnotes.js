import $ from 'jquery';

import {Module} from '../tbmodule.js';
import {link, isModSub, isNewModmail} from '../tbcore.js';
import {escapeHTML, htmlEncode} from '../tbhelpers.js';
import * as TBApi from '../tbapi.js';
import {
    drawPosition,
    FEEDBACK_NEGATIVE,
    FEEDBACK_POSITIVE,
    icons,
    pagerForItems,
    popup,
    textFeedback,
} from '../tbui.js';
import TBListener from '../tblistener.js';

/** The maximum number of entries in the parent fullnames cache. */
const PARENT_FULLNAMES_CACHE_MAX_SIZE = 10000;

/**
 * An object mapping modnote types to human-friendly display names.
 * @constant {object}
 */
// NOTE: values of this object are not escaped before being inserted in HTML
const typeNames = {
    NOTE: 'Note',
    APPROVAL: 'Approve',
    REMOVAL: 'Remove',
    BAN: 'Ban',
    MUTE: 'Mail Mute',
    INVITE: 'Invite',
    SPAM: 'Spam',
    CONTENT_CHANGE: 'Update Post',
    MOD_ACTION: 'Mod Action',
};

/**
 * An object mapping modnote labels to display colors. All colors are from
 * the default Toolbox usernote type colors, except the HELPFUL_USER label
 * which doesn't have an analogue in Toolbox usernotes.
 * @constant {object}
 */
// NOTE: values of this object are not escaped before being inserted in HTML
const labelColors = {
    BOT_BAN: 'black',
    PERMA_BAN: 'darkred',
    BAN: 'red',
    ABUSE_WARNING: 'orange',
    SPAM_WARNING: 'purple',
    SPAM_WATCH: 'fuchsia',
    SOLID_CONTRIBUTOR: 'green',
    HELPFUL_USER: 'lightseagreen',
};

/**
 * An object mapping modnote lavels to human-friendly display names.
 * @constant {object}
 */
// NOTE: values of this object are not escaped before being inserted in HTML
const labelNames = {
    BOT_BAN: 'Bot Ban',
    PERMA_BAN: 'Permaban',
    BAN: 'Ban',
    ABUSE_WARNING: 'Abuse Warning',
    SPAM_WARNING: 'Spam Warning',
    SPAM_WATCH: 'Spam Watch',
    SOLID_CONTRIBUTOR: 'Solid Contributor',
    HELPFUL_USER: 'Helpful User',
};

// A queue of users and subreddits whose latest note will be fetched in the next
// bulk call, alongside the associated resolve and reject functions so we can
// pass the individual results back to their callers; used by `getLatestModNote`
let pendingLatestNoteRequests = [];

// The ID of the timeout for performing the bulk API request; used by
// `getLatestModNote` to debounce the request
let fetchLatestNotesTimeout;

/**
 * Fetches the most recent mod note on the given user in the given subreddit.
 * @param {string} subreddit The name of the subreddit
 * @param {string} user The name of the user
 * @returns {Promise} Resolves to a note object or `null`, or rejects an error
 */
function getLatestModNote (subreddit, user) {
    return new Promise((resolve, reject) => {
        // Add this user/subreddit to the queue to be included in the next call,
        // alongside this promise's resolve and reject functions so we can pass
        // the result back to the caller
        pendingLatestNoteRequests.push({
            subreddit,
            user,
            resolve,
            reject,
        });

        // Each time this function is called, we set a timeout to process the
        // queue 500ms later. However, if the function is called again in that
        // time, that should be cancelled and rescheduled for 500ms after the
        // later call.

        // Cancel any existing timeout
        clearTimeout(fetchLatestNotesTimeout);
        fetchLatestNotesTimeout = null;

        // If we have 500 users/subs queued, that's the max the API can handle
        // at once, so process the queue now rather than waiting longer
        if (pendingLatestNoteRequests.length === 500) {
            processQueue();
            return;
        }

        // Otherwise, set a timeout to process the queue in 500ms
        fetchLatestNotesTimeout = setTimeout(processQueue, 500);
    });

    // This function executes the API request to fetch the latest note for all
    // the users/subreddits queued, and distributes results (or errors) to their
    // corresponding callers.
    async function processQueue () {
        // Store a copy of the queue as it is right now, then immediately clear
        // the queue, so additional requests can be queued for the next batch
        // while we handle the current batch
        const queuedRequests = pendingLatestNoteRequests;
        pendingLatestNoteRequests = [];

        try {
            // The API takes separate arrays of subs and users, so build those
            const subreddits = queuedRequests.map(entry => entry.subreddit);
            const users = queuedRequests.map(entry => entry.user);

            // Perform the request to fetch the notes
            const notes = await TBApi.getRecentModNotes(subreddits, users);

            // We now have to pass each note to the appropriate caller's promise
            // resolver; since the arrays are in the same order, we can loop
            // over all the resolve functions and call them, passing the note at
            // the corresponding index in the notes array
            for (const [i, {resolve}] of Object.entries(queuedRequests)) {
                resolve(notes[i]);
            }
        } catch (error) {
            // If there was an error, reject all the the promises
            for (const {reject} of queuedRequests) {
                reject(error);
            }
        }
    }
}

/**
 * Gets the parent fullname of a comment.
 * @param {string} commentFullname Fullname of a comment
 * @returns {Promise<string>} Fullname of the comment's parent post
 */
async function getParentFullname (commentFullname) {
    // NOTE: This function isn't called until the module is initialized, so it's
    //       safe to reference `self` in order to read/write settings
    /* eslint-disable no-use-before-define */

    /** @type {[commentFullname: string, parentFullname: string][]} */
    let cachedParentFullnames = await self.get('cachedParentFullnames');

    // Search the cache for an answer first
    const matchingIndex = cachedParentFullnames.findIndex(entry => entry[0] === commentFullname);
    if (matchingIndex !== -1) {
        const parentFullname = cachedParentFullnames[matchingIndex][1];

        // Move the cache entry to the head of the array since we just used it
        cachedParentFullnames.splice(matchingIndex, 1);
        cachedParentFullnames.unshift([commentFullname, parentFullname]);

        // Write back to the cache and return the cached parent fullname
        self.set('cachedParentFullnames', cachedParentFullnames);
        return parentFullname;
    }

    // No cached value, so fetch from API instead
    const parentFullname = await TBApi.getInfo(commentFullname).then(info => info.data.parent_id);

    // Write result to cache and trim the cache size; fetch the cache value
    // again before changing it since others may have touched it in the meantime
    cachedParentFullnames = await self.get('cachedParentFullnames');
    cachedParentFullnames.unshift([commentFullname, parentFullname]);
    await self.set('cachedParentFullnames', cachedParentFullnames.slice(0, PARENT_FULLNAMES_CACHE_MAX_SIZE));
    return parentFullname;

    /* eslint-enable no-use-before-define */
}

/**
 * Gets a link to the context item of a note.
 * @param {object} note A mod note object
 * @returns {Promise<string | null>} Resolves to a URL that points to the note's
 * context item, or `null` if there is none
 */
async function getContextURL (note) {
    const itemFullname = note.user_note_data?.reddit_id || note.mod_action_data?.reddit_id;

    // Can't link to something that isn't there
    if (!itemFullname) {
        return null;
    }

    // Split fullname into type and ID
    const [itemType, itemID] = itemFullname.split('_');

    // Post links only require the ID of the post itself, which we have
    if (itemType === 't3') {
        return link(`/comments/${itemID}`);
    }

    // Comment links require the ID of their parent post, which we need to fetch
    if (itemType === 't1') {
        const parentFullname = await getParentFullname(itemFullname);
        return link(`/comments/${parentFullname.replace('t3_', '')}/_/${itemID}`);
    }

    // This ID is for some other item type which we can't process
    return null;
}

/**
 * Creates a mod note badge for the given information.
 * @param {object} data Data associated with the badge
 * @param {string} data.user Name of the relevant user
 * @param {string} data.subreddit Name of the relevant subreddit
 * @param {string} data.label Text shown in the badge if there are no notes
 * @param {object} [data.note] The most recent mod note left on the user
 * @returns {jQuery} The created badge
 */
function createModNotesBadge ({
    user,
    subreddit,
    label = 'NN',
    note,
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
    });

    return $badge;
}

/**
 * Updates mod note badges in place with the given information.
 * @param {jQuery} $badge The badge(s) to update
 * @param {object} note The most recent mod note left on the user, or null
 */
function updateModNotesBadge ($badge, note) {
    if (!note || !note.user_note_data) {
        $badge.text($badge.attr('data-label'));
        return;
    }

    $badge.empty();
    $badge.append(`
        <b style="${note.user_note_data.label ? `color: ${labelColors[note.user_note_data.label]}` : ''}">
            ${htmlEncode(note.user_note_data.note)}
        </b>
    `);
}

/**
 * Creates a mod note popup for the given information.
 * @param {object} data Data associated with the popup
 * @param {string} data.user Name of the relevant user
 * @param {string} data.subreddit Name of the relevant subreddit
 * @param {string} [data.contextID] Fullname of the item the popup was opened from, used to write note context
 * @param {object[]} [data.notes] Note objects for the user, or null/undefined
 * @returns {jQuery} The created popup
 */
function createModNotesPopup ({
    user,
    subreddit,
    contextID,
    notes,
    defaultTabName,
    defaultNoteLabel,
}) {
    let defaultTabID = 'tb-modnote-tab-all';
    if (defaultTabName === 'notes') {
        defaultTabID = 'tb-modnote-tab-notes';
    } else if (defaultTabName === 'actions') {
        defaultTabID = 'tb-modnote-tab-actions';
    }

    const $popup = popup({
        title: `Mod notes for /u/${user} in /r/${subreddit}`,
        tabs: [
            {
                title: 'All Activity',
                id: 'tb-modnote-tab-all',
            },
            {
                title: 'Notes',
                id: 'tb-modnote-tab-notes',
            },
            {
                title: 'Mod Actions',
                id: 'tb-modnote-tab-actions',
            },
        ],
        footer: `
            <form class="tb-modnote-create-form">
                <select class="tb-action-button tb-modnote-label-select">
                    <option
                        value=""
                        ${defaultNoteLabel === 'none' ? 'selected' : ''}
                    >
                        (no label)
                    </option>
                    ${Object.entries(labelNames).reverse().map(([value, name]) => `
                        <option
                            value="${htmlEncode(value)}"
                            ${defaultNoteLabel === name.toLowerCase().replace(/\s/g, '_') ? 'selected' : ''}
                        >
                            ${htmlEncode(name)}
                        </option>
                    `).join('')}
                </select>
                <input
                    type="text"
                    class="tb-modnote-text-input tb-input"
                    placeholder="Add a note..."
                >
                <button
                    type="submit"
                    class="tb-action-button"
                >
                    Create Note
                </button>
            </form>
        `,
        cssClass: 'tb-modnote-popup',
        defaultTabID,
    });
    $popup.attr('data-user', user);
    $popup.attr('data-subreddit', subreddit);
    $popup.attr('data-context-id', contextID);

    updateModNotesPopup($popup, {
        notes,
    });

    return $popup;
}

/**
 * Updates a mod notes popup in place with the given information.
 * @param {jQuery} $popup The popup to update
 * @param {object} data
 * @param {object[]} [data.notes] Note objects for the user, or null/undefined
 */
function updateModNotesPopup ($popup, {
    notes,
}) {
    // Build a table for each tab containing the right subset of notes
    $popup.find('.tb-window-tab').each(function () {
        const $tabContainer = $(this);

        const $content = $tabContainer.find('.tb-window-content');
        $content.empty();

        if (!notes) {
            // Notes being null/undefined indicates notes couldn't be fetched
            // TODO: probably pass errors into this function for display, and
            //       also to distinguish "failed to load" from "still loading"
            $content.append(`
                <p class="error">
                    Error fetching mod notes
                </p>
            `);
            return;
        }

        // Filter notes as appropriate for this tab
        let filteredNotes = notes;
        if ($tabContainer.hasClass('tb-modnote-tab-notes')) {
            filteredNotes = notes.filter(note => note.user_note_data?.note);
        }
        if ($tabContainer.hasClass('tb-modnote-tab-actions')) {
            filteredNotes = notes.filter(note => note.mod_action_data?.action);
        }

        if (!filteredNotes.length) {
            // If the notes list is empty, our job is very easy
            $content.append(`
                <p>
                    No notes
                </p>
            `);
        } else {
            // Generate a table for the notes we have and display that
            const $notesPager = pagerForItems({
                items: filteredNotes,
                perPage: 10,
                controlPosition: 'bottom',
                displayItem: generateNoteTableRow,
                wrapper: `
                    <table class="tb-modnote-table">
                        <thead>
                            <tr>
                                <th>Author</th>
                                <th>Type</th>
                                <th>Details</th>
                                <th></th>
                            </tr>
                        </thead>
                    </table>
                `,
            });
            $content.append($notesPager);
        }
    });
}

/**
 * Generates a table of the given notes.
 * @param {object} note A note object
 * @returns {jQuery} The generated table row
 */
function generateNoteTableRow (note) {
    const createdAt = new Date(note.created_at * 1000);
    const mod = note.operator; // TODO: can [deleted] show up here?

    const $noteRow = $(`
        <tr>
            <td>
                <a href="${link(`/user/${encodeURIComponent(mod)}`)}">
                    /u/${escapeHTML(mod)}
                </a>
                <br>
                <small>
                    <time datetime="${escapeHTML(createdAt.toISOString())}">
                        ${escapeHTML(createdAt.toLocaleString())}
                    </time>
                </small>
            </td>
            <td>
                ${typeNames[note.type]}
            </td>
        </tr>
    `);

    // Build the note details based on what sort of information is present
    const $noteDetails = $('<td>');

    if (note.mod_action_data?.action) {
        $noteDetails.append(`
            <span class="tb-modnote-action-summary">
                Took action "${escapeHTML(note.mod_action_data.action)}"${note.mod_action_data.details ? ` (${escapeHTML(note.mod_action_data.details)})` : ''}${note.mod_action_data.description ? `: ${escapeHTML(note.mod_action_data.description)}` : ''}
            </span>
        `);
    }

    if (note.user_note_data?.note) {
        $noteDetails.append(`
            <blockquote>
                ${note.user_note_data.label ? `
                    <span style="color:${labelColors[note.user_note_data.label]}">
                        [${labelNames[note.user_note_data.label] || escapeHTML(note.user_note_data.label)}]
                    </span>
                ` : ''}
                ${escapeHTML(note.user_note_data.note)}
            </blockquote>
        `);
    }

    $noteRow.append($noteDetails);

    // Only manually added notes can be deleted
    if (note.type === 'NOTE') {
        $noteRow.append(`
            <td>
                <a
                    class="tb-modnote-delete-button tb-icons tb-icons-negative"
                    role="button"
                    title="Delete note"
                    data-note-id="${escapeHTML(note.id)}"
                >
                    ${icons.delete}
                </a>
            </td>
        `);
    } else {
        // append an empty td to avoid weird border stuff
        $noteRow.append('<td>');
    }

    // Check for a context URL (which might need to be fetched) and add it to
    // the timestamp if we get one
    getContextURL(note).then(contextURL => {
        if (!contextURL) {
            return;
        }
        $noteRow.find('time').wrap(`<a href="${escapeHTML(contextURL)}">`);
    });

    // HACK: timeago only works on elements added to the DOM, so we run it after
    //       a tick, when the caller has added the constructed row to the page
    Promise.resolve().then(() => {
        $noteRow.find('time').timeago();
    });

    return $noteRow;
}

const self = new Module({
    name: 'Mod Notes',
    id: 'ModNotes',
    beta: true,
    enabledByDefault: true,
    settings: [
        {
            id: 'defaultTabName',
            description: 'Default tab for the modnotes window',
            type: 'selector',
            values: [
                'All Activity',
                'Notes',
                'Actions',
            ],
            default: 'all_activity',
        },
        {
            id: 'defaultNoteLabel',
            description: 'Default label for new notes',
            type: 'selector',
            values: [
                'None',
                ...Object.values(labelNames),
            ],
            default: 'none',
        },
        {
            id: 'cachedParentFullnames',
            description: 'Array of arrays mapping comment fullnames to parent post fullnames',
            type: 'JSON',
            hidden: true,
            default: [],
        },
    ],
}, function ({defaultTabName, defaultNoteLabel}) {
    // Handle authors showing up on the page
    TBListener.on('author', async e => {
        const subreddit = e.detail.data.subreddit.name;
        const author = e.detail.data.author;
        const contextID = isNewModmail ? undefined : e.detail.data.comment?.id || e.detail.data.post?.id;

        // Deleted users can't have notes
        if (author === '[deleted]') {
            return;
        }

        // Can't fetch notes in a sub you're not a mod of
        // TODO: What specific permissions are required to fetch notes?
        const isMod = await isModSub(subreddit);
        if (!isMod) {
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
            // TODO: don't register this directly on the badge, use $body.on('click', selector, ...)
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
                    this.error(`Error fetching mod notes for /u/${author} in /r/${subreddit}`, error);
                }

                // Create, position, and display popup
                const positions = drawPosition(clickEvent);
                const $popup = createModNotesPopup({
                    user: author,
                    subreddit,
                    notes,
                    contextID,
                    defaultTabName,
                    defaultNoteLabel,
                })
                    .css({
                        top: positions.topPosition,
                        left: positions.leftPosition,
                    })
                    .appendTo($('body'));

                // Focus the note input
                $popup.find('.tb-modnote-text-input').focus();
            });
            $badge.appendTo($target);
        }

        this.debug(`Fetching latest mod note for /u/${author} in /r/${subreddit}`);
        try {
            const note = await getLatestModNote(subreddit, author);
            this.info(`Got note for /u/${author} in /r/${subreddit}:`, note);
            updateModNotesBadge($badge, note);
        } catch (error) {
            this.error(`Error fetching mod notes for /u/${author} in /r/${subreddit}:`, error);
        }
    });

    const $body = $('body');

    // Handle note creation
    $body.on('submit', '.tb-modnote-create-form', async event => {
        // don't actually perform the HTML form action
        event.preventDefault();

        const $popup = $(event.target).closest('.tb-modnote-popup');
        const $textInput = $popup.find('.tb-modnote-text-input');
        const $labelSelect = $popup.find('.tb-modnote-label-select');

        try {
            await TBApi.createModNote({
                user: $popup.attr('data-user'),
                subreddit: $popup.attr('data-subreddit'),
                note: $textInput.val(),
                label: $labelSelect.val() || undefined,
                redditID: $popup.attr('data-context-id'),
            });
            $textInput.val('');
            textFeedback('Note saved', FEEDBACK_POSITIVE);

            // Close the popup after a successful save
            $popup.remove();
        } catch (error) {
            this.error('Failed to create mod note:', error);
            textFeedback('Failed to create mod note', FEEDBACK_NEGATIVE);
        }
    });

    // Handle delete note button clicks
    $body.on('click', '.tb-modnote-delete-button', async event => {
        const $button = $(event.target);
        const $popup = $button.closest('.tb-modnote-popup');

        try {
            await TBApi.deleteModNote({
                user: $popup.attr('data-user'),
                subreddit: $popup.attr('data-subreddit'),
                id: $button.attr('data-note-id'),
            });
            $button.closest('tr').remove();
            textFeedback('Note removed!', FEEDBACK_POSITIVE);
        } catch (error) {
            this.error('Failed to delete note:', error);
            textFeedback('Failed to delete note', FEEDBACK_NEGATIVE);
        }
    });
});
export default self;
