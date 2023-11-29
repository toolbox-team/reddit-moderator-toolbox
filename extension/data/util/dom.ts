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
