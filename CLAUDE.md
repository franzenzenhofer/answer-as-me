# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

**THE MAIN GOAL**: Create a working Gmail Add-on that uses AI to automatically draft personalized email responses as if written by Franz Enzenhofer.

### Project Context:
- This is a Gmail add-on that learns Franz's writing style and automatically drafts responses
- Uses Gemini 2.5 Flash API for AI-powered response generation
- Single-file implementation for simplicity initially, then modular TypeScript architecture
- Focuses on maintaining Franz's unique voice, tone, and communication patterns

### Core Functionality:

1. **Email Analysis & Response Generation**:
   - Scans selected Gmail threads or messages
   - Uses Gemini 2.5 Flash API to analyze email content
   - Generates responses that match Franz's writing style:
     - Direct, concise communication
     - Technical accuracy when discussing development topics
     - Professional yet personal tone
     - Appropriate use of formatting and structure
   
2. **Learning & Adaptation**:
   - Analyzes Franz's sent emails to learn communication patterns
   - Stores writing style preferences in user properties
   - Adapts responses based on recipient relationship (client, colleague, friend)
   - Maintains context awareness from email threads

3. **Response Options**:
   - **Draft Mode** (default): Creates draft responses for review
   - **Suggest Mode**: Shows AI suggestions inline
   - **Template Mode**: Uses pre-defined response templates
   - **Auto-Reply Mode**: Automatically sends responses (with safety checks)

4. **User Interface (Gmail Add-on Card)**:
   - Gemini API key input field (stored securely in user properties)
   - Response mode selection (draft/suggest/template/auto)
   - Style preferences configuration:
     - Formality level slider
     - Response length preference
     - Signature selection
   - Custom instructions text area
   - "Generate Response" action button
   - Response preview with edit capability
   - Send/Save as Draft/Discard options

5. **Technical Constraints**:
   - Must be a proper Gmail Add-on (not just a standalone script)
   - TypeScript implementation with modular architecture
   - Uses Gemini 2.5 Flash via REST API
   - Temperature set to 0.7 for creative yet consistent results
   - Proper error handling with user-friendly messages
   - Respects Gmail API quotas and rate limits

6. **API Key Note**:
   - Primary API key: AIzaSyBuTkN626dnV-ymciVPd5rYeKGbrcBpdco
   - Secondary API key: AIzaSyDH1mPElj5VOw1XviaQ-1Ften1TzbPRIR4
   - These are from Franz's Google Team account

## Project Overview

This is a Gmail Add-on project written in TypeScript that compiles to Google Apps Script (.gs). The add-on uses Gemini 2.5 Flash API to generate personalized email responses that match Franz Enzenhofer's writing style.

### Current Status
- **Initial Setup Phase**: Setting up TypeScript to GAS pipeline
- **Modular Architecture**: Following simple-gmail-ai's proven structure
- **Production Pipeline**: Automated build, test, and deployment process

## PRODUCTION READY - v1.0.0

This Gmail add-on will be production ready with:
- **Personalized Responses**: AI learns and mimics Franz's writing style
- **Context Awareness**: Understands email threads and relationships
- **Security Hardened**: API keys stored securely, no PII exposure
- **Comprehensive Testing**: Full test coverage for all modules
- **Automated Deployment**: CI/CD pipeline with version management

## Key Architecture Components

### Core Structure
- **TypeScript Modules**: Organized, typed, testable code
- **Namespace Pattern**: Clean global scope management
- **Bundle System**: Compiles to single .gs file for deployment
- **Entry Points**: `onHomepage()` and contextual triggers
- **UI System**: CardService-based responsive interface

### Module Organization
1. **Core Modules**:
   - `config.ts`: Configuration and constants
   - `logger.ts`: Logging system with redaction
   - `utils.ts`: Utility functions
   - `types.ts`: TypeScript type definitions

2. **AI Modules**:
   - `ai.ts`: Gemini API integration
   - `style-analyzer.ts`: Writing style analysis
   - `response-generator.ts`: Response creation
   - `context-extractor.ts`: Thread context parsing

3. **Gmail Modules**:
   - `gmail.ts`: Gmail API operations
   - `thread-processor.ts`: Email thread handling
   - `draft-manager.ts`: Draft creation and management

4. **UI Modules**:
   - `ui.ts`: Card building functions
   - `form-handlers.ts`: Form input processing
   - `response-preview.ts`: Response preview UI

5. **System Modules**:
   - `error-handling.ts`: Error management
   - `entry-points.ts`: Add-on entry points
   - `action-handlers.ts`: User action handling

## Development Commands

### Setup & Build
```bash
npm install          # Install dependencies
npm run build        # Compile TS and bundle
npm run watch        # Watch mode for development
npm run push         # Deploy to Google Apps Script
```

### Testing
```bash
npm test             # Run unit tests
npm run test:watch   # Test watch mode
npm run test:coverage # Coverage report
npm run lint         # TypeScript type checking
```

### Deployment
```bash
npm run predeploy    # Run all checks
npm run deploy       # Full deployment with version bump
npm run deploy:major # Major version deployment
```

### Utilities
```bash
npm run logs         # View Google Apps Script logs
npm run open         # Open in Apps Script editor
clasp create --title "Answer As Me" --type addon --rootDir ./dist
```

## Important Implementation Details

### Gmail Integration
- Processes selected email or current thread
- Extracts sender, subject, and conversation context
- Maintains thread continuity in responses
- Respects Gmail quotas (batch processing)

### Gemini API Usage
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Two-stage processing:
  1. Style analysis from sent emails
  2. Response generation with style application
- Structured output with JSON schema validation
- Temperature: 0.7 for balanced creativity/consistency

### Writing Style Learning
- Analyzes last 100 sent emails
- Extracts patterns:
  - Greeting styles
  - Closing phrases
  - Sentence structure
  - Vocabulary preferences
  - Formatting habits
- Stores condensed style profile in user properties

### UI Components
- CardService-based responsive interface
- Dynamic form validation
- Real-time response preview
- Edit-in-place functionality
- Progress indicators for long operations

## Security Considerations
- API keys stored in PropertiesService (never in code)
- No logging of email content or PII
- User consent required for auto-reply mode
- Rate limiting to prevent abuse
- Secure communication with Gemini API

## Testing Strategy
- Unit tests for all modules
- Integration tests for API calls
- Mock Gmail and Gemini services
- Test data anonymization
- Edge case coverage (empty threads, API failures)

## Future Enhancements
- Multiple personality profiles
- Language detection and translation
- Smart scheduling for responses
- Analytics on response effectiveness
- Integration with calendar for availability