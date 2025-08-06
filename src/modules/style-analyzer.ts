namespace StyleAnalyzer {
  /**
   * Analyze writing style from sent emails
   */
  export function analyzeEmails(sentEmails: GoogleAppsScript.Gmail.GmailMessage[]): Types.WritingStyle {
    // Null safety check
    if (!sentEmails || !Array.isArray(sentEmails) || sentEmails.length === 0) {
      return getDefaultWritingStyle();
    }
    
    const greetings: string[] = [];
    const closings: string[] = [];
    const sentences: string[] = [];
    
    // Process up to 200 emails
    const emailsToProcess = sentEmails.slice(0, 200);
    
    emailsToProcess.forEach(email => {
      if (!email) {
        return;
      }
      
      try {
        const plainBody = email.getPlainBody();
        if (!plainBody) {
          return;
        }
        
        const body = Utils.cleanEmailBody(plainBody);
        
        // Skip very short emails
        if (!body || body.length < 50) {
          return;
        }
      
      
        // Extract greeting
        const greetingMatch = body.match(/^(Hi|Hello|Hey|Dear|Good\s+\w+)[,\s]*/i);
        if (greetingMatch && greetingMatch[1]) {
          greetings.push(greetingMatch[1]);
        }
      
        // Extract closing
        const lines = body.split('\n');
        if (lines && lines.length > 0) {
          for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
            const line = lines[i];
            if (line) {
              const trimmedLine = line.trim();
              if (trimmedLine && trimmedLine.match(/(regards|best|sincerely|thanks|cheers)/i)) {
                closings.push(trimmedLine);
                break;
              }
            }
          }
        }
      
        // Extract sentences for pattern analysis
        const sentenceMatches = body.match(/[^.!?]+[.!?]+/g);
        if (sentenceMatches && sentenceMatches.length > 0) {
          sentences.push(...sentenceMatches.slice(0, 5)); // First 5 sentences
        }
      } catch (error) {
        AppLogger.warn('Failed to analyze email', error);
      }
    });
    
    // Build style profile
    return {
      greetings: getTopItems(greetings, 3),
      closings: getTopItems(closings, 3),
      sentencePatterns: extractPatterns(sentences),
      vocabulary: [], // Could be enhanced with word frequency analysis
      formalityLevel: detectFormality(sentences),
      averageSentenceLength: sentences.length > 0 
        ? Math.round(sentences.join(' ').length / sentences.length)
        : 15,
      emailLength: 'medium', // Default to medium
      punctuationStyle: detectPunctuationStyle(sentences)
    };
  }
  
  /**
   * Get most common items
   */
  function getTopItems(items: string[], count: number): string[] {
    const frequency: { [key: string]: number } = {};
    
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(entry => entry[0]);
  }
  
  /**
   * Extract sentence patterns
   */
  function extractPatterns(sentences: string[]): string[] {
    if (!sentences || sentences.length === 0) {
      return [];
    }
    
    const patterns: string[] = [];
    
    // Look for common starters
    const starters = sentences
      .filter(s => s && typeof s === 'string')
      .map(s => {
        const words = s.trim().split(' ');
        return words ? words.slice(0, 3).join(' ') : '';
      })
      .filter(s => s && s.length > 5);
    
    if (starters.length > 0) {
      patterns.push(...getTopItems(starters, 5));
    }
    
    return patterns;
  }
  
  /**
   * Detect formality level
   */
  function detectFormality(sentences: string[]): number {
    if (!sentences || sentences.length === 0) {
      return 3; // Default to neutral
    }
    
    const text = sentences
      .filter(s => s && typeof s === 'string')
      .join(' ')
      .toLowerCase();
    
    // Informal indicators
    const informalCount = (
      (text.match(/\b(hey|hi|yeah|yep|nope|gonna|wanna|kinda)\b/g) || []).length +
      (text.match(/!+/g) || []).length +
      (text.match(/\.\.\./g) || []).length
    );
    
    // Formal indicators
    const formalCount = (
      (text.match(/\b(regards|sincerely|furthermore|therefore|however|nevertheless)\b/g) || []).length +
      (text.match(/\b(would|could|should|shall|may)\b/g) || []).length
    );
    
    // Calculate formality score (1-5)
    if (informalCount > formalCount * 2) {
      return 2;
    }
    if (formalCount > informalCount * 2) {
      return 4;
    }
    return 3;
  }
  
  /**
   * Detect punctuation style
   */
  function detectPunctuationStyle(sentences: string[]): string {
    if (!sentences || sentences.length === 0) {
      return 'standard';
    }
    
    const text = sentences
      .filter(s => s && typeof s === 'string')
      .join(' ');
    
    const hasExclamations = (text.match(/!/g) || []).length > sentences.length * 0.1;
    const hasEllipsis = (text.match(/\.\.\./g) || []).length > 0;
    const hasDashes = (text.match(/--|-/g) || []).length > sentences.length * 0.1;
    
    if (hasExclamations) {
      return 'enthusiastic';
    }
    if (hasEllipsis) {
      return 'casual';
    }
    if (hasDashes) {
      return 'detailed';
    }
    return 'standard';
  }
  
  /**
   * Get default writing style when analysis fails
   */
  function getDefaultWritingStyle(): Types.WritingStyle {
    return {
      greetings: Constants.STYLE.DEFAULT_GREETINGS,
      closings: Constants.STYLE.DEFAULT_CLOSINGS,
      sentencePatterns: [],
      vocabulary: [],
      formalityLevel: Constants.STYLE.FORMALITY_NEUTRAL,
      averageSentenceLength: Constants.STYLE.DEFAULT_AVG_SENTENCE_LENGTH,
      emailLength: 'medium',
      punctuationStyle: Constants.STYLE.DEFAULT_PUNCTUATION
    };
  }
}