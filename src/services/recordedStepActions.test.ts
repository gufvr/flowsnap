import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionMessage } from '../shared/messages';
import {
  clearRecordedSteps,
  deleteRecordedStep,
} from './recordedStepActions';

const sendMessage = vi.fn();

describe('recordedStepActions', () => {
  beforeEach(() => {
    sendMessage.mockReset();
    sendMessage.mockResolvedValue({ success: true });
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
  });

  it('requests deletion with an index and stable id when available', async () => {
    await deleteRecordedStep(2, 'step-id');

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'DELETE_RECORDED_STEP',
      payload: { stepIndex: 2, expectedId: 'step-id' },
    } satisfies ExtensionMessage);
  });

  it('supports legacy steps without an id', async () => {
    await deleteRecordedStep(0);

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'DELETE_RECORDED_STEP',
      payload: { stepIndex: 0 },
    } satisfies ExtensionMessage);
  });

  it('requests a complete clear', async () => {
    await clearRecordedSteps();

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'CLEAR_RECORDED_STEPS',
    } satisfies ExtensionMessage);
  });

  it('exposes the background error to the interface', async () => {
    sendMessage.mockResolvedValue({
      success: false,
      error: 'A lista de passos foi atualizada. Tente novamente.',
    });

    await expect(deleteRecordedStep(1, 'stale')).rejects.toThrow(
      'A lista de passos foi atualizada',
    );
  });

  it('uses a fallback error when the background omits a message', async () => {
    sendMessage.mockResolvedValue({ success: false });

    await expect(clearRecordedSteps()).rejects.toThrow(
      'Não foi possível limpar os passos.',
    );
  });

  it('uses a fallback error when the background does not respond', async () => {
    sendMessage.mockResolvedValue(undefined);

    await expect(deleteRecordedStep(0)).rejects.toThrow(
      'Não foi possível excluir o passo.',
    );
  });
});
