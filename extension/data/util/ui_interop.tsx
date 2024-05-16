// This file contains utilities for interoperating React and jQuery UI code. It
// should hopefully not stick around forever; we'll get rid of uses of these
// utilities over time.

import $ from 'jquery';
import {ReactNode, useEffect, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {onDOMAttach} from './dom';

/**
 * Returns a <div> DOM element which renders the given React/JSX content when
 * added to the page.
 */
export function reactRenderer (content: ReactNode) {
    const contentRoot = document.createElement('div');
    contentRoot.classList.add('tb-react-root');
    // Don't give this div its own box in the box model - just use the box of
    // whatever we're rendering inside. This avoids subtle layout issues when
    // the rendered content's top-level element is `inline` or `inline-block`
    // or something else exotic like `table-*`.
    // see https://developer.mozilla.org/en-US/docs/Web/CSS/display#contents
    contentRoot.style.display = 'contents';
    onDOMAttach(contentRoot, () => {
        createRoot(contentRoot).render(content);
    });
    return contentRoot;
}

/** A React component which renders a jQuery element as its contents. */
export function JQueryRenderer ({content}: {content: JQuery}) {
    const target = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = target.current;
        if (el) {
            $(el).empty().append(content);
            return () => {
                $(el).empty();
            };
        }
    }, [content]);
    return <div style={{display: 'contents'}} ref={target} />;
}
