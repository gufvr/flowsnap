import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptsDirectory, '..');
const outputRoot = resolve(projectRoot, 'test-results', 'privacy-site');
const sourcePaths = {
  policy: resolve(projectRoot, 'public', 'privacy.html'),
  styles: resolve(projectRoot, 'public', 'privacy.css'),
  icon: resolve(projectRoot, 'public', 'icons', 'icon-128.png'),
  configuration: resolve(projectRoot, 'privacy-policy.json'),
  dashboard: resolve(projectRoot, 'docs', 'chrome-web-store-privacy.md'),
};

export const PRIVACY_SITE_FILES = [
  '.nojekyll',
  'icons/icon-128.png',
  'index.html',
  'privacy.css',
  'privacy.html',
];

function assertSafeOutputPath(path) {
  const expectedParent = resolve(projectRoot, 'test-results');
  const pathFromParent = relative(expectedParent, path);

  if (
    !pathFromParent ||
    pathFromParent === '..' ||
    pathFromParent.startsWith(`..${sep}`) ||
    resolve(path) !== outputRoot
  ) {
    throw new Error('StepScript: privacy site output must use test-results/privacy-site.');
  }
}

export function validatePrivacyPolicyHtml(html, configuration) {
  const { effectiveDate, publicUrl } = configuration;
  let parsedUrl;

  try {
    parsedUrl = new URL(publicUrl);
  } catch {
    throw new Error('StepScript: the public privacy policy URL is invalid.');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('StepScript: the public privacy policy URL must use HTTPS.');
  }

  const requiredContent = [
    `<link\n      rel="canonical"\n      href="${publicUrl}"`,
    `<p>Effective date: ${effectiveDate}</p>`,
    'Chrome Web Store Limited Use',
    'GitHub Pages',
    'including the user\'s IP address',
    'href="privacy.css"',
    'src="icons/icon-128.png"',
  ];

  for (const content of requiredContent) {
    if (!html.includes(content)) {
      throw new Error(
        `StepScript: privacy policy is missing required content: ${content}`,
      );
    }
  }

  if (/<script\b/i.test(html)) {
    throw new Error('StepScript: the privacy policy must not contain scripts.');
  }
}

export function validatePrivacyDocumentation(markdown, configuration) {
  if (!markdown.includes(configuration.publicUrl)) {
    throw new Error(
      'StepScript: Privacy practices documentation does not use the public policy URL.',
    );
  }
  if (!markdown.includes('`public/privacy.html` is the only editable policy source.')) {
    throw new Error(
      'StepScript: Privacy practices documentation does not identify the canonical source.',
    );
  }
}

async function listFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath, base)));
    } else {
      files.push(relative(base, entryPath).replaceAll('\\', '/'));
    }
  }

  return files.sort();
}

export async function preparePrivacySite() {
  assertSafeOutputPath(outputRoot);

  const [policy, styles, configurationText, dashboard] = await Promise.all([
    readFile(sourcePaths.policy, 'utf8'),
    readFile(sourcePaths.styles, 'utf8'),
    readFile(sourcePaths.configuration, 'utf8'),
    readFile(sourcePaths.dashboard, 'utf8'),
  ]);
  const configuration = JSON.parse(configurationText);

  validatePrivacyPolicyHtml(policy, configuration);
  validatePrivacyDocumentation(dashboard, configuration);

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(resolve(outputRoot, 'icons'), { recursive: true });
  await Promise.all([
    writeFile(resolve(outputRoot, '.nojekyll'), ''),
    writeFile(resolve(outputRoot, 'index.html'), policy),
    writeFile(resolve(outputRoot, 'privacy.html'), policy),
    writeFile(resolve(outputRoot, 'privacy.css'), styles),
    copyFile(sourcePaths.icon, resolve(outputRoot, 'icons', 'icon-128.png')),
  ]);

  const files = await listFiles(outputRoot);
  if (JSON.stringify(files) !== JSON.stringify(PRIVACY_SITE_FILES)) {
    throw new Error(
      `StepScript: privacy site contains unexpected files: ${files.join(', ')}`,
    );
  }

  return { outputRoot, files, configuration };
}

const isDirectExecution =
  process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  const result = await preparePrivacySite();
  console.log(
    `Prepared the StepScript privacy site with ${result.files.length} files at ${result.outputRoot}.`,
  );
}
