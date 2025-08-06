// Load compiled modules in test environment
const { loadCompiledModule } = require('./helpers/setup-compiled-modules');

declare const global: any;

// Load modules in dependency order
beforeAll(() => {
  loadCompiledModule('types');
  loadCompiledModule('logger');
  loadCompiledModule('json-validator');
});

describe('JsonValidator Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseJson', () => {
    it('should parse valid JSON', () => {
      const jsonString = '{"name": "test", "value": 123}';
      const result = JsonValidator.parseJson(jsonString, 'test context');
      
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return null for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const result = JsonValidator.parseJson(invalidJson, 'test context');
      
      expect(result).toBeNull();
      expect(global.AppLogger.error).toHaveBeenCalledWith(
        'JSON parse failed in test context',
        expect.any(Error)
      );
    });
  });

  describe('validateWritingStyle', () => {
    it('should validate complete writing style data', () => {
      const validData = {
        greetings: ['Hi', 'Hello'],
        closings: ['Best', 'Thanks'],
        sentencePatterns: ['Thank you for'],
        vocabulary: ['appreciate', 'kindly'],
        formalityLevel: 3,
        averageSentenceLength: 15,
        emailLength: 'medium',
        punctuationStyle: 'standard'
      };

      const result = JsonValidator.validateWritingStyle(validData);
      
      expect(result).toEqual(validData);
    });

    it('should provide defaults for missing fields', () => {
      const incompleteData = {
        greetings: ['Hey'],
        formalityLevel: 2
      };

      const result = JsonValidator.validateWritingStyle(incompleteData);
      
      expect(result).toBeDefined();
      expect(result!.greetings).toEqual(['Hey']);
      expect(result!.closings).toEqual(Constants.STYLE.DEFAULT_CLOSINGS);
      expect(result!.sentencePatterns).toEqual([]);
      expect(result!.vocabulary).toEqual([]);
      expect(result!.formalityLevel).toBe(2);
      expect(result!.averageSentenceLength).toBe(Constants.STYLE.DEFAULT_AVG_SENTENCE_LENGTH);
      expect(result!.emailLength).toBe('medium');
      expect(result!.punctuationStyle).toBe(Constants.STYLE.DEFAULT_PUNCTUATION);
    });

    it('should handle invalid data types', () => {
      const invalidData = {
        greetings: 'not an array',
        formalityLevel: 'not a number',
        emailLength: 'invalid'
      };

      const result = JsonValidator.validateWritingStyle(invalidData);
      
      expect(result).toBeDefined();
      expect(result!.greetings).toEqual(Constants.STYLE.DEFAULT_GREETINGS);
      expect(result!.formalityLevel).toBe(Constants.STYLE.FORMALITY_NEUTRAL);
      expect(result!.emailLength).toBe('medium');
    });

    it('should validate formality level range', () => {
      const outOfRangeData = {
        formalityLevel: 10
      };

      const result = JsonValidator.validateWritingStyle(outOfRangeData);
      
      expect(result!.formalityLevel).toBe(Constants.STYLE.FORMALITY_NEUTRAL);
    });

    it('should return null for non-object input', () => {
      const result = JsonValidator.validateWritingStyle('not an object');
      
      expect(result).toBeNull();
      expect(global.AppLogger.error).toHaveBeenCalledWith(
        'Writing style validation failed: not an object'
      );
    });
  });

  describe('validateUserProfile', () => {
    it('should validate complete user profile', () => {
      const validProfile = {
        email: 'user@example.com',
        name: 'Test User',
        identity: {
          role: 'Developer',
          expertise: ['TypeScript', 'Google Apps Script'],
          communicationStyle: 'Direct'
        },
        personality: {
          formality: 3,
          directness: 4,
          warmth: 3,
          detailLevel: 4
        }
      };

      const result = JsonValidator.validateUserProfile(validProfile);
      
      expect(result).toEqual(validProfile);
    });

    it('should handle minimal profile with only email', () => {
      const minimalProfile = {
        email: 'user@example.com'
      };

      const result = JsonValidator.validateUserProfile(minimalProfile);
      
      expect(result).toEqual({ email: 'user@example.com' });
    });

    it('should provide defaults for personality values', () => {
      const profileWithPartialPersonality = {
        email: 'user@example.com',
        personality: {
          formality: 5,
          directness: 'invalid'
        }
      };

      const result = JsonValidator.validateUserProfile(profileWithPartialPersonality);
      
      expect(result).toBeDefined();
      expect(result!.personality).toBeDefined();
      expect(result!.personality!.formality).toBe(5);
      expect(result!.personality!.directness).toBe(3); // Default
      expect(result!.personality!.warmth).toBe(3); // Default
      expect(result!.personality!.detailLevel).toBe(3); // Default
    });

    it('should return null for missing email', () => {
      const noEmailProfile = {
        name: 'Test User'
      };

      const result = JsonValidator.validateUserProfile(noEmailProfile);
      
      expect(result).toBeNull();
      expect(global.AppLogger.error).toHaveBeenCalledWith(
        'User profile validation failed: missing required fields'
      );
    });
  });

  describe('createWritingStyleSchema', () => {
    it('should create valid writing style schema', () => {
      const schema = JsonValidator.createWritingStyleSchema();
      
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties.greetings).toEqual({ type: 'array', items: { type: 'string' } });
      expect(schema.properties.formalityLevel).toEqual({ type: 'number', minimum: 1, maximum: 5 });
      expect(schema.properties.emailLength.enum).toEqual(['short', 'medium', 'long']);
      expect(schema.required).toContain('greetings');
      expect(schema.required).toContain('formalityLevel');
    });
  });

  describe('createUserProfileSchema', () => {
    it('should create valid user profile schema', () => {
      const schema = JsonValidator.createUserProfileSchema();
      
      expect(schema.type).toBe('object');
      expect(schema.properties.email).toEqual({ type: 'string' });
      expect(schema.properties.name).toEqual({ type: 'string', nullable: true });
      expect(schema.properties.identity.type).toBe('object');
      expect(schema.properties.personality.properties.formality).toEqual({
        type: 'number',
        minimum: 1,
        maximum: 5
      });
      expect(schema.required).toEqual(['email']);
    });
  });
});