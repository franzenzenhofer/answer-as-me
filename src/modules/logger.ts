namespace AppLogger {
  export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
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
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }
  
  /**
   * Log info message
   */
  export function info(message: string, data?: any): void {
    if (currentLogLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }
  
  /**
   * Log warning message
   */
  export function warn(message: string, data?: any): void {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }
  
  /**
   * Log error message
   */
  export function error(message: string, error?: any): void {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error || '');
      
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
    text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    
    // Redact API keys (looking for long alphanumeric strings)
    text = text.replace(/\b[A-Za-z0-9]{32,}\b/g, '[REDACTED]');
    
    // Redact potential names (simple heuristic)
    text = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
    
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