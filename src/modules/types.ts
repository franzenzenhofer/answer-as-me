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
    punctuationStyle: string;
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