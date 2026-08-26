import { describe, expect, it } from 'vitest';
import { resolveRecommendedSelector } from './resolveRecommendedSelector';

describe('resolveRecommendedSelector', () => {
  it.each([7, 6, 5, 4, 3, 2])(
    'uses the recommended candidate from schema %s',
    (schemaVersion) => {
      const step = {
        schemaVersion,
        selectors: {
          recommended: {
            strategy: 'testId',
            value: 'login-button',
            attribute: 'data-cy',
          },
          alternatives: [{ strategy: 'css', value: 'button' }],
        },
      };

      expect(resolveRecommendedSelector(step)).toEqual({
        strategy: 'testId',
        value: 'login-button',
        attribute: 'data-cy',
      });
    },
  );

  it('recovers role metadata from a schema 2 value', () => {
    expect(
      resolveRecommendedSelector({
        schemaVersion: 2,
        selectors: {
          recommended: {
            strategy: 'role',
            value: 'button:Entrar agora',
          },
        },
      }),
    ).toEqual({
      strategy: 'role',
      value: 'button:Entrar agora',
      role: 'button',
      name: 'Entrar agora',
    });
  });

  it('uses the legacy selector priority without changing the record', () => {
    const step = {
      type: 'click',
      selector: {
        testId: 'preferred',
        role: 'button',
        accessibleName: 'Entrar',
        id: 'login',
        css: 'form > button',
      },
    };
    const originalStep = structuredClone(step);

    expect(resolveRecommendedSelector(step)).toEqual({
      strategy: 'testId',
      value: 'preferred',
      attribute: 'data-testid',
    });
    expect(step).toEqual(originalStep);
  });

  it.each([
    [
      { role: 'link', accessibleName: 'Minha conta', id: 'account', css: 'a' },
      { strategy: 'role', value: 'link:Minha conta', role: 'link', name: 'Minha conta' },
    ],
    [{ id: 'account', css: 'a' }, { strategy: 'id', value: 'account' }],
    [{ css: 'main > a' }, { strategy: 'css', value: 'main > a' }],
  ])('falls through the legacy priority', (selector, expected) => {
    expect(resolveRecommendedSelector({ type: 'click', selector })).toEqual(
      expected,
    );
  });

  it('returns undefined for incomplete or corrupted records', () => {
    expect(resolveRecommendedSelector(undefined)).toBeUndefined();
    expect(resolveRecommendedSelector({ corrupted: true })).toBeUndefined();
    expect(
      resolveRecommendedSelector({
        schemaVersion: 4,
        selectors: { recommended: { strategy: 'css', value: '' } },
      }),
    ).toBeUndefined();
    expect(
      resolveRecommendedSelector({
        schemaVersion: 99,
        selectors: { recommended: { strategy: 'css', value: 'button' } },
      }),
    ).toBeUndefined();
  });
});
