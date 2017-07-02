function flyingsnoo() {
// @name       Flying Snoo
// @namespace  http://reddit.com/user/LowSociety
// @copyright  2014+, LowSociety

    var self = new TB.Module('Userpage');
    self.shortname = 'Userpage';

    ////Default settings
    self.settings['enabled']['default'] = true;
    self.settings['enabled']['hidden'] = true;  // it's an easter egg.

    self.init = function () {
        if (!TB.utils.isUserPage) return;

        $('.profile-page .footer-parent').click(function () {

            var width = 87,
                height = 145;

            // unlock achievement
            TB.utils.sendEvent(TB.utils.events.TB_FLY_SNOO);

            var floater = $('<div></div>').css({
                height: `${height}px`,
                width: `${width}px`,
                background: 'url(//c.thumbs.redditmedia.com/7U0yjjycFy9MC5ht.png)',
                position: 'absolute',
                top: `${$(this).offset().top}px`,
                left: `${($(window).width() * 0.49) - (width / 2)}px`,
                zIndex: 999
            }).appendTo('body');

            var documentHeight = $(document).height(),
                documentWidth = $(document).width(),
                iterations = 0,
                wind = 0,
                oldTop = floater.position().top,
                oldLeft = floater.position().left;

            var interval = null;

            var startInterval = function () {
                interval = window.setInterval(function () {
                    var newTop = Math.max(0, (oldTop - ((documentHeight) * 0.001)));

                    if (iterations % 50 == 0) {
                        wind = ((Math.random() * 200) - 100) * 0.02;
                    }

                    var newLeft = Math.min(documentWidth - width, Math.max(0, oldLeft + wind));

                    floater.css({
                        top: `${newTop}px`,
                        left: `${newLeft}px`
                    });

                    iterations++;
                    if (newTop <= 0) {
                        window.clearInterval(interval);
                        interval = null;
                    }
                    oldTop = newTop;
                    oldLeft = newLeft;
                }, 50);
            };

            floater.mousedown(function (e) {
                if (interval != null) {
                    window.clearInterval(interval);
                    interval = null;
                }
                floater.data('offsetX', e.offsetX);
                floater.data('offsetY', e.offsetY);

                var dragEvent = function (e) {
                    var offsetX = floater.data('offsetX') || 0,
                        offsetY = floater.data('offsetY') || 0;
                    oldLeft = (e.pageX - offsetX);
                    oldTop = (e.pageY - offsetY);
                    floater.css({
                        'left': `${oldLeft}px`,
                        'top': `${oldTop}px`
                    });
                };

                var releaseEvent = function () {
                    if (interval == null)
                        startInterval();
                    $(document).unbind('mousemove', dragEvent);
                    $(document).unbind('mouseup', releaseEvent);
                };

                $(document).bind('mousemove', dragEvent).bind('mouseup', releaseEvent);

            }).dblclick(function () {
                if (interval != null) {
                    window.clearInterval(interval);
                    interval = null;
                }
                $(this).unbind('mousedown');
                $(this).css('background', 'url(//a.thumbs.redditmedia.com/P0tVLpH52smMNXPN.png)');
                interval = window.setInterval(function () {
                    var newTop = oldTop + Math.max(50, Math.min(10, oldTop * 0.05));
                    floater.css({
                        'top': `${newTop}px`
                    });
                    oldTop = newTop;
                    if (oldTop + height >= documentHeight) {
                        window.clearInterval(interval);
                        interval = null;
                        floater.css({
                            'top': `${documentHeight - height}px`
                        });
                        floater.css('background', 'url(//d.thumbs.redditmedia.com/tIFOjQQ5pPahJKP-.png)');

                        // unlock achievement
                        TB.utils.sendEvent(TB.utils.events.TB_KILL_SNOO);
                    }
                }, 50);
            });

            $(this).css('background', 'transparent');
            startInterval();
        });
    };

    TB.register_module(self);
}

(function() {
    window.addEventListener('TBModuleLoaded', function () {
        flyingsnoo();
    });
})();
