/**
 * Central Constants Service
 * All magic numbers and strings are defined here
 * This ensures consistency and makes the codebase more maintainable
 */

namespace Constants {
  
  // ============================================
  // API CONFIGURATION
  // ============================================
  export const API = {
    GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com',
    GEMINI_VERSION: 'v1beta',
    GEMINI_MODEL: 'gemini-2.0-flash-exp',
    GEMINI_ENDPOINT: 'generateContent',
    
    // Temperature and token settings
    TEMPERATURE: 0.7,
    MAX_OUTPUT_TOKENS: 2048,
    TOP_K: 40,
    TOP_P: 0.95,
    
    // HTTP settings
    TIMEOUT_MS: 30000,
    HTTP_METHOD_POST: 'post',
    CONTENT_TYPE_JSON: 'application/json',
    HEADER_API_KEY: 'x-goog-api-key',
    
    // Response codes
    STATUS_OK: 200,
    STATUS_FORBIDDEN: 403,
    STATUS_NOT_FOUND: 404,
    STATUS_RATE_LIMIT: 429,
    STATUS_SERVER_ERROR: 500,
    
    // UI
    KEY_MASK: '••••'
  };

  // ============================================
  // EMAIL PROCESSING
  // ============================================
  export const EMAIL = {
    // Limits
    MAX_THREADS_TO_PROCESS: 50,
    MAX_SENT_EMAILS_TO_ANALYZE: 200,
    MAX_CONTEXT_MESSAGES: 10,
    MAX_RESPONSE_LENGTH: 5000,
    MAX_SUBJECT_LENGTH: 255,
    MIN_EMAIL_LENGTH_FOR_ANALYSIS: 50,
    
    // Search queries
    SEARCH_SENT: 'in:sent',
    SEARCH_LIMIT: 200,
    
    // Patterns
    REPLY_PREFIX: 'Re:',
    FWD_PREFIX: 'Fwd:',
    
    // Defaults
    DEFAULT_RECIPIENT_NAME: '',
    DEFAULT_SIGNATURE: 'Best regards,\\nFranz'
  };

  // ============================================
  // UI CONFIGURATION
  // ============================================
  export const UI = {
    // Card dimensions
    CARD_WIDTH: 600,
    
    // Text limits
    MAX_BUTTON_TEXT_LENGTH: 40,
    MAX_HINT_LENGTH: 200,
    
    // Form field names
    FIELD_API_KEY: 'apiKey',
    FIELD_RESPONSE_MODE: 'responseMode',
    FIELD_AUTO_REPLY: 'autoReply',
    FIELD_FORMALITY_LEVEL: 'formalityLevel',
    FIELD_RESPONSE_LENGTH: 'responseLength',
    FIELD_CUSTOM_INSTRUCTIONS: 'customInstructions',
    FIELD_SIGNATURE: 'signature',
    FIELD_EDITED_RESPONSE: 'editedResponse',
    
    // Button labels
    BUTTON_GENERATE: 'Generate Response',
    BUTTON_SEND: 'Send',
    BUTTON_SAVE_DRAFT: 'Save as Draft',
    BUTTON_SAVE_SETTINGS: 'Save Settings',
    BUTTON_GET_API_KEY: 'Get API Key',
    BUTTON_HELP: 'Help',
    BUTTON_SETTINGS: 'Settings',
    
    // Messages
    MSG_NO_API_KEY: 'Please configure your API key in Settings first',
    MSG_GENERATING: 'Generating response...',
    MSG_PROCESSING: 'Processing...',
    MSG_SUCCESS: 'Success!',
    MSG_ERROR: '⚠️ Error',
    MSG_SETTINGS_SAVED: 'Settings saved successfully!',
    MSG_RESPONSE_GENERATED: 'Response generated!',
    MSG_DRAFT_SAVED: 'Draft saved successfully!',
    MSG_RESPONSE_SENT: 'Response sent successfully!',
    
    // Titles
    TITLE_APP: 'Answer As Me',
    TITLE_SUBTITLE: 'AI-powered email responses',
    TITLE_SETTINGS: 'Settings',
    TITLE_HELP: 'Help',
    TITLE_RESPONSE: 'Generated Response',
    
    // Icons (placeholder for future icon URLs)
    ICON_MAIN: 'https://i.imgur.com/YOUR_ICON_URL.png',
    
    // Notification timeout
    NOTIFICATION_TIMEOUT_MS: 10000
  };

  // ============================================
  // WRITING STYLE ANALYSIS
  // ============================================
  export const STYLE = {
    // Formality levels
    FORMALITY_VERY_CASUAL: 1,
    FORMALITY_CASUAL: 2,
    FORMALITY_NEUTRAL: 3,
    FORMALITY_FORMAL: 4,
    FORMALITY_VERY_FORMAL: 5,
    
    // Formality labels
    FORMALITY_LABELS: [
      'Very Casual',
      'Casual', 
      'Neutral',
      'Formal',
      'Very Formal'
    ],
    
    // Analysis limits
    MAX_GREETINGS: 5,
    MAX_CLOSINGS: 5,
    MAX_PATTERNS: 10,
    MAX_VOCABULARY: 50,
    
    // Sentence analysis
    MIN_SENTENCE_LENGTH: 3,
    DEFAULT_AVG_SENTENCE_LENGTH: 15,
    
    // Pattern thresholds
    MIN_PATTERN_FREQUENCY: 2,
    MIN_WORD_LENGTH: 3,
    MIN_WORD_FREQUENCY: 3,
    
    // Default style values
    DEFAULT_GREETINGS: ['Hi', 'Hello', 'Hey'],
    DEFAULT_CLOSINGS: ['Best regards', 'Thanks', 'Cheers'],
    DEFAULT_PUNCTUATION: 'standard',
    
    // Punctuation styles
    PUNCTUATION_MINIMAL: 'minimal',
    PUNCTUATION_STANDARD: 'standard',
    PUNCTUATION_EXPRESSIVE: 'expressive'
  };

  // ============================================
  // PROPERTY KEYS
  // ============================================
  export const PROPERTIES = {
    PREFIX: 'AAM_',
    
    // Settings keys
    API_KEY: 'AAM_API_KEY',
    RESPONSE_MODE: 'AAM_RESPONSE_MODE',
    AUTO_REPLY: 'AAM_AUTO_REPLY',
    FORMALITY_LEVEL: 'AAM_FORMALITY_LEVEL',
    RESPONSE_LENGTH: 'AAM_RESPONSE_LENGTH',
    CUSTOM_INSTRUCTIONS: 'AAM_CUSTOM_INSTRUCTIONS',
    SIGNATURE: 'AAM_SIGNATURE',
    
    // Cache keys
    WRITING_STYLE: 'AAM_WRITING_STYLE',
    LAST_ANALYSIS: 'AAM_LAST_ANALYSIS',
    USER_PROFILE: 'AAM_USER_PROFILE',
    
    // Cache duration
    STYLE_CACHE_DAYS: 7,
    
    // Prompts system keys
    PROMPTS_DOC_ID: 'AAM_PROMPTS_DOC_ID',
    PROMPTS_CACHE: 'AAM_PROMPTS_CACHE',
    PROMPTS_VERSION: 'AAM_PROMPTS_VERSION',
    PROMPTS_LAST_CHECK: 'AAM_PROMPTS_LAST_CHECK'
  };

  // ============================================
  // REGEX PATTERNS
  // ============================================
  export const PATTERNS = {
    // Email patterns
    EMAIL_ADDRESS: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    EMAIL_WITH_NAME: /^(.+?)\s*<(.+@.+)>$/,
    
    // Greeting patterns  
    GREETING: /^(hi|hello|hey|dear|good\s+(morning|afternoon|evening))/i,
    
    // Closing patterns
    CLOSING: /(regards|best|sincerely|thanks|cheers|kind regards)/i,
    CLOSING_MULTIWORD: /(kind regards|warm regards|best regards|all the best|many thanks)/i,
    
    // Question patterns
    QUESTION: /\?|^(what|where|when|why|how|who|which|could|would|should|can|will)/i,
    
    // Action patterns
    ACTION_REQUEST: /(please|could you|can you|would you|will you|need to|have to|must)/i,
    
    // Deadline patterns
    DEADLINE: /(by|before|until|due|deadline|submit)/i,
    DATE_PATTERN: /\b(\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i,
    
    // Priority indicators
    URGENT: /urgent|asap|immediately|critical|high priority/i,
    LOW_PRIORITY: /fyi|no rush|when you get a chance|low priority/i,
    
    // Signature patterns
    SIGNATURE_SEPARATOR: /--\s*\n/,
    SENT_FROM_DEVICE: /Sent from my/i,
    GET_APP: /Get (Outlook|Gmail) for/i,
    
    // Redaction patterns
    API_KEY: /\b[A-Za-z0-9]{32,}\b/g,
    
    // Whitespace
    MULTIPLE_SPACES: /\s+/g,
    EMPTY_LINES: /\n\s*\n/g,
    TRIM_PATTERN: /^\s+|\s+$/g
  };

  // ============================================
  // ERROR CODES
  // ============================================
  export const ERRORS = {
    // Error codes
    NO_API_KEY: 'NO_API_KEY',
    API_ERROR: 'API_ERROR',
    NO_MESSAGE: 'NO_MESSAGE',
    NO_RESPONSE: 'NO_RESPONSE',
    NETWORK_ERROR: 'NETWORK_ERROR',
    RATE_LIMIT: 'RATE_LIMIT',
    AUTH_ERROR: 'AUTH_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    PROMPT_DOC_CREATE_FAILED: 'PROMPT_DOC_CREATE_FAILED',
    
    // Error messages
    MSG_API_KEY_REQUIRED: 'API key not configured',
    MSG_NO_MESSAGE_FOUND: 'No message found',
    MSG_NO_RESPONSE_TEXT: 'Response text is empty',
    MSG_NETWORK_FAILED: 'Network request failed',
    MSG_RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    MSG_UNEXPECTED: 'An unexpected error occurred',
    MSG_PERMISSION_DENIED: 'Permission denied',
    
    // User-friendly messages
    USER_MSG_API_KEY: 'Please set your API key first',
    USER_MSG_NO_MESSAGE: 'Please select an email first',
    USER_MSG_GENERATION_FAILED: 'Failed to generate response',
    USER_MSG_NETWORK: 'Network error. Please try again.',
    USER_MSG_RATE_LIMIT: 'Too many requests. Please wait a moment.'
  };

  // ============================================
  // LOGGING
  // ============================================
  export const LOG = {
    // Log levels
    LEVEL_DEBUG: 0,
    LEVEL_INFO: 1,
    LEVEL_WARN: 2,
    LEVEL_ERROR: 3,
    
    // Log prefixes
    PREFIX_DEBUG: '[DEBUG]',
    PREFIX_INFO: '[INFO]',
    PREFIX_WARN: '[WARN]',
    PREFIX_ERROR: '[ERROR]',
    
    // Redacted placeholders
    REDACTED_EMAIL: '[EMAIL]',
    REDACTED_API_KEY: '[REDACTED]',
    REDACTED_NAME: '[NAME]'
  };


  // ============================================
  // TIMING AND PERFORMANCE
  // ============================================
  export const TIMING = {
    // Delays and timeouts
    RETRY_INITIAL_DELAY_MS: 1000,
    RETRY_MAX_DELAY_MS: 16000,
    RETRY_MULTIPLIER: 2,
    DEFAULT_RETRY_COUNT: 3,
    
    // Performance thresholds
    MAX_EXECUTION_TIME_MS: 30000,
    STYLE_ANALYSIS_TIMEOUT_MS: 10000,
    RESPONSE_GENERATION_TIMEOUT_MS: 5000,
    
    // Cache durations
    STYLE_CACHE_HOURS: 168, // 7 days
    SETTINGS_CACHE_MINUTES: 60,
    PROMPT_CACHE_TTL: 3600000, // 1 hour in milliseconds
    PROMPT_UPDATE_CHECK_INTERVAL: 300000 // 5 minutes in milliseconds
  };

  // ============================================
  // RESPONSE MODES AND LENGTHS
  // ============================================
  export const RESPONSE = {
    // Response modes
    MODE_DRAFT: 'draft',
    MODE_SEND: 'send',
    MODE_PREVIEW: 'preview',
    
    // Response lengths
    LENGTH_SHORT: 'short',
    LENGTH_MEDIUM: 'medium',
    LENGTH_LONG: 'long',
    
    // Length descriptions
    LENGTH_DESCRIPTIONS: {
      short: '1-2 sentences',
      medium: '3-5 sentences',
      long: '6+ sentences'
    }
  };

  // ============================================
  // VALIDATION
  // ============================================
  export const VALIDATION = {
    // Field lengths
    MIN_API_KEY_LENGTH: 20,
    MAX_API_KEY_LENGTH: 100,
    MAX_INSTRUCTIONS_LENGTH: 500,
    MAX_SIGNATURE_LENGTH: 200,
    
    // Email validation
    MIN_EMAIL_LENGTH: 3,
    MAX_EMAIL_LENGTH: 254,
    
    // Name validation
    MAX_NAME_LENGTH: 100,
    
    // Numeric ranges
    MIN_FORMALITY: 1,
    MAX_FORMALITY: 5,
    MIN_SENTENCE_COUNT: 1,
    MAX_SENTENCE_COUNT: 20
  };

  // ============================================
  // METADATA
  // ============================================
  export const METADATA = {
    // App info
    APP_NAME: 'Answer As Me',
    APP_DESCRIPTION: 'AI-powered email responses in your style',
    APP_VERSION: '{{VERSION}}',
    DEPLOY_TIME: '{{DEPLOY_TIME}}',
    
    // URLs
    API_KEY_URL: 'https://makersuite.google.com/app/apikey',
    HELP_URL: 'https://github.com/franzenzenhofer/answer-as-me',
    
    // File names
    BUNDLE_FILENAME: 'Code.gs',
    MANIFEST_FILENAME: 'appsscript.json',
    
    // Build info placeholders
    VERSION_PLACEHOLDER: '{{VERSION}}',
    DEPLOY_TIME_PLACEHOLDER: '{{DEPLOY_TIME}}'
  };

  // ============================================
  // PROMPTS SYSTEM
  // ============================================
  export const PROMPTS = {
    // Document settings
    DOC_TITLE_PREFIX: 'Answer As Me - Prompt:',
    DEFAULT_VERSION: '1.0.0',
    
    // Prompt types (each gets its own doc)
    TYPES: {
      ASSISTANT_IDENTITY: 'ASSISTANT_IDENTITY',
      STYLE_ANALYSIS: 'STYLE_ANALYSIS', 
      RESPONSE_GENERATION: 'RESPONSE_GENERATION',
      STYLE_IMPROVEMENT: 'STYLE_IMPROVEMENT',
      THREAD_LEARNING: 'THREAD_LEARNING',
      ERROR_CONTEXT: 'ERROR_CONTEXT'
    },
    
    // Document names  
    DOC_NAMES: {
      ASSISTANT_IDENTITY: 'Assistant Identity',
      STYLE_ANALYSIS: 'Style Analysis',
      RESPONSE_GENERATION: 'Response Generation',
      STYLE_IMPROVEMENT: 'Style Improvement',
      THREAD_LEARNING: 'Thread Learning',
      ERROR_CONTEXT: 'Error Context'
    } as { [key: string]: string },
    
    // Cache settings
    CACHE_PREFIX: 'AAM_PROMPT_CACHE_',
    DOC_ID_PREFIX: 'AAM_PROMPT_DOC_',
    VERSION_PREFIX: 'AAM_PROMPT_VERSION_',
    
    // Update settings
    AUTO_CHECK_ENABLED: true,
    VERSION_CHECK_HEADER: '## Version:',
    
    // Placeholder patterns
    VARIABLE_PATTERN: /\{\{(\w+)\}\}/g,
    
    // Fallback behavior
    USE_MINIMAL_FALLBACK: true,
    FALLBACK_WARNING: 'Using fallback prompt - please configure Google Docs'
  };

  // ============================================
  // ARRAYS AND LISTS
  // ============================================
  export const LISTS = {
    // Common stop words for vocabulary analysis
    STOP_WORDS: [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
      'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
      'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
      'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
      'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
      'take', 'people', 'into', 'year', 'your', 'good', 'some',
      'could', 'them', 'see', 'other', 'than', 'then', 'now',
      'look', 'only', 'come', 'its', 'over', 'think', 'also',
      'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
      'well', 'way', 'even', 'new', 'want', 'because', 'any',
      'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are',
      'been', 'has', 'had', 'were', 'been', 'have', 'has', 'had'
    ],
    
    // Formal indicators
    FORMAL_INDICATORS: [
      'respectfully', 'furthermore', 'moreover', 'nevertheless',
      'consequently', 'therefore', 'hereby', 'whereas', 'pursuant',
      'regarding', 'concerning', 'dr.', 'mr.', 'mrs.', 'ms.', 'prof.'
    ],
    
    // Casual indicators
    CASUAL_INDICATORS: [
      'hey', 'yo', 'sup', 'gonna', 'wanna', 'gotta', 'yeah',
      'yep', 'nope', 'ok', 'okay', 'cool', 'awesome', 'lol',
      'btw', 'fyi', 'asap', 'thx', 'thanks!', '!!', '???'
    ]
  };
}