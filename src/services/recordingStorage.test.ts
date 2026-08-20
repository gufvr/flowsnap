import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRecordingState, saveRecordingState } from './recordingStorage';

const storageGet = vi.fn();
const storageSet = vi.fn();

describe('recordingStorage', () => {
  beforeEach(() => {
    storageGet.mockReset();
    storageSet.mockReset();
    vi.stubGlobal('chrome', {
      storage: { local: { get: storageGet, set: storageSet } },
    });
  });

  it('loads a valid persisted state', async () => {
    storageGet.mockResolvedValue({ recordingState: { isRecording: true } });

    await expect(loadRecordingState()).resolves.toEqual({ isRecording: true });
  });

  it('falls back to stopped when reading fails', async () => {
    storageGet.mockRejectedValue(new Error('Storage unavailable'));

    await expect(loadRecordingState()).resolves.toEqual({ isRecording: false });
  });

  it('writes a recording state', async () => {
    storageSet.mockResolvedValue(undefined);

    await expect(saveRecordingState({ isRecording: true })).resolves.toBe(true);
    expect(storageSet).toHaveBeenCalledWith({
      recordingState: { isRecording: true },
    });
  });

  it('reports a failed write without throwing', async () => {
    storageSet.mockRejectedValue(new Error('Storage unavailable'));

    await expect(saveRecordingState({ isRecording: true })).resolves.toBe(false);
  });
});
