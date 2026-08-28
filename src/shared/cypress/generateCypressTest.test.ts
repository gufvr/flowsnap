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

  it('exports forward Tab and unmodified interaction keys with native Cypress presses', () => {
    const keys = [
      ['Enter', 'ENTER'],
      ['Space', 'SPACE'],
      ['Escape', 'ESC'],
      ['ArrowUp', 'UP'],
      ['ArrowDown', 'DOWN'],
      ['ArrowLeft', 'LEFT'],
      ['ArrowRight', 'RIGHT'],
    ];
    const result = generateCypressTest([
      {
        schemaVersion: 4,
        type: 'focus-navigation',
        url: 'https://example.com',
        direction: 'forward',
        selectors: selector('label', 'Password'),
      },
      {
        schemaVersion: 4,
        type: 'focus-navigation',
        url: 'https://example.com',
        direction: 'backward',
        selectors: selector('label', 'Username'),
      },
      ...keys.map(([key], index) => ({
        schemaVersion: 6,
        type: 'key-press',
        url: 'https://example.com',
        key,
        selectors: selector('testId', `control-${index}`),
      })),
      {
        schemaVersion: 6,
        type: 'key-press',
        url: 'https://example.com',
        key: 'Enter',
        modifiers: { shift: true },
        selectors: selector('testId', 'shifted-control'),
      },
    ]);

    expect(result).toMatchObject({
      totalSteps: 10,
      supportedSteps: 8,
      unsupportedSteps: 2,
    });
    expect(result.code).toContain('// Requer Cypress 15.3+ para cy.press().');
    expect(result.code).toContain('cy.press(Cypress.Keyboard.Keys.TAB);');
    expect(result.code).toContain(
      'getByLabel(new RegExp("^Password$")).should("have.focus");',
    );
    keys.forEach(([, constant], index) => {
      expect(result.code).toContain(
        `cy.get("[data-testid=\\"control-${index}\\"]").focus();`,
      );
      expect(result.code).toContain(
        `cy.press(Cypress.Keyboard.Keys.${constant});`,
      );
    });
    expect(result.code).toContain(
      'TODO FlowSnap: Shift+Tab ainda não pode ser reproduzido',
    );
    expect(result.code).toContain(
      'TODO FlowSnap: teclas com Shift ainda não podem ser reproduzidas',
    );
  });

  it('exports navigation outcomes without repeating a supported causal action', () => {
    const result = generateCypressTest([
      {
        schemaVersion: 4,
        type: 'click',
        url: 'https://example.com/start',
        selectors: selector('testId', 'open-forms'),
      },
      {
        schemaVersion: 9,
        type: 'navigation',
        fromUrl: 'https://example.com/start',
        toUrl: 'https://example.com/#forms',
        trigger: 'fragment',
      },
      {
        schemaVersion: 4,
        type: 'click',
        url: 'https://example.com/#forms',
      },
      {
        schemaVersion: 10,
        type: 'navigation',
        fromUrl: 'https://example.com/#forms',
        toUrl: 'https://example.com/account',
        trigger: 'document',
      },
      {
        schemaVersion: 6,
        type: 'key-press',
        url: 'https://example.com/account',
        key: 'Enter',
        selectors: selector('testId', 'reload-account'),
      },
      {
        schemaVersion: 10,
        type: 'navigation',
        fromUrl: 'https://example.com/account',
        toUrl: 'https://example.com/account',
        trigger: 'reload',
      },
      {
        schemaVersion: 10,
        type: 'navigation',
        fromUrl: 'https://example.com/account',
        toUrl: 'https://example.com/account',
        trigger: 'reload',
      },
      {
        schemaVersion: 9,
        type: 'navigation',
        fromUrl: 'https://example.com/account',
        toUrl: 'https://example.com/previous',
        trigger: 'history-traversal',
      },
    ]);

    expect(result).toMatchObject({
      totalSteps: 8,
      supportedSteps: 7,
      unsupportedSteps: 1,
    });
    expect(result.code).toContain(
      'cy.url().should("eq", "https://example.com/#forms");',
    );
    expect(result.code).not.toContain(
      'cy.visit("https://example.com/#forms");',
    );
    expect(result.code).toContain('cy.visit("https://example.com/account");');
    expect(result.code).toContain(
      '// FlowSnap: recarregamento produzido pelo passo anterior.',
    );
    expect(result.code).toContain(
      'cy.url().should("eq", "https://example.com/account");',
    );
    expect(result.code).toContain('cy.reload();');
    expect(result.code).toContain(
      '// FlowSnap: direção do histórico não persistida; reproduzindo o destino diretamente.',
    );
    expect(result.code).toContain('cy.visit("https://example.com/previous");');
  });

  it('exports range and color through one native input helper', () => {
    const result = generateCypressTest([
      {
        schemaVersion: 7,
        type: 'range-change',
        url: 'https://example.com/selection',
        selectors: selector('testId', 'experience-range'),
        value: { kind: 'plain', value: '13' },
        description: description('rangeChange', 'Ajustou Experience para 13'),
      },
      {
        schemaVersion: 8,
        type: 'color-change',
        url: 'https://example.com/selection',
        selectors: selector('label', 'Color Picker'),
        value: { kind: 'plain', value: '#7571c1' },
        description: description('colorChange', 'Selecionou #7571c1'),
      },
    ]);

    expect(result).toMatchObject({
      totalSteps: 2,
      supportedSteps: 2,
      unsupportedSteps: 0,
    });
    expect(result.code.match(/function setNativeInputValue/g)).toHaveLength(1);
    expect(result.code).toContain(
      'setNativeInputValue(cy.get("[data-testid=\\"experience-range\\"]"), "13", "range");',
    );
    expect(result.code).toContain(
      'setNativeInputValue(getByLabel(new RegExp("^Color Picker$")), "#7571c1", "color");',
    );
    expect(result.code).toContain('InputConstructor.prototype,');
    expect(result.code).toContain('.trigger("input")');
    expect(result.code).toContain('.trigger("change");');
    expect(result.code.indexOf('.trigger("input")')).toBeLessThan(
      result.code.indexOf('.trigger("change")'),
    );
    expect(result.code).not.toContain('Release 1C');
    expect(result.code).not.toContain('TODO FlowSnap');

    const transpiled = ts.transpileModule(result.code, {
      compilerOptions: { module: ts.ModuleKind.ESNext },
      reportDiagnostics: true,
    });
    expect(transpiled.diagnostics).toEqual([]);
  });

  it('keeps invalid native input changes as TODO without adding the helper', () => {
    const result = generateCypressTest([
      {
        schemaVersion: 7,
        type: 'range-change',
        url: 'https://example.com',
        selectors: selector('testId', 'empty-range'),
        value: { kind: 'plain', value: ' ' },
      },
      {
        schemaVersion: 7,
        type: 'range-change',
        url: 'https://example.com',
        selectors: selector('testId', 'invalid-range'),
        value: { kind: 'plain', value: 'Infinity' },
      },
      {
        schemaVersion: 8,
        type: 'color-change',
        url: 'https://example.com',
        selectors: selector('testId', 'invalid-color'),
        value: { kind: 'plain', value: '#fff' },
      },
      {
        schemaVersion: 8,
        type: 'color-change',
        url: 'https://example.com',
        value: { kind: 'plain', value: '#abcdef' },
      },
    ]);

    expect(result).toMatchObject({
      totalSteps: 4,
      supportedSteps: 0,
      unsupportedSteps: 4,
    });
    expect(result.code).not.toContain('function setNativeInputValue');
    expect(result.code.match(/TODO FlowSnap/g)).toHaveLength(4);
    expect(result.code).toContain('valor do controle range inválido');
    expect(result.code).toContain('valor do seletor de cor inválido');
    expect(result.code).toContain(
      'seletor compatível com Cypress indisponível para este seletor de cor',
    );
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

  it('marks protected native inputs and malformed actions without leaking values', () => {
    const protectedRange = { kind: 'protected', reason: 'secret' };
    Object.defineProperty(protectedRange, 'value', {
      get() {
        throw new Error('Protected range value must not be read');
      },
    });
    const truncatedColor = { kind: 'plain', truncated: true };
    Object.defineProperty(truncatedColor, 'value', {
      get() {
        throw new Error('Truncated color value must not be read');
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
        value: truncatedColor,
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
    expect(result.code).toContain(
      'TODO FlowSnap: direção da navegação por Tab indisponível.',
    );
    expect(result.code).toContain(
      'TODO FlowSnap: tecla de interação não reconhecida.',
    );
    expect(result.code).toContain(
      'TODO FlowSnap: origem da navegação não reconhecida.',
    );
    expect(result.code).toContain(
      'TODO FlowSnap: informe o valor protegido do controle range manualmente',
    );
    expect(result.code).toContain(
      'TODO FlowSnap: o valor gravado do seletor de cor foi truncado',
    );
    expect(result.code).not.toContain('function setNativeInputValue');
    expect(result.code).not.toContain('Release 1C');
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
