import type { SelectorCandidate } from '../shared/recordingTypes';
import {
  getAccessibleName,
  getImplicitRole,
  getLabelText,
  normalizeText,
} from './elementSemantics';

export type SelectorCandidateDraft = Omit<
  SelectorCandidate,
  'isUnique' | 'validation'
>;

function getAllElements() {
  return Array.from(document.querySelectorAll('*'));
}

function findMatches(candidate: SelectorCandidateDraft) {
  const elements = getAllElements();

  switch (candidate.strategy) {
    case 'testId':
      if (!candidate.attribute) return [];
      return elements.filter(
        (element) => element.getAttribute(candidate.attribute!) === candidate.value,
      );
    case 'role':
      if (!candidate.role) return [];
      return elements.filter((element) => {
        const role = element.getAttribute('role') ?? getImplicitRole(element);
        return role === candidate.role && getAccessibleName(element) === candidate.name;
      });
    case 'label':
      return elements.filter(
        (element) => getLabelText(element) === candidate.value,
      );
    case 'id':
      return elements.filter((element) => element.id === candidate.value);
    case 'text':
      return elements.filter(
        (element) => normalizeText(element.textContent) === candidate.value,
      );
    case 'css':
      try {
        return Array.from(document.querySelectorAll(candidate.value));
      } catch {
        return [];
      }
  }
}

export function validateSelectorCandidate(
  candidate: SelectorCandidateDraft,
  target: Element,
): SelectorCandidate {
  const matches = findMatches(candidate);
  const matchesTarget = matches.includes(target);
  const status = !matchesTarget
    ? 'invalid'
    : matches.length === 1
      ? 'valid'
      : 'ambiguous';

  return {
    ...candidate,
    isUnique: status === 'valid',
    validation: {
      status,
      matchCount: matches.length,
      matchesTarget,
    },
  };
}

export function validateSelectorCandidates(
  candidates: SelectorCandidateDraft[],
  target: Element,
) {
  return candidates.map((candidate) => validateSelectorCandidate(candidate, target));
}
