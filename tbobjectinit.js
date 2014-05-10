function TBOBjectInitWrapper () {
	Toolbox.init();
}

// Add script to page
(function () {
    var s = document.createElement('script');
    s.textContent = "(" + TBOBjectInitWrapper.toString() + ')();';
    document.head.appendChild(s);
})();