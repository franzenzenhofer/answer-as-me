"use strict";
var Config;
(function (Config) {
    // Version info - injected during build
    Config.VERSION = Constants.METADATA.VERSION_PLACEHOLDER;
    Config.DEPLOY_TIME = Constants.METADATA.DEPLOY_TIME_PLACEHOLDER;
    // App metadata
    Config.APP_NAME = Constants.METADATA.APP_NAME;
    Config.APP_DESCRIPTION = Constants.METADATA.APP_DESCRIPTION;
    // API configuration
    Config.GEMINI_API_URL = "".concat(Constants.API.GEMINI_BASE_URL, "/").concat(Constants.API.GEMINI_VERSION, "/models/").concat(Constants.API.GEMINI_MODEL, ":").concat(Constants.API.GEMINI_ENDPOINT);
    Config.API_TEMPERATURE = Constants.API.TEMPERATURE;
    Config.API_MAX_TOKENS = Constants.API.MAX_OUTPUT_TOKENS;
    Config.API_TIMEOUT = Constants.API.TIMEOUT_MS;
    // Processing limits
    Config.MAX_THREADS_TO_PROCESS = Constants.EMAIL.MAX_THREADS_TO_PROCESS;
    Config.MAX_SENT_EMAILS_TO_ANALYZE = Constants.EMAIL.MAX_SENT_EMAILS_TO_ANALYZE;
    Config.MAX_CONTEXT_MESSAGES = Constants.EMAIL.MAX_CONTEXT_MESSAGES;
    Config.MAX_RESPONSE_LENGTH = Constants.EMAIL.MAX_RESPONSE_LENGTH;
    // Property keys
    Config.PROPERTY_KEYS = {
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
    Config.DEFAULT_SETTINGS = {
        apiKey: '',
        responseMode: Constants.RESPONSE.MODE_DRAFT,
        autoReply: false,
        formalityLevel: Constants.STYLE.FORMALITY_NEUTRAL,
        responseLength: Constants.RESPONSE.LENGTH_MEDIUM,
        customInstructions: '',
        signature: Constants.EMAIL.DEFAULT_SIGNATURE
    };
    // UI Constants
    Config.UI = {
        CARD_WIDTH: Constants.UI.CARD_WIDTH,
        MAX_BUTTON_TEXT_LENGTH: Constants.UI.MAX_BUTTON_TEXT_LENGTH,
        NOTIFICATION_TIMEOUT: Constants.UI.NOTIFICATION_TIMEOUT_MS / 1000,
        FORMALITY_LABELS: Constants.STYLE.FORMALITY_LABELS
    };
    // Email patterns
    Config.EMAIL_PATTERNS = {
        GREETING: Constants.PATTERNS.GREETING,
        CLOSING: Constants.PATTERNS.CLOSING,
        QUESTION: Constants.PATTERNS.QUESTION
    };
    // System prompts (updated to use available types)
    Config.PROMPTS = {
        SETTINGS: Constants.PROMPTS.TYPES.SETTINGS,
        OVERVIEW: Constants.PROMPTS.TYPES.OVERVIEW,
        THREAD: Constants.PROMPTS.TYPES.THREAD
    };
    /**
     * Get user properties - DEPRECATED: Use PropertyManager instead
     * @deprecated
     */
    function getUserProperties() {
        AppLogger.warn('getUserProperties() is deprecated. Use PropertyManager methods instead.');
        return PropertiesService.getUserProperties();
    }
    Config.getUserProperties = getUserProperties;
    /**
     * Get a specific property with thread safety
     */
    function getProperty(key) {
        return PropertyManager.getProperty(key, 'user') || '';
    }
    Config.getProperty = getProperty;
    /**
     * Set a property with thread safety
     */
    function setProperty(key, value) {
        if (!PropertyManager.setProperty(key, value, 'user')) {
            throw new Error("Failed to set property: ".concat(key));
        }
    }
    Config.setProperty = setProperty;
    /**
     * Get all settings with thread safety
     */
    function getSettings() {
        var allProps = PropertyManager.getAllProperties('user');
        return {
            apiKey: allProps[Config.PROPERTY_KEYS.API_KEY] || Config.DEFAULT_SETTINGS.apiKey,
            responseMode: allProps[Config.PROPERTY_KEYS.RESPONSE_MODE] || Config.DEFAULT_SETTINGS.responseMode,
            autoReply: allProps[Config.PROPERTY_KEYS.AUTO_REPLY] === 'true',
            formalityLevel: parseInt(allProps[Config.PROPERTY_KEYS.FORMALITY_LEVEL] || String(Config.DEFAULT_SETTINGS.formalityLevel)),
            responseLength: allProps[Config.PROPERTY_KEYS.RESPONSE_LENGTH] ||
                Config.DEFAULT_SETTINGS.responseLength,
            customInstructions: allProps[Config.PROPERTY_KEYS.CUSTOM_INSTRUCTIONS] || Config.DEFAULT_SETTINGS.customInstructions,
            signature: allProps[Config.PROPERTY_KEYS.SIGNATURE] || Config.DEFAULT_SETTINGS.signature
        };
    }
    Config.getSettings = getSettings;
    /**
     * Save settings with thread safety
     */
    function saveSettings(settings) {
        var updates = {};
        if (settings.apiKey !== undefined) {
            updates[Config.PROPERTY_KEYS.API_KEY] = settings.apiKey;
        }
        if (settings.responseMode !== undefined) {
            updates[Config.PROPERTY_KEYS.RESPONSE_MODE] = settings.responseMode;
        }
        if (settings.autoReply !== undefined) {
            updates[Config.PROPERTY_KEYS.AUTO_REPLY] = String(settings.autoReply);
        }
        if (settings.formalityLevel !== undefined) {
            updates[Config.PROPERTY_KEYS.FORMALITY_LEVEL] = String(settings.formalityLevel);
        }
        if (settings.responseLength !== undefined) {
            updates[Config.PROPERTY_KEYS.RESPONSE_LENGTH] = settings.responseLength;
        }
        if (settings.customInstructions !== undefined) {
            updates[Config.PROPERTY_KEYS.CUSTOM_INSTRUCTIONS] = settings.customInstructions;
        }
        if (settings.signature !== undefined) {
            updates[Config.PROPERTY_KEYS.SIGNATURE] = settings.signature;
        }
        // Batch update for better performance and atomicity
        if (Object.keys(updates).length > 0) {
            if (!PropertyManager.setProperties(updates, 'user')) {
                throw new Error('Failed to save settings');
            }
        }
    }
    Config.saveSettings = saveSettings;
})(Config || (Config = {}));
//# sourceMappingURL=config.js.map