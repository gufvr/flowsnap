import { describe, expect, it } from 'vitest';
import { formatRecordedStepSelectors } from './formatRecordedStepSelectors';

describe('formatRecordedStepSelectors', () => {
  it('formats mixed schemas with their original positions and descriptions', () => {
    const result = formatRecordedStepSelectors([
      {
        schemaVersion: 4,
        description: {
          action: 'click',
          target: { type: 'button', name: 'Entrar' },
          source: 'accessibleName',
          text: 'Clicou no botão "Entrar"',
          locale: 'pt-BR',
        },
        descriptionOverride: {
          text: 'Entrou na conta',
          locale: 'pt-BR',
        },
        selectors: {
          recommended: {
            strategy: 'testId',
            value: 'login-submit',
            attribute: 'data-testid',
          },
        },
      },
      {
        schemaVersion: 10,
        type: 'navigation',
        description: {
          action: 'navigation',
          text: 'Navegou para "/account"',
          locale: 'pt-BR',
        },
      },
      {
        type: 'click',
        selector: { css: 'main > button' },
        element: { tagName: 'button', text: 'Legado' },
      },
    ]);

    expect(result).toEqual({
      selectorCount: 2,
      text: [
        'FlowSnap — seletores gravados',
        '',
        '1. Entrou na conta',
        '   Seletor: data-testid=login-submit',
        '',
        '3. Clicou em um elemento',
        '   Seletor: css=main > button',
      ].join('\n'),
    });
  });

  it('preserves repeated selectors because they belong to different steps', () => {
    const step = {
      schemaVersion: 2,
      element: { tagName: 'button' },
      selectors: {
        recommended: { strategy: 'id', value: 'submit' },
      },
    };

    const result = formatRecordedStepSelectors([step, step]);

    expect(result.selectorCount).toBe(2);
    expect(result.text.match(/Seletor: id=submit/g)).toHaveLength(2);
  });

  it('returns an empty result when no step has a selector', () => {
    expect(
      formatRecordedStepSelectors([
        { schemaVersion: 10, type: 'navigation' },
        { corrupted: true },
      ]),
    ).toEqual({ text: '', selectorCount: 0 });
  });
});
