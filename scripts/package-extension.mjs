import { rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import zip from 'bestzip';
import { verifyExtensionPackage } from './verify-extension-package.mjs';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptsDirectory, '..');
const distDirectory = resolve(projectRoot, 'dist');
const archivePath = resolve(projectRoot, 'stepscript-extension.zip');

await rm(archivePath, { force: true });
await zip({
  source: '*',
  destination: archivePath,
  cwd: distDirectory,
});
await verifyExtensionPackage(archivePath);
