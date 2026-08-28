import { defineConfig } from 'cypress';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..', '..');
const validationResults = resolve(
  projectRoot,
  'test-results',
  'export-validation',
);

export default defineConfig({
  allowCypressEnv: false,
  video: false,
  screenshotsFolder: resolve(validationResults, 'cypress-screenshots'),
  downloadsFolder: resolve(validationResults, 'cypress-downloads'),
  e2e: {
    baseUrl: 'http://127.0.0.1:4174/',
    specPattern: resolve(
      validationResults,
      'generated',
      'cypress',
      '*.cy.ts',
    ),
    supportFile: false,
  },
});
