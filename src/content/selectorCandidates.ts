import type {
  SelectorAnalysis,
  SelectorCandidate,
  TestIdAttribute,
} from '../shared/recordingTypes';
import { createSelectorAnalysis } from './selectorAnalysis';

const TEST_ID_ATTRIBUTES: Array<{ attribute: TestIdAttribute; score: number }> = [
  { attribute: 'data-testid', score: 100 },
  { attribute: 'data-cy', score: 98 },
  { attribute: 'data-test', score: 96 },
];

type LabelledControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim().slice(0, 120) || undefined;
}

function isLabelledControl(element: Element): element is LabelledControl {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  );
}

function getLabelText(element: Element) {
  if (!isLabelledControl(element) || !element.labels?.length) return undefined;
  return normalizeText(element.labels[0].textContent);
}

function getImplicitRole(element: Element) {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'button') return 'button';
  if (tagName === 'a' && element.hasAttribute('href')) return 'link';
  if (tagName === 'select') return 'combobox';
  if (tagName === 'textarea') return 'textbox';

  if (element instanceof HTMLInputElement) {
    if (['button', 'submit', 'reset'].includes(element.type)) return 'button';
    if (element.type === 'checkbox') return 'checkbox';
    if (element.type === 'radio') return 'radio';
    return 'textbox';
  }

  return undefined;
}

function getAriaLabelledByText(element: Element) {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (!labelledBy) return undefined;

  const label = labelledBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent)
    .filter(Boolean)
    .join(' ');

  return normalizeText(label);
}

function getAccessibleName(element: Element) {
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;

  const ariaLabelledBy = getAriaLabelledByText(element);
  if (ariaLabelledBy) return ariaLabelledBy;

  const label = getLabelText(element);
  if (label) return label;

  if (
    element instanceof HTMLInputElement &&
    ['button', 'submit', 'reset'].includes(element.type)
  ) {
    return normalizeText(element.value);
  }

  return normalizeText(element.textContent);
}

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

function countMatchingElements(predicate: (candidate: Element) => boolean) {
  return Array.from(document.querySelectorAll('*')).filter(predicate).length;
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

function addTestIdCandidates(element: Element, candidates: SelectorCandidate[]) {
  TEST_ID_ATTRIBUTES.forEach(({ attribute, score }) => {
    const value = normalizeText(element.getAttribute(attribute));
    if (!value) return;

    candidates.push({
      strategy: 'testId',
      value,
      score,
      isUnique:
        countMatchingElements(
          (candidate) => candidate.getAttribute(attribute) === value,
        ) === 1,
      attribute,
    });
  });
}

export function buildSelectorCandidates(element: Element): SelectorAnalysis {
  const candidates: SelectorCandidate[] = [];
  const rawId = element.id || undefined;
  const idIsUnique = rawId
    ? countMatchingElements((candidate) => candidate.id === rawId) === 1
    : false;
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
      isUnique:
        countMatchingElements((candidate) => {
          const candidateRole =
            candidate.getAttribute('role') ?? getImplicitRole(candidate);
          const candidateName = getAccessibleName(candidate);
          return candidateRole === role && candidateName === accessibleName;
        }) === 1,
    });
  }

  if (label) {
    candidates.push({
      strategy: 'label',
      value: label,
      score: 85,
      isUnique:
        countMatchingElements((candidate) => getLabelText(candidate) === label) === 1,
    });
  }

  if (rawId) {
    const isDynamic = isLikelyDynamicId(rawId);
    candidates.push({
      strategy: 'id',
      value: rawId,
      score: isDynamic ? 30 : 80,
      isUnique: idIsUnique,
      warnings: isDynamic ? ['dynamic-id'] : undefined,
    });
  }

  if (accessibleName) {
    candidates.push({
      strategy: 'text',
      value: accessibleName,
      score: 60,
      isUnique:
        countMatchingElements(
          (candidate) => getAccessibleName(candidate) === accessibleName,
        ) === 1,
    });
  }

  candidates.push({
    strategy: 'css',
    value: css,
    score: 40,
    isUnique: true,
  });

  return createSelectorAnalysis(candidates);
}
