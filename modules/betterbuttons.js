function betterbuttons() {
var self = new TB.Module('Better Buttons');
self.shortname = 'BButtons';

// Default settings
self.settings['enabled']['default'] = true;

self.register_setting('enableModSave', {
    'type': 'boolean',
    'default': false,
    'title': 'Enable mod-save button'
});
self.register_setting('enableDistinguishToggle', {
    'type': 'boolean',
    'default': true,
    'title': 'Enable distinguish toggling'
});
self.register_setting('removeRemoveConfirmation', {
    'type': 'boolean',
    'default': false,
    'advanced': true,
    'title': 'Remove remove/approve confirmation'
});
self.register_setting('approveOnIgnore', {
    'type': 'boolean',
    'default': false,
    'title': 'Auto-approve when ignoring reports'
});
self.register_setting('ignoreOnApprove', {
    'type': 'boolean',
    'default': false,
    'title': 'Auto-ignore reports when approving'
});

// Bread and buttons
var $body = $('body');

self.initModSave = function initModSave() {
    if (TB.utils.isModmail) return;
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
    var saveButton = $('.commentarea>.usertext .usertext-buttons .save');
    if (saveButton.css("display") != "none") {
        saveButton.after('<button class="save-mod">mod save</button>');
    }

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
    $body.on('click', 'form[action="/post/distinguish"]', distinguishClicked);

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

self.initRemoveConfirmation = function initRemoveConfirmation() {
    self.log("Adding one-click remove events");

    // Approve
    $body.on('click', '.flat-list .approve-button .togglebutton', function () {
        var yes = $(this).closest('.approve-button').find('.yes')[0];
        if (yes) yes.click();
        // setTimeout(function () {
        //     yes.click();
        // }, 100);
    });
    // Remove and spam
    $body.on('click', '.flat-list .remove-button .togglebutton', function () {
        var $button = $(this).closest('.remove-button'),
            yes = $button.find('.yes')[0];

        // Don't remove if removal reasons are enabled and the button isn't for spam
        if (!$body.hasClass('tb-removal-reasons')
            || ($body.hasClass('tb-removal-reasons') && !TB.modules.RReasons.setting('commentReasons'))
            || $button.children().first().attr('value') === 'spammed'
        ) {
            if (yes) yes.click();
        }
    });
};

self.initAutoApprove = function initAutoApprove() {
    self.log("Adding ignore reports toggle events");

    $body.on('click', '.big-mod-buttons > .pretty-button.neutral', function () {
        self.log("Ignore reports pressed");
        var $button = $(this).parent().find('> span > .positive'),
            button = $button[0];
        if (!$button.hasClass('pressed')) {
            if (button) button.click();
        }
    });
};

self.initAutoIgnoreReports = function initAutoIgnoreReports() {
    self.log("Adding approve toggle events");

    $body.on('click', '.big-mod-buttons > span > .pretty-button.positive', function () {
        var $button = $(this).closest('.big-mod-buttons').find('> .neutral'),
            button = $button[0];
        if (!$button.hasClass('pressed')) {
            if (button) button.click();
        }
    });
};

// Module init

self.init = function() {
    if (self.setting('enableModSave'))
        self.initModSave();
    if (self.setting('enableDistinguishToggle'))
        self.initDistinguishToggle();
    if (self.setting('removeRemoveConfirmation'))
        self.initRemoveConfirmation();
    if (self.setting('approveOnIgnore'))
        self.initAutoApprove();
    if (self.setting('ignoreOnApprove'))
        self.initAutoIgnoreReports();
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        betterbuttons();
    });
})();
