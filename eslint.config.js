const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  {
    files: ['src/**/*.ts'],
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'tests/**'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        // Google Apps Script globals
        GoogleAppsScript: 'readonly',
        Session: 'readonly',
        PropertiesService: 'readonly',
        DocumentApp: 'readonly',
        DriveApp: 'readonly',
        GmailApp: 'readonly',
        MailApp: 'readonly',
        CardService: 'readonly',
        UrlFetchApp: 'readonly',
        Utilities: 'readonly',
        Logger: 'readonly',
        HtmlService: 'readonly',
        ScriptApp: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'import': importPlugin,
      'prettier': prettierPlugin
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for Google Apps Script compatibility
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_|^[A-Z][A-Za-z]+$' // Ignore namespace-like variables
      }],
      
      // General code quality
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      
      // Import rules
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        'alphabetize': { 'order': 'asc' }
      }],
      'import/no-duplicates': 'error',
      
      // Code style
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'max-len': ['error', { 
        code: 120,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }],
      'indent': ['error', 2],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      
      // Best practices
      'no-throw-literal': 'error',
      'no-return-await': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-unused-expressions': 'error',
      'no-useless-concat': 'error',
      'prefer-template': 'error',
      'no-nested-ternary': 'error',
      
      // Namespace specific (for Google Apps Script)
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-function': 'off'
    }
  },
  {
    files: ['tests/**/*.ts', 'tests/**/*.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  }
];