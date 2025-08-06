# NPM Commands Reference

## Development Commands

### Build & Watch
- `npm run build` - Clean, compile TypeScript, bundle, and copy files
- `npm run watch` - Watch for TypeScript changes
- `npm run clean` - Remove dist directory
- `npm run bundle` - Create single Code.gs file
- `npm run lint` - Run TypeScript type checking
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run lint:eslint` - Run ESLint

### Testing
- `npm test` - Run tests (currently skipped for namespace architecture)
- `npm run test:postbundle` - Test the bundled output
- `npm run test:all` - Run all tests

## Google Apps Script Commands

### Authentication & Setup
- `npm run login` - Login to Google Apps Script
- `npm run create` - Create a new Apps Script project
- `npm run clone` - Clone an existing script

### Development
- `npm run push` - Build and push to Google Apps Script
- `npm run pull` - Pull latest code from Google Apps Script
- `npm run open` - Open the Apps Script editor in browser
- `npm run status` - Show which files will be pushed

### Monitoring & Debugging
- `npm run logs` - View real-time logs
- `npm run versions` - List all script versions
- `npm run deployments` - List all deployments
- `npm run apis` - List enabled APIs
- `npm run list` - List all your Apps Script projects

### Running Functions
- `npm run run [functionName]` - Execute a function remotely
- `npm run web-app` - Open deployed web app

## Deployment Commands

### Standard Deployment
- `npm run deploy` - Run full deployment pipeline (auto version bump)
- `npm run deploy:patch` - Deploy with patch version bump (1.0.0 → 1.0.1)
- `npm run deploy:minor` - Deploy with minor version bump (1.0.0 → 1.1.0)
- `npm run deploy:major` - Deploy with major version bump (1.0.0 → 2.0.0)

### Pre-deployment
- `npm run predeploy` - Run all checks before deployment
- `npm run check` - Run TypeScript and ESLint in parallel

## Setup & Installation
- `npm run setup` - Install dependencies and build
- `npm install` - Install all dependencies

## Command Details

### Build Process
The build process (`npm run build`) performs these steps:
1. Clean the dist directory
2. Compile TypeScript to JavaScript
3. Bundle all modules into single Code.gs file
4. Copy appsscript.json manifest
5. Sync README to dist

### Deployment Process
The deployment script (`npm run deploy`) performs:
1. Pre-deployment checks (lint, tests)
2. Build the project
3. Update version number
4. Push to Google Apps Script
5. Verify deployment
6. Create git commit and tag
7. Generate deployment log

### Common Workflows

#### First Time Setup
```bash
npm run setup
npm run login
npm run create
```

#### Daily Development
```bash
npm run watch        # In one terminal
npm run push        # When ready to test
npm run logs        # Monitor execution
```

#### Deployment
```bash
npm run deploy      # Full deployment
npm run open        # Verify in Apps Script editor
```

#### Debugging
```bash
npm run status      # Check what will be pushed
npm run logs        # View logs
npm run versions    # Check deployment history
```