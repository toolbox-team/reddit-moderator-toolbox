function modmacros() {


var macros = new TB.Module('Mod Macros');
macros.shortname = 'ModMacros';

macros.settings["enabled"]["default"] = false;
macros.config["betamode"] = true;
macros.config["needs_mod_subs"] = true;

    /*
macros.register_setting(
    "hideRemoved", {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Hide removed comments by default."
    });
    */

macros.init = function macrosInit() {

    var $body = $('body');

    // get settings
    //macros.setting('hideRemoved');

    // if we're a mod, add macros to top level reply button.
    if ($.inArray(TB.utils.post_site, TB.utils.mySubs) != 0){
        $('.commentarea>.usertext .usertext-buttons .save').after('<button type="button" class="tb-toplevel-macro">macro</button>');
    }

    // add macro buttons after we click reply, if we're a mod.
    $body.on('click', 'ul.buttons a', function () {
        var $this = $(this);
        if ($this.text() === 'reply'){

            var $thing =  $this.closest('.thing'),
                info = TB.utils.getThingInfo($thing, true);

            // This is because reddit clones the top-level reply box for all reply boxes.
            // We need to remove it before adding the new one, because the new one works differently.
            // RES' @andytuba is a golden fucking god.
            $thing.find('.tb-toplevel-macro').remove();

            // Don't add macro button twice.
            $thing.find('.tb-macro').remove();

            // are we a mod?
            if (!info.subreddit) return;

            $thing.find('.usertext-buttons .cancel').after('<button type="button" class="tb-macro">macro</button>');
        }
    });

    // Look up macros.
    $body.on('click', '.tb-toplevel-macro, .tb-macro', function() {
        var $this = $(this);
        var info = TB.utils.getThingInfo($this); //never send the thing, it will bomb on threads.
        $.log(info.id);

        TBUtils.postComment(info.id, "mods are gods", function(successful, response) {
            if(!successful) {
                TB.utils.alert("Failed to post comment.");
            } else {
                // Distinguish the new reply
                TBUtils.distinguishThing(response.json.data.things[0].data.id, function (successful) {
                    if (!successful) {
                        TB.utils.alert("Failed to distinguish comment.");
                    }
                });
            }
        });

        //var $textarea = $this.closest('.usertext-edit').find('textarea[name=text]');
        //var $save = $this.closest('.usertext-buttons').find('.save');

        //$textarea.val('mods are gods');
        //$save.trigger('click');
    });
};

TB.register_module(macros);

}

(function () {
    // wait for storage
    window.addEventListener("TBUtilsLoaded", function () {
        $.log("got tbutils");
        modmacros();
    });
})();
