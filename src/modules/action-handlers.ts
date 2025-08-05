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
      
      // Generate response
      const aiResponse = AI.generateEmailResponse(context, style, settings);
      
      if (!aiResponse.success || !aiResponse.response) {
        throw new ErrorHandling.AppError(
          'Failed to generate response',
          'AI_ERROR',
          aiResponse.error || 'Could not generate response'
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
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText(error instanceof ErrorHandling.AppError ? error.userMessage || error.message : 'Failed to generate response')
        )
        .build();
    }
  }
  
  /**
   * Save settings action
   */
  export function saveSettings(e: Types.ExtendedEventObject): GoogleAppsScript.Card_Service.ActionResponse {
    try {
      const formData = e.formInputs as Types.FormData;
      
      // Build settings object from form
      const updates: Partial<Types.Config> = {};
      
      if (formData.apiKey && formData.apiKey[0] && !formData.apiKey[0].startsWith('••••')) {
        updates.apiKey = formData.apiKey[0];
      }
      
      if (formData.responseMode) {
        updates.responseMode = formData.responseMode[0] as Types.ResponseMode;
      }
      
      if (formData.responseLength) {
        updates.responseLength = formData.responseLength[0] as Types.ResponseLength;
      }
      
      if (formData.customInstructions !== undefined) {
        updates.customInstructions = formData.customInstructions[0] || '';
      }
      
      if (formData.signature !== undefined) {
        updates.signature = formData.signature[0] || '';
      }
      
      // Save settings
      Config.saveSettings(updates);
      
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
      const formData = e.formInputs as any;
      const editedResponse = formData.editedResponse ? formData.editedResponse[0] : '';
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
      const formData = e.formInputs as any;
      const editedResponse = formData.editedResponse ? formData.editedResponse[0] : '';
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
      const formData = e.formInputs as any;
      const editedResponse = formData.editedResponse ? formData.editedResponse[0] : '';
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
}