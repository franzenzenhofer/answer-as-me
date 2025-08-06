namespace StyleImprover {
  /**
   * Improve existing writing style based on a single email thread
   * This allows incremental learning from specific conversations
   */
  export function improveStyleFromThread(
    currentStyle: Types.WritingStyle,
    thread: GoogleAppsScript.Gmail.GmailThread
  ): Types.WritingStyle | null {
    try {
      // Extract all messages from thread
      const messages = thread.getMessages();
      const myEmail = Session.getActiveUser().getEmail();
      
      // Find messages sent by me
      const myMessages = messages.filter(msg => {
        const from = msg.getFrom().toLowerCase();
        return from.includes(myEmail.toLowerCase());
      });
      
      if (myMessages.length === 0) {
        AppLogger.warn('No messages from user in thread');
        return null;
      }
      
      // Analyze patterns from my messages in this thread
      const threadPatterns = analyzeThreadPatterns(myMessages);
      
      // Merge with existing style
      return mergeStyles(currentStyle, threadPatterns);
    } catch (error) {
      AppLogger.error('Failed to improve style from thread', error);
      return null;
    }
  }
  
  /**
   * Analyze patterns from messages in a thread
   */
  function analyzeThreadPatterns(messages: GoogleAppsScript.Gmail.GmailMessage[]): Partial<Types.WritingStyle> {
    const greetings: string[] = [];
    const closings: string[] = [];
    const sentences: string[] = [];
    
    messages.forEach(msg => {
      const body = Utils.cleanEmailBody(msg.getPlainBody());
      
      // Extract greeting
      const greetingMatch = body.match(Constants.PATTERNS.GREETING);
      if (greetingMatch) {
        greetings.push(greetingMatch[0]);
      }
      
      // Extract closing
      const lines = body.split('\n');
      for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
        const line = lines[i]!.trim();
        if (line.match(Constants.PATTERNS.CLOSING)) {
          closings.push(line);
          break;
        }
      }
      
      // Extract sentences
      const sentenceMatches = body.match(/[^.!?]+[.!?]+/g);
      if (sentenceMatches) {
        sentences.push(...sentenceMatches);
      }
    });
    
    return {
      greetings: getUniqueItems(greetings),
      closings: getUniqueItems(closings),
      sentencePatterns: extractPatterns(sentences),
      formalityLevel: detectFormality(sentences),
      punctuationStyle: detectPunctuationStyle(sentences)
    };
  }
  
  /**
   * Merge current style with new patterns from thread
   */
  function mergeStyles(
    current: Types.WritingStyle,
    threadPatterns: Partial<Types.WritingStyle>
  ): Types.WritingStyle {
    return {
      // Merge greetings, keeping most recent/relevant
      greetings: mergeAndPrioritize(
        current.greetings,
        threadPatterns.greetings || [],
        Constants.STYLE.MAX_GREETINGS
      ),
      
      // Merge closings
      closings: mergeAndPrioritize(
        current.closings,
        threadPatterns.closings || [],
        Constants.STYLE.MAX_CLOSINGS
      ),
      
      // Merge sentence patterns
      sentencePatterns: mergeAndPrioritize(
        current.sentencePatterns,
        threadPatterns.sentencePatterns || [],
        Constants.STYLE.MAX_PATTERNS
      ),
      
      // Keep existing vocabulary (could be enhanced)
      vocabulary: current.vocabulary,
      
      // Average formality levels
      formalityLevel: threadPatterns.formalityLevel !== undefined
        ? Math.round((current.formalityLevel + threadPatterns.formalityLevel) / 2)
        : current.formalityLevel,
      
      // Keep current average sentence length
      averageSentenceLength: current.averageSentenceLength,
      
      // Keep current email length preference
      emailLength: current.emailLength,
      
      // Update punctuation style if different
      punctuationStyle: threadPatterns.punctuationStyle || current.punctuationStyle
    };
  }
  
  /**
   * Merge arrays and prioritize newer items
   */
  function mergeAndPrioritize(current: string[], new_: string[], maxItems: number): string[] {
    // Combine and deduplicate
    const combined = [...new Set([...new_, ...current])];
    
    // Return up to maxItems, prioritizing newer patterns
    return combined.slice(0, maxItems);
  }
  
  /**
   * Get unique items from array
   */
  function getUniqueItems(items: string[]): string[] {
    return [...new Set(items)];
  }
  
  /**
   * Extract sentence patterns (reuse from StyleAnalyzer)
   */
  function extractPatterns(sentences: string[]): string[] {
    const starters = sentences
      .map(s => s.trim().split(' ').slice(0, 3).join(' '))
      .filter(s => s.length > Constants.STYLE.MIN_WORD_LENGTH);
    
    // Count frequency and return most common
    const frequency: { [key: string]: number } = {};
    starters.forEach(pattern => {
      frequency[pattern] = (frequency[pattern] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .filter(([_, count]) => count >= Constants.STYLE.MIN_PATTERN_FREQUENCY)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Constants.STYLE.MAX_PATTERNS)
      .map(entry => entry[0]);
  }
  
  /**
   * Detect formality level from sentences
   */
  function detectFormality(sentences: string[]): number {
    const text = sentences.join(' ').toLowerCase();
    
    // Count formal indicators
    const formalCount = Constants.LISTS.FORMAL_INDICATORS
      .filter(indicator => text.includes(indicator))
      .length;
    
    // Count casual indicators
    const casualCount = Constants.LISTS.CASUAL_INDICATORS
      .filter(indicator => text.includes(indicator))
      .length;
    
    // Calculate formality score
    if (casualCount > formalCount * 2) {
      return Constants.STYLE.FORMALITY_CASUAL;
    }
    if (formalCount > casualCount * 2) {
      return Constants.STYLE.FORMALITY_FORMAL;
    }
    return Constants.STYLE.FORMALITY_NEUTRAL;
  }
  
  /**
   * Detect punctuation style
   */
  function detectPunctuationStyle(sentences: string[]): string {
    const text = sentences.join(' ');
    
    const exclamationRatio = (text.match(/!/g) || []).length / sentences.length;
    const ellipsisCount = (text.match(/\.\.\./g) || []).length;
    const dashCount = (text.match(/--|-/g) || []).length;
    
    if (exclamationRatio > 0.1) {
      return 'enthusiastic';
    }
    if (ellipsisCount > 0) {
      return 'casual';
    }
    if (dashCount > sentences.length * 0.1) {
      return 'detailed';
    }
    return Constants.STYLE.DEFAULT_PUNCTUATION;
  }
}