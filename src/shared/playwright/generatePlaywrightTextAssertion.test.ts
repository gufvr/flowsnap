import { describe, expect, it } from 'vitest';
import { generatePlaywrightTest } from './generatePlaywrightTest';

function validatedSelector(strategy = 'testId', value = 'order-status') {
  return {
    recommended: {
      strategy,
      ...(strategy === 'testId' ? { attribute: 'data-testid' } : {}),
      value,
      score: 100,
      isUnique: true,
      validation: {
        status: 'valid',
        matchCount: 1,
        matchesTarget: true,
      },
    },
    alternatives: [],
  };
}

function textAssertion(expected: string) {
  return {
    schemaVersion: 13,
    id: 'text-order-status',
    type: 'assertion',
    url: 'https://example.com/order',
    timestamp: 1,
    assertion: {
      kind: 'element',
      operator: 'text-equals',
      expected,
    },
    selectors: validatedSelector(),
    element: { tagName: 'p', text: 'Este texto não deve ser exportado' },
    descriptionOverride: {
      text: 'Validou o status humano',
      locale: 'pt-BR',
    },
  };
}

describe('Playwright schema 13 exact text assertions', () => {
  it('exports only assertion.expected with visible exact-text semantics', () => {
    const expected = 'Pedido "aprovado" \\ agora';
    const result = generatePlaywrightTest([textAssertion(expected)]);

    expect(result).toMatchObject({
      totalSteps: 1,
      supportedSteps: 1,
      unsupportedSteps: 0,
    });
    expect(result.code).toContain(
      'import { test, expect } from "@playwright/test";',
    );
    expect(result.code).toContain('// Passo 1: Validou o status humano');
    expect(result.code).toContain(
      `await expect(page.getByTestId("order-status")).toHaveText(${JSON.stringify(expected)}, { useInnerText: true });`,
    );
    expect(result.code).not.toContain('Este texto não deve ser exportado');
    expect(result.code).not.toContain('TODO FlowSnap');
  });

  it('accepts the persisted 200-character boundary without truncating it', () => {
    const expected = 'x'.repeat(200);
    const result = generatePlaywrightTest([textAssertion(expected)]);

    expect(result.supportedSteps).toBe(1);
    expect(result.code).toContain(JSON.stringify(expected));
    expect(result.code).toContain('{ useInnerText: true }');
  });

  it('combines expect and Locator imports when native input helpers are required', () => {
    const result = generatePlaywrightTest([
      {
        schemaVersion: 7,
        type: 'range-change',
        url: 'https://example.com/order',
        selectors: validatedSelector('testId', 'experience'),
        value: { kind: 'plain', value: '13' },
      },
      textAssertion('Pedido aprovado'),
    ]);

    expect(result.code).toContain(
      'import { test, expect, type Locator } from "@playwright/test";',
    );
    expect(result).toMatchObject({
      totalSteps: 2,
      supportedSteps: 2,
      unsupportedSteps: 0,
    });
  });

  it('keeps incomplete, invalid and ambiguous assertions as safe TODOs', () => {
    const base = textAssertion('segredo-valido');
    const validAssertion = base.assertion;
    const validSelectors = base.selectors;
    const invalidSteps = [
      { ...base, assertion: undefined },
      { ...base, assertion: { ...validAssertion, kind: 'url' } },
      { ...base, assertion: { ...validAssertion, operator: 'contains' } },
      { ...base, assertion: { ...validAssertion, expected: undefined } },
      { ...base, assertion: { ...validAssertion, expected: '' } },
      { ...base, assertion: { ...validAssertion, expected: ' segredo-inicial' } },
      { ...base, assertion: { ...validAssertion, expected: 'segredo  duplicado' } },
      { ...base, assertion: { ...validAssertion, expected: 's'.repeat(201) } },
      { ...base, selectors: undefined },
      {
        ...base,
        selectors: {
          ...validSelectors,
          recommended: { ...validSelectors.recommended, isUnique: false },
        },
      },
      {
        ...base,
        selectors: {
          ...validSelectors,
          recommended: {
            ...validSelectors.recommended,
            validation: {
              status: 'ambiguous',
              matchCount: 2,
              matchesTarget: true,
            },
          },
        },
      },
      {
        ...base,
        selectors: {
          ...validSelectors,
          recommended: {
            ...validSelectors.recommended,
            validation: {
              status: 'valid',
              matchCount: 1,
              matchesTarget: false,
            },
          },
        },
      },
      { ...base, selectors: validatedSelector('unsupported', 'segredo-seletor') },
    ];
    const result = generatePlaywrightTest(invalidSteps);

    expect(result).toMatchObject({
      totalSteps: invalidSteps.length,
      supportedSteps: 0,
      unsupportedSteps: invalidSteps.length,
    });
    expect(result.code.match(/TODO FlowSnap/g)).toHaveLength(invalidSteps.length);
    expect(
      result.code.match(/verificação de texto exato incompleta ou inválida/g),
    ).toHaveLength(invalidSteps.length);
    expect(
      result.code.match(
        /Verificou o texto exato de um elemento inválido ou incompleto/g,
      ),
    ).toHaveLength(invalidSteps.length);
    expect(result.code).not.toContain('segredo');
    expect(result.code).not.toContain('Validou o status humano');
    expect(result.code).not.toContain('toHaveText');
    expect(result.code).toContain('import { test } from "@playwright/test";');
    expect(result.code).not.toContain('import { test, expect }');
  });
});
