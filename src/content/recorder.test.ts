import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createClickMessage,
  createColorChangeMessage,
  createFieldFillMessage,
  createFocusNavigationMessage,
  createRangeChangeMessage,
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
  window.addEventListener('blur', controller.handleWindowBlur);

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
    window.removeEventListener('blur', controller.handleWindowBlur);
  });
}

function createFields() {
  const usernameLabel = document.createElement('label');
  usernameLabel.textContent = 'Username';
  const username = document.createElement('input');
  usernameLabel.append(username);
  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Password';
  const password = document.createElement('input');
  password.type = 'password';
  passwordLabel.append(password);
  document.body.append(usernameLabel, passwordLabel);
  return { username, password };
}

afterEach(() => {
  disconnectors.splice(0).forEach((disconnect) => disconnect());
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe('recording messages', () => {
  it('creates schema 4 click recordings with a persisted description', () => {
    const button = document.createElement('button');
    button.textContent = 'Entrar';
    document.body.append(button);

    const message = createClickMessage(button);

    expect(message).toMatchObject({
      type: 'RECORDED_CLICK',
      payload: {
        schemaVersion: 4,
        element: { tagName: 'button', text: 'Entrar' },
        description: {
          action: 'click',
          target: { type: 'button', name: 'Entrar' },
          source: 'accessibleName',
          text: 'Clicou no botão "Entrar"',
          locale: 'pt-BR',
        },
      },
    });
  });

  it('creates schema 4 focus navigation without reading field values', () => {
    const label = document.createElement('label');
    label.textContent = 'Password';
    const password = document.createElement('input');
    password.type = 'password';
    password.value = 'SuperSecretPassword!';
    label.append(password);
    document.body.append(label);

    const message = createFocusNavigationMessage(password, 'backward');

    expect(message).toMatchObject({
      type: 'RECORDED_FOCUS_NAVIGATION',
      payload: {
        schemaVersion: 4,
        type: 'focus-navigation',
        key: 'Tab',
        direction: 'backward',
        element: { tagName: 'input', inputType: 'password' },
        description: {
          action: 'focusNavigation',
          text: 'Navegou para o campo "Password"',
        },
      },
    });
    expect(JSON.stringify(message)).not.toContain('SuperSecretPassword!');
  });

  it('creates a schema 5 field fill with its persisted description', () => {
    const label = document.createElement('label');
    label.textContent = 'Username';
    const username = document.createElement('input');
    username.value = 'tester';
    label.append(username);
    document.body.append(label);

    expect(createFieldFillMessage(username)).toMatchObject({
      type: 'RECORDED_FIELD_FILL',
      payload: {
        schemaVersion: 5,
        type: 'field-fill',
        value: { kind: 'plain', value: 'tester' },
        description: {
          action: 'fieldFill',
          text: 'Preencheu o campo "Username" com "tester"',
        },
      },
    });
  });

  it('creates a protected schema 5 field fill without exposing a password', () => {
    const label = document.createElement('label');
    label.textContent = 'Password';
    const password = document.createElement('input');
    password.type = 'password';
    password.value = 'SuperSecretPassword!';
    label.append(password);
    document.body.append(label);

    const message = createFieldFillMessage(password);

    expect(message).toMatchObject({
      type: 'RECORDED_FIELD_FILL',
      payload: {
        value: { kind: 'protected', reason: 'password' },
        description: {
          text: 'Preencheu o campo "Password" com um valor protegido',
        },
      },
    });
    expect(JSON.stringify(message)).not.toContain('SuperSecretPassword!');
  });

  it('creates a schema 7 range change with its final value and description', () => {
    const label = document.createElement('label');
    label.textContent = 'Experience (Range Slider)';
    const range = document.createElement('input');
    range.type = 'range';
    range.value = '7';
    label.append(range);
    document.body.append(label);

    expect(createRangeChangeMessage(range)).toMatchObject({
      type: 'RECORDED_RANGE_CHANGE',
      payload: {
        schemaVersion: 7,
        type: 'range-change',
        element: { tagName: 'input', inputType: 'range' },
        value: { kind: 'plain', value: '7' },
        description: {
          action: 'rangeChange',
          text: 'Ajustou o controle deslizante "Experience (Range Slider)" para "7"',
        },
      },
    });
  });

  it('creates a schema 8 color change with its final value and description', () => {
    const label = document.createElement('label');
    label.textContent = 'Color Picker';
    const color = document.createElement('input');
    color.type = 'color';
    color.value = '#663399';
    label.append(color);
    document.body.append(label);

    expect(createColorChangeMessage(color)).toMatchObject({
      type: 'RECORDED_COLOR_CHANGE',
      payload: {
        schemaVersion: 8,
        type: 'color-change',
        element: { tagName: 'input', inputType: 'color' },
        value: { kind: 'plain', value: '#663399' },
        description: {
          action: 'colorChange',
          text: 'Selecionou a cor "#663399" no seletor de cor "Color Picker"',
        },
      },
    });
  });

  it.each([
    [{ type: 'password' }, 'password'],
    [{ type: 'text', name: 'api_token' }, 'secret'],
  ] as const)(
    'classifies protected fields before the complete message path reads value %#',
    (attributes, reason) => {
      const field = document.createElement('input');
      Object.entries(attributes).forEach(([name, value]) =>
        field.setAttribute(name, value),
      );
      const valueGetter = vi.fn(() => {
        throw new Error('Sensitive value must not be read');
      });
      Object.defineProperty(field, 'value', { get: valueGetter });
      document.body.append(field);

      expect(createFieldFillMessage(field)).toMatchObject({
        payload: { value: { kind: 'protected', reason } },
      });
      expect(valueGetter).not.toHaveBeenCalled();
    },
  );
});

describe('createRecorderController', () => {
  it('ignores a direct click on a structural container with aggregate text', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const container = document.createElement('section');
    container.innerHTML = `
      <h2>Gender (Radio Buttons)</h2>
      <span>Male</span><span>Female</span><span>Other</span>
      <h2>Skills (Checkboxes)</h2>
      <span>Selenium</span><span>Playwright</span><span>Cypress</span>
    `;
    document.body.append(container);
    connectController(controller);
    controller.setActive(true);

    container.click();

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('records the interactive ancestor when a nested child receives the click', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const button = document.createElement('button');
    button.innerHTML = '<span>Salvar fluxo</span>';
    const child = button.querySelector('span')!;
    document.body.append(button);
    connectController(controller);
    controller.setActive(true);

    child.click();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RECORDED_CLICK',
        payload: expect.objectContaining({
          element: expect.objectContaining({ tagName: 'button' }),
          description: expect.objectContaining({
            text: 'Clicou no botão "Salvar fluxo"',
          }),
        }),
      }),
    );
  });

  it('uses a stable custom identifier instead of aggregate component text', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const component = document.createElement('div');
    component.dataset.testid = 'settings-card';
    component.innerHTML = '<span>Conta</span><span>Segurança</span>';
    const child = component.querySelector('span')!;
    document.body.append(component);
    connectController(controller);
    controller.setActive(true);

    child.click();

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          element: { tagName: 'div', text: undefined, inputType: undefined },
          selectors: expect.objectContaining({
            recommended: expect.objectContaining({
              strategy: 'testId',
              value: 'settings-card',
            }),
          }),
          description: expect.objectContaining({
            text: 'Clicou no elemento "Settings card"',
            source: 'testId',
          }),
        }),
      }),
    );
  });

  it('consolidates multiple input events into one field fill on change', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username } = createFields();
    connectController(controller);
    controller.setActive(true);

    username.value = 't';
    username.dispatchEvent(new InputEvent('input', { bubbles: true }));
    username.value = 'tester';
    username.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(sendMessage).not.toHaveBeenCalled();

    username.dispatchEvent(new Event('change', { bubbles: true }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RECORDED_FIELD_FILL',
        payload: expect.objectContaining({
          value: { kind: 'plain', value: 'tester' },
        }),
      }),
    );
  });

  it('ignores unsupported fields, unchanged repeats and edits while stopped', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username } = createFields();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    document.body.append(fileInput);
    connectController(controller);

    username.value = 'stopped';
    username.dispatchEvent(new InputEvent('input', { bubbles: true }));
    username.dispatchEvent(new Event('change', { bubbles: true }));
    controller.setActive(true);
    fileInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    username.value = 'tester';
    username.dispatchEvent(new InputEvent('input', { bubbles: true }));
    username.dispatchEvent(new Event('change', { bubbles: true }));
    username.dispatchEvent(new InputEvent('input', { bubbles: true }));
    username.dispatchEvent(new Event('change', { bubbles: true }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('discards a pending edit when recording stops', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username } = createFields();
    connectController(controller);
    controller.setActive(true);

    username.value = 'tester';
    username.dispatchEvent(new InputEvent('input', { bubbles: true }));
    controller.setActive(false);
    controller.setActive(true);
    username.dispatchEvent(new Event('change', { bubbles: true }));

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('captures Tab only after focus moves to another element', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username, password } = createFields();
    connectController(controller);
    controller.setActive(true);

    username.focus();
    username.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    password.focus();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RECORDED_FOCUS_NAVIGATION',
        payload: expect.objectContaining({
          direction: 'forward',
          description: expect.objectContaining({
            text: 'Navegou para o campo "Password"',
          }),
        }),
      }),
    );
  });

  it('records Shift+Tab as backward navigation', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username, password } = createFields();
    connectController(controller);
    controller.setActive(true);

    password.focus();
    password.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    username.focus();

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RECORDED_FOCUS_NAVIGATION',
        payload: expect.objectContaining({ direction: 'backward' }),
      }),
    );
  });

  it.each([
    new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
    new KeyboardEvent('keydown', {
      key: 'Tab',
      ctrlKey: true,
      bubbles: true,
    }),
    new KeyboardEvent('keydown', {
      key: 'Tab',
      altKey: true,
      bubbles: true,
    }),
    new KeyboardEvent('keydown', {
      key: 'Tab',
      metaKey: true,
      bubbles: true,
    }),
  ])('does not capture typing or modified Tab shortcuts', (keyboardEvent) => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username, password } = createFields();
    connectController(controller);
    controller.setActive(true);

    username.focus();
    username.dispatchEvent(keyboardEvent);
    password.focus();

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('ignores focus changes that were not caused by Tab', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { password } = createFields();
    connectController(controller);
    controller.setActive(true);

    password.focus();

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('clears pending Tab navigation when pointer interaction starts', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username, password } = createFields();
    connectController(controller);
    controller.setActive(true);

    username.focus();
    username.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    password.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    password.focus();
    password.click();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'RECORDED_CLICK' }),
    );
  });

  it('expires Tab navigation when focus does not move promptly', () => {
    vi.useFakeTimers();
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username, password } = createFields();
    connectController(controller);
    controller.setActive(true);

    username.focus();
    username.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    vi.advanceTimersByTime(301);
    password.focus();

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('clears pending navigation when the page loses focus', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username, password } = createFields();
    connectController(controller);
    controller.setActive(true);

    username.focus();
    username.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    window.dispatchEvent(new FocusEvent('blur'));
    password.focus();

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('clears pending navigation when recording stops', () => {
    const sendMessage = vi.fn();
    const controller = createRecorderController(sendMessage);
    const { username, password } = createFields();
    connectController(controller);
    controller.setActive(true);

    username.focus();
    username.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    controller.setActive(false);
    password.focus();

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
