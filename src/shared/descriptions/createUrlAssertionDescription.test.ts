import { describe, expect, it } from 'vitest';
import { createUrlAssertionDescription } from './createUrlAssertionDescription';

describe('createUrlAssertionDescription', () => {
  it('describes the exact path, query and fragment without exposing the origin', () => {
    expect(
      createUrlAssertionDescription({
        expectedUrl: 'https://example.com/account?tab=security#password',
      }),
    ).toEqual({
      action: 'urlAssertion',
      text: 'Verificou que a URL é "/account?tab=security#password"',
      locale: 'pt-BR',
    });
  });

  it.each([undefined, '', 'not-a-url', 'chrome://extensions']) (
    'falls back safely for an invalid expected URL: %s',
    (expectedUrl) => {
      expect(createUrlAssertionDescription({ expectedUrl })).toEqual({
        action: 'urlAssertion',
        text: 'Verificou a URL atual',
        locale: 'pt-BR',
      });
    },
  );

  it('limits the displayed URL while preserving the exact value outside the description', () => {
    const longPath = `/${'a'.repeat(250)}`;
    const description = createUrlAssertionDescription({
      expectedUrl: `https://example.com${longPath}`,
    });

    expect(description.text).toBe(
      `Verificou que a URL é "${longPath.slice(0, 200)}"`,
    );
  });
});
