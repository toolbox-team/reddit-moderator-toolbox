import {map, page, pipeAsync} from 'iter-ops';
import $ from 'jquery';
import {useEffect, useRef} from 'react';
import {Provider} from 'react-redux';

import {useFetched, usePopupState, useSetting} from '../hooks.ts';
import store from '../store/index.ts';
import * as TBApi from '../tbapi.ts';
import {isModSub, isNewModmail, link} from '../tbcore.js';
import {escapeHTML} from '../tbhelpers.js';
import TBListener from '../tblistener.js';
import {Module} from '../tbmodule.jsx';
import {textFeedback, TextFeedbackKind} from '../tbui.js';
import createLogger from '../util/logging.ts';
import {setSettingAsync} from '../util/settings.ts';
import {classes, createBodyShadowPortal, reactRenderer} from '../util/ui_interop.tsx';

import {
    ActionButton,
    ActionSelect,
    BracketButton,
    Icon,
    NormalInput,
    RelativeTime,
} from '../components/controls/index.ts';
import {Pager} from '../components/Pager.tsx';
import {Window} from '../components/Window.tsx';
import {WindowTabs} from '../components/WindowTabs.tsx';

import css from './modnotes.module.css';

const log = createLogger('ModNotes');

/**
 * An object mapping modnote types to human-friendly display names.
 * @constant {object}
 */
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
const labelColors = {
    BOT_BAN: 'black',
    PERMA_BAN: 'darkred',
    BAN: 'red',
    ABUSE_WARNING: 'orange',
    SPAM_WARNING: 'purple',
    SPAM_WATCH: 'fuchsia',
    SOLID_CONTRIBUTOR: 'green',
    HELPFUL_USER: 'lightseagreen',
    USER_SUMMARY: 'darkgray',
};

/**
 * An object mapping modnote lavels to human-friendly display names.
 * @constant {object}
 */
const labelNames = {
    BOT_BAN: 'Bot Ban',
    PERMA_BAN: 'Permaban',
    BAN: 'Ban',
    ABUSE_WARNING: 'Abuse Warning',
    SPAM_WARNING: 'Spam Warning',
    SPAM_WATCH: 'Spam Watch',
    SOLID_CONTRIBUTOR: 'Solid Contributor',
    HELPFUL_USER: 'Helpful User',
    USER_SUMMARY: 'AI-generated user summary',
};

/**
 * Mapping of possible values of the `defaultNoteLabelValue` setting to actual
 * label type strings used by the API (or in the case of "none", `undefined`)
 */
const defaultNoteLabelValueToLabelType = {
    none: undefined,
    bot_ban: 'BOT_BAN',
    permaban: 'PERMA_BAN',
    ban: 'BAN',
    abuse_warning: 'ABUSE_WARNING',
    spam_warning: 'SPAM_WARNING',
    spam_watch: 'SPAM_WATCH',
    solid_contributor: 'SOLID_CONTRIBUTOR',
    helpful_user: 'HELPFUL_USER',
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
 * Does not return AI-generated user summary "notes."
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
            let notes = await TBApi.getRecentModNotes(subreddits, users);

            // Remove AI summary notes from the result. reddit why
            notes = notes.map(note => note?.user_note_data?.label === 'USER_SUMMARY' ? null : note);

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
 * Creates a generator which lazily fetches all mod notes for a user in a
 * subreddit that match the given filter.
 * @param {string} subreddit The name of the subreddit
 * @param {string} user The name of the user
 * @param {string} filter Criteria for filtering notes
 * @returns {AsyncGenerator<any, void>}
 */
async function* getAllModNotes (subreddit, user, filter) {
    // Starts with the latest page of notes
    let before = undefined;
    while (true) {
        // Fetch the next page of notes
        const {notes, endCursor, hasNextPage} = await TBApi.getModNotes({
            subreddit,
            user,
            filter,
            before,
        });

        // Yield each note we fetched
        for (const note of notes) {
            yield note;
        }

        // End the generator if there's no next page to fetch
        if (!hasNextPage) {
            return;
        }

        // Set `before` so the next page is fetched next pass
        before = endCursor;
    }
}

/**
 * In-page cache of comment fullnames to the fullnames of their submissions.
 * Values of this object are promises which resolve to fullnames, rather than
 * bare strings - we keep the promises around after they're resolved, and always
 * deal with this cache asynchronously.
 * @constant {Record<string, Promise<string>>}
 */
const submissionFullnamesCache = Object.create(null);

/**
 * Gets the fullname of a comment's corresponding submission.
 * @param {string} commentFullname Fullname of a comment
 * @returns {Promise<string>} Fullname of the comment's submission
 */
export function getSubmissionFullname (commentFullname) {
    // If it's in cache, return that
    const cached = submissionFullnamesCache[commentFullname];
    if (cached) {
        return cached;
    }

    // Fetch the submission fullname fresh
    // Note that we're not awaiting this - we want the full promise
    const submissionFullnamePromise = TBApi.getInfo(commentFullname)
        .then(info => info.data.link_id);

    // Write to cache and return
    submissionFullnamesCache[commentFullname] = submissionFullnamePromise;
    return submissionFullnamePromise;
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

    // Comment links require the link ID of their submission, which we need to fetch
    if (itemType === 't1') {
        const submissionFullname = await getSubmissionFullname(itemFullname);
        return link(`/comments/${submissionFullname.replace('t3_', '')}/_/${itemID}`);
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
function ModNotesBadge ({
    label = 'NN',
    user,
    subreddit,
    note,
    onClick,
}) {
    let badgeContents = label;
    if (note && note.user_note_data) {
        const label = note.user_note_data.label;
        const noteColor = label && labelColors[label];
        badgeContents = (
            <b style={{color: noteColor}}>
                {note.user_note_data.note}
            </b>
        );
    }
    return (
        <BracketButton
            className={classes('tb-bracket-button', 'tb-modnote-badge', css.noteButton)}
            tabIndex='0'
            title={`Mod notes for /u/${user} in /r/${subreddit}`}
            onClick={onClick}
        >
            {badgeContents}
        </BracketButton>
    );
}

/** Returns a pager for mod notes on the user in the subreddit matching the filter. */
function ModNotesPager ({user, subreddit, filter: noteFilter}) {
    async function deleteNote (noteID) {
        try {
            await TBApi.deleteModNote({
                user,
                subreddit,
                id: noteID,
            });
            // TODO: present note deletion visibly to user
            textFeedback('Note removed!', TextFeedbackKind.POSITIVE);
        } catch (error) {
            log.error('Failed to delete note:', error);
            textFeedback('Failed to delete note', TextFeedbackKind.NEGATIVE);
        }
    }

    return (
        <Pager
            controlPosition='bottom'
            emptyContent={<p>No notes</p>}
            pages={pipeAsync(
                // fetch mod notes that match this tab
                // TODO: can we memoize or cache this or something to make the
                //       popup contents not flash when other state is changed
                getAllModNotes(subreddit, user, noteFilter),
                // group into pages of 20 items each
                page(20),
                // construct the table and insert the generated rows for each
                // page
                map(pageItems => (
                    <table className={css.noteTable}>
                        <thead>
                            <tr>
                                <th>Author</th>
                                <th>Type</th>
                                <th>Details</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map(note => (
                                <NoteTableRow
                                    key={note.id}
                                    note={note}
                                    onDelete={() => deleteNote(note.id)}
                                />
                            ))}
                        </tbody>
                    </table>
                )),
            )}
        />
    );
}

/**
 * Creates a mod note popup for the given information.
 * @param {object} data Data associated with the popup
 * @param {string} data.user Name of the relevant user
 * @param {string} data.subreddit Name of the relevant subreddit
 * @param {string} [data.contextID] Fullname of the item the popup was opened from, used to write note context
 * @param {Function} data.onClose Close handler for the popup
 * @returns {jQuery} The created popup
 */
function ModNotesPopup ({
    user,
    subreddit,
    contextID,
    initialPosition,
    onClose,
}) {
    const tabs = [
        {
            title: 'All Activity',
            content: <ModNotesPager user={user} subreddit={subreddit} />,
        },
        {
            title: 'Notes',
            content: <ModNotesPager user={user} subreddit={subreddit} filter='NOTE' />,
        },
        {
            title: 'Mod Actions',
            content: <ModNotesPager user={user} subreddit={subreddit} filter='MOD_ACTION' />,
        },
    ];

    /** @type {'all_activity' | 'notes' | 'actions'} */
    const defaultTabName = useSetting('ModNotes', 'defaultTabName', 'all_activity');
    /** @type {'none' | 'bot_ban' | 'permaban' | 'ban' | 'abuse_warning' | 'spam_warning' | 'spam_watch' | 'solid_contributor' | 'helpful_user'} */
    const defaultNoteLabel = useSetting('ModNotes', 'defaultNoteLabel', 'none');

    let defaultTabIndex = 0;
    if (defaultTabName === 'notes') {
        defaultTabIndex = 1;
    } else if (defaultTabName === 'actions') {
        defaultTabIndex = 2;
    }

    // Handle note creation
    async function submitNewNote (formData) {
        try {
            await TBApi.createModNote({
                user,
                subreddit,
                redditID: contextID,
                note: formData.get('note'),
                label: formData.get('label'),
            });
            textFeedback('Note saved', TextFeedbackKind.POSITIVE);

            // Close the popup after a successful save
            onClose();
        } catch (error) {
            log.error('Failed to create mod note:', error);
            textFeedback('Failed to create mod note', TextFeedbackKind.NEGATIVE);
        }
    }

    // Using autoFocus on the note text input causes the page to jump around;
    // manually focus it with `preventScroll` to avoid this
    const noteInputRef = useRef(null);
    useEffect(() => {
        if (noteInputRef.current == null) {
            return;
        }
        noteInputRef.current.focus({preventScroll: true});
    }, []);

    const popupFooter = (
        <form className={css.modnoteCreateForm} action={submitNewNote}>
            <ActionSelect
                name='label'
                defaultValue={defaultNoteLabelValueToLabelType[defaultNoteLabel]}
            >
                <option value=''>(no label)</option>
                {Object.entries(labelNames).reverse().map(([value, name]) => (
                    <option key={value} value={value}>{name}</option>
                ))}
            </ActionSelect>
            <NormalInput
                ref={noteInputRef}
                type='text'
                name='note'
                inFooter
                placeholder='Add a note...'
            />
            <ActionButton type='submit'>
                Create Note
            </ActionButton>
        </form>
    );

    // Create the base popup
    return (
        <Window
            title={`Mod notes for /u/${user} in /r/${subreddit}`}
            footer={popupFooter}
            draggable
            initialPosition={initialPosition}
            onClose={onClose}
        >
            <WindowTabs
                tabs={tabs}
                defaultTabIndex={defaultTabIndex}
            />
        </Window>
    );
}

/**
 * A row of the notes table displaying details about the given note.
 * @param {object} props.note A note object
 */
function NoteTableRow ({note, onDelete}) {
    const createdAt = new Date(note.created_at * 1000);
    let mod = note.operator; // TODO: can [deleted] show up here?
    if (note.user_note_data?.label === 'USER_SUMMARY') {
        // Special handling for AI-generated user summaries
        mod = 'reddit';
    }

    const contextURL = useFetched(getContextURL(note));

    return (
        <tr>
            <td>
                <a href={link(`/user/${encodeURIComponent(mod)}`)}>
                    /u/{mod}
                </a>
                <br />
                <small>
                    {contextURL
                        ? (
                            <a href={contextURL}>
                                <RelativeTime date={createdAt} />
                            </a>
                        )
                        : <RelativeTime date={createdAt} />}
                </small>
            </td>
            <td>
                {typeNames[note.type]}
            </td>
            <td>
                {note.mod_action_data?.action && (
                    <span className={css.actionSummary}>
                        Took action {'"'}
                        {note.mod_action_data.action}
                        {'"'}
                        {note.mod_action_data.details && ` (${note.mod_action_data.details})`}
                        {note.mod_action_data.description && `: ${note.mod_action_data.description}`}
                    </span>
                )}
                {note.user_note_data?.note && (
                    <blockquote>
                        {note.user_note_data.label && (
                            <span style={{color: labelColors[note.user_note_data.label]}}>
                                [{labelNames[note.user_note_data.label] || note.user_note_data.label}]
                            </span>
                        )} {note.user_note_data.note}
                    </blockquote>
                )}
            </td>
            <td>
                {note.type === 'NOTE' && (
                    <a
                        role='button'
                        title='Delete note'
                        data-note-id={escapeHTML(note.id)}
                        onClick={() => onDelete()}
                    >
                        <Icon mood='negative' icon='delete' />
                    </a>
                )}
            </td>
        </tr>
    );
}

const ModNotesUserRoot = ({user, subreddit, contextID}) => {
    // Fetch the latest note for the user
    const note = useFetched(getLatestModNote(subreddit, user));

    const {shown, initialPosition, show, hide} = usePopupState();

    return (
        <>
            <ModNotesBadge
                label='NN'
                user={user}
                subreddit={subreddit}
                note={note}
                onClick={show}
            />
            {shown && createBodyShadowPortal(
                <ModNotesPopup
                    user={user}
                    subreddit={subreddit}
                    contextID={contextID}
                    initialPosition={initialPosition}
                    onClose={hide}
                />,
            )}
        </>
    );
};

export default new Module({
    name: 'Mod Notes',
    id: 'ModNotes',
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
    ],
}, function () {
    // Clean up old broken cache storage key
    // TODO: Remove this a couple versions from now when people have reasonably
    //       probably updated past this
    setSettingAsync(this.id, 'cachedParentFullnames', undefined);

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
        if ($target.find('.tb-modnote-badge-react-root').length) {
            return;
        }
        const badgeRoot = reactRenderer(
            <Provider store={store}>
                <ModNotesUserRoot
                    user={author}
                    subreddit={subreddit}
                    contextID={contextID}
                />
            </Provider>,
        );
        badgeRoot.classList.add('tb-modnote-badge-react-root');
        $target.append(badgeRoot);
    });
});
