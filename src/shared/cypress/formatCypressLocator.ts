import {
  resolveSelectorCandidates,
  type ResolvedSelector,
} from '../selectors/resolveRecommendedSelector';

export interface FormattedCypressLocator {
  expression: string;
  usesLabelHelper: boolean;
}

const NAMED_ROLE_SELECTORS: Record<string, string> = {
  button:
    'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]',
  link: 'a[href], [role="link"]',
};

const ROLE_SELECTORS: Record<string, string> = {
  ...NAMED_ROLE_SELECTORS,
  checkbox: 'input[type="checkbox"], [role="checkbox"]',
  combobox: 'select, input[list], [role="combobox"]',
  radio: 'input[type="radio"], [role="radio"]',
  slider: 'input[type="range"], [role="slider"]',
  textbox:
    'textarea, input:not([type]), input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], [role="textbox"]',
};

export function formatCypressJavaScriptString(value: string) {
  return JSON.stringify(value)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function escapeCssAttributeValue(value: string) {
  return Array.from(value, (character) => {
    if (character === '\\') return '\\\\';
    if (character === '"') return '\\"';

    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && (codePoint <= 31 || codePoint === 127)) {
      return `\\${codePoint.toString(16)} `;
    }

    return character;
  }).join('');
}

function formatExactText(value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `new RegExp(${formatCypressJavaScriptString(`^${escaped}$`)})`;
}

function getLocator(expression: string, usesLabelHelper = false) {
  return { expression, usesLabelHelper };
}

export function formatCypressLocator(
  selector: ResolvedSelector,
): FormattedCypressLocator | undefined {
  if (selector.strategy === 'testId') {
    const attribute = selector.attribute ?? 'data-testid';
    const css = `[${attribute}="${escapeCssAttributeValue(selector.value)}"]`;
    return getLocator(`cy.get(${formatCypressJavaScriptString(css)})`);
  }

  if (selector.strategy === 'id') {
    const css = `[id="${escapeCssAttributeValue(selector.value)}"]`;
    return getLocator(`cy.get(${formatCypressJavaScriptString(css)})`);
  }

  if (selector.strategy === 'css') {
    return getLocator(
      `cy.get(${formatCypressJavaScriptString(selector.value)})`,
    );
  }

  if (selector.strategy === 'text') {
    return getLocator(`cy.contains(${formatExactText(selector.value)})`);
  }

  if (selector.strategy === 'label') {
    return getLocator(`getByLabel(${formatExactText(selector.value)})`, true);
  }

  const role = selector.role ?? selector.value;
  const roleSelector = ROLE_SELECTORS[role] ?? `[role="${escapeCssAttributeValue(role)}"]`;
  if (!selector.name) {
    return getLocator(`cy.get(${formatCypressJavaScriptString(roleSelector)})`);
  }

  const namedRoleSelector = NAMED_ROLE_SELECTORS[role];
  if (!namedRoleSelector) return undefined;

  return getLocator(
    `cy.contains(${formatCypressJavaScriptString(namedRoleSelector)}, ${formatExactText(selector.name)})`,
  );
}

export function resolveCypressLocator(
  step: unknown,
): FormattedCypressLocator | undefined {
  for (const selector of resolveSelectorCandidates(step)) {
    const locator = formatCypressLocator(selector);
    if (locator) return locator;
  }

  return undefined;
}
