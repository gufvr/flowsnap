import type { ResolvedSelector } from '../selectors/resolveRecommendedSelector';

export function formatJavaScriptString(value: string) {
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

function formatAttributeLocator(attribute: string, value: string) {
  const selector = `[${attribute}="${escapeCssAttributeValue(value)}"]`;
  return `page.locator(${formatJavaScriptString(selector)})`;
}

export function formatPlaywrightLocator(selector: ResolvedSelector) {
  if (selector.strategy === 'testId') {
    if (!selector.attribute || selector.attribute === 'data-testid') {
      return `page.getByTestId(${formatJavaScriptString(selector.value)})`;
    }

    return formatAttributeLocator(selector.attribute, selector.value);
  }

  if (selector.strategy === 'role') {
    const role = selector.role ?? selector.value;
    const name = selector.name
      ? `, { name: ${formatJavaScriptString(selector.name)}, exact: true }`
      : '';

    return `page.getByRole(${formatJavaScriptString(role)}${name})`;
  }

  if (selector.strategy === 'label') {
    return `page.getByLabel(${formatJavaScriptString(selector.value)}, { exact: true })`;
  }

  if (selector.strategy === 'id') {
    return formatAttributeLocator('id', selector.value);
  }

  if (selector.strategy === 'text') {
    return `page.getByText(${formatJavaScriptString(selector.value)}, { exact: true })`;
  }

  return `page.locator(${formatJavaScriptString(selector.value)})`;
}
