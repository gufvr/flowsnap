import type { ActiveTabContext } from '../shared/recordingTypes';

const ACTIVE_TAB_CONTEXT_KEY = 'activeTabContext';
let activeTabContext: ActiveTabContext | undefined;

export function captureActiveTabContext(tab: chrome.tabs.Tab) {
  if (!tab.id || tab.windowId === undefined || !tab.url) return undefined;

  activeTabContext = {
    tabId: tab.id,
    windowId: tab.windowId,
    url: tab.url,
  };
  return activeTabContext;
}

export async function persistActiveTabContext(context: ActiveTabContext) {
  try {
    await chrome.storage.session.set({ [ACTIVE_TAB_CONTEXT_KEY]: context });
    return true;
  } catch {
    return false;
  }
}

export async function getActiveTabContext(): Promise<ActiveTabContext | undefined> {
  if (activeTabContext) return activeTabContext;

  try {
    const result = await chrome.storage.session.get(ACTIVE_TAB_CONTEXT_KEY);
    const context = result[ACTIVE_TAB_CONTEXT_KEY] as Partial<ActiveTabContext> | undefined;

    if (
      typeof context?.tabId !== 'number' ||
      typeof context.windowId !== 'number' ||
      typeof context.url !== 'string'
    ) {
      return undefined;
    }

    activeTabContext = {
      tabId: context.tabId,
      windowId: context.windowId,
      url: context.url,
    };
    return activeTabContext;
  } catch {
    return undefined;
  }
}

export function clearActiveTabContext() {
  activeTabContext = undefined;
}
