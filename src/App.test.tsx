import { ThemeProvider } from 'styled-components';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { theme } from './styles/theme';

const storageGet = vi.fn();
const storageSet = vi.fn();

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

    vi.stubGlobal('chrome', {
      storage: { local: { get: storageGet, set: storageSet } },
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

  it('toggles and persists the recording state', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Iniciar Gravação' }));

    expect(screen.getByText('Status: Gravando')).toBeInTheDocument();
    await waitFor(() => {
      expect(storageSet).toHaveBeenCalledWith({
        recordingState: { isRecording: true },
      });
    });
  });
});
