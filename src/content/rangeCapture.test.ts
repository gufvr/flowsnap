import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureRangeValue, isRangeControl } from './rangeCapture';

afterEach(() => {
  document.body.replaceChildren();
});

describe('rangeCapture', () => {
  it('recognizes only native range inputs', () => {
    const range = document.createElement('input');
    range.type = 'range';
    const color = document.createElement('input');
    color.type = 'color';
    const customSlider = document.createElement('div');
    customSlider.setAttribute('role', 'slider');

    expect(isRangeControl(range)).toBe(true);
    expect(isRangeControl(color)).toBe(false);
    expect(isRangeControl(customSlider)).toBe(false);
  });

  it('captures the normalized range value as plain text', () => {
    const range = document.createElement('input');
    range.type = 'range';
    range.value = '7';

    expect(captureRangeValue(range)).toEqual({
      kind: 'plain',
      value: '7',
    });
  });

  it('classifies sensitive metadata before reading the value', () => {
    const range = document.createElement('input');
    range.type = 'range';
    range.name = 'secret_pin';
    const valueGetter = vi.fn(() => {
      throw new Error('Sensitive range value must not be read');
    });
    Object.defineProperty(range, 'value', { get: valueGetter });

    expect(captureRangeValue(range)).toEqual({
      kind: 'protected',
      reason: 'secret',
    });
    expect(valueGetter).not.toHaveBeenCalled();
  });
});
