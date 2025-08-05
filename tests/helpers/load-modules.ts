// Helper to load modules with namespaces for testing
import { readFileSync } from 'fs';
import { join } from 'path';

declare const global: any;

// Function to execute module code in global context
export function loadModule(moduleName: string): void {
  const modulePath = join(__dirname, '../../dist/src/modules', `${moduleName}.js`);
  try {
    const moduleCode = readFileSync(modulePath, 'utf8');
    // Execute in global context to make namespaces available
    eval.call(global, moduleCode);
  } catch (error) {
    console.error(`Failed to load module ${moduleName}:`, error);
    throw error;
  }
}

// Load all modules in dependency order
export function loadAllModules(): void {
  const modules = [
    'types',
    'config', 
    'logger',
    'utils',
    'style-analyzer',
    'ai',
    'ui',
    'error-handling',
    'response-generator',
    'context-extractor',
    'gmail',
    'entry-points',
    'action-handlers'
  ];

  modules.forEach(module => loadModule(module));
}