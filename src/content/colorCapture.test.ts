import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  captureColorValue,
  isColorControl,
  resolveColorControl,
} from './colorCapture';

afterEach(() => {
  document.body.replaceChildren();
});

describe('colorCapture', () => {
  it('recognizes only native color inputs', () => {
    const color = document.createElement('input');
    color.type = 'color';
    const range = document.createElement('input');
    range.type = 'range';
    const customPicker = document.createElement('div');
    customPicker.dataset.testid = 'color-picker';

    expect(isColorControl(color)).toBe(true);
    expect(isColorControl(range)).toBe(false);
    expect(isColorControl(customPicker)).toBe(false);
  });

  it('captures the browser-normalized color value', () => {
    const color = document.createElement('input');
    color.type = 'color';
    color.value = '#663399';

    expect(captureColorValue(color)).toEqual({
      kind: 'plain',
      value: '#663399',
    });
  });

  it('resolves clicks from an associated label to its color control', () => {
    document.body.innerHTML = `
      <label for="theme-color"><span>Color Picker</span></label>
      <input id="theme-color" type="color" />
    `;
    const labelText = document.querySelector('span')!;
    const color = document.querySelector('input')!;

    expect(resolveColorControl(labelText)).toBe(color);
  });

  it('classifies sensitive metadata before reading the value', () => {
    const color = document.createElement('input');
    color.type = 'color';
    color.name = 'secret_pin';
    const valueGetter = vi.fn(() => {
      throw new Error('Sensitive color value must not be read');
    });
    Object.defineProperty(color, 'value', { get: valueGetter });

    expect(captureColorValue(color)).toEqual({
      kind: 'protected',
      reason: 'secret',
    });
    expect(valueGetter).not.toHaveBeenCalled();
  });
});
