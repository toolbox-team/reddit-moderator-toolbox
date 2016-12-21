chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        console.log(request);

        // Request to reload the extension. Let's do so.
        if( request.action === "tb-reload" )
        {
            console.log('reloading');
            chrome.runtime.reload();
            console.log('reloaded');
            sendResponse();
        }

        // Request to fetch the oauthToken data.
        if(request.action === 'oauthToken') {
            chrome.cookies.get({url: 'https://www.reddit.com', name: 'token'}, function(rawCookie) {
                console.log(rawCookie.value);
                console.log(rawCookie);
                // The cookie we grab has a base64 encoded string with data. Sometimes is invalid data at the end.
                // This RegExp should take care of that.
                const invalidChar = new RegExp('[^A-Za-z0-9+/].*?$');
                const base64Cookie = rawCookie.value.replace(invalidChar, '');
                const tokenData = atob(base64Cookie);
                console.log(tokenData);
                sendResponse({oauthToken: tokenData});

            });
            // http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
            return true;

        }
});



