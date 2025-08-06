"use strict";
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
var GmailService;
(function (GmailService) {
    /**
     * Get email context from a message
     */
    function getEmailContext(message) {
        var thread = message.getThread();
        var messages = thread.getMessages();
        var messageIndex = messages.findIndex(function (m) { return m.getId() === message.getId(); });
        // Get previous messages in thread
        var previousMessages = [];
        for (var i = Math.max(0, messageIndex - Config.MAX_CONTEXT_MESSAGES); i < messageIndex; i++) {
            var msg = messages[i];
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
            previousMessages: previousMessages
        };
    }
    GmailService.getEmailContext = getEmailContext;
    /**
     * Create a draft reply
     */
    function createDraftReply(message, replyBody) {
        var thread = message.getThread();
        var draft = thread.createDraftReply(replyBody);
        AppLogger.info('Draft created', { threadId: thread.getId() });
        return draft;
    }
    GmailService.createDraftReply = createDraftReply;
    /**
     * Send a reply
     */
    function sendReply(message, replyBody) {
        var thread = message.getThread();
        thread.reply(replyBody);
        AppLogger.info('Reply sent', { threadId: thread.getId() });
    }
    GmailService.sendReply = sendReply;
    /**
     * Get current message from event
     */
    function getCurrentMessage(e) {
        if (!e.gmail || !e.gmail.messageId) {
            AppLogger.warn('No Gmail message in event');
            return null;
        }
        try {
            var message = GmailApp.getMessageById(e.gmail.messageId);
            return message;
        }
        catch (error) {
            AppLogger.error('Failed to get message', error);
            return null;
        }
    }
    GmailService.getCurrentMessage = getCurrentMessage;
    /**
     * Get draft by ID
     */
    function getDraftById(draftId) {
        try {
            var drafts = GmailApp.getDrafts();
            return drafts.find(function (d) { return d.getId() === draftId; }) || null;
        }
        catch (error) {
            AppLogger.error('Failed to get draft', error);
            return null;
        }
    }
    GmailService.getDraftById = getDraftById;
    /**
     * Update draft content
     */
    function updateDraft(draftId, newBody) {
        var draft = getDraftById(draftId);
        if (!draft) {
            AppLogger.error('Draft not found', { draftId: draftId });
            return false;
        }
        try {
            var message = draft.getMessage();
            draft.update(message.getTo(), message.getSubject(), newBody);
            return true;
        }
        catch (error) {
            AppLogger.error('Failed to update draft', error);
            return false;
        }
    }
    GmailService.updateDraft = updateDraft;
    /**
     * Get inbox threads
     */
    function getInboxThreads(maxThreads) {
        if (maxThreads === void 0) { maxThreads = Constants.EMAIL.MAX_THREADS_TO_PROCESS; }
        return GmailApp.getInboxThreads(0, maxThreads);
    }
    GmailService.getInboxThreads = getInboxThreads;
    /**
     * Check if user can send emails
     */
    function canSendEmail() {
        try {
            // Check remaining daily quota
            var quota = MailApp.getRemainingDailyQuota();
            return quota > Constants.VALIDATION.MIN_SENTENCE_COUNT;
        }
        catch (error) {
            AppLogger.error('Failed to check email quota', error);
            return false;
        }
    }
    GmailService.canSendEmail = canSendEmail;
    /**
     * Get recent sent emails for style analysis
     */
    function getRecentSentEmails(limit) {
        var e_1, _a, e_2, _b;
        try {
            var threads = GmailApp.search(Constants.EMAIL.SEARCH_SENT, 0, limit);
            var emails = [];
            try {
                for (var threads_1 = __values(threads), threads_1_1 = threads_1.next(); !threads_1_1.done; threads_1_1 = threads_1.next()) {
                    var thread = threads_1_1.value;
                    var messages = thread.getMessages();
                    try {
                        for (var messages_1 = (e_2 = void 0, __values(messages)), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
                            var message = messages_1_1.value;
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
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (messages_1_1 && !messages_1_1.done && (_b = messages_1.return)) _b.call(messages_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (threads_1_1 && !threads_1_1.done && (_a = threads_1.return)) _a.call(threads_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return emails;
        }
        catch (error) {
            AppLogger.error('Failed to get recent sent emails', error);
            return [];
        }
    }
    GmailService.getRecentSentEmails = getRecentSentEmails;
})(GmailService || (GmailService = {}));
//# sourceMappingURL=gmail.js.map