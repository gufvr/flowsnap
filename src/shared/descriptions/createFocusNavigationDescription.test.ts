import { describe, expect, it } from 'vitest';
import type {
  SelectorAnalysis,
  SelectorCandidate,
} from '../recordingTypes';
import { createFocusNavigationDescription } from './createFocusNavigationDescription';

function createCandidate(
  candidate: Partial<SelectorCandidate> &
    Pick<SelectorCandidate, 'strategy' | 'value' | 'score'>,
): SelectorCandidate {
  return {
    isUnique: true,
    validation: {
      status: 'valid',
      matchCount: 1,
      matchesTarget: true,
    },
    ...candidate,
  };
}

function createSelectors(...candidates: SelectorCandidate[]): SelectorAnalysis {
  const [recommended, ...alternatives] = candidates;
  if (!recommended) throw new Error('A candidate is required for the test.');
  return { recommended, alternatives };
}

describe('createFocusNavigationDescription', () => {
  it('describes navigation to a labeled field', () => {
    const description = createFocusNavigationDescription({
      element: { tagName: 'input', inputType: 'password' },
      selectors: createSelectors(
        createCandidate({ strategy: 'label', value: 'Password', score: 85 }),
      ),
    });

    expect(description).toEqual({
      action: 'focusNavigation',
      target: { type: 'field', name: 'Password' },
      source: 'label',
      text: 'Navegou para o campo "Password"',
      locale: 'pt-BR',
    });
  });

  it('uses the same semantic target rules as click descriptions', () => {
    const description = createFocusNavigationDescription({
      element: { tagName: 'button' },
      selectors: createSelectors(
        createCandidate({
          strategy: 'role',
          role: 'button',
          name: 'Login',
          value: 'button:Login',
          score: 90,
        }),
      ),
    });

    expect(description).toMatchObject({
      target: { type: 'button', name: 'Login' },
      source: 'accessibleName',
      text: 'Navegou para o botão "Login"',
    });
  });

  it('does not include values supplied outside the element model', () => {
    const input = {
      element: {
        tagName: 'input',
        inputType: 'password',
        value: 'SuperSecretPassword!',
      },
      selectors: createSelectors(
        createCandidate({ strategy: 'css', value: 'input', score: 40 }),
      ),
    };

    const description = createFocusNavigationDescription(input);

    expect(description.text).toBe('Navegou para um campo');
    expect(JSON.stringify(description)).not.toContain('SuperSecretPassword!');
  });
});
