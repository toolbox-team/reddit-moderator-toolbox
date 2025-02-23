import $ from 'jquery';

import * as TBApi from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import * as TBHelpers from '../tbhelpers.js';
import {Module} from '../tbmodule.jsx';
import * as TBui from '../tbui.js';
import {getCache, setCache} from '../util/cache.ts';
import createLogger from '../util/logging.ts';
import {purifyObject} from '../util/purify.js';

const log = createLogger('DTagger');

export default new Module({
    name: 'Domain Tagger',
    id: 'DTagger',
    enabledByDefault: true,
    oldReddit: true,
    settings: [
        {
            id: 'displayType',
            description: 'Tag location',
            type: 'selector',
            values: ['Title dot', 'Post border', 'Post title', 'Domain background', 'Domain border'],
            default: 'title_dot',
        },
    ],
}, ({displayType}) => {
    const $body = $('body');

    $body.addClass(`tb-dt-type-${displayType}`);

    log.debug('run called from first init');
    run(true);

    function postToWiki (sub, json, reason) {
        // Update config cache to contain the new configuration
        getCache('Utils', 'configCache', {}).then(cachedConfigs => {
            cachedConfigs[sub] = json;
            setCache('Utils', 'configCache', cachedConfigs);
        });

        // Save the edit to the wiki
        TBApi.postToWiki('toolbox', sub, json, reason, true, false).then(() => {
            $('div.thing.link.dt-processed').removeClass('dt-processed');
            run(false);
        }).catch(err => {
            log.debug(err.responseText);
        });
    }

    // NER support.
    window.addEventListener('TBNewThings', () => {
        log.debug('run called from NER support');
        run(true);
    });

    // Main stuff

    async function run (addButton) {
        log.debug(`run called with addButton=${addButton}`);
        const $things = $('div.thing.link:not(.dt-processed)');

        // Build object lists per subreddit

        const subs = {};
        await Promise.all(
            $things.toArray().map(async thing => {
                const $thing = $(thing);
                const sub = $thing.attr('data-subreddit');

                // Mark non-mySubs as processed and remove them from collection
                if (!await TBCore.isModSub(sub)) {
                    $thing.addClass('dt-processed');
                    return;
                }

                processThing($thing, addButton);

                subs[sub] = subs[sub] || [];
                subs[sub].push(thing);
            }),
        );

        // Process subreddit objects' lists

        log.debug('Processing subreddits');
        log.debug(Object.keys(subs));

        TBCore.forEachChunkedDynamic(Object.entries(subs), ([sub, tags]) => {
            processSubreddit(sub, tags);
        }).then(() => {
            log.debug('Done processing things');
        });
    }

    function processThing ($thing, addButton) {
        if (!$thing.hasClass('dt-processed')) {
            $thing.addClass('dt-processed');
            if (addButton) {
                const $tag = $('<a>').addClass('add-domain-tag tb-bracket-button').attr('title', 'Color tag domains')
                    .attr('href', 'javascript:;').text('T');
                $thing.find('span.domain').after($tag);
            }
        }
    }

    async function processSubreddit (sub, things) {
        log.debug(`  Processing subreddit: /r/${sub}`);
        const config = await TBCore.getConfig(sub);
        log.debug(`    Config retrieved for /r/${sub}`);
        if (config && config.domainTags && config.domainTags.length > 0) {
            setTags(config.domainTags, things);
        }
    }

    function setTags (domainTags, things) {
        log.debug('    Setting tags');

        function applyTag ($domain, d, $entry) {
            $domain.attr('data-color', d.color);

            switch (displayType) {
                case 'domain_background': {
                    const textColor = TBui.getBestTextColor(d.color);
                    $domain.addClass(`tb-dt-bg-${d.color}`);
                    $domain.css({
                        'background-color': d.color,
                        'padding': '0 1px 1px',
                        'border-radius': '3px',
                        'color': textColor,
                    });
                    $domain.find('a').css('color', textColor);
                    break;
                }
                case 'domain_border':
                    $domain.css({
                        'border': `1px solid ${d.color}`,
                        'padding': '0 1px',
                        'border-radius': '3px',
                    });
                    break;
                case 'post_title':
                    $entry.find('a.title').css({
                        color: d.color,
                    });
                    break;
                case 'post_border':
                    $entry.css({
                        border: `3px solid${d.color}`,
                    });
                    break;
                case 'title_dot':
                default: {
                    let $span = $domain.parent().find('.tb-dt-little-dot');
                    if ($span.length < 1) {
                        $span = $('<span class="tb-dt-little-dot">&#9679;</span>');
                        $domain.before($span);
                    }

                    $span.css({
                        color: d.color,
                    });
                    break;
                }
            }
        }

        TBCore.forEachChunkedDynamic(things, thing => {
            const $thing = $(thing);
            const $entry = $thing.find('.entry');
            const $domain = $entry.find('span.domain');
            const domain = getThingDomain($thing);
            const thingID = $thing.attr('data-fullname');
            const tagged = [];

            domainTags.forEach(d => {
                // Check if the domain ends with a tagged domain (to allow for subdomains)
                if (domain === d.name) {
                    applyTag($domain, d, $entry);
                    tagged.push(thingID);
                } else if (
                    domain.includes(d.name, domain.length - d.name.length)
                    && tagged.includes(thingID)
                ) {
                    applyTag($domain, d, $entry);
                }
            });
        });
    }

    // Button events

    $body.on('click', '.add-domain-tag', e => {
        const $this = $(e.target);
        const $domain = $this.siblings('.domain');
        const currentColor = TBHelpers.colorNameToHex($domain.data('color') || '#cee3f8db');
        const $thing = $this.closest('.thing');
        const domain = getThingDomain($thing);
        const subreddit = TBHelpers.cleanSubredditName($thing.attr('data-subreddit'));

        function createPopup () {
            const $popupContent = $('<div>').addClass('dt-popup-content').append(
                $('<span>').addClass('dt-popup-color-content').append(
                    $('<input>').prop('type', 'text').addClass('domain-name').attr('value', domain).attr(
                        'data-subreddit',
                        subreddit,
                    ),
                ).append($('<input>').prop('type', 'color').addClass('domain-color').val(currentColor)),
            ).append($('<p>').text('This will tag the domain as shown.')).append(
                $('<p>').text('Ex: i.imgur.com is not imgur.com'),
            );

            return TBui.popup({
                title: `Domain Tagger - /r/${subreddit}`,
                tabs: [{
                    id: `dtagger_popup_${subreddit}`,
                    title: '',
                    tooltip: '',
                    help_text: '',
                    help_url: '',
                    content: $popupContent,
                    footer: `
                        ${TBui.actionButton('save', 'save-domain')}
                        ${TBui.actionButton('clear', 'clear-domain')}
                    `,
                }],
                cssClass: 'dtagger-popup',
            });
        }

        const $popup = createPopup().hide();

        // Add to page
        $popup.appendTo('body');
        $popup.css({
            left: e.pageX - 50,
            top: e.pageY - 10,
        });
        $popup.show();
    });

    $body.on('click', '.save-domain', function () {
        const $popup = $(this).closest('.dtagger-popup');
        const subreddit = $popup.find('.domain-name').attr('data-subreddit');

        const domainTag = {
            name: $popup.find('.domain-name').val(),
            color: $popup.find('.domain-color').val(),
        };

        $popup.remove();

        if (!domainTag.name || !domainTag.color) {
            return;
        }

        let {config} = TBCore;

        TBApi.readFromWiki(subreddit, 'toolbox', true).then(resp => {
            if (resp === TBApi.WIKI_PAGE_UNKNOWN) {
                return;
            }

            if (resp === TBApi.NO_WIKI_PAGE) {
                config.domainTags = [domainTag];
                postToWiki(subreddit, config, 'domain tagger: create new toolbox config');
                return;
            }

            // if we got this far, we have valid JSON
            config = resp;
            purifyObject(config);

            if (config.domainTags) {
                const tags = config.domainTags.filter(d => d.name === domainTag.name);
                tags.forEach(d => {
                    const idx = config.domainTags.indexOf(d);
                    let updateType;
                    if (domainTag.color === 'none') {
                        config.domainTags.splice(idx, 1);
                        updateType = 'delete';
                    } else {
                        config.domainTags[idx] = domainTag;
                        updateType = 'update';
                    }
                    postToWiki(subreddit, config, `${updateType} tag "${domainTag.name}"`);
                });
                if (!tags.length) {
                    config.domainTags.push(domainTag);
                    postToWiki(subreddit, config, `create tag "${domainTag.name}"`);
                }
            } else {
                config.domainTags = [domainTag];
                postToWiki(subreddit, config, `create new domain tags object, create tag "${domainTag.name}"`);
            }
        });
    });

    // Utilities

    function getThingDomain ($thing) {
        log.debug('Getting thing domain');
        let domain = $thing.find('span.domain a').attr('href').toLowerCase();
        log.debug(`  Raw = ${domain}`);
        let match = /\/domain\/(.+)\//.exec(domain);
        if (!match) {
            match = /(\/r\/.+)\//.exec(domain);
        }
        domain = match[1];
        log.debug(`  Result = ${domain}`);
        return domain;
    }
});
