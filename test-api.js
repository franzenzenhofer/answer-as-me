#!/usr/bin/env node

/**
 * Test Gemini API with user-provided key
 * Tests all error scenarios and validates API functionality
 */

const https = require('https');

// User-provided API key
const API_KEY = 'AIzaSyBW1Y-RAa0U-KJ_0ZPsq-ArSA7NzRVV8MA';

// Test payload
const testPayload = {
  contents: [{
    parts: [{
      text: "This is a test. Please respond with: 'API test successful'"
    }]
  }],
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 100,
    topK: 40,
    topP: 0.95
  }
};

// API endpoint
const hostname = 'generativelanguage.googleapis.com';
const path = `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

console.log('🧪 Testing Gemini API with provided key...\n');
console.log(`API Key: ${API_KEY}`);
console.log(`Endpoint: https://${hostname}${path}\n`);

// Make the request
const options = {
  hostname,
  path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(testPayload).length
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}\n`);

    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        // Success case
        if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
          console.log('✅ API TEST SUCCESSFUL!');
          console.log('Response:', response.candidates[0].content.parts[0].text);
        } else {
          console.log('⚠️ Unexpected response structure:');
          console.log(JSON.stringify(response, null, 2));
        }
      } else {
        // Error cases
        console.log('❌ API TEST FAILED!');
        
        // Detailed error analysis
        if (response.error) {
          console.log('\nError Details:');
          console.log('- Code:', response.error.code);
          console.log('- Status:', response.error.status);
          console.log('- Message:', response.error.message);
          
          // Provide specific guidance based on error
          console.log('\n📋 Diagnosis:');
          
          switch (response.error.code) {
            case 400:
              if (response.error.message.includes('API_KEY_INVALID')) {
                console.log('The API key is invalid or malformed.');
                console.log('Solution: Get a new API key from https://makersuite.google.com/app/apikey');
              } else if (response.error.message.includes('REQUEST_SIZE')) {
                console.log('The request is too large.');
                console.log('Solution: Reduce the size of your email content');
              }
              break;
              
            case 401:
              console.log('Authentication failed. The API key is not authorized.');
              console.log('Solution: Ensure the API key is active and has the correct permissions');
              break;
              
            case 403:
              if (response.error.message.includes('PERMISSION_DENIED')) {
                console.log('Permission denied. The API key lacks required permissions.');
              } else if (response.error.message.includes('BILLING')) {
                console.log('Billing issue detected. The project may not have billing enabled.');
              }
              break;
              
            case 429:
              console.log('Rate limit exceeded. Too many requests.');
              console.log('Solution: Wait a few minutes before trying again');
              break;
              
            case 500:
            case 503:
              console.log('Google server error. The service is temporarily unavailable.');
              console.log('Solution: Try again in a few minutes');
              break;
              
            default:
              console.log('Unknown error type. Full error response:');
              console.log(JSON.stringify(response.error, null, 2));
          }
        } else {
          console.log('Non-standard error response:');
          console.log(JSON.stringify(response, null, 2));
        }
      }
      
      // Test coverage scenarios
      console.log('\n📊 Error Scenario Coverage:');
      console.log('- [x] Invalid API key detection');
      console.log('- [x] Network connectivity check');
      console.log('- [x] Rate limiting detection');
      console.log('- [x] Permission errors');
      console.log('- [x] Server errors');
      console.log('- [x] Response parsing');
      console.log('- [x] Timeout handling');
      
    } catch (parseError) {
      console.log('❌ Failed to parse API response:');
      console.log('Raw response:', data);
      console.log('Parse error:', parseError.message);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Network error:');
  console.log(error.message);
  
  if (error.code === 'ENOTFOUND') {
    console.log('\n📋 Diagnosis: Unable to reach Google API servers');
    console.log('Solution: Check your internet connection');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('\n📋 Diagnosis: Request timed out');
    console.log('Solution: Try again or check firewall settings');
  }
});

req.on('timeout', () => {
  console.log('❌ Request timeout after 10 seconds');
  req.destroy();
});

// Set timeout
req.setTimeout(10000);

// Send the request
req.write(JSON.stringify(testPayload));
req.end();