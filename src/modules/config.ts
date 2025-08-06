namespace Config {
  // Version info - injected during build
  export const VERSION = Constants.METADATA.VERSION_PLACEHOLDER;
  export const DEPLOY_TIME = Constants.METADATA.DEPLOY_TIME_PLACEHOLDER;
  
  // App metadata
  export const APP_NAME = Constants.METADATA.APP_NAME;
  export const APP_DESCRIPTION = Constants.METADATA.APP_DESCRIPTION;
  
  // API configuration
  export const GEMINI_API_URL = `${Constants.API.GEMINI_BASE_URL}/${Constants.API.GEMINI_VERSION}/models/${Constants.API.GEMINI_MODEL}:${Constants.API.GEMINI_ENDPOINT}`;
  export const API_TEMPERATURE = Constants.API.TEMPERATURE;
  export const API_MAX_TOKENS = Constants.API.MAX_OUTPUT_TOKENS;
  export const API_TIMEOUT = Constants.API.TIMEOUT_MS;
  
  // Processing limits
  export const MAX_THREADS_TO_PROCESS = Constants.EMAIL.MAX_THREADS_TO_PROCESS;
  export const MAX_SENT_EMAILS_TO_ANALYZE = Constants.EMAIL.MAX_SENT_EMAILS_TO_ANALYZE;
  export const MAX_CONTEXT_MESSAGES = Constants.EMAIL.MAX_CONTEXT_MESSAGES;
  export const MAX_RESPONSE_LENGTH = Constants.EMAIL.MAX_RESPONSE_LENGTH;
  
  // Property keys
  export const PROPERTY_KEYS = {
    API_KEY: Constants.PROPERTIES.API_KEY,
    RESPONSE_MODE: Constants.PROPERTIES.RESPONSE_MODE,
    AUTO_REPLY: Constants.PROPERTIES.AUTO_REPLY,
    FORMALITY_LEVEL: Constants.PROPERTIES.FORMALITY_LEVEL,
    RESPONSE_LENGTH: Constants.PROPERTIES.RESPONSE_LENGTH,
    CUSTOM_INSTRUCTIONS: Constants.PROPERTIES.CUSTOM_INSTRUCTIONS,
    SIGNATURE: Constants.PROPERTIES.SIGNATURE,
    WRITING_STYLE: Constants.PROPERTIES.WRITING_STYLE,
    LAST_ANALYSIS: Constants.PROPERTIES.LAST_ANALYSIS
  };
  
  // Default settings
  export const DEFAULT_SETTINGS: Types.Config = {
    apiKey: '',
    responseMode: Constants.RESPONSE.MODE_DRAFT as Types.ResponseMode,
    autoReply: false,
    formalityLevel: Constants.STYLE.FORMALITY_NEUTRAL,
    responseLength: Constants.RESPONSE.LENGTH_MEDIUM as Types.ResponseLength,
    customInstructions: '',
    signature: Constants.EMAIL.DEFAULT_SIGNATURE
  };
  
  // UI Constants
  export const UI = {
    CARD_WIDTH: Constants.UI.CARD_WIDTH,
    MAX_BUTTON_TEXT_LENGTH: Constants.UI.MAX_BUTTON_TEXT_LENGTH,
    NOTIFICATION_TIMEOUT: Constants.UI.NOTIFICATION_TIMEOUT_MS / 1000,
    FORMALITY_LABELS: Constants.STYLE.FORMALITY_LABELS
  };
  
  // Email patterns
  export const EMAIL_PATTERNS = {
    GREETING: Constants.PATTERNS.GREETING,
    CLOSING: Constants.PATTERNS.CLOSING,
    QUESTION: Constants.PATTERNS.QUESTION
  };
  
  // System prompts (updated to use available types)
  export const PROMPTS = {
    SETTINGS: Constants.PROMPTS.TYPES.SETTINGS,
    OVERVIEW: Constants.PROMPTS.TYPES.OVERVIEW,
    THREAD: Constants.PROMPTS.TYPES.THREAD
  };
  
  /**
   * Get user properties - DEPRECATED: Use PropertyManager instead
   * @deprecated
   */
  export function getUserProperties(): GoogleAppsScript.Properties.Properties {
    AppLogger.warn('getUserProperties() is deprecated. Use PropertyManager methods instead.');
    return PropertiesService.getUserProperties();
  }
  
  /**
   * Get a specific property with thread safety
   */
  export function getProperty(key: string): string {
    return PropertyManager.getProperty(key, 'user') || '';
  }
  
  /**
   * Set a property with thread safety
   */
  export function setProperty(key: string, value: string): void {
    if (!PropertyManager.setProperty(key, value, 'user')) {
      throw new Error(`Failed to set property: ${key}`);
    }
  }
  
  /**
   * Get all settings with thread safety
   */
  export function getSettings(): Types.Config {
    const allProps = PropertyManager.getAllProperties('user');
    
    return {
      apiKey: allProps[PROPERTY_KEYS.API_KEY] || DEFAULT_SETTINGS.apiKey,
      responseMode: (allProps[PROPERTY_KEYS.RESPONSE_MODE] as Types.ResponseMode) || DEFAULT_SETTINGS.responseMode,
      autoReply: allProps[PROPERTY_KEYS.AUTO_REPLY] === 'true',
      formalityLevel: parseInt(allProps[PROPERTY_KEYS.FORMALITY_LEVEL] || String(DEFAULT_SETTINGS.formalityLevel)),
      responseLength: (allProps[PROPERTY_KEYS.RESPONSE_LENGTH] as Types.ResponseLength) || 
        DEFAULT_SETTINGS.responseLength,
      customInstructions: allProps[PROPERTY_KEYS.CUSTOM_INSTRUCTIONS] || DEFAULT_SETTINGS.customInstructions,
      signature: allProps[PROPERTY_KEYS.SIGNATURE] || DEFAULT_SETTINGS.signature
    };
  }
  
  /**
   * Save settings with thread safety
   */
  export function saveSettings(settings: Partial<Types.Config>): void {
    const updates: {[key: string]: string} = {};
    
    if (settings.apiKey !== undefined) {
      updates[PROPERTY_KEYS.API_KEY] = settings.apiKey;
    }
    if (settings.responseMode !== undefined) {
      updates[PROPERTY_KEYS.RESPONSE_MODE] = settings.responseMode;
    }
    if (settings.autoReply !== undefined) {
      updates[PROPERTY_KEYS.AUTO_REPLY] = String(settings.autoReply);
    }
    if (settings.formalityLevel !== undefined) {
      updates[PROPERTY_KEYS.FORMALITY_LEVEL] = String(settings.formalityLevel);
    }
    if (settings.responseLength !== undefined) {
      updates[PROPERTY_KEYS.RESPONSE_LENGTH] = settings.responseLength;
    }
    if (settings.customInstructions !== undefined) {
      updates[PROPERTY_KEYS.CUSTOM_INSTRUCTIONS] = settings.customInstructions;
    }
    if (settings.signature !== undefined) {
      updates[PROPERTY_KEYS.SIGNATURE] = settings.signature;
    }
    
    // Batch update for better performance and atomicity
    if (Object.keys(updates).length > 0) {
      if (!PropertyManager.setProperties(updates, 'user')) {
        throw new Error('Failed to save settings');
      }
    }
  }
}