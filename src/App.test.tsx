import { ThemeProvider } from 'styled-components';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { theme } from './styles/theme';

const {
  startRecordingSession,
  stopRecordingSession,
  deleteRecordedStep,
  clearRecordedSteps,
  moveRecordedStep,
  updateRecordedStepDescription,
} = vi.hoisted(() => ({
  startRecordingSession: vi.fn(),
  stopRecordingSession: vi.fn(),
  deleteRecordedStep: vi.fn(),
  clearRecordedSteps: vi.fn(),
  moveRecordedStep: vi.fn(),
  updateRecordedStepDescription: vi.fn(),
}));

vi.mock('./services/recordingSession', () => ({
  startRecordingSession,
  stopRecordingSession,
}));

vi.mock('./services/recordedStepActions', () => ({
  deleteRecordedStep,
  clearRecordedSteps,
  moveRecordedStep,
  updateRecordedStepDescription,
}));

const storageGet = vi.fn();
const storageSet = vi.fn();
const storageChangeAddListener = vi.fn();
const storageChangeRemoveListener = vi.fn();

function renderApp() {
  return render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    storageGet.mockReset();
    storageSet.mockReset();
    storageChangeAddListener.mockReset();
    storageChangeRemoveListener.mockReset();
    storageGet.mockResolvedValue({});
    storageSet.mockResolvedValue(undefined);
    startRecordingSession.mockReset();
    stopRecordingSession.mockReset();
    deleteRecordedStep.mockReset();
    clearRecordedSteps.mockReset();
    moveRecordedStep.mockReset();
    updateRecordedStepDescription.mockReset();
    startRecordingSession.mockResolvedValue({ isRecording: true, tabId: 7 });
    stopRecordingSession.mockResolvedValue({ isRecording: false });
    deleteRecordedStep.mockResolvedValue(undefined);
    clearRecordedSteps.mockResolvedValue(undefined);
    moveRecordedStep.mockResolvedValue(undefined);
    updateRecordedStepDescription.mockResolvedValue(undefined);

    vi.stubGlobal('chrome', {
      storage: {
        local: { get: storageGet, set: storageSet },
        onChanged: {
          addListener: storageChangeAddListener,
          removeListener: storageChangeRemoveListener,
        },
      },
    });
  });

  it('starts stopped when there is no saved state', async () => {
    renderApp();

    expect(await screen.findByText('Status: Parado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Gravação' })).toBeEnabled();
  });

  it('shows the accessible authorship footer with a safe external link', async () => {
    renderApp();

    await screen.findByText('Status: Parado');
    expect(screen.getByRole('main')).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(
      '© 2026 FlowSnap. Todos os direitos reservados.',
    );
    expect(footer).toHaveTextContent('Desenvolvido por Gustavo Favero');

    const authorLink = within(footer).getByRole('link', {
      name: 'GitHub de Gustavo Favero (abre em uma nova aba)',
    });
    expect(authorLink).toHaveAttribute('href', 'https://github.com/gufvr');
    expect(authorLink).toHaveAttribute('target', '_blank');
    expect(authorLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(footer.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('starts recording from a persisted state', async () => {
    storageGet.mockResolvedValue({ recordingState: { isRecording: true } });
    renderApp();

    expect(await screen.findByText('Status: Gravando')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Parar Gravação' })).toBeEnabled();
  });

  it('starts a recording session from the button', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Iniciar Gravação' }));

    expect(screen.getByText('Status: Gravando')).toBeInTheDocument();
    await waitFor(() => expect(startRecordingSession).toHaveBeenCalledOnce());
  });

  it('shows a clear message when permission is denied', async () => {
    const user = userEvent.setup();
    startRecordingSession.mockRejectedValue(
      new Error('Permissão negada. Autorize o site para iniciar a gravação.'),
    );
    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Iniciar Gravação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Permissão negada');
    expect(screen.getByText('Status: Parado')).toBeInTheDocument();
  });

  it('shows persisted step descriptions and their count', async () => {
    storageGet.mockResolvedValue({
      recordingState: { isRecording: false },
      recordedSteps: [
        {
          schemaVersion: 4,
          id: 'login-click',
          description: {
            action: 'click',
            target: { type: 'button', name: 'Login' },
            source: 'accessibleName',
            text: 'Clicou no botão "Login"',
            locale: 'pt-BR',
          },
        },
      ],
    });
    renderApp();

    expect(await screen.findByText('Clicou no botão "Login"')).toBeInTheDocument();
    expect(screen.getByText('1 passo capturado')).toBeInTheDocument();
  });

  it('deletes a confirmed step and reacts to the storage update', async () => {
    const user = userEvent.setup();
    storageGet.mockResolvedValue({
      recordingState: { isRecording: false },
      recordedSteps: [
        {
          schemaVersion: 4,
          id: 'login-click',
          description: {
            action: 'click',
            target: { type: 'button', name: 'Login' },
            source: 'accessibleName',
            text: 'Clicou no botão "Login"',
            locale: 'pt-BR',
          },
        },
      ],
    });
    renderApp();

    await user.click(
      await screen.findByRole('button', { name: 'Excluir passo 1' }),
    );
    await user.click(screen.getByRole('button', { name: 'Excluir passo' }));

    await waitFor(() =>
      expect(deleteRecordedStep).toHaveBeenCalledWith(0, 'login-click'),
    );
    const handleStorageChange = storageChangeAddListener.mock.calls[0][0];
    await act(async () => {
      handleStorageChange({ recordedSteps: { newValue: [] } }, 'local');
    });

    expect(screen.getByText('Nenhum passo gravado ainda.')).toBeInTheDocument();
    expect(screen.getByText('0 passos capturados')).toBeInTheDocument();
    expect(screen.getByText('Passo 1 excluído.')).toHaveAttribute(
      'role',
      'status',
    );
  });
});
