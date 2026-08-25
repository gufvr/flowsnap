import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  captureSelectionControl,
  getSelectionSignature,
  resolveSelectionControl,
} from './selectionCapture';

afterEach(() => {
  document.body.replaceChildren();
});

describe('selection capture', () => {
  it('captures checkbox and selected radio state without their values', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = 'private-checkbox-value';
    checkbox.checked = true;
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.value = 'private-radio-value';
    radio.checked = true;

    expect(captureSelectionControl(checkbox)).toEqual({
      kind: 'checkbox',
      checked: true,
    });
    expect(captureSelectionControl(radio)).toEqual({
      kind: 'radio',
      checked: true,
    });
    expect(JSON.stringify(captureSelectionControl(checkbox))).not.toContain(
      'private-checkbox-value',
    );
    expect(JSON.stringify(captureSelectionControl(radio))).not.toContain(
      'private-radio-value',
    );
  });

  it('ignores an unselected radio', () => {
    const radio = document.createElement('input');
    radio.type = 'radio';

    expect(captureSelectionControl(radio)).toBeUndefined();
  });

  it('captures single and multiple select options', () => {
    const select = document.createElement('select');
    select.multiple = true;
    select.append(new Option('Brazil', 'BR'), new Option('Canada', 'CA'));
    select.options[0].selected = true;
    select.options[1].selected = true;

    const selection = captureSelectionControl(select);

    expect(selection).toEqual({
      kind: 'select',
      multiple: true,
      selection: {
        kind: 'plain',
        options: [
          { value: 'BR', label: 'Brazil' },
          { value: 'CA', label: 'Canada' },
        ],
      },
    });
    expect(selection && getSelectionSignature(selection)).toBeTypeOf('string');
  });

  it('protects a sensitive select before reading selected options', () => {
    const select = document.createElement('select');
    select.name = 'api_token';
    const selectedOptionsGetter = vi.fn(() => {
      throw new Error('Protected selection must not be read');
    });
    Object.defineProperty(select, 'selectedOptions', {
      get: selectedOptionsGetter,
    });

    expect(captureSelectionControl(select)).toEqual({
      kind: 'select',
      multiple: false,
      selection: { kind: 'protected', reason: 'secret' },
    });
    expect(selectedOptionsGetter).not.toHaveBeenCalled();
  });

  it('resolves controls reached through labels, descendants and options', () => {
    const label = document.createElement('label');
    const text = document.createElement('span');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    label.append(text, checkbox);
    const select = document.createElement('select');
    const option = new Option('Brazil', 'BR');
    select.append(option);
    document.body.append(label, select);

    expect(resolveSelectionControl(text)).toBe(checkbox);
    expect(resolveSelectionControl(label)).toBe(checkbox);
    expect(resolveSelectionControl(option)).toBe(select);
  });
});
