import { useCallback, useEffect, useState } from 'react';
import {
  loadRecordingState,
  loadRecordedSteps,
} from '../services/recordingStorage';
import {
  startRecordingSession,
  stopRecordingSession,
} from '../services/recordingSession';

export function useRecordingState() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadRecordingState(), loadRecordedSteps()]).then(([state, steps]) => {
      if (isMounted) {
        setIsRecording(state.isRecording);
        setStepCount(steps.length);
        setIsLoading(false);
      }
    });

    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      const steps = changes.recordedSteps?.newValue;
      if (Array.isArray(steps)) setStepCount(steps.length);
    };

    chrome.storage?.onChanged?.addListener(handleStorageChange);

    return () => {
      isMounted = false;
      chrome.storage?.onChanged?.removeListener(handleStorageChange);
    };
  }, []);

  const toggleRecording = useCallback(async () => {
    setError(undefined);
    setIsTransitioning(true);

    try {
      const nextState = isRecording
        ? await stopRecordingSession()
        : await startRecordingSession();
      setIsRecording(nextState.isRecording);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Não foi possível alterar a gravação.',
      );
    } finally {
      setIsTransitioning(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    isLoading: isLoading || isTransitioning,
    stepCount,
    error,
    toggleRecording,
  };
}
