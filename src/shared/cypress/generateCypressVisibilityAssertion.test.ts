import { describe, expect, it } from 'vitest';
import { generateCypressTest } from './generateCypressTest';

function selector(strategy: string, value: string, extra = {}) {
  return {
    recommended: { strategy, value, ...extra },
    alternatives: [],
  };
}

function validatedSelector(strategy = 'testId', value = 'visible-target') {
  return selector(strategy, value, {
    ...(strategy === 'testId' ? { attribute: 'data-testid' } : {}),
    score: 100,
    isUnique: true,
    validation: {
      status: 'valid',
      matchCount: 1,
      matchesTarget: true,
    },
  });
}

describe('generateCypressTest visibility assertions', () => {
  it('exports validated schema 12 visibility assertions with their recommended selectors', () => {
    const result = generateCypressTest([
      {
        schemaVersion: 12,
        type: 'assertion',
        url: 'https://example.com/account',
        assertion: { kind: 'element', operator: 'visible' },
        selectors: validatedSelector('testId', 'account-title'),
        descriptionOverride: {
          text: 'Confirmou a área da conta',
          locale: 'pt-BR',
        },
      },
      {
        schemaVersion: 12,
        type: 'assertion',
        url: 'https://example.com/account',
        assertion: { kind: 'element', operator: 'visible' },
        selectors: validatedSelector('label', 'Account status'),
      },
    ]);

    expect(result).toMatchObject({
      totalSteps: 2,
      supportedSteps: 2,
      unsupportedSteps: 0,
    });
    expect(result.code).toContain('// Passo 1: Confirmou a área da conta');
    expect(result.code).toContain(
      'cy.get("[data-testid=\\"account-title\\"]").should("be.visible");',
    );
    expect(result.code).toContain(
      'getByLabel(new RegExp("^Account status$")).should("be.visible");',
    );
    expect(result.code.match(/function getByLabel/g)).toHaveLength(1);
    expect(result.code).not.toContain(
      'should("be.visible", "Confirmou a área da conta")',
    );
    expect(result.code).not.toContain('TODO FlowSnap');
  });

  it('keeps incomplete, invalid or ambiguous visibility assertions as safe TODOs', () => {
    const validAssertion = { kind: 'element', operator: 'visible' };
    const validSelectors = validatedSelector();
    const result = generateCypressTest([
      { schemaVersion: 12, type: 'assertion', selectors: validSelectors },
      {
        schemaVersion: 12,
        type: 'assertion',
        assertion: { ...validAssertion, kind: 'url' },
        selectors: validSelectors,
      },
      {
        schemaVersion: 12,
        type: 'assertion',
        assertion: { ...validAssertion, operator: 'hidden' },
        selectors: validSelectors,
      },
      {
        schemaVersion: 12,
        type: 'assertion',
        assertion: validAssertion,
      },
      {
        schemaVersion: 12,
        type: 'assertion',
        assertion: validAssertion,
        selectors: {
          recommended: {
            ...validSelectors.recommended,
            isUnique: false,
          },
          alternatives: [],
        },
      },
      {
        schemaVersion: 12,
        type: 'assertion',
        assertion: validAssertion,
        selectors: {
          recommended: {
            ...validSelectors.recommended,
            validation: {
              status: 'ambiguous',
              matchCount: 2,
              matchesTarget: true,
            },
          },
          alternatives: [],
        },
      },
      {
        schemaVersion: 12,
        type: 'assertion',
        assertion: validAssertion,
        selectors: {
          recommended: {
            ...validSelectors.recommended,
            validation: {
              status: 'valid',
              matchCount: 1,
              matchesTarget: false,
            },
          },
          alternatives: [],
        },
      },
      {
        schemaVersion: 12,
        type: 'assertion',
        assertion: validAssertion,
        selectors: validatedSelector('unsupported', 'never-export-selector'),
        descriptionOverride: {
          text: 'never-export-override',
          locale: 'pt-BR',
        },
      },
    ].map((step) => ({ url: 'https://example.com', ...step })));

    expect(result).toMatchObject({
      totalSteps: 8,
      supportedSteps: 0,
      unsupportedSteps: 8,
    });
    expect(result.code.match(/TODO FlowSnap/g)).toHaveLength(8);
    expect(result.code.match(/verificação de visibilidade incompleta ou inválida/g))
      .toHaveLength(3);
    expect(result.code.match(/seletor recomendado único e validado indisponível/g))
      .toHaveLength(4);
    expect(result.code).toContain(
      'seletor recomendado inválido para esta verificação de visibilidade',
    );
    expect(result.code.match(/Verificou a visibilidade de um elemento inválido ou incompleto/g))
      .toHaveLength(8);
    expect(result.code).not.toContain('never-export');
    expect(result.code).not.toContain('be.visible');
  });
});

