#!/usr/bin/env node

/**
 * Post-Bundle Test Script
 * Validates the bundled Code.gs file after compilation
 */

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const BUNDLE_PATH = path.join(__dirname, '../../dist/Code.gs');
const MIN_SIZE = 50000; // 50KB minimum
const MAX_SIZE = 500000; // 500KB maximum

console.log('🔍 Running post-bundle tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    failed++;
  }
}

// Test 1: Bundle exists
test('Bundle file exists', () => {
  if (!fs.existsSync(BUNDLE_PATH)) {
    throw new Error(`Bundle not found at ${BUNDLE_PATH}`);
  }
});

// Test 2: Bundle size is reasonable
test('Bundle size is within limits', () => {
  const stats = fs.statSync(BUNDLE_PATH);
  if (stats.size < MIN_SIZE) {
    throw new Error(`Bundle too small: ${stats.size} bytes (min: ${MIN_SIZE})`);
  }
  if (stats.size > MAX_SIZE) {
    throw new Error(`Bundle too large: ${stats.size} bytes (max: ${MAX_SIZE})`);
  }
});

// Test 3: Bundle is valid JavaScript
test('Bundle contains valid JavaScript', () => {
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  try {
    acorn.parse(content, { ecmaVersion: 2020 });
  } catch (error) {
    throw new Error(`Syntax error in bundle: ${error.message}`);
  }
});

// Test 4: Required namespaces exist
test('All required namespaces are present', () => {
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  const requiredNamespaces = [
    'Constants',
    'Types',
    'Config',
    'AppLogger',
    'Utils',
    'JsonValidator',
    'GoogleDocsPrompts',
    'Prompts',
    'UserProfile',
    'StyleAnalyzer',
    'StyleImprover',
    'GmailService',
    'AI',
    'UI',
    'ErrorHandling',
    'ResponseGenerator',
    'ContextExtractor',
    'EntryPoints',
    'ActionHandlers'
  ];

  for (const namespace of requiredNamespaces) {
    if (!content.includes(`var ${namespace};`)) {
      throw new Error(`Missing namespace: ${namespace}`);
    }
  }
});

// Test 5: Entry points exist
test('All entry point functions exist', () => {
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  const entryPoints = [
    'function onHomepage',
    'function buildMessageCard',
    'function onGmailMessage',
    'function generateResponse',
    'function saveSettings',
    'function sendResponse',
    'function saveAsDraft'
  ];

  for (const fn of entryPoints) {
    if (!content.includes(fn)) {
      throw new Error(`Missing entry point: ${fn}`);
    }
  }
});

// Test 6: No debugging code
test('No debugging code in bundle', () => {
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  const debugPatterns = [
    /debugger;/g,
    /\/\/\s*TODO:/gi,
    /\/\/\s*FIXME:/gi,
    /\/\/\s*HACK:/gi,
    /\/\/\s*XXX:/gi
  ];

  for (const pattern of debugPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      throw new Error(`Found ${matches.length} instances of ${pattern}`);
    }
  }
});

// Test 7: No TypeScript artifacts
test('No TypeScript artifacts in bundle', () => {
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  const tsPatterns = [
    /import\s+.*\s+from/g,
    /export\s+(default|const|function|class)/g,
    /\/\/\/\s*<reference/g,
    /\.tsx?(['"])/g
  ];

  for (const pattern of tsPatterns) {
    if (pattern.test(content)) {
      throw new Error(`Found TypeScript artifact: ${pattern}`);
    }
  }
});

// Test 8: Version information is injected
test('Version information is present', () => {
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  if (!content.includes('APP_VERSION')) {
    throw new Error('Version information not found in bundle');
  }
  if (!content.includes('DEPLOY_TIME')) {
    throw new Error('Deploy time information not found in bundle');
  }
});

// Test 9: No sensitive information
test('No sensitive information in bundle', () => {
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  const sensitivePatterns = [
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*[:=]\s*['"]AIza[^'"]+['"]/gi, // Look for actual API keys starting with AIza
    /secret\s*[:=]\s*['"][^'"]+['"]/gi,
    /token\s*[:=]\s*['"][^'"]+['"]/gi,
    /localhost:\d+/g,
    /127\.0\.0\.1/g
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      throw new Error(`Found potential sensitive information: ${pattern}`);
    }
  }
});

// Test 10: Required Google Apps Script functions
test('Google Apps Script compatibility', () => {
  const content = fs.readFileSync(BUNDLE_PATH, 'utf8');
  
  // Should use GAS globals
  const gasGlobals = [
    'PropertiesService',
    'CardService',
    'GmailApp',
    'DocumentApp',
    'DriveApp',
    'UrlFetchApp',
    'Session'
  ];

  for (const global of gasGlobals) {
    if (!content.includes(global)) {
      throw new Error(`Missing GAS global: ${global}`);
    }
  }
});

// Test 11: Single file deployment
test('Single file structure', () => {
  const distDir = path.dirname(BUNDLE_PATH);
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.gs'));
  
  if (files.length !== 1) {
    throw new Error(`Expected 1 .gs file, found ${files.length}`);
  }
  
  if (files[0] !== 'Code.gs') {
    throw new Error(`Expected Code.gs, found ${files[0]}`);
  }
});

// Test 12: Manifest file exists
test('Manifest file exists', () => {
  const manifestPath = path.join(path.dirname(BUNDLE_PATH), 'appsscript.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('appsscript.json not found');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.oauthScopes) {
    throw new Error('OAuth scopes not defined in manifest');
  }
});

// Summary
console.log('\n=================================');
console.log(`Total tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('=================================\n');

if (failed > 0) {
  console.error('❌ Post-bundle tests failed!');
  process.exit(1);
} else {
  console.log('✅ All post-bundle tests passed!');
  process.exit(0);
}