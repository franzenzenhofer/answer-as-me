namespace AI {
  /**
   * Response schema types for strict JSON mode
   */
  export interface ResponseSchema {
    type: string;
    properties?: { [key: string]: unknown };
    required?: string[];
    items?: unknown;
    enum?: string[];
  }

  /**
   * Tool configuration for Gemini API
   */
  export interface GeminiTool {
    google_search?: {};
    code_execution?: {};
  }

  /**
   * Test API key with simple request - SUPER DEBUGGABLE
   */
  export function testApiKey(apiKey: string): { success: boolean; error?: string } {
    const startTime = Date.now();
    DebugLogger.logAI('REQUEST', 'AI.testApiKey', 'Say "API key works!"', {
      apiKey: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      length: apiKey.length,
      isValid: apiKey.startsWith('AIza'),
      purpose: 'API_KEY_TEST'
    });
    
    AppLogger.info('🧪 TESTING API KEY', {
      key: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      length: apiKey.length,
      isValid: apiKey.startsWith('AIza'),
      timestamp: new Date().toISOString()
    });
    
    const testResult = callGeminiAPI('Say "API key works!"', apiKey);
    const duration = Date.now() - startTime;
    
    if (testResult.success) {
      DebugLogger.logAI('RESPONSE', 'AI.testApiKey', testResult.response || 'success', {
        success: true,
        duration: duration,
        purpose: 'API_KEY_TEST'
      });
      AppLogger.info('✅ API KEY TEST PASSED', testResult);
      return { success: true };
    } else {
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

  /**
   * Call Gemini API with enhanced features - SUPER DEBUGGABLE
   * - Strict JSON mode
   * - Google Search grounding
   * - Code execution
   */
  export function callGeminiAPI(
    prompt: string, 
    apiKey: string,
    options?: {
      jsonMode?: boolean;
      responseSchema?: ResponseSchema;
      enableGrounding?: boolean;
      enableCodeExecution?: boolean;
    }
  ): Types.AIResponse {
    const startTime = Date.now();
    const requestId = Utilities.getUuid().substring(0, 8);
    
    // Log the request with comprehensive details
    DebugLogger.logAI('REQUEST', 'AI.callGeminiAPI', prompt, {
      requestId: requestId,
      apiKey: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      options: options,
      promptLength: prompt.length,
      timestamp: new Date().toISOString()
    });
    
    // Validate API key
    const keyValidation = validateApiKey(apiKey);
    if (!keyValidation.isValid) {
      const duration = Date.now() - startTime;
      const error = keyValidation.error || Constants.ERRORS.MSG_API_KEY_REQUIRED;
      
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
      const generationConfig: Record<string, unknown> = {
        temperature: Config.API_TEMPERATURE,
        maxOutputTokens: Config.API_MAX_TOKENS,
        topK: Constants.API.TOP_K,
        topP: Constants.API.TOP_P
      };

      // Enable strict JSON mode if requested
      if (options?.jsonMode) {
        generationConfig.response_mime_type = 'application/json';
        
        // Add response schema if provided
        if (options.responseSchema) {
          generationConfig.response_schema = options.responseSchema;
        }
      }

      // Build tools array
      const tools: GeminiTool[] = [];
      
      // Add Google Search grounding if enabled
      if (options?.enableGrounding) {
        tools.push({ google_search: {} });
      }
      
      // Add code execution if enabled
      if (options?.enableCodeExecution) {
        tools.push({ code_execution: {} });
      }

      // Build payload
      const payload: Record<string, unknown> = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig
      };

      // Add tools if any are enabled
      if (tools.length > 0) {
        payload.tools = tools;
      }
      
      // CRITICAL FIX: Use URL parameter auth for Apps Script compatibility
      const urlWithKey = `${Config.GEMINI_API_URL}?key=${apiKey}`;
      
      const requestOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: Constants.API.HTTP_METHOD_POST as GoogleAppsScript.URL_Fetch.HttpMethod,
        contentType: Constants.API.CONTENT_TYPE_JSON,
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      AppLogger.info('🚀 Calling Gemini API (URL param auth)', { 
        url: Config.GEMINI_API_URL,
        apiKey: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
        jsonMode: options?.jsonMode,
        grounding: options?.enableGrounding,
        codeExecution: options?.enableCodeExecution,
        payloadSize: JSON.stringify(payload).length,
        authMethod: 'URL_PARAMETER'
      });
      
      // Use retry logic with timeout monitoring
      const response = Utils.retryWithBackoff(
        () => Utils.fetchWithTimeout(urlWithKey, requestOptions),
        3, // max retries
        1000 // initial delay
      );
      
      const responseCode = response.getResponseCode();
      
      if (responseCode !== Constants.API.STATUS_OK) {
        const errorContent = response.getContentText();
        AppLogger.error(`Gemini API error: ${responseCode}`, errorContent);
        
        // Parse error response for detailed message
        let errorMessage = `API error: ${responseCode}`;
        try {
          const errorData = JSON.parse(errorContent);
          if (errorData.error) {
            const apiError = errorData.error;
            
            // Provide specific error messages based on error type
            switch (responseCode) {
            case 400:
              if (apiError.message.includes('API_KEY_INVALID')) {
                errorMessage = 'Invalid API key. Please check your API key in Settings.';
              } else if (apiError.message.includes('REQUEST_SIZE')) {
                errorMessage = 'Email content too large. Try a shorter email.';
              } else {
                errorMessage = `Bad request: ${apiError.message}`;
              }
              break;
                
            case 401:
              errorMessage = 'API key not authorized. Please check your API key is active.';
              break;
                
            case 403:
              if (apiError.message.includes('PERMISSION_DENIED')) {
                errorMessage = 'Permission denied. Check API key permissions.';
              } else if (apiError.message.includes('BILLING')) {
                errorMessage = 'Billing not enabled for this API key.';
              } else if (apiError.message.includes('LOCATION')) {
                errorMessage = 'Gemini API not available in your location.';
              } else {
                errorMessage = `Access forbidden: ${apiError.message}`;
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
              errorMessage = apiError.message || `API error: ${responseCode}`;
            }
          }
        } catch (parseError) {
          // If we can't parse the error, use the response code
          AppLogger.warn('Could not parse API error response', parseError);
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
      
      // Parse response with error boundary
      let result: unknown;
      try {
        result = JSON.parse(response.getContentText());
      } catch (parseError) {
        AppLogger.error('Failed to parse Gemini API response', {
          error: parseError,
          responseText: response.getContentText().substring(0, 500)
        });
        return {
          success: false,
          error: 'Invalid JSON response from API'
        };
      }
      
      // Type guard for API response
      interface ApiResponse {
        error?: { message?: string };
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
          groundingMetadata?: { webSearchQueries?: unknown[] };
          safetyRatings?: Array<{ probability?: number }>;
        }>;
      }
      
      const isApiResponse = (obj: unknown): obj is ApiResponse => {
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
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        AppLogger.warn('No text in Gemini response', {
          hassCandidates: !!result.candidates,
          candidatesLength: result.candidates?.length,
          finishReason: result.candidates?.[0]?.finishReason
        });
        return {
          success: false,
          error: Constants.ERRORS.MSG_NO_RESPONSE_TEXT
        };
      }
      
      // If grounding was used, extract grounding metadata
      let groundingMetadata = null;
      if (options?.enableGrounding && result.candidates?.[0]?.groundingMetadata) {
        groundingMetadata = result.candidates[0].groundingMetadata;
        AppLogger.info('Grounding metadata available', {
          searchQueries: groundingMetadata.webSearchQueries?.length || 0
        });
      }
      
      const duration = Date.now() - startTime;
      const responseLength = text.length;
      
      // Log successful response
      DebugLogger.logAI('RESPONSE', 'AI.callGeminiAPI', text.substring(0, 500) + (text.length > 500 ? '...' : ''), {
        requestId: requestId,
        success: true,
        duration: duration,
        responseLength: responseLength,
        confidence: result.candidates?.[0]?.safetyRatings?.[0]?.probability || 1,
        finishReason: result.candidates?.[0]?.finishReason,
        hasGrounding: !!groundingMetadata
      });
      
      return {
        success: true,
        response: text,
        confidence: result.candidates?.[0]?.safetyRatings?.[0]?.probability || 1
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log the error with full context
      DebugLogger.logError('AI.callGeminiAPI', error instanceof Error ? error : String(error), {
        requestId: requestId,
        duration: duration,
        prompt: `${prompt.substring(0, 200)  }...`,
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
        error: `Error: ${errorMessage}. Please try again or contact support.`
      };
    }
  }
  
  /**
   * Generate email response
   */
  export function generateEmailResponse(
    context: Types.EmailContext,
    style: Types.WritingStyle,
    userProfile: Types.UserProfile,
    apiKey: string
  ): Types.AIResponse {
    try {
      const prompt = Prompts.getResponseGenerationPrompt(
        context,
        style,
        userProfile,
        Config.getSettings().customInstructions
      );
      
      // Use standard mode for email generation (not JSON)
      return callGeminiAPI(prompt, apiKey, {
        enableGrounding: true // Enable grounding for more accurate responses
      });
      
    } catch (error) {
      AppLogger.error('Failed to generate response', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Analyze writing style with robust error handling
   */
  export function analyzeWritingStyle(emails: string[], apiKey: string): Types.WritingStyle | null {
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
      const validEmails = emails.filter(email => 
        email && typeof email === 'string' && email.trim().length > 10
      );
      
      if (validEmails.length === 0) {
        AppLogger.warn('No valid email content for style analysis');
        return null;
      }
      
      const prompt = Prompts.getStyleAnalysisPrompt(Session.getActiveUser().getEmail());
      const combinedEmails = validEmails.join('\n\n---\n\n');
      const fullPrompt = `${prompt}\n\nEmails to analyze:\n${combinedEmails}`;
      
      // Use simple schema generation with error handling
      let responseSchema;
      try {
        responseSchema = JsonValidator.createWritingStyleSchema();
      } catch (schemaError) {
        AppLogger.error('Failed to create response schema', schemaError);
        return null;
      }
      
      const response = callGeminiAPI(fullPrompt, apiKey, {
        jsonMode: true,
        responseSchema,
        enableCodeExecution: true // Can help with analyzing patterns
      });
      
      if (!response.success || !response.response) {
        AppLogger.error('Style analysis API call failed', response.error);
        return null;
      }
      
      // Parse and validate the response with comprehensive error handling
      let parsed: unknown;
      try {
        parsed = JsonValidator.parseJson<any>(response.response, 'Writing Style Analysis');
        if (!parsed) {
          throw new Error('JSON parser returned null/undefined');
        }
      } catch (parseError) {
        AppLogger.error('Failed to parse style analysis response', {
          error: parseError,
          responseText: response.response?.substring(0, 500),
          responseLength: response.response?.length
        });
        return null;
      }
      
      // Validate and provide defaults with error handling
      try {
        const validatedStyle = JsonValidator.validateWritingStyle(parsed);
        if (validatedStyle) {
          AppLogger.info('Successfully analyzed writing style from emails');
          return validatedStyle;
        } else {
          AppLogger.warn('Style validation returned null');
          return null;
        }
      } catch (validationError) {
        AppLogger.error('Failed to validate writing style', validationError);
        return null;
      }
      
    } catch (error) {
      AppLogger.error('Unexpected error in style analysis', {
        error: error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  /**
   * Create a default writing style - bulletproof fallback
   */
  function createDefaultWritingStyle(): Types.WritingStyle {
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
  export function getWritingStyle(): Types.WritingStyle {
    const config = Config.getSettings();
    
    // Step 1: Try to get cached style (safest option)
    try {
      const cached = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Validate cached data structure
        if (parsedCache && typeof parsedCache === 'object' && 
            Array.isArray(parsedCache.greetings) && Array.isArray(parsedCache.closings) &&
            typeof parsedCache.formalityLevel === 'number') {
          AppLogger.info('Using cached writing style');
          return parsedCache;
        }
        AppLogger.warn('Invalid cached writing style, will regenerate');
      }
    } catch (error) {
      AppLogger.warn('Failed to parse cached writing style', error);
      // Continue to next step - don't fail
    }

    // Step 2: Try to analyze recent emails (if API key is available)
    if (config.apiKey) {
      try {
        const emails = GmailService.getRecentSentEmails(Constants.EMAIL.MAX_SENT_EMAILS_TO_ANALYZE);
        
        if (emails && emails.length > 0) {
          // Safely extract email bodies with validation
          const emailBodies: string[] = [];
          for (const email of emails) {
            if (email && typeof email === 'object' && email.body && typeof email.body === 'string' && email.body.trim().length > 10) {
              emailBodies.push(email.body);
            }
          }
          
          if (emailBodies.length > 0) {
            const style = analyzeWritingStyle(emailBodies, config.apiKey);
            if (style) {
              // Cache the successful result
              try {
                PropertyManager.setProperty(
                  Constants.PROPERTIES.WRITING_STYLE,
                  JSON.stringify(style),
                  'user'
                );
                AppLogger.info('Successfully analyzed and cached writing style');
                return style;
              } catch (cacheError) {
                AppLogger.warn('Failed to cache writing style but analysis succeeded', cacheError);
                return style; // Still return the analyzed style even if caching failed
              }
            }
          } else {
            AppLogger.info('No valid email bodies found for analysis');
          }
        } else {
          AppLogger.info('No sent emails available for style analysis');
        }
      } catch (error) {
        AppLogger.warn('Failed to analyze writing style from emails', error);
        // Continue to default - don't fail
      }
    } else {
      AppLogger.info('No API key configured, using default writing style');
    }

    // Step 3: ALWAYS return a default style (bulletproof fallback)
    AppLogger.info('Using default writing style');
    const defaultStyle = createDefaultWritingStyle();
    
    // Try to cache the default style for future use
    try {
      PropertyManager.setProperty(
        Constants.PROPERTIES.WRITING_STYLE,
        JSON.stringify(defaultStyle),
        'user'
      );
    } catch (cacheError) {
      AppLogger.warn('Failed to cache default writing style', cacheError);
      // Continue - not critical
    }
    
    return defaultStyle;
  }

  /**
   * Improve user profile from thread with JSON mode
   */
  export function improveProfileFromThread(
    currentProfile: Types.UserProfile,
    threadContent: string,
    apiKey: string
  ): Types.UserProfile | null {
    try {
      const prompt = Prompts.getStyleImprovementPrompt(currentProfile, threadContent);
      
      // Use simple schema generation
      const responseSchema = JsonValidator.createUserProfileSchema();
      
      const response = callGeminiAPI(prompt, apiKey, {
        jsonMode: true,
        responseSchema,
        enableGrounding: true // Help with understanding context
      });
      
      if (!response.success || !response.response) {
        return null;
      }
      
      // Parse and validate the response with error boundary
      let parsed: unknown;
      try {
        parsed = JsonValidator.parseJson<any>(response.response, 'User Profile Improvement');
        if (!parsed) {
          throw new Error('Failed to parse JSON response');
        }
      } catch (parseError) {
        AppLogger.error('Failed to parse profile improvement response', {
          error: parseError,
          responseText: response.response?.substring(0, 500)
        });
        return null;
      }
      
      // Validate and return
      return JsonValidator.validateUserProfile(parsed);
    } catch (error) {
      AppLogger.error('Profile improvement failed', error);
      return null;
    }
  }
  
  /**
   * Validate Gemini API key format
   */
  export function validateApiKey(apiKey: string): { isValid: boolean; error?: string } {
    if (!apiKey) {
      return { isValid: false, error: 'API key is required' };
    }
    
    if (typeof apiKey !== 'string') {
      return { isValid: false, error: 'API key must be a string' };
    }
    
    // Remove any whitespace
    const trimmedKey = apiKey.trim();
    
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
}