export interface ActiveTabContext {
  tabId: number;
  windowId: number;
  url: string;
}

const ACTIVE_TAB_CONTEXT_KEY = 'activeTabContext';

export async function saveActiveTabContext(tab: chrome.tabs.Tab) {
  if (!tab.id || tab.windowId === undefined || !tab.url) return false;

  const context: ActiveTabContext = {
    tabId: tab.id,
    windowId: tab.windowId,
    url: tab.url,
  };
  await chrome.storage.session.set({ [ACTIVE_TAB_CONTEXT_KEY]: context });
  return true;
}

export async function loadActiveTabContext(): Promise<ActiveTabContext | undefined> {
  const result = await chrome.storage.session.get(ACTIVE_TAB_CONTEXT_KEY);
  const context = result[ACTIVE_TAB_CONTEXT_KEY] as Partial<ActiveTabContext> | undefined;

  if (
    typeof context?.tabId !== 'number' ||
    typeof context.windowId !== 'number' ||
    typeof context.url !== 'string'
  ) {
    return undefined;
  }

  return {
    tabId: context.tabId,
    windowId: context.windowId,
    url: context.url,
  };
}
