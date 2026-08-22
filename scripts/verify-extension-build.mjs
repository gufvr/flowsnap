import { readFile } from 'node:fs/promises';

const recorderPath = new URL('../dist/assets/recorder.js', import.meta.url);
const recorderSource = await readFile(recorderPath, 'utf8');
const staticModuleSyntax = /(^|[;\n])\s*(?:import|export)\b/m;
const dynamicImport = /\bimport\s*\(/;

if (staticModuleSyntax.test(recorderSource) || dynamicImport.test(recorderSource)) {
  throw new Error(
    'assets/recorder.js must be a self-contained classic script without imports.',
  );
}

console.log('Verified assets/recorder.js as a self-contained classic script.');
