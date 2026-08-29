import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const buildDirectory = resolve(projectRoot, 'dist');
const extensionDirectory = resolve(
  projectRoot,
  'test-results',
  'extension-e2e',
  'unpacked',
);
const fixtureOriginPattern = 'http://127.0.0.1/*';

await rm(extensionDirectory, { recursive: true, force: true });
await mkdir(extensionDirectory, { recursive: true });
await cp(buildDirectory, extensionDirectory, { recursive: true });

const manifestPath = resolve(extensionDirectory, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<
  string,
  unknown
>;

manifest.host_permissions = [fixtureOriginPattern];
delete manifest.optional_host_permissions;

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(
  `Prepared the FlowSnap extension E2E build at ${extensionDirectory}.`,
);
