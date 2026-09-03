import type {
  SelectorStrategy,
  TestIdAttribute,
} from '../recordingTypes';

const SELECTOR_STRATEGIES: SelectorStrategy[] = [
  'testId',
  'role',
  'label',
  'id',
  'text',
  'css',
];

const TEST_ID_ATTRIBUTES: TestIdAttribute[] = [
  'data-testid',
  'data-cy',
  'data-test',
];

export interface ResolvedSelector {
  strategy: SelectorStrategy;
  value: string;
  attribute?: TestIdAttribute;
  role?: string;
  name?: string;
}

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

function parseRoleValue(value: string) {
  const separatorIndex = value.indexOf(':');

  if (separatorIndex < 0) return { role: value };

  return {
    role: value.slice(0, separatorIndex),
    name: value.slice(separatorIndex + 1) || undefined,
  };
}

function adaptCandidate(value: unknown): ResolvedSelector | undefined {
  if (!isRecord(value) || !includesValue(SELECTOR_STRATEGIES, value.strategy)) {
    return undefined;
  }

  if (!isString(value.value) || !value.value.trim()) return undefined;

  const attribute = includesValue(TEST_ID_ATTRIBUTES, value.attribute)
    ? value.attribute
    : undefined;

  if (value.strategy !== 'role') {
    return {
      strategy: value.strategy,
      value: value.value,
      ...(attribute ? { attribute } : {}),
    };
  }

  const parsedRole = parseRoleValue(value.value);
  const role = isString(value.role) && value.role.trim()
    ? value.role
    : parsedRole.role;
  const name = isString(value.name) && value.name.trim()
    ? value.name
    : parsedRole.name;

  if (!role) return undefined;

  return {
    strategy: 'role',
    value: value.value,
    role,
    ...(name ? { name } : {}),
  };
}

function resolveLegacySelector(
  selector: Record<string, unknown>,
): ResolvedSelector | undefined {
  if (isString(selector.testId) && selector.testId.trim()) {
    return {
      strategy: 'testId',
      value: selector.testId,
      attribute: 'data-testid',
    };
  }

  if (isString(selector.role) && selector.role.trim()) {
    const name = isString(selector.accessibleName) && selector.accessibleName.trim()
      ? selector.accessibleName
      : undefined;

    return {
      strategy: 'role',
      value: name ? `${selector.role}:${name}` : selector.role,
      role: selector.role,
      ...(name ? { name } : {}),
    };
  }

  if (isString(selector.id) && selector.id.trim()) {
    return { strategy: 'id', value: selector.id };
  }

  if (isString(selector.css) && selector.css.trim()) {
    return { strategy: 'css', value: selector.css };
  }

  return undefined;
}

function resolveLegacySelectors(
  selector: Record<string, unknown>,
): ResolvedSelector[] {
  const candidates: ResolvedSelector[] = [];

  if (isString(selector.testId) && selector.testId.trim()) {
    candidates.push({
      strategy: 'testId',
      value: selector.testId,
      attribute: 'data-testid',
    });
  }

  if (isString(selector.role) && selector.role.trim()) {
    const name = isString(selector.accessibleName) && selector.accessibleName.trim()
      ? selector.accessibleName
      : undefined;
    candidates.push({
      strategy: 'role',
      value: name ? `${selector.role}:${name}` : selector.role,
      role: selector.role,
      ...(name ? { name } : {}),
    });
  }

  if (isString(selector.id) && selector.id.trim()) {
    candidates.push({ strategy: 'id', value: selector.id });
  }

  if (isString(selector.css) && selector.css.trim()) {
    candidates.push({ strategy: 'css', value: selector.css });
  }

  return candidates;
}

export function resolveSelectorCandidates(step: unknown): ResolvedSelector[] {
  if (!isRecord(step)) return [];

  const isRankedSchema =
    step.schemaVersion === 2 ||
    step.schemaVersion === 3 ||
    step.schemaVersion === 4 ||
    step.schemaVersion === 5 ||
    step.schemaVersion === 6 ||
    step.schemaVersion === 7 ||
    step.schemaVersion === 8 ||
    step.schemaVersion === 12 ||
    step.schemaVersion === 13;

  if (isRankedSchema && isRecord(step.selectors)) {
    const values = [
      step.selectors.recommended,
      ...(Array.isArray(step.selectors.alternatives)
        ? step.selectors.alternatives
        : []),
    ];
    return values.flatMap((value) => {
      const candidate = adaptCandidate(value);
      return candidate ? [candidate] : [];
    });
  }

  if (step.schemaVersion === undefined && isRecord(step.selector)) {
    return resolveLegacySelectors(step.selector);
  }

  return [];
}

export function resolveRecommendedSelector(
  step: unknown,
): ResolvedSelector | undefined {
  if (!isRecord(step)) return undefined;

  const isRankedSchema =
    step.schemaVersion === 2 ||
    step.schemaVersion === 3 ||
    step.schemaVersion === 4 ||
    step.schemaVersion === 5 ||
    step.schemaVersion === 6 ||
    step.schemaVersion === 7 ||
    step.schemaVersion === 8 ||
    step.schemaVersion === 12 ||
    step.schemaVersion === 13;

  if (isRankedSchema && isRecord(step.selectors)) {
    return adaptCandidate(step.selectors.recommended);
  }

  if (step.schemaVersion === undefined && isRecord(step.selector)) {
    return resolveLegacySelector(step.selector);
  }

  return undefined;
}
