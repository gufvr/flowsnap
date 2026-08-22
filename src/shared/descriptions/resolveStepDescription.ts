import type {
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
import { createFocusNavigationDescription } from './createFocusNavigationDescription';

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
  if (!isRecord(value) || !isRecord(value.target)) return false;

  return (
    (value.action === 'click' || value.action === 'focusNavigation') &&
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

function createFallbackDescription() {
  return createClickDescription({
    selectors: createAnalysis([]),
    element: { tagName: 'element' },
  });
}

export function resolveStepDescription(step: unknown): StepDescription {
  if (!isRecord(step)) return createFallbackDescription();

  const isKnownSchema =
    step.schemaVersion === 2 ||
    step.schemaVersion === 3 ||
    step.schemaVersion === 4;

  if (!isKnownSchema) return createFallbackDescription();

  if (step.schemaVersion === 4 && isStepDescription(step.description)) {
    return step.description;
  }

  const descriptionInput = {
    selectors: getSelectorAnalysis(step),
    element: getElement(step),
  };

  return step.type === 'focus-navigation'
    ? createFocusNavigationDescription(descriptionInput)
    : createClickDescription(descriptionInput);
}
