# Answer As Me - Prompt Editor Guide

## 🎯 Overview

Answer As Me now features a **HARDCORE DRY** prompt management system where:
- **ALL prompts are stored in Google Docs** (single source of truth)
- **NO hardcoded prompts** exist in the codebase
- **Each prompt type has its own Google Doc**
- **Prompts persist even after factory reset**
- **Complete decoupling** from application code

## 📚 Prompt Types

The system uses 6 different prompt documents:

1. **Assistant Identity** - Defines WHO the AI is and how it relates to you
2. **Style Analysis** - Analyzes your sent emails to understand your style
3. **Response Generation** - Creates email responses in your style
4. **Style Improvement** - Learns from specific email threads
5. **Thread Learning** - Extracts patterns from conversations
6. **Error Context** - Handles error scenarios gracefully

## 🚀 Getting Started

### First Time Setup

1. **Open Gmail** and click the Answer As Me add-on
2. **Go to Settings** → **Manage Prompts**
3. You'll see the prompt management interface:
   ```
   Prompt Documents Status
   ❌ Assistant Identity - Not created [Click to create]
   ❌ Style Analysis - Not created [Click to create]
   ...
   ```
4. **Click each prompt** to create its Google Doc
5. Documents are automatically organized in a folder: `Answer As Me - Prompt Documents`

### Document Structure

Each prompt document contains:
```
## Version: 1.0.0
## Last Updated: 2024-01-XX
## Description: [Prompt Type] Prompt Template

---

[Your prompt content with {{variables}}]
```

## ✏️ Editing Prompts

### Basic Editing

1. **Click on any prompt** in the management UI to open its Google Doc
2. **Edit the content** directly in Google Docs
3. **Increment the version** number when making significant changes
4. **Save** - changes are automatically picked up

### Variables

Use double curly braces for variables that get replaced at runtime:
- `{{userName}}` - User's name
- `{{userEmail}}` - User's email address
- `{{context}}` - Email context
- `{{identity}}` - User identity summary
- `{{style}}` - Writing style summary
- `{{recipientInfo}}` - Recipient details
- `{{instructions}}` - Custom instructions

### Version Management

1. **Version Format**: Use semantic versioning (e.g., 1.0.0, 1.1.0, 2.0.0)
2. **When to increment**:
   - Major changes: 2.0.0
   - New features: 1.1.0
   - Minor tweaks: 1.0.1
3. **Version history**: Add notes at the bottom of each doc

Example:
```
### Version History:
### Version 1.1.0 (2024-01-15)
- Added support for formal client communications
- Improved greeting variations

### Version 1.0.0 (Initial)
- Base prompt template
```

## 🔄 Update Mechanism

### Automatic Updates
- Prompts are **cached for 1 hour**
- System **checks for updates every 5 minutes**
- If a document is modified, the 🔄 icon appears
- Updates are fetched automatically when cache expires

### Manual Updates
1. Go to **Settings** → **Manage Prompts**
2. Click **"Update All Prompts"** button
3. See update status:
   ```
   ✅ Updated: Assistant Identity, Style Analysis
   ❌ Failed: None
   ```

## 🎨 Advanced Customization

### Creating Role-Specific Prompts

Edit the **Assistant Identity** prompt to define specific roles:

```
You are the personal email assistant for {{userName}} ({{userEmail}}).

YOUR IDENTITY:
- You work as the Chief Technology Officer's assistant
- You understand technical discussions and architecture decisions
- You maintain a balance of technical accuracy and business clarity
- You know when to be detailed vs. when to be concise
```

### Industry-Specific Vocabulary

Add to any prompt:
```
INDUSTRY CONTEXT:
- You work in [FinTech/HealthTech/E-commerce/etc.]
- Key terms to use correctly: [term1, term2, term3]
- Compliance considerations: [GDPR, HIPAA, PCI-DSS]
```

### Tone Variations

Customize the **Response Generation** prompt:
```
TONE ADJUSTMENTS:
- Internal team: Casual, use first names, brief
- C-level: Professional but warm, data-driven
- Clients: Formal, solution-focused, clear next steps
- Partners: Collaborative, win-win language
```

## 🛡️ Best Practices

### DO:
- ✅ Test prompts with different email scenarios
- ✅ Keep variables intact when editing
- ✅ Version your changes properly
- ✅ Document why you made changes
- ✅ Use clear, specific instructions
- ✅ Include examples in prompts when helpful

### DON'T:
- ❌ Remove {{variable}} placeholders
- ❌ Hardcode personal information
- ❌ Make prompts too restrictive
- ❌ Delete version headers
- ❌ Use prompts for unethical purposes

## 🔧 Troubleshooting

### Prompts Not Updating
1. Check if you saved the Google Doc
2. Try manual update via "Update All Prompts"
3. Clear cache by waiting 1 hour or reinstalling

### Variables Not Replaced
- Ensure you use exact variable names
- Check for typos in {{variable}} syntax
- Variables are case-sensitive

### Document Access Issues
- Documents are private to your account
- Check Google Drive permissions
- Look in "Answer As Me - Prompt Documents" folder

## 💡 Examples

### Making AI More Formal
```
YOUR COMMUNICATION STYLE:
- Always use full sentences, no fragments
- Address recipients by title and last name
- Include formal greetings: "Dear Mr./Ms. [Last Name]"
- Close with: "Sincerely," or "Best regards,"
- Avoid contractions (use "cannot" not "can't")
```

### Adding Company Signature
```
SIGNATURE REQUIREMENTS:
- Include full name and title
- Add company name and department
- Include phone and email
- Add legal disclaimer if required
- Format:
  
  Best regards,
  {{userName}}
  [Title] | [Company]
  [Phone] | [Email]
```

### Industry-Specific Responses
```
RESPONSE PATTERNS FOR TECH INDUSTRY:
- Acknowledge technical challenges upfront
- Provide estimated timelines in sprints
- Reference relevant documentation/tickets
- Use agile terminology appropriately
- Include next steps and dependencies
```

## 🚀 Power User Tips

1. **Backup Your Prompts**: Download Google Docs periodically
2. **Share Templates**: Export and share successful prompts with team
3. **A/B Testing**: Create version variations to test effectiveness
4. **Conditional Logic**: Use instructions like "If client, then..."
5. **Multilingual**: Add language-specific sections for international comms

## 📈 Monitoring & Optimization

1. **Track Performance**: Note which prompts generate best responses
2. **Iterate Frequently**: Small improvements compound over time
3. **User Feedback**: Adjust based on recipient responses
4. **Context Awareness**: Add more specific scenarios as you discover them

## 🎉 Summary

The prompt editor gives you **complete control** over your AI assistant's behavior while maintaining:
- **DRY principles** - Single source of truth
- **Persistence** - Survives app resets
- **Flexibility** - Edit without coding
- **Version control** - Track changes over time
- **Immediate updates** - No deployment needed

Your prompts are your AI's personality - craft them thoughtfully!