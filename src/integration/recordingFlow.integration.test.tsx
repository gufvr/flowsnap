import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import {
  createRecorderController,
  type RecorderController,
} from '../content/recorder';
import { theme } from '../styles/theme';
import { createChromeExtensionHarness } from '../test/chromeExtensionHarness';

function renderSidePanel() {
  return render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>,
  );
}

function createPracticePage(controller: RecorderController) {
  const root = document.createElement('main');
  const usernameLabel = document.createElement('label');
  const username = document.createElement('input');
  const passwordLabel = document.createElement('label');
  const password = document.createElement('input');
  const login = document.createElement('button');

  username.id = 'username';
  usernameLabel.htmlFor = username.id;
  usernameLabel.textContent = 'Username';
  password.id = 'password';
  password.type = 'password';
  passwordLabel.htmlFor = password.id;
  passwordLabel.textContent = 'Password';
  login.type = 'button';
  login.textContent = 'Login';

  root.append(usernameLabel, username, passwordLabel, password, login);
  root.addEventListener('click', controller.handleClick, true);
  root.addEventListener('keydown', controller.handleKeyDown, true);
  root.addEventListener('focusin', controller.handleFocusIn, true);
  root.addEventListener('input', controller.handleInput, true);
  root.addEventListener('change', controller.handleChange, true);
  root.addEventListener('pointerdown', controller.handlePointerDown, true);
  document.body.append(root);

  return { root, username, password, login };
}

const validSelector = {
  score: 100,
  isUnique: true,
  validation: {
    status: 'valid' as const,
    matchCount: 1,
    matchesTarget: true,
  },
};

function createMixedSchemaSteps() {
  return [
    {
      schemaVersion: 4,
      id: 'schema-4-click',
      type: 'click',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 1,
      selectors: {
        recommended: {
          ...validSelector,
          strategy: 'testId',
          value: 'login-submit',
          attribute: 'data-testid',
        },
        alternatives: [],
      },
      element: { tagName: 'button', text: 'Login' },
      description: {
        action: 'click',
        target: { type: 'button', name: 'Login' },
        source: 'accessibleName',
        text: 'Clicou no botão "Login"',
        locale: 'pt-BR',
      },
    },
    {
      schemaVersion: 4,
      id: 'schema-4-focus',
      type: 'focus-navigation',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 2,
      key: 'Tab',
      direction: 'forward',
      selectors: {
        recommended: {
          ...validSelector,
          score: 85,
          strategy: 'label',
          value: 'Password',
        },
        alternatives: [],
      },
      element: { tagName: 'input', inputType: 'password' },
      description: {
        action: 'focusNavigation',
        target: { type: 'field', name: 'Password' },
        source: 'label',
        text: 'Navegou para o campo "Password"',
        locale: 'pt-BR',
      },
    },
    {
      schemaVersion: 5,
      id: 'schema-5-fill',
      type: 'field-fill',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 3,
      selectors: {
        recommended: {
          ...validSelector,
          score: 85,
          strategy: 'label',
          value: 'Email',
        },
        alternatives: [],
      },
      element: { tagName: 'input', inputType: 'email' },
      value: { kind: 'plain', value: 'tester@example.com' },
      description: {
        action: 'fieldFill',
        target: { type: 'field', name: 'Email' },
        source: 'label',
        text: 'Preencheu o campo "Email" com "tester@example.com"',
        locale: 'pt-BR',
      },
    },
    {
      schemaVersion: 3,
      id: 'schema-3',
      type: 'click',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 3,
      selectors: {
        recommended: {
          ...validSelector,
          score: 90,
          strategy: 'role',
          value: 'link:Minha conta',
          role: 'link',
          name: 'Minha conta',
        },
        alternatives: [],
      },
      element: { tagName: 'a', text: 'Minha conta' },
    },
    {
      schemaVersion: 2,
      id: 'schema-2',
      type: 'click',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 4,
      selectors: {
        recommended: {
          strategy: 'id',
          value: 'submitOrder',
          score: 80,
          isUnique: true,
        },
        alternatives: [],
      },
      element: { tagName: 'button' },
    },
    {
      id: 'legacy',
      type: 'click',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 5,
      selector: { css: 'main > button' },
      element: { tagName: 'button', text: 'Legacy' },
    },
    { type: 'click' },
  ];
}

describe('integrated recording flow', () => {
  let harness: ReturnType<typeof createChromeExtensionHarness> | undefined;
  let practicePage: ReturnType<typeof createPracticePage> | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    practicePage?.root.remove();
    practicePage = undefined;
    harness?.dispose();
    harness = undefined;
  });

  it('records, persists, displays and manages a complete click and Tab flow', async () => {
    const user = userEvent.setup();
    harness = createChromeExtensionHarness();
    harness.install();
    await import('../background');

    const controller = createRecorderController((message) =>
      harness?.sendFromTab(message),
    );
    harness.connectRecorder(controller);
    practicePage = createPracticePage(controller);
    const firstRender = renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );

    expect(await screen.findByText('Status: Gravando')).toBeInTheDocument();
    expect(controller.isActive).toBe(true);
    expect(harness.permissionRequest).toHaveBeenCalledWith({
      origins: ['https://qapracticehub.com/*'],
    });
    expect(harness.executeScript).toHaveBeenCalledWith({
      target: { tabId: 21 },
      files: ['assets/recorder.js'],
    });

    await user.click(practicePage.username);
    await user.keyboard('tester');
    await user.tab();
    await user.keyboard('SuperSecret!');
    await user.click(practicePage.login);

    expect(
      await screen.findByText('Clicou no campo "Username"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Preencheu o campo "Username" com "tester"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Navegou para o campo "Password"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Preencheu o campo "Password" com um valor protegido',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Clicou no botão "Login"')).toBeInTheDocument();
    expect(screen.getByText('5 passos capturados')).toBeInTheDocument();

    const storedAfterCapture = harness.getLocalValues();
    expect(storedAfterCapture.recordedSteps).toHaveLength(5);
    expect(JSON.stringify(storedAfterCapture)).not.toContain('SuperSecret!');
    expect(
      (storedAfterCapture.recordedSteps as Array<{ type: string }>).map(
        ({ type }) => type,
      ),
    ).toEqual([
      'click',
      'field-fill',
      'focus-navigation',
      'field-fill',
      'click',
    ]);

    firstRender.unmount();
    renderSidePanel();

    expect(
      await screen.findByText('Navegou para o campo "Password"'),
    ).toBeInTheDocument();
    expect(screen.getByText('5 passos capturados')).toBeInTheDocument();
    expect(screen.getByText('Status: Gravando')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copiar seletor do passo 1' }));
    expect(harness.clipboardWrite).toHaveBeenLastCalledWith(
      'role=textbox;name=Username',
    );

    await user.click(screen.getByRole('button', { name: 'Excluir passo 3' }));
    const deleteConfirmation = screen.getByRole('group', {
      name: 'Confirmar exclusão do passo 3',
    });
    await user.click(within(deleteConfirmation).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('5 passos capturados')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir passo 3' }));
    await user.click(
      within(
        screen.getByRole('group', { name: 'Confirmar exclusão do passo 3' }),
      ).getByRole('button', { name: 'Excluir passo' }),
    );

    await waitFor(() => {
      expect(screen.getByText('4 passos capturados')).toBeInTheDocument();
      expect(
        screen.queryByText('Navegou para o campo "Password"'),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Limpar tudo' }));
    await user.click(
      within(
        screen.getByRole('group', { name: 'Confirmar limpeza dos passos' }),
      ).getByRole('button', { name: 'Limpar tudo' }),
    );

    expect(
      await screen.findByText('Nenhum passo gravado ainda.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Status: Gravando')).toBeInTheDocument();
    expect(controller.isActive).toBe(true);

    await user.click(practicePage.username);
    expect(await screen.findByText('1 passo capturado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Parar Gravação' }));
    expect(await screen.findByText('Status: Parado')).toBeInTheDocument();
    expect(controller.isActive).toBe(false);
  });

  it('reads mixed and incomplete schemas without migrating their storage', async () => {
    const user = userEvent.setup();
    const mixedSteps = createMixedSchemaSteps();
    const originalSteps = structuredClone(mixedSteps);
    harness = createChromeExtensionHarness({
      local: {
        recordingState: { isRecording: false },
        recordedSteps: mixedSteps,
      },
    });
    harness.install();
    await import('../background');
    renderSidePanel();

    expect(await screen.findByText('7 passos capturados')).toBeInTheDocument();
    expect(screen.getByText('Clicou no botão "Login"')).toBeInTheDocument();
    expect(
      screen.getByText('Navegou para o campo "Password"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Preencheu o campo "Email" com "tester@example.com"',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Clicou no link "Minha conta"')).toBeInTheDocument();
    expect(
      screen.getByText('Clicou no botão "Submit order"'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Clicou em um elemento')).toHaveLength(2);
    expect(screen.getByText('Seletor indisponível')).toBeInTheDocument();
    expect(harness.localSet).not.toHaveBeenCalled();
    expect(harness.getLocalValues().recordedSteps).toEqual(originalSteps);

    await user.click(screen.getByRole('button', { name: 'Copiar seletor do passo 1' }));
    expect(harness.clipboardWrite).toHaveBeenLastCalledWith(
      'data-testid=login-submit',
    );

    await user.click(screen.getByRole('button', { name: 'Excluir passo 7' }));
    await user.click(
      within(
        screen.getByRole('group', { name: 'Confirmar exclusão do passo 7' }),
      ).getByRole('button', { name: 'Excluir passo' }),
    );

    await waitFor(() =>
      expect(screen.getByText('6 passos capturados')).toBeInTheDocument(),
    );
    expect(harness.getLocalValues().recordedSteps).toEqual(
      originalSteps.slice(0, 6),
    );

    await user.click(screen.getByRole('button', { name: 'Limpar tudo' }));
    await user.click(
      within(
        screen.getByRole('group', { name: 'Confirmar limpeza dos passos' }),
      ).getByRole('button', { name: 'Limpar tudo' }),
    );

    expect(
      await screen.findByText('Nenhum passo gravado ainda.'),
    ).toBeInTheDocument();
    expect(harness.getLocalValues().recordedSteps).toEqual([]);
  });
});
