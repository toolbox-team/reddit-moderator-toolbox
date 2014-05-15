// ==UserScript==
// @name        Mod Domain Tagger
// @namespace   http://www.reddit.com/r/toolbox
// @author      agentlame, creesch
// @description Highlight domains for easier moderation
// @include     http://www.reddit.com/r/*/about/unmoderated*
// @include     http://*.reddit.com/r/*/about/unmoderated*
// @include     http://reddit.com/r/*/about/unmoderated*
// @include     http://www.reddit.com/r/*/about/modqueue*
// @include     http://*.reddit.com/r/*/about/modqueue*
// @include     http://reddit.com/r/*/about/modqueue*
// @include     *://*.reddit.com/r/*
// @downloadURL http://userscripts.org/scripts/source/168936.user.js
// @version     2.7
// ==/UserScript==


(function domaintagger() {
    if (!TBUtils.logged || !TBUtils.getSetting('DomainTagger', 'enabled', false)) return;
    $.log('Loading Domain Tagger Module');

    var YELLOW = '#EAC117', GREEN = '#347235', RED = '#FF0000', BLACK = '#000000';
    var subs = [];

    TBUtils.getModSubs(function () {
        run();
    });

    function postToWiki(sub, json) {
        TBUtils.configCache[sub] = json;

        TBUtils.postToWiki('toolbox', sub, json, true, false, function done(succ, err) {
            if (succ) {
                run();
            } else {
                $.log(err.responseText, true);
            }
        });
    }

    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();
    });

    function run() {
        var things = $('div.thing:not(.dt-processed)');

        TBUtils.forEachChunked(things, 25, 500, processThing, function () {
            TBUtils.forEachChunked(subs, 10, 500, processSub);
        });
    }

    function processThing(thing) {
        var tag = '<span style="color:#888888; font-size:x-small;">&nbsp;[<a class="add-domain-tag" "href="javascript:;">T</a>]</span>';

        if ($(thing).hasClass('dt-processed')) {
            return;
        }
        $(thing).addClass('dt-processed');

        //var subreddit = $(thing).find('a.subreddit').text() || $('.titlebox h1.redditname a').text();

        var subreddit = TBUtils.getThingInfo(thing, true).subreddit;
        if (!subreddit) return;

        $(thing).attr('subreddit', subreddit);

        $(thing).find('span.domain:first').after(tag);

        if ($.inArray(subreddit, subs) == -1) {
            subs.push(subreddit);
        }
    }

    function processSub(currsub) {
        if (TBUtils.configCache[currsub] !== undefined) {
            setTag(TBUtils.configCache[currsub], currsub);
            return;
        }

        if (!currsub || TBUtils.noConfig.indexOf(currsub) != -1) return;

        TBUtils.readFromWiki(currsub, 'toolbox', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                return;
            }

            if (resp === TBUtils.NO_WIKI_PAGE) {
                TBUtils.noConfig.push(currsub);
                return;
            }

            // We likely have a god config, but maybe not domain tags.
            TBUtils.configCache[currsub] = resp;
            setTag(resp, currsub);
        });
    }

    function setTag(config, subreddit) {
        if (!config.domainTags || config.domainTags.length < 1) {
            return;
        }

        // looks like we have domain tags
        var things = $('div.thing[subreddit=' + subreddit + ']');
        TBUtils.forEachChunked(things, 25, 250, function (thing) {

            var domain = $(thing).find('span.domain:first').text().replace('(', '').replace(')', '').toLocaleLowerCase();
            var entry = $(thing).find('.entry');

            $.grep(config.domainTags, function (d) {
                if (domain.indexOf(d.name) !== -1) {
                    $(entry).css({
                        'border': '3px solid' + d.color
                    });
                }
            });
        });
    }

    $('body').delegate('.add-domain-tag', 'click', function (e) {
        // TODO: This should use getThingInfo(), but I don't want to introduce any bugs for 2.0 by messing with it.
        var thing = $(e.target).closest('.thing');
        var domain = $(thing).find('span.domain:first').text().replace('(', '').replace(')', '').toLocaleLowerCase();
        var subreddit = ($(thing).find('a.subreddit').text() || $('.titlebox h1.redditname a').text()).replace('/r/', '');

        // Make box & add subreddit radio buttons
        var popup = $('\
                <div class="dtagger-popup">\
                    <div class="dtagger-popup-header">\
                        Domain Tagger - /r/'+ subreddit +'\
                        <span class="close right"><a href="javascript:;">✕</a></span>\
                    </div>\
                    <div class="dtagger-popup-content">\
                        <p>\
                            <input type="text" class="domain-name" value="' + domain + '" subreddit="' + subreddit + '"/>\
                            <select class="domain-color">\
                                <option value="' + GREEN + '">green</option><option value="' + YELLOW + '">yellow</option>\
                                <option value="' + RED + '">red</option><option value="' + BLACK + '">black</option><option value="none">none</option>\
                            </select>\
                        </p>\
                        <p>This will tag the domain as shown. IE: i.imgur.com is not imgur.com</p>\
                    </div>\
                    <div class="dtagger-popup-footer">\
                       <button class="save-domain" title="NOTE: this will tag the domain as shown.\nDon\'t save i.imgur.com if you mean to tag imgur.com">save</button>\
                    </div>\
                <div>')
            .appendTo('body')
            .css({
                left: e.pageX - 50,
                top: e.pageY - 10,
                display: 'block'
            });
    });

    $('body').delegate('.save-domain', 'click', function () {
        var popup = $(this).closest('.dtagger-popup'),
            subreddit = popup.find('.domain-name').attr('subreddit');

        var domainTag = {
            name: popup.find('.domain-name').val(),
            color: popup.find('.domain-color option:selected').val()
        };

        var config = TBUtils.config;

        $(popup).remove();

        if (!domainTag.name || !domainTag.color) return;

        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                return;
            }

            if (resp === TBUtils.NO_WIKI_PAGE) {
                config.domainTags = [];
                config.domainTags.push(domainTag);
                postToWiki(subreddit, config);
                return;
            }

            // if we got this far, we have valid JSON
            config = resp;

            if (config.domainTags) {
                var results = $.grep(config.domainTags, function (d) {
                    if (d.name === domainTag.name) {
                        var idx = config.domainTags.indexOf(d);
                        if (domainTag.color === 'none') {
                            config.domainTags.splice(idx, 1);
                        } else {
                            config.domainTags[idx] = domainTag;
                        }
                        postToWiki(subreddit, config);

                        return d;
                    }
                });

                if (!results || results.length < 1) {
                    config.domainTags.push(domainTag);
                    postToWiki(subreddit, config);
                }
            } else {
                config.domainTags = [];
                config.domainTags.push(domainTag);
                postToWiki(subreddit, config);
            }
        });

    });

    $('body').delegate('.dtagger-popup .close', 'click', function () {
        $(this).parents('.dtagger-popup').remove();
    });


})();