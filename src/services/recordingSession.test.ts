import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startRecordingSession } from './recordingSession';

const getSessionStorage = vi.fn();
const requestPermission = vi.fn();
const sendMessage = vi.fn();

describe('recordingSession', () => {
  beforeEach(() => {
    getSessionStorage.mockReset();
    requestPermission.mockReset();
    sendMessage.mockReset();

    vi.stubGlobal('chrome', {
      storage: { session: { get: getSessionStorage } },
      permissions: { request: requestPermission },
      runtime: { sendMessage },
    });
  });

  it('requests only the active site and starts its tab', async () => {
    getSessionStorage.mockResolvedValue({
      activeTabContext: {
        tabId: 42,
        windowId: 2,
        url: 'https://example.com/account',
      },
    });
    requestPermission.mockResolvedValue(true);
    sendMessage.mockResolvedValue({ success: true });

    await expect(startRecordingSession()).resolves.toEqual({
      isRecording: true,
      tabId: 42,
      origin: 'https://example.com',
    });
    expect(requestPermission).toHaveBeenCalledWith({
      origins: ['https://example.com/*'],
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'START_RECORDING',
      payload: { tabId: 42, origin: 'https://example.com' },
    });
  });

  it('does not start when the permission is denied', async () => {
    getSessionStorage.mockResolvedValue({
      activeTabContext: {
        tabId: 42,
        windowId: 2,
        url: 'https://example.com',
      },
    });
    requestPermission.mockResolvedValue(false);

    await expect(startRecordingSession()).rejects.toThrow('Permissão negada');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('requests localhost access without coupling it to a development port', async () => {
    getSessionStorage.mockResolvedValue({
      activeTabContext: {
        tabId: 8,
        windowId: 2,
        url: 'http://localhost:5173/form',
      },
    });
    requestPermission.mockResolvedValue(true);
    sendMessage.mockResolvedValue({ success: true });

    await expect(startRecordingSession()).resolves.toMatchObject({
      tabId: 8,
      origin: 'http://localhost:5173',
    });
    expect(requestPermission).toHaveBeenCalledWith({
      origins: ['http://localhost/*'],
    });
  });

  it('rejects browser internal pages before requesting permission', async () => {
    getSessionStorage.mockResolvedValue({
      activeTabContext: {
        tabId: 42,
        windowId: 2,
        url: 'brave://extensions',
      },
    });

    await expect(startRecordingSession()).rejects.toThrow('HTTP ou HTTPS');
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('explains how to restore activeTab access when the URL is unavailable', async () => {
    getSessionStorage.mockResolvedValue({});

    await expect(startRecordingSession()).rejects.toThrow(
      'Reabra o FlowSnap pelo ícone',
    );
    expect(requestPermission).not.toHaveBeenCalled();
  });
});
