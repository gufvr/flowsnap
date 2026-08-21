import type {
  SelectorAnalysis,
  SelectorCandidate,
} from '../shared/recordingTypes';

export function createSelectorAnalysis(
  candidates: SelectorCandidate[],
): SelectorAnalysis {
  if (candidates.length === 0) {
    throw new Error('At least one selector candidate is required.');
  }

  const orderedCandidates = [...candidates].sort((first, second) => {
    if (first.isUnique !== second.isUnique) return first.isUnique ? -1 : 1;
    return second.score - first.score;
  });

  const [recommended, ...alternatives] = orderedCandidates;
  return { recommended, alternatives };
}
