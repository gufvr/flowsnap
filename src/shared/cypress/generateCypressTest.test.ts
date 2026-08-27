import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { generateCypressTest } from './generateCypressTest';

function selector(strategy: string, value: string, extra = {}) {
  return {
    recommended: { strategy, value, ...extra },
    alternatives: [],
  };
}

function description(action: string, text: string) {
  return {
    action,
    target: { type: 'element', name: 'Alvo' },
    source: 'text',
    text,
    locale: 'pt-BR',
  };
}

describe('generateCypressTest', () => {
  it('generates common Cypress actions in the persisted order', () => {
    const steps = [
      {
        schemaVersion: 4,
        type: 'click',
        url: 'https://example.com/start',
        selectors: selector('testId', 'login', {
          attribute: 'data-testid',
        }),
        description: description('click', 'Clicou em Login'),
      },
      {
        schemaVersion: 5,
        type: 'field-fill',
        url: 'https://example.com/start',
        selectors: selector('label', 'Username'),
        value: { kind: 'plain', value: 'tester{enter}' },
        description: description('fieldFill', 'Preencheu Username'),
      },
      {
        schemaVersion: 5,
        type: 'field-fill',
        url: 'https://example.com/start',
        selectors: selector('id', 'nickname'),
        value: { kind: 'plain', value: '' },
        description: description('fieldFill', 'Limpou Nickname'),
      },
      {
        schemaVersion: 6,
        type: 'selection-change',
        url: 'https://example.com/start',
        selectors: selector('id', 'remember'),
        control: { kind: 'checkbox', checked: false },
        description: description('selectionChange', 'Desmarcou Remember'),
      },
      {
        schemaVersion: 6,
        type: 'selection-change',
        url: 'https://example.com/start',
        selectors: selector('label', 'Male'),
        control: { kind: 'radio', checked: true },
        description: description('selectionChange', 'Selecionou Male'),
      },
      {
        schemaVersion: 6,
        type: 'selection-change',
        url: 'https://example.com/start',
        selectors: selector('testId', 'country'),
        control: {
          kind: 'select',
          multiple: false,
          selection: {
            kind: 'plain',
            options: [{ value: 'BR', label: 'Brazil' }],
          },
        },
        description: description('selectionChange', 'Selecionou Brazil'),
      },
      {
        schemaVersion: 6,
        type: 'selection-change',
        url: 'https://example.com/start',
        selectors: selector('label', 'Languages'),
        control: {
          kind: 'select',
          multiple: true,
          selection: {
            kind: 'plain',
            options: [
              { value: 'js', label: 'JavaScript' },
              { value: 'py', label: 'Python' },
            ],
          },
        },
        description: description('selectionChange', 'Selecionou linguagens'),
      },
      {
        type: 'click',
        url: 'https://example.com/start',
        selector: { css: 'button.legacy' },
        element: { tagName: 'button' },
      },
    ];
    const originalSteps = structuredClone(steps);

    const result = generateCypressTest(steps);

    expect(result).toMatchObject({
      totalSteps: 8,
      supportedSteps: 8,
      unsupportedSteps: 0,
    });
    expect(result.code).toContain('cy.visit("https://example.com/start");');
    expect(result.code).toContain(
      'cy.get("[data-testid=\\"login\\"]").click();',
    );
    expect(result.code).toContain(
      'getByLabel(new RegExp("^Username$")).clear().type("tester{enter}", { parseSpecialCharSequences: false });',
    );
    expect(result.code).toContain(
      'cy.get("[id=\\"nickname\\"]").clear();',
    );
    expect(result.code).toContain('.uncheck();');
    expect(result.code).toContain('.check();');
    expect(result.code).toContain('.select("BR");');
    expect(result.code).toContain('.select(["js", "py"]);');
    expect(result.code).toContain('cy.get("button.legacy").click();');
    expect(result.code.match(/function getByLabel/g)).toHaveLength(1);
    expect(result.code).not.toContain('TODO FlowSnap');
    expect(steps).toEqual(originalSteps);
  });

  it('never exports protected or truncated contents', () => {
    const protectedValue = { kind: 'protected', reason: 'password' };
    Object.defineProperty(protectedValue, 'value', {
      get() {
        throw new Error('Protected value must not be read');
      },
    });
    const result = generateCypressTest([
      {
        schemaVersion: 5,
        type: 'field-fill',
        url: 'https://example.com',
        value: protectedValue,
        descriptionOverride: {
          text: 'Senha never-export-this',
          locale: 'pt-BR',
        },
      },
      {
        schemaVersion: 5,
        type: 'field-fill',
        url: 'https://example.com',
        value: {
          kind: 'plain',
          value: 'never-export-truncated',
          truncated: true,
        },
        descriptionOverride: {
          text: 'Texto never-export-truncated',
          locale: 'pt-BR',
        },
      },
      {
        schemaVersion: 6,
        type: 'selection-change',
        url: 'https://example.com',
        control: {
          kind: 'select',
          multiple: false,
          selection: { kind: 'protected', reason: 'secret' },
        },
        descriptionOverride: {
          text: 'Seleção never-export-option',
          locale: 'pt-BR',
        },
      },
    ]);

    expect(result).toMatchObject({
      totalSteps: 3,
      supportedSteps: 0,
      unsupportedSteps: 3,
    });
    expect(result.code).not.toContain('never-export');
    expect(result.code).toContain('Preencheu um campo com valor protegido');
    expect(result.code).toContain('Preenchimento com valor truncado');
    expect(result.code).toContain('Selecionou um valor protegido');
  });

  it('marks deferred and malformed actions without leaking sensitive values', () => {
    const protectedRange = { kind: 'protected', reason: 'secret' };
    Object.defineProperty(protectedRange, 'value', {
      get() {
        throw new Error('Protected range value must not be read');
      },
    });
    const result = generateCypressTest([
      { type: 'focus-navigation', url: 'https://example.com' },
      { type: 'key-press', url: 'https://example.com' },
      {
        type: 'navigation',
        fromUrl: 'https://example.com',
        toUrl: 'https://example.com/next',
      },
      {
        type: 'range-change',
        url: 'https://example.com',
        value: protectedRange,
        descriptionOverride: {
          text: 'Range never-export-range',
          locale: 'pt-BR',
        },
      },
      {
        type: 'color-change',
        url: 'https://example.com',
        value: {
          kind: 'plain',
          value: 'never-export-color',
          truncated: true,
        },
        descriptionOverride: {
          text: 'Cor never-export-color',
          locale: 'pt-BR',
        },
      },
      { corrupted: true },
    ]);

    expect(result).toMatchObject({
      totalSteps: 6,
      supportedSteps: 0,
      unsupportedSteps: 6,
    });
    expect(result.code).not.toContain('never-export');
    expect(result.code).toContain('Release 1B');
    expect(result.code).toContain('Release 1C');
    expect(result.code.match(/TODO FlowSnap/g)).toHaveLength(6);
  });

  it('uses edited descriptions, a safe URL fallback and valid TypeScript', () => {
    const result = generateCypressTest([
      {
        schemaVersion: 4,
        type: 'click',
        selectors: selector('css', 'button.save'),
        descriptionOverride: { text: 'Salvou o cadastro', locale: 'pt-BR' },
      },
    ]);

    expect(result.code).toContain('Passo 1: Salvou o cadastro');
    expect(result.code).toContain(
      'TODO FlowSnap: defina a URL inicial antes de executar o teste.',
    );
    const transpiled = ts.transpileModule(result.code, {
      compilerOptions: { module: ts.ModuleKind.ESNext },
      reportDiagnostics: true,
    });
    expect(transpiled.diagnostics).toEqual([]);
  });
});
