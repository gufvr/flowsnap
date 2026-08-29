import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..', '..');
const validationResults = resolve(
  projectRoot,
  'test-results',
  'extension-e2e',
);

export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: '*.e2e.ts',
  outputDir: resolve(validationResults, 'playwright-artifacts'),
  reporter: 'line',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run serve:test:extension',
    cwd: projectRoot,
    url: 'http://127.0.0.1:4175/start.html',
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
