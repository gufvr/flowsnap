import { describe, expect, it } from 'vitest';
import { generateCypressTest } from '../cypress/generateCypressTest';
import { generatePlaywrightTest } from '../playwright/generatePlaywrightTest';
import type { RecordedElementTextAssertion } from '../recordingTypes';
import { resolveRecommendedSelector } from '../selectors/resolveRecommendedSelector';
import { createElementTextAssertionDescription } from './createElementTextAssertionDescription';
import { resolveStepDescription } from './resolveStepDescription';

function createAssertion(): RecordedElementTextAssertion {
  const selectors = {
    recommended: {
      strategy: 'testId' as const,
      attribute: 'data-testid' as const,
      value: 'order-status',
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
  const element = { tagName: 'p', text: 'Pedido aprovado' };

  return {
    schemaVersion: 13,
    id: 'text-order-status',
    type: 'assertion',
    url: 'https://example.com/order',
    timestamp: 1,
    assertion: {
      kind: 'element',
      operator: 'text-equals',
      expected: 'Pedido aprovado',
    },
    selectors,
    element,
    description: createElementTextAssertionDescription({
      selectors,
      element,
      expectedText: 'Pedido aprovado',
    }),
  };
}

describe('schema 13 exact element text assertions', () => {
  it('creates and resolves a semantic persisted description', () => {
    const assertion = createAssertion();

    expect(assertion.description).toEqual({
      action: 'elementTextAssertion',
      target: { type: 'element', name: 'Pedido aprovado' },
      source: 'text',
      text: 'Verificou que o elemento "Pedido aprovado" tem o texto exato "Pedido aprovado"',
      locale: 'pt-BR',
    });
    expect(resolveStepDescription(assertion)).toEqual(assertion.description);
    expect(resolveRecommendedSelector(assertion)).toEqual({
      strategy: 'testId',
      attribute: 'data-testid',
      value: 'order-status',
    });
  });

  it('rebuilds incomplete schema 13 descriptions without migrating storage', () => {
    const incomplete: Partial<RecordedElementTextAssertion> = {
      ...createAssertion(),
    };
    delete incomplete.description;

    expect(resolveStepDescription(incomplete).text).toBe(
      'Verificou que o elemento "Pedido aprovado" tem o texto exato "Pedido aprovado"',
    );
  });

  it('keeps schema 13 as a safe TODO in both generators', () => {
    const assertion = {
      ...createAssertion(),
      assertion: {
        kind: 'element' as const,
        operator: 'text-equals' as const,
        expected: 'segredo-nao-exportavel',
      },
      descriptionOverride: {
        text: 'descrição-não-exportável',
        locale: 'pt-BR' as const,
      },
    };
    const playwright = generatePlaywrightTest([assertion]);
    const cypress = generateCypressTest([assertion]);

    for (const result of [playwright, cypress]) {
      expect(result.supportedSteps).toBe(0);
      expect(result.unsupportedSteps).toBe(1);
      expect(result.code).toContain(
        'TODO FlowSnap: a exportação de verificações de texto exato ainda não é suportada.',
      );
      expect(result.code).toContain(
        '// Passo 1: Verificou o texto exato de um elemento',
      );
      expect(result.code).not.toContain('segredo-nao-exportavel');
      expect(result.code).not.toContain('descrição-não-exportável');
    }
  });
});
