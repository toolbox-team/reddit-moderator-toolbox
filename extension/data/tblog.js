// Settings for each log type, by name
const logTypes = {
    debug: {
        color: '#fff',
        background: '#387fa780',
        func: console.debug,
    },
    info: {
        color: '#fff',
        background: '#38a76280',
        func: console.info,
    },
    warn: {
        color: '#fff',
        background: '#ce821a80',
        text: 'warning',
        func: console.warn,
    },
    error: {
        color: '#fff',
        background: '#eb394180',
        func: console.error,
    },
};

/**
 * Executes a log of a given type.
 * @private
 * @function
 * @param {object|string} caller The caller, if any, a TB module or a string
 * @param {string} type The name of the log type to use
 * @param {...any} args Arbitrary content passed through to the console
 */
function log (caller, type, ...args) {
    let callerName;
    if (!caller) {
        callerName = 'unknown';
    } else if (typeof caller === 'object') {
        // If it's an object, we assume it's a module
        // TODO: stop using this
        callerName = caller.shortname;
    } else {
        // Should be a string
        callerName = caller;
    }
    // Get the appropriate styles for this log type, and send the message
    const {color, background, text, func} = logTypes[type];
    func(
        // First part of the message line
        `tb: %c[${callerName}] %c${text || type}`,
        // Caller style
        'font-weight: bold',
        // Styles for the type name
        `color: ${color}; background: ${background}; padding: 0 3px; border-radius: 3px`,
        // The rest of the arguments are passed through unmodified
        ...args,
    );
}

/**
 * Creates a logger object with a given caller.
 * @function
 * @param {string|object} caller A module serving as the caller, or a string
 * representing the name of non-module callers
 */
function TBLog (caller) {
    // Create a new object
    const obj = {};
    // The object gets a function for every log type
    for (const type of Object.keys(logTypes)) {
        // `this` arg is the caller, first arg is the log type
        obj[type] = log.bind(undefined, caller, type);
    }
    // This isn't a type, but we map it to debug for backwards compatibility
    // Eventually we should remove this
    obj.log = obj.debug;
    return obj;
}

// This is a bit of cleverness - we make a logger with no caller, and then
// assign that logger's properties to the function, so it can be used as a
// default logger instance
Object.assign(TBLog, TBLog());

// Huzzah!
export default TBLog;
