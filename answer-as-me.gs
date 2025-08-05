/**
 * Answer As Me - Gmail Add-on
 * Single-file implementation for simplicity
 * Version: 1.0.0
 */

// Configuration
var CONFIG = {
  APP_NAME: 'Answer As Me',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  MAX_EMAILS_TO_ANALYZE: 200,
  API_KEY_PROPERTY: 'AAM_API_KEY',
  STYLE_PROPERTY: 'AAM_STYLE_CACHE',
  STYLE_CACHE_DAYS: 7
};

/**
 * Homepage trigger - Main entry point
 */
function onHomepage(e) {
  return buildMainCard();
}

/**
 * Gmail message trigger - When viewing an email
 */
function onGmailMessage(e) {
  return buildEmailCard(e);
}

/**
 * Build main card UI
 */
function buildMainCard() {
  var card = CardService.newCardBuilder();
  var header = CardService.newCardHeader()
    .setTitle(CONFIG.APP_NAME)
    .setSubtitle('AI-powered email responses in your style');
  
  card.setHeader(header);
  
  // Settings section
  var section = CardService.newCardSection();
  
  // API Key
  var apiKey = PropertiesService.getUserProperties().getProperty(CONFIG.API_KEY_PROPERTY) || '';
  var apiKeyInput = CardService.newTextInput()
    .setFieldName('apiKey')
    .setTitle('Gemini API Key')
    .setValue(apiKey ? '••••' + apiKey.slice(-4) : '')
    .setHint('Enter your Gemini API key');
  
  section.addWidget(apiKeyInput);
  
  // Save button
  var saveButton = CardService.newTextButton()
    .setText('Save Settings')
    .setOnClickAction(CardService.newAction().setFunctionName('saveSettings'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
  
  section.addWidget(saveButton);
  
  // Info text
  var infoText = CardService.newTextParagraph()
    .setText('Open any email to generate a response in your style.');
  section.addWidget(infoText);
  
  card.addSection(section);
  return card.build();
}

/**
 * Build email-specific card
 */
function buildEmailCard(e) {
  if (!e.gmail || !e.gmail.messageId) {
    return buildErrorCard('No email selected');
  }
  
  var card = CardService.newCardBuilder();
  var header = CardService.newCardHeader()
    .setTitle('Generate Response')
    .setSubtitle('Click to create a response in your style');
  
  card.setHeader(header);
  
  var section = CardService.newCardSection();
  
  // Generate button
  var generateButton = CardService.newTextButton()
    .setText('Generate Response')
    .setOnClickAction(CardService.newAction().setFunctionName('generateResponse'))
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
  
  section.addWidget(generateButton);
  
  card.addSection(section);
  return card.build();
}

/**
 * Save settings action
 */
function saveSettings(e) {
  var formInputs = e.formInputs;
  var apiKey = formInputs.apiKey ? formInputs.apiKey[0] : '';
  
  if (apiKey && !apiKey.startsWith('••••')) {
    PropertiesService.getUserProperties().setProperty(CONFIG.API_KEY_PROPERTY, apiKey);
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Settings saved!'))
      .build();
  }
  
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('No changes made'))
    .build();
}

/**
 * Generate response action - Main functionality
 */
function generateResponse(e) {
  try {
    // Get API key
    var apiKey = PropertiesService.getUserProperties().getProperty(CONFIG.API_KEY_PROPERTY);
    if (!apiKey) {
      return buildNavigationCard('Please set your API key first', buildMainCard());
    }
    
    // Get current email
    var message = GmailApp.getMessageById(e.gmail.messageId);
    var thread = message.getThread();
    
    // Extract email content
    var emailContext = {
      from: extractEmailAddress(message.getFrom()),
      subject: message.getSubject(),
      body: trimWhitespace(message.getPlainBody()),
      date: message.getDate()
    };
    
    // Get or create writing style
    var style = getWritingStyle();
    
    // Generate response
    var responseText = callGeminiForResponse(emailContext, style, apiKey);
    
    if (!responseText) {
      return buildNavigationCard('Failed to generate response', buildEmailCard(e));
    }
    
    // Create draft
    var draft = thread.createDraftReply(responseText);
    
    // Show success card
    return buildSuccessCard(responseText, draft.getId());
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return buildNavigationCard('Error: ' + error.toString(), buildEmailCard(e));
  }
}

/**
 * Get or analyze writing style
 */
function getWritingStyle() {
  // Check cache
  var cachedStyle = PropertiesService.getUserProperties().getProperty(CONFIG.STYLE_PROPERTY);
  if (cachedStyle) {
    var parsed = JSON.parse(cachedStyle);
    var cacheDate = new Date(parsed.date);
    var daysSinceCache = (new Date() - cacheDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCache < CONFIG.STYLE_CACHE_DAYS) {
      return parsed.style;
    }
  }
  
  // Analyze sent emails
  var style = analyzeWritingStyle();
  
  // Cache the style
  PropertiesService.getUserProperties().setProperty(
    CONFIG.STYLE_PROPERTY,
    JSON.stringify({
      style: style,
      date: new Date().toISOString()
    })
  );
  
  return style;
}

/**
 * Analyze writing style from sent emails
 */
function analyzeWritingStyle() {
  var sentThreads = GmailApp.search('in:sent', 0, CONFIG.MAX_EMAILS_TO_ANALYZE);
  var emailBodies = [];
  var greetings = [];
  var closings = [];
  
  // Collect email content
  sentThreads.forEach(function(thread) {
    var messages = thread.getMessages();
    messages.forEach(function(message) {
      if (message.getFrom().indexOf(Session.getActiveUser().getEmail()) !== -1) {
        var body = trimWhitespace(message.getPlainBody());
        if (body.length > 50) {
          emailBodies.push(body);
          
          // Extract greetings
          var greetingMatch = body.match(/^(Hi|Hello|Hey|Dear|Good\s+\w+)[,\s]*/i);
          if (greetingMatch) {
            greetings.push(greetingMatch[1]);
          }
          
          // Extract closings
          var lines = body.split('\n');
          for (var i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
            var line = lines[i].trim();
            if (line.match(/(regards|best|sincerely|thanks|cheers)/i)) {
              closings.push(line);
              break;
            }
          }
        }
      }
    });
  });
  
  // Build style profile
  return {
    greeting: getMostCommon(greetings) || 'Hi',
    closing: getMostCommon(closings) || 'Best regards',
    averageLength: Math.round(emailBodies.join(' ').length / emailBodies.length),
    sampleEmails: emailBodies.slice(0, 10) // Keep some samples for context
  };
}

/**
 * Call Gemini API for response generation
 */
function callGeminiForResponse(emailContext, style, apiKey) {
  var prompt = 'You are writing an email response as Franz Enzenhofer.\n\n' +
    'Writing style profile:\n' +
    '- Typical greeting: ' + style.greeting + '\n' +
    '- Typical closing: ' + style.closing + '\n' +
    '- Average email length: ' + style.averageLength + ' characters\n\n' +
    'Sample emails for style reference:\n' +
    style.sampleEmails.slice(0, 3).join('\n---\n') + '\n\n' +
    'Now respond to this email:\n' +
    'From: ' + emailContext.from + '\n' +
    'Subject: ' + emailContext.subject + '\n' +
    'Content: ' + emailContext.body + '\n\n' +
    'Write a response that:\n' +
    '1. Matches the style from the samples\n' +
    '2. Is appropriate and helpful\n' +
    '3. Uses similar tone and length\n' +
    '4. Sounds natural and personal\n\n' +
    'Response:';
  
  var payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topK: 40,
      topP: 0.95
    }
  };
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(CONFIG.GEMINI_API_URL, options);
    
    if (response.getResponseCode() !== 200) {
      Logger.log('API Error: ' + response.getContentText());
      return null;
    }
    
    var result = JSON.parse(response.getContentText());
    
    if (result.candidates && result.candidates.length > 0) {
      return result.candidates[0].content.parts[0].text;
    }
    
  } catch (error) {
    Logger.log('API call failed: ' + error.toString());
  }
  
  return null;
}

/**
 * Build success card with draft
 */
function buildSuccessCard(responseText, draftId) {
  var card = CardService.newCardBuilder();
  var header = CardService.newCardHeader()
    .setTitle('Response Generated')
    .setSubtitle('Draft created successfully');
  
  card.setHeader(header);
  
  var section = CardService.newCardSection();
  
  // Response preview
  var previewText = CardService.newTextParagraph()
    .setText('<b>Preview:</b><br>' + responseText.substring(0, 300) + '...');
  section.addWidget(previewText);
  
  // Open draft button
  var openButton = CardService.newTextButton()
    .setText('Open Draft in Gmail')
    .setOpenLink(CardService.newOpenLink()
      .setUrl('https://mail.google.com/mail/u/0/#drafts')
      .setOpenAs(CardService.OpenAs.FULL_SIZE));
  
  section.addWidget(openButton);
  
  // Generate another button
  var againButton = CardService.newTextButton()
    .setText('Generate Another')
    .setOnClickAction(CardService.newAction().setFunctionName('generateResponse'));
  
  section.addWidget(againButton);
  
  card.addSection(section);
  return card.build();
}

/**
 * Build error card
 */
function buildErrorCard(message) {
  var card = CardService.newCardBuilder();
  var header = CardService.newCardHeader()
    .setTitle('Error')
    .setSubtitle('Something went wrong');
  
  card.setHeader(header);
  
  var section = CardService.newCardSection();
  var errorText = CardService.newTextParagraph()
    .setText(message);
  
  section.addWidget(errorText);
  card.addSection(section);
  
  return card.build();
}

/**
 * Build navigation card
 */
function buildNavigationCard(message, nextCard) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(message))
    .setNavigation(CardService.newNavigation().pushCard(nextCard))
    .build();
}

// Utility functions

/**
 * Trim excessive whitespace from text
 */
function trimWhitespace(text) {
  return text
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n')      // Remove empty lines
    .replace(/^\s+|\s+$/g, '')      // Trim start and end
    .substring(0, 2000);            // Limit length for API
}

/**
 * Extract email address from "Name <email>" format
 */
function extractEmailAddress(fromField) {
  var match = fromField.match(/<([^>]+)>/);
  return match ? match[1] : fromField;
}

/**
 * Get most common item from array
 */
function getMostCommon(arr) {
  if (arr.length === 0) return null;
  
  var counts = {};
  arr.forEach(function(item) {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  var maxCount = 0;
  var mostCommon = null;
  
  for (var item in counts) {
    if (counts[item] > maxCount) {
      maxCount = counts[item];
      mostCommon = item;
    }
  }
  
  return mostCommon;
}

/**
 * Settings universal action
 */
function onSettings(e) {
  return buildMainCard();
}

/**
 * Help universal action
 */
function onHelp(e) {
  var card = CardService.newCardBuilder();
  var header = CardService.newCardHeader()
    .setTitle('Help')
    .setSubtitle('How to use Answer As Me');
  
  card.setHeader(header);
  
  var section = CardService.newCardSection();
  var helpText = CardService.newTextParagraph()
    .setText(
      '<b>Getting Started:</b><br>' +
      '1. Enter your Gemini API key in settings<br>' +
      '2. Open any email you want to reply to<br>' +
      '3. Click "Generate Response"<br>' +
      '4. A draft will be created in your style<br><br>' +
      '<b>How it works:</b><br>' +
      '• Analyzes your last 200 sent emails<br>' +
      '• Learns your writing style<br>' +
      '• Generates contextual responses<br>' +
      '• Creates drafts you can edit before sending'
    );
  
  section.addWidget(helpText);
  card.addSection(section);
  
  return card.build();
}