import $ from 'jquery';

import {getThingInfo} from '../tbcore.js';
import TBLog from '../tblog';
import {PlatformObserver} from '.';

const log = TBLog('observer:old');

// Class added to items when they are added to the intersection observer, to
// prevent them from being observed multiple times
const THING_OBSERVED_CLASS = 'tb-observer-oldreddit-thing-observed';

// Class added to items when they come into the viewport and have their slots
// added, to prevent having slots duplicated in case another intersection
// observer event causes it to be processed again
const THING_PROCESSED_CLASS = 'tb-observer-oldreddit-thing-processed';

export default (createRenderer => {
    /**
     * {@linkcode IntersectionObserver} that handles adding renderers to things
     * when they are about to scroll into view.
     */
    const viewportObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(async ({target, isIntersecting}) => {
            // The observer fires for everything on page load. This makes sure
            // that we really only act on those items that are visible.
            if (!isIntersecting) {
                return;
            }

            // Don't continue observing the element once it's become visible.
            observer.unobserve(target);

            // If the element's parent is updated, sometimes it gets emitted
            // again anyway. Check for stuff we've seen before by checking for
            // an added class.
            if (target.classList.contains(THING_PROCESSED_CLASS)) {
                log.debug('target observed a second time?? so it *does* happen sometimes', target);
                return;
            }
            target.classList.add(THING_PROCESSED_CLASS);

            // Get information about the item so we can fill in context data
            const info = await getThingInfo($(target));

            if (info.kind === 'submission') {
                const entryEl = target.querySelector('.entry');
                const authorEl = entryEl?.querySelector('.tagline :is(.author, time + span)');

                // TODO: We don't have non-author slots yet, but
                // entryEl?.appendChild(createRenderer(...))

                authorEl?.after(createRenderer('submissionAuthor', {
                    user: (info.author && info.author !== '[deleted]')
                        ? {deleted: false, name: info.author}
                        : {deleted: true},
                    subreddit: {
                        name: info.subreddit,
                    },
                    submission: {
                        fullname: info.id as string,
                    },
                }));
            }

            if (info.kind === 'comment') {
                const entryEl = target.querySelector(':scope > .entry');
                const authorEl = entryEl?.querySelector(':scope > .tagline :is(.author, em)');

                // TODO: We don't have non-author slots yet, but
                // entryEl?.appendChild(createRenderer(...));

                authorEl?.after(createRenderer('commentAuthor', {
                    user: (info.author && info.author !== '[deleted]')
                        ? {
                            deleted: false,
                            name: info.author,
                        }
                        : {deleted: true},
                    submission: {
                        fullname: info.postID,
                    },
                    comment: {
                        fullname: info.id as string,
                    },
                    subreddit: {
                        name: info.subreddit,
                    },
                }));
            }
        });
    }, {rootMargin: '200px'});

    // Finds unprocessed items in the DOM and starts waiting for them to get
    // close to the viewport edge
    function observeNewThings () {
        $(`div.content .thing:not(.${THING_OBSERVED_CLASS}) .entry`).closest('.thing').each(function () {
            this.classList.add(THING_OBSERVED_CLASS);
            viewportObserver.observe(this);
        });
    }

    observeNewThings();

    // TODO: In the future we'd like to remove the TBNewThings event
    //       entirely and consolidate RES infinite scroll logic in this
    //       file, since it's only relevant on old Reddit. But not all our
    //       UI uses the slots/observer API yet, so it doesn't make sense to
    //       pull it in here yet.
    window.addEventListener('TBNewThings', () => {
        observeNewThings();
    });
}) satisfies PlatformObserver;
