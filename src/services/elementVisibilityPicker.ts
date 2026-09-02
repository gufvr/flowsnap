import type { ExtensionResponse } from '../shared/messages';

async function sendPickerAction(
  type: 'START_ELEMENT_VISIBILITY_PICKER' | 'CANCEL_ELEMENT_VISIBILITY_PICKER',
) {
  const response = (await chrome.runtime.sendMessage({ type })) as ExtensionResponse;
  if (!response?.success) {
    throw new Error(response?.error ?? 'Não foi possível atualizar a seleção de elemento.');
  }
}

export function startElementVisibilityPicker() {
  return sendPickerAction('START_ELEMENT_VISIBILITY_PICKER');
}

export function cancelElementVisibilityPicker() {
  return sendPickerAction('CANCEL_ELEMENT_VISIBILITY_PICKER');
}
