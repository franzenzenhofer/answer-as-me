namespace AI {
  /**
   * Response schema types for strict JSON mode
   */
  export interface ResponseSchema {
    type: string;
    properties?: { [key: string]: any };
    required?: string[];
    items?: any;
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
   * Call Gemini API with enhanced features
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
    if (!apiKey) {
      return {
        success: false,
        error: Constants.ERRORS.MSG_API_KEY_REQUIRED
      };
    }
    
    try {
      // Build generation config
      const generationConfig: any = {
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
      const payload: any = {
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
      
      const requestOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: Constants.API.HTTP_METHOD_POST as GoogleAppsScript.URL_Fetch.HttpMethod,
        contentType: Constants.API.CONTENT_TYPE_JSON,
        headers: {
          [Constants.API.HEADER_API_KEY]: apiKey
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      AppLogger.info('Calling Gemini API', { 
        jsonMode: options?.jsonMode,
        grounding: options?.enableGrounding,
        codeExecution: options?.enableCodeExecution
      });
      
      const response = UrlFetchApp.fetch(Config.GEMINI_API_URL, requestOptions);
      const responseCode = response.getResponseCode();
      
      if (responseCode !== Constants.API.STATUS_OK) {
        AppLogger.error(`Gemini API error: ${responseCode}`, response.getContentText());
        return {
          success: false,
          error: `API error: ${responseCode}`
        };
      }
      
      const result = JSON.parse(response.getContentText());
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
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
      AppLogger.error('Gemini API call failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
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
      
      // Parse and validate the response
      const parsed = JsonValidator.parseJson<any>(response.response, 'Writing Style Analysis');
      if (!parsed) {
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

    // Get cached style first
    const cached = PropertiesService.getUserProperties().getProperty(Constants.PROPERTIES.WRITING_STYLE);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Continue to analyze
      }
    }

    // Analyze recent sent emails
    const emails = GmailService.getRecentSentEmails(Constants.EMAIL.MAX_SENT_EMAILS_TO_ANALYZE);
    if (emails.length === 0) {
      return null;
    }

    const style = analyzeWritingStyle(emails.map((e: { body: string }) => e.body), config.apiKey);
    
    // Cache the result
    if (style) {
      PropertiesService.getUserProperties().setProperty(
        Constants.PROPERTIES.WRITING_STYLE,
        JSON.stringify(style)
      );
    }

    return style;
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
      
      // Parse and validate the response
      const parsed = JsonValidator.parseJson<any>(response.response, 'User Profile Improvement');
      if (!parsed) {
        return null;
      }
      
      // Validate and return
      return JsonValidator.validateUserProfile(parsed);
    } catch (error) {
      AppLogger.error('Profile improvement failed', error);
      return null;
    }
  }
}