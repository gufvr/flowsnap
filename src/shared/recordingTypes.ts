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
export type TestIdAttribute = 'data-testid' | 'data-cy' | 'data-test';
export type SelectorWarning = 'dynamic-id';
export type SelectorValidationStatus = 'valid' | 'ambiguous' | 'invalid';

export interface SelectorCandidateV2 {
  strategy: SelectorStrategy;
  value: string;
  score: number;
  isUnique: boolean;
  attribute?: TestIdAttribute;
  warnings?: SelectorWarning[];
}

export interface SelectorValidation {
  status: SelectorValidationStatus;
  matchCount: number;
  matchesTarget: boolean;
}

export interface SelectorCandidate extends SelectorCandidateV2 {
  role?: string;
  name?: string;
  validation: SelectorValidation;
}

export interface SelectorAnalysis {
  recommended: SelectorCandidate;
  alternatives: SelectorCandidate[];
}

export interface SelectorAnalysisV2 {
  recommended: SelectorCandidateV2;
  alternatives: SelectorCandidateV2[];
}

export interface LegacySelectorCandidates {
  testId?: string;
  id?: string;
  role?: string;
  accessibleName?: string;
  css: string;
}

export interface RecordedClick {
  schemaVersion: 3;
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

export interface RecordedClickV2 {
  schemaVersion: 2;
  id: string;
  type: 'click';
  url: string;
  timestamp: number;
  selectors: SelectorAnalysisV2;
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

export type RecordedStep = RecordedClick | RecordedClickV2 | LegacyRecordedClick;
