(function ($) {
    $.fn.log = function (message, caller, orignalMessage) {
        if (TBUtils.log !== undefined && !JSON.parse(localStorage['Toolbox.Utils.skipLocalConsole'] || 'false')) {
            TBUtils.log.push(message);

            // add module to list.
            if (TBUtils.logModules.indexOf(caller) == -1) {
                TBUtils.logModules.push(caller);
            }

        } else {
            console.log(' [' + caller + ']: ');
            console.log(orignalMessage);
        }
    };
    $.log = function (message, skip, callerName) {
        var orignalMessage = message;
        // NO TBU, just push to console.
        if (typeof (TBUtils) == 'undefined') {
            console.log('[' + ((callerName !== undefined) ? callerName : 'TB Preinit') + ']');
            console.log(message);
            return;
        }

        if (!TBUtils.debugMode) return;
        var caller = (arguments.callee.caller.name !== "") ? arguments.callee.caller.name : 'anonymous function';
            caller = (callerName !== undefined) ? callerName : caller;

        if (skip) {
            console.log(' [' + caller + ']: ');
            console.log(message);
            return;
        }
        if (typeof message === 'object') {
            if (message instanceof jQuery) {
                message = 'jQuery object (see browser console) :\n' + $('<div>').append($(message).clone()).html();
                console.log(orignalMessage);
            } else {
                try {
                    message = 'Object (see browser console):\n' + JSON.stringify(message);
                    console.log(orignalMessage);
                } catch (e) {
                    console.log('TB Console could not convert: ');
                    console.log(orignalMessage);
                    message = String(message) + ' (error converting object see browser console)\nError Message: ' + e.message;
                }
            }
        }

        var lines = String(TBUtils.log.length); //String(TBUtils.log.split('\n').length);
        if (lines !== '0') {
            if (lines.length === 1) lines = '0' + lines;
            if (lines.length === 2) lines = '0' + lines;
        } else {
            lines = '';
        }

        var msg = lines + ' [' + caller + ']: ' + message;
        return $.fn.log(msg, caller, orignalMessage);
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
        $tooltip.append('<img src="data:image/png;base64,' + TBui.iconClose + '" class="note-close" title="Close" />');
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
                    if (pat[ii] == "") continue; // don't let "" kill us
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
    };

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
            $('#' + uniqID).append('<img src="data:image/png;base64,' + TBui.iconClose + '" class="sticky-close" rel="' + uniqID + '" title="Close" />');
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
                            'bottom': 'inherit',
                            'right': 'inherit'
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
