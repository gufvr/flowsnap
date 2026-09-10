import { describe, expect, it } from 'vitest';
import { validateExtensionPackageEntries } from './verify-extension-package.mjs';

function validEntries() {
  const manifest = {
    manifest_version: 3,
    name: 'FlowSnap',
    version: '0.5.0',
    background: { service_worker: 'assets/background.js' },
    side_panel: { default_path: 'index.html' },
    action: {
      default_icon: { 16: 'icons/icon-16.png' },
    },
    icons: { 128: 'icons/icon-128.png' },
  };

  return new Map([
    ['manifest.json', Buffer.from(JSON.stringify(manifest))],
    [
      'index.html',
      Buffer.from(
        '<script type="module" src="/assets/sidePanel.js"></script>' +
          '<link rel="stylesheet" href="/assets/sidePanel.css">',
      ),
    ],
    ['assets/background.js', Buffer.from('')],
    ['assets/recorder.js', Buffer.from('')],
    ['assets/sidePanel.js', Buffer.from('')],
    ['assets/sidePanel.css', Buffer.from('')],
    [
      'privacy.html',
      Buffer.from(
        '<link rel="stylesheet" href="privacy.css">' +
          '<img src="icons/icon-128.png" alt="">',
      ),
    ],
    ['privacy.css', Buffer.from('')],
    ['icons/icon-16.png', Buffer.from('')],
    ['icons/icon-128.png', Buffer.from('')],
  ]);
}

describe('extension package verification', () => {
  it('accepts a root manifest and complete local references', () => {
    expect(validateExtensionPackageEntries(validEntries())).toEqual({
      files: 10,
      manifestVersion: '0.5.0',
    });
  });

  it('rejects a missing or nested manifest', () => {
    const missingManifest = validEntries();
    missingManifest.delete('manifest.json');
    expect(() => validateExtensionPackageEntries(missingManifest)).toThrow(
      'package is missing manifest.json at the ZIP root',
    );

    const nestedManifest = validEntries();
    nestedManifest.set(
      'dist/manifest.json',
      nestedManifest.get('manifest.json'),
    );
    nestedManifest.delete('manifest.json');
    expect(() => validateExtensionPackageEntries(nestedManifest)).toThrow(
      'manifest.json must be at the ZIP root, not inside dist/',
    );
  });

  it('rejects missing essential and manifest-referenced files', () => {
    const missingRecorder = validEntries();
    missingRecorder.delete('assets/recorder.js');
    expect(() => validateExtensionPackageEntries(missingRecorder)).toThrow(
      'package is missing assets/recorder.js',
    );

    const missingIcon = validEntries();
    missingIcon.delete('icons/icon-128.png');
    expect(() => validateExtensionPackageEntries(missingIcon)).toThrow(
      'package is missing icons/icon-128.png referenced by manifest.json',
    );

    const missingPolicy = validEntries();
    missingPolicy.delete('privacy.html');
    expect(() => validateExtensionPackageEntries(missingPolicy)).toThrow(
      'package is missing privacy.html referenced by FlowSnap package requirements',
    );
  });

  it('rejects broken local references from the side panel HTML', () => {
    const entries = validEntries();
    entries.delete('assets/sidePanel.css');

    expect(() => validateExtensionPackageEntries(entries)).toThrow(
      'package is missing assets/sidePanel.css referenced by index.html',
    );
  });

  it('rejects broken local references from the privacy policy HTML', () => {
    const entries = validEntries();
    entries.delete('privacy.css');

    expect(() => validateExtensionPackageEntries(entries)).toThrow(
      'package is missing privacy.css referenced by privacy.html',
    );
  });
});
