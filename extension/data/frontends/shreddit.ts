import TBLog from '../tblog';
import {observeSubtree} from '../util/dom';
import {PlatformObserver} from '.';

const log = TBLog('observer:shreddit');

export default (createRenderer => {
    observeSubtree(document, {childList: true}, record => {
        if (!record.addedNodes.length) {
            return;
        }
        // TODO: god there has to be a more efficient way to do this an querying
        //       the entire document on every DOM node insertion
        const elements = document.querySelectorAll(`
            :is(
                shreddit-post,
                community-highlight-card
            ):not([data-tb-shreddit-seen])
        `);

        for (const postElement of elements) {
            const authorName =
                // normal posts have the author attribute
                postElement.getAttribute('author')
                // carousel posts don't have this cleanly so fuck it we ball
                || postElement.querySelector('[slot="label"]')?.textContent!.trim().replace('u/', '');

            // both have these
            const authorFullname = postElement.getAttribute('author-id');
            // TODO: does this work for usersubs as well? probably not
            const subredditName = postElement.getAttribute('subreddit-prefixed-name')!.replace('r/', '');
            const subredditFullname = postElement.getAttribute('subreddit-id')!;

            // highlight cards just add that string to the front of the ID but
            // both have the post ID in the `id` attribute
            // TODO: i don't know if this is consistent or if reddit is using
            //       the `id` property correctly here e.g. in modqueue where
            //       metadata for a single post might show up multiple times.
            //       this needs more testing in different places to make sure
            const postFullname = postElement.getAttribute('id')!.replace('highlight_card_', '');

            // normal posts have is-author-deleted but i don't really trust it.
            // TODO: this is untested in carousel posts but it should be fine?
            const isAuthorDeleted = postElement.getAttribute('is-author-deleted') || authorName === '[deleted]';

            const slotRenderer = createRenderer('submissionAuthor', {
                user: isAuthorDeleted ? {deleted: true} : {
                    deleted: false,
                    name: authorName!,
                    fullname: authorFullname || undefined,
                },
                subreddit: {
                    name: subredditName,
                    fullname: subredditFullname,
                },
                submission: {
                    fullname: postFullname,
                },
            });

            const slotWrapper = document.createElement('span');
            slotWrapper.classList.add('tb-shreddit-slot');
            // shreddit posts do this fun thing where there's an `<a>` with
            // `position: absolute` overlaid above the entire post element, and
            // individual links in the post display just get `position:
            // relative` to move them above that giant sheet link. we copy this
            slotWrapper.style.position = 'relative';
            // prevent click events on our stuff from propagating to the normal
            // UI and causing page navigation or other unwanted things
            slotWrapper.onclick = event => {
                event.preventDefault();
                event.stopImmediatePropagation();
            };
            slotWrapper.append(slotRenderer);

            // NOTE: for some reason `tagName` is ALL-UPPER-CASE on custom
            //       elements in shreddit? i don't fully understand why. custom
            //       elements scare me. `toLowerCase` here is probably
            //       unnecessary but i think it makes it more readable
            if (postElement.tagName.toLowerCase() === 'shreddit-post') {
                postElement.querySelector(':scope > [slot="credit-bar"] .created-separator')!.before(slotWrapper);
            } else {
                // :sparkles:
                postElement.querySelector(':scope > span > span > span + span')!.after(slotWrapper);
            }
            postElement.setAttribute('data-tb-shreddit-seen', '');
        }
    });
}) satisfies PlatformObserver;
