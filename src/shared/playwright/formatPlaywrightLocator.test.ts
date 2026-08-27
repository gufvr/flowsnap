import { describe, expect, it } from 'vitest';
import type { ResolvedSelector } from '../selectors/resolveRecommendedSelector';
import {
  formatJavaScriptString,
  formatPlaywrightLocator,
} from './formatPlaywrightLocator';

describe('formatPlaywrightLocator', () => {
  it.each<{ selector: ResolvedSelector; expected: string }>([
    {
      selector: {
        strategy: 'testId',
        value: 'login-submit',
        attribute: 'data-testid',
      },
      expected: 'page.getByTestId("login-submit")',
    },
    {
      selector: {
        strategy: 'testId',
        value: 'login-submit',
        attribute: 'data-cy',
      },
      expected: 'page.locator("[data-cy=\\"login-submit\\"]")',
    },
    {
      selector: {
        strategy: 'role',
        value: 'button:Entrar',
        role: 'button',
        name: 'Entrar',
      },
      expected:
        'page.getByRole("button", { name: "Entrar", exact: true })',
    },
    {
      selector: { strategy: 'role', value: 'button', role: 'button' },
      expected: 'page.getByRole("button")',
    },
    {
      selector: { strategy: 'label', value: 'Username' },
      expected: 'page.getByLabel("Username", { exact: true })',
    },
    {
      selector: { strategy: 'id', value: 'account' },
      expected: 'page.locator("[id=\\"account\\"]")',
    },
    {
      selector: { strategy: 'text', value: 'Minha conta' },
      expected: 'page.getByText("Minha conta", { exact: true })',
    },
    {
      selector: { strategy: 'css', value: 'main > button' },
      expected: 'page.locator("main > button")',
    },
  ])('formats $selector.strategy locators', ({ selector, expected }) => {
    expect(formatPlaywrightLocator(selector)).toBe(expected);
  });

  it('escapes JavaScript and CSS attribute characters safely', () => {
    expect(formatJavaScriptString('linha "um"\nlinha dois')).toBe(
      '"linha \\"um\\"\\nlinha dois"',
    );
    expect(
      formatPlaywrightLocator({
        strategy: 'testId',
        attribute: 'data-test',
        value: 'save"draft',
      }),
    ).toBe('page.locator("[data-test=\\"save\\\\\\"draft\\"]")');
  });
});
