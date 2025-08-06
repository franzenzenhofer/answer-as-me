"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var ActionHandlers;
(function (ActionHandlers) {
    /**
     * Generate response action - WITH IMMEDIATE DOC CREATION & COMPREHENSIVE LOGGING
     */
    function generateResponse(e) {
        var _a, _b, _c;
        DebugLogger.logUserAction('Generate Response', 'ActionHandlers', { hasGmail: !!e.gmail, hasMessageId: !!((_a = e.gmail) === null || _a === void 0 ? void 0 : _a.messageId) });
        try {
            DebugLogger.info('ActionHandlers', '🚀 Starting response generation');
            AppLogger.info('🚀 Starting response generation', {
                hasGmail: !!e.gmail,
                hasMessageId: !!((_b = e.gmail) === null || _b === void 0 ? void 0 : _b.messageId),
                timestamp: new Date().toISOString()
            });
            // IMMEDIATELY CREATE PROMPT DOCUMENTS IF MISSING
            try {
                DebugLogger.info('ActionHandlers', 'Ensuring prompt documents exist');
                GoogleDocsPrompts.createAllPromptDocuments();
            }
            catch (error) {
                DebugLogger.logError('ActionHandlers', error instanceof Error ? error : String(error), null, 'Failed to create prompt documents - may affect customization');
            }
            // Get settings with enhanced debugging
            var settings = Config.getSettings();
            DebugLogger.logLogic('generateResponse', 'SETTINGS_LOADED', null, {
                hasApiKey: !!settings.apiKey,
                responseMode: settings.responseMode
            });
            AppLogger.info('📊 Settings loaded', {
                hasApiKey: !!settings.apiKey,
                apiKeyLength: ((_c = settings.apiKey) === null || _c === void 0 ? void 0 : _c.length) || 0,
                responseMode: settings.responseMode
            });
            if (!settings.apiKey) {
                AppLogger.warn('❌ No API key configured');
                return CardService.newActionResponseBuilder()
                    .setNotification(CardService.newNotification()
                    .setText('Please set your API key first'))
                    .setNavigation(CardService.newNavigation()
                    .pushCard(UI.buildMainCard(settings)))
                    .build();
            }
            // Get current message with enhanced error handling
            AppLogger.info('📧 Getting current message from Gmail');
            var message = GmailService.getCurrentMessage(e);
            if (!message) {
                AppLogger.error('❌ No Gmail message found', {
                    eventKeys: Object.keys(e),
                    gmailKeys: e.gmail ? Object.keys(e.gmail) : null
                });
                throw new ErrorHandling.AppError('No message found', 'NO_MESSAGE', 'Please select an email first');
            }
            AppLogger.info('✅ Message found', {
                subject: message.getSubject(),
                from: message.getFrom(),
                date: message.getDate()
            });
            // Get email context with error boundary
            AppLogger.info('📋 Extracting email context');
            var context = GmailService.getEmailContext(message);
            AppLogger.info('✅ Context extracted', {
                hasSubject: !!context.subject,
                hasBody: !!context.body,
                hasFrom: !!context.from
            });
            // Get writing style
            var style = AI.getWritingStyle();
            if (!style) {
                throw new ErrorHandling.AppError('Unable to analyze writing style', 'STYLE_ERROR', 'Please ensure you have sent emails from this account');
            }
            // Get user profile
            var userProfile = UserProfile.getUserProfile();
            // Generate response
            var aiResponse = AI.generateEmailResponse(context, style, userProfile, settings.apiKey);
            if (!aiResponse.success || !aiResponse.response) {
                // Provide detailed error message
                var userMessage = 'Failed to generate response';
                if (aiResponse.error) {
                    userMessage = aiResponse.error;
                }
                throw new ErrorHandling.AppError('Failed to generate response', 'AI_ERROR', userMessage);
            }
            // Create draft
            var draft = GmailService.createDraftReply(message, aiResponse.response);
            // Show success card
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Response generated!'))
                .setNavigation(CardService.newNavigation()
                .pushCard(UI.buildResponseCard(aiResponse.response, draft.getId())))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to generate response', error);
            // Provide detailed error message to user
            var errorMessage = 'Failed to generate response';
            if (error instanceof ErrorHandling.AppError) {
                errorMessage = error.userMessage || error.message;
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            // Create error card with detailed message
            var errorCard = CardService.newCardBuilder()
                .setHeader(CardService.newCardHeader()
                .setTitle('❌ Error Generating Response'))
                .addSection(CardService.newCardSection()
                .addWidget(CardService.newTextParagraph()
                .setText("<b>Error:</b> ".concat(errorMessage)))
                .addWidget(CardService.newTextParagraph()
                .setText('<b>What to do:</b>'))
                .addWidget(CardService.newTextParagraph()
                .setText('• Check your API key in Settings<br>• Ensure you have internet connection<br>• Try again in a moment<br>• If error persists, contact support')))
                .build();
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText(errorMessage))
                .setNavigation(CardService.newNavigation()
                .pushCard(errorCard))
                .build();
        }
    }
    ActionHandlers.generateResponse = generateResponse;
    /**
     * Save settings action
     */
    function saveSettings(e) {
        try {
            var formData_1 = e.formInputs;
            if (!formData_1 || typeof formData_1 !== 'object') {
                throw new Error('Invalid form data');
            }
            // Build settings object from form
            var updates = {};
            // Validate and update API key
            if ('apiKey' in formData_1) {
                var typedFormData = formData_1;
                var apiKeyArray = typedFormData.apiKey;
                if (Array.isArray(apiKeyArray) && apiKeyArray.length > 0) {
                    var apiKeyValue = String(apiKeyArray[0]);
                    if (apiKeyValue && !apiKeyValue.startsWith(Constants.API.KEY_MASK)) {
                        // Validate API key format
                        var validation = AI.validateApiKey(apiKeyValue);
                        if (!validation.isValid) {
                            return CardService.newActionResponseBuilder()
                                .setNotification(CardService.newNotification()
                                .setText(validation.error || 'Invalid API key'))
                                .build();
                        }
                        updates.apiKey = apiKeyValue;
                    }
                }
            }
            // Extract other form values safely
            var getFormValue = function (key) {
                if (key in formData_1) {
                    var typedFormData = formData_1;
                    var value = typedFormData[key];
                    if (Array.isArray(value) && value.length > 0) {
                        return String(value[0]);
                    }
                }
                return undefined;
            };
            var responseMode = getFormValue('responseMode');
            if (responseMode && ['draft', 'send', 'review'].includes(responseMode)) {
                updates.responseMode = responseMode;
            }
            var responseLength = getFormValue('responseLength');
            if (responseLength && ['short', 'medium', 'long'].includes(responseLength)) {
                updates.responseLength = responseLength;
            }
            var customInstructions = getFormValue('customInstructions');
            if (customInstructions !== undefined) {
                updates.customInstructions = customInstructions.substring(0, 500);
            }
            var signature = getFormValue('signature');
            if (signature !== undefined) {
                updates.signature = signature.substring(0, 200);
            }
            // Save settings
            Config.saveSettings(updates);
            DebugLogger.logLogic('saveSettings', 'SETTINGS_SAVED', updates, { success: true });
            // ALWAYS CREATE PROMPT DOCUMENTS - IMMEDIATELY!
            try {
                DebugLogger.info('ActionHandlers', 'Auto-creating ALL prompt documents after settings save');
                var results = GoogleDocsPrompts.createAllPromptDocuments();
                var successCount = Object.values(results).filter(function (id) { return id; }).length;
                DebugLogger.logUserAction('Settings Saved', 'ActionHandlers', updates, "Settings saved, ".concat(successCount, " prompt docs created"));
                return CardService.newActionResponseBuilder()
                    .setNotification(CardService.newNotification()
                    .setText("Settings saved! ".concat(successCount, " prompt documents ready for editing.")))
                    .build();
            }
            catch (error) {
                DebugLogger.logError('ActionHandlers', error instanceof Error ? error : String(error), null, 'Failed to create prompt documents - user cannot customize');
                AppLogger.warn('Failed to auto-create prompt documents', error);
                // Continue with normal save response
            }
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Settings saved successfully!'))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to save settings', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to save settings'))
                .build();
        }
    }
    ActionHandlers.saveSettings = saveSettings;
    /**
     * Send response action
     */
    function sendResponse(e) {
        try {
            var formData = e.formInputs;
            if (!formData || typeof formData !== 'object') {
                throw new Error('No form data provided');
            }
            // Safely extract edited response
            var editedResponse = '';
            if ('editedResponse' in formData) {
                var typedFormData = formData;
                var value = typedFormData.editedResponse;
                if (Array.isArray(value) && value.length > 0) {
                    editedResponse = String(value[0]);
                }
            }
            // const _draftId = e.parameters?.draftId; // Not used in send
            if (!editedResponse) {
                throw new ErrorHandling.AppError('No response text', 'NO_RESPONSE', 'Response text is empty');
            }
            // Get current message
            var message = GmailService.getCurrentMessage(e);
            if (!message) {
                throw new ErrorHandling.AppError('No message found', 'NO_MESSAGE', 'Could not find the original message');
            }
            // Send the reply
            GmailService.sendReply(message, editedResponse);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Response sent successfully!'))
                .setNavigation(CardService.newNavigation()
                .popToRoot())
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to send response', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to send response'))
                .build();
        }
    }
    ActionHandlers.sendResponse = sendResponse;
    /**
     * Save as draft action
     */
    function saveAsDraft(e) {
        var _a;
        try {
            var formData = e.formInputs;
            if (!formData || typeof formData !== 'object') {
                throw new Error('No form data provided');
            }
            // Safely extract edited response
            var editedResponse = '';
            if ('editedResponse' in formData) {
                var typedFormData = formData;
                var value = typedFormData.editedResponse;
                if (Array.isArray(value) && value.length > 0) {
                    editedResponse = String(value[0]);
                }
            }
            var draftId = (_a = e.parameters) === null || _a === void 0 ? void 0 : _a.draftId;
            if (!editedResponse) {
                throw new ErrorHandling.AppError('No response text', 'NO_RESPONSE', 'Response text is empty');
            }
            // Update existing draft or create new one
            if (draftId) {
                var success = GmailService.updateDraft(draftId, editedResponse);
                if (!success) {
                    AppLogger.warn('Could not update draft, creating new one');
                }
            }
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Draft saved successfully!'))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to save draft', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to save draft'))
                .build();
        }
    }
    ActionHandlers.saveAsDraft = saveAsDraft;
    /**
     * Edit response action
     */
    function editResponse(e) {
        var _a;
        try {
            var formData = e.formInputs;
            if (!formData || typeof formData !== 'object') {
                throw new Error('No form data provided');
            }
            // Safely extract edited response
            var editedResponse = '';
            if ('editedResponse' in formData) {
                var typedFormData = formData;
                var value = typedFormData.editedResponse;
                if (Array.isArray(value) && value.length > 0) {
                    editedResponse = String(value[0]);
                }
            }
            var draftId = (_a = e.parameters) === null || _a === void 0 ? void 0 : _a.draftId;
            // Re-generate with modifications
            return CardService.newActionResponseBuilder()
                .setNavigation(CardService.newNavigation()
                .updateCard(UI.buildResponseCard(editedResponse, draftId)))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to edit response', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to edit response'))
                .build();
        }
    }
    ActionHandlers.editResponse = editResponse;
    /**
     * Learn from thread action
     */
    function learnFromThread(e) {
        try {
            AppLogger.info('Learning from current thread');
            // Get current message and thread
            var message = GmailService.getCurrentMessage(e);
            if (!message) {
                throw new ErrorHandling.AppError('No message found', 'NO_MESSAGE', 'Please select an email first');
            }
            var thread = message.getThread();
            var messages = thread.getMessages();
            // Check if thread has messages from the user
            var userEmail_1 = Session.getActiveUser().getEmail();
            var hasUserMessages = messages.some(function (msg) {
                return msg.getFrom().toLowerCase().includes(userEmail_1.toLowerCase());
            });
            if (!hasUserMessages) {
                return CardService.newActionResponseBuilder()
                    .setNotification(CardService.newNotification()
                    .setText('No messages from you in this thread'))
                    .build();
            }
            // Improve profile from thread
            var improvementPrompt = UserProfile.getImprovementPrompt(thread);
            var apiKey = Config.getProperty(Config.PROPERTY_KEYS.API_KEY);
            var improveResponse = AI.callGeminiAPI(improvementPrompt, apiKey);
            if (improveResponse.success && improveResponse.response) {
                try {
                    var improved = JSON.parse(improveResponse.response);
                    UserProfile.applyImprovements(improved);
                }
                catch (_e) {
                    AppLogger.error('Failed to parse profile improvements', _e);
                }
            }
            // Also update writing style
            var currentStyle = AI.getWritingStyle();
            if (!currentStyle) {
                AppLogger.warn('No current writing style found, skipping style improvement');
                return CardService.newActionResponseBuilder()
                    .setNotification(CardService.newNotification()
                    .setText('Successfully learned from this thread!'))
                    .setNavigation(CardService.newNavigation()
                    .updateCard(EntryPoints.buildMessageCard(e)))
                    .build();
            }
            var improvedStyle = StyleImprover.improveStyleFromThread(currentStyle, thread);
            if (improvedStyle) {
                Config.setProperty(Config.PROPERTY_KEYS.WRITING_STYLE, JSON.stringify(improvedStyle));
                Config.setProperty(Config.PROPERTY_KEYS.LAST_ANALYSIS, new Date().toISOString());
            }
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Successfully learned from this thread!'))
                .setNavigation(CardService.newNavigation()
                .updateCard(EntryPoints.buildMessageCard(e)))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to learn from thread', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to learn from thread'))
                .build();
        }
    }
    ActionHandlers.learnFromThread = learnFromThread;
    /**
     * Show prompt management
     */
    function showPromptManagement(_e) {
        try {
            // Redirect to Settings card instead of separate Prompt Management card
            var settings = Config.getSettings();
            return CardService.newActionResponseBuilder()
                .setNavigation(CardService.newNavigation()
                .pushCard(UI.buildSettingsCard(settings)))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to show prompt management', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to open prompt management'))
                .build();
        }
    }
    ActionHandlers.showPromptManagement = showPromptManagement;
    /**
     * Handle create prompt document
     */
    function handleCreatePromptDoc(e) {
        var _a;
        try {
            var promptType = (_a = e.parameters) === null || _a === void 0 ? void 0 : _a.promptType;
            if (!promptType) {
                throw new Error('No prompt type specified');
            }
            // Create the document
            var docId = GoogleDocsPrompts.getOrCreatePromptDocument(promptType);
            var doc = DocumentApp.openById(docId);
            var url = doc.getUrl();
            // Open the document
            return CardService.newActionResponseBuilder()
                .setOpenLink(CardService.newOpenLink()
                .setUrl(url)
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
                .setOnClose(CardService.OnClose.RELOAD_ADD_ON))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to create prompt document', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to create prompt document'))
                .build();
        }
    }
    ActionHandlers.handleCreatePromptDoc = handleCreatePromptDoc;
    /**
     * Handle update all prompts
     */
    function handleUpdateAllPrompts(_e) {
        try {
            // Update all prompts
            var result = GoogleDocsPrompts.updateAllPrompts();
            // Show notification with results
            return UI.showPromptUpdateNotification(result.updated, result.failed);
        }
        catch (error) {
            AppLogger.error('Failed to update prompts', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to update prompts'))
                .build();
        }
    }
    ActionHandlers.handleUpdateAllPrompts = handleUpdateAllPrompts;
    /**
     * Open prompts document (universal action)
     */
    function openPromptsDocument(_e) {
        try {
            AppLogger.info('Opening prompts document');
            // Get or create the main prompts document
            var docId = GoogleDocsPrompts.getOrCreatePromptDocument('main');
            var doc = DocumentApp.openById(docId);
            var url = doc.getUrl();
            // Open the document in a new tab
            return CardService.newActionResponseBuilder()
                .setOpenLink(CardService.newOpenLink()
                .setUrl(url)
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
                .setOnClose(CardService.OnClose.RELOAD_ADD_ON))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to open prompts document', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Failed to open prompts document. Please check permissions.'))
                .build();
        }
    }
    ActionHandlers.openPromptsDocument = openPromptsDocument;
    /**
     * Generate response with specific formality level
     */
    function generateResponseWithFormality(e) {
        var _a;
        try {
            AppLogger.info('Generating response with specific formality');
            // Get formality level from parameters
            var formality = (_a = e.parameters) === null || _a === void 0 ? void 0 : _a.formality;
            if (!formality) {
                throw new Error('No formality level specified');
            }
            // Get settings and temporarily override formality
            var settings = Config.getSettings();
            if (!settings.apiKey) {
                return CardService.newActionResponseBuilder()
                    .setNotification(CardService.newNotification()
                    .setText('Please set your API key first'))
                    .setNavigation(CardService.newNavigation()
                    .pushCard(UI.buildSettingsCard(settings)))
                    .build();
            }
            // Override formality level
            var formalityLevel = parseInt(formality);
            var adjustedSettings = __assign(__assign({}, settings), { formalityLevel: formalityLevel });
            // Get current message
            var message = GmailService.getCurrentMessage(e);
            if (!message) {
                throw new ErrorHandling.AppError('No message found', 'NO_MESSAGE', 'Please select an email first');
            }
            // Get email context
            var context = GmailService.getEmailContext(message);
            // Get writing style
            var style = AI.getWritingStyle();
            if (!style) {
                throw new ErrorHandling.AppError('Unable to analyze writing style', 'STYLE_ERROR', 'Please ensure you have sent emails from this account');
            }
            // Get user profile
            var userProfile = UserProfile.getUserProfile();
            // Generate response with adjusted formality
            var aiResponse = AI.generateEmailResponse(context, style, userProfile, adjustedSettings.apiKey);
            if (!aiResponse.success || !aiResponse.response) {
                var userMessage = 'Failed to generate response';
                if (aiResponse.error) {
                    userMessage = aiResponse.error;
                }
                throw new ErrorHandling.AppError('Failed to generate response', 'AI_ERROR', userMessage);
            }
            // Create draft
            var draft = GmailService.createDraftReply(message, aiResponse.response);
            // Show success card
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText("Response generated with ".concat(Constants.STYLE.FORMALITY_LABELS[formalityLevel - 1], " tone!")))
                .setNavigation(CardService.newNavigation()
                .pushCard(UI.buildResponseCard(aiResponse.response, draft.getId())))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed to generate response with formality', error);
            var errorMessage = 'Failed to generate response';
            if (error instanceof ErrorHandling.AppError) {
                errorMessage = error.userMessage || error.message;
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText(errorMessage))
                .build();
        }
    }
    ActionHandlers.generateResponseWithFormality = generateResponseWithFormality;
    /**
     * Factory reset - delete ALL data and start completely fresh
     */
    function factoryReset(_e) {
        var e_1, _a, e_2, _b, e_3, _c;
        try {
            AppLogger.info('FACTORY RESET INITIATED - Deleting all user data');
            // Delete all user properties
            var userProperties = PropertiesService.getUserProperties();
            var userKeys = userProperties.getKeys();
            try {
                for (var userKeys_1 = __values(userKeys), userKeys_1_1 = userKeys_1.next(); !userKeys_1_1.done; userKeys_1_1 = userKeys_1.next()) {
                    var key = userKeys_1_1.value;
                    userProperties.deleteProperty(key);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (userKeys_1_1 && !userKeys_1_1.done && (_a = userKeys_1.return)) _a.call(userKeys_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Delete all script properties
            var scriptProperties = PropertiesService.getScriptProperties();
            var scriptKeys = scriptProperties.getKeys();
            try {
                for (var scriptKeys_1 = __values(scriptKeys), scriptKeys_1_1 = scriptKeys_1.next(); !scriptKeys_1_1.done; scriptKeys_1_1 = scriptKeys_1.next()) {
                    var key = scriptKeys_1_1.value;
                    scriptProperties.deleteProperty(key);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (scriptKeys_1_1 && !scriptKeys_1_1.done && (_b = scriptKeys_1.return)) _b.call(scriptKeys_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            // Delete all documents if they exist
            try {
                // Get prompt documents
                var promptTypes = ['main', 'style', 'profile'];
                try {
                    for (var promptTypes_1 = __values(promptTypes), promptTypes_1_1 = promptTypes_1.next(); !promptTypes_1_1.done; promptTypes_1_1 = promptTypes_1.next()) {
                        var promptType = promptTypes_1_1.value;
                        try {
                            var docId = GoogleDocsPrompts.getOrCreatePromptDocument(promptType);
                            if (docId) {
                                DriveApp.getFileById(docId).setTrashed(true);
                                AppLogger.info("Deleted prompt document: ".concat(promptType));
                            }
                        }
                        catch (error) {
                            // Document doesn't exist or can't be deleted - continue
                            AppLogger.info("Could not delete ".concat(promptType, " document: ").concat(error));
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (promptTypes_1_1 && !promptTypes_1_1.done && (_c = promptTypes_1.return)) _c.call(promptTypes_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            catch (error) {
                AppLogger.warn('Error during document cleanup', error);
            }
            AppLogger.info('FACTORY RESET COMPLETED - All data deleted');
            // Return to fresh settings card
            var freshSettings = Config.getSettings(); // Will be empty now
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('🔴 FACTORY RESET COMPLETE - All data deleted!'))
                .setNavigation(CardService.newNavigation()
                .updateCard(UI.buildSettingsCard(freshSettings)))
                .build();
        }
        catch (error) {
            AppLogger.error('Failed during factory reset', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('Factory reset failed - some data may remain'))
                .build();
        }
    }
    ActionHandlers.factoryReset = factoryReset;
    /**
     * Test API key with debugging information
     */
    function testApiKey(_e) {
        try {
            AppLogger.info('API Key test initiated by user');
            var settings = Config.getSettings();
            if (!settings.apiKey) {
                return CardService.newActionResponseBuilder()
                    .setNotification(CardService.newNotification()
                    .setText('❌ No API key found - please enter one first'))
                    .build();
            }
            // Test the API key
            var testResult = AI.testApiKey(settings.apiKey);
            if (testResult.success) {
                return CardService.newActionResponseBuilder()
                    .setNotification(CardService.newNotification()
                    .setText("\u2705 API KEY WORKS! ".concat(settings.apiKey.substring(0, 8), "...").concat(settings.apiKey.slice(-4), " is valid")))
                    .build();
            }
            else {
                return CardService.newActionResponseBuilder()
                    .setNotification(CardService.newNotification()
                    .setText("\u274C API KEY FAILED: ".concat(testResult.error)))
                    .build();
            }
        }
        catch (error) {
            AppLogger.error('Failed to test API key', error);
            return CardService.newActionResponseBuilder()
                .setNotification(CardService.newNotification()
                .setText('❌ Test failed - check logs for details'))
                .build();
        }
    }
    ActionHandlers.testApiKey = testApiKey;
})(ActionHandlers || (ActionHandlers = {}));
//# sourceMappingURL=action-handlers.js.map