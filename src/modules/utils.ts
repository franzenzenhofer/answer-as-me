namespace Utils {
  /**
   * Validate email address format
   */
  export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Truncate text to specified length
   */
  export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
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
    } catch (e) {
      AppLogger.warn('Failed to parse JSON', e);
      return defaultValue;
    }
  }
  
  /**
   * Clean email body text
   */
  export function cleanEmailBody(body: string): string {
    // Remove excessive whitespace
    body = body.replace(/\s+/g, ' ').trim();
    
    // Remove email signatures (simple heuristic)
    const signaturePatterns = [
      /--\s*\n.*/s,
      /Sent from my.*/i,
      /Get Outlook for.*/i,
      /^Best.*?\n.*$/gm
    ];
    
    signaturePatterns.forEach(pattern => {
      body = body.replace(pattern, '').trim();
    });
    
    return body;
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
   * Retry a function with exponential backoff
   */
  export async function retryWithBackoff<T>(
    fn: () => T,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i);
          AppLogger.info(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
          sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }
  
  /**
   * Escape HTML entities
   */
  export function escapeHtml(text: string): string {
    const htmlEntities: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
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
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}