// This file contains utilities for interoperating React and jQuery UI code. It
// should hopefully not stick around forever; we'll get rid of uses of these
// utilities over time.

import $ from 'jquery';
import {ReactNode, useEffect, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {onDOMAttach} from './dom';

import {createPortal} from 'react-dom';
import browser from 'webextension-polyfill';

const bundledStylesheetLink = (
    <link rel='stylesheet' type='text/css' href={browser.runtime.getURL('data/bundled.css')} />
);

/**
 * Returns a <div> DOM element which renders the given React/JSX content when
 * added to the page.
 */
export function reactRenderer (content: ReactNode) {
    const contentShadowHost = document.createElement('div');
    contentShadowHost.classList.add('tb-react-shadow-host');
    const shadowRoot = contentShadowHost.attachShadow({mode: 'open'});
    onDOMAttach(contentShadowHost, () => {
        createRoot(shadowRoot).render([
            // pull in bundled stylesheet which contains all the CSS module code for our React components
            bundledStylesheetLink,
            // then insert the actual content
            content,
        ]);
    });
    return contentShadowHost;
}

/**
 * Creates a portal into the shadow root of a new <div> which is placed in the
 * bottom of <body>. The shadow root will also contain the necessary <link> to
 * include the bundled stylesheet, allowing components inside to have their
 * styles render.
 */
export function createBodyShadowPortal (children: ReactNode, key?: null | string) {
    const shadowHost = document.createElement('div');
    shadowHost.classList.add('tb-react-shadow-portal');
    const shadowRoot = shadowHost.attachShadow({mode: 'open'});

    document.body.append(shadowHost);
    // stylesheet injection shenanigans
    return createPortal([bundledStylesheetLink, children], shadowRoot, key);
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
    return <div ref={target} />;
}

// this isn't really an "interop" thing but whatever it lives here for now
/**
 * Constructs a `className` value from a bunch of passed in things that could
 * be either strings or nothing.
 */
export function classes (...stuff: (string | false | null | undefined)[]) {
    return stuff.flat().filter(thing => !!thing).join(' ');
}
