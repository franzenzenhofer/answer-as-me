#!/usr/bin/env node

/**
 * Troubleshooting script for Answer As Me
 * Helps diagnose common issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Answer As Me - Troubleshooting\n');

const checks = [
  {
    name: 'Node.js Version',
    check: () => {
      const version = process.version;
      const major = parseInt(version.split('.')[0].substring(1));
      return {
        status: major >= 18 ? '✅' : '❌',
        message: `Node.js ${version} (${major >= 18 ? 'OK' : 'Need 18+'})`
      };
    }
  },
  {
    name: 'Dependencies Installed',
    check: () => {
      const exists = fs.existsSync(path.join(__dirname, 'node_modules'));
      return {
        status: exists ? '✅' : '❌',
        message: exists ? 'node_modules found' : 'Run: npm install'
      };
    }
  },
  {
    name: 'Build Output',
    check: () => {
      const exists = fs.existsSync(path.join(__dirname, 'dist/Code.gs'));
      return {
        status: exists ? '✅' : '❌',
        message: exists ? 'Build found' : 'Run: npm run build'
      };
    }
  },
  {
    name: 'Clasp Installed',
    check: () => {
      try {
        execSync('npx clasp --version', { stdio: 'pipe' });
        return { status: '✅', message: 'Clasp available' };
      } catch {
        return { status: '❌', message: 'Clasp not found' };
      }
    }
  },
  {
    name: 'Clasp Login',
    check: () => {
      try {
        // Try to list projects as a way to check login
        execSync('npx clasp list', { stdio: 'pipe' });
        return {
          status: '✅',
          message: 'Logged in to Google'
        };
      } catch (error) {
        // Check if it's a login error specifically
        if (error.message.includes('logged in') || error.status === 1) {
          return { status: '❌', message: 'Run: npx clasp login' };
        }
        return { status: '✅', message: 'Logged in (no projects)' };
      }
    }
  },
  {
    name: 'Script Configuration',
    check: () => {
      const exists = fs.existsSync(path.join(__dirname, '.clasp.json'));
      if (!exists) return { status: '❌', message: '.clasp.json missing' };
      
      try {
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, '.clasp.json'), 'utf8'));
        return {
          status: '✅',
          message: `Script ID: ${config.scriptId.substring(0, 20)}...`
        };
      } catch {
        return { status: '❌', message: 'Invalid .clasp.json' };
      }
    }
  },
  {
    name: 'TypeScript Compilation',
    check: () => {
      try {
        execSync('npm run lint', { stdio: 'pipe' });
        return { status: '✅', message: 'No TypeScript errors' };
      } catch {
        return { status: '⚠️', message: 'TypeScript errors found' };
      }
    }
  }
];

console.log('Running checks...\n');

let hasErrors = false;

checks.forEach(({ name, check }) => {
  try {
    const { status, message } = check();
    console.log(`${status} ${name}`);
    console.log(`   ${message}\n`);
    if (status === '❌') hasErrors = true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}\n`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.log('❌ Some checks failed. Please fix the issues above.\n');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Your setup looks good.\n');
  console.log('Next steps:');
  console.log('1. Run: npm run push');
  console.log('2. Open Gmail and test the add-on');
  console.log('3. Check the deployment URL:\n');
  
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '.clasp.json'), 'utf8'));
    console.log(`   https://script.google.com/d/${config.scriptId}/edit\n`);
  } catch {
    console.log('   Run: npx clasp open\n');
  }
}