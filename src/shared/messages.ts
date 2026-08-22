import type {
  ActiveTabContext,
  RecordedClick,
  RecordedFocusNavigation,
} from './recordingTypes';

export type ExtensionMessage =
  | {
      type: 'START_RECORDING';
      payload: { tabId: number; origin: string };
    }
  | { type: 'STOP_RECORDING' }
  | { type: 'RECORDED_CLICK'; payload: RecordedClick }
  | {
      type: 'RECORDED_FOCUS_NAVIGATION';
      payload: RecordedFocusNavigation;
    }
  | { type: 'GET_ACTIVE_TAB_CONTEXT' }
  | { type: 'ACTIVATE_CLICK_RECORDER' }
  | { type: 'DEACTIVATE_CLICK_RECORDER' };

export interface ExtensionResponse {
  success: boolean;
  error?: string;
  activeTabContext?: ActiveTabContext;
}
