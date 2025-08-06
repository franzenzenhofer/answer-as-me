// Setup for loading compiled modules in tests
const fs = require('fs');
const path = require('path');

// Load a compiled module and make it available globally
function loadCompiledModule(moduleName) {
  const modulePath = path.join(__dirname, '../../dist/src/modules', `${moduleName}.js`);
  const moduleCode = fs.readFileSync(modulePath, 'utf8');
  
  // Execute in global context
  eval.call(global, moduleCode);
}

// Export for use in tests
module.exports = { loadCompiledModule };