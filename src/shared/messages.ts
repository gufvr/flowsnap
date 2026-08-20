import type { RecordedClick } from './recordingTypes';

export type ExtensionMessage =
  | {
      type: 'START_RECORDING';
      payload: { tabId: number; origin: string };
    }
  | { type: 'STOP_RECORDING' }
  | { type: 'RECORDED_CLICK'; payload: RecordedClick }
  | { type: 'ACTIVATE_CLICK_RECORDER' }
  | { type: 'DEACTIVATE_CLICK_RECORDER' };

export interface ExtensionResponse {
  success: boolean;
  error?: string;
}
