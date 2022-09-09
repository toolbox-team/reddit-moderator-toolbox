import $ from 'jquery';

let jQuery = window.jQuery = window.$ = $;

// highlight jquery plugin https://github.com/tankchintan/highlight-js
!function ($) {
    $.fn.highlight = function (pat, ignore, actionReason = false) {
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
                var isPatternArray = Array.isArray(pat);
                if (!isPatternArray) {
                    pat = [pat];
                }
                var patternCount = pat.length;
                for (var ii = 0; ii < patternCount; ii++) {
                    if (pat[ii] == "") continue; // don't let "" kill us
                    var currentTerm = (ignore ? replaceDiacritics(pat[ii]) : pat[ii]).toUpperCase();
                    var pos = (ignore ? replaceDiacritics(node.data) : node.data).toUpperCase().indexOf(currentTerm);
                    if (pos >= 0) {
                        var spannode = document.createElement('span');
                        if (actionReason) {
                            spannode.className = 'tb-highlight-action-reason';
                        } else {
                            spannode.className = 'tb-highlight';
                        }
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
    };

    $.fn.removeHighlight = function () {
        return this.find("span.tb-highlight, span.tb-highlight-action-reason").each(function () {
            this.parentNode.firstChild.nodeName;
            with (this.parentNode) {
                replaceChild(this.firstChild, this);
                normalize();
            }
        }).end();
    };
}(window.jQuery);

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

import 'timeago';

// DefineProperty is implicitly non-enumerable
// We don't want iterators to see this function
Object.defineProperty(Array.prototype, "clean", {
    value: function clean(deleteValue) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == deleteValue) {
                this.splice(i, 1);
                i--;
            }
        }
        return this;
    },
});

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

// Draggable plugin
(function($) {
    $.fn.drag = function(handle) {

        var $handle = this,
            $drag = this;

        if(handle) {
            $handle = $(handle);
        }

        $handle
            .css('cursor', 'move')
            .on("mousedown", function(e) {
                var x = $drag.offset().left - e.pageX,
                    y = $drag.offset().top - e.pageY,
                    z = $drag.css('z-index');

                $drag.css({
                    'z-index': 100000
                });

                $(document.documentElement)
                    .on('mousemove.drag', function(e) {
                        $drag.offset({
                            left: x + e.pageX,
                            top: y + e.pageY
                        });
                        $drag.css({
                            'bottom': 'auto',
                            'right': 'auto'
                        });

                    })
                    .one('mouseup', function() {
                        $(this).off('mousemove.drag');
                        $drag.css('z-index', z);
                    });

                // disable selection
                e.preventDefault();
            });
    };
})(jQuery);
