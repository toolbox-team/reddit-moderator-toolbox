import $ from 'jquery';
import {useState} from 'react';
import {Provider} from 'react-redux';

import {useFetched, usePopupState, useSetting} from '../hooks';
import store from '../store/index';
import * as TBApi from '../tbapi';
import * as TBCore from '../tbcore';
import {niceDateDiff} from '../tbhelpers';
import TBListener from '../tblistener';
import {Module} from '../tbmodule';
import * as TBui from '../tbui';
import {icons} from '../util/icons';
import createLogger from '../util/logging';
import {getSettingAsync} from '../util/settings';
import {classes, createBodyShadowPortal, reactRenderer} from '../util/ui_interop';

import {BracketButton} from '../components/controls/BracketButton';
import {GeneralButton} from '../components/controls/GeneralButton';
import {Window} from '../components/Window';

import css from './historybutton.module.css';

const log = createLogger('HButton');

export default new Module({
    name: 'History Button',
    id: 'HButton',
    enabledByDefault: true,
    settings: [
        {
            id: 'rtsComment',
            type: 'boolean',
            default: true,
            description: 'Post user summary when submitting spam reports',
        },
        {
            id: 'alwaysComments',
            type: 'boolean',
            default: true,
            advanced: true,
            description: 'Load comment history immediately',
        },
        {
            id: 'commentCount',
            type: 'selector',
            values: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'],
            default: '1000',
            advanced: true,
            description: 'Number of comments to retrieve per user history',
        },
        {
            id: 'onlyshowInhover',
            type: 'boolean',
            default: () => getSettingAsync('GenSettings', 'onlyshowInhover', true),
            hidden: true,
        },
        {
            id: 'includeNsfwSearches',
            type: 'boolean',
            default: false,
            description: 'Include NSFW submissions in searches',
        },
    ],
}, async (options: Record<string, unknown>) => {
    log.debug('init');
    if (!await TBCore.modSubCheck()) {
        log.debug('mscheck failed');
        return;
    }

    log.debug('mscheck passed');

    TBListener.on('author', (e: CustomEvent) => {
        const $target = $(e.target!);
        // Skip adding the button next to the username if:
        // - the onlyShowInHover preference is set,
        // - we're not on old reddit (since the preference doesn't work there), and
        // - we didn't make the thing the author is on (since the hovercard doesn't show up on constructed things).
        if (options.onlyshowInhover && !TBCore.isOldReddit && !$target.closest('.tb-thing').length) {
            return;
        }
        const author = e.detail.data.author;
        const subreddit = e.detail.data.subreddit.name;

        if (author === '[deleted]') {
            return;
        }

        $target.append(reactRenderer(
            <Provider store={store}>
                <HistoryButtonUserRoot
                    user={author}
                    subreddit={subreddit}
                />
            </Provider>,
        ));
    });

    TBListener.on('userHovercard', (e: CustomEvent) => {
        const $target = $(e.target!);
        const author = e.detail.data.user.username;
        const subreddit = e.detail.data.subreddit && e.detail.data.subreddit.name;
        if (author === '[deleted]') {
            return;
        }

        $target.append(reactRenderer(
            <HistoryButtonUserRoot
                user={author}
                subreddit={subreddit}
                label='User History'
            />,
        ));
    });

    window.addEventListener('TBNewPage', event => {
        if ((event as CustomEvent).detail.pageType === 'userProfile') {
            const user = (event as CustomEvent).detail.pageDetails.user;
            TBui.contextTrigger('tb-user-history', {
                addTrigger: true,
                triggerText: 'user history',
                triggerIcon: icons.history,
                title: `Show history for /u/${user}`,
                dataAttributes: {
                    author: user,
                },
            });
        } else {
            TBui.contextTrigger('tb-user-profile', {addTrigger: false});
        }
    });
});

function HistoryButtonUserRoot ({user, subreddit, label = 'H'}: {user: string; subreddit: string; label?: string}) {
    const {shown, initialPosition, show, hide} = usePopupState();

    return (
        <>
            <BracketButton
                onClick={show}
                title="view & analyze user's submission and comment history"
            >
                {label}
            </BracketButton>
            {shown && initialPosition && createBodyShadowPortal(
                <HistoryPopup
                    user={user}
                    subreddit={subreddit}
                    initialPosition={initialPosition}
                    onClose={hide}
                />,
            )}
        </>
    );
}

const ratioClassName = (ratio: number, rawCount: number) =>
    ratio >= 0.1 && rawCount > 4 ? (ratio >= 0.2 ? css.danger : css.warning) : '';
const asPercentage = (ratio: number) => `${Math.round(ratio * 100)}%`;

function HistoryPopup ({user, subreddit: currentSubreddit, initialPosition, onClose}: {
    user: string;
    subreddit: string;
    initialPosition: {top: number; left: number};
    onClose?: () => void;
}) {
    // TODO: aaa why is this a string
    const commentCount = parseInt(useSetting('HButton', 'commentCount', '1000'), 10);
    const includeNsfwSearches = useSetting('HButton', 'includeNsfwSearches', false);
    const alwaysComments = useSetting('HButton', 'alwaysComments', true);

    const userInfo = useFetched(getUserInfo(user));
    const submissionData = useFetched(getSubmissionHistoryData(user));
    const commentData = useFetched(getCommentHistoryData(user, commentCount));

    const [commentReportShown, setCommentReportShown] = useState(alwaysComments);

    if (!userInfo || !submissionData) {
        return; // whatever
    }

    return (
        <Window
            title='History Button'
            draggable
            initialPosition={initialPosition}
            onClose={onClose}
        >
            <div className={css.windowContent}>
                <a href={TBCore.link(`/user/${user}`)} target='_blank' rel='noreferrer'>{user}</a>{' '}
                <span>({userInfo.submissionKarma} | {userInfo.commentKarma})</span>
                {!commentReportShown && (
                    <GeneralButton
                        className={css.button}
                        onClick={() => setCommentReportShown(true)}
                    >
                        comment history
                    </GeneralButton>
                )}
                <GeneralButton className={css.button}>view report in markdown</GeneralButton>
                <br />
                <span>redditor for {niceDateDiff(userInfo.createdAt)}</span>
                <br />
                <p className={css.disclaimer}>
                    <strong>Disclaimer:</strong> The information shown below is an <i>indication</i>{' '}
                    not a complete picture, it lacks the context you would get from having a look at a person{'\''}s
                    profile.
                </p>
                <b>Available history:</b>
                <br />
                {/* NOMERGE: this should display as "1000+" etc if we fetched to the end of a listing */}
                {submissionData.total} submissions
                <br />
                {commentReportShown && commentData && (
                    <span>
                        {commentData.total} comments, of those {commentData.onOwnPosts}{' '}
                        are in their own posts (commented as OP).
                    </span>
                )}
            </div>
            <div className={css.row}>
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>domain submitted from</th>
                                <th>count</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(submissionData.domains)
                                .sort(([_, a], [__, b]) => b.count - a.count)
                                .map(([domain, {count}]) => {
                                    const ratio = count / submissionData.total;

                                    // highlight excessive percentages
                                    const className = ratioClassName(ratio, count);

                                    // Link to search
                                    let domainSearchURL;
                                    const domainSearchQuery = new URLSearchParams({
                                        sort: 'new',
                                        feature: 'legacy_search',
                                        ...includeNsfwSearches && {include_over_18: 'on'},
                                    });
                                    const selfDomainMatch = domain.match(/^self\.(\w+)$/);
                                    if (selfDomainMatch) {
                                        // search for self posts in the given subreddit
                                        domainSearchQuery.set('q', `author:${user} is_self:1`);
                                        domainSearchQuery.set('restrict_sr', 'on');
                                        domainSearchURL = `/r/${selfDomainMatch[1]}/search?${domainSearchQuery}`;
                                    } else {
                                        domainSearchQuery.set('q', `author:${user} site:${domain} is_self:0`);
                                        domainSearchQuery.set('restrict_sr', 'off');
                                        domainSearchURL = `/search?${domainSearchQuery}`;
                                    }
                                    domainSearchURL = TBCore.link(domainSearchURL);

                                    return (
                                        <tr key={domain} className={className}>
                                            <td>
                                                <a
                                                    target='_blank'
                                                    rel='noreferrer'
                                                    href={domainSearchURL}
                                                    title={`view links ${user} recently submitted from '${domain}'`}
                                                >
                                                    {domain}
                                                </a>
                                            </td>
                                            <td>{count}</td>
                                            <td>{asPercentage(ratio)}</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>subreddit submitted to</th>
                                <th>count</th>
                                <th>%</th>
                                <th>karma</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(submissionData.subreddits)
                                .sort(([_, a], [__, b]) => b.count - a.count)
                                .map(([subreddit, {count, karma}]) => {
                                    const ratio = count / submissionData.total;

                                    const searchURL = TBCore.link(`/r/${subreddit}/search?${new URLSearchParams({
                                        q: `author:${user}`,
                                        restrict_sr: 'on',
                                        sort: 'new',
                                        feature: 'legacy_search',
                                        ...includeNsfwSearches && {include_over_18: 'on'},
                                    })}`);

                                    return (
                                        <tr
                                            key={subreddit}
                                            className={classes(
                                                ratioClassName(ratio, count),
                                                subreddit === currentSubreddit && css.currentSubreddit,
                                            )}
                                        >
                                            <td>
                                                <a
                                                    target='_blank'
                                                    rel='noreferrer'
                                                    href={searchURL}
                                                    title={`view links ${user} recently submitted to /r/${subreddit}`}
                                                >
                                                    {subreddit}
                                                </a>
                                            </td>
                                            <td>{count}</td>
                                            <td>{asPercentage(ratio)}</td>
                                            <td>{karma}</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className={css.row}>
                {commentReportShown && commentData && (
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th>subreddit commented in</th>
                                    <th>count</th>
                                    <th>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(commentData.subreddits)
                                    .sort(([_, a], [__, b]) => b - a)
                                    .map(([subreddit, count]) => {
                                        const ratio = count / commentData.total;
                                        return (
                                            <tr
                                                key={subreddit}
                                                className={classes(
                                                    ratioClassName(ratio, count),
                                                    subreddit === currentSubreddit && css.currentSubreddit,
                                                )}
                                            >
                                                <td>{subreddit}</td>
                                                <td>{count}</td>
                                                <td>{asPercentage(ratio)}</td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>account submitted from</th>
                                <th>count</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(submissionData.accounts)
                                .sort(([_, a], [__, b]) => b.count - a.count)
                                .map(([accountDomain, account]) => {
                                    const ratio = account.count / submissionData.total;
                                    const className = ratioClassName(ratio, account.count);
                                    return (
                                        <tr
                                            key={accountDomain}
                                            className={className}
                                        >
                                            <td>
                                                <a target='_blank' rel='noreferrer' href={account.url}>
                                                    {account.name}
                                                </a>
                                                -
                                                <a target='_blank' rel='noreferrer' href={account.provider_url}>
                                                    {account.provider}
                                                </a>
                                            </td>
                                            <td>{account.count}</td>
                                            <td>{asPercentage(ratio)}</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </Window>
    );
}

/** Fetch author information (karma, how long they've been a redditor for) */
async function getUserInfo (username: string) {
    const {data} = await TBApi.getJSON(`/user/${username}/about.json`);

    return {
        /** pass this through {@linkcode TBHelpers.niceDateDiff} */
        createdAt: new Date(data.created_utc * 1000),
        submissionKarma: data.link_karma,
        commentKarma: data.comment_karma,
    };
}

const TYPE = {
    PATH: 1, // e.g. example.org/path/user
    SUBDOMAIN: 2, // e.g. user.example.org
} as const;

/** @type {{[domain: string]: {path?: string; provider: string; type: 1 | 2}}} */
const domainSpecs: Record<string, {path?: string; provider: string; type: 1 | 2}> = {
    // keys are the supported sites, and determine if we have a match
    'flickr.com': {
        path: 'photos/',
        provider: 'flickr',
        type: TYPE.PATH,
    },
    'medium.com': {
        path: '@',
        provider: 'Medium',
        type: TYPE.PATH,
    },
    'speakerdeck.com': {
        provider: 'Speaker Deck',
        type: TYPE.PATH,
    },
    'blogspot.com': {
        provider: 'Blogspot',
        type: TYPE.SUBDOMAIN,
    },
    'tumblr.com': {
        provider: 'Tumblr',
        type: TYPE.SUBDOMAIN,
    },
    'deviantart.com': {
        provider: 'deviantart',
        type: TYPE.SUBDOMAIN,
    },
    'artstation.com': {
        path: 'artwork/',
        provider: 'artstation',
        type: TYPE.PATH,
    },
    'twitter.com': {
        provider: 'Twitter',
        type: TYPE.PATH,
    },
};

/**
 * Fetches submission history data for a given user.
 * @param username Name of the user whose history we're fetching
 */
async function getSubmissionHistoryData (username: string) {
    let total = 0;
    const domains: Record<string, {count: number}> = Object.create(null);
    const subreddits: Record<string, {count: number; karma: number}> = Object.create(null);

    const accounts: Record<string, {
        count: number;
        name: string;
        url: string;
        provider: string;
        provider_url: string;
    }> = Object.create(null);

    /** @type {string | undefined} */
    let after;

    while (true) {
        let d;
        try {
            d = await TBApi.getJSON(`/user/${username}/submitted.json`, {
                after: after ?? '',
                sort: 'new',
                limit: '100',
            });
        } catch {
            log.debug('Shadowbanned?');
            throw new Error('unable to load userdata; shadowbanned?');
        }

        // exit conditions
        if (!d.data.children.length) {
            break;
        }

        total += d.data.children.length;

        // For every submission, incremenet the count for the subreddit and domain by one.
        d.data.children.forEach((value: any) => {
            const submission = value.data;

            domains[submission.domain] ??= {count: 0};
            domains[submission.domain].count += 1;

            subreddits[submission.subreddit] ??= {count: 0, karma: 0};
            subreddits[submission.subreddit].count += 1;
            subreddits[submission.subreddit].karma += submission.score;

            if (submission.media && submission.media.oembed && submission.media.oembed.author_url) {
                addAccount({
                    name: submission.media.oembed.author_name,
                    url: submission.media.oembed.author_url,
                    provider: submission.media.oembed.provider_name,
                    provider_url: submission.media.oembed.provider_url,
                });
            } else {
                let domain = submission.domain;
                let spec = domainSpecs[domain];
                let details;

                if (!spec) {
                    // "sub.dom.ain.domain.com" -> "domain.com" (NOTE: does not support "domain.co.uk")
                    domain = domain.split('.').slice(-2).join('.');
                    spec = domainSpecs[domain];
                }

                if (spec) {
                    details = getDomainDetails(domain, spec, submission.url);
                    if (details) {
                        addAccount(details);
                    }
                }
            }
        });

        if (d.data.after) {
            after = d.data.after;
        } else {
            break;
        }
    }

    return {
        total,
        domains,
        subreddits,
        accounts,
    };

    /**
     * Take an object and add it to `accounts`.
     *
     * @param details {Object}
     */
    function addAccount (details: {name: string; url: string; provider: string; provider_url: string}) {
        details.url = details.url.replace('http://', 'https://');
        accounts[details.url] ??= {...details, count: 0};
        accounts[details.url].count++;
    }

    /**
     * Generate a `details` object that mimics the oembed object to be passed to `addAccount()`.
     *
     * @param spec {Object} from domainSpecs
     * @param url {String}
     * @returns {Object|undefined}
     */
    function getDomainDetails (
        domain: string,
        spec: (typeof domainSpecs)[keyof typeof domainSpecs] & {rx?: RegExp},
        url: string,
    ) {
        // cache the dynamic rx's
        if (!spec.rx) {
            if (spec.type === TYPE.PATH) {
                spec.rx = new RegExp(`${domain}/${spec.path || ''}([\\w-@]+)`);
            } else if (spec.type === TYPE.SUBDOMAIN) {
                spec.rx = new RegExp(`://([\\w-]+).${domain}`);
            }
        }

        const match = url.match(spec.rx!);
        const author = match && match[1];
        let scheme;
        let author_url;
        let provider_url;

        if (author) {
            scheme = `${url.split('://')[0]}://`;
            provider_url = `${scheme + domain}/`;

            if (spec.type === TYPE.PATH) {
                author_url = provider_url + (spec.path || '') + author;
            } else if (spec.type === TYPE.SUBDOMAIN) {
                author_url = `${scheme + author}.${domain}`;
            } else {
                throw new Error('invalid domain spec type');
            }

            return {
                name: author,
                provider: spec.provider,
                provider_url,
                url: author_url,
            };
        }
    }
}

/**
 * @param {string} username Name of the user whose history we are fetching
 * @param {number} commentCount Maximum number of comments to retrieve
 */
async function getCommentHistoryData (username: string, commentCount: number) {
    let total = 0;
    const onOwnPosts = 0;
    const subreddits: Record<string, number> = Object.create(null);

    let after: string | undefined;
    while (true) {
        let d;
        try {
            d = await TBApi.getJSON(`/user/${username}/comments.json`, {
                after,
                sort: 'new',
                limit: '100',
            });
        } catch {
            throw new Error('unable to load userdata; shadowbanned?');
        }
        if (!d.data.children.length) {
            break;
        }
        d.data.children.forEach((comment: any) => {
            const {subreddit} = comment.data;
            total += 1;
            subreddits[subreddit] ??= 0;
            subreddits[subreddit] += 1;
        });

        if (total >= commentCount) {
            break;
        }

        if (d.data.after) {
            after = d.data.after;
        } else {
            break;
        }
    }

    return {
        total,
        onOwnPosts,
        subreddits,
    };
}
