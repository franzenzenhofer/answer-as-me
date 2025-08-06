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

namespace DebugLogger {
  let dailySpreadsheetId: string | null = null;
  let currentDate: string | null = null;
  
  interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'AI_REQUEST' | 'AI_RESPONSE' | 'LOGIC' | 'USER_ACTION';
    component: string;
    message: string;
    data?: any;
    userId?: string;
    sessionId?: string;
  }

  /**
   * Get or create today's debug spreadsheet
   */
  function getTodaysSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    const todayDate = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd');
    
    // Check if we need a new spreadsheet for today
    if (currentDate !== todayDate || !dailySpreadsheetId) {
      currentDate = todayDate;
      
      const fileName = `Answer-As-Me-Debug-Log-${todayDate}`;
      
      // Try to find existing spreadsheet for today
      const folder = getOrCreateDebugFolder();
      const files = folder.getFilesByName(fileName);
      
      let spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
      
      if (files.hasNext()) {
        // Found existing spreadsheet
        const file = files.next();
        dailySpreadsheetId = file.getId();
        spreadsheet = SpreadsheetApp.openById(dailySpreadsheetId);
      } else {
        // Create new spreadsheet
        spreadsheet = SpreadsheetApp.create(fileName);
        dailySpreadsheetId = spreadsheet.getId();
        
        // Move to debug folder
        const file = DriveApp.getFileById(dailySpreadsheetId);
        folder.addFile(file);
        DriveApp.getRootFolder().removeFile(file);
        
        // Initialize sheets and headers
        initializeSpreadsheet(spreadsheet);
      }
    } else {
      // Use existing spreadsheet
      return SpreadsheetApp.openById(dailySpreadsheetId);
    }
    
    return SpreadsheetApp.openById(dailySpreadsheetId);
  }

  /**
   * Get or create debug folder
   */
  function getOrCreateDebugFolder(): GoogleAppsScript.Drive.Folder {
    const folderName = 'Answer As Me - Debug Logs';
    const folders = DriveApp.getFoldersByName(folderName);
    
    if (folders.hasNext()) {
      return folders.next();
    } else {
      const folder = DriveApp.createFolder(folderName);
      folder.setDescription('Daily debug logs for Answer As Me Gmail add-on - Auto-rotated daily for debugging');
      return folder;
    }
  }

  /**
   * Initialize spreadsheet with proper sheets and headers
   */
  function initializeSpreadsheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): void {
    // Rename default sheet to Main Log
    const mainSheet = spreadsheet.getActiveSheet();
    mainSheet.setName('Main Log');
    
    // Create additional sheets
    const aiSheet = spreadsheet.insertSheet('AI Requests & Responses');
    const logicSheet = spreadsheet.insertSheet('Logic & Decision Flow');
    const userSheet = spreadsheet.insertSheet('User Actions');
    const errorSheet = spreadsheet.insertSheet('Errors & Warnings');
    
    // Set up headers for Main Log
    const mainHeaders = [
      'Timestamp', 'Level', 'Component', 'Message', 'User ID', 'Session ID', 'Data (JSON)'
    ];
    mainSheet.getRange(1, 1, 1, mainHeaders.length).setValues([mainHeaders]);
    mainSheet.getRange(1, 1, 1, mainHeaders.length).setFontWeight('bold');
    mainSheet.setFrozenRows(1);
    
    // Set up headers for AI Sheet
    const aiHeaders = [
      'Timestamp', 'Type', 'Component', 'Request/Response', 'Token Count', 'Duration (ms)', 'Success', 'Data'
    ];
    aiSheet.getRange(1, 1, 1, aiHeaders.length).setValues([aiHeaders]);
    aiSheet.getRange(1, 1, 1, aiHeaders.length).setFontWeight('bold');
    aiSheet.setFrozenRows(1);
    
    // Set up headers for Logic Sheet
    const logicHeaders = [
      'Timestamp', 'Function', 'Action', 'Input', 'Output', 'Decision', 'Duration (ms)', 'Notes'
    ];
    logicSheet.getRange(1, 1, 1, logicHeaders.length).setValues([logicHeaders]);
    logicSheet.getRange(1, 1, 1, logicHeaders.length).setFontWeight('bold');
    logicSheet.setFrozenRows(1);
    
    // Set up headers for User Sheet
    const userHeaders = [
      'Timestamp', 'Action', 'Component', 'Details', 'Result', 'Error', 'User Email'
    ];
    userSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
    userSheet.getRange(1, 1, 1, userHeaders.length).setFontWeight('bold');
    userSheet.setFrozenRows(1);
    
    // Set up headers for Error Sheet
    const errorHeaders = [
      'Timestamp', 'Level', 'Component', 'Error Message', 'Stack Trace', 'Context', 'User Impact'
    ];
    errorSheet.getRange(1, 1, 1, errorHeaders.length).setValues([errorHeaders]);
    errorSheet.getRange(1, 1, 1, errorHeaders.length).setFontWeight('bold');
    errorSheet.setFrozenRows(1);
    
    // Auto-resize columns
    [mainSheet, aiSheet, logicSheet, userSheet, errorSheet].forEach(sheet => {
      sheet.autoResizeColumns(1, sheet.getLastColumn());
    });
  }

  /**
   * Log general message to main log
   */
  export function log(level: LogEntry['level'], component: string, message: string, data?: any): void {
    try {
      const spreadsheet = getTodaysSpreadsheet();
      const sheet = spreadsheet.getSheetByName('Main Log');
      
      if (!sheet) {
        return;
      }
      
      const userId = Session.getActiveUser().getEmail();
      const sessionId = Utilities.getUuid().substring(0, 8);
      const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
      
      const rowData = [
        timestamp,
        level,
        component,
        message,
        userId,
        sessionId,
        data ? JSON.stringify(data, null, 2) : ''
      ];
      
      sheet.appendRow(rowData);
      
    } catch (error) {
      // Fallback to console if spreadsheet logging fails
      console.error('Debug logging failed:', error);
    }
  }

  /**
   * Log AI request/response
   */
  export function logAI(type: 'REQUEST' | 'RESPONSE', component: string, content: string, metadata?: any): void {
    try {
      const spreadsheet = getTodaysSpreadsheet();
      const sheet = spreadsheet.getSheetByName('AI Requests & Responses');
      
      if (!sheet) {
        return;
      }
      
      const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
      const tokenCount = content.length; // Rough estimate
      
      const rowData = [
        timestamp,
        type,
        component,
        content.substring(0, 1000) + (content.length > 1000 ? '...' : ''), // Truncate for readability
        tokenCount,
        metadata?.duration || 0,
        metadata?.success || 'unknown',
        JSON.stringify(metadata || {}, null, 2)
      ];
      
      sheet.appendRow(rowData);
      
      // Also log to main log
      log(type === 'REQUEST' ? 'AI_REQUEST' : 'AI_RESPONSE', component, `AI ${type.toLowerCase()}`, {
        contentLength: content.length,
        ...metadata
      });
      
    } catch (error) {
      console.error('AI logging failed:', error);
    }
  }

  /**
   * Log logic and decision flow
   */
  export function logLogic(
    functionName: string, 
    action: string, 
    input?: any, 
    output?: any, 
    decision?: string, 
    duration?: number, 
    notes?: string
  ): void {
    try {
      const spreadsheet = getTodaysSpreadsheet();
      const sheet = spreadsheet.getSheetByName('Logic & Decision Flow');
      
      if (!sheet) {
        return;
      }
      
      const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
      
      const rowData = [
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
      log('LOGIC', functionName, `${action}: ${decision || 'completed'}`, {
        input: input,
        output: output,
        duration: duration
      });
      
    } catch (error) {
      console.error('Logic logging failed:', error);
    }
  }

  /**
   * Log user action
   */
  export function logUserAction(
    action: string, 
    component: string, 
    details?: any, 
    result?: string, 
    error?: string
  ): void {
    try {
      const spreadsheet = getTodaysSpreadsheet();
      const sheet = spreadsheet.getSheetByName('User Actions');
      
      if (!sheet) {
        return;
      }
      
      const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
      const userEmail = Session.getActiveUser().getEmail();
      
      const rowData = [
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
      log('USER_ACTION', component, `User ${action}`, {
        details: details,
        result: result,
        error: error
      });
      
    } catch (error) {
      console.error('User action logging failed:', error);
    }
  }

  /**
   * Log error with full context
   */
  export function logError(component: string, error: Error | string, context?: any, userImpact?: string): void {
    try {
      const spreadsheet = getTodaysSpreadsheet();
      const sheet = spreadsheet.getSheetByName('Errors & Warnings');
      
      if (!sheet) {
        return;
      }
      
      const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH:mm:ss.SSS');
      const errorMessage = error instanceof Error ? error.message : error;
      const stackTrace = error instanceof Error ? error.stack || '' : '';
      
      const rowData = [
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
      
    } catch (logError) {
      console.error('Error logging failed:', logError);
      console.error('Original error:', error);
    }
  }

  /**
   * Get today's spreadsheet URL for settings display
   */
  export function getTodaysSpreadsheetUrl(): string | null {
    try {
      const spreadsheet = getTodaysSpreadsheet();
      return spreadsheet.getUrl();
    } catch (error) {
      console.error('Failed to get spreadsheet URL:', error);
      return null;
    }
  }

  /**
   * Get today's spreadsheet ID
   */
  export function getTodaysSpreadsheetId(): string | null {
    try {
      getTodaysSpreadsheet(); // Ensure it exists
      return dailySpreadsheetId;
    } catch (error) {
      console.error('Failed to get spreadsheet ID:', error);
      return null;
    }
  }

  /**
   * Clean up old logs (keep last 30 days)
   */
  export function cleanupOldLogs(): void {
    try {
      const folder = getOrCreateDebugFolder();
      const files = folder.getFiles();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let deletedCount = 0;
      while (files.hasNext()) {
        const file = files.next();
        if (file.getLastUpdated() < thirtyDaysAgo) {
          file.setTrashed(true);
          deletedCount++;
        }
      }
      
      log('INFO', 'DebugLogger', `Cleaned up ${deletedCount} old log files`);
    } catch (error) {
      logError(
        'DebugLogger', 
        error instanceof Error ? error : String(error), 
        null, 
        'Log cleanup failed - may accumulate files'
      );
    }
  }

  // Convenience methods for common logging patterns
  export function info(component: string, message: string, data?: any): void {
    log('INFO', component, message, data);
  }

  export function warn(component: string, message: string, data?: any): void {
    log('WARN', component, message, data);
  }

  export function error(component: string, message: string, data?: any): void {
    log('ERROR', component, message, data);
  }

  export function debug(component: string, message: string, data?: any): void {
    log('DEBUG', component, message, data);
  }
}