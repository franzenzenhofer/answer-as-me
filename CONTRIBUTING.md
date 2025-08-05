# Contributing to Answer As Me

Thank you for your interest in contributing to Answer As Me! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Use issue templates when available
3. Include:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Submitting Pull Requests

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/answer-as-me.git
   cd answer-as-me
   npm install
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Make Changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Follow conventional commits
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add response length customization
fix: handle undefined email context
docs: update API key setup instructions
```

## Development Setup

### Prerequisites
- Node.js 18+
- npm 8+
- Google account with Gmail access

### Local Development
```bash
# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Deploy to your Google account
npm run push
```

### Project Structure
```
src/
├── modules/        # TypeScript modules
├── Code.ts        # Entry points
└── appsscript.json # Manifest

tests/             # Test files
dist/              # Build output
```

### Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Aim for high code coverage
- Test in actual Gmail environment when possible

### Code Style

- TypeScript with strict mode
- ESLint for linting
- Namespaces for module organization
- Clear, descriptive variable names
- Comments for complex logic

## Areas for Contribution

### High Priority
- [ ] Custom add-on icon design
- [ ] Additional unit tests
- [ ] Performance optimizations
- [ ] Error handling improvements

### Feature Ideas
- [ ] Multiple language support
- [ ] Custom prompt templates
- [ ] Batch email processing
- [ ] Analytics dashboard

### Documentation
- [ ] Video tutorials
- [ ] API examples
- [ ] Troubleshooting guide expansion

## Review Process

1. Automated checks (tests, linting)
2. Code review by maintainers
3. Testing in Gmail environment
4. Merge when approved

## Questions?

- Open an issue for questions
- Check existing documentation
- Review CLAUDE.md for technical details

Thank you for contributing! 🎉