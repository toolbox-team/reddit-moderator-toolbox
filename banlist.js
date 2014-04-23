function banlist () {
    if (
        !reddit.logged
        || !TBUtils.setting('BanList', 'enabled', true)
        || !location.pathname.match(/\/about\/(?:banned)\/?/)
    ) return;

    // This should really be broken out into separate dependencies...
    // add spinner icon script
    spinScript = document.createElement('script');
    spinScript.type = "text/javascript";
    spinScript.textContent = '//fgnass.github.com/spin.js#v1.3.3\n'+
    '!function(a,b){"object"==typeof exports?module.exports=b():"function"==typeof define&&define.amd?define(b):a.Spinner=b()}(this,function(){"use strict";function a(a,b){var c,d=document.createElement(a||"div");for(c in b)d[c]=b[c];return d}function b(a){for(var b=1,c=arguments.length;c>b;b++)a.appendChild(arguments[b]);return a}function c(a,b,c,d){var e=["opacity",b,~~(100*a),c,d].join("-"),f=.01+c/d*100,g=Math.max(1-(1-a)/b*(100-f),a),h=k.substring(0,k.indexOf("Animation")).toLowerCase(),i=h&&"-"+h+"-"||"";return m[e]||(n.insertRule("@"+i+"keyframes "+e+"{0%{opacity:"+g+"}"+f+"%{opacity:"+a+"}"+(f+.01)+"%{opacity:1}"+(f+b)%100+"%{opacity:"+a+"}100%{opacity:"+g+"}}",n.cssRules.length),m[e]=1),e}function d(a,b){var c,d,e=a.style;for(b=b.charAt(0).toUpperCase()+b.slice(1),d=0;d<l.length;d++)if(c=l[d]+b,void 0!==e[c])return c;return void 0!==e[b]?b:void 0}function e(a,b){for(var c in b)a.style[d(a,c)||c]=b[c];return a}function f(a){for(var b=1;b<arguments.length;b++){var c=arguments[b];for(var d in c)void 0===a[d]&&(a[d]=c[d])}return a}function g(a){for(var b={x:a.offsetLeft,y:a.offsetTop};a=a.offsetParent;)b.x+=a.offsetLeft,b.y+=a.offsetTop;return b}function h(a,b){return"string"==typeof a?a:a[b%a.length]}function i(a){return"undefined"==typeof this?new i(a):(this.opts=f(a||{},i.defaults,o),void 0)}function j(){function c(b,c){return a("<"+b+\' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">\',c)}n.addRule(".spin-vml","behavior:url(#default#VML)"),i.prototype.lines=function(a,d){function f(){return e(c("group",{coordsize:k+" "+k,coordorigin:-j+" "+-j}),{width:k,height:k})}function g(a,g,i){b(m,b(e(f(),{rotation:360/d.lines*a+"deg",left:~~g}),b(e(c("roundrect",{arcsize:d.corners}),{width:j,height:d.width,left:d.radius,top:-d.width>>1,filter:i}),c("fill",{color:h(d.color,a),opacity:d.opacity}),c("stroke",{opacity:0}))))}var i,j=d.length+d.width,k=2*j,l=2*-(d.width+d.length)+"px",m=e(f(),{position:"absolute",top:l,left:l});if(d.shadow)for(i=1;i<=d.lines;i++)g(i,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for(i=1;i<=d.lines;i++)g(i);return b(a,m)},i.prototype.opacity=function(a,b,c,d){var e=a.firstChild;d=d.shadow&&d.lines||0,e&&b+d<e.childNodes.length&&(e=e.childNodes[b+d],e=e&&e.firstChild,e=e&&e.firstChild,e&&(e.opacity=c))}}var k,l=["webkit","Moz","ms","O"],m={},n=function(){var c=a("style",{type:"text/css"});return b(document.getElementsByTagName("head")[0],c),c.sheet||c.styleSheet}(),o={lines:12,length:7,width:5,radius:10,rotate:0,corners:1,color:"#000",direction:1,speed:1,trail:100,opacity:.25,fps:20,zIndex:2e9,className:"spinner",top:"auto",left:"auto",position:"relative"};i.defaults={},f(i.prototype,{spin:function(b){this.stop();var c,d,f=this,h=f.opts,i=f.el=e(a(0,{className:h.className}),{position:h.position,width:0,zIndex:h.zIndex}),j=h.radius+h.length+h.width;if(b&&(b.insertBefore(i,b.firstChild||null),d=g(b),c=g(i),e(i,{left:("auto"==h.left?d.x-c.x+(b.offsetWidth>>1):parseInt(h.left,10)+j)+"px",top:("auto"==h.top?d.y-c.y+(b.offsetHeight>>1):parseInt(h.top,10)+j)+"px"})),i.setAttribute("role","progressbar"),f.lines(i,f.opts),!k){var l,m=0,n=(h.lines-1)*(1-h.direction)/2,o=h.fps,p=o/h.speed,q=(1-h.opacity)/(p*h.trail/100),r=p/h.lines;!function s(){m++;for(var a=0;a<h.lines;a++)l=Math.max(1-(m+(h.lines-a)*r)%p*q,h.opacity),f.opacity(i,a*h.direction+n,l,h);f.timeout=f.el&&setTimeout(s,~~(1e3/o))}()}return f},stop:function(){var a=this.el;return a&&(clearTimeout(this.timeout),a.parentNode&&a.parentNode.removeChild(a),this.el=void 0),this},lines:function(d,f){function g(b,c){return e(a(),{position:"absolute",width:f.length+f.width+"px",height:f.width+"px",background:b,boxShadow:c,transformOrigin:"left",transform:"rotate("+~~(360/f.lines*j+f.rotate)+"deg) translate("+f.radius+"px,0)",borderRadius:(f.corners*f.width>>1)+"px"})}for(var i,j=0,l=(f.lines-1)*(1-f.direction)/2;j<f.lines;j++)i=e(a(),{position:"absolute",top:1+~(f.width/2)+"px",transform:f.hwaccel?"translate3d(0,0,0)":"",opacity:f.opacity,animation:k&&c(f.opacity,f.trail,l+j*f.direction,f.lines)+" "+1/f.speed+"s linear infinite"}),f.shadow&&b(i,e(g("#000","0 0 4px #000"),{top:"2px"})),b(d,b(i,g(h(f.color,j),"0 0 1px rgba(0,0,0,.1)")));return d},opacity:function(a,b,c){b<a.childNodes.length&&(a.childNodes[b].style.opacity=c)}});var p=e(a("group"),{behavior:"url(#default#VML)"});return!d(p,"transform")&&p.adj?j():k=d(p,"animation"),i});';
    document.getElementsByTagName('head')[0].appendChild(spinScript);
     
    // add debug script
    debugScript = document.createElement('script');
    debugScript.type = "text/javascript";
    debugScript.textContent = 'window.debug=(function(){var i=this,b=Array.prototype.slice,d=i.console,h={},f,g,m=9,c=["error","warn","info","debug","log"],l="assert clear count dir dirxml exception group groupCollapsed groupEnd profile profileEnd table time timeEnd trace".split(" "),j=l.length,a=[];while(--j>=0){(function(n){h[n]=function(){m!==0&&d&&d[n]&&d[n].apply(d,arguments)}})(l[j])}j=c.length;while(--j>=0){(function(n,o){h[o]=function(){var q=b.call(arguments),p=[o].concat(q);a.push(p);e(p);if(!d||!k(n)){return}d.firebug?d[o].apply(i,q):d[o]?d[o](q):d.log(q)}})(j,c[j])}function e(n){if(f&&(g||!d||!d.log)){f.apply(i,n)}}h.setLevel=function(n){m=typeof n==="number"?n:9};function k(n){return m>0?m>n:c.length+m<=n}h.setCallback=function(){var o=b.call(arguments),n=a.length,p=n;f=o.shift()||null;g=typeof o[0]==="boolean"?o.shift():false;p-=typeof o[0]==="number"?o.shift():n;while(p<n){e(a[p++])}};return h})();';
    document.getElementsByTagName('head')[0].appendChild(debugScript);

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
 
    // patch Date.now() for old IE
    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); };
    }
    // extracts a url parameter value from a URL string
    // from http://stackoverflow.com/a/15780907/362042
    function getURLParameter(url, name) {
        return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
    }
 
    // debug at "warn"
    debug.setLevel(3);
 
    var last_update = 0;
    var last_request = 0;
    var time_to_update = 1000 * 60 * 5; // in milliseconds (last value is minutes)
    var ban_items = [];
    var pages_back = 0;
 
    // initialize the loading spinner
    $('#user').parent().spin('small');
    // hide it
    var $loading = $('.spinner').hide();

    // counter for number of bans
    var $num_bans = $('<span id="ban_count"></span>');
    $num_bans.appendTo($('#user').parent());
    
    $('#user').prop('placeholder', 'Please wait while the banlist loads -->');
    
    function _get_next_ban_page(after) {
        // default parameter value handling
        after = typeof after !== 'undefined' ? after : '';
 
        debug.info("_get_next_ban_page("+after+")");
 
        var parameters = {'count': '100', 'after': after};
 
        // make sure we have the loading icon
        $loading.show();
        $('input#user').prop('disabled', true);
 
        after = null;
        last_request = Date.now();
        pages_back = 0;

        $.ajax({
            url: document.location.href,
            data: parameters,
            type: 'get',
            dataType: 'html',
            async: true,
            success: function(data) {
                debug.info("  success!");
                response_page = $(data);
                // append to the list, using clever jQuery context parameter to create jQuery object to parse out the HTML response
                $('.banned-table table tbody').append($('.banned-table table tbody tr', response_page));
 
                after_url = $('.nextprev a[rel~="next"]', response_page).prop('href');
                debug.info(after_url);
                after = getURLParameter(after_url, 'after');
                debug.info(after);
                if (after) {
                    // hit the API hard, to make it more responsive on small subs
                    if (pages_back < 10) {
                        pages_back++;
                        _get_next_ban_page(after);
                    } else {
                        sleep = last_request + 2000 - Date.now();
                        setTimeout(_get_next_ban_page, sleep, after);
                    }
                } else {
                    last_update = Date.now();
                    $loading.hide();
                    $('input#user').prop('disabled', false);
                    // update the visible counter
                    $num_bans.html($(".banned-table table tbody tr:visible").length);
                }
            },
            error: function(data) {
                debug.info("  failed");
                debug.info(data.status);
                if (data.status == 504) {
                    // "504, post some more"
                    this.success(data);
                } else {
                    // Did we get logged out during the process, or some other error?
                    $loading.hide();
                    $('input#user').prop('disabled', false);
                    $num_bans.html("Something went wrong while fetching the banlist. You should reload this page.");
                }
            }
        });
 
    }
 
    function filter(element) {
        var count = 0;
        var value = $(element).val().toLowerCase();
 
        debug.info("filter("+value+")");
 
        if (last_update === 0 || (last_update + time_to_update) <= Date.now()) {
            debug.info("Last updated at "+last_update);
            debug.info("Update delay is "+time_to_update);
            debug.info("Time to update: "+(last_update + time_to_update));
            debug.info("UPDATING now at "+Date.now());
            // clean up
            $('.banned-table table tbody').empty();
 
            _get_next_ban_page();
        }

        // the actual filtering happens here
        $(".banned-table table tbody tr").each(function() {
            if ($(this).find('.user a').text().toLowerCase().search(value) > -1) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });

        // update the results counter
        count = $(".banned-table table tbody tr:visible").length;
        debug.info(count);
        $num_bans.html(count);
    }
 
 
    $('input#user').keyup(function() {
        filter(this);
    });
 
    // we want to populate the table immediately on load. TODO: add a setting for this.
    $('input#user').keyup();

}
 
 
 


// Add script to page
(function () {

    // Check if we are running as an extension
    if (typeof self.on !== "undefined" || (typeof chrome !== "undefined" && chrome.extension)) {
        init();
        return;
    }

    // Check if TBUtils has been added.
    if (!window.TBUadded) {
        window.TBUadded = true;

        var utilsURL = 'http://agentlame.github.io/toolbox/tbutils.js';
        var cssURL = 'http://agentlame.github.io/toolbox/tb.css';
        $('head').prepend('<script type="text/javascript" src=' + utilsURL + '></script>');
        $('head').prepend('<link rel="stylesheet" type="text/css" href="' + cssURL + '"></link>');
    }

    // Do not add script to page until TBUtils is added.
    (function loadLoop() {
        setTimeout(function () {
            if (typeof TBUtils !== "undefined") {
                init();
            } else {
                loadLoop();
            }
        }, 100);
    })();

    function init() {
        var s = document.createElement('script');
        s.textContent = "(" + banlist.toString() + ')();';
        document.head.appendChild(s);
    }
})();