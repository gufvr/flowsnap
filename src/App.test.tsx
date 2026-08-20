import { ThemeProvider } from 'styled-components';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { theme } from './styles/theme';

const { startRecordingSession, stopRecordingSession } = vi.hoisted(() => ({
  startRecordingSession: vi.fn(),
  stopRecordingSession: vi.fn(),
}));

vi.mock('./services/recordingSession', () => ({
  startRecordingSession,
  stopRecordingSession,
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
    storageGet.mockResolvedValue({});
    storageSet.mockResolvedValue(undefined);
    startRecordingSession.mockReset();
    stopRecordingSession.mockReset();
    startRecordingSession.mockResolvedValue({ isRecording: true, tabId: 7 });
    stopRecordingSession.mockResolvedValue({ isRecording: false });

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
});
