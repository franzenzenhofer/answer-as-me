namespace ContextExtractor {
  /**
   * Extract context from email thread
   */
  export function extractThreadContext(
    thread: GoogleAppsScript.Gmail.GmailThread,
    currentMessageId: string
  ): Types.EmailContext {
    const messages = thread.getMessages();
    const currentIndex = messages.findIndex(m => m.getId() === currentMessageId);
    
    if (currentIndex === -1) {
      throw new ErrorHandling.AppError(
        'Message not found in thread',
        'MESSAGE_NOT_FOUND'
      );
    }
    
    const currentMessage = messages[currentIndex];
    if (!currentMessage) {
      throw new ErrorHandling.AppError(
        'Message not found at index',
        'MESSAGE_NOT_FOUND'
      );
    }
    
    // Get previous messages for context
    const previousMessages: Types.EmailMessage[] = [];
    const startIndex = Math.max(0, currentIndex - 10); // Last 10 messages max
    
    for (let i = startIndex; i < currentIndex; i++) {
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
      messageId: currentMessageId,
      from: currentMessage.getFrom(),
      to: currentMessage.getTo(),
      subject: currentMessage.getSubject(),
      body: Utils.cleanEmailBody(currentMessage.getPlainBody()),
      date: currentMessage.getDate(),
      isReply: currentIndex > 0,
      previousMessages
    };
  }
  
  /**
   * Extract key information from email
   */
  export function extractKeyInfo(emailBody: string): {
    hasQuestion: boolean;
    topics: string[];
    sentiment: string;
  } {
    // Check for questions
    const hasQuestion = /\?|^(what|where|when|why|how|who|which|could|would|should|can|will)/im.test(emailBody);
    
    // Extract potential topics (simple keyword extraction)
    const words = emailBody.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);
    
    const topics = words
      .filter(word => word.length > 4 && !stopWords.has(word))
      .reduce((acc: { [key: string]: number }, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});
    
    const topTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Simple sentiment detection
    const positiveWords = (emailBody.match(/\b(good|great|excellent|wonderful|fantastic|appreciate|thanks|thank you|pleased|happy)\b/gi) || []).length;
    const negativeWords = (emailBody.match(/\b(bad|poor|terrible|awful|disappointed|unhappy|problem|issue|concern|complaint)\b/gi) || []).length;
    
    let sentiment = 'neutral';
    if (positiveWords > negativeWords * 2) sentiment = 'positive';
    else if (negativeWords > positiveWords * 2) sentiment = 'negative';
    
    return {
      hasQuestion,
      topics: topTopics,
      sentiment
    };
  }
}