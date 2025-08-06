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
    AppLogger.info('🧪 TESTING API KEY', {
      key: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      length: apiKey.length,
      isValid: apiKey.startsWith('AIza'),
      timestamp: new Date().toISOString()
    });
    
    const testResult = callGeminiAPI('Say "API key works!"', apiKey);
    
    if (testResult.success) {
      AppLogger.info('✅ API KEY TEST PASSED', testResult);
      return { success: true };
    } else {
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
    // Validate API key
    const keyValidation = validateApiKey(apiKey);
    if (!keyValidation.isValid) {
      return {
        success: false,
        error: keyValidation.error || Constants.ERRORS.MSG_API_KEY_REQUIRED
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
      
      return {
        success: true,
        response: text,
        confidence: result.candidates?.[0]?.safetyRatings?.[0]?.probability || 1
      };
      
    } catch (error) {
      // Check if error is timeout-related
      const errorMessage = error instanceof Error ? error.message : String(error);
      
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
   * Analyze writing style with strict JSON output
   */
  export function analyzeWritingStyle(emails: string[], apiKey: string): Types.WritingStyle | null {
    try {
      const prompt = Prompts.getStyleAnalysisPrompt(Session.getActiveUser().getEmail());
      const combinedEmails = emails.join('\n\n---\n\n');
      const fullPrompt = `${prompt}\n\nEmails to analyze:\n${combinedEmails}`;
      
      // Use simple schema generation
      const responseSchema = JsonValidator.createWritingStyleSchema();
      
      const response = callGeminiAPI(fullPrompt, apiKey, {
        jsonMode: true,
        responseSchema,
        enableCodeExecution: true // Can help with analyzing patterns
      });
      
      if (!response.success || !response.response) {
        AppLogger.error('Style analysis failed', response.error);
        return null;
      }
      
      // Parse and validate the response with error boundary
      let parsed: unknown;
      try {
        parsed = JsonValidator.parseJson<any>(response.response, 'Writing Style Analysis');
        if (!parsed) {
          throw new Error('Failed to parse JSON response');
        }
      } catch (parseError) {
        AppLogger.error('Failed to parse style analysis response', {
          error: parseError,
          responseText: response.response?.substring(0, 500)
        });
        return null;
      }
      
      // Validate and provide defaults
      const validatedStyle = JsonValidator.validateWritingStyle(parsed);
      return validatedStyle;
      
    } catch (error) {
      AppLogger.error('Style analysis error', error);
      return null;
    }
  }

  /**
   * Get writing style (wrapper for analyzeWritingStyle)
   */
  export function getWritingStyle(): Types.WritingStyle | null {
    const config = Config.getSettings();
    if (!config.apiKey) {
      AppLogger.error('No API key configured');
      return null;
    }

    // Get cached style first with thread safety
    const cached = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        // Validate cached data structure
        if (parsedCache && typeof parsedCache === 'object' && 
            Array.isArray(parsedCache.greetings) && Array.isArray(parsedCache.closings)) {
          return parsedCache;
        }
        AppLogger.warn('Invalid cached writing style structure, re-analyzing');
      } catch (error) {
        AppLogger.warn('Failed to parse cached writing style', error);
        // Clear invalid cache
        PropertyManager.deleteProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
      }
    }

    // Analyze recent sent emails with error handling
    try {
      const emails = GmailService.getRecentSentEmails(Constants.EMAIL.MAX_SENT_EMAILS_TO_ANALYZE);
      if (emails.length === 0) {
        AppLogger.info('No sent emails found for style analysis');
        return null;
      }

      const style = analyzeWritingStyle(emails.map((e: { body: string }) => e.body), config.apiKey);
      
      // Cache the result only if valid
      if (style) {
        try {
          PropertyManager.setProperty(
            Constants.PROPERTIES.WRITING_STYLE,
            JSON.stringify(style),
            'user'
          );
        } catch (cacheError) {
          AppLogger.error('Failed to cache writing style', cacheError);
          // Continue - style analysis succeeded even if caching failed
        }
      }

      return style;
    } catch (error) {
      AppLogger.error('Failed to get writing style', error);
      return null;
    }
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