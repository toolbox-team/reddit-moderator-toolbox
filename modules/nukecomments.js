function nukecomments() {

// Adapted from:
// ==UserScript==
// @name          Reddit Mod Nuke Userscript
// @version       6.283.185.307
// @include       htt*://*.reddit.com/*
// @author        djimbob (dr jimbob)
// @downloadURL   https://github.com/agentlame/Reddit-Mod-Nuke-Userscript/raw/master/modnuke.user.js
// @description   This userscript helps reddit moderators delete threads.
// ==/UserScript==

//Setup
var nukeComments = new TB.Module('Nuke Comments');

////Default settings
nukeComments.settings["enabled"]["default"] = true;

// TBConfig.register_setting('displaytype', {
//     'type': 'selector',
//     'values': ["Post border", "Domain background", "Domain border"],
//     'default': "post_border",
//     'betamode': true,
//     'hidden': false,
//     'title': "Tag location"
// });

nukeComments.init = function () {
    console.log('running nuke comments');

    delete_function = function(thread_root) {
        var elmnts = document.getElementsByClassName('id-'+thread_root)[0].querySelectorAll('form input[value="removed"]~span.option.error a.yes,a[onclick^="return big_mod_action($(this), -1)"]');
        for(var i=0; i < elmnts.length; i++) {
        setTimeout(
        	(function(_elmnt) {
        	return function() {
        		var event = document.createEvent('UIEvents');
        		event.initUIEvent('click', true, true, window, 1);
        		_elmnt.dispatchEvent(event);
        	}}
        	)(elmnts[i]), 1500*i); // 1.5s timeout prevents overloading reddit.
        };
    };

    if(document.querySelector('body.moderator')) { // only execute if you are a moderator
        console.log('running nuke comments');

        var nuke_button = new Array();
        var divels = document.querySelectorAll('div.noncollapsed');
        var comment_ids = new Array();
        var use_image = false;
        // create img DOM element to clone
        if (use_image) {
            try {
                var img_element =  document.createElement('img');
                img_element.setAttribute('alt', 'Nuke!');
                img_element.setAttribute('src', chrome.extension.getURL('nuke.png'));
            } catch(e) {
                use_image = false;
            }
        }
        for (var i = 0; i < divels.length; i++) {
            var author_link = divels[i].querySelector('p.tagline>a.author,p.tagline>span.author,p.tagline>em');
            // p.tagline>a.author is normal comment;
            // some author deleted comments seem to have either
            // p.tagline>span.author or p.tagline>em

            comment_ids[i] = divels[i].getAttribute('data-fullname');
                // console.log(i + ':' + comment_ids);
            if(author_link) {
            	// create link DOM element with img inside link
            	nuke_button[i] = document.createElement('a')
            	nuke_button[i].setAttribute('href', 'javascript:void(0)');
            	nuke_button[i].setAttribute('title', 'Nuke!');
            	nuke_button[i].setAttribute('id', 'nuke_'+i);
                    if(use_image) {
            	    nuke_button[i].appendChild(img_element.cloneNode(true));
                    } else {
            	    nuke_button[i].innerHTML= "[Nuke]";
                    }
            	// append after the author's name
            	author_link.parentNode.insertBefore(nuke_button[i], author_link.nextSibling);

            	// Add listener for click; using IIFE to function with _i as value of i when created; not when click
            	nuke_button[i].addEventListener('click', (function(_i) {
            		return function() {
            		var continue_thread = divels[_i].querySelectorAll('span.morecomments>a');
            		var comment_str = " comments?";
            		if(continue_thread.length > 0) {
            		    	comment_str = "+ comments (more after expanding collapsed threads; there will be a pause before the first deletion to retrieve more comments)?";
            		}
            		var delete_button = divels[_i].querySelectorAll('form input[value="removed"]~span.option.error a.yes,a[onclick^="return big_mod_action($(this), -1)"]');
            		// form input[value="removed"]~span.option.error a.yes -- finds the yes for normal deleting comments.
            		// a.pretty-button.neutral finds the 'remove' button for flagged comments
            		if (confirm("Are you sure you want to nuke the following " + delete_button.length + comment_str)) {
            		    	for (var indx=0; indx < continue_thread.length; indx++) {
            		    	var elmnt = continue_thread[indx];
            		    	setTimeout(
            		    		function() {
            		    		var event = document.createEvent('UIEvents');
            		    		event.initUIEvent('click', true, true, window, 1);
            		    		elmnt.dispatchEvent(event);
            		    		}, 2000*indx); // wait two seconds before each ajax call before clicking each "load more comments"
            		    	}
            			if(indx > 0) {
            			setTimeout(function() {delete_function(comment_ids[_i])},
            					2000*(indx + 2)); // wait 4s after last ajax "load more comments"
            			} else {
            			delete_function(comment_ids[_i]); // call immediately if not "load more comments"
            			}
            		}
            		}
            	})(i)); // end of IIFE (immediately invoked function expression)
            }
        }
    }
};
        console.log('running nuke comments');

TB.register_module(nukeComments);

} // nukecomments() wrapper

(function () {
    window.addEventListener("TBObjectLoaded", function () {
        nukecomments();
    });
})();