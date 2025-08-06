"use strict";
var ResponseGenerator;
(function (ResponseGenerator) {
    /**
     * Generate email response using style and context
     */
    function generateResponse(context, style, settings) {
        // Build the prompt
        var prompt = buildPrompt(context, style, settings);
        // Call Gemini API
        var response = AI.callGeminiAPI(prompt, settings.apiKey);
        if (!response.success || !response.response) {
            throw new ErrorHandling.AppError('Failed to generate response', 'AI_GENERATION_ERROR', response.error || 'Could not generate response');
        }
        // Post-process the response
        var processedResponse = response.response;
        // Ensure proper formatting
        processedResponse = formatResponse(processedResponse, style, settings);
        return processedResponse;
    }
    ResponseGenerator.generateResponse = generateResponse;
    /**
     * Build the prompt for Gemini
     */
    function buildPrompt(context, style, settings) {
        var lengthGuide = getLengthGuide(settings.responseLength);
        var prompt = "You are writing an email response as Franz Enzenhofer.\n\nWriting Style Profile:\n- Typical greetings: ".concat(style.greetings.join(', '), "\n- Typical closings: ").concat(style.closings.join(', '), "\n- Formality level: ").concat(settings.formalityLevel, "/5\n- Average sentence length: ").concat(style.averageSentenceLength, " characters\n- Punctuation style: ").concat(style.punctuationStyle, "\n\nEmail to respond to:\nFrom: ").concat(context.from, "\nSubject: ").concat(context.subject, "\nDate: ").concat(Utils.formatDate(context.date), "\nContent: ").concat(context.body, "\n\n");
        // Add thread context if available
        if (context.isReply && context.previousMessages && context.previousMessages.length > 0) {
            prompt += 'Previous messages in thread:\n';
            context.previousMessages.slice(-3).forEach(function (msg) {
                prompt += "---\n".concat(msg.from, " (").concat(Utils.formatDate(msg.date), "): ").concat(Utils.truncate(msg.body, 200), "\n");
            });
            prompt += '\n';
        }
        prompt += "Instructions:\n1. Write a ".concat(lengthGuide, " response\n2. Match the writing style from the profile\n3. Use an appropriate greeting from the style profile\n4. Maintain formality level ").concat(settings.formalityLevel, "/5\n5. Be helpful and address all points raised\n6. Sound natural and personal\n");
        if (settings.customInstructions) {
            prompt += "\nAdditional instructions: ".concat(settings.customInstructions, "\n");
        }
        prompt += '\nGenerate only the email body text, no subject or metadata:';
        return prompt;
    }
    /**
     * Get length guide based on preference
     */
    function getLengthGuide(length) {
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
    function formatResponse(response, style, settings) {
        // Trim whitespace
        response = response.trim();
        // Add signature if not already present and configured
        if (settings.signature && !response.includes(settings.signature)) {
            // Check if response already has a closing
            var hasClosing = style.closings.some(function (closing) {
                return response.toLowerCase().includes(closing.toLowerCase());
            });
            if (!hasClosing) {
                response += "\n\n".concat(style.closings[0]) || 'Best regards';
            }
            response += "\n".concat(settings.signature);
        }
        return response;
    }
})(ResponseGenerator || (ResponseGenerator = {}));
//# sourceMappingURL=response-generator.js.map