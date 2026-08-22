import type {
  SelectorAnalysis,
  SelectorCandidate,
  SelectorValidationStatus,
} from '../shared/recordingTypes';

const VALIDATION_PRIORITY: Record<SelectorValidationStatus, number> = {
  valid: 0,
  ambiguous: 1,
  invalid: 2,
};

export function createSelectorAnalysis(
  candidates: SelectorCandidate[],
): SelectorAnalysis {
  if (candidates.length === 0) {
    throw new Error('At least one selector candidate is required.');
  }

  const orderedCandidates = [...candidates].sort((first, second) => {
    const validationDifference =
      VALIDATION_PRIORITY[first.validation.status] -
      VALIDATION_PRIORITY[second.validation.status];

    if (validationDifference !== 0) return validationDifference;

    const warningDifference =
      (first.warnings?.length ?? 0) - (second.warnings?.length ?? 0);

    if (warningDifference !== 0) return warningDifference;
    if (first.score !== second.score) return second.score - first.score;

    return first.validation.matchCount - second.validation.matchCount;
  });

  const [recommended, ...alternatives] = orderedCandidates;
  return { recommended, alternatives };
}
