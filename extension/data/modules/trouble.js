import $ from 'jquery';

import {getCurrentUser} from '../tbapi.ts';
import * as TBCore from '../tbcore.js';
import {Module} from '../tbmodule.js';

const self = new Module({
    name: 'Trouble Shooter',
    id: 'Trouble',
    oldReddit: true,
    settings: [
        {
            id: 'highlightAuto',
            type: 'boolean',
            default: false,
            description: 'Highlight comments automatically',
        },
        {
            id: 'negHighlightThreshold',
            type: 'number',
            default: 0,
            description: 'Negative comment highlight score threshold',
        },
        {
            id: 'highlightControversy',
            type: 'boolean',
            default: true,
            description: 'Highlight controversial comments',
        },
        {
            id: 'expandOnLoad',
            type: 'boolean',
            default: false,
            description: 'Expand all downvoted/controversial comments on page load',
        },
        {
            id: 'sortOnMoreChildren',
            type: 'boolean',
            default: false,
            description: 'Continue to sort children on "load more comments"',
        },
        {
            id: 'displayNChildren',
            type: 'boolean',
            default: true,
            description: 'Always display the number of children a comment has.',
        },
        {
            id: 'displayNChildrenTop',
            type: 'boolean',
            default: false,
            advanced: true,
            description:
                'Display the number of children a comment has in the upper left.  This may change the normal flow of the comments page slightly.',
        },
    ],
}, init);
export default self;

self.sorted = false;
self.pending = [];

function init (
    {
        negHighlightThreshold,
        highlightControversy,
        expandOnLoad,
        highlightAuto,
        sortOnMoreChildren,
        displayNChildren,
        displayNChildrenTop,
    },
) {
    const $body = $('body');
    const $buttons = $('<div id="tb-trouble-buttons">');
    const $init_btn = $('<button id="tb-trouble-init" class="tb-action-button">Trouble Shoot</button>').click(start);
    let $sitetable;

    if (!TBCore.isMod) {
        return;
    }

    if (!TBCore.isCommentsPage) {
        return;
    }

    if ($body.hasClass('listing-page')) {
        $sitetable = $('.content').children('.sitetable');
    } else {
        $sitetable = $('.commentarea').children('.sitetable');
    }

    $sitetable.before($buttons);

    if (highlightAuto) {
        start();
    } else {
        $buttons.append($init_btn);
    }

    function start () {
        $init_btn.remove();

        $body.addClass('tb-trouble');
        if (highlightControversy) {
            $body.addClass('tb-controversy-hl');
        }
        if (displayNChildren) {
            $body.addClass('tb-nchildren');
        }
        if (displayNChildrenTop) {
            $body.addClass('tb-nchildrentop');
        }

        $buttons.append($('<button id="tb-trouble-sort" class="tb-action-button">Sort</button>').click(sortChildren))
            .append(
                $('<button class="tb-action-button" id="tb-trouble-collapse">Collapse</button>').click(
                    collapseNonDrama,
                ),
            );

        if (sortOnMoreChildren) {
            $('.commentarea').on('click', '.morecomments', function () {
                if (self.sorted) {
                    self.pending.push(sortMe.bind($(this).closest('.sitetable')));
                }
            });
        }
        window.addEventListener('TBNewThings', () => {
            run();
        });

        run();

        if (expandOnLoad) {
            $('.thing.tb-controversy, .thing.tb-ncontroversy').each(uncollapseThing);
        }
    }

    function run () {
        const $things = $('.thing.comment').not('.tb-pc-proc');

        highlightComments($things);

        while (self.pending.length) {
            self.pending.pop()();
        }

        if (expandOnLoad) {
            $('.thing.tb-controversy, .thing.tb-ncontroversy').not('.tb-pc-proc').each(uncollapseThing);
        }

        markProcessedThings();
    }

    function highlightComments ($things) {
        const controversial = /\bcontroversial\b/;

        $things.find('.numchildren').each(numChildren);

        $things.find('.score.unvoted').each(score);

        if (highlightControversy) {
            $things.filter(function () {
                return controversial.test(this.className);
            })
                .children('.entry').addClass('tb-controversy')
                .parents('.thing').addClass('tb-controversy');
        }
    }

    async function score () {
        const $this = $(this);
        const $thing = $this.closest('.thing');
        let neg_thresh = negHighlightThreshold;

        // lower the threashold by one for user's comments
        if (RegExp(`/${await getCurrentUser()}\\b`).test($thing.children('.entry').find('.author')[0].href)) {
            --neg_thresh;
        }

        // highlighting here to avoid another .each() iteration
        if (($thing[0].dataset.score = $this.text().match(/^(-)?\d+/)[0]) <= neg_thresh) {
            $thing.addClass('tb-neg tb-ncontroversy')
                .parents('.thing').addClass('tb-ncontroversy');
        }
    }

    function numChildren () {
        const $this = $(this);

        $this.closest('.thing')[0].dataset.nchildren = $this.text().match(/\d+/)[0];
    }

    function sortChildren () {
        self.sorted = true;
        sortMe.call($(this).closest('.sitetable, .commentarea, .content').children('.sitetable'));
    }

    function fixFlatNER ($this) {
        const $NERs = $this.find('.linklisting');
        if (!$NERs.length) {
            return;
        }

        $this.append($NERs.children('.thing'));
        $('.NERPageMarker, .clearleft + .clearleft').remove();
    }

    function sortMe () {
        const $this = $(this);

        fixFlatNER($this);

        const $things = $this.children('.thing').not('.morechildren')
            .sort((a, b) => b.dataset.nchildren - a.dataset.nchildren);

        $this.prepend($things)
            .prepend($this.children('.thing.tb-controversy'))
            .prepend($this.children('.thing.tb-ncontroversy'));

        $things.children('.child').children('.sitetable').each(sortMe);
    }

    function collapseThing () {
        $(this).addClass('collapsed').children('.entry').find('.expand').text('[+]');
    }

    function uncollapseThing () {
        $(this).removeClass('collapsed').children('.entry').find('.expand').text('[–]');
    }

    function markProcessedThings () {
        $('.thing').not('.tb-pc-proc').addClass('tb-pc-proc');
    }

    function collapseNonDrama () {
        $('.thing.tb-controversy, .thing.tb-ncontroversy').each(uncollapseThing);

        $('.commentarea').add($('.thing.tb-controversy, .thing.tb-ncontroversy').children('.child'))
            .children('.sitetable').children('.thing').not('.tb-controversy, .tb-ncontroversy')
            .each(collapseThing); // collapsing only top-level-most comment children of drama
    }
    /*  TODO

    Include below threshold comments when the score is hidden?

    */
}
