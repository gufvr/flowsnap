import { beforeEach, describe, expect, it, vi } from 'vitest';
import { closeSidePanel } from './closeSidePanel';

const close = vi.fn();
const sendMessage = vi.fn();
const closeWindow = vi.fn();

describe('closeSidePanel', () => {
  beforeEach(() => {
    close.mockReset();
    sendMessage.mockReset();
    closeWindow.mockReset();
    close.mockResolvedValue(undefined);
    sendMessage.mockResolvedValue({
      success: true,
      activeTabContext: {
        tabId: 21,
        windowId: 4,
        url: 'https://example.com',
      },
    });

    vi.stubGlobal('chrome', {
      sidePanel: { close },
      runtime: { sendMessage },
    });
    vi.spyOn(window, 'close').mockImplementation(closeWindow);
  });

  it('uses the native close API when the browser supports it', async () => {
    await closeSidePanel();

    expect(close).toHaveBeenCalledWith({ tabId: 21 });
    expect(closeWindow).not.toHaveBeenCalled();
  });

  it('falls back to window.close when the API is unavailable', async () => {
    vi.stubGlobal('chrome', {
      sidePanel: {},
      runtime: { sendMessage },
    });

    await closeSidePanel();

    expect(closeWindow).toHaveBeenCalledOnce();
  });

  it('falls back when the native API rejects', async () => {
    close.mockRejectedValue(new Error('Unsupported'));

    await closeSidePanel();

    expect(closeWindow).toHaveBeenCalledOnce();
  });
});
