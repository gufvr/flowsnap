import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../styles/theme';
import { InlineConfirmation } from './InlineConfirmation';

function renderConfirmation(onConfirm = vi.fn(), onCancel = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <InlineConfirmation
        label="Confirmar exclusão do passo 2"
        message="Excluir o passo 2? Esta ação não pode ser desfeita."
        confirmLabel="Excluir passo"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </ThemeProvider>,
  );

  return { onConfirm, onCancel };
}

describe('InlineConfirmation', () => {
  it('moves focus to the safe action and exposes its context', async () => {
    renderConfirmation();

    const cancel = screen.getByRole('button', { name: 'Cancelar' });
    await waitFor(() => expect(cancel).toHaveFocus());
    expect(cancel).toHaveAccessibleDescription(
      'Excluir o passo 2? Esta ação não pode ser desfeita.',
    );
    expect(
      screen.getByRole('group', {
        name: 'Confirmar exclusão do passo 2',
      }),
    ).toBeInTheDocument();
  });

  it('confirms from the keyboard', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderConfirmation();

    await user.click(screen.getByRole('button', { name: 'Excluir passo' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('cancels with Escape', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderConfirmation();

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
