import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import process, { cwd, env, execPath } from 'node:process';

const childEnvironment = { ...env };
delete childEnvironment.ELECTRON_RUN_AS_NODE;

const playwrightBinary = resolve(
  cwd(),
  'node_modules',
  '@playwright',
  'test',
  'cli.js',
);
const child = spawn(
  execPath,
  [
    playwrightBinary,
    'test',
    '--config',
    'tests/extension-e2e/playwright.config.ts',
  ],
  {
    cwd: cwd(),
    env: childEnvironment,
    stdio: 'inherit',
  },
);

child.on('error', (error) => {
  console.error(
    'FlowSnap: não foi possível iniciar o E2E da extensão.',
    error,
  );
  process.exitCode = 1;
});

child.on('close', (code) => {
  process.exitCode = code ?? 1;
});
