# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Considerations

### API Key Security
- **Never** commit your Gemini API key to the repository
- API keys are stored locally using Google's PropertiesService
- Keys are only accessible to the authenticated user
- Always use environment variables for local development

### OAuth Scopes
This add-on requests the following permissions:
- Read Gmail messages (to analyze context)
- Compose and send emails (to create responses)
- Modify Gmail messages (to create drafts)
- External requests (to call Gemini API)

### Data Privacy
- Email content is sent to Google's Gemini API for processing
- No email data is stored permanently by the add-on
- Writing style analysis is cached locally per user
- All data transmission uses HTTPS

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to: franz.enzenhofer.ai@gmail.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

Response time: Within 48 hours

## Best Practices for Users

1. **API Key Management**
   - Generate API keys with minimal required permissions
   - Rotate keys regularly
   - Delete unused keys

2. **Add-on Permissions**
   - Review requested permissions before installation
   - Remove add-on access if no longer needed

3. **Email Content**
   - Be aware that email content is processed by AI
   - Avoid including sensitive information in generated responses
   - Always review AI-generated content before sending