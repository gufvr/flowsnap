import type { StepDescriptionOverride } from '../recordingTypes';

export const MAX_STEP_DESCRIPTION_LENGTH = 200;

export type StepDescriptionValidation =
  | { valid: true; text: string }
  | { valid: false; error: string };

export function normalizeStepDescriptionText(text: string) {
  return text.trim().replace(/\s+/gu, ' ');
}

export function validateStepDescriptionText(
  value: unknown,
): StepDescriptionValidation {
  if (typeof value !== 'string') {
    return { valid: false, error: 'A descrição informada é inválida.' };
  }

  const text = normalizeStepDescriptionText(value);
  if (!text) {
    return { valid: false, error: 'A descrição não pode ficar vazia.' };
  }

  if (text.length > MAX_STEP_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `A descrição deve ter no máximo ${MAX_STEP_DESCRIPTION_LENGTH} caracteres.`,
    };
  }

  return { valid: true, text };
}

export function resolveDescriptionOverride(
  value: unknown,
): StepDescriptionOverride | undefined {
  if (typeof value !== 'object' || value === null) return undefined;

  const override = value as Partial<StepDescriptionOverride>;
  if (override.locale !== 'pt-BR') return undefined;

  const validation = validateStepDescriptionText(override.text);
  return validation.valid
    ? { text: validation.text, locale: 'pt-BR' }
    : undefined;
}
