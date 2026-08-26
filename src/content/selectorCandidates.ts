import type {
  SelectorAnalysis,
  TestIdAttribute,
} from '../shared/recordingTypes';
import {
  getAccessibleName,
  getImplicitRole,
  getLabelText,
  normalizeText,
} from './elementSemantics';
import { createSelectorAnalysis } from './selectorAnalysis';
import { canUseTextSelector } from './clickTarget';
import {
  validateSelectorCandidates,
  type SelectorCandidateDraft,
} from './selectorValidation';

const TEST_ID_ATTRIBUTES: Array<{ attribute: TestIdAttribute; score: number }> = [
  { attribute: 'data-testid', score: 100 },
  { attribute: 'data-cy', score: 98 },
  { attribute: 'data-test', score: 96 },
];

function getUniqueCssSelector(element: Element) {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    const tagName = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;
    let segment = tagName;

    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (sibling) => sibling.tagName === current?.tagName,
      );

      if (siblings.length > 1) {
        segment += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }

    segments.unshift(segment);
    const candidate = segments.join(' > ');

    try {
      if (document.querySelectorAll(candidate).length === 1) return candidate;
    } catch {
      // Continue building a longer, valid path.
    }

    current = parent;
  }

  return segments.join(' > ');
}

export function isLikelyDynamicId(id: string) {
  const normalizedId = id.trim();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const longHexPattern = /^[0-9a-f]{12,}$/i;
  const longNumberPattern = /\d{8,}/;
  const frameworkPattern = /^(?:ember|mui|react-select|radix|headlessui)[-_:]?\d+/i;
  const generatedTokenPattern = /^:r[\w-]*:$/i;

  return (
    uuidPattern.test(normalizedId) ||
    longHexPattern.test(normalizedId) ||
    longNumberPattern.test(normalizedId) ||
    frameworkPattern.test(normalizedId) ||
    generatedTokenPattern.test(normalizedId)
  );
}

function addTestIdCandidates(
  element: Element,
  candidates: SelectorCandidateDraft[],
) {
  TEST_ID_ATTRIBUTES.forEach(({ attribute, score }) => {
    const value = normalizeText(element.getAttribute(attribute));
    if (!value) return;

    candidates.push({
      strategy: 'testId',
      value,
      score,
      attribute,
    });
  });
}

export function buildSelectorCandidates(element: Element): SelectorAnalysis {
  const candidates: SelectorCandidateDraft[] = [];
  const rawId = element.id || undefined;
  const role = element.getAttribute('role') ?? getImplicitRole(element);
  const accessibleName = getAccessibleName(element);
  const label = getLabelText(element);
  const css = getUniqueCssSelector(element);

  addTestIdCandidates(element, candidates);

  if (role) {
    const value = accessibleName ? `${role}:${accessibleName}` : role;
    candidates.push({
      strategy: 'role',
      value,
      score: 90,
      role,
      name: accessibleName,
    });
  }

  if (label) {
    candidates.push({
      strategy: 'label',
      value: label,
      score: 85,
    });
  }

  if (rawId) {
    const isDynamic = isLikelyDynamicId(rawId);
    candidates.push({
      strategy: 'id',
      value: rawId,
      score: isDynamic ? 30 : 80,
      warnings: isDynamic ? ['dynamic-id'] : undefined,
    });
  }

  if (accessibleName && canUseTextSelector(element, role ?? undefined)) {
    candidates.push({
      strategy: 'text',
      value: accessibleName,
      score: 60,
    });
  }

  candidates.push({
    strategy: 'css',
    value: css,
    score: 40,
  });

  return createSelectorAnalysis(validateSelectorCandidates(candidates, element));
}
