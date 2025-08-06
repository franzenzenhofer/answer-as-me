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

describe('AI Module - JSON Mode and Grounding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.PropertiesService.getUserProperties().getProperty.mockReturnValue(null);
    global.PropertiesService.getUserProperties().getProperties.mockReturnValue({});
  });

  describe('callGeminiAPI with JSON Mode', () => {
    it('should enable strict JSON mode when requested', () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"result": "JSON response"}'
            }]
          }
        }]
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify(mockResponse))
      });

      const result = AI.callGeminiAPI('Test prompt', 'test-key', {
        jsonMode: true
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe('{"result": "JSON response"}');

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      
      expect(payload.generationConfig.response_mime_type).toBe('application/json');
    });

    it('should include response schema when provided', () => {
      const responseSchema: AI.ResponseSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"name": "John", "age": 30}'
            }]
          }
        }]
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify(mockResponse))
      });

      const result = AI.callGeminiAPI('Test prompt', 'test-key', {
        jsonMode: true,
        responseSchema
      });

      expect(result.success).toBe(true);

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      
      expect(payload.generationConfig.response_mime_type).toBe('application/json');
      expect(payload.generationConfig.response_schema).toEqual(responseSchema);
    });
  });

  describe('callGeminiAPI with Grounding', () => {
    it('should enable Google Search grounding when requested', () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Grounded response'
            }]
          },
          groundingMetadata: {
            webSearchQueries: ['test query'],
            searchEntryPoint: { renderedContent: 'Search results' }
          }
        }]
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify(mockResponse))
      });

      const result = AI.callGeminiAPI('Test prompt', 'test-key', {
        enableGrounding: true
      });

      expect(result.success).toBe(true);

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      
      expect(payload.tools).toContainEqual({ google_search: {} });
    });

    it('should log grounding metadata when available', () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Grounded response'
            }]
          },
          groundingMetadata: {
            webSearchQueries: ['query1', 'query2']
          }
        }]
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify(mockResponse))
      });

      AI.callGeminiAPI('Test prompt', 'test-key', {
        enableGrounding: true
      });

      expect(global.AppLogger.info).toHaveBeenCalledWith(
        'Grounding metadata available',
        { searchQueries: 2 }
      );
    });
  });

  describe('callGeminiAPI with Code Execution', () => {
    it('should enable code execution when requested', () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Code execution result'
            }]
          }
        }]
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify(mockResponse))
      });

      const result = AI.callGeminiAPI('Test prompt', 'test-key', {
        enableCodeExecution: true
      });

      expect(result.success).toBe(true);

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      
      expect(payload.tools).toContainEqual({ code_execution: {} });
    });

    it('should enable multiple tools simultaneously', () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'Multi-tool response'
            }]
          }
        }]
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify(mockResponse))
      });

      const result = AI.callGeminiAPI('Test prompt', 'test-key', {
        enableGrounding: true,
        enableCodeExecution: true
      });

      expect(result.success).toBe(true);

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      
      expect(payload.tools).toHaveLength(2);
      expect(payload.tools).toContainEqual({ google_search: {} });
      expect(payload.tools).toContainEqual({ code_execution: {} });
    });
  });

  describe('analyzeWritingStyle with JSON Mode', () => {
    it('should use JSON mode with schema for style analysis', () => {
      const mockStyleResponse = {
        greetings: ['Hi', 'Hello'],
        closings: ['Best', 'Thanks'],
        sentencePatterns: ['Thanks for'],
        vocabulary: ['appreciate'],
        formalityLevel: 3,
        averageSentenceLength: 15,
        emailLength: 'medium',
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

      const emails = ['Email 1 content', 'Email 2 content'];
      const result = AI.analyzeWritingStyle(emails, 'test-key');

      expect(result).toEqual(mockStyleResponse);

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      
      // Verify JSON mode is enabled
      expect(payload.generationConfig.response_mime_type).toBe('application/json');
      
      // Verify schema is included
      expect(payload.generationConfig.response_schema).toBeDefined();
      expect(payload.generationConfig.response_schema.type).toBe('object');
      expect(payload.generationConfig.response_schema.properties).toHaveProperty('greetings');
      expect(payload.generationConfig.response_schema.properties).toHaveProperty('emailLength');
      expect(payload.generationConfig.response_schema.required).toContain('greetings');
      
      // Verify code execution is enabled for pattern analysis
      expect(payload.tools).toContainEqual({ code_execution: {} });
    });

    it('should validate emailLength enum in schema', () => {
      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  greetings: ['Hi'],
                  closings: ['Best'],
                  formalityLevel: 3,
                  averageSentenceLength: 15,
                  emailLength: 'medium',
                  punctuationStyle: 'standard'
                })
              }]
            }
          }]
        }))
      });

      AI.analyzeWritingStyle(['Email content'], 'test-key');

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      const schema = payload.generationConfig.response_schema;
      
      expect(schema.properties.emailLength.enum).toEqual(['short', 'medium', 'long']);
    });

    it('should handle missing emailLength in response', () => {
      const responseWithoutEmailLength = {
        greetings: ['Hi'],
        closings: ['Best'],
        sentencePatterns: [],
        vocabulary: [],
        formalityLevel: 3,
        averageSentenceLength: 15,
        punctuationStyle: 'standard'
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(responseWithoutEmailLength)
              }]
            }
          }]
        }))
      });

      const result = AI.analyzeWritingStyle(['Email content'], 'test-key');

      expect(result).toBeDefined();
      expect(result!.emailLength).toBe('medium'); // Should default to 'medium'
    });
  });

  describe('improveProfileFromThread with JSON Mode', () => {
    it('should use JSON mode with schema for profile improvement', () => {
      const currentProfile: Types.UserProfile = {
        email: 'user@example.com',
        name: 'Test User',
        identity: {
          role: 'Developer',
          expertise: ['TypeScript'],
          communicationStyle: 'Direct'
        },
        personality: {
          formality: 3,
          directness: 4,
          warmth: 3,
          detailLevel: 4
        }
      };

      const improvedProfile = {
        ...currentProfile,
        identity: {
          ...currentProfile.identity,
          expertise: ['TypeScript', 'Google Apps Script']
        }
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(improvedProfile)
              }]
            }
          }]
        }))
      });

      const result = AI.improveProfileFromThread(
        currentProfile,
        'Thread content here',
        'test-key'
      );

      expect(result).toEqual(improvedProfile);

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      
      // Verify JSON mode and grounding are enabled
      expect(payload.generationConfig.response_mime_type).toBe('application/json');
      expect(payload.generationConfig.response_schema).toBeDefined();
      expect(payload.tools).toContainEqual({ google_search: {} });
    });

    it('should validate nested objects in schema', () => {
      const currentProfile: Types.UserProfile = {
        email: 'user@example.com'
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(currentProfile)
              }]
            }
          }]
        }))
      });

      AI.improveProfileFromThread(currentProfile, 'Thread', 'test-key');

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      const schema = payload.generationConfig.response_schema;
      
      // Verify nested object schemas
      expect(schema.properties.identity.type).toBe('object');
      expect(schema.properties.identity.properties.role.type).toBe('string');
      expect(schema.properties.personality.properties.formality.minimum).toBe(1);
      expect(schema.properties.personality.properties.formality.maximum).toBe(5);
    });
  });

  describe('generateEmailResponse with Grounding', () => {
    it('should enable grounding for email generation', () => {
      const context: Types.EmailContext = {
        messageId: 'msg-123',
        threadId: 'thread-123',
        from: 'sender@example.com',
        to: 'user@example.com',
        subject: 'Question about latest features',
        body: 'What are the latest features?',
        date: new Date(),
        isReply: false
      };

      const style: Types.WritingStyle = {
        greetings: ['Hi'],
        closings: ['Best'],
        sentencePatterns: [],
        vocabulary: [],
        formalityLevel: 3,
        averageSentenceLength: 15,
        emailLength: 'medium',
        punctuationStyle: 'standard'
      };

      const userProfile: Types.UserProfile = {
        email: 'user@example.com',
        name: 'User'
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: 'Response with grounded information'
              }]
            }
          }]
        }))
      });

      AI.generateEmailResponse(context, style, userProfile, 'test-key');

      const lastCall = global.UrlFetchApp.fetch.mock.calls[0];
      const payload = JSON.parse(lastCall[1].payload);
      
      // Verify grounding is enabled but not JSON mode
      expect(payload.tools).toContainEqual({ google_search: {} });
      expect(payload.generationConfig.response_mime_type).toBeUndefined();
    });
  });

  describe('getWritingStyle with null handling', () => {
    it('should return null when no API key is configured', () => {
      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValue(null);

      const result = AI.getWritingStyle();

      expect(result).toBeNull();
      expect(global.AppLogger.error).toHaveBeenCalledWith('No API key configured');
    });

    it('should return null when no sent emails found', () => {
      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValueOnce(null) // No cached style
        .mockReturnValue('test-key'); // API key
      
      global.GmailService.getRecentSentEmails.mockReturnValue([]);

      const result = AI.getWritingStyle();

      expect(result).toBeNull();
    });

    it('should cache successful style analysis', () => {
      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValueOnce(null) // No cached style
        .mockReturnValue('test-key'); // API key

      const emails = [{ body: 'Email content' }];
      global.GmailService.getRecentSentEmails.mockReturnValue(emails);

      const styleResponse = {
        greetings: ['Hi'],
        closings: ['Best'],
        sentencePatterns: [],
        vocabulary: [],
        formalityLevel: 3,
        averageSentenceLength: 15,
        emailLength: 'medium',
        punctuationStyle: 'standard'
      };

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(styleResponse)
              }]
            }
          }]
        }))
      });

      const result = AI.getWritingStyle();

      expect(result).toEqual(styleResponse);
      expect(global.PropertiesService.getUserProperties().setProperty)
        .toHaveBeenCalledWith(
          Constants.PROPERTIES.WRITING_STYLE,
          JSON.stringify(styleResponse)
        );
    });
  });
});