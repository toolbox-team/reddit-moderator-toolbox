/**
 * A promise that resolves when the document's ready state is at least
 * `interactive` (i.e. the DOM is parsed, but not all subresources are loaded).
 */
export const documentInteractive = new Promise<void>(resolve => {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        resolve();
    } else {
        const listener = () => {
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                document.removeEventListener('readystatechange', listener);
                resolve();
            }
        };
        document.addEventListener('readystatechange', listener);
    }
});

/**
 * Creates a long-lived {@linkcode MutationObserver} which observes mutations to
 * some node's subtree and calls a callback for each individual mutation record
 * that is observed.
 * @param target The element to observe.
 * @param options Mutation observer options. This convenience function defaults
 * the `subtree` option to `true`; all others are passed through as-is.
 * @param callback A function called for each observed
 * {@linkcode MutationRecord}.
 * @returns The created {@linkcode MutationObserver}.
 */
export function observeSubtree (
    target: Node,
    options: MutationObserverInit = {},
    callback: (record: MutationRecord) => void,
) {
    let observer = new MutationObserver(records => records.forEach(record => callback(record)));
    observer.observe(target, {subtree: true, ...options});
    return observer;
}

// Keep a list of all the handlers we haven't run yet
let pendingElementHandlers: [el: HTMLElement, handler: () => void][] = [];

/**
 * Registers a function to run when the given element appears in the DOM.
 */
export function onDOMAttach (el: HTMLElement, handler: () => void) {
    pendingElementHandlers.push([el, handler]);
}

// watch for elements being added to the DOM
observeSubtree(document, {childList: true}, record => {
    // go through the array and see if each element is present yet
    pendingElementHandlers = pendingElementHandlers.filter(([el, handler]) => {
        for (const addedNode of record.addedNodes ?? []) {
            if (addedNode === el || addedNode.contains(el)) {
                // element is on page, call its handler and remove from array
                handler();
                return false;
            }
        }

        // element is not on page yet, keep it in the array
        return true;
    });
});
