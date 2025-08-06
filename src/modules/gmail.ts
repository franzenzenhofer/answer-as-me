namespace GmailService {
  /**
   * Get email context from a message
   */
  export function getEmailContext(message: GoogleAppsScript.Gmail.GmailMessage): Types.EmailContext {
    const thread = message.getThread();
    const messages = thread.getMessages();
    const messageIndex = messages.findIndex(m => m.getId() === message.getId());
    
    // Get previous messages in thread
    const previousMessages: Types.EmailMessage[] = [];
    for (let i = Math.max(0, messageIndex - Config.MAX_CONTEXT_MESSAGES); i < messageIndex; i++) {
      const msg = messages[i];
      if (msg) {
        previousMessages.push({
          from: msg.getFrom(),
          to: msg.getTo(),
          date: msg.getDate(),
          body: Utils.cleanEmailBody(msg.getPlainBody())
        });
      }
    }
    
    return {
      threadId: thread.getId(),
      messageId: message.getId(),
      from: message.getFrom(),
      to: message.getTo(),
      subject: message.getSubject(),
      body: Utils.cleanEmailBody(message.getPlainBody()),
      date: message.getDate(),
      isReply: messageIndex > 0,
      previousMessages
    };
  }
  
  /**
   * Create a draft reply
   */
  export function createDraftReply(
    message: GoogleAppsScript.Gmail.GmailMessage,
    replyBody: string
  ): GoogleAppsScript.Gmail.GmailDraft {
    const thread = message.getThread();
    const draft = thread.createDraftReply(replyBody);
    
    AppLogger.info('Draft created', { threadId: thread.getId() });
    return draft;
  }
  
  /**
   * Send a reply
   */
  export function sendReply(
    message: GoogleAppsScript.Gmail.GmailMessage,
    replyBody: string
  ): void {
    const thread = message.getThread();
    thread.reply(replyBody);
    
    AppLogger.info('Reply sent', { threadId: thread.getId() });
  }
  
  /**
   * Get current message from event
   */
  export function getCurrentMessage(
    e: GoogleAppsScript.Addons.EventObject
  ): GoogleAppsScript.Gmail.GmailMessage | null {
    if (!e.gmail || !e.gmail.messageId) {
      AppLogger.warn('No Gmail message in event');
      return null;
    }
    
    try {
      const message = GmailApp.getMessageById(e.gmail.messageId);
      return message;
    } catch (error) {
      AppLogger.error('Failed to get message', error);
      return null;
    }
  }
  
  /**
   * Get draft by ID
   */
  export function getDraftById(draftId: string): GoogleAppsScript.Gmail.GmailDraft | null {
    try {
      const drafts = GmailApp.getDrafts();
      return drafts.find(d => d.getId() === draftId) || null;
    } catch (error) {
      AppLogger.error('Failed to get draft', error);
      return null;
    }
  }
  
  /**
   * Update draft content
   */
  export function updateDraft(
    draftId: string,
    newBody: string
  ): boolean {
    const draft = getDraftById(draftId);
    if (!draft) {
      AppLogger.error('Draft not found', { draftId });
      return false;
    }
    
    try {
      const message = draft.getMessage();
      draft.update(
        message.getTo(),
        message.getSubject(),
        newBody
      );
      return true;
    } catch (error) {
      AppLogger.error('Failed to update draft', error);
      return false;
    }
  }
  
  /**
   * Get inbox threads
   */
  export function getInboxThreads(
    maxThreads: number = Constants.EMAIL.MAX_THREADS_TO_PROCESS
  ): GoogleAppsScript.Gmail.GmailThread[] {
    return GmailApp.getInboxThreads(0, maxThreads);
  }
  
  /**
   * Check if user can send emails
   */
  export function canSendEmail(): boolean {
    try {
      // Check remaining daily quota
      const quota = MailApp.getRemainingDailyQuota();
      return quota > Constants.VALIDATION.MIN_SENTENCE_COUNT;
    } catch (error) {
      AppLogger.error('Failed to check email quota', error);
      return false;
    }
  }
  
  /**
   * Get recent sent emails for style analysis
   */
  export function getRecentSentEmails(limit: number): { body: string }[] {
    try {
      const threads = GmailApp.search(Constants.EMAIL.SEARCH_SENT, 0, limit);
      const emails: { body: string }[] = [];
      
      for (const thread of threads) {
        const messages = thread.getMessages();
        for (const message of messages) {
          // Only include messages sent by the user
          if (message.getFrom().includes(Session.getActiveUser().getEmail())) {
            emails.push({
              body: message.getPlainBody()
            });
            if (emails.length >= limit) {
              return emails;
            }
          }
        }
      }
      
      return emails;
    } catch (error) {
      AppLogger.error('Failed to get recent sent emails', error);
      return [];
    }
  }
}