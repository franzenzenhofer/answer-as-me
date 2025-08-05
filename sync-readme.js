#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function syncReadme() {
  const readmePath = path.join(__dirname, 'README.md');
  const distPath = path.join(__dirname, 'dist', 'README.md');
  
  if (fs.existsSync(readmePath)) {
    // Ensure dist directory exists
    const distDir = path.dirname(distPath);
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Copy README to dist
    fs.copyFileSync(readmePath, distPath);
    console.log('✅ README.md synced to dist/');
  } else {
    console.log('⚠️  No README.md found to sync');
  }
}

if (require.main === module) {
  syncReadme();
}

module.exports = { syncReadme };