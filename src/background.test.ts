import { beforeEach, describe, expect, it, vi } from 'vitest';

const actionOnClicked = vi.fn();
const runtimeOnInstalled = vi.fn();
const runtimeOnStartup = vi.fn();
const runtimeOnMessage = vi.fn();
const openSidePanel = vi.fn();
const setPanelBehavior = vi.fn();
const getSessionStorage = vi.fn();
const setSessionStorage = vi.fn();
const getLocalStorage = vi.fn();
const setLocalStorage = vi.fn();

let localStorageData: Record<string, unknown>;

describe('extension action', () => {
  beforeEach(async () => {
    vi.resetModules();
    actionOnClicked.mockReset();
    runtimeOnInstalled.mockReset();
    runtimeOnStartup.mockReset();
    runtimeOnMessage.mockReset();
    openSidePanel.mockReset();
    setPanelBehavior.mockReset();
    getSessionStorage.mockReset();
    setSessionStorage.mockReset();
    getLocalStorage.mockReset();
    setLocalStorage.mockReset();
    localStorageData = {};
    openSidePanel.mockResolvedValue(undefined);
    getSessionStorage.mockResolvedValue({});
    setSessionStorage.mockResolvedValue(undefined);
    getLocalStorage.mockImplementation((keys: string | string[]) => {
      const requestedKeys = Array.isArray(keys) ? keys : [keys];
      return Promise.resolve(
        Object.fromEntries(
          requestedKeys.map((key) => [key, localStorageData[key]]),
        ),
      );
    });
    setLocalStorage.mockImplementation((values: Record<string, unknown>) => {
      Object.assign(localStorageData, values);
      return Promise.resolve();
    });

    vi.stubGlobal('chrome', {
      action: { onClicked: { addListener: actionOnClicked } },
      runtime: {
        onInstalled: { addListener: runtimeOnInstalled },
        onStartup: { addListener: runtimeOnStartup },
        onMessage: { addListener: runtimeOnMessage },
      },
      sidePanel: { open: openSidePanel, setPanelBehavior },
      storage: {
        session: { get: getSessionStorage, set: setSessionStorage },
        local: { get: getLocalStorage, set: setLocalStorage },
      },
      scripting: { executeScript: vi.fn() },
      tabs: { sendMessage: vi.fn() },
    });

    await import('./background');
  });

  it('opens synchronously even while context persistence is pending', () => {
    setSessionStorage.mockReturnValue(new Promise(() => undefined));
    const handleActionClick = actionOnClicked.mock.calls[0][0];

    const result = handleActionClick({
      id: 21,
      windowId: 4,
      url: 'https://example.com/form',
    });

    expect(result).toBeUndefined();
    expect(openSidePanel).toHaveBeenCalledWith({ tabId: 21 });
    expect(setSessionStorage).toHaveBeenCalledWith({
      activeTabContext: {
        tabId: 21,
        windowId: 4,
        url: 'https://example.com/form',
      },
    });
    expect(openSidePanel.mock.invocationCallOrder[0]).toBeLessThan(
      setSessionStorage.mock.invocationCallOrder[0],
    );
  });

  it('contains a rejected side panel promise', async () => {
    openSidePanel.mockRejectedValue(new Error('User gesture unavailable'));
    const handleActionClick = actionOnClicked.mock.calls[0][0];

    expect(() =>
      handleActionClick({
        id: 21,
        windowId: 4,
        url: 'https://example.com/form',
      }),
    ).not.toThrow();

    await Promise.resolve();
  });

  it('does not open the panel when activeTab did not expose a URL', () => {
    const handleActionClick = actionOnClicked.mock.calls[0][0];

    handleActionClick({ id: 21, windowId: 4 });

    expect(setSessionStorage).not.toHaveBeenCalled();
    expect(openSidePanel).not.toHaveBeenCalled();
  });

  it('stores focus navigation in the active tab recording', async () => {
    localStorageData = {
      recordingState: {
        isRecording: true,
        tabId: 21,
        origin: 'https://example.com',
      },
      recordedSteps: [],
    };
    const message = {
      type: 'RECORDED_FOCUS_NAVIGATION',
      payload: {
        schemaVersion: 4,
        id: 'focus-password',
        type: 'focus-navigation',
        url: 'https://example.com/form',
        timestamp: 1,
        key: 'Tab',
        direction: 'forward',
        selectors: {
          recommended: {
            strategy: 'label',
            value: 'Password',
            score: 85,
            isUnique: true,
            validation: {
              status: 'valid',
              matchCount: 1,
              matchesTarget: true,
            },
          },
          alternatives: [],
        },
        element: { tagName: 'input', inputType: 'password' },
        description: {
          action: 'focusNavigation',
          target: { type: 'field', name: 'Password' },
          source: 'label',
          text: 'Navegou para o campo "Password"',
          locale: 'pt-BR',
        },
      },
    } as const;
    const handleMessage = runtimeOnMessage.mock.calls[0][0];

    const response = await new Promise((resolve) => {
      expect(handleMessage(message, { tab: { id: 21 } }, resolve)).toBe(true);
    });

    expect(response).toEqual({ success: true });
    expect(localStorageData.recordedSteps).toEqual([message.payload]);
  });
});
