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
   * Build message card with actions
   */
  export function buildMessageCard(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    const card = CardService.newCardBuilder();
    const header = CardService.newCardHeader()
      .setTitle('Your Email Assistant')
      .setSubtitle('I\'ll draft responses in your style');
    
    card.setHeader(header);
    
    // Main actions section
    const mainSection = CardService.newCardSection();
    
    const generateButton = CardService.newTextButton()
      .setText('Generate Response')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('generateResponse')
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
    
    mainSection.addWidget(generateButton);
    
    // Check if thread has messages from user for learning option
    try {
      const message = GmailService.getCurrentMessage(e);
      if (message) {
        const thread = message.getThread();
        const messages = thread.getMessages();
        const userEmail = Session.getActiveUser().getEmail();
        const hasUserMessages = messages.some(msg => 
          msg.getFrom().toLowerCase().includes(userEmail.toLowerCase())
        );
        
        if (hasUserMessages) {
          const learnSection = CardService.newCardSection()
            .setHeader('Improve Assistant');
          
          learnSection.addWidget(
            CardService.newTextParagraph()
              .setText('This thread contains your messages. I can learn from your communication style here.')
          );
          
          const learnButton = CardService.newTextButton()
            .setText('Learn from this Thread')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('learnFromThread')
            )
            .setTextButtonStyle(CardService.TextButtonStyle.TEXT);
          
          learnSection.addWidget(learnButton);
          card.addSection(mainSection);
          card.addSection(learnSection);
        } else {
          card.addSection(mainSection);
        }
      } else {
        card.addSection(mainSection);
      }
    } catch (error) {
      AppLogger.warn('Could not check thread for learning', error);
      card.addSection(mainSection);
    }
    
    // Settings shortcut
    const settingsSection = CardService.newCardSection();
    const settingsButton = CardService.newTextButton()
      .setText('Settings')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onHomepage')
      );
    
    settingsSection.addWidget(settingsButton);
    card.addSection(settingsSection);
    
    return card.build();
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
   * Settings universal action
   */
  export function onSettings(_e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
    try {
      AppLogger.info('Settings opened');
      return UI.buildMainCard(Config.getSettings());
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