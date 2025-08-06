/**
 * Answer As Me - Main Entry File
 * This file contains the global functions that Google Apps Script calls
 */

/// <reference path="./modules/types.ts" />
/// <reference path="./modules/entry-points.ts" />

/**
 * Homepage trigger - Called when add-on is opened
 */
function onHomepage(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
  return EntryPoints.onHomepage(e);
}

/**
 * Gmail message trigger - Called when viewing an email
 */
function onGmailMessage(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
  return EntryPoints.onGmailMessage(e);
}

/**
 * Compose action trigger - Called from compose menu
 */
function onComposeAction(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
  return EntryPoints.onComposeAction(e);
}

/**
 * Settings action - Called from universal menu
 */
function onSettings(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
  return EntryPoints.onSettings(e);
}

/**
 * Help action - Called from universal menu
 */
function onHelp(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
  return EntryPoints.onHelp(e);
}

/**
 * Generate response action - Main functionality
 */
function generateResponse(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.generateResponse(e);
}

/**
 * Save settings action
 */
function saveSettings(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.saveSettings(e);
}

/**
 * Send response action
 */
function sendResponse(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.sendResponse(e);
}

/**
 * Save as draft action
 */
function saveAsDraft(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.saveAsDraft(e);
}

/**
 * Edit response action
 */
function editResponse(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.editResponse(e);
}

/**
 * Learn from thread action
 */
function learnFromThread(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.learnFromThread(e);
}

/**
 * Show prompt management
 */
function showPromptManagement(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.showPromptManagement(e);
}

/**
 * Handle create prompt document
 */
function handleCreatePromptDoc(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.handleCreatePromptDoc(e);
}

/**
 * Handle update all prompts
 */
function handleUpdateAllPrompts(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.handleUpdateAllPrompts(e);
}

/**
 * Show prompt editor (universal action)
 */
function onPromptEditor(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
  return EntryPoints.onPromptEditor(e);
}

/**
 * Open prompts document (universal action)
 */
function onViewPromptsDoc(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.openPromptsDocument(e);
}

/**
 * Show style analysis (universal action)
 */
function onStyleAnalysis(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.Card {
  return EntryPoints.onStyleAnalysis(e);
}

/**
 * Generate response with specific formality
 */
function generateResponseWithFormality(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.generateResponseWithFormality(e);
}

/**
 * Factory reset - delete all data and start fresh
 */
function factoryReset(e: GoogleAppsScript.Addons.EventObject): GoogleAppsScript.Card_Service.ActionResponse {
  return ActionHandlers.factoryReset(e);
}