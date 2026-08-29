import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../styles/theme';
import { CypressCodePanel } from './CypressCodePanel';

const clickStep = {
  schemaVersion: 4,
  type: 'click',
  url: 'https://example.com',
  selectors: {
    recommended: {
      strategy: 'testId',
      value: 'login',
      attribute: 'data-testid',
    },
    alternatives: [],
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
    onDownload?: (download: { content: string; fileName: string }) => void;
  } = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <CypressCodePanel
        steps={steps}
        onClose={options.onClose ?? vi.fn()}
        onCopy={options.onCopy ?? vi.fn().mockResolvedValue(undefined)}
        onDownload={options.onDownload ?? vi.fn()}
      />
    </ThemeProvider>,
  );
}

describe('CypressCodePanel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a focused preview and updates it with the current steps', () => {
    const { rerender } = renderPanel([clickStep]);

    expect(screen.getByRole('heading', { name: 'Código Cypress' })).toHaveFocus();
    expect(screen.getByText('1 de 1 passo exportado; 0 marcados como TODO.'))
      .toBeInTheDocument();
    expect(screen.getByLabelText('Prévia do código Cypress')).toHaveTextContent(
      'cy.get("[data-testid=\\"login\\"]").click();',
    );

    rerender(
      <ThemeProvider theme={theme}>
        <CypressCodePanel
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
    expect(screen.getByLabelText('Prévia do código Cypress')).toHaveTextContent(
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
      expect.stringContaining('describe("fluxo gravado pelo FlowSnap"'),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Código Cypress copiado',
    );

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText('Código Cypress copiado')).not.toBeInTheDocument();
  });

  it('downloads the exact preview with the Cypress file name', () => {
    vi.useFakeTimers();
    const onDownload = vi.fn();
    renderPanel([clickStep], { onDownload });
    const preview = screen.getByLabelText('Prévia do código Cypress');

    fireEvent.click(screen.getByRole('button', { name: 'Baixar arquivo' }));

    expect(onDownload).toHaveBeenCalledWith({
      content: preview.textContent,
      fileName: 'flowsnap-cypress.cy.ts',
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Arquivo Cypress baixado',
    );

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText('Arquivo Cypress baixado'))
      .not.toBeInTheDocument();
  });

  it('reports action errors and closes with the button or Escape', async () => {
    const onCopy = vi.fn().mockRejectedValue(new Error('Clipboard blocked'));
    const onDownload = vi.fn(() => {
      throw new Error('Download blocked');
    });
    const onClose = vi.fn();
    renderPanel([clickStep], { onClose, onCopy, onDownload });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível copiar o código',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Baixar arquivo' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível baixar o arquivo',
    );

    fireEvent.keyDown(screen.getByLabelText('Prévia do código Cypress'), {
      key: 'Escape',
    });
    expect(onClose).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
