(function ($) {
    $.fn.log = function (message, skip) {
        if (TBUtils.log !== undefined) {
            TBUtils.log.push(message);
        } else {
            console.log('TB: ' + message);
        }
    };
    $.log = function (message, skip) {
        if (!TBUtils.debugMode) return;
        var caller = (arguments.callee.caller.name === undefined) ? arguments.callee.caller.name : 'anonymous function';

        if (skip) {
            console.log(' [' + caller + ']: ');
            console.log(message);
            return;
        }
        if (typeof message === 'object') {
            var obj = message;
            if (message instanceof jQuery) {
                message = 'jQuery object:\n' + $('<div>').append($(message).clone()).html();
            } else {
                try {
                    message = 'Object:\n' + JSON.stringify(message);
                } catch (e) {
                    console.log('TB Console could not convert: ');
                    console.log(obj);
                    message = String(message) + ' (error converting object see broswer console)\nError Message: ' + e.message;
                }
            }
        }

        var lines = String(TBUtils.log.length);//String(TBUtils.log.split('\n').length);
        if (lines !== '0') {
            if (lines.length === 1) lines = '0' + lines;
            if (lines.length === 2) lines = '0' + lines;
        } else {
            lines = '';
        }

        var msg = lines + ' [' + caller + ']: ' + message;
        return $.fn.log(msg);
    };
})(jQuery);

(function ($) {
    $.fn.tooltip = function (message, sender) {
        if ($('body').find('#tb-tooltip').length) return; // don't show more than one, ever.
        var posX = sender.clientX,
            posY = sender.clientY;
        $sender = $(sender.target);
        //$('body').find('#tb-tooltip').remove(); // remove any old tooltips.
        var $tooltip = $('<div id="tb-tooltip">' + message + '</div>').appendTo('body');
        $tooltip.append('<img src="data:image/png;base64,' + TBui.iconNoteClose + '" class="note-close" title="Close" />');
        $tooltip.delegate('.note-close', 'click', function (e) {
            $tooltip.remove();
        });
        /*  The hover to dismis method works better.
        $sender.hover(null, function () {
            console.log('firing leave');
            $tooltip.remove();
            $sender.unbind('mouseleave');
        });
        */

        $tooltip.css({
            left: posX - $tooltip.width() + 155,
            top: posY - $tooltip.height() - 15,
        });

        return $tooltip.each(function () {
            var $this = $(this);
            var hide = function () {
                var timeout = setTimeout(function () {
                    $tooltip.remove();
                }, 500);

                $this.data("tooltip.timeout", timeout);
            };

            /* Bind an event handler to 'hover' (mouseover/mouseout): */
            $this.hover(function () {
                clearTimeout($this.data("tooltip.timeout"));
                $tooltip.show();
            }, hide);

            /* If the user is hovering over the tooltip div, cancel the timeout: */
            $tooltip.hover(function () {
                clearTimeout($this.data("tooltip.timeout"));
            }, hide);
        });
    };
    // No clue why I need to do this.
    $.tooltip = function (message, sender) {
        $.fn.tooltip(message, sender);
    };
})(jQuery);


/*
    * credit: https://gist.github.com/its-florida/1290439/
    * You can now create a spinner using any of the variants below:
    *
    * $("#el").spin(); // Produces default Spinner using the text color of #el.
    * $("#el").spin("small"); // Produces a 'small' Spinner using the text color of #el.
    * $("#el").spin("large", "white"); // Produces a 'large' Spinner in white (or any valid CSS color).
    * $("#el").spin({ ... }); // Produces a Spinner using your custom settings.
    *
    * $("#el").spin(false); // Kills the spinner.
*/
(function ($) {
    $.fn.spin = function (opts, color) {
        var presets = {
            "tiny": { lines: 8, length: 2, width: 2, radius: 3 },
            "small": { lines: 8, length: 4, width: 3, radius: 5 },
            "large": { lines: 10, length: 8, width: 4, radius: 8 }
        };
        if (Spinner) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data();

                if (data.spinner) {
                    data.spinner.stop();
                    delete data.spinner;
                }
                if (opts !== false) {
                    if (typeof opts === "string") {
                        if (opts in presets) {
                            opts = presets[opts];
                        } else {
                            opts = {};
                        }
                        if (color) {
                            opts.color = color;
                        }
                    }
                    data.spinner = new Spinner($.extend({ color: $this.css('color') }, opts)).spin(this);
                }
            });
        } else {
            throw "Spinner class not available.";
        }
    };
})(jQuery);

// highlight jquery plugin https://github.com/tankchintan/highlight-js
!function ($) {
    $.fn.highlight = function (pat, ignore) {
        function replaceDiacritics(str) {
            var diacritics = [[/[\u00c0-\u00c6]/g, 'A'],
                    [/[\u00e0-\u00e6]/g, 'a'],
                    [/[\u00c7]/g, 'C'],
                    [/[\u00e7]/g, 'c'],
                    [/[\u00c8-\u00cb]/g, 'E'],
                    [/[\u00e8-\u00eb]/g, 'e'],
                    [/[\u00cc-\u00cf]/g, 'I'],
                    [/[\u00ec-\u00ef]/g, 'i'],
                    [/[\u00d1|\u0147]/g, 'N'],
                    [/[\u00f1|\u0148]/g, 'n'],
                    [/[\u00d2-\u00d8|\u0150]/g, 'O'],
                    [/[\u00f2-\u00f8|\u0151]/g, 'o'],
                    [/[\u0160]/g, 'S'],
                    [/[\u0161]/g, 's'],
                    [/[\u00d9-\u00dc]/g, 'U'],
                    [/[\u00f9-\u00fc]/g, 'u'],
                    [/[\u00dd]/g, 'Y'],
                    [/[\u00fd]/g, 'y']
            ];

            for (var i = 0; i < diacritics.length; i++) {
                str = str.replace(diacritics[i][0], diacritics[i][1]);
            }

            return str;
        }

        function innerHighlight(node, pat, ignore) {
            var skip = 0;
            if (node.nodeType == 3) {
                var isPatternArray = $.isArray(pat);
                if (!isPatternArray) {
                    pat = [pat];
                }
                var patternCount = pat.length;
                for (var ii = 0; ii < patternCount; ii++) {
                    var currentTerm = (ignore ? replaceDiacritics(pat[ii]) : pat[ii]).toUpperCase();
                    var pos = (ignore ? replaceDiacritics(node.data) : node.data).toUpperCase().indexOf(currentTerm);
                    if (pos >= 0) {
                        var spannode = document.createElement('span');
                        spannode.className = 'tb-highlight';
                        var middlebit = node.splitText(pos);
                        var endbit = middlebit.splitText(currentTerm.length);
                        var middleclone = middlebit.cloneNode(true);
                        spannode.appendChild(middleclone);
                        middlebit.parentNode.replaceChild(spannode, middlebit);
                        skip = 1;
                    }
                }
            } else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
                for (var i = 0; i < node.childNodes.length; ++i) {
                    i += innerHighlight(node.childNodes[i], pat, ignore);
                }
            }
            return skip;
        }
        return this.length && pat && pat.length ? this.each(function () {
            ignore = typeof ignore !== 'undefined' ? ignore : $.fn.highlight.defaults.ignore;
            innerHighlight(this, pat, ignore);
        }) : this;
    };

    $.fn.highlight.defaults = {
        ignore: false
    }

    $.fn.removeHighlight = function () {
        return this.find("span.highlight").each(function () {
            this.parentNode.firstChild.nodeName;
            with (this.parentNode) {
                replaceChild(this.firstChild, this);
                normalize();
            }
        }).end();
    };
}(window.jQuery);


// fallback notifications if the browser does not support notifications or the users does not allow them.
// Adapted from Sticky v1.0 by Daniel Raftery
// http://thrivingkings.com/sticky
(function ($) {

    // Using it without an object
    $.sticky = function (note, options, callback) {
        return $.fn.sticky(note, options, callback);
    };

    $.fn.sticky = function (note, options, callback) {
        // Default settings
        var position = 'bottom-right'; // top-left, top-right, bottom-left, or bottom-right

        var settings = {
            'speed': 'fast', // animations: fast, slow, or integer
            'duplicates': true, // true or false
            'autoclose': false // integer or false
        };

        // Passing in the object instead of specifying a note
        if (!note) {
            note = this.html();
        }

        if (options) {
            $.extend(settings, options);
        }

        // Variables
        var display = true,
            duplicate = 'no',
            uniqID = Math.floor(Math.random() * 99999);

        // Handling duplicate notes and IDs
        $('.sticky-note').each(function () {
            if ($(this).html() == note && $(this).is(':visible')) {
                duplicate = 'yes';
                if (!settings.duplicates) {
                    display = false;
                }
            }
            if ($(this).attr('id') == uniqID) {
                uniqID = Math.floor(Math.random() * 9999999);
            }
        });

        // Make sure the sticky queue exists
        if (!$('body').find('.sticky-queue').html()) {
            $('body').append('<div class="sticky-queue ' + position + '"></div>');
        }

        // Can it be displayed?
        if (display) {
            // Building and inserting sticky note
            $('.sticky-queue').prepend('<div class="sticky border-' + position + '" id="' + uniqID + '"></div>');
            $('#' + uniqID).append('<img src="data:image/png;base64,' + TBui.iconNoteClose + '" class="sticky-close" rel="' + uniqID + '" title="Close" />');
            $('#' + uniqID).append('<div class="sticky-note" rel="' + uniqID + '">' + note + '</div>');

            // Smoother animation
            var height = $('#' + uniqID).height();
            $('#' + uniqID).css('height', height);

            $('#' + uniqID).slideDown(settings.speed);
            display = true;
        }

        // Listeners
        $('.sticky').ready(function () {
            // If 'autoclose' is enabled, set a timer to close the sticky
            if (settings.autoclose) {
                $('#' + uniqID).delay(settings.autoclose).fadeOut(settings.speed);
            }
        });
        // Closing a sticky
        $('.sticky-close').click(function () {
            $('#' + $(this).attr('rel')).dequeue().fadeOut(settings.speed);
        });

        // Callback data
        var response = {
            'id': uniqID,
            'duplicate': duplicate,
            'displayed': display,
            'position': position
        };

        // Callback function?
        if (callback) {
            callback(response);
        } else {
            return (response);
        }
    };
})(jQuery);

// jquery.timer.js
//
// Copyright (c) 2011 Jason Chavannes <jason.chavannes@gmail.com>
// http://jchavannes.com/jquery-timer (MIT License)
(function ($) {
    $.timer = function (func, time, autostart) {
        this.set = function (func, time, autostart) {
            this.init = true;
            if (typeof func == 'object') {
                var paramList = ['autostart', 'time'];
                for (var arg in paramList) { if (func[paramList[arg]] != undefined) { eval(paramList[arg] + " = func[paramList[arg]]"); } };
                func = func.action;
            }
            if (typeof func == 'function') { this.action = func; }
            if (!isNaN(time)) { this.intervalTime = time; }
            if (autostart && !this.isActive) {
                this.isActive = true;
                this.setTimer();
            }
            return this;
        };
        this.once = function (time) {
            var timer = this;
            if (isNaN(time)) { time = 0; }
            window.setTimeout(function () { timer.action(); }, time);
            return this;
        };
        this.play = function (reset) {
            if (!this.isActive) {
                if (reset) { this.setTimer(); }
                else { this.setTimer(this.remaining); }
                this.isActive = true;
            }
            return this;
        };
        this.pause = function () {
            if (this.isActive) {
                this.isActive = false;
                this.remaining -= new Date() - this.last;
                this.clearTimer();
            }
            return this;
        };
        this.stop = function () {
            this.isActive = false;
            this.remaining = this.intervalTime;
            this.clearTimer();
            return this;
        };
        this.toggle = function (reset) {
            if (this.isActive) { this.pause(); }
            else if (reset) { this.play(true); }
            else { this.play(); }
            return this;
        };
        this.reset = function () {
            this.isActive = false;
            this.play(true);
            return this;
        };
        this.clearTimer = function () {
            window.clearTimeout(this.timeoutObject);
        };
        this.setTimer = function (time) {
            var timer = this;
            if (typeof this.action != 'function') { return; }
            if (isNaN(time)) { time = this.intervalTime; }
            this.remaining = time;
            this.last = new Date();
            this.clearTimer();
            this.timeoutObject = window.setTimeout(function () { timer.go(); }, time);
        };
        this.go = function () {
            if (this.isActive) {
                this.action();
                this.setTimer();
            }
        };

        if (this.init) {
            return new $.timer(func, time, autostart);
        } else {
            this.set(func, time, autostart);
            return this;
        }
    };
})(jQuery);


/**
 * Copyright (c) 2011-2014 Felix Gnass
 * Licensed under the MIT license
 * http://fgnass.github.io/spin.js/spin.js
 */
(function (root, factory) {

    /* CommonJS */
    if (typeof exports == 'object') module.exports = factory()

        /* AMD module */
    else if (typeof define == 'function' && define.amd) define(factory)

        /* Browser global */
    else root.Spinner = factory()
}
(this, function () {
    "use strict";

    var prefixes = ['webkit', 'Moz', 'ms', 'O'] /* Vendor prefixes */
      , animations = {} /* Animation rules keyed by their name */
      , useCssAnimations /* Whether to use CSS animations or setTimeout */

    /**
     * Utility function to create elements. If no tag name is given,
     * a DIV is created. Optionally properties can be passed.
     */
    function createEl(tag, prop) {
        var el = document.createElement(tag || 'div')
          , n

        for (n in prop) el[n] = prop[n]
        return el
    }

    /**
     * Appends children and returns the parent.
     */
    function ins(parent /* child1, child2, ...*/) {
        for (var i = 1, n = arguments.length; i < n; i++)
            parent.appendChild(arguments[i])

        return parent
    }

    /**
     * Insert a new stylesheet to hold the @keyframe or VML rules.
     */
    var sheet = (function () {
        var el = createEl('style', { type: 'text/css' })
        ins(document.getElementsByTagName('head')[0], el)
        return el.sheet || el.styleSheet
    }())

    /**
     * Creates an opacity keyframe animation rule and returns its name.
     * Since most mobile Webkits have timing issues with animation-delay,
     * we create separate rules for each line/segment.
     */
    function addAnimation(alpha, trail, i, lines) {
        var name = ['opacity', trail, ~~(alpha * 100), i, lines].join('-')
          , start = 0.01 + i / lines * 100
          , z = Math.max(1 - (1 - alpha) / trail * (100 - start), alpha)
          , prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase()
          , pre = prefix && '-' + prefix + '-' || ''

        if (!animations[name]) {
            sheet.insertRule(
              '@' + pre + 'keyframes ' + name + '{' +
              '0%{opacity:' + z + '}' +
              start + '%{opacity:' + alpha + '}' +
              (start + 0.01) + '%{opacity:1}' +
              (start + trail) % 100 + '%{opacity:' + alpha + '}' +
              '100%{opacity:' + z + '}' +
              '}', sheet.cssRules.length)

            animations[name] = 1
        }

        return name
    }

    /**
     * Tries various vendor prefixes and returns the first supported property.
     */
    function vendor(el, prop) {
        var s = el.style
          , pp
          , i

        prop = prop.charAt(0).toUpperCase() + prop.slice(1)
        for (i = 0; i < prefixes.length; i++) {
            pp = prefixes[i] + prop
            if (s[pp] !== undefined) return pp
        }
        if (s[prop] !== undefined) return prop
    }

    /**
     * Sets multiple style properties at once.
     */
    function css(el, prop) {
        for (var n in prop)
            el.style[vendor(el, n) || n] = prop[n]

        return el
    }

    /**
     * Fills in default values.
     */
    function merge(obj) {
        for (var i = 1; i < arguments.length; i++) {
            var def = arguments[i]
            for (var n in def)
                if (obj[n] === undefined) obj[n] = def[n]
        }
        return obj
    }

    /**
     * Returns the absolute page-offset of the given element.
     */
    function pos(el) {
        var o = { x: el.offsetLeft, y: el.offsetTop }
        while ((el = el.offsetParent))
            o.x += el.offsetLeft, o.y += el.offsetTop

        return o
    }

    /**
     * Returns the line color from the given string or array.
     */
    function getColor(color, idx) {
        return typeof color == 'string' ? color : color[idx % color.length]
    }

    // Built-in defaults

    var defaults = {
        lines: 12,            // The number of lines to draw
        length: 7,            // The length of each line
        width: 5,             // The line thickness
        radius: 10,           // The radius of the inner circle
        rotate: 0,            // Rotation offset
        corners: 1,           // Roundness (0..1)
        color: '#000',        // #rgb or #rrggbb
        direction: 1,         // 1: clockwise, -1: counterclockwise
        speed: 1,             // Rounds per second
        trail: 100,           // Afterglow percentage
        opacity: 1 / 4,         // Opacity of the lines
        fps: 20,              // Frames per second when using setTimeout()
        zIndex: 2e9,          // Use a high z-index by default
        className: 'spinner', // CSS class to assign to the element
        top: '50%',           // center vertically
        left: '50%',          // center horizontally
        position: 'absolute'  // element position
    }

    /** The constructor */
    function Spinner(o) {
        this.opts = merge(o || {}, Spinner.defaults, defaults)
    }

    // Global defaults that override the built-ins:
    Spinner.defaults = {}

    merge(Spinner.prototype, {

        /**
         * Adds the spinner to the given target element. If this instance is already
         * spinning, it is automatically removed from its previous target b calling
         * stop() internally.
         */
        spin: function (target) {
            this.stop()

            var self = this
              , o = self.opts
              , el = self.el = css(createEl(0, { className: o.className }), { position: o.position, width: 0, zIndex: o.zIndex })
              , mid = o.radius + o.length + o.width

            css(el, {
                left: o.left,
                top: o.top
            })

            if (target) {
                target.insertBefore(el, target.firstChild || null)
            }

            el.setAttribute('role', 'progressbar')
            self.lines(el, self.opts)

            if (!useCssAnimations) {
                // No CSS animation support, use setTimeout() instead
                var i = 0
                  , start = (o.lines - 1) * (1 - o.direction) / 2
                  , alpha
                  , fps = o.fps
                  , f = fps / o.speed
                  , ostep = (1 - o.opacity) / (f * o.trail / 100)
                  , astep = f / o.lines

                ; (function anim() {
                    i++;
                    for (var j = 0; j < o.lines; j++) {
                        alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity)

                        self.opacity(el, j * o.direction + start, alpha, o)
                    }
                    self.timeout = self.el && setTimeout(anim, ~~(1000 / fps))
                })()
            }
            return self
        },

        /**
         * Stops and removes the Spinner.
         */
        stop: function () {
            var el = this.el
            if (el) {
                clearTimeout(this.timeout)
                if (el.parentNode) el.parentNode.removeChild(el)
                this.el = undefined
            }
            return this
        },

        /**
         * Internal method that draws the individual lines. Will be overwritten
         * in VML fallback mode below.
         */
        lines: function (el, o) {
            var i = 0
              , start = (o.lines - 1) * (1 - o.direction) / 2
              , seg

            function fill(color, shadow) {
                return css(createEl(), {
                    position: 'absolute',
                    width: (o.length + o.width) + 'px',
                    height: o.width + 'px',
                    background: color,
                    boxShadow: shadow,
                    transformOrigin: 'left',
                    transform: 'rotate(' + ~~(360 / o.lines * i + o.rotate) + 'deg) translate(' + o.radius + 'px' + ',0)',
                    borderRadius: (o.corners * o.width >> 1) + 'px'
                })
            }

            for (; i < o.lines; i++) {
                seg = css(createEl(), {
                    position: 'absolute',
                    top: 1 + ~(o.width / 2) + 'px',
                    transform: o.hwaccel ? 'translate3d(0,0,0)' : '',
                    opacity: o.opacity,
                    animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1 / o.speed + 's linear infinite'
                })

                if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), { top: 2 + 'px' }))
                ins(el, ins(seg, fill(getColor(o.color, i), '0 0 1px rgba(0,0,0,.1)')))
            }
            return el
        },

        /**
         * Internal method that adjusts the opacity of a single line.
         * Will be overwritten in VML fallback mode below.
         */
        opacity: function (el, i, val) {
            if (i < el.childNodes.length) el.childNodes[i].style.opacity = val
        }

    })


    function initVML() {

        /* Utility function to create a VML tag */
        function vml(tag, attr) {
            return createEl('<' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr)
        }

        // No CSS transforms but VML support, add a CSS rule for VML elements:
        sheet.addRule('.spin-vml', 'behavior:url(#default#VML)')

        Spinner.prototype.lines = function (el, o) {
            var r = o.length + o.width
              , s = 2 * r

            function grp() {
                return css(
                  vml('group', {
                      coordsize: s + ' ' + s,
                      coordorigin: -r + ' ' + -r
                  }),
                  { width: s, height: s }
                )
            }

            var margin = -(o.width + o.length) * 2 + 'px'
              , g = css(grp(), { position: 'absolute', top: margin, left: margin })
              , i

            function seg(i, dx, filter) {
                ins(g,
                  ins(css(grp(), { rotation: 360 / o.lines * i + 'deg', left: ~~dx }),
                    ins(css(vml('roundrect', { arcsize: o.corners }), {
                        width: r,
                        height: o.width,
                        left: o.radius,
                        top: -o.width >> 1,
                        filter: filter
                    }),
                      vml('fill', { color: getColor(o.color, i), opacity: o.opacity }),
                      vml('stroke', { opacity: 0 }) // transparent stroke to fix color bleeding upon opacity change
                    )
                  )
                )
            }

            if (o.shadow)
                for (i = 1; i <= o.lines; i++)
                    seg(i, -2, 'progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)')

            for (i = 1; i <= o.lines; i++) seg(i)
            return ins(el, g)
        }

        Spinner.prototype.opacity = function (el, i, val, o) {
            var c = el.firstChild
            o = o.shadow && o.lines || 0
            if (c && i + o < c.childNodes.length) {
                c = c.childNodes[i + o]; c = c && c.firstChild; c = c && c.firstChild
                if (c) c.opacity = val
            }
        }
    }

    var probe = css(createEl('group'), { behavior: 'url(#default#VML)' })

    if (!vendor(probe, 'transform') && probe.adj) initVML()
    else useCssAnimations = vendor(probe, 'animation')

    return Spinner

}));


/**
 * Timeago is a jQuery plugin that makes it easy to support automatically
 * updating fuzzy timestamps (e.g. "4 minutes ago" or "about 1 day ago").
 *
 * @name timeago
 * @version 1.4.1
 * @requires jQuery v1.2.3+
 * @author Ryan McGeary
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * http://timeago.yarp.com/
 *
 * Copyright (c) 2008-2013, Ryan McGeary (ryan -[at]- mcgeary [*dot*] org)
 */

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {
  $.timeago = function(timestamp) {
    if (timestamp instanceof Date) {
      return inWords(timestamp);
    } else if (typeof timestamp === "string") {
      return inWords($.timeago.parse(timestamp));
    } else if (typeof timestamp === "number") {
      return inWords(new Date(timestamp));
    } else {
      return inWords($.timeago.datetime(timestamp));
    }
  };
  var $t = $.timeago;

  $.extend($.timeago, {
    settings: {
      refreshMillis: 60000,
      allowPast: true,
      allowFuture: false,
      localeTitle: false,
      cutoff: 0,
      strings: {
        prefixAgo: null,
        prefixFromNow: null,
        suffixAgo: "ago",
        suffixFromNow: "from now",
        inPast: 'any moment now',
        seconds: "less than a minute",
        minute: "about a minute",
        minutes: "%d minutes",
        hour: "about an hour",
        hours: "about %d hours",
        day: "a day",
        days: "%d days",
        month: "about a month",
        months: "%d months",
        year: "about a year",
        years: "%d years",
        wordSeparator: " ",
        numbers: []
      }
    },

    inWords: function(distanceMillis) {
      if(!this.settings.allowPast && ! this.settings.allowFuture) {
          throw 'timeago allowPast and allowFuture settings can not both be set to false.';
      }

      var $l = this.settings.strings;
      var prefix = $l.prefixAgo;
      var suffix = $l.suffixAgo;
      if (this.settings.allowFuture) {
        if (distanceMillis < 0) {
          prefix = $l.prefixFromNow;
          suffix = $l.suffixFromNow;
        }
      }

      if(!this.settings.allowPast && distanceMillis >= 0) {
        return this.settings.strings.inPast;
      }

      var seconds = Math.abs(distanceMillis) / 1000;
      var minutes = seconds / 60;
      var hours = minutes / 60;
      var days = hours / 24;
      var years = days / 365;

      function substitute(stringOrFunction, number) {
        var string = $.isFunction(stringOrFunction) ? stringOrFunction(number, distanceMillis) : stringOrFunction;
        var value = ($l.numbers && $l.numbers[number]) || number;
        return string.replace(/%d/i, value);
      }

      var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
        seconds < 90 && substitute($l.minute, 1) ||
        minutes < 45 && substitute($l.minutes, Math.round(minutes)) ||
        minutes < 90 && substitute($l.hour, 1) ||
        hours < 24 && substitute($l.hours, Math.round(hours)) ||
        hours < 42 && substitute($l.day, 1) ||
        days < 30 && substitute($l.days, Math.round(days)) ||
        days < 45 && substitute($l.month, 1) ||
        days < 365 && substitute($l.months, Math.round(days / 30)) ||
        years < 1.5 && substitute($l.year, 1) ||
        substitute($l.years, Math.round(years));

      var separator = $l.wordSeparator || "";
      if ($l.wordSeparator === undefined) { separator = " "; }
      return $.trim([prefix, words, suffix].join(separator));
    },

    parse: function(iso8601) {
      var s = $.trim(iso8601);
      s = s.replace(/\.\d+/,""); // remove milliseconds
      s = s.replace(/-/,"/").replace(/-/,"/");
      s = s.replace(/T/," ").replace(/Z/," UTC");
      s = s.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
      s = s.replace(/([\+\-]\d\d)$/," $100"); // +09 -> +0900
      return new Date(s);
    },
    datetime: function(elem) {
      var iso8601 = $t.isTime(elem) ? $(elem).attr("datetime") : $(elem).attr("title");
      return $t.parse(iso8601);
    },
    isTime: function(elem) {
      // jQuery's `is()` doesn't play well with HTML5 in IE
      return $(elem).get(0).tagName.toLowerCase() === "time"; // $(elem).is("time");
    }
  });

  // functions that can be called via $(el).timeago('action')
  // init is default when no action is given
  // functions are called with context of a single element
  var functions = {
    init: function(){
      var refresh_el = $.proxy(refresh, this);
      refresh_el();
      var $s = $t.settings;
      if ($s.refreshMillis > 0) {
        this._timeagoInterval = setInterval(refresh_el, $s.refreshMillis);
      }
    },
    update: function(time){
      var parsedTime = $t.parse(time);
      $(this).data('timeago', { datetime: parsedTime });
      if($t.settings.localeTitle) $(this).attr("title", parsedTime.toLocaleString());
      refresh.apply(this);
    },
    updateFromDOM: function(){
      $(this).data('timeago', { datetime: $t.parse( $t.isTime(this) ? $(this).attr("datetime") : $(this).attr("title") ) });
      refresh.apply(this);
    },
    dispose: function () {
      if (this._timeagoInterval) {
        window.clearInterval(this._timeagoInterval);
        this._timeagoInterval = null;
      }
    }
  };

  $.fn.timeago = function(action, options) {
    var fn = action ? functions[action] : functions.init;
    if(!fn){
      throw new Error("Unknown function name '"+ action +"' for timeago");
    }
    // each over objects here and call the requested function
    this.each(function(){
      fn.call(this, options);
    });
    return this;
  };

  function refresh() {
    var data = prepareData(this);
    var $s = $t.settings;

    if (!isNaN(data.datetime)) {
      if ( $s.cutoff == 0 || Math.abs(distance(data.datetime)) < $s.cutoff) {
        $(this).text(inWords(data.datetime));
      }
    }
    return this;
  }

  function prepareData(element) {
    element = $(element);
    if (!element.data("timeago")) {
      element.data("timeago", { datetime: $t.datetime(element) });
      var text = $.trim(element.text());
      if ($t.settings.localeTitle) {
        element.attr("title", element.data('timeago').datetime.toLocaleString());
      } else if (text.length > 0 && !($t.isTime(element) && element.attr("title"))) {
        element.attr("title", text);
      }
    }
    return element.data("timeago");
  }

  function inWords(date) {
    return $t.inWords(distance(date));
  }

  function distance(date) {
    return (new Date().getTime() - date.getTime());
  }

  // fix for IE6 suckage
  document.createElement("abbr");
  document.createElement("time");
}));


(function ($) {
    // [name] is the name of the event "click", "mouseover", ..
    // same as you'd pass it to bind()
    // [fn] is the handler function
    $.fn.bindFirst = function(name, selector, fn) {
        // bind as you normally would
        // don't want to miss out on any jQuery magic
        this.on(name, selector, fn);

        // Thanks to a comment by @Martin, adding support for
        // namespaced events too.
        this.each(function() {
            var handlers = $._data(this, 'events')[name.split('.')[0]];
            // take out the handler we just inserted from the end
            var handler = handlers.pop();
            // move it at the beginning
            handlers.splice(0, 0, handler);
        });
    };
})(jQuery);

