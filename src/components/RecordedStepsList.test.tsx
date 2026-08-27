import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../styles/theme';
import { RecordedStepsList } from './RecordedStepsList';

function renderList(
  steps: readonly unknown[],
  isLoading = false,
  props: Partial<ComponentProps<typeof RecordedStepsList>> = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <RecordedStepsList steps={steps} isLoading={isLoading} {...props} />
    </ThemeProvider>,
  );
}

const schema4Step = {
  schemaVersion: 4,
  id: 'schema-4',
  description: {
    action: 'click',
    target: { type: 'button', name: 'Entrar' },
    source: 'accessibleName',
    text: 'Clicou no botão "Entrar"',
    locale: 'pt-BR',
  },
  selectors: {
    recommended: {
      strategy: 'role',
      value: 'button:Entrar',
      role: 'button',
      name: 'Entrar',
    },
    alternatives: [],
  },
};

describe('RecordedStepsList', () => {
  it('shows its loading and empty states', () => {
    const { rerender } = renderList([], true);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando passos');

    rerender(
      <ThemeProvider theme={theme}>
        <RecordedStepsList steps={[]} isLoading={false} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Nenhum passo gravado ainda.')).toBeInTheDocument();
  });

  it('shows mixed schemas in their persisted capture order', () => {
    const steps = [
      schema4Step,
      {
        schemaVersion: 4,
        id: 'focus-navigation',
        type: 'focus-navigation',
        description: {
          action: 'focusNavigation',
          target: { type: 'field', name: 'Password' },
          source: 'label',
          text: 'Navegou para o campo "Password"',
          locale: 'pt-BR',
        },
        selectors: {
          recommended: {
            strategy: 'label',
            value: 'Password',
          },
          alternatives: [],
        },
      },
      {
        schemaVersion: 3,
        id: 'schema-3',
        element: { tagName: 'a', text: 'Minha conta' },
      },
      {
        schemaVersion: 2,
        id: 'schema-2',
        element: { tagName: 'input', inputType: 'checkbox' },
      },
      {
        id: 'legacy',
        type: 'click',
        selector: { css: 'button' },
        element: { tagName: 'button', text: 'Legado' },
      },
    ];

    renderList(steps);

    expect(screen.getByLabelText('5 passos')).toBeInTheDocument();
    const descriptions = screen
      .getAllByRole('listitem')
      .map((item) => item.querySelector('p')?.textContent);

    expect(descriptions).toEqual([
      'Clicou no botão "Entrar"',
      'Navegou para o campo "Password"',
      'Clicou no link "Minha conta"',
      'Clicou em uma caixa de seleção',
      'Clicou em um elemento',
    ]);
    expect(screen.getByText('role=button;name=Entrar')).toBeInTheDocument();
    expect(screen.getByText('label=Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Copiar seletor do passo 1' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Copiar seletor do passo 2' }),
    ).toBeEnabled();
  });

  it('uses a scrollable viewport for long flows', () => {
    renderList(Array.from({ length: 20 }, (_, index) => ({
      ...schema4Step,
      id: `step-${index}`,
    })));

    expect(screen.getByLabelText('Lista de passos gravados')).toHaveStyle({
      overflowY: 'auto',
    });
  });

  it('edits one description inline and restores focus after saving', async () => {
    const user = userEvent.setup();
    const onEditStep = vi.fn().mockResolvedValue(true);
    renderList([schema4Step], false, {
      onEditStep,
      onDeleteStep: vi.fn().mockResolvedValue(true),
      onClearSteps: vi.fn().mockResolvedValue(true),
    });
    const editButton = screen.getByRole('button', {
      name: 'Editar descrição do passo 1',
    });

    await user.click(editButton);
    const field = screen.getByRole('textbox', {
      name: 'Descrição do passo 1',
    });
    expect(field).toHaveFocus();
    expect(field).toHaveValue('Clicou no botão "Entrar"');
    expect(screen.getByRole('button', { name: 'Excluir passo 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Limpar tudo' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Copiar seletor do passo 1' }),
    ).toBeEnabled();

    await user.clear(field);
    await user.type(field, 'Efetuou o login');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onEditStep).toHaveBeenCalledWith(
      0,
      'Efetuou o login',
      JSON.stringify(schema4Step),
      'schema-4',
    );
    await waitFor(() => expect(editButton).toHaveFocus());
    expect(
      screen.queryByRole('textbox', { name: 'Descrição do passo 1' }),
    ).not.toBeInTheDocument();
  });

  it('cancels editing with Escape and restores the trigger focus', async () => {
    const user = userEvent.setup();
    const onEditStep = vi.fn().mockResolvedValue(true);
    renderList([schema4Step], false, { onEditStep });
    const editButton = screen.getByRole('button', {
      name: 'Editar descrição do passo 1',
    });

    await user.click(editButton);
    await user.keyboard('{Escape}');

    expect(onEditStep).not.toHaveBeenCalled();
    await waitFor(() => expect(editButton).toHaveFocus());
  });

  it('requires confirmation before deleting and restores focus on cancel', async () => {
    const user = userEvent.setup();
    const onDeleteStep = vi.fn().mockResolvedValue(true);
    renderList([schema4Step], false, {
      onDeleteStep,
      onClearSteps: vi.fn().mockResolvedValue(true),
    });
    const deleteButton = screen.getByRole('button', {
      name: 'Excluir passo 1',
    });

    await user.click(deleteButton);

    expect(onDeleteStep).not.toHaveBeenCalled();
    expect(
      screen.getByText('Excluir o passo 1? Esta ação não pode ser desfeita.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByText(/Excluir o passo 1\?/)).not.toBeInTheDocument();
    await waitFor(() => expect(deleteButton).toHaveFocus());
  });

  it('confirms individual deletion and moves focus to the list title', async () => {
    const user = userEvent.setup();
    const onDeleteStep = vi.fn().mockResolvedValue(true);
    renderList([schema4Step], false, { onDeleteStep });

    await user.click(
      screen.getByRole('button', { name: 'Excluir passo 1' }),
    );
    await user.click(screen.getByRole('button', { name: 'Excluir passo' }));

    expect(onDeleteStep).toHaveBeenCalledWith(0);
    expect(screen.getByRole('heading', { name: 'Passos gravados' })).toHaveFocus();
  });

  it('requires confirmation before clearing every step', async () => {
    const user = userEvent.setup();
    const onClearSteps = vi.fn().mockResolvedValue(true);
    renderList([schema4Step, { ...schema4Step, id: 'second' }], false, {
      onClearSteps,
    });

    await user.click(screen.getByRole('button', { name: 'Limpar tudo' }));

    expect(onClearSteps).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('group', {
      name: 'Confirmar limpeza dos passos',
    });
    expect(confirmation).toHaveTextContent(
      'Limpar todos os 2 passos? Esta ação não pode ser desfeita.',
    );

    await user.click(
      within(confirmation).getByRole('button', { name: 'Limpar tudo' }),
    );

    expect(onClearSteps).toHaveBeenCalledOnce();
  });

  it('announces pending, success and error states accessibly', () => {
    const { rerender } = renderList([schema4Step], false, {
      pendingMutation: { type: 'delete', stepIndex: 0 },
      onDeleteStep: vi.fn().mockResolvedValue(true),
      onClearSteps: vi.fn().mockResolvedValue(true),
    });

    expect(screen.getByRole('status')).toHaveTextContent('Excluindo passo 1');
    expect(
      screen.getByRole('button', { name: 'Excluir passo 1' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Limpar tudo' })).toBeDisabled();

    rerender(
      <ThemeProvider theme={theme}>
        <RecordedStepsList
          steps={[schema4Step]}
          isLoading={false}
          feedback={{ type: 'error', message: 'Falha ao excluir.' }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao excluir.');
  });

  it('does not offer clearing when the list is empty', () => {
    renderList([], false, {
      onClearSteps: vi.fn().mockResolvedValue(true),
    });

    expect(
      screen.queryByRole('button', { name: 'Limpar tudo' }),
    ).not.toBeInTheDocument();
  });

  it('cancels a stale confirmation after a reactive storage update', async () => {
    const user = userEvent.setup();
    const onDeleteStep = vi.fn().mockResolvedValue(true);
    const { rerender } = renderList(
      [schema4Step, { ...schema4Step, id: 'second' }],
      false,
      { onDeleteStep },
    );

    await user.click(
      screen.getByRole('button', { name: 'Excluir passo 1' }),
    );

    rerender(
      <ThemeProvider theme={theme}>
        <RecordedStepsList
          steps={[{ ...schema4Step, id: 'second' }]}
          isLoading={false}
          onDeleteStep={onDeleteStep}
        />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(screen.queryByText(/Excluir o passo 1\?/)).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: 'Passos gravados' })).toHaveFocus();
    expect(onDeleteStep).not.toHaveBeenCalled();
  });

  it('cancels a stale edit after a reactive storage update', async () => {
    const user = userEvent.setup();
    const onEditStep = vi.fn().mockResolvedValue(true);
    const { rerender } = renderList([schema4Step], false, { onEditStep });

    await user.click(
      screen.getByRole('button', { name: 'Editar descrição do passo 1' }),
    );
    rerender(
      <ThemeProvider theme={theme}>
        <RecordedStepsList
          steps={[{ ...schema4Step, descriptionOverride: {
            text: 'Alteração externa',
            locale: 'pt-BR',
          } }]}
          isLoading={false}
          onEditStep={onEditStep}
        />
      </ThemeProvider>,
    );

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(
      'A lista de passos foi atualizada. Abra a edição novamente.',
    );
    expect(
      screen.queryByRole('textbox', { name: 'Descrição do passo 1' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Passos gravados' })).toHaveFocus();
  });
});
