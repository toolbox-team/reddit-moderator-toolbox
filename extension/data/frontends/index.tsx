// Defines a system of "slots" which modules can use to render interface
// elements within the page. Slot locations are standardized for consumers (e.g.
// a module says it wants to display a button next to comment author usernames)
// and their actual position in the DOM is controlled by platform-specific
// observers responding to changes in the page and dynamically creating React
// roots which this code then populates with the appropriate contents.

// TODO: this file probably needs to be explained a lot better im in
//       functionality hyperfocus mode not documentation hyperfocus mode

import {type ComponentType} from 'react';

import {currentPlatform, RedditPlatform} from '../util/platform';
import {reactRenderer} from '../util/ui_interop';

import modmailObserver from './modmail';
import newRedditObserver from './newreddit';
import oldRedditObserver from './oldreddit';
import shredditObserver from './shreddit';

// FIXME: document all of these
interface PlatformSlotDetailsSubreddit {
    fullname?: string;
    name: string;
}

export type PlatformSlotDetailsUser = {
    deleted: true;
} | {
    deleted: false;
    fullname?: string;
    name: string;
};

interface PlatformSlotDetailsSubmission {
    fullname: string;
}

interface PlatformSlotDetailsComment {
    fullname: string;
}

// Slot names and the type of associated contextual information
// FIXME: document
export interface PlatformSlotDetails {
    submissionAuthor: {
        user: PlatformSlotDetailsUser;
        submission?: PlatformSlotDetailsSubmission;
        subreddit: PlatformSlotDetailsSubreddit;
        // distinguishType: null | 'moderator' | 'employee' | 'alumnus';
        // stickied: boolean;
    };
    commentAuthor: {
        user: PlatformSlotDetailsUser;
        comment: PlatformSlotDetailsComment;
        submission?: PlatformSlotDetailsSubmission;
        subreddit: PlatformSlotDetailsSubreddit;
        // distinguished: boolean;
        // stickied: boolean;
    };
    modmailAuthor: {
        user: PlatformSlotDetailsUser;
        subreddit: PlatformSlotDetailsSubreddit;
        thread: {fullname: string};
        message: {fullname: string};
        // authorIsModerator: boolean;
        // repliedAsSubreddit: boolean;
    };
    userHovercard: {
        user: PlatformSlotDetailsUser;
        subreddit: PlatformSlotDetailsSubreddit;
        contextFullname?: string;
    };
}
export type PlatformSlotLocation = keyof PlatformSlotDetails;

// Consumer code (used by toolbox modules)

// A consumer of a particular slot location which gets appropriate context and
// returns React content to be rendered in the slot
export type PlatformSlotContent<Location extends keyof PlatformSlotDetails> = ComponentType<{
    details: PlatformSlotDetails[Location];
    location: Location;
}>;

// Map of slot locations to consumers of the slot
const slotConsumers: {
    [K in keyof PlatformSlotDetails]?: PlatformSlotContent<K>[];
} = Object.create(null);

// FIXME: document
export function renderInSlots<K extends keyof PlatformSlotDetails> (locations: K[], render: PlatformSlotContent<K>) {
    if (!Array.isArray(locations)) {
        locations = [];
    }
    for (const location of locations) {
        if (!slotConsumers[location]) {
            slotConsumers[location] = [];
        }
        slotConsumers[location]?.push(render);
    }
}

// Observer code (used by platform-specific observers in this directory)

// FIXME: document
export type PlatformObserver = (
    /**
     * Creates a React root for a slot which will be populated with the
     * appropriate contents. Observers are responsible for calling this function
     * and inserting the resulting element into the DOM wherever the slot should
     * be rendered.
     */
    createRenderer: <Location extends keyof PlatformSlotDetails>(
        location: Location,
        details: PlatformSlotDetails[Location],
    ) => HTMLElement,
) => void;

// the actual `createRenderer` function observers get - returns a new react root
// which will contain all the contents different modules have registered for the
// given slot location
const createRenderer = <K extends keyof PlatformSlotDetails>(location: K, details: PlatformSlotDetails[K]) =>
    reactRenderer(
        <div
            className='tb-platform-slot'
            style={{display: 'inline-flex'}} // FIXME: do this in CSS
            data-location={location}
        >
            {/* TODO: Do we want to do anything more sophisticated here? */}
            {slotConsumers[location]?.map((Component, i) => (
                <Component
                    key={i}
                    details={details}
                    location={location}
                />
            ))}
        </div>,
    );

// Initialize the appropriate observer for the platform we've loaded into
// FIXME: this should really not be done here. export a function that does this
//        and have it get called from init.ts only if load conditions pass
let observers = {
    [RedditPlatform.OLD]: oldRedditObserver,
    [RedditPlatform.NEW]: newRedditObserver,
    [RedditPlatform.SHREDDIT]: shredditObserver,
    [RedditPlatform.MODMAIL]: modmailObserver,
};
if (currentPlatform != null) {
    let observer = observers[currentPlatform];
    observer(createRenderer);
}
