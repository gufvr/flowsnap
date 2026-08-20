import type { ExtensionMessage } from '../shared/messages';
import type { SelectorCandidates } from '../shared/recordingTypes';

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

export function buildSelectorCandidates(element: Element): SelectorCandidates {
  const testId =
    element.getAttribute('data-testid') ??
    element.getAttribute('data-test') ??
    element.getAttribute('data-cy') ??
    undefined;
  const rawId = element.id || undefined;
  const id =
    rawId && document.querySelectorAll(`#${CSS.escape(rawId)}`).length === 1
      ? rawId
      : undefined;

  return {
    testId,
    id,
    role: element.getAttribute('role') ?? getImplicitRole(element),
    accessibleName: getAccessibleName(element),
    css: getUniqueCssSelector(element),
  };
}

function createClickMessage(element: Element): ExtensionMessage {
  return {
    type: 'RECORDED_CLICK',
    payload: {
      id: crypto.randomUUID(),
      type: 'click',
      url: window.location.href,
      timestamp: Date.now(),
      selector: buildSelectorCandidates(element),
      element: {
        tagName: element.tagName.toLowerCase(),
        text: normalizeText(element.textContent),
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
