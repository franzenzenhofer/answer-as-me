import '../src/modules/types';
import '../src/modules/constants';
import '../src/modules/config';
import '../src/modules/logger';
import '../src/modules/utils';
import '../src/modules/json-validator';
import '../src/modules/google-docs-prompts';
import '../src/modules/prompts';
import '../src/modules/gmail';
import '../src/modules/ai';

declare const global: any;

describe('AI Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset properties
    global.PropertiesService.getUserProperties().getProperty.mockReturnValue(null);
    global.PropertiesService.getUserProperties().getProperties.mockReturnValue({});
  });

  describe('callGeminiAPI', () => {
    it('should handle successful API response', () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Generated response text'
            }]
          },
          avgLogprobs: 0.95
        }]
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify(mockResponse))
      });

      const result = AI.callGeminiAPI('Test prompt', 'test-api-key');

      expect(result.success).toBe(true);
      expect(result.response).toBe('Generated response text');
      expect(result.confidence).toBe(0.95);
      expect(global.UrlFetchApp.fetch).toHaveBeenCalledWith(
        Config.GEMINI_API_URL,
        expect.objectContaining({
          method: 'post',
          headers: { 'x-goog-api-key': 'test-api-key' }
        })
      );
    });

    it('should handle missing API key', () => {
      const result = AI.callGeminiAPI('Test prompt', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key not configured');
      expect(global.UrlFetchApp.fetch).not.toHaveBeenCalled();
    });

    it('should handle API error response', () => {
      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 403),
        getContentText: jest.fn(() => 'Forbidden')
      });

      const result = AI.callGeminiAPI('Test prompt', 'invalid-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error: 403');
    });

    it('should handle empty candidates', () => {
      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({ candidates: [] }))
      });

      const result = AI.callGeminiAPI('Test prompt', 'test-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No response generated');
    });

    it('should handle network errors', () => {
      global.UrlFetchApp.fetch.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = AI.callGeminiAPI('Test prompt', 'test-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('analyzeWritingStyle', () => {
    const mockEmails = [
      {
        getPlainBody: jest.fn(() => 'Hi John,\\n\\nThanks for reaching out. I appreciate your message.\\n\\nBest regards,\\nFranz')
      },
      {
        getPlainBody: jest.fn(() => 'Hello Sarah,\\n\\nGreat to hear from you! Let me know if you need anything.\\n\\nCheers,\\nFranz')
      }
    ];

    it('should analyze writing style from emails', () => {
      const mockStyleResponse = {
        greetings: ['Hi', 'Hello'],
        closings: ['Best regards', 'Cheers'],
        sentencePatterns: ['Thanks for', 'Great to hear'],
        vocabulary: ['appreciate', 'reaching out'],
        formalityLevel: 3,
        averageSentenceLength: 12,
        punctuationStyle: 'standard'
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(mockStyleResponse)
              }]
            }
          }]
        }))
      });

      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValue('test-api-key');

      const result = AI.analyzeWritingStyle(mockEmails as any);

      expect(result).toEqual(mockStyleResponse);
      expect(global.UrlFetchApp.fetch).toHaveBeenCalled();
    });

    it('should return null for empty email list', () => {
      const result = AI.analyzeWritingStyle([]);
      expect(result).toBeNull();
    });

    it('should filter out short emails', () => {
      const shortEmails = [
        { getPlainBody: jest.fn(() => 'OK') },
        { getPlainBody: jest.fn(() => 'Thanks') }
      ];

      const result = AI.analyzeWritingStyle(shortEmails as any);
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', () => {
      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 500),
        getContentText: jest.fn(() => 'Server error')
      });

      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValue('test-api-key');

      const result = AI.analyzeWritingStyle(mockEmails as any);
      expect(result).toBeNull();
    });

    it('should handle invalid JSON response', () => {
      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: 'Invalid JSON'
              }]
            }
          }]
        }))
      });

      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValue('test-api-key');

      const result = AI.analyzeWritingStyle(mockEmails as any);
      expect(result).toBeNull();
    });
  });

  describe('generateEmailResponse', () => {
    const mockContext: Types.EmailContext = {
      messageId: 'msg-123',
      threadId: 'thread-123',
      from: 'john@example.com',
      to: 'franz@example.com',
      subject: 'Meeting Request',
      body: 'Would you be available for a meeting next week?',
      date: new Date(),
      isReply: false,
      hasAttachments: false
    };

    const mockStyle: Types.WritingStyle = {
      greetings: ['Hi', 'Hello'],
      closings: ['Best regards', 'Thanks'],
      sentencePatterns: [],
      vocabulary: [],
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
      signature: 'Franz'
    };

    it('should generate email response successfully', () => {
      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: 'Hi John,\\n\\nI would be happy to meet next week.\\n\\nBest regards'
              }]
            },
            avgLogprobs: 0.92
          }]
        }))
      });

      const result = AI.generateEmailResponse(mockContext, mockStyle, mockSettings);

      expect(result.success).toBe(true);
      expect(result.response).toContain('Hi John');
      expect(result.response).toContain('Franz'); // Signature added
      expect(result.confidence).toBe(0.92);
    });

    it('should handle missing API key', () => {
      const settingsNoKey = { ...mockSettings, apiKey: '' };
      const result = AI.generateEmailResponse(mockContext, mockStyle, settingsNoKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key not configured');
    });

    it('should include custom instructions in prompt', () => {
      const settingsWithInstructions = {
        ...mockSettings,
        customInstructions: 'Always be formal'
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: { parts: [{ text: 'Response' }] }
          }]
        }))
      });

      AI.generateEmailResponse(mockContext, mockStyle, settingsWithInstructions);

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      expect(payload.contents[0].parts[0].text).toContain('Always be formal');
    });

    it('should handle API failures', () => {
      global.UrlFetchApp.fetch.mockImplementation(() => {
        throw new Error('API unavailable');
      });

      const result = AI.generateEmailResponse(mockContext, mockStyle, mockSettings);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API unavailable');
    });
  });

  describe('getWritingStyle', () => {
    it('should return cached style if available', () => {
      const cachedStyle = {
        greetings: ['Cached Hi'],
        closings: ['Cached Bye'],
        sentencePatterns: [],
        vocabulary: [],
        formalityLevel: 4,
        averageSentenceLength: 20,
        punctuationStyle: 'formal'
      };

      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValue(JSON.stringify(cachedStyle));

      const result = AI.getWritingStyle();

      expect(result).toEqual(cachedStyle);
      expect(global.GmailApp.search).not.toHaveBeenCalled();
    });

    it('should analyze emails if no cached style', () => {
      const mockThread = {
        getMessages: jest.fn(() => [
          {
            getFrom: jest.fn(() => 'franz@example.com'),
            getPlainBody: jest.fn(() => 'Hello, this is a test email with sufficient content for analysis.')
          }
        ])
      };

      global.GmailApp.search.mockReturnValue([mockThread]);
      global.Session.getActiveUser().getEmail.mockReturnValue('franz@example.com');

      // Mock successful style analysis
      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  greetings: ['Hello'],
                  closings: ['Best'],
                  sentencePatterns: [],
                  vocabulary: [],
                  formalityLevel: 3,
                  averageSentenceLength: 15,
                  punctuationStyle: 'standard'
                })
              }]
            }
          }]
        }))
      });

      const result = AI.getWritingStyle();

      expect(result.greetings).toContain('Hello');
      expect(global.PropertiesService.getUserProperties().setProperty)
        .toHaveBeenCalledWith(Config.PROPERTY_KEYS.WRITING_STYLE, expect.any(String));
    });

    it('should return default style if analysis fails', () => {
      global.GmailApp.search.mockReturnValue([]);

      const result = AI.getWritingStyle();

      expect(result.greetings).toEqual(['Hi', 'Hello', 'Hey']);
      expect(result.closings).toEqual(['Best regards', 'Thanks', 'Cheers']);
      expect(result.formalityLevel).toBe(3);
    });

    it('should handle corrupt cached data', () => {
      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValue('invalid json');

      global.GmailApp.search.mockReturnValue([]);

      const result = AI.getWritingStyle();

      expect(result.greetings).toEqual(['Hi', 'Hello', 'Hey']);
    });
  });
});