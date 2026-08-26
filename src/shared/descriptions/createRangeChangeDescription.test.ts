import { describe, expect, it } from 'vitest';
import type { SelectorAnalysis } from '../recordingTypes';
import { createRangeChangeDescription } from './createRangeChangeDescription';

const selectors: SelectorAnalysis = {
  recommended: {
    strategy: 'label',
    value: 'Experience (Range Slider)',
    score: 85,
    isUnique: true,
    validation: {
      status: 'valid',
      matchCount: 1,
      matchesTarget: true,
    },
  },
  alternatives: [],
};

describe('createRangeChangeDescription', () => {
  it('describes the final plain value of a named range', () => {
    expect(
      createRangeChangeDescription({
        selectors,
        element: { tagName: 'input', inputType: 'range' },
        value: { kind: 'plain', value: '7' },
      }),
    ).toEqual({
      action: 'rangeChange',
      target: { type: 'field', name: 'Experience (Range Slider)' },
      source: 'label',
      text: 'Ajustou o controle deslizante "Experience (Range Slider)" para "7"',
      locale: 'pt-BR',
    });
  });

  it('does not expose a protected range value', () => {
    expect(
      createRangeChangeDescription({
        selectors,
        element: { tagName: 'input', inputType: 'range' },
        value: { kind: 'protected', reason: 'secret' },
      }).text,
    ).toBe(
      'Ajustou o controle deslizante "Experience (Range Slider)" para um valor protegido',
    );
  });

  it('uses a readable fallback for an unnamed range', () => {
    const emptySelectors: SelectorAnalysis = {
      recommended: {
        strategy: 'css',
        value: 'input[type="range"]',
        score: 40,
        isUnique: false,
        validation: {
          status: 'ambiguous',
          matchCount: 2,
          matchesTarget: true,
        },
      },
      alternatives: [],
    };

    expect(
      createRangeChangeDescription({
        selectors: emptySelectors,
        element: { tagName: 'input', inputType: 'range' },
        value: { kind: 'plain', value: '50' },
      }).text,
    ).toBe('Ajustou um controle deslizante para "50"');
  });
});
