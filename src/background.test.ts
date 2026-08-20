import { beforeEach, describe, expect, it, vi } from 'vitest';

const actionOnClicked = vi.fn();
const runtimeOnInstalled = vi.fn();
const runtimeOnStartup = vi.fn();
const runtimeOnMessage = vi.fn();
const openSidePanel = vi.fn();
const setPanelBehavior = vi.fn();
const setSessionStorage = vi.fn();

describe('extension action', () => {
  beforeEach(async () => {
    vi.resetModules();
    actionOnClicked.mockReset();
    runtimeOnInstalled.mockReset();
    runtimeOnStartup.mockReset();
    runtimeOnMessage.mockReset();
    openSidePanel.mockReset();
    setPanelBehavior.mockReset();
    setSessionStorage.mockReset();
    openSidePanel.mockResolvedValue(undefined);
    setSessionStorage.mockResolvedValue(undefined);

    vi.stubGlobal('chrome', {
      action: { onClicked: { addListener: actionOnClicked } },
      runtime: {
        onInstalled: { addListener: runtimeOnInstalled },
        onStartup: { addListener: runtimeOnStartup },
        onMessage: { addListener: runtimeOnMessage },
      },
      sidePanel: { open: openSidePanel, setPanelBehavior },
      storage: { session: { set: setSessionStorage } },
    });

    await import('./background');
  });

  it('stores the protected tab context before opening its side panel', async () => {
    const handleActionClick = actionOnClicked.mock.calls[0][0];

    await handleActionClick({
      id: 21,
      windowId: 4,
      url: 'https://example.com/form',
    });

    expect(setSessionStorage).toHaveBeenCalledWith({
      activeTabContext: {
        tabId: 21,
        windowId: 4,
        url: 'https://example.com/form',
      },
    });
    expect(openSidePanel).toHaveBeenCalledWith({ tabId: 21 });
    expect(setSessionStorage.mock.invocationCallOrder[0]).toBeLessThan(
      openSidePanel.mock.invocationCallOrder[0],
    );
  });

  it('does not open the panel when activeTab did not expose a URL', async () => {
    const handleActionClick = actionOnClicked.mock.calls[0][0];

    await handleActionClick({ id: 21, windowId: 4 });

    expect(setSessionStorage).not.toHaveBeenCalled();
    expect(openSidePanel).not.toHaveBeenCalled();
  });
});
