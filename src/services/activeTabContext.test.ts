import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadActiveTabContext, saveActiveTabContext } from './activeTabContext';

const get = vi.fn();
const set = vi.fn();

describe('activeTabContext', () => {
  beforeEach(() => {
    get.mockReset();
    set.mockReset();
    set.mockResolvedValue(undefined);

    vi.stubGlobal('chrome', {
      storage: { session: { get, set } },
    });
  });

  it('stores the tab received from an extension action', async () => {
    await expect(
      saveActiveTabContext({
        id: 12,
        windowId: 3,
        url: 'https://example.com/form',
      } as chrome.tabs.Tab),
    ).resolves.toBe(true);
    expect(set).toHaveBeenCalledWith({
      activeTabContext: {
        tabId: 12,
        windowId: 3,
        url: 'https://example.com/form',
      },
    });
  });

  it('does not store a tab whose protected URL is unavailable', async () => {
    await expect(
      saveActiveTabContext({ id: 12, windowId: 3 } as chrome.tabs.Tab),
    ).resolves.toBe(false);
    expect(set).not.toHaveBeenCalled();
  });

  it('loads a valid context from session storage', async () => {
    get.mockResolvedValue({
      activeTabContext: {
        tabId: 12,
        windowId: 3,
        url: 'https://example.com/form',
      },
    });

    await expect(loadActiveTabContext()).resolves.toEqual({
      tabId: 12,
      windowId: 3,
      url: 'https://example.com/form',
    });
  });

  it('ignores an incomplete stored context', async () => {
    get.mockResolvedValue({ activeTabContext: { tabId: 12 } });

    await expect(loadActiveTabContext()).resolves.toBeUndefined();
  });
});
