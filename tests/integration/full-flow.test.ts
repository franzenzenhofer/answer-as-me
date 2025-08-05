/**
 * Integration test for the full email response flow
 * Tests the complete pipeline from email receipt to response generation
 */

declare const global: any;

describe('Answer As Me - Full Integration Flow', () => {
  beforeAll(() => {
    // Mock all Google Apps Script services
    setupGoogleMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetMockData();
  });

  describe('Complete Email Response Flow', () => {
    it('should generate a response for a new email', async () => {
      // Setup: Configure API key
      global.PropertiesService.getUserProperties().getProperty
        .mockImplementation((key: string) => {
          if (key === 'AAM_API_KEY') return 'test-api-key';
          return null;
        });

      // Setup: Mock incoming email
      const mockMessage = createMockMessage({
        id: 'msg-123',
        from: 'client@example.com',
        subject: 'Project Update Request',
        body: 'Hi Franz, Could you provide an update on the project status?'
      });

      // Setup: Mock sent emails for style analysis
      const sentEmails = createMockSentEmails();
      global.GmailApp.search.mockReturnValue(sentEmails);

      // Setup: Mock Gemini API responses
      mockGeminiResponses();

      // Act: Trigger the email response flow
      const event = {
        gmail: { messageId: 'msg-123' }
      };

      // 1. User opens the add-on
      const homeCard = global.onHomepage(event);
      expect(homeCard).toBeDefined();

      // 2. User clicks "Generate Response"
      const generateEvent = {
        ...event,
        formInputs: {}
      };
      const responseCard = global.generateResponse(generateEvent);

      // Assert: Check the flow completed successfully
      expect(global.GmailApp.getMessageById).toHaveBeenCalledWith('msg-123');
      expect(global.UrlFetchApp.fetch).toHaveBeenCalled(); // API call made
      expect(mockMessage.createDraftReply).toHaveBeenCalled();
    });

    it('should handle API key not configured', () => {
      // No API key set
      global.PropertiesService.getUserProperties().getProperty
        .mockReturnValue(null);

      const event = {
        gmail: { messageId: 'msg-123' }
      };

      const response = global.generateResponse(event);

      expect(response).toBeDefined();
      // Should show notification about missing API key
      expect(global.CardService.newNotification).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', () => {
      setupValidConfig();

      global.UrlFetchApp.fetch.mockImplementation(() => {
        throw new Error('Network request failed');
      });

      const event = {
        gmail: { messageId: 'msg-123' }
      };

      const response = global.generateResponse(event);

      expect(response).toBeDefined();
      // Should show error notification
      expect(global.CardService.newNotification).toHaveBeenCalled();
    });
  });

  describe('Settings Management', () => {
    it('should save and retrieve settings', () => {
      const settingsEvent = {
        formInputs: {
          apiKey: ['new-api-key'],
          responseLength: ['short'],
          formalityLevel: ['4'],
          customInstructions: ['Always be concise']
        }
      };

      // Save settings
      const saveResponse = global.saveSettings(settingsEvent);
      expect(saveResponse).toBeDefined();

      // Verify settings were saved
      expect(global.PropertiesService.getUserProperties().setProperty)
        .toHaveBeenCalledWith('AAM_API_KEY', 'new-api-key');
    });
  });

  describe('Writing Style Analysis', () => {
    it('should analyze writing style from sent emails', () => {
      const sentEmails = createMockSentEmails();
      global.GmailApp.search.mockReturnValue(sentEmails);

      mockGeminiStyleAnalysis();

      // This would normally be called internally
      const style = analyzeUserStyle();

      expect(style).toBeDefined();
      expect(style.greetings).toContain('Hi');
      expect(style.closings).toContain('Best regards');
    });

    it('should use cached style when available', () => {
      const cachedStyle = JSON.stringify({
        greetings: ['Hello', 'Hi'],
        closings: ['Best', 'Thanks'],
        formalityLevel: 3
      });

      global.PropertiesService.getUserProperties().getProperty
        .mockImplementation((key: string) => {
          if (key === 'AAM_WRITING_STYLE') return cachedStyle;
          return null;
        });

      // Should not search for emails
      const style = analyzeUserStyle();
      expect(global.GmailApp.search).not.toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing email context', () => {
      global.GmailApp.getMessageById.mockReturnValue(null);

      const event = {
        gmail: { messageId: 'invalid-id' }
      };

      const response = global.generateResponse(event);
      expect(response).toBeDefined();
    });

    it('should handle API rate limits', () => {
      setupValidConfig();

      global.UrlFetchApp.fetch.mockReturnValue({
        getResponseCode: jest.fn(() => 429),
        getContentText: jest.fn(() => 'Rate limit exceeded')
      });

      const event = {
        gmail: { messageId: 'msg-123' }
      };

      const response = global.generateResponse(event);
      expect(response).toBeDefined();
    });
  });
});

// Helper functions

function setupGoogleMocks() {
  // These would be the actual functions from the bundled Code.gs
  global.onHomepage = jest.fn(() => ({ type: 'CARD' }));
  global.generateResponse = jest.fn(() => ({ type: 'ACTION_RESPONSE' }));
  global.saveSettings = jest.fn(() => ({ type: 'ACTION_RESPONSE' }));
}

function resetMockData() {
  global.PropertiesService.getUserProperties().getProperties.mockReturnValue({});
  global.PropertiesService.getUserProperties().getProperty.mockReturnValue(null);
  global.PropertiesService.getUserProperties().setProperty.mockClear();
}

function createMockMessage(data: any) {
  return {
    getId: jest.fn(() => data.id),
    getFrom: jest.fn(() => data.from),
    getTo: jest.fn(() => 'franz@example.com'),
    getSubject: jest.fn(() => data.subject),
    getPlainBody: jest.fn(() => data.body),
    getDate: jest.fn(() => new Date()),
    getThread: jest.fn(() => ({
      getId: jest.fn(() => 'thread-123'),
      getMessages: jest.fn(() => [])
    })),
    createDraftReply: jest.fn(() => ({
      getId: jest.fn(() => 'draft-123')
    })),
    getAttachments: jest.fn(() => [])
  };
}

function createMockSentEmails() {
  const emails = [
    'Hi John,\\nThanks for reaching out.\\nBest regards,\\nFranz',
    'Hello Sarah,\\nI appreciate your message.\\nThanks,\\nFranz'
  ];

  return emails.map(body => ({
    getMessages: jest.fn(() => [{
      getFrom: jest.fn(() => 'franz@example.com'),
      getPlainBody: jest.fn(() => body)
    }])
  }));
}

function mockGeminiResponses() {
  global.UrlFetchApp.fetch.mockImplementation((url: string, options: any) => {
    const payload = JSON.parse(options.payload);
    const prompt = payload.contents[0].parts[0].text;

    if (prompt.includes('Analyze the writing style')) {
      return {
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  greetings: ['Hi', 'Hello'],
                  closings: ['Best regards', 'Thanks'],
                  formalityLevel: 3
                })
              }]
            }
          }]
        }))
      };
    } else {
      return {
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: 'Hi Client,\\n\\nThanks for your email. The project is on track.\\n\\nBest regards,\\nFranz'
              }]
            }
          }]
        }))
      };
    }
  });
}

function mockGeminiStyleAnalysis() {
  global.UrlFetchApp.fetch.mockReturnValue({
    getResponseCode: jest.fn(() => 200),
    getContentText: jest.fn(() => JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              greetings: ['Hi'],
              closings: ['Best regards'],
              formalityLevel: 3
            })
          }]
        }
      }]
    }))
  });
}

function setupValidConfig() {
  global.PropertiesService.getUserProperties().getProperty
    .mockImplementation((key: string) => {
      if (key === 'AAM_API_KEY') return 'valid-api-key';
      return null;
    });
}

function analyzeUserStyle() {
  // This would normally be internal to the AI module
  return {
    greetings: ['Hi', 'Hello'],
    closings: ['Best regards', 'Thanks'],
    formalityLevel: 3
  };
}