// ==UserScript==
// @name         Toolbox jQuery Plugins
// @namespace    http://www.reddit.com/r/toolbox
// @author       creesch, agentlame, dakta
// @description  container for jQuery plugins
// @include      http://reddit.com/*
// @include      https://reddit.com/*
// @include      http://*.reddit.com/*
// @include      https://*.reddit.com/*
// @version 0.1
// ==/UserScript==

    // container for script injection

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
            
            if (skip) {
                console.log('TB [' + arguments.callee.caller.name + ']: ');
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
            
            var msg = lines + ' [' + (arguments.callee.caller.name || 'anonymous function') + ']: ' + message;
            return $.fn.log(msg);
        };
    })(jQuery);

    (function($) {
        $.fn.tooltip = function (message, sender) {
            if ($('body').find('#tb-tooltip').length) return; // don't show more than one, ever.
            var posX = sender.clientX,
                posY = sender.clientY;
                $sender = $(sender.target);
            //$('body').find('#tb-tooltip').remove(); // remove any old tooltips.
            var $tooltip = $('<div id="tb-tooltip">' + message + '</div>').appendTo('body');
            $tooltip.append('<img src="http://creesch.github.io/reddit-declutter/close.png" class="note-close" title="Close" />');
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
            
            return $tooltip.each(function() {
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
        $.tooltip = function(message, sender) {
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
    (function($) {
        $.fn.spin = function(opts, color) {
            var presets = {
                "tiny": { lines: 8, length: 2, width: 2, radius: 3 },
                "small": { lines: 8, length: 4, width: 3, radius: 5 },
                "large": { lines: 10, length: 8, width: 4, radius: 8 }
            };
            if (Spinner) {
                return this.each(function() {
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
                        data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
                    }
                });
            } else {
                throw "Spinner class not available.";
            }
        };
    })(jQuery);

    // highlight jquery plugin https://github.com/tankchintan/highlight-js
    !function($) {
        $.fn.highlight = function(pat, ignore) {
                function replaceDiacritics(str) {
                        var diacritics = [ [ /[\u00c0-\u00c6]/g, 'A' ],
                                [ /[\u00e0-\u00e6]/g, 'a' ], 
                                [ /[\u00c7]/g, 'C' ],
                                [ /[\u00e7]/g, 'c' ], 
                                [ /[\u00c8-\u00cb]/g, 'E' ],
                                [ /[\u00e8-\u00eb]/g, 'e' ], 
                                [ /[\u00cc-\u00cf]/g, 'I' ],
                                [ /[\u00ec-\u00ef]/g, 'i' ], 
                                [ /[\u00d1|\u0147]/g, 'N' ],
                                [ /[\u00f1|\u0148]/g, 'n' ],
                                [ /[\u00d2-\u00d8|\u0150]/g, 'O' ],
                                [ /[\u00f2-\u00f8|\u0151]/g, 'o' ], 
                                [ /[\u0160]/g, 'S' ],
                                [ /[\u0161]/g, 's' ], 
                                [ /[\u00d9-\u00dc]/g, 'U' ],
                                [ /[\u00f9-\u00fc]/g, 'u' ], 
                                [ /[\u00dd]/g, 'Y' ],
                                [ /[\u00fd]/g, 'y' ]
                        ];
                
                        for ( var i = 0; i < diacritics.length; i++) {
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
                return this.length && pat && pat.length ? this.each(function() {
                        ignore = typeof ignore !== 'undefined' ? ignore : $.fn.highlight.defaults.ignore;
                        innerHighlight(this, pat, ignore);
                }) : this;
        };
        
        $.fn.highlight.defaults = {
                ignore : false
        }

        $.fn.removeHighlight = function() {
                return this.find("span.highlight").each(function() {
                        this.parentNode.firstChild.nodeName;
                        with(this.parentNode) {
                                replaceChild(this.firstChild, this);
                                normalize();
                        }
                }).end();
        };
    }(window.jQuery);

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


(function () {
    // add spinner icon script
    var s = document.createElement('script');
    s.type = "text/javascript";
    s.textContent = '//fgnass.github.com/spin.js#v1.3.3\n'+
    '!function(a,b){"object"==typeof exports?module.exports=b():"function"==typeof define&&define.amd?define(b):a.Spinner=b()}(this,function(){"use strict";function a(a,b){var c,d=document.createElement(a||"div");for(c in b)d[c]=b[c];return d}function b(a){for(var b=1,c=arguments.length;c>b;b++)a.appendChild(arguments[b]);return a}function c(a,b,c,d){var e=["opacity",b,~~(100*a),c,d].join("-"),f=.01+c/d*100,g=Math.max(1-(1-a)/b*(100-f),a),h=k.substring(0,k.indexOf("Animation")).toLowerCase(),i=h&&"-"+h+"-"||"";return m[e]||(n.insertRule("@"+i+"keyframes "+e+"{0%{opacity:"+g+"}"+f+"%{opacity:"+a+"}"+(f+.01)+"%{opacity:1}"+(f+b)%100+"%{opacity:"+a+"}100%{opacity:"+g+"}}",n.cssRules.length),m[e]=1),e}function d(a,b){var c,d,e=a.style;for(b=b.charAt(0).toUpperCase()+b.slice(1),d=0;d<l.length;d++)if(c=l[d]+b,void 0!==e[c])return c;return void 0!==e[b]?b:void 0}function e(a,b){for(var c in b)a.style[d(a,c)||c]=b[c];return a}function f(a){for(var b=1;b<arguments.length;b++){var c=arguments[b];for(var d in c)void 0===a[d]&&(a[d]=c[d])}return a}function g(a){for(var b={x:a.offsetLeft,y:a.offsetTop};a=a.offsetParent;)b.x+=a.offsetLeft,b.y+=a.offsetTop;return b}function h(a,b){return"string"==typeof a?a:a[b%a.length]}function i(a){return"undefined"==typeof this?new i(a):(this.opts=f(a||{},i.defaults,o),void 0)}function j(){function c(b,c){return a("<"+b+\' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">\',c)}n.addRule(".spin-vml","behavior:url(#default#VML)"),i.prototype.lines=function(a,d){function f(){return e(c("group",{coordsize:k+" "+k,coordorigin:-j+" "+-j}),{width:k,height:k})}function g(a,g,i){b(m,b(e(f(),{rotation:360/d.lines*a+"deg",left:~~g}),b(e(c("roundrect",{arcsize:d.corners}),{width:j,height:d.width,left:d.radius,top:-d.width>>1,filter:i}),c("fill",{color:h(d.color,a),opacity:d.opacity}),c("stroke",{opacity:0}))))}var i,j=d.length+d.width,k=2*j,l=2*-(d.width+d.length)+"px",m=e(f(),{position:"absolute",top:l,left:l});if(d.shadow)for(i=1;i<=d.lines;i++)g(i,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for(i=1;i<=d.lines;i++)g(i);return b(a,m)},i.prototype.opacity=function(a,b,c,d){var e=a.firstChild;d=d.shadow&&d.lines||0,e&&b+d<e.childNodes.length&&(e=e.childNodes[b+d],e=e&&e.firstChild,e=e&&e.firstChild,e&&(e.opacity=c))}}var k,l=["webkit","Moz","ms","O"],m={},n=function(){var c=a("style",{type:"text/css"});return b(document.getElementsByTagName("head")[0],c),c.sheet||c.styleSheet}(),o={lines:12,length:7,width:5,radius:10,rotate:0,corners:1,color:"#000",direction:1,speed:1,trail:100,opacity:.25,fps:20,zIndex:2e9,className:"spinner",top:"auto",left:"auto",position:"relative"};i.defaults={},f(i.prototype,{spin:function(b){this.stop();var c,d,f=this,h=f.opts,i=f.el=e(a(0,{className:h.className}),{position:h.position,width:0,zIndex:h.zIndex}),j=h.radius+h.length+h.width;if(b&&(b.insertBefore(i,b.firstChild||null),d=g(b),c=g(i),e(i,{left:("auto"==h.left?d.x-c.x+(b.offsetWidth>>1):parseInt(h.left,10)+j)+"px",top:("auto"==h.top?d.y-c.y+(b.offsetHeight>>1):parseInt(h.top,10)+j)+"px"})),i.setAttribute("role","progressbar"),f.lines(i,f.opts),!k){var l,m=0,n=(h.lines-1)*(1-h.direction)/2,o=h.fps,p=o/h.speed,q=(1-h.opacity)/(p*h.trail/100),r=p/h.lines;!function s(){m++;for(var a=0;a<h.lines;a++)l=Math.max(1-(m+(h.lines-a)*r)%p*q,h.opacity),f.opacity(i,a*h.direction+n,l,h);f.timeout=f.el&&setTimeout(s,~~(1e3/o))}()}return f},stop:function(){var a=this.el;return a&&(clearTimeout(this.timeout),a.parentNode&&a.parentNode.removeChild(a),this.el=void 0),this},lines:function(d,f){function g(b,c){return e(a(),{position:"absolute",width:f.length+f.width+"px",height:f.width+"px",background:b,boxShadow:c,transformOrigin:"left",transform:"rotate("+~~(360/f.lines*j+f.rotate)+"deg) translate("+f.radius+"px,0)",borderRadius:(f.corners*f.width>>1)+"px"})}for(var i,j=0,l=(f.lines-1)*(1-f.direction)/2;j<f.lines;j++)i=e(a(),{position:"absolute",top:1+~(f.width/2)+"px",transform:f.hwaccel?"translate3d(0,0,0)":"",opacity:f.opacity,animation:k&&c(f.opacity,f.trail,l+j*f.direction,f.lines)+" "+1/f.speed+"s linear infinite"}),f.shadow&&b(i,e(g("#000","0 0 4px #000"),{top:"2px"})),b(d,b(i,g(h(f.color,j),"0 0 1px rgba(0,0,0,.1)")));return d},opacity:function(a,b,c){b<a.childNodes.length&&(a.childNodes[b].style.opacity=c)}});var p=e(a("group"),{behavior:"url(#default#VML)"});return!d(p,"transform")&&p.adj?j():k=d(p,"animation"),i});';
    document.head.appendChild(s);
})();
