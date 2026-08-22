import { useEffect, useState } from 'react';
import { loadRecordedSteps } from '../services/recordingStorage';
import type { RecordedStep } from '../shared/recordingTypes';

const RECORDED_STEPS_KEY = 'recordedSteps';

export function useRecordedSteps() {
  const [steps, setSteps] = useState<RecordedStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let hasReceivedStorageUpdate = false;

    loadRecordedSteps().then((storedSteps) => {
      if (!isMounted) return;

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
      isMounted = false;
      globalThis.chrome?.storage?.onChanged?.removeListener(handleStorageChange);
    };
  }, []);

  return { steps, isLoading };
}
