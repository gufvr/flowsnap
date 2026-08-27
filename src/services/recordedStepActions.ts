import type { ExtensionMessage, ExtensionResponse } from '../shared/messages';

async function sendAction(message: ExtensionMessage, fallbackError: string) {
  const response = (await chrome.runtime.sendMessage(
    message,
  )) as ExtensionResponse;

  if (!response?.success) {
    throw new Error(response?.error ?? fallbackError);
  }
}

export function deleteRecordedStep(stepIndex: number, expectedId?: string) {
  return sendAction(
    {
      type: 'DELETE_RECORDED_STEP',
      payload: {
        stepIndex,
        ...(expectedId ? { expectedId } : {}),
      },
    },
    'Não foi possível excluir o passo.',
  );
}

export function clearRecordedSteps() {
  return sendAction(
    { type: 'CLEAR_RECORDED_STEPS' },
    'Não foi possível limpar os passos.',
  );
}

export function updateRecordedStepDescription(
  stepIndex: number,
  expectedReference: string,
  text: string,
  expectedId?: string,
) {
  return sendAction(
    {
      type: 'UPDATE_RECORDED_STEP_DESCRIPTION',
      payload: {
        stepIndex,
        expectedReference,
        text,
        ...(expectedId ? { expectedId } : {}),
      },
    },
    'Não foi possível atualizar a descrição do passo.',
  );
}
