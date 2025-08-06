"use strict";
/**
 * Debug Logger - Daily Spreadsheet Logging System
 *
 * COMPREHENSIVE DEBUGGING:
 * - Creates daily spreadsheets for all logs
 * - Logs ALL AI requests and responses
 * - Logs ALL logic calls and decisions
 * - Organized in special folder with daily rotation
 * - Accessible from Settings for easy debugging
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var DebugLogger;
(function (DebugLogger) {
    var dailySpreadsheetId = null;
    var currentDate = null;
    /**
     * Get or create today's debug spreadsheet
     */
    function getTodaysSpreadsheet() {
        var todayDate = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd');
        // Check if we need a new spreadsheet for today
        if (currentDate !== todayDate || !dailySpreadsheetId) {
            currentDate = todayDate;
            var fileName = "Answer-As-Me-Debug-Log-".concat(todayDate);
            // Try to find existing spreadsheet for today
            var folder = getOrCreateDebugFolder();
            var files = folder.getFilesByName(fileName);
            var spreadsheet = void 0;
            if (files.hasNext()) {
                // Found existing spreadsheet
                var file = files.next();
                dailySpreadsheetId = file.getId();
                spreadsheet = SpreadsheetApp.openById(dailySpreadsheetId);
            }
            else {
                // Create new spreadsheet
                spreadsheet = SpreadsheetApp.create(fileName);
                dailySpreadsheetId = spreadsheet.getId();
                // Move to debug folder
                var file = DriveApp.getFileById(dailySpreadsheetId);
                folder.addFile(file);
                DriveApp.getRootFolder().removeFile(file);
                // Initialize sheets and headers
                initializeSpreadsheet(spreadsheet);
            }
        }
        else {
            // Use existing spreadsheet
            return SpreadsheetApp.openById(dailySpreadsheetId);
        }
        return SpreadsheetApp.openById(dailySpreadsheetId);
    }
    /**
     * Get or create debug folder
     */
    function getOrCreateDebugFolder() {
        var folderName = 'Answer As Me - Debug Logs';
        var folders = DriveApp.getFoldersByName(folderName);
        if (folders.hasNext()) {
            return folders.next();
        }
        else {
            var folder = DriveApp.createFolder(folderName);
            folder.setDescription('Daily debug logs for Answer As Me Gmail add-on - Auto-rotated daily for debugging');
            return folder;
        }
    }
    /**
     * Initialize spreadsheet with proper sheets and headers
     */
    function initializeSpreadsheet(spreadsheet) {
        // Rename default sheet to Main Log
        var mainSheet = spreadsheet.getActiveSheet();
        mainSheet.setName('Main Log');
        // Create additional sheets
        var aiSheet = spreadsheet.insertSheet('AI Requests & Responses');
        var logicSheet = spreadsheet.insertSheet('Logic & Decision Flow');
        var userSheet = spreadsheet.insertSheet('User Actions');
        var errorSheet = spreadsheet.insertSheet('Errors & Warnings');
        // Set up headers for Main Log
        var mainHeaders = [
            'Timestamp', 'Level', 'Component', 'Message', 'User ID', 'Session ID', 'Data (JSON)'
        ];
        mainSheet.getRange(1, 1, 1, mainHeaders.length).setValues([mainHeaders]);
        mainSheet.getRange(1, 1, 1, mainHeaders.length).setFontWeight('bold');
        mainSheet.setFrozenRows(1);
        // Set up headers for AI Sheet
        var aiHeaders = [
            'Timestamp', 'Type', 'Component', 'Request/Response', 'Token Count', 'Duration (ms)', 'Success', 'Data'
        ];
        aiSheet.getRange(1, 1, 1, aiHeaders.length).setValues([aiHeaders]);
        aiSheet.getRange(1, 1, 1, aiHeaders.length).setFontWeight('bold');
        aiSheet.setFrozenRows(1);
        // Set up headers for Logic Sheet
        var logicHeaders = [
            'Timestamp', 'Function', 'Action', 'Input', 'Output', 'Decision', 'Duration (ms)', 'Notes'
        ];
        logicSheet.getRange(1, 1, 1, logicHeaders.length).setValues([logicHeaders]);
        logicSheet.getRange(1, 1, 1, logicHeaders.length).setFontWeight('bold');
        logicSheet.setFrozenRows(1);
        // Set up headers for User Sheet
        var userHeaders = [
            'Timestamp', 'Action', 'Component', 'Details', 'Result', 'Error', 'User Email'
        ];
        userSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
        userSheet.getRange(1, 1, 1, userHeaders.length).setFontWeight('bold');
        userSheet.setFrozenRows(1);
        // Set up headers for Error Sheet
        var errorHeaders = [
            'Timestamp', 'Level', 'Component', 'Error Message', 'Stack Trace', 'Context', 'User Impact'
        ];
        errorSheet.getRange(1, 1, 1, errorHeaders.length).setValues([errorHeaders]);
        errorSheet.getRange(1, 1, 1, errorHeaders.length).setFontWeight('bold');
        errorSheet.setFrozenRows(1);
        // Auto-resize columns
        [mainSheet, aiSheet, logicSheet, userSheet, errorSheet].forEach(function (sheet) {
            sheet.autoResizeColumns(1, sheet.getLastColumn());
        });
    }
    /**
     * Log general message to main log
     */
    function log(level, component, message, data) {
        try {
            var spreadsheet = getTodaysSpreadsheet();
            var sheet = spreadsheet.getSheetByName('Main Log');
            if (!sheet) {
                return;
            }
            var userId = Session.getActiveUser().getEmail();
            var sessionId = Utilities.getUuid().substring(0, 8);
            var timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
            var rowData = [
                timestamp,
                level,
                component,
                message,
                userId,
                sessionId,
                data ? JSON.stringify(data, null, 2) : ''
            ];
            sheet.appendRow(rowData);
        }
        catch (error) {
            // Fallback to console if spreadsheet logging fails
            console.error('Debug logging failed:', error);
        }
    }
    DebugLogger.log = log;
    /**
     * Log AI request/response
     */
    function logAI(type, component, content, metadata) {
        try {
            var spreadsheet = getTodaysSpreadsheet();
            var sheet = spreadsheet.getSheetByName('AI Requests & Responses');
            if (!sheet) {
                return;
            }
            var timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
            var tokenCount = content.length; // Rough estimate
            var rowData = [
                timestamp,
                type,
                component,
                content.substring(0, 1000) + (content.length > 1000 ? '...' : ''), // Truncate for readability
                tokenCount,
                (metadata === null || metadata === void 0 ? void 0 : metadata.duration) || 0,
                (metadata === null || metadata === void 0 ? void 0 : metadata.success) || 'unknown',
                JSON.stringify(metadata || {}, null, 2)
            ];
            sheet.appendRow(rowData);
            // Also log to main log
            log(type === 'REQUEST' ? 'AI_REQUEST' : 'AI_RESPONSE', component, "AI ".concat(type.toLowerCase()), __assign({ contentLength: content.length }, metadata));
        }
        catch (error) {
            console.error('AI logging failed:', error);
        }
    }
    DebugLogger.logAI = logAI;
    /**
     * Log logic and decision flow
     */
    function logLogic(functionName, action, input, output, decision, duration, notes) {
        try {
            var spreadsheet = getTodaysSpreadsheet();
            var sheet = spreadsheet.getSheetByName('Logic & Decision Flow');
            if (!sheet) {
                return;
            }
            var timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
            var rowData = [
                timestamp,
                functionName,
                action,
                input ? JSON.stringify(input, null, 2) : '',
                output ? JSON.stringify(output, null, 2) : '',
                decision || '',
                duration || 0,
                notes || ''
            ];
            sheet.appendRow(rowData);
            // Also log to main log
            log('LOGIC', functionName, "".concat(action, ": ").concat(decision || 'completed'), {
                input: input,
                output: output,
                duration: duration
            });
        }
        catch (error) {
            console.error('Logic logging failed:', error);
        }
    }
    DebugLogger.logLogic = logLogic;
    /**
     * Log user action
     */
    function logUserAction(action, component, details, result, error) {
        try {
            var spreadsheet = getTodaysSpreadsheet();
            var sheet = spreadsheet.getSheetByName('User Actions');
            if (!sheet) {
                return;
            }
            var timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
            var userEmail = Session.getActiveUser().getEmail();
            var rowData = [
                timestamp,
                action,
                component,
                details ? JSON.stringify(details, null, 2) : '',
                result || '',
                error || '',
                userEmail
            ];
            sheet.appendRow(rowData);
            // Also log to main log
            log('USER_ACTION', component, "User ".concat(action), {
                details: details,
                result: result,
                error: error
            });
        }
        catch (error) {
            console.error('User action logging failed:', error);
        }
    }
    DebugLogger.logUserAction = logUserAction;
    /**
     * Log error with full context
     */
    function logError(component, error, context, userImpact) {
        try {
            var spreadsheet = getTodaysSpreadsheet();
            var sheet = spreadsheet.getSheetByName('Errors & Warnings');
            if (!sheet) {
                return;
            }
            var timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
            var errorMessage = error instanceof Error ? error.message : error;
            var stackTrace = error instanceof Error ? error.stack || '' : '';
            var rowData = [
                timestamp,
                'ERROR',
                component,
                errorMessage,
                stackTrace,
                context ? JSON.stringify(context, null, 2) : '',
                userImpact || 'Unknown impact'
            ];
            sheet.appendRow(rowData);
            // Also log to main log
            log('ERROR', component, errorMessage, {
                context: context,
                userImpact: userImpact,
                stackTrace: stackTrace
            });
        }
        catch (logError) {
            console.error('Error logging failed:', logError);
            console.error('Original error:', error);
        }
    }
    DebugLogger.logError = logError;
    /**
     * Get today's spreadsheet URL for settings display
     */
    function getTodaysSpreadsheetUrl() {
        try {
            var spreadsheet = getTodaysSpreadsheet();
            return spreadsheet.getUrl();
        }
        catch (error) {
            console.error('Failed to get spreadsheet URL:', error);
            return null;
        }
    }
    DebugLogger.getTodaysSpreadsheetUrl = getTodaysSpreadsheetUrl;
    /**
     * Get today's spreadsheet ID
     */
    function getTodaysSpreadsheetId() {
        try {
            getTodaysSpreadsheet(); // Ensure it exists
            return dailySpreadsheetId;
        }
        catch (error) {
            console.error('Failed to get spreadsheet ID:', error);
            return null;
        }
    }
    DebugLogger.getTodaysSpreadsheetId = getTodaysSpreadsheetId;
    /**
     * Clean up old logs (keep last 30 days)
     */
    function cleanupOldLogs() {
        try {
            var folder = getOrCreateDebugFolder();
            var files = folder.getFiles();
            var thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            var deletedCount = 0;
            while (files.hasNext()) {
                var file = files.next();
                if (file.getLastUpdated() < thirtyDaysAgo) {
                    file.setTrashed(true);
                    deletedCount++;
                }
            }
            log('INFO', 'DebugLogger', "Cleaned up ".concat(deletedCount, " old log files"));
        }
        catch (error) {
            logError('DebugLogger', error instanceof Error ? error : String(error), null, 'Log cleanup failed - may accumulate files');
        }
    }
    DebugLogger.cleanupOldLogs = cleanupOldLogs;
    // Convenience methods for common logging patterns
    function info(component, message, data) {
        log('INFO', component, message, data);
    }
    DebugLogger.info = info;
    function warn(component, message, data) {
        log('WARN', component, message, data);
    }
    DebugLogger.warn = warn;
    function error(component, message, data) {
        log('ERROR', component, message, data);
    }
    DebugLogger.error = error;
    function debug(component, message, data) {
        log('DEBUG', component, message, data);
    }
    DebugLogger.debug = debug;
})(DebugLogger || (DebugLogger = {}));
//# sourceMappingURL=debug-logger.js.map