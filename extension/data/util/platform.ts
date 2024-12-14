// Utilities for platform-specific handling of things.

/** Different Reddit platforms/frontends into which Toolbox might be loaded. */
export enum RedditPlatform {
    /** "old Reddit," old.reddit.com */
    OLD,
    // new.reddit.com, the first "new reddit", has been completely removed from
    // the site and is no longer accessible. it previously used `NEW`
    /**
     * "shreddit" or "new new reddit" (or nowadays just "new reddit" to many,
     * since the first "new reddit" is completely dead), sh.reddit.com
     */
    SHREDDIT,
    /**
     * "new modmail," the dedicated modmail interface at mod.reddit.com. this
     * replaces modmail being accessed through the subreddit messages pages on
     * old reddit (old.reddit.com/r/sub/message) which is no longer accessible
     */
    MODMAIL,
}

export const currentPlatform = (() => {
    if (location.host === 'mod.reddit.com') {
        return RedditPlatform.MODMAIL;
    }
    if (document.getElementById('header')) {
        return RedditPlatform.OLD;
    }
    if (document.querySelector('shreddit-app')) {
        return RedditPlatform.SHREDDIT;
    }
    return null;
})();

/**
 * A quick check to determine whether there's a logged-in user or not. We don't
 * actually need to get any information about the currently logged-in user this
 * way; we just want to see if there is one before we start sending API requests
 * to get user information and authentication/modhash.
 */
export function isUserLoggedInQuick () {
    switch (currentPlatform) {
        // old Reddit sets the `loggedin` class on the body
        case RedditPlatform.OLD:
            return document.body.classList.contains('loggedin');

        // shreddit will have an attribute `user-logged-in` on its app root
        case RedditPlatform.SHREDDIT:
            return !!document.querySelector('shreddit-app[user-logged-in=true]');

        // modmai will have a username in the user menu in the header
        case RedditPlatform.MODMAIL:
            return !!document.querySelector('.Header__user:not(:empty)');

        default:
            return false;
    }
}
