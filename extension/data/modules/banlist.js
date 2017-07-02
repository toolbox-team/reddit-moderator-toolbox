function banlist() {
    var self = new TB.Module('Ban List');
    self.shortname = 'BanList';

    self.settings['enabled']['default'] = true;

    self.register_setting('automatic', {
        'type': 'boolean',
        'default': false,
        'title': 'Automatically pre-load the whole ban list for live filtering.'
    });

    // extracts a url parameter value from a URL string
    // from http://stackoverflow.com/a/15780907/362042
    // TODO: move to tbutils
    self.getURLParameter = function getURLParameter(url, name) {
        return (new RegExp(`${name}=` + `(.+?)(&|$)`).exec(url) || [, null])[1];
    };

    self.init = function () {
        if (!TB.utils.isEditUserPage) return;

        var banlist_updating = false,
            banlist_last_update = 0,
            last_request = 0,
            time_to_update = 1000 * 60 * 5, // in milliseconds (last value is minutes)
            $num_bans = $('<span id="ban_count"></span>');

        function _get_next_ban_page(after, pages_back) {

        // default parameter value handling
            after = typeof after !== 'undefined' ? after : '';
            pages_back = typeof pages_back !== 'undefined' ? pages_back : 0;

            self.log(`_get_next_ban_page(${after})`);

            var parameters = {'limit': 1000, 'after': after};

            after = null;
            last_request = Date.now();
            console.log('hello');
            $.ajax({
                url: document.location.href,
                data: parameters,
                type: 'get',
                dataType: 'html',
                async: true})
                .done(function (data) {
                    console.log(data);
                    self.log('  success!');
                    self.log(`  ${pages_back} pages back`);
                    var response_page = $(data);
                    // append to the list, using clever jQuery context parameter to create jQuery object to parse out the HTML response
                    // var $new_banlist = $('.usertable', response_page);
                    self.log($('.usertable table tbody tr', response_page).length);
                    if ($('.usertable table tbody tr', response_page).length > 0) {
                        $('.usertable table tbody tr', response_page).each(function () {
                        // workaround for known bug in listings where "next" button is available on last page
                            if (this.className == 'notfound') {
                                return;
                            }

                            var t = $(this).find('.user a').text().toLowerCase(); // username
                            if ($(this).find('input[name="note"]').length > 0) {
                                t += ` ${$(this).find('input[name="note"]').val().toLowerCase()}`; // ban note text, if available
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

                    var after_url = $('.nextprev a[rel~="next"]', response_page).prop('href');
                    self.log(after_url);
                    after = self.getURLParameter(after_url, 'after');
                    self.log(after);
                    if (after) {
                    // hit the API hard the first 10, to make it more responsive on small subs
                        if (pages_back < 10) {
                            pages_back++;
                            _get_next_ban_page(after, pages_back);
                        } else {
                            var sleep = last_request + 2000 - Date.now();
                            setTimeout(_get_next_ban_page, sleep, after, pages_back);
                        }
                    } else {
                        self.log('  last page');
                        banlist_updating = false;
                        banlist_last_update = Date.now();
                        TB.ui.longLoadSpinner(false);
                    }
                })
                .fail(function (data) {
                    self.log('  failed');
                    self.log(data.status);
                    if (data.status == 504) {
                    // "504, post some more"
                        this.done(data);
                    } else {
                    // Did we get logged out during the process, or some other error?
                        banlist_updating = false;
                        TB.ui.longLoadSpinner(false);
                        $num_bans.html('Something went wrong while fetching the banlist. You should reload this page.');
                    }
            
                });

        }

        function filter_banlist(banlist, value, ignore_last) {
            self.log(`filter(${value})`);
            var last_value = typeof last_value !== 'undefined' ? last_value : '';
            ignore_last = typeof ignore_last !== 'undefined' ? ignore_last : false;

            if (value == '') {
                self.log('empty');
                // empty search? show all
                $('tr', banlist).show().addClass('visible');
            } else if (!ignore_last && last_value && value.indexOf(last_value) > -1) {
                self.log('subset');
                // is this query a subset of the last query?
                // filter *out* non-matching
                $(`tr.visible .indexColumn:not(:contains('${value}'))`, banlist).parent().hide().removeClass('visible');
            } else {
                self.log('full search');
                $('tr', banlist).hide().removeClass('visible');
                // combine and use a single selector for increased performance
                // credit: http://kobikobi.wordpress.com/2008/09/15/using-jquery-to-filter-table-rows/
                $(`tr .indexColumn:contains('${value}')`, banlist).parent().show().addClass('visible');
            }
            $('tr', banlist).removeClass('even');
            $('tr.visible:even', banlist).addClass('even');

            // update last value
            last_value = value;
        }

        function liveFilter() {
            var $user = $('#user');

            // counter for number of bans
            $num_bans.appendTo($user.parent());

            $user.prop('placeholder', 'Begin typing to live filter the list.');

            $('.usertable').addClass('filtered');

            //each tr
            $('.usertable tr').each(function () {
                var $this = $(this);
                var t = $this.text().toLowerCase(); //all row text
                var $append = $(`<td class='indexColumn'>${t}</td>`).hide();
                $this.append($append);
            });


            function _filter(value) {
                if (!banlist_updating // don't trigger an update if we're still running
                && (banlist_last_update === 0 // catch the first run, before last_update has been set
                || (banlist_last_update + time_to_update) <= Date.now())
                ) {
                    banlist_updating = true;
                    TB.ui.longLoadSpinner(true);

                    self.log('Updating now');
                    // clean up
                    $('.usertable table tbody').empty();
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

        if (self.setting('automatic')) {
            liveFilter();
        } else {
            var $tb_liveFilter = $('<button class="tb-action-button" type="button" name="tb_liveFilter">Live Filter</button>');
            $tb_liveFilter.insertAfter($('input#user').next());
            $tb_liveFilter.click(function () {
                liveFilter();
                $(this).remove();
            });
        }
    };

    TB.register_module(self);
}

(function() {
    window.addEventListener('TBModuleLoaded', function () {
        banlist();
    });
})();