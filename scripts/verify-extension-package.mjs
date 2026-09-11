import { readFile } from 'node:fs/promises';
import { posix } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const MAX_ZIP_COMMENT_LENGTH = 0xffff;

const REQUIRED_PACKAGE_FILES = [
  'manifest.json',
  'assets/recorder.js',
  'privacy.html',
];

function normalizeArchivePath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function findEndOfCentralDirectory(archive) {
  const earliestOffset = Math.max(
    0,
    archive.length - 22 - MAX_ZIP_COMMENT_LENGTH,
  );

  for (let offset = archive.length - 22; offset >= earliestOffset; offset -= 1) {
    if (archive.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  throw new Error('StepScript: invalid ZIP; central directory was not found.');
}

function extractEntry(archive, centralOffset) {
  if (archive.readUInt32LE(centralOffset) !== CENTRAL_DIRECTORY_SIGNATURE) {
    throw new Error('StepScript: invalid ZIP central directory entry.');
  }

  const flags = archive.readUInt16LE(centralOffset + 8);
  const compressionMethod = archive.readUInt16LE(centralOffset + 10);
  const compressedSize = archive.readUInt32LE(centralOffset + 20);
  const uncompressedSize = archive.readUInt32LE(centralOffset + 24);
  const fileNameLength = archive.readUInt16LE(centralOffset + 28);
  const extraLength = archive.readUInt16LE(centralOffset + 30);
  const commentLength = archive.readUInt16LE(centralOffset + 32);
  const localHeaderOffset = archive.readUInt32LE(centralOffset + 42);
  const fileNameStart = centralOffset + 46;
  const fileNameEnd = fileNameStart + fileNameLength;
  const name = normalizeArchivePath(
    archive.subarray(fileNameStart, fileNameEnd).toString('utf8'),
  );

  if ((flags & 0x1) !== 0) {
    throw new Error(`StepScript: encrypted ZIP entry is not supported: ${name}`);
  }
  if (archive.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error(`StepScript: invalid local ZIP header: ${name}`);
  }

  const localFileNameLength = archive.readUInt16LE(localHeaderOffset + 26);
  const localExtraLength = archive.readUInt16LE(localHeaderOffset + 28);
  const dataStart =
    localHeaderOffset + 30 + localFileNameLength + localExtraLength;
  const compressed = archive.subarray(dataStart, dataStart + compressedSize);
  let contents;

  if (compressionMethod === 0) {
    contents = compressed;
  } else if (compressionMethod === 8) {
    contents = inflateRawSync(compressed);
  } else {
    throw new Error(
      `StepScript: unsupported ZIP compression method ${compressionMethod}: ${name}`,
    );
  }

  if (contents.length !== uncompressedSize) {
    throw new Error(`StepScript: invalid uncompressed size for ZIP entry: ${name}`);
  }

  return {
    name,
    contents,
    nextOffset: fileNameEnd + extraLength + commentLength,
  };
}

export function readZipEntries(archive) {
  const endOffset = findEndOfCentralDirectory(archive);
  const entryCount = archive.readUInt16LE(endOffset + 10);
  const centralDirectoryOffset = archive.readUInt32LE(endOffset + 16);

  if (entryCount === 0xffff || centralDirectoryOffset === 0xffffffff) {
    throw new Error('StepScript: ZIP64 packages are not supported.');
  }

  const entries = new Map();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    const entry = extractEntry(archive, offset);
    offset = entry.nextOffset;

    if (!entry.name || entry.name.endsWith('/')) continue;
    if (
      entry.name.startsWith('/') ||
      entry.name === '..' ||
      entry.name.startsWith('../') ||
      entry.name.includes('/../')
    ) {
      throw new Error(`StepScript: unsafe ZIP entry path: ${entry.name}`);
    }
    if (entries.has(entry.name)) {
      throw new Error(`StepScript: duplicate ZIP entry: ${entry.name}`);
    }

    entries.set(entry.name, entry.contents);
  }

  return entries;
}

function requireStringPath(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`StepScript: manifest reference is invalid: ${field}`);
  }

  const normalized = normalizeArchivePath(value.replace(/^\//, ''));
  if (normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`StepScript: manifest reference escapes the package: ${field}`);
  }

  return normalized;
}

function addIconReferences(references, icons, field) {
  if (!icons || typeof icons !== 'object' || Array.isArray(icons)) return;

  for (const [size, value] of Object.entries(icons)) {
    references.add(requireStringPath(value, `${field}.${size}`));
  }
}

function collectManifestReferences(manifest) {
  const references = new Set();

  if (manifest.background?.service_worker) {
    references.add(
      requireStringPath(
        manifest.background.service_worker,
        'background.service_worker',
      ),
    );
  }
  if (manifest.side_panel?.default_path) {
    references.add(
      requireStringPath(manifest.side_panel.default_path, 'side_panel.default_path'),
    );
  }
  if (manifest.action?.default_popup) {
    references.add(
      requireStringPath(manifest.action.default_popup, 'action.default_popup'),
    );
  }
  if (manifest.options_page) {
    references.add(requireStringPath(manifest.options_page, 'options_page'));
  }
  if (manifest.options_ui?.page) {
    references.add(requireStringPath(manifest.options_ui.page, 'options_ui.page'));
  }

  addIconReferences(references, manifest.icons, 'icons');
  addIconReferences(references, manifest.action?.default_icon, 'action.default_icon');

  return references;
}

function isLocalHtmlReference(value) {
  return (
    value &&
    !value.startsWith('#') &&
    !value.startsWith('//') &&
    !/^[a-z][a-z\d+.-]*:/i.test(value)
  );
}

function resolveHtmlReference(documentPath, value) {
  const withoutSuffix = value.split(/[?#]/, 1)[0];
  let decoded;

  try {
    decoded = decodeURIComponent(withoutSuffix);
  } catch {
    throw new Error(`StepScript: invalid encoded HTML reference: ${value}`);
  }

  const resolved = decoded.startsWith('/')
    ? posix.normalize(decoded.slice(1))
    : posix.normalize(posix.join(posix.dirname(documentPath), decoded));

  if (!resolved || resolved === '..' || resolved.startsWith('../')) {
    throw new Error(`StepScript: HTML reference escapes the package: ${value}`);
  }

  return resolved;
}

function collectHtmlReferences(documentPath, html) {
  const references = new Set();
  const attributePattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;

  for (const match of html.matchAll(attributePattern)) {
    const value = match[1]?.trim();
    if (!isLocalHtmlReference(value)) continue;
    references.add(resolveHtmlReference(documentPath, value));
  }

  return references;
}

function requireEntry(entries, path, source) {
  if (!entries.has(path)) {
    throw new Error(`StepScript: package is missing ${path} referenced by ${source}.`);
  }
}

export function validateExtensionPackageEntries(entries) {
  if (entries.has('dist/manifest.json')) {
    throw new Error(
      'StepScript: manifest.json must be at the ZIP root, not inside dist/.',
    );
  }
  if (!entries.has('manifest.json')) {
    throw new Error('StepScript: package is missing manifest.json at the ZIP root.');
  }

  let manifest;
  try {
    manifest = JSON.parse(entries.get('manifest.json').toString('utf8'));
  } catch {
    throw new Error('StepScript: package manifest.json is not valid JSON.');
  }

  if (manifest.manifest_version !== 3) {
    throw new Error('StepScript: package must use manifest_version 3.');
  }

  for (const path of REQUIRED_PACKAGE_FILES) {
    requireEntry(entries, path, 'StepScript package requirements');
  }

  const manifestReferences = collectManifestReferences(manifest);
  for (const path of manifestReferences) {
    requireEntry(entries, path, 'manifest.json');
  }

  const htmlDocuments = [
    ...new Set(
      [...manifestReferences, ...REQUIRED_PACKAGE_FILES].filter((path) =>
        path.toLowerCase().endsWith('.html'),
      ),
    ),
  ];
  for (const documentPath of htmlDocuments) {
    const html = entries.get(documentPath).toString('utf8');
    for (const path of collectHtmlReferences(documentPath, html)) {
      requireEntry(entries, path, documentPath);
    }
  }

  return {
    files: entries.size,
    manifestVersion: manifest.version,
  };
}

export async function verifyExtensionPackage(archivePath) {
  const archive = await readFile(archivePath);
  const result = validateExtensionPackageEntries(readZipEntries(archive));
  console.log(
    `Verified ${archivePath} with ${result.files} files and manifest version ${result.manifestVersion}.`,
  );
  return result;
}
