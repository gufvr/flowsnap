import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '..');

describe('visible StepScript branding', () => {
  it('uses StepScript in the extension manifest without changing its release contract', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(projectRoot, 'public/manifest.json'), 'utf8'),
    );

    expect(manifest).toMatchObject({
      name: 'StepScript',
      description:
        'Grave fluxos no navegador e transforme-os em testes automatizados.',
      version: '0.5.0',
      minimum_chrome_version: '116',
      action: { default_title: 'Abrir StepScript' },
    });
    expect(manifest.permissions).toEqual([
      'activeTab',
      'scripting',
      'sidePanel',
      'storage',
      'webNavigation',
    ]);
  });

  it('uses StepScript as the document title', () => {
    const html = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');

    expect(html).toContain('<title>StepScript</title>');
  });

  it('uses StepScript in the concise English README and package name', () => {
    const readme = readFileSync(resolve(projectRoot, 'README.md'), 'utf8');
    const packageScript = readFileSync(
      resolve(projectRoot, 'scripts/package-extension.mjs'),
      'utf8',
    );

    expect(readme).toContain('<h1 align="center">StepScript</h1>');
    expect(readme).toContain('## Core features');
    expect(readme).toContain('## Load the unpacked extension');
    expect(readme).toContain('`stepscript-extension.zip`');
    expect(readme).not.toMatch(/flowsnap/i);
    expect(packageScript).toContain("'stepscript-extension.zip'");
    expect(packageScript).not.toMatch(/flowsnap-extension\.zip/i);
  });
});
