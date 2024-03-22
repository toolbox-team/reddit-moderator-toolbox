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
