import type {
  ClickStepDescription,
  ColorChangeStepDescription,
  FieldFillStepDescription,
  FocusNavigationStepDescription,
  KeyPressStepDescription,
  NavigationStepDescription,
  RangeChangeStepDescription,
  SelectionChangeStepDescription,
} from './stepDescriptionTypes';

export interface RecordingState {
  isRecording: boolean;
  tabId?: number;
  origin?: string;
  currentUrl?: string;
  currentDocumentId?: string;
  recorderDocumentId?: string;
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
  schemaVersion: 4;
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
  description: ClickStepDescription;
}

export interface RecordedClickV3 {
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

export interface RecordedFocusNavigation {
  schemaVersion: 4;
  id: string;
  type: 'focus-navigation';
  url: string;
  timestamp: number;
  key: 'Tab';
  direction: 'forward' | 'backward';
  selectors: SelectorAnalysis;
  element: {
    tagName: string;
    text?: string;
    inputType?: string;
  };
  description: FocusNavigationStepDescription;
}

export interface StepDescriptionOverride {
  text: string;
  locale: 'pt-BR';
}

export type SensitiveFieldReason =
  | 'password'
  | 'one-time-code'
  | 'payment'
  | 'personal-id'
  | 'secret';

export type RecordedFieldValue =
  | {
      kind: 'plain';
      value: string;
      truncated?: boolean;
    }
  | {
      kind: 'protected';
      reason: SensitiveFieldReason;
    };

export interface RecordedFieldFill {
  schemaVersion: 5;
  id: string;
  type: 'field-fill';
  url: string;
  timestamp: number;
  selectors: SelectorAnalysis;
  element: {
    tagName: string;
    inputType?: string;
  };
  value: RecordedFieldValue;
  description: FieldFillStepDescription;
}

export interface RecordedRangeChange {
  schemaVersion: 7;
  id: string;
  type: 'range-change';
  url: string;
  timestamp: number;
  selectors: SelectorAnalysis;
  element: {
    tagName: 'input';
    inputType: 'range';
  };
  value: RecordedFieldValue;
  description: RangeChangeStepDescription;
}

export interface RecordedColorChange {
  schemaVersion: 8;
  id: string;
  type: 'color-change';
  url: string;
  timestamp: number;
  selectors: SelectorAnalysis;
  element: {
    tagName: 'input';
    inputType: 'color';
  };
  value: RecordedFieldValue;
  description: ColorChangeStepDescription;
}

export type NavigationTrigger =
  | 'fragment'
  | 'history-api'
  | 'history-traversal';

export interface RecordedNavigation {
  schemaVersion: 9;
  id: string;
  type: 'navigation';
  url: string;
  timestamp: number;
  fromUrl: string;
  toUrl: string;
  trigger: NavigationTrigger;
  description: NavigationStepDescription;
}

export type DocumentNavigationTrigger =
  | 'document'
  | 'reload'
  | 'history-traversal';

export interface RecordedDocumentNavigation {
  schemaVersion: 10;
  id: string;
  type: 'navigation';
  url: string;
  timestamp: number;
  fromUrl: string;
  toUrl: string;
  trigger: DocumentNavigationTrigger;
  description: NavigationStepDescription;
}

export type RecordedSelectValue =
  | {
      kind: 'plain';
      options: Array<{ value: string; label: string }>;
      truncated?: boolean;
    }
  | {
      kind: 'protected';
      reason: SensitiveFieldReason;
    };

export type RecordedSelectionControl =
  | { kind: 'checkbox'; checked: boolean }
  | { kind: 'radio'; checked: true }
  | {
      kind: 'select';
      multiple: boolean;
      selection: RecordedSelectValue;
    };

export interface RecordedSelectionChange {
  schemaVersion: 6;
  id: string;
  type: 'selection-change';
  url: string;
  timestamp: number;
  selectors: SelectorAnalysis;
  element: {
    tagName: string;
    inputType?: string;
  };
  control: RecordedSelectionControl;
  description: SelectionChangeStepDescription;
}

export type InteractionKey =
  | 'Enter'
  | 'Space'
  | 'Escape'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight';

export interface RecordedKeyPress {
  schemaVersion: 6;
  id: string;
  type: 'key-press';
  url: string;
  timestamp: number;
  key: InteractionKey;
  modifiers?: { shift?: boolean };
  selectors: SelectorAnalysis;
  element: {
    tagName: string;
    text?: string;
    inputType?: string;
  };
  description: KeyPressStepDescription;
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

export type RecordedStep =
  | RecordedClick
  | RecordedFocusNavigation
  | RecordedFieldFill
  | RecordedRangeChange
  | RecordedColorChange
  | RecordedNavigation
  | RecordedDocumentNavigation
  | RecordedSelectionChange
  | RecordedKeyPress
  | RecordedClickV3
  | RecordedClickV2
  | LegacyRecordedClick;

export type EditableRecordedStep = RecordedStep & {
  descriptionOverride?: StepDescriptionOverride;
};
