import { describe, expect, it } from 'vitest';
import { generateCypressTest } from './generateCypressTest';

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

describe('Cypress schema 13 exact text assertions', () => {
  it('exports only assertion.expected with retryable visible-text semantics', () => {
    const expected = 'Pedido "aprovado" \\ agora';
    const result = generateCypressTest([textAssertion(expected)]);

    expect(result).toMatchObject({
      totalSteps: 1,
      supportedSteps: 1,
      unsupportedSteps: 0,
    });
    expect(result.code).toContain('// Passo 1: Validou o status humano');
    expect(result.code).toContain(
      'function normalizeVisibleText(element: HTMLElement)',
    );
    expect(result.code).toContain(
      'return element.innerText.replace(/\\s+/g, " ").trim();',
    );
    expect(result.code).toContain(
      'cy.get("[data-testid=\\"order-status\\"]").should(($elements) => {',
    );
    expect(result.code).toContain(
      `expect(normalizeVisibleText($elements[0])).to.eq(\n        ${JSON.stringify(expected)},`,
    );
    expect(result.code).not.toContain('Este texto não deve ser exportado');
    expect(result.code).not.toContain('TODO StepScript');
    expect(result.code.match(/function normalizeVisibleText/g)).toHaveLength(1);
  });

  it('accepts the 200-character boundary and propagates the label helper', () => {
    const expected = 'x'.repeat(200);
    const assertion = {
      ...textAssertion(expected),
      selectors: validatedSelector('label', 'Order status'),
    };
    const result = generateCypressTest([assertion]);

    expect(result.supportedSteps).toBe(1);
    expect(result.code).toContain('function getByLabel(label: RegExp)');
    expect(result.code).toContain(
      'getByLabel(new RegExp("^Order status$")).should(($elements) => {',
    );
    expect(result.code).toContain(JSON.stringify(expected));
  });

  it('combines visible-text and native-input helpers without duplication', () => {
    const result = generateCypressTest([
      {
        schemaVersion: 7,
        type: 'range-change',
        url: 'https://example.com/order',
        selectors: validatedSelector('testId', 'experience'),
        value: { kind: 'plain', value: '13' },
      },
      textAssertion('Pedido aprovado'),
      textAssertion('Pedido aprovado novamente'),
    ]);

    expect(result).toMatchObject({
      totalSteps: 3,
      supportedSteps: 3,
      unsupportedSteps: 0,
    });
    expect(result.code.match(/function setNativeInputValue/g)).toHaveLength(1);
    expect(result.code.match(/function normalizeVisibleText/g)).toHaveLength(1);
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
    const result = generateCypressTest(invalidSteps);

    expect(result).toMatchObject({
      totalSteps: invalidSteps.length,
      supportedSteps: 0,
      unsupportedSteps: invalidSteps.length,
    });
    expect(result.code.match(/TODO StepScript/g)).toHaveLength(invalidSteps.length);
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
    expect(result.code).not.toContain('normalizeVisibleText');
    expect(result.code).not.toContain('.should(($elements)');
  });
});
