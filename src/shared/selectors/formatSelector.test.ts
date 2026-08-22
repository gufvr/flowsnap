import { describe, expect, it } from 'vitest';
import type { ResolvedSelector } from './resolveRecommendedSelector';
import { formatSelector } from './formatSelector';

describe('formatSelector', () => {
  it.each<{ selector: ResolvedSelector; expected: string }>([
    {
      selector: {
        strategy: 'testId',
        value: 'login-button',
        attribute: 'data-testid',
      },
      expected: 'data-testid=login-button',
    },
    {
      selector: {
        strategy: 'testId',
        value: 'login-button',
        attribute: 'data-cy',
      },
      expected: 'data-cy=login-button',
    },
    {
      selector: {
        strategy: 'testId',
        value: 'login-button',
        attribute: 'data-test',
      },
      expected: 'data-test=login-button',
    },
    {
      selector: {
        strategy: 'role',
        value: 'button:Entrar',
        role: 'button',
        name: 'Entrar',
      },
      expected: 'role=button;name=Entrar',
    },
    {
      selector: { strategy: 'role', value: 'button', role: 'button' },
      expected: 'role=button',
    },
    {
      selector: { strategy: 'label', value: 'Username' },
      expected: 'label=Username',
    },
    {
      selector: { strategy: 'id', value: 'username' },
      expected: 'id=username',
    },
    {
      selector: { strategy: 'text', value: 'Login' },
      expected: 'text=Login',
    },
    {
      selector: { strategy: 'css', value: 'form > button' },
      expected: 'css=form > button',
    },
  ])('formats $selector.strategy as $expected', ({ selector, expected }) => {
    expect(formatSelector(selector)).toBe(expected);
  });

  it('escapes reserved characters and line breaks', () => {
    expect(
      formatSelector({
        strategy: 'css',
        value: 'form\\step[data-value="one;two"]\nbutton',
      }),
    ).toBe('css=form\\\\step[data-value\\="one\\;two"]\\nbutton');
  });
});
