namespace Types {
  /**
   * Configuration for the add-on
   */
  export interface Config {
    apiKey: string;
    responseMode: ResponseMode;
    autoReply: boolean;
    formalityLevel: number; // 1-5
    responseLength: ResponseLength;
    customInstructions: string;
    signature: string;
  }

  /**
   * Form input values from Google Apps Script
   */
  export interface FormInputs {
    [key: string]: string[] | undefined;
    apiKey?: string[];
    responseMode?: string[];
    autoReply?: string[];
    formalityLevel?: string[];
    responseLength?: string[];
    customInstructions?: string[];
    signature?: string[];
    editedResponse?: string[];
  }

  /**
   * Response generation modes
   */
  export enum ResponseMode {
    DRAFT = 'draft',
    SUGGEST = 'suggest',
    TEMPLATE = 'template',
    AUTO = 'auto'
  }

  /**
   * Response length preferences
   */
  export enum ResponseLength {
    SHORT = 'short',
    MEDIUM = 'medium',
    LONG = 'long'
  }

  /**
   * Email context for processing
   */
  export interface EmailContext {
    threadId: string;
    messageId: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    date: GoogleAppsScript.Base.Date;
    isReply: boolean;
    previousMessages?: EmailMessage[];
    senderEmail?: string;
    senderName?: string;
    recipients?: string[];
    threadHistory?: EmailMessage[];
    originalMessage?: EmailMessage;
  }

  /**
   * Individual email message
   */
  export interface EmailMessage {
    from: string;
    to: string;
    date: GoogleAppsScript.Base.Date;
    body: string;
  }

  /**
   * Writing style profile
   */
  export interface WritingStyle {
    greetings: string[];
    closings: string[];
    sentencePatterns: string[];
    vocabulary: string[];
    formalityLevel: number;
    averageSentenceLength: number;
    emailLength: string;
    punctuationStyle: string;
  }

  /**
   * User profile for AI assistant
   */
  export interface UserProfile {
    email: string;
    name?: string;
    identity?: {
      role: string;
      expertise: string[];
      communicationStyle: string;
    };
    personality?: {
      formality: number;
      directness: number;
      warmth: number;
      detailLevel: number;
    };
    patterns?: {
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
    vocabulary?: {
      common: string[];
      avoided: string[];
      professional: string[];
    };
    rules?: string[];
  }

  /**
   * AI response from Gemini
   */
  export interface AIResponse {
    success: boolean;
    response?: string;
    error?: string;
    confidence?: number;
  }

  /**
   * Form input data
   */
  export interface FormData {
    apiKey?: string[];
    responseMode?: string[];
    autoReply?: string[];
    formalityLevel?: string[];
    responseLength?: string[];
    customInstructions?: string[];
    signature?: string[];
  }
  
  /**
   * Extended EventObject with form inputs
   */
  export interface ExtendedEventObject extends GoogleAppsScript.Addons.EventObject {
    formInputs?: FormData;
    parameters?: { [key: string]: string };
  }

  /**
   * Processing result
   */
  export interface ProcessingResult {
    success: boolean;
    message: string;
    responseText?: string;
    draftId?: string;
    error?: string;
  }
}