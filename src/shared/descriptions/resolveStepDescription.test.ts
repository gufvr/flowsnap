import { describe, expect, it } from 'vitest';
import { resolveStepDescription } from './resolveStepDescription';

const validDescription = {
  action: 'click' as const,
  target: { type: 'button' as const, name: 'Entrar' },
  source: 'accessibleName' as const,
  text: 'Clicou no botão "Entrar"',
  locale: 'pt-BR' as const,
};

const validFocusNavigationDescription = {
  action: 'focusNavigation' as const,
  target: { type: 'field' as const, name: 'Password' },
  source: 'label' as const,
  text: 'Navegou para o campo "Password"',
  locale: 'pt-BR' as const,
};

describe('resolveStepDescription', () => {
  it('uses the persisted schema 4 description', () => {
    const step = {
      schemaVersion: 4,
      type: 'click',
      description: validDescription,
    };

    expect(resolveStepDescription(step)).toBe(validDescription);
  });

  it('uses a persisted schema 4 focus navigation description', () => {
    const step = {
      schemaVersion: 4,
      type: 'focus-navigation',
      description: validFocusNavigationDescription,
    };

    expect(resolveStepDescription(step)).toBe(validFocusNavigationDescription);
  });

  it('uses a persisted schema 5 field fill description', () => {
    const description = {
      action: 'fieldFill' as const,
      target: { type: 'field' as const, name: 'Username' },
      source: 'label' as const,
      text: 'Preencheu o campo "Username" com "tester"',
      locale: 'pt-BR' as const,
    };
    const step = {
      schemaVersion: 5,
      type: 'field-fill',
      description,
    };

    expect(resolveStepDescription(step)).toBe(description);
  });

  it('rebuilds incomplete schema 5 values conservatively', () => {
    const step = {
      schemaVersion: 5,
      type: 'field-fill',
      selectors: {
        recommended: {
          strategy: 'label',
          value: 'Password',
          score: 85,
          isUnique: true,
        },
        alternatives: [],
      },
      element: { tagName: 'input', inputType: 'password' },
      value: { corrupted: true },
    };

    expect(resolveStepDescription(step)).toMatchObject({
      action: 'fieldFill',
      text: 'Preencheu o campo "Password" com um valor protegido',
    });
    expect(step).not.toHaveProperty('description');
  });

  it('resolves schema 6 selection and key descriptions', () => {
    const selector = {
      recommended: {
        strategy: 'label',
        value: 'Remember me',
        score: 85,
        isUnique: true,
      },
      alternatives: [],
    };

    expect(
      resolveStepDescription({
        schemaVersion: 6,
        type: 'selection-change',
        selectors: selector,
        element: { tagName: 'input', inputType: 'checkbox' },
        control: { kind: 'checkbox', checked: true },
      }).text,
    ).toBe('Marcou a caixa de seleção "Remember me"');
    expect(
      resolveStepDescription({
        schemaVersion: 6,
        type: 'key-press',
        key: 'Enter',
        selectors: {
          recommended: {
            ...selector.recommended,
            strategy: 'role',
            value: 'button:Login',
            role: 'button',
            name: 'Login',
          },
          alternatives: [],
        },
        element: { tagName: 'button', text: 'Login' },
      }).text,
    ).toBe('Pressionou Enter no botão "Login"');
  });

  it('falls back safely for incomplete schema 6 records', () => {
    expect(
      resolveStepDescription({
        schemaVersion: 6,
        type: 'selection-change',
        control: { corrupted: true },
      }).text,
    ).toBe('Clicou em um elemento');
    expect(
      resolveStepDescription({
        schemaVersion: 6,
        type: 'key-press',
        key: 'F13',
      }).text,
    ).toBe('Clicou em um elemento');
  });

  it('uses and safely rebuilds schema 7 range descriptions', () => {
    const description = {
      action: 'rangeChange' as const,
      target: { type: 'field' as const, name: 'Experience' },
      source: 'label' as const,
      text: 'Ajustou o controle deslizante "Experience" para "7"',
      locale: 'pt-BR' as const,
    };

    expect(
      resolveStepDescription({
        schemaVersion: 7,
        type: 'range-change',
        description,
      }),
    ).toBe(description);

    expect(
      resolveStepDescription({
        schemaVersion: 7,
        type: 'range-change',
        selectors: {
          recommended: {
            strategy: 'label',
            value: 'Experience',
            isUnique: true,
          },
        },
        element: { tagName: 'input', inputType: 'range' },
        value: { corrupted: true },
      }).text,
    ).toBe(
      'Ajustou o controle deslizante "Experience" para um valor protegido',
    );
  });

  it('uses and safely rebuilds schema 8 color descriptions', () => {
    const description = {
      action: 'colorChange' as const,
      target: { type: 'field' as const, name: 'Color Picker' },
      source: 'label' as const,
      text: 'Selecionou a cor "#663399" no seletor de cor "Color Picker"',
      locale: 'pt-BR' as const,
    };

    expect(
      resolveStepDescription({
        schemaVersion: 8,
        type: 'color-change',
        description,
      }),
    ).toBe(description);

    expect(
      resolveStepDescription({
        schemaVersion: 8,
        type: 'color-change',
        selectors: {
          recommended: {
            strategy: 'label',
            value: 'Color Picker',
            isUnique: true,
          },
        },
        element: { tagName: 'input', inputType: 'color' },
        value: { corrupted: true },
      }).text,
    ).toBe('Selecionou um valor protegido no seletor de cor "Color Picker"');
  });

  it('uses and safely rebuilds schema 9 navigation descriptions', () => {
    const description = {
      action: 'navigation' as const,
      text: 'Navegou para "/#buttons"',
      locale: 'pt-BR' as const,
    };

    expect(
      resolveStepDescription({
        schemaVersion: 9,
        type: 'navigation',
        description,
      }),
    ).toBe(description);

    expect(
      resolveStepDescription({
        schemaVersion: 9,
        type: 'navigation',
        fromUrl: 'https://example.com/current',
        url: 'https://example.com/previous',
        trigger: 'history-traversal',
      }).text,
    ).toBe('Navegou pelo histórico para "/previous"');
  });

  it('uses and safely rebuilds schema 10 document navigation descriptions', () => {
    const description = {
      action: 'navigation' as const,
      text: 'Recarregou "/account"',
      locale: 'pt-BR' as const,
    };

    expect(
      resolveStepDescription({
        schemaVersion: 10,
        type: 'navigation',
        description,
      }),
    ).toBe(description);

    expect(
      resolveStepDescription({
        schemaVersion: 10,
        type: 'navigation',
        fromUrl: 'https://example.com/account',
        toUrl: 'https://example.com/account',
        trigger: 'reload',
      }).text,
    ).toBe('Recarregou "/account"');
  });

  it('uses and safely rebuilds schema 11 URL assertion descriptions', () => {
    const description = {
      action: 'urlAssertion' as const,
      text: 'Verificou que a URL é "/account?tab=security"',
      locale: 'pt-BR' as const,
    };

    expect(
      resolveStepDescription({
        schemaVersion: 11,
        type: 'assertion',
        assertion: {
          kind: 'url',
          operator: 'equals',
          expected: 'https://example.com/account?tab=security',
        },
        description,
      }),
    ).toBe(description);

    expect(
      resolveStepDescription({
        schemaVersion: 11,
        type: 'assertion',
        assertion: {
          kind: 'url',
          operator: 'equals',
          expected: 'https://example.com/account?tab=security',
        },
      }).text,
    ).toBe('Verificou que a URL é "/account?tab=security"');

    expect(
      resolveStepDescription({
        schemaVersion: 11,
        type: 'assertion',
        assertion: { kind: 'url', operator: 'contains', expected: 123 },
      }).text,
    ).toBe('Verificou a URL atual');
  });

  it('applies valid overrides without changing persisted descriptions', () => {
    const step = {
      schemaVersion: 10,
      type: 'navigation',
      description: {
        action: 'navigation' as const,
        text: 'Navegou para "/account"',
        locale: 'pt-BR' as const,
      },
      descriptionOverride: {
        text: '  Abriu a área da conta  ',
        locale: 'pt-BR',
      },
    };
    const originalStep = structuredClone(step);

    expect(resolveStepDescription(step).text).toBe('Abriu a área da conta');
    expect(step).toEqual(originalStep);
  });

  it('supports overrides in old and legacy records and ignores corrupted ones', () => {
    expect(
      resolveStepDescription({
        schemaVersion: 2,
        element: { tagName: 'button' },
        descriptionOverride: {
          text: 'Confirmou o pedido',
          locale: 'pt-BR',
        },
      }).text,
    ).toBe('Confirmou o pedido');
    expect(
      resolveStepDescription({
        type: 'click',
        element: { tagName: 'button' },
        descriptionOverride: {
          text: 'Executou o passo legado',
          locale: 'pt-BR',
        },
      }).text,
    ).toBe('Executou o passo legado');
    expect(
      resolveStepDescription({
        schemaVersion: 4,
        description: validDescription,
        descriptionOverride: { text: '', locale: 'pt-BR' },
      }),
    ).toBe(validDescription);
  });

  it('rebuilds an incomplete focus navigation description safely', () => {
    const step = {
      schemaVersion: 4,
      type: 'focus-navigation',
      description: { action: 'focusNavigation', text: '' },
      selectors: {
        recommended: {
          strategy: 'label',
          value: 'Password',
          score: 85,
          isUnique: true,
          validation: {
            status: 'valid',
            matchCount: 1,
            matchesTarget: true,
          },
        },
        alternatives: [],
      },
      element: { tagName: 'input', inputType: 'password' },
    };

    expect(resolveStepDescription(step)).toEqual(
      validFocusNavigationDescription,
    );
  });

  it('generates a schema 3 description in memory', () => {
    const step = {
      schemaVersion: 3,
      type: 'click',
      selectors: {
        recommended: {
          strategy: 'role',
          value: 'button:Entrar',
          role: 'button',
          name: 'Entrar',
          score: 90,
          isUnique: true,
          validation: {
            status: 'valid',
            matchCount: 1,
            matchesTarget: true,
          },
        },
        alternatives: [],
      },
      element: { tagName: 'button', text: 'Entrar' },
    };

    expect(resolveStepDescription(step)).toEqual(validDescription);
    expect(step).not.toHaveProperty('description');
  });

  it('adapts schema 2 candidates without validation metadata', () => {
    const step = {
      schemaVersion: 2,
      type: 'click',
      selectors: {
        recommended: {
          strategy: 'id',
          value: 'submitOrder',
          score: 80,
          isUnique: true,
        },
        alternatives: [],
      },
      element: { tagName: 'button' },
    };

    expect(resolveStepDescription(step)).toMatchObject({
      target: { type: 'button', name: 'Submit order' },
      source: 'id',
      text: 'Clicou no botão "Submit order"',
    });
  });

  it('uses a generic fallback for legacy recordings', () => {
    const step = {
      type: 'click',
      selector: {
        role: 'button',
        accessibleName: 'Login',
        css: 'button',
      },
      element: { tagName: 'button', text: 'Login' },
    };

    expect(resolveStepDescription(step)).toEqual({
      action: 'click',
      target: { type: 'element' },
      source: 'tagName',
      text: 'Clicou em um elemento',
      locale: 'pt-BR',
    });
  });

  it('falls back safely for incomplete or corrupted records', () => {
    expect(resolveStepDescription(undefined)).toEqual({
      action: 'click',
      target: { type: 'element' },
      source: 'tagName',
      text: 'Clicou em um elemento',
      locale: 'pt-BR',
    });

    expect(
      resolveStepDescription({
        schemaVersion: 4,
        description: { text: '' },
        selectors: { recommended: null, alternatives: 'invalid' },
        element: { tagName: 123 },
      }),
    ).toMatchObject({
      target: { type: 'element' },
      text: 'Clicou em um elemento',
    });
  });

  it('resolves a mixed list without changing its order or records', () => {
    const steps = [
      {
        schemaVersion: 11,
        type: 'assertion',
        assertion: {
          kind: 'url',
          operator: 'equals',
          expected: 'https://example.com/account?tab=security',
        },
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
        fromUrl: 'https://example.com/#forms',
        toUrl: 'https://example.com/#buttons',
        trigger: 'fragment',
      },
      {
        schemaVersion: 8,
        type: 'color-change',
        selectors: {
          recommended: {
            strategy: 'label',
            value: 'Color Picker',
            isUnique: true,
          },
        },
        element: { tagName: 'input', inputType: 'color' },
        value: { kind: 'plain', value: '#663399' },
      },
      {
        schemaVersion: 7,
        type: 'range-change',
        selectors: {
          recommended: {
            strategy: 'label',
            value: 'Experience',
            isUnique: true,
          },
        },
        element: { tagName: 'input', inputType: 'range' },
        value: { kind: 'plain', value: '7' },
      },
      {
        schemaVersion: 6,
        type: 'selection-change',
        selectors: {
          recommended: {
            strategy: 'label',
            value: 'Remember me',
            isUnique: true,
          },
        },
        element: { tagName: 'input', inputType: 'checkbox' },
        control: { kind: 'checkbox', checked: true },
      },
      {
        schemaVersion: 5,
        type: 'field-fill',
        selectors: {
          recommended: {
            strategy: 'label',
            value: 'Username',
            isUnique: true,
          },
        },
        element: { tagName: 'input', inputType: 'text' },
        value: { kind: 'plain', value: 'tester' },
      },
      { schemaVersion: 4, description: validDescription },
      {
        schemaVersion: 4,
        type: 'focus-navigation',
        description: validFocusNavigationDescription,
      },
      {
        schemaVersion: 3,
        element: { tagName: 'a', text: 'Minha conta' },
      },
      {
        schemaVersion: 2,
        element: { tagName: 'input', inputType: 'checkbox' },
      },
      { type: 'click', element: { tagName: 'div' } },
    ];
    const originalSteps = structuredClone(steps);

    expect(steps.map(resolveStepDescription).map(({ text }) => text)).toEqual([
      'Verificou que a URL é "/account?tab=security"',
      'Recarregou "/account"',
      'Navegou para "/#buttons"',
      'Selecionou a cor "#663399" no seletor de cor "Color Picker"',
      'Ajustou o controle deslizante "Experience" para "7"',
      'Marcou a caixa de seleção "Remember me"',
      'Preencheu o campo "Username" com "tester"',
      'Clicou no botão "Entrar"',
      'Navegou para o campo "Password"',
      'Clicou no link "Minha conta"',
      'Clicou em uma caixa de seleção',
      'Clicou em um elemento',
    ]);
    expect(steps).toEqual(originalSteps);
  });
});
