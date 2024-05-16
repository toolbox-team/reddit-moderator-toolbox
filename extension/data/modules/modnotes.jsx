import {map, page, pipeAsync} from 'iter-ops';

import {useFetched, useSetting} from '../hooks.ts';
import * as TBApi from '../tbapi.ts';
import {isModSub, link} from '../tbcore.js';
import {escapeHTML} from '../tbhelpers.js';
import TBLog from '../tblog.ts';
import {Module} from '../tbmodule.jsx';
import {setSettingAsync} from '../tbstorage.js';
import {drawPosition, textFeedback, TextFeedbackKind} from '../tbui.js';

import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import {Icon} from '../components/controls/Icon.tsx';
import {RelativeTime} from '../components/controls/RelativeTime.tsx';
import {ProgressivePager} from '../components/ProgressivePager.tsx';
import {Window} from '../components/Window.tsx';
import {WindowTabs} from '../components/WindowTabs.tsx';
import {renderInSlots} from '../frontends/index.tsx';

const log = TBLog('ModNotes');

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
        <button
            className='tb-bracket-button tb-modnote-badge'
            tabIndex='0'
            title={`Mod notes for /u/${user} in /r/${subreddit}`}
            onClick={onClick}
        >
            {badgeContents}
        </button>
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
        <ProgressivePager
            controlPosition='bottom'
            emptyContent={<p>No notes</p>}
            pages={pipeAsync(
                // fetch mod notes that match this tab
                getAllModNotes(subreddit, user, noteFilter),
                // group into pages of 20 items each
                page(20),
                // construct the table and insert the generated rows for each
                // page
                map(pageItems => (
                    <table className='tb-modnote-table'>
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
    defaultTabName,
    defaultNoteLabel,
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

    let defaultTabIndex = 0;
    if (defaultTabName === 'notes') {
        defaultTabIndex = 1;
    } else if (defaultTabName === 'actions') {
        defaultTabIndex = 2;
    }

    // Handle note creation
    async function handleNewNoteSubmit (event) {
        // don't actually perform the HTML form action
        event.preventDefault();
        const formData = new FormData(event.target);

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
    // manually focus it after a paint via requestAnimationFrame to avoid this
    const noteInputRef = useRef(null);
    useEffect(() => {
        if (noteInputRef.current == null) {
            return;
        }
        requestAnimationFrame(() => {
            noteInputRef.current.focus();
        });
    }, []);

    const popupFooter = (
        <form className='tb-modnote-create-form' onSubmit={handleNewNoteSubmit}>
            <select
                name='label'
                className='tb-action-button tb-modnote-label-select'
                defaultValue={defaultNoteLabelValueToLabelType[defaultNoteLabel]}
            >
                <option value=''>(no label)</option>
                {Object.entries(labelNames).reverse().map(([value, name]) => (
                    <option key={value} value={value}>{name}</option>
                ))}
            </select>
            <input
                ref={noteInputRef}
                type='text'
                name='note'
                className='tb-modnote-text-input tb-input'
                placeholder='Add a note...'
            />
            <button
                type='submit'
                className='tb-action-button'
            >
                Create Note
            </button>
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
    const mod = note.operator; // TODO: can [deleted] show up here?

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
                    <span className='tb-modnote-action-summary'>
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
                        className='tb-modnote-delete-button'
                        role='button'
                        title='Delete note'
                        data-note-id={escapeHTML(note.id)}
                        onClick={() => onDelete()}
                    >
                        <Icon negative icon='delete' />
                    </a>
                )}
            </td>
        </tr>
    );
}

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
    renderInSlots([
        'commentAuthor',
        'submissionAuthor',
        'modmailAuthor',
        'userHovercard',
    ], ({details}) => {
        const subreddit = details.subreddit.name;
        const user = !details.user.deleted && details.user.name;
        const contextID = details.contextFullname || details.comment?.fullname || details.submission?.fullname || null;

        const isMod = useFetched(isModSub(details.subreddit.name));

        // Get settings
        const defaultTabName = useSetting('ModNotes', 'defaultTabName', 'all_activity');
        const defaultNoteLabel = useSetting('ModNotes', 'defaultNoteLabel', 'none');

        // Fetch the latest note for the user
        const note = useFetched(getLatestModNote(subreddit, user));

        const [popupShown, setPopupShown] = useState(false);
        const [popupClickEvent, setPopupClickEvent] = useState(null);

        // Need to know where we are and who we're looking at, and can't fetch
        // notes in a sub you're not a mod of
        // TODO: What specific permissions are required to fetch notes?
        if (!subreddit || !user || !isMod) {
            return <></>;
        }

        /** @type {{top: number; left: number} | undefined} */
        let initialPosition = undefined;
        if (popupClickEvent) {
            const positions = drawPosition(popupClickEvent);
            initialPosition = {
                top: positions.topPosition,
                left: positions.leftPosition,
            };
        }

        function showPopup (event) {
            setPopupShown(true);
            setPopupClickEvent(event);
        }

        function hidePopup () {
            setPopupShown(false);
            setPopupClickEvent(null);
        }

        return (
            <>
                <ModNotesBadge
                    label='NN'
                    user={user}
                    subreddit={subreddit}
                    note={note}
                    onClick={showPopup}
                />
                {popupShown && createPortal(
                    <ModNotesPopup
                        user={user}
                        subreddit={subreddit}
                        contextID={contextID}
                        defaultTabName={defaultTabName}
                        defaultNoteLabel={defaultNoteLabel}
                        initialPosition={initialPosition}
                        onClose={hidePopup}
                    />,
                    document.body,
                )}
            </>
        );
    });
});
