import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionMessage } from './shared/messages';
import type {
  RecordedClick,
  RecordedFieldFill,
} from './shared/recordingTypes';

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

function createRecordedClick(id: string): RecordedClick {
  return {
    schemaVersion: 4,
    id,
    type: 'click',
    url: 'https://example.com/form',
    timestamp: 1,
    selectors: {
      recommended: {
        strategy: 'css',
        value: 'button',
        score: 40,
        isUnique: true,
        validation: {
          status: 'valid',
          matchCount: 1,
          matchesTarget: true,
        },
      },
      alternatives: [],
    },
    element: { tagName: 'button', text: id },
    description: {
      action: 'click',
      target: { type: 'button', name: id },
      source: 'text',
      text: `Clicou no botão "${id}"`,
      locale: 'pt-BR',
    },
  };
}

function createRecordedFieldFill(id: string): RecordedFieldFill {
  return {
    schemaVersion: 5,
    id,
    type: 'field-fill',
    url: 'https://example.com/form',
    timestamp: 1,
    selectors: {
      recommended: {
        strategy: 'label',
        value: 'Username',
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
    element: { tagName: 'input', inputType: 'text' },
    value: { kind: 'plain', value: 'tester' },
    description: {
      action: 'fieldFill',
      target: { type: 'field', name: 'Username' },
      source: 'label',
      text: 'Preencheu o campo "Username" com "tester"',
      locale: 'pt-BR',
    },
  };
}

function dispatchMessage(
  message: ExtensionMessage,
  sender: { tab?: { id: number } } = {},
) {
  const handleMessage = runtimeOnMessage.mock.calls[0][0];

  return new Promise((resolve) => {
    expect(handleMessage(message, sender, resolve)).toBe(true);
  });
}

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
    const message: ExtensionMessage = {
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
    };
    const response = await dispatchMessage(message, { tab: { id: 21 } });

    expect(response).toEqual({ success: true });
    expect(localStorageData.recordedSteps).toEqual([message.payload]);
  });

  it('stores a schema 5 field fill in the active tab recording', async () => {
    const fill = createRecordedFieldFill('fill-username');
    localStorageData = {
      recordingState: {
        isRecording: true,
        tabId: 21,
        origin: 'https://example.com',
      },
      recordedSteps: [],
    };

    const response = await dispatchMessage(
      { type: 'RECORDED_FIELD_FILL', payload: fill },
      { tab: { id: 21 } },
    );

    expect(response).toEqual({ success: true });
    expect(localStorageData.recordedSteps).toEqual([fill]);
  });

  it('deletes one step and preserves mixed recordings in order', async () => {
    const first = createRecordedClick('first');
    const legacy = { type: 'click', selector: { css: 'a' } };
    const last = createRecordedClick('last');
    localStorageData = {
      recordingState: { isRecording: false },
      recordedSteps: [first, legacy, last],
    };

    const response = await dispatchMessage({
      type: 'DELETE_RECORDED_STEP',
      payload: { stepIndex: 1 },
    });

    expect(response).toEqual({ success: true });
    expect(localStorageData.recordedSteps).toEqual([first, last]);
    expect(localStorageData.recordingState).toEqual({ isRecording: false });
  });

  it('rejects deletion when a stable id no longer matches the index', async () => {
    const current = createRecordedClick('current');
    localStorageData = { recordedSteps: [current] };

    const response = await dispatchMessage({
      type: 'DELETE_RECORDED_STEP',
      payload: { stepIndex: 0, expectedId: 'stale-id' },
    });

    expect(response).toEqual({
      success: false,
      error: 'A lista de passos foi atualizada. Tente novamente.',
    });
    expect(localStorageData.recordedSteps).toEqual([current]);
  });

  it('clears every step without stopping an active recording', async () => {
    localStorageData = {
      recordingState: {
        isRecording: true,
        tabId: 21,
        origin: 'https://example.com',
      },
      recordedSteps: [createRecordedClick('first')],
    };

    const response = await dispatchMessage({ type: 'CLEAR_RECORDED_STEPS' });

    expect(response).toEqual({ success: true });
    expect(localStorageData.recordedSteps).toEqual([]);
    expect(localStorageData.recordingState).toMatchObject({
      isRecording: true,
      tabId: 21,
    });
  });

  it('serializes a capture followed by deletion without losing the capture', async () => {
    const first = createRecordedClick('first');
    const second = createRecordedClick('second');
    localStorageData = {
      recordingState: {
        isRecording: true,
        tabId: 21,
        origin: 'https://example.com',
      },
      recordedSteps: [first],
    };

    const capture = dispatchMessage(
      { type: 'RECORDED_CLICK', payload: second },
      { tab: { id: 21 } },
    );
    const deletion = dispatchMessage({
      type: 'DELETE_RECORDED_STEP',
      payload: { stepIndex: 0, expectedId: 'first' },
    });

    await expect(Promise.all([capture, deletion])).resolves.toEqual([
      { success: true },
      { success: true },
    ]);
    expect(localStorageData.recordedSteps).toEqual([second]);
  });
});
