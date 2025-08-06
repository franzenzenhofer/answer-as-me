/**
 * Google Docs Prompts System
 * 
 * HARDCORE DRY PRINCIPLE:
 * - Each prompt type has its own Google Doc
 * - Google Docs are the SINGLE SOURCE OF TRUTH
 * - No hardcoded prompts in the codebase
 * - Docs persist after factory reset
 * - Complete decoupling from application code
 */

namespace GoogleDocsPrompts {
  export interface PromptDocument {
    id: string;
    type: string;
    version: string;
    lastModified: GoogleAppsScript.Base.Date;
    content: string;
    url: string;
  }

  export interface PromptCache {
    [promptType: string]: {
      document: PromptDocument;
      cachedAt: GoogleAppsScript.Base.Date;
    };
  }

  export interface PromptStatus {
    type: string;
    hasDoc: boolean;
    docId: string | null;
    version: string;
    lastChecked: GoogleAppsScript.Base.Date;
    hasUpdate: boolean;
    url: string | null;
  }

  /**
   * Get or create a prompt document for a specific type
   */
  export function getOrCreatePromptDocument(promptType: string): string {
    const properties = PropertiesService.getUserProperties();
    const docIdKey = `${Constants.PROMPTS.DOC_ID_PREFIX}${promptType}`;
    let docId = properties.getProperty(docIdKey);

    if (!docId) {
      try {
        // Create new document with proper title
        const docName = Constants.PROMPTS.DOC_NAMES[promptType] || promptType;
        const title = `${Constants.PROMPTS.DOC_TITLE_PREFIX} ${docName}`;
        const doc = DocumentApp.create(title);
        docId = doc.getId();
        
        // Set initial content from template
        const body = doc.getBody();
        const template = getPromptTemplate(promptType);
        body.setText(template);
        
        // Style the document
        styleDocument(body);
        
        // Save document ID
        properties.setProperty(docIdKey, docId);
        
        // Make it accessible to user
        const file = DriveApp.getFileById(docId);
        file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.EDIT);
        
        // Move to a dedicated folder
        createPromptsFolderIfNeeded(file);
        
        AppLogger.info('Created prompt document', { promptType, docId, title });
      } catch (error) {
        AppLogger.error('Failed to create prompt document', { promptType, error });
        throw new Error(`${Constants.ERRORS.PROMPT_DOC_CREATE_FAILED}: ${promptType}`);
      }
    }

    return docId;
  }

  /**
   * Create and organize prompts folder
   */
  function createPromptsFolderIfNeeded(file: GoogleAppsScript.Drive.File): void {
    try {
      const folderName = 'Answer As Me - Prompt Documents';
      const folders = DriveApp.getFoldersByName(folderName);
      
      let folder: GoogleAppsScript.Drive.Folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
        folder.setDescription('Editable prompt templates for Answer As Me Gmail add-on');
      }
      
      folder.addFile(file);
      // Remove from root if possible
      try {
        DriveApp.getRootFolder().removeFile(file);
      } catch {
        // Ignore if can't remove from root
      }
    } catch (error) {
      AppLogger.error('Failed to organize prompt folder', error);
    }
  }

  /**
   * Fetch a specific prompt from its document
   */
  export function fetchPrompt(promptType: string, forceRefresh = false): PromptDocument {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = getCachedPrompt(promptType);
        if (cached && isCacheValid(cached.cachedAt)) {
          AppLogger.info('Using cached prompt', { promptType, version: cached.document.version });
          return cached.document;
        }
      }

      // Get or create document
      const docId = getOrCreatePromptDocument(promptType);
      const doc = DocumentApp.openById(docId);
      const content = doc.getBody().getText();
      const file = DriveApp.getFileById(docId);
      const lastModified = file.getLastUpdated();
      const url = doc.getUrl();

      // Extract version
      const version = extractVersion(content) || Constants.PROMPTS.DEFAULT_VERSION;

      const document: PromptDocument = {
        id: docId,
        type: promptType,
        version,
        lastModified,
        content: cleanPromptContent(content),
        url
      };

      // Update cache
      updateCache(promptType, document);

      // Store version for comparison
      const versionKey = `${Constants.PROMPTS.VERSION_PREFIX}${promptType}`;
      PropertiesService.getUserProperties().setProperty(versionKey, version);

      AppLogger.info('Fetched prompt from document', { promptType, version });
      return document;
    } catch (error) {
      AppLogger.error('Failed to fetch prompt', { promptType, error });
      
      // Return minimal fallback
      return getMinimalFallback(promptType);
    }
  }

  /**
   * Get all prompt statuses
   */
  export function getAllPromptStatuses(): PromptStatus[] {
    const statuses: PromptStatus[] = [];
    const properties = PropertiesService.getUserProperties();
    
    for (const typeName of Object.values(Constants.PROMPTS.TYPES)) {
      const docIdKey = `${Constants.PROMPTS.DOC_ID_PREFIX}${typeName}`;
      const versionKey = `${Constants.PROMPTS.VERSION_PREFIX}${typeName}`;
      const docId = properties.getProperty(docIdKey);
      
      const status: PromptStatus = {
        type: typeName,
        hasDoc: !!docId,
        docId: docId,
        version: properties.getProperty(versionKey) || Constants.PROMPTS.DEFAULT_VERSION,
        lastChecked: new Date() as GoogleAppsScript.Base.Date,
        hasUpdate: false,
        url: null
      };
      
      if (docId) {
        try {
          const doc = DocumentApp.openById(docId);
          status.url = doc.getUrl();
          
          // Check for updates
          const file = DriveApp.getFileById(docId);
          const cached = getCachedPrompt(typeName);
          if (cached && file.getLastUpdated() > cached.cachedAt) {
            status.hasUpdate = true;
          }
        } catch (error) {
          AppLogger.error('Error checking prompt status', { type: typeName, error });
        }
      }
      
      statuses.push(status);
    }
    
    return statuses;
  }

  /**
   * Update all prompts that have changes
   */
  export function updateAllPrompts(): { updated: string[]; failed: string[] } {
    const result = { updated: [] as string[], failed: [] as string[] };
    
    for (const typeName of Object.values(Constants.PROMPTS.TYPES)) {
      try {
        fetchPrompt(typeName, true);
        result.updated.push(typeName);
      } catch (error) {
        result.failed.push(typeName);
        AppLogger.error('Failed to update prompt', { type: typeName, error });
      }
    }
    
    return result;
  }

  /**
   * Get prompt with variable substitution
   */
  export function getPrompt(
    promptType: string,
    variables: { [key: string]: string } = {}
  ): string {
    const doc = fetchPrompt(promptType);
    let content = doc.content;
    
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }
    
    return content;
  }

  /**
   * Clean prompt content (remove metadata sections)
   */
  function cleanPromptContent(content: string): string {
    // Remove version header and metadata
    return content
      .replace(/^## Version:.*$/m, '')
      .replace(/^## Last Updated:.*$/m, '')
      .replace(/^## Description:.*$/m, '')
      .replace(/^---+$/gm, '')
      .trim();
  }

  /**
   * Extract version from document
   */
  function extractVersion(content: string): string | null {
    const match = content.match(/^## Version:\s*(.+)$/m);
    return match && match[1] ? match[1].trim() : null;
  }

  /**
   * Style the document
   */
  function styleDocument(body: GoogleAppsScript.Document.Body): void {
    const style: {[key: string]: any} = {};
    style[DocumentApp.Attribute.FONT_FAMILY as unknown as string] = 'Arial';
    style[DocumentApp.Attribute.FONT_SIZE as unknown as string] = 11;
    style[DocumentApp.Attribute.LINE_SPACING as unknown as string] = 1.5;
    body.setAttributes(style);
  }

  /**
   * Get template for a prompt type
   */
  function getPromptTemplate(promptType: string): string {
    const header = `## Version: ${Constants.PROMPTS.DEFAULT_VERSION}
## Last Updated: ${new Date().toISOString()}
## Description: ${Constants.PROMPTS.DOC_NAMES[promptType] || promptType} Prompt Template

---

`;

    const templates: { [key: string]: string } = {
      ASSISTANT_IDENTITY: `${header}You are the personal email assistant for {{userName}} ({{userEmail}}).

YOUR IDENTITY:
- You work exclusively for {{userName}} ({{userEmail}})
- You know their communication style intimately from analyzing their emails
- You draft responses as if you were them, not as an AI
- You understand their role, relationships, and communication patterns
- You maintain their professional reputation in every response

YOUR CAPABILITIES:
- You have analyzed their sent emails to understand their style
- You adapt tone based on recipient and context
- You use their typical vocabulary and expressions
- You mirror their level of formality/informality

IMPORTANT:
- Write in first person as {{userName}}
- Never reveal you are an AI assistant
- Maintain consistency with their established communication patterns`,

      STYLE_ANALYSIS: `${header}Analyze the provided sent emails to extract writing style and communication patterns for {{userEmail}}.

Focus on:
1. **Greetings**: How emails typically start
   - To colleagues (same domain)
   - To clients/external contacts
   - To casual contacts

2. **Closings**: How emails typically end
   - Professional contexts
   - Casual contexts
   - Client communications

3. **Tone and Formality**:
   - Overall formality level (1-5 scale)
   - Directness vs. diplomatic approach
   - Use of humor or warmth
   - Technical vs. conversational language

4. **Vocabulary**:
   - Common phrases and expressions
   - Professional jargon used
   - Words/phrases to avoid

5. **Structure**:
   - Email length preferences
   - Paragraph structure
   - Use of bullets or numbering

Extract specific examples and patterns, not general observations.`,

      RESPONSE_GENERATION: `${header}Generate an email response based on the following context:

**CONTEXT:**
{{context}}

**YOUR IDENTITY:**
{{identity}}

**WRITING STYLE:**
{{style}}

**RELATIONSHIP:**
{{recipientInfo}}

**SPECIAL INSTRUCTIONS:**
{{instructions}}

REQUIREMENTS:
1. Write as {{userName}}, not about them
2. Match their typical tone for this recipient type
3. Use appropriate greeting and closing from their patterns
4. Maintain their vocabulary and expression style
5. Keep consistent with their email length preferences
6. Apply any special instructions provided

Generate a complete email response ready to send.`,

      STYLE_IMPROVEMENT: `${header}Analyze this email thread to improve understanding of {{userEmail}}'s communication style.

**CURRENT PROFILE:**
{{currentProfile}}

**THREAD CONTENT:**
{{threadContent}}

Extract new insights about:
1. Communication patterns specific to this context
2. Vocabulary or phrases not previously captured
3. Tone adaptations for this recipient/situation
4. Any unique stylistic elements

Merge these insights with the existing profile to create an improved understanding.`,

      THREAD_LEARNING: `${header}Learn from this specific email thread to enhance the assistant's understanding.

**USER EMAIL:** {{userEmail}}
**THREAD MESSAGES:** {{threadMessages}}

Analyze:
1. Relationship dynamics in this thread
2. Topic-specific vocabulary used
3. Tone progression through the conversation
4. Any unique patterns or preferences shown

Update the user profile with these specific learnings.`,

      ERROR_CONTEXT: `${header}The email draft generation encountered an issue. Please try again with this context:

**ERROR:** {{errorType}}
**CONTEXT:** {{context}}
**INSTRUCTION:** Generate a helpful response that acknowledges the limitation while still providing value.`
    };

    return templates[promptType] || `${header}[Template for ${promptType} - Please customize this prompt]`;
  }

  /**
   * Get minimal fallback for a prompt type
   */
  function getMinimalFallback(promptType: string): PromptDocument {
    AppLogger.warn(Constants.PROMPTS.FALLBACK_WARNING, { promptType });
    
    const fallbacks: { [key: string]: string } = {
      ASSISTANT_IDENTITY: 'You are an email assistant. Help draft responses.',
      STYLE_ANALYSIS: 'Analyze the writing style of the provided emails.',
      RESPONSE_GENERATION: 'Generate an email response based on the context: {{context}}',
      STYLE_IMPROVEMENT: 'Improve the writing style based on the thread.',
      THREAD_LEARNING: 'Learn from the email thread.',
      ERROR_CONTEXT: 'An error occurred. Please try again.'
    };

    return {
      id: 'fallback',
      type: promptType,
      version: 'fallback',
      lastModified: new Date(),
      content: fallbacks[promptType] || 'Fallback prompt',
      url: ''
    };
  }

  /**
   * Cache management
   */
  function getCachedPrompt(
    promptType: string
  ): { document: PromptDocument; cachedAt: GoogleAppsScript.Base.Date } | null {
    try {
      const cacheKey = `${Constants.PROMPTS.CACHE_PREFIX}${promptType}`;
      const cached = PropertiesService.getUserProperties().getProperty(cacheKey);
      if (!cached) {
        return null;
      }
      
      const data = JSON.parse(cached);
      return {
        document: data.document,
        cachedAt: new Date(data.cachedAt)
      };
    } catch {
      return null;
    }
  }

  function updateCache(promptType: string, document: PromptDocument): void {
    try {
      const cacheKey = `${Constants.PROMPTS.CACHE_PREFIX}${promptType}`;
      const data = {
        document,
        cachedAt: new Date()
      };
      PropertiesService.getUserProperties().setProperty(cacheKey, JSON.stringify(data));
    } catch (error) {
      AppLogger.error('Failed to update prompt cache', { promptType, error });
    }
  }

  function isCacheValid(cachedAt: GoogleAppsScript.Base.Date): boolean {
    const age = Date.now() - (cachedAt as any).getTime();
    return age < Constants.TIMING.PROMPT_CACHE_TTL;
  }

  /**
   * Check for automatic updates
   */
  export function checkForAutomaticUpdates(): void {
    if (!Constants.PROMPTS.AUTO_CHECK_ENABLED) {
      return;
    }
    
    const properties = PropertiesService.getUserProperties();
    const lastCheckKey = Constants.PROPERTIES.PROMPTS_LAST_CHECK;
    const lastCheck = properties.getProperty(lastCheckKey);
    
    if (lastCheck) {
      const timeSinceCheck = Date.now() - parseInt(lastCheck);
      if (timeSinceCheck < Constants.TIMING.PROMPT_UPDATE_CHECK_INTERVAL) {
        return;
      }
    }
    
    // Check all prompts for updates
    const statuses = getAllPromptStatuses();
    const hasUpdates = statuses.some(s => s.hasUpdate);
    
    if (hasUpdates) {
      AppLogger.info('Prompt updates available', { 
        types: statuses.filter(s => s.hasUpdate).map(s => s.type) 
      });
    }
    
    properties.setProperty(lastCheckKey, Date.now().toString());
  }
}