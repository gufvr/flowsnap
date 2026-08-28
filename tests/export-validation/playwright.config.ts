import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..', '..');
const validationResults = resolve(
  projectRoot,
  'test-results',
  'export-validation',
);

export default defineConfig({
  testDir: resolve(validationResults, 'generated', 'playwright'),
  testMatch: '*.pw.ts',
  outputDir: resolve(validationResults, 'playwright-artifacts'),
  reporter: 'line',
  fullyParallel: false,
  workers: 1,
  use: {
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run serve:test:exported',
    cwd: projectRoot,
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
