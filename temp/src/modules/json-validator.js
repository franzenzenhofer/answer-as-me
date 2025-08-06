"use strict";
/**
 * JSON Validator Module
 * Simple, modular validation for AI responses - KISS principle
 * No external dependencies - works perfectly in Google Apps Script
 */
var JsonValidator;
(function (JsonValidator) {
    /**
     * Validate and parse JSON safely
     */
    function parseJson(jsonString, context) {
        if (!jsonString || typeof jsonString !== 'string') {
            AppLogger.error("Invalid JSON input in ".concat(context), {
                type: typeof jsonString,
                value: jsonString
            });
            return null;
        }
        try {
            // Remove any BOM or invalid characters at the start
            var cleanJson = jsonString.trim().replace(/^\uFEFF/, '');
            // Basic validation
            if (!cleanJson.startsWith('{') && !cleanJson.startsWith('[')) {
                AppLogger.error("JSON does not start with { or [ in ".concat(context), {
                    start: cleanJson.substring(0, 50)
                });
                return null;
            }
            return JSON.parse(cleanJson);
        }
        catch (error) {
            // Log detailed error information
            var errorDetails = {
                message: error instanceof Error ? error.message : String(error),
                context: context,
                jsonLength: jsonString.length
            };
            // Try to find the error position
            if (error instanceof SyntaxError && error.message.includes('position')) {
                var match = error.message.match(/position (\d+)/);
                if (match && match[1]) {
                    var position = parseInt(match[1]);
                    errorDetails.errorPosition = position;
                    errorDetails.nearError = jsonString.substring(Math.max(0, position - 50), Math.min(jsonString.length, position + 50));
                }
            }
            AppLogger.error("JSON parse failed in ".concat(context), errorDetails);
            return null;
        }
    }
    JsonValidator.parseJson = parseJson;
    /**
     * Validate writing style response
     */
    function validateWritingStyle(data) {
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
    JsonValidator.validateWritingStyle = validateWritingStyle;
    /**
     * Validate user profile response
     */
    function validateUserProfile(data) {
        if (!data || typeof data !== 'object' || !data.email) {
            AppLogger.error('User profile validation failed: missing required fields');
            return null;
        }
        var profile = {
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
    JsonValidator.validateUserProfile = validateUserProfile;
    /**
     * Create response schema for Gemini API
     */
    function createWritingStyleSchema() {
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
    JsonValidator.createWritingStyleSchema = createWritingStyleSchema;
    /**
     * Create response schema for user profile
     */
    function createUserProfileSchema() {
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
    JsonValidator.createUserProfileSchema = createUserProfileSchema;
    // Simple helper validators
    function isValidNumber(value, min, max) {
        return typeof value === 'number' && value >= min && value <= max;
    }
    function isValidEmailLength(value) {
        return value === 'short' || value === 'medium' || value === 'long';
    }
    function isValidPunctuationStyle(value) {
        return value === 'minimal' || value === 'standard' || value === 'expressive';
    }
})(JsonValidator || (JsonValidator = {}));
//# sourceMappingURL=json-validator.js.map