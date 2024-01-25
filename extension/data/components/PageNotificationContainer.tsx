import {useEffect, useState} from 'react';
import browser from 'webextension-polyfill';
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

    // Register listener for messages from the background page
    useEffect(() => {
        const messageListener = (message: any) => {
            if (message.action === 'tb-show-page-notification') {
                // Add to beginning of list so it shows up on top
                // TODO: wouldn't it be better to do this via `flex-direction`?
                setNotifications([message.details, ...notifications]);
            } else if (message.action === 'tb-clear-page-notification') {
                // Remove the notification from the list
                setNotifications(notifications.filter(notif => notif.id !== message.id));
            }
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

    return (
        <div id='tb-notifications-wrapper'>
            {notifications.map(notification => (
                <Window
                    title={notification.title}
                    className='tb-notification'
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
