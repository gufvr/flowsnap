import { describe, expect, it } from 'vitest';
import type { SelectorAnalysis } from '../recordingTypes';
import { createColorChangeDescription } from './createColorChangeDescription';

const selectors: SelectorAnalysis = {
  recommended: {
    strategy: 'label',
    value: 'Color Picker',
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

describe('createColorChangeDescription', () => {
  it('describes the final color of a named picker', () => {
    expect(
      createColorChangeDescription({
        selectors,
        element: { tagName: 'input', inputType: 'color' },
        value: { kind: 'plain', value: '#663399' },
      }),
    ).toEqual({
      action: 'colorChange',
      target: { type: 'field', name: 'Color Picker' },
      source: 'label',
      text: 'Selecionou a cor "#663399" no seletor de cor "Color Picker"',
      locale: 'pt-BR',
    });
  });

  it('does not expose a protected color value', () => {
    expect(
      createColorChangeDescription({
        selectors,
        element: { tagName: 'input', inputType: 'color' },
        value: { kind: 'protected', reason: 'secret' },
      }).text,
    ).toBe('Selecionou um valor protegido no seletor de cor "Color Picker"');
  });

  it('uses a readable fallback for an unnamed color picker', () => {
    const emptySelectors: SelectorAnalysis = {
      recommended: {
        strategy: 'css',
        value: 'input[type="color"]',
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
      createColorChangeDescription({
        selectors: emptySelectors,
        element: { tagName: 'input', inputType: 'color' },
        value: { kind: 'plain', value: '#000000' },
      }).text,
    ).toBe('Selecionou a cor "#000000" em um seletor de cor');
  });
});
