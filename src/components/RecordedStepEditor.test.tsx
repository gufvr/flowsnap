import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '../styles/theme';
import { RecordedStepEditor } from './RecordedStepEditor';

function renderEditor(
  onSave = vi.fn().mockResolvedValue(true),
  onCancel = vi.fn(),
) {
  render(
    <ThemeProvider theme={theme}>
      <RecordedStepEditor
        stepNumber={2}
        initialValue="Clicou no botão Login"
        onSave={onSave}
        onCancel={onCancel}
      />
    </ThemeProvider>,
  );

  return { onSave, onCancel };
}

describe('RecordedStepEditor', () => {
  it('focuses the description and confirms a normalized change', async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor();
    const field = screen.getByRole('textbox', {
      name: 'Descrição do passo 2',
    });

    expect(field).toHaveFocus();
    await user.clear(field);
    await user.type(field, '  Efetuou   o login  ');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSave).toHaveBeenCalledWith('Efetuou o login');
  });

  it('rejects empty and oversized descriptions', async () => {
    renderEditor();
    const field = screen.getByRole('textbox', {
      name: 'Descrição do passo 2',
    });

    fireEvent.change(field, { target: { value: '' } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A descrição não pode ficar vazia.',
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    fireEvent.change(field, { target: { value: 'a'.repeat(201) } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A descrição deve ter no máximo 200 caracteres.',
    );
    expect(screen.getByText('201/200')).toBeInTheDocument();
  });

  it('cancels with its button or Escape', async () => {
    const user = userEvent.setup();
    const first = renderEditor();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(first.onCancel).toHaveBeenCalledOnce();

    const secondCancel = vi.fn();
    renderEditor(vi.fn().mockResolvedValue(true), secondCancel);
    await user.keyboard('{Escape}');
    expect(secondCancel).toHaveBeenCalledOnce();
  });
});
