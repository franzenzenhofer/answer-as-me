/**
 * Test Google Apps Script API calls - both methods
 * This file can be copied to Apps Script for direct testing
 */

function testBothAuthMethods() {
  const API_KEY = 'AIzaSyBW1Y-RAa0U-KJ_0ZPsq-ArSA7NzRVV8MA';
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  console.log('🧪 Testing both auth methods in Apps Script...');
  
  const testData = {
    contents: [{
      parts: [{
        text: "Hello! Please respond with 'Apps Script test successful'"
      }]
    }]
  };
  
  // Test 1: Header authentication
  console.log('🧪 Test 1: Header authentication');
  try {
    const response1 = UrlFetchApp.fetch(`${BASE_URL}/gemini-2.5-flash:generateContent`, {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'x-goog-api-key': API_KEY
      },
      payload: JSON.stringify(testData),
      muteHttpExceptions: true
    });
    
    console.log(`Status: ${response1.getResponseCode()}`);
    const result1 = JSON.parse(response1.getContentText());
    if (result1.candidates && result1.candidates[0]) {
      console.log(`✅ Header auth works: ${result1.candidates[0].content.parts[0].text}`);
    } else {
      console.log('❌ Header auth failed:', result1);
    }
  } catch (error) {
    console.log('❌ Header auth error:', error);
  }
  
  // Test 2: URL parameter authentication
  console.log('🧪 Test 2: URL parameter authentication');
  try {
    const response2 = UrlFetchApp.fetch(`${BASE_URL}/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(testData),
      muteHttpExceptions: true
    });
    
    console.log(`Status: ${response2.getResponseCode()}`);
    const result2 = JSON.parse(response2.getContentText());
    if (result2.candidates && result2.candidates[0]) {
      console.log(`✅ URL param auth works: ${result2.candidates[0].content.parts[0].text}`);
    } else {
      console.log('❌ URL param auth failed:', result2);
    }
  } catch (error) {
    console.log('❌ URL param auth error:', error);
  }
}