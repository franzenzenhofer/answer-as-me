"use strict";
/**
 * Prompts Module - DRY Implementation
 *
 * ALL PROMPTS ARE FETCHED FROM GOOGLE DOCS
 * This module is just a thin wrapper around GoogleDocsPrompts
 * NO HARDCODED PROMPTS - Everything comes from Google Docs
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
var Prompts;
(function (Prompts) {
    /**
     * KISS APPROACH - Only 3 main prompt functions
     */
    /**
     * Get settings/identity prompt (combines old ASSISTANT_IDENTITY)
     */
    function getSettingsPrompt(userEmail, userName) {
        DebugLogger.logLogic('getSettingsPrompt', 'START', { userEmail: userEmail, userName: userName });
        // Auto-create documents if they don't exist
        ensurePromptsExist();
        var result = GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.SETTINGS, {
            userEmail: userEmail,
            userName: userName || userEmail
        });
        DebugLogger.logLogic('getSettingsPrompt', 'COMPLETE', { userEmail: userEmail }, { promptLength: result.length });
        return result;
    }
    Prompts.getSettingsPrompt = getSettingsPrompt;
    /**
     * Get overview/response generation prompt (combines old RESPONSE_GENERATION)
     */
    function getOverviewPrompt(context, style, userProfile, instructions) {
        DebugLogger.logLogic('getOverviewPrompt', 'START', { subject: context.subject, hasStyle: !!style });
        // Auto-create documents if they don't exist
        ensurePromptsExist();
        // Build recipient info
        var recipientInfo = buildRecipientInfo(context);
        // Build identity summary
        var identity = buildIdentitySummary(userProfile);
        // Build style summary
        var styleSummary = buildStyleSummary(style);
        // Build context summary
        var contextSummary = buildContextSummary(context);
        var result = GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.OVERVIEW, {
            context: contextSummary,
            identity: identity,
            style: styleSummary,
            recipientInfo: recipientInfo,
            instructions: instructions || 'None',
            userName: userProfile.name || userProfile.email
        });
        DebugLogger.logLogic('getOverviewPrompt', 'COMPLETE', { context: contextSummary.substring(0, 100) }, { promptLength: result.length });
        return result;
    }
    Prompts.getOverviewPrompt = getOverviewPrompt;
    /**
     * Get thread/learning prompt (combines old STYLE_ANALYSIS, STYLE_IMPROVEMENT, THREAD_LEARNING)
     */
    function getThreadPrompt(userEmail, threadMessages, currentProfile, threadContent) {
        DebugLogger.logLogic('getThreadPrompt', 'START', {
            userEmail: userEmail,
            hasThreadMessages: !!threadMessages,
            hasProfile: !!currentProfile
        });
        // Auto-create documents if they don't exist
        ensurePromptsExist();
        var result = GoogleDocsPrompts.getPrompt(Constants.PROMPTS.TYPES.THREAD, {
            userEmail: userEmail,
            threadMessages: threadMessages || '',
            currentProfile: currentProfile ? JSON.stringify(currentProfile, null, 2) : '',
            threadContent: threadContent || ''
        });
        DebugLogger.logLogic('getThreadPrompt', 'COMPLETE', { userEmail: userEmail }, { promptLength: result.length });
        return result;
    }
    Prompts.getThreadPrompt = getThreadPrompt;
    /**
     * Ensure all prompt documents exist - creates them immediately if missing
     */
    function ensurePromptsExist() {
        var e_1, _a;
        try {
            // Check if any documents are missing and create them immediately
            var promptTypes = Object.values(Constants.PROMPTS.TYPES);
            var missingDocs = 0;
            try {
                for (var promptTypes_1 = __values(promptTypes), promptTypes_1_1 = promptTypes_1.next(); !promptTypes_1_1.done; promptTypes_1_1 = promptTypes_1.next()) {
                    var promptType = promptTypes_1_1.value;
                    var docIdKey = "".concat(Constants.PROMPTS.DOC_ID_PREFIX).concat(promptType);
                    var docId = PropertyManager.getProperty(docIdKey, 'user');
                    if (!docId) {
                        missingDocs++;
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
            if (missingDocs > 0) {
                DebugLogger.info('Prompts', "Creating ".concat(missingDocs, " missing prompt documents"));
                GoogleDocsPrompts.createAllPromptDocuments();
            }
        }
        catch (error) {
            DebugLogger.logError('Prompts', error instanceof Error ? error : String(error), null, 'Failed to ensure prompts exist - may use fallback prompts');
        }
    }
    // Legacy compatibility functions - redirect to new simplified functions
    function getAssistantIdentityPrompt(userEmail, userName) {
        return getSettingsPrompt(userEmail, userName);
    }
    Prompts.getAssistantIdentityPrompt = getAssistantIdentityPrompt;
    function getResponseGenerationPrompt(context, style, userProfile, instructions) {
        return getOverviewPrompt(context, style, userProfile, instructions);
    }
    Prompts.getResponseGenerationPrompt = getResponseGenerationPrompt;
    function getStyleAnalysisPrompt(userEmail) {
        return getThreadPrompt(userEmail);
    }
    Prompts.getStyleAnalysisPrompt = getStyleAnalysisPrompt;
    function getStyleImprovementPrompt(currentProfile, threadContent) {
        return getThreadPrompt(currentProfile.email, undefined, currentProfile, threadContent);
    }
    Prompts.getStyleImprovementPrompt = getStyleImprovementPrompt;
    function getThreadLearningPrompt(userEmail, threadMessages) {
        return getThreadPrompt(userEmail, threadMessages);
    }
    Prompts.getThreadLearningPrompt = getThreadLearningPrompt;
    function getInitialProfilePrompt(userName, userEmail) {
        return getSettingsPrompt(userEmail, userName);
    }
    Prompts.getInitialProfilePrompt = getInitialProfilePrompt;
    // Helper functions to build prompt variables
    function buildRecipientInfo(context) {
        var _a;
        var recipient = ((_a = context.recipients) === null || _a === void 0 ? void 0 : _a[0]) || context.to;
        var domain = recipient.split('@')[1];
        var senderDomain = (context.senderEmail || context.from).split('@')[1];
        var relationship = 'External contact';
        if (domain === senderDomain) {
            relationship = 'Colleague (same organization)';
        }
        else if (context.threadHistory && context.threadHistory.length > 2) {
            relationship = 'Ongoing conversation';
        }
        return "Recipient: ".concat(recipient, "\nRelationship: ").concat(relationship);
    }
    function buildIdentitySummary(profile) {
        if (!profile.identity) {
            return "Email user: ".concat(profile.email);
        }
        return "Role: ".concat(profile.identity.role, "\nExpertise: ").concat(profile.identity.expertise.join(', '), "\nCommunication Style: ").concat(profile.identity.communicationStyle);
    }
    function buildStyleSummary(style) {
        var formalityLabel = Constants.STYLE.FORMALITY_LABELS[style.formalityLevel - 1] || 'Neutral';
        return "Formality: ".concat(formalityLabel, "\nCommon Greetings: ").concat(style.greetings.slice(0, 3).join(', '), "\nCommon Closings: ").concat(style.closings.slice(0, 3).join(', '), "\nAvg Sentence Length: ").concat(style.averageSentenceLength, " words\nEmail Length: ").concat(style.emailLength);
    }
    function buildContextSummary(context) {
        var lastMessage = context.originalMessage || { body: context.body };
        var preview = lastMessage.body.substring(0, 500);
        return "Subject: ".concat(context.subject, "\nFrom: ").concat(context.senderName || context.from, " <").concat(context.senderEmail || context.from, ">\nPreview: ").concat(preview).concat(lastMessage.body.length > 500 ? '...' : '');
    }
    /**
     * Helper function to infer relationship type
     * (Still used by other modules)
     */
    function inferRelationship(context, userProfile) {
        var senderEmail = (context.senderEmail || context.from).toLowerCase();
        var senderDomain = Utils.extractDomain(senderEmail);
        var userDomain = Utils.extractDomain(userProfile.email);
        // Check previous interactions
        if (context.threadHistory && context.threadHistory.length > 5) {
            return 'Frequent correspondent';
        }
        // Same domain = colleague
        if (senderDomain === userDomain) {
            return 'Colleague';
        }
        // Check for client indicators
        var subject = context.subject.toLowerCase();
        if (subject.includes('proposal') ||
            subject.includes('contract') ||
            subject.includes('invoice')) {
            return 'Client';
        }
        return 'External contact';
    }
    Prompts.inferRelationship = inferRelationship;
    /**
     * Helper function to determine formality level
     * (Still used by other modules)
     */
    function inferFormalityLevel(context, userProfile) {
        var relationship = inferRelationship(context, userProfile);
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
    Prompts.inferFormalityLevel = inferFormalityLevel;
})(Prompts || (Prompts = {}));
//# sourceMappingURL=prompts.js.map