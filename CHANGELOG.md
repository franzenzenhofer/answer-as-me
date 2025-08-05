# Changelog

All notable changes to Answer As Me will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-05

### Added
- Initial release of Answer As Me Gmail Add-on
- TypeScript to Google Apps Script build pipeline
- Modular architecture with 13 core modules
- Gemini 2.0 Flash API integration for fast responses
- Writing style analysis from 200 sent emails
- Context-aware email response generation
- Draft creation and management
- Settings persistence with PropertiesService
- Simplified UI following KISS principle
- Comprehensive error handling and logging
- Bundle creation process (60KB output)
- Jest testing framework
- ESLint configuration
- Production deployment scripts
- GitHub Actions CI/CD workflow

### Technical Details
- Target: ES5 for Google Apps Script compatibility
- No batching - direct analysis of 200 emails
- Whitespace trimming for clean email content
- Namespace-based module system
- Single file deployment (Code.gs)

### Documentation
- CLAUDE.md - Complete project documentation
- README.md - Setup and usage guide
- QUICKSTART.md - 5-minute getting started guide
- Inline code documentation

### Deployment
- Script ID: 1lBZGlPIg44JJB6h7OlYIvg1AUe8ACLNVda5kjoEsiVIqrnlf-eOqb872
- OAuth Scopes: Gmail read/modify, compose, send
- URL Fetch Whitelist: generativelanguage.googleapis.com

## [Unreleased]

### Planned
- Custom add-on icon
- Additional unit tests for better coverage
- Marketplace publishing preparation
- Performance optimizations
- More email style patterns recognition