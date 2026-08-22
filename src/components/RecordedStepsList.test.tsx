import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it } from 'vitest';
import { theme } from '../styles/theme';
import { RecordedStepsList } from './RecordedStepsList';

function renderList(steps: readonly unknown[], isLoading = false) {
  return render(
    <ThemeProvider theme={theme}>
      <RecordedStepsList steps={steps} isLoading={isLoading} />
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

    expect(screen.getByLabelText('4 passos')).toBeInTheDocument();
    const descriptions = screen
      .getAllByRole('listitem')
      .map((item) => item.querySelector('p')?.textContent);

    expect(descriptions).toEqual([
      'Clicou no botão "Entrar"',
      'Clicou no link "Minha conta"',
      'Clicou em uma caixa de seleção',
      'Clicou em um elemento',
    ]);
    expect(screen.getByText('role=button;name=Entrar')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Copiar seletor do passo 1' }),
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
});
