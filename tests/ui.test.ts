import '../src/modules/types';
import '../src/modules/config';
import '../src/modules/utils';
import '../src/modules/ui';

declare const global: any;

describe('UI Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock chain returns
    const mockCardBuilder = {
      setHeader: jest.fn().mockReturnThis(),
      addSection: jest.fn().mockReturnThis(),
      build: jest.fn(() => ({}))
    };
    
    const mockSection = {
      setHeader: jest.fn().mockReturnThis(),
      addWidget: jest.fn().mockReturnThis()
    };

    const mockTextInput = {
      setFieldName: jest.fn().mockReturnThis(),
      setTitle: jest.fn().mockReturnThis(),
      setValue: jest.fn().mockReturnThis(),
      setHint: jest.fn().mockReturnThis(),
      setMultiline: jest.fn().mockReturnThis()
    };

    const mockButton = {
      setText: jest.fn().mockReturnThis(),
      setOnClickAction: jest.fn().mockReturnThis(),
      setTextButtonStyle: jest.fn().mockReturnThis()
    };

    const mockAction = {
      setFunctionName: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis()
    };

    global.CardService.newCardBuilder.mockReturnValue(mockCardBuilder);
    global.CardService.newCardSection.mockReturnValue(mockSection);
    global.CardService.newTextInput.mockReturnValue(mockTextInput);
    global.CardService.newTextButton.mockReturnValue(mockButton);
    global.CardService.newAction.mockReturnValue(mockAction);
  });

  describe('buildMainCard', () => {
    const mockSettings: Types.UserSettings = {
      apiKey: 'test-key',
      responseMode: Types.ResponseMode.DRAFT,
      autoReply: false,
      formalityLevel: 3,
      responseLength: Types.ResponseLength.MEDIUM,
      customInstructions: '',
      signature: ''
    };

    it('should build main card with generate button', () => {
      const card = UI.buildMainCard(mockSettings);

      expect(global.CardService.newCardBuilder).toHaveBeenCalled();
      expect(global.CardService.newTextButton).toHaveBeenCalled();
      
      const buttonCall = global.CardService.newTextButton.mock.results[0].value;
      expect(buttonCall.setText).toHaveBeenCalledWith('Generate Response');
      expect(buttonCall.setOnClickAction).toHaveBeenCalled();
    });

    it('should show warning if API key not set', () => {
      const settingsNoKey = { ...mockSettings, apiKey: '' };
      
      UI.buildMainCard(settingsNoKey);

      expect(global.CardService.newTextParagraph).toHaveBeenCalled();
      const paragraphCall = global.CardService.newTextParagraph.mock.calls[0];
      expect(paragraphCall[0]).toEqual(expect.objectContaining({
        setText: expect.any(Function)
      }));
    });

    it('should include header with title', () => {
      UI.buildMainCard(mockSettings);

      const headerCall = global.CardService.newCardHeader.mock.results[0].value;
      expect(headerCall.setTitle).toHaveBeenCalledWith('Answer As Me');
      expect(headerCall.setSubtitle).toHaveBeenCalledWith('AI-powered email responses');
    });
  });

  describe('buildSettingsCard', () => {
    const mockSettings: Types.UserSettings = {
      apiKey: 'test-key-123',
      responseMode: Types.ResponseMode.DRAFT,
      autoReply: false,
      formalityLevel: 3,
      responseLength: Types.ResponseLength.MEDIUM,
      customInstructions: 'Be friendly',
      signature: 'Best,\\nFranz'
    };

    it('should build settings card with all fields', () => {
      const card = UI.buildSettingsCard(mockSettings);

      expect(global.CardService.newCardBuilder).toHaveBeenCalled();
      expect(global.CardService.newTextInput).toHaveBeenCalled();
      
      // Check API key input
      const apiKeyInput = global.CardService.newTextInput.mock.results[0].value;
      expect(apiKeyInput.setFieldName).toHaveBeenCalledWith('apiKey');
      expect(apiKeyInput.setValue).toHaveBeenCalledWith('••••••••-123');
    });

    it('should mask API key', () => {
      UI.buildSettingsCard(mockSettings);

      const apiKeyInput = global.CardService.newTextInput.mock.results[0].value;
      expect(apiKeyInput.setValue).not.toHaveBeenCalledWith('test-key-123');
      expect(apiKeyInput.setValue).toHaveBeenCalledWith('••••••••-123');
    });

    it('should include save button', () => {
      UI.buildSettingsCard(mockSettings);

      const saveButton = global.CardService.newTextButton.mock.results.find(
        result => result.value.setText.mock.calls[0][0] === 'Save Settings'
      );
      expect(saveButton).toBeDefined();
    });

    it('should handle empty API key', () => {
      const settingsNoKey = { ...mockSettings, apiKey: '' };
      
      UI.buildSettingsCard(settingsNoKey);

      const apiKeyInput = global.CardService.newTextInput.mock.results[0].value;
      expect(apiKeyInput.setValue).toHaveBeenCalledWith('');
    });
  });

  describe('buildResponseCard', () => {
    it('should build response card with generated text', () => {
      const responseText = 'Hi John,\\n\\nThanks for your message.\\n\\nBest regards';
      const draftId = 'draft-123';

      const card = UI.buildResponseCard(responseText, draftId);

      expect(global.CardService.newCardBuilder).toHaveBeenCalled();
      
      // Check text area
      const textArea = global.CardService.newTextInput.mock.results[0].value;
      expect(textArea.setFieldName).toHaveBeenCalledWith('editedResponse');
      expect(textArea.setValue).toHaveBeenCalledWith(responseText);
      expect(textArea.setMultiline).toHaveBeenCalledWith(true);
    });

    it('should include action buttons', () => {
      UI.buildResponseCard('Response', 'draft-123');

      const buttonTexts = global.CardService.newTextButton.mock.results.map(
        result => result.value.setText.mock.calls[0][0]
      );

      expect(buttonTexts).toContain('Send');
      expect(buttonTexts).toContain('Save as Draft');
    });

    it('should pass draft ID in parameters', () => {
      UI.buildResponseCard('Response', 'draft-123');

      const actionCalls = global.CardService.newAction.mock.results;
      const parametersCall = actionCalls.find(
        result => result.value.setParameters.mock.calls.length > 0
      );

      expect(parametersCall.value.setParameters).toHaveBeenCalledWith({
        draftId: 'draft-123'
      });
    });
  });

  describe('buildHelpCard', () => {
    it('should build help card with instructions', () => {
      const card = UI.buildHelpCard();

      expect(global.CardService.newCardBuilder).toHaveBeenCalled();
      expect(global.CardService.newTextParagraph).toHaveBeenCalled();
      
      // Should have multiple help sections
      const paragraphCalls = global.CardService.newTextParagraph.mock.calls;
      expect(paragraphCalls.length).toBeGreaterThan(3);
    });

    it('should include API key link', () => {
      UI.buildHelpCard();

      const linkButton = global.CardService.newTextButton.mock.results.find(
        result => result.value.setText.mock.calls[0][0] === 'Get API Key'
      );
      
      expect(linkButton).toBeDefined();
      expect(global.CardService.newOpenLink).toHaveBeenCalled();
    });
  });

  describe('buildErrorCard', () => {
    it('should build error card with message', () => {
      const card = UI.buildErrorCard('Something went wrong');

      expect(global.CardService.newCardBuilder).toHaveBeenCalled();
      
      const headerCall = global.CardService.newCardHeader.mock.results[0].value;
      expect(headerCall.setTitle).toHaveBeenCalledWith('⚠️ Error');
    });

    it('should include error message', () => {
      UI.buildErrorCard('API key invalid');

      const paragraphCall = global.CardService.newTextParagraph.mock.calls[0];
      expect(paragraphCall[0]).toEqual(expect.objectContaining({
        setText: expect.any(Function)
      }));
    });

    it('should include help link for certain errors', () => {
      UI.buildErrorCard('API key not found');

      const helpButton = global.CardService.newTextButton.mock.results.find(
        result => result.value.setText.mock.calls[0]?.[0]?.includes('Help')
      );

      expect(helpButton).toBeDefined();
    });
  });

  describe('buildLoadingCard', () => {
    it('should build loading card with message', () => {
      const card = UI.buildLoadingCard('Generating response...');

      expect(global.CardService.newCardBuilder).toHaveBeenCalled();
      
      const headerCall = global.CardService.newCardHeader.mock.results[0].value;
      expect(headerCall.setTitle).toHaveBeenCalledWith('Answer As Me');
      expect(headerCall.setSubtitle).toHaveBeenCalledWith('Generating response...');
    });

    it('should use default message if none provided', () => {
      UI.buildLoadingCard();

      const headerCall = global.CardService.newCardHeader.mock.results[0].value;
      expect(headerCall.setSubtitle).toHaveBeenCalledWith('Processing...');
    });
  });

  describe('formatResponseText', () => {
    it('should format response text with line breaks', () => {
      const input = 'Line 1\\nLine 2\\n\\nLine 3';
      const result = UI.formatResponseText(input);

      expect(result).toContain('<br>');
      expect(result).not.toContain('\\n');
    });

    it('should escape HTML entities', () => {
      const input = 'Test <script>alert("xss")</script> & symbols';
      const result = UI.formatResponseText(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&amp;');
    });

    it('should handle empty input', () => {
      const result = UI.formatResponseText('');
      expect(result).toBe('');
    });
  });
});