// Utilities for platform-specific handling of things.

/** Different Reddit platforms/frontends into which Toolbox might be loaded. */
enum RedditPlatform {
    /** "old Reddit," old.reddit.com */
    OLD,
    /**
     * "new reddit," often referred to as new.reddit.com, though this frontend
     * is increasingly being replaced by shreddit even on the new.reddit domain
     */
    NEW,
    /**
     * "shreddit" or "new new reddit," sh.reddit.com and gradually replacing
     * "new reddit" on new.reddit.com
     */
    SHREDDIT,
    /**
     * "new modmail," the dedicated modmail interface at mod.reddit.com. this
     * replaces modmail being accessed through the subreddit messages pages on
     * old reddit (old.reddit.com/r/sub/message) which is no longer accessible
     */
    MODMAIL,
}

export function getPlatform () {
    if (location.host === 'mod.reddit.com') {
        return RedditPlatform.MODMAIL;
    }
    if (document.getElementById('header')) {
        return RedditPlatform.OLD;
    }
    if (document.getElementById('AppRouter-main-content')) {
        return RedditPlatform.NEW;
    }
    // TODO: shreddit
    return null;
}

/**
 * A quick check to determine whether there's a logged-in user or not. We don't
 * actually need to get any information about the currently logged-in user this
 * way; we just want to see if there is one before we start sending API requests
 * to get user information and authentication/modhash.
 */
export function isUserLoggedInQuick () {
    switch (getPlatform()) {
        // old Reddit sets the `loggedin` class on the body
        case RedditPlatform.OLD:
            return document.body.classList.contains('loggedin');

        // new Reddit will have text in `#USER_DROPDOWN_ID` (username, karma, etc)
        case RedditPlatform.NEW:
            return !!document.getElementById('USER_DROPDOWN_ID')?.innerText;

        // TODO: shreddit

        // modmai will have a username in the user menu in the header
        case RedditPlatform.MODMAIL:
            return !!document.querySelector('.Header__user:not(:empty)');

        default:
            return false;
    }
}
