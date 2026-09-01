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
  const rememberLabel = document.createElement('label');
  const remember = document.createElement('input');
  const standardLabel = document.createElement('label');
  const standard = document.createElement('input');
  const countryLabel = document.createElement('label');
  const country = document.createElement('select');
  const experienceLabel = document.createElement('label');
  const experience = document.createElement('input');
  const colorLabel = document.createElement('label');
  const color = document.createElement('input');
  const noisyContainer = document.createElement('section');

  username.id = 'username';
  usernameLabel.htmlFor = username.id;
  usernameLabel.textContent = 'Username';
  password.id = 'password';
  password.type = 'password';
  passwordLabel.htmlFor = password.id;
  passwordLabel.textContent = 'Password';
  login.type = 'button';
  login.textContent = 'Login';
  remember.type = 'checkbox';
  rememberLabel.textContent = 'Remember me';
  rememberLabel.append(remember);
  standard.type = 'radio';
  standard.name = 'plan';
  standardLabel.textContent = 'Standard';
  standardLabel.append(standard);
  countryLabel.textContent = 'Country';
  country.append(new Option('Choose', ''), new Option('Brazil', 'BR'));
  countryLabel.append(country);
  experienceLabel.textContent = 'Experience (Range Slider)';
  experience.type = 'range';
  experience.value = '5';
  experienceLabel.append(experience);
  colorLabel.textContent = 'Color Picker';
  color.type = 'color';
  color.value = '#000000';
  colorLabel.append(color);
  noisyContainer.innerHTML = `
    <h2>Gender (Radio Buttons)</h2>
    <span>Male</span><span>Female</span><span>Other</span>
    <h2>Skills (Checkboxes)</h2>
    <span>Selenium</span><span>Playwright</span><span>Cypress</span>
  `;

  root.append(
    usernameLabel,
    username,
    passwordLabel,
    password,
    login,
    rememberLabel,
    standardLabel,
    countryLabel,
    experienceLabel,
    colorLabel,
    noisyContainer,
  );
  root.addEventListener('click', controller.handleClick, true);
  root.addEventListener('keydown', controller.handleKeyDown, true);
  root.addEventListener('keyup', controller.handleKeyUp, true);
  root.addEventListener('focusin', controller.handleFocusIn, true);
  root.addEventListener('input', controller.handleInput, true);
  root.addEventListener('change', controller.handleChange, true);
  root.addEventListener('pointerdown', controller.handlePointerDown, true);
  document.body.append(root);

  return {
    root,
    username,
    password,
    login,
    rememberLabel,
    remember,
    standard,
    country,
    experience,
    color,
    noisyContainer,
  };
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
    {
      schemaVersion: 9,
      id: 'schema-9-navigation',
      type: 'navigation',
      url: 'https://qapracticehub.com/#buttons',
      timestamp: 6,
      fromUrl: 'https://qapracticehub.com/#forms',
      toUrl: 'https://qapracticehub.com/#buttons',
      trigger: 'fragment',
      description: {
        action: 'navigation',
        text: 'Navegou para "/#buttons"',
        locale: 'pt-BR',
      },
    },
    {
      schemaVersion: 10,
      id: 'schema-10-reload',
      type: 'navigation',
      url: 'https://qapracticehub.com/account',
      timestamp: 6,
      fromUrl: 'https://qapracticehub.com/account',
      toUrl: 'https://qapracticehub.com/account',
      trigger: 'reload',
      description: {
        action: 'navigation',
        text: 'Recarregou "/account"',
        locale: 'pt-BR',
      },
    },
    {
      schemaVersion: 8,
      id: 'schema-8-color',
      type: 'color-change',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 6,
      selectors: {
        recommended: {
          ...validSelector,
          score: 85,
          strategy: 'label',
          value: 'Color Picker',
        },
        alternatives: [],
      },
      element: { tagName: 'input', inputType: 'color' },
      value: { kind: 'plain', value: '#663399' },
      description: {
        action: 'colorChange',
        target: { type: 'field', name: 'Color Picker' },
        source: 'label',
        text: 'Selecionou a cor "#663399" no seletor de cor "Color Picker"',
        locale: 'pt-BR',
      },
    },
    {
      schemaVersion: 7,
      id: 'schema-7-range',
      type: 'range-change',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 6,
      selectors: {
        recommended: {
          ...validSelector,
          score: 85,
          strategy: 'label',
          value: 'Experience (Range Slider)',
        },
        alternatives: [],
      },
      element: { tagName: 'input', inputType: 'range' },
      value: { kind: 'plain', value: '7' },
      description: {
        action: 'rangeChange',
        target: { type: 'field', name: 'Experience (Range Slider)' },
        source: 'label',
        text: 'Ajustou o controle deslizante "Experience (Range Slider)" para "7"',
        locale: 'pt-BR',
      },
    },
    {
      schemaVersion: 6,
      id: 'schema-6-selection',
      type: 'selection-change',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 6,
      selectors: {
        recommended: {
          ...validSelector,
          score: 85,
          strategy: 'label',
          value: 'Remember me',
        },
        alternatives: [],
      },
      element: { tagName: 'input', inputType: 'checkbox' },
      control: { kind: 'checkbox', checked: true },
      description: {
        action: 'selectionChange',
        target: { type: 'checkbox', name: 'Remember me' },
        source: 'label',
        text: 'Marcou a caixa de seleção "Remember me"',
        locale: 'pt-BR',
      },
    },
    {
      schemaVersion: 6,
      id: 'schema-6-key',
      type: 'key-press',
      url: 'https://qapracticehub.com/#forms',
      timestamp: 7,
      key: 'Enter',
      selectors: {
        recommended: {
          ...validSelector,
          score: 90,
          strategy: 'role',
          value: 'button:Login',
          role: 'button',
          name: 'Login',
        },
        alternatives: [],
      },
      element: { tagName: 'button', text: 'Login' },
      description: {
        action: 'keyPress',
        target: { type: 'button', name: 'Login' },
        source: 'accessibleName',
        text: 'Pressionou Enter no botão "Login"',
        locale: 'pt-BR',
      },
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
  }, 10_000);

  it('records one semantic outcome for selection controls and keyboard activation', async () => {
    const user = userEvent.setup();
    harness = createChromeExtensionHarness();
    harness.install();
    await import('../background');

    const controller = createRecorderController((message) =>
      harness?.sendFromTab(message),
    );
    harness.connectRecorder(controller);
    practicePage = createPracticePage(controller);
    renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );
    practicePage.noisyContainer.click();
    practicePage.experience.value = '6';
    practicePage.experience.dispatchEvent(
      new InputEvent('input', { bubbles: true }),
    );
    practicePage.experience.value = '7';
    practicePage.experience.dispatchEvent(
      new InputEvent('input', { bubbles: true }),
    );
    practicePage.experience.dispatchEvent(
      new Event('change', { bubbles: true }),
    );
    practicePage.experience.click();
    practicePage.color.click();
    practicePage.color.value = '#ff0000';
    practicePage.color.dispatchEvent(
      new InputEvent('input', { bubbles: true }),
    );
    practicePage.color.value = '#663399';
    practicePage.color.dispatchEvent(
      new InputEvent('input', { bubbles: true }),
    );
    practicePage.color.dispatchEvent(new Event('change', { bubbles: true }));
    practicePage.color.click();
    await user.click(practicePage.rememberLabel);
    await user.click(practicePage.standard);
    await user.selectOptions(practicePage.country, 'BR');
    await user.click(practicePage.remember);
    practicePage.login.focus();
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Marcou a caixa de seleção "Remember me"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Desmarcou a caixa de seleção "Remember me"'),
    ).toBeInTheDocument();
    expect(screen.getByText('Selecionou a opção "Standard"')).toBeInTheDocument();
    expect(
      screen.getByText('Selecionou "Brazil" no seletor "Country"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Pressionou Enter no botão "Login"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ajustou o controle deslizante "Experience (Range Slider)" para "7"',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Selecionou a cor "#663399" no seletor de cor "Color Picker"',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('7 passos capturados')).toBeInTheDocument();

    const storedSteps = harness.getLocalValues().recordedSteps as Array<{
      type: string;
    }>;
    expect(JSON.stringify(storedSteps)).not.toContain('Gender (Radio Buttons)');
    expect(storedSteps.map(({ type }) => type)).toEqual([
      'range-change',
      'color-change',
      'selection-change',
      'selection-change',
      'selection-change',
      'selection-change',
      'key-press',
    ]);

    await user.click(screen.getByRole('button', { name: 'Parar Gravação' }));
    expect(await screen.findByText('Status: Parado')).toBeInTheDocument();
  });

  it('adds the background URL as an editable schema 11 verification', async () => {
    const user = userEvent.setup();
    harness = createChromeExtensionHarness();
    harness.install();
    await import('../background');
    renderSidePanel();

    const assertionButton = await screen.findByRole('button', {
      name: 'Verificar URL atual',
    });
    expect(assertionButton).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Iniciar Gravação' }));
    await user.click(assertionButton);

    expect(
      await screen.findByText('Verificou que a URL é "/#forms"'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 passo capturado')).toBeInTheDocument();
    expect(screen.getByText('Seletor indisponível')).toBeInTheDocument();
    expect(harness.getLocalValues().recordedSteps).toEqual([
      expect.objectContaining({
        schemaVersion: 11,
        type: 'assertion',
        url: 'https://qapracticehub.com/#forms',
        assertion: {
          kind: 'url',
          operator: 'equals',
          expected: 'https://qapracticehub.com/#forms',
        },
      }),
    ]);

    await user.click(
      screen.getByRole('button', { name: 'Editar descrição do passo 1' }),
    );
    const field = screen.getByRole('textbox', {
      name: 'Descrição do passo 1',
    });
    await user.clear(field);
    await user.type(field, 'Validou a página de formulários');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('Validou a página de formulários'),
    ).toBeInTheDocument();
    expect(
      (
        harness.getLocalValues().recordedSteps as Array<{
          descriptionOverride?: { text?: string };
        }>
      )[0]?.descriptionOverride?.text,
    ).toBe('Validou a página de formulários');

    await user.click(screen.getByRole('button', { name: 'Gerar Playwright' }));
    const playwrightPreview = screen.getByLabelText(
      'Prévia do código Playwright',
    );
    expect(playwrightPreview).toHaveTextContent(
      'import { test, expect } from "@playwright/test";',
    );
    expect(playwrightPreview).toHaveTextContent(
      '// Passo 1: Validou a página de formulários',
    );
    expect(playwrightPreview).toHaveTextContent(
      'await expect(page).toHaveURL("https://qapracticehub.com/#forms");',
    );
    expect(playwrightPreview).not.toHaveTextContent('TODO FlowSnap');
    expect(
      screen.getByText('1 de 1 passo exportado; 0 marcados como TODO.'),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Parar Gravação' }));
    expect(assertionButton).toBeDisabled();
  });

  it('records and deduplicates same-document navigation in the active top frame', async () => {
    const user = userEvent.setup();
    harness = createChromeExtensionHarness();
    harness.install();
    await import('../background');
    renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );

    harness.emitReferenceFragmentUpdated(
      'https://qapracticehub.com/#buttons',
      { timeStamp: 10 },
    );
    harness.emitHistoryStateUpdated(
      'https://qapracticehub.com/products?view=grid',
      { timeStamp: 20 },
    );
    harness.emitHistoryStateUpdated(
      'https://qapracticehub.com/#forms',
      { timeStamp: 30, transitionQualifiers: ['forward_back'] },
    );
    harness.emitReferenceFragmentUpdated(
      'https://qapracticehub.com/#forms',
      { timeStamp: 31, transitionQualifiers: ['forward_back'] },
    );
    harness.emitHistoryStateUpdated(
      'https://qapracticehub.com/ignored-frame',
      { frameId: 2, timeStamp: 40 },
    );

    expect(
      await screen.findByText('Navegou para "/#buttons"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Navegou para "/products?view=grid"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Navegou pelo histórico para "/#forms"'),
    ).toBeInTheDocument();
    expect(screen.getByText('3 passos capturados')).toBeInTheDocument();
    expect(screen.getAllByText('Seletor indisponível')).toHaveLength(3);

    const storedSteps = harness.getLocalValues().recordedSteps as Array<{
      fromUrl: string;
      toUrl: string;
      trigger: string;
    }>;
    expect(
      storedSteps.map(({ fromUrl, toUrl, trigger }) => ({
        fromUrl,
        toUrl,
        trigger,
      })),
    ).toEqual([
      {
        fromUrl: 'https://qapracticehub.com/#forms',
        toUrl: 'https://qapracticehub.com/#buttons',
        trigger: 'fragment',
      },
      {
        fromUrl: 'https://qapracticehub.com/#buttons',
        toUrl: 'https://qapracticehub.com/products?view=grid',
        trigger: 'history-api',
      },
      {
        fromUrl: 'https://qapracticehub.com/products?view=grid',
        toUrl: 'https://qapracticehub.com/#forms',
        trigger: 'history-traversal',
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'Parar Gravação' }));
    const installedHarness = harness;
    const readsBeforeStoppedNavigation = installedHarness.localGet.mock.calls.length;
    harness.emitReferenceFragmentUpdated(
      'https://qapracticehub.com/#stopped',
    );
    await waitFor(() => {
      expect(installedHarness.localGet).toHaveBeenCalledTimes(
        readsBeforeStoppedNavigation + 1,
      );
      expect(installedHarness.getLocalValues().recordedSteps).toHaveLength(3);
    });
  });

  it('records complete navigation and reload while resuming capture in each document', async () => {
    const user = userEvent.setup();
    harness = createChromeExtensionHarness();
    harness.install();
    await import('../background');
    renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );

    harness.emitCommitted('https://qapracticehub.com/account', {
      documentId: 'document-account',
      timeStamp: 100,
      transitionType: 'link',
    });
    const accountController = createRecorderController((message) =>
      harness?.sendFromTab(message),
    );
    harness.connectRecorder(accountController);
    practicePage = createPracticePage(accountController);
    harness.emitDOMContentLoaded('https://qapracticehub.com/account', {
      documentId: 'document-account',
      timeStamp: 110,
    });

    expect(
      await screen.findByText('Navegou para "/account"'),
    ).toBeInTheDocument();
    await waitFor(() => expect(accountController.isActive).toBe(true));
    await user.click(practicePage.login);
    expect(
      await screen.findByText('Clicou no botão "Login"'),
    ).toBeInTheDocument();

    harness.emitCommitted('https://qapracticehub.com/account', {
      documentId: 'document-reload',
      timeStamp: 200,
      transitionType: 'reload',
    });
    practicePage.root.remove();
    const reloadController = createRecorderController((message) =>
      harness?.sendFromTab(message),
    );
    harness.connectRecorder(reloadController);
    practicePage = createPracticePage(reloadController);
    harness.emitCompleted('https://qapracticehub.com/account', {
      documentId: 'document-reload',
      timeStamp: 220,
    });

    expect(
      await screen.findByText('Recarregou "/account"'),
    ).toBeInTheDocument();
    await waitFor(() => expect(reloadController.isActive).toBe(true));
    await user.click(practicePage.username);

    expect(
      await screen.findByText('Clicou no campo "Username"'),
    ).toBeInTheDocument();
    expect(screen.getByText('4 passos capturados')).toBeInTheDocument();
    expect(harness.executeScript).toHaveBeenCalledTimes(3);
    expect(harness.getLocalValues().recordingState).toMatchObject({
      isRecording: true,
      currentUrl: 'https://qapracticehub.com/account',
      currentDocumentId: 'document-reload',
      recorderDocumentId: 'document-reload',
    });
    expect(
      (
        harness.getLocalValues().recordedSteps as Array<{
          schemaVersion: number;
          type: string;
        }>
      ).map(({ schemaVersion, type }) => ({ schemaVersion, type })),
    ).toEqual([
      { schemaVersion: 10, type: 'navigation' },
      { schemaVersion: 4, type: 'click' },
      { schemaVersion: 10, type: 'navigation' },
      { schemaVersion: 4, type: 'click' },
    ]);
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

    expect(await screen.findByText('13 passos capturados')).toBeInTheDocument();
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
    expect(
      screen.getByText('Marcou a caixa de seleção "Remember me"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Pressionou Enter no botão "Login"'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ajustou o controle deslizante "Experience (Range Slider)" para "7"',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Selecionou a cor "#663399" no seletor de cor "Color Picker"',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Navegou para "/#buttons"')).toBeInTheDocument();
    expect(screen.getByText('Recarregou "/account"')).toBeInTheDocument();
    expect(screen.getAllByText('Seletor indisponível')).toHaveLength(3);
    expect(harness.localSet).not.toHaveBeenCalled();
    expect(harness.getLocalValues().recordedSteps).toEqual(originalSteps);

    await user.click(
      screen.getByRole('button', { name: 'Mover passo 12 para cima' }),
    );
    const reorderedSteps: unknown[] = structuredClone(originalSteps);
    [reorderedSteps[10], reorderedSteps[11]] = [
      reorderedSteps[11],
      reorderedSteps[10],
    ];
    await waitFor(() =>
      expect(harness?.getLocalValues().recordedSteps).toEqual(reorderedSteps),
    );
    expect(screen.getAllByRole('listitem')[10]).toHaveFocus();

    await user.click(
      screen.getByRole('button', { name: 'Editar descrição do passo 8' }),
    );
    const descriptionField = screen.getByRole('textbox', {
      name: 'Descrição do passo 8',
    });
    await user.clear(descriptionField);
    await user.type(descriptionField, 'Atualizou a área da conta');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('Atualizou a área da conta'),
    ).toBeInTheDocument();
    const editedSteps: unknown[] = structuredClone(reorderedSteps);
    editedSteps[7] = {
      ...(editedSteps[7] as Record<string, unknown>),
      descriptionOverride: {
        text: 'Atualizou a área da conta',
        locale: 'pt-BR',
      },
    };
    expect(harness.getLocalValues().recordedSteps).toEqual(editedSteps);

    const storageBeforeCollectiveCopy = structuredClone(
      harness.getLocalValues(),
    );
    await user.click(
      screen.getByRole('button', { name: 'Copiar seletores' }),
    );
    expect(harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining(
        '1. Clicou no botão "Login"\n   Seletor: data-testid=login-submit',
      ),
    );
    expect(harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining(
        '12. Marcou a caixa de seleção "Remember me"\n   Seletor: label=Remember me',
      ),
    );
    expect(
      await screen.findByText('10 seletores copiados'),
    ).toBeInTheDocument();
    expect(harness.getLocalValues()).toEqual(storageBeforeCollectiveCopy);

    await user.click(
      screen.getByRole('button', { name: 'Gerar Playwright' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Código Playwright' }),
    ).toHaveFocus();
    expect(
      screen.getByText('12 de 13 passos exportados; 1 marcado como TODO.'),
    ).toBeInTheDocument();
    const codePreview = screen.getByLabelText('Prévia do código Playwright');
    expect(codePreview).toHaveTextContent(
      'await page.getByTestId("login-submit").click();',
    );
    expect(codePreview).toHaveTextContent('Passo 8: Atualizou a área da conta');
    expect(codePreview).toHaveTextContent(
      'await setNativeInputValue(page.getByLabel("Color Picker", { exact: true }), "#663399", "color");',
    );
    expect(codePreview).toHaveTextContent(
      'await setNativeInputValue(page.getByLabel("Experience (Range Slider)", { exact: true }), "7", "range");',
    );
    expect(
      screen.getByRole('button', { name: 'Baixar arquivo' }),
    ).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'import { test, type Locator } from "@playwright/test";',
      ),
    );
    expect(harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining('// Passo 12: Marcou a caixa de seleção'),
    );
    expect(
      await screen.findByText('Código Playwright copiado'),
    ).toBeInTheDocument();
    expect(harness.getLocalValues()).toEqual(storageBeforeCollectiveCopy);

    const cypressButton = screen.getByRole('button', {
      name: 'Gerar Cypress',
    });
    await user.click(cypressButton);
    expect(
      screen.queryByRole('heading', { name: 'Código Playwright' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Código Cypress' }),
    ).toHaveFocus();
    expect(
      screen.getByText('12 de 13 passos exportados; 1 marcado como TODO.'),
    ).toBeInTheDocument();
    const cypressPreview = screen.getByLabelText('Prévia do código Cypress');
    expect(cypressPreview).toHaveTextContent(
      'cy.visit("https://qapracticehub.com/#forms");',
    );
    expect(cypressPreview).toHaveTextContent(
      'cy.get("[data-testid=\\"login-submit\\"]").click();',
    );
    expect(cypressPreview).toHaveTextContent(
      'getByLabel(new RegExp("^Email$")).clear().type("tester@example.com", { parseSpecialCharSequences: false });',
    );
    expect(cypressPreview).toHaveTextContent(
      'getByLabel(new RegExp("^Remember me$")).check();',
    );
    expect(cypressPreview).toHaveTextContent(
      'cy.press(Cypress.Keyboard.Keys.TAB);',
    );
    expect(cypressPreview).toHaveTextContent(
      'getByLabel(new RegExp("^Password$")).should("have.focus");',
    );
    expect(cypressPreview).toHaveTextContent(
      'cy.url().should("eq", "https://qapracticehub.com/#buttons");',
    );
    expect(cypressPreview).toHaveTextContent('cy.reload();');
    expect(cypressPreview).toHaveTextContent(
      'cy.press(Cypress.Keyboard.Keys.ENTER);',
    );
    expect(cypressPreview).toHaveTextContent(
      'setNativeInputValue(getByLabel(new RegExp("^Color Picker$")), "#663399", "color");',
    );
    expect(cypressPreview).toHaveTextContent(
      'setNativeInputValue(getByLabel(new RegExp("^Experience \\\\(Range Slider\\\\)$")), "7", "range");',
    );
    expect(cypressPreview).toHaveTextContent('.trigger("input")');
    expect(cypressPreview).toHaveTextContent('.trigger("change");');
    expect(cypressPreview).not.toHaveTextContent('Release 1B');
    expect(cypressPreview).not.toHaveTextContent('Release 1C');
    expect(
      screen.getByRole('button', { name: 'Baixar arquivo' }),
    ).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Copiar código' }));
    expect(harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining('describe("fluxo gravado pelo FlowSnap"'),
    );
    expect(
      await screen.findByText('Código Cypress copiado'),
    ).toBeInTheDocument();
    expect(harness.getLocalValues()).toEqual(storageBeforeCollectiveCopy);

    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('heading', { name: 'Código Cypress' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(cypressButton).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Copiar seletor do passo 1' }));
    expect(harness.clipboardWrite).toHaveBeenLastCalledWith(
      'data-testid=login-submit',
    );

    await user.click(screen.getByRole('button', { name: 'Excluir passo 13' }));
    await user.click(
      within(
        screen.getByRole('group', { name: 'Confirmar exclusão do passo 13' }),
      ).getByRole('button', { name: 'Excluir passo' }),
    );

    await waitFor(() =>
      expect(screen.getByText('12 passos capturados')).toBeInTheDocument(),
    );
    expect(harness.getLocalValues().recordedSteps).toEqual(
      editedSteps.slice(0, 12),
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
  }, 15_000);
});
