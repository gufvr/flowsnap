import type { ExtensionMessage, ExtensionResponse } from './shared/messages';
import type { RecordedStep, RecordingState } from './shared/recordingTypes';
import { saveActiveTabContext } from './services/activeTabContext';

const RECORDING_STATE_KEY = 'recordingState';
const RECORDED_STEPS_KEY = 'recordedSteps';

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

chrome.runtime.onStartup.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

chrome.action.onClicked.addListener(async (tab) => {
  const hasContext = await saveActiveTabContext(tab);

  if (!hasContext || !tab.id) return;

  await chrome.sidePanel.open({ tabId: tab.id });
});

async function startRecording(
  tabId: number,
  origin: string,
): Promise<ExtensionResponse> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['assets/recorder.js'],
    });
    await chrome.tabs.sendMessage(tabId, { type: 'ACTIVATE_CLICK_RECORDER' });

    const state: RecordingState = { isRecording: true, tabId, origin };
    await chrome.storage.local.set({
      [RECORDING_STATE_KEY]: state,
      [RECORDED_STEPS_KEY]: [],
    });

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Não foi possível ativar a gravação nesta página.',
    };
  }
}

async function stopRecording(): Promise<ExtensionResponse> {
  const result = await chrome.storage.local.get(RECORDING_STATE_KEY);
  const currentState = result[RECORDING_STATE_KEY] as RecordingState | undefined;

  if (currentState?.tabId) {
    try {
      await chrome.tabs.sendMessage(currentState.tabId, {
        type: 'DEACTIVATE_CLICK_RECORDER',
      });
    } catch {
      // The tab may have navigated or closed. Persisting the stopped state is enough.
    }
  }

  await chrome.storage.local.set({
    [RECORDING_STATE_KEY]: { isRecording: false } satisfies RecordingState,
  });
  return { success: true };
}

async function storeClick(message: ExtensionMessage, sender: chrome.runtime.MessageSender) {
  if (message.type !== 'RECORDED_CLICK') return { success: false };

  const result = await chrome.storage.local.get([
    RECORDING_STATE_KEY,
    RECORDED_STEPS_KEY,
  ]);
  const state = result[RECORDING_STATE_KEY] as RecordingState | undefined;

  if (!state?.isRecording || state.tabId !== sender.tab?.id) {
    return { success: false };
  }

  const steps = (result[RECORDED_STEPS_KEY] as RecordedStep[] | undefined) ?? [];
  await chrome.storage.local.set({
    [RECORDED_STEPS_KEY]: [...steps, message.payload],
  });

  return { success: true };
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender,
    sendResponse: (response: ExtensionResponse) => void,
  ) => {
    const handleMessage = async () => {
      if (message.type === 'START_RECORDING') {
        return startRecording(message.payload.tabId, message.payload.origin);
      }

      if (message.type === 'STOP_RECORDING') return stopRecording();
      if (message.type === 'RECORDED_CLICK') return storeClick(message, sender);

      return { success: false };
    };

    void handleMessage().then(sendResponse);
    return true;
  },
);
