chrome.extension.onMessage.addListener( function(request,sender,sendResponse)
{
    if( request.greeting === "tb-reload" )
    {
        console.log('reloading');
        chrome.runtime.reload();
        console.log('reloaded');
        sendResponse();
    }
});

