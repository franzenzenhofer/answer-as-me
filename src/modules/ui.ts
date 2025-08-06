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
    
    // Quick status
    const statusSection = CardService.newCardSection()
      .setHeader('<b>📊 Status</b>');
    
    const hasStyle = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
    const promptsDocId = PropertyManager.getProperty(Constants.PROPERTIES.PROMPTS_DOC_ID, 'script');
    
    // Combined status display
    const statusGrid = CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText(`🔑 ${settings.apiKey ? '✅' : '❌'}`)
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onSettings')
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText(`✍️ ${hasStyle ? '✅' : '⏳'}`)
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onStyleAnalysis')
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText(`📄 ${promptsDocId ? '✅' : '⏳'}`)
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onPromptEditor')
          )
      );
    
    statusSection.addWidget(statusGrid);
    
    const statusLabels = CardService.newTextParagraph()
      .setText('API Key | Style | Prompts');
    statusSection.addWidget(statusLabels);
    
    card.addSection(statusSection);
    
    // Main Actions
    const actionsSection = CardService.newCardSection()
      .setHeader('<b>🚀 Quick Actions</b>');
    
    // Generate response button - most important
    const generateButton = CardService.newTextButton()
      .setText('🎯 Generate Response')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('generateResponse')
      );
    
    actionsSection.addWidget(generateButton);
    
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
    
    // Quick setup help if no API key
    if (!settings.apiKey) {
      const getKeyButton = CardService.newTextButton()
        .setText('🔗 Get Free API Key')
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl('https://makersuite.google.com/app/apikey')
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
        );
      apiSection.addWidget(getKeyButton);
    }
    
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
    
    // Prompts Management
    const promptsSection = CardService.newCardSection()
      .setHeader('<b>📄 Prompts Management</b>');
    
    // Status info
    const promptsDocId = PropertyManager.getProperty(Constants.PROPERTIES.PROMPTS_DOC_ID, 'script');
    const hasStyle = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
    
    const statusText = CardService.newTextParagraph()
      .setText(`Prompts: ${promptsDocId ? '✅ Custom' : '⏳ Default'} | Style: ${hasStyle ? '✅ Analyzed' : '⏳ Pending'}`);
    promptsSection.addWidget(statusText);
    
    // Quick actions
    const promptButtons = CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText('📝 Edit Prompts')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onPromptEditor')
          )
      )
      .addButton(
        CardService.newTextButton()
          .setText('✍️ View Style')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onStyleAnalysis')
          )
      );
    
    promptsSection.addWidget(promptButtons);
    
    // Direct link to prompts doc if exists
    if (promptsDocId) {
      try {
        const doc = DocumentApp.openById(promptsDocId);
        const url = doc.getUrl();
        const docLink = CardService.newTextParagraph()
          .setText(`<a href="${url}">📄 Open Prompts Doc</a> (changes apply immediately)`);
        promptsSection.addWidget(docLink);
      } catch (error) {
        // Ignore errors
      }
    }
    
    card.addSection(promptsSection);
    
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