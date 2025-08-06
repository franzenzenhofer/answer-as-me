namespace ActionHandlers {
  /**
   * Generate response action
   */
  export function generateResponse(e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      AppLogger.info('Generating response');
      
      // Get settings
      const settings = Config.getSettings();
      if (!settings.apiKey) {
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification()
              .setText('Please set your API key first')
          )
          .setNavigation(
            CardService.newNavigation()
              .pushCard(UI.buildMainCard(settings))
          )
          .build();
      }
      
      // Get current message
      const message = GmailService.getCurrentMessage(e);
      if (!message) {
        throw new ErrorHandling.AppError(
          'No message found',
          'NO_MESSAGE',
          'Please select an email first'
        );
      }
      
      // Get email context
      const context = GmailService.getEmailContext(message);
      
      // Get writing style
      const style = AI.getWritingStyle();
      if (!style) {
        throw new ErrorHandling.AppError(
          'Unable to analyze writing style',
          'STYLE_ERROR',
          'Please ensure you have sent emails from this account'
        );
      }
      
      // Get user profile
      const userProfile = UserProfile.getUserProfile();
      
      // Generate response
      const aiResponse = AI.generateEmailResponse(context, style, userProfile, settings.apiKey);
      
      if (!aiResponse.success || !aiResponse.response) {
        // Provide detailed error message
        let userMessage = 'Failed to generate response';
        if (aiResponse.error) {
          userMessage = aiResponse.error;
        }
        throw new ErrorHandling.AppError(
          'Failed to generate response',
          'AI_ERROR',
          userMessage
        );
      }
      
      // Create draft
      const draft = GmailService.createDraftReply(message, aiResponse.response);
      
      // Show success card
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Response generated!')
        )
        .setNavigation(
          CardService.newNavigation()
            .pushCard(UI.buildResponseCard(aiResponse.response, draft.getId()))
        )
        .build();
        
    } catch (error) {
      AppLogger.error('Failed to generate response', error);
      
      // Provide detailed error message to user
      let errorMessage = 'Failed to generate response';
      if (error instanceof ErrorHandling.AppError) {
        errorMessage = error.userMessage || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Create error card with detailed message
      const errorCard = CardService.newCardBuilder()
        .setHeader(
          CardService.newCardHeader()
            .setTitle('❌ Error Generating Response')
        )
        .addSection(
          CardService.newCardSection()
            .addWidget(
              CardService.newTextParagraph()
                .setText(`<b>Error:</b> ${errorMessage}`)
            )
            .addWidget(
              CardService.newTextParagraph()
                .setText('<b>What to do:</b>')
            )
            .addWidget(
              CardService.newTextParagraph()
                .setText('• Check your API key in Settings<br>• Ensure you have internet connection<br>• Try again in a moment<br>• If error persists, contact support')
            )
        )
        .build();
      
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText(errorMessage)
        )
        .setNavigation(
          CardService.newNavigation()
            .pushCard(errorCard)
        )
        .build();
    }
  }
  
  /**
   * Save settings action
   */
  export function saveSettings(e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      const formData = e.formInputs;
      if (!formData || typeof formData !== 'object') {
        throw new Error('Invalid form data');
      }
      
      // Build settings object from form
      const updates: Partial<Types.Config> = {};
      
      // Validate and update API key
      if ('apiKey' in formData) {
        const apiKeyArray = (formData as any).apiKey;
        if (Array.isArray(apiKeyArray) && apiKeyArray.length > 0) {
          const apiKeyValue = String(apiKeyArray[0]);
          if (apiKeyValue && !apiKeyValue.startsWith(Constants.API.KEY_MASK)) {
            // Validate API key format
            const validation = AI.validateApiKey(apiKeyValue);
            if (!validation.isValid) {
              return CardService.newActionResponseBuilder()
                .setNotification(
                  CardService.newNotification()
                    .setText(validation.error || 'Invalid API key')
                )
                .build();
            }
            updates.apiKey = apiKeyValue;
          }
        }
      }
      
      // Extract other form values safely
      const getFormValue = (key: string): string | undefined => {
        if (key in formData) {
          const value = (formData as any)[key];
          if (Array.isArray(value) && value.length > 0) {
            return String(value[0]);
          }
        }
        return undefined;
      };
      
      const responseMode = getFormValue('responseMode');
      if (responseMode && ['draft', 'send', 'review'].includes(responseMode)) {
        updates.responseMode = responseMode as Types.ResponseMode;
      }
      
      const responseLength = getFormValue('responseLength');
      if (responseLength && ['short', 'medium', 'long'].includes(responseLength)) {
        updates.responseLength = responseLength as Types.ResponseLength;
      }
      
      const customInstructions = getFormValue('customInstructions');
      if (customInstructions !== undefined) {
        updates.customInstructions = customInstructions.substring(0, 500);
      }
      
      const signature = getFormValue('signature');
      if (signature !== undefined) {
        updates.signature = signature.substring(0, 200);
      }
      
      // Save settings
      Config.saveSettings(updates);
      
      // Auto-create prompt documents when API key is first set
      if (updates.apiKey && !PropertyManager.getProperty(Constants.PROPERTIES.PROMPTS_DOC_ID, 'script')) {
        try {
          AppLogger.info('First-time API key setup - creating prompt documents');
          
          // Create all prompt documents
          const promptTypes = ['main', 'style', 'profile'];
          for (const promptType of promptTypes) {
            GoogleDocsPrompts.getOrCreatePromptDocument(promptType);
            AppLogger.info(`Created ${promptType} prompt document`);
          }
          
          return CardService.newActionResponseBuilder()
            .setNotification(
              CardService.newNotification()
                .setText('Settings saved! Prompt documents created.')
            )
            .build();
        } catch (error) {
          AppLogger.warn('Failed to auto-create prompt documents', error);
          // Continue with normal save response
        }
      }
      
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Settings saved successfully!')
        )
        .build();
        
    } catch (error) {
      AppLogger.error('Failed to save settings', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to save settings')
        )
        .build();
    }
  }
  
  /**
   * Send response action
   */
  export function sendResponse(e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      const formData = e.formInputs;
      if (!formData || typeof formData !== 'object') {
        throw new Error('No form data provided');
      }
      
      // Safely extract edited response
      let editedResponse = '';
      if ('editedResponse' in formData) {
        const value = (formData as any).editedResponse;
        if (Array.isArray(value) && value.length > 0) {
          editedResponse = String(value[0]);
        }
      }
      // const _draftId = e.parameters?.draftId; // Not used in send
      
      if (!editedResponse) {
        throw new ErrorHandling.AppError(
          'No response text',
          'NO_RESPONSE',
          'Response text is empty'
        );
      }
      
      // Get current message
      const message = GmailService.getCurrentMessage(e);
      if (!message) {
        throw new ErrorHandling.AppError(
          'No message found',
          'NO_MESSAGE',
          'Could not find the original message'
        );
      }
      
      // Send the reply
      GmailService.sendReply(message, editedResponse);
      
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Response sent successfully!')
        )
        .setNavigation(
          CardService.newNavigation()
            .popToRoot()
        )
        .build();
        
    } catch (error) {
      AppLogger.error('Failed to send response', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to send response')
        )
        .build();
    }
  }
  
  /**
   * Save as draft action
   */
  export function saveAsDraft(e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      const formData = e.formInputs;
      if (!formData || typeof formData !== 'object') {
        throw new Error('No form data provided');
      }
      
      // Safely extract edited response
      let editedResponse = '';
      if ('editedResponse' in formData) {
        const value = (formData as any).editedResponse;
        if (Array.isArray(value) && value.length > 0) {
          editedResponse = String(value[0]);
        }
      }
      
      const draftId = e.parameters?.draftId;
      
      if (!editedResponse) {
        throw new ErrorHandling.AppError(
          'No response text',
          'NO_RESPONSE',
          'Response text is empty'
        );
      }
      
      // Update existing draft or create new one
      if (draftId) {
        const success = GmailService.updateDraft(draftId, editedResponse);
        if (!success) {
          AppLogger.warn('Could not update draft, creating new one');
        }
      }
      
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Draft saved successfully!')
        )
        .build();
        
    } catch (error) {
      AppLogger.error('Failed to save draft', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to save draft')
        )
        .build();
    }
  }
  
  /**
   * Edit response action
   */
  export function editResponse(e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      const formData = e.formInputs;
      if (!formData || typeof formData !== 'object') {
        throw new Error('No form data provided');
      }
      
      // Safely extract edited response
      let editedResponse = '';
      if ('editedResponse' in formData) {
        const value = (formData as any).editedResponse;
        if (Array.isArray(value) && value.length > 0) {
          editedResponse = String(value[0]);
        }
      }
      
      const draftId = e.parameters?.draftId;
      
      // Re-generate with modifications
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation()
            .updateCard(UI.buildResponseCard(editedResponse, draftId))
        )
        .build();
        
    } catch (error) {
      AppLogger.error('Failed to edit response', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to edit response')
        )
        .build();
    }
  }
  
  /**
   * Learn from thread action
   */
  export function learnFromThread(e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      AppLogger.info('Learning from current thread');
      
      // Get current message and thread
      const message = GmailService.getCurrentMessage(e);
      if (!message) {
        throw new ErrorHandling.AppError(
          'No message found',
          'NO_MESSAGE',
          'Please select an email first'
        );
      }
      
      const thread = message.getThread();
      const messages = thread.getMessages();
      
      // Check if thread has messages from the user
      const userEmail = Session.getActiveUser().getEmail();
      const hasUserMessages = messages.some(msg => 
        msg.getFrom().toLowerCase().includes(userEmail.toLowerCase())
      );
      
      if (!hasUserMessages) {
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification()
              .setText('No messages from you in this thread')
          )
          .build();
      }
      
      // Improve profile from thread
      const improvementPrompt = UserProfile.getImprovementPrompt(thread);
      const apiKey = Config.getProperty(Config.PROPERTY_KEYS.API_KEY);
      const improveResponse = AI.callGeminiAPI(improvementPrompt, apiKey);
      
      if (improveResponse.success && improveResponse.response) {
        try {
          const improved = JSON.parse(improveResponse.response);
          UserProfile.applyImprovements(improved);
        } catch (_e) {
          AppLogger.error('Failed to parse profile improvements', _e);
        }
      }
      
      // Also update writing style
      const currentStyle = AI.getWritingStyle();
      if (!currentStyle) {
        AppLogger.warn('No current writing style found, skipping style improvement');
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification()
              .setText('Successfully learned from this thread!')
          )
          .setNavigation(
            CardService.newNavigation()
              .updateCard(EntryPoints.buildMessageCard(e))
          )
          .build();
      }
      
      const improvedStyle = StyleImprover.improveStyleFromThread(
        currentStyle,
        thread
      );
      
      if (improvedStyle) {
        Config.setProperty(Config.PROPERTY_KEYS.WRITING_STYLE, JSON.stringify(improvedStyle));
        Config.setProperty(Config.PROPERTY_KEYS.LAST_ANALYSIS, new Date().toISOString());
      }
      
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Successfully learned from this thread!')
        )
        .setNavigation(
          CardService.newNavigation()
            .updateCard(EntryPoints.buildMessageCard(e))
        )
        .build();
        
    } catch (error) {
      AppLogger.error('Failed to learn from thread', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to learn from thread')
        )
        .build();
    }
  }

  /**
   * Show prompt management
   */
  export function showPromptManagement(_e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      // Redirect to Settings card instead of separate Prompt Management card
      const settings = Config.getSettings();
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation()
            .pushCard(UI.buildSettingsCard(settings))
        )
        .build();
    } catch (error) {
      AppLogger.error('Failed to show prompt management', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to open prompt management')
        )
        .build();
    }
  }

  /**
   * Handle create prompt document
   */
  export function handleCreatePromptDoc(e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      const promptType = e.parameters?.promptType;
      if (!promptType) {
        throw new Error('No prompt type specified');
      }

      // Create the document
      const docId = GoogleDocsPrompts.getOrCreatePromptDocument(promptType);
      const doc = DocumentApp.openById(docId);
      const url = doc.getUrl();

      // Open the document
      return CardService.newActionResponseBuilder()
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(url)
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
            .setOnClose(CardService.OnClose.RELOAD_ADD_ON)
        )
        .build();
    } catch (error) {
      AppLogger.error('Failed to create prompt document', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to create prompt document')
        )
        .build();
    }
  }

  /**
   * Handle update all prompts
   */
  export function handleUpdateAllPrompts(_e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      // Update all prompts
      const result = GoogleDocsPrompts.updateAllPrompts();
      
      // Show notification with results
      return UI.showPromptUpdateNotification(result.updated, result.failed);
    } catch (error) {
      AppLogger.error('Failed to update prompts', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to update prompts')
        )
        .build();
    }
  }
  
  /**
   * Open prompts document (universal action)
   */
  export function openPromptsDocument(_e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      AppLogger.info('Opening prompts document');
      
      // Get or create the main prompts document
      const docId = GoogleDocsPrompts.getOrCreatePromptDocument('main');
      const doc = DocumentApp.openById(docId);
      const url = doc.getUrl();
      
      // Open the document in a new tab
      return CardService.newActionResponseBuilder()
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(url)
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
            .setOnClose(CardService.OnClose.RELOAD_ADD_ON)
        )
        .build();
    } catch (error) {
      AppLogger.error('Failed to open prompts document', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to open prompts document. Please check permissions.')
        )
        .build();
    }
  }

  /**
   * Generate response with specific formality level
   */
  export function generateResponseWithFormality(
    e: Types.ExtendedEventObject
  ): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      AppLogger.info('Generating response with specific formality');
      
      // Get formality level from parameters
      const formality = e.parameters?.formality;
      if (!formality) {
        throw new Error('No formality level specified');
      }

      // Get settings and temporarily override formality
      const settings = Config.getSettings();
      if (!settings.apiKey) {
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification()
              .setText('Please set your API key first')
          )
          .setNavigation(
            CardService.newNavigation()
              .pushCard(UI.buildSettingsCard(settings))
          )
          .build();
      }
      
      // Override formality level
      const formalityLevel = parseInt(formality);
      const adjustedSettings = { ...settings, formalityLevel };
      
      // Get current message
      const message = GmailService.getCurrentMessage(e);
      if (!message) {
        throw new ErrorHandling.AppError(
          'No message found',
          'NO_MESSAGE',
          'Please select an email first'
        );
      }
      
      // Get email context
      const context = GmailService.getEmailContext(message);
      
      // Get writing style
      const style = AI.getWritingStyle();
      if (!style) {
        throw new ErrorHandling.AppError(
          'Unable to analyze writing style',
          'STYLE_ERROR',
          'Please ensure you have sent emails from this account'
        );
      }
      
      // Get user profile
      const userProfile = UserProfile.getUserProfile();
      
      // Generate response with adjusted formality
      const aiResponse = AI.generateEmailResponse(context, style, userProfile, adjustedSettings.apiKey);
      
      if (!aiResponse.success || !aiResponse.response) {
        let userMessage = 'Failed to generate response';
        if (aiResponse.error) {
          userMessage = aiResponse.error;
        }
        throw new ErrorHandling.AppError(
          'Failed to generate response',
          'AI_ERROR',
          userMessage
        );
      }
      
      // Create draft
      const draft = GmailService.createDraftReply(message, aiResponse.response);
      
      // Show success card
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText(`Response generated with ${Constants.STYLE.FORMALITY_LABELS[formalityLevel - 1]} tone!`)
        )
        .setNavigation(
          CardService.newNavigation()
            .pushCard(UI.buildResponseCard(aiResponse.response, draft.getId()))
        )
        .build();
        
    } catch (error) {
      AppLogger.error('Failed to generate response with formality', error);
      
      let errorMessage = 'Failed to generate response';
      if (error instanceof ErrorHandling.AppError) {
        errorMessage = error.userMessage || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText(errorMessage)
        )
        .build();
    }
  }

  /**
   * Factory reset - delete ALL data and start completely fresh
   */
  export function factoryReset(_e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      AppLogger.info('FACTORY RESET INITIATED - Deleting all user data');
      
      // Delete all user properties
      const userProperties = PropertiesService.getUserProperties();
      const userKeys = userProperties.getKeys();
      for (const key of userKeys) {
        userProperties.deleteProperty(key);
      }
      
      // Delete all script properties
      const scriptProperties = PropertiesService.getScriptProperties();
      const scriptKeys = scriptProperties.getKeys();
      for (const key of scriptKeys) {
        scriptProperties.deleteProperty(key);
      }
      
      // Delete all documents if they exist
      try {
        // Get prompt documents
        const promptTypes = ['main', 'style', 'profile'];
        for (const promptType of promptTypes) {
          try {
            const docId = GoogleDocsPrompts.getOrCreatePromptDocument(promptType);
            if (docId) {
              DriveApp.getFileById(docId).setTrashed(true);
              AppLogger.info(`Deleted prompt document: ${promptType}`);
            }
          } catch (error) {
            // Document doesn't exist or can't be deleted - continue
            AppLogger.info(`Could not delete ${promptType} document: ${error}`);
          }
        }
      } catch (error) {
        AppLogger.warn('Error during document cleanup', error);
      }
      
      AppLogger.info('FACTORY RESET COMPLETED - All data deleted');
      
      // Return to fresh settings card
      const freshSettings = Config.getSettings(); // Will be empty now
      
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('🔴 FACTORY RESET COMPLETE - All data deleted!')
        )
        .setNavigation(
          CardService.newNavigation()
            .updateCard(UI.buildSettingsCard(freshSettings))
        )
        .build();
        
    } catch (error) {
      AppLogger.error('Failed during factory reset', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Factory reset failed - some data may remain')
        )
        .build();
    }
  }

  /**
   * Test API key with debugging information
   */
  export function testApiKey(_e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      AppLogger.info('API Key test initiated by user');
      
      const settings = Config.getSettings();
      if (!settings.apiKey) {
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification()
              .setText('❌ No API key found - please enter one first')
          )
          .build();
      }

      // Test the API key
      const testResult = AI.testApiKey(settings.apiKey);
      
      if (testResult.success) {
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification()
              .setText(`✅ API KEY WORKS! ${settings.apiKey.substring(0, 8)}...${settings.apiKey.slice(-4)} is valid`)
          )
          .build();
      } else {
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification()
              .setText(`❌ API KEY FAILED: ${testResult.error}`)
          )
          .build();
      }
      
    } catch (error) {
      AppLogger.error('Failed to test API key', error);
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('❌ Test failed - check logs for details')
        )
        .build();
    }
  }
}