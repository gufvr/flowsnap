import type {
  DocumentNavigationTrigger,
  InteractionKey,
  NavigationTrigger,
  RecordedFieldValue,
  RecordedSelectionControl,
  SelectorAnalysis,
  SelectorCandidate,
  SelectorStrategy,
  SelectorValidationStatus,
  SelectorWarning,
  TestIdAttribute,
} from '../recordingTypes';
import type {
  DescriptionSource,
  StepDescription,
  StepTargetType,
} from '../stepDescriptionTypes';
import { createClickDescription } from './createClickDescription';
import { createColorChangeDescription } from './createColorChangeDescription';
import { createElementTextAssertionDescription } from './createElementTextAssertionDescription';
import { createElementVisibilityAssertionDescription } from './createElementVisibilityAssertionDescription';
import { createFieldFillDescription } from './createFieldFillDescription';
import { createFocusNavigationDescription } from './createFocusNavigationDescription';
import { createKeyPressDescription } from './createKeyPressDescription';
import { createNavigationDescription } from './createNavigationDescription';
import { createRangeChangeDescription } from './createRangeChangeDescription';
import { createSelectionChangeDescription } from './createSelectionChangeDescription';
import { createUrlAssertionDescription } from './createUrlAssertionDescription';
import { resolveDescriptionOverride } from './descriptionOverride';

const SELECTOR_STRATEGIES: SelectorStrategy[] = [
  'testId',
  'role',
  'label',
  'id',
  'text',
  'css',
];

const TARGET_TYPES: StepTargetType[] = [
  'button',
  'link',
  'field',
  'checkbox',
  'radio',
  'select',
  'element',
];

const DESCRIPTION_SOURCES: DescriptionSource[] = [
  'label',
  'accessibleName',
  'text',
  'testId',
  'id',
  'tagName',
];

const TEST_ID_ATTRIBUTES: TestIdAttribute[] = [
  'data-testid',
  'data-cy',
  'data-test',
];

const SELECTOR_WARNINGS: SelectorWarning[] = ['dynamic-id'];

const VALIDATION_STATUSES: SelectorValidationStatus[] = [
  'valid',
  'ambiguous',
  'invalid',
];

const SENSITIVE_FIELD_REASONS = [
  'password',
  'one-time-code',
  'payment',
  'personal-id',
  'secret',
] as const;

const INTERACTION_KEYS: InteractionKey[] = [
  'Enter',
  'Space',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
];

const NAVIGATION_TRIGGERS: NavigationTrigger[] = [
  'fragment',
  'history-api',
  'history-traversal',
];

const DOCUMENT_NAVIGATION_TRIGGERS: DocumentNavigationTrigger[] = [
  'document',
  'reload',
  'history-traversal',
];

const FALLBACK_CANDIDATE: SelectorCandidate = {
  strategy: 'css',
  value: '',
  score: 0,
  isUnique: false,
  validation: {
    status: 'invalid',
    matchCount: 0,
    matchesTarget: false,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function includesValue<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return isString(value) && values.includes(value as T);
}

function isStepDescription(value: unknown): value is StepDescription {
  if (!isRecord(value)) return false;

  if (value.action === 'navigation' || value.action === 'urlAssertion') {
    return (
      value.locale === 'pt-BR' &&
      isString(value.text) &&
      value.text.trim().length > 0
    );
  }

  if (!isRecord(value.target)) return false;

  return (
    (value.action === 'click' ||
      value.action === 'elementTextAssertion' ||
      value.action === 'elementVisibilityAssertion' ||
      value.action === 'colorChange' ||
      value.action === 'focusNavigation' ||
      value.action === 'fieldFill' ||
      value.action === 'rangeChange' ||
      value.action === 'selectionChange' ||
      value.action === 'keyPress') &&
    value.locale === 'pt-BR' &&
    isString(value.text) &&
    value.text.trim().length > 0 &&
    includesValue(TARGET_TYPES, value.target.type) &&
    (value.target.name === undefined || isString(value.target.name)) &&
    includesValue(DESCRIPTION_SOURCES, value.source)
  );
}

function parseRole(value: string) {
  const separatorIndex = value.indexOf(':');

  if (separatorIndex < 0) return { role: value || undefined };

  return {
    role: value.slice(0, separatorIndex) || undefined,
    name: value.slice(separatorIndex + 1) || undefined,
  };
}

function adaptCandidate(value: unknown): SelectorCandidate | undefined {
  if (!isRecord(value) || !includesValue(SELECTOR_STRATEGIES, value.strategy)) {
    return undefined;
  }

  if (!isString(value.value)) return undefined;

  const validation = isRecord(value.validation) ? value.validation : undefined;
  const legacyRole =
    value.strategy === 'role'
      ? parseRole(value.value)
      : { role: undefined, name: undefined };
  const isUnique = typeof value.isUnique === 'boolean' && value.isUnique;
  const attribute = includesValue(TEST_ID_ATTRIBUTES, value.attribute)
    ? value.attribute
    : undefined;
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.filter((warning) =>
        includesValue(SELECTOR_WARNINGS, warning),
      )
    : [];
  const status = includesValue(VALIDATION_STATUSES, validation?.status)
    ? validation.status
    : isUnique
      ? 'valid'
      : 'ambiguous';

  return {
    strategy: value.strategy,
    value: value.value,
    score: typeof value.score === 'number' ? value.score : 0,
    isUnique,
    ...(attribute ? { attribute } : {}),
    ...(warnings.length > 0 ? { warnings } : {}),
    role: isString(value.role) ? value.role : legacyRole.role,
    name: isString(value.name) ? value.name : legacyRole.name,
    validation: {
      status,
      matchCount:
        typeof validation?.matchCount === 'number'
          ? validation.matchCount
          : isUnique
            ? 1
            : 2,
      matchesTarget:
        typeof validation?.matchesTarget === 'boolean'
          ? validation.matchesTarget
          : true,
    },
  };
}

function createAnalysis(candidates: unknown[]): SelectorAnalysis {
  const validCandidates = candidates
    .map(adaptCandidate)
    .filter((candidate): candidate is SelectorCandidate => Boolean(candidate));

  return {
    recommended: validCandidates[0] ?? FALLBACK_CANDIDATE,
    alternatives: validCandidates.slice(1),
  };
}

function getSelectorAnalysis(step: Record<string, unknown>) {
  if (!isRecord(step.selectors)) return createAnalysis([]);

  const alternatives = Array.isArray(step.selectors.alternatives)
    ? step.selectors.alternatives
    : [];

  return createAnalysis([step.selectors.recommended, ...alternatives]);
}

function getElement(step: Record<string, unknown>) {
  const element = isRecord(step.element) ? step.element : {};

  return {
    tagName: isString(element.tagName) ? element.tagName : 'element',
    text: isString(element.text) ? element.text : undefined,
    inputType: isString(element.inputType) ? element.inputType : undefined,
  };
}

function getFieldValue(step: Record<string, unknown>): RecordedFieldValue {
  if (!isRecord(step.value)) {
    return { kind: 'protected', reason: 'secret' };
  }

  if (step.value.kind === 'plain' && isString(step.value.value)) {
    return {
      kind: 'plain',
      value: step.value.value,
      ...(step.value.truncated === true ? { truncated: true } : {}),
    };
  }

  if (
    step.value.kind === 'protected' &&
    includesValue(SENSITIVE_FIELD_REASONS, step.value.reason)
  ) {
    return { kind: 'protected', reason: step.value.reason };
  }

  return { kind: 'protected', reason: 'secret' };
}

function getSelectionControl(
  step: Record<string, unknown>,
): RecordedSelectionControl | undefined {
  if (!isRecord(step.control)) return undefined;

  if (
    step.control.kind === 'checkbox' &&
    typeof step.control.checked === 'boolean'
  ) {
    return { kind: 'checkbox', checked: step.control.checked };
  }

  if (step.control.kind === 'radio' && step.control.checked === true) {
    return { kind: 'radio', checked: true };
  }

  if (
    step.control.kind !== 'select' ||
    typeof step.control.multiple !== 'boolean' ||
    !isRecord(step.control.selection)
  ) {
    return undefined;
  }

  if (
    step.control.selection.kind === 'protected' &&
    includesValue(SENSITIVE_FIELD_REASONS, step.control.selection.reason)
  ) {
    return {
      kind: 'select',
      multiple: step.control.multiple,
      selection: {
        kind: 'protected',
        reason: step.control.selection.reason,
      },
    };
  }

  if (
    step.control.selection.kind !== 'plain' ||
    !Array.isArray(step.control.selection.options)
  ) {
    return undefined;
  }

  const storedOptions = step.control.selection.options;
  const options = storedOptions
    .filter(
      (option): option is { value: string; label: string } =>
        isRecord(option) && isString(option.value) && isString(option.label),
    )
    .map((option) => ({ value: option.value, label: option.label }));

  if (options.length !== storedOptions.length) return undefined;

  return {
    kind: 'select',
    multiple: step.control.multiple,
    selection: {
      kind: 'plain',
      options,
      ...(step.control.selection.truncated === true
        ? { truncated: true }
        : {}),
    },
  };
}

function createFallbackDescription() {
  return createClickDescription({
    selectors: createAnalysis([]),
    element: { tagName: 'element' },
  });
}

function resolveBaseStepDescription(step: unknown): StepDescription {
  if (!isRecord(step)) return createFallbackDescription();

  const isKnownSchema =
    step.schemaVersion === 2 ||
    step.schemaVersion === 3 ||
    step.schemaVersion === 4 ||
    step.schemaVersion === 5 ||
    step.schemaVersion === 6 ||
    step.schemaVersion === 7 ||
    step.schemaVersion === 8 ||
    step.schemaVersion === 9 ||
    step.schemaVersion === 10 ||
    step.schemaVersion === 11 ||
    step.schemaVersion === 12 ||
    step.schemaVersion === 13;

  if (!isKnownSchema) return createFallbackDescription();

  if (
    (step.schemaVersion === 4 ||
      step.schemaVersion === 5 ||
      step.schemaVersion === 6 ||
      step.schemaVersion === 7 ||
      step.schemaVersion === 8 ||
      step.schemaVersion === 9 ||
      step.schemaVersion === 10 ||
      step.schemaVersion === 11 ||
      step.schemaVersion === 12 ||
      step.schemaVersion === 13) &&
    isStepDescription(step.description)
  ) {
    return step.description;
  }

  const descriptionInput = {
    selectors: getSelectorAnalysis(step),
    element: getElement(step),
  };

  if (step.type === 'navigation') {
    const trigger =
      step.schemaVersion === 10
        ? includesValue(DOCUMENT_NAVIGATION_TRIGGERS, step.trigger)
          ? step.trigger
          : undefined
        : includesValue(NAVIGATION_TRIGGERS, step.trigger)
          ? step.trigger
          : undefined;

    return createNavigationDescription({
      fromUrl: isString(step.fromUrl) ? step.fromUrl : undefined,
      toUrl: isString(step.toUrl)
        ? step.toUrl
        : isString(step.url)
          ? step.url
          : undefined,
      trigger,
    });
  }

  if (step.type === 'assertion') {
    const assertion = isRecord(step.assertion) ? step.assertion : undefined;
    if (
      step.schemaVersion === 12 &&
      assertion?.kind === 'element' &&
      assertion.operator === 'visible'
    ) {
      return createElementVisibilityAssertionDescription(descriptionInput);
    }
    if (
      step.schemaVersion === 13 &&
      assertion?.kind === 'element' &&
      assertion.operator === 'text-equals'
    ) {
      return createElementTextAssertionDescription({
        ...descriptionInput,
        expectedText: isString(assertion.expected)
          ? assertion.expected
          : undefined,
      });
    }
    const expectedUrl =
      assertion?.kind === 'url' &&
      assertion.operator === 'equals' &&
      isString(assertion.expected)
        ? assertion.expected
        : undefined;

    return createUrlAssertionDescription({ expectedUrl });
  }

  if (step.type === 'focus-navigation') {
    return createFocusNavigationDescription(descriptionInput);
  }

  if (step.type === 'field-fill') {
    return createFieldFillDescription({
      ...descriptionInput,
      value: getFieldValue(step),
    });
  }

  if (step.type === 'range-change') {
    return createRangeChangeDescription({
      ...descriptionInput,
      value: getFieldValue(step),
    });
  }

  if (step.type === 'color-change') {
    return createColorChangeDescription({
      ...descriptionInput,
      value: getFieldValue(step),
    });
  }

  if (step.type === 'selection-change') {
    const control = getSelectionControl(step);
    if (!control) return createFallbackDescription();

    return createSelectionChangeDescription({
      ...descriptionInput,
      control,
    });
  }

  if (step.type === 'key-press' && includesValue(INTERACTION_KEYS, step.key)) {
    return createKeyPressDescription({
      ...descriptionInput,
      key: step.key,
      modifiers:
        isRecord(step.modifiers) && step.modifiers.shift === true
          ? { shift: true }
          : undefined,
    });
  }

  return createClickDescription(descriptionInput);
}

export function resolveStepDescription(step: unknown): StepDescription {
  const description = resolveBaseStepDescription(step);
  const override = isRecord(step)
    ? resolveDescriptionOverride(step.descriptionOverride)
    : undefined;

  return override ? { ...description, text: override.text } : description;
}
