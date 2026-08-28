import { mkdir, rm, writeFile } from 'node:fs/promises';
import { cwd } from 'node:process';
import { resolve, sep } from 'node:path';
import { generateCypressTest } from '../src/shared/cypress/generateCypressTest';
import { generatePlaywrightTest } from '../src/shared/playwright/generatePlaywrightTest';
import { recordedFlow } from '../tests/export-validation/recordedFlow';

const validationRoot = resolve(cwd(), 'test-results', 'export-validation');
const generatedRoot = resolve(validationRoot, 'generated');
const playwrightDirectory = resolve(generatedRoot, 'playwright');
const cypressDirectory = resolve(generatedRoot, 'cypress');

if (!generatedRoot.startsWith(`${validationRoot}${sep}`)) {
  throw new Error('FlowSnap: diretório gerado fora da validação de exportação');
}

function requireFullySupported(
  framework: string,
  result: {
    code: string;
    totalSteps: number;
    supportedSteps: number;
    unsupportedSteps: number;
  },
) {
  if (
    result.supportedSteps !== result.totalSteps ||
    result.unsupportedSteps !== 0 ||
    result.code.includes('TODO FlowSnap')
  ) {
    throw new Error(
      `FlowSnap: ${framework} gerou ${result.supportedSteps}/${result.totalSteps} passos suportados`,
    );
  }

  return `${result.code}\n`;
}

const playwrightCode = requireFullySupported(
  'Playwright',
  generatePlaywrightTest(recordedFlow),
);
const cypressCode = requireFullySupported(
  'Cypress',
  generateCypressTest(recordedFlow),
);

await rm(generatedRoot, { recursive: true, force: true });
await mkdir(playwrightDirectory, { recursive: true });
await mkdir(cypressDirectory, { recursive: true });
await writeFile(
  resolve(playwrightDirectory, 'recorded-flow.pw.ts'),
  playwrightCode,
  'utf8',
);
await writeFile(
  resolve(cypressDirectory, 'recorded-flow.cy.ts'),
  cypressCode,
  'utf8',
);

console.log(
  `FlowSnap: generated ${recordedFlow.length} supported steps for Playwright and Cypress.`,
);
