import { spawn } from 'node:child_process';
import process, { cwd, env, execPath } from 'node:process';
import { resolve } from 'node:path';

const childEnvironment = { ...env };
delete childEnvironment.ELECTRON_RUN_AS_NODE;

const cypressBinary = resolve(cwd(), 'node_modules', 'cypress', 'bin', 'cypress');
const child = spawn(
  execPath,
  [
    cypressBinary,
    'run',
    '--browser',
    'electron',
    '--config-file',
    'tests/export-validation/cypress.config.ts',
  ],
  {
    cwd: cwd(),
    env: childEnvironment,
    stdio: 'inherit',
  },
);

child.on('error', (error) => {
  console.error('FlowSnap: não foi possível iniciar o Cypress.', error);
  process.exitCode = 1;
});

child.on('close', (code) => {
  process.exitCode = code ?? 1;
});
