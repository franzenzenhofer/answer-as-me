namespace Utils {
  /**
   * Validate email address format
   */
  export function isValidEmail(email: string): boolean {
    return Constants.PATTERNS.EMAIL_ADDRESS.test(email);
  }
  
  /**
   * Truncate text to specified length
   */
  export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength - Constants.STYLE.MIN_SENTENCE_LENGTH)  }...`;
  }
  
  /**
   * Extract email domain
   */
  export function getEmailDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1]! : '';
  }
  
  /**
   * Format date for display
   */
  export function formatDate(date: Date | GoogleAppsScript.Base.Date): string {
    return Utilities.formatDate(date as any, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm');
  }
  
  /**
   * Parse JSON safely
   */
  export function parseJsonSafe<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json) as T;
    } catch (_e) {
      AppLogger.warn('Failed to parse JSON', _e as Error);
      return defaultValue;
    }
  }
  
  /**
   * Clean email body text
   */
  export function cleanEmailBody(body: string): string {
    if (!body || typeof body !== 'string') {
      return '';
    }
    
    // First sanitize for security
    let cleaned = sanitizeEmailContent(body);
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(Constants.PATTERNS.MULTIPLE_SPACES, ' ').trim();
    
    // Remove email signatures (simple heuristic)
    const signaturePatterns = [
      /--\s*\n[\s\S]*/,  // Replaced .* with [\s\S]* to match across lines
      /Sent from my.*/i,
      /Get Outlook for.*/i,
      /^Best.*?\n.*$/gm
    ];
    
    signaturePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '').trim();
    });
    
    return cleaned;
  }
  
  /**
   * Extract sender name from email
   */
  export function extractSenderName(fromHeader: string): string {
    // Format: "Name <email@example.com>" or just "email@example.com"
    const match = fromHeader.match(/^"?([^"<]+)"?\s*<?/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If no name, use part before @ from email
    const emailMatch = fromHeader.match(/([^@]+)@/);
    return emailMatch ? emailMatch[1]! : 'Unknown';
  }
  
  /**
   * Generate a unique ID
   */
  export function generateId(): string {
    return Utilities.getUuid();
  }
  
  /**
   * Sleep for specified milliseconds
   */
  export function sleep(ms: number): void {
    Utilities.sleep(ms);
  }
  
  /**
   * Chunk array into smaller arrays
   */
  export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * Retry a function with exponential backoff (synchronous for Google Apps Script)
   */
  export function retryWithBackoff<T>(
    fn: () => T,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): T {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return fn();
      } catch (error) {
        lastError = error as Error;
        const errorMessage = lastError.message.toLowerCase();
        
        // Check if error is retryable
        const isRetryable = errorMessage.includes('timeout') ||
                          errorMessage.includes('timed out') ||
                          errorMessage.includes('network') ||
                          errorMessage.includes('temporarily') ||
                          errorMessage.includes('500') ||
                          errorMessage.includes('502') ||
                          errorMessage.includes('503') ||
                          errorMessage.includes('504');
        
        if (!isRetryable) {
          throw error; // Don't retry non-network errors
        }
        
        if (i < maxRetries - 1) {
          const delay = Math.min(initialDelay * Math.pow(2, i), 10000); // Max 10 seconds
          AppLogger.info(`Retry ${i + 1}/${maxRetries} after ${delay}ms`, {
            error: errorMessage
          });
          sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }
  
  /**
   * Escape HTML entities for XSS protection
   */
  export function escapeHtml(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const htmlEntities: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '=': '&#x3D;',
      '`': '&#x60;'
    };
    
    return text.replace(/[&<>"'\/=`]/g, char => htmlEntities[char] || char);
  }
  
  /**
   * Sanitize email content for safe display
   * Removes potentially dangerous content while preserving text
   */
  export function sanitizeEmailContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    // Remove any script tags and their content
    let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove any style tags to prevent CSS injection
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data: URLs that could contain scripts
    sanitized = sanitized.replace(/data:text\/html[^,]*,/gi, '');
    
    return sanitized;
  }
  
  /**
   * Get relative time string
   */
  export function getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  }

  /**
   * Extract domain from email address
   */
  export function extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 && parts[1] ? parts[1].toLowerCase() : '';
  }
  
  /**
   * Execute URL fetch with timeout monitoring
   */
  export function fetchWithTimeout(
    url: string,
    options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const startTime = new Date().getTime();
    
    try {
      // Note: Google Apps Script doesn't support true timeouts
      // We can only monitor how long the request takes
      const response = UrlFetchApp.fetch(url, options);
      
      const elapsedTime = new Date().getTime() - startTime;
      if (elapsedTime > Constants.API.TIMEOUT_MS) {
        AppLogger.warn('Request exceeded expected timeout', {
          url,
          elapsedMs: elapsedTime,
          expectedTimeoutMs: Constants.API.TIMEOUT_MS
        });
      }
      
      return response;
    } catch (error) {
      const elapsedTime = new Date().getTime() - startTime;
      AppLogger.error('Network request failed', {
        url,
        elapsedMs: elapsedTime,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}