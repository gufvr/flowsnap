import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  captureFieldValue,
  classifyFieldSensitivity,
  isCapturableField,
} from './fieldCapture';

function createInput(attributes: Record<string, string> = {}) {
  const input = document.createElement('input');
  Object.entries(attributes).forEach(([name, value]) =>
    input.setAttribute(name, value),
  );
  document.body.append(input);
  return input;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('field capture', () => {
  it.each(['text', 'email', 'search', 'tel', 'url', 'number', 'password'])(
    'accepts input type %s',
    (type) => {
      expect(isCapturableField(createInput({ type }))).toBe(true);
    },
  );

  it('accepts textarea and rejects selection and action controls', () => {
    expect(isCapturableField(document.createElement('textarea'))).toBe(true);
    expect(isCapturableField(createInput({ type: 'checkbox' }))).toBe(false);
    expect(isCapturableField(createInput({ type: 'file' }))).toBe(false);
    expect(isCapturableField(document.createElement('select'))).toBe(false);
  });

  it.each([
    [{ type: 'password' }, 'password'],
    [{ autocomplete: 'one-time-code' }, 'one-time-code'],
    [{ autocomplete: 'cc-number' }, 'payment'],
    [{ name: 'api_token' }, 'secret'],
    [{ id: 'customer-cpf' }, 'personal-id'],
    [{ 'aria-label': 'CVV' }, 'payment'],
  ] as const)('classifies sensitive metadata %#', (attributes, reason) => {
    expect(classifyFieldSensitivity(createInput(attributes))).toBe(reason);
  });

  it('protects a password before accessing its value', () => {
    const password = createInput({ type: 'password' });
    const valueGetter = vi.fn(() => {
      throw new Error('Sensitive value must not be read');
    });
    Object.defineProperty(password, 'value', { get: valueGetter });

    expect(captureFieldValue(password)).toEqual({
      kind: 'protected',
      reason: 'password',
    });
    expect(valueGetter).not.toHaveBeenCalled();
  });

  it('protects a field inferred from metadata before accessing its value', () => {
    const token = createInput({ name: 'api_token' });
    const valueGetter = vi.fn(() => {
      throw new Error('Sensitive value must not be read');
    });
    Object.defineProperty(token, 'value', { get: valueGetter });

    expect(captureFieldValue(token)).toEqual({
      kind: 'protected',
      reason: 'secret',
    });
    expect(valueGetter).not.toHaveBeenCalled();
  });

  it('keeps ordinary values and marks oversized content as truncated', () => {
    const username = createInput({ name: 'username' });
    username.value = 'tester';
    expect(captureFieldValue(username)).toEqual({
      kind: 'plain',
      value: 'tester',
    });

    username.value = 'a'.repeat(2001);
    expect(captureFieldValue(username)).toEqual({
      kind: 'plain',
      value: 'a'.repeat(2000),
      truncated: true,
    });
  });
});
