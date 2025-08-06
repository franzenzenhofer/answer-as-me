namespace UserProfile {
  export interface Profile {
    email: string;
    name?: string;
    identity: {
      role: string;
      expertise: string[];
      communicationStyle: string;
    };
    personality: {
      formality: number;
      directness: number;
      warmth: number;
      detailLevel: number;
    };
    patterns: {
      greetings: {
        formal: string[];
        casual: string[];
        client: string[];
      };
      closings: {
        formal: string[];
        casual: string[];
        client: string[];
      };
    };
    vocabulary: {
      common: string[];
      avoided: string[];
      professional: string[];
    };
    rules: string[];
    lastUpdated: string;
  }

  /**
   * Get or create user profile
   */
  export function getUserProfile(): Profile {
    const cached = Config.getProperty(Constants.PROPERTIES.USER_PROFILE);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_e) {
        AppLogger.warn('Failed to parse cached profile', _e);
      }
    }
    
    // Create initial profile
    const userEmail = Session.getActiveUser().getEmail();
    const userName = getUserName();
    
    return createInitialProfile(userEmail, userName);
  }

  /**
   * Create initial profile for new user
   */
  function createInitialProfile(email: string, name?: string): Profile {
    return {
      email,
      name,
      identity: {
        role: 'Professional',
        expertise: [],
        communicationStyle: 'Clear and professional'
      },
      personality: {
        formality: Constants.STYLE.FORMALITY_NEUTRAL,
        directness: 3,
        warmth: 3,
        detailLevel: 3
      },
      patterns: {
        greetings: {
          formal: Constants.STYLE.DEFAULT_GREETINGS,
          casual: Constants.STYLE.DEFAULT_GREETINGS,
          client: ['Dear', 'Hello']
        },
        closings: {
          formal: ['Best regards', 'Sincerely'],
          casual: Constants.STYLE.DEFAULT_CLOSINGS,
          client: ['Best regards', 'Kind regards']
        }
      },
      vocabulary: {
        common: [],
        avoided: [],
        professional: []
      },
      rules: [
        'Maintain professional tone',
        'Be clear and concise',
        'Respond promptly and helpfully'
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Update user profile with new insights
   */
  export function updateProfile(updates: Partial<Profile>): void {
    const current = getUserProfile();
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    Config.setProperty(Constants.PROPERTIES.USER_PROFILE, JSON.stringify(updated));
    AppLogger.info('User profile updated');
  }

  /**
   * Learn from analyzed emails (called by AI module to avoid circular dep)
   */
  export function updateFromAnalysis(analysisResult: any): Profile {
    try {
      const current = getUserProfile();
      
      // Merge learned patterns with current profile
      const merged: Profile = {
        ...current,
        identity: analysisResult.identity || current.identity,
        personality: analysisResult.personality || current.personality,
        patterns: mergePatterns(current.patterns, analysisResult.patterns),
        vocabulary: mergeVocabulary(current.vocabulary, analysisResult.vocabulary),
        rules: [...new Set([...current.rules, ...(analysisResult.rules || [])])],
        lastUpdated: new Date().toISOString()
      };
      
      updateProfile(merged);
      return merged;
    } catch (_e) {
      AppLogger.error('Failed to update from analysis', _e);
      return getUserProfile();
    }
  }

  /**
   * Improve profile from a specific thread (returns prompt for AI module)
   */
  export function getImprovementPrompt(thread: GoogleAppsScript.Gmail.GmailThread): string {
    const current = getUserProfile();
    const threadContent = extractThreadContent(thread);
    return Prompts.getStyleImprovementPrompt(current, threadContent);
  }
  
  /**
   * Apply improvements from AI analysis
   */
  export function applyImprovements(improvedData: any): Profile {
    try {
      updateProfile(improvedData);
      return improvedData;
    } catch (_e) {
      AppLogger.error('Failed to apply improvements', _e);
      return getUserProfile();
    }
  }

  /**
   * Extract thread content for analysis
   */
  function extractThreadContent(thread: GoogleAppsScript.Gmail.GmailThread): string {
    const messages = thread.getMessages();
    const userEmail = Session.getActiveUser().getEmail();
    
    return messages.map(msg => {
      const isFromMe = msg.getFrom().toLowerCase().includes(userEmail.toLowerCase());
      return `From: ${msg.getFrom()} ${isFromMe ? '(ME)' : ''}
Date: ${msg.getDate()}
${Utils.cleanEmailBody(msg.getPlainBody())}`;
    }).join('\n\n---\n\n');
  }

  /**
   * Helper to merge pattern objects
   */
  function mergePatterns(current: any, learned: any): any {
    if (!learned) {
      return current;
    }
    
    return {
      greetings: {
        formal: mergeArrays(current.greetings.formal, learned.greetings?.formal),
        casual: mergeArrays(current.greetings.casual, learned.greetings?.casual),
        client: mergeArrays(current.greetings.client, learned.greetings?.client)
      },
      closings: {
        formal: mergeArrays(current.closings.formal, learned.closings?.formal),
        casual: mergeArrays(current.closings.casual, learned.closings?.casual),
        client: mergeArrays(current.closings.client, learned.closings?.client)
      }
    };
  }

  /**
   * Helper to merge vocabulary objects
   */
  function mergeVocabulary(current: any, learned: any): any {
    if (!learned) {
      return current;
    }
    
    return {
      common: mergeArrays(current.common, learned.common),
      avoided: mergeArrays(current.avoided, learned.avoided),
      professional: mergeArrays(current.professional, learned.professional)
    };
  }

  /**
   * Merge arrays keeping unique values
   */
  function mergeArrays(current: string[], learned?: string[]): string[] {
    if (!learned) {
      return current;
    }
    return [...new Set([...learned, ...current])].slice(0, 10);
  }

  /**
   * Get user's name from contacts or email
   */
  function getUserName(): string | undefined {
    try {
      // Try to get from contacts
      const userEmail = Session.getActiveUser().getEmail();
      // For now, extract from email
      const namePart = userEmail.split('@')[0];
      if (!namePart) {
        return undefined;
      }
      
      return namePart.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    } catch {
      // Error parsing email - return undefined
      return undefined;
    }
  }
}