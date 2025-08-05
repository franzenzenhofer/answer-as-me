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