namespace AI {
  /**
   * Call Gemini API
   */
  export function callGeminiAPI(prompt: string, apiKey: string): Types.AIResponse {
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured'
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
          topK: 40,
          topP: 0.95
        }
      };
      
      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': apiKey
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      AppLogger.info('Calling Gemini API');
      const response = UrlFetchApp.fetch(Config.GEMINI_API_URL, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode !== 200) {
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
          error: 'No response generated'
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
      .filter(body => body.length > 50); // Only meaningful emails
    
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
        greetings: styleData.greetings || ['Hi', 'Hello'],
        closings: styleData.closings || ['Best regards', 'Thanks'],
        sentencePatterns: styleData.sentencePatterns || [],
        vocabulary: styleData.vocabulary || [],
        formalityLevel: styleData.formalityLevel || 3,
        averageSentenceLength: styleData.averageSentenceLength || 15,
        punctuationStyle: styleData.punctuationStyle || 'standard'
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
        error: 'API key not configured'
      };
    }
    
    // Build context string
    const contextString = JSON.stringify({
      from: context.from,
      subject: context.subject,
      body: Utils.truncate(context.body, 1000),
      isReply: context.isReply,
      threadLength: context.previousMessages?.length || 0
    });
    
    // Build style string
    const styleString = JSON.stringify({
      greeting: style.greetings[0] || 'Hi',
      closing: style.closings[0] || 'Best regards',
      formalityLevel: settings.formalityLevel,
      responseLength: settings.responseLength
    });
    
    // Build prompt
    const prompt = Config.PROMPTS.RESPONSE_GENERATION
      .replace('{style}', styleString)
      .replace('{context}', contextString)
      .replace('{instructions}', settings.customInstructions || 'None');
    
    AppLogger.info('Generating response with AI');
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
      greetings: ['Hi', 'Hello', 'Hey'],
      closings: ['Best regards', 'Thanks', 'Cheers'],
      sentencePatterns: [],
      vocabulary: [],
      formalityLevel: 3,
      averageSentenceLength: 15,
      punctuationStyle: 'standard'
    };
  }
}