function betterbuttons() {

var betterButtons = new TB.Module('Better Buttons');

//Default settings
betterButtons.settings["enabled"]["default"] = true;

betterButtons.register_setting("enablemodsave", {
    "type": "boolean",
    "default": true,
    "betamode": false,
    "hidden": false,
    "title": "Enable mod-save button"
});
betterButtons.register_setting("enabledistinguishtoggle", {
    "type": "boolean",
    "default": true,
    "betamode": false,
    "hidden": false,
    "title": "Enable distinguish toggling"
});

betterButtons.initModSave = function() {
    //Watches for changes in the DOM
    var commentObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if(mutation.addedNodes) {
                for(var i = 0; i < mutation.addedNodes.length; ++i) {
                    var item = mutation.addedNodes[i];
                    //Check if the added element is a comment
                    if($(item).is('div.comment')) {
                        //Distinguish the comment
                        $(item).find('form[action="/post/distinguish"] > .option > a').first().click();
                        
                        //Stop watching for changes
                        commentObserver.disconnect();
                        return;
                    }
                }
            }
        });
    });

    //Add the mod save button next to each comment save button
    var saveButton = $('body.moderator button.save');
    if(saveButton.css("display") != "none")
        saveButton.after('<button class="save-mod">mod save</button>');
    
    //Add actions to the mod save buttons
    $('.usertext-buttons').on('click', 'button.save-mod', function (e) {
        commentObserver.observe(document.body, {childList: true, subtree: true, attributes: false, characterData: false});
        $(this).parent().find('button.save').click();
    });
};

betterButtons.initDistinguishToggle = function() {
    //Get a comment's distinguish state
    function getDistinguishState(post) {
        var author = $(post).find('a.author').first();
        return author.hasClass('moderator');
    }
    
    //Toggle the distinguished state
    function distinguishClicked() {
        parentPost = $(this).parents('.thing').first();
        var distinguished = getDistinguishState(parentPost);
        
        $(this).find('.option > a').get(distinguished ? 1 : 0).click();
    }
    
    //Add distinguish button listeners
    $('.thing form[action="/post/distinguish"]').on('click', distinguishClicked);
    
    //Watches for changes in DOM to add distinguish button listeners if needed
    var commentObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if(mutation.addedNodes) {
                for(var i = 0; i < mutation.addedNodes.length; ++i) {
                    var item = mutation.addedNodes[i];
                    //Check if the added element is a comment
                    if($(item).is('div.comment')) {
                        $(item).find('form[action="/post/distinguish"]').first().on('click', distinguishClicked);
                        return;
                    }
                }
            }
        });
    });
    commentObserver.observe(document.body, {childList: true, subtree: true, attributes: false, characterData: false});
};

betterButtons.init = function init() {
    $.log("Loading the better button things");
    
    $.log("  Mod save: "+this.setting("enablemodsave"));
    if(this.setting("enablemodsave"))
        betterButtons.initModSave();
    
    $.log("  Distinguish toggle: "+this.setting("enabledistinguishtoggle"));
    if(this.setting("enabledistinguishtoggle"))
        betterButtons.initModSave();
};

TB.register_module(betterButtons);
}

(function () {
    window.addEventListener("TBStorageLoaded", function () {
        betterbuttons();
    });
})();
