// Mock Constants namespace with all values for testing
console.log('Loading Constants mock...');
global.Constants = {
  API: {
    GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com',
    GEMINI_VERSION: 'v1beta',
    GEMINI_MODEL: 'gemini-2.0-flash-exp',
    GEMINI_ENDPOINT: 'generateContent',
    TEMPERATURE: 0.7,
    MAX_OUTPUT_TOKENS: 2048,
    TOP_K: 40,
    TOP_P: 0.95,
    TIMEOUT_MS: 30000,
    HTTP_METHOD_POST: 'post',
    CONTENT_TYPE_JSON: 'application/json',
    HEADER_API_KEY: 'x-goog-api-key',
    STATUS_OK: 200
  },
  EMAIL: {
    MAX_THREADS_TO_PROCESS: 50,
    MAX_SENT_EMAILS_TO_ANALYZE: 200,
    MAX_CONTEXT_MESSAGES: 10,
    MAX_RESPONSE_LENGTH: 5000,
    MIN_EMAIL_LENGTH_FOR_ANALYSIS: 50,
    DEFAULT_SIGNATURE: 'Best regards,\\nFranz'
  },
  UI: {
    CARD_WIDTH: 600,
    MAX_BUTTON_TEXT_LENGTH: 40,
    NOTIFICATION_TIMEOUT_MS: 10000,
    FIELD_API_KEY: 'apiKey',
    FIELD_SIGNATURE: 'signature',
    BUTTON_GENERATE: 'Generate Response',
    BUTTON_SAVE_SETTINGS: 'Save Settings',
    TITLE_RESPONSE: 'Response Generated',
    MSG_RESPONSE_GENERATED: 'Draft created successfully',
    MSG_ERROR: 'Error',
    TITLE_HELP: 'Help',
    ICON_MAIN: 'https://i.imgur.com/YOUR_ICON_URL.png',
    MAX_HINT_LENGTH: 200
  },
  STYLE: {
    FORMALITY_NEUTRAL: 3,
    DEFAULT_GREETINGS: ['Hi', 'Hello', 'Hey'],
    DEFAULT_CLOSINGS: ['Best regards', 'Thanks', 'Cheers'],
    DEFAULT_AVG_SENTENCE_LENGTH: 15,
    DEFAULT_PUNCTUATION: 'standard',
    MIN_SENTENCE_LENGTH: 3,
    FORMALITY_LABELS: ['Very Casual', 'Casual', 'Neutral', 'Formal', 'Very Formal']
  },
  PROPERTIES: {
    API_KEY: 'AAM_API_KEY',
    RESPONSE_MODE: 'AAM_RESPONSE_MODE',
    AUTO_REPLY: 'AAM_AUTO_REPLY',
    FORMALITY_LEVEL: 'AAM_FORMALITY_LEVEL',
    RESPONSE_LENGTH: 'AAM_RESPONSE_LENGTH',
    CUSTOM_INSTRUCTIONS: 'AAM_CUSTOM_INSTRUCTIONS',
    SIGNATURE: 'AAM_SIGNATURE',
    WRITING_STYLE: 'AAM_WRITING_STYLE',
    LAST_ANALYSIS: 'AAM_LAST_ANALYSIS'
  },
  PATTERNS: {
    EMAIL_ADDRESS: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    EMAIL_WITH_NAME: /^(.+?)\\s*<(.+@.+)>$/,
    GREETING: /^(hi|hello|hey|dear|good\\s+(morning|afternoon|evening))/i,
    CLOSING: /(regards|best|sincerely|thanks|cheers|kind regards)/i,
    QUESTION: /\\?|^(what|where|when|why|how|who|which|could|would|should|can|will)/i,
    SIGNATURE_SEPARATOR: /--\\s*\\n/,
    SENT_FROM_DEVICE: /Sent from my/i,
    GET_APP: /Get (Outlook|Gmail) for/i,
    API_KEY: /\\b[A-Za-z0-9]{32,}\\b/g,
    MULTIPLE_SPACES: /\\s+/g
  },
  ERRORS: {
    MSG_API_KEY_REQUIRED: 'API key not configured',
    MSG_NO_RESPONSE_TEXT: 'Response text is empty'
  },
  LOG: {
    LEVEL_DEBUG: 0,
    LEVEL_INFO: 1,
    LEVEL_WARN: 2,
    LEVEL_ERROR: 3,
    PREFIX_DEBUG: '[DEBUG]',
    PREFIX_INFO: '[INFO]',
    PREFIX_WARN: '[WARN]',
    PREFIX_ERROR: '[ERROR]',
    REDACTED_EMAIL: '[EMAIL]',
    REDACTED_API_KEY: '[REDACTED]',
    REDACTED_NAME: '[NAME]'
  },
  TIMING: {
    DEFAULT_RETRY_COUNT: 3,
    RETRY_INITIAL_DELAY_MS: 1000,
    RETRY_MULTIPLIER: 2
  },
  RESPONSE: {
    MODE_DRAFT: 'draft',
    LENGTH_MEDIUM: 'medium'
  },
  METADATA: {
    APP_NAME: 'Answer As Me',
    APP_DESCRIPTION: 'AI-powered email responses in your style',
    APP_VERSION: '1.0.0',
    API_KEY_URL: 'https://makersuite.google.com/app/apikey',
    HELP_URL: 'https://github.com/franzenzenhofer/answer-as-me',
    BUNDLE_FILENAME: 'Code.gs',
    MANIFEST_FILENAME: 'appsscript.json',
    VERSION_PLACEHOLDER: '{{VERSION}}',
    DEPLOY_TIME_PLACEHOLDER: '{{DEPLOY_TIME}}'
  },
  VALIDATION: {
    MIN_SENTENCE_COUNT: 1
  },
  PROMPTS: {
    STYLE_ANALYSIS: 'Analyze the writing style of these emails...',
    RESPONSE_GENERATION: 'Generate an email response that...'
  },
  LISTS: {
    STOP_WORDS: ['the', 'be', 'to', 'of', 'and'],
    FORMAL_INDICATORS: ['respectfully', 'furthermore'],
    CASUAL_INDICATORS: ['hey', 'yo', 'sup']
  }
};

console.log('Constants loaded:', !!global.Constants);
console.log('Constants.METADATA:', !!global.Constants.METADATA);