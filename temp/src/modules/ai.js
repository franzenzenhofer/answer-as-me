"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var AI;
(function (AI) {
    /**
     * Test API key with simple request - SUPER DEBUGGABLE
     */
    function testApiKey(apiKey) {
        var startTime = Date.now();
        DebugLogger.logAI('REQUEST', 'AI.testApiKey', 'Say "API key works!"', {
            apiKey: "".concat(apiKey.substring(0, 8), "...").concat(apiKey.slice(-4)),
            length: apiKey.length,
            isValid: apiKey.startsWith('AIza'),
            purpose: 'API_KEY_TEST'
        });
        AppLogger.info('🧪 TESTING API KEY', {
            key: "".concat(apiKey.substring(0, 8), "...").concat(apiKey.slice(-4)),
            length: apiKey.length,
            isValid: apiKey.startsWith('AIza'),
            timestamp: new Date().toISOString()
        });
        var testResult = callGeminiAPI('Say "API key works!"', apiKey);
        var duration = Date.now() - startTime;
        if (testResult.success) {
            DebugLogger.logAI('RESPONSE', 'AI.testApiKey', testResult.response || 'success', {
                success: true,
                duration: duration,
                purpose: 'API_KEY_TEST'
            });
            AppLogger.info('✅ API KEY TEST PASSED', testResult);
            return { success: true };
        }
        else {
            DebugLogger.logAI('RESPONSE', 'AI.testApiKey', testResult.error || 'failed', {
                success: false,
                duration: duration,
                error: testResult.error,
                purpose: 'API_KEY_TEST'
            });
            AppLogger.error('❌ API KEY TEST FAILED', testResult);
            return { success: false, error: testResult.error };
        }
    }
    AI.testApiKey = testApiKey;
    /**
     * Call Gemini API with enhanced features - SUPER DEBUGGABLE
     * - Strict JSON mode
     * - Google Search grounding
     * - Code execution
     */
    function callGeminiAPI(prompt, apiKey, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        var startTime = Date.now();
        var requestId = Utilities.getUuid().substring(0, 8);
        // Log the request with comprehensive details
        DebugLogger.logAI('REQUEST', 'AI.callGeminiAPI', prompt, {
            requestId: requestId,
            apiKey: "".concat(apiKey.substring(0, 8), "...").concat(apiKey.slice(-4)),
            options: options,
            promptLength: prompt.length,
            timestamp: new Date().toISOString()
        });
        // Validate API key
        var keyValidation = validateApiKey(apiKey);
        if (!keyValidation.isValid) {
            var duration = Date.now() - startTime;
            var error = keyValidation.error || Constants.ERRORS.MSG_API_KEY_REQUIRED;
            DebugLogger.logAI('RESPONSE', 'AI.callGeminiAPI', error, {
                requestId: requestId,
                success: false,
                duration: duration,
                error: error,
                validationFailed: true
            });
            return {
                success: false,
                error: error
            };
        }
        try {
            // Build generation config
            var generationConfig = {
                temperature: Config.API_TEMPERATURE,
                maxOutputTokens: Config.API_MAX_TOKENS,
                topK: Constants.API.TOP_K,
                topP: Constants.API.TOP_P
            };
            // Enable strict JSON mode if requested
            if (options === null || options === void 0 ? void 0 : options.jsonMode) {
                generationConfig.response_mime_type = 'application/json';
                // Add response schema if provided
                if (options.responseSchema) {
                    generationConfig.response_schema = options.responseSchema;
                }
            }
            // Build tools array
            var tools = [];
            // Add Google Search grounding if enabled
            if (options === null || options === void 0 ? void 0 : options.enableGrounding) {
                tools.push({ google_search: {} });
            }
            // Add code execution if enabled
            if (options === null || options === void 0 ? void 0 : options.enableCodeExecution) {
                tools.push({ code_execution: {} });
            }
            // Build payload
            var payload = {
                contents: [{
                        parts: [{
                                text: prompt
                            }]
                    }],
                generationConfig: generationConfig
            };
            // Add tools if any are enabled
            if (tools.length > 0) {
                payload.tools = tools;
            }
            // CRITICAL FIX: Use URL parameter auth for Apps Script compatibility
            var urlWithKey_1 = "".concat(Config.GEMINI_API_URL, "?key=").concat(apiKey);
            var requestOptions_1 = {
                method: Constants.API.HTTP_METHOD_POST,
                contentType: Constants.API.CONTENT_TYPE_JSON,
                payload: JSON.stringify(payload),
                muteHttpExceptions: true
            };
            AppLogger.info('🚀 Calling Gemini API (URL param auth)', {
                url: Config.GEMINI_API_URL,
                apiKey: "".concat(apiKey.substring(0, 8), "...").concat(apiKey.slice(-4)),
                jsonMode: options === null || options === void 0 ? void 0 : options.jsonMode,
                grounding: options === null || options === void 0 ? void 0 : options.enableGrounding,
                codeExecution: options === null || options === void 0 ? void 0 : options.enableCodeExecution,
                payloadSize: JSON.stringify(payload).length,
                authMethod: 'URL_PARAMETER'
            });
            // Use retry logic with timeout monitoring
            var response = Utils.retryWithBackoff(function () { return Utils.fetchWithTimeout(urlWithKey_1, requestOptions_1); }, 3, // max retries
            1000 // initial delay
            );
            var responseCode = response.getResponseCode();
            if (responseCode !== Constants.API.STATUS_OK) {
                var errorContent = response.getContentText();
                AppLogger.error("Gemini API error: ".concat(responseCode), errorContent);
                // Parse error response for detailed message
                var errorMessage = "API error: ".concat(responseCode);
                try {
                    var errorData = JSON.parse(errorContent);
                    if (errorData.error) {
                        var apiError = errorData.error;
                        // Provide specific error messages based on error type
                        switch (responseCode) {
                            case 400:
                                if (apiError.message.includes('API_KEY_INVALID')) {
                                    errorMessage = 'Invalid API key. Please check your API key in Settings.';
                                }
                                else if (apiError.message.includes('REQUEST_SIZE')) {
                                    errorMessage = 'Email content too large. Try a shorter email.';
                                }
                                else {
                                    errorMessage = "Bad request: ".concat(apiError.message);
                                }
                                break;
                            case 401:
                                errorMessage = 'API key not authorized. Please check your API key is active.';
                                break;
                            case 403:
                                if (apiError.message.includes('PERMISSION_DENIED')) {
                                    errorMessage = 'Permission denied. Check API key permissions.';
                                }
                                else if (apiError.message.includes('BILLING')) {
                                    errorMessage = 'Billing not enabled for this API key.';
                                }
                                else if (apiError.message.includes('LOCATION')) {
                                    errorMessage = 'Gemini API not available in your location.';
                                }
                                else {
                                    errorMessage = "Access forbidden: ".concat(apiError.message);
                                }
                                break;
                            case 429:
                                errorMessage = 'Too many requests. Please wait a moment and try again.';
                                break;
                            case 500:
                            case 502:
                            case 503:
                                errorMessage = 'Google server error. Please try again in a few minutes.';
                                break;
                            default:
                                errorMessage = apiError.message || "API error: ".concat(responseCode);
                        }
                    }
                }
                catch (parseError) {
                    // If we can't parse the error, use the response code
                    AppLogger.warn('Could not parse API error response', parseError);
                }
                return {
                    success: false,
                    error: errorMessage
                };
            }
            // Parse response with error boundary
            var result = void 0;
            try {
                result = JSON.parse(response.getContentText());
            }
            catch (parseError) {
                AppLogger.error('Failed to parse Gemini API response', {
                    error: parseError,
                    responseText: response.getContentText().substring(0, 500)
                });
                return {
                    success: false,
                    error: 'Invalid JSON response from API'
                };
            }
            var isApiResponse = function (obj) {
                return typeof obj === 'object' && obj !== null;
            };
            if (!isApiResponse(result)) {
                return {
                    success: false,
                    error: 'Invalid API response format'
                };
            }
            // Check for API-level errors
            if (result.error) {
                AppLogger.error('Gemini API returned error', result.error);
                return {
                    success: false,
                    error: result.error.message || 'API error'
                };
            }
            // Extract text from response
            var text = (_e = (_d = (_c = (_b = (_a = result.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
            if (!text) {
                AppLogger.warn('No text in Gemini response', {
                    hassCandidates: !!result.candidates,
                    candidatesLength: (_f = result.candidates) === null || _f === void 0 ? void 0 : _f.length,
                    finishReason: (_h = (_g = result.candidates) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.finishReason
                });
                return {
                    success: false,
                    error: Constants.ERRORS.MSG_NO_RESPONSE_TEXT
                };
            }
            // If grounding was used, extract grounding metadata
            var groundingMetadata = null;
            if ((options === null || options === void 0 ? void 0 : options.enableGrounding) && ((_k = (_j = result.candidates) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.groundingMetadata)) {
                groundingMetadata = result.candidates[0].groundingMetadata;
                AppLogger.info('Grounding metadata available', {
                    searchQueries: ((_l = groundingMetadata.webSearchQueries) === null || _l === void 0 ? void 0 : _l.length) || 0
                });
            }
            var duration = Date.now() - startTime;
            var responseLength = text.length;
            // Log successful response
            DebugLogger.logAI('RESPONSE', 'AI.callGeminiAPI', text.substring(0, 500) + (text.length > 500 ? '...' : ''), {
                requestId: requestId,
                success: true,
                duration: duration,
                responseLength: responseLength,
                confidence: ((_q = (_p = (_o = (_m = result.candidates) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.safetyRatings) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.probability) || 1,
                finishReason: (_s = (_r = result.candidates) === null || _r === void 0 ? void 0 : _r[0]) === null || _s === void 0 ? void 0 : _s.finishReason,
                hasGrounding: !!groundingMetadata
            });
            return {
                success: true,
                response: text,
                confidence: ((_w = (_v = (_u = (_t = result.candidates) === null || _t === void 0 ? void 0 : _t[0]) === null || _u === void 0 ? void 0 : _u.safetyRatings) === null || _v === void 0 ? void 0 : _v[0]) === null || _w === void 0 ? void 0 : _w.probability) || 1
            };
        }
        catch (error) {
            var duration = Date.now() - startTime;
            var errorMessage = error instanceof Error ? error.message : String(error);
            // Log the error with full context
            DebugLogger.logError('AI.callGeminiAPI', error instanceof Error ? error : String(error), {
                requestId: requestId,
                duration: duration,
                prompt: "".concat(prompt.substring(0, 200), "..."),
                options: options
            }, 'AI request failed - user cannot generate email responses');
            // Check if error is timeout-related
            if (errorMessage.toLowerCase().includes('timeout') ||
                errorMessage.toLowerCase().includes('timed out')) {
                AppLogger.error('API request timed out', {
                    error: errorMessage,
                    url: Config.GEMINI_API_URL
                });
                return {
                    success: false,
                    error: 'Request timed out. Check your internet connection and try again.'
                };
            }
            // Check for network errors
            if (errorMessage.toLowerCase().includes('fetch failed') ||
                errorMessage.toLowerCase().includes('network') ||
                errorMessage.toLowerCase().includes('dns')) {
                AppLogger.error('Network error', {
                    error: errorMessage,
                    url: Config.GEMINI_API_URL
                });
                return {
                    success: false,
                    error: 'Network error. Please check your internet connection.'
                };
            }
            // Check for SSL/certificate errors
            if (errorMessage.toLowerCase().includes('ssl') ||
                errorMessage.toLowerCase().includes('certificate')) {
                AppLogger.error('SSL error', {
                    error: errorMessage,
                    url: Config.GEMINI_API_URL
                });
                return {
                    success: false,
                    error: 'Security error. Please check your network settings.'
                };
            }
            AppLogger.error('Gemini API call failed', error);
            return {
                success: false,
                error: "Error: ".concat(errorMessage, ". Please try again or contact support.")
            };
        }
    }
    AI.callGeminiAPI = callGeminiAPI;
    /**
     * Generate email response
     */
    function generateEmailResponse(context, style, userProfile, apiKey) {
        try {
            var prompt = Prompts.getResponseGenerationPrompt(context, style, userProfile, Config.getSettings().customInstructions);
            // Use standard mode for email generation (not JSON)
            return callGeminiAPI(prompt, apiKey, {
                enableGrounding: true // Enable grounding for more accurate responses
            });
        }
        catch (error) {
            AppLogger.error('Failed to generate response', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    AI.generateEmailResponse = generateEmailResponse;
    /**
     * Analyze writing style with robust error handling
     */
    function analyzeWritingStyle(emails, apiKey) {
        var _a, _b;
        // Validate inputs first
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            AppLogger.warn('No emails provided for style analysis');
            return null;
        }
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
            AppLogger.warn('No valid API key provided for style analysis');
            return null;
        }
        try {
            // Filter and validate email content
            var validEmails = emails.filter(function (email) {
                return email && typeof email === 'string' && email.trim().length > 10;
            });
            if (validEmails.length === 0) {
                AppLogger.warn('No valid email content for style analysis');
                return null;
            }
            var prompt = Prompts.getStyleAnalysisPrompt(Session.getActiveUser().getEmail());
            var combinedEmails = validEmails.join('\n\n---\n\n');
            var fullPrompt = "".concat(prompt, "\n\nEmails to analyze:\n").concat(combinedEmails);
            // Use simple schema generation with error handling
            var responseSchema = void 0;
            try {
                responseSchema = JsonValidator.createWritingStyleSchema();
            }
            catch (schemaError) {
                AppLogger.error('Failed to create response schema', schemaError);
                return null;
            }
            var response = callGeminiAPI(fullPrompt, apiKey, {
                jsonMode: true,
                responseSchema: responseSchema,
                enableCodeExecution: true // Can help with analyzing patterns
            });
            if (!response.success || !response.response) {
                AppLogger.error('Style analysis API call failed', response.error);
                return null;
            }
            // Parse and validate the response with comprehensive error handling
            var parsed = void 0;
            try {
                parsed = JsonValidator.parseJson(response.response, 'Writing Style Analysis');
                if (!parsed) {
                    throw new Error('JSON parser returned null/undefined');
                }
            }
            catch (parseError) {
                AppLogger.error('Failed to parse style analysis response', {
                    error: parseError,
                    responseText: (_a = response.response) === null || _a === void 0 ? void 0 : _a.substring(0, 500),
                    responseLength: (_b = response.response) === null || _b === void 0 ? void 0 : _b.length
                });
                return null;
            }
            // Validate and provide defaults with error handling
            try {
                var validatedStyle = JsonValidator.validateWritingStyle(parsed);
                if (validatedStyle) {
                    AppLogger.info('Successfully analyzed writing style from emails');
                    return validatedStyle;
                }
                else {
                    AppLogger.warn('Style validation returned null');
                    return null;
                }
            }
            catch (validationError) {
                AppLogger.error('Failed to validate writing style', validationError);
                return null;
            }
        }
        catch (error) {
            AppLogger.error('Unexpected error in style analysis', {
                error: error,
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            return null;
        }
    }
    AI.analyzeWritingStyle = analyzeWritingStyle;
    /**
     * Create a default writing style - bulletproof fallback
     */
    function createDefaultWritingStyle() {
        return {
            greetings: [
                'Hi',
                'Hello',
                'Good morning',
                'Good afternoon',
                'Dear'
            ],
            closings: [
                'Best regards',
                'Thanks',
                'Kind regards',
                'Cheers',
                'Best'
            ],
            sentencePatterns: [
                'I hope this email finds you well.',
                'Thank you for your message.',
                'I wanted to follow up on',
                'Please let me know if you have any questions.'
            ],
            vocabulary: [
                'please',
                'thank you',
                'regarding',
                'following up',
                'appreciate',
                'understand',
                'available',
                'discuss'
            ],
            formalityLevel: 3, // Medium formality (1-5 scale)
            averageSentenceLength: 15,
            emailLength: 'medium',
            punctuationStyle: 'standard'
        };
    }
    /**
     * Get writing style - BULLETPROOF version that ALWAYS returns a valid style
     * KISS principle: Keep it simple, always work
     */
    function getWritingStyle() {
        var e_1, _a;
        var config = Config.getSettings();
        // Step 1: Try to get cached style (safest option)
        try {
            var cached = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
            if (cached) {
                var parsedCache = JSON.parse(cached);
                // Validate cached data structure
                if (parsedCache && typeof parsedCache === 'object' &&
                    Array.isArray(parsedCache.greetings) && Array.isArray(parsedCache.closings) &&
                    typeof parsedCache.formalityLevel === 'number') {
                    AppLogger.info('Using cached writing style');
                    return parsedCache;
                }
                AppLogger.warn('Invalid cached writing style, will regenerate');
            }
        }
        catch (error) {
            AppLogger.warn('Failed to parse cached writing style', error);
            // Continue to next step - don't fail
        }
        // Step 2: Try to analyze recent emails (if API key is available)
        if (config.apiKey) {
            try {
                var emails = GmailService.getRecentSentEmails(Constants.EMAIL.MAX_SENT_EMAILS_TO_ANALYZE);
                if (emails && emails.length > 0) {
                    // Safely extract email bodies with validation
                    var emailBodies = [];
                    try {
                        for (var emails_1 = __values(emails), emails_1_1 = emails_1.next(); !emails_1_1.done; emails_1_1 = emails_1.next()) {
                            var email = emails_1_1.value;
                            if (email && typeof email === 'object' && email.body && typeof email.body === 'string' && email.body.trim().length > 10) {
                                emailBodies.push(email.body);
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (emails_1_1 && !emails_1_1.done && (_a = emails_1.return)) _a.call(emails_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    if (emailBodies.length > 0) {
                        var style = analyzeWritingStyle(emailBodies, config.apiKey);
                        if (style) {
                            // Cache the successful result
                            try {
                                PropertyManager.setProperty(Constants.PROPERTIES.WRITING_STYLE, JSON.stringify(style), 'user');
                                AppLogger.info('Successfully analyzed and cached writing style');
                                return style;
                            }
                            catch (cacheError) {
                                AppLogger.warn('Failed to cache writing style but analysis succeeded', cacheError);
                                return style; // Still return the analyzed style even if caching failed
                            }
                        }
                    }
                    else {
                        AppLogger.info('No valid email bodies found for analysis');
                    }
                }
                else {
                    AppLogger.info('No sent emails available for style analysis');
                }
            }
            catch (error) {
                AppLogger.warn('Failed to analyze writing style from emails', error);
                // Continue to default - don't fail
            }
        }
        else {
            AppLogger.info('No API key configured, using default writing style');
        }
        // Step 3: ALWAYS return a default style (bulletproof fallback)
        AppLogger.info('Using default writing style');
        var defaultStyle = createDefaultWritingStyle();
        // Try to cache the default style for future use
        try {
            PropertyManager.setProperty(Constants.PROPERTIES.WRITING_STYLE, JSON.stringify(defaultStyle), 'user');
        }
        catch (cacheError) {
            AppLogger.warn('Failed to cache default writing style', cacheError);
            // Continue - not critical
        }
        return defaultStyle;
    }
    AI.getWritingStyle = getWritingStyle;
    /**
     * Improve user profile from thread with JSON mode
     */
    function improveProfileFromThread(currentProfile, threadContent, apiKey) {
        var _a;
        try {
            var prompt = Prompts.getStyleImprovementPrompt(currentProfile, threadContent);
            // Use simple schema generation
            var responseSchema = JsonValidator.createUserProfileSchema();
            var response = callGeminiAPI(prompt, apiKey, {
                jsonMode: true,
                responseSchema: responseSchema,
                enableGrounding: true // Help with understanding context
            });
            if (!response.success || !response.response) {
                return null;
            }
            // Parse and validate the response with error boundary
            var parsed = void 0;
            try {
                parsed = JsonValidator.parseJson(response.response, 'User Profile Improvement');
                if (!parsed) {
                    throw new Error('Failed to parse JSON response');
                }
            }
            catch (parseError) {
                AppLogger.error('Failed to parse profile improvement response', {
                    error: parseError,
                    responseText: (_a = response.response) === null || _a === void 0 ? void 0 : _a.substring(0, 500)
                });
                return null;
            }
            // Validate and return
            return JsonValidator.validateUserProfile(parsed);
        }
        catch (error) {
            AppLogger.error('Profile improvement failed', error);
            return null;
        }
    }
    AI.improveProfileFromThread = improveProfileFromThread;
    /**
     * Validate Gemini API key format
     */
    function validateApiKey(apiKey) {
        if (!apiKey) {
            return { isValid: false, error: 'API key is required' };
        }
        if (typeof apiKey !== 'string') {
            return { isValid: false, error: 'API key must be a string' };
        }
        // Remove any whitespace
        var trimmedKey = apiKey.trim();
        if (trimmedKey.length === 0) {
            return { isValid: false, error: 'API key cannot be empty' };
        }
        // Check if it's a masked key (from UI)
        if (trimmedKey.startsWith(Constants.API.KEY_MASK)) {
            return { isValid: false, error: 'Please enter a valid API key (not masked)' };
        }
        // Validate Gemini API key format
        // Google API keys typically start with 'AIza' and are ~39 characters
        if (!trimmedKey.match(/^AIza[0-9A-Za-z\-_]{35}$/)) {
            return { isValid: false, error: 'Invalid API key format. Google Gemini API keys start with "AIza" and are 39 characters long.' };
        }
        return { isValid: true };
    }
    AI.validateApiKey = validateApiKey;
})(AI || (AI = {}));
//# sourceMappingURL=ai.js.map