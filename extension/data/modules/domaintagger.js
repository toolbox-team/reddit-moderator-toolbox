function domaintagger() {

var self = new TB.Module('Domain Tagger');
self.shortname = 'DTagger';

////Default settings
self.settings['enabled']['default'] = true;

self.register_setting('displayType', {
    'type': 'selector',
    'values': ['Title dot', 'Post border', 'Post title', 'Domain background', 'Domain border'],
    'default': 'title_dot',
    'title': 'Tag location'
});

self.init = function() {
    //Get settings
    var tagType = this.setting('displayType'),
        $body = $('body');

    TBUtils.getModSubs(function () {
        run();
    });

    function postToWiki(sub, json, reason) {
        TBUtils.configCache[sub] = json;

        TBUtils.postToWiki('toolbox', sub, json, reason, true, false, function done(succ, err) {
            if (succ) {
                run();
            } else {
                self.log(err.responseText);
            }
        });
    }

    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();
    });

    function run() {
        var $things = $('div.thing.link:not(.dt-processed)'),
            subs = {};

        // Build object lists per subreddit
        self.log("Processing things");
        TBUtils.forEachChunked($things, 25, 500, function(thing) {
            var sub = processThing($(thing));
            if (sub !== undefined) {
                if (subs[sub] === undefined) {
                    subs[sub] = [];
                }
                subs[sub].push(thing);
            }
        }, function () {
            self.log("Processing subreddits");
            self.log(Object.keys(subs));

            // Process each subreddit's object list
            TBUtils.forEachChunked(Object.keys(subs), 10, 500, function (sub) {
                processSubreddit(sub, subs[sub]);
            });
        });
    }

    function processThing($thing) {
        if ($thing.hasClass('dt-processed')) {
            return;
        }
        $thing.addClass('dt-processed');

        var subreddit = TBUtils.getThingInfo($thing, true).subreddit;
        if (!subreddit) {
            return;
        }
        $thing.attr('subreddit', subreddit);

        var tag = '<a class="add-domain-tag tb-bracket-button" title="Color tag domains" "href="javascript:;">T</a>';
        $thing.find('span.domain').after(tag);

        return subreddit;
    }

    function processSubreddit(sub, things) {
        self.log("  Processing subreddit: /r/" + sub);
        TBUtils.getConfig(sub, function (config) {
            self.log("    Config retrieved for /r/" + sub);
            if (config && config.domainTags && config.domainTags.length > 0) {
                setTags(config.domainTags, things);
            }
        });
    }

    function setTags(domainTags, things) {
        self.log("    Setting tags");

        function applyTag($domain, d, $entry) {
            switch (tagType) {
                case "domain_background":
                    $domain.css({
                        'background-color': d.color,
                        'padding': '0 1px 1px',
                        'border-radius': '3px'
                    });
                    break;
                case "domain_border":
                    $domain.css({
                        'border': "1px solid " + d.color,
                        'padding': '0 1px',
                        'border-radius': '3px'
                    });
                    break;
                case "post_title":
                    $entry.find('a.title').css({
                        'color': d.color
                    });
                    break;
                case "post_border":
                    $entry.css({
                        'border': '3px solid' + d.color
                    });
                    break;
                case "title_dot":
                default:
                    var $span = $domain.parent().find('.tb-dt-little-dot');
                    if ($span.length < 1) {
                        $span = $('<span class="tb-dt-little-dot">&#9679;</span>');
                        $domain.before($span);
                    }

                    $span.css({
                        'color': d.color
                    });
                    break;
            }
        }

        TBUtils.forEachChunked(things, 25, 250, function (thing) {
            var $thing = $(thing),
                $entry = $thing.find('.entry'),
                $domain = $entry.find('span.domain'),
                domain = getThingDomain($thing),
                thingID = $thing.attr('data-fullname'),
                tagged = [];

            $.each(domainTags, function (i, d) {
                // Check if the domain ends with a tagged domain (to allow for subdomains)
                if (domain === d.name) {
                    applyTag($domain, d, $entry);
                    tagged.push(thingID);
                } else if (domain.indexOf(d.name, domain.length - d.name.length) !== -1
                    && tagged.indexOf(thingID) === -1) {
                    applyTag($domain, d, $entry);
                }
            });
        });
    }

    // Button events

    $body.on('click', '.add-domain-tag', function (e) {
        var $thing = $(e.target).closest('.thing'),
            domain = getThingDomain($thing),
            subreddit = ($thing.find('a.subreddit').text() || $('.titlebox h1.redditname a').text());

        subreddit = TB.utils.cleanSubredditName(subreddit);

        var popupContent = '\
            <p>\
                <input type="text" class="domain-name" value="' + domain + '" subreddit="' + subreddit + '"/>\
                <select class="domain-color tb-action-button inline-button">\
                    <option value="none">none</option>\
                </select>\
            </p>\
            <p>This will tag the domain as shown. IE: i.imgur.com is not imgur.com</p>';

        var popupSave = '<button class="save-domain tb-action-button">save</button>';

        var $popup = TBui.popup("Domain Tagger - /r/" + subreddit, [{
            id: "dtagger_popup_" + subreddit,
            title: "",
            tooltip: "",
            help_text: "",
            help_url: "",
            content: popupContent,
            footer: popupSave
        }], null, "dtagger-popup");

        $popup.appendTo('body')
            .css({
                left: e.pageX - 50,
                top: e.pageY - 10,
                display: 'block'
            });

        //Add selectable colors
        var $color_selector = $popup.find('.domain-color');
        $.each(TBui.standardColors, function (key, value) {
            $color_selector.append($('<option>').attr('value', value).text(key));
        });
    });

    $body.on('click', '.save-domain', function () {
        var popup = $(this).closest('.dtagger-popup'),
            subreddit = popup.find('.domain-name').attr('subreddit');

        var domainTag = {
            name: popup.find('.domain-name').val(),
            color: popup.find('.domain-color option:selected').val()
        };

        var config = TBUtils.config;

        $(popup).remove();

        if (!domainTag.name || !domainTag.color) {
            return;
        }

        TBUtils.readFromWiki(subreddit, 'toolbox', true, function (resp) {
            if (resp === TBUtils.WIKI_PAGE_UNKNOWN) {
                return;
            }

            if (resp === TBUtils.NO_WIKI_PAGE) {
                config.domainTags = [];
                config.domainTags.push(domainTag);
                postToWiki(subreddit, config, 'domain tagger: create new toolbox config');
                return;
            }

            // if we got this far, we have valid JSON
            config = resp;

            if (config.domainTags) {
                var results = $.grep(config.domainTags, function (d) {
                    if (d.name === domainTag.name) {
                        var idx = config.domainTags.indexOf(d),
                            updateType;
                        if (domainTag.color === 'none') {
                            config.domainTags.splice(idx, 1);
                            updateType = 'delete';
                        } else {
                            config.domainTags[idx] = domainTag;
                            updateType = 'update';
                        }
                        postToWiki(subreddit, config, updateType + ' tag "' + domainTag.name + '"');

                        return d;
                    }
                });

                if (!results || results.length < 1) {
                    config.domainTags.push(domainTag);
                    postToWiki(subreddit, config, 'create tag "' + domainTag.name + '"');
                }
            } else {
                config.domainTags = [];
                config.domainTags.push(domainTag);
                postToWiki(subreddit, config, 'create new domain tags object, create tag "' + domainTag.name + '"');
            }
        });

    });

    $body.on('click', '.dtagger-popup .close', function () {
        $(this).parents('.dtagger-popup').remove();
    });

    // Utilities

    function getThingDomain($thing) {
        self.log("Getting thing domain");
        var domain = $thing.find('span.domain a').attr('href').toLowerCase();
        self.log("  Raw = " + domain);
        var match = /\/domain\/(.+)\//.exec(domain);
        if (!match) {
            match = /(\/r\/.+)\//.exec(domain);
        }
        domain = match[1];
        self.log("  Result = " + domain);
        return domain;
    }
};

TB.register_module(self);
}

(function () {
    window.addEventListener("TBModuleLoaded", function () {
        domaintagger();
    });
})();
