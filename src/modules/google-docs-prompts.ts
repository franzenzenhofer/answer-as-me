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
   * Get or create a prompt document for a specific type - ALWAYS CREATES IMMEDIATELY
   */
  export function getOrCreatePromptDocument(promptType: string): string {
    const startTime = Date.now();
    DebugLogger.logLogic('getOrCreatePromptDocument', 'START', { promptType });
    
    // Validate prompt type to prevent injection
    if (!promptType || typeof promptType !== 'string' || promptType.length > 50) {
      const error = 'Invalid prompt type';
      DebugLogger.logError('GoogleDocsPrompts', error, { promptType });
      throw new Error(error);
    }
    
    // Only allow known prompt types 
    const knownTypes = Object.values(Constants.PROMPTS.TYPES);
    if (!knownTypes.includes(promptType)) {
      const error = 'Invalid prompt type format';
      DebugLogger.logError('GoogleDocsPrompts', error, { promptType, knownTypes });
      throw new Error(error);
    }
    
    const docIdKey = `${Constants.PROMPTS.DOC_ID_PREFIX}${promptType}`;
    let docId = PropertyManager.getProperty(docIdKey, 'user');
    let created = false;

    // ALWAYS CREATE IF DOESN'T EXIST - NO DELAYS!
    if (!docId) {
      try {
        DebugLogger.info('GoogleDocsPrompts', `Creating new prompt document for ${promptType}`);
        
        // Create new document with sanitized title
        const docName = Constants.PROMPTS.DOC_NAMES[promptType] || promptType;
        const sanitizedDocName = docName
          .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
          .substring(0, 100); // Limit length
        
        if (!sanitizedDocName.trim()) {
          throw new Error('Invalid prompt type name');
        }
        
        const title = `${Constants.PROMPTS.DOC_TITLE_PREFIX} ${sanitizedDocName}`;
        DebugLogger.debug('GoogleDocsPrompts', `Creating doc with title: ${title}`);
        
        const doc = DocumentApp.create(title);
        docId = doc.getId();
        created = true;
        
        // Set initial content from template
        const body = doc.getBody();
        const template = getPromptTemplate(promptType);
        body.setText(template);
        
        // Style the document
        styleDocument(body);
        
        // Save document ID with thread safety
        PropertyManager.setProperty(docIdKey, docId, 'user');
        
        // Make it accessible to user
        const file = DriveApp.getFileById(docId);
        file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.EDIT);
        
        // Move to a dedicated folder
        createPromptsFolderIfNeeded(file);
        
        const duration = Date.now() - startTime;
        DebugLogger.logLogic('getOrCreatePromptDocument', 'CREATED', 
          { promptType, docId, title }, 
          { docId, created: true },
          'Successfully created new prompt document',
          duration
        );
        
        AppLogger.info('Created prompt document', { promptType, docId, title });
      } catch (error) {
        const duration = Date.now() - startTime;
        DebugLogger.logError('GoogleDocsPrompts', error instanceof Error ? error : String(error), { promptType }, 'Failed to create prompt document - user cannot customize prompts');
        DebugLogger.logLogic('getOrCreatePromptDocument', 'ERROR', { promptType }, null, 'Failed to create document', duration);
        AppLogger.error('Failed to create prompt document', { promptType, error });
        throw new Error(`${Constants.ERRORS.PROMPT_DOC_CREATE_FAILED}: ${promptType}`);
      }
    } else {
      // Document exists - verify it's still accessible
      try {
        const doc = DocumentApp.openById(docId);
        const title = doc.getName();
        DebugLogger.debug('GoogleDocsPrompts', `Using existing document: ${title}`, { docId });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Document exists in properties but is inaccessible - recreate it
        DebugLogger.warn('GoogleDocsPrompts', 'Existing document inaccessible, recreating', { docId, promptType });
        PropertyManager.deleteProperty(docIdKey, 'user');
        return getOrCreatePromptDocument(promptType); // Recursive call to create new one
      }
    }

    const duration = Date.now() - startTime;
    DebugLogger.logLogic('getOrCreatePromptDocument', 'COMPLETE', 
      { promptType }, 
      { docId, created },
      created ? 'Created new document' : 'Using existing document',
      duration
    );

    return docId;
  }

  /**
   * Create ALL prompt documents immediately - KISS approach
   */
  export function createAllPromptDocuments(): { [key: string]: string } {
    DebugLogger.logLogic('createAllPromptDocuments', 'START', null);
    const startTime = Date.now();
    const results: { [key: string]: string } = {};
    
    // Create all 3 prompt types immediately
    const promptTypes = Object.values(Constants.PROMPTS.TYPES);
    
    for (const promptType of promptTypes) {
      try {
        DebugLogger.info('GoogleDocsPrompts', `Creating prompt document: ${promptType}`);
        const docId = getOrCreatePromptDocument(promptType);
        results[promptType] = docId;
        DebugLogger.debug('GoogleDocsPrompts', `Created ${promptType} document`, { docId });
      } catch (error) {
        DebugLogger.logError('GoogleDocsPrompts', error instanceof Error ? error : String(error), { promptType }, `Failed to create ${promptType} document`);
        results[promptType] = '';
      }
    }
    
    const duration = Date.now() - startTime;
    const successCount = Object.values(results).filter(id => id).length;
    
    DebugLogger.logLogic('createAllPromptDocuments', 'COMPLETE', 
      { promptTypes }, 
      results,
      `Created ${successCount}/${promptTypes.length} prompt documents`,
      duration
    );
    
    return results;
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

      // Store version for comparison with thread safety
      const versionKey = `${Constants.PROMPTS.VERSION_PREFIX}${promptType}`;
      PropertyManager.setProperty(versionKey, version, 'user');

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
    const properties = PropertyManager.getAllProperties('user');
    
    for (const typeName of Object.values(Constants.PROMPTS.TYPES)) {
      const docIdKey = `${Constants.PROMPTS.DOC_ID_PREFIX}${typeName}`;
      const versionKey = `${Constants.PROMPTS.VERSION_PREFIX}${typeName}`;
      const docId = properties[docIdKey];
      
      const status: PromptStatus = {
        type: typeName,
        hasDoc: !!docId,
        docId: docId || null,
        version: properties[versionKey] || Constants.PROMPTS.DEFAULT_VERSION,
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
    // Always force refresh to ensure we use the latest document content
    const doc = fetchPrompt(promptType, true);
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
      SETTINGS: `${header}You are the personal email assistant for {{userName}} ({{userEmail}}).

YOUR IDENTITY & SETTINGS:
- You work exclusively for {{userName}} ({{userEmail}})
- You know their communication style from analyzing their emails
- You draft responses as if you were them, not as an AI
- You understand their role, relationships, and communication patterns
- You maintain their professional reputation in every response

KEY INSTRUCTIONS:
- Write in first person as {{userName}}
- Never reveal you are an AI assistant
- Adapt tone based on recipient and context
- Use their typical vocabulary and expressions
- Mirror their level of formality/informality

CUSTOM SETTINGS:
You can customize these settings below:
- Default formality level
- Typical greetings and closings
- Professional role and expertise
- Special instructions for all emails
- Email signature preferences

Edit this document to customize the assistant's behavior and identity.`,

      OVERVIEW: `${header}Generate an email response based on the following context:

**EMAIL CONTEXT:**
{{context}}

**YOUR IDENTITY:**
{{identity}}

**WRITING STYLE:**
{{style}}

**RECIPIENT RELATIONSHIP:**
{{recipientInfo}}

**SPECIAL INSTRUCTIONS:**
{{instructions}}

RESPONSE REQUIREMENTS:
1. Write as {{userName}}, not about them
2. Match their typical tone for this recipient type
3. Use appropriate greeting and closing from their patterns
4. Maintain their vocabulary and expression style
5. Keep consistent with their email length preferences
6. Apply any special instructions provided
7. Generate a complete email response ready to send

CUSTOMIZATION:
You can edit this document to change how responses are generated:
- Add specific response templates
- Modify the tone and style guidelines
- Include industry-specific language preferences
- Add context-specific instructions`,

      THREAD: `${header}Analyze email threads and learn communication patterns for {{userEmail}}.

**CURRENT ANALYSIS CONTEXT:**
{{threadContent}}

**USER PROFILE:**
{{currentProfile}}

**THREAD MESSAGES:**
{{threadMessages}}

ANALYSIS TASKS:
1. **Style Analysis**: Extract greetings, closings, tone patterns
2. **Relationship Dynamics**: Understand communication with different recipients
3. **Vocabulary Patterns**: Common phrases and expressions used
4. **Context Adaptation**: How style changes based on situation
5. **Learning Integration**: Update understanding based on new examples

LEARNING OUTPUTS:
- Communication patterns specific to this context
- Vocabulary or phrases not previously captured
- Tone adaptations for this recipient/situation
- Unique stylistic elements to remember

CUSTOMIZATION:
Edit this document to control how the assistant learns from your emails:
- Focus areas for style analysis
- Specific patterns to watch for
- Recipients to treat differently
- Context-specific learning rules`
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
      const cached = PropertyManager.getProperty(cacheKey, 'user');
      if (!cached) {
        return null;
      }
      
      const data = JSON.parse(cached);
      // Validate cache structure
      if (!data.document || !data.cachedAt) {
        AppLogger.warn('Invalid cache structure', { promptType });
        return null;
      }
      
      return {
        document: data.document,
        cachedAt: new Date(data.cachedAt)
      };
    } catch (error) {
      AppLogger.warn('Failed to parse cached prompt', { promptType, error });
      // Clear corrupted cache
      try {
        const cacheKey = `${Constants.PROMPTS.CACHE_PREFIX}${promptType}`;
        PropertyManager.deleteProperty(cacheKey, 'user');
      } catch {}
      return null;
    }
  }

  function updateCache(promptType: string, document: PromptDocument): void {
    try {
      const cacheKey = `${Constants.PROMPTS.CACHE_PREFIX}${promptType}`;
      const data = {
        document,
        cachedAt: new Date(),
        cacheVersion: Utilities.getUuid() // Add cache version for invalidation tracking
      };
      PropertyManager.setProperty(cacheKey, JSON.stringify(data), 'user');
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
    
    const lastCheckKey = Constants.PROPERTIES.PROMPTS_LAST_CHECK;
    const lastCheck = PropertyManager.getProperty(lastCheckKey, 'user');
    
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
    
    PropertyManager.setProperty(lastCheckKey, Date.now().toString(), 'user');
  }
}