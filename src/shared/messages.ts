import type {
  ActiveTabContext,
  RecordedColorChange,
  RecordedClick,
  RecordedFieldFill,
  RecordedFocusNavigation,
  RecordedKeyPress,
  RecordedRangeChange,
  RecordedSelectionChange,
} from './recordingTypes';

export type ExtensionMessage =
  | {
      type: 'START_RECORDING';
      payload: { tabId: number; origin: string; url: string };
    }
  | { type: 'STOP_RECORDING' }
  | { type: 'RECORDED_CLICK'; payload: RecordedClick }
  | {
      type: 'RECORDED_FOCUS_NAVIGATION';
      payload: RecordedFocusNavigation;
    }
  | {
      type: 'RECORDED_FIELD_FILL';
      payload: RecordedFieldFill;
    }
  | {
      type: 'RECORDED_RANGE_CHANGE';
      payload: RecordedRangeChange;
    }
  | {
      type: 'RECORDED_COLOR_CHANGE';
      payload: RecordedColorChange;
    }
  | {
      type: 'RECORDED_SELECTION_CHANGE';
      payload: RecordedSelectionChange;
    }
  | {
      type: 'RECORDED_KEY_PRESS';
      payload: RecordedKeyPress;
    }
  | {
      type: 'DELETE_RECORDED_STEP';
      payload: { stepIndex: number; expectedId?: string };
    }
  | {
      type: 'UPDATE_RECORDED_STEP_DESCRIPTION';
      payload: {
        stepIndex: number;
        expectedId?: string;
        expectedReference: string;
        text: string;
      };
    }
  | { type: 'CLEAR_RECORDED_STEPS' }
  | { type: 'GET_ACTIVE_TAB_CONTEXT' }
  | { type: 'ACTIVATE_CLICK_RECORDER' }
  | { type: 'DEACTIVATE_CLICK_RECORDER' };

export interface ExtensionResponse {
  success: boolean;
  error?: string;
  activeTabContext?: ActiveTabContext;
}
