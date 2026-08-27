import { describe, expect, it } from 'vitest';
import {
  MAX_STEP_DESCRIPTION_LENGTH,
  normalizeStepDescriptionText,
  resolveDescriptionOverride,
  validateStepDescriptionText,
} from './descriptionOverride';

describe('descriptionOverride', () => {
  it('trims and consolidates whitespace', () => {
    expect(normalizeStepDescriptionText('  Efetuou\n  o login  ')).toBe(
      'Efetuou o login',
    );
    expect(validateStepDescriptionText('  Efetuou\n  o login  ')).toEqual({
      valid: true,
      text: 'Efetuou o login',
    });
  });

  it('rejects empty, invalid and oversized descriptions', () => {
    expect(validateStepDescriptionText('   ')).toMatchObject({ valid: false });
    expect(validateStepDescriptionText(undefined)).toMatchObject({ valid: false });
    expect(
      validateStepDescriptionText('a'.repeat(MAX_STEP_DESCRIPTION_LENGTH + 1)),
    ).toEqual({
      valid: false,
      error: 'A descrição deve ter no máximo 200 caracteres.',
    });
  });

  it('accepts only complete pt-BR overrides', () => {
    expect(
      resolveDescriptionOverride({
        text: '  Descrição personalizada  ',
        locale: 'pt-BR',
      }),
    ).toEqual({ text: 'Descrição personalizada', locale: 'pt-BR' });
    expect(
      resolveDescriptionOverride({ text: 'Description', locale: 'en-US' }),
    ).toBeUndefined();
    expect(resolveDescriptionOverride({ text: '' })).toBeUndefined();
  });
});
