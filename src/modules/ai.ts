namespace AI {
  /**
   * Call Gemini API
   */
  export function callGeminiAPI(prompt: string, apiKey: string): Types.AIResponse {
    if (!apiKey) {
      return {
        success: false,
        error: Constants.ERRORS.MSG_API_KEY_REQUIRED
      };
    }
    
    try {
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: Config.API_TEMPERATURE,
          maxOutputTokens: Config.API_MAX_TOKENS,
          topK: Constants.API.TOP_K,
          topP: Constants.API.TOP_P
        }
      };
      
      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: Constants.API.HTTP_METHOD_POST as GoogleAppsScript.URL_Fetch.HttpMethod,
        contentType: Constants.API.CONTENT_TYPE_JSON,
        headers: {
          [Constants.API.HEADER_API_KEY]: apiKey
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      AppLogger.info('Calling Gemini API');
      const response = UrlFetchApp.fetch(Config.GEMINI_API_URL, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode !== Constants.API.STATUS_OK) {
        AppLogger.error(`Gemini API error: ${responseCode}`, response.getContentText());
        return {
          success: false,
          error: `API error: ${responseCode}`
        };
      }
      
      const result = JSON.parse(response.getContentText());
      
      if (!result.candidates || result.candidates.length === 0) {
        return {
          success: false,
          error: Constants.ERRORS.MSG_NO_RESPONSE_TEXT
        };
      }
      
      const content = result.candidates[0].content;
      const text = content.parts[0].text;
      
      return {
        success: true,
        response: text,
        confidence: result.candidates[0].avgLogprobs || 0
      };
      
    } catch (error) {
      AppLogger.error('Gemini API call failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Analyze writing style from sent emails
   */
  export function analyzeWritingStyle(sentEmails: GoogleAppsScript.Gmail.GmailMessage[]): Types.WritingStyle | null {
    if (sentEmails.length === 0) {
      AppLogger.warn('No sent emails to analyze');
      return null;
    }
    
    // Extract email bodies
    const emailBodies = sentEmails
      .slice(0, Config.MAX_SENT_EMAILS_TO_ANALYZE)
      .map(email => Utils.cleanEmailBody(email.getPlainBody()))
      .filter(body => body.length > Constants.EMAIL.MIN_EMAIL_LENGTH_FOR_ANALYSIS);
    
    if (emailBodies.length === 0) {
      return null;
    }
    
    const apiKey = Config.getProperty(Config.PROPERTY_KEYS.API_KEY);
    const prompt = `${Config.PROMPTS.STYLE_ANALYSIS}\n\nEmails to analyze:\n${emailBodies.join('\n---\n')}`;
    
    const response = callGeminiAPI(prompt, apiKey);
    
    if (!response.success || !response.response) {
      AppLogger.error('Failed to analyze writing style', response.error);
      return null;
    }
    
    try {
      const styleData = JSON.parse(response.response);
      return {
        greetings: styleData.greetings || Constants.STYLE.DEFAULT_GREETINGS,
        closings: styleData.closings || Constants.STYLE.DEFAULT_CLOSINGS,
        sentencePatterns: styleData.sentencePatterns || [],
        vocabulary: styleData.vocabulary || [],
        formalityLevel: styleData.formalityLevel || Constants.STYLE.FORMALITY_NEUTRAL,
        averageSentenceLength: styleData.averageSentenceLength || Constants.STYLE.DEFAULT_AVG_SENTENCE_LENGTH,
        punctuationStyle: styleData.punctuationStyle || Constants.STYLE.DEFAULT_PUNCTUATION
      };
    } catch (error) {
      AppLogger.error('Failed to parse style analysis', error);
      return null;
    }
  }
  
  /**
   * Generate email response
   */
  export function generateEmailResponse(
    context: Types.EmailContext,
    style: Types.WritingStyle,
    settings: Types.Config
  ): Types.AIResponse {
    const apiKey = settings.apiKey;
    
    if (!apiKey) {
      return {
        success: false,
        error: Constants.ERRORS.MSG_API_KEY_REQUIRED
      };
    }
    
    // Get user profile for assistant persona
    const userProfile = UserProfile.getUserProfile();
    
    // Build improved prompt with assistant identity
    const prompt = Prompts.getResponseGenerationPrompt(
      context,
      style,
      userProfile,
      settings.customInstructions
    );
    
    AppLogger.info('Generating response as email assistant');
    const response = callGeminiAPI(prompt, apiKey);
    
    if (response.success && response.response) {
      // Add signature if provided
      let finalResponse = response.response;
      if (settings.signature) {
        finalResponse += `\n\n${settings.signature}`;
      }
      
      return {
        success: true,
        response: finalResponse,
        confidence: response.confidence
      };
    }
    
    return response;
  }
  
  /**
   * Get or create writing style
   */
  export function getWritingStyle(): Types.WritingStyle {
    // Try to get cached style
    const cachedStyle = Config.getProperty(Config.PROPERTY_KEYS.WRITING_STYLE);
    if (cachedStyle) {
      const parsed = Utils.parseJsonSafe<Types.WritingStyle | null>(cachedStyle, null);
      if (parsed) {
        AppLogger.info('Using cached writing style');
        return parsed;
      }
    }
    
    // Analyze sent emails - get 200 directly
    AppLogger.info('Analyzing writing style from sent emails');
    const sentThreads = GmailApp.search('in:sent', 0, Config.MAX_SENT_EMAILS_TO_ANALYZE);
    const sentEmails: GoogleAppsScript.Gmail.GmailMessage[] = [];
    
    // Collect up to 200 emails
    for (const thread of sentThreads) {
      const messages = thread.getMessages();
      for (const message of messages) {
        if (message.getFrom().includes(Session.getActiveUser().getEmail())) {
          sentEmails.push(message);
          if (sentEmails.length >= Config.MAX_SENT_EMAILS_TO_ANALYZE) {
            break;
          }
        }
      }
      if (sentEmails.length >= Config.MAX_SENT_EMAILS_TO_ANALYZE) {
        break;
      }
    }
    
    const style = analyzeWritingStyle(sentEmails);
    
    if (style) {
      // Cache the style
      Config.setProperty(Config.PROPERTY_KEYS.WRITING_STYLE, JSON.stringify(style));
      Config.setProperty(Config.PROPERTY_KEYS.LAST_ANALYSIS, new Date().toISOString());
      return style;
    }
    
    // Return default style
    AppLogger.warn('Using default writing style');
    return {
      greetings: Constants.STYLE.DEFAULT_GREETINGS,
      closings: Constants.STYLE.DEFAULT_CLOSINGS,
      sentencePatterns: [],
      vocabulary: [],
      formalityLevel: Constants.STYLE.FORMALITY_NEUTRAL,
      averageSentenceLength: Constants.STYLE.DEFAULT_AVG_SENTENCE_LENGTH,
      punctuationStyle: Constants.STYLE.DEFAULT_PUNCTUATION
    };
  }
}