import { describe, expect, it } from 'vitest';
import type { SelectorCandidate } from '../recordingTypes';
import { createSelectionChangeDescription } from './createSelectionChangeDescription';

function createCandidate(
  strategy: SelectorCandidate['strategy'],
  value: string,
  role?: string,
  name?: string,
): SelectorCandidate {
  return {
    strategy,
    value,
    role,
    name,
    score: 90,
    isUnique: true,
    validation: {
      status: 'valid',
      matchCount: 1,
      matchesTarget: true,
    },
  };
}

function input(candidate: SelectorCandidate, inputType: string) {
  return {
    selectors: { recommended: candidate, alternatives: [] },
    element: { tagName: 'input', inputType },
  };
}

describe('createSelectionChangeDescription', () => {
  it('describes checking and unchecking a checkbox', () => {
    const target = input(
      createCandidate('label', 'Remember me'),
      'checkbox',
    );

    expect(
      createSelectionChangeDescription({
        ...target,
        control: { kind: 'checkbox', checked: true },
      }).text,
    ).toBe('Marcou a caixa de seleção "Remember me"');
    expect(
      createSelectionChangeDescription({
        ...target,
        control: { kind: 'checkbox', checked: false },
      }).text,
    ).toBe('Desmarcou a caixa de seleção "Remember me"');
  });

  it('describes radio and select changes', () => {
    const radioTarget = input(createCandidate('label', 'Standard'), 'radio');
    const selectTarget = {
      selectors: {
        recommended: createCandidate('label', 'Country'),
        alternatives: [],
      },
      element: { tagName: 'select' },
    };

    expect(
      createSelectionChangeDescription({
        ...radioTarget,
        control: { kind: 'radio', checked: true },
      }).text,
    ).toBe('Selecionou a opção "Standard"');
    expect(
      createSelectionChangeDescription({
        ...selectTarget,
        control: {
          kind: 'select',
          multiple: false,
          selection: {
            kind: 'plain',
            options: [{ value: 'BR', label: 'Brazil' }],
          },
        },
      }).text,
    ).toBe('Selecionou "Brazil" no seletor "Country"');
  });

  it('does not expose a protected select value', () => {
    const description = createSelectionChangeDescription({
      selectors: {
        recommended: createCandidate('label', 'Secret option'),
        alternatives: [],
      },
      element: { tagName: 'select' },
      control: {
        kind: 'select',
        multiple: false,
        selection: { kind: 'protected', reason: 'secret' },
      },
    });

    expect(description.text).toBe(
      'Selecionou um valor protegido no seletor "Secret option"',
    );
  });
});
