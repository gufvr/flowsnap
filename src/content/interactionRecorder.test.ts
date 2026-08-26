import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSelectionChangeMessage,
  createRecorderController,
  type RecorderController,
} from './recorder';

const disconnectors: Array<() => void> = [];

function connectController(controller: RecorderController) {
  document.addEventListener('click', controller.handleClick, true);
  document.addEventListener('keydown', controller.handleKeyDown, true);
  document.addEventListener('keyup', controller.handleKeyUp, true);
  document.addEventListener('focusin', controller.handleFocusIn, true);
  document.addEventListener('input', controller.handleInput, true);
  document.addEventListener('change', controller.handleChange, true);
  document.addEventListener('pointerdown', controller.handlePointerDown, true);

  disconnectors.push(() => {
    document.removeEventListener('click', controller.handleClick, true);
    document.removeEventListener('keydown', controller.handleKeyDown, true);
    document.removeEventListener('keyup', controller.handleKeyUp, true);
    document.removeEventListener('focusin', controller.handleFocusIn, true);
    document.removeEventListener('input', controller.handleInput, true);
    document.removeEventListener('change', controller.handleChange, true);
    document.removeEventListener(
      'pointerdown',
      controller.handlePointerDown,
      true,
    );
  });
}

function createLabelledInput(labelText: string, type: 'checkbox' | 'radio') {
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = type;
  label.append(input);
  document.body.append(label);
  return { label, input };
}

afterEach(() => {
  disconnectors.splice(0).forEach((disconnect) => disconnect());
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe('semantic interaction recording', () => {
  it('builds a protected select message without reading its selected options', () => {
    const select = document.createElement('select');
    select.name = 'api_token';
    const selectedOptionsGetter = vi.fn(() => {
      throw new Error('Protected selection must not be read');
    });
    Object.defineProperty(select, 'selectedOptions', {
      get: selectedOptionsGetter,
    });
    document.body.append(select);

    expect(createSelectionChangeMessage(select)).toMatchObject({
      type: 'RECORDED_SELECTION_CHANGE',
      payload: {
        control: {
          kind: 'select',
          selection: { kind: 'protected', reason: 'secret' },
        },
      },
    });
    expect(selectedOptionsGetter).not.toHaveBeenCalled();
  });

  it('records one semantic checkbox step for label and direct clicks', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { label, input } = createLabelledInput('Remember me', 'checkbox');
    connectController(controller);
    controller.setActive(true);

    await user.click(label);
    await user.click(input);

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage.mock.calls.map(([message]) => message)).toEqual([
      expect.objectContaining({
        type: 'RECORDED_SELECTION_CHANGE',
        payload: expect.objectContaining({
          control: { kind: 'checkbox', checked: true },
        }),
      }),
      expect.objectContaining({
        type: 'RECORDED_SELECTION_CHANGE',
        payload: expect.objectContaining({
          control: { kind: 'checkbox', checked: false },
        }),
      }),
    ]);
  });

  it('records radio and select outcomes without generic clicks', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { input: radio } = createLabelledInput('Standard', 'radio');
    const label = document.createElement('label');
    label.textContent = 'Country';
    const select = document.createElement('select');
    select.append(new Option('Choose', ''), new Option('Brazil', 'BR'));
    label.append(select);
    document.body.append(label);
    connectController(controller);
    controller.setActive(true);

    await user.click(radio);
    await user.selectOptions(select, 'BR');

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage.mock.calls[0][0]).toMatchObject({
      type: 'RECORDED_SELECTION_CHANGE',
      payload: { control: { kind: 'radio', checked: true } },
    });
    expect(sendMessage.mock.calls[1][0]).toMatchObject({
      type: 'RECORDED_SELECTION_CHANGE',
      payload: {
        control: {
          kind: 'select',
          selection: {
            kind: 'plain',
            options: [{ value: 'BR', label: 'Brazil' }],
          },
        },
      },
    });
  });

  it('consolidates range input events into one final schema 7 change', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const label = document.createElement('label');
    label.textContent = 'Experience (Range Slider)';
    const range = document.createElement('input');
    range.type = 'range';
    label.append(range);
    document.body.append(label);
    connectController(controller);
    controller.setActive(true);

    range.value = '6';
    range.dispatchEvent(new InputEvent('input', { bubbles: true }));
    range.value = '7';
    range.dispatchEvent(new InputEvent('input', { bubbles: true }));
    range.dispatchEvent(new Event('change', { bubbles: true }));
    range.click();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RECORDED_RANGE_CHANGE',
        payload: expect.objectContaining({
          schemaVersion: 7,
          value: { kind: 'plain', value: '7' },
        }),
      }),
    );
  });

  it('records the range outcome instead of its ArrowRight key or click', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const range = document.createElement('input');
    range.type = 'range';
    range.setAttribute('aria-label', 'Experience');
    document.body.append(range);
    connectController(controller);
    controller.setActive(true);
    range.focus();

    range.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    range.value = '51';
    range.dispatchEvent(new InputEvent('input', { bubbles: true }));
    range.dispatchEvent(new Event('change', { bubbles: true }));
    range.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }),
    );
    range.click();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0][0]).toMatchObject({
      type: 'RECORDED_RANGE_CHANGE',
      payload: { value: { kind: 'plain', value: '51' } },
    });
  });

  it('ignores repeated range values and leaves color as a generic click', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const range = document.createElement('input');
    range.type = 'range';
    const color = document.createElement('input');
    color.type = 'color';
    document.body.append(range, color);
    connectController(controller);
    controller.setActive(true);

    range.value = '60';
    range.dispatchEvent(new InputEvent('input', { bubbles: true }));
    range.dispatchEvent(new Event('change', { bubbles: true }));
    range.dispatchEvent(new InputEvent('input', { bubbles: true }));
    range.dispatchEvent(new Event('change', { bubbles: true }));
    range.value = '61';
    range.dispatchEvent(new InputEvent('input', { bubbles: true }));
    range.dispatchEvent(new Event('change', { bubbles: true }));
    color.click();

    expect(sendMessage.mock.calls.map(([message]) => message.type)).toEqual([
      'RECORDED_RANGE_CHANGE',
      'RECORDED_RANGE_CHANGE',
      'RECORDED_CLICK',
    ]);
    expect(sendMessage.mock.calls[1][0]).toMatchObject({
      payload: { value: { kind: 'plain', value: '61' } },
    });
  });

  it('discards a pending range adjustment when recording stops', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const range = document.createElement('input');
    range.type = 'range';
    document.body.append(range);
    connectController(controller);
    controller.setActive(true);

    range.value = '70';
    range.dispatchEvent(new InputEvent('input', { bubbles: true }));
    controller.setActive(false);
    controller.setActive(true);
    range.dispatchEvent(new Event('change', { bubbles: true }));

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('prefers the checkbox state over Space and its synthetic click', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { input } = createLabelledInput('Remember me', 'checkbox');
    connectController(controller);
    controller.setActive(true);
    input.focus();

    await user.keyboard(' ');

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RECORDED_SELECTION_CHANGE',
        payload: expect.objectContaining({
          control: { kind: 'checkbox', checked: true },
        }),
      }),
    );
  });

  it('prefers Enter on a button over its synthetic click', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const button = document.createElement('button');
    button.textContent = 'Login';
    document.body.append(button);
    connectController(controller);
    controller.setActive(true);
    button.focus();

    await user.keyboard('{Enter}');

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RECORDED_KEY_PRESS',
        payload: expect.objectContaining({ key: 'Enter' }),
      }),
    );
  });

  it('flushes a pending field fill before recording Enter', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const label = document.createElement('label');
    label.textContent = 'Username';
    const username = document.createElement('input');
    label.append(username);
    document.body.append(label);
    connectController(controller);
    controller.setActive(true);
    username.focus();

    await user.keyboard('tester{Enter}');

    expect(sendMessage.mock.calls.map(([message]) => message.type)).toEqual([
      'RECORDED_FIELD_FILL',
      'RECORDED_KEY_PRESS',
    ]);
  });

  it('records a selection-control key only when it causes no state change', async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Country');
    select.append(new Option('Brazil', 'BR'));
    document.body.append(select);
    connectController(controller);
    controller.setActive(true);
    select.focus();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RECORDED_KEY_PRESS',
        payload: expect.objectContaining({ key: 'Escape' }),
      }),
    );
  });

  it('ignores text navigation, textarea Enter, repeats and shortcuts', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    document.body.append(input, textarea);
    connectController(controller);
    controller.setActive(true);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        repeat: true,
        bubbles: true,
      }),
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      }),
    );

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
