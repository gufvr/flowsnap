import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createRecorderController } from '../../content/recorder';
import { createChromeExtensionHarness } from '../../test/chromeExtensionHarness';
import { createPracticePage } from '../support/practicePage';
import { renderSidePanel } from '../support/renderSidePanel';
import { useRecordingFlowTestContext } from '../support/recordingFlowTestContext';

describe('integrated recording flow', () => {
  const context = useRecordingFlowTestContext();

  it('adds the background URL as an editable schema 11 verification', async () => {
    const user = userEvent.setup();
    context.harness = createChromeExtensionHarness();
    context.harness.install();
    await import('../../background');
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
    expect(context.harness.getLocalValues().recordedSteps).toEqual([
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
    fireEvent.change(field, {
      target: { value: 'Validou a página de formulários' },
    });
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('Validou a página de formulários'),
    ).toBeInTheDocument();
    expect(
      (
        context.harness.getLocalValues().recordedSteps as Array<{
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

    await user.click(screen.getByRole('button', { name: 'Gerar Cypress' }));
    const cypressPreview = screen.getByLabelText('Prévia do código Cypress');
    expect(cypressPreview).toHaveTextContent(
      '// Passo 1: Validou a página de formulários',
    );
    expect(cypressPreview).toHaveTextContent(
      'cy.url().should("eq", "https://qapracticehub.com/#forms");',
    );
    expect(cypressPreview).not.toHaveTextContent('TODO FlowSnap');
    expect(
      screen.getByText('1 de 1 passo exportado; 0 marcados como TODO.'),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Parar Gravação' }));
    expect(assertionButton).toBeDisabled();
  });

  it('selects a visible element through the coordinated schema 12 picker', async () => {
    const user = userEvent.setup();
    context.harness = createChromeExtensionHarness();
    context.harness.install();
    await import('../../background');
    const controller = createRecorderController((message) =>
      context.harness?.sendFromTab(message),
    );
    context.harness.connectRecorder(controller);
    context.practicePage = createPracticePage(controller);
    Object.defineProperty(context.practicePage.login, 'getBoundingClientRect', {
      value: () => ({
        top: 20,
        left: 20,
        width: 100,
        height: 40,
        right: 120,
        bottom: 60,
      }),
    });
    const originalAction = vi.fn();
    context.practicePage.login.addEventListener('click', originalAction);
    renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Verificar elemento visível' }),
    );
    expect(
      await screen.findByText(
        'Selecione um elemento na página. Pressione Esc para cancelar.',
      ),
    ).toBeInTheDocument();

    await user.click(context.practicePage.login);

    expect(originalAction).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Verificou que o botão "Login" está visível'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 passo capturado')).toBeInTheDocument();
    expect(context.harness.getLocalValues().recordedSteps).toEqual([
      expect.objectContaining({
        schemaVersion: 12,
        type: 'assertion',
        assertion: { kind: 'element', operator: 'visible' },
        selectors: expect.objectContaining({
          recommended: expect.objectContaining({
            isUnique: true,
            validation: {
              status: 'valid',
              matchCount: 1,
              matchesTarget: true,
            },
          }),
        }),
      }),
    ]);
    expect(
      screen.getByRole('button', { name: 'Copiar seletor do passo 1' }),
    ).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Gerar Playwright' }));
    expect(screen.getByLabelText('Prévia do código Playwright')).toHaveTextContent(
      'await expect(page.getByRole("button", { name: "Login", exact: true })).toBeVisible();',
    );
    expect(
      screen.getByText('1 de 1 passo exportado; 0 marcados como TODO.'),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Gerar Cypress' }));
    const cypressPreview = screen.getByLabelText('Prévia do código Cypress');
    expect(cypressPreview).toHaveTextContent(
      'new RegExp("^Login$")).should("be.visible");',
    );
    expect(cypressPreview).not.toHaveTextContent('TODO FlowSnap');
    expect(
      screen.getByText('1 de 1 passo exportado; 0 marcados como TODO.'),
    ).toBeInTheDocument();
  });

  it('selects normalized exact text through the coordinated schema 13 picker', async () => {
    const user = userEvent.setup();
    context.harness = createChromeExtensionHarness();
    context.harness.install();
    await import('../../background');
    const controller = createRecorderController((message) =>
      context.harness?.sendFromTab(message),
    );
    context.harness.connectRecorder(controller);
    context.practicePage = createPracticePage(controller);
    Object.defineProperty(context.practicePage.login, 'getBoundingClientRect', {
      value: () => ({
        top: 20,
        left: 20,
        width: 100,
        height: 40,
        right: 120,
        bottom: 60,
      }),
    });
    const originalAction = vi.fn();
    context.practicePage.login.addEventListener('click', originalAction);
    renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Verificar texto do elemento' }),
    );
    expect(
      await screen.findByText(
        'Selecione um elemento com texto na página. Pressione Esc para cancelar.',
      ),
    ).toBeInTheDocument();

    await user.click(context.practicePage.login);

    expect(originalAction).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        'Verificou que o botão "Login" tem o texto exato "Login"',
      ),
    ).toBeInTheDocument();
    expect(context.harness.getLocalValues().recordedSteps).toEqual([
      expect.objectContaining({
        schemaVersion: 13,
        type: 'assertion',
        assertion: {
          kind: 'element',
          operator: 'text-equals',
          expected: 'Login',
        },
        selectors: expect.objectContaining({
          recommended: expect.objectContaining({
            isUnique: true,
            validation: {
              status: 'valid',
              matchCount: 1,
              matchesTarget: true,
            },
          }),
        }),
      }),
    ]);
    expect(
      screen.getByRole('button', { name: 'Copiar seletor do passo 1' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Editar descrição do passo 1' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Limpar tudo' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Gerar Playwright' }));
    const playwrightPreview = screen.getByLabelText(
      'Prévia do código Playwright',
    );
    expect(playwrightPreview).toHaveTextContent(
      'TODO FlowSnap: a exportação de verificações de texto exato ainda não é suportada.',
    );
    expect(playwrightPreview).not.toHaveTextContent('"Login"');
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Gerar Cypress' }));
    const cypressPreview = screen.getByLabelText('Prévia do código Cypress');
    expect(cypressPreview).toHaveTextContent(
      'TODO FlowSnap: a exportação de verificações de texto exato ainda não é suportada.',
    );
    expect(cypressPreview).not.toHaveTextContent('"Login"');
    expect(
      screen.getByText('0 de 1 passo exportado; 1 marcado como TODO.'),
    ).toBeInTheDocument();
  });
});
