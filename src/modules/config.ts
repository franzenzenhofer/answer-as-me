namespace Config {
  // Version info - injected during build
  export const VERSION = '{{VERSION}}';
  export const DEPLOY_TIME = '{{DEPLOY_TIME}}';
  
  // App metadata
  export const APP_NAME = 'Answer As Me';
  export const APP_DESCRIPTION = 'AI-powered email responses in your style';
  
  // API configuration
  export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  export const API_TEMPERATURE = 0.7;
  export const API_MAX_TOKENS = 2048;
  export const API_TIMEOUT = 30000; // 30 seconds
  
  // Processing limits
  export const MAX_THREADS_TO_PROCESS = 50;
  export const MAX_SENT_EMAILS_TO_ANALYZE = 200;
  export const MAX_CONTEXT_MESSAGES = 10;
  export const MAX_RESPONSE_LENGTH = 5000;
  
  // Property keys
  export const PROPERTY_KEYS = {
    API_KEY: 'AAM_API_KEY',
    RESPONSE_MODE: 'AAM_RESPONSE_MODE',
    AUTO_REPLY: 'AAM_AUTO_REPLY',
    FORMALITY_LEVEL: 'AAM_FORMALITY_LEVEL',
    RESPONSE_LENGTH: 'AAM_RESPONSE_LENGTH',
    CUSTOM_INSTRUCTIONS: 'AAM_CUSTOM_INSTRUCTIONS',
    SIGNATURE: 'AAM_SIGNATURE',
    WRITING_STYLE: 'AAM_WRITING_STYLE',
    LAST_ANALYSIS: 'AAM_LAST_ANALYSIS'
  };
  
  // Default settings
  export const DEFAULT_SETTINGS: Types.Config = {
    apiKey: '',
    responseMode: Types.ResponseMode.DRAFT,
    autoReply: false,
    formalityLevel: 3,
    responseLength: Types.ResponseLength.MEDIUM,
    customInstructions: '',
    signature: 'Best regards,\\nFranz'
  };
  
  // UI Constants
  export const UI = {
    CARD_WIDTH: 600,
    MAX_BUTTON_TEXT_LENGTH: 40,
    NOTIFICATION_TIMEOUT: 10,
    FORMALITY_LABELS: ['Very Casual', 'Casual', 'Neutral', 'Formal', 'Very Formal']
  };
  
  // Email patterns
  export const EMAIL_PATTERNS = {
    GREETING: /^(hi|hello|hey|dear|good\s+(morning|afternoon|evening))/i,
    CLOSING: /(regards|best|sincerely|thanks|cheers|kind regards)/i,
    QUESTION: /\?|^(what|where|when|why|how|who|which|could|would|should|can|will)/i
  };
  
  // System prompts
  export const PROMPTS = {
    STYLE_ANALYSIS: `Analyze the writing style of these emails and extract:
- Common greetings used
- Common closing phrases
- Sentence structure patterns
- Vocabulary preferences
- Formality level (1-5)
- Average sentence length
- Punctuation style

Return as JSON with these exact fields: greetings, closings, sentencePatterns, vocabulary, formalityLevel, averageSentenceLength, punctuationStyle`,
    
    RESPONSE_GENERATION: `Generate an email response that:
1. Matches the provided writing style
2. Appropriately addresses the email content
3. Maintains the specified formality level
4. Uses appropriate length based on preference
5. Includes relevant context from the thread

Style profile: {style}
Email context: {context}
Custom instructions: {instructions}

Return only the email body text, no subject or metadata.`
  };
  
  /**
   * Get user properties
   */
  export function getUserProperties(): GoogleAppsScript.Properties.Properties {
    return PropertiesService.getUserProperties();
  }
  
  /**
   * Get a specific property
   */
  export function getProperty(key: string): string {
    return getUserProperties().getProperty(key) || '';
  }
  
  /**
   * Set a property
   */
  export function setProperty(key: string, value: string): void {
    getUserProperties().setProperty(key, value);
  }
  
  /**
   * Get all settings
   */
  export function getSettings(): Types.Config {
    const props = getUserProperties();
    const allProps = props.getProperties();
    
    return {
      apiKey: allProps[PROPERTY_KEYS.API_KEY] || DEFAULT_SETTINGS.apiKey,
      responseMode: (allProps[PROPERTY_KEYS.RESPONSE_MODE] as Types.ResponseMode) || DEFAULT_SETTINGS.responseMode,
      autoReply: allProps[PROPERTY_KEYS.AUTO_REPLY] === 'true',
      formalityLevel: parseInt(allProps[PROPERTY_KEYS.FORMALITY_LEVEL] || String(DEFAULT_SETTINGS.formalityLevel)),
      responseLength: (allProps[PROPERTY_KEYS.RESPONSE_LENGTH] as Types.ResponseLength) || DEFAULT_SETTINGS.responseLength,
      customInstructions: allProps[PROPERTY_KEYS.CUSTOM_INSTRUCTIONS] || DEFAULT_SETTINGS.customInstructions,
      signature: allProps[PROPERTY_KEYS.SIGNATURE] || DEFAULT_SETTINGS.signature
    };
  }
  
  /**
   * Save settings
   */
  export function saveSettings(settings: Partial<Types.Config>): void {
    const props = getUserProperties();
    
    if (settings.apiKey !== undefined) {
      props.setProperty(PROPERTY_KEYS.API_KEY, settings.apiKey);
    }
    if (settings.responseMode !== undefined) {
      props.setProperty(PROPERTY_KEYS.RESPONSE_MODE, settings.responseMode);
    }
    if (settings.autoReply !== undefined) {
      props.setProperty(PROPERTY_KEYS.AUTO_REPLY, String(settings.autoReply));
    }
    if (settings.formalityLevel !== undefined) {
      props.setProperty(PROPERTY_KEYS.FORMALITY_LEVEL, String(settings.formalityLevel));
    }
    if (settings.responseLength !== undefined) {
      props.setProperty(PROPERTY_KEYS.RESPONSE_LENGTH, settings.responseLength);
    }
    if (settings.customInstructions !== undefined) {
      props.setProperty(PROPERTY_KEYS.CUSTOM_INSTRUCTIONS, settings.customInstructions);
    }
    if (settings.signature !== undefined) {
      props.setProperty(PROPERTY_KEYS.SIGNATURE, settings.signature);
    }
  }
}