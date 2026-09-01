import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionMessage } from '../shared/messages';
import {
  addCurrentUrlAssertion,
  clearRecordedSteps,
  deleteRecordedStep,
  moveRecordedStep,
  updateRecordedStepDescription,
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

  it('requests the current URL assertion without accepting a URL payload', async () => {
    await addCurrentUrlAssertion();

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'ADD_CURRENT_URL_ASSERTION',
    } satisfies ExtensionMessage);
  });

  it('requests a description update with its concurrent identity', async () => {
    await updateRecordedStepDescription(
      1,
      '{"id":"step-id"}',
      'Descrição editada',
      'step-id',
    );

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'UPDATE_RECORDED_STEP_DESCRIPTION',
      payload: {
        stepIndex: 1,
        expectedReference: '{"id":"step-id"}',
        expectedId: 'step-id',
        text: 'Descrição editada',
      },
    } satisfies ExtensionMessage);
  });

  it('requests an adjacent move with both concurrent identities', async () => {
    await moveRecordedStep(
      2,
      1,
      '{"id":"moving"}',
      '{"id":"target"}',
      'moving',
      'target',
    );

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'MOVE_RECORDED_STEP',
      payload: {
        fromIndex: 2,
        toIndex: 1,
        expectedStepReference: '{"id":"moving"}',
        expectedTargetReference: '{"id":"target"}',
        expectedId: 'moving',
        expectedTargetId: 'target',
      },
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
