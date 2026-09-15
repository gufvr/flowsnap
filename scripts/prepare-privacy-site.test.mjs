import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  preparePrivacySite,
  PRIVACY_SITE_FILES,
  EXPECTED_PUBLIC_PRIVACY_POLICY_URL,
  LEGACY_PUBLIC_PRIVACY_POLICY_URL,
  validatePrivacyDocumentation,
  validatePrivacyPolicyHtml,
} from './prepare-privacy-site.mjs';

const projectRoot = resolve(import.meta.dirname, '..');

async function loadSources() {
  const [policy, configurationText, dashboard] = await Promise.all([
    readFile(resolve(projectRoot, 'public', 'privacy.html'), 'utf8'),
    readFile(resolve(projectRoot, 'privacy-policy.json'), 'utf8'),
    readFile(
      resolve(projectRoot, 'docs', 'chrome-web-store-privacy.md'),
      'utf8',
    ),
  ]);

  return {
    policy,
    configuration: JSON.parse(configurationText),
    dashboard,
  };
}

describe('privacy policy site', () => {
  it('validates the canonical source and dashboard documentation', async () => {
    const { policy, configuration, dashboard } = await loadSources();

    expect(() => validatePrivacyPolicyHtml(policy, configuration)).not.toThrow();
    expect(() =>
      validatePrivacyDocumentation(dashboard, configuration),
    ).not.toThrow();
  });

  it('rejects an insecure URL, missing disclosure, and divergent documentation', async () => {
    const { policy, configuration, dashboard } = await loadSources();

    expect(() =>
      validatePrivacyPolicyHtml(policy, {
        ...configuration,
        publicUrl: configuration.publicUrl.replace('https:', 'http:'),
      }),
    ).toThrow('must use HTTPS');
    expect(configuration.publicUrl).toBe(EXPECTED_PUBLIC_PRIVACY_POLICY_URL);
    expect(() =>
      validatePrivacyPolicyHtml(policy, {
        ...configuration,
        publicUrl: LEGACY_PUBLIC_PRIVACY_POLICY_URL,
      }),
    ).toThrow('canonical StepScript URL');
    expect(() =>
      validatePrivacyPolicyHtml(policy.replace('GitHub Pages', 'public host'), configuration),
    ).toThrow('GitHub Pages');
    expect(() =>
      validatePrivacyDocumentation(
        dashboard.replace(configuration.publicUrl, 'https://example.com/privacy'),
        configuration,
      ),
    ).toThrow('does not use the public policy URL');
    expect(() =>
      validatePrivacyDocumentation(
        `${dashboard}\n${LEGACY_PUBLIC_PRIVACY_POLICY_URL}`,
        configuration,
      ),
    ).toThrow('legacy public privacy URL');
    expect(() =>
      validatePrivacyPolicyHtml(
        policy.replace('StepScript is a Chrome extension', 'FlowSnap is a Chrome extension'),
        configuration,
      ),
    ).toThrow('legacy product name');
    expect(() =>
      validatePrivacyDocumentation(
        dashboard.replace('StepScript', 'FlowSnap'),
        configuration,
      ),
    ).toThrow('legacy product name');
  });

  it('builds a minimal site from the exact packaged policy source', async () => {
    const { policy } = await loadSources();
    const result = await preparePrivacySite();

    expect(result.files).toEqual(PRIVACY_SITE_FILES);
    await expect(
      readFile(resolve(result.outputRoot, 'privacy.html'), 'utf8'),
    ).resolves.toBe(policy);
    await expect(
      readFile(resolve(result.outputRoot, 'index.html'), 'utf8'),
    ).resolves.toBe(policy);
    await expect(
      stat(resolve(result.outputRoot, '.nojekyll')),
    ).resolves.toMatchObject({ size: 0 });
  });

  it('keeps the GitHub Pages workflow manual and scoped to the generated artifact', async () => {
    const workflow = await readFile(
      resolve(projectRoot, '.github', 'workflows', 'publish-privacy-policy.yml'),
      'utf8',
    );

    expect(workflow).toMatch(/^on:\s*\n\s+workflow_dispatch:\s*$/m);
    expect(workflow).not.toMatch(/^\s+push:/m);
    expect(workflow).toContain('node scripts/prepare-privacy-site.mjs');
    expect(workflow).toContain('path: test-results/privacy-site');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
  });
});
