import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelElementVisibilityPicker,
  startElementVisibilityPicker,
} from '../services/elementVisibilityPicker';
import type { ElementVisibilityPickerState } from '../shared/recordingTypes';
import type { RecordedStepsFeedback } from './useRecordedSteps';

const PICKER_KEY = 'elementVisibilityPickerState';
const FEEDBACK_DURATION_MS = 3000;

export function useElementVisibilityPicker() {
  const [state, setState] = useState<ElementVisibilityPickerState>();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<RecordedStepsFeedback>();
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let mounted = true;
    void globalThis.chrome?.storage?.session?.get(PICKER_KEY).then((result) => {
      if (mounted) setState(result[PICKER_KEY] as ElementVisibilityPickerState | undefined);
    });

    const handleChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'session' || !changes[PICKER_KEY]) return;
      const next = changes[PICKER_KEY].newValue as ElementVisibilityPickerState | undefined;
      setState(next);
      if (!next?.outcome || !next.message) return;

      clearTimeout(feedbackTimer.current);
      setFeedback({
        type: next.outcome === 'error' ? 'error' : 'success',
        message: next.message,
      });
      feedbackTimer.current = setTimeout(
        () => setFeedback(undefined),
        FEEDBACK_DURATION_MS,
      );
    };

    globalThis.chrome?.storage?.onChanged?.addListener(handleChange);
    return () => {
      mounted = false;
      clearTimeout(feedbackTimer.current);
      globalThis.chrome?.storage?.onChanged?.removeListener(handleChange);
    };
  }, []);

  const run = useCallback(async (action: () => Promise<void>) => {
    if (isPending) return false;
    setIsPending(true);
    setFeedback(undefined);
    try {
      await action();
      return true;
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar a seleção de elemento.',
      });
      return false;
    } finally {
      setIsPending(false);
    }
  }, [isPending]);

  return {
    isActive: Boolean(state?.active),
    isPending,
    feedback,
    start: () => run(startElementVisibilityPicker),
    cancel: () => run(cancelElementVisibilityPicker),
  };
}
