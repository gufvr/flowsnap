import { describe, expect, it } from 'vitest';
import type { SelectorCandidate } from '../recordingTypes';
import { createFieldFillDescription } from './createFieldFillDescription';

function createCandidate(
  candidate: Pick<SelectorCandidate, 'strategy' | 'value' | 'score'>,
): SelectorCandidate {
  return {
    ...candidate,
    isUnique: true,
    validation: {
      status: 'valid',
      matchCount: 1,
      matchesTarget: true,
    },
  };
}

const usernameInput = {
  selectors: {
    recommended: createCandidate({
      strategy: 'label',
      value: 'Username',
      score: 85,
    }),
    alternatives: [],
  },
  element: { tagName: 'input', inputType: 'text' },
};

describe('createFieldFillDescription', () => {
  it('describes an ordinary value', () => {
    expect(
      createFieldFillDescription({
        ...usernameInput,
        value: { kind: 'plain', value: 'tester' },
      }),
    ).toEqual({
      action: 'fieldFill',
      target: { type: 'field', name: 'Username' },
      source: 'label',
      text: 'Preencheu o campo "Username" com "tester"',
      locale: 'pt-BR',
    });
  });

  it('describes clearing a field', () => {
    expect(
      createFieldFillDescription({
        ...usernameInput,
        value: { kind: 'plain', value: '' },
      }).text,
    ).toBe('Limpou o campo "Username"');
  });

  it('never exposes a protected value', () => {
    const description = createFieldFillDescription({
      ...usernameInput,
      value: { kind: 'protected', reason: 'password' },
    });

    expect(description.text).toBe(
      'Preencheu o campo "Username" com um valor protegido',
    );
    expect(JSON.stringify(description)).not.toContain('password');
  });

  it('normalizes and limits the preview', () => {
    const description = createFieldFillDescription({
      ...usernameInput,
      value: { kind: 'plain', value: `  ${'long value '.repeat(20)}  ` },
    });

    const preview = description.text.match(/com "(.*)"$/)?.[1];
    expect(preview).toHaveLength(80);
    expect(preview).not.toContain('\n');
  });
});
