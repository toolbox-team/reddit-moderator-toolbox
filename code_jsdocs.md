## Modules

<dl>
<dt><a href="#module_CommentNuke">CommentNuke</a></dt>
<dd></dd>
<dt><a href="#module_ProfilePro">ProfilePro</a></dt>
<dd></dd>
<dt><a href="#module_queueOverlay">queueOverlay</a></dt>
<dd></dd>
<dt><a href="#module_QueueTools">QueueTools</a></dt>
<dd></dd>
<dt><a href="#module_TBLog">TBLog</a></dt>
<dd></dd>
<dt><a href="#module_BackgroundPage">BackgroundPage</a></dt>
<dd><p>This refers to the webextension background page.</p></dd>
</dl>

## Classes

<dl>
<dt><a href="#TBListener">TBListener</a></dt>
<dd></dd>
</dl>

## Objects

<dl>
<dt><a href="#TBui">TBui</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TBUtils">TBUtils</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="module_CommentNuke"></a>

## CommentNuke
<a name="module_CommentNuke..parseComments"></a>

### CommentNuke~parseComments(object, postID, subreddit) ⇒ <code>Promise</code>
<p>Will given a reddit API comment object go through the chain and put all comments</p>

**Kind**: inner method of [<code>CommentNuke</code>](#module_CommentNuke)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>object</code> | <p>Comment chain object</p> |
| postID | <code>string</code> | <p>Post id the comments belong to</p> |
| subreddit | <code>string</code> | <p>Subreddit the comment chain belongs to.</p> |

<a name="module_ProfilePro"></a>

## ProfilePro

* [ProfilePro](#module_ProfilePro)
    * [~hideModActionsThings(hide)](#module_ProfilePro..hideModActionsThings)
    * [~filterModdable(hide)](#module_ProfilePro..filterModdable)
    * [~addToSiteTable(data, $siteTable, after, callback)](#module_ProfilePro..addToSiteTable) ⇒ <code>callback</code>
    * [~addTrophiesToSidebar(user, $sidebar)](#module_ProfilePro..addTrophiesToSidebar)
    * [~addModSubsToSidebar(user, $sidebar)](#module_ProfilePro..addModSubsToSidebar)
    * [~makeUserSidebar(user, $overlay)](#module_ProfilePro..makeUserSidebar)
    * [~searchProfile(user, type, sortMethod, $siteTable, options, after, match, pageCount, callback)](#module_ProfilePro..searchProfile) ⇒ <code>callback</code>
    * [~regExpEscape(query)](#module_ProfilePro..regExpEscape) ⇒ <code>string</code>

<a name="module_ProfilePro..hideModActionsThings"></a>

### ProfilePro~hideModActionsThings(hide)
<p>Will hide or reveal mod actions in the toolbox profile overlay.</p>

**Kind**: inner method of [<code>ProfilePro</code>](#module_ProfilePro)  

| Param | Type | Description |
| --- | --- | --- |
| hide | <code>boolean</code> | <p>determines if actions should be shown or hidden.</p> |

<a name="module_ProfilePro..filterModdable"></a>

### ProfilePro~filterModdable(hide)
<p>Will hide or reveal items in the profile overlay that can't be modded.</p>

**Kind**: inner method of [<code>ProfilePro</code>](#module_ProfilePro)  

| Param | Type | Description |
| --- | --- | --- |
| hide | <code>boolean</code> | <p>determines if items should be shown or hidden.</p> |

<a name="module_ProfilePro..addToSiteTable"></a>

### ProfilePro~addToSiteTable(data, $siteTable, after, callback) ⇒ <code>callback</code>
<p>Adds items to the toolbox profile overlay siteTable element</p>

**Kind**: inner method of [<code>ProfilePro</code>](#module_ProfilePro)  
**Returns**: <code>callback</code> - <p>returned when done</p>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>array</code> | <p>array of reddit things to be added in reddit API format</p> |
| $siteTable | <code>jqueryObject</code> | <p>jquery object representing the siteTable</p> |
| after | <code>string</code> | <p>reddit thing ID representing the start of the next page. If present will add a &quot;load more&quot; at the end of the siteTable</p> |
| callback | <code>callback</code> | <p>callback function</p> |

<a name="module_ProfilePro..addTrophiesToSidebar"></a>

### ProfilePro~addTrophiesToSidebar(user, $sidebar)
<p>Adds the user's trophies to the given sidebar element.</p>

**Kind**: inner method of [<code>ProfilePro</code>](#module_ProfilePro)  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> | <p>reddit username</p> |
| $sidebar | <code>jqueryObject</code> | <p>jquery sidebar element to which the trophies need to be added</p> |

<a name="module_ProfilePro..addModSubsToSidebar"></a>

### ProfilePro~addModSubsToSidebar(user, $sidebar)
<p>Adds the user's moderated subs to the given sidebar element.</p>

**Kind**: inner method of [<code>ProfilePro</code>](#module_ProfilePro)  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> | <p>reddit username</p> |
| $sidebar | <code>jqueryObject</code> | <p>jquery sidebar element to which the subreddits need to be added</p> |

<a name="module_ProfilePro..makeUserSidebar"></a>

### ProfilePro~makeUserSidebar(user, $overlay)
<p>Creates a user sidebar element for the given overlay</p>

**Kind**: inner method of [<code>ProfilePro</code>](#module_ProfilePro)  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> | <p>reddit username</p> |
| $overlay | <code>jqueryObject</code> | <p>jquery overlay element to which the sidebar needs to be added</p> |

<a name="module_ProfilePro..searchProfile"></a>

### ProfilePro~searchProfile(user, type, sortMethod, $siteTable, options, after, match, pageCount, callback) ⇒ <code>callback</code>
<p>Searches a user profile for the given subreddit and/or string</p>

**Kind**: inner method of [<code>ProfilePro</code>](#module_ProfilePro)  
**Returns**: <code>callback</code> - <p>returns true when results have been found, false when none are found</p>  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> | <p>reddit username</p> |
| type | <code>string</code> | <p>the listing type that is to be searched</p> |
| sortMethod | <code>string</code> | <p>the listing type that is to be searched</p> |
| $siteTable | <code>jqueryObject</code> | <p>jquery siteTable element to which the search results need to be added</p> |
| options | <code>object</code> | <p>search options</p> |
| after | <code>string</code> | <p>reddit thing id indicating the next page</p> |
| match | <code>boolean</code> | <p>indicates if there are previous</p> |
| pageCount | <code>integer</code> | <p>what page we are on</p> |
| callback | <code>callback</code> | <p>callback function</p> |

<a name="module_ProfilePro..regExpEscape"></a>

### ProfilePro~regExpEscape(query) ⇒ <code>string</code>
<p>Escapes a string so it is suitable to be inserted in to a regex match</p>

**Kind**: inner method of [<code>ProfilePro</code>](#module_ProfilePro)  
**Returns**: <code>string</code> - <p>string escaped for regex use</p>  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | <p>reddit username</p> |

<a name="module_queueOverlay"></a>

## queueOverlay

* [queueOverlay](#module_queueOverlay)
    * [~figureOutMulti($tbQueueUrl, type)](#module_queueOverlay..figureOutMulti) ⇒ <code>string</code>
    * [~reloadIframe($reloadListing, $tbQueueUrl, $iframe, type)](#module_queueOverlay..reloadIframe)
    * [~makeQueueOverlay(type, options)](#module_queueOverlay..makeQueueOverlay)

<a name="module_queueOverlay..figureOutMulti"></a>

### queueOverlay~figureOutMulti($tbQueueUrl, type) ⇒ <code>string</code>
<p>Figures out what listing path to use and adds the multireddit representation to the input field on the respective tab.</p>

**Kind**: inner method of [<code>queueOverlay</code>](#module_queueOverlay)  
**Returns**: <code>string</code> - <p>the listing path to be used in overlays</p>  

| Param | Type | Description |
| --- | --- | --- |
| $tbQueueUrl | <code>jqueryObject</code> | <p>input element which will hold the multireddit representation</p> |
| type | <code>string</code> | <p>the listing type</p> |

<a name="module_queueOverlay..reloadIframe"></a>

### queueOverlay~reloadIframe($reloadListing, $tbQueueUrl, $iframe, type)
<p>Reload the iframe belonging to a queue listing based on latest data.</p>

**Kind**: inner method of [<code>queueOverlay</code>](#module_queueOverlay)  

| Param | Type | Description |
| --- | --- | --- |
| $reloadListing | <code>jqueryObject</code> | <p>reload button on the listing tab.</p> |
| $tbQueueUrl | <code>jqueryObject</code> | <p>input element which will hold the multireddit representation</p> |
| $iframe | <code>jqueryObject</code> | <p>iframe element to be reloaded</p> |
| type | <code>string</code> | <p>listing type</p> |

<a name="module_queueOverlay..makeQueueOverlay"></a>

### queueOverlay~makeQueueOverlay(type, options)
<p>Creates the queue overlay or adds data to it if it is already open.</p>

**Kind**: inner method of [<code>queueOverlay</code>](#module_queueOverlay)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | <p>listing type</p> |
| options | <code>object</code> |  |
| options.subreddit | <code>string</code> | <p>optional, when not given the user's toolbox settings for the listing will be used.</p> |
| options.overwrite | <code>boolean</code> | <p>when true will set the base over the overlay to the given subreddit and will reload the tab with this data.</p> |

<a name="module_QueueTools"></a>

## QueueTools

* [QueueTools](#module_QueueTools)
    * [~getModlog(subreddit, callback)](#module_QueueTools..getModlog)
    * [~checkForActions(subreddit, fullName)](#module_QueueTools..checkForActions) ⇒ <code>false</code> \| <code>object</code>
    * [~getActions(subreddit, fullName, callback)](#module_QueueTools..getActions)
    * [~getModlogCallback](#module_QueueTools..getModlogCallback) : <code>function</code>
    * [~getActionsCallback](#module_QueueTools..getActionsCallback) : <code>function</code>

<a name="module_QueueTools..getModlog"></a>

### QueueTools~getModlog(subreddit, callback)
<p>Fetches the modlog for a subreddit and updates modlogCache.</p>

**Kind**: inner method of [<code>QueueTools</code>](#module_QueueTools)  

| Param | Type | Description |
| --- | --- | --- |
| subreddit | <code>string</code> | <p>the subreddit for which the modlog needs to be fetched</p> |
| callback | <code>getModlogCallback</code> | <p>callback that handles further modlog interactions</p> |

<a name="module_QueueTools..checkForActions"></a>

### QueueTools~checkForActions(subreddit, fullName) ⇒ <code>false</code> \| <code>object</code>
<p>Checks modLogCache for actions on the given fullName and subreddit.</p>

**Kind**: inner method of [<code>QueueTools</code>](#module_QueueTools)  
**Returns**: <code>false</code> \| <code>object</code> - <p>Either false or an object with actions</p>  

| Param | Type | Description |
| --- | --- | --- |
| subreddit | <code>string</code> | <p>The subreddit the fullName thing belongs to.</p> |
| fullName | <code>string</code> | <p>Thing (post/comment) fullName</p> |

<a name="module_QueueTools..getActions"></a>

### QueueTools~getActions(subreddit, fullName, callback)
<p>Checks for mod actions on the given fullName thing and subreddit through a caching mechanism.</p>

**Kind**: inner method of [<code>QueueTools</code>](#module_QueueTools)  

| Param | Type | Description |
| --- | --- | --- |
| subreddit | <code>string</code> | <p>the subreddit for which the modlog needs to be fetched</p> |
| fullName | <code>string</code> | <p>thing (post/comment) fullName</p> |
| callback | <code>getActionsCallback</code> | <p>callback that handles further modlog interactions</p> |

<a name="module_QueueTools..getModlogCallback"></a>

### QueueTools~getModlogCallback : <code>function</code>
<p>Callback for further handling the modlog.</p>

**Kind**: inner typedef of [<code>QueueTools</code>](#module_QueueTools)  
<a name="module_QueueTools..getActionsCallback"></a>

### QueueTools~getActionsCallback : <code>function</code>
<p>Callback for further handling the modlog.</p>

**Kind**: inner typedef of [<code>QueueTools</code>](#module_QueueTools)  

| Param | Type | Description |
| --- | --- | --- |
| result | <code>Boolean</code> \| <code>Object</code> | <p>Either false or an object with actions</p> |

<a name="module_TBLog"></a>

## TBLog
<a name="module_BackgroundPage"></a>

## BackgroundPage
<p>This refers to the webextension background page.</p>


* [BackgroundPage](#module_BackgroundPage)
    * [~uuidv4()](#module_BackgroundPage..uuidv4) ⇒ <code>string</code>
    * [~sendNativeNotification(options)](#module_BackgroundPage..sendNativeNotification)
    * [~sendPageNotification(options)](#module_BackgroundPage..sendPageNotification)
    * [~clearNotification(notificationID)](#module_BackgroundPage..clearNotification)
    * [~onClickNotification(notificationID)](#module_BackgroundPage..onClickNotification)
    * [~getOAuthTokens([tries])](#module_BackgroundPage..getOAuthTokens) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [~makeHeaderObject(headerString)](#module_BackgroundPage..makeHeaderObject) ⇒ <code>headerObject</code>
    * [~makeRequest(options, sendResponse)](#module_BackgroundPage..makeRequest)
    * [~emptyCacheTimeout(timeoutDuration, cacheType)](#module_BackgroundPage..emptyCacheTimeout)
    * [~initCachetimeout(forceRefresh)](#module_BackgroundPage..initCachetimeout)

<a name="module_BackgroundPage..uuidv4"></a>

### BackgroundPage~uuidv4() ⇒ <code>string</code>
<p>Generates a UUID. We use this instead of something simpler because Firefox
requires notification IDs to be UUIDs.</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  
<a name="module_BackgroundPage..sendNativeNotification"></a>

### BackgroundPage~sendNativeNotification(options)
<p>Sends a native Chrome notification.</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | <p>The notification options</p> |

<a name="module_BackgroundPage..sendPageNotification"></a>

### BackgroundPage~sendPageNotification(options)
<p>Sends an in-page notification on all open Reddit windows</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | <p>The notification options</p> |

<a name="module_BackgroundPage..clearNotification"></a>

### BackgroundPage~clearNotification(notificationID)
<p>Clears a notification</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  

| Param | Type | Description |
| --- | --- | --- |
| notificationID | <code>string</code> | <p>The ID of the notification</p> |

<a name="module_BackgroundPage..onClickNotification"></a>

### BackgroundPage~onClickNotification(notificationID)
<p>Handles a click on a notification</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  

| Param | Type | Description |
| --- | --- | --- |
| notificationID | <code>string</code> | <p>The ID of the notification</p> |

<a name="module_BackgroundPage..getOAuthTokens"></a>

### BackgroundPage~getOAuthTokens([tries]) ⇒ <code>Promise.&lt;Object&gt;</code>
<p>Retrieves the user's OAuth tokens from cookies.</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - <p>An object with properties <code>accessToken</code>,
<code>refreshToken</code>, <code>scope</code>, and some others</p>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tries] | <code>number</code> | <code>1</code> | <p>Number of tries to get the token (recursive)</p> |

<a name="module_BackgroundPage..makeHeaderObject"></a>

### BackgroundPage~makeHeaderObject(headerString) ⇒ <code>headerObject</code>
<p>Convert the string from getAllResponseHeaders() to a nice object.</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  
**Returns**: <code>headerObject</code> - <p>An object containing all header values.</p>  

| Param | Description |
| --- | --- |
| headerString | <p>The input string</p> |

<a name="module_BackgroundPage..makeRequest"></a>

### BackgroundPage~makeRequest(options, sendResponse)
<p>Make an AJAX request, and then send a response with the result as an object.</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  

| Param | Description |
| --- | --- |
| options | <p>The options for the request</p> |
| sendResponse | <p>The <code>sendResponse</code> callback that will be called</p> |

<a name="module_BackgroundPage..emptyCacheTimeout"></a>

### BackgroundPage~emptyCacheTimeout(timeoutDuration, cacheType)
<p>emptyshort or long cache if it expires</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  

| Param | Description |
| --- | --- |
| timeoutDuration | <p>Timeout value in minutes</p> |
| cacheType | <p>The type of cache, either <code>short</code> or <code>long</code></p> |

<a name="module_BackgroundPage..initCachetimeout"></a>

### BackgroundPage~initCachetimeout(forceRefresh)
<p>Initiates cache timeouts based on toolbox settings.</p>

**Kind**: inner method of [<code>BackgroundPage</code>](#module_BackgroundPage)  

| Param | Type | Description |
| --- | --- | --- |
| forceRefresh | <code>Boolean</code> | <p>when true will clear both caches and start fresh.</p> |

<a name="TBListener"></a>

## TBListener
**Kind**: global class  

* [TBListener](#TBListener)
    * [new TBListener()](#new_TBListener_new)
    * _instance_
        * [.start()](#TBListener+start)
        * [.stop()](#TBListener+stop)
        * [.on(Name, Callback)](#TBListener+on)
        * [.clear(task)](#TBListener+clear) ⇒ <code>Boolean</code>
    * _inner_
        * [~listenerCallback](#TBListener..listenerCallback) : <code>function</code>

<a name="new_TBListener_new"></a>

### new TBListener()
<p>Create a new instance of TBListener. Nothing happens yet until TBListener.start() has been called</p>

<a name="TBListener+start"></a>

### tbListener.start()
<p>Starts the TBListener instance by registering an event listener for <code>reddit</code> events</p>
<p>A <code>TBListenerLoaded</code> event is fired when everything is ready.</p>

**Kind**: instance method of [<code>TBListener</code>](#TBListener)  
<a name="TBListener+stop"></a>

### tbListener.stop()
<p>Unregisters this instance's event listener</p>

**Kind**: instance method of [<code>TBListener</code>](#TBListener)  
<a name="TBListener+on"></a>

### tbListener.on(Name, Callback)
<p>Register an event listener for a given event name for a callback.</p>

**Kind**: instance method of [<code>TBListener</code>](#TBListener)  

| Param | Type | Description |
| --- | --- | --- |
| Name | <code>string</code> | <p>of event</p> |
| Callback | [<code>listenerCallback</code>](#TBListener..listenerCallback) |  |

<a name="TBListener+clear"></a>

### tbListener.clear(task) ⇒ <code>Boolean</code>
<p>Clears a scheduled 'read' or 'write' task.</p>

**Kind**: instance method of [<code>TBListener</code>](#TBListener)  
**Returns**: <code>Boolean</code> - <p>success</p>  
**Access**: public  

| Param | Type |
| --- | --- |
| task | <code>Object</code> | 

<a name="TBListener..listenerCallback"></a>

### TBListener~listenerCallback : <code>function</code>
<p>Callback for a <code>reddit</code> event.
The callback's <code>this</code> is event.target</p>

**Kind**: inner typedef of [<code>TBListener</code>](#TBListener)  
**this**: <code>HTMLElement</code>  

| Param | Type |
| --- | --- |
| event | <code>CustomEvent</code> | 
| responseMessage | <code>string</code> | 

<a name="TBui"></a>

## TBui : <code>object</code>
**Kind**: global namespace  

* [TBui](#TBui) : <code>object</code>
    * [.icons](#TBui.icons) : <code>object</code>
    * [.showNotification(options)](#TBui.showNotification)
    * [.clearNotification(id)](#TBui.clearNotification)
    * [.popup(options, [draggable])](#TBui.popup) ⇒ <code>jQuery</code>
    * [.contextTrigger(triggerId, options)](#TBui.contextTrigger)
    * [.tbRedditEvent($elements, types)](#TBui.tbRedditEvent)
    * [.makeSubmissionEntry(submission, submissionOptions)](#TBui.makeSubmissionEntry) ⇒ <code>object</code>
    * [.makeSingleComment(comment, commentOptions)](#TBui.makeSingleComment) ⇒ <code>object</code>
    * [.makeCommentThread(jsonInput, commentOptions)](#TBui.makeCommentThread) ⇒ <code>object</code>

<a name="TBui.icons"></a>

### TBui.icons : <code>object</code>
<p>Material design icons mapped to toolbox names through their hexcode.</p>
<p>Usage <code>&lt;div class=&quot;tb-icon&quot;&gt;${TBui.icons.NAME}&lt;/div&gt;</code></p>

**Kind**: static property of [<code>TBui</code>](#TBui)  
<a name="TBui.showNotification"></a>

### TBui.showNotification(options)
<p>Show an in-page notification on the current tab.</p>

**Kind**: static method of [<code>TBui</code>](#TBui)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | <p>The options for the notification</p> |
| options.id | <code>string</code> | <p>The notification's ID</p> |
| options.title | <code>string</code> | <p>The notification's title</p> |
| options.body | <code>string</code> | <p>The notification's body</p> |

<a name="TBui.clearNotification"></a>

### TBui.clearNotification(id)
<p>Clears an in-page notification on the current tab.</p>

**Kind**: static method of [<code>TBui</code>](#TBui)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | <p>The ID of the notification to clear</p> |

<a name="TBui.popup"></a>

### TBui.popup(options, [draggable]) ⇒ <code>jQuery</code>
<p>Generate a popup.</p>

**Kind**: static method of [<code>TBui</code>](#TBui)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | <p>Options for the popup</p> |
| options.title | <code>string</code> |  | <p>The popup's title (raw HTML)</p> |
| options.tabs | <code>Array.&lt;object&gt;</code> |  | <p>The tabs for the popup</p> |
| options.cssClass | <code>string</code> |  | <p>Extra CSS class to add to the popup</p> |
| options.meta | <code>string</code> |  | <p>Raw HTML to add to a &quot;meta&quot; container</p> |
| [draggable] | <code>boolean</code> | <code>true</code> | <p>Whether the user can move the popup</p> |

<a name="TBui.contextTrigger"></a>

### TBui.contextTrigger(triggerId, options)
<p>Add or remove a menu element to the context aware menu. Makes the menu shows if it was empty before adding, hides menu if it is empty after removing.</p>

**Kind**: static method of [<code>TBui</code>](#TBui)  

| Param | Type | Description |
| --- | --- | --- |
| triggerId | <code>string</code> | <p>This will be part of the id given to the element.</p> |
| options | <code>object</code> |  |
| options.addTrigger | <code>boolean</code> | <p>Indicates of the menu item needs to be added or removed.</p> |
| options.triggerText | <code>string</code> | <p>Text displayed in menu. Not needed when addTrigger is false.</p> |
| options.triggerIcon | <code>string</code> | <p>The material icon that needs to be displayed before the menu item. Defaults to 'label'</p> |
| options.title | <code>string</code> | <p>Title to be used in title attribute. If no title is given the triggerText will be used.</p> |
| options.dataAttributes | <code>object</code> | <p>Any data attribute that might be needed. Object keys will be used as the attribute name and value as value.</p> |

<a name="TBui.tbRedditEvent"></a>

### TBui.tbRedditEvent($elements, types)
<p>Will send out events similar to the reddit jsAPI events for the elements given.
Only support 'comment' for now and will only send the commentAuthor event.</p>

**Kind**: static method of [<code>TBui</code>](#TBui)  

| Param | Type | Description |
| --- | --- | --- |
| $elements | <code>object</code> | <p>jquery object containing the e</p> |
| types | <code>string</code> | <p>comma seperated list of type of elements the events need to be send for.</p> |

<a name="TBui.makeSubmissionEntry"></a>

### TBui.makeSubmissionEntry(submission, submissionOptions) ⇒ <code>object</code>
<p>Will build a submission entry given a reddit API submission object.</p>

**Kind**: static method of [<code>TBui</code>](#TBui)  
**Returns**: <code>object</code> - <p>jquery object with the build submission.</p>  

| Param | Type | Description |
| --- | --- | --- |
| submission | <code>object</code> | <p>reddit API submission object.</p> |
| submissionOptions | <code>object</code> | <p>object denoting what needs to be included.</p> |

<a name="TBui.makeSingleComment"></a>

### TBui.makeSingleComment(comment, commentOptions) ⇒ <code>object</code>
<p>Will build a comment given a reddit API comment object.</p>

**Kind**: static method of [<code>TBui</code>](#TBui)  
**Returns**: <code>object</code> - <p>jquery object with the build comment.</p>  

| Param | Type | Description |
| --- | --- | --- |
| comment | <code>object</code> | <p>reddit API comment object.</p> |
| commentOptions | <code>object</code> | <p>object denoting what needs to be included. Object can contain 'parentLink', 'contextLink' and 'fullCommentsLink' as boolean.</p> |

<a name="TBui.makeCommentThread"></a>

### TBui.makeCommentThread(jsonInput, commentOptions) ⇒ <code>object</code>
<p>Will build a comment given a reddit API comment object.</p>

**Kind**: static method of [<code>TBui</code>](#TBui)  
**Returns**: <code>object</code> - <p>jquery object with the build comment thread.</p>  

| Param | Type | Description |
| --- | --- | --- |
| jsonInput | <code>object</code> | <p>reddit API comments object.</p> |
| commentOptions | <code>object</code> | <p>object denoting what needs to included. Object can contain 'parentLink', 'contextLink' and 'fullCommentsLink' as boolean.</p> |

<a name="TBUtils"></a>

## TBUtils : <code>object</code>
**Kind**: global namespace  

* [TBUtils](#TBUtils) : <code>object</code>
    * [.baseDomain](#TBUtils.baseDomain) : <code>string</code>
    * [.apiOauthPOST](#TBUtils.apiOauthPOST)
    * [.apiOauthGET](#TBUtils.apiOauthGET)
    * [.updateCache(cacheNAme, value, subreddit)](#TBUtils.updateCache)
    * [.link(link)](#TBUtils.link) ⇒ <code>string</code>
    * [.debugInformation()](#TBUtils.debugInformation) ⇒ [<code>debugObject</code>](#TBUtils.debugObject)
    * [.isConfigValidVersion(config, subreddit)](#TBUtils.isConfigValidVersion) ⇒ <code>booleean</code>
    * [.getToolboxDevs()](#TBUtils.getToolboxDevs) ⇒ <code>array</code>
    * [.moveArrayItem(array, old_index, new_index)](#TBUtils.moveArrayItem) ⇒ <code>array</code>
    * [.escapeHTML(html)](#TBUtils.escapeHTML) ⇒ <code>string</code>
    * [.unescapeHTML(html)](#TBUtils.unescapeHTML) ⇒ <code>string</code>
    * [.getTime()](#TBUtils.getTime) ⇒ <code>integer</code>
    * [.getRandomNumber(maxInt)](#TBUtils.getRandomNumber) ⇒ <code>integer</code>
    * [.minutesToMilliseconds(mins)](#TBUtils.minutesToMilliseconds) ⇒ <code>integer</code>
    * [.daysToMilliseconds(days)](#TBUtils.daysToMilliseconds) ⇒ <code>integer</code>
    * [.millisecondsToDays(milliseconds)](#TBUtils.millisecondsToDays) ⇒ <code>integer</code>
    * [.timeConverterISO(UNIX_timestamp)](#TBUtils.timeConverterISO) ⇒ <code>string</code>
    * [.niceDateDiff(origdate, newdate)](#TBUtils.niceDateDiff) ⇒ <code>string</code>
    * [.timeConverterRead(UNIX_timestamp)](#TBUtils.timeConverterRead) ⇒ <code>string</code>
    * [.title_to_url(title)](#TBUtils.title_to_url) ⇒ <code>string</code>
    * [.alert(options, callback)](#TBUtils.alert) ⇒ <code>callback</code>
    * [.notification(title, body, path, markreadid)](#TBUtils.notification)
    * [.humaniseDays(days)](#TBUtils.humaniseDays) ⇒ <code>string</code>
    * [.stringFormat()](#TBUtils.stringFormat)
    * [.sortBy(arr, prop)](#TBUtils.sortBy)
    * [.saneSort(arr)](#TBUtils.saneSort)
    * [.saneSortAs(arr)](#TBUtils.saneSortAs)
    * [.replaceAll(find, replace, str)](#TBUtils.replaceAll) ⇒ <code>string</code>
    * [.colorNameToHex(color)](#TBUtils.colorNameToHex) ⇒ <code>string</code>
    * [.removeLastDirectoryPartOf(url)](#TBUtils.removeLastDirectoryPartOf) ⇒ <code>string</code>
    * [.isOdd(num)](#TBUtils.isOdd) ⇒ <code>boolean</code>
    * [.cleanSubredditName(dirtySub)](#TBUtils.cleanSubredditName) ⇒ <code>string</code>
    * [.sendRequest(options)](#TBUtils.sendRequest)
    * [.getJSON(endpoint, data)](#TBUtils.getJSON)
    * [.post(endpoint, data)](#TBUtils.post)
    * [.getHead(endpoint, doneCallback)](#TBUtils.getHead) ⇒ <code>callback</code>
    * [.apiOauthRequest(method, endpoint, data)](#TBUtils.apiOauthRequest)
    * [.debugObject](#TBUtils.debugObject) : <code>Object</code>

<a name="TBUtils.baseDomain"></a>

### TBUtils.baseDomain : <code>string</code>
<p>If we are on new modmail we use www.reddit.com for all other instances we use whatever is the current domain. Used because some browsers do not like relative urls in extensions</p>

**Kind**: static property of [<code>TBUtils</code>](#TBUtils)  
<a name="TBUtils.apiOauthPOST"></a>

### TBUtils.apiOauthPOST
<p>Sends an authenticated POST request against the OAuth API.</p>

**Kind**: static property of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | <p>The endpoint to request</p> |
| data | <code>object</code> | <p>Query parameters as an object</p> |

<a name="TBUtils.apiOauthGET"></a>

### TBUtils.apiOauthGET
<p>Sends an authenticated GET request against the OAuth API.</p>

**Kind**: static property of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | <p>The endpoint to request</p> |
| data | <code>object</code> | <p>Query parameters as an object</p> |

<a name="TBUtils.updateCache"></a>

### TBUtils.updateCache(cacheNAme, value, subreddit)
<p>Updates in page cache and background page.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| cacheNAme | <code>string</code> | <p>the cache to be written.</p> |
| value |  | <p>the cache value to be updated</p> |
| subreddit | <code>string</code> | <p>when present cache is threated as an object and the value will be written to subreddit property. If missing the value is pushed.</p> |

<a name="TBUtils.link"></a>

### TBUtils.link(link) ⇒ <code>string</code>
<p>Takes an absolute path for a link and prepends the www.reddit.com
domain if we're in new modmail (mod.reddit.com). Makes absolute path
links work everywhere.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| link | <code>string</code> | <p>The link path, starting with &quot;/&quot;</p> |

<a name="TBUtils.debugInformation"></a>

### TBUtils.debugInformation() ⇒ [<code>debugObject</code>](#TBUtils.debugObject)
<p>Puts important debug information in a object so we can easily include it in /r/toolbox posts and comments when people need support.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: [<code>debugObject</code>](#TBUtils.debugObject) - <p>Object with debug information</p>  
<a name="TBUtils.isConfigValidVersion"></a>

### TBUtils.isConfigValidVersion(config, subreddit) ⇒ <code>booleean</code>
<p>Checks if a given subreddit config version is valid with this version of toolbox</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>booleean</code> - <p>valid</p>  

| Param | Type |
| --- | --- |
| config | <code>object</code> | 
| subreddit | <code>string</code> | 

<a name="TBUtils.getToolboxDevs"></a>

### TBUtils.getToolboxDevs() ⇒ <code>array</code>
<p>Fetches the toolbox dev from /r/toolbox or falls back to a predefined list.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>array</code> - <p>List of toolbox devs</p>  
<a name="TBUtils.moveArrayItem"></a>

### TBUtils.moveArrayItem(array, old_index, new_index) ⇒ <code>array</code>
<p>Moves an item in an array from one index to another
https://github.com/brownieboy/array.prototype.move/blob/master/src/array-prototype-move.js</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>array</code> - <p>New array with moved items</p>  

| Param | Type | Description |
| --- | --- | --- |
| array | <code>array</code> | <p>input array</p> |
| old_index | <code>integer</code> |  |
| new_index | <code>integer</code> |  |

<a name="TBUtils.escapeHTML"></a>

### TBUtils.escapeHTML(html) ⇒ <code>string</code>
<p>Escape html entities</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>HTML string with escaped entities</p>  

| Param | Type | Description |
| --- | --- | --- |
| html | <code>string</code> | <p>input html</p> |

<a name="TBUtils.unescapeHTML"></a>

### TBUtils.unescapeHTML(html) ⇒ <code>string</code>
<p>Unescape html entities</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>HTML string with unescaped entities</p>  

| Param | Type | Description |
| --- | --- | --- |
| html | <code>string</code> | <p>input html</p> |

<a name="TBUtils.getTime"></a>

### TBUtils.getTime() ⇒ <code>integer</code>
<p>Give the nummeric value in milliseconds  of the current date and time.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>integer</code> - <p>time value in milliseconds</p>  
<a name="TBUtils.getRandomNumber"></a>

### TBUtils.getRandomNumber(maxInt) ⇒ <code>integer</code>
<p>Give a random number</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>integer</code> - <p>random number</p>  

| Param | Type | Description |
| --- | --- | --- |
| maxInt | <code>integer</code> | <p>Max integer</p> |

<a name="TBUtils.minutesToMilliseconds"></a>

### TBUtils.minutesToMilliseconds(mins) ⇒ <code>integer</code>
<p>Convert minutes to milliseconds</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>integer</code> - <p>Milliseconds</p>  

| Param | Type | Description |
| --- | --- | --- |
| mins | <code>integer</code> | <p>Minutes</p> |

<a name="TBUtils.daysToMilliseconds"></a>

### TBUtils.daysToMilliseconds(days) ⇒ <code>integer</code>
<p>Convert days to milliseconds</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>integer</code> - <p>Milliseconds</p>  

| Param | Type | Description |
| --- | --- | --- |
| days | <code>integer</code> | <p>days</p> |

<a name="TBUtils.millisecondsToDays"></a>

### TBUtils.millisecondsToDays(milliseconds) ⇒ <code>integer</code>
<p>Convert milliseconds to days</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>integer</code> - <p>Days</p>  

| Param | Type | Description |
| --- | --- | --- |
| milliseconds | <code>integer</code> | <p>milliseconds</p> |

<a name="TBUtils.timeConverterISO"></a>

### TBUtils.timeConverterISO(UNIX_timestamp) ⇒ <code>string</code>
<p>convert unix epoch timestamps to ISO format</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>ISO formatted time</p>  

| Param | Type | Description |
| --- | --- | --- |
| UNIX_timestamp | <code>integer</code> | <p>Unix timestamp</p> |

<a name="TBUtils.niceDateDiff"></a>

### TBUtils.niceDateDiff(origdate, newdate) ⇒ <code>string</code>
<p>Returns the difference between days in nice format like &quot;1 year&quot;</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>Formatted date difference</p>  

| Param | Type |
| --- | --- |
| origdate | <code>Date</code> | 
| newdate | <code>Date</code> | 

<a name="TBUtils.timeConverterRead"></a>

### TBUtils.timeConverterRead(UNIX_timestamp) ⇒ <code>string</code>
<p>convert unix epoch timestamps to readable format dd-mm-yyyy hh:mm:ss UTC</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>Formatted date in dd-mm-yyyy hh:mm:ss UTC</p>  

| Param | Type |
| --- | --- |
| UNIX_timestamp | <code>integer</code> | 

<a name="TBUtils.title_to_url"></a>

### TBUtils.title\_to\_url(title) ⇒ <code>string</code>
<p>convert titles to a format usable in urls
from r2.lib.utils import title_to_url</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>Formatted title</p>  

| Param | Type |
| --- | --- |
| title | <code>string</code> | 

<a name="TBUtils.alert"></a>

### TBUtils.alert(options, callback) ⇒ <code>callback</code>
<p>Opens the toolbox &quot;nag&quot; alert everyone loves so much.
USE SPARINGLY</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>callback</code> - <p>callback with true or false in parameter which will be called when the alert is closed.</p>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | <p>The options for the alert</p> |
| options.message | <code>string</code> | <p>The text of the alert</p> |
| options.noteID | <code>number</code> | <p>The ID of the note we're displaying</p> |
| options.showClose | <code>boolean</code> | <p>Whether to show a close button</p> |
| callback | <code>callback</code> | <p>callback function</p> |

<a name="TBUtils.notification"></a>

### TBUtils.notification(title, body, path, markreadid)
<p>Shows a notification, uses native browser notifications if the user
allows it or falls back on html notifications.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| title | <code>string</code> | <p>Notification title</p> |
| body | <code>string</code> | <p>Body text</p> |
| path | <code>string</code> | <p>Absolute path to be opend when clicking the notification</p> |
| markreadid | <code>string</code> | <p>The ID of a conversation to mark as read when the notification is clicked</p> |

<a name="TBUtils.humaniseDays"></a>

### TBUtils.humaniseDays(days) ⇒ <code>string</code>
<p>Converts a given amount of days in a &quot;humanized version&quot; of weeks, months and years.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>x year x months x weeks x day</p>  

| Param | Type |
| --- | --- |
| days | <code>integer</code> | 

<a name="TBUtils.stringFormat"></a>

### TBUtils.stringFormat()
**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Todo**

- [ ] properly describe what this does

<a name="TBUtils.sortBy"></a>

### TBUtils.sortBy(arr, prop)
<p>Sorts an array of objects by property value of specific properties.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>array</code> | <p>input array</p> |
| prop | <code>string</code> | <p>property name</p> |

<a name="TBUtils.saneSort"></a>

### TBUtils.saneSort(arr)
<p>Because normal .sort() is case sensitive.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>array</code> | <p>input array</p> |

<a name="TBUtils.saneSortAs"></a>

### TBUtils.saneSortAs(arr)
<p>Because normal .sort() is case sensitive and we also want to sort ascending from time to time.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>array</code> | <p>input array</p> |

<a name="TBUtils.replaceAll"></a>

### TBUtils.replaceAll(find, replace, str) ⇒ <code>string</code>
<p>Replace all instances of a certaing thing for another thing.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>shiny new string with replaced stuff</p>  

| Param | Type | Description |
| --- | --- | --- |
| find | <code>string</code> | <p>what to find</p> |
| replace | <code>string</code> | <p>what to replace</p> |
| str | <code>string</code> | <p>where to do it all with</p> |

<a name="TBUtils.colorNameToHex"></a>

### TBUtils.colorNameToHex(color) ⇒ <code>string</code>
<p>Will compare the input color to a list of known color names and return the HEX value</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>if a match is found the HEX color, otherwise the input string.</p>  

| Param | Type | Description |
| --- | --- | --- |
| color | <code>string</code> | <p>input color</p> |

<a name="TBUtils.removeLastDirectoryPartOf"></a>

### TBUtils.removeLastDirectoryPartOf(url) ⇒ <code>string</code>
<p>strips the last directory part of an url. Example:  /this/is/url/with/part/ becomes /this/is/url/with/</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>url without the last directory part</p>  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | <p>reddit API comment object.</p> |

<a name="TBUtils.isOdd"></a>

### TBUtils.isOdd(num) ⇒ <code>boolean</code>
<p>Will tell if a number is odd</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>boolean</code> - <p>true if number is odd false if even.</p>  

| Param | Type | Description |
| --- | --- | --- |
| num | <code>integer</code> | <p>reddit API comment object.</p> |

<a name="TBUtils.cleanSubredditName"></a>

### TBUtils.cleanSubredditName(dirtySub) ⇒ <code>string</code>
<p>Because there are a ton of ways how subreddits are written down and sometimes we just want the name.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Returns**: <code>string</code> - <p>shiny sub!</p>  

| Param | Type | Description |
| --- | --- | --- |
| dirtySub | <code>string</code> | <p>dirty dirty sub.</p> |

<a name="TBUtils.sendRequest"></a>

### TBUtils.sendRequest(options)
<p>Sends a generic HTTP request through the background page.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | <p>The options for the AJAX request</p> |
| options.method | <code>string</code> | <p>The HTTP method to use for the request</p> |
| options.endpoint | <code>string</code> | <p>The endpoint to request</p> |
| options.data | <code>object</code> | <p>Query parameters as an object</p> |
| options.oauth | <code>boolean</code> | <p>If true, the request will be sent on oauth.reddit.com, and the <code>Authorization</code> header will be set with the OAuth access token for the logged-in user</p> |

<a name="TBUtils.getJSON"></a>

### TBUtils.getJSON(endpoint, data)
<p>Performs a GET request and promises the body of the response, or the
full response object on error. Maintains an API similar to
<code>$.getJSON()</code> because that's what all these calls used before Chrome
forced us to make all requests in the background.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | <p>The endpoint to request</p> |
| data | <code>object</code> | <p>Query parameters as an object</p> |

<a name="TBUtils.post"></a>

### TBUtils.post(endpoint, data)
<p>Performs a POST request and promises the body of the response, or the
full response object on error. Maintains an API similar to <code>$.post</code>.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | <p>The endpoint to request</p> |
| data | <code>object</code> | <p>The body of the request.</p> |

<a name="TBUtils.getHead"></a>

### TBUtils.getHead(endpoint, doneCallback) ⇒ <code>callback</code>
<p>Perform a HEAD request.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  
**Todo**

- [ ] Implement with promises (consumers need to be updated)
- [ ] "get head" is a confusing name


| Param | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | <p>The endpoint to request</p> |
| doneCallback | <code>callback</code> |  |

<a name="TBUtils.apiOauthRequest"></a>

### TBUtils.apiOauthRequest(method, endpoint, data)
<p>Sends an authenticated request against the OAuth API from the
background page.</p>

**Kind**: static method of [<code>TBUtils</code>](#TBUtils)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | <p>An HTTP verb</p> |
| endpoint | <code>string</code> | <p>The endpoint to request</p> |
| data | <code>object</code> | <p>Query parameters as an object</p> |

<a name="TBUtils.debugObject"></a>

### TBUtils.debugObject : <code>Object</code>
**Kind**: static typedef of [<code>TBUtils</code>](#TBUtils)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| toolboxVersion | <code>string</code> | <p>The toolbox version</p> |
| browser | <code>string</code> | <p>Browser used (Firefox, Chrome, etc)</p> |
| browserVersion | <code>string</code> | <p>The version of the browser</p> |
| platformInformation | <code>string</code> | <p>Other platform information</p> |
| betaMode | <code>boolean</code> | <p>toolbox beta mode enabled</p> |
| debugMode | <code>boolean</code> | <p>toolbox debugMode enabled</p> |
| compactMode | <code>boolean</code> | <p>toolbox compactmode enabled</p> |
| advancedSettings | <code>boolean</code> | <p>toolbox advanced settings enabled</p> |
| cookiesEnabled | <code>boolean</code> | <p>Browser cookies enabled</p> |

