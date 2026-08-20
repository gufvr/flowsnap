import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureActiveTabContext,
  clearActiveTabContext,
  getActiveTabContext,
  persistActiveTabContext,
} from './activeTabContext';

const get = vi.fn();
const set = vi.fn();

describe('activeTabContext', () => {
  beforeEach(() => {
    clearActiveTabContext();
    get.mockReset();
    set.mockReset();
    set.mockResolvedValue(undefined);

    vi.stubGlobal('chrome', {
      storage: { session: { get, set } },
    });
  });

  it('captures the action tab synchronously in memory', async () => {
    const context = captureActiveTabContext({
      id: 12,
      windowId: 3,
      url: 'https://example.com/form',
    } as chrome.tabs.Tab);

    expect(context).toEqual({
      tabId: 12,
      windowId: 3,
      url: 'https://example.com/form',
    });
    await expect(getActiveTabContext()).resolves.toEqual(context);
    expect(get).not.toHaveBeenCalled();
  });

  it('does not capture a tab whose protected URL is unavailable', () => {
    const context = captureActiveTabContext({
      id: 12,
      windowId: 3,
    } as chrome.tabs.Tab);

    expect(context).toBeUndefined();
  });

  it('persists a captured context for service worker restarts', async () => {
    const context = {
      tabId: 12,
      windowId: 3,
      url: 'https://example.com/form',
    };

    await expect(persistActiveTabContext(context)).resolves.toBe(true);
    expect(set).toHaveBeenCalledWith({ activeTabContext: context });
  });

  it('contains persistence failures instead of rejecting', async () => {
    set.mockRejectedValue(new Error('Storage unavailable'));

    await expect(
      persistActiveTabContext({
        tabId: 12,
        windowId: 3,
        url: 'https://example.com/form',
      }),
    ).resolves.toBe(false);
  });

  it('restores the context from session storage after memory is lost', async () => {
    get.mockResolvedValue({
      activeTabContext: {
        tabId: 12,
        windowId: 3,
        url: 'https://example.com/form',
      },
    });

    await expect(getActiveTabContext()).resolves.toEqual({
      tabId: 12,
      windowId: 3,
      url: 'https://example.com/form',
    });
  });
});
