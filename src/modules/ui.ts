namespace UI {
  /**
   * Build the main card
   */
  export function buildMainCard(settings: Types.Config): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    card.setHeader(buildHeader());
    
    // Add sections
    card.addSection(buildConfigSection(settings));
    card.addSection(buildSettingsSection(settings));
    card.addSection(buildActionSection());
    
    return card.build();
  }
  
  /**
   * Build header
   */
  function buildHeader(): GoogleAppsScript.Card_Service.CardHeader {
    return CardService.newCardHeader()
      .setTitle(Config.APP_NAME)
      .setSubtitle(`v${Config.VERSION} - ${Config.APP_DESCRIPTION}`)
      .setImageStyle(CardService.ImageStyle.CIRCLE)
      .setImageUrl(Constants.UI.ICON_MAIN);
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
   * Build settings section
   */
  function buildSettingsSection(settings: Types.Config): GoogleAppsScript.Card_Service.CardSection {
    const section = CardService.newCardSection()
      .setHeader('Settings');
    
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
    card.addSection(buttonSection);
    
    return card.build();
  }
}