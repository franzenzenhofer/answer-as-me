"use strict";
/**
 * Answer As Me - Main Entry File
 * This file contains the global functions that Google Apps Script calls
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference path="./modules/types.ts" />
/// <reference path="./modules/entry-points.ts" />
/**
 * Homepage trigger - Called when add-on is opened
 */
function onHomepage(e) {
    return EntryPoints.onHomepage(e);
}
/**
 * Gmail message trigger - Called when viewing an email
 */
function onGmailMessage(e) {
    return EntryPoints.onGmailMessage(e);
}
/**
 * Compose action trigger - Called from compose menu
 */
function onComposeAction(e) {
    return EntryPoints.onComposeAction(e);
}
/**
 * Settings action - Called from universal menu
 */
function onSettings(e) {
    return EntryPoints.onSettings(e);
}
/**
 * Help action - Called from universal menu
 */
function onHelp(e) {
    return EntryPoints.onHelp(e);
}
/**
 * Generate response action - Main functionality
 */
function generateResponse(e) {
    return ActionHandlers.generateResponse(e);
}
/**
 * Save settings action
 */
function saveSettings(e) {
    return ActionHandlers.saveSettings(e);
}
/**
 * Send response action
 */
function sendResponse(e) {
    return ActionHandlers.sendResponse(e);
}
/**
 * Save as draft action
 */
function saveAsDraft(e) {
    return ActionHandlers.saveAsDraft(e);
}
/**
 * Edit response action
 */
function editResponse(e) {
    return ActionHandlers.editResponse(e);
}
/**
 * Learn from thread action
 */
function learnFromThread(e) {
    return ActionHandlers.learnFromThread(e);
}
/**
 * Show prompt management
 */
function showPromptManagement(e) {
    return ActionHandlers.showPromptManagement(e);
}
/**
 * Handle create prompt document
 */
function handleCreatePromptDoc(e) {
    return ActionHandlers.handleCreatePromptDoc(e);
}
/**
 * Handle update all prompts
 */
function handleUpdateAllPrompts(e) {
    return ActionHandlers.handleUpdateAllPrompts(e);
}
/**
 * Show prompt editor (universal action)
 */
function onPromptEditor(e) {
    return EntryPoints.onPromptEditor(e);
}
/**
 * Open prompts document (universal action)
 */
function onViewPromptsDoc(e) {
    return ActionHandlers.openPromptsDocument(e);
}
/**
 * Show style analysis (universal action)
 */
function onStyleAnalysis(e) {
    return EntryPoints.onStyleAnalysis(e);
}
/**
 * Generate response with specific formality
 */
function generateResponseWithFormality(e) {
    return ActionHandlers.generateResponseWithFormality(e);
}
/**
 * Factory reset - delete all data and start fresh
 */
function factoryReset(e) {
    return ActionHandlers.factoryReset(e);
}
/**
 * Test API key with debugging information
 */
function testApiKey(e) {
    return ActionHandlers.testApiKey(e);
}
//# sourceMappingURL=Code.js.map