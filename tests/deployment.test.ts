/**
 * Deployment Pipeline Tests
 * Minimal tests to ensure the deployment pipeline can run
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Deployment Pipeline', () => {
  const rootDir = path.join(__dirname, '..');

  it('should have a valid package.json', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.name).toBe('answer-as-me');
    expect(pkg.scripts.deploy).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });

  it('should have deployment scripts', () => {
    expect(fs.existsSync(path.join(rootDir, 'deploy-strict.sh'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'bundle.js'))).toBe(true);
  });

  it('should have CI/CD configuration', () => {
    expect(fs.existsSync(path.join(rootDir, '.github/workflows/ci.yml'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'eslint.config.js'))).toBe(true);
  });

  it('should have test scripts', () => {
    expect(fs.existsSync(path.join(rootDir, 'tests/scripts/test-post-bundle.js'))).toBe(true);
  });
});