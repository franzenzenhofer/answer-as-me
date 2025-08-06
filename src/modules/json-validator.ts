/**
 * JSON Validator Module
 * Simple, modular validation for AI responses - KISS principle
 * No external dependencies - works perfectly in Google Apps Script
 */

namespace JsonValidator {
  
  /**
   * Validate and parse JSON safely
   */
  export function parseJson<T>(jsonString: string, context: string): T | null {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      AppLogger.error(`JSON parse failed in ${context}`, error);
      return null;
    }
  }

  /**
   * Validate writing style response
   */
  export function validateWritingStyle(data: any): Types.WritingStyle | null {
    if (!data || typeof data !== 'object') {
      AppLogger.error('Writing style validation failed: not an object');
      return null;
    }

    // Required fields with defaults
    return {
      greetings: Array.isArray(data.greetings) ? data.greetings : Constants.STYLE.DEFAULT_GREETINGS,
      closings: Array.isArray(data.closings) ? data.closings : Constants.STYLE.DEFAULT_CLOSINGS,
      sentencePatterns: Array.isArray(data.sentencePatterns) ? data.sentencePatterns : [],
      vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary : [],
      formalityLevel: isValidNumber(data.formalityLevel, 1, 5) ? 
        data.formalityLevel : Constants.STYLE.FORMALITY_NEUTRAL,
      averageSentenceLength: isValidNumber(data.averageSentenceLength, 1, 100) ? 
        data.averageSentenceLength : Constants.STYLE.DEFAULT_AVG_SENTENCE_LENGTH,
      emailLength: isValidEmailLength(data.emailLength) ? data.emailLength : 'medium',
      punctuationStyle: isValidPunctuationStyle(data.punctuationStyle) ? 
        data.punctuationStyle : Constants.STYLE.DEFAULT_PUNCTUATION
    };
  }

  /**
   * Validate user profile response
   */
  export function validateUserProfile(data: any): Types.UserProfile | null {
    if (!data || typeof data !== 'object' || !data.email) {
      AppLogger.error('User profile validation failed: missing required fields');
      return null;
    }

    const profile: Types.UserProfile = {
      email: String(data.email)
    };

    // Optional fields
    if (data.name) {
      profile.name = String(data.name);
    }
    
    if (data.identity && typeof data.identity === 'object') {
      profile.identity = {
        role: String(data.identity.role || 'User'),
        expertise: Array.isArray(data.identity.expertise) ? data.identity.expertise : [],
        communicationStyle: String(data.identity.communicationStyle || 'Professional')
      };
    }

    if (data.personality && typeof data.personality === 'object') {
      profile.personality = {
        formality: isValidNumber(data.personality.formality, 1, 5) ? data.personality.formality : 3,
        directness: isValidNumber(data.personality.directness, 1, 5) ? data.personality.directness : 3,
        warmth: isValidNumber(data.personality.warmth, 1, 5) ? data.personality.warmth : 3,
        detailLevel: isValidNumber(data.personality.detailLevel, 1, 5) ? data.personality.detailLevel : 3
      };
    }

    return profile;
  }

  /**
   * Create response schema for Gemini API
   */
  export function createWritingStyleSchema(): any {
    return {
      type: 'object',
      properties: {
        greetings: { type: 'array', items: { type: 'string' } },
        closings: { type: 'array', items: { type: 'string' } },
        sentencePatterns: { type: 'array', items: { type: 'string' } },
        vocabulary: { type: 'array', items: { type: 'string' } },
        formalityLevel: { type: 'number', minimum: 1, maximum: 5 },
        averageSentenceLength: { type: 'number', minimum: 1 },
        emailLength: { type: 'string', enum: ['short', 'medium', 'long'] },
        punctuationStyle: { type: 'string', enum: ['minimal', 'standard', 'expressive'] }
      },
      required: ['greetings', 'closings', 'formalityLevel', 'averageSentenceLength', 'punctuationStyle']
    };
  }

  /**
   * Create response schema for user profile
   */
  export function createUserProfileSchema(): any {
    return {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string', nullable: true },
        identity: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            expertise: { type: 'array', items: { type: 'string' } },
            communicationStyle: { type: 'string' }
          },
          required: ['role', 'expertise', 'communicationStyle']
        },
        personality: {
          type: 'object',
          properties: {
            formality: { type: 'number', minimum: 1, maximum: 5 },
            directness: { type: 'number', minimum: 1, maximum: 5 },
            warmth: { type: 'number', minimum: 1, maximum: 5 },
            detailLevel: { type: 'number', minimum: 1, maximum: 5 }
          },
          required: ['formality', 'directness', 'warmth', 'detailLevel']
        }
      },
      required: ['email']
    };
  }

  // Simple helper validators
  function isValidNumber(value: any, min: number, max: number): boolean {
    return typeof value === 'number' && value >= min && value <= max;
  }

  function isValidEmailLength(value: any): boolean {
    return value === 'short' || value === 'medium' || value === 'long';
  }

  function isValidPunctuationStyle(value: any): boolean {
    return value === 'minimal' || value === 'standard' || value === 'expressive';
  }
}