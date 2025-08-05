#!/bin/bash

# Answer As Me - Deployment Script
# This script handles the deployment process to Google Apps Script

set -e # Exit on error

echo "🚀 Starting deployment process..."

# Check if clasp is logged in
if ! clasp status >/dev/null 2>&1; then
  echo "❌ Error: Please run 'npm run login' first to authenticate with Google"
  exit 1
fi

# Check if .clasp.json exists
if [ ! -f ".clasp.json" ]; then
  echo "❌ Error: No .clasp.json found. Run 'npm run create' to create a new project"
  exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Push to Google Apps Script
echo "⬆️  Pushing to Google Apps Script..."
npm run push

# Get the script ID from .clasp.json
SCRIPT_ID=$(grep -o '"scriptId":[[:space:]]*"[^"]*"' .clasp.json | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$SCRIPT_ID" ]; then
  echo "❌ Error: Could not find script ID in .clasp.json"
  exit 1
fi

echo "✅ Deployment successful!"
echo "📝 Script ID: $SCRIPT_ID"
echo "🔗 Open in Apps Script Editor: https://script.google.com/d/$SCRIPT_ID/edit"
echo ""
echo "Next steps:"
echo "1. Open the Apps Script editor: npm run open"
echo "2. Deploy > Test deployments > Install"
echo "3. Open Gmail and test the add-on"
echo ""
echo "To view logs: npm run logs"