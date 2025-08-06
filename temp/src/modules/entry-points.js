"use strict";
var EntryPoints;
(function (EntryPoints) {
    /**
     * Homepage trigger
     */
    function onHomepage(_e) {
        try {
            AppLogger.info('Homepage opened');
            var settings = Config.getSettings();
            return UI.buildMainCard(settings);
        }
        catch (error) {
            return ErrorHandling.handleError(error);
        }
    }
    EntryPoints.onHomepage = onHomepage;
    /**
     * Gmail message trigger
     */
    function onGmailMessage(e) {
        try {
            AppLogger.info('Gmail message opened');
            if (!e.gmail || !e.gmail.messageId) {
                // No separate error card - return settings card
                var settings = Config.getSettings();
                return UI.buildSettingsCard(settings);
            }
            return buildMessageCard(e);
        }
        catch (error) {
            return ErrorHandling.handleError(error);
        }
    }
    EntryPoints.onGmailMessage = onGmailMessage;
    /**
     * Build thread-specific card - CARD 3
     */
    function buildMessageCard(e) {
        var settings = Config.getSettings();
        // Get email context for thread card
        var emailContext = null;
        try {
            var message = GmailService.getCurrentMessage(e);
            if (message) {
                emailContext = {
                    subject: message.getSubject(),
                    sender: message.getFrom()
                };
            }
        }
        catch (error) {
            AppLogger.warn('Could not get email context', error);
        }
        return UI.buildThreadCard(settings, emailContext);
    }
    EntryPoints.buildMessageCard = buildMessageCard;
    /**
     * Compose action trigger
     */
    function onComposeAction(_e) {
        try {
            AppLogger.info('Compose action triggered');
            return UI.buildMainCard(Config.getSettings());
        }
        catch (error) {
            return ErrorHandling.handleError(error);
        }
    }
    EntryPoints.onComposeAction = onComposeAction;
    /**
     * Settings universal action - Always show CARD 1 (Settings)
     */
    function onSettings(_e) {
        try {
            AppLogger.info('Settings opened');
            var settings = Config.getSettings();
            return UI.buildSettingsCard(settings);
        }
        catch (error) {
            return ErrorHandling.handleError(error);
        }
    }
    EntryPoints.onSettings = onSettings;
    /**
     * Help universal action
     */
    function onHelp(_e) {
        try {
            AppLogger.info('Help opened');
            return UI.buildHelpCard();
        }
        catch (error) {
            return ErrorHandling.handleError(error);
        }
    }
    EntryPoints.onHelp = onHelp;
    /**
     * Prompt Editor universal action - goes to Settings card
     */
    function onPromptEditor(_e) {
        try {
            AppLogger.info('Prompt Editor opened - redirecting to Settings');
            var settings = Config.getSettings();
            return UI.buildSettingsCard(settings);
        }
        catch (error) {
            return ErrorHandling.handleError(error);
        }
    }
    EntryPoints.onPromptEditor = onPromptEditor;
    /**
     * Style Analysis universal action - goes to Settings card
     */
    function onStyleAnalysis(_e) {
        try {
            AppLogger.info('Style Analysis opened - redirecting to Settings');
            var settings = Config.getSettings();
            return UI.buildSettingsCard(settings);
        }
        catch (error) {
            return ErrorHandling.handleError(error);
        }
    }
    EntryPoints.onStyleAnalysis = onStyleAnalysis;
})(EntryPoints || (EntryPoints = {}));
//# sourceMappingURL=entry-points.js.map