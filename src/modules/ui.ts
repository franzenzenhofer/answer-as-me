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
      .setValue(settings.apiKey ? '••••••••' + settings.apiKey.slice(-4) : '')
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
      .setText('<b>Preview:</b><br>' + Utils.truncate(Utils.escapeHtml(responseText), Constants.UI.MAX_HINT_LENGTH * 2));
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
}