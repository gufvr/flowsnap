import { describe, expect, it } from 'vitest';
import {
  formatCypressJavaScriptString,
  formatCypressLocator,
  resolveCypressLocator,
} from './formatCypressLocator';

describe('formatCypressLocator', () => {
  it('formats test-id, id, CSS and exact text selectors safely', () => {
    expect(
      formatCypressLocator({
        strategy: 'testId',
        value: 'save"draft',
        attribute: 'data-cy',
      }),
    ).toEqual({
      expression: 'cy.get("[data-cy=\\"save\\\\\\"draft\\"]")',
      usesLabelHelper: false,
    });
    expect(
      formatCypressLocator({ strategy: 'id', value: 'profile' })?.expression,
    ).toBe('cy.get("[id=\\"profile\\"]")');
    expect(
      formatCypressLocator({ strategy: 'css', value: 'main > button' })
        ?.expression,
    ).toBe('cy.get("main > button")');
    expect(
      formatCypressLocator({ strategy: 'text', value: 'Salvar (agora)' })
        ?.expression,
    ).toBe('cy.contains(new RegExp("^Salvar \\\\(agora\\\\)$"))');
  });

  it('uses core Cypress queries for labels and named button or link roles', () => {
    expect(
      formatCypressLocator({ strategy: 'label', value: 'Email' }),
    ).toEqual({
      expression: 'getByLabel(new RegExp("^Email$"))',
      usesLabelHelper: true,
    });
    expect(
      formatCypressLocator({
        strategy: 'role',
        value: 'button:Entrar',
        role: 'button',
        name: 'Entrar',
      })?.expression,
    ).toBe(
      'cy.contains("button, input[type=\\"button\\"], input[type=\\"submit\\"], input[type=\\"reset\\"], [role=\\"button\\"]", new RegExp("^Entrar$"))',
    );
    expect(
      formatCypressLocator({
        strategy: 'role',
        value: 'textbox:Username',
        role: 'textbox',
        name: 'Username',
      }),
    ).toBeUndefined();
  });

  it('falls back through persisted candidates and supports legacy selectors', () => {
    expect(
      resolveCypressLocator({
        schemaVersion: 4,
        selectors: {
          recommended: {
            strategy: 'role',
            value: 'textbox:Username',
            role: 'textbox',
            name: 'Username',
          },
          alternatives: [
            { strategy: 'label', value: 'Username' },
            { strategy: 'css', value: 'input[name="username"]' },
          ],
        },
      }),
    ).toEqual({
      expression: 'getByLabel(new RegExp("^Username$"))',
      usesLabelHelper: true,
    });
    expect(
      resolveCypressLocator({
        type: 'click',
        selector: { css: 'button.legacy' },
      })?.expression,
    ).toBe('cy.get("button.legacy")');
  });

  it('escapes JavaScript line separators', () => {
    expect(formatCypressJavaScriptString(`a\u2028b\u2029c`)).toBe(
      '"a\\u2028b\\u2029c"',
    );
  });
});
