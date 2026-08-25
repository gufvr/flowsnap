import { describe, expect, it } from 'vitest';
import type { SelectorCandidate } from '../recordingTypes';
import { createKeyPressDescription } from './createKeyPressDescription';

const buttonCandidate: SelectorCandidate = {
  strategy: 'role',
  value: 'button:Login',
  role: 'button',
  name: 'Login',
  score: 90,
  isUnique: true,
  validation: {
    status: 'valid',
    matchCount: 1,
    matchesTarget: true,
  },
};

describe('createKeyPressDescription', () => {
  it('describes a named target and Shift modifier', () => {
    expect(
      createKeyPressDescription({
        selectors: { recommended: buttonCandidate, alternatives: [] },
        element: { tagName: 'button' },
        key: 'Enter',
        modifiers: { shift: true },
      }).text,
    ).toBe('Pressionou Shift+Enter no botão "Login"');
  });

  it('describes a global Escape safely', () => {
    const description = createKeyPressDescription({
      selectors: {
        recommended: {
          ...buttonCandidate,
          strategy: 'css',
          value: 'body',
          role: undefined,
          name: undefined,
        },
        alternatives: [],
      },
      element: { tagName: 'body' },
      key: 'Escape',
    });

    expect(description.text).toBe('Pressionou Escape');
  });
});
