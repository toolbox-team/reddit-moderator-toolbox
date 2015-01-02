function loadmodule() {

var self = new TB.Module('Better Buttons');
self.shortname = 'BButtons';

//Default settings
self.settings['enabled']['default'] = false;

self.register_setting('enableModSave', {
    'type': 'boolean',
    'default': true,
    'title': 'Enable mod-save button'
});

self.register_setting('enableDistinguishToggle', {
    'type': 'boolean',
    'default': true,
    'title': 'Enable distinguish toggling'
});

self.initModSave = function initModSave() {
    self.log("Adding mod save buttons");

    //Watches for changes in the DOM
    var commentObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes) {
                for (var i = 0; i < mutation.addedNodes.length; ++i) {
                    var item = mutation.addedNodes[i];
                    //Check if the added element is a comment
                    if ($(item).is('div.comment')) {
                        self.log($(item));
                        self.log("");

                        //Distinguish the comment
                        var things = $(item).find('form[action="/post/distinguish"] > .option > a');
                        self.log(things);
                        self.log("");
                        self.log(things.first());
                        things.first().click();

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
    if (saveButton.css("display") != "none")
        saveButton.after('<button class="save-mod">mod save</button>');

    //Add actions to the mod save buttons
    $('body').on('click', 'button.save-mod', function (e) {
        self.log("Mod save clicked!");
        commentObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
        $(this).parent().find('button.save').click();
    });
};

self.initDistinguishToggle = function initDistinguishToggle() {
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

    self.log("Adding distinguish toggle events");

    //Add distinguish button listeners
    $('.thing .buttons').on('click', 'form[action="/post/distinguish"]', distinguishClicked);

    //Watches for changes in DOM to add distinguish button listeners if needed
    var commentObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes) {
                for (var i = 0; i < mutation.addedNodes.length; ++i) {
                    var item = mutation.addedNodes[i];
                    //Check if the added element is a comment
                    if ($(item).is('div.comment')) {
                        $(item).find('form[action="/post/distinguish"]').first().on('click', distinguishClicked);
                        return;
                    }
                }
            }
        });
    });
    commentObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
};

self.init = function betterButtonInit() {
    if (self.setting('enableModSave'))
        self.initModSave();

    if (self.setting('enableDistinguishToggle'))
        self.initDistinguishToggle();
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBObjectLoaded", function () {
        loadmodule();
    });
})();
