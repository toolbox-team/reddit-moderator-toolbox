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
    'default': false,
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
self.register_setting('spamRemoved', {
    'type': 'boolean',
    'default': false,
    'title': 'Show spam button on submissions removed as ham.'
});
self.register_setting('hamSpammed', {
    'type': 'boolean',
    'default': false,
    'title': 'Show remove (not spam) button on submissions removed as spam.'
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
    var $usertextButtons = $('.moderator .usertext-edit .usertext-buttons');
    var $saveButton = $usertextButtons.find('.save');
    if ($saveButton.is(":visible")) {
        var $tbUsertextButtons = $saveButton.parent().find('.tb-usertext-buttons');
        if ($tbUsertextButtons.length) {
            $tbUsertextButtons.prepend('<button class="save-mod tb-action-button">mod save</button>');
        } else {
            $saveButton.parent().find('.status').before('<div class="tb-usertext-buttons"><button class="save-mod tb-action-button">mod save</button></div>');
        }
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
        $(this).closest('.usertext-buttons').find('button.save').click();
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

self.initAddRemoveButtons = function initRemoveButtons() {
    // only need to iterate if at least one of the options is enabled
    $('.thing.link:not(.tb-removebuttons-checked)').each(function () {
        $(this).addClass('tb-removebuttons-checked');

        var thing = TBUtils.getThingInfo(this, true);

        if (self.setting('spamRemoved')) {
            // only for subreddits we mod
            // and for comments that have been removed as ham ("remove not spam")
            if (thing.subreddit && thing.ham) {
                // and only if there isn't already one
                if ($(this).children('.entry').find('.big-mod-buttons .negative').length == 0) {
                    // lifted straight from the "spam" big mod button
                    $('<a class="pretty-button negative" href="#" onclick="return big_mod_action($(this), -2)">spam</a>')
                        .insertBefore($(this).children('.entry').find('.big-mod-buttons .positive'));
                    $('<span class="status-msg spammed">spammed</span>')
                        .insertBefore($(this).children('.entry').find('.big-mod-buttons .status-msg'));
                }
            }
        }

        if (self.setting('hamSpammed')) {
            // only for subreddits we mod
            // and for comments that have been removed as spam ("spam" or "confirm spam")
            if (thing.subreddit && thing.spam) {
                // and only if there isn't already one
                if ($(this).children('.entry').find('.big-mod-buttons .neutral').length == 0) {
                    // lifted straight from the "remove" big mod button
                    $('<a class="pretty-button neutral" href="#" onclick="return big_mod_action($(this), -1)">remove</a>')
                        .insertBefore($(this).children('.entry').find('.big-mod-buttons .positive'));
                    $('<span class="status-msg removed">removed</span>')
                        .insertBefore($(this).children('.entry').find('.big-mod-buttons .status-msg'));
                }
            }
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
    if (self.setting('spamRemoved') || self.setting('hamSpammed'))
        self.initAddRemoveButtons();
};

TB.register_module(self);
}

(function() {
    window.addEventListener("TBModuleLoaded", function () {
        betterbuttons();
    });
})();
