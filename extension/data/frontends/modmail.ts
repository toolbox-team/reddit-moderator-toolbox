import {getThingInfo} from '../tbcore';
import TBLog from '../tblog';
import {PlatformObserver} from '.';

const log = TBLog('observer:modmail');

const MESSAGE_SEEN_CLASS = 'tb-observer-modmail-message-seen';

const SIDEBAR_SEEN_CLASS = 'tb-observer-modmail-sidebar-seen';

export default (createRenderer => {
    function newModmailConversationAuthors () {
        const $body = $('body');
        const subreddit = $body.find('.ThreadTitle__community').text();
        $body.find(`.Thread__message:not(.${MESSAGE_SEEN_CLASS})`).each(function () {
            const $this = $(this);
            this.classList.add(MESSAGE_SEEN_CLASS);

            // Get information
            const authorHref = $this.find('.Message__header .Message__author').attr('href');
            const idDetails = $this.find('.m-link').attr('href')!.match(/\/mail\/.*?\/(.*?)\/(.*?)$/i)!;

            this.querySelector('.Message__divider')?.after(createRenderer('modmailAuthor', {
                user: authorHref === undefined
                    ? {deleted: true}
                    : {deleted: false, name: authorHref.replace(/.*\/user\/([^/]+).*/, '$1')},
                subreddit: {
                    name: subreddit,
                },
                thread: {
                    fullname: idDetails[1],
                },
                message: {
                    fullname: idDetails[2],
                },
            }));
        });
    }

    /**
     * Makes sure to fire a jsAPI `TBuserHovercard` event for new modmail sidebar instances.
     * @function
     */
    function newModmailSidebar () {
        const $body = $('body');
        if ($body.find('.ThreadViewer').length) {
            const $modmailSidebar = $body.find(
                `:is(.ThreadViewer__infobar, .ThreadViewerHeader__infobar, .InfoBar__idCard):not(.${SIDEBAR_SEEN_CLASS})`,
            );
            const jsApiPlaceHolder = `
                <div class="tb-jsapi-container tb-modmail-sidebar-container">
                    <div class="InfoBar__recentsTitle">Toolbox functions:</div>
                    <span data-name="toolbox"></span>
                </div>
            `;
            $modmailSidebar.each(function () {
                getThingInfo(this, true).then(info => {
                    this.classList.add(SIDEBAR_SEEN_CLASS);

                    const $jsApiThingPlaceholder = $(jsApiPlaceHolder).appendTo(this);
                    const jsApiThingPlaceholder = $jsApiThingPlaceholder[0];

                    jsApiThingPlaceholder.appendChild(createRenderer('userHovercard', {
                        user: (info.user && info.user !== '[deleted]')
                            ? {deleted: false, name: info.user}
                            : {deleted: true},
                        subreddit: {
                            name: info.subreddit,
                        },
                    }));
                });
            });
        }
    }

    const $body = $('body');

    $body.on('click', '.icon-user', () => {
        setTimeout(() => {
            newModmailSidebar();
        }, 500);
    });

    $body.on('click', '.Thread__grouped', () => {
        setTimeout(() => {
            newModmailConversationAuthors();
        }, 500);
    });

    window.addEventListener('TBNewPage', event => {
        // TODO: augh
        if ((event as any).detail.pageType === 'modmailConversation') {
            setTimeout(() => {
                newModmailSidebar();
                newModmailConversationAuthors();
            }, 500);
        }
    });
}) satisfies PlatformObserver;
