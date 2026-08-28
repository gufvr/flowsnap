import { mkdir, rm, writeFile } from 'node:fs/promises';
import { cwd } from 'node:process';
import { resolve, sep } from 'node:path';
import { generateCypressTest } from '../src/shared/cypress/generateCypressTest';
import { generatePlaywrightTest } from '../src/shared/playwright/generatePlaywrightTest';
import { exportValidationFlows } from '../tests/export-validation/recordedFlow';

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

const generatedFlows = exportValidationFlows.map(({ name, steps }) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`FlowSnap: nome de fluxo inválido: ${name}`);
  }

  return {
    name,
    steps: steps.length,
    playwrightCode: requireFullySupported(
      `Playwright (${name})`,
      generatePlaywrightTest(steps),
    ),
    cypressCode: requireFullySupported(
      `Cypress (${name})`,
      generateCypressTest(steps),
    ),
  };
});
const uniqueNames = new Set(generatedFlows.map(({ name }) => name));
if (uniqueNames.size !== generatedFlows.length) {
  throw new Error('FlowSnap: nomes duplicados na validação de exportação');
}

await rm(generatedRoot, { recursive: true, force: true });
await mkdir(playwrightDirectory, { recursive: true });
await mkdir(cypressDirectory, { recursive: true });
await Promise.all(
  generatedFlows.flatMap(({ name, playwrightCode, cypressCode }) => [
    writeFile(
      resolve(playwrightDirectory, `${name}.pw.ts`),
      playwrightCode,
      'utf8',
    ),
    writeFile(
      resolve(cypressDirectory, `${name}.cy.ts`),
      cypressCode,
      'utf8',
    ),
  ]),
);

const totalSteps = generatedFlows.reduce((total, flow) => total + flow.steps, 0);
console.log(
  `FlowSnap: generated ${generatedFlows.length} flows with ${totalSteps} supported steps for Playwright and Cypress.`,
);
