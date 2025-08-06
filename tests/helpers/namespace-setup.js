// Setup namespaces in global scope for testing
// This mimics how Google Apps Script handles namespaces

// Create empty namespaces only if they don't exist
if (!global.Constants) global.Constants = {};
if (!global.Types) global.Types = {};
if (!global.Config) global.Config = {};
if (!global.AppLogger) global.AppLogger = {};
if (!global.Utils) global.Utils = {};
if (!global.StyleAnalyzer) global.StyleAnalyzer = {};
if (!global.AI) global.AI = {};
if (!global.UI) global.UI = {};
if (!global.ErrorHandling) global.ErrorHandling = {};
if (!global.ResponseGenerator) global.ResponseGenerator = {};
if (!global.ContextExtractor) global.ContextExtractor = {};
if (!global.GmailService) global.GmailService = {};
if (!global.EntryPoints) global.EntryPoints = {};
if (!global.ActionHandlers) global.ActionHandlers = {};
if (!global.JsonValidator) global.JsonValidator = {};
if (!global.GoogleDocsPrompts) global.GoogleDocsPrompts = {};
if (!global.Prompts) global.Prompts = {};
if (!global.UserProfile) global.UserProfile = {};
if (!global.StyleImprover) global.StyleImprover = {};