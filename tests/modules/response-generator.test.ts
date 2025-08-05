import '../../../src/modules/utils';
import '../../../src/modules/types';
import '../../../src/modules/ai';
import '../../../src/modules/error-handling';
import '../../../src/modules/response-generator';

describe('ResponseGenerator Module', () => {
  describe('generateResponse', () => {
    const mockContext: Types.EmailContext = {
      messageId: 'msg-123',
      threadId: 'thread-123',
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Meeting Request',
      body: 'Would you be available for a meeting next Tuesday at 2 PM?',
      date: new Date(),
      isReply: false,
      hasAttachments: false
    };

    const mockStyle: Types.WritingStyle = {
      greetings: ['Hi', 'Hello'],
      closings: ['Best regards', 'Thanks'],
      sentencePatterns: ['Thanks for', 'I would be happy to'],
      vocabulary: ['appreciate', 'available', 'discuss'],
      formalityLevel: 3,
      averageSentenceLength: 15,
      punctuationStyle: 'standard'
    };

    const mockSettings: Types.UserSettings = {
      apiKey: 'test-key',
      responseMode: Types.ResponseMode.DRAFT,
      autoReply: false,
      formalityLevel: 3,
      responseLength: Types.ResponseLength.MEDIUM,
      customInstructions: '',
      signature: 'Best,\\nFranz'
    };

    it('should generate appropriate response for meeting request', () => {
      const prompt = ResponseGenerator.generateResponse(mockContext, mockStyle, mockSettings);

      expect(prompt).toContain('meeting');
      expect(prompt).toContain('Tuesday');
      expect(prompt).toContain('2 PM');
    });

    it('should handle reply context', () => {
      const replyContext = {
        ...mockContext,
        isReply: true,
        subject: 'Re: Project Update',
        previousMessages: [
          {
            id: 'prev-1',
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Project Update',
            body: 'Here is the latest update on the project.',
            date: new Date()
          }
        ]
      };

      const prompt = ResponseGenerator.generateResponse(replyContext, mockStyle, mockSettings);

      expect(prompt).toContain('Re:');
      expect(prompt).toContain('previous');
    });

    it('should respect response length settings', () => {
      const shortSettings = { ...mockSettings, responseLength: Types.ResponseLength.SHORT };
      const longSettings = { ...mockSettings, responseLength: Types.ResponseLength.LONG };

      const shortPrompt = ResponseGenerator.generateResponse(mockContext, mockStyle, shortSettings);
      const longPrompt = ResponseGenerator.generateResponse(mockContext, mockStyle, longSettings);

      expect(shortPrompt).toContain('brief');
      expect(longPrompt).toContain('detailed');
    });

    it('should include custom instructions', () => {
      const customSettings = {
        ...mockSettings,
        customInstructions: 'Always mention availability on Wednesdays'
      };

      const prompt = ResponseGenerator.generateResponse(mockContext, mockStyle, customSettings);

      expect(prompt).toContain('Always mention availability on Wednesdays');
    });

    it('should handle questions appropriately', () => {
      const questionContext = {
        ...mockContext,
        body: 'What is your preferred communication method? Do you prefer email or phone calls?'
      };

      const prompt = ResponseGenerator.generateResponse(questionContext, mockStyle, mockSettings);

      expect(prompt).toContain('question');
      expect(prompt.toLowerCase()).toContain('answer');
    });

    it('should adapt to formality level', () => {
      const formalContext = {
        ...mockContext,
        from: 'Dr. Smith <dr.smith@university.edu>',
        subject: 'Research Collaboration Proposal'
      };

      const formalSettings = { ...mockSettings, formalityLevel: 5 };

      const prompt = ResponseGenerator.generateResponse(formalContext, mockStyle, formalSettings);

      expect(prompt).toContain('formal');
    });
  });

  describe('createResponsePrompt', () => {
    it('should create structured prompt with all elements', () => {
      const elements = {
        context: 'Email about project deadline',
        style: 'Professional and friendly',
        instructions: 'Keep it brief',
        constraints: 'Maximum 3 sentences'
      };

      const prompt = ResponseGenerator.createResponsePrompt(elements);

      expect(prompt).toContain('Email about project deadline');
      expect(prompt).toContain('Professional and friendly');
      expect(prompt).toContain('Keep it brief');
      expect(prompt).toContain('Maximum 3 sentences');
    });

    it('should handle missing elements gracefully', () => {
      const minimalElements = {
        context: 'Basic email',
        style: 'Default style'
      };

      const prompt = ResponseGenerator.createResponsePrompt(minimalElements);

      expect(prompt).toContain('Basic email');
      expect(prompt).toContain('Default style');
    });
  });

  describe('extractKeyPoints', () => {
    it('should extract key points from email', () => {
      const email = `
        Hi Team,
        
        I wanted to discuss three important items:
        1. The project deadline has been moved to next Friday
        2. We need to review the budget proposal
        3. The client meeting is scheduled for Tuesday at 3 PM
        
        Please let me know your thoughts.
      `;

      const keyPoints = ResponseGenerator.extractKeyPoints(email);

      expect(keyPoints).toContain('deadline');
      expect(keyPoints).toContain('Friday');
      expect(keyPoints).toContain('budget');
      expect(keyPoints).toContain('Tuesday');
      expect(keyPoints).toContain('3 PM');
    });

    it('should handle emails with questions', () => {
      const email = 'Can you review the document? When would be a good time to meet?';

      const keyPoints = ResponseGenerator.extractKeyPoints(email);

      expect(keyPoints).toContain('review');
      expect(keyPoints).toContain('document');
      expect(keyPoints).toContain('meet');
    });
  });

  describe('determineResponseType', () => {
    it('should identify request emails', () => {
      const requestEmail = 'Could you please send me the report by Friday?';
      const type = ResponseGenerator.determineResponseType(requestEmail);
      expect(type).toBe('request');
    });

    it('should identify question emails', () => {
      const questionEmail = 'What time works best for you? Which location do you prefer?';
      const type = ResponseGenerator.determineResponseType(questionEmail);
      expect(type).toBe('question');
    });

    it('should identify information emails', () => {
      const infoEmail = 'Just wanted to let you know that the meeting has been rescheduled.';
      const type = ResponseGenerator.determineResponseType(infoEmail);
      expect(type).toBe('information');
    });

    it('should identify thank you emails', () => {
      const thanksEmail = 'Thank you so much for your help with the project!';
      const type = ResponseGenerator.determineResponseType(thanksEmail);
      expect(type).toBe('thanks');
    });
  });

  describe('formatResponse', () => {
    const mockStyle: Types.WritingStyle = {
      greetings: ['Hi'],
      closings: ['Best regards'],
      sentencePatterns: [],
      vocabulary: [],
      formalityLevel: 3,
      averageSentenceLength: 15,
      punctuationStyle: 'standard'
    };

    it('should format response with greeting and closing', () => {
      const body = 'Thank you for your email. I will review the document.';
      const formatted = ResponseGenerator.formatResponse(body, mockStyle, 'John');

      expect(formatted).toStartWith('Hi John,');
      expect(formatted).toContain(body);
      expect(formatted).toEndWith('Best regards');
    });

    it('should handle missing recipient name', () => {
      const body = 'I have received your message.';
      const formatted = ResponseGenerator.formatResponse(body, mockStyle);

      expect(formatted).toStartWith('Hi,');
      expect(formatted).toContain(body);
    });

    it('should preserve original formatting', () => {
      const body = 'Point 1\\n\\nPoint 2\\n\\nPoint 3';
      const formatted = ResponseGenerator.formatResponse(body, mockStyle, 'Sarah');

      expect(formatted).toContain('Point 1\\n\\nPoint 2\\n\\nPoint 3');
    });
  });
});