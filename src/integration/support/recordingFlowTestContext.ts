import { afterEach, beforeEach, vi } from 'vitest';
import { createChromeExtensionHarness } from '../../test/chromeExtensionHarness';
import type { PracticePage } from './practicePage';

type ChromeExtensionHarness = ReturnType<typeof createChromeExtensionHarness>;

class RecordingFlowTestContext {
  private currentHarness: ChromeExtensionHarness | undefined;
  private currentPracticePage: PracticePage | undefined;

  get harness(): ChromeExtensionHarness {
    if (!this.currentHarness) {
      throw new Error('Recording flow harness is not initialized.');
    }

    return this.currentHarness;
  }

  set harness(harness: ChromeExtensionHarness) {
    this.currentHarness = harness;
  }

  get practicePage(): PracticePage {
    if (!this.currentPracticePage) {
      throw new Error('Recording flow practice page is not initialized.');
    }

    return this.currentPracticePage;
  }

  set practicePage(practicePage: PracticePage) {
    this.currentPracticePage = practicePage;
  }

  dispose() {
    this.currentPracticePage?.root.remove();
    this.currentPracticePage = undefined;
    this.currentHarness?.dispose();
    this.currentHarness = undefined;
  }
}

export function useRecordingFlowTestContext() {
  const context = new RecordingFlowTestContext();

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    context.dispose();
  });

  return context;
}

