import { getImplicitRole } from './elementSemantics';

const INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'listbox',
  'menuitem',
  'option',
  'radio',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'treeitem',
]);
const STRUCTURAL_TAGS = new Set([
  'article',
  'body',
  'fieldset',
  'footer',
  'form',
  'header',
  'html',
  'main',
  'nav',
  'ol',
  'section',
  'ul',
]);
const MAX_LEAF_TEXT_LENGTH = 80;

function normalizeFullText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() || undefined;
}

function isNativeInteractive(element: Element) {
  const tagName = element.tagName.toLocaleLowerCase('en-US');

  if (tagName === 'a') return element.hasAttribute('href');
  if (tagName === 'input') {
    return (element as HTMLInputElement).type !== 'hidden';
  }

  return ['button', 'select', 'summary', 'textarea'].includes(tagName);
}

function hasTestAttribute(element: Element) {
  return ['data-testid', 'data-cy', 'data-test'].some((attribute) =>
    element.hasAttribute(attribute),
  );
}

function hasCustomInteractionSignal(element: Element) {
  if (!(element instanceof HTMLElement)) return false;

  const role = element.getAttribute('role') ?? getImplicitRole(element);
  const isStructural = STRUCTURAL_TAGS.has(
    element.tagName.toLocaleLowerCase('en-US'),
  );

  return (
    Boolean(role && INTERACTIVE_ROLES.has(role)) ||
    element.tabIndex >= 0 ||
    element.isContentEditable ||
    typeof element.onclick === 'function' ||
    element.hasAttribute('onclick') ||
    hasTestAttribute(element) ||
    (!isStructural && Boolean(element.id.trim())) ||
    (element.childElementCount > 0 &&
      window.getComputedStyle(element).cursor === 'pointer')
  );
}

function isExplicitClickTarget(element: Element) {
  return isNativeInteractive(element) || hasCustomInteractionSignal(element);
}

function isShortLeafFallback(element: Element) {
  const tagName = element.tagName.toLocaleLowerCase('en-US');
  const text = normalizeFullText(element.textContent);

  return (
    !STRUCTURAL_TAGS.has(tagName) &&
    element.childElementCount === 0 &&
    Boolean(text && text.length <= MAX_LEAF_TEXT_LENGTH)
  );
}

export function resolveClickTarget(element: Element): Element | undefined {
  let candidate: Element | null = element;

  while (candidate) {
    if (isExplicitClickTarget(candidate)) return candidate;

    if (STRUCTURAL_TAGS.has(candidate.tagName.toLowerCase())) break;

    candidate = candidate.parentElement;
  }

  return isShortLeafFallback(element) ? element : undefined;
}

export function getClickTargetText(element: Element) {
  const role = element.getAttribute('role') ?? getImplicitRole(element);
  const text = normalizeFullText(element.textContent);

  if (!text) return undefined;
  if (role && INTERACTIVE_ROLES.has(role)) return text.slice(0, 120);

  return element.childElementCount === 0 && text.length <= MAX_LEAF_TEXT_LENGTH
    ? text
    : undefined;
}

export function canUseTextSelector(element: Element, role?: string) {
  if (role && INTERACTIVE_ROLES.has(role)) return true;
  return Boolean(getClickTargetText(element));
}
