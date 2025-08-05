#!/bin/bash

# Project validation script
# Ensures all components are properly configured

echo "🔍 Validating Answer As Me Project..."
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track validation status
VALIDATION_PASSED=true

# Function to check file existence
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
    else
        echo -e "${RED}❌${NC} $2 (missing: $1)"
        VALIDATION_PASSED=false
    fi
}

# Function to check directory existence
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
    else
        echo -e "${RED}❌${NC} $2 (missing: $1)"
        VALIDATION_PASSED=false
    fi
}

# Function to check command availability
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅${NC} $2"
    else
        echo -e "${RED}❌${NC} $2 (command not found: $1)"
        VALIDATION_PASSED=false
    fi
}

echo "📁 Core Files"
echo "-------------"
check_file "package.json" "Package configuration"
check_file "tsconfig.json" "TypeScript configuration"
check_file "README.md" "Project documentation"
check_file "CLAUDE.md" "Detailed documentation"
check_file "LICENSE" "License file"
check_file ".gitignore" "Git ignore rules"
echo ""

echo "📂 Source Structure"
echo "------------------"
check_dir "src" "Source directory"
check_dir "src/modules" "Modules directory"
check_file "src/Code.ts" "Entry point"
check_file "src/appsscript.json" "Apps Script manifest"
echo ""

echo "🧩 Core Modules"
echo "---------------"
modules=("types" "config" "logger" "utils" "ai" "gmail" "ui" "error-handling" "entry-points" "action-handlers" "style-analyzer" "response-generator" "context-extractor")
for module in "${modules[@]}"; do
    check_file "src/modules/$module.ts" "Module: $module"
done
echo ""

echo "🧪 Testing"
echo "----------"
check_dir "tests" "Test directory"
check_file "jest.config.js" "Jest configuration"
check_file "tests/setup.ts" "Test setup"
check_file "tests/bundle.test.js" "Bundle validation test"
echo ""

echo "🔧 Build Tools"
echo "--------------"
check_file "bundle.js" "Bundle script"
check_file "deploy.sh" "Deployment script"
check_file "deploy-production.sh" "Production deployment"
check_file ".eslintrc.js" "ESLint configuration"
echo ""

echo "📋 Build Output"
echo "---------------"
if [ -d "dist" ]; then
    check_file "dist/Code.gs" "Bundled output"
    check_file "dist/appsscript.json" "Manifest copy"
    
    # Check bundle size
    if [ -f "dist/Code.gs" ]; then
        SIZE=$(ls -lh dist/Code.gs | awk '{print $5}')
        echo -e "${GREEN}✅${NC} Bundle size: $SIZE"
    fi
else
    echo -e "${YELLOW}⚠️${NC} Build directory not found (run: npm run build)"
fi
echo ""

echo "🛠️ Development Tools"
echo "--------------------"
check_command "node" "Node.js"
check_command "npm" "npm"
check_command "tsc" "TypeScript compiler"

# Check Node version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
    if [ $NODE_MAJOR -ge 18 ]; then
        echo -e "${GREEN}✅${NC} Node version: $NODE_VERSION"
    else
        echo -e "${RED}❌${NC} Node version: $NODE_VERSION (requires 18+)"
        VALIDATION_PASSED=false
    fi
fi
echo ""

echo "📊 Code Quality"
echo "---------------"
# Run TypeScript check
echo -n "TypeScript compilation: "
if npm run lint &> /dev/null; then
    echo -e "${GREEN}✅ No errors${NC}"
else
    echo -e "${RED}❌ Compilation errors${NC}"
    VALIDATION_PASSED=false
fi

# Check if tests pass
echo -n "Unit tests: "
if npm test -- --passWithNoTests &> /dev/null; then
    echo -e "${GREEN}✅ Passing${NC}"
else
    echo -e "${YELLOW}⚠️ Some tests failing${NC}"
fi
echo ""

echo "📈 Project Statistics"
echo "--------------------"
TS_FILES=$(find src -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_LOC=$(find src -name "*.ts" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo "TypeScript files: $TS_FILES"
echo "Lines of code: ${TOTAL_LOC:-0}"
echo ""

# Final result
echo "===================================="
if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✅ Project validation PASSED!${NC}"
    echo ""
    echo "Ready for deployment. Run:"
    echo "  npm run push    # Deploy to Google Apps Script"
    echo "  npm run open    # Open in browser"
else
    echo -e "${RED}❌ Project validation FAILED!${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
    exit 1
fi