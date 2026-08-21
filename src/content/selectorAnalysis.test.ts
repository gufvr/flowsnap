import { describe, expect, it } from 'vitest';
import type { SelectorCandidate } from '../shared/recordingTypes';
import { createSelectorAnalysis } from './selectorAnalysis';

describe('createSelectorAnalysis', () => {
  it('orders unique candidates by score', () => {
    const candidates: SelectorCandidate[] = [
      { strategy: 'css', value: 'button', score: 40, isUnique: true },
      { strategy: 'role', value: 'button:Entrar', score: 90, isUnique: true },
      { strategy: 'id', value: 'login', score: 80, isUnique: true },
    ];

    expect(createSelectorAnalysis(candidates)).toEqual({
      recommended: candidates[1],
      alternatives: [candidates[2], candidates[0]],
    });
  });

  it('prefers a unique candidate over a higher-scored ambiguous candidate', () => {
    const ambiguousTestId: SelectorCandidate = {
      strategy: 'testId',
      value: 'action',
      score: 100,
      isUnique: false,
    };
    const uniqueCss: SelectorCandidate = {
      strategy: 'css',
      value: 'form > button',
      score: 40,
      isUnique: true,
    };

    expect(createSelectorAnalysis([ambiguousTestId, uniqueCss]).recommended).toBe(
      uniqueCss,
    );
  });

  it('does not mutate the original candidate list', () => {
    const candidates: SelectorCandidate[] = [
      { strategy: 'css', value: 'button', score: 40, isUnique: true },
      { strategy: 'id', value: 'login', score: 80, isUnique: true },
    ];

    createSelectorAnalysis(candidates);

    expect(candidates.map(({ strategy }) => strategy)).toEqual(['css', 'id']);
  });

  it('rejects an analysis without candidates', () => {
    expect(() => createSelectorAnalysis([])).toThrow(
      'At least one selector candidate is required.',
    );
  });
});
