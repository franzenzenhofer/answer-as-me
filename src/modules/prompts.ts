/**
 * Prompts Module - DRY Implementation
 * 
 * ALL PROMPTS ARE FETCHED FROM GOOGLE DOCS
 * This module is just a thin wrapper around GoogleDocsPrompts
 * NO HARDCODED PROMPTS - Everything comes from Google Docs
 */

namespace Prompts {
  /**
   * KISS APPROACH - Only 3 main prompt functions
   */
  
  /**
   * Get settings/identity prompt (combines old ASSISTANT_IDENTITY)
   */
  export function getSettingsPrompt(userEmail: string, userName?: string): string {
    DebugLogger.logLogic('getSettingsPrompt', 'START', { userEmail, userName });
    
    // Auto-create documents if they don't exist
    ensurePromptsExist();
    
    const result = GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.SETTINGS, {
      userEmail,
      userName: userName || userEmail
    });
    
    DebugLogger.logLogic('getSettingsPrompt', 'COMPLETE', { userEmail }, { promptLength: result.length });
    return result;
  }

  /**
   * Get overview/response generation prompt (combines old RESPONSE_GENERATION)  
   */
  export function getOverviewPrompt(
    context: Types.EmailContext,
    style: Types.WritingStyle,
    userProfile: Types.UserProfile,
    instructions?: string
  ): string {
    DebugLogger.logLogic('getOverviewPrompt', 'START', { subject: context.subject, hasStyle: !!style });
    
    // Auto-create documents if they don't exist
    ensurePromptsExist();
    
    // Build recipient info
    const recipientInfo = buildRecipientInfo(context);
    
    // Build identity summary
    const identity = buildIdentitySummary(userProfile);
    
    // Build style summary
    const styleSummary = buildStyleSummary(style);
    
    // Build context summary
    const contextSummary = buildContextSummary(context);
    
    const result = GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.OVERVIEW, {
      context: contextSummary,
      identity,
      style: styleSummary,
      recipientInfo,
      instructions: instructions || 'None',
      userName: userProfile.name || userProfile.email
    });
    
    DebugLogger.logLogic('getOverviewPrompt', 'COMPLETE', 
      { context: contextSummary.substring(0, 100) }, 
      { promptLength: result.length }
    );
    return result;
  }

  /**
   * Get thread/learning prompt (combines old STYLE_ANALYSIS, STYLE_IMPROVEMENT, THREAD_LEARNING)
   */
  export function getThreadPrompt(
    userEmail: string,
    threadMessages?: string,
    currentProfile?: Types.UserProfile,
    threadContent?: string
  ): string {
    DebugLogger.logLogic('getThreadPrompt', 'START', { 
      userEmail, 
      hasThreadMessages: !!threadMessages,
      hasProfile: !!currentProfile 
    });
    
    // Auto-create documents if they don't exist
    ensurePromptsExist();
    
    const result = GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.THREAD, {
      userEmail,
      threadMessages: threadMessages || '',
      currentProfile: currentProfile ? JSON.stringify(currentProfile, null, 2) : '',
      threadContent: threadContent || ''
    });
    
    DebugLogger.logLogic('getThreadPrompt', 'COMPLETE', { userEmail }, { promptLength: result.length });
    return result;
  }

  /**
   * Ensure all prompt documents exist - creates them immediately if missing
   */
  function ensurePromptsExist(): void {
    try {
      // Check if any documents are missing and create them immediately
      const promptTypes = Object.values(Constants.PROMPTS.TYPES);
      let missingDocs = 0;
      
      for (const promptType of promptTypes) {
        const docIdKey = `${Constants.PROMPTS.DOC_ID_PREFIX}${promptType}`;
        const docId = PropertyManager.getProperty(docIdKey, 'user');
        
        if (!docId) {
          missingDocs++;
        }
      }
      
      if (missingDocs > 0) {
        DebugLogger.info('Prompts', `Creating ${missingDocs} missing prompt documents`);
        GoogleDocsPrompts.createAllPromptDocuments();
      }
    } catch (error) {
      DebugLogger.logError('Prompts', error instanceof Error ? error : String(error), null, 'Failed to ensure prompts exist - may use fallback prompts');
    }
  }

  // Legacy compatibility functions - redirect to new simplified functions
  
  export function getAssistantIdentityPrompt(userEmail: string, userName?: string): string {
    return getSettingsPrompt(userEmail, userName);
  }

  export function getResponseGenerationPrompt(
    context: Types.EmailContext,
    style: Types.WritingStyle,
    userProfile: Types.UserProfile,
    instructions?: string
  ): string {
    return getOverviewPrompt(context, style, userProfile, instructions);
  }

  export function getStyleAnalysisPrompt(userEmail: string): string {
    return getThreadPrompt(userEmail);
  }

  export function getStyleImprovementPrompt(
    currentProfile: Types.UserProfile,
    threadContent: string
  ): string {
    return getThreadPrompt(currentProfile.email, undefined, currentProfile, threadContent);
  }

  export function getThreadLearningPrompt(
    userEmail: string,
    threadMessages: string
  ): string {
    return getThreadPrompt(userEmail, threadMessages);
  }

  export function getInitialProfilePrompt(userName: string, userEmail: string): string {
    return getSettingsPrompt(userEmail, userName);
  }

  // Helper functions to build prompt variables
  
  function buildRecipientInfo(context: Types.EmailContext): string {
    const recipient = context.recipients?.[0] || context.to;
    const domain = recipient.split('@')[1];
    const senderDomain = (context.senderEmail || context.from).split('@')[1];
    
    let relationship = 'External contact';
    if (domain === senderDomain) {
      relationship = 'Colleague (same organization)';
    } else if (context.threadHistory && context.threadHistory.length > 2) {
      relationship = 'Ongoing conversation';
    }
    
    return `Recipient: ${recipient}\nRelationship: ${relationship}`;
  }

  function buildIdentitySummary(profile: Types.UserProfile): string {
    if (!profile.identity) {
      return `Email user: ${profile.email}`;
    }
    
    return `Role: ${profile.identity.role}
Expertise: ${profile.identity.expertise.join(', ')}
Communication Style: ${profile.identity.communicationStyle}`;
  }

  function buildStyleSummary(style: Types.WritingStyle): string {
    const formalityLabel = Constants.STYLE.FORMALITY_LABELS[style.formalityLevel - 1] || 'Neutral';
    
    return `Formality: ${formalityLabel}
Common Greetings: ${style.greetings.slice(0, 3).join(', ')}
Common Closings: ${style.closings.slice(0, 3).join(', ')}
Avg Sentence Length: ${style.averageSentenceLength} words
Email Length: ${style.emailLength}`;
  }

  function buildContextSummary(context: Types.EmailContext): string {
    const lastMessage = context.originalMessage || { body: context.body };
    const preview = lastMessage.body.substring(0, 500);
    
    return `Subject: ${context.subject}
From: ${context.senderName || context.from} <${context.senderEmail || context.from}>
Preview: ${preview}${lastMessage.body.length > 500 ? '...' : ''}`;
  }

  /**
   * Helper function to infer relationship type
   * (Still used by other modules)
   */
  export function inferRelationship(context: Types.EmailContext, userProfile: Types.UserProfile): string {
    const senderEmail = (context.senderEmail || context.from).toLowerCase();
    const senderDomain = Utils.extractDomain(senderEmail);
    const userDomain = Utils.extractDomain(userProfile.email);
    
    // Check previous interactions
    if (context.threadHistory && context.threadHistory.length > 5) {
      return 'Frequent correspondent';
    }
    
    // Same domain = colleague
    if (senderDomain === userDomain) {
      return 'Colleague';
    }
    
    // Check for client indicators
    const subject = context.subject.toLowerCase();
    if (subject.includes('proposal') || 
        subject.includes('contract') ||
        subject.includes('invoice')) {
      return 'Client';
    }
    
    return 'External contact';
  }

  /**
   * Helper function to determine formality level
   * (Still used by other modules)
   */
  export function inferFormalityLevel(context: Types.EmailContext, userProfile: Types.UserProfile): string {
    const relationship = inferRelationship(context, userProfile);
    
    switch (relationship) {
    case 'Colleague':
      return 'Casual to Neutral';
    case 'Client':
      return 'Professional';
    case 'Frequent correspondent':
      return 'Established pattern';
    default:
      return 'Neutral to Formal';
    }
  }
}