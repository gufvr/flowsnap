import type { ExtensionMessage, ExtensionResponse } from './shared/messages';
import type { RecordedStep, RecordingState } from './shared/recordingTypes';
import {
  captureActiveTabContext,
  getActiveTabContext,
  persistActiveTabContext,
} from './services/activeTabContext';

const RECORDING_STATE_KEY = 'recordingState';
const RECORDED_STEPS_KEY = 'recordedSteps';

type RecordedStepMessage = Extract<
  ExtensionMessage,
  {
    type:
      | 'RECORDED_CLICK'
      | 'RECORDED_FOCUS_NAVIGATION'
      | 'RECORDED_FIELD_FILL';
  }
>;

type RecordedStepActionMessage = Extract<
  ExtensionMessage,
  { type: 'DELETE_RECORDED_STEP' | 'CLEAR_RECORDED_STEPS' }
>;

let recordedStepOperationQueue: Promise<void> = Promise.resolve();

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch(() => undefined);
});

chrome.runtime.onStartup.addListener(() => {
  void chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch(() => undefined);
});

chrome.action.onClicked.addListener((tab) => {
  const context = captureActiveTabContext(tab);

  if (!context) return;

  void chrome.sidePanel.open({ tabId: context.tabId }).catch(() => undefined);
  void persistActiveTabContext(context);
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

async function appendRecordedStep(
  message: RecordedStepMessage,
  sender: chrome.runtime.MessageSender,
) {
  const result = await chrome.storage.local.get([
    RECORDING_STATE_KEY,
    RECORDED_STEPS_KEY,
  ]);
  const state = result[RECORDING_STATE_KEY] as RecordingState | undefined;

  if (!state?.isRecording || state.tabId !== sender.tab?.id) {
    return { success: false };
  }

  const storedSteps = result[RECORDED_STEPS_KEY];
  const steps = Array.isArray(storedSteps) ? storedSteps : [];
  await chrome.storage.local.set({
    [RECORDED_STEPS_KEY]: [...steps, message.payload],
  });

  return { success: true };
}

async function deleteRecordedStep(
  message: Extract<RecordedStepActionMessage, { type: 'DELETE_RECORDED_STEP' }>,
): Promise<ExtensionResponse> {
  const { stepIndex, expectedId } = message.payload;

  if (!Number.isInteger(stepIndex) || stepIndex < 0) {
    return { success: false, error: 'O passo solicitado é inválido.' };
  }

  const result = await chrome.storage.local.get(RECORDED_STEPS_KEY);
  const storedSteps = result[RECORDED_STEPS_KEY];
  const steps: RecordedStep[] = Array.isArray(storedSteps) ? storedSteps : [];
  const target = steps[stepIndex];

  if (!target) {
    return { success: false, error: 'O passo não está mais disponível.' };
  }

  if (
    expectedId &&
    (typeof target.id !== 'string' || target.id !== expectedId)
  ) {
    return {
      success: false,
      error: 'A lista de passos foi atualizada. Tente novamente.',
    };
  }

  await chrome.storage.local.set({
    [RECORDED_STEPS_KEY]: steps.filter((_, index) => index !== stepIndex),
  });

  return { success: true };
}

async function clearRecordedSteps(): Promise<ExtensionResponse> {
  await chrome.storage.local.set({ [RECORDED_STEPS_KEY]: [] });
  return { success: true };
}

function enqueueRecordedStepOperation<T>(operation: () => Promise<T>) {
  const result = recordedStepOperationQueue.then(operation);

  recordedStepOperationQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}

function storeRecordedStep(
  message: RecordedStepMessage,
  sender: chrome.runtime.MessageSender,
) {
  return enqueueRecordedStepOperation(() =>
    appendRecordedStep(message, sender),
  );
}

function performRecordedStepAction(message: RecordedStepActionMessage) {
  return enqueueRecordedStepOperation(() => {
    if (message.type === 'DELETE_RECORDED_STEP') {
      return deleteRecordedStep(message);
    }

    return clearRecordedSteps();
  });
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

      if (message.type === 'GET_ACTIVE_TAB_CONTEXT') {
        const activeTabContext = await getActiveTabContext();
        return { success: Boolean(activeTabContext), activeTabContext };
      }

      if (message.type === 'STOP_RECORDING') return stopRecording();
      if (
        message.type === 'RECORDED_CLICK' ||
        message.type === 'RECORDED_FOCUS_NAVIGATION' ||
        message.type === 'RECORDED_FIELD_FILL'
      ) {
        return storeRecordedStep(message, sender);
      }

      if (
        message.type === 'DELETE_RECORDED_STEP' ||
        message.type === 'CLEAR_RECORDED_STEPS'
      ) {
        return performRecordedStepAction(message);
      }

      return { success: false };
    };

    void handleMessage()
      .then(sendResponse)
      .catch(() =>
        sendResponse({
          success: false,
          error: 'Não foi possível atualizar os passos gravados.',
        }),
      );
    return true;
  },
);
