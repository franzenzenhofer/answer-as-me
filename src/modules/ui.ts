namespace UI {
  /**
   * Build the main card - COMPLETE AND POWERFUL
   */
  export function buildMainCard(settings: Types.Config): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    card.setHeader(buildHeader());
    
    // Show everything users need
    if (!settings.apiKey) {
      card.addSection(buildSetupSection());
    } else {
      card.addSection(buildStatusSection(settings));
    }
    
    card.addSection(buildQuickLinksSection());
    card.addSection(buildConfigSection(settings));
    card.addSection(buildAdvancedSection(settings));
    card.addSection(buildActionSection());
    
    return card.build();
  }
  
  /**
   * Build header
   */
  function buildHeader(): GoogleAppsScript.Card_Service.CardHeader {
    const deployInfo = Constants.METADATA.DEPLOY_TIME ? 
      ` - Deployed: ${Constants.METADATA.DEPLOY_TIME}` : '';
    
    return CardService.newCardHeader()
      .setTitle(Constants.METADATA.APP_NAME)
      .setSubtitle(`v${Constants.METADATA.APP_VERSION}${deployInfo}`)
      .setImageStyle(CardService.ImageStyle.CIRCLE)
      .setImageUrl(Constants.UI.ICON_MAIN);
  }
  
  
  /**
   * Build setup section for new users
   */
  function buildSetupSection(): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection()
      .setHeader('🚀 Quick Setup');
    
    section.addWidget(
      CardService.newTextParagraph()
        .setText('<b>Welcome! Let\'s get started:</b>')
    );
    
    // Step 1: Get API Key
    const getKeyButton = CardService.newTextButton()
      .setText('1️⃣ Get Free API Key')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl('https://makersuite.google.com/app/apikey')
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      );
    section.addWidget(getKeyButton);
    
    section.addWidget(
      CardService.newTextParagraph()
        .setText('2️⃣ Enter your API key below and click Save')
    );
    
    return section;
  }
  
  /**
   * Build status section for existing users
   */
  function buildStatusSection(settings: Types.Config): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection()
      .setHeader('📊 Status');
    
    // API Key status
    const apiStatus = CardService.newDecoratedText()
      .setText(settings.apiKey ? '✅ Connected' : '❌ Not Set')
      .setTopLabel('API Key')
      .setIcon(CardService.Icon.STAR);
    section.addWidget(apiStatus);
    
    // Style analysis status
    const hasStyle = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
    const styleStatus = CardService.newDecoratedText()
      .setText(hasStyle ? '✅ Analyzed' : '⏳ Pending')
      .setTopLabel('Writing Style')
      .setIcon(CardService.Icon.PERSON);
    section.addWidget(styleStatus);
    
    // Prompts status
    const promptsDocId = PropertyManager.getProperty(Constants.PROPERTIES.PROMPTS_DOC_ID, 'script');
    const promptsStatus = CardService.newDecoratedText()
      .setText(promptsDocId ? '✅ Configured' : '⏳ Default')
      .setTopLabel('Prompts')
      .setIcon(CardService.Icon.DESCRIPTION);
    section.addWidget(promptsStatus);
    
    return section;
  }
  
  /**
   * Build quick links section
   */
  function buildQuickLinksSection(): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection()
      .setHeader('Quick Access');
    
    // Manage Prompts button
    const promptsButton = CardService.newTextButton()
      .setText('📝 Manage Prompts')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onPromptEditor')
      );
    section.addWidget(promptsButton);
    
    // View Style Analysis button
    const styleButton = CardService.newTextButton()
      .setText('✍️ View Your Style')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onStyleAnalysis')
      );
    section.addWidget(styleButton);
    
    // Open Prompts Document button
    const docsButton = CardService.newTextButton()
      .setText('📄 Open Prompts Doc')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onViewPromptsDoc')
      );
    section.addWidget(docsButton);
    
    return section;
  }
  
  /**
   * Build configuration section
   */
  function buildConfigSection(settings: Types.Config): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection()
      .setHeader('Configuration');
    
    // API Key input
    const apiKeyInput = CardService.newTextInput()
      .setFieldName(Constants.UI.FIELD_API_KEY)
      .setTitle('Gemini API Key')
      .setValue(settings.apiKey ? `••••••••${  settings.apiKey.slice(-4)}` : '')
      .setHint('Your Gemini API key');
    
    section.addWidget(apiKeyInput);
    
    return section;
  }
  
  /**
   * Build advanced section with all power features
   */
  function buildAdvancedSection(settings: Types.Config): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection()
      .setHeader('⚙️ Advanced');
    
    // Response length
    const lengthDropdown = CardService.newSelectionInput()
      .setFieldName('responseLength')
      .setTitle('Response Length')
      .setType(CardService.SelectionInputType.DROPDOWN)
      .addItem('Short (1-2 sentences)', 'short', settings.responseLength === 'short')
      .addItem('Medium (3-5 sentences)', 'medium', settings.responseLength === 'medium')
      .addItem('Long (6+ sentences)', 'long', settings.responseLength === 'long');
    section.addWidget(lengthDropdown);
    
    // Custom instructions
    const instructionsInput = CardService.newTextInput()
      .setFieldName('customInstructions')
      .setTitle('Custom Instructions')
      .setValue(settings.customInstructions || '')
      .setHint('Special instructions for all responses')
      .setMultiline(true);
    section.addWidget(instructionsInput);
    
    // Signature
    const signatureInput = CardService.newTextInput()
      .setFieldName(Constants.UI.FIELD_SIGNATURE)
      .setTitle('Email Signature')
      .setValue(settings.signature)
      .setHint('Your email signature')
      .setMultiline(true);
    section.addWidget(signatureInput);
    
    return section;
  }
  
  /**
   * Build action section
   */
  function buildActionSection(): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection();
    
    // Generate response button
    const generateButton = CardService.newTextButton()
      .setText(Constants.UI.BUTTON_GENERATE)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('generateResponse')
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
    
    // Save settings button
    const saveButton = CardService.newTextButton()
      .setText(Constants.UI.BUTTON_SAVE_SETTINGS)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('saveSettings')
      );
    
    const buttonSet = CardService.newButtonSet()
      .addButton(generateButton)
      .addButton(saveButton);
    
    section.addWidget(buttonSet);
    
    return section;
  }
  
  /**
   * Build response preview card
   */
  export function buildResponseCard(
    responseText: string,
    _draftId?: string
  ): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    
    const header = CardService.newCardHeader()
      .setTitle(Constants.UI.TITLE_RESPONSE)
      .setSubtitle(Constants.UI.MSG_RESPONSE_GENERATED);
    
    card.setHeader(header);
    
    const section = CardService.newCardSection();
    
    // Response preview
    const previewText = CardService.newTextParagraph()
      .setText(`<b>Preview:</b><br>${  Utils.truncate(Utils.escapeHtml(responseText), Constants.UI.MAX_HINT_LENGTH * 2)}`);
    section.addWidget(previewText);
    
    // Open draft button
    const openButton = CardService.newTextButton()
      .setText('Open Draft in Gmail')
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl('https://mail.google.com/mail/u/0/#drafts')
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      );
    
    const buttonSet = CardService.newButtonSet()
      .addButton(openButton);
    
    section.addWidget(buttonSet);
    card.addSection(section);
    
    return card.build();
  }
  
  /**
   * Build error card
   */
  export function buildErrorCard(error: string): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    
    const header = CardService.newCardHeader()
      .setTitle(Constants.UI.MSG_ERROR)
      .setSubtitle('Something went wrong');
    
    card.setHeader(header);
    
    const section = CardService.newCardSection();
    
    const errorText = CardService.newTextParagraph()
      .setText(`<font color="#ff0000">${Utils.escapeHtml(error)}</font>`);
    
    section.addWidget(errorText);
    
    const backButton = CardService.newTextButton()
      .setText('Go Back')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onHomepage')
      );
    
    section.addWidget(backButton);
    card.addSection(section);
    
    return card.build();
  }
  
  /**
   * Show notification
   */
  export function showNotification(message: string): GoogleAppsScript.Card_Service.ActionResponse {
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText(message)
      )
      .build();
  }
  
  /**
   * Build help card
   */
  export function buildHelpCard(): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    
    const header = CardService.newCardHeader()
      .setTitle(`${Constants.UI.TITLE_HELP} - ${Constants.METADATA.APP_NAME}`)
      .setSubtitle('How to use this add-on');
    
    card.setHeader(header);
    
    const section = CardService.newCardSection();
    
    const helpText = CardService.newTextParagraph()
      .setText(
        '<b>Getting Started:</b><br>' +
        '1. Enter your Gemini API key<br>' +
        '2. Choose your response mode<br>' +
        '3. Customize settings as needed<br>' +
        '4. Click "Generate Response" on any email<br><br>' +
        '<b>Response Modes:</b><br>' +
        '• Draft: Creates draft replies<br>' +
        '• Suggest: Shows inline suggestions<br>' +
        '• Template: Uses pre-defined templates<br>' +
        '• Auto: Sends automatically (use with caution!)<br><br>' +
        '<b>Tips:</b><br>' +
        '• The AI learns from your sent emails<br>' +
        '• Adjust formality based on recipient<br>' +
        '• Use custom instructions for specific needs'
      );
    
    section.addWidget(helpText);
    card.addSection(section);
    
    return card.build();
  }

  /**
   * Build prompt management card
   */
  export function buildPromptManagementCard(): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('Prompt Management')
        .setSubtitle('Manage your Google Docs prompts')
        .setImageStyle(CardService.ImageStyle.SQUARE)
        .setImageUrl(Constants.UI.ICON_MAIN)
    );

    // Check for automatic updates
    GoogleDocsPrompts.checkForAutomaticUpdates();
    
    // Get all prompt statuses
    const statuses = GoogleDocsPrompts.getAllPromptStatuses();
    
    // Create status section
    const statusSection = CardService.newCardSection()
      .setHeader('<b>Prompt Documents Status</b>');
    
    statuses.forEach(status => {
      const docName = Constants.PROMPTS.DOC_NAMES[status.type] || status.type;
      const statusText = status.hasDoc 
        ? `✅ ${docName} (v${status.version})${status.hasUpdate ? ' 🔄' : ''}`
        : `❌ ${docName} - Not created`;
      
      const widget = CardService.newDecoratedText()
        .setText(statusText)
        .setBottomLabel(status.hasDoc ? 'Click to edit' : 'Click to create');
      
      if (status.url) {
        widget.setOpenLink(
          CardService.newOpenLink()
            .setUrl(status.url)
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
        );
      } else {
        widget.setOnClickAction(
          CardService.newAction()
            .setFunctionName('handleCreatePromptDoc')
            .setParameters({ promptType: status.type })
        );
      }
      
      statusSection.addWidget(widget);
    });
    
    card.addSection(statusSection);
    
    // Actions section
    const actionsSection = CardService.newCardSection()
      .setHeader('<b>Actions</b>');
    
    // Update all button
    const updateButton = CardService.newTextButton()
      .setText('Update All Prompts')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('handleUpdateAllPrompts')
      );
    
    actionsSection.addWidget(updateButton);
    
    // Info text
    const infoText = CardService.newTextParagraph()
      .setText(
        '<br><b>ℹ️ About Prompt Documents:</b><br>' +
        '• Each prompt type has its own Google Doc<br>' +
        '• Edit prompts directly in Google Docs<br>' +
        '• Changes are cached for 1 hour<br>' +
        '• Version tracking shows when updates are available<br>' +
        '• Prompts persist even after add-on reset'
      );
    
    actionsSection.addWidget(infoText);
    card.addSection(actionsSection);
    
    return card.build();
  }

  /**
   * Show prompt update notification
   */
  export function showPromptUpdateNotification(
    updated: string[], 
    failed: string[]
  ): GoogleAppsScript.Card_Service.ActionResponse {
    let message = '';
    
    if (updated.length > 0) {
      const updatedNames = updated.map(type => 
        Constants.PROMPTS.DOC_NAMES[type] || type
      ).join(', ');
      message += `✅ Updated: ${updatedNames}`;
    }
    
    if (failed.length > 0) {
      const failedNames = failed.map(type => 
        Constants.PROMPTS.DOC_NAMES[type] || type
      ).join(', ');
      message += `\n❌ Failed: ${failedNames}`;
    }
    
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText(message || 'No updates needed')
      )
      .build();
  }

  /**
   * Build settings card with prompt management
   */
  export function buildSettingsCard(settings: Types.Config): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('Settings')
        .setSubtitle('Configure your preferences')
        .setImageStyle(CardService.ImageStyle.SQUARE)
        .setImageUrl(Constants.UI.ICON_MAIN)
    );
    
    // API Key section
    const apiSection = CardService.newCardSection()
      .setHeader('<b>API Configuration</b>');
    
    const apiKeyInput = CardService.newTextInput()
      .setFieldName('apiKey')
      .setTitle('Gemini API Key')
      .setValue(settings.apiKey ? `••••••${  settings.apiKey.slice(-4)}` : '')
      .setHint('Your Google Gemini API key');
    
    apiSection.addWidget(apiKeyInput);
    
    // Response settings section
    const responseSection = CardService.newCardSection()
      .setHeader('<b>Response Settings</b>');
    
    const formalityDropdown = CardService.newSelectionInput()
      .setFieldName('formalityLevel')
      .setTitle('Default Formality')
      .setType(CardService.SelectionInputType.DROPDOWN);
    
    Constants.STYLE.FORMALITY_LABELS.forEach((label, index) => {
      formalityDropdown.addItem(label, (index + 1).toString(), 
        settings.formalityLevel === index + 1);
    });
    
    responseSection.addWidget(formalityDropdown);
    
    // Custom instructions
    const instructionsInput = CardService.newTextInput()
      .setFieldName('customInstructions')
      .setTitle('Custom Instructions')
      .setValue(settings.customInstructions || '')
      .setHint('Special instructions for all responses')
      .setMultiline(true);
    
    responseSection.addWidget(instructionsInput);
    
    // Signature
    const signatureInput = CardService.newTextInput()
      .setFieldName('signature')
      .setTitle('Email Signature')
      .setValue(settings.signature || '')
      .setHint('Your email signature')
      .setMultiline(true);
    
    responseSection.addWidget(signatureInput);
    
    card.addSection(apiSection);
    card.addSection(responseSection);
    
    // Save button
    const saveButton = CardService.newTextButton()
      .setText('Save Settings')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('saveSettings')
      );
    
    const buttonSection = CardService.newCardSection();
    buttonSection.addWidget(saveButton);
    
    // Prompt management link
    const promptLink = CardService.newTextButton()
      .setText('Manage Prompts')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('showPromptManagement')
      );
    
    buttonSection.addWidget(promptLink);
    
    // Prompts document section
    const promptsDocSection = CardService.newCardSection()
      .setHeader('<b>Prompts Document</b>');
    
    // Get current prompts doc ID
    const promptsDocId = PropertyManager.getProperty(Constants.PROPERTIES.PROMPTS_DOC_ID, 'script');
    if (promptsDocId) {
      try {
        const doc = DocumentApp.openById(promptsDocId);
        const url = doc.getUrl();
        
        const docInfo = CardService.newDecoratedText()
          .setText(doc.getName())
          .setTopLabel('Current Prompts Document')
          .setBottomLabel(`ID: ${promptsDocId}`)
          .setIcon(CardService.Icon.DESCRIPTION);
        promptsDocSection.addWidget(docInfo);
        
        // Direct link to document
        const docLink = CardService.newTextParagraph()
          .setText(`<a href="${url}">📄 Open in Google Docs</a>`);
        promptsDocSection.addWidget(docLink);
        
        const editDocsButton = CardService.newTextButton()
          .setText('📝 Edit Prompts')
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onViewPromptsDoc')
          );
        promptsDocSection.addWidget(editDocsButton);
        
        // Info about fresh loading
        const infoText = CardService.newTextParagraph()
          .setText('<i>✅ Prompts are loaded fresh from this document on every AI request</i>');
        promptsDocSection.addWidget(infoText);
      } catch (error) {
        AppLogger.error('Failed to load prompt document info', error);
        const errorText = CardService.newTextParagraph()
          .setText('Error loading prompt document. Click "Manage Prompts" to recreate.');
        promptsDocSection.addWidget(errorText);
      }
    } else {
      const noDocText = CardService.newTextParagraph()
        .setText('No prompts document created yet. Click "Manage Prompts" to create one.');
      promptsDocSection.addWidget(noDocText);
    }
    
    card.addSection(promptsDocSection);
    card.addSection(buttonSection);
    
    return card.build();
  }
  
  /**
   * Build Prompt Editor card
   */
  export function buildPromptEditorCard(): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('Prompt Editor')
        .setSubtitle('Customize AI prompts')
    );
    
    // Prompt types section
    const section = CardService.newCardSection()
      .setHeader('Available Prompts');
    
    // Main prompt
    const mainPromptButton = CardService.newTextButton()
      .setText('Edit Main Response Prompt')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('handleCreatePromptDoc')
          .setParameters({ promptType: 'main' })
      );
    section.addWidget(mainPromptButton);
    
    // Style analysis prompt
    const stylePromptButton = CardService.newTextButton()
      .setText('Edit Style Analysis Prompt')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('handleCreatePromptDoc')
          .setParameters({ promptType: 'style' })
      );
    section.addWidget(stylePromptButton);
    
    // Profile prompt
    const profilePromptButton = CardService.newTextButton()
      .setText('Edit Profile Generation Prompt')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('handleCreatePromptDoc')
          .setParameters({ promptType: 'profile' })
      );
    section.addWidget(profilePromptButton);
    
    // Instructions
    const instructionSection = CardService.newCardSection();
    instructionSection.addWidget(
      CardService.newTextParagraph()
        .setText('<b>How it works:</b><br>' +
          '• Click a prompt type above to open in Google Docs<br>' +
          '• Edit the prompt content directly in the document<br>' +
          '• Changes are saved automatically<br>' +
          '• The AI will use your custom prompts immediately')
    );
    
    // Update all button
    const updateButton = CardService.newTextButton()
      .setText('Update All Prompts')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('handleUpdateAllPrompts')
      );
    instructionSection.addWidget(updateButton);
    
    card.addSection(section);
    card.addSection(instructionSection);
    
    return card.build();
  }
  
  /**
   * Build Style Analysis card
   */
  export function buildStyleAnalysisCard(style: Types.WritingStyle | null): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('Your Writing Style')
        .setSubtitle('AI analysis of your email patterns')
    );
    
    if (!style) {
      const errorSection = CardService.newCardSection();
      errorSection.addWidget(
        CardService.newTextParagraph()
          .setText('No writing style analysis available yet.<br><br>' +
            'Send some emails first, then the AI will learn your style.')
      );
      
      const refreshButton = CardService.newTextButton()
        .setText('Analyze Now')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onStyleAnalysis')
        );
      errorSection.addWidget(refreshButton);
      
      card.addSection(errorSection);
      return card.build();
    }
    
    // Style details
    const styleSection = CardService.newCardSection()
      .setHeader('Communication Style');
    
    // Formality
    const formalityText = CardService.newDecoratedText()
      .setText(Constants.STYLE.FORMALITY_LABELS[style.formalityLevel - 1] || 'Neutral')
      .setTopLabel('Formality Level')
      .setIcon(CardService.Icon.PERSON);
    styleSection.addWidget(formalityText);
    
    // Tone - removed as not in WritingStyle type
    
    // Punctuation
    const punctuationText = CardService.newDecoratedText()
      .setText(style.punctuationStyle || 'Standard')
      .setTopLabel('Punctuation Style')
      .setIcon(CardService.Icon.STAR);
    styleSection.addWidget(punctuationText);
    
    card.addSection(styleSection);
    
    // Greetings section
    if (style.greetings && style.greetings.length > 0) {
      const greetingSection = CardService.newCardSection()
        .setHeader('Common Greetings');
      
      const greetingText = CardService.newTextParagraph()
        .setText(style.greetings.join('<br>'));
      greetingSection.addWidget(greetingText);
      
      card.addSection(greetingSection);
    }
    
    // Closings section
    if (style.closings && style.closings.length > 0) {
      const closingSection = CardService.newCardSection()
        .setHeader('Common Closings');
      
      const closingText = CardService.newTextParagraph()
        .setText(style.closings.join('<br>'));
      closingSection.addWidget(closingText);
      
      card.addSection(closingSection);
    }
    
    // Patterns section - removed as not in WritingStyle type
    
    // Refresh button
    const actionSection = CardService.newCardSection();
    const refreshButton = CardService.newTextButton()
      .setText('Refresh Analysis')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onStyleAnalysis')
      );
    actionSection.addWidget(refreshButton);
    
    card.addSection(actionSection);
    
    return card.build();
  }
  
}