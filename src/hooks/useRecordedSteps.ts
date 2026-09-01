import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addCurrentUrlAssertion,
  clearRecordedSteps,
  deleteRecordedStep,
  moveRecordedStep,
  updateRecordedStepDescription,
} from '../services/recordedStepActions';
import { loadRecordedSteps } from '../services/recordingStorage';
import {
  getRecordedStepId,
  getRecordedStepReference,
} from '../shared/recordedStepIdentity';
import type { RecordedStep } from '../shared/recordingTypes';

const RECORDED_STEPS_KEY = 'recordedSteps';
const FEEDBACK_DURATION_MS = 3000;

export type RecordedStepMutation =
  | { type: 'add-url-assertion' }
  | { type: 'delete'; stepIndex: number }
  | { type: 'edit'; stepIndex: number }
  | { type: 'move'; fromIndex: number; toIndex: number }
  | { type: 'clear' };

export interface RecordedStepsFeedback {
  type: 'success' | 'error';
  message: string;
}

function getStepId(step: unknown) {
  if (
    typeof step === 'object' &&
    step !== null &&
    'id' in step &&
    typeof step.id === 'string'
  ) {
    return step.id;
  }

  return undefined;
}

export function useRecordedSteps() {
  const [steps, setSteps] = useState<RecordedStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMutation, setPendingMutation] =
    useState<RecordedStepMutation>();
  const [feedback, setFeedback] = useState<RecordedStepsFeedback>();
  const mutationInProgress = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isMounted = useRef(true);

  useEffect(() => {
    let hasReceivedStorageUpdate = false;

    isMounted.current = true;

    loadRecordedSteps().then((storedSteps) => {
      if (!isMounted.current) return;

      if (!hasReceivedStorageUpdate) setSteps(storedSteps);
      setIsLoading(false);
    });

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return;

      const stepsChange = changes[RECORDED_STEPS_KEY];
      if (!stepsChange) return;

      const storedSteps = stepsChange.newValue;
      hasReceivedStorageUpdate = true;
      setSteps(Array.isArray(storedSteps) ? storedSteps : []);
      setIsLoading(false);
    };

    globalThis.chrome?.storage?.onChanged?.addListener(handleStorageChange);

    return () => {
      isMounted.current = false;
      clearTimeout(feedbackTimer.current);
      globalThis.chrome?.storage?.onChanged?.removeListener(handleStorageChange);
    };
  }, []);

  const showFeedback = useCallback((nextFeedback: RecordedStepsFeedback) => {
    clearTimeout(feedbackTimer.current);
    setFeedback(nextFeedback);
    feedbackTimer.current = setTimeout(
      () => setFeedback(undefined),
      FEEDBACK_DURATION_MS,
    );
  }, []);

  const runMutation = useCallback(
    async (
      mutation: RecordedStepMutation,
      action: () => Promise<void>,
      successMessage: string,
      fallbackError: string,
    ) => {
      if (mutationInProgress.current) return false;

      mutationInProgress.current = true;
      clearTimeout(feedbackTimer.current);
      setFeedback(undefined);
      setPendingMutation(mutation);

      try {
        await action();
        if (isMounted.current) {
          showFeedback({ type: 'success', message: successMessage });
        }
        return true;
      } catch (error) {
        if (isMounted.current) {
          showFeedback({
            type: 'error',
            message: error instanceof Error ? error.message : fallbackError,
          });
        }
        return false;
      } finally {
        mutationInProgress.current = false;
        if (isMounted.current) setPendingMutation(undefined);
      }
    },
    [showFeedback],
  );

  const removeStep = useCallback(
    (stepIndex: number) => {
      const expectedId = getStepId(steps[stepIndex]);

      return runMutation(
        { type: 'delete', stepIndex },
        () => deleteRecordedStep(stepIndex, expectedId),
        `Passo ${stepIndex + 1} excluído.`,
        'Não foi possível excluir o passo.',
      );
    },
    [runMutation, steps],
  );

  const clearSteps = useCallback(
    () =>
      runMutation(
        { type: 'clear' },
        clearRecordedSteps,
        'Todos os passos foram removidos.',
        'Não foi possível limpar os passos.',
      ),
    [runMutation],
  );

  const addUrlAssertion = useCallback(
    () =>
      runMutation(
        { type: 'add-url-assertion' },
        addCurrentUrlAssertion,
        'Verificação da URL adicionada.',
        'Não foi possível adicionar a verificação da URL.',
      ),
    [runMutation],
  );

  const editStepDescription = useCallback(
    (
      stepIndex: number,
      text: string,
      expectedReference: string,
      expectedId?: string,
    ) =>
      runMutation(
        { type: 'edit', stepIndex },
        () =>
          updateRecordedStepDescription(
            stepIndex,
            expectedReference,
            text,
            expectedId,
          ),
        `Descrição do passo ${stepIndex + 1} atualizada.`,
        'Não foi possível atualizar a descrição do passo.',
      ),
    [runMutation],
  );

  const moveStep = useCallback(
    (fromIndex: number, toIndex: number) => {
      const step = steps[fromIndex];
      const target = steps[toIndex];
      const expectedStepReference = getRecordedStepReference(step);
      const expectedTargetReference = getRecordedStepReference(target);

      if (
        Math.abs(fromIndex - toIndex) !== 1 ||
        expectedStepReference === undefined ||
        expectedTargetReference === undefined
      ) {
        showFeedback({
          type: 'error',
          message: 'Não foi possível identificar os passos para movimentação.',
        });
        return Promise.resolve(false);
      }

      return runMutation(
        { type: 'move', fromIndex, toIndex },
        () =>
          moveRecordedStep(
            fromIndex,
            toIndex,
            expectedStepReference,
            expectedTargetReference,
            getRecordedStepId(step),
            getRecordedStepId(target),
          ),
        `Passo movido para a posição ${toIndex + 1}.`,
        'Não foi possível mover o passo.',
      );
    },
    [runMutation, showFeedback, steps],
  );

  return {
    steps,
    isLoading,
    pendingMutation,
    feedback,
    addUrlAssertion,
    removeStep,
    editStepDescription,
    moveStep,
    clearSteps,
  };
}
