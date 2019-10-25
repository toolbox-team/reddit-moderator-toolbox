'use strict';

function metricstab () {
    const self = new TB.Module('Metrics Tab');
    self.shortname = 'Metrics';
    self.oldReddit = true;

    self.settings['enabled']['default'] = true;

    self.getSectionFromUrl = function getSectionFromUrl (url) {
        const regex = new RegExp(/^(http|https):\/\/([a-z]+\.)?reddit\.com\/(user|r)\/([^/]+)(\/|$)/g);
        const matches = regex.exec(url);

        if (matches) {
            return {section: matches[3], subSection: matches[4]};
        } else {
            return null;
        }
    };

    self.init = function () {
        const page = this.getSectionFromUrl(window.location.href),
              $body = $('body');

        if (!page) {
            return false;
        }

        const metrics = {
            user: {
                Redective: 'https://www.redective.com/?r=e&a=search&s=user&t=redective&q={subSection}',
                Hivemind: 'https://www.hivemind.cc/rank/u/{subSection}',
                RateRedditors: 'https://rateredditors.com/{subSection}',
                SnoopSnoo: 'https://www.snoopsnoo.com/u/{subSection}',
                redditgraphs: 'https://www.roadtolarissa.com/redditgraphs/?{subSection}&PieChart&Number&Submissions',
            },

            r: {
                Redective: 'https://www.redective.com/?r=e&a=search&s=subreddit&t=redective&q={subSection}',
                Hivemind: 'https://www.hivemind.cc/rank/r/{subSection}',
                ExploreReddit: 'https://paulrosenzweig.com/explore-reddit/r/{subSection}',
            },
        };

        const $tabList = $('#header-bottom-left ul');
        if (!$tabList.length) {
            return false;
        }
        $body.append('<div id="tb-metrics-expand-list" style="display: none;"><ul></ul></div>');

        const $metricsDropDown = $body.find('#tb-metrics-expand-list ul');

        $tabList.css('overflow', 'visible');

        const $listItem = $("<li class='tb-metrics'><a href='javascript:;'>metrics</a></li>"),
              $tbMetricsList = $body.find('#tb-metrics-expand-list');

        $tabList.append($listItem);

        const links = metrics[page.section];
        for (const i of Object.keys(links)) {
            let url = links[i];
            url = url.replace(/\{subSection\}/g, page.subSection);
            $metricsDropDown.append(`<li><a href="${url}" target="_blank">${i}</a></li>`);
        }

        $listItem.on('click', function () {
            self.log('metrics tab opened');
            const offset = $(this).offset(),
                  offsetLeft = offset.left,
                  offsetTop = offset.top + 20;

            $body.find('#tb-metrics-expand-list').css({
                left: `${offsetLeft}px`,
                top: `${offsetTop}px`,
            });
            $tbMetricsList.toggle();
        });

        $(document).on('click', event => {
            if (!$(event.target).closest('.tb-metrics').length) {
                $tbMetricsList.hide();
            }
        });
    };

    TB.register_module(self);
}

window.addEventListener('TBModuleLoaded', () => {
    metricstab();
});
