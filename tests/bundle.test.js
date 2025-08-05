const fs = require('fs');
const path = require('path');

describe('Bundle Validation', () => {
  const bundlePath = path.join(__dirname, '../dist/Code.gs');
  
  test('Bundle file should exist', () => {
    expect(fs.existsSync(bundlePath)).toBe(true);
  });
  
  test('Bundle should contain all required modules', () => {
    const bundleContent = fs.readFileSync(bundlePath, 'utf8');
    
    const requiredModules = [
      'Types',
      'Config', 
      'AppLogger',
      'Utils',
      'StyleAnalyzer',
      'AI',
      'UI',
      'ErrorHandling',
      'ResponseGenerator',
      'ContextExtractor',
      'GmailService',
      'EntryPoints',
      'ActionHandlers'
    ];
    
    requiredModules.forEach(module => {
      expect(bundleContent).toContain(`var ${module};`);
    });
  });
  
  test('Bundle should contain all entry point functions', () => {
    const bundleContent = fs.readFileSync(bundlePath, 'utf8');
    
    const entryPoints = [
      'function onHomepage',
      'function onGmailMessage',
      'function onComposeAction',
      'function onSettings',
      'function onHelp',
      'function generateResponse',
      'function saveSettings',
      'function sendResponse',
      'function saveAsDraft',
      'function editResponse'
    ];
    
    entryPoints.forEach(func => {
      expect(bundleContent).toContain(func);
    });
  });
  
  test('Bundle should have proper version info', () => {
    const bundleContent = fs.readFileSync(bundlePath, 'utf8');
    expect(bundleContent).toContain('Answer As Me - Gmail Add-on');
    expect(bundleContent).toContain('Version: 1.0');
  });
});