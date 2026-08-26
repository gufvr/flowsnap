import type { RecordedFieldValue } from '../shared/recordingTypes';
import { classifyElementSensitivity } from './fieldCapture';

export type ColorControl = HTMLInputElement;

export function isColorControl(element: Element): element is ColorControl {
  return element instanceof HTMLInputElement && element.type === 'color';
}

export function resolveColorControl(
  element: Element,
): ColorControl | undefined {
  if (isColorControl(element)) return element;

  const label =
    element instanceof HTMLLabelElement ? element : element.closest('label');
  const labelledControl = label?.control;

  return labelledControl && isColorControl(labelledControl)
    ? labelledControl
    : undefined;
}

export function captureColorValue(
  control: ColorControl,
): RecordedFieldValue {
  const sensitiveReason = classifyElementSensitivity(control);

  if (sensitiveReason) {
    return { kind: 'protected', reason: sensitiveReason };
  }

  return { kind: 'plain', value: control.value };
}
