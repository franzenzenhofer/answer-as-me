namespace ResponseGenerator {
  /**
   * Generate email response using style and context
   */
  export function generateResponse(
    context: Types.EmailContext,
    style: Types.WritingStyle,
    settings: Types.Config
  ): string {
    // Build the prompt
    const prompt = buildPrompt(context, style, settings);
    
    // Call Gemini API
    const response = AI.callGeminiAPI(prompt, settings.apiKey);
    
    if (!response.success || !response.response) {
      throw new ErrorHandling.AppError(
        'Failed to generate response',
        'AI_GENERATION_ERROR',
        response.error || 'Could not generate response'
      );
    }
    
    // Post-process the response
    let processedResponse = response.response;
    
    // Ensure proper formatting
    processedResponse = formatResponse(processedResponse, style, settings);
    
    return processedResponse;
  }
  
  /**
   * Build the prompt for Gemini
   */
  function buildPrompt(
    context: Types.EmailContext,
    style: Types.WritingStyle,
    settings: Types.Config
  ): string {
    const lengthGuide = getLengthGuide(settings.responseLength);
    
    let prompt = `You are writing an email response as Franz Enzenhofer.

Writing Style Profile:
- Typical greetings: ${style.greetings.join(', ')}
- Typical closings: ${style.closings.join(', ')}
- Formality level: ${settings.formalityLevel}/5
- Average sentence length: ${style.averageSentenceLength} characters
- Punctuation style: ${style.punctuationStyle}

Email to respond to:
From: ${context.from}
Subject: ${context.subject}
Date: ${Utils.formatDate(context.date)}
Content: ${context.body}

`;

    // Add thread context if available
    if (context.isReply && context.previousMessages && context.previousMessages.length > 0) {
      prompt += `Previous messages in thread:\n`;
      context.previousMessages.slice(-3).forEach(msg => {
        prompt += `---\n${msg.from} (${Utils.formatDate(msg.date)}): ${Utils.truncate(msg.body, 200)}\n`;
      });
      prompt += '\n';
    }

    prompt += `Instructions:
1. Write a ${lengthGuide} response
2. Match the writing style from the profile
3. Use an appropriate greeting from the style profile
4. Maintain formality level ${settings.formalityLevel}/5
5. Be helpful and address all points raised
6. Sound natural and personal
`;

    if (settings.customInstructions) {
      prompt += `\nAdditional instructions: ${settings.customInstructions}\n`;
    }

    prompt += `\nGenerate only the email body text, no subject or metadata:`;
    
    return prompt;
  }
  
  /**
   * Get length guide based on preference
   */
  function getLengthGuide(length: Types.ResponseLength): string {
    switch (length) {
      case Types.ResponseLength.SHORT:
        return 'brief (1-3 sentences)';
      case Types.ResponseLength.MEDIUM:
        return 'moderate (3-5 sentences)';
      case Types.ResponseLength.LONG:
        return 'detailed (1-2 paragraphs)';
      default:
        return 'moderate';
    }
  }
  
  /**
   * Format the response with signature
   */
  function formatResponse(
    response: string,
    style: Types.WritingStyle,
    settings: Types.Config
  ): string {
    // Trim whitespace
    response = response.trim();
    
    // Add signature if not already present and configured
    if (settings.signature && !response.includes(settings.signature)) {
      // Check if response already has a closing
      const hasClosing = style.closings.some(closing => 
        response.toLowerCase().includes(closing.toLowerCase())
      );
      
      if (!hasClosing) {
        response += '\n\n' + style.closings[0] || 'Best regards';
      }
      
      response += '\n' + settings.signature;
    }
    
    return response;
  }
}