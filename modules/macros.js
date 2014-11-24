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

    var $body = $('body'),
        $macroButton = $('<button type="button" class="tb-macro">macro</button>');


    // if we're a mod, add macros to top level reply button.
    if ($.inArray(TB.utils.post_site, TB.utils.mySubs) != 0){
        // I've tried 200 versions of this same concept.  It always adds a second macro button after each 'save' button for replies.
        // In theory, this should only add it to the top-level reply box.
        $('.usertext-buttons:first').find('.save:first').after($macroButton);
    }

    // add macro buttons after we click reply, if we're a mod.
    $body.on('click', 'ul.buttons a', function () {
        var $this = $(this);
        if ($this.text() === 'reply'){
            var $thing =  $this.closest('.thing'),
                info = TB.utils.getThingInfo($thing, true),
                $cancelButton = $thing.find('.usertext-buttons .cancel');

            // are we a mod?
            if (!info.subreddit) return;

            $cancelButton.after($macroButton);

            $cancelButton.on('click', function(){
                $macroButton.remove();
            });

            $macroButton.on('click', function(){
               $macroButton.remove();
            });

        }
    });

    /*
    //
    // preload some generic variables
    //
    var hideRemoved = macros.setting('hideRemoved'),
        approveComments = macros.setting('approvecomments');
    */

    function run() {

        $body.on('click', 'ul.buttons', function () {

        });

    }

    // NER support.
    window.addEventListener("TBNewThings", function () {
        run();
    });

    run();
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
