import type { RecordedStep, RecordingState } from '../shared/recordingTypes';

export type { RecordingState } from '../shared/recordingTypes';

const STORAGE_KEY = 'recordingState';
const STEPS_STORAGE_KEY = 'recordedSteps';
const DEFAULT_STATE: RecordingState = { isRecording: false };

function getLocalStorage() {
  return globalThis.chrome?.storage?.local;
}

export async function loadRecordingState(): Promise<RecordingState> {
  try {
    const storage = getLocalStorage();

    if (!storage) {
      return DEFAULT_STATE;
    }

    const result = await storage.get(STORAGE_KEY);
    const storedState = result[STORAGE_KEY] as Partial<RecordingState> | undefined;

    if (typeof storedState?.isRecording !== 'boolean') {
      return DEFAULT_STATE;
    }

    return {
      isRecording: storedState.isRecording,
      tabId: storedState.tabId,
      origin: storedState.origin,
      currentUrl: storedState.currentUrl,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function loadRecordedSteps(): Promise<RecordedStep[]> {
  try {
    const storage = getLocalStorage();
    if (!storage) return [];

    const result = await storage.get(STEPS_STORAGE_KEY);
    return Array.isArray(result[STEPS_STORAGE_KEY]) ? result[STEPS_STORAGE_KEY] : [];
  } catch {
    return [];
  }
}

export async function saveRecordingState(state: RecordingState): Promise<boolean> {
  try {
    const storage = getLocalStorage();

    if (!storage) {
      return false;
    }

    await storage.set({ [STORAGE_KEY]: state });
    return true;
  } catch {
    return false;
  }
}
