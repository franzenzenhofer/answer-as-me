// Test setup file
// Mock Google Apps Script globals

// Mock CardService
global.CardService = {
  newCardBuilder: jest.fn(() => ({
    setHeader: jest.fn().mockReturnThis(),
    addSection: jest.fn().mockReturnThis(),
    build: jest.fn(() => ({}))
  })),
  newCardHeader: jest.fn(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setSubtitle: jest.fn().mockReturnThis(),
    setImageStyle: jest.fn().mockReturnThis(),
    setImageUrl: jest.fn().mockReturnThis()
  })),
  newCardSection: jest.fn(() => ({
    setHeader: jest.fn().mockReturnThis(),
    addWidget: jest.fn().mockReturnThis()
  })),
  newTextInput: jest.fn(() => ({
    setFieldName: jest.fn().mockReturnThis(),
    setTitle: jest.fn().mockReturnThis(),
    setValue: jest.fn().mockReturnThis(),
    setHint: jest.fn().mockReturnThis(),
    setMultiline: jest.fn().mockReturnThis()
  })),
  newTextButton: jest.fn(() => ({
    setText: jest.fn().mockReturnThis(),
    setOnClickAction: jest.fn().mockReturnThis(),
    setTextButtonStyle: jest.fn().mockReturnThis(),
    setOpenLink: jest.fn().mockReturnThis()
  })),
  newTextParagraph: jest.fn(() => ({
    setText: jest.fn().mockReturnThis()
  })),
  newAction: jest.fn(() => ({
    setFunctionName: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis()
  })),
  newActionResponseBuilder: jest.fn(() => ({
    setNotification: jest.fn().mockReturnThis(),
    setNavigation: jest.fn().mockReturnThis(),
    build: jest.fn(() => ({}))
  })),
  newNotification: jest.fn(() => ({
    setText: jest.fn().mockReturnThis()
  })),
  newNavigation: jest.fn(() => ({
    pushCard: jest.fn().mockReturnThis(),
    popToRoot: jest.fn().mockReturnThis(),
    updateCard: jest.fn().mockReturnThis()
  })),
  newButtonSet: jest.fn(() => ({
    addButton: jest.fn().mockReturnThis()
  })),
  newOpenLink: jest.fn(() => ({
    setUrl: jest.fn().mockReturnThis(),
    setOpenAs: jest.fn().mockReturnThis()
  })),
  ImageStyle: { CIRCLE: 'CIRCLE' },
  TextButtonStyle: { FILLED: 'FILLED', TEXT: 'TEXT' },
  OpenAs: { FULL_SIZE: 'FULL_SIZE' }
} as any;

// Mock PropertiesService
global.PropertiesService = {
  getUserProperties: jest.fn(() => ({
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    getProperties: jest.fn(() => ({})),
    deleteProperty: jest.fn()
  }))
} as any;

// Mock GmailApp
global.GmailApp = {
  search: jest.fn(() => []),
  getMessageById: jest.fn(),
  getDrafts: jest.fn(() => [])
} as any;

// Mock UrlFetchApp
global.UrlFetchApp = {
  fetch: jest.fn(() => ({
    getResponseCode: jest.fn(() => 200),
    getContentText: jest.fn(() => JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: 'Generated response'
          }]
        }
      }]
    }))
  }))
} as any;

// Mock Session
global.Session = {
  getActiveUser: jest.fn(() => ({
    getEmail: jest.fn(() => 'franz@test.com')
  })),
  getScriptTimeZone: jest.fn(() => 'Europe/Vienna')
} as any;

// Mock Utilities
global.Utilities = {
  formatDate: jest.fn((date, timezone, format) => '2025-01-01 12:00'),
  getUuid: jest.fn(() => 'test-uuid-1234'),
  sleep: jest.fn()
} as any;

// Mock Logger
global.Logger = {
  log: jest.fn()
} as any;

// Mock MailApp
global.MailApp = {
  getRemainingDailyQuota: jest.fn(() => 100)
} as any;