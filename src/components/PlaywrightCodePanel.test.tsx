import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../styles/theme';
import { PlaywrightCodePanel } from './PlaywrightCodePanel';

const clickStep = {
  schemaVersion: 4,
  type: 'click',
  url: 'https://example.com',
  selectors: {
    recommended: {
      strategy: 'role',
      value: 'button:Entrar',
      role: 'button',
      name: 'Entrar',
    },
  },
  description: {
    action: 'click',
    target: { type: 'button', name: 'Entrar' },
    source: 'accessibleName',
    text: 'Clicou no botão "Entrar"',
    locale: 'pt-BR',
  },
};

function renderPanel(
  steps: readonly unknown[],
  options: {
    onClose?: () => void;
    onCopy?: (text: string) => Promise<void>;
  } = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <PlaywrightCodePanel
        steps={steps}
        onClose={options.onClose ?? vi.fn()}
        onCopy={options.onCopy ?? vi.fn().mockResolvedValue(undefined)}
      />
    </ThemeProvider>,
  );
}

describe('PlaywrightCodePanel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a focused preview and updates it with the current steps', () => {
    const { rerender } = renderPanel([clickStep]);

    expect(
      screen.getByRole('heading', { name: 'Código Playwright' }),
    ).toHaveFocus();
    expect(screen.getByText('1 de 1 passo exportado; 0 marcados como TODO.'))
      .toBeInTheDocument();
    expect(screen.getByLabelText('Prévia do código Playwright')).toHaveTextContent(
      'Passo 1: Clicou no botão "Entrar"',
    );

    rerender(
      <ThemeProvider theme={theme}>
        <PlaywrightCodePanel
          steps={[
            {
              ...clickStep,
              descriptionOverride: {
                text: 'Entrou na conta',
                locale: 'pt-BR',
              },
            },
            { type: 'range-change', url: 'https://example.com' },
          ]}
          onClose={vi.fn()}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('1 de 2 passos exportados; 1 marcado como TODO.'))
      .toBeInTheDocument();
    expect(screen.getByLabelText('Prévia do código Playwright')).toHaveTextContent(
      'Passo 1: Entrou na conta',
    );
  });

  it('copies the generated code and clears its accessible feedback', async () => {
    vi.useFakeTimers();
    const onCopy = vi.fn().mockResolvedValue(undefined);
    renderPanel([clickStep], { onCopy });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));
    });

    expect(onCopy).toHaveBeenCalledWith(
      expect.stringContaining('import { test } from "@playwright/test";'),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Código Playwright copiado',
    );

    act(() => vi.advanceTimersByTime(2000));
    expect(
      screen.queryByText('Código Playwright copiado'),
    ).not.toBeInTheDocument();
  });

  it('reports copy errors and closes with the button or Escape', async () => {
    const onCopy = vi.fn().mockRejectedValue(new Error('Clipboard blocked'));
    const onClose = vi.fn();
    renderPanel([clickStep], { onClose, onCopy });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível copiar o código',
    );

    fireEvent.keyDown(screen.getByLabelText('Prévia do código Playwright'), {
      key: 'Escape',
    });
    expect(onClose).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
