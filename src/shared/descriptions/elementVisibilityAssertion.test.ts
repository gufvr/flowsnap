import { describe, expect, it } from 'vitest';
import { generateCypressTest } from '../cypress/generateCypressTest';
import { generatePlaywrightTest } from '../playwright/generatePlaywrightTest';
import type { RecordedElementVisibilityAssertion } from '../recordingTypes';
import { createElementVisibilityAssertionDescription } from './createElementVisibilityAssertionDescription';
import { resolveStepDescription } from './resolveStepDescription';

function createAssertion(): RecordedElementVisibilityAssertion {
  const selectors = {
    recommended: {
      strategy: 'testId' as const,
      attribute: 'data-testid' as const,
      value: 'login-submit',
      score: 100,
      isUnique: true,
      validation: {
        status: 'valid' as const,
        matchCount: 1,
        matchesTarget: true,
      },
    },
    alternatives: [],
  };
  const element = { tagName: 'button', text: 'Entrar' };

  return {
    schemaVersion: 12,
    id: 'visibility-login',
    type: 'assertion',
    url: 'https://example.com/login',
    timestamp: 1,
    assertion: { kind: 'element', operator: 'visible' },
    selectors,
    element,
    description: createElementVisibilityAssertionDescription({ selectors, element }),
  };
}

describe('schema 12 element visibility assertions', () => {
  it('creates and resolves a semantic persisted description', () => {
    const assertion = createAssertion();

    expect(assertion.description).toEqual({
      action: 'elementVisibilityAssertion',
      target: { type: 'button', name: 'Entrar' },
      source: 'text',
      text: 'Verificou que o botão "Entrar" está visível',
      locale: 'pt-BR',
    });
    expect(resolveStepDescription(assertion)).toEqual(assertion.description);
  });

  it('rebuilds incomplete schema 12 descriptions without migrating storage', () => {
    const incomplete: Partial<RecordedElementVisibilityAssertion> = {
      ...createAssertion(),
    };
    delete incomplete.description;

    expect(resolveStepDescription(incomplete).text).toBe(
      'Verificou que o botão "Entrar" está visível',
    );
  });

  it('exports schema 12 only in Playwright and keeps Cypress as TODO', () => {
    const assertion = createAssertion();
    const playwright = generatePlaywrightTest([assertion]);
    const cypress = generateCypressTest([assertion]);

    expect(playwright.supportedSteps).toBe(1);
    expect(playwright.unsupportedSteps).toBe(0);
    expect(cypress.unsupportedSteps).toBe(1);
    expect(playwright.code).toContain(
      'await expect(page.getByTestId("login-submit")).toBeVisible();',
    );
    expect(cypress.code).toContain(
      'TODO FlowSnap: a exportação de verificações de visibilidade ainda não é suportada.',
    );
    expect(playwright.code).not.toContain('TODO FlowSnap');
    expect(cypress.code).not.toContain('be.visible');
  });
});
