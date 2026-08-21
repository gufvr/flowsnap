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

export type SelectorStrategy = 'testId' | 'role' | 'label' | 'id' | 'text' | 'css';

export interface SelectorCandidate {
  strategy: SelectorStrategy;
  value: string;
  score: number;
  isUnique: boolean;
}

export interface SelectorAnalysis {
  recommended: SelectorCandidate;
  alternatives: SelectorCandidate[];
}

export interface LegacySelectorCandidates {
  testId?: string;
  id?: string;
  role?: string;
  accessibleName?: string;
  css: string;
}

export interface RecordedClick {
  schemaVersion: 2;
  id: string;
  type: 'click';
  url: string;
  timestamp: number;
  selectors: SelectorAnalysis;
  element: {
    tagName: string;
    text?: string;
    inputType?: string;
  };
}

export interface LegacyRecordedClick {
  id: string;
  type: 'click';
  url: string;
  timestamp: number;
  selector: LegacySelectorCandidates;
  element: {
    tagName: string;
    text?: string;
  };
}

export type RecordedStep = RecordedClick | LegacyRecordedClick;
