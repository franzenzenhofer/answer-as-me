"use strict";
var AppLogger;
(function (AppLogger) {
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["DEBUG"] = Constants.LOG.LEVEL_DEBUG] = "DEBUG";
        LogLevel[LogLevel["INFO"] = Constants.LOG.LEVEL_INFO] = "INFO";
        LogLevel[LogLevel["WARN"] = Constants.LOG.LEVEL_WARN] = "WARN";
        LogLevel[LogLevel["ERROR"] = Constants.LOG.LEVEL_ERROR] = "ERROR";
    })(LogLevel = AppLogger.LogLevel || (AppLogger.LogLevel = {}));
    var currentLogLevel = LogLevel.INFO;
    /**
     * Set the logging level
     */
    function setLogLevel(level) {
        currentLogLevel = level;
    }
    AppLogger.setLogLevel = setLogLevel;
    /**
     * Log debug message
     */
    function debug(message, data) {
        if (currentLogLevel <= LogLevel.DEBUG) {
            // eslint-disable-next-line no-console
            console.log("".concat(Constants.LOG.PREFIX_DEBUG, " ").concat(message), data || '');
        }
    }
    AppLogger.debug = debug;
    /**
     * Log info message
     */
    function info(message, data) {
        if (currentLogLevel <= LogLevel.INFO) {
            // eslint-disable-next-line no-console
            console.info("".concat(Constants.LOG.PREFIX_INFO, " ").concat(message), data || '');
        }
    }
    AppLogger.info = info;
    /**
     * Log warning message
     */
    function warn(message, data) {
        if (currentLogLevel <= LogLevel.WARN) {
            console.warn("".concat(Constants.LOG.PREFIX_WARN, " ").concat(message), data || '');
        }
    }
    AppLogger.warn = warn;
    /**
     * Log error message
     */
    function error(message, error) {
        if (currentLogLevel <= LogLevel.ERROR) {
            console.error("".concat(Constants.LOG.PREFIX_ERROR, " ").concat(message), error || '');
            // Also log to Stackdriver for production errors
            if (error instanceof Error) {
                console.error("Stack trace: ".concat(error.stack));
            }
        }
    }
    AppLogger.error = error;
    /**
     * Redact sensitive information from logs
     */
    function redact(text) {
        // Redact email addresses
        text = text.replace(Constants.PATTERNS.EMAIL_ADDRESS, Constants.LOG.REDACTED_EMAIL);
        // Redact API keys (looking for long alphanumeric strings)
        text = text.replace(Constants.PATTERNS.API_KEY, Constants.LOG.REDACTED_API_KEY);
        // Redact potential names (simple heuristic)
        text = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, Constants.LOG.REDACTED_NAME);
        return text;
    }
    AppLogger.redact = redact;
    /**
     * Log with automatic redaction
     */
    function logSafe(level, message, data) {
        var safeMessage = redact(message);
        var safeData = data ? redact(JSON.stringify(data)) : undefined;
        switch (level) {
            case LogLevel.DEBUG:
                debug(safeMessage, safeData);
                break;
            case LogLevel.INFO:
                info(safeMessage, safeData);
                break;
            case LogLevel.WARN:
                warn(safeMessage, safeData);
                break;
            case LogLevel.ERROR:
                error(safeMessage, safeData);
                break;
        }
    }
    AppLogger.logSafe = logSafe;
})(AppLogger || (AppLogger = {}));
//# sourceMappingURL=logger.js.map