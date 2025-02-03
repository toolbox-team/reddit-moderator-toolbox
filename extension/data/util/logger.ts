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

/** A valid log message type. */
type LogType = keyof typeof logTypes;

/**
 * Executes a log of a given type.
 * @private
 * @param caller The caller, if any
 * @param type The name of the log type to use
 * @param args Arbitrary content passed through to the console
 */
function log (caller: string | undefined, type: LogType, ...args: any[]) {
    // Get the appropriate styles for this log type, and send the message
    const config = logTypes[type];
    const {color, background, func} = config;
    const text = ('text' in config) ? config.text : type;
    func(
        // First part of the message line
        `tb: %c[${caller || 'unknown'}] %c${text}`,
        // Caller style
        'font-weight: bold',
        // Styles for the type name
        `color: ${color}; background: ${background}; padding: 0 3px; border-radius: 3px`,
        // The rest of the arguments are passed through unmodified
        ...args,
    );
}

/** A logger associated with an aribitrary caller. */
type Logger = {
    [type in LogType]: (...args: any[]) => void;
};

/**
 * Creates a logger object with a given caller.
 * @param caller A string representing the module or other section of code
 * that's calling the logger, to be displayed in the console alongside all
 * messages emitted by the logger
 */
export default function createLogger (caller?: string) {
    // Create a new object
    const obj: Partial<Logger> = {};
    // The object gets a function for every log type
    for (const type of Object.keys(logTypes) as LogType[]) {
        // `this` arg is not provided
        obj[type] = log.bind(undefined, caller, type);
    }
    return obj as Logger;
}
