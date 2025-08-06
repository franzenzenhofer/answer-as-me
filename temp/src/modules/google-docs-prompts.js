"use strict";
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var GoogleDocsPrompts;
(function (GoogleDocsPrompts) {
    /**
     * Get or create a prompt document for a specific type - ALWAYS CREATES IMMEDIATELY
     */
    function getOrCreatePromptDocument(promptType) {
        var startTime = Date.now();
        DebugLogger.logLogic('getOrCreatePromptDocument', 'START', { promptType: promptType });
        // Validate prompt type to prevent injection
        if (!promptType || typeof promptType !== 'string' || promptType.length > 50) {
            var error = 'Invalid prompt type';
            DebugLogger.logError('GoogleDocsPrompts', error, { promptType: promptType });
            throw new Error(error);
        }
        // Only allow known prompt types 
        var knownTypes = Object.values(Constants.PROMPTS.TYPES);
        if (!knownTypes.includes(promptType)) {
            var error = 'Invalid prompt type format';
            DebugLogger.logError('GoogleDocsPrompts', error, { promptType: promptType, knownTypes: knownTypes });
            throw new Error(error);
        }
        var docIdKey = "".concat(Constants.PROMPTS.DOC_ID_PREFIX).concat(promptType);
        var docId = PropertyManager.getProperty(docIdKey, 'user');
        var created = false;
        // ALWAYS CREATE IF DOESN'T EXIST - NO DELAYS!
        if (!docId) {
            try {
                DebugLogger.info('GoogleDocsPrompts', "Creating new prompt document for ".concat(promptType));
                // Create new document with sanitized title
                var docName = Constants.PROMPTS.DOC_NAMES[promptType] || promptType;
                var sanitizedDocName = docName
                    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
                    .substring(0, 100); // Limit length
                if (!sanitizedDocName.trim()) {
                    throw new Error('Invalid prompt type name');
                }
                var title = "".concat(Constants.PROMPTS.DOC_TITLE_PREFIX, " ").concat(sanitizedDocName);
                DebugLogger.debug('GoogleDocsPrompts', "Creating doc with title: ".concat(title));
                var doc = DocumentApp.create(title);
                docId = doc.getId();
                created = true;
                // Set initial content from template
                var body = doc.getBody();
                var template = getPromptTemplate(promptType);
                body.setText(template);
                // Style the document
                styleDocument(body);
                // Save document ID with thread safety
                PropertyManager.setProperty(docIdKey, docId, 'user');
                // Make it accessible to user
                var file = DriveApp.getFileById(docId);
                file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.EDIT);
                // Move to a dedicated folder
                createPromptsFolderIfNeeded(file);
                var duration_1 = Date.now() - startTime;
                DebugLogger.logLogic('getOrCreatePromptDocument', 'CREATED', { promptType: promptType, docId: docId, title: title }, { docId: docId, created: true }, 'Successfully created new prompt document', duration_1);
                AppLogger.info('Created prompt document', { promptType: promptType, docId: docId, title: title });
            }
            catch (error) {
                var duration_2 = Date.now() - startTime;
                DebugLogger.logError('GoogleDocsPrompts', error instanceof Error ? error : String(error), { promptType: promptType }, 'Failed to create prompt document - user cannot customize prompts');
                DebugLogger.logLogic('getOrCreatePromptDocument', 'ERROR', { promptType: promptType }, null, 'Failed to create document', duration_2);
                AppLogger.error('Failed to create prompt document', { promptType: promptType, error: error });
                throw new Error("".concat(Constants.ERRORS.PROMPT_DOC_CREATE_FAILED, ": ").concat(promptType));
            }
        }
        else {
            // Document exists - verify it's still accessible
            try {
                var doc = DocumentApp.openById(docId);
                var title = doc.getName();
                DebugLogger.debug('GoogleDocsPrompts', "Using existing document: ".concat(title), { docId: docId });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }
            catch (_error) {
                // Document exists in properties but is inaccessible - recreate it
                DebugLogger.warn('GoogleDocsPrompts', 'Existing document inaccessible, recreating', { docId: docId, promptType: promptType });
                PropertyManager.deleteProperty(docIdKey, 'user');
                return getOrCreatePromptDocument(promptType); // Recursive call to create new one
            }
        }
        var duration = Date.now() - startTime;
        DebugLogger.logLogic('getOrCreatePromptDocument', 'COMPLETE', { promptType: promptType }, { docId: docId, created: created }, created ? 'Created new document' : 'Using existing document', duration);
        return docId;
    }
    GoogleDocsPrompts.getOrCreatePromptDocument = getOrCreatePromptDocument;
    /**
     * Create ALL prompt documents immediately - KISS approach
     */
    function createAllPromptDocuments() {
        var e_1, _a;
        DebugLogger.logLogic('createAllPromptDocuments', 'START', null);
        var startTime = Date.now();
        var results = {};
        // Create all 3 prompt types immediately
        var promptTypes = Object.values(Constants.PROMPTS.TYPES);
        try {
            for (var promptTypes_1 = __values(promptTypes), promptTypes_1_1 = promptTypes_1.next(); !promptTypes_1_1.done; promptTypes_1_1 = promptTypes_1.next()) {
                var promptType = promptTypes_1_1.value;
                try {
                    DebugLogger.info('GoogleDocsPrompts', "Creating prompt document: ".concat(promptType));
                    var docId = getOrCreatePromptDocument(promptType);
                    results[promptType] = docId;
                    DebugLogger.debug('GoogleDocsPrompts', "Created ".concat(promptType, " document"), { docId: docId });
                }
                catch (error) {
                    DebugLogger.logError('GoogleDocsPrompts', error instanceof Error ? error : String(error), { promptType: promptType }, "Failed to create ".concat(promptType, " document"));
                    results[promptType] = '';
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (promptTypes_1_1 && !promptTypes_1_1.done && (_a = promptTypes_1.return)) _a.call(promptTypes_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var duration = Date.now() - startTime;
        var successCount = Object.values(results).filter(function (id) { return id; }).length;
        DebugLogger.logLogic('createAllPromptDocuments', 'COMPLETE', { promptTypes: promptTypes }, results, "Created ".concat(successCount, "/").concat(promptTypes.length, " prompt documents"), duration);
        return results;
    }
    GoogleDocsPrompts.createAllPromptDocuments = createAllPromptDocuments;
    /**
     * Create and organize prompts folder
     */
    function createPromptsFolderIfNeeded(file) {
        try {
            var folderName = 'Answer As Me - Prompt Documents';
            var folders = DriveApp.getFoldersByName(folderName);
            var folder = void 0;
            if (folders.hasNext()) {
                folder = folders.next();
            }
            else {
                folder = DriveApp.createFolder(folderName);
                folder.setDescription('Editable prompt templates for Answer As Me Gmail add-on');
            }
            folder.addFile(file);
            // Remove from root if possible
            try {
                DriveApp.getRootFolder().removeFile(file);
            }
            catch (_a) {
                // Ignore if can't remove from root
            }
        }
        catch (error) {
            AppLogger.error('Failed to organize prompt folder', error);
        }
    }
    /**
     * Fetch a specific prompt from its document
     */
    function fetchPrompt(promptType, forceRefresh) {
        if (forceRefresh === void 0) { forceRefresh = false; }
        try {
            // Check cache first
            if (!forceRefresh) {
                var cached = getCachedPrompt(promptType);
                if (cached && isCacheValid(cached.cachedAt)) {
                    AppLogger.info('Using cached prompt', { promptType: promptType, version: cached.document.version });
                    return cached.document;
                }
            }
            // Get or create document
            var docId = getOrCreatePromptDocument(promptType);
            var doc = DocumentApp.openById(docId);
            var content = doc.getBody().getText();
            var file = DriveApp.getFileById(docId);
            var lastModified = file.getLastUpdated();
            var url = doc.getUrl();
            // Extract version
            var version = extractVersion(content) || Constants.PROMPTS.DEFAULT_VERSION;
            var document = {
                id: docId,
                type: promptType,
                version: version,
                lastModified: lastModified,
                content: cleanPromptContent(content),
                url: url
            };
            // Update cache
            updateCache(promptType, document);
            // Store version for comparison with thread safety
            var versionKey = "".concat(Constants.PROMPTS.VERSION_PREFIX).concat(promptType);
            PropertyManager.setProperty(versionKey, version, 'user');
            AppLogger.info('Fetched prompt from document', { promptType: promptType, version: version });
            return document;
        }
        catch (error) {
            AppLogger.error('Failed to fetch prompt', { promptType: promptType, error: error });
            // Return minimal fallback
            return getMinimalFallback(promptType);
        }
    }
    GoogleDocsPrompts.fetchPrompt = fetchPrompt;
    /**
     * Get all prompt statuses
     */
    function getAllPromptStatuses() {
        var e_2, _a;
        var statuses = [];
        var properties = PropertyManager.getAllProperties('user');
        try {
            for (var _b = __values(Object.values(Constants.PROMPTS.TYPES)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var typeName = _c.value;
                var docIdKey = "".concat(Constants.PROMPTS.DOC_ID_PREFIX).concat(typeName);
                var versionKey = "".concat(Constants.PROMPTS.VERSION_PREFIX).concat(typeName);
                var docId = properties[docIdKey];
                var status = {
                    type: typeName,
                    hasDoc: !!docId,
                    docId: docId || null,
                    version: properties[versionKey] || Constants.PROMPTS.DEFAULT_VERSION,
                    lastChecked: new Date(),
                    hasUpdate: false,
                    url: null
                };
                if (docId) {
                    try {
                        var doc = DocumentApp.openById(docId);
                        status.url = doc.getUrl();
                        // Check for updates
                        var file = DriveApp.getFileById(docId);
                        var cached = getCachedPrompt(typeName);
                        if (cached && file.getLastUpdated() > cached.cachedAt) {
                            status.hasUpdate = true;
                        }
                    }
                    catch (error) {
                        AppLogger.error('Error checking prompt status', { type: typeName, error: error });
                    }
                }
                statuses.push(status);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return statuses;
    }
    GoogleDocsPrompts.getAllPromptStatuses = getAllPromptStatuses;
    /**
     * Update all prompts that have changes
     */
    function updateAllPrompts() {
        var e_3, _a;
        var result = { updated: [], failed: [] };
        try {
            for (var _b = __values(Object.values(Constants.PROMPTS.TYPES)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var typeName = _c.value;
                try {
                    fetchPrompt(typeName, true);
                    result.updated.push(typeName);
                }
                catch (error) {
                    result.failed.push(typeName);
                    AppLogger.error('Failed to update prompt', { type: typeName, error: error });
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return result;
    }
    GoogleDocsPrompts.updateAllPrompts = updateAllPrompts;
    /**
     * Get prompt with variable substitution
     */
    function getPrompt(promptType, variables) {
        var e_4, _a;
        if (variables === void 0) { variables = {}; }
        // Always force refresh to ensure we use the latest document content
        var doc = fetchPrompt(promptType, true);
        var content = doc.content;
        try {
            // Replace variables
            for (var _b = __values(Object.entries(variables)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                var regex = new RegExp("{{".concat(key, "}}"), 'g');
                content = content.replace(regex, value);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return content;
    }
    GoogleDocsPrompts.getPrompt = getPrompt;
    /**
     * Clean prompt content (remove metadata sections)
     */
    function cleanPromptContent(content) {
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
    function extractVersion(content) {
        var match = content.match(/^## Version:\s*(.+)$/m);
        return match && match[1] ? match[1].trim() : null;
    }
    /**
     * Style the document
     */
    function styleDocument(body) {
        var style = {};
        style[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
        style[DocumentApp.Attribute.FONT_SIZE] = 11;
        style[DocumentApp.Attribute.LINE_SPACING] = 1.5;
        body.setAttributes(style);
    }
    /**
     * Get template for a prompt type
     */
    function getPromptTemplate(promptType) {
        var header = "## Version: ".concat(Constants.PROMPTS.DEFAULT_VERSION, "\n## Last Updated: ").concat(new Date().toISOString(), "\n## Description: ").concat(Constants.PROMPTS.DOC_NAMES[promptType] || promptType, " Prompt Template\n\n---\n\n");
        var templates = {
            SETTINGS: "".concat(header, "You are the personal email assistant for {{userName}} ({{userEmail}}).\n\nYOUR IDENTITY & SETTINGS:\n- You work exclusively for {{userName}} ({{userEmail}})\n- You know their communication style from analyzing their emails\n- You draft responses as if you were them, not as an AI\n- You understand their role, relationships, and communication patterns\n- You maintain their professional reputation in every response\n\nKEY INSTRUCTIONS:\n- Write in first person as {{userName}}\n- Never reveal you are an AI assistant\n- Adapt tone based on recipient and context\n- Use their typical vocabulary and expressions\n- Mirror their level of formality/informality\n\nCUSTOM SETTINGS:\nYou can customize these settings below:\n- Default formality level\n- Typical greetings and closings\n- Professional role and expertise\n- Special instructions for all emails\n- Email signature preferences\n\nEdit this document to customize the assistant's behavior and identity."),
            OVERVIEW: "".concat(header, "Generate an email response based on the following context:\n\n**EMAIL CONTEXT:**\n{{context}}\n\n**YOUR IDENTITY:**\n{{identity}}\n\n**WRITING STYLE:**\n{{style}}\n\n**RECIPIENT RELATIONSHIP:**\n{{recipientInfo}}\n\n**SPECIAL INSTRUCTIONS:**\n{{instructions}}\n\nRESPONSE REQUIREMENTS:\n1. Write as {{userName}}, not about them\n2. Match their typical tone for this recipient type\n3. Use appropriate greeting and closing from their patterns\n4. Maintain their vocabulary and expression style\n5. Keep consistent with their email length preferences\n6. Apply any special instructions provided\n7. Generate a complete email response ready to send\n\nCUSTOMIZATION:\nYou can edit this document to change how responses are generated:\n- Add specific response templates\n- Modify the tone and style guidelines\n- Include industry-specific language preferences\n- Add context-specific instructions"),
            THREAD: "".concat(header, "Analyze email threads and learn communication patterns for {{userEmail}}.\n\n**CURRENT ANALYSIS CONTEXT:**\n{{threadContent}}\n\n**USER PROFILE:**\n{{currentProfile}}\n\n**THREAD MESSAGES:**\n{{threadMessages}}\n\nANALYSIS TASKS:\n1. **Style Analysis**: Extract greetings, closings, tone patterns\n2. **Relationship Dynamics**: Understand communication with different recipients\n3. **Vocabulary Patterns**: Common phrases and expressions used\n4. **Context Adaptation**: How style changes based on situation\n5. **Learning Integration**: Update understanding based on new examples\n\nLEARNING OUTPUTS:\n- Communication patterns specific to this context\n- Vocabulary or phrases not previously captured\n- Tone adaptations for this recipient/situation\n- Unique stylistic elements to remember\n\nCUSTOMIZATION:\nEdit this document to control how the assistant learns from your emails:\n- Focus areas for style analysis\n- Specific patterns to watch for\n- Recipients to treat differently\n- Context-specific learning rules")
        };
        return templates[promptType] || "".concat(header, "[Template for ").concat(promptType, " - Please customize this prompt]");
    }
    /**
     * Get minimal fallback for a prompt type
     */
    function getMinimalFallback(promptType) {
        AppLogger.warn(Constants.PROMPTS.FALLBACK_WARNING, { promptType: promptType });
        var fallbacks = {
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
    function getCachedPrompt(promptType) {
        try {
            var cacheKey = "".concat(Constants.PROMPTS.CACHE_PREFIX).concat(promptType);
            var cached = PropertyManager.getProperty(cacheKey, 'user');
            if (!cached) {
                return null;
            }
            var data = JSON.parse(cached);
            // Validate cache structure
            if (!data.document || !data.cachedAt) {
                AppLogger.warn('Invalid cache structure', { promptType: promptType });
                return null;
            }
            return {
                document: data.document,
                cachedAt: new Date(data.cachedAt)
            };
        }
        catch (error) {
            AppLogger.warn('Failed to parse cached prompt', { promptType: promptType, error: error });
            // Clear corrupted cache
            try {
                var cacheKey = "".concat(Constants.PROMPTS.CACHE_PREFIX).concat(promptType);
                PropertyManager.deleteProperty(cacheKey, 'user');
            }
            catch (_a) { }
            return null;
        }
    }
    function updateCache(promptType, document) {
        try {
            var cacheKey = "".concat(Constants.PROMPTS.CACHE_PREFIX).concat(promptType);
            var data = {
                document: document,
                cachedAt: new Date(),
                cacheVersion: Utilities.getUuid() // Add cache version for invalidation tracking
            };
            PropertyManager.setProperty(cacheKey, JSON.stringify(data), 'user');
        }
        catch (error) {
            AppLogger.error('Failed to update prompt cache', { promptType: promptType, error: error });
        }
    }
    function isCacheValid(cachedAt) {
        var age = Date.now() - cachedAt.getTime();
        return age < Constants.TIMING.PROMPT_CACHE_TTL;
    }
    /**
     * Check for automatic updates
     */
    function checkForAutomaticUpdates() {
        if (!Constants.PROMPTS.AUTO_CHECK_ENABLED) {
            return;
        }
        var lastCheckKey = Constants.PROPERTIES.PROMPTS_LAST_CHECK;
        var lastCheck = PropertyManager.getProperty(lastCheckKey, 'user');
        if (lastCheck) {
            var timeSinceCheck = Date.now() - parseInt(lastCheck);
            if (timeSinceCheck < Constants.TIMING.PROMPT_UPDATE_CHECK_INTERVAL) {
                return;
            }
        }
        // Check all prompts for updates
        var statuses = getAllPromptStatuses();
        var hasUpdates = statuses.some(function (s) { return s.hasUpdate; });
        if (hasUpdates) {
            AppLogger.info('Prompt updates available', {
                types: statuses.filter(function (s) { return s.hasUpdate; }).map(function (s) { return s.type; })
            });
        }
        PropertyManager.setProperty(lastCheckKey, Date.now().toString(), 'user');
    }
    GoogleDocsPrompts.checkForAutomaticUpdates = checkForAutomaticUpdates;
})(GoogleDocsPrompts || (GoogleDocsPrompts = {}));
//# sourceMappingURL=google-docs-prompts.js.map