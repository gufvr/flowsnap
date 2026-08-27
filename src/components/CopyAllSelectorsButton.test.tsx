import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { ThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../styles/theme';
import { CopyAllSelectorsButton } from './CopyAllSelectorsButton';

const copyableStep = {
  schemaVersion: 4,
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
  },
};

function renderButton(
  steps: readonly unknown[],
  onCopy: (text: string) => Promise<void>,
) {
  return render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CopyAllSelectorsButton steps={steps} onCopy={onCopy} />
      </ThemeProvider>
    </StrictMode>,
  );
}

describe('CopyAllSelectorsButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies every formatted entry and clears its accessible feedback', async () => {
    vi.useFakeTimers();
    const onCopy = vi.fn().mockResolvedValue(undefined);
    renderButton([copyableStep, copyableStep], onCopy);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar seletores' }));
    });

    expect(onCopy).toHaveBeenCalledWith(
      [
        'FlowSnap — seletores gravados',
        '',
        '1. Clicou no botão "Entrar"',
        '   Seletor: role=button;name=Entrar',
        '',
        '2. Clicou no botão "Entrar"',
        '   Seletor: role=button;name=Entrar',
      ].join('\n'),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 seletores copiados',
    );

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText('2 seletores copiados')).not.toBeInTheDocument();
  });

  it('uses singular feedback for one selector', async () => {
    renderButton([copyableStep], vi.fn().mockResolvedValue(undefined));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar seletores' }));
    });

    expect(screen.getByRole('status')).toHaveTextContent('1 seletor copiado');
  });

  it('shows an accessible error and ignores repeated pending clicks', async () => {
    const onCopy = vi
      .fn()
      .mockRejectedValueOnce(new Error('Clipboard blocked'))
      .mockReturnValue(new Promise(() => undefined));
    renderButton([copyableStep], onCopy);
    const button = screen.getByRole('button', { name: 'Copiar seletores' });

    await act(async () => fireEvent.click(button));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível copiar os seletores',
    );

    fireEvent.click(button);
    fireEvent.click(button);
    expect(onCopy).toHaveBeenCalledTimes(2);
    expect(button).toBeDisabled();
  });

  it('is disabled when no recorded step has a selector', () => {
    renderButton(
      [{ schemaVersion: 10, type: 'navigation' }],
      vi.fn().mockResolvedValue(undefined),
    );

    expect(
      screen.getByRole('button', { name: 'Copiar seletores' }),
    ).toBeDisabled();
  });
});
