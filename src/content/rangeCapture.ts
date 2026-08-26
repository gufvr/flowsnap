import type { RecordedFieldValue } from '../shared/recordingTypes';
import { classifyElementSensitivity } from './fieldCapture';

export type RangeControl = HTMLInputElement;

export function isRangeControl(element: Element): element is RangeControl {
  return element instanceof HTMLInputElement && element.type === 'range';
}

export function captureRangeValue(
  control: RangeControl,
): RecordedFieldValue {
  const sensitiveReason = classifyElementSensitivity(control);

  if (sensitiveReason) {
    return { kind: 'protected', reason: sensitiveReason };
  }

  return { kind: 'plain', value: control.value };
}
