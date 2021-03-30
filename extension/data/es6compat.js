// HACK: Exposes the contents of the helper function objects on the global
//       object to minimize the amount of work necessary to get existing modules
//       working with the new system. This should be removed once all modules
//       are converted to ES6 syntax and they can `import` the helpers
//       themselves. Note that these values are only guaranteed to be available
//       after the document receives the `esCompatReady` event.
(async () => {
	window.TBApi = await import(browser.runtime.getURL('data/tbapi.js'));
	window.TBui = await import(browser.runtime.getURL('data/tbui.js'));
	window.document.dispatchEvent(new CustomEvent('esCompatReady'));
})();
