# Answer As Me - User Stories & Navigation Guide

## 5 User Stories

### 1. Sarah - First Time User
**Goal**: Set up the add-on and send her first AI response
**Journey**:
1. Opens Gmail, sees Answer As Me icon
2. Clicks icon → sees main card with version info
3. Needs to add API key → clicks Settings from menu
4. Enters API key and saves
5. Opens an email → clicks "Generate Response"
6. Reviews draft and sends

**Current Issues**: ❌ No clear onboarding flow, Settings in menu not obvious

### 2. Mike - Power User
**Goal**: Customize AI prompts for different client types
**Journey**:
1. Wants to edit prompts for formal vs casual emails
2. Looks for prompt editor → can't find it!
3. Checks Settings → no prompt link
4. Checks menu → only Settings and Help

**Current Issues**: ❌ Prompt editor not accessible anywhere!

### 3. Jennifer - Sales Manager
**Goal**: Use templates for common responses
**Journey**:
1. Wants to set up templates for pricing inquiries
2. Looks for template management → not found
3. Wants to see/edit the Google Docs prompts → no link
4. Can only generate basic responses

**Current Issues**: ❌ No access to prompt customization

### 4. David - Privacy-Conscious User
**Goal**: Understand what data is used and stored
**Journey**:
1. Clicks Help → sees basic info
2. Wants to see what prompts are used → no access
3. Wants to verify data handling → limited info
4. Concerned about email analysis scope

**Current Issues**: ❌ No transparency about prompts/data usage

### 5. Lisa - Team Lead
**Goal**: Configure responses for team communication
**Journey**:
1. Wants different styles for internal vs external
2. Needs to access prompt documents → no link
3. Wants to test different modes → not visible
4. Can only use basic generate function

**Current Issues**: ❌ No access to advanced features

## Current Navigation Structure

### Accessible Cards:
1. **Main Card** (onHomepage)
   - Version info
   - Configuration section
   - Generate Response button
   - Save Settings button

2. **Settings Card** (via menu)
   - Same as main card

3. **Help Card** (via menu)
   - Basic usage instructions
   - Response modes info
   - Tips

### Missing Navigation:
- ❌ Prompt Management
- ❌ Google Docs Prompts link
- ❌ Style Analysis viewer
- ❌ Advanced settings
- ❌ Test mode
- ❌ Template management

## Required Fixes

### 1. Update Universal Actions Menu
Add these items to the three-dot menu:
- Prompt Editor
- View Prompts Doc
- Advanced Settings
- Style Analysis

### 2. Add Navigation Buttons
On the main card, add:
- "Manage Prompts" button
- "View Style Analysis" button
- Quick links section

### 3. Improve Settings Card
- Add direct link to Google Docs prompts
- Show current prompt document ID
- Add "Edit in Google Docs" button

### 4. Create Prompt Management Card
- List all prompt categories
- Direct edit buttons for each
- Link to master prompt document
- Save/refresh options

### 5. Add Onboarding Flow
- Welcome screen for first-time users
- Step-by-step setup guide
- Test email generation
- Links to all features