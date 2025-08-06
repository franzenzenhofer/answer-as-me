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
var ContextExtractor;
(function (ContextExtractor) {
    /**
     * Extract context from email thread
     */
    function extractThreadContext(thread, currentMessageId) {
        var messages = thread.getMessages();
        var currentIndex = messages.findIndex(function (m) { return m.getId() === currentMessageId; });
        if (currentIndex === -1) {
            throw new ErrorHandling.AppError('Message not found in thread', 'MESSAGE_NOT_FOUND');
        }
        var currentMessage = messages[currentIndex];
        if (!currentMessage) {
            throw new ErrorHandling.AppError('Message not found at index', 'MESSAGE_NOT_FOUND');
        }
        // Get previous messages for context (limit to prevent memory issues)
        var previousMessages = [];
        var maxContextMessages = Math.min(Constants.EMAIL.MAX_CONTEXT_MESSAGES, 10);
        var startIndex = Math.max(0, currentIndex - maxContextMessages);
        for (var i = startIndex; i < currentIndex; i++) {
            var msg = messages[i];
            if (msg) {
                var plainBody = msg.getPlainBody();
                // Limit body size to prevent memory issues
                var truncatedBody = plainBody.length > 5000 ?
                    "".concat(plainBody.substring(0, 5000), "... [truncated]") : plainBody;
                previousMessages.push({
                    from: msg.getFrom(),
                    to: msg.getTo(),
                    date: msg.getDate(),
                    body: Utils.cleanEmailBody(truncatedBody)
                });
            }
        }
        return {
            threadId: thread.getId(),
            messageId: currentMessageId,
            from: currentMessage.getFrom(),
            to: currentMessage.getTo(),
            subject: currentMessage.getSubject(),
            body: Utils.cleanEmailBody(currentMessage.getPlainBody()),
            date: currentMessage.getDate(),
            isReply: currentIndex > 0,
            previousMessages: previousMessages
        };
    }
    ContextExtractor.extractThreadContext = extractThreadContext;
    /**
     * Extract key information from email
     */
    function extractKeyInfo(emailBody) {
        var e_1, _a;
        // Check for questions
        var hasQuestion = /\?|^(what|where|when|why|how|who|which|could|would|should|can|will)/im.test(emailBody);
        // Extract potential topics (simple keyword extraction with memory optimization)
        var stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);
        // Limit text size to prevent memory issues
        var textToAnalyze = emailBody.length > 10000 ?
            emailBody.substring(0, 10000) : emailBody;
        // Use Map for better memory management and limit total unique words
        var topicCounts = new Map();
        var words = textToAnalyze.toLowerCase().split(/\s+/);
        try {
            for (var words_1 = __values(words), words_1_1 = words_1.next(); !words_1_1.done; words_1_1 = words_1.next()) {
                var word = words_1_1.value;
                if (word.length > 4 && !stopWords.has(word)) {
                    topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
                    // Limit map size to prevent memory issues
                    if (topicCounts.size > 100) {
                        // Remove least frequent words
                        var entries = Array.from(topicCounts.entries());
                        entries.sort(function (a, b) { return a[1] - b[1]; });
                        if (entries[0]) {
                            topicCounts.delete(entries[0][0]);
                        }
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (words_1_1 && !words_1_1.done && (_a = words_1.return)) _a.call(words_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // Convert to array and get top topics
        var topTopics = Array.from(topicCounts.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 5)
            .map(function (entry) { return entry[0]; });
        // Simple sentiment detection
        var positiveWords = (emailBody.match(/\b(good|great|excellent|wonderful|fantastic|appreciate|thanks|thank you|pleased|happy)\b/gi) || []).length;
        var negativeWords = (emailBody.match(/\b(bad|poor|terrible|awful|disappointed|unhappy|problem|issue|concern|complaint)\b/gi) || []).length;
        var sentiment = 'neutral';
        if (positiveWords > negativeWords * 2) {
            sentiment = 'positive';
        }
        else if (negativeWords > positiveWords * 2) {
            sentiment = 'negative';
        }
        return {
            hasQuestion: hasQuestion,
            topics: topTopics,
            sentiment: sentiment
        };
    }
    ContextExtractor.extractKeyInfo = extractKeyInfo;
})(ContextExtractor || (ContextExtractor = {}));
//# sourceMappingURL=context-extractor.js.map