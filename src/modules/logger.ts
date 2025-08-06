namespace AppLogger {
  export enum LogLevel {
    DEBUG = Constants.LOG.LEVEL_DEBUG,
    INFO = Constants.LOG.LEVEL_INFO,
    WARN = Constants.LOG.LEVEL_WARN,
    ERROR = Constants.LOG.LEVEL_ERROR
  }
  
  let currentLogLevel = LogLevel.INFO;
  
  /**
   * Set the logging level
   */
  export function setLogLevel(level: LogLevel): void {
    currentLogLevel = level;
  }
  
  /**
   * Log debug message
   */
  export function debug(message: string, data?: any): void {
    if (currentLogLevel <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(`${Constants.LOG.PREFIX_DEBUG} ${message}`, data || '');
    }
  }
  
  /**
   * Log info message
   */
  export function info(message: string, data?: any): void {
    if (currentLogLevel <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.info(`${Constants.LOG.PREFIX_INFO} ${message}`, data || '');
    }
  }
  
  /**
   * Log warning message
   */
  export function warn(message: string, data?: any): void {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(`${Constants.LOG.PREFIX_WARN} ${message}`, data || '');
    }
  }
  
  /**
   * Log error message
   */
  export function error(message: string, error?: any): void {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(`${Constants.LOG.PREFIX_ERROR} ${message}`, error || '');
      
      // Also log to Stackdriver for production errors
      if (error instanceof Error) {
        console.error(`Stack trace: ${error.stack}`);
      }
    }
  }
  
  /**
   * Redact sensitive information from logs
   */
  export function redact(text: string): string {
    // Redact email addresses
    text = text.replace(Constants.PATTERNS.EMAIL_ADDRESS, Constants.LOG.REDACTED_EMAIL);
    
    // Redact API keys (looking for long alphanumeric strings)
    text = text.replace(Constants.PATTERNS.API_KEY, Constants.LOG.REDACTED_API_KEY);
    
    // Redact potential names (simple heuristic)
    text = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, Constants.LOG.REDACTED_NAME);
    
    return text;
  }
  
  /**
   * Log with automatic redaction
   */
  export function logSafe(level: LogLevel, message: string, data?: any): void {
    const safeMessage = redact(message);
    const safeData = data ? redact(JSON.stringify(data)) : undefined;
    
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
}