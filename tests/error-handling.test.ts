import '../src/modules/logger';
import '../src/modules/ui';
import '../src/modules/error-handling';

declare const global: any;

describe('ErrorHandling Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new ErrorHandling.AppError(
        'Something went wrong',
        'API_ERROR',
        'Please check your API key'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('API_ERROR');
      expect(error.userMessage).toBe('Please check your API key');
      expect(error.name).toBe('AppError');
    });

    it('should work with minimal parameters', () => {
      const error = new ErrorHandling.AppError('Basic error');

      expect(error.message).toBe('Basic error');
      expect(error.code).toBeUndefined();
      expect(error.userMessage).toBeUndefined();
    });

    it('should maintain stack trace', () => {
      const error = new ErrorHandling.AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('handleError', () => {
    it('should handle AppError with user message', () => {
      const appError = new ErrorHandling.AppError(
        'Internal error',
        'INTERNAL',
        'Something went wrong, please try again'
      );

      const result = ErrorHandling.handleError(appError);

      expect(global.Logger.log).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      );
      expect(result).toEqual({
        success: false,
        error: 'Something went wrong, please try again'
      });
    });

    it('should handle AppError without user message', () => {
      const appError = new ErrorHandling.AppError('Raw error', 'CODE');

      const result = ErrorHandling.handleError(appError);

      expect(result).toEqual({
        success: false,
        error: 'Raw error'
      });
    });

    it('should handle standard Error', () => {
      const error = new Error('Standard error message');

      const result = ErrorHandling.handleError(error);

      expect(result).toEqual({
        success: false,
        error: 'Standard error message'
      });
    });

    it('should handle string errors', () => {
      const result = ErrorHandling.handleError('String error');

      expect(result).toEqual({
        success: false,
        error: 'String error'
      });
    });

    it('should handle unknown error types', () => {
      const result = ErrorHandling.handleError({ weird: 'object' });

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      });
    });

    it('should handle null/undefined', () => {
      const resultNull = ErrorHandling.handleError(null);
      const resultUndefined = ErrorHandling.handleError(undefined);

      expect(resultNull.error).toBe('An unexpected error occurred');
      expect(resultUndefined.error).toBe('An unexpected error occurred');
    });
  });

  describe('wrapAsync', () => {
    it('should execute function successfully', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const wrapped = ErrorHandling.wrapAsync(successFn);

      const result = await wrapped();

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalled();
    });

    it('should catch and handle errors', async () => {
      const errorFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrapped = ErrorHandling.wrapAsync(errorFn);

      const result = await wrapped();

      expect(result).toEqual({
        success: false,
        error: 'Async error'
      });
      expect(global.Logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Async error')
      );
    });

    it('should pass arguments to wrapped function', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      const wrapped = ErrorHandling.wrapAsync(fn);

      await wrapped('arg1', 'arg2', 123);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });

  describe('createErrorResponse', () => {
    it('should create card response for user errors', () => {
      const mockCard = { type: 'card' };
      global.UI = {
        buildErrorCard: jest.fn().mockReturnValue(mockCard)
      };

      const appError = new ErrorHandling.AppError(
        'Internal',
        'CODE',
        'User friendly message'
      );

      const response = ErrorHandling.createErrorResponse(appError);

      expect(global.UI.buildErrorCard).toHaveBeenCalledWith('User friendly message');
      expect(global.CardService.newActionResponseBuilder).toHaveBeenCalled();
    });

    it('should create notification for errors without cards', () => {
      const error = new Error('Simple error');

      const response = ErrorHandling.createErrorResponse(error);

      expect(global.CardService.newNotification).toHaveBeenCalled();
      const notificationMock = global.CardService.newNotification.mock.results[0].value;
      expect(notificationMock.setText).toHaveBeenCalledWith('Simple error');
    });

    it('should handle string errors in responses', () => {
      const response = ErrorHandling.createErrorResponse('String error message');

      expect(global.CardService.newNotification).toHaveBeenCalled();
      const notificationMock = global.CardService.newNotification.mock.results[0].value;
      expect(notificationMock.setText).toHaveBeenCalledWith('String error message');
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new Error('Network request failed');
      expect(ErrorHandling.isRetryableError(networkError)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const timeoutError = new Error('Request timeout');
      expect(ErrorHandling.isRetryableError(timeoutError)).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      const rateLimitError = new ErrorHandling.AppError(
        'Too many requests',
        'RATE_LIMIT'
      );
      expect(ErrorHandling.isRetryableError(rateLimitError)).toBe(true);
    });

    it('should not retry auth errors', () => {
      const authError = new ErrorHandling.AppError(
        'Invalid credentials',
        'AUTH_ERROR'
      );
      expect(ErrorHandling.isRetryableError(authError)).toBe(false);
    });

    it('should not retry validation errors', () => {
      const validationError = new ErrorHandling.AppError(
        'Invalid input',
        'VALIDATION_ERROR'
      );
      expect(ErrorHandling.isRetryableError(validationError)).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    jest.useFakeTimers();

    it('should retry on failure and succeed', async () => {
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const promise = ErrorHandling.retryWithBackoff(fn, 3, 100);
      
      // Fast-forward through retries
      jest.runAllTimers();
      
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      const promise = ErrorHandling.retryWithBackoff(fn, 3, 100);
      jest.runAllTimers();

      await expect(promise).rejects.toThrow('Persistent error');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const fn = jest.fn().mockRejectedValue(
        new ErrorHandling.AppError('Auth failed', 'AUTH_ERROR')
      );

      const promise = ErrorHandling.retryWithBackoff(fn, 3, 100);
      jest.runAllTimers();

      await expect(promise).rejects.toThrow('Auth failed');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  describe('error logging', () => {
    it('should log errors with context', () => {
      const error = new ErrorHandling.AppError(
        'Test error',
        'TEST_CODE'
      );

      ErrorHandling.handleError(error);

      expect(global.Logger.log).toHaveBeenCalledWith(
        expect.stringContaining('TEST_CODE')
      );
    });

    it('should log stack traces for errors', () => {
      const error = new Error('With stack');
      error.stack = 'Error: With stack\\n    at test.js:10:5';

      ErrorHandling.handleError(error);

      expect(global.Logger.log).toHaveBeenCalledWith(
        expect.stringContaining('at test.js:10:5')
      );
    });
  });
});