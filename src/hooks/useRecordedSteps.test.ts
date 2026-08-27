import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  deleteRecordedStep,
  clearRecordedSteps,
  moveRecordedStep,
  updateRecordedStepDescription,
} = vi.hoisted(() => ({
  deleteRecordedStep: vi.fn(),
  clearRecordedSteps: vi.fn(),
  moveRecordedStep: vi.fn(),
  updateRecordedStepDescription: vi.fn(),
}));

vi.mock('../services/recordedStepActions', () => ({
  deleteRecordedStep,
  clearRecordedSteps,
  moveRecordedStep,
  updateRecordedStepDescription,
}));

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
    deleteRecordedStep.mockReset();
    clearRecordedSteps.mockReset();
    moveRecordedStep.mockReset();
    updateRecordedStepDescription.mockReset();
    storageGet.mockResolvedValue({ recordedSteps: [] });
    deleteRecordedStep.mockResolvedValue(undefined);
    clearRecordedSteps.mockResolvedValue(undefined);
    moveRecordedStep.mockResolvedValue(undefined);
    updateRecordedStepDescription.mockResolvedValue(undefined);

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

  it('deletes through the background and waits for the reactive update', async () => {
    const persistedStep = createStep('persisted', 'Passo persistido');
    storageGet.mockResolvedValue({ recordedSteps: [persistedStep] });
    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.removeStep(0)).resolves.toBe(true);
    });

    expect(deleteRecordedStep).toHaveBeenCalledWith(0, 'persisted');
    expect(result.current.steps).toEqual([persistedStep]);
    expect(result.current.feedback).toEqual({
      type: 'success',
      message: 'Passo 1 excluído.',
    });

    const handleStorageChange = storageChangeAddListener.mock.calls[0][0];
    act(() => {
      handleStorageChange({ recordedSteps: { newValue: [] } }, 'local');
    });

    expect(result.current.steps).toEqual([]);
  });

  it('deletes incomplete legacy steps using their index', async () => {
    storageGet.mockResolvedValue({ recordedSteps: [{ type: 'click' }] });
    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.removeStep(0);
    });

    expect(deleteRecordedStep).toHaveBeenCalledWith(0, undefined);
  });

  it('updates a description and exposes its pending and success states', async () => {
    const persistedStep = createStep('persisted', 'Passo persistido');
    storageGet.mockResolvedValue({ recordedSteps: [persistedStep] });
    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const expectedReference = JSON.stringify(persistedStep);

    await act(async () => {
      await expect(
        result.current.editStepDescription(
          0,
          'Descrição editada',
          expectedReference,
          'persisted',
        ),
      ).resolves.toBe(true);
    });

    expect(updateRecordedStepDescription).toHaveBeenCalledWith(
      0,
      expectedReference,
      'Descrição editada',
      'persisted',
    );
    expect(result.current.feedback).toEqual({
      type: 'success',
      message: 'Descrição do passo 1 atualizada.',
    });
  });

  it('moves a step with both snapshot identities and waits for storage', async () => {
    const first = createStep('first', 'Primeiro passo');
    const second = createStep('second', 'Segundo passo');
    storageGet.mockResolvedValue({ recordedSteps: [first, second] });
    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.moveStep(1, 0)).resolves.toBe(true);
    });

    expect(moveRecordedStep).toHaveBeenCalledWith(
      1,
      0,
      JSON.stringify(second),
      JSON.stringify(first),
      'second',
      'first',
    );
    expect(result.current.steps).toEqual([first, second]);
    expect(result.current.feedback).toEqual({
      type: 'success',
      message: 'Passo movido para a posição 1.',
    });

    const handleStorageChange = storageChangeAddListener.mock.calls[0][0];
    act(() => {
      handleStorageChange(
        { recordedSteps: { newValue: [second, first] } },
        'local',
      );
    });

    expect(result.current.steps).toEqual([second, first]);
  });

  it('prevents overlapping mutations', async () => {
    let finishDeletion: () => void = () => undefined;
    deleteRecordedStep.mockReturnValue(
      new Promise<void>((resolve) => {
        finishDeletion = resolve;
      }),
    );
    storageGet.mockResolvedValue({
      recordedSteps: [createStep('persisted', 'Passo persistido')],
    });
    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let firstMutation: Promise<boolean> | undefined;
    let secondMutation: Promise<boolean> | undefined;
    act(() => {
      firstMutation = result.current.removeStep(0);
      secondMutation = result.current.clearSteps();
    });

    await expect(secondMutation).resolves.toBe(false);
    expect(result.current.pendingMutation).toEqual({
      type: 'delete',
      stepIndex: 0,
    });
    expect(clearRecordedSteps).not.toHaveBeenCalled();

    await act(async () => {
      finishDeletion();
      await firstMutation;
    });

    expect(result.current.pendingMutation).toBeUndefined();
  });

  it('shows accessible error data when a mutation fails', async () => {
    deleteRecordedStep.mockRejectedValue(
      new Error('A lista de passos foi atualizada. Tente novamente.'),
    );
    storageGet.mockResolvedValue({
      recordedSteps: [createStep('persisted', 'Passo persistido')],
    });
    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.removeStep(0)).resolves.toBe(false);
    });

    expect(result.current.feedback).toEqual({
      type: 'error',
      message: 'A lista de passos foi atualizada. Tente novamente.',
    });
  });

  it('clears every step through the background', async () => {
    const { result } = renderHook(() => useRecordedSteps());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.clearSteps()).resolves.toBe(true);
    });

    expect(clearRecordedSteps).toHaveBeenCalledOnce();
    expect(result.current.feedback).toEqual({
      type: 'success',
      message: 'Todos os passos foram removidos.',
    });
  });
});
