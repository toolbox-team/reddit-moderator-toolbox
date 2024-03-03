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

// Keep a list of all the handlers we haven't run yet
let pendingElementHandlers: [el: HTMLElement, handler: () => void][] = [];

/** Registers a function to run when the given element appears in the DOM. */
export function onDOMAttach (el: HTMLElement, handler: () => void) {
    pendingElementHandlers.push([el, handler]);
}

// watch for elements being added to the DOM
new MutationObserver(() => {
    // go through the array and see if each element is present yet
    pendingElementHandlers = pendingElementHandlers.filter(([el, handler]) => {
        if (document.contains(el)) {
            // element is on the page, call its handler and remove from array
            handler();
            return false;
        }

        // element is not on page yet, keep it in the array
        return true;
    });
}).observe(document, {
    childList: true,
    subtree: true,
});
