'use strict';
/** @namespace  TBHelpers */
(function (TBHelpers) {
    const logger = TBLog('TBHelpers');

    /**
     * Debounces a given function based on a given timeout.
     * @function debounce
     * @memberof TBHelpers
     * @param {function} func input function
     * @param {number} debounceTime the amount of time used to wait in ms.
     * @returns {function} the executed function
     */
    TBHelpers.debounce = function (func, debounceTime = 100) {
        let timeout;

        return function (...args) {
            const functionCall = () => func.apply(this, args);
            clearTimeout(timeout);
            timeout = setTimeout(functionCall, debounceTime);
        };
    };

    /**
     * Moves an item in an array from one index to another
     * https://github.com/brownieboy/array.prototype.move/blob/master/src/array-prototype-move.js
     * @function moveArrayItem
     * @memberof TBHelpers
     * @param {array} array input array
     * @param {integer} old_index
     * @param {integer} new_index
     * @returns {array} New array with moved items
     */
    TBHelpers.moveArrayItem = function moveArrayItem (array, old_index, new_index) {
        if (array.length === 0) {
            return array;
        }
        while (old_index < 0) {
            old_index += array.length;
        }
        while (new_index < 0) {
            new_index += array.length;
        }
        if (new_index >= array.length) {
            let k = new_index - array.length;
            while (k-- + 1) {
                array.push(undefined);
            }
        }
        array.splice(new_index, 0, array.splice(old_index, 1)[0]);
        return array;
    };

    /**
     * Escape html entities
     * @function escapeHTML
     * @memberof TBHelpers
     * @param {string} html input html
     * @returns {string} HTML string with escaped entities
     */
    TBHelpers.escapeHTML = function (html) {
        const entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
        };

        return String(html).replace(/[&<>"'/]/g, s => entityMap[s]);
    };

    /**
     * Unescape html entities
     * @function unescapeHTML
     * @memberof TBHelpers
     * @param {string} html input html
     * @returns {string} HTML string with unescaped entities
     */
    TBHelpers.unescapeHTML = function (html) {
        const entityMap = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&#x2F;': '/',
        };

        return String(html).replace(/[&<>"'/]/g, s => entityMap[s]);
    };

    /**
     * Give the nummeric value in milliseconds  of the current date and time.
     * @function getTime
     * @memberof TBHelpers
     * @returns {integer} time value in milliseconds
     */
    TBHelpers.getTime = function () {
        return new Date().getTime();
    };

    /**
     * Give a random number
     * @function getRandomNumber
     * @memberof TBHelpers
     * @param {integer} maxInt Max integer
     * @returns {integer} random number
     */
    TBHelpers.getRandomNumber = function (maxInt) {
        return Math.floor(Math.random() * maxInt + 1);
    };

    /**
     * Convert minutes to milliseconds
     * @function minutesToMilliseconds
     * @memberof TBHelpers
     * @param {integer} mins Minutes
     * @returns {integer} Milliseconds
     */
    TBHelpers.minutesToMilliseconds = function (mins) {
        const oneMin = 60000;
        let milliseconds = mins * 60 * 1000;

        // Never return less than one min.
        if (milliseconds < oneMin) {
            milliseconds = oneMin;
        }

        return milliseconds;
    };

    /**
     * Convert days to milliseconds
     * @function daysToMilliseconds
     * @memberof TBHelpers
     * @param {integer} days days
     * @returns {integer} Milliseconds
     */
    TBHelpers.daysToMilliseconds = function (days) {
        return days * 86400000;
    };

    /**
     * Convert milliseconds to days
     * @function millisecondsToDays
     * @memberof TBHelpers
     * @param {integer} milliseconds milliseconds
     * @returns {integer} Days
     */
    TBHelpers.millisecondsToDays = function (milliseconds) {
        return milliseconds / 86400000;
    };

    /**
     * convert unix epoch timestamps to ISO format
     * @function timeConverterISO
     * @memberof TBHelpers
     * @param {integer} UNIX_timestamp Unix timestamp
     * @returns {string} ISO formatted time
     */
    TBHelpers.timeConverterISO = function (UNIX_timestamp) {
        const a = new Date(UNIX_timestamp * 1000);
        const year = a.getFullYear();
        const month = `0${a.getUTCMonth() + 1}`.slice(-2);
        const date = `0${a.getUTCDate()}`.slice(-2);
        const hour = `0${a.getUTCHours()}`.slice(-2);
        const min = `0${a.getUTCMinutes()}`.slice(-2);
        const sec = `0${a.getUTCSeconds()}`.slice(-2);
        return `${year}-${month}-${date}T${hour}:${min}:${sec}Z`;
    };

    /**
     * Returns the difference between days in nice format like "1 year"
     * @function niceDateDiff
     * @memberof TBHelpers
     * @param {Date} origdate
     * @param {Date} newdate
     * @returns {string} Formatted date difference
     */
    TBHelpers.niceDateDiff = function (origdate, newdate) {
        // Enter the month, day, and year below you want to use as
        // the starting point for the date calculation
        if (!newdate) {
            newdate = new Date();
        }

        const amonth = origdate.getUTCMonth() + 1;
        const aday = origdate.getUTCDate();
        const ayear = origdate.getUTCFullYear();

        const tyear = newdate.getUTCFullYear();
        const tmonth = newdate.getUTCMonth() + 1;
        const tday = newdate.getUTCDate();

        let y = 1;
        let mm = 1;
        let d = 1;
        let a2 = 0;
        let a1 = 0;
        let f = 28;

        if (tyear % 4 === 0 && tyear % 100 !== 0 || tyear % 400 === 0) {
            f = 29;
        }

        const m = [31, f, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        let dyear = tyear - ayear;

        let dmonth = tmonth - amonth;
        if (dmonth < 0 && dyear > 0) {
            dmonth += 12;
            dyear--;
        }

        let dday = tday - aday;
        if (dday < 0) {
            if (dmonth > 0) {
                let ma = amonth + tmonth;

                if (ma >= 12) {
                    ma -= 12;
                }
                if (ma < 0) {
                    ma += 12;
                }
                dday += m[ma];
                dmonth--;
                if (dmonth < 0) {
                    dyear--;
                    dmonth += 12;
                }
            } else {
                dday = 0;
            }
        }

        let returnString = '';

        if (dyear === 0) {
            y = 0;
        }
        if (dmonth === 0) {
            mm = 0;
        }
        if (dday === 0) {
            d = 0;
        }
        if (y === 1 && mm === 1) {
            a1 = 1;
        }
        if (y === 1 && d === 1) {
            a1 = 1;
        }
        if (mm === 1 && d === 1) {
            a2 = 1;
        }
        if (y === 1) {
            if (dyear === 1) {
                returnString += `${dyear} year`;
            } else {
                returnString += `${dyear} years`;
            }
        }
        if (a1 === 1 && a2 === 0) {
            returnString += ' and ';
        }
        if (a1 === 1 && a2 === 1) {
            returnString += ', ';
        }
        if (mm === 1) {
            if (dmonth === 1) {
                returnString += `${dmonth} month`;
            } else {
                returnString += `${dmonth} months`;
            }
        }
        if (a2 === 1) {
            returnString += ' and ';
        }
        if (d === 1) {
            if (dday === 1) {
                returnString += `${dday} day`;
            } else {
                returnString += `${dday} days`;
            }
        }
        if (returnString === '') {
            returnString = '0 days';
        }
        return returnString;
    };

    /**
     * convert unix epoch timestamps to readable format dd-mm-yyyy hh:mm:ss UTC
     * @function timeConverterRead
     * @memberof TBHelpers
     * @param {integer} UNIX_timestamp
     * @returns {string} Formatted date in dd-mm-yyyy hh:mm:ss UTC
     */
    TBHelpers.timeConverterRead = function (UNIX_timestamp) {
        const a = new Date(UNIX_timestamp * 1000);
        const year = a.getFullYear();
        const month = `0${a.getUTCMonth() + 1}`.slice(-2);
        const date = `0${a.getUTCDate()}`.slice(-2);
        const hour = `0${a.getUTCHours()}`.slice(-2);
        const min = `0${a.getUTCMinutes()}`.slice(-2);
        const sec = `0${a.getUTCSeconds()}`.slice(-2);
        return `${date}-${month}-${year} ${hour}:${min}:${sec} UTC`;
    };

    /**
     * convert titles to a format usable in urls
     * from r2.lib.utils import title_to_url
     * @function title_to_url
     * @memberof TBHelpers
     * @param {string} title
     * @returns {string} Formatted title
     */
    TBHelpers.title_to_url = function (title) {
        const max_length = 50;

        title = title.replace(/\s+/g, '_'); // remove whitespace
        title = title.replace(/\W+/g, ''); // remove non-printables
        title = title.replace(/_+/g, '_'); // remove double underscores
        title = title.replace(/^_+|_+$/g, ''); // remove trailing underscores
        title = title.toLowerCase(); // lowercase the title

        if (title.length > max_length) {
            title = title.substr(0, max_length);
            title = title.replace(/_[^_]*$/g, '');
        }

        return title || '_';
    };

    // Easy way to use templates. Usage example:
    //    TBCore.template('/r/{{subreddit}}/comments/{{link_id}}/{{title}}/', {
    //                'subreddit': 'toolbox',
    //                'title':  title_to_url('this is a title we pulled from a post),
    //                'link_id': '2kwx2o'
    //            });
    TBHelpers.template = function (tpl, variables) {
        return tpl.replace(/{{([^}]+)}}/g, (match, variable) => variables[variable]);
    };

    /**
     * Converts a given amount of days in a "humanized version" of weeks, months and years.
     * @function humaniseDays
     * @memberof TBHelpers
     * @param {integer} days
     * @returns {string} x year x months x weeks x day
     */
    TBHelpers.humaniseDays = function (days) {
        let str = '';
        const values = {
            ' year': 365,
            ' month': 30,
            ' week': 7,
            ' day': 1,
        };

        for (const x of Object.keys(values)) {
            const amount = Math.floor(days / values[x]);

            if (amount >= 1) {
                str += `${amount + x + (amount > 1 ? 's' : '')} `;
                days -= amount * values[x];
            }
        }
        return str.slice(0, -1);
    };

    /** @todo properly describe what this does */
    TBHelpers.stringFormat = function (format, ...args) {
        return format.replace(/{(\d+)}/g, (match, number) => typeof args[number] !== 'undefined' ? args[number] : match);
    };

    /**
     * Sorts an array of objects by property value of specific properties.
     * @function sortBy
     * @memberof TBHelpers
     * @param {array} arr input array
     * @param {string} prop property name
     */
    TBHelpers.sortBy = function sortBy (arr, prop) {
        return arr.sort((a, b) => {
            if (a[prop] < b[prop]) {
                return 1;
            }
            if (a[prop] > b[prop]) {
                return -1;
            }
            return 0;
        });
    };

    /**
     * Because normal .sort() is case sensitive.
     * @function saneSort
     * @memberof TBHelpers
     * @param {array} arr input array
     */
    TBHelpers.saneSort = function saneSort (arr) {
        return arr.sort((a, b) => {
            if (a.toLowerCase() < b.toLowerCase()) {
                return -1;
            }
            if (a.toLowerCase() > b.toLowerCase()) {
                return 1;
            }
            return 0;
        });
    };

    /**
     * Because normal .sort() is case sensitive and we also want to sort ascending from time to time.
     * @function saneSortAs
     * @memberof TBHelpers
     * @param {array} arr input array
     */
    TBHelpers.saneSortAs = function saneSortAs (arr) {
        return arr.sort((a, b) => {
            if (a.toLowerCase() > b.toLowerCase()) {
                return -1;
            }
            if (a.toLowerCase() < b.toLowerCase()) {
                return 1;
            }
            return 0;
        });
    };

    /**
     * Replace all instances of a certaing thing for another thing.
     * @function replaceAll
     * @memberof TBHelpers
     * @param {string} find what to find
     * @param {string} replace what to replace
     * @param {string} str where to do it all with
     * @returns {string} shiny new string with replaced stuff
     */
    TBHelpers.replaceAll = function (find, replace, str) {
        find = find.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
        return str.replace(new RegExp(find, 'g'), replace);
    };

    /**
     * Will compare the input color to a list of known color names and return the HEX value
     * @function colorNameToHex
     * @memberof TBHelpers
     * @param {string} color input color
     * @returns {string} if a match is found the HEX color, otherwise the input string.
     */
    TBHelpers.colorNameToHex = function (color) {
        const colorUPPERCASE = color.toUpperCase();
        let returnValue;

        const htmlColors = {
            'ALICEBLUE': '#F0F8FF',
            'ANTIQUEWHITE': '#FAEBD7',
            'AQUA': '#00FFFF',
            'AQUAMARINE': '#7FFFD4',
            'AZURE': '#F0FFFF',
            'BEIGE': '#F5F5DC',
            'BISQUE': '#FFE4C4',
            'BLACK': '#000000',
            'BLANCHEDALMOND': '#FFEBCD',
            'BLUE': '#0000FF',
            'BLUEVIOLET': '#8A2BE2',
            'BROWN': '#A52A2A',
            'BURLYWOOD': '#DEB887',
            'CADETBLUE': '#5F9EA0',
            'CHARTREUSE': '#7FFF00',
            'CHOCOLATE': '#D2691E',
            'CORAL': '#FF7F50',
            'CORNFLOWERBLUE': '#6495ED',
            'CORNSILK': '#FFF8DC',
            'CRIMSON': '#DC143C',
            'CYAN': '#00FFFF',
            'DARKBLUE': '#00008B',
            'DARKCYAN': '#008B8B',
            'DARKGOLDENROD': '#B8860B',
            'DARKGRAY': '#A9A9A9',
            'DARKGREY': '#A9A9A9',
            'DARKGREEN': '#006400',
            'DARKKHAKI': '#BDB76B',
            'DARKMAGENTA': '#8B008B',
            'DARKOLIVEGREEN': '#556B2F',
            'DARKORANGE': '#FF8C00',
            'DARKORCHID': '#9932CC',
            'DARKRED': '#8B0000',
            'DARKSALMON': '#E9967A',
            'DARKSEAGREEN': '#8FBC8F',
            'DARKSLATEBLUE': '#483D8B',
            'DARKSLATEGRAY': '#2F4F4F',
            'DARKSLATEGREY': '#2F4F4F',
            'DARKTURQUOISE': '#00CED1',
            'DARKVIOLET': '#9400D3',
            'DEEPPINK': '#FF1493',
            'DEEPSKYBLUE': '#00BFFF',
            'DIMGRAY': '#696969',
            'DIMGREY': '#696969',
            'DODGERBLUE': '#1E90FF',
            'FIREBRICK': '#B22222',
            'FLORALWHITE': '#FFFAF0',
            'FORESTGREEN': '#228B22',
            'FUCHSIA': '#FF00FF',
            'GAINSBORO': '#DCDCDC',
            'GHOSTWHITE': '#F8F8FF',
            'GOLD': '#FFD700',
            'GOLDENROD': '#DAA520',
            'GRAY': '#808080',
            'GREY': '#808080',
            'GREEN': '#008000',
            'GREENYELLOW': '#ADFF2F',
            'HONEYDEW': '#F0FFF0',
            'HOTPINK': '#FF69B4',
            'INDIANRED ': '#CD5C5C',
            'INDIGO ': '#4B0082',
            'IVORY': '#FFFFF0',
            'KHAKI': '#F0E68C',
            'LAVENDER': '#E6E6FA',
            'LAVENDERBLUSH': '#FFF0F5',
            'LAWNGREEN': '#7CFC00',
            'LEMONCHIFFON': '#FFFACD',
            'LIGHTBLUE': '#ADD8E6',
            'LIGHTCORAL': '#F08080',
            'LIGHTCYAN': '#E0FFFF',
            'LIGHTGOLDENRODYELLOW': '#FAFAD2',
            'LIGHTGRAY': '#D3D3D3',
            'LIGHTGREY': '#D3D3D3',
            'LIGHTGREEN': '#90EE90',
            'LIGHTPINK': '#FFB6C1',
            'LIGHTSALMON': '#FFA07A',
            'LIGHTSEAGREEN': '#20B2AA',
            'LIGHTSKYBLUE': '#87CEFA',
            'LIGHTSLATEGRAY': '#778899',
            'LIGHTSLATEGREY': '#778899',
            'LIGHTSTEELBLUE': '#B0C4DE',
            'LIGHTYELLOW': '#FFFFE0',
            'LIME': '#00FF00',
            'LIMEGREEN': '#32CD32',
            'LINEN': '#FAF0E6',
            'MAGENTA': '#FF00FF',
            'MAROON': '#800000',
            'MEDIUMAQUAMARINE': '#66CDAA',
            'MEDIUMBLUE': '#0000CD',
            'MEDIUMORCHID': '#BA55D3',
            'MEDIUMPURPLE': '#9370DB',
            'MEDIUMSEAGREEN': '#3CB371',
            'MEDIUMSLATEBLUE': '#7B68EE',
            'MEDIUMSPRINGGREEN': '#00FA9A',
            'MEDIUMTURQUOISE': '#48D1CC',
            'MEDIUMVIOLETRED': '#C71585',
            'MIDNIGHTBLUE': '#191970',
            'MINTCREAM': '#F5FFFA',
            'MISTYROSE': '#FFE4E1',
            'MOCCASIN': '#FFE4B5',
            'NAVAJOWHITE': '#FFDEAD',
            'NAVY': '#000080',
            'OLDLACE': '#FDF5E6',
            'OLIVE': '#808000',
            'OLIVEDRAB': '#6B8E23',
            'ORANGE': '#FFA500',
            'ORANGERED': '#FF4500',
            'ORCHID': '#DA70D6',
            'PALEGOLDENROD': '#EEE8AA',
            'PALEGREEN': '#98FB98',
            'PALETURQUOISE': '#AFEEEE',
            'PALEVIOLETRED': '#DB7093',
            'PAPAYAWHIP': '#FFEFD5',
            'PEACHPUFF': '#FFDAB9',
            'PERU': '#CD853F',
            'PINK': '#FFC0CB',
            'PLUM': '#DDA0DD',
            'POWDERBLUE': '#B0E0E6',
            'PURPLE': '#800080',
            'REBECCAPURPLE': '#663399',
            'RED': '#FF0000',
            'ROSYBROWN': '#BC8F8F',
            'ROYALBLUE': '#4169E1',
            'SADDLEBROWN': '#8B4513',
            'SALMON': '#FA8072',
            'SANDYBROWN': '#F4A460',
            'SEAGREEN': '#2E8B57',
            'SEASHELL': '#FFF5EE',
            'SIENNA': '#A0522D',
            'SILVER': '#C0C0C0',
            'SKYBLUE': '#87CEEB',
            'SLATEBLUE': '#6A5ACD',
            'SLATEGRAY': '#708090',
            'SLATEGREY': '#708090',
            'SNOW': '#FFFAFA',
            'SPRINGGREEN': '#00FF7F',
            'STEELBLUE': '#4682B4',
            'TAN': '#D2B48C',
            'TEAL': '#008080',
            'THISTLE': '#D8BFD8',
            'TOMATO': '#FF6347',
            'TURQUOISE': '#40E0D0',
            'VIOLET': '#EE82EE',
            'WHEAT': '#F5DEB3',
            'WHITE': '#FFFFFF',
            'WHITESMOKE': '#F5F5F5',
            'YELLOW': '#FFFF00',
            'YELLOWGREEN': '#9ACD32',
        };

        if (Object.prototype.hasOwnProperty.call(htmlColors, colorUPPERCASE)) {
            returnValue = htmlColors[colorUPPERCASE];
        } else {
            returnValue = color;
        }
        return returnValue;
    };

    /**
     * strips the last directory part of an url. Example:  /this/is/url/with/part/ becomes /this/is/url/with/
     * @function removeLastDirectoryPartOf
     * @memberof TBHelpers
     * @param {string} url reddit API comment object.
     * @returns {string} url without the last directory part
     */
    TBHelpers.removeLastDirectoryPartOf = function (url) {
        const urlNoSlash = url.replace(/\/$/, '');
        const array = urlNoSlash.split('/');
        array.pop();
        const returnValue = `${array.join('/')}/`;
        return returnValue;
    };

    /**
     * Will tell if a number is odd
     * @function isOdd
     * @memberof TBHelpers
     * @param {integer} num reddit API comment object.
     * @returns {boolean} true if number is odd false if even.
     */

    TBHelpers.isOdd = function (num) {
        return num % 2;
    };

    /**
     * Because there are a ton of ways how subreddits are written down and sometimes we just want the name.
     * @function cleanSubredditName
     * @memberof TBHelpers
     * @param {string} dirtySub dirty dirty sub.
     * @returns {string} shiny sub!
     */
    TBHelpers.cleanSubredditName = function (dirtySub) {
        dirtySub = dirtySub.replace('/r/', '').replace('r/', '').replace('/', '').replace('−', '').replace('+', '').trim();
        return dirtySub;
    };

    TBHelpers.getHashParameter = function (ParameterKey) {
        const hash = window.location.hash.substring(1);
        const params = hash.split('&');
        for (let i = 0; i < params.length; i++) {
            const keyval = params[i].split('='),
                  key = keyval[0].replace('?', '');
            if (key === ParameterKey) {
                return keyval[1];
            }
        }
    };

    /**
     * Replaces {tokes} for the respective value in given content
     * @function replaceTokens
     * @memberof TBHelpers
     * @param {object} info object with token name keys and token content values.
     * @param {string} content dirty dirty sub.
     * @returns {string} token replaced text!
     */
    TBHelpers.replaceTokens = function (info, content) {
        logger.log(info);
        for (const i of Object.keys(info)) {
            const pattern = new RegExp(`{${i}}`, 'mig');
            content = content.replace(pattern, info[i]);
        }

        return content;
    };

    /**
     * reddit HTML encodes all of their JSON responses, we need to HTMLdecode them before parsing.
     * @function unescapeJSON
     * @memberof TBHelpers
     * @param {object} info object with token name keys and token content values.
     * @param {string} content dirty dirty sub.
     * @returns {string} token replaced text!
     */
    TBHelpers.unescapeJSON = function (val) {
        if (typeof val === 'string') {
            val = val.replace(/&quot;/g, '"')
                .replace(/&gt;/g, '>').replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&');
        }
        return val;
    };

    // Utility methods
    TBHelpers.removeQuotes = function (string) {
        return string.replace(/['"]/g, '');
    };

    TBHelpers.stringToColor = function stringToColor (str) {
        // str to hash
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        // int/hash to hex
        let color = '#';
        for (let index = 0; index < 3; index++) {
            color += `00${(hash >> index * 8 & 0xFF).toString(16)}`.slice(-2);
        }

        return color;
    };

    // Added back for MMP's live mod mail.
    TBHelpers.compressHTML = function (src) {
        return src.replace(/(\n+|\s+)?&lt;/g, '<').replace(/&gt;(\n+|\s+)?/g, '>').replace(/&amp;/g, '&').replace(/\n/g, '').replace(/child" > {2}False/, 'child">');
    };

    // easy way to simulate the php html encode and decode functions
    TBHelpers.htmlEncode = function (value) {
    // create a in-memory div, set it's inner text(which jQuery automatically encodes)
    // then grab the encoded contents back out.  The div never exists on the page.
        return $('<div/>').text(value).html();
    };

    TBHelpers.htmlDecode = function (value) {
        return $('<div/>').html(value).text();
    };

    TBHelpers.zlibInflate = function (stringThing) {
    // Expand base64
        stringThing = atob(stringThing);
        // zlib time!
        const inflate = new pako.Inflate({to: 'string'});
        inflate.push(stringThing);
        return inflate.result;
    };

    TBHelpers.zlibDeflate = function (objThing) {
    // zlib time!
        const deflate = new pako.Deflate({to: 'string'});
        deflate.push(objThing, true);
        objThing = deflate.result;
        // Collapse to base64
        return btoa(objThing);
    };
})(window.TBHelpers = window.TBHelpers || {});
