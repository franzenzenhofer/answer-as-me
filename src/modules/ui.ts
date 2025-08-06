namespace UI {
  /**
   * Build the main card - Shows settings if API key not set, otherwise overview
   */
  export function buildMainCard(settings: Types.Config): GoogleAppsScript.Card_Service.Card {
    // If no API key, show settings card
    if (!settings.apiKey) {
      return buildSettingsCard(settings);
    }
    
    // Otherwise show overview card
    return buildOverviewCard(settings);
  }
  
  /**
   * CARD 2: Overview Mode - Main dashboard
   */
  export function buildOverviewCard(settings: Types.Config): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('📧 Answer As Me')
        .setSubtitle('Overview Dashboard')
        .setImageStyle(CardService.ImageStyle.CIRCLE)
        .setImageUrl(Constants.UI.ICON_MAIN)
    );
    
    // System Status Dashboard
    const statusSection = CardService.newCardSection()
      .setHeader('<b>📊 System Status</b>');
    
    const hasStyle = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
    const promptsDocId = PropertyManager.getProperty(Constants.PROPERTIES.PROMPTS_DOC_ID, 'script');
    
    // Dashboard status text - clear and informative
    const apiStatus = settings.apiKey ? '✅ Connected and Working' : '❌ Not Configured';
    const styleStatus = hasStyle ? '✅ Analysis Complete' : '⏳ Will Learn from Your Emails';
    const promptStatus = promptsDocId ? '✅ Documents Created' : '⏳ Will Create on First Use';
    
    const statusDashboard = CardService.newTextParagraph()
      .setText(`
<b>🔑 API Connection:</b> ${apiStatus}<br>
<b>✍️ Writing Style:</b> ${styleStatus}<br>
<b>📄 Prompt System:</b> ${promptStatus}<br>
<br>
<b>📧 Ready to Generate Responses:</b> ${settings.apiKey && hasStyle ? '✅ Yes' : '⚠️ Complete setup first'}
      `);
    
    statusSection.addWidget(statusDashboard);
    
    card.addSection(statusSection);
    
    // Quick Actions Dashboard
    const actionsSection = CardService.newCardSection()
      .setHeader('<b>🚀 Quick Actions</b>');
    
    const dashboardInfo = CardService.newTextParagraph()
      .setText(`
<b>📧 To Generate Responses:</b> Open any email thread<br>
<b>⚙️ To Configure:</b> Click Settings below<br>
<b>📝 To Edit Prompts:</b> Click Prompts below<br>
<b>🧪 To Test API:</b> Go to Settings and click "Test API Key"
      `);
    
    actionsSection.addWidget(dashboardInfo);
    
    // Quick access grid
    const quickActions = CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText('⚙️ Settings')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onSettings')
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('📝 Prompts')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onPromptEditor')
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('❓ Help')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onHelp')
          )
      );
    
    actionsSection.addWidget(quickActions);
    
    card.addSection(actionsSection);
    
    // Recent activity or tips
    const tipsSection = CardService.newCardSection()
      .setHeader('<b>💡 Tips</b>');
    
    const tipsText = CardService.newTextParagraph()
      .setText(
        '• <b>Open any email</b> and click "Generate Response"<br>' +
        '• <b>Customize prompts</b> in Google Docs for better results<br>' +
        '• <b>Style analysis</b> improves with more sent emails<br>' +
        '• <b>All drafts</b> are saved - review before sending!'
      );
    
    tipsSection.addWidget(tipsText);
    card.addSection(tipsSection);
    
    return card.build();
  }

  /**
   * CARD 3: Thread Mode - Email-specific context
   */
  export function buildThreadCard(
    settings: Types.Config,
    emailContext?: any
  ): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('📬 Thread Context')
        .setSubtitle('AI response for this email')
        .setImageStyle(CardService.ImageStyle.CIRCLE)
        .setImageUrl(Constants.UI.ICON_MAIN)
    );
    
    // Check API key first
    if (!settings.apiKey) {
      const setupSection = CardService.newCardSection();
      setupSection.addWidget(
        CardService.newTextParagraph()
          .setText('⚠️ <b>API Key Required</b><br><br>Click Settings to add your API key.')
      );
      
      const settingsButton = CardService.newTextButton()
        .setText('Go to Settings')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onSettings')
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
      setupSection.addWidget(settingsButton);
      
      card.addSection(setupSection);
      return card.build();
    }
    
    // Email context info
    if (emailContext) {
      const contextSection = CardService.newCardSection()
        .setHeader('<b>📧 Current Email</b>');
      
      const emailInfo = CardService.newDecoratedText()
        .setText(emailContext.subject || 'No Subject')
        .setTopLabel('Subject')
        .setBottomLabel(`From: ${emailContext.sender || 'Unknown'}`)
        .setIcon(CardService.Icon.EMAIL);
      
      contextSection.addWidget(emailInfo);
      card.addSection(contextSection);
    }
    
    // Main generate button
    const generateSection = CardService.newCardSection()
      .setHeader('<b>🎯 AI Response</b>');
    
    const generateButton = CardService.newTextButton()
      .setText('Generate Personalized Reply')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('generateResponse')
      );
    
    generateSection.addWidget(generateButton);
    
    // Quick formality adjustment
    const formalitySection = CardService.newCardSection()
      .setHeader('<b>🎭 Quick Adjustments</b>');
    
    const formalityButtons = CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText('😊 Casual')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('generateResponseWithFormality')
              .setParameters({ formality: '1' })
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('💼 Formal')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('generateResponseWithFormality')
              .setParameters({ formality: '5' })
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('🔄 Auto')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('generateResponse')
          )
      );
    
    formalitySection.addWidget(formalityButtons);
    
    card.addSection(generateSection);
    card.addSection(formalitySection);
    
    // Navigation to other cards
    const navSection = CardService.newCardSection();
    
    const navButtons = CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText('📊 Overview')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onHomepage')
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('⚙️ Settings')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onSettings')
          )
      );
    
    navSection.addWidget(navButtons);
    card.addSection(navSection);
    
    return card.build();
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
   * CARD 1: Settings - ALL configuration in one place
   */
  export function buildSettingsCard(settings: Types.Config): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('⚙️ Settings')
        .setSubtitle('All configuration in one place')
        .setImageStyle(CardService.ImageStyle.SQUARE)
        .setImageUrl(Constants.UI.ICON_MAIN)
    );
    
    // API Key section - NEVER HIDE IT!
    const apiSection = CardService.newCardSection()
      .setHeader('<b>🔑 API Configuration</b>');
    
    const apiKeyInput = CardService.newTextInput()
      .setFieldName('apiKey')
      .setTitle('Gemini API Key')
      .setValue(settings.apiKey || '')  // NEVER HIDE - show full key!
      .setHint('Your Google Gemini API key - get one at makersuite.google.com');
    
    apiSection.addWidget(apiKeyInput);
    
    // API Key testing and help
    const keyActions = CardService.newButtonSet();
    
    if (settings.apiKey) {
      // Test API key button
      const testButton = CardService.newTextButton()
        .setText('🧪 Test API Key')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('testApiKey')
        );
      keyActions.addButton(testButton);
    }
    
    const getKeyButton = CardService.newTextButton()
      .setText(settings.apiKey ? '🔗 Get New Key' : '🔗 Get Free API Key')
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl('https://makersuite.google.com/app/apikey')
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      );
    keyActions.addButton(getKeyButton);
    
    apiSection.addWidget(keyActions);
    
    card.addSection(apiSection);
    
    // Response Configuration
    const responseSection = CardService.newCardSection()
      .setHeader('<b>📝 Response Configuration</b>');
    
    // Formality level
    const formalityDropdown = CardService.newSelectionInput()
      .setFieldName('formalityLevel')
      .setTitle('Default Formality')
      .setType(CardService.SelectionInputType.DROPDOWN);
    
    Constants.STYLE.FORMALITY_LABELS.forEach((label, index) => {
      formalityDropdown.addItem(label, (index + 1).toString(), 
        settings.formalityLevel === index + 1);
    });
    
    responseSection.addWidget(formalityDropdown);
    
    // Response length
    const lengthDropdown = CardService.newSelectionInput()
      .setFieldName('responseLength')
      .setTitle('Response Length')
      .setType(CardService.SelectionInputType.DROPDOWN)
      .addItem('Short (1-2 sentences)', 'short', settings.responseLength === 'short')
      .addItem('Medium (3-5 sentences)', 'medium', settings.responseLength === 'medium')
      .addItem('Long (6+ sentences)', 'long', settings.responseLength === 'long');
    responseSection.addWidget(lengthDropdown);
    
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
    
    card.addSection(responseSection);
    
    // KISS: Simplified 3-Prompt Management + Debug Logging
    const promptsSection = CardService.newCardSection()
      .setHeader('<b>📄 KISS Prompt Management - 3 Simple Cards</b>');
    
    // Auto-create documents immediately
    try {
      GoogleDocsPrompts.createAllPromptDocuments();
    } catch (error) {
      DebugLogger.logError('UI', error instanceof Error ? error : String(error), null, 'Failed to create prompt documents in UI');
    }
    
    // Style Analysis Status
    const hasStyle = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
    let styleInfo = 'Style: ⏳ Pending - Send emails to analyze';
    
    if (hasStyle) {
      try {
        const style = JSON.parse(hasStyle);
        const formalityLabel = Constants.STYLE.FORMALITY_LABELS[style.formalityLevel - 1] || 'Neutral';
        styleInfo = `Style: ✅ Analyzed (${formalityLabel}, ${style.greetings?.length || 0} greetings, ${style.closings?.length || 0} closings)`;
      } catch {
        styleInfo = 'Style: ✅ Analyzed (details available)';
      }
    }
    
    const styleText = CardService.newTextParagraph()
      .setText(styleInfo);
    promptsSection.addWidget(styleText);
    
    // Direct links to 3 prompt documents - KISS approach
    const promptInfo = CardService.newTextParagraph()
      .setText('Prompts: ✅ Ready - Click to edit in Google Docs');
    promptsSection.addWidget(promptInfo);
    
    // KISS: Only 3 simple prompt editing buttons
    const promptButtons = CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText('⚙️ Settings')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleCreatePromptDoc')
              .setParameters({ promptType: 'SETTINGS' })
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('📊 Overview')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleCreatePromptDoc')
              .setParameters({ promptType: 'OVERVIEW' })
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('🧵 Thread')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('handleCreatePromptDoc')
              .setParameters({ promptType: 'THREAD' })
          )
      );
    
    promptsSection.addWidget(promptButtons);
    
    card.addSection(promptsSection);
    
    // DEBUG LOGGING SECTION
    const debugSection = CardService.newCardSection()
      .setHeader('<b>🐛 Super Debug Logging</b>');
    
    try {
      const debugSpreadsheetUrl = DebugLogger.getTodaysSpreadsheetUrl();
      if (debugSpreadsheetUrl) {
        const debugInfo = CardService.newTextParagraph()
          .setText(`Debug Log: ✅ <a href="${debugSpreadsheetUrl}">📊 Today's Debug Spreadsheet</a><br>All AI requests, responses, logic & errors logged automatically!`);
        debugSection.addWidget(debugInfo);
      } else {
        const debugInfo = CardService.newTextParagraph()
          .setText('Debug Log: ⚠️ Creating debug spreadsheet...');
        debugSection.addWidget(debugInfo);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      const debugInfo = CardService.newTextParagraph()
        .setText('Debug Log: ❌ Error creating debug spreadsheet');
      debugSection.addWidget(debugInfo);
    }
    
    card.addSection(debugSection);
    
    // DANGER ZONE - Factory Reset
    const dangerSection = CardService.newCardSection()
      .setHeader('<b>🚨 Danger Zone</b>');
    
    const resetWarning = CardService.newTextParagraph()
      .setText('⚠️ Factory reset will delete ALL data: API key, prompts, style analysis, settings. This cannot be undone!');
    dangerSection.addWidget(resetWarning);
    
    const factoryResetButton = CardService.newTextButton()
      .setText('🔴 FACTORY RESET')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('factoryReset')
      );
    
    dangerSection.addWidget(factoryResetButton);
    card.addSection(dangerSection);
    
    // Save button
    const saveButton = CardService.newTextButton()
      .setText('💾 Save All Settings')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('saveSettings')
      );
    
    const buttonSection = CardService.newCardSection();
    buttonSection.addWidget(saveButton);
    card.addSection(buttonSection);
    
    return card.build();
  }
  
  
  
}