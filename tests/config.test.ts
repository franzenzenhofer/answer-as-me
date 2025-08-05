import '../src/modules/types';
import '../src/modules/config';

describe('Config Module', () => {
  describe('Constants', () => {
    it('should have correct app metadata', () => {
      expect(Config.APP_NAME).toBe('Answer As Me');
      expect(Config.APP_DESCRIPTION).toBe('AI-powered email responses in your style');
    });

    it('should have correct API configuration', () => {
      expect(Config.GEMINI_API_URL).toContain('gemini-2.0-flash-exp');
      expect(Config.API_TEMPERATURE).toBe(0.7);
      expect(Config.API_MAX_TOKENS).toBe(2048);
    });

    it('should have correct processing limits', () => {
      expect(Config.MAX_SENT_EMAILS_TO_ANALYZE).toBe(200);
      expect(Config.MAX_THREADS_TO_PROCESS).toBe(50);
      expect(Config.MAX_CONTEXT_MESSAGES).toBe(10);
    });
  });

  describe('Property Keys', () => {
    it('should have all required property keys', () => {
      expect(Config.PROPERTY_KEYS.API_KEY).toBe('AAM_API_KEY');
      expect(Config.PROPERTY_KEYS.RESPONSE_MODE).toBe('AAM_RESPONSE_MODE');
      expect(Config.PROPERTY_KEYS.WRITING_STYLE).toBe('AAM_WRITING_STYLE');
    });
  });

  describe('Default Settings', () => {
    it('should have correct default values', () => {
      expect(Config.DEFAULT_SETTINGS.apiKey).toBe('');
      expect(Config.DEFAULT_SETTINGS.responseMode).toBe('draft');
      expect(Config.DEFAULT_SETTINGS.formalityLevel).toBe(3);
      expect(Config.DEFAULT_SETTINGS.responseLength).toBe('medium');
    });
  });

  describe('getUserProperties', () => {
    it('should return properties service', () => {
      const props = Config.getUserProperties();
      expect(props).toBeDefined();
      expect(props.getProperty).toBeDefined();
    });
  });

  describe('getSettings', () => {
    it('should return default settings when no properties are set', () => {
      const settings = Config.getSettings();
      expect(settings.apiKey).toBe('');
      expect(settings.formalityLevel).toBe(3);
      expect(settings.autoReply).toBe(false);
    });
  });

  describe('saveSettings', () => {
    it('should save settings without errors', () => {
      const testSettings = {
        apiKey: 'test-key',
        formalityLevel: 4,
        responseLength: Types.ResponseLength.SHORT
      };
      
      expect(() => Config.saveSettings(testSettings)).not.toThrow();
    });
  });
});