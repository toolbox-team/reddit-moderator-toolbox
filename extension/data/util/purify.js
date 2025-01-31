import DOMPurify from 'dompurify';

/**
 * Uses DOMPurify to sanitize untrusted HTML strings.
 * @param {string} input
 * @returns {string}
 */
export function purify (input) {
    return DOMPurify.sanitize(input, {SAFE_FOR_JQUERY: true});
}

/**
 * Recursively sanitize an object's string values as untrusted HTML. String
 * values that can be interpreted as JSON objects are parsed, sanitized, and
 * re-stringified.
 * @param {any} input
 */
export function purifyObject (input) {
    for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            const itemType = typeof input[key];
            switch (itemType) {
                case 'object':
                    purifyObject(input[key]);
                    break;
                case 'string':
                    // If the string we're handling is a JSON string, purifying it before it's parsed will mangle
                    // the JSON and make it unusable. We try to parse every value, and if parsing returns an object
                    // or an array, we run purifyObject on the result and re-stringify the value, rather than
                    // trying to purify the string itself. This ensures that when the string is parsed somewhere
                    // else, it's already purified.
                    // TODO: Identify if this behavior is actually used anywhere
                    try {
                        const jsonObject = JSON.parse(input[key]);
                        // We only want to purify the parsed value if it's an object or array, otherwise we throw
                        // back and purify the raw string instead (see #461)
                        if (typeof jsonObject !== 'object' || jsonObject == null) {
                            throw new Error('not using the parsed result of this string');
                        }
                        purifyObject(jsonObject);
                        input[key] = JSON.stringify(jsonObject);
                    } catch (e) {
                        // Not json, simply purify
                        input[key] = purify(input[key]);
                    }
                    break;
                case 'function':
                    // If we are dealing with an actual function something is really wrong and we'll overwrite it.
                    input[key] = 'function';
                    break;
                case 'number':
                case 'boolean':
                case 'undefined':
                    // Do nothing with these as they are supposed to be safe.
                    break;
                default:
                    // If we end here we are dealing with a type we don't expect to begin with. Begone!
                    input[key] = `unknown item type ${itemType}`;
            }
        }
    }
}

// TODO: this is another purify function used exclusively for settings, I'm not
//       sure how it works either.
export function purifyThing (input) {
    let output;
    const itemType = typeof input;
    switch (itemType) {
        case 'object':
            purifyObject(input);
            output = input;
            break;
        case 'string':
            // Let's see if we are dealing with json.
            // We want to handle json properly otherwise the purify process will mess up things.
            try {
                const jsonObject = JSON.parse(input);
                purifyObject(jsonObject);
                output = JSON.stringify(jsonObject);
            } catch (e) {
                // Not json, simply purify
                output = purify(input);
            }
            break;
        case 'function':
            // If we are dealing with an actual function something is really wrong and we'll overwrite it.
            output = 'function';
            break;
        case 'number':
        case 'boolean':
        case 'undefined':
            // Do nothing with these as they are supposed to be safe.
            output = input;
            break;
        default:
            // If we end here we are dealing with a type we don't expect to begin with. Begone!
            output = `unknown item type ${itemType}`;
    }

    return output;
}
