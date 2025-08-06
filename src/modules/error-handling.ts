namespace ErrorHandling {
  export class AppError extends Error {
    constructor(
      message: string,
      public code: string,
      public userMessage?: string
    ) {
      super(message);
      this.name = 'AppError';
    }
  }
  
  /**
   * Handle errors and return appropriate response - show Settings card with error info
   */
  export function handleError(error: any): GoogleAppsScript.Card_Service.Card {
    AppLogger.error('Error occurred', error);
    
    // Log user-friendly error message for debugging
    let userMessage = 'An unexpected error occurred';
    
    if (error instanceof AppError) {
      userMessage = error.userMessage || error.message;
    } else if (error instanceof Error) {
      // Don't expose internal error messages to users
      if (error.message.includes('API')) {
        userMessage = 'Failed to connect to AI service - Check your API key in Settings';
      } else if (error.message.includes('Gmail')) {
        userMessage = 'Failed to access email - Try refreshing Gmail';
      }
    }
    
    AppLogger.info('User-friendly error message', userMessage);
    
    // Return settings card - errors are handled via notifications in action handlers
    const settings = Config.getSettings();
    return UI.buildSettingsCard(settings);
  }
  
  /**
   * Wrap function with error handling
   */
  export function withErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    errorResponse: any
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        AppLogger.error(`Error in ${fn.name}`, error);
        return errorResponse;
      }
    }) as T;
  }
  
  /**
   * Validate required fields
   */
  export function validateRequired(
    data: any,
    fields: string[]
  ): void {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new AppError(
        `Missing required fields: ${missing.join(', ')}`,
        'VALIDATION_ERROR',
        'Please fill in all required fields'
      );
    }
  }
}