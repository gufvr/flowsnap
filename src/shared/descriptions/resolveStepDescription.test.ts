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
      'Clicou no botão "Entrar"',
      'Navegou para o campo "Password"',
      'Clicou no link "Minha conta"',
      'Clicou em uma caixa de seleção',
      'Clicou em um elemento',
    ]);
    expect(steps).toEqual(originalSteps);
  });
});
