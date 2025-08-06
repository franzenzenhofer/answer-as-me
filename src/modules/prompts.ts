/**
 * Prompts Module - DRY Implementation
 * 
 * ALL PROMPTS ARE FETCHED FROM GOOGLE DOCS
 * This module is just a thin wrapper around GoogleDocsPrompts
 * NO HARDCODED PROMPTS - Everything comes from Google Docs
 */

namespace Prompts {
  /**
   * Get assistant identity prompt
   * Fetched from ASSISTANT_IDENTITY Google Doc
   */
  export function getAssistantIdentityPrompt(userEmail: string, userName?: string): string {
    return GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.ASSISTANT_IDENTITY, {
      userEmail,
      userName: userName || userEmail
    });
  }

  /**
   * Get style analysis prompt
   * Fetched from STYLE_ANALYSIS Google Doc
   */
  export function getStyleAnalysisPrompt(userEmail: string): string {
    return GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.STYLE_ANALYSIS, {
      userEmail
    });
  }

  /**
   * Get response generation prompt
   * Fetched from RESPONSE_GENERATION Google Doc
   */
  export function getResponseGenerationPrompt(
    context: Types.EmailContext,
    style: Types.WritingStyle,
    userProfile: Types.UserProfile,
    instructions?: string
  ): string {
    // Build recipient info
    const recipientInfo = buildRecipientInfo(context);
    
    // Build identity summary
    const identity = buildIdentitySummary(userProfile);
    
    // Build style summary
    const styleSummary = buildStyleSummary(style);
    
    // Build context summary
    const contextSummary = buildContextSummary(context);
    
    return GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.RESPONSE_GENERATION, {
      context: contextSummary,
      identity,
      style: styleSummary,
      recipientInfo,
      instructions: instructions || 'None',
      userName: userProfile.name || userProfile.email
    });
  }

  /**
   * Get style improvement prompt
   * Fetched from STYLE_IMPROVEMENT Google Doc
   */
  export function getStyleImprovementPrompt(
    currentProfile: Types.UserProfile,
    threadContent: string
  ): string {
    const profileSummary = JSON.stringify(currentProfile, null, 2);
    
    return GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.STYLE_IMPROVEMENT, {
      userEmail: currentProfile.email,
      currentProfile: profileSummary,
      threadContent
    });
  }

  /**
   * Get thread learning prompt
   * Fetched from THREAD_LEARNING Google Doc
   */
  export function getThreadLearningPrompt(
    userEmail: string,
    threadMessages: string
  ): string {
    return GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.THREAD_LEARNING, {
      userEmail,
      threadMessages
    });
  }

  /**
   * Get error context prompt
   * Fetched from ERROR_CONTEXT Google Doc
   */
  export function getErrorContextPrompt(
    errorType: string,
    context: string
  ): string {
    return GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.ERROR_CONTEXT, {
      errorType,
      context
    });
  }

  /**
   * Get initial profile prompt
   * This one is also fetched from Google Docs
   */
  export function getInitialProfilePrompt(userName: string, userEmail: string): string {
    // This uses the ASSISTANT_IDENTITY doc with special instructions
    return GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.ASSISTANT_IDENTITY, {
      userName,
      userEmail,
      instructions: 'Create initial profile'
    });
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