import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createRecorderController } from '../../content/recorder';
import { createChromeExtensionHarness } from '../../test/chromeExtensionHarness';
import { createPracticePage } from '../support/practicePage';
import { renderSidePanel } from '../support/renderSidePanel';
import { useRecordingFlowTestContext } from '../support/recordingFlowTestContext';

describe('integrated recording flow', () => {
  const context = useRecordingFlowTestContext();

  it('records, persists, displays and manages a complete click and Tab flow', async () => {
    const user = userEvent.setup();
    context.harness = createChromeExtensionHarness();
    context.harness.install();
    await import('../../background');

    const controller = createRecorderController((message) =>
      context.harness?.sendFromTab(message),
    );
    context.harness.connectRecorder(controller);
    context.practicePage = createPracticePage(controller);
    const firstRender = renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );

    expect(await screen.findByText('Status: Gravando')).toBeInTheDocument();
    expect(controller.isActive).toBe(true);
    expect(context.harness.permissionRequest).toHaveBeenCalledWith({
      origins: ['https://qapracticehub.com/*'],
    });
    expect(context.harness.executeScript).toHaveBeenCalledWith({
      target: { tabId: 21 },
      files: ['assets/recorder.js'],
    });

    await user.click(context.practicePage.username);
    await user.keyboard('tester');
    await user.tab();
    await user.keyboard('SuperSecret!');
    await user.click(context.practicePage.login);

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

    const storedAfterCapture = context.harness.getLocalValues();
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
    expect(context.harness.clipboardWrite).toHaveBeenLastCalledWith(
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

    await user.click(context.practicePage.username);
    expect(await screen.findByText('1 passo capturado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Parar Gravação' }));
    expect(await screen.findByText('Status: Parado')).toBeInTheDocument();
    expect(controller.isActive).toBe(false);
  }, 10_000);

  it('records one semantic outcome for selection controls and keyboard activation', async () => {
    const user = userEvent.setup();
    context.harness = createChromeExtensionHarness();
    context.harness.install();
    await import('../../background');

    const controller = createRecorderController((message) =>
      context.harness?.sendFromTab(message),
    );
    context.harness.connectRecorder(controller);
    context.practicePage = createPracticePage(controller);
    renderSidePanel();

    await user.click(
      await screen.findByRole('button', { name: 'Iniciar Gravação' }),
    );
    context.practicePage.noisyContainer.click();
    context.practicePage.experience.value = '6';
    context.practicePage.experience.dispatchEvent(
      new InputEvent('input', { bubbles: true }),
    );
    context.practicePage.experience.value = '7';
    context.practicePage.experience.dispatchEvent(
      new InputEvent('input', { bubbles: true }),
    );
    context.practicePage.experience.dispatchEvent(
      new Event('change', { bubbles: true }),
    );
    context.practicePage.experience.click();
    context.practicePage.color.click();
    context.practicePage.color.value = '#ff0000';
    context.practicePage.color.dispatchEvent(
      new InputEvent('input', { bubbles: true }),
    );
    context.practicePage.color.value = '#663399';
    context.practicePage.color.dispatchEvent(
      new InputEvent('input', { bubbles: true }),
    );
    context.practicePage.color.dispatchEvent(new Event('change', { bubbles: true }));
    context.practicePage.color.click();
    await user.click(context.practicePage.rememberLabel);
    await user.click(context.practicePage.standard);
    await user.selectOptions(context.practicePage.country, 'BR');
    await user.click(context.practicePage.remember);
    context.practicePage.login.focus();
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

    const storedSteps = context.harness.getLocalValues().recordedSteps as Array<{
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
});

