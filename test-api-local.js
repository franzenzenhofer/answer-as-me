#!/usr/bin/env node

/**
 * Local API Testing Script for Answer As Me
 * Tests all Gemini API calls with real API key
 */

const https = require('https');

// Test API key from Franz
const API_KEY = 'AIzaSyBW1Y-RAa0U-KJ_0ZPsq-ArSA7NzRVV8MA';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

console.log('🧪 STARTING API TESTING SUITE');
console.log('='.repeat(50));

/**
 * Make HTTP request to Gemini API - with both methods
 */
function makeAPIRequest(endpoint, data, useHeaderAuth = false) {
  return new Promise((resolve, reject) => {
    let url, options;
    
    if (useHeaderAuth) {
      // Method 1: Header authentication (official docs)
      url = `${BASE_URL}/${endpoint}`;
      options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
          'Content-Length': Buffer.byteLength(JSON.stringify(data))
        }
      };
      console.log(`📡 Making request to: ${endpoint} (HEADER AUTH)`);
    } else {
      // Method 2: URL parameter authentication (working test)
      url = `${BASE_URL}/${endpoint}?key=${API_KEY}`;
      options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(data))
        }
      };
      console.log(`📡 Making request to: ${endpoint} (URL PARAM AUTH)`);
    }
    
    console.log(`🔑 Using API key: ${API_KEY.substring(0, 8)}...${API_KEY.slice(-4)}`);
    
    const postData = JSON.stringify(data);
    
    const req = https.request(url, options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response status: ${res.statusCode}`);
        console.log(`📋 Response headers:`, res.headers);
        
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          console.log(`📝 Raw response body:`, responseBody);
          resolve({ status: res.statusCode, data: responseBody });
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
 * Test 1: Basic API Key Validation - Both Methods
 */
async function testAPIKeyValidation() {
  console.log('\n🧪 TEST 1: API Key Validation - Both Auth Methods');
  console.log('-'.repeat(50));
  
  const testData = {
    contents: [{
      parts: [{
        text: "Hello, this is a test. Please respond with 'API key is working'"
      }]
    }]
  };
  
  // Test with 2.5 Flash first
  console.log('🧪 Testing Gemini 2.5 Flash with URL param auth:');
  try {
    const response1 = await makeAPIRequest('gemini-2.5-flash:generateContent', testData, false);
    console.log(`✅ Status: ${response1.status}`);
    if (response1.data.candidates && response1.data.candidates[0]) {
      console.log(`💬 Response: ${response1.data.candidates[0].content.parts[0].text}`);
    } else {
      console.log(`❌ Unexpected response:`, response1.data);
    }
  } catch (error) {
    console.error(`❌ 2.5 Flash URL param failed:`, error.message);
  }
  
  console.log('\n🧪 Testing Gemini 2.5 Flash with header auth:');
  try {
    const response2 = await makeAPIRequest('gemini-2.5-flash:generateContent', testData, true);
    console.log(`✅ Status: ${response2.status}`);
    if (response2.data.candidates && response2.data.candidates[0]) {
      console.log(`💬 Response: ${response2.data.candidates[0].content.parts[0].text}`);
      return true;
    } else {
      console.log(`❌ Unexpected response:`, response2.data);
    }
  } catch (error) {
    console.error(`❌ 2.5 Flash header auth failed:`, error.message);
  }
  
  // Test with 2.0 Flash Exp as fallback
  console.log('\n🧪 Testing Gemini 2.0 Flash Exp with URL param auth:');
  try {
    const response3 = await makeAPIRequest('gemini-2.0-flash-exp:generateContent', testData, false);
    console.log(`✅ Status: ${response3.status}`);
    if (response3.data.candidates && response3.data.candidates[0]) {
      console.log(`💬 Response: ${response3.data.candidates[0].content.parts[0].text}`);
      return true;
    } else {
      console.log(`❌ Unexpected response:`, response3.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ 2.0 Flash Exp failed:`, error.message);
    return false;
  }
}

/**
 * Test 2: Style Analysis Request
 */
async function testStyleAnalysis() {
  console.log('\n🧪 TEST 2: Style Analysis');
  console.log('-'.repeat(30));
  
  const stylePrompt = `Analyze the writing style of these sample emails and provide a detailed style profile:

Email 1: "Hi John, thanks for reaching out. I'd be happy to discuss this further. Let me know when works best for you. Best regards, Franz"

Email 2: "Hey team, great work on the project! I'm impressed with the progress. Let's schedule a follow-up meeting to discuss next steps. Cheers, Franz"

Please provide a comprehensive style analysis including tone, formality level, typical phrases, and communication patterns.`;

  try {
    const response = await makeAPIRequest('gemini-2.0-flash-exp:generateContent', {
      contents: [{
        parts: [{
          text: stylePrompt
        }]
      }]
    });
    
    console.log(`✅ Status: ${response.status}`);
    if (response.data.candidates && response.data.candidates[0]) {
      console.log(`💬 Style Analysis Length: ${response.data.candidates[0].content.parts[0].text.length} chars`);
      console.log(`📝 First 200 chars: ${response.data.candidates[0].content.parts[0].text.substring(0, 200)}...`);
      return true;
    } else {
      console.log(`❌ Unexpected response structure:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Style analysis failed:`, error);
    return false;
  }
}

/**
 * Test 3: Response Generation with Context
 */
async function testResponseGeneration() {
  console.log('\n🧪 TEST 3: Response Generation');
  console.log('-'.repeat(30));
  
  const responsePrompt = `You are Franz Enzenhofer, an SEO expert and entrepreneur. Based on your writing style, generate a response to this email:

INCOMING EMAIL:
From: client@example.com
Subject: SEO Consultation Request
Body: "Hi Franz, I've heard great things about your SEO expertise. We're launching a new e-commerce site and would love to discuss how you could help us improve our search rankings. Are you available for a consultation next week? Thanks, Sarah"

Please generate a professional response in Franz's style that:
1. Acknowledges the request
2. Shows expertise without being pushy  
3. Suggests next steps
4. Maintains a friendly but professional tone

Response formality level: professional
Generate response now:`;

  try {
    const response = await makeAPIRequest('gemini-2.0-flash-exp:generateContent', {
      contents: [{
        parts: [{
          text: responsePrompt
        }]
      }]
    });
    
    console.log(`✅ Status: ${response.status}`);
    if (response.data.candidates && response.data.candidates[0]) {
      console.log(`💬 Generated Response:`);
      console.log(response.data.candidates[0].content.parts[0].text);
      return true;
    } else {
      console.log(`❌ Unexpected response structure:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Response generation failed:`, error);
    return false;
  }
}

/**
 * Test 4: Error Handling - Invalid Model
 */
async function testErrorHandling() {
  console.log('\n🧪 TEST 4: Error Handling');
  console.log('-'.repeat(30));
  
  try {
    const response = await makeAPIRequest('invalid-model:generateContent', {
      contents: [{
        parts: [{
          text: "This should fail"
        }]
      }]
    });
    
    console.log(`📊 Error Response Status: ${response.status}`);
    console.log(`📝 Error Response:`, response.data);
    return response.status === 404; // Expected error
  } catch (error) {
    console.log(`✅ Expected error caught:`, error.message);
    return true;
  }
}

/**
 * Test 5: Large Context Handling
 */
async function testLargeContext() {
  console.log('\n🧪 TEST 5: Large Context Handling');
  console.log('-'.repeat(30));
  
  // Create a large email thread simulation
  const largeContext = 'Email thread: ' + 'This is a sample email. '.repeat(100);
  
  try {
    const response = await makeAPIRequest('gemini-2.0-flash-exp:generateContent', {
      contents: [{
        parts: [{
          text: `Analyze this email thread and provide a brief summary:\n\n${largeContext}`
        }]
      }]
    });
    
    console.log(`✅ Status: ${response.status}`);
    if (response.data.candidates && response.data.candidates[0]) {
      console.log(`💬 Summary Length: ${response.data.candidates[0].content.parts[0].text.length} chars`);
      return true;
    } else {
      console.log(`❌ Unexpected response structure:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Large context handling failed:`, error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`🚀 Testing with API key: ${API_KEY.substring(0, 12)}...${API_KEY.slice(-6)}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  const tests = [
    { name: 'API Key Validation', fn: testAPIKeyValidation },
    { name: 'Style Analysis', fn: testStyleAnalysis },
    { name: 'Response Generation', fn: testResponseGeneration },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Large Context', fn: testLargeContext }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🏁 TEST RESULTS: ${passed}/${total} tests passed`);
  console.log('='.repeat(50));
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! API is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the output above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);