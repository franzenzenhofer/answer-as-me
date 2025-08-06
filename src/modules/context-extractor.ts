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
    
    // Get previous messages for context (limit to prevent memory issues)
    const previousMessages: Types.EmailMessage[] = [];
    const maxContextMessages = Math.min(Constants.EMAIL.MAX_CONTEXT_MESSAGES, 10);
    const startIndex = Math.max(0, currentIndex - maxContextMessages);
    
    for (let i = startIndex; i < currentIndex; i++) {
      const msg = messages[i];
      if (msg) {
        const plainBody = msg.getPlainBody();
        // Limit body size to prevent memory issues
        const truncatedBody = plainBody.length > 5000 ? 
          `${plainBody.substring(0, 5000)  }... [truncated]` : plainBody;
        
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
    
    // Extract potential topics (simple keyword extraction with memory optimization)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);
    
    // Limit text size to prevent memory issues
    const textToAnalyze = emailBody.length > 10000 ? 
      emailBody.substring(0, 10000) : emailBody;
    
    // Use Map for better memory management and limit total unique words
    const topicCounts = new Map<string, number>();
    const words = textToAnalyze.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (word.length > 4 && !stopWords.has(word)) {
        topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
        
        // Limit map size to prevent memory issues
        if (topicCounts.size > 100) {
          // Remove least frequent words
          const entries = Array.from(topicCounts.entries());
          entries.sort((a, b) => a[1] - b[1]);
          if (entries[0]) {
            topicCounts.delete(entries[0][0]);
          }
        }
      }
    }
    
    // Convert to array and get top topics
    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Simple sentiment detection
    const positiveWords = (emailBody.match(/\b(good|great|excellent|wonderful|fantastic|appreciate|thanks|thank you|pleased|happy)\b/gi) || []).length;
    const negativeWords = (emailBody.match(/\b(bad|poor|terrible|awful|disappointed|unhappy|problem|issue|concern|complaint)\b/gi) || []).length;
    
    let sentiment = 'neutral';
    if (positiveWords > negativeWords * 2) {
      sentiment = 'positive';
    } else if (negativeWords > positiveWords * 2) {
      sentiment = 'negative';
    }
    
    return {
      hasQuestion,
      topics: topTopics,
      sentiment
    };
  }
}