#!/bin/bash

# Production deployment script for Answer As Me
# This script handles the full production deployment process

set -e  # Exit on error

echo "🚀 Starting production deployment for Answer As Me..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}Warning: Not on main branch (current: $CURRENT_BRANCH)${NC}"
    read -p "Continue deployment anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: Uncommitted changes detected${NC}"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo -e "${RED}Tests failed! Aborting deployment${NC}"
    exit 1
fi

# Run linter
echo "🔍 Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${RED}Linting failed! Aborting deployment${NC}"
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Aborting deployment${NC}"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Bump version
echo "📦 Bumping version..."
npm version patch --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "New version: ${GREEN}$NEW_VERSION${NC}"

# Rebuild with new version
echo "🔨 Rebuilding with new version..."
npm run build

# Create git tag
echo "🏷️  Creating git tag..."
git add .
git commit -m "chore: release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

# Deploy to Google Apps Script
echo "📤 Deploying to Google Apps Script..."
DEPLOYMENT_OUTPUT=$(clasp deploy --description "Production v$NEW_VERSION")
echo "$DEPLOYMENT_OUTPUT"

# Extract deployment ID
DEPLOYMENT_ID=$(echo "$DEPLOYMENT_OUTPUT" | grep -oE 'AKfycb[a-zA-Z0-9_-]+' | head -1)

if [ -z "$DEPLOYMENT_ID" ]; then
    echo -e "${RED}Failed to extract deployment ID${NC}"
    exit 1
fi

# Push to git remote
echo "📤 Pushing to git remote..."
git push origin main
git push origin "v$NEW_VERSION"

# Create deployment summary
cat > LATEST_DEPLOYMENT.md << EOF
# Latest Production Deployment

- **Version**: $NEW_VERSION
- **Date**: $(date)
- **Deployment ID**: $DEPLOYMENT_ID
- **Script URL**: https://script.google.com/d/1lBZGlPIg44JJB6h7OlYIvg1AUe8ACLNVda5kjoEsiVIqrnlf-eOqb872/edit

## Testing the Deployment

1. Open Gmail
2. Click on any email
3. Look for "Answer As Me" in the right sidebar
4. Test the functionality

## Rollback Instructions

If needed, rollback to previous version:
\`\`\`bash
clasp deployments
clasp undeploy -d $DEPLOYMENT_ID
\`\`\`
EOF

echo ""
echo -e "${GREEN}✅ Production deployment successful!${NC}"
echo ""
echo "📋 Deployment Summary:"
echo "   Version: $NEW_VERSION"
echo "   Deployment ID: $DEPLOYMENT_ID"
echo ""
echo "🔗 Script URL:"
echo "   https://script.google.com/d/1lBZGlPIg44JJB6h7OlYIvg1AUe8ACLNVda5kjoEsiVIqrnlf-eOqb872/edit"
echo ""
echo "📝 Next steps:"
echo "   1. Test the deployment in Gmail"
echo "   2. Monitor for any errors"
echo "   3. Update documentation if needed"
echo ""