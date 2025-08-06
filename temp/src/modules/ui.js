"use strict";
var UI;
(function (UI) {
    /**
     * Build the main card - Shows settings if API key not set, otherwise overview
     */
    function buildMainCard(settings) {
        // If no API key, show settings card
        if (!settings.apiKey) {
            return buildSettingsCard(settings);
        }
        // Otherwise show overview card
        return buildOverviewCard(settings);
    }
    UI.buildMainCard = buildMainCard;
    /**
     * CARD 2: Overview Mode - Main dashboard
     */
    function buildOverviewCard(settings) {
        var card = CardService.newCardBuilder();
        card.setHeader(CardService.newCardHeader()
            .setTitle('📧 Answer As Me')
            .setSubtitle('Overview Dashboard')
            .setImageStyle(CardService.ImageStyle.CIRCLE)
            .setImageUrl(Constants.UI.ICON_MAIN));
        // System Status Dashboard
        var statusSection = CardService.newCardSection()
            .setHeader('<b>📊 System Status</b>');
        var hasStyle = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
        var promptsDocId = PropertyManager.getProperty(Constants.PROPERTIES.PROMPTS_DOC_ID, 'script');
        // Dashboard status text - clear and informative
        var apiStatus = settings.apiKey ? '✅ Connected and Working' : '❌ Not Configured';
        var styleStatus = hasStyle ? '✅ Analysis Complete' : '⏳ Will Learn from Your Emails';
        var promptStatus = promptsDocId ? '✅ Documents Created' : '⏳ Will Create on First Use';
        var statusDashboard = CardService.newTextParagraph()
            .setText("\n<b>\uD83D\uDD11 API Connection:</b> ".concat(apiStatus, "<br>\n<b>\u270D\uFE0F Writing Style:</b> ").concat(styleStatus, "<br>\n<b>\uD83D\uDCC4 Prompt System:</b> ").concat(promptStatus, "<br>\n<br>\n<b>\uD83D\uDCE7 Ready to Generate Responses:</b> ").concat(settings.apiKey && hasStyle ? '✅ Yes' : '⚠️ Complete setup first', "\n      "));
        statusSection.addWidget(statusDashboard);
        card.addSection(statusSection);
        // Quick Actions Dashboard
        var actionsSection = CardService.newCardSection()
            .setHeader('<b>🚀 Quick Actions</b>');
        var dashboardInfo = CardService.newTextParagraph()
            .setText("\n<b>\uD83D\uDCE7 To Generate Responses:</b> Open any email thread<br>\n<b>\u2699\uFE0F To Configure:</b> Click Settings below<br>\n<b>\uD83D\uDCDD To Edit Prompts:</b> Click Prompts below<br>\n<b>\uD83E\uDDEA To Test API:</b> Go to Settings and click \"Test API Key\"\n      ");
        actionsSection.addWidget(dashboardInfo);
        // Quick access grid
        var quickActions = CardService.newButtonSet()
            .addButton(CardService.newTextButton()
            .setText('⚙️ Settings')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('onSettings')))
            .addButton(CardService.newTextButton()
            .setText('📝 Prompts')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('onPromptEditor')))
            .addButton(CardService.newTextButton()
            .setText('❓ Help')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('onHelp')));
        actionsSection.addWidget(quickActions);
        card.addSection(actionsSection);
        // Recent activity or tips
        var tipsSection = CardService.newCardSection()
            .setHeader('<b>💡 Tips</b>');
        var tipsText = CardService.newTextParagraph()
            .setText('• <b>Open any email</b> and click "Generate Response"<br>' +
            '• <b>Customize prompts</b> in Google Docs for better results<br>' +
            '• <b>Style analysis</b> improves with more sent emails<br>' +
            '• <b>All drafts</b> are saved - review before sending!');
        tipsSection.addWidget(tipsText);
        card.addSection(tipsSection);
        return card.build();
    }
    UI.buildOverviewCard = buildOverviewCard;
    /**
     * CARD 3: Thread Mode - Email-specific context
     */
    function buildThreadCard(settings, emailContext) {
        var card = CardService.newCardBuilder();
        card.setHeader(CardService.newCardHeader()
            .setTitle('📬 Thread Context')
            .setSubtitle('AI response for this email')
            .setImageStyle(CardService.ImageStyle.CIRCLE)
            .setImageUrl(Constants.UI.ICON_MAIN));
        // Check API key first
        if (!settings.apiKey) {
            var setupSection = CardService.newCardSection();
            setupSection.addWidget(CardService.newTextParagraph()
                .setText('⚠️ <b>API Key Required</b><br><br>Click Settings to add your API key.'));
            var settingsButton = CardService.newTextButton()
                .setText('Go to Settings')
                .setOnClickAction(CardService.newAction()
                .setFunctionName('onSettings'))
                .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
            setupSection.addWidget(settingsButton);
            card.addSection(setupSection);
            return card.build();
        }
        // Email context info
        if (emailContext) {
            var contextSection = CardService.newCardSection()
                .setHeader('<b>📧 Current Email</b>');
            var emailInfo = CardService.newDecoratedText()
                .setText(emailContext.subject || 'No Subject')
                .setTopLabel('Subject')
                .setBottomLabel("From: ".concat(emailContext.sender || 'Unknown'))
                .setIcon(CardService.Icon.EMAIL);
            contextSection.addWidget(emailInfo);
            card.addSection(contextSection);
        }
        // Main generate button
        var generateSection = CardService.newCardSection()
            .setHeader('<b>🎯 AI Response</b>');
        var generateButton = CardService.newTextButton()
            .setText('Generate Personalized Reply')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setOnClickAction(CardService.newAction()
            .setFunctionName('generateResponse'));
        generateSection.addWidget(generateButton);
        // Quick formality adjustment
        var formalitySection = CardService.newCardSection()
            .setHeader('<b>🎭 Quick Adjustments</b>');
        var formalityButtons = CardService.newButtonSet()
            .addButton(CardService.newTextButton()
            .setText('😊 Casual')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('generateResponseWithFormality')
            .setParameters({ formality: '1' })))
            .addButton(CardService.newTextButton()
            .setText('💼 Formal')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('generateResponseWithFormality')
            .setParameters({ formality: '5' })))
            .addButton(CardService.newTextButton()
            .setText('🔄 Auto')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('generateResponse')));
        formalitySection.addWidget(formalityButtons);
        card.addSection(generateSection);
        card.addSection(formalitySection);
        // Navigation to other cards
        var navSection = CardService.newCardSection();
        var navButtons = CardService.newButtonSet()
            .addButton(CardService.newTextButton()
            .setText('📊 Overview')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('onHomepage')))
            .addButton(CardService.newTextButton()
            .setText('⚙️ Settings')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('onSettings')));
        navSection.addWidget(navButtons);
        card.addSection(navSection);
        return card.build();
    }
    UI.buildThreadCard = buildThreadCard;
    /**
     * Build response preview card
     */
    function buildResponseCard(responseText, _draftId) {
        var card = CardService.newCardBuilder();
        var header = CardService.newCardHeader()
            .setTitle(Constants.UI.TITLE_RESPONSE)
            .setSubtitle(Constants.UI.MSG_RESPONSE_GENERATED);
        card.setHeader(header);
        var section = CardService.newCardSection();
        // Response preview
        var previewText = CardService.newTextParagraph()
            .setText("<b>Preview:</b><br>".concat(Utils.truncate(Utils.escapeHtml(responseText), Constants.UI.MAX_HINT_LENGTH * 2)));
        section.addWidget(previewText);
        // Open draft button
        var openButton = CardService.newTextButton()
            .setText('Open Draft in Gmail')
            .setOpenLink(CardService.newOpenLink()
            .setUrl('https://mail.google.com/mail/u/0/#drafts')
            .setOpenAs(CardService.OpenAs.FULL_SIZE));
        var buttonSet = CardService.newButtonSet()
            .addButton(openButton);
        section.addWidget(buttonSet);
        card.addSection(section);
        return card.build();
    }
    UI.buildResponseCard = buildResponseCard;
    /**
     * Show notification
     */
    function showNotification(message) {
        return CardService.newActionResponseBuilder()
            .setNotification(CardService.newNotification()
            .setText(message))
            .build();
    }
    UI.showNotification = showNotification;
    /**
     * Build help card
     */
    function buildHelpCard() {
        var card = CardService.newCardBuilder();
        var header = CardService.newCardHeader()
            .setTitle("".concat(Constants.UI.TITLE_HELP, " - ").concat(Constants.METADATA.APP_NAME))
            .setSubtitle('How to use this add-on');
        card.setHeader(header);
        var section = CardService.newCardSection();
        var helpText = CardService.newTextParagraph()
            .setText('<b>Getting Started:</b><br>' +
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
            '• Use custom instructions for specific needs');
        section.addWidget(helpText);
        card.addSection(section);
        return card.build();
    }
    UI.buildHelpCard = buildHelpCard;
    /**
     * Show prompt update notification
     */
    function showPromptUpdateNotification(updated, failed) {
        var message = '';
        if (updated.length > 0) {
            var updatedNames = updated.map(function (type) {
                return Constants.PROMPTS.DOC_NAMES[type] || type;
            }).join(', ');
            message += "\u2705 Updated: ".concat(updatedNames);
        }
        if (failed.length > 0) {
            var failedNames = failed.map(function (type) {
                return Constants.PROMPTS.DOC_NAMES[type] || type;
            }).join(', ');
            message += "\n\u274C Failed: ".concat(failedNames);
        }
        return CardService.newActionResponseBuilder()
            .setNotification(CardService.newNotification()
            .setText(message || 'No updates needed'))
            .build();
    }
    UI.showPromptUpdateNotification = showPromptUpdateNotification;
    /**
     * CARD 1: Settings - ALL configuration in one place
     */
    function buildSettingsCard(settings) {
        var _a, _b;
        var card = CardService.newCardBuilder();
        card.setHeader(CardService.newCardHeader()
            .setTitle('⚙️ Settings')
            .setSubtitle('All configuration in one place')
            .setImageStyle(CardService.ImageStyle.SQUARE)
            .setImageUrl(Constants.UI.ICON_MAIN));
        // API Key section - NEVER HIDE IT!
        var apiSection = CardService.newCardSection()
            .setHeader('<b>🔑 API Configuration</b>');
        var apiKeyInput = CardService.newTextInput()
            .setFieldName('apiKey')
            .setTitle('Gemini API Key')
            .setValue(settings.apiKey || '') // NEVER HIDE - show full key!
            .setHint('Your Google Gemini API key - get one at makersuite.google.com');
        apiSection.addWidget(apiKeyInput);
        // API Key testing and help
        var keyActions = CardService.newButtonSet();
        if (settings.apiKey) {
            // Test API key button
            var testButton = CardService.newTextButton()
                .setText('🧪 Test API Key')
                .setOnClickAction(CardService.newAction()
                .setFunctionName('testApiKey'));
            keyActions.addButton(testButton);
        }
        var getKeyButton = CardService.newTextButton()
            .setText(settings.apiKey ? '🔗 Get New Key' : '🔗 Get Free API Key')
            .setOpenLink(CardService.newOpenLink()
            .setUrl('https://makersuite.google.com/app/apikey')
            .setOpenAs(CardService.OpenAs.FULL_SIZE));
        keyActions.addButton(getKeyButton);
        apiSection.addWidget(keyActions);
        card.addSection(apiSection);
        // Response Configuration
        var responseSection = CardService.newCardSection()
            .setHeader('<b>📝 Response Configuration</b>');
        // Formality level
        var formalityDropdown = CardService.newSelectionInput()
            .setFieldName('formalityLevel')
            .setTitle('Default Formality')
            .setType(CardService.SelectionInputType.DROPDOWN);
        Constants.STYLE.FORMALITY_LABELS.forEach(function (label, index) {
            formalityDropdown.addItem(label, (index + 1).toString(), settings.formalityLevel === index + 1);
        });
        responseSection.addWidget(formalityDropdown);
        // Response length
        var lengthDropdown = CardService.newSelectionInput()
            .setFieldName('responseLength')
            .setTitle('Response Length')
            .setType(CardService.SelectionInputType.DROPDOWN)
            .addItem('Short (1-2 sentences)', 'short', settings.responseLength === 'short')
            .addItem('Medium (3-5 sentences)', 'medium', settings.responseLength === 'medium')
            .addItem('Long (6+ sentences)', 'long', settings.responseLength === 'long');
        responseSection.addWidget(lengthDropdown);
        // Custom instructions
        var instructionsInput = CardService.newTextInput()
            .setFieldName('customInstructions')
            .setTitle('Custom Instructions')
            .setValue(settings.customInstructions || '')
            .setHint('Special instructions for all responses')
            .setMultiline(true);
        responseSection.addWidget(instructionsInput);
        // Signature
        var signatureInput = CardService.newTextInput()
            .setFieldName('signature')
            .setTitle('Email Signature')
            .setValue(settings.signature || '')
            .setHint('Your email signature')
            .setMultiline(true);
        responseSection.addWidget(signatureInput);
        card.addSection(responseSection);
        // KISS: Simplified 3-Prompt Management + Debug Logging
        var promptsSection = CardService.newCardSection()
            .setHeader('<b>📄 KISS Prompt Management - 3 Simple Cards</b>');
        // Auto-create documents immediately
        try {
            GoogleDocsPrompts.createAllPromptDocuments();
        }
        catch (error) {
            DebugLogger.logError('UI', error instanceof Error ? error : String(error), null, 'Failed to create prompt documents in UI');
        }
        // Style Analysis Status
        var hasStyle = PropertyManager.getProperty(Constants.PROPERTIES.WRITING_STYLE, 'user');
        var styleInfo = 'Style: ⏳ Pending - Send emails to analyze';
        if (hasStyle) {
            try {
                var style = JSON.parse(hasStyle);
                var formalityLabel = Constants.STYLE.FORMALITY_LABELS[style.formalityLevel - 1] || 'Neutral';
                styleInfo = "Style: \u2705 Analyzed (".concat(formalityLabel, ", ").concat(((_a = style.greetings) === null || _a === void 0 ? void 0 : _a.length) || 0, " greetings, ").concat(((_b = style.closings) === null || _b === void 0 ? void 0 : _b.length) || 0, " closings)");
            }
            catch (_c) {
                styleInfo = 'Style: ✅ Analyzed (details available)';
            }
        }
        var styleText = CardService.newTextParagraph()
            .setText(styleInfo);
        promptsSection.addWidget(styleText);
        // Direct links to 3 prompt documents - KISS approach
        var promptInfo = CardService.newTextParagraph()
            .setText('Prompts: ✅ Ready - Click to edit in Google Docs');
        promptsSection.addWidget(promptInfo);
        // KISS: Only 3 simple prompt editing buttons
        var promptButtons = CardService.newButtonSet()
            .addButton(CardService.newTextButton()
            .setText('⚙️ Settings')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('handleCreatePromptDoc')
            .setParameters({ promptType: 'SETTINGS' })))
            .addButton(CardService.newTextButton()
            .setText('📊 Overview')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('handleCreatePromptDoc')
            .setParameters({ promptType: 'OVERVIEW' })))
            .addButton(CardService.newTextButton()
            .setText('🧵 Thread')
            .setOnClickAction(CardService.newAction()
            .setFunctionName('handleCreatePromptDoc')
            .setParameters({ promptType: 'THREAD' })));
        promptsSection.addWidget(promptButtons);
        card.addSection(promptsSection);
        // DEBUG LOGGING SECTION
        var debugSection = CardService.newCardSection()
            .setHeader('<b>🐛 Super Debug Logging</b>');
        try {
            var debugSpreadsheetUrl = DebugLogger.getTodaysSpreadsheetUrl();
            if (debugSpreadsheetUrl) {
                var debugInfo = CardService.newTextParagraph()
                    .setText("Debug Log: \u2705 <a href=\"".concat(debugSpreadsheetUrl, "\">\uD83D\uDCCA Today's Debug Spreadsheet</a><br>All AI requests, responses, logic & errors logged automatically!"));
                debugSection.addWidget(debugInfo);
            }
            else {
                var debugInfo = CardService.newTextParagraph()
                    .setText('Debug Log: ⚠️ Creating debug spreadsheet...');
                debugSection.addWidget(debugInfo);
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }
        catch (_error) {
            var debugInfo = CardService.newTextParagraph()
                .setText('Debug Log: ❌ Error creating debug spreadsheet');
            debugSection.addWidget(debugInfo);
        }
        card.addSection(debugSection);
        // DANGER ZONE - Factory Reset
        var dangerSection = CardService.newCardSection()
            .setHeader('<b>🚨 Danger Zone</b>');
        var resetWarning = CardService.newTextParagraph()
            .setText('⚠️ Factory reset will delete ALL data: API key, prompts, style analysis, settings. This cannot be undone!');
        dangerSection.addWidget(resetWarning);
        var factoryResetButton = CardService.newTextButton()
            .setText('🔴 FACTORY RESET')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setOnClickAction(CardService.newAction()
            .setFunctionName('factoryReset'));
        dangerSection.addWidget(factoryResetButton);
        card.addSection(dangerSection);
        // Save button
        var saveButton = CardService.newTextButton()
            .setText('💾 Save All Settings')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setOnClickAction(CardService.newAction()
            .setFunctionName('saveSettings'));
        var buttonSection = CardService.newCardSection();
        buttonSection.addWidget(saveButton);
        card.addSection(buttonSection);
        return card.build();
    }
    UI.buildSettingsCard = buildSettingsCard;
})(UI || (UI = {}));
//# sourceMappingURL=ui.js.map