# Answer As Me - Gmail Add-on

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-Ready-green)](https://developers.google.com/apps-script)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

AI-powered Gmail add-on that generates personalized email responses matching your writing style.

## Features

- 🤖 **AI-Powered Responses**: Uses Google's Gemini 2.0 Flash API to generate contextual replies
- ✍️ **Style Learning**: Analyzes your last 200 sent emails to learn your writing patterns
- 📧 **Draft Creation**: Automatically creates draft replies you can review before sending
- 🎯 **Simple Interface**: Clean, minimal UI with just the essentials
- 🔒 **Secure**: API keys stored securely in user properties

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Google account with Gmail
- Gemini API key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/answer-as-me.git
cd answer-as-me
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Login to Google:
```bash
npm run login
```

5. Create a new Apps Script project:
```bash
npm run create
```

6. Deploy to Google Apps Script:
```bash
npm run push
```

### Configuration

1. Open the Apps Script editor:
```bash
npm run open
```

2. Go to **Deploy > Test deployments**
3. Click **Install** to add the add-on to Gmail
4. Open Gmail and look for the "Answer As Me" icon in the sidebar
5. Enter your Gemini API key and save

## Usage

1. Open any email in Gmail
2. Click the "Answer As Me" icon in the sidebar
3. Click "Generate Response"
4. A draft reply will be created in your style
5. Review and edit the draft before sending

## Development

### Project Structure

```
answer-as-me/
├── src/                    # TypeScript source files
│   ├── Code.ts            # Main entry point
│   ├── appsscript.json    # Apps Script manifest
│   └── modules/           # Modular TypeScript code
├── dist/                  # Compiled output (generated)
├── tests/                 # Test files
├── answer-as-me.gs       # Single-file version
└── package.json          # Node.js dependencies
```

### Available Scripts

- `npm run build` - Compile TypeScript and bundle
- `npm run watch` - Watch mode for development
- `npm run push` - Deploy to Google Apps Script
- `npm test` - Run tests
- `npm run lint` - Check code quality
- `npm run deploy` - Full deployment with version bump

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Architecture

The add-on uses a modular TypeScript architecture that compiles to a single Google Apps Script file:

- **Core Modules**: Config, Logger, Utils, Types
- **AI Modules**: AI integration, Style analysis, Response generation
- **Gmail Modules**: Email operations, Context extraction
- **UI Modules**: Card building, User interactions

## API Keys

The add-on requires a Gemini API key. You can get one for free at [Google AI Studio](https://makersuite.google.com/app/apikey).

Franz's API keys (for testing only):
- Primary: AIzaSyBuTkN626dnV-ymciVPd5rYeKGbrcBpdco
- Secondary: AIzaSyDH1mPElj5VOw1XviaQ-1Ften1TzbPRIR4

## Security

- API keys are stored in user properties (not in code)
- No email content is logged or stored
- All processing happens within your Google account

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Author

Franz Enzenhofer

## Acknowledgments

- Built with [Google Apps Script](https://developers.google.com/apps-script)
- Powered by [Google Gemini API](https://ai.google.dev/)
- Inspired by the need for personalized email automation