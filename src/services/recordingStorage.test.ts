import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadRecordedSteps,
  loadRecordingState,
  saveRecordingState,
} from './recordingStorage';

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

  it('keeps schema version 2 recordings readable', async () => {
    const previousRecording = {
      schemaVersion: 2,
      id: 'previous-click',
      type: 'click',
      url: 'https://example.com',
      timestamp: 1,
      selectors: {
        recommended: {
          strategy: 'id',
          value: 'login',
          score: 80,
          isUnique: true,
        },
        alternatives: [],
      },
      element: { tagName: 'button' },
    };
    storageGet.mockResolvedValue({ recordedSteps: [previousRecording] });

    await expect(loadRecordedSteps()).resolves.toEqual([previousRecording]);
  });

  it('keeps schema version 3 recordings readable', async () => {
    const previousRecording = {
      schemaVersion: 3,
      id: 'previous-click',
      type: 'click',
      url: 'https://example.com',
      timestamp: 1,
      selectors: {
        recommended: {
          strategy: 'id',
          value: 'login',
          score: 80,
          isUnique: true,
          validation: {
            status: 'valid',
            matchCount: 1,
            matchesTarget: true,
          },
        },
        alternatives: [],
      },
      element: { tagName: 'button' },
    };
    storageGet.mockResolvedValue({ recordedSteps: [previousRecording] });

    await expect(loadRecordedSteps()).resolves.toEqual([previousRecording]);
  });

  it('does not migrate mixed or incomplete recordings while loading them', async () => {
    const recordings = [
      { schemaVersion: 4, type: 'click', description: { text: 'Persistida' } },
      { schemaVersion: 3, type: 'click', element: { tagName: 'button' } },
      { schemaVersion: 2, type: 'click' },
      { type: 'click', selector: { css: 'button' } },
      { corrupted: true },
    ];
    storageGet.mockResolvedValue({ recordedSteps: recordings });

    await expect(loadRecordedSteps()).resolves.toEqual(recordings);
    expect(storageSet).not.toHaveBeenCalled();
  });
});
