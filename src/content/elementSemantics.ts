type LabelledControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const COMBOBOX_INPUT_TYPES = new Set(['email', 'search', 'tel', 'text', 'url']);

export function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim().slice(0, 120) || undefined;
}

function isLabelledControl(element: Element): element is LabelledControl {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  );
}

export function getLabelText(element: Element) {
  if (!isLabelledControl(element) || !element.labels?.length) return undefined;
  return normalizeText(element.labels[0].textContent);
}

function getImplicitInputRole(element: HTMLInputElement) {
  const { type } = element;

  if (element.hasAttribute('list') && COMBOBOX_INPUT_TYPES.has(type)) {
    return 'combobox';
  }

  switch (type) {
    case 'button':
    case 'image':
    case 'reset':
    case 'submit':
      return 'button';
    case 'checkbox':
      return 'checkbox';
    case 'email':
    case 'tel':
    case 'text':
    case 'url':
      return 'textbox';
    case 'number':
      return 'spinbutton';
    case 'radio':
      return 'radio';
    case 'range':
      return 'slider';
    case 'search':
      return 'searchbox';
    default:
      return undefined;
  }
}

export function getImplicitRole(element: Element) {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'button') return 'button';
  if (tagName === 'a' && element.hasAttribute('href')) return 'link';
  if (tagName === 'select') return 'combobox';
  if (tagName === 'textarea') return 'textbox';
  if (element instanceof HTMLInputElement) return getImplicitInputRole(element);

  return undefined;
}

function getAriaLabelledByText(element: Element) {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (!labelledBy) return undefined;

  const label = labelledBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent)
    .filter(Boolean)
    .join(' ');

  return normalizeText(label);
}

export function getAccessibleName(element: Element) {
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;

  const ariaLabelledBy = getAriaLabelledByText(element);
  if (ariaLabelledBy) return ariaLabelledBy;

  const label = getLabelText(element);
  if (label) return label;

  if (element instanceof HTMLInputElement) {
    if (element.type === 'image') return normalizeText(element.alt);
    if (['button', 'submit', 'reset'].includes(element.type)) {
      return normalizeText(element.value);
    }
  }

  return normalizeText(element.textContent);
}
