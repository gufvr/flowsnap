import { createClickDescription } from '../shared/descriptions/createClickDescription';
import { createFieldFillDescription } from '../shared/descriptions/createFieldFillDescription';
import { createFocusNavigationDescription } from '../shared/descriptions/createFocusNavigationDescription';
import type { ExtensionMessage } from '../shared/messages';
import { normalizeText } from './elementSemantics';
import {
  captureFieldValue,
  isCapturableField,
  type CapturableField,
} from './fieldCapture';
import { buildSelectorCandidates } from './selectorCandidates';

const TAB_NAVIGATION_TIMEOUT_MS = 300;

type SendMessage = (message: ExtensionMessage) => void | Promise<unknown>;

interface PendingTabNavigation {
  direction: 'forward' | 'backward';
  source?: Element;
  timeoutId: number;
}

export interface RecorderController {
  isActive: boolean;
  setActive: (isActive: boolean) => void;
  handleClick: (event: MouseEvent) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  handleFocusIn: (event: FocusEvent) => void;
  handleInput: (event: Event) => void;
  handleChange: (event: Event) => void;
  handlePointerDown: () => void;
  handleWindowBlur: () => void;
}

declare global {
  interface Window {
    __flowsnapRecorder?: RecorderController;
  }
}

function getElementData(element: Element) {
  return {
    tagName: element.tagName.toLowerCase(),
    text: normalizeText(element.textContent),
    inputType: element instanceof HTMLInputElement ? element.type : undefined,
  };
}

function getEventElement(event: Event) {
  const pathElement = event
    .composedPath()
    .find((eventTarget): eventTarget is Element => eventTarget instanceof Element);

  if (pathElement) return pathElement;
  return event.target instanceof Element ? event.target : undefined;
}

export function createClickMessage(element: Element): ExtensionMessage {
  const selectors = buildSelectorCandidates(element);
  const elementData = getElementData(element);

  return {
    type: 'RECORDED_CLICK',
    payload: {
      schemaVersion: 4,
      id: crypto.randomUUID(),
      type: 'click',
      url: window.location.href,
      timestamp: Date.now(),
      selectors,
      element: elementData,
      description: createClickDescription({ selectors, element: elementData }),
    },
  };
}

export function createFocusNavigationMessage(
  element: Element,
  direction: 'forward' | 'backward',
): ExtensionMessage {
  const selectors = buildSelectorCandidates(element);
  const elementData = getElementData(element);

  return {
    type: 'RECORDED_FOCUS_NAVIGATION',
    payload: {
      schemaVersion: 4,
      id: crypto.randomUUID(),
      type: 'focus-navigation',
      url: window.location.href,
      timestamp: Date.now(),
      key: 'Tab',
      direction,
      selectors,
      element: elementData,
      description: createFocusNavigationDescription({
        selectors,
        element: elementData,
      }),
    },
  };
}

export function createFieldFillMessage(
  field: CapturableField,
): Extract<ExtensionMessage, { type: 'RECORDED_FIELD_FILL' }> {
  const value = captureFieldValue(field);
  const selectors = buildSelectorCandidates(field);
  const elementData = getElementData(field);

  return {
    type: 'RECORDED_FIELD_FILL',
    payload: {
      schemaVersion: 5,
      id: crypto.randomUUID(),
      type: 'field-fill',
      url: window.location.href,
      timestamp: Date.now(),
      selectors,
      element: elementData,
      value,
      description: createFieldFillDescription({
        selectors,
        element: elementData,
        value,
      }),
    },
  };
}

export function createRecorderController(
  sendMessage: SendMessage,
): RecorderController {
  let pendingTabNavigation: PendingTabNavigation | undefined;
  let dirtyFields = new WeakSet<CapturableField>();
  let lastCapturedPlainValues = new WeakMap<CapturableField, string>();

  const clearPendingTabNavigation = () => {
    if (!pendingTabNavigation) return;

    window.clearTimeout(pendingTabNavigation.timeoutId);
    pendingTabNavigation = undefined;
  };

  const controller: RecorderController = {
    isActive: false,
    setActive(isActive) {
      controller.isActive = isActive;
      if (!isActive) {
        clearPendingTabNavigation();
        dirtyFields = new WeakSet();
        lastCapturedPlainValues = new WeakMap();
      }
    },
    handleClick(event) {
      const element = getEventElement(event);
      if (!controller.isActive || !element) return;

      void sendMessage(createClickMessage(element));
    },
    handleKeyDown(event) {
      if (!controller.isActive) return;

      if (
        event.key !== 'Tab' ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
      ) {
        clearPendingTabNavigation();
        return;
      }

      clearPendingTabNavigation();

      pendingTabNavigation = {
        direction: event.shiftKey ? 'backward' : 'forward',
        source: getEventElement(event),
        timeoutId: window.setTimeout(
          clearPendingTabNavigation,
          TAB_NAVIGATION_TIMEOUT_MS,
        ),
      };
    },
    handleFocusIn(event) {
      if (!controller.isActive || !pendingTabNavigation) return;

      const navigation = pendingTabNavigation;
      const element = getEventElement(event);
      clearPendingTabNavigation();

      if (!element || element === navigation.source) return;

      void sendMessage(
        createFocusNavigationMessage(element, navigation.direction),
      );
    },
    handleInput(event) {
      const element = getEventElement(event);
      if (!controller.isActive || !element || !isCapturableField(element)) {
        return;
      }

      dirtyFields.add(element);
    },
    handleChange(event) {
      const element = getEventElement(event);
      if (
        !controller.isActive ||
        !element ||
        !isCapturableField(element) ||
        !dirtyFields.has(element)
      ) {
        return;
      }

      dirtyFields.delete(element);
      const message = createFieldFillMessage(element);
      const { value } = message.payload;

      if (
        value.kind === 'plain' &&
        lastCapturedPlainValues.get(element) === value.value
      ) {
        return;
      }

      if (value.kind === 'plain') {
        lastCapturedPlainValues.set(element, value.value);
      }

      void sendMessage(message);
    },
    handlePointerDown() {
      clearPendingTabNavigation();
    },
    handleWindowBlur() {
      clearPendingTabNavigation();
    },
  };

  return controller;
}

function installRecorder() {
  if (window.__flowsnapRecorder) return;

  const controller = createRecorderController((message) =>
    chrome.runtime.sendMessage(message),
  );

  document.addEventListener('click', controller.handleClick, true);
  document.addEventListener('keydown', controller.handleKeyDown, true);
  document.addEventListener('focusin', controller.handleFocusIn, true);
  document.addEventListener('input', controller.handleInput, true);
  document.addEventListener('change', controller.handleChange, true);
  document.addEventListener('pointerdown', controller.handlePointerDown, true);
  window.addEventListener('blur', controller.handleWindowBlur);
  window.__flowsnapRecorder = controller;

  chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
    if (message.type === 'ACTIVATE_CLICK_RECORDER') controller.setActive(true);
    if (message.type === 'DEACTIVATE_CLICK_RECORDER') controller.setActive(false);
  });
}

if (globalThis.chrome?.runtime) installRecorder();
