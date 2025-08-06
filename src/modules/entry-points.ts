namespace EntryPoints {
  /**
   * Homepage trigger
   */
  export function onHomepage(_e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    try {
      AppLogger.info('Homepage opened');
      const settings = Config.getSettings();
      return UI.buildMainCard(settings);
    } catch (error) {
      return ErrorHandling.handleError(error);
    }
  }
  
  /**
   * Gmail message trigger
   */
  export function onGmailMessage(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    try {
      AppLogger.info('Gmail message opened');
      
      if (!e.gmail || !e.gmail.messageId) {
        return UI.buildErrorCard('No email selected');
      }
      
      return buildMessageCard(e);
      
    } catch (error) {
      return ErrorHandling.handleError(error);
    }
  }
  
  /**
   * Build thread-specific card - CARD 3
   */
  export function buildMessageCard(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    const settings = Config.getSettings();
    
    // Get email context for thread card
    let emailContext = null;
    try {
      const message = GmailService.getCurrentMessage(e);
      if (message) {
        emailContext = {
          subject: message.getSubject(),
          sender: message.getFrom()
        };
      }
    } catch (error) {
      AppLogger.warn('Could not get email context', error);
    }
    
    return UI.buildThreadCard(settings, emailContext);
  }
  
  /**
   * Compose action trigger
   */
  export function onComposeAction(_e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    try {
      AppLogger.info('Compose action triggered');
      return UI.buildMainCard(Config.getSettings());
    } catch (error) {
      return ErrorHandling.handleError(error);
    }
  }
  
  /**
   * Settings universal action - Always show CARD 1 (Settings)
   */
  export function onSettings(_e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    try {
      AppLogger.info('Settings opened');
      const settings = Config.getSettings();
      return UI.buildSettingsCard(settings);
    } catch (error) {
      return ErrorHandling.handleError(error);
    }
  }
  
  /**
   * Help universal action
   */
  export function onHelp(_e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    try {
      AppLogger.info('Help opened');
      return UI.buildHelpCard();
    } catch (error) {
      return ErrorHandling.handleError(error);
    }
  }
  
  /**
   * Prompt Editor universal action
   */
  export function onPromptEditor(_e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    try {
      AppLogger.info('Prompt Editor opened');
      return UI.buildPromptEditorCard();
    } catch (error) {
      return ErrorHandling.handleError(error);
    }
  }
  
  /**
   * Style Analysis universal action
   */
  export function onStyleAnalysis(_e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    try {
      AppLogger.info('Style Analysis opened');
      const style = AI.getWritingStyle();
      return UI.buildStyleAnalysisCard(style);
    } catch (error) {
      return ErrorHandling.handleError(error);
    }
  }
}