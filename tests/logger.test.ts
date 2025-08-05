import '../src/modules/logger';

declare const global: any;

describe('AppLogger Module', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  describe('Logging methods', () => {
    it('should log info messages', () => {
      AppLogger.info('Test info message');
      expect(global.Logger.log).toHaveBeenCalledWith('[INFO] Test info message');
    });

    it('should log warning messages', () => {
      AppLogger.warn('Test warning message');
      expect(global.Logger.log).toHaveBeenCalledWith('[WARN] Test warning message');
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      AppLogger.error('Test error message', error);
      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('[ERROR] Test error message'));
      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    });

    it('should log debug messages', () => {
      AppLogger.debug('Test debug message');
      expect(global.Logger.log).toHaveBeenCalledWith('[DEBUG] Test debug message');
    });
  });

  describe('Error handling', () => {
    it('should handle error objects', () => {
      const error = new Error('Custom error');
      AppLogger.error('Error occurred', error);
      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('Custom error'));
    });

    it('should handle string errors', () => {
      AppLogger.error('Error occurred', 'String error');
      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('String error'));
    });

    it('should handle unknown error types', () => {
      AppLogger.error('Error occurred', { custom: 'error' });
      expect(global.Logger.log).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    });

    it('should handle errors without context', () => {
      AppLogger.error('Just a message');
      expect(global.Logger.log).toHaveBeenCalledWith('[ERROR] Just a message');
    });
  });
});