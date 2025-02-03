// Defines a system of "slots" which modules can use to render interface
// elements within the page. Slot types are standardized for consumers (e.g. a
// module says it wants to display a button next to comment author usernames)
// and their actual position in the DOM is controlled by platform-specific
// observers responding to changes in the page and dynamically creating React
// roots which this code then populates with the appropriate contents.

// TODO: this file probably needs to be explained a lot better im in
//       functionality hyperfocus mode not documentation hyperfocus mode

import {type ComponentType} from 'react';

import {currentPlatform, RedditPlatform} from '../util/platform';
import {reactRenderer} from '../util/ui_interop';

import modmailObserver from './modmail';
import oldRedditObserver from './oldreddit';
import shredditObserver from './shreddit';

/** Basic information about a subreddit. */
interface PlatformSlotDetailsSubreddit {
    /** The subreddit's fullname, beginning with ``. */
    fullname?: string;
    /** The name of the subreddit */
    name: string;
}

/** Basic information about a user. */
export type PlatformSlotDetailsUser = {
    /** If `true`, this is a deleted user. */
    deleted: true;
} | {
    /** If `true`, this is a deleted user. */
    deleted: false;
    /** The user's fullname, starting with ``. */
    fullname?: string;
    /** The user's username. */
    name: string;
};

/** Basic information about a submission. */
interface PlatformSlotDetailsSubmission {
    /** The submission's fullname, beginning with ``. */
    fullname: string;
}

/** Basic information about a comment. */
interface PlatformSlotDetailsComment {
    /** The comment's fullname, beginning with ``. */
    fullname: string;
}

// Slot names and the type of associated contextual information

/** Contextual information provided to consumers of each type of slot. */
export interface PlatformSlotDetails {
    /** Details for a submission author slot. */
    submissionAuthor: {
        /** The author of this submission */
        user: PlatformSlotDetailsUser;
        /** The submission */
        submission?: PlatformSlotDetailsSubmission;
        /** The subreddit where this submission was posted */
        subreddit: PlatformSlotDetailsSubreddit;
        // /** The type of distinguish on the submission, if any */
        // distinguishType: null | 'moderator' | 'employee' | 'alumnus';
        // /** The sticky slot populated by the submission, if any */
        // stickied: false | 1 | 2;
    };
    commentAuthor: {
        /** The author of the comment */
        user: PlatformSlotDetailsUser;
        /** The comment */
        comment: PlatformSlotDetailsComment;
        /** The parent submission the comment was left under */
        submission?: PlatformSlotDetailsSubmission;
        /** The subreddit where the comment was posted */
        subreddit: PlatformSlotDetailsSubreddit;
        // /** The type of distinguish on the comment, if any */
        // distinguished: boolean;
        // /** Whether the comment is stickied */
        // stickied: boolean;
    };
    modmailAuthor: {
        /** The author of the message */
        user: PlatformSlotDetailsUser;
        /** The subreddit that initially received this message's thread */
        subreddit: PlatformSlotDetailsSubreddit;
        /** The thread this message is in */
        thread: {fullname: string};
        /** The message */
        message: {fullname: string};
        // /** Whether the author is a moderator */
        // authorIsModerator: boolean;
        // /** Whether this message was sent "as the subreddit" (with username hidden) */
        // repliedAsSubreddit: boolean;
    };
    userHovercard: {
        /** The user */
        user: PlatformSlotDetailsUser;
        /**
         * The subreddit of the content the hovercard was triggered from. For
         * example if the hovercard was triggered from an author name on a
         * submission, this would be the subreddit it was submitted to; if the
         * hovercard is triggered on a user in a modmail thread, this would be
         * the subreddit that received the thread.
         */
        subreddit: PlatformSlotDetailsSubreddit;
        /**
         * The fullname of the submission, comment, modmail thread, etc. the
         * hovercard was triggered from
         */
        contextFullname?: string;
    };
}
/**
 * A slot type. Describes a location on the page where slot contents can be
 * rendered (e.g. `submissionAuthor` is a slot type that's rendered next to the
 * usernames of submission authors).
 */
export type PlatformSlotType = keyof PlatformSlotDetails;

// Consumer code (used by toolbox modules)

// A consumer of a particular slot location which gets appropriate context and
// returns React content to be rendered in the slot
export type PlatformSlotContent<SlotType extends keyof PlatformSlotDetails> = ComponentType<{
    /**
     * Contextual details about the content the slot is attached to. Different
     * slot types provide different information in this object.
     */
    details: PlatformSlotDetails[SlotType];
    /** The type of slot the component is currently being populated into. */
    slotType: SlotType;
}>;

// Map of slot locations to consumers of the slot
const slotConsumers: {
    [K in keyof PlatformSlotDetails]?: PlatformSlotContent<K>[];
} = Object.create(null);

/**
 * Provide a consumer for one or more slot types. Whenever any of the `slots`
 * appears on the page, the given component/renderer will be used to populate
 * the slot (alongside any other consumers of the same slot type).
 * @param slots An array of slots where the given component should be rendered
 * @param render A React function component/render function that will be
 * rendered in those slots. Props are passed which inform the component which
 * type of slot it's currently being rendered in, and contextual information
 * about the slot's surroundings.
 */
export function renderInSlots<K extends keyof PlatformSlotDetails> (slots: K[], render: PlatformSlotContent<K>) {
    if (!Array.isArray(slots)) {
        slots = [];
    }
    for (const slot of slots) {
        if (!slotConsumers[slot]) {
            slotConsumers[slot] = [];
        }
        slotConsumers[slot]?.push(render);
    }
}

// Observer code (used by platform-specific observers in this directory)

/**
 * A platform observer is a function responsible creating slot instances and
 * attaching them to the page in the appropriate locations for a specific
 * platform. It is called once when Toolbox starts and receives a function which
 * creates slot instances, which it then inserts into the DOM.
 */
export type PlatformObserver = (
    /**
     * Creates a React root for a slot which will be populated with the
     * appropriate contents. Observers are responsible for calling this function
     * and inserting the resulting element into the DOM wherever the slot should
     * be rendered.
     */
    createRenderer: <SlotType extends keyof PlatformSlotDetails>(
        slotType: SlotType,
        details: PlatformSlotDetails[SlotType],
    ) => HTMLElement,
) => void;

// the actual `createRenderer` function observers get - returns a new react root
// which will contain all the contents different modules have registered for the
// given slot type
// NOTE: Exported because tbui builders need to manually emit their own slots.
//       Should we just import this from the platform-specific bits instead of
//       passing this function in to them?
export const createRenderer = <K extends keyof PlatformSlotDetails>(slotType: K, details: PlatformSlotDetails[K]) =>
    reactRenderer(
        <div
            className='tb-platform-slot'
            style={{display: 'inline-flex'}} // FIXME: do this in CSS
            data-slot-type={slotType}
        >
            {/* TODO: Do we want to do anything more sophisticated here? */}
            {slotConsumers[slotType]?.map((Component, i) => (
                <Component
                    key={i}
                    details={details}
                    slotType={slotType}
                />
            ))}
        </div>,
    );

// Initialize the appropriate observer for the platform we've loaded into
let observers = {
    [RedditPlatform.OLD]: oldRedditObserver,
    [RedditPlatform.SHREDDIT]: shredditObserver,
    [RedditPlatform.MODMAIL]: modmailObserver,
};

/**
 * Start the platform observer, which will cause slots to be identified and
 * populated. To be called as part of the init process after all slot consumers
 * have been registered via {@linkcode renderInSlots}.
 */
export function initializeObserver () {
    if (currentPlatform == null) {
        return;
    }
    observers[currentPlatform](createRenderer);
}
