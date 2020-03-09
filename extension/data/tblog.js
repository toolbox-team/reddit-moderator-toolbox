'use strict';

(function () {
    /** @module TBLog */

    // The various log types by name, and their colors applied via CSS
    const logTypes = {
        debug: {
            color: '#fff',
            background: '#387fa780',
        },
        info: {
            color: '#fff',
            background: '#38a76280',
        },
        warn: {
            color: '#fff',
            background: '#ce821a80',
            text: 'warning',
        },
        error: {
            color: '#fff',
            background: '#eb394180',
        },
    };

    // Objects recording which callers and log types are being filtered
    const filteredTypes = {};
    const filteredCallers = {};

    /**
     * Generates a short timestamp for the current time. Strips unneeded info
     * from the ISO format.
     * @private
     */
    function timestamp () {
        return new Date().toISOString().replace('T', ' ').replace(/Z|\..*/, '');
    }

    /**
     * Executes a log of a given type.
     * @private
     * @function
     * @this {object|string} The caller, if any, a TB module or a string
     * @param {string} type The name of the log type to use
     * @param {...any} args Arbitrary content passed through to the console
     */
    function log (type, ...args) {
        // Caller is bound to `this` if there is one, let's get its name
        let callerName;
        if (!this) {
            callerName = 'unknown';
        } else if (typeof this === 'object') {
            // If it's an object, we assume it's a module
            callerName = this.shortname;
        } else {
            // Should be a string
            callerName = this;
        }
        // If the caller or log type is filtered, do nothing
        if (filteredTypes[type] || filteredCallers[callerName]) {
            return;
        }
        // Get the appropriate styles for this log type, and send the message
        const {color, background, text} = logTypes[type];
        console.groupCollapsed(
            // First part of the message line
            `%c${timestamp()} %c[${callerName}] %c${text || type}`,
            // Timestamp style
            'font-weight: normal',
            // Caller style
            'font-weight: bold',
            // Dtyles for the type name
            `color: ${color}; background: ${background}; padding: 0 3px; border-radius: 3px`,
            // The rest of the arguments are passed through unmodified
            ...args
        );
        console.trace();
        console.groupEnd();
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
            obj[type] = log.bind(caller, type);
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

    // Properties to allow for manipulation of filtered callers/types
    TBLog.filteredCallers = filteredCallers;
    TBLog.filteredTypes = filteredTypes;

    // Methods to make filtering and unfiltering easier
    TBLog.filterType = type => filteredTypes[type] = true;
    TBLog.unfilterType = type => delete filteredTypes[type];
    TBLog.filterCaller = caller => filteredCallers[caller] = true;
    TBLog.unfilterCaller = caller => delete filteredCallers[caller];

    // Huzzah!
    window.TBLog = TBLog;
})();
