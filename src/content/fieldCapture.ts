import type {
  RecordedFieldValue,
  SensitiveFieldReason,
} from '../shared/recordingTypes';
import { getLabelText } from './elementSemantics';

const MAX_CAPTURED_VALUE_LENGTH = 2000;
const CAPTURABLE_INPUT_TYPES = new Set([
  'email',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'url',
]);

export type CapturableField = HTMLInputElement | HTMLTextAreaElement;

function normalizeMetadata(value: string | null | undefined) {
  return value
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLocaleLowerCase('en-US')
    .trim();
}

function getFieldMetadata(field: CapturableField) {
  return normalizeMetadata(
    [
      field.getAttribute('autocomplete'),
      field.getAttribute('name'),
      field.id,
      field.getAttribute('aria-label'),
      field.getAttribute('placeholder'),
      getLabelText(field),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export function isCapturableField(element: Element): element is CapturableField {
  if (element instanceof HTMLTextAreaElement) return true;

  return (
    element instanceof HTMLInputElement &&
    CAPTURABLE_INPUT_TYPES.has(element.type.toLocaleLowerCase('en-US'))
  );
}

export function classifyFieldSensitivity(
  field: CapturableField,
): SensitiveFieldReason | undefined {
  if (field instanceof HTMLInputElement && field.type === 'password') {
    return 'password';
  }

  const autocomplete = normalizeMetadata(field.getAttribute('autocomplete'));
  if (autocomplete?.includes('password')) return 'password';
  if (autocomplete?.includes('one time code')) return 'one-time-code';
  if (autocomplete?.split(' ').some((token) => token.startsWith('cc'))) {
    return 'payment';
  }

  const metadata = getFieldMetadata(field) ?? '';

  if (/\b(password|senha|passwd|pwd|passcode)\b/.test(metadata)) {
    return 'password';
  }

  if (/\b(otp|one time code|codigo verificacao|verification code)\b/.test(metadata)) {
    return 'one-time-code';
  }

  if (/\b(cvv|cvc|card number|numero cartao|cartao credito|credit card)\b/.test(metadata)) {
    return 'payment';
  }

  if (/\b(cpf|cnpj|ssn|social security|documento identidade)\b/.test(metadata)) {
    return 'personal-id';
  }

  if (/\b(api key|apikey|secret|token|access token|pin)\b/.test(metadata)) {
    return 'secret';
  }

  return undefined;
}

export function captureFieldValue(field: CapturableField): RecordedFieldValue {
  const sensitiveReason = classifyFieldSensitivity(field);

  if (sensitiveReason) {
    return { kind: 'protected', reason: sensitiveReason };
  }

  const value = field.value;
  const truncated = value.length > MAX_CAPTURED_VALUE_LENGTH;

  return {
    kind: 'plain',
    value: truncated ? value.slice(0, MAX_CAPTURED_VALUE_LENGTH) : value,
    ...(truncated ? { truncated: true } : {}),
  };
}
