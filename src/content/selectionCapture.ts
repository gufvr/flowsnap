import type { RecordedSelectionControl } from '../shared/recordingTypes';
import { classifyElementSensitivity } from './fieldCapture';

const MAX_SELECTED_OPTIONS = 50;
const MAX_OPTION_VALUE_LENGTH = 200;
const MAX_OPTION_LABEL_LENGTH = 200;

export type SelectionControl = HTMLInputElement | HTMLSelectElement;

function isCheckableInput(
  element: Element,
): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement &&
    (element.type === 'checkbox' || element.type === 'radio')
  );
}

export function isSelectionControl(
  element: Element,
): element is SelectionControl {
  return isCheckableInput(element) || element instanceof HTMLSelectElement;
}

export function resolveSelectionControl(
  element: Element,
): SelectionControl | undefined {
  if (isSelectionControl(element)) return element;

  if (element instanceof HTMLOptionElement) {
    return element.closest('select') ?? undefined;
  }

  const label =
    element instanceof HTMLLabelElement ? element : element.closest('label');
  const labelledControl = label?.control;

  return labelledControl && isSelectionControl(labelledControl)
    ? labelledControl
    : undefined;
}

function normalizeOptionLabel(option: HTMLOptionElement) {
  return option.label.replace(/\s+/g, ' ').trim();
}

export function captureSelectionControl(
  control: SelectionControl,
): RecordedSelectionControl | undefined {
  if (control instanceof HTMLInputElement) {
    if (control.type === 'checkbox') {
      return { kind: 'checkbox', checked: control.checked };
    }

    return control.checked ? { kind: 'radio', checked: true } : undefined;
  }

  const sensitiveReason = classifyElementSensitivity(control);
  if (sensitiveReason) {
    return {
      kind: 'select',
      multiple: control.multiple,
      selection: { kind: 'protected', reason: sensitiveReason },
    };
  }

  const selectedOptions = Array.from(control.selectedOptions);
  const capturedOptions = selectedOptions.slice(0, MAX_SELECTED_OPTIONS).map(
    (option) => ({
      value: option.value.slice(0, MAX_OPTION_VALUE_LENGTH),
      label: normalizeOptionLabel(option).slice(0, MAX_OPTION_LABEL_LENGTH),
    }),
  );
  const truncated =
    selectedOptions.length > MAX_SELECTED_OPTIONS ||
    selectedOptions.some(
      (option) =>
        option.value.length > MAX_OPTION_VALUE_LENGTH ||
        normalizeOptionLabel(option).length > MAX_OPTION_LABEL_LENGTH,
    );

  return {
    kind: 'select',
    multiple: control.multiple,
    selection: {
      kind: 'plain',
      options: capturedOptions,
      ...(truncated ? { truncated: true } : {}),
    },
  };
}

export function getSelectionSignature(
  selection: RecordedSelectionControl,
): string | undefined {
  if (selection.kind === 'checkbox') {
    return `checkbox:${selection.checked}`;
  }

  if (selection.kind === 'radio') return 'radio:true';
  if (selection.selection.kind === 'protected') return undefined;

  return JSON.stringify({
    multiple: selection.multiple,
    options: selection.selection.options,
  });
}
