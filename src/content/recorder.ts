import type { ExtensionMessage } from '../shared/messages';
import { normalizeText } from './elementSemantics';
import { buildSelectorCandidates } from './selectorCandidates';

interface RecorderController {
  isActive: boolean;
  handleClick: (event: MouseEvent) => void;
}

declare global {
  interface Window {
    __flowsnapRecorder?: RecorderController;
  }
}

function createClickMessage(element: Element): ExtensionMessage {
  return {
    type: 'RECORDED_CLICK',
    payload: {
      schemaVersion: 3,
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
