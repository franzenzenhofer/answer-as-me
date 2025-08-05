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
      
      // const settings = Config.getSettings(); // Not used
      
      // Simple card with generate button
      const card = CardService.newCardBuilder();
      const header = CardService.newCardHeader()
        .setTitle('Generate Response')
        .setSubtitle('Click to create a response in your style');
      
      card.setHeader(header);
      
      const section = CardService.newCardSection();
      
      const generateButton = CardService.newTextButton()
        .setText('Generate Response')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('generateResponse')
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
      
      section.addWidget(generateButton);
      card.addSection(section);
      
      return card.build();
      
    } catch (error) {
      return ErrorHandling.handleError(error);
    }
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
}