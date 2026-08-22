import type { ResolvedSelector } from './resolveRecommendedSelector';

function escapeValue(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/;/g, '\\;')
    .replace(/=/g, '\\=');
}

export function formatSelector(selector: ResolvedSelector) {
  const value = escapeValue(selector.value);

  if (selector.strategy === 'testId') {
    return `${selector.attribute ?? 'data-testid'}=${value}`;
  }

  if (selector.strategy === 'role') {
    const role = escapeValue(selector.role ?? selector.value);
    const name = selector.name ? `;name=${escapeValue(selector.name)}` : '';
    return `role=${role}${name}`;
  }

  return `${selector.strategy}=${value}`;
}
