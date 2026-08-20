export interface RecordingState {
  isRecording: boolean;
  tabId?: number;
  origin?: string;
}

export interface ActiveTabContext {
  tabId: number;
  windowId: number;
  url: string;
}

export interface SelectorCandidates {
  testId?: string;
  id?: string;
  role?: string;
  accessibleName?: string;
  css: string;
}

export interface RecordedClick {
  id: string;
  type: 'click';
  url: string;
  timestamp: number;
  selector: SelectorCandidates;
  element: {
    tagName: string;
    text?: string;
  };
}

export type RecordedStep = RecordedClick;
