import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { generatePlaywrightTest } from './generatePlaywrightTest';

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

describe('generatePlaywrightTest', () => {
  it('generates executable commands for the supported actions in order', () => {
    const steps = [
      {
        schemaVersion: 4,
        type: 'click',
        url: 'https://example.com/start',
        selectors: selector('role', 'button:Entrar', {
          role: 'button',
          name: 'Entrar',
        }),
        description: description('click', 'Clicou em Entrar'),
      },
      {
        schemaVersion: 5,
        type: 'field-fill',
        url: 'https://example.com/start',
        selectors: selector('label', 'Username'),
        value: { kind: 'plain', value: 'tester' },
        description: description('fieldFill', 'Preencheu Username'),
      },
      {
        schemaVersion: 6,
        type: 'selection-change',
        url: 'https://example.com/start',
        selectors: selector('id', 'remember'),
        control: { kind: 'checkbox', checked: false },
        description: description('selectionChange', 'Desmarcou Remember me'),
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
        selectors: selector('testId', 'country', {
          attribute: 'data-testid',
        }),
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
        schemaVersion: 6,
        type: 'key-press',
        url: 'https://example.com/start',
        selectors: selector('text', 'Continuar'),
        key: 'Enter',
        modifiers: { shift: true },
        description: description('keyPress', 'Pressionou Shift+Enter'),
      },
      {
        schemaVersion: 4,
        type: 'focus-navigation',
        url: 'https://example.com/start',
        direction: 'backward',
        selectors: selector('label', 'Password'),
        description: description('focusNavigation', 'Navegou para Password'),
      },
      {
        schemaVersion: 9,
        type: 'navigation',
        fromUrl: 'https://example.com/start',
        toUrl: 'https://example.com/account',
        trigger: 'history-api',
        description: {
          action: 'navigation',
          text: 'Navegou para account',
          locale: 'pt-BR',
        },
      },
      {
        schemaVersion: 10,
        type: 'navigation',
        fromUrl: 'https://example.com/account',
        toUrl: 'https://example.com/account',
        trigger: 'reload',
        description: {
          action: 'navigation',
          text: 'Recarregou account',
          locale: 'pt-BR',
        },
      },
      {
        type: 'click',
        url: 'https://example.com/account',
        selector: { css: 'a.logout' },
        element: { tagName: 'a', text: 'Sair' },
      },
    ];
    const originalSteps = structuredClone(steps);

    const result = generatePlaywrightTest(steps);

    expect(result).toMatchObject({
      totalSteps: 11,
      supportedSteps: 11,
      unsupportedSteps: 0,
    });
    expect(result.code).toContain(
      'await page.goto("https://example.com/start");',
    );
    expect(result.code).toContain(
      'await page.getByRole("button", { name: "Entrar", exact: true }).click();',
    );
    expect(result.code).toContain(
      'await page.getByLabel("Username", { exact: true }).fill("tester");',
    );
    expect(result.code).toContain(
      'await page.locator("[id=\\"remember\\"]").setChecked(false);',
    );
    expect(result.code).toContain('.setChecked(true);');
    expect(result.code).toContain('.selectOption("BR");');
    expect(result.code).toContain('.selectOption(["js", "py"]);');
    expect(result.code).toContain('.press("Shift+Enter");');
    expect(result.code).toContain('page.keyboard.press("Shift+Tab");');
    expect(result.code).toContain(
      'page.waitForURL("https://example.com/account");',
    );
    expect(result.code).toContain('await page.reload();');
    expect(result.code).toContain('await page.locator("a.logout").click();');
    expect(result.code).not.toContain('TODO FlowSnap');
    expect(steps).toEqual(originalSteps);
  });

  it('exports range and color through the native setter and compatible events', () => {
    const result = generatePlaywrightTest([
      {
        schemaVersion: 7,
        type: 'range-change',
        url: 'https://example.com/controls',
        selectors: selector('testId', 'experience-range', {
          attribute: 'data-testid',
        }),
        value: { kind: 'plain', value: '13' },
        description: description('rangeChange', 'Ajustou Experience para 13'),
      },
      {
        schemaVersion: 8,
        type: 'color-change',
        url: 'https://example.com/controls',
        selectors: selector('label', 'Color Picker'),
        value: { kind: 'plain', value: '#7571c1' },
        description: description('colorChange', 'Selecionou a cor #7571c1'),
      },
    ]);

    expect(result).toMatchObject({
      totalSteps: 2,
      supportedSteps: 2,
      unsupportedSteps: 0,
    });
    expect(result.code).toContain(
      'import { test, type Locator } from "@playwright/test";',
    );
    expect(result.code.match(/async function setNativeInputValue/g)).toHaveLength(1);
    expect(result.code).toContain(
      'Object.getOwnPropertyDescriptor(\n        HTMLInputElement.prototype,',
    );
    expect(result.code).toContain(
      'element.dispatchEvent(new Event("input", { bubbles: true }));',
    );
    expect(result.code).toContain(
      'element.dispatchEvent(new Event("change", { bubbles: true }));',
    );
    expect(result.code).toContain(
      'await setNativeInputValue(page.getByTestId("experience-range"), "13", "range");',
    );
    expect(result.code).toContain(
      'await setNativeInputValue(page.getByLabel("Color Picker", { exact: true }), "#7571c1", "color");',
    );

    const transpiled = ts.transpileModule(result.code, {
      compilerOptions: { module: ts.ModuleKind.ESNext },
      reportDiagnostics: true,
    });
    expect(transpiled.diagnostics).toEqual([]);
  });

  it('never exports protected or truncated contents and marks unsupported steps', () => {
    const protectedRangeValue = {
      kind: 'protected',
      reason: 'secret',
    };
    Object.defineProperty(protectedRangeValue, 'value', {
      get() {
        throw new Error('Protected range value must not be read');
      },
    });
    const steps = [
      {
        schemaVersion: 5,
        type: 'field-fill',
        url: 'https://example.com',
        selectors: selector('label', 'Password'),
        value: {
          kind: 'protected',
          reason: 'password',
          value: 'never-export-this-secret',
        },
        descriptionOverride: {
          text: 'Senha never-export-this-secret',
          locale: 'pt-BR',
        },
      },
      {
        schemaVersion: 5,
        type: 'field-fill',
        url: 'https://example.com',
        selectors: selector('label', 'Biography'),
        value: {
          kind: 'plain',
          value: 'never-export-this-truncated-value',
          truncated: true,
        },
        descriptionOverride: {
          text: 'Texto never-export-this-truncated-value',
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
          selection: {
            kind: 'protected',
            reason: 'secret',
            options: [{ value: 'never-export-this-option' }],
          },
        },
        descriptionOverride: {
          text: 'Opção never-export-this-option',
          locale: 'pt-BR',
        },
      },
      {
        schemaVersion: 7,
        type: 'range-change',
        url: 'https://example.com',
        value: protectedRangeValue,
        descriptionOverride: {
          text: 'Range never-export-this-range',
          locale: 'pt-BR',
        },
      },
      {
        schemaVersion: 8,
        type: 'color-change',
        url: 'https://example.com',
        value: {
          kind: 'plain',
          value: 'never-export-this-color',
          truncated: true,
        },
        descriptionOverride: {
          text: 'Cor never-export-this-color',
          locale: 'pt-BR',
        },
      },
      {
        schemaVersion: 4,
        type: 'click',
        url: 'https://example.com',
      },
      { corrupted: true },
    ];

    const result = generatePlaywrightTest(steps);

    expect(result).toMatchObject({
      totalSteps: 7,
      supportedSteps: 0,
      unsupportedSteps: 7,
    });
    expect(result.code).not.toContain('never-export-this');
    expect(result.code).toContain('Preencheu um campo com valor protegido');
    expect(result.code).toContain('Preenchimento com valor truncado');
    expect(result.code).toContain('Selecionou um valor protegido');
    expect(result.code).toContain(
      'Ajustou um controle range para um valor protegido',
    );
    expect(result.code).toContain('Selecionou um valor de cor truncado');
    expect(result.code.match(/TODO FlowSnap/g)).toHaveLength(7);
  });

  it('marks malformed native values and missing selectors as TODO', () => {
    const result = generatePlaywrightTest([
      {
        type: 'range-change',
        url: 'https://example.com',
        selectors: selector('testId', 'range'),
        value: { kind: 'plain', value: 'not-a-number' },
      },
      {
        type: 'color-change',
        url: 'https://example.com',
        selectors: selector('testId', 'color'),
        value: { kind: 'plain', value: '#abcd' },
      },
      {
        type: 'range-change',
        url: 'https://example.com',
        value: { kind: 'plain', value: '7' },
      },
    ]);

    expect(result).toMatchObject({
      totalSteps: 3,
      supportedSteps: 0,
      unsupportedSteps: 3,
    });
    expect(result.code).toContain('valor do controle range inválido');
    expect(result.code).toContain('valor do seletor de cor inválido');
    expect(result.code).toContain(
      'seletor recomendado indisponível para este controle range',
    );
    expect(result.code).not.toContain('type Locator');
    expect(result.code).not.toContain('async function setNativeInputValue');
  });

  it('uses the current order, edited descriptions and a safe initial fallback', () => {
    const first = {
      schemaVersion: 4,
      type: 'click',
      selectors: selector('css', 'button.first'),
      descriptionOverride: { text: 'Primeiro editado', locale: 'pt-BR' },
    };
    const second = {
      schemaVersion: 4,
      type: 'click',
      selectors: selector('css', 'button.second'),
      descriptionOverride: { text: 'Segundo editado', locale: 'pt-BR' },
    };

    const result = generatePlaywrightTest([second, first]);

    expect(result.code).toContain(
      '// TODO FlowSnap: defina a URL inicial antes de executar o teste.',
    );
    expect(result.code.indexOf('Passo 1: Segundo editado')).toBeLessThan(
      result.code.indexOf('Passo 2: Primeiro editado'),
    );
  });

  it('produces syntactically valid TypeScript without resolving Playwright', () => {
    const result = generatePlaywrightTest([
      {
        schemaVersion: 4,
        type: 'click',
        url: 'https://example.com',
        selectors: selector('text', 'Salvar'),
      },
    ]);
    const transpiled = ts.transpileModule(result.code, {
      compilerOptions: { module: ts.ModuleKind.ESNext },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics).toEqual([]);
  });
});
