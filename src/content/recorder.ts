import type { ExtensionMessage } from '../shared/messages';
import type {
  SelectorAnalysis,
  SelectorCandidate,
} from '../shared/recordingTypes';
import { createSelectorAnalysis } from './selectorAnalysis';

interface RecorderController {
  isActive: boolean;
  handleClick: (event: MouseEvent) => void;
}

declare global {
  interface Window {
    __flowsnapRecorder?: RecorderController;
  }
}

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim().slice(0, 120) || undefined;
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

function getAccessibleName(element: Element) {
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;

  if (element instanceof HTMLInputElement && element.labels?.length) {
    return normalizeText(element.labels[0].textContent);
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

export function buildSelectorCandidates(element: Element): SelectorAnalysis {
  const candidates: SelectorCandidate[] = [];
  const testIdAttributes = ['data-testid', 'data-cy', 'data-test'];
  const testIdAttribute = testIdAttributes.find((attribute) =>
    element.hasAttribute(attribute),
  );
  const testId = testIdAttribute
    ? element.getAttribute(testIdAttribute) ?? undefined
    : undefined;
  const rawId = element.id || undefined;
  const id =
    rawId && document.querySelectorAll(`#${CSS.escape(rawId)}`).length === 1
      ? rawId
      : undefined;
  const role = element.getAttribute('role') ?? getImplicitRole(element);
  const accessibleName = getAccessibleName(element);
  const css = getUniqueCssSelector(element);

  if (testId && testIdAttribute) {
    candidates.push({
      strategy: 'testId',
      value: testId,
      score: 100,
      isUnique:
        countMatchingElements(
          (candidate) => candidate.getAttribute(testIdAttribute) === testId,
        ) === 1,
    });
  }

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

  if (id) {
    candidates.push({ strategy: 'id', value: id, score: 80, isUnique: true });
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

function createClickMessage(element: Element): ExtensionMessage {
  return {
    type: 'RECORDED_CLICK',
    payload: {
      schemaVersion: 2,
      id: crypto.randomUUID(),
      type: 'click',
      url: window.location.href,
      timestamp: Date.now(),
      selectors: buildSelectorCandidates(element),
      element: {
        tagName: element.tagName.toLowerCase(),
        text: normalizeText(element.textContent),
        inputType:
          element instanceof HTMLInputElement ? element.type : undefined,
      },
    },
  };
}

function installRecorder() {
  if (window.__flowsnapRecorder) return;

  const controller: RecorderController = {
    isActive: false,
    handleClick(event) {
      if (!controller.isActive || !(event.target instanceof Element)) return;
      void chrome.runtime.sendMessage(createClickMessage(event.target));
    },
  };

  document.addEventListener('click', controller.handleClick, true);
  window.__flowsnapRecorder = controller;

  chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
    if (message.type === 'ACTIVATE_CLICK_RECORDER') controller.isActive = true;
    if (message.type === 'DEACTIVATE_CLICK_RECORDER') controller.isActive = false;
  });
}

if (globalThis.chrome?.runtime) installRecorder();
