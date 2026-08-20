import type { ExtensionMessage, ExtensionResponse } from '../shared/messages';

export async function closeSidePanel() {
  const closePanel = chrome.sidePanel.close;

  if (typeof closePanel === 'function') {
    try {
      const response = (await chrome.runtime.sendMessage({
        type: 'GET_ACTIVE_TAB_CONTEXT',
      } satisfies ExtensionMessage)) as ExtensionResponse;
      const tabId = response.activeTabContext?.tabId;

      if (tabId) {
        await closePanel({ tabId });
        return;
      }
    } catch {
      // Older Chromium implementations can expose an incomplete close API.
    }
  }

  window.close();
}
