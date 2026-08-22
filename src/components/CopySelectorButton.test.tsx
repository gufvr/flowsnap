import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { ThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../styles/theme';
import { CopySelectorButton } from './CopySelectorButton';

function renderButton(
  selector: string | undefined,
  onCopy: (text: string) => Promise<void>,
) {
  return render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CopySelectorButton
          selector={selector}
          stepNumber={2}
          onCopy={onCopy}
        />
      </ThemeProvider>
    </StrictMode>,
  );
}

describe('CopySelectorButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the selector and clears its accessible feedback', async () => {
    vi.useFakeTimers();
    const onCopy = vi.fn().mockResolvedValue(undefined);
    renderButton('role=button;name=Entrar', onCopy);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Copiar seletor do passo 2' }),
      );
    });

    expect(onCopy).toHaveBeenCalledWith('role=button;name=Entrar');
    expect(screen.getByRole('status')).toHaveTextContent('Seletor copiado');

    act(() => vi.advanceTimersByTime(2000));

    expect(screen.queryByText('Seletor copiado')).not.toBeInTheDocument();
  });

  it('shows a clear error when copying fails', async () => {
    const onCopy = vi.fn().mockRejectedValue(new Error('Clipboard blocked'));
    renderButton('css=button', onCopy);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Copiar seletor do passo 2' }),
      );
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível copiar',
    );
  });

  it('can be activated from the keyboard', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn().mockResolvedValue(undefined);
    renderButton('label=Username', onCopy);
    const button = screen.getByRole('button', {
      name: 'Copiar seletor do passo 2',
    });

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onCopy).toHaveBeenCalledWith('label=Username');
  });

  it('ignores repeated clicks while a copy is pending', () => {
    const onCopy = vi.fn().mockReturnValue(new Promise(() => undefined));
    renderButton('css=button', onCopy);
    const button = screen.getByRole('button', {
      name: 'Copiar seletor do passo 2',
    });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onCopy).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
  });

  it('is disabled when the step has no copyable selector', () => {
    renderButton(undefined, vi.fn());

    expect(
      screen.getByRole('button', { name: 'Copiar seletor do passo 2' }),
    ).toBeDisabled();
  });
});
