# Answer As Me - Quick Start Guide

## 🚀 For Users (5 minutes)

### Step 1: Get a Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### Step 2: Open the Add-on in Gmail
1. Open Gmail in your browser
2. Click on any email to view it
3. Look for **"Answer As Me"** in the right sidebar
4. Click on the add-on icon to open it

### Step 3: Configure Settings
1. Click **"Settings"** in the add-on menu
2. Paste your Gemini API key
3. Click **"Save Settings"**

### Step 4: Generate Your First Response
1. Open an email you want to reply to
2. Click **"Generate Response"** in the add-on
3. Wait a few seconds for the AI to analyze your style
4. Review the generated draft
5. Click **"Send"** or edit first

## 👨‍💻 For Developers (10 minutes)

### Prerequisites
- Node.js 18+ installed
- Google account
- Gmail access

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd answer-as-me

# Install dependencies
npm install

# Login to Google
npx clasp login
```

### Development
```bash
# Build the project
npm run build

# Deploy to your account
npm run push

# Open in browser
npx clasp open
```

### Testing
```bash
# Run tests
npm test

# Check code quality
npm run lint
```

## 🎯 Features

- **Smart Learning**: Analyzes your last 200 sent emails
- **Context Aware**: Understands email threads
- **Your Style**: Mimics your writing patterns
- **Fast**: Uses Gemini 2.0 Flash (fastest model)
- **Simple**: Minimal UI, maximum efficiency

## 🔧 Troubleshooting

### "API Key Invalid"
- Make sure you copied the full key
- Check that the key starts with `AIza`
- Try generating a new key

### "No Response Generated"
- Make sure you have sent emails in your account
- Try selecting a different email
- Check your internet connection

### "Add-on Not Visible"
- Refresh Gmail (Ctrl/Cmd + R)
- Try opening in an incognito window
- Make sure you're using Gmail (not Google Workspace)

## 📝 Tips

1. **First Time**: The add-on analyzes your writing style on first use
2. **Best Results**: Works best with emails you've sent before
3. **Edit First**: Always review generated responses
4. **Save Drafts**: Use "Save as Draft" to review later

## 🆘 Need Help?

- Check the full README.md
- Review CLAUDE.md for technical details
- Open an issue on GitHub

---

**Ready to save time on email responses? Get started now!** 🎉