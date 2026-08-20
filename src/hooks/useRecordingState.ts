import { useCallback, useEffect, useState } from 'react';
import {
  loadRecordingState,
  saveRecordingState,
} from '../services/recordingStorage';

export function useRecordingState() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    loadRecordingState().then((state) => {
      if (isMounted) {
        setIsRecording(state.isRecording);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleRecording = useCallback(() => {
    setIsRecording((currentState) => {
      const nextState = !currentState;
      void saveRecordingState({ isRecording: nextState });
      return nextState;
    });
  }, []);

  return { isRecording, isLoading, toggleRecording };
}
