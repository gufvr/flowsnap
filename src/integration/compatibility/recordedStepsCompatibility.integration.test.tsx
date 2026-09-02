import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createChromeExtensionHarness } from '../../test/chromeExtensionHarness';
import { createMixedSchemaSteps } from '../fixtures/mixedSchemaSteps';
import { renderSidePanel } from '../support/renderSidePanel';
import { useRecordingFlowTestContext } from '../support/recordingFlowTestContext';

describe('integrated recording flow', () => {
  const context = useRecordingFlowTestContext();

  it('reads mixed and incomplete schemas without migrating their storage', async () => {
    const user = userEvent.setup();
    const mixedSteps = createMixedSchemaSteps();
    const originalSteps = structuredClone(mixedSteps);
    context.harness = createChromeExtensionHarness({
      local: {
        recordingState: { isRecording: false },
        recordedSteps: mixedSteps,
      },
    });
    context.harness.install();
    await import('../../background');
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
    expect(context.harness.localSet).not.toHaveBeenCalled();
    expect(context.harness.getLocalValues().recordedSteps).toEqual(originalSteps);

    await user.click(
      screen.getByRole('button', { name: 'Mover passo 12 para cima' }),
    );
    const reorderedSteps: unknown[] = structuredClone(originalSteps);
    [reorderedSteps[10], reorderedSteps[11]] = [
      reorderedSteps[11],
      reorderedSteps[10],
    ];
    await waitFor(() =>
      expect(context.harness?.getLocalValues().recordedSteps).toEqual(reorderedSteps),
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
    expect(context.harness.getLocalValues().recordedSteps).toEqual(editedSteps);

    const storageBeforeCollectiveCopy = structuredClone(
      context.harness.getLocalValues(),
    );
    await user.click(
      screen.getByRole('button', { name: 'Copiar seletores' }),
    );
    expect(context.harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining(
        '1. Clicou no botão "Login"\n   Seletor: data-testid=login-submit',
      ),
    );
    expect(context.harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining(
        '12. Marcou a caixa de seleção "Remember me"\n   Seletor: label=Remember me',
      ),
    );
    expect(
      await screen.findByText('10 seletores copiados'),
    ).toBeInTheDocument();
    expect(context.harness.getLocalValues()).toEqual(storageBeforeCollectiveCopy);

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
    expect(context.harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'import { test, type Locator } from "@playwright/test";',
      ),
    );
    expect(context.harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining('// Passo 12: Marcou a caixa de seleção'),
    );
    expect(
      await screen.findByText('Código Playwright copiado'),
    ).toBeInTheDocument();
    expect(context.harness.getLocalValues()).toEqual(storageBeforeCollectiveCopy);

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
    expect(context.harness.clipboardWrite).toHaveBeenLastCalledWith(
      expect.stringContaining('describe("fluxo gravado pelo FlowSnap"'),
    );
    expect(
      await screen.findByText('Código Cypress copiado'),
    ).toBeInTheDocument();
    expect(context.harness.getLocalValues()).toEqual(storageBeforeCollectiveCopy);

    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('heading', { name: 'Código Cypress' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(cypressButton).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Copiar seletor do passo 1' }));
    expect(context.harness.clipboardWrite).toHaveBeenLastCalledWith(
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
    expect(context.harness.getLocalValues().recordedSteps).toEqual(
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
    expect(context.harness.getLocalValues().recordedSteps).toEqual([]);
  }, 15_000);
});

