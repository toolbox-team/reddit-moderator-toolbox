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

        $body.addClass(`tb-dt-type-${tagType}`);

        TBUtils.getModSubs(function () {
            self.log('run called from getModSubs');
            self.log(TBUtils.mySubs);
            run(true);
        });

        function postToWiki(sub, json, reason) {
            TBUtils.configCache[sub] = json;

            TBUtils.postToWiki('toolbox', sub, json, reason, true, false, function done(succ, err) {
                if (succ) {
                    $('div.thing.link.dt-processed').removeClass('dt-processed');
                    run(false);
                } else {
                    self.log(err.responseText);
                }
            });
        }

        // NER support.
        window.addEventListener('TBNewThings', function () {
            self.log('run called from NER support');
            run(true);
        });

        // Main stuff

        function run(addButton) {
            self.log(`run called with addButton=${addButton}`);
            var $things = $('div.thing.link').not('.dt-processed'),
                subs = {};

            // Mark non-mySubs as processed and remove them from collection
            $things.filter(function(){
                return !TBUtils.modsSub(this.dataset['subreddit']);
            }).addClass('dt-processed');

            $things = $things.not('.dt-processed');

            // Build object lists per subreddit
            self.log('Processing things');
            self.startProfile('build-object-list');
            TBUtils.forEachChunked($things, 25, 250, function(thing) {
                self.startProfile('build-object-list-inner');

                var $thing = $(thing),
                    sub = $thing.attr('data-subreddit');

                processThing($thing, addButton);

                if (subs[sub] === undefined) {
                    subs[sub] = [];
                }
                subs[sub].push(thing);

                self.endProfile('build-object-list-inner');
            },
            // Process subreddit objects' lists
            function () {
                self.endProfile('build-object-list');

                self.log('Processing subreddits');
                self.log(Object.keys(subs));

                TBUtils.forEachChunked(Object.keys(subs), 25, 250, function (sub) {
                    processSubreddit(sub, subs[sub]);
                },
                function () {
                    self.log('Done processing things');
                    self.printProfiles();
                });
            });
        }

        function processThing($thing, addButton) {
            if (!$thing.hasClass('dt-processed')) {
                $thing.addClass('dt-processed');
                if (addButton) {
                    var tag = $('<a>').addClass('add-domain-tag tb-bracket-button').attr('title', 'Color tag domains').attr('href', 'javascript:;').text('T');

                    $thing.find('span.domain').after(tag);
                }
            }
        }

        function processSubreddit(sub, things) {
            self.log(`  Processing subreddit: /r/${sub}`);
            TBUtils.getConfig(sub, function (config) {
                self.log(`    Config retrieved for /r/${sub}`);
                if (config && config.domainTags && config.domainTags.length > 0) {
                    setTags(config.domainTags, things);
                }
            });
        }

        function setTags(domainTags, things) {
            self.log('    Setting tags');

            function applyTag($domain, d, $entry) {
                $domain.attr('data-color', d.color);

                switch (tagType) {
                case 'domain_background':
                    var textColor = TBui.getBestTextColor(d.color);
                    $domain.addClass(`tb-dt-bg-${d.color}`);
                    $domain.css({
                        'background-color': d.color,
                        'padding': '0 1px 1px',
                        'border-radius': '3px',
                        'color': textColor
                    });
                    $domain.find('a').css('color', textColor);
                    break;
                case 'domain_border':
                    $domain.css({
                        'border': `1px solid ${d.color}`,
                        'padding': '0 1px',
                        'border-radius': '3px'
                    });
                    break;
                case 'post_title':
                    $entry.find('a.title').css({
                        'color': d.color
                    });
                    break;
                case 'post_border':
                    $entry.css({
                        'border': `3px solid${d.color}`
                    });
                    break;
                case 'title_dot':
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

            self.startProfile('set-tags');
            var done = false;
            TBUtils.forEachChunked(things, 25, 250, function (thing) {
                self.startProfile('set-tags-inner');
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
                    }
                    else if (domain.indexOf(d.name, domain.length - d.name.length) !== -1
                        && tagged.indexOf(thingID) === -1) {
                        applyTag($domain, d, $entry);
                    }
                });
                self.endProfile('set-tags-inner');
                if(done) {
                    self.endProfile('set-tags');
                }
            },
            function () {
                done = true;
            });
        }

        // Button events

        $body.on('click', '.add-domain-tag', function (e) {
            var $this = $(e.target),
                $domain = $this.siblings('.domain'),
                currentColor = $domain.data('color'),
                $thing = $this.closest('.thing'),
                domain = getThingDomain($thing),
                //subreddit = ($thing.find('a.subreddit').text() || $('.titlebox h1.redditname a').text());
                subreddit = $thing.data('subreddit');

            subreddit = TB.utils.cleanSubredditName(subreddit);

            function createPopup() {
                var popupContent = $('<div>').addClass('dt-popup-content').append(
                    $('<span>').addClass('dt-popup-color-content').append(
                        $('<input>').prop('type', 'text').addClass('domain-name').attr('value', domain).attr('data-subreddit', subreddit)
                    ).append(
                        $('<input>').prop('type', 'text').addClass('domain-color')
                    )
                ).append(
                    $('<p>').text('This will tag the domain as shown.')
                ).append(
                    $('<p>').text('Ex: i.imgur.com is not imgur.com')
                );

                var popupSave = $('<div>').append(
                    $('<button>').addClass('save-domain tb-action-button').text('save')
                ).append(
                    $('<button>').addClass('clear-domain tb-action-button').text('clear')
                );

                return TBui.popup(`Domain Tagger - /r/${subreddit}`, [{
                    id: `dtagger_popup_${subreddit}`,
                    title: '',
                    tooltip: '',
                    help_text: '',
                    help_url: '',
                    content: popupContent,
                    footer: popupSave
                }], null, 'dtagger-popup');
            }

            var $popup = createPopup().hide();

            // Init color selector
            var colors = [];
            for(var c in TBui.standardColors) {
                if(TBui.standardColors.hasOwnProperty(c)) {
                    colors.push(TBui.standardColors[c]);
                }

            }
            var colorPalette = [];
            for(var i = 0; i < colors.length; i += 2) {
                colorPalette.push([colors[i], colors[i+1]]);
            }

            var $colorSelector = $popup.find('.domain-color');
            $colorSelector.spectrum({
                color: currentColor,
                showInput: true,
                showInitial: true,
                allowEmpty: false,
                showAlpha: false,
                preferredFormat: 'hex',
                containerClassName: 'dt-color-chooser',
                showPalette: true,
                showSelectionPalette: false,
                hideAfterPaletteSelect: true,
                palette: colorPalette
            });

            // Add to page
            $popup.appendTo('body');
            $popup.css({
                left: e.pageX - 50,
                top: e.pageY - 10
            });
            $popup.show();
        });

        $body.on('click', '.save-domain', function () {
            var popup = $(this).closest('.dtagger-popup'),
                subreddit = popup.find('.domain-name').data('subreddit');

            var domainTag = {
                name: popup.find('.domain-name').val(),
                color: popup.find('.domain-color').val()
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
                            postToWiki(subreddit, config, `${updateType} tag "${domainTag.name}"`);

                            return d;
                        }
                    });

                    if (!results || results.length < 1) {
                        config.domainTags.push(domainTag);
                        postToWiki(subreddit, config, `create tag "${domainTag.name}"`);
                    }
                } else {
                    config.domainTags = [];
                    config.domainTags.push(domainTag);
                    postToWiki(subreddit, config, `create new domain tags object, create tag "${domainTag.name}"`);
                }
            });
        });

        $body.on('click', '.dtagger-popup .close', function () {
            $(this).parents('.dtagger-popup').remove();
        });

        // Utilities

        function getThingDomain($thing) {
            self.log('Getting thing domain');
            var domain = $thing.find('span.domain a').attr('href').toLowerCase();
            self.log(`  Raw = ${domain}`);
            var match = /\/domain\/(.+)\//.exec(domain);
            if (!match) {
                match = /(\/r\/.+)\//.exec(domain);
            }
            domain = match[1];
            self.log(`  Result = ${domain}`);
            return domain;
        }
    };

    TB.register_module(self);
}

(function () {
    window.addEventListener('TBModuleLoaded', function () {
        domaintagger();
    });
})();
