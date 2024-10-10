import {useEffect, useState} from 'react';
import browser from 'webextension-polyfill';
import {useSetting} from '../hooks';
import {classes} from '../util/ui_interop';
import css from './PageNotificationContainer.module.css';
import {Window} from './Window';

/** An in-page notification object received from the background page */
// TODO: we should really establish some central types for message data like this
interface Notification {
    id: string;
    title: string;
    body: string;
}

/**
 * Component which displays and manages all notifications broadcasted from the
 * background page.
 */
export function PageNotificationContainer () {
    // Notifications active on the page
    const [notifications, setNotifications] = useState([] as Notification[]);

    // We need to know the location of the context menu to know how to style the
    // notification area
    const contextMenuLocation = useSetting('GenSettings', 'contextMenuLocation', 'left');

    // Register listener for messages from the background page
    useEffect(() => {
        const messageListener = (message: unknown) => {
            // TODO: we need proper types for these messages
            if ((message as any).action === 'tb-show-page-notification') {
                // Add to beginning of list so it shows up on top
                // TODO: wouldn't it be better to do this via `flex-direction`?
                // NOTE: This setter can be called multiple times between
                //       renders, which results in incoming notifications
                //       overwriting each other; we have to use the "update
                //       function" form of the `useState` setter for safety.
                //       https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state
                setNotifications(currentNotifications => [(message as any).details, ...currentNotifications]);
            } else if ((message as any).action === 'tb-clear-page-notification') {
                // Remove the notification from the list
                setNotifications(currentNotifications =>
                    currentNotifications.filter(notif => notif.id !== (message as any).id)
                );
            }

            // `@types/webextension-polyfill` wants us to explicitly return
            // `undefined` from synchronous listeners to indicate that we're not
            // doing any async stuff relying on the `sendResponse` param
            return undefined;
        };

        browser.runtime.onMessage.addListener(messageListener);
        return () => {
            browser.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    // Handle clicks on the close button of notifications
    function handleClose (id: string) {
        // pre-emptively remove the notification from display
        setNotifications(notifications.filter(notif => notif.id !== id));

        // notify the background page that the notification should also be
        // removed from other tabs
        browser.runtime.sendMessage({
            action: 'tb-page-notification-clear',
            id,
        });
    }

    // Handle clicks elsewhere on the notification
    function handleClick (id: string) {
        browser.runtime.sendMessage({
            action: 'tb-page-notification-click',
            id,
        });
    }

    // Converts a plaintext body with newlines into a set of paragraph elements
    function renderBody (body: string) {
        return body
            .split('\n')
            .filter(line => line) // Ignore empty lines
            .map(line => <p>{line}</p>);
    }

    if (!contextMenuLocation) {
        return <></>;
    }

    return (
        <div
            className={classes(
                css.wrapper,
                contextMenuLocation === 'right' && css.hasRightContextMenu,
            )}
        >
            {notifications.map(notification => (
                <Window
                    key={notification.id}
                    title={notification.title}
                    className={css.notification}
                    closable
                    onClose={() => handleClose(notification.id)}
                    onClick={() => handleClick(notification.id)}
                >
                    {renderBody(notification.body)}
                </Window>
            ))}
        </div>
    );
}
