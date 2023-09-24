import $ from 'jquery';
import pako from 'pako';
import SnuOwnd from 'snuownd';

// use browser types for timeouts/intervals instead of NodeJS.Timer
const {setTimeout, clearTimeout} = window;

/**
 * Returns a promise that resolves after the given time.
 * @param ms Number of milliseconds to delay
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Debounces a given function based on a given timeout.
 * @param func input function
 * @param debounceTime the amount of time used to wait in ms.
 * @returns the debounced function
 */
export function debounce<Args extends any[], ThisArg = never> (
    func: (this: ThisArg, ...args: Args) => void,
    debounceTime = 100,
): (this: ThisArg, ...args: Args) => void {
    let timeout: number;

    return function (...args) {
        const functionCall = () => func.apply(this, args);
        clearTimeout(timeout);
        timeout = setTimeout(functionCall, debounceTime);
    };
}

/**
 * Creates a processing queue that allows items to be added one at a time, and
 * defers processing of those items until a specified delay between item
 * additions happens, or a maximum queue length is reached. Returns an insert
 * function to add items to the queue. Each invocation of the insert function
 * returns a promise that can be awaited on to receive the processed result of
 * the specific item added.
 *
 * Creating the queue requires giving it a processing function, which must take
 * an input array of items, and return a promise that resolves to an array of
 * corresponding results.
 *
 * @param bulkProcess Receives an array of items from the queue and returns an
 * array of results, where each result corresponds to the input item of the same
 * index
 * @param delayTime=100 This many milliseconds must pass without an item being
 * queued before the queue is flushed
 * @param queueLimit When the queue reaches this size, it is flushed immediately
 * without waiting for the `delayTime` to elapse
 * @returns A new function which queues an item and returns a promise. After the
 * queue is flushed and the bulk process runs, the promise will resolve to the
 * corresponding result for the passed item.
 */
export function createDeferredProcessQueue<Item, Result> (
    bulkProcess: (items: Item[]) => Promise<Result[]>,
    delayTime = 100,
    maxQueueLength = Infinity,
) {
    let timeout: number;
    let queue: Array<{
        item: Item;
        resolve: (value: Result) => void;
        reject: (error: any) => void;
    }> = [];

    const flushQueue = async () => {
        // Grab the current queue and replace it with an empty array to collect
        // further calls
        const queueSnapshot = queue;
        queue = [];

        let results;
        try {
            // Call the callback with an array of accumulated items
            results = await bulkProcess(queueSnapshot.map(call => call.item));
        } catch (error) {
            // If the call failed, return the same error to all callers
            queueSnapshot.forEach(call => call.reject(error));
            return;
        }

        // Return each result to the corresponding caller
        results.forEach((result, i) => queueSnapshot[i].resolve(result));
    };

    return (item: Item) =>
        new Promise((resolve, reject) => {
            // Add this call to the queue
            queue.push({item, resolve, reject});

            // Clear any existing timeout
            clearTimeout(timeout);

            // If we've hit the maximum queue length, flush the queue immediately
            if (queue.length >= maxQueueLength) {
                flushQueue();
                return;
            }

            // Otherwise, flush the queue after the debounce delay
            timeout = setTimeout(flushQueue, delayTime);
        });
}

/**
 * Moves an item in an array from one index to another. The array is modified in place.
 * https://github.com/brownieboy/array.prototype.move/blob/master/src/array-prototype-move.js
 */
export function moveArrayItem<T> (array: T[], old_index: number, new_index: number): T[] {
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
            // This should basically never happen because we're not moving items beyond the current end of the array
            // TODO: Rather than asserting and inserting `undefined`s into an array where they might not be expected,
            //       just throw in this case and fix whatever's broken by that
            array.push(undefined as T);
        }
    }
    array.splice(new_index, 0, array.splice(old_index, 1)[0]);
    return array;
}

/** Escapes special characters in a string for insertion into HTML. */
export function escapeHTML (html: string) {
    const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;',
        '/': '&#x2F;',
    };

    return String(html).replace(/[&<>"'/]/g, s => s in entityMap ? entityMap[s as keyof typeof entityMap] : s);
}

/**
 * Unescape html entities
 * @function
 * @param {string} html input html
 * @returns {string} HTML string with unescaped entities
 */
// FIXME: this function is not only broken but also completely unused
export function unescapeHTML (html: any) {
    const entityMap = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': '\'',
        '&#x2F;': '/',
    };

    return String(html).replace(/[&<>"'/]/g, s => entityMap[s as keyof typeof entityMap]);
}

/** Give the nummeric value in milliseconds of the current date and time. */
export function getTime () {
    return new Date().getTime();
}

/** Gives a random integer from 1 to `maxInt`, inclusive. */
export function getRandomNumber (maxInt: number) {
    return Math.floor(Math.random() * maxInt + 1);
}

/** Convert minutes to milliseconds. */
export function minutesToMilliseconds (mins: number) {
    const oneMin = 60000;
    let milliseconds = mins * 60 * 1000;

    // Never return less than one min.
    if (milliseconds < oneMin) {
        milliseconds = oneMin;
    }

    return milliseconds;
}

/** Converts days to milliseconds. */
// FIXME: unused
export function daysToMilliseconds (days: number) {
    return days * 86400000;
}

/** Converts milliseconds to days. */
export function millisecondsToDays (milliseconds: number) {
    return milliseconds / 86400000;
}

/** Returns the difference between days in nice format like "1 year". */
export function niceDateDiff (origdate: Date, newdate: Date) {
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
}

/** Converts unix epoch timestamps to readable format dd-mm-yyyy hh:mm:ss UTC. */
export function timeConverterRead (UNIX_timestamp: number) {
    const a = new Date(UNIX_timestamp * 1000);
    const year = a.getUTCFullYear();
    const month = `0${a.getUTCMonth() + 1}`.slice(-2);
    const date = `0${a.getUTCDate()}`.slice(-2);
    const hour = `0${a.getUTCHours()}`.slice(-2);
    const min = `0${a.getUTCMinutes()}`.slice(-2);
    const sec = `0${a.getUTCSeconds()}`.slice(-2);
    return `${date}-${month}-${year} ${hour}:${min}:${sec} UTC`;
}

/**
 * Convert titles to a format usable in urls. Based on Reddit's implementation:
 * {@linkcode https://github.com/reddit-archive/reddit/blob/753b17407e9a9dca09558526805922de24133d53/r2/r2/lib/utils/utils.py#L1243-L1258 r2.lib.utils.title_to_url}
 */
export function title_to_url (title: string) {
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
}

// Easy way to use templates. Usage example:
//    TBHelpers.template('/r/{{subreddit}}/comments/{{link_id}}/{{title}}/', {
//         'subreddit': 'toolbox',
//         'title':  title_to_url('this is a title we pulled from a post),
//         'link_id': '2kwx2o'
//     });
export function template (tpl: string, variables: Record<string, string>) {
    return tpl.replace(/{{([^}]+)}}/g, (match, variable) => variables[variable]);
}

/** Converts a given amount of days in a "humanized version" of weeks, months and years. */
export function humaniseDays (days: number) {
    let str = '';
    const values = {
        ' year': 365,
        ' month': 30,
        ' week': 7,
        ' day': 1,
    };

    for (const x of Object.keys(values) as (keyof typeof values)[]) {
        const amount = Math.floor(days / values[x]);

        if (amount >= 1) {
            str += `${amount + x + (amount > 1 ? 's' : '')} `;
            days -= amount * values[x];
        }
    }
    return str.slice(0, -1);
}

/**
 * Sorts an array of objects by property value of specific properties.
 * @param arr input array
 * @param prop property name
 */
export function sortBy<T extends object, Prop extends keyof T> (arr: T[], prop: Prop) {
    return arr.sort((a, b) => {
        if (a[prop] < b[prop]) {
            return 1;
        }
        if (a[prop] > b[prop]) {
            return -1;
        }
        return 0;
    });
}

/** Sort strings by their `.toLowerCase()` form. */
export function saneSort (arr: string[]) {
    return arr.sort((a, b) => {
        if (a.toLowerCase() < b.toLowerCase()) {
            return -1;
        }
        if (a.toLowerCase() > b.toLowerCase()) {
            return 1;
        }
        return 0;
    });
}

/** Sort strings by their `.toLowerCase()` form in reverse order. */
export function saneSortAs (arr: string[]) {
    return arr.sort((a, b) => {
        if (a.toLowerCase() > b.toLowerCase()) {
            return -1;
        }
        if (a.toLowerCase() < b.toLowerCase()) {
            return 1;
        }
        return 0;
    });
}

/**
 * Generates a regular expression that will match only a given string.
 * @param text The text to match
 * @param flags The flags passed to the RegExp constructor
 */
export const literalRegExp = (text: string, flags: string) =>
    new RegExp(text.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1'), flags);

/**
 * Replace all instances of a certaing thing for another thing.
 * @function
 * @param find what to find
 * @param replace what to replace
 * @param str where to do it all with
 * @returns shiny new string with replaced stuff
 */
// TODO: `string.replaceAll` exists since ES2021; yeet this
export const replaceAll = (find: string, replace: string, str: string) =>
    str.replace(literalRegExp(find, 'g'), replace);

/**
 * Will compare the input color to a list of known color names and return the HEX value
 * @param color input color
 * @returns if a match is found the HEX color, otherwise the input string.
 */
export function colorNameToHex (color: string) {
    const colorUPPERCASE = color.toUpperCase();
    let returnValue;

    const htmlColors = {
        ALICEBLUE: '#F0F8FF',
        ANTIQUEWHITE: '#FAEBD7',
        AQUA: '#00FFFF',
        AQUAMARINE: '#7FFFD4',
        AZURE: '#F0FFFF',
        BEIGE: '#F5F5DC',
        BISQUE: '#FFE4C4',
        BLACK: '#000000',
        BLANCHEDALMOND: '#FFEBCD',
        BLUE: '#0000FF',
        BLUEVIOLET: '#8A2BE2',
        BROWN: '#A52A2A',
        BURLYWOOD: '#DEB887',
        CADETBLUE: '#5F9EA0',
        CHARTREUSE: '#7FFF00',
        CHOCOLATE: '#D2691E',
        CORAL: '#FF7F50',
        CORNFLOWERBLUE: '#6495ED',
        CORNSILK: '#FFF8DC',
        CRIMSON: '#DC143C',
        CYAN: '#00FFFF',
        DARKBLUE: '#00008B',
        DARKCYAN: '#008B8B',
        DARKGOLDENROD: '#B8860B',
        DARKGRAY: '#A9A9A9',
        DARKGREY: '#A9A9A9',
        DARKGREEN: '#006400',
        DARKKHAKI: '#BDB76B',
        DARKMAGENTA: '#8B008B',
        DARKOLIVEGREEN: '#556B2F',
        DARKORANGE: '#FF8C00',
        DARKORCHID: '#9932CC',
        DARKRED: '#8B0000',
        DARKSALMON: '#E9967A',
        DARKSEAGREEN: '#8FBC8F',
        DARKSLATEBLUE: '#483D8B',
        DARKSLATEGRAY: '#2F4F4F',
        DARKSLATEGREY: '#2F4F4F',
        DARKTURQUOISE: '#00CED1',
        DARKVIOLET: '#9400D3',
        DEEPPINK: '#FF1493',
        DEEPSKYBLUE: '#00BFFF',
        DIMGRAY: '#696969',
        DIMGREY: '#696969',
        DODGERBLUE: '#1E90FF',
        FIREBRICK: '#B22222',
        FLORALWHITE: '#FFFAF0',
        FORESTGREEN: '#228B22',
        FUCHSIA: '#FF00FF',
        GAINSBORO: '#DCDCDC',
        GHOSTWHITE: '#F8F8FF',
        GOLD: '#FFD700',
        GOLDENROD: '#DAA520',
        GRAY: '#808080',
        GREY: '#808080',
        GREEN: '#008000',
        GREENYELLOW: '#ADFF2F',
        HONEYDEW: '#F0FFF0',
        HOTPINK: '#FF69B4',
        INDIANRED: '#CD5C5C',
        INDIGO: '#4B0082',
        IVORY: '#FFFFF0',
        KHAKI: '#F0E68C',
        LAVENDER: '#E6E6FA',
        LAVENDERBLUSH: '#FFF0F5',
        LAWNGREEN: '#7CFC00',
        LEMONCHIFFON: '#FFFACD',
        LIGHTBLUE: '#ADD8E6',
        LIGHTCORAL: '#F08080',
        LIGHTCYAN: '#E0FFFF',
        LIGHTGOLDENRODYELLOW: '#FAFAD2',
        LIGHTGRAY: '#D3D3D3',
        LIGHTGREY: '#D3D3D3',
        LIGHTGREEN: '#90EE90',
        LIGHTPINK: '#FFB6C1',
        LIGHTSALMON: '#FFA07A',
        LIGHTSEAGREEN: '#20B2AA',
        LIGHTSKYBLUE: '#87CEFA',
        LIGHTSLATEGRAY: '#778899',
        LIGHTSLATEGREY: '#778899',
        LIGHTSTEELBLUE: '#B0C4DE',
        LIGHTYELLOW: '#FFFFE0',
        LIME: '#00FF00',
        LIMEGREEN: '#32CD32',
        LINEN: '#FAF0E6',
        MAGENTA: '#FF00FF',
        MAROON: '#800000',
        MEDIUMAQUAMARINE: '#66CDAA',
        MEDIUMBLUE: '#0000CD',
        MEDIUMORCHID: '#BA55D3',
        MEDIUMPURPLE: '#9370DB',
        MEDIUMSEAGREEN: '#3CB371',
        MEDIUMSLATEBLUE: '#7B68EE',
        MEDIUMSPRINGGREEN: '#00FA9A',
        MEDIUMTURQUOISE: '#48D1CC',
        MEDIUMVIOLETRED: '#C71585',
        MIDNIGHTBLUE: '#191970',
        MINTCREAM: '#F5FFFA',
        MISTYROSE: '#FFE4E1',
        MOCCASIN: '#FFE4B5',
        NAVAJOWHITE: '#FFDEAD',
        NAVY: '#000080',
        OLDLACE: '#FDF5E6',
        OLIVE: '#808000',
        OLIVEDRAB: '#6B8E23',
        ORANGE: '#FFA500',
        ORANGERED: '#FF4500',
        ORCHID: '#DA70D6',
        PALEGOLDENROD: '#EEE8AA',
        PALEGREEN: '#98FB98',
        PALETURQUOISE: '#AFEEEE',
        PALEVIOLETRED: '#DB7093',
        PAPAYAWHIP: '#FFEFD5',
        PEACHPUFF: '#FFDAB9',
        PERU: '#CD853F',
        PINK: '#FFC0CB',
        PLUM: '#DDA0DD',
        POWDERBLUE: '#B0E0E6',
        PURPLE: '#800080',
        REBECCAPURPLE: '#663399',
        RED: '#FF0000',
        ROSYBROWN: '#BC8F8F',
        ROYALBLUE: '#4169E1',
        SADDLEBROWN: '#8B4513',
        SALMON: '#FA8072',
        SANDYBROWN: '#F4A460',
        SEAGREEN: '#2E8B57',
        SEASHELL: '#FFF5EE',
        SIENNA: '#A0522D',
        SILVER: '#C0C0C0',
        SKYBLUE: '#87CEEB',
        SLATEBLUE: '#6A5ACD',
        SLATEGRAY: '#708090',
        SLATEGREY: '#708090',
        SNOW: '#FFFAFA',
        SPRINGGREEN: '#00FF7F',
        STEELBLUE: '#4682B4',
        TAN: '#D2B48C',
        TEAL: '#008080',
        THISTLE: '#D8BFD8',
        TOMATO: '#FF6347',
        TURQUOISE: '#40E0D0',
        VIOLET: '#EE82EE',
        WHEAT: '#F5DEB3',
        WHITE: '#FFFFFF',
        WHITESMOKE: '#F5F5F5',
        YELLOW: '#FFFF00',
        YELLOWGREEN: '#9ACD32',
    };

    if (Object.prototype.hasOwnProperty.call(htmlColors, colorUPPERCASE)) {
        returnValue = htmlColors[colorUPPERCASE as keyof typeof htmlColors];
    } else {
        returnValue = color;
    }
    return returnValue;
}

/**
 * Strips the last directory part of an url. Example:  /this/is/url/with/part/ becomes /this/is/url/with/
 * @param url reddit API comment object.
 * @returns url without the last directory part
 */
export function removeLastDirectoryPartOf (url: string) {
    const urlNoSlash = url.replace(/\/$/, '');
    const array = urlNoSlash.split('/');
    array.pop();
    const returnValue = `${array.join('/')}/`;
    return returnValue;
}

/** Removes any leading junk from a subreddit name (/r/, multireddit indicators, etc) and just returns the name. */
export function cleanSubredditName (dirtySub: string) {
    return dirtySub.replace('/r/', '').replace('r/', '').replace('/', '').replace('−', '').replace('+', '').trim();
}

/**
 * Replaces {tokens} for the respective value in given content.
 * @param info Object with token name keys and token content values
 * @param content String with tokens to be replaced
 * @returns token replaced text!
 */
export function replaceTokens (info: Record<string, string>, content: string) {
    for (const i of Object.keys(info)) {
        const pattern = new RegExp(`{${i}}`, 'mig');
        content = content.replace(pattern, info[i]);
    }

    return content;
}

/** reddit HTML encodes all of their JSON responses, we need to HTMLdecode them before parsing. */
export function unescapeJSON (val: string): string {
    if (typeof val === 'string') {
        return val.replace(/&quot;/g, '"')
            .replace(/&gt;/g, '>').replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&');
    }
    return val;
}

// Utility methods

/** Removes ASCII single and double quotes from a string. */
export const removeQuotes = (string: string) => string.replace(/['"]/g, '');

/**
 * Generates a color corresponding to a given string (used to assign colors to
 * subreddits for post borders in shared queues)
 */
// TODO: cache results?
export function stringToColor (str: string) {
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
}

/** Escapes text for HTML. */
// TODO: How is this different than escapeHTML() above?
export function htmlEncode (value: string) {
    // create a in-memory div, set it's inner text(which jQuery automatically encodes)
    // then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

/** Gets the text content of an HTML string. */
export function htmlDecode (value: string) {
    return $('<div/>').html(value).text();
}

/** Inflates a base64-encoded zlib-compressed data string into data. */
export function zlibInflate (stringThing: string) {
    // Expand base64
    stringThing = atob(stringThing);
    // zlib time!
    const inflate = new pako.Inflate({to: 'string'});
    inflate.push(stringThing);
    return inflate.result;
}

/**
 * Deflates some data into a base64-encoded zlib-compressed data string.
 * @param objThing The data to compress
 */
export function zlibDeflate (objThing: string) {
    // zlib time!
    const deflate = new pako.Deflate({to: 'string'});
    deflate.push(objThing, true);
    // @ts-expect-error // TODO
    objThing = deflate.result;
    console.log(objThing);
    // Collapse to base64
    return btoa(objThing);
}

/** Provides an initialized SnuOwnd parser. */
export const parser = SnuOwnd.getParser(SnuOwnd.getRedditRenderer());

/** An iterable which may or may not be asynchronous. */
export type MaybeAsyncIterable<T> = AsyncIterable<T> | Iterable<T>;

/**
 * Wraps each of an iterable's values with an object that indicates which item
 * is the last one in the sequence by always reading one item ahead in the
 * iterator to check for `{done: true}` before yielding the current item.
 */
export async function* wrapWithLastValue<T> (iterable: MaybeAsyncIterable<T>) {
    // get the underlying iterator
    const iterator = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
    if (!iterator) {
        throw new TypeError('argument is not an iterable');
    }

    // fetch the first item
    let current = await iterator.next();

    // yield nothing for empty sequences
    if (current.done) {
        return;
    }

    while (true) {
        // fetch the next item and see if it yields anything
        const next = await iterator.next();
        if (next.done) {
            // the iterator has returned; the previous result is the last, and
            // this result is the return value
            yield {item: current.value, last: true};
            return next.value;
        }
        // the iterator isn't done yet; yield previous item and keep going
        yield {item: current.value, last: false};
        current = next;
    }
}
