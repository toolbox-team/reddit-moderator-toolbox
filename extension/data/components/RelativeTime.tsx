import $ from 'jquery';
import {useEffect, useRef} from 'react';

/** Component which messily implements relative times display via `$.timeago`. */
export const RelativeTime = ({date}: {
    /** Date and time to display */
    date: Date;
}) => {
    const elRef = useRef<HTMLTimeElement>(null);
    useEffect(() => {
        if (elRef.current != null) {
            $(elRef.current).timeago();
        }
    }, []);

    return (
        <time ref={elRef} dateTime={date.toISOString()}>
            {date.toLocaleString()}
        </time>
    );
};
