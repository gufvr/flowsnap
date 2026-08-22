import { describe, expect, it } from 'vitest';
import type {
  SelectorCandidate,
  SelectorValidationStatus,
} from '../shared/recordingTypes';
import { createSelectorAnalysis } from './selectorAnalysis';

function createCandidate(
  candidate: Partial<SelectorCandidate> &
    Pick<SelectorCandidate, 'strategy' | 'value' | 'score'>,
  status: SelectorValidationStatus = 'valid',
): SelectorCandidate {
  const matchCount = status === 'invalid' ? 0 : status === 'ambiguous' ? 2 : 1;

  return {
    isUnique: status === 'valid',
    validation: {
      status,
      matchCount,
      matchesTarget: status !== 'invalid',
    },
    ...candidate,
  };
}

describe('createSelectorAnalysis', () => {
  it('orders valid candidates by score', () => {
    const candidates: SelectorCandidate[] = [
      createCandidate({ strategy: 'css', value: 'button', score: 40 }),
      createCandidate({ strategy: 'role', value: 'button:Entrar', score: 90 }),
      createCandidate({ strategy: 'id', value: 'login', score: 80 }),
    ];

    expect(createSelectorAnalysis(candidates)).toEqual({
      recommended: candidates[1],
      alternatives: [candidates[2], candidates[0]],
    });
  });

  it('prefers a valid candidate over a higher-scored ambiguous candidate', () => {
    const ambiguousTestId = createCandidate(
      { strategy: 'testId', value: 'action', score: 100 },
      'ambiguous',
    );
    const validCss = createCandidate({
      strategy: 'css',
      value: 'form > button',
      score: 40,
    });

    expect(createSelectorAnalysis([ambiguousTestId, validCss]).recommended).toBe(
      validCss,
    );
  });

  it('places invalid candidates after valid and ambiguous candidates', () => {
    const invalidTestId = createCandidate(
      { strategy: 'testId', value: 'missing', score: 100 },
      'invalid',
    );
    const ambiguousRole = createCandidate(
      { strategy: 'role', value: 'button:Salvar', score: 90 },
      'ambiguous',
    );
    const validCss = createCandidate({
      strategy: 'css',
      value: 'form > button',
      score: 40,
    });

    expect(
      createSelectorAnalysis([invalidTestId, ambiguousRole, validCss]),
    ).toEqual({
      recommended: validCss,
      alternatives: [ambiguousRole, invalidTestId],
    });
  });

  it('prefers a stable candidate over a warned candidate', () => {
    const dynamicId = createCandidate({
      strategy: 'id',
      value: 'input-1787356814282',
      score: 100,
      warnings: ['dynamic-id'],
    });
    const stableCss = createCandidate({
      strategy: 'css',
      value: 'form > input',
      score: 40,
    });

    expect(createSelectorAnalysis([dynamicId, stableCss]).recommended).toBe(
      stableCss,
    );
  });

  it('uses the smallest match count to break an otherwise equal tie', () => {
    const broadCandidate = createCandidate(
      { strategy: 'role', value: 'button:Salvar', score: 90 },
      'ambiguous',
    );
    broadCandidate.validation.matchCount = 4;
    const narrowerCandidate = createCandidate(
      { strategy: 'role', value: 'button:Enviar', score: 90 },
      'ambiguous',
    );

    expect(
      createSelectorAnalysis([broadCandidate, narrowerCandidate]).recommended,
    ).toBe(narrowerCandidate);
  });

  it('does not mutate the original candidate list', () => {
    const candidates: SelectorCandidate[] = [
      createCandidate({ strategy: 'css', value: 'button', score: 40 }),
      createCandidate({ strategy: 'id', value: 'login', score: 80 }),
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
