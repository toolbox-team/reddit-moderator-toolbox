function realtime() {
// ===============
// http://userscripts-mirror.org/scripts/show/129928
// By: /u/DEADBEEF
// ===============

    var self = new TB.Module('Realtime Reddit');
    self.shortname = 'Realtime';

    self.settings['enabled']['default'] = false;
    self.config['betamode'] = true;

    self.init = function () {
        let newThingRunning = false;

        // Don't run if the page we're viewing is paginated or a threaded comments page... or page restrictions.
        if (location.search.match(/before|after/) || $('body.comments-page').length || !(TBUtils.isModpage || TBUtils.isCommentsPage || TBUtils.isNewPage || TBUtils.isUserPage)) return;

        // Add checkbox;
        $('.tabmenu:first-of-type').append('<li><a><label>realtime:<input id="realtime" class="tb-realtime-checkbox" type="checkbox" title="Toggle realtime mode" /></label></a></li>');

        var timeout, delay = 5000,
            $checkbox = $('.tb-realtime-checkbox');

        // Add new things
        function getNewThings() {
            self.log('realtime gettingnewthings');

            if (!$('#realtime:checked').length) return;
            timeout = setTimeout(getNewThings, delay);

            // Don't run when window not visible
            if (document.hidden) return;

            // Get first thing
            var before = $('#siteTable div.thing:first').attr('data-fullname'),
                html = [];

            // Get new things, prepend to page on success
            $.get(`${location.pathname}.json-html?before=${before}`).done(function (response) {

            // Compress the HTML of each returned thing
                for (var i in response.data) html.push(compressHTML(response.data[i].data.content));
                if (!html.length) return;

                insertHTML(html);

                // Update Ranks on link listings (if applicable)
                var n = 1;
                $('.rank').each(function () {
                    this.innerHTML = n++;
                    this.style.width = '3.30ex';
                    this.nextSibling.style.width = '3ex';
                });

            });
        }

        // Insert new things into sitetable.
        function insertHTML(html) {
            var $sitetable = $('#siteTable');
            var height = $sitetable.css('top').slice(0, -2),
                things = $(html.join(''))
                    .find('.child').remove().end()
                    .prependTo($sitetable)
                    .each(function () {
                        height -= this.offsetHeight;
                    });

            // Scroll new items into view.
            $sitetable.stop().css('top', height).animate({top: 0}, 5000);
            things.css({opacity: 0.2}).animate({opacity: 1}, 2000, 'linear');

            // Trim items
            $('#siteTable>div.thing:gt(99),#siteTable>.clearleft:gt(99),#siteTable tr.modactions:gt(200)').remove();

            // Run flowwit callbacks on new things.
            if (window.flowwit) for (var i in window.flowwit) window.flowwit[i](things.filter('.thing'));

            // Run callbacks for new things
            $(document).trigger('new_things_inserted');

            // Run callbacks for toolbox
            // It is entirely possible that TBNewThings is fired multiple times.
            // That is why we only set a new timeout if there isn't one set already.
            if(!newThingRunning) {
                newThingRunning = true;
                // Wait a sec for stuff to load.
                setTimeout(function () {
                    newThingRunning = false;
                    var event = new CustomEvent('TBNewThings');
                    window.dispatchEvent(event);
                }, 1000);
            }
        }

        // Toggle realtime view on/off
        $checkbox.on('click', function () {
            var $body = $('body'),
                siteTableMargin = $body.find('.side').outerWidth() + 10,
                $sitetable = $('#siteTable').css({
                    'top': 0,
                    'margin-right': `${siteTableMargin}px`
                }),
                initialPosition = $sitetable.css('position');

            self.log(`realtime checked: ${$checkbox.is(':checked')}`);

            clearTimeout(timeout);
            if ($checkbox.is(':checked')) getNewThings();

            // Toggle promo box
            $('#siteTable_organic,.content>.infobar').css('display', (this.checked ? 'none' : 'block'));
            $sitetable.css('position', (this.checked ? 'relative' : initialPosition));
        });

        // .json-html returns uncompressed html, so we have to compress it manually and replace HTML entities.
        function compressHTML(src) {
            return src.replace(/(\n+|\s+)?&lt;/g, '<')
                .replace(/&gt;(\n+|\s+)?/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/\n/g, '')
                .replace(/child" > {2}False/, 'child">');
        }
    };

    TB.register_module(self);
}

(function() {
    window.addEventListener('TBModuleLoaded', function () {
        realtime();
    });
})();
