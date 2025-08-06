#!/usr/bin/env node

/**
 * TEST EXACT ADD-ON API CALLS - Matches Live Implementation
 * This simulates exactly what the Gmail add-on does
 */

const https = require('https');

// Franz's API key
const API_KEY = 'AIzaSyBW1Y-RAa0U-KJ_0ZPsq-ArSA7NzRVV8MA';

// Exact constants from add-on
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';
const GEMINI_VERSION = 'v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = 'generateContent';

// Build exact URL like add-on does
const EXACT_URL = `${GEMINI_BASE_URL}/${GEMINI_VERSION}/models/${GEMINI_MODEL}:${GEMINI_ENDPOINT}`;

console.log('🧪 TESTING EXACT ADD-ON API CALLS');
console.log('='.repeat(60));
console.log(`🔗 Exact URL: ${EXACT_URL}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...${API_KEY.slice(-8)}`);

/**
 * Simulate exact UrlFetchApp.fetch call from Apps Script
 */
function simulateAppsScriptFetch(payload) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Making exact Apps Script-style request...`);
    console.log(`📊 Payload size: ${JSON.stringify(payload).length} chars`);
    
    const postData = JSON.stringify(payload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,  // EXACT header method from add-on
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(EXACT_URL, options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response status: ${res.statusCode}`);
        console.log(`📋 Headers:`, Object.keys(res.headers));
        
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ 
            statusCode: res.statusCode, 
            data: parsed,
            rawResponse: responseBody
          });
        } catch (e) {
          resolve({ 
            statusCode: res.statusCode, 
            data: responseBody,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Request error:`, error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Test 1: Exact API Key Test (like add-on testApiKey function)
 */
async function testExactApiKeyValidation() {
  console.log('\n🧪 TEST 1: Exact API Key Test (matches add-on testApiKey)');
  console.log('-'.repeat(50));
  
  const payload = {
    contents: [{
      parts: [{
        text: 'Say "API key works!"'
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topK: 40,
      topP: 0.95
    }
  };
  
  try {
    const response = await simulateAppsScriptFetch(payload);
    
    if (response.statusCode === 200) {
      if (response.data.candidates && response.data.candidates[0]) {
        const text = response.data.candidates[0].content.parts[0].text;
        console.log(`✅ SUCCESS: ${text}`);
        return { success: true };
      } else {
        console.log(`❌ No text in response:`, response.data);
        return { success: false, error: 'No response text' };
      }
    } else {
      console.log(`❌ HTTP ${response.statusCode}:`, response.data);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    console.log(`❌ ERROR:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Exact Response Generation (like add-on generateEmailResponse)
 */
async function testExactResponseGeneration() {
  console.log('\n🧪 TEST 2: Exact Response Generation (matches add-on)');
  console.log('-'.repeat(50));
  
  // Simulate exact prompt from add-on
  const prompt = `You are Franz Enzenhofer, responding to emails in your personal style.

CONTEXT:
- Incoming email from: test@example.com
- Subject: Test Email
- Body: Hi Franz, this is a test email. Please respond.

STYLE PROFILE:
- Tone: Professional yet friendly
- Formality: Balanced
- Common phrases: ["Thanks for reaching out", "Best regards"]

Generate a response that matches Franz's writing style:`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topK: 40,
      topP: 0.95
    },
    tools: [{
      google_search: {}
    }]
  };
  
  try {
    const response = await simulateAppsScriptFetch(payload);
    
    if (response.statusCode === 200) {
      if (response.data.candidates && response.data.candidates[0]) {
        const text = response.data.candidates[0].content.parts[0].text;
        console.log(`✅ Generated Response (${text.length} chars):`);
        console.log(`📝 Preview: ${text.substring(0, 200)}...`);
        return { success: true, response: text };
      } else {
        console.log(`❌ No text in response:`, response.data);
        return { success: false, error: 'No response text' };
      }
    } else {
      console.log(`❌ HTTP ${response.statusCode}:`, response.data);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    console.log(`❌ ERROR:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Exact Style Analysis (like add-on analyzeWritingStyle)
 */
async function testExactStyleAnalysis() {
  console.log('\n🧪 TEST 3: Exact Style Analysis (JSON mode)');
  console.log('-'.repeat(50));
  
  const prompt = `Analyze the writing style of Franz Enzenhofer based on these emails and return a JSON object with the style profile.

Emails to analyze:
Email 1: "Hi John, thanks for reaching out. I'd be happy to discuss this further. Let me know when works best for you. Best regards, Franz"

Email 2: "Hey team, great work on the project! I'm impressed with the progress. Let's schedule a follow-up meeting to discuss next steps. Cheers, Franz"

Return JSON with: greetings, closings, tone, formality, patterns, vocabulary`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topK: 40,
      topP: 0.95,
      response_mime_type: 'application/json'
    }
  };
  
  try {
    const response = await simulateAppsScriptFetch(payload);
    
    if (response.statusCode === 200) {
      if (response.data.candidates && response.data.candidates[0]) {
        const text = response.data.candidates[0].content.parts[0].text;
        console.log(`✅ Style Analysis JSON (${text.length} chars):`);
        
        // Try to parse JSON
        try {
          const parsed = JSON.parse(text);
          console.log(`📊 Parsed JSON keys:`, Object.keys(parsed));
          return { success: true, analysis: parsed };
        } catch (parseError) {
          console.log(`⚠️ JSON parse error:`, parseError.message);
          console.log(`📝 Raw response: ${text.substring(0, 300)}...`);
          return { success: true, analysis: text };
        }
      } else {
        console.log(`❌ No text in response:`, response.data);
        return { success: false, error: 'No response text' };
      }
    } else {
      console.log(`❌ HTTP ${response.statusCode}:`, response.data);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    console.log(`❌ ERROR:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runExactAddonTests() {
  console.log(`🚀 Testing with exact add-on configuration...`);
  
  const tests = [
    { name: 'API Key Validation', fn: testExactApiKeyValidation },
    { name: 'Response Generation', fn: testExactResponseGeneration },
    { name: 'Style Analysis', fn: testExactStyleAnalysis }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result.success) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED - ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🏁 EXACT ADD-ON TEST RESULTS: ${passed}/${total} tests passed`);
  console.log('='.repeat(60));
  
  if (passed === total) {
    console.log('🎉 ALL EXACT ADD-ON TESTS PASSED! The live add-on should work.');
  } else {
    console.log('⚠️ Some tests failed. The add-on may have issues.');
  }
}

// Run the exact tests
runExactAddonTests().catch(console.error);