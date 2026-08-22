import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecordedSteps } from './useRecordedSteps';

const storageGet = vi.fn();
const storageChangeAddListener = vi.fn();
const storageChangeRemoveListener = vi.fn();

function createStep(id: string, text: string) {
  return {
    schemaVersion: 4,
    id,
    type: 'click',
    url: 'https://example.com',
    timestamp: 1,
    selectors: {},
    element: { tagName: 'button' },
    description: {
      action: 'click',
      target: { type: 'button', name: text },
      source: 'text',
      text,
      locale: 'pt-BR',
    },
  };
}

describe('useRecordedSteps', () => {
  beforeEach(() => {
    storageGet.mockReset();
    storageChangeAddListener.mockReset();
    storageChangeRemoveListener.mockReset();
    storageGet.mockResolvedValue({ recordedSteps: [] });

    vi.stubGlobal('chrome', {
      storage: {
        local: { get: storageGet },
        onChanged: {
          addListener: storageChangeAddListener,
          removeListener: storageChangeRemoveListener,
        },
      },
    });
  });

  it('loads persisted steps when the panel opens', async () => {
    const persistedStep = createStep('persisted', 'Passo persistido');
    storageGet.mockResolvedValue({ recordedSteps: [persistedStep] });

    const { result } = renderHook(() => useRecordedSteps());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.steps).toEqual([persistedStep]);
  });

  it('reacts to local storage updates in capture order', async () => {
    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const handleStorageChange = storageChangeAddListener.mock.calls[0][0];
    const firstStep = createStep('first', 'Primeiro passo');
    const secondStep = createStep('second', 'Segundo passo');

    act(() => {
      handleStorageChange(
        { recordedSteps: { newValue: [firstStep, secondStep] } },
        'local',
      );
    });

    expect(result.current.steps).toEqual([firstStep, secondStep]);
  });

  it('does not let an older initial read replace a live update', async () => {
    let resolveInitialRead: (value: object) => void = () => undefined;
    storageGet.mockReturnValue(
      new Promise((resolve) => {
        resolveInitialRead = resolve;
      }),
    );

    const { result } = renderHook(() => useRecordedSteps());
    const handleStorageChange = storageChangeAddListener.mock.calls[0][0];
    const liveStep = createStep('live', 'Passo ao vivo');

    act(() => {
      handleStorageChange(
        { recordedSteps: { newValue: [liveStep] } },
        'local',
      );
    });

    await act(async () => {
      resolveInitialRead({
        recordedSteps: [createStep('old', 'Passo desatualizado')],
      });
    });

    expect(result.current.steps).toEqual([liveStep]);
  });

  it('keeps the list when an unrelated local value changes', async () => {
    const persistedStep = createStep('persisted', 'Passo persistido');
    storageGet.mockResolvedValue({ recordedSteps: [persistedStep] });

    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const handleStorageChange = storageChangeAddListener.mock.calls[0][0];

    act(() => {
      handleStorageChange(
        { recordingState: { newValue: { isRecording: false } } },
        'local',
      );
    });

    expect(result.current.steps).toEqual([persistedStep]);
  });

  it('removes its storage listener when the panel closes', () => {
    const { unmount } = renderHook(() => useRecordedSteps());
    const handleStorageChange = storageChangeAddListener.mock.calls[0][0];

    unmount();

    expect(storageChangeRemoveListener).toHaveBeenCalledWith(
      handleStorageChange,
    );
  });
});
