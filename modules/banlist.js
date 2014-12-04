function banlist() {
var banList = new TB.Module('Ban List');

banList.settings["enabled"]["default"] = true;
banList.config["betamode"] = false; // this module is not in beta

banList.register_setting(
    'automatic', {
        "type": "boolean",
        "default": false,
        "betamode": false,
        "hidden": false,
        "title": "Automatically pre-load the whole ban list for live filtering."
    });

// extracts a url parameter value from a URL string
// from http://stackoverflow.com/a/15780907/362042
// TODO: move to tbutils
banList.getURLParameter = function getURLParameter(url, name) {
    return (new RegExp(name + '=' + '(.+?)(&|$)').exec(url) || [, null])[1];
};

banList.init = function init() {
    if (!(location.pathname.match(/\/about\/(?:banned)\/?/)
        || location.pathname.match(/\/about\/(?:contributors)\/?/))
    ) {
        return;
    }

    banlist_updating = false;
    banlist_last_update = 0;
    last_request = 0;
    time_to_update = 1000 * 60 * 5; // in milliseconds (last value is minutes)
    pages_back = 0;

    function _get_next_ban_page(after, pages_back) {

        // default parameter value handling
        after = typeof after !== 'undefined' ? after : '';
        pages_back = typeof pages_back !== 'undefined' ? pages_back : 0;

        $.log("_get_next_ban_page(" + after + ")");

        var parameters = {'limit': 1000, 'after': after};

        after = null;
        last_request = Date.now();

        $.ajax({
            url: document.location.href,
            data: parameters,
            type: 'get',
            dataType: 'html',
            async: true,
            success: function (data) {
                $.log("  success!");
                $.log("  " + pages_back + " pages back");
                var response_page = $(data);
                // append to the list, using clever jQuery context parameter to create jQuery object to parse out the HTML response
                // var $new_banlist = $('.usertable', response_page);
                $.log($('.usertable table tbody tr', response_page).length);
                if ($('.usertable table tbody tr', response_page).length > 0) {
                    $('.usertable table tbody tr', response_page).each(function () {
                        // workaround for known bug in listings where "next" button is available on last page
                        if (this.className == 'notfound') {
                            return;
                        }

                        var t = $(this).find('.user a').text().toLowerCase(); // username
                        if ($(this).find('input[name="note"]').length > 0) {
                            t += ' ' + $(this).find('input[name="note"]').val().toLowerCase(); // ban note text, if available
                        }
                        $("<td class='indexColumn'></td>").hide().text(t).appendTo(this);
                        $(this).addClass('visible');
                    });
                    var value = $('input#user').val().toLowerCase();
                    filter_banlist($('.usertable', response_page), value, true);
                    $('.usertable table tbody').append($('.usertable table tbody tr', response_page));
                    // update the results counter
                    $num_bans.html($('.usertable tr:visible').length);
                } else {
                    return;
                }

                after_url = $('.nextprev a[rel~="next"]', response_page).prop('href');
                $.log(after_url);
                after = banList.getURLParameter(after_url, 'after');
                $.log(after);
                if (after) {
                    // hit the API hard the first 10, to make it more responsive on small subs
                    if (pages_back < 10) {
                        pages_back++;
                        _get_next_ban_page(after, pages_back);
                    } else {
                        sleep = last_request + 2000 - Date.now();
                        setTimeout(_get_next_ban_page, sleep, after, pages_back);
                    }
                } else {
                    $.log("  last page");
                    banlist_updating = false;
                    banlist_last_update = Date.now();
                    TB.utils.longLoadSpinner(false);
                }
            },
            error: function (data) {
                $.log("  failed");
                $.log(data.status);
                if (data.status == 504) {
                    // "504, post some more"
                    this.success(data);
                } else {
                    // Did we get logged out during the process, or some other error?
                    banlist_updating = false;
                    TB.utils.longLoadSpinner(false);
                    $num_bans.html("Something went wrong while fetching the banlist. You should reload this page.");
                }
            }
        });

    }

    function filter_banlist(banlist, value, ignore_last) {
        $.log('filter(' + value + ')');
        last_value = typeof last_value !== 'undefined' ? last_value : '';
        ignore_last = typeof ignore_last !== 'undefined' ? ignore_last : false;

        if (value == '') {
            $.log('empty');
            // empty search? show all
            $('tr', banlist).show().addClass('visible');
        } else if (!ignore_last && last_value && value.indexOf(last_value) > -1) {
            $.log('subset');
            // is this query a subset of the last query?
            // filter *out* non-matching
            $("tr.visible .indexColumn:not(:contains('" + value + "'))", banlist).parent().hide().removeClass('visible');
        } else {
            $.log('full search');
            $('tr', banlist).hide().removeClass('visible');
            // combine and use a single selector for increased performance
            // credit: http://kobikobi.wordpress.com/2008/09/15/using-jquery-to-filter-table-rows/
            $("tr .indexColumn:contains('" + value + "')", banlist).parent().show().addClass('visible');
        }
        $("tr", banlist).removeClass('even');
        $("tr.visible:even", banlist).addClass('even');

        // update last value
        last_value = value;
    }

    function liveFilter() {
        var $user = $('#user');

        // counter for number of bans
        $num_bans = $('<span id="ban_count"></span>');
        $num_bans.appendTo($user.parent());

        $user.prop('placeholder', 'Begin typing to live filter the list.');

        $('.usertable').addClass('filtered');

        $(".usertable tr").each(function () {
            var t = $(this).text().toLowerCase(); //all row text
            $("<td class='indexColumn'></td>").hide().text(t).appendTo(this);
        });//each tr


        function _filter(value) {
            if (!banlist_updating // don't trigger an update if we're still running
                && (banlist_last_update === 0 // catch the first run, before last_update has been set
                || (banlist_last_update + time_to_update) <= Date.now())
            ) {
                banlist_updating = true;
                TB.utils.longLoadSpinner(true);

                $.log("Updating now")
                // clean up
                $('.usertable table tbody').empty();
                pages_back = 0;
                _get_next_ban_page();
            }

            filter_banlist($('.usertable'), value);
            // update the results counter
            $num_bans.html($('.usertable tr:visible').length);
        }

        // text input trigger
        var $userInput = $('input#user');
        $userInput.keyup(function () {
            if ($('.usertable tr').length > 1000) {
                return;
            } // don't live filter
            var value = $(this).val().toLowerCase();
            _filter(value);
        });

        $userInput.parent().submit(function (e) {
            _filter($('input#user').val().toLowerCase());
            e.preventDefault();
        });

        // we want to populate the table immediately on load.
        $userInput.keyup();
    }

    if (TB.storage.getSetting('BanList', 'automatic', false)) {
        liveFilter();
    } else {
        $tb_liveFilter = $('<button type="button" name="tb_liveFilter">Live Filter</button>');
        $tb_liveFilter.insertAfter($('input#user').next());
        $tb_liveFilter.click(function () {
            liveFilter();
            $(this).remove();
        });
    }
};

TB.register_module(banList);
}

(function() {
    window.addEventListener("TBObjectLoaded", function () {
        banlist();
    });
})();
